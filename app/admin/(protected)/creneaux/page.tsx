import { createClient } from "@/lib/supabase/server"
import { nowInParis } from "@/lib/preorder"
import { SlotManager } from "@/components/admin/SlotManager"
import type { DeliverySlot } from "@/lib/types"

export const dynamic = "force-dynamic"
export const metadata = { title: "Créneaux — cuisine" }

export default async function AdminCreneauxPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("delivery_slots")
    .select("*")
    .gte("slot_date", nowInParis().date)
    .order("slot_date")
    .order("start_time")

  return <SlotManager initialSlots={(data ?? []) as DeliverySlot[]} />
}
