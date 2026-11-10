import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, KitchenOrder, OrderStatus } from "@/lib/types"

export const ACTIVE_STATUSES: OrderStatus[] = ["recue", "confirmee", "en_cuisine", "en_livraison"]

/** Les commandes terminées restent visibles deux jours. */
const FINISHED_VISIBLE_DAYS = 2

const ORDER_SELECT = "*, order_items(*), delivery_slots(slot_date, start_time, end_time)"

/**
 * Commandes du tableau de bord cuisine :
 * - toutes les commandes en cours, quelle que soit leur date (une précommande
 *   passée le lundi pour le samedi doit rester visible toute la semaine) ;
 * - les commandes terminées ou annulées des deux derniers jours.
 * Lecture avec la session de l'admin : c'est la RLS (is_admin()) qui autorise.
 */
export async function fetchKitchenOrders(
  supabase: SupabaseClient<Database>
): Promise<{ orders: KitchenOrder[]; error: string | null }> {
  const since = new Date(Date.now() - FINISHED_VISIBLE_DAYS * 86_400_000).toISOString()

  const [active, finished] = await Promise.all([
    supabase.from("orders").select(ORDER_SELECT).in("status", ACTIVE_STATUSES).order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(ORDER_SELECT)
      .in("status", ["livree", "annulee"])
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
  ])

  const error = active.error?.message ?? finished.error?.message ?? null
  const orders = [...(active.data ?? []), ...(finished.data ?? [])] as unknown as KitchenOrder[]
  return { orders, error }
}

/** Paiement en espèces à encaisser ? (tolère l'ancienne valeur « cash ») */
export function isCashPayment(method: string | null | undefined): boolean {
  return method === "especes" || method === "cash"
}
