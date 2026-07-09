"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Dish, Category } from "@/lib/types"

interface Props {
  initialDishes:     Dish[]
  initialCategories: Category[]
}

export function DishManager({ initialDishes, initialCategories }: Props) {
  const [dishes,   setDishes]   = useState<Dish[]>(initialDishes)
  const [toggling, setToggling] = useState<string | null>(null)
  const supabase = createClient()

  const toggleAvailability = useCallback(async (dish: Dish) => {
    setToggling(dish.id)
    const next = !dish.is_available
    const { error } = await supabase
      .from("dishes")
      .update({ is_available: next })
      .eq("id", dish.id)

    if (!error) {
      setDishes((prev) =>
        prev.map((d) => d.id === dish.id ? { ...d, is_available: next } : d)
      )
    } else {
      console.error("[admin] dish toggle error:", error)
    }
    setToggling(null)
  }, [supabase])

  const categories = initialCategories.sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const catDishes = dishes
          .filter((d) => d.category_id === cat.id)
          .sort((a, b) => a.sort_order - b.sort_order)

        if (catDishes.length === 0) return null

        return (
          <section key={cat.id}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-encre/40 mb-3 px-1">
              {cat.name}
            </h2>
            <div className="space-y-2">
              {catDishes.map((dish) => (
                <div
                  key={dish.id}
                  className={cn(
                    "bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm border border-encre/8 transition-opacity",
                    !dish.is_available && "opacity-60"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-semibold text-sm",
                      dish.is_available ? "text-encre" : "text-encre/50 line-through"
                    )}>
                      {dish.name}
                    </p>
                    <p className="text-xs text-encre/40">{formatPrice(dish.price_cents)}</p>
                  </div>

                  {/* Toggle épuisé */}
                  <button
                    onClick={() => toggleAvailability(dish)}
                    disabled={toggling === dish.id}
                    className={cn(
                      "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
                      dish.is_available
                        ? "border-feuille/30 bg-feuille/10 text-feuille hover:bg-pili/10 hover:text-pili hover:border-pili/30"
                        : "border-safou/30 bg-safou/10 text-safou hover:bg-feuille/10 hover:text-feuille hover:border-feuille/30"
                    )}
                  >
                    {toggling === dish.id
                      ? "…"
                      : dish.is_available ? "Disponible" : "Épuisé"
                    }
                  </button>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
