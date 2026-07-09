import { createClient } from "@/lib/supabase/server"
import { DishManager } from "@/components/admin/DishManager"
import type { Dish, Category } from "@/lib/types"

export const dynamic = "force-dynamic"
export const metadata = { title: "Plats — Admin Nathy Food" }

export default async function AdminPlatsPage() {
  const supabase = await createClient()

  const [{ data: dishes }, { data: categories }] = await Promise.all([
    supabase.from("dishes").select("*").order("sort_order"),
    supabase.from("categories").select("*").order("sort_order"),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-bold text-encre mb-6">Gestion des plats</h1>
      <DishManager
        initialDishes={     (dishes     ?? []) as Dish[]     }
        initialCategories={ (categories ?? []) as Category[] }
      />
    </div>
  )
}
