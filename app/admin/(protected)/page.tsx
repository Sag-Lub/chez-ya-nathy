import { createClient } from "@/lib/supabase/server"
import { OrdersBoard } from "@/components/admin/OrdersBoard"
import type { Order } from "@/lib/types"

export const dynamic = "force-dynamic"
export const metadata = { title: "Commandes — Admin Nathy Food" }

export default async function AdminPage() {
  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - 2)

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-encre">Commandes</h1>
        <span className="text-xs text-encre/40 bg-encre/5 px-3 py-1.5 rounded-full">
          Temps réel ●
        </span>
      </div>
      <OrdersBoard initialOrders={(data ?? []) as Order[]} />
    </div>
  )
}
