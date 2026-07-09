import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { TrackingClient } from "./TrackingClient"
import type { Order } from "@/lib/types"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function SuiviPage({ params }: PageProps) {
  const { token } = await params
  const admin = createAdminClient()

  const { data } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("public_token", token)
    .maybeSingle()

  if (!data) notFound()

  return <TrackingClient initialOrder={data as Order} token={token} />
}
