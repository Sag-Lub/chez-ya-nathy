"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { CategoryTabs } from "./CategoryTabs"
import { DishCard } from "./DishCard"
import { SiteHeader } from "@/components/nav/SiteHeader"
import {
  HomeHero,
  FeaturedDishes,
  StorySection,
  PreorderSection,
  SiteFooter,
  SectionLabel,
} from "@/components/home/HomeSections"
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

  // Ne pas proposer de filtre pour une catégorie vide
  const nonEmptyCategories = categories.filter(c =>
    dishes.some(d => d.category_id === c.id)
  )

  const byCategory = activeCategory
    ? dishes.filter(d => d.category_id === activeCategory)
    : dishes.filter(d => !hiddenFromAll.has(d.category_id))

  // La recherche couvre tout le menu : nom, sous-titre et description
  const q = query.trim().toLowerCase()
  const visibleDishes = q
    ? (activeCategory ? byCategory : dishes).filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.subtitle ?? "").toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      )
    : byCategory

  // Plats à l'honneur : les premiers plats disponibles avec photo
  const featured = dishes.filter(
    d => d.is_available && d.image_url && !hiddenFromAll.has(d.category_id)
  )

  return (
    <div className="min-h-screen bg-kwanga">
      <SiteHeader />

      <HomeHero />

      <FeaturedDishes dishes={featured} />

      <StorySection />

      {/* ─── Notre carte ─────────────────────────────────────────── */}
      <section
        id="carte"
        aria-labelledby="carte-titre"
        className="max-w-[1440px] mx-auto px-5 lg:px-20 py-[clamp(72px,10vw,140px)] scroll-mt-16"
      >
        <SectionLabel>Notre carte</SectionLabel>
        <h2 id="carte-titre" className="font-serif text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
          Découvrez nos saveurs
        </h2>
        <p className="text-sm lg:text-base text-encre/55 leading-relaxed max-w-xl mb-10">
          Des recettes faites maison, préparées avec générosité et disponibles
          en commande ou en précommande.
        </p>

        {/* Recherche */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-encre/35" aria-hidden />
          <label htmlFor="recherche-plat" className="sr-only">Rechercher un plat</label>
          <input
            id="recherche-plat"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un plat…"
            className="w-full bg-carte rounded-lg border border-encre/10 pl-11 pr-4 h-12 text-sm text-encre placeholder:text-encre/35 focus:outline-none focus:border-liboke/60 focus:ring-1 focus:ring-liboke/30 transition-all"
          />
        </div>

        {/* Filtres */}
        <div className="mb-10">
          <CategoryTabs
            categories={nonEmptyCategories}
            activeId={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

        {/* Grille des plats */}
        {visibleDishes.length === 0 ? (
          <p className="text-center text-encre/40 py-20">
            {query.trim()
              ? `Aucun plat ne correspond à « ${query.trim()} ».`
              : "Aucun plat disponible dans cette catégorie."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
            {visibleDishes.map(dish => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </section>

      <PreorderSection />

      <SiteFooter />
    </div>
  )
}
