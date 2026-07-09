import { createClient } from "@/lib/supabase/server"
import { SlotManager } from "@/components/admin/SlotManager"
import type { DeliverySlot } from "@/lib/types"

export const dynamic = "force-dynamic"
export const metadata = { title: "Créneaux — Admin Nathy Food" }

export default async function AdminCreneauxPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split("T")[0]
  const { data } = await supabase
    .from("delivery_slots")
    .select("*")
    .gte("slot_date", today)
    .order("slot_date")
    .order("start_time")

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-bold text-encre mb-6">Créneaux de livraison</h1>
      <SlotManager initialSlots={(data ?? []) as DeliverySlot[]} />
    </div>
  )
}
