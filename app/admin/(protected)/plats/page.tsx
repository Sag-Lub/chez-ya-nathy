import { createClient } from "@/lib/supabase/server"
import { DishManager } from "@/components/admin/DishManager"
import type { Dish, Category } from "@/lib/types"

export const dynamic = "force-dynamic"
export const metadata = { title: "Plats — cuisine" }

export default async function AdminPlatsPage() {
  const supabase = await createClient()

  const [{ data: dishes }, { data: categories }] = await Promise.all([
    supabase.from("dishes").select("*").order("sort_order"),
    supabase.from("categories").select("*").order("sort_order"),
  ])

  return (
    <DishManager
      initialDishes={(dishes ?? []) as Dish[]}
      initialCategories={(categories ?? []) as Category[]}
    />
  )
}
