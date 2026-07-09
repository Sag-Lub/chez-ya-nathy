"use client"

import { useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { CategoryTabs } from "./CategoryTabs"
import { DishCard } from "./DishCard"
import { formatPrice, dishImageClass } from "@/lib/utils"
import type { Category, Dish } from "@/lib/types"

interface MenuPageProps {
  categories: Category[]
  dishes: Dish[]
}

export function MenuPage({ categories, dishes }: MenuPageProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  // Boissons et accompagnements ne s'affichent que dans leur catégorie, jamais dans "Tout"
  const hiddenFromAll = new Set(
    categories
      .filter(c => c.slug === "boissons" || c.slug === "accompagnements")
      .map(c => c.id)
  )

  const byCategory = activeCategory
    ? dishes.filter(d => d.category_id === activeCategory)
    : dishes.filter(d => !hiddenFromAll.has(d.category_id))

  // La recherche, elle, couvre tout le menu
  const visibleDishes = query.trim()
    ? (activeCategory ? byCategory : dishes).filter(d =>
        d.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : byCategory

  // "Populaires" : les premiers plats disponibles — masqué pendant une recherche
  const popular = dishes
    .filter(d => d.is_available && !hiddenFromAll.has(d.category_id))
    .slice(0, 5)
  const showPopular = !query.trim() && !activeCategory && popular.length > 0

  return (
    <div className="min-h-screen bg-kwanga">
      {/* ─── Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-kwanga/95 backdrop-blur-sm border-b border-encre/8 h-20">
        <div className="max-w-2xl mx-auto h-full flex items-center justify-center px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Logo_ChezYaNathy.png"
            alt="Chez ya Nathy"
            className="h-16 w-auto"
          />
        </div>
      </header>

      {/* ─── Accroche + recherche ───────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-1">
        <p className="text-xs font-bold text-liboke uppercase tracking-[0.18em] mb-2">
          Mbote&nbsp;! 👋🏾
        </p>
        <h1 className="font-serif text-[30px] font-bold text-encre leading-[1.15] mb-5 text-balance">
          Une faim de{" "}
          <span className="relative inline-block italic text-liboke">
            chez&nbsp;nous
            <svg
              viewBox="0 0 120 12"
              aria-hidden
              className="absolute left-0 -bottom-1.5 w-full h-2.5 text-safou"
              preserveAspectRatio="none"
            >
              <path
                d="M3 9 Q 30 3 60 7 T 117 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          &nbsp;?
        </h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-encre/35" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un plat…"
            className="w-full bg-white rounded-full border border-encre/10 pl-11 pr-4 py-3 text-sm text-encre placeholder:text-encre/35 focus:outline-none focus:border-liboke/50 focus:ring-2 focus:ring-liboke/15 transition-all"
          />
        </div>
      </div>

      {/* ─── Catégories — pastilles rondes ──────────────────────── */}
      <CategoryTabs
        categories={categories}
        activeId={activeCategory}
        onChange={setActiveCategory}
      />

      {/* ─── Populaires — scroll horizontal ─────────────────────── */}
      {showPopular && (
        <section className="max-w-2xl mx-auto pt-2">
          <h2 className="px-4 font-serif text-lg font-bold text-encre mb-1">
            Populaires
          </h2>
          <div className="flex overflow-x-auto scrollbar-none gap-4 px-4 pt-12 pb-4">
            {popular.map(dish => (
              <PopularCard key={dish.id} dish={dish} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Grille des plats ───────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 pb-6">
        {showPopular && (
          <h2 className="font-serif text-lg font-bold text-encre mb-1 pt-2">
            Tous les plats
          </h2>
        )}
        {visibleDishes.length === 0 ? (
          <p className="text-center text-encre/40 py-16">
            {query.trim()
              ? `Aucun plat ne correspond à « ${query.trim()} ».`
              : "Aucun plat disponible dans cette catégorie."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
            {visibleDishes.map(dish => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

/** Carte compacte du carrousel "Populaires" — photo ronde débordante */
function PopularCard({ dish }: { dish: Dish }) {
  return (
    <Link
      href={`/plat/${dish.slug}`}
      className="relative shrink-0 w-40 bg-white rounded-[24px] pt-16 px-3 pb-4 text-center shadow-[0_10px_30px_rgba(43,27,18,0.08)]"
    >
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 block h-24 w-24 rounded-full overflow-hidden shadow-[0_10px_22px_rgba(43,27,18,0.2)]">
        {dish.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={dish.image_url}
            alt={dish.name}
            className={dishImageClass(dish.image_url)}
          />
        ) : (
          <span className="flex h-full w-full bg-gradient-to-br from-safou/40 to-liboke/30 items-center justify-center text-2xl opacity-30">
            🍽
          </span>
        )}
      </span>
      <p className="font-serif font-semibold text-encre text-sm leading-snug line-clamp-1">
        {dish.name}
      </p>
      <p className="font-bold text-liboke text-sm mt-1">
        {formatPrice(dish.price_cents)}
      </p>
    </Link>
  )
}
