import { createClient } from "@/lib/supabase/server"
import { MenuPage } from "@/components/menu/MenuPage"
import type { Category, Dish } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = await createClient()

  const [{ data: categories }, { data: dishes }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .order("sort_order"),
    supabase
      .from("dishes")
      .select("*, dish_options(*)")
      .eq("is_available", true)
      .order("sort_order"),
  ])

  return (
    <MenuPage
      categories={(categories ?? []) as Category[]}
      dishes={(dishes ?? []) as Dish[]}
    />
  )
}
