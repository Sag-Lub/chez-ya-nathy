import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"

// Désactive le body-parser de Next.js — indispensable pour la vérification Stripe
export const dynamic = "force-dynamic"

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

  if (event.type !== "checkout.session.completed") {
    return new NextResponse("Unhandled event type", { status: 200 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta    = session.metadata ?? {}
  const admin   = createAdminClient()

  // ── Idempotence : évite les doublons sur retry Stripe ────────
  const { data: existing } = await admin
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle()

  if (existing) {
    return new NextResponse("Already processed", { status: 200 })
  }

  // ── Reconstruction du panier depuis les métadonnées ──────────
  const count = Number(meta.cn ?? "0")
  const cartItems = Array.from({ length: count }, (_, i) => {
    const parts = (meta[`c${i}`] ?? "").split("|")
    return {
      dishId:         parts[0] ?? "",
      quantity:       Number(parts[1] ?? 1),
      unitPriceCents: Number(parts[2] ?? 0),
      spice:          parts[3] || null,
      name:           parts[4] ?? "",
    }
  })

  // ── Insertion de la commande (service role, contourne RLS) ────
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      public_token:         meta.public_token,
      customer_name:        meta.customer_name,
      phone:                meta.customer_phone,
      email:                meta.customer_email || null,
      type:                 meta.order_type as "livraison" | "emporter",
      status:               "recue",
      address:              meta.address || null,
      postal_code:          meta.postal_code || null,
      slot_id:              meta.slot_id || null,
      subtotal_cents:       Number(meta.subtotal_cents),
      delivery_fee_cents:   Number(meta.delivery_fee_cents),
      total_cents:          session.amount_total ?? 0,
      notes:                null,
      stripe_session_id:    session.id,
      stripe_payment_intent: session.payment_intent as string | null,
    })
    .select("id")
    .single()

  if (orderErr || !order) {
    console.error("[webhook] order insert error:", orderErr)
    // Retourner 500 → Stripe retentera
    return new NextResponse("Order insert failed", { status: 500 })
  }

  // ── Insertion des lignes de commande ──────────────────────────
  if (cartItems.length > 0) {
    const { error: itemsErr } = await admin.from("order_items").insert(
      cartItems.map((item) => ({
        order_id:         order.id,
        dish_id:          item.dishId || null,
        dish_name:        item.name,
        unit_price_cents: item.unitPriceCents,
        quantity:         item.quantity,
        spice:            item.spice as "doux" | "moyen" | "fort" | "pili_pili_a_part" | null,
        options:          [],
      }))
    )
    if (itemsErr) {
      console.error("[webhook] order_items insert error:", itemsErr)
    }
  }

  console.log(`[webhook] ✅ Commande créée : ${order.id} (token: ${meta.public_token})`)
  return new NextResponse("OK", { status: 200 })
}
