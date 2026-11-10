import { createClient } from "@/lib/supabase/server"
import { fetchKitchenOrders } from "@/lib/kitchen"
import { OrdersBoard } from "@/components/admin/OrdersBoard"

export const dynamic = "force-dynamic"
export const metadata = { title: "Commandes — cuisine" }

export default async function AdminPage() {
  const supabase = await createClient()
  const { orders } = await fetchKitchenOrders(supabase)

  return <OrdersBoard initialOrders={orders} />
}
