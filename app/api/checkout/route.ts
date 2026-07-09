import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  // ── Garde : clé Stripe configurée ? ───────────────────────────
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY manquante — remplis .env.local" },
      { status: 503 }
    )
  }

  const body = await req.json()
  const { cartItems, customer, type, postalCode, address, slotId } = body as {
    cartItems: { dishId: string; quantity: number; spice?: string; selectedOptionIds?: string[]; displayName?: string }[]
    customer: { name: string; phone: string; email?: string }
    type: "livraison" | "emporter"
    postalCode?: string
    address?: string
    slotId?: string
  }

  if (!cartItems?.length) {
    return NextResponse.json({ error: "Panier vide" }, { status: 400 })
  }

  const supabase = await createClient()

  // ── 1. Vérification des prix côté serveur (règle #2) ─────────
  const dishIds = [...new Set(cartItems.map((i) => i.dishId))]
  const { data: dishes, error: dishErr } = await supabase
    .from("dishes")
    .select("id, name, price_cents, is_available")
    .in("id", dishIds)

  if (dishErr || !dishes) {
    return NextResponse.json({ error: "Erreur catalogue" }, { status: 500 })
  }

  const allOptionIds = cartItems.flatMap((i) => i.selectedOptionIds ?? [])
  const { data: optRows } = allOptionIds.length
    ? await supabase
        .from("dish_options")
        .select("id, extra_price_cents")
        .in("id", allOptionIds)
    : { data: [] as { id: string; extra_price_cents: number }[] }

  const verifiedItems: {
    dishId: string; name: string; unitPriceCents: number
    quantity: number; spice: string | null; optionNames: string[]
  }[] = []

  for (const item of cartItems) {
    const dish = dishes.find((d) => d.id === item.dishId)
    if (!dish) return NextResponse.json({ error: `Plat introuvable : ${item.dishId}` }, { status: 400 })
    if (!dish.is_available) return NextResponse.json({ error: `Plat épuisé : ${dish.name}` }, { status: 409 })

    const extraCents = (item.selectedOptionIds ?? []).reduce((sum, id) => {
      return sum + ((optRows ?? []).find((o) => o.id === id)?.extra_price_cents ?? 0)
    }, 0)

    verifiedItems.push({
      dishId:        item.dishId,
      name:          dish.name,
      unitPriceCents: dish.price_cents + extraCents,
      quantity:      item.quantity,
      spice:         item.spice ?? null,
      optionNames:   [],
    })
  }

  // ── 2. Vérification du créneau ────────────────────────────────
  if (type === "livraison" && slotId) {
    const { data: slot } = await supabase
      .from("delivery_slots")
      .select("id, is_active, orders_count, max_orders")
      .eq("id", slotId)
      .single()

    if (!slot || !slot.is_active || slot.orders_count >= slot.max_orders) {
      return NextResponse.json({ error: "Créneau non disponible — choisissez-en un autre" }, { status: 409 })
    }
  }

  // ── 3. Frais de livraison ─────────────────────────────────────
  let deliveryFeeCents = 0
  if (type === "livraison" && postalCode) {
    const { data: zone } = await supabase
      .from("delivery_zones")
      .select("fee_cents, min_order_cents")
      .eq("postal_code", postalCode)
      .eq("is_active", true)
      .single()
    if (zone) deliveryFeeCents = zone.fee_cents
  }

  // ── 4. Totaux ─────────────────────────────────────────────────
  const subtotalCents = verifiedItems.reduce(
    (s, i) => s + i.unitPriceCents * i.quantity, 0
  )
  const publicToken = crypto.randomUUID()

  // ── 5. Métadonnées compactes pour le webhook ──────────────────
  // Format par item : dishId|qty|unitPrice|spice|optName1~optName2
  const cartMeta: Record<string, string> = { cn: String(verifiedItems.length) }
  verifiedItems.forEach((item, i) => {
    cartMeta[`c${i}`] = [
      item.dishId,
      item.quantity,
      item.unitPriceCents,
      item.spice ?? "",
      item.name,
    ].join("|")
  })

  // ── 6. Session Stripe Checkout ────────────────────────────────
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      ...verifiedItems.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: { name: item.name },
          unit_amount: item.unitPriceCents,
        },
        quantity: item.quantity,
      })),
      ...(deliveryFeeCents > 0
        ? [{ price_data: { currency: "eur", product_data: { name: "Frais de livraison" }, unit_amount: deliveryFeeCents }, quantity: 1 }]
        : []),
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/commande/confirmation?token=${publicToken}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/commande`,
    metadata: {
      public_token:       publicToken,
      slot_id:            slotId ?? "",
      order_type:         type,
      customer_name:      customer.name,
      customer_phone:     customer.phone,
      customer_email:     customer.email ?? "",
      address:            address ?? "",
      postal_code:        postalCode ?? "",
      delivery_fee_cents: String(deliveryFeeCents),
      subtotal_cents:     String(subtotalCents),
      ...cartMeta,
    },
  })

  return NextResponse.json({ url: session.url })
}
