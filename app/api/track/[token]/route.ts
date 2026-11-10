import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { TrackedOrder } from "@/lib/types"

export const dynamic = "force-dynamic"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Suivi sans compte : lecture d'une commande par son public_token (règle #5).
 * On ne renvoie que ce que la page de suivi affiche — ni téléphone, ni email,
 * ni identifiants Stripe, ni identifiant interne de commande.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!UUID.test(token)) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from("orders")
    .select(
      "status, type, customer_name, address, postal_code, subtotal_cents, delivery_fee_cents, total_cents, payment_method, created_at, updated_at, order_items(id, dish_name, unit_price_cents, quantity, spice, options), delivery_slots(slot_date, start_time, end_time)"
    )
    .eq("public_token", token)
    .maybeSingle()

  if (error) {
    console.error("[track] lecture impossible:", error.message)
    return NextResponse.json({ error: "Suivi indisponible pour le moment" }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }

  const row = data as unknown as Omit<TrackedOrder, "first_name" | "slot"> & {
    customer_name: string
    delivery_slots: TrackedOrder["slot"] | TrackedOrder["slot"][]
  }
  const { customer_name, delivery_slots, ...rest } = row

  const order: TrackedOrder = {
    ...rest,
    first_name: customer_name.trim().split(/\s+/)[0] ?? "",
    slot: Array.isArray(delivery_slots) ? delivery_slots[0] ?? null : delivery_slots ?? null,
  }

  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } })
}
