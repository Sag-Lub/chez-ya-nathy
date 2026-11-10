"use client"

import { useEffect, useRef, useState } from "react"
import {
  CakeSlice,
  CalendarClock,
  CookingPot,
  CupSoda,
  Search,
  Soup,
  UtensilsCrossed,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { UniverseSwitch, CategoryChips } from "./FilterTabs"
import { DishCard, PopularCard } from "./DishCard"
import {
  HomeHeader,
  HomeHero,
  PreorderBanner,
  StoryCard,
  SiteFooter,
} from "@/components/home/HomeSections"
import { buttonClass } from "@/components/ui/Button"
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

/** Icône d'une catégorie — jamais d'emoji. */
function categoryIcon(slug: string): LucideIcon {
  if (slug.includes("accompagnement")) return Soup
  if (slug.includes("boisson")) return CupSoda
  if (slug.includes("dessert")) return CakeSlice
  return CookingPot
}

const GRID = "grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 xl:grid-cols-5"

export function MenuPage({ categories, dishes }: MenuPageProps) {
  const [universe, setUniverse] = useState<UniverseFilter>("congolese")
  const [activeType, setActiveType] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const carteRef = useRef<HTMLElement>(null)

  // Lecture initiale des filtres depuis l'URL (partage de lien, retour navigateur)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const universParam = params.get("univers")
    const typeParam = params.get("type")
    if (universParam && PARAM_TO_UNIVERSE[universParam]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- l'URL n'est connue que dans le navigateur
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
    setActiveType(null)
    syncUrl(next, null)
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

  /** Bouton de la bannière « week-end » : affiche les plats à précommander. */
  function showPreorders() {
    setUniverse("all")
    setActiveType(PREORDER_TYPE)
    setQuery("")
    syncUrl("all", PREORDER_TYPE)
    carteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
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

  // ─── Filtres ────────────────────────────────────────────────────
  // Univers : congolais d'abord (défaut), « Toute la carte » en dernier.
  const universeItems = [
    ...(dishes.some(d => d.culinary_origin === "congolese")
      ? [{ id: "congolese", label: "Congolais", fullLabel: "Spécialités congolaises" }]
      : []),
    ...(dishes.some(d => d.culinary_origin === "african_selection")
      ? [{ id: "african_selection", label: "Africain", fullLabel: "Autres spécialités africaines" }]
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
  // Les plats épuisés restent visibles, avec leur badge, en fin de liste.
  const visibleDishes = universeDishes
    .filter(d => (q && !activeType ? matchesSearch(d) : matchesType(d) && matchesSearch(d)))
    .sort((a, b) => Number(!a.is_available) - Number(!b.is_available))

  // Chapitres : uniquement sur « Toute la carte », hors recherche,
  // pour la vue « Tous » ou « Plats cuisinés ».
  const showEditorialSplit =
    universe === "all" && !q && (!activeType || activeType === platsCategory?.id)

  const congoleseDishes = showEditorialSplit ? visibleDishes.filter(d => d.culinary_origin === "congolese") : []
  const africanDishes = showEditorialSplit ? visibleDishes.filter(d => d.culinary_origin === "african_selection") : []
  const unclassifiedDishes = showEditorialSplit ? visibleDishes.filter(d => !d.culinary_origin) : []

  // ─── Populaires ─────────────────────────────────────────────────
  // Plats mis en avant par la cuisine (is_featured) ; à défaut, les premiers plats cuisinés.
  const available = dishes.filter(d => d.is_available)
  const featured = available.filter(d => d.is_featured)
  const popular = (featured.length > 0 ? featured : available.filter(d => d.category_id === platsCategory?.id)).slice(0, 8)
  const showPopular = !q && !activeType && popular.length > 0
  const heroDish = popular.find(d => d.image_url && !d.image_url.toLowerCase().endsWith(".png")) ?? popular[0] ?? null

  const gridTitle = q
    ? "Résultats"
    : activeType === PREORDER_TYPE
      ? "À précommander"
      : activeType
        ? categories.find(c => c.id === activeType)?.name ?? "La carte"
        : universe === "congolese"
          ? "Spécialités congolaises"
          : universe === "african_selection"
            ? "Saveurs d'Afrique"
            : "Toute la carte"

  return (
    <div className="min-h-screen overflow-x-clip bg-kwanga pb-nav">
      <div className="mx-auto max-w-6xl lg:px-8">
        <HomeHeader />
        <HomeHero dish={heroDish} />

        {/* ─── La carte ────────────────────────────────────────── */}
        <section ref={carteRef} id="carte" aria-label="La carte" className="scroll-mt-4 px-4 pt-6 lg:px-0">
          <div className="space-y-3 lg:flex lg:items-center lg:gap-4 lg:space-y-0">
            <div className="relative lg:flex-1">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-encre/70" aria-hidden />
              <label htmlFor="recherche-plat" className="sr-only">Chercher un plat</label>
              <input
                id="recherche-plat"
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Chercher un plat, un ingrédient…"
                className="h-14 w-full appearance-none rounded-full border-2 border-encre/10 bg-carte pl-[52px] pr-12 text-[16px] text-encre placeholder:text-encre/70 transition-colors duration-150 focus:border-liboke focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Effacer la recherche"
                  className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-encre/70 hover:bg-encre/5"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              )}
            </div>
            <div className="lg:w-[380px]">
              <UniverseSwitch
                label="Univers culinaire"
                items={universeItems}
                activeId={universe === "all" ? null : universe}
                onChange={handleUniverseChange}
              />
            </div>
          </div>

          <div className="mt-3">
            <CategoryChips
              label="Catégories"
              items={typeItems}
              activeId={activeType}
              onChange={handleTypeChange}
            />
          </div>

          {/* ─── Populaires ─────────────────────────────────────── */}
          {showPopular && (
            <div className="mt-8">
              <h2 className="titre text-[30px] text-encre lg:text-[38px]">Populaires</h2>
              <div className="scrollbar-none -mx-4 mt-1 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:scroll-px-0 lg:px-0">
                {popular.map((dish, i) => (
                  <PopularCard key={dish.id} dish={dish} index={i} priority={i < 2} />
                ))}
              </div>
            </div>
          )}

          {/* ─── Grille ─────────────────────────────────────────── */}
          <div className="mt-9 flex items-baseline justify-between gap-3">
            <h2 className="titre text-[30px] text-encre lg:text-[38px]">{gridTitle}</h2>
            <p className="shrink-0 text-[14px] font-semibold text-encre/70" aria-live="polite">
              {visibleDishes.length} plat{visibleDishes.length > 1 ? "s" : ""}
            </p>
          </div>

          {visibleDishes.length === 0 ? (
            <div className="mt-6 rounded-[26px] bg-sable px-6 py-10 text-center">
              <p className="text-[16px] font-semibold text-encre">
                {q
                  ? `Aucun plat ne correspond à « ${query.trim()} ».`
                  : "Aucun plat dans cette sélection pour le moment."}
              </p>
              <button type="button" onClick={resetFilters} className={buttonClass("sombre", "md", "mt-5")}>
                Revoir toute la sélection
              </button>
            </div>
          ) : showEditorialSplit ? (
            <div className="space-y-9">
              {congoleseDishes.length > 0 && (
                <div>
                  <h3 className="mt-5 text-[17px] font-extrabold text-encre">Spécialités congolaises</h3>
                  <p className="mt-0.5 text-[14px] text-encre/70">Les recettes de famille de Nathy.</p>
                  <div className={GRID}>
                    {congoleseDishes.map(dish => <DishCard key={dish.id} dish={dish} />)}
                  </div>
                </div>
              )}

              {africanDishes.length > 0 && (
                <div>
                  <h3 className="text-[17px] font-extrabold text-encre">Ailleurs en Afrique</h3>
                  <p className="mt-0.5 text-[14px] text-encre/70">Quelques recettes d&apos;autres pays, choisies par Nathy.</p>
                  <div className={GRID}>
                    {africanDishes.map(dish => <DishCard key={dish.id} dish={dish} />)}
                  </div>
                </div>
              )}

              {unclassifiedDishes.length > 0 && (
                <div>
                  <h3 className="text-[17px] font-extrabold text-encre">Et aussi</h3>
                  <div className={GRID}>
                    {unclassifiedDishes.map(dish => <DishCard key={dish.id} dish={dish} />)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={GRID}>
              {visibleDishes.map(dish => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          )}
        </section>

        <PreorderBanner onShow={showPreorders} />
        <StoryCard />
        <SiteFooter />
      </div>
    </div>
  )
}
