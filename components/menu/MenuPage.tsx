"use client"

import { useEffect, useState } from "react"
import {
  CakeSlice,
  CalendarClock,
  CookingPot,
  CupSoda,
  Search,
  Soup,
  UtensilsCrossed,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { FilterTabs } from "./FilterTabs"
import { DishCard } from "./DishCard"
import { SiteHeader } from "@/components/nav/SiteHeader"
import { CartBar } from "@/components/cart/CartBar"
import {
  HomeHero,
  StorySection,
  PreorderSection,
  SiteFooter,
  SectionLabel,
} from "@/components/home/HomeSections"
import { isWeekendOnly } from "@/lib/utils"
import type { Category, CulinaryOrigin, Dish } from "@/lib/types"

interface MenuPageProps {
  categories: Category[]
  dishes: Dish[]
}

/** Univers affiché — « congolese » est l'onglet ouvert par défaut. */
type UniverseFilter = CulinaryOrigin | "all"

/** Pseudo-type « Précommandes » — regroupe les plats du week-end. */
const PREORDER_TYPE = "__precommandes__"

// ─── Synchronisation avec l'URL (?univers=africain&type=plats) ────────
const UNIVERSE_TO_PARAM: Record<UniverseFilter, string | null> = {
  congolese: null, // défaut → pas de paramètre
  african_selection: "africain",
  all: "tout",
}
const PARAM_TO_UNIVERSE: Record<string, UniverseFilter> = {
  congolais: "congolese",
  africain: "african_selection",
  tout: "all",
}
const CATEGORY_SLUG_TO_PARAM: Record<string, string> = { "plats-cuisines": "plats" }
const PARAM_TO_CATEGORY_SLUG: Record<string, string> = { plats: "plats-cuisines" }

/** Pictogramme d'un type de produit — traits fins, jamais d'emoji. */
function categoryIcon(slug: string): LucideIcon {
  if (slug.includes("accompagnement")) return Soup
  if (slug.includes("boisson")) return CupSoda
  if (slug.includes("dessert")) return CakeSlice
  return CookingPot
}

export function MenuPage({ categories, dishes }: MenuPageProps) {
  const [universe, setUniverse] = useState<UniverseFilter>("congolese")
  const [activeType, setActiveType] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  // Lecture initiale des filtres depuis l'URL (partage de lien, retour navigateur)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const universParam = params.get("univers")
    const typeParam = params.get("type")
    if (universParam && PARAM_TO_UNIVERSE[universParam]) {
      setUniverse(PARAM_TO_UNIVERSE[universParam])
    }
    if (typeParam === "precommandes") {
      setActiveType(PREORDER_TYPE)
    } else if (typeParam) {
      const slug = PARAM_TO_CATEGORY_SLUG[typeParam] ?? typeParam
      const cat = categories.find(c => c.slug === slug)
      if (cat) setActiveType(cat.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function syncUrl(nextUniverse: UniverseFilter, nextType: string | null) {
    const params = new URLSearchParams()
    const universParam = UNIVERSE_TO_PARAM[nextUniverse]
    if (universParam) params.set("univers", universParam)
    if (nextType === PREORDER_TYPE) {
      params.set("type", "precommandes")
    } else if (nextType) {
      const slug = categories.find(c => c.id === nextType)?.slug
      if (slug) params.set("type", CATEGORY_SLUG_TO_PARAM[slug] ?? slug)
    }
    const qs = params.toString()
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
  }

  function handleUniverseChange(id: string | null) {
    const next = (id ?? "all") as UniverseFilter
    setUniverse(next)
    syncUrl(next, activeType)
  }

  function handleTypeChange(id: string | null) {
    setActiveType(id)
    syncUrl(universe, id)
  }

  function resetFilters() {
    setUniverse("congolese")
    setActiveType(null)
    setQuery("")
    syncUrl("congolese", null)
  }

  // Accompagnements et boissons sont neutres : proposés dans tous les univers,
  // mais masqués de la vue « Tous » pour laisser les plats au premier plan.
  const neutralCategoryIds = new Set(
    categories
      .filter(c => c.slug === "boissons" || c.slug === "accompagnements")
      .map(c => c.id)
  )
  const platsCategory = categories.find(c => c.slug === "plats-cuisines") ?? null

  const matchesUniverse = (d: Dish) =>
    universe === "all" || d.culinary_origin === universe || neutralCategoryIds.has(d.category_id)

  const universeDishes = dishes.filter(matchesUniverse)

  // ─── Onglets ────────────────────────────────────────────────────
  // Univers : congolais d'abord (défaut), « Toute la carte » en dernier.
  const universeItems = [
    ...(dishes.some(d => d.culinary_origin === "congolese")
      ? [{ id: "congolese", label: "Spécialités congolaises" }]
      : []),
    ...(dishes.some(d => d.culinary_origin === "african_selection")
      ? [{ id: "african_selection", label: "Autres spécialités africaines" }]
      : []),
    { id: null, label: "Toute la carte" },
  ]

  // Types : masque toute catégorie vide dans l'univers courant.
  const typeItems = [
    { id: null, label: "Tous", icon: UtensilsCrossed },
    ...categories
      .filter(c => universeDishes.some(d => d.category_id === c.id))
      .map(c => ({ id: c.id, label: c.name, icon: categoryIcon(c.slug) })),
    ...(universeDishes.some(d => isWeekendOnly(d.available_days))
      ? [{ id: PREORDER_TYPE, label: "Précommandes", icon: CalendarClock }]
      : []),
  ]

  // ─── Filtrage ───────────────────────────────────────────────────
  const matchesType = (d: Dish) => {
    if (activeType === PREORDER_TYPE) return isWeekendOnly(d.available_days)
    if (activeType) return d.category_id === activeType
    return !neutralCategoryIds.has(d.category_id)
  }

  const q = query.trim().toLowerCase()
  const matchesSearch = (d: Dish) =>
    !q ||
    d.name.toLowerCase().includes(q) ||
    (d.subtitle ?? "").toLowerCase().includes(q) ||
    d.description.toLowerCase().includes(q)

  // Pendant une recherche sans type choisi, on couvre tout l'univers
  // (accompagnements et boissons compris) ; sinon le type s'applique.
  const visibleDishes = universeDishes.filter(d =>
    q && !activeType ? matchesSearch(d) : matchesType(d) && matchesSearch(d)
  )

  // Chapitres éditoriaux : uniquement sur « Toute la carte », hors recherche,
  // pour la vue « Tous » ou « Plats cuisinés ».
  const showEditorialSplit =
    universe === "all" && !q && (!activeType || activeType === platsCategory?.id)

  const congoleseDishes = showEditorialSplit ? visibleDishes.filter(d => d.culinary_origin === "congolese") : []
  const africanDishes = showEditorialSplit ? visibleDishes.filter(d => d.culinary_origin === "african_selection") : []
  const unclassifiedDishes = showEditorialSplit ? visibleDishes.filter(d => !d.culinary_origin) : []

  return (
    <div className="min-h-screen bg-kwanga">
      <SiteHeader />

      <HomeHero />

      {/* ─── Notre carte ─────────────────────────────────────────── */}
      <section
        id="carte"
        aria-labelledby="carte-titre"
        className="max-w-[1440px] mx-auto px-5 lg:px-20 py-[clamp(56px,7vw,96px)] scroll-mt-16"
      >
        <SectionLabel>Notre carte</SectionLabel>
        <h2 id="carte-titre" className="font-serif text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-8">
          Découvrez nos saveurs
        </h2>

        {/* Bloc filtres — reste visible au défilement */}
        <div className="sticky top-16 z-30 bg-kwanga/95 backdrop-blur-md -mx-5 px-5 lg:-mx-20 lg:px-20 pt-3 pb-3 space-y-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-encre/35" aria-hidden />
            <label htmlFor="recherche-plat" className="sr-only">Rechercher un plat</label>
            <input
              id="recherche-plat"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un plat…"
              className="w-full bg-carte rounded-lg border border-encre/10 pl-11 pr-4 h-11 text-sm text-encre placeholder:text-encre/35 focus:outline-none focus:border-liboke/60 focus:ring-1 focus:ring-liboke/30 transition-all"
            />
          </div>

          {/* Niveau 1 — univers culinaire */}
          <FilterTabs
            label="Univers culinaire"
            items={universeItems}
            activeId={universe === "all" ? null : universe}
            onChange={handleUniverseChange}
          />

          {/* Niveau 2 — types de produits, pictogrammes fins */}
          <FilterTabs
            label="Type de produit"
            items={typeItems}
            activeId={activeType}
            onChange={handleTypeChange}
            variant="icons"
          />
        </div>

        {/* Résultats */}
        {visibleDishes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-encre/40 mb-5">
              {q
                ? `Aucun plat ne correspond à « ${query.trim()} ».`
                : "Aucun plat ne correspond à ces filtres."}
            </p>
            <button
              onClick={resetFilters}
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-liboke hover:text-[#ff3a60] transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : showEditorialSplit ? (
          <div className="space-y-16 lg:space-y-24">
            {congoleseDishes.length > 0 && (
              <div>
                <SectionLabel>Notre héritage</SectionLabel>
                <h3 className="font-serif text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-2.5">
                  Spécialités congolaises
                </h3>
                <p className="text-sm text-encre/55 leading-relaxed max-w-xl mb-8">
                  Les recettes emblématiques de Chez ya Nathy, inspirées de la
                  cuisine familiale congolaise.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                  {congoleseDishes.map(dish => <DishCard key={dish.id} dish={dish} />)}
                </div>
              </div>
            )}

            {africanDishes.length > 0 && (
              <div className="pt-14 lg:pt-16 border-t border-encre/8">
                <SectionLabel>Ailleurs en Afrique</SectionLabel>
                <h3 className="font-serif text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-2.5">
                  Autres spécialités africaines
                </h3>
                <p className="text-sm text-encre/55 leading-relaxed max-w-xl mb-8">
                  Quelques recettes africaines soigneusement sélectionnées pour
                  compléter notre carte.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                  {africanDishes.map(dish => <DishCard key={dish.id} dish={dish} />)}
                </div>
              </div>
            )}

            {unclassifiedDishes.length > 0 && (
              <div className="pt-14 lg:pt-16 border-t border-encre/8">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-encre/40 mb-6">
                  Autres plats
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                  {unclassifiedDishes.map(dish => <DishCard key={dish.id} dish={dish} />)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
            {visibleDishes.map(dish => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </section>

      <PreorderSection />

      <StorySection />

      <SiteFooter />

      {/* Barre panier fixe — mobile */}
      <CartBar />
    </div>
  )
}
