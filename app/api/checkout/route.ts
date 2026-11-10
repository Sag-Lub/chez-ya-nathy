import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { canOrderDishForDate, hoursUntilSlot, isPreorderCutoffReached } from "@/lib/preorder"
import { formatPrice } from "@/lib/utils"
import type { SpiceLevel } from "@/lib/types"

// ─── Limites ──────────────────────────────────────────────────────
// Stripe accepte 50 clés de métadonnées de 500 caractères : on reste en dessous.
const MAX_LINES = 30
const MAX_QUANTITY = 20
const MAX_OPTIONS_PER_LINE = 8

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SPICES: SpiceLevel[] = ["doux", "moyen", "fort", "pili_pili_a_part"]

type Payload = {
  cartItems?: { dishId?: unknown; quantity?: unknown; spice?: unknown; selectedOptionIds?: unknown }[]
  customer?: { name?: unknown; phone?: unknown; email?: unknown }
  type?: unknown
  postalCode?: unknown
  address?: unknown
  slotId?: unknown
  paymentMethod?: unknown
  notes?: unknown
}

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "")

export async function POST(req: NextRequest) {
  let body: Payload
  try {
    body = (await req.json()) as Payload
  } catch {
    return fail("Requête illisible")
  }

  // ── 0. Contrôle de la forme de la demande ─────────────────────
  // Rien de ce que le navigateur envoie n'est cru : ni les prix, ni le total,
  // ni les quantités (une quantité négative ferait baisser le total).
  const paymentMethod = body.paymentMethod
  const type = body.type
  if (paymentMethod !== "carte" && paymentMethod !== "especes") return fail("Mode de paiement inconnu")
  if (type !== "livraison" && type !== "emporter") return fail("Mode de retrait inconnu")

  if (!Array.isArray(body.cartItems) || body.cartItems.length === 0) return fail("Ton panier est vide")
  if (body.cartItems.length > MAX_LINES) return fail("Ton panier contient trop de lignes différentes")

  const cartItems: { dishId: string; quantity: number; spice: SpiceLevel | null; optionIds: string[] }[] = []
  for (const raw of body.cartItems) {
    const dishId = raw?.dishId
    const quantity = raw?.quantity
    if (typeof dishId !== "string" || !UUID.test(dishId)) return fail("Panier invalide")
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return fail(`Quantité invalide (de 1 à ${MAX_QUANTITY} par plat)`)
    }
    const spice = raw?.spice == null || raw.spice === "" ? null : raw.spice
    if (spice !== null && !SPICES.includes(spice as SpiceLevel)) return fail("Niveau de piquant inconnu")

    const rawOptions = raw?.selectedOptionIds ?? []
    if (!Array.isArray(rawOptions) || rawOptions.some((id) => typeof id !== "string" || !UUID.test(id))) {
      return fail("Options invalides")
    }
    const optionIds = [...new Set(rawOptions as string[])]
    if (optionIds.length > MAX_OPTIONS_PER_LINE) return fail("Trop d'options sur un plat")

    cartItems.push({ dishId, quantity, spice: spice as SpiceLevel | null, optionIds })
  }

  const customerName = text(body.customer?.name, 120)
  const customerPhone = text(body.customer?.phone, 30)
  const customerEmail = text(body.customer?.email, 200)
  if (customerName.length < 2) return fail("Ton nom est requis")
  if (customerPhone.replace(/\D/g, "").length < 10) return fail("Numéro de téléphone invalide")
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return fail("Adresse email invalide")

  const safeNotes = text(body.notes, 500) || null

  // ── Garde : clé Stripe configurée ? (uniquement pour le paiement carte) ─
  if (paymentMethod === "carte" && !process.env.STRIPE_SECRET_KEY) {
    return fail("Le paiement par carte n'est pas disponible pour le moment", 503)
  }

  const supabase = await createClient()

  // ── 1. Vérification des prix côté serveur (règle #2) ─────────
  const dishIds = [...new Set(cartItems.map((i) => i.dishId))]
  const { data: dishes, error: dishErr } = await supabase
    .from("dishes")
    .select("id, name, price_cents, is_available, available_days, lead_time_hours, spice_customizable")
    .in("id", dishIds)

  if (dishErr || !dishes) return fail("Erreur catalogue", 500)

  const allOptionIds = [...new Set(cartItems.flatMap((i) => i.optionIds))]
  const { data: optRows, error: optErr } = allOptionIds.length
    ? await supabase.from("dish_options").select("id, dish_id, name, extra_price_cents").in("id", allOptionIds)
    : { data: [] as { id: string; dish_id: string; name: string; extra_price_cents: number }[], error: null }

  if (optErr || !optRows) return fail("Erreur catalogue", 500)

  const verifiedItems: {
    dishId: string
    name: string
    unitPriceCents: number
    quantity: number
    spice: SpiceLevel | null
    options: { id: string; name: string; extra_price_cents: number }[]
  }[] = []

  for (const item of cartItems) {
    const dish = dishes.find((d) => d.id === item.dishId)
    if (!dish) return fail("Un plat de ton panier n'existe plus : retire-le et réessaie")
    if (!dish.is_available) return fail(`${dish.name} est épuisé pour aujourd'hui : retire-le de ton panier`, 409)

    // Chaque option doit exister ET appartenir à ce plat
    const options: { id: string; name: string; extra_price_cents: number }[] = []
    for (const id of item.optionIds) {
      const option = optRows.find((o) => o.id === id)
      if (!option || option.dish_id !== item.dishId) {
        return fail(`Une option de ${dish.name} n'existe plus : rouvre la fiche du plat`, 409)
      }
      options.push({ id: option.id, name: option.name, extra_price_cents: option.extra_price_cents })
    }

    verifiedItems.push({
      dishId: item.dishId,
      name: dish.name,
      unitPriceCents: dish.price_cents + options.reduce((sum, o) => sum + o.extra_price_cents, 0),
      quantity: item.quantity,
      spice: dish.spice_customizable ? item.spice : null,
      options,
    })
  }

  const subtotalCents = verifiedItems.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0)

  // ── 2. Livraison : zone, minimum de commande, adresse, créneau ─
  let deliveryFeeCents = 0
  let address: string | null = null
  let postalCode: string | null = null
  let slotId: string | null = null

  if (type === "livraison") {
    postalCode = text(body.postalCode, 10)
    if (!/^\d{5}$/.test(postalCode)) return fail("Code postal invalide")

    address = text(body.address, 300)
    if (address.length < 5) return fail("Ton adresse est requise")

    if (typeof body.slotId !== "string" || !UUID.test(body.slotId)) return fail("Choisis un créneau de livraison")
    slotId = body.slotId

    const { data: zone } = await supabase
      .from("delivery_zones")
      .select("fee_cents, min_order_cents")
      .eq("postal_code", postalCode)
      .eq("is_active", true)
      .maybeSingle()

    if (!zone) return fail("Cette adresse est en dehors de la zone de livraison", 409)
    if (subtotalCents < zone.min_order_cents) {
      return fail(`Le minimum de commande est de ${formatPrice(zone.min_order_cents)} pour cette zone`, 409)
    }
    deliveryFeeCents = zone.fee_cents

    const { data: slot } = await supabase
      .from("delivery_slots")
      .select("id, slot_date, start_time, is_active, orders_count, max_orders")
      .eq("id", slotId)
      .maybeSingle()

    if (!slot || !slot.is_active || slot.orders_count >= slot.max_orders) {
      return fail("Ce créneau n'est plus disponible : choisis-en un autre", 409)
    }

    const hours = hoursUntilSlot(slot.slot_date, slot.start_time)
    if (hours <= 0) return fail("Ce créneau est déjà passé : choisis-en un autre", 409)

    for (const item of verifiedItems) {
      const dish = dishes.find((d) => d.id === item.dishId)!
      // Délai de préparation du plat (lead_time_hours)
      if (hours < (dish.lead_time_hours ?? 0)) {
        return fail(`${dish.name} demande ${dish.lead_time_hours} h de préparation : choisis un créneau plus tard`, 409)
      }
      // Un plat réservé au week-end ne peut pas être livré un jour de semaine,
      // et la précommande doit respecter l'heure limite (vendredi/samedi 18h).
      if (!canOrderDishForDate(dish.available_days, slot.slot_date)) {
        const cutoffPassed = dish.available_days && isPreorderCutoffReached(slot.slot_date)
        return fail(
          cutoffPassed
            ? `Les précommandes sont terminées pour cette date (${dish.name}) : choisis le week-end suivant`
            : `${dish.name} n'est préparé que le week-end : choisis un créneau samedi ou dimanche`,
          409
        )
      }
    }
  }

  // ── 3. Totaux ─────────────────────────────────────────────────
  const totalCents = subtotalCents + deliveryFeeCents
  const publicToken = crypto.randomUUID()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  // ── 4. Paiement en espèces : commande créée directement ───────
  // Pas de Stripe impliqué, donc pas de webhook — le service role
  // insère la commande ici, avec les mêmes montants vérifiés côté serveur.
  if (paymentMethod === "especes") {
    const admin = createAdminClient()

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        public_token:          publicToken,
        customer_name:         customerName,
        phone:                 customerPhone,
        email:                 customerEmail || null,
        type,
        status:                "recue",
        payment_method:        "especes",
        address,
        postal_code:           postalCode,
        slot_id:               slotId,
        subtotal_cents:        subtotalCents,
        delivery_fee_cents:    deliveryFeeCents,
        total_cents:           totalCents,
        notes:                 safeNotes,
        stripe_session_id:     null,
        stripe_payment_intent: null,
      })
      .select("id")
      .single()

    if (orderErr || !order) {
      console.error("[checkout] order insert error (espèces):", orderErr?.message)
      // Le trigger reserve_slot refuse un créneau qui vient de se remplir
      const slotFull = /créneau/i.test(orderErr?.message ?? "")
      return fail(
        slotFull ? "Ce créneau vient de se remplir : choisis-en un autre" : "Impossible d'enregistrer la commande. Réessaie.",
        slotFull ? 409 : 500
      )
    }

    const orderItems = verifiedItems.map((item) => ({
      order_id:         order.id,
      dish_id:          item.dishId,
      dish_name:        item.name,
      unit_price_cents: item.unitPriceCents,
      quantity:         item.quantity,
      spice:            item.spice,
      options:          item.options.map((o) => ({ name: o.name, extra_price_cents: o.extra_price_cents })),
    }))

    const { error: itemsErr } = await admin.from("order_items").insert(orderItems)
    if (itemsErr) {
      // Jamais de commande sans ses lignes : on annule tout et on le dit au client
      console.error("[checkout] order_items insert error (espèces):", itemsErr.message)
      await admin.from("orders").delete().eq("id", order.id)
      return fail("Impossible d'enregistrer la commande. Réessaie.", 500)
    }

    if (customerEmail) {
      try {
        await sendOrderConfirmationEmail({
          email:            customerEmail,
          customerName,
          publicToken,
          type,
          paymentMethod:    "especes",
          address,
          postalCode,
          items:            orderItems.map((i) => ({ ...i, id: "", order_id: order.id })),
          subtotalCents,
          deliveryFeeCents,
          totalCents,
        })
      } catch (err) {
        console.error("[checkout] email confirmation error (espèces):", err)
      }
    }

    return NextResponse.json({ url: `${siteUrl}/commande/confirmation?token=${publicToken}` })
  }

  // ── 5. Métadonnées compactes pour le webhook (format v2) ──────
  // Par ligne : dishId|quantité|prixUnitaire|piquant|idOption1,idOption2|nom
  // Le nom est en dernier : il peut contenir n'importe quel caractère.
  const cartMeta: Record<string, string> = { cv: "2", cn: String(verifiedItems.length) }
  verifiedItems.forEach((item, i) => {
    cartMeta[`c${i}`] = [
      item.dishId,
      item.quantity,
      item.unitPriceCents,
      item.spice ?? "",
      item.options.map((o) => o.id).join(","),
      item.name.slice(0, 80),
    ].join("|")
  })

  // ── 6. Session Stripe Checkout ────────────────────────────────
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      // Carte uniquement (Apple Pay et Google Pay compris) : le paiement est
      // encaissé tout de suite, la commande peut donc naître dès le webhook.
      payment_method_types: ["card"],
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      line_items: [
        ...verifiedItems.map((item) => ({
          price_data: {
            currency: "eur",
            product_data: {
              name: item.name,
              ...(item.options.length > 0 ? { description: item.options.map((o) => o.name).join(", ").slice(0, 300) } : {}),
            },
            unit_amount: item.unitPriceCents,
          },
          quantity: item.quantity,
        })),
        ...(deliveryFeeCents > 0
          ? [{ price_data: { currency: "eur", product_data: { name: "Frais de livraison" }, unit_amount: deliveryFeeCents }, quantity: 1 }]
          : []),
      ],
      success_url: `${siteUrl}/commande/confirmation?token=${publicToken}`,
      cancel_url: `${siteUrl}/commande`,
      metadata: {
        public_token:       publicToken,
        slot_id:            slotId ?? "",
        order_type:         type,
        customer_name:      customerName,
        customer_phone:     customerPhone,
        customer_email:     customerEmail,
        address:            address ?? "",
        postal_code:        postalCode ?? "",
        delivery_fee_cents: String(deliveryFeeCents),
        subtotal_cents:     String(subtotalCents),
        notes:              safeNotes ?? "",
        ...cartMeta,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[checkout] stripe session error:", err instanceof Error ? err.message : err)
    return fail("Le paiement par carte est indisponible pour le moment. Réessaie, ou choisis le paiement en espèces.", 502)
  }
}
