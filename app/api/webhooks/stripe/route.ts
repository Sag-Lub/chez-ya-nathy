import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendOrderConfirmationEmail } from "@/lib/email"
import type { SpiceLevel } from "@/lib/types"

// Désactive le body-parser de Next.js — indispensable pour la vérification Stripe
export const dynamic = "force-dynamic"

type MetaItem = {
  dishId: string
  quantity: number
  unitPriceCents: number
  spice: string | null
  optionIds: string[]
  name: string
}

/**
 * Reconstruit le panier depuis les métadonnées de la session.
 * v2 (cv = "2") : dishId|quantité|prix|piquant|idsOptions|nom
 * v1 (sessions créées avant la refonte) : dishId|quantité|prix|piquant|nom
 */
function parseCart(meta: Stripe.Metadata): MetaItem[] {
  const count = Number(meta.cn ?? "0")
  const v2 = meta.cv === "2"
  return Array.from({ length: count }, (_, i) => {
    const parts = (meta[`c${i}`] ?? "").split("|")
    return {
      dishId:         parts[0] ?? "",
      quantity:       Number(parts[1] ?? 1),
      unitPriceCents: Number(parts[2] ?? 0),
      spice:          parts[3] || null,
      optionIds:      v2 ? (parts[4] ?? "").split(",").filter(Boolean) : [],
      name:           parts.slice(v2 ? 5 : 4).join("|"),
    }
  })
}

export async function POST(req: NextRequest) {
  const rawBody  = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Missing signature or secret", { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return new NextResponse("Invalid Stripe signature", { status: 400 })
  }

  // « completed » pour la carte ; « async_payment_succeeded » par sécurité, si un moyen
  // de paiement différé était un jour activé dans Stripe.
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return new NextResponse("Unhandled event type", { status: 200 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta    = session.metadata ?? {}
  const admin   = createAdminClient()

  // Une commande ne naît que d'un paiement réellement encaissé
  if (session.payment_status !== "paid") {
    return new NextResponse("Payment not completed", { status: 200 })
  }
  if (!meta.public_token) {
    return new NextResponse("Not an order session", { status: 200 })
  }

  // ── Idempotence : évite les doublons sur retry Stripe ────────
  const { data: existing } = await admin
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle()

  if (existing) {
    return new NextResponse("Already processed", { status: 200 })
  }

  const cartItems = parseCart(meta)

  // Noms et prix des options choisies (accompagnement, suppléments) : la cuisine en a besoin
  const optionIds = [...new Set(cartItems.flatMap((i) => i.optionIds))]
  const { data: optionRows } = optionIds.length
    ? await admin.from("dish_options").select("id, name, extra_price_cents").in("id", optionIds)
    : { data: [] as { id: string; name: string; extra_price_cents: number }[] }

  // ── Insertion de la commande (service role, contourne RLS) ────
  const baseOrder = {
    public_token:          meta.public_token,
    customer_name:         meta.customer_name,
    phone:                 meta.customer_phone,
    email:                 meta.customer_email || null,
    type:                  meta.order_type as "livraison" | "emporter",
    status:                "recue" as const,
    payment_method:        "carte" as const,
    address:               meta.address || null,
    postal_code:           meta.postal_code || null,
    slot_id:               meta.slot_id || null,
    subtotal_cents:        Number(meta.subtotal_cents),
    delivery_fee_cents:    Number(meta.delivery_fee_cents),
    total_cents:           session.amount_total ?? 0,
    notes:                 meta.notes || null,
    stripe_session_id:     session.id,
    stripe_payment_intent: session.payment_intent as string | null,
  }

  let { data: order, error: orderErr } = await admin.from("orders").insert(baseOrder).select("id").single()

  // Le client a déjà payé : si son créneau s'est rempli pendant le paiement
  // (trigger reserve_slot), on enregistre quand même la commande, sans créneau,
  // avec une note bien visible pour que la cuisine le rappelle.
  if (orderErr && baseOrder.slot_id && /créneau/i.test(orderErr.message)) {
    console.warn("[webhook] créneau complet au moment du paiement, commande enregistrée sans créneau")
    const retry = await admin
      .from("orders")
      .insert({
        ...baseOrder,
        slot_id: null,
        notes: ["CRÉNEAU COMPLET AU MOMENT DU PAIEMENT — rappeler le client pour convenir d'un horaire.", baseOrder.notes]
          .filter(Boolean)
          .join(" "),
      })
      .select("id")
      .single()
    order = retry.data
    orderErr = retry.error
  }

  if (orderErr || !order) {
    console.error("[webhook] order insert error:", orderErr?.message)
    // Retourner 500 → Stripe retentera
    return new NextResponse("Order insert failed", { status: 500 })
  }

  // ── Insertion des lignes de commande ──────────────────────────
  const orderItems = cartItems.map((item) => ({
    order_id:         order.id,
    dish_id:          item.dishId || null,
    dish_name:        item.name,
    unit_price_cents: item.unitPriceCents,
    quantity:         item.quantity,
    spice:            item.spice as SpiceLevel | null,
    options:          item.optionIds
      .map((id) => (optionRows ?? []).find((o) => o.id === id))
      .filter((o): o is { id: string; name: string; extra_price_cents: number } => Boolean(o))
      .map((o) => ({ name: o.name, extra_price_cents: o.extra_price_cents })),
  }))

  if (orderItems.length > 0) {
    const { error: itemsErr } = await admin.from("order_items").insert(orderItems)
    if (itemsErr) {
      // Le client a payé : on garde la commande et on alerte la cuisine,
      // plutôt que de la perdre. Le détail reste lisible dans le paiement Stripe.
      console.error("[webhook] order_items insert error:", itemsErr.message)
      await admin
        .from("orders")
        .update({
          notes: ["DÉTAIL DES PLATS NON ENREGISTRÉ — rappeler le client (le détail est dans le paiement Stripe).", baseOrder.notes]
            .filter(Boolean)
            .join(" "),
        })
        .eq("id", order.id)
    }
  }

  console.log(`[webhook] commande créée : ${order.id}`)

  // ── Email de confirmation (best-effort, ne bloque pas le webhook) ──
  if (meta.customer_email) {
    try {
      await sendOrderConfirmationEmail({
        email:            meta.customer_email,
        customerName:     meta.customer_name,
        publicToken:      meta.public_token,
        type:             meta.order_type as "livraison" | "emporter",
        paymentMethod:    "carte",
        address:          meta.address || null,
        postalCode:       meta.postal_code || null,
        items:            orderItems.map((i) => ({ ...i, id: "", order_id: order.id })),
        subtotalCents:    Number(meta.subtotal_cents),
        deliveryFeeCents: Number(meta.delivery_fee_cents),
        totalCents:       session.amount_total ?? 0,
      })
    } catch (err) {
      console.error("[webhook] email confirmation error:", err)
    }
  }

  return new NextResponse("OK", { status: 200 })
}
