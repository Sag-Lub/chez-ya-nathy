"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { FilterTabs } from "./FilterTabs"
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
import type { Category, CulinaryOrigin, Dish } from "@/lib/types"

interface MenuPageProps {
  categories: Category[]
  dishes: Dish[]
}

// ─── Synchronisation avec l'URL (?univers=congolais&type=plats) ───────
const ORIGIN_TO_PARAM: Record<CulinaryOrigin, string> = {
  congolese: "congolais",
  african_selection: "africain",
}
const PARAM_TO_ORIGIN: Record<string, CulinaryOrigin> = {
  congolais: "congolese",
  africain: "african_selection",
}
// Le seul mot-clé d'URL qui diffère du slug de catégorie
const CATEGORY_SLUG_TO_PARAM: Record<string, string> = { "plats-cuisines": "plats" }
const PARAM_TO_CATEGORY_SLUG: Record<string, string> = { plats: "plats-cuisines" }

function buildMenuUrl(originParam: string | null, typeParam: string | null): string {
  const params = new URLSearchParams()
  if (originParam) params.set("univers", originParam)
  if (typeParam) params.set("type", typeParam)
  const qs = params.toString()
  return qs ? `${window.location.pathname}?${qs}` : window.location.pathname
}

export function MenuPage({ categories, dishes }: MenuPageProps) {
  const [activeOrigin, setActiveOrigin] = useState<CulinaryOrigin | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  // Lecture initiale des filtres depuis l'URL (partage de lien, retour navigateur)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const universParam = params.get("univers")
    const typeParam = params.get("type")
    if (universParam && PARAM_TO_ORIGIN[universParam]) {
      setActiveOrigin(PARAM_TO_ORIGIN[universParam])
    }
    if (typeParam) {
      const slug = PARAM_TO_CATEGORY_SLUG[typeParam] ?? typeParam
      const cat = categories.find(c => c.slug === slug)
      if (cat) setActiveCategory(cat.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function syncUrl(origin: CulinaryOrigin | null, categoryId: string | null) {
    const catSlug = categoryId ? categories.find(c => c.id === categoryId)?.slug ?? null : null
    const typeParam = catSlug ? (CATEGORY_SLUG_TO_PARAM[catSlug] ?? catSlug) : null
    window.history.replaceState(null, "", buildMenuUrl(origin ? ORIGIN_TO_PARAM[origin] : null, typeParam))
  }

  function handleOriginChange(origin: CulinaryOrigin | null) {
    setActiveOrigin(origin)
    syncUrl(origin, activeCategory)
  }

  function handleCategoryChange(categoryId: string | null) {
    setActiveCategory(categoryId)
    syncUrl(activeOrigin, categoryId)
  }

  function resetFilters() {
    setActiveOrigin(null)
    setActiveCategory(null)
    setQuery("")
    syncUrl(null, null)
  }

  // Boissons et accompagnements ne s'affichent que dans leur catégorie, jamais dans "Tous"
  const hiddenFromAll = new Set(
    categories
      .filter(c => c.slug === "boissons" || c.slug === "accompagnements")
      .map(c => c.id)
  )
  const platsCategory = categories.find(c => c.slug === "plats-cuisines") ?? null

  // Ne pas proposer de filtre pour une catégorie ou un univers vide
  const nonEmptyCategories = categories.filter(c => dishes.some(d => d.category_id === c.id))
  const originItems = (["congolese", "african_selection"] as const)
    .filter(o => dishes.some(d => d.culinary_origin === o))
    .map(o => ({
      id: o,
      label: o === "congolese" ? "Spécialités congolaises" : "Saveurs africaines",
    }))

  const categoryFiltered = activeCategory
    ? dishes.filter(d => d.category_id === activeCategory)
    : dishes.filter(d => !hiddenFromAll.has(d.category_id))

  const withOrigin = (list: Dish[]) =>
    activeOrigin ? list.filter(d => d.culinary_origin === activeOrigin) : list

  // La recherche couvre tout le menu (nom, sous-titre, description) tant qu'aucune
  // catégorie n'est choisie ; sinon elle reste bornée à la catégorie active.
  const q = query.trim().toLowerCase()
  const matchesSearch = (d: Dish) =>
    !q ||
    d.name.toLowerCase().includes(q) ||
    (d.subtitle ?? "").toLowerCase().includes(q) ||
    d.description.toLowerCase().includes(q)
  const searchPool = q ? (activeCategory ? categoryFiltered : dishes) : categoryFiltered

  const visibleDishes = withOrigin(searchPool.filter(matchesSearch))

  // Sections éditoriales congolaise / africaine : uniquement quand on regarde
  // les plats cuisinés sans filtre d'univers ni recherche active.
  const showEditorialSplit =
    !activeOrigin && !q && (!activeCategory || activeCategory === platsCategory?.id)

  const congoleseDishes = showEditorialSplit ? visibleDishes.filter(d => d.culinary_origin === "congolese") : []
  const africanDishes = showEditorialSplit ? visibleDishes.filter(d => d.culinary_origin === "african_selection") : []
  const unclassifiedDishes = showEditorialSplit ? visibleDishes.filter(d => !d.culinary_origin) : []

  // Plats à l'honneur : ceux marqués comme mis en avant, cohérents avec le positionnement congolais
  const featured = dishes.filter(d => d.is_featured && d.is_available)

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

        {/* Niveau 1 — univers culinaire */}
        <div className="mb-5">
          <FilterTabs
            label="Univers culinaire"
            items={originItems}
            activeId={activeOrigin}
            allLabel="Toute la carte"
            onChange={id => handleOriginChange(id as CulinaryOrigin | null)}
            sticky
          />
        </div>

        {/* Niveau 2 — type de produit */}
        <div className="mb-10">
          <FilterTabs
            label="Type de produit"
            items={nonEmptyCategories.map(c => ({ id: c.id, label: c.name }))}
            activeId={activeCategory}
            allLabel="Tous"
            onChange={handleCategoryChange}
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
                  Les spécialités congolaises
                </h3>
                <p className="text-sm text-encre/55 leading-relaxed max-w-xl mb-8">
                  Les recettes emblématiques de Chez ya Nathy, inspirées de la
                  cuisine familiale congolaise et préparées avec générosité.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                  {congoleseDishes.map(dish => <DishCard key={dish.id} dish={dish} />)}
                </div>
              </div>
            )}

            {africanDishes.length > 0 && (
              <div className="pt-16 lg:pt-20 border-t border-encre/8">
                <SectionLabel>Ailleurs en Afrique</SectionLabel>
                <h3 className="font-serif text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-2.5">
                  Les saveurs africaines
                </h3>
                <p className="text-sm text-encre/55 leading-relaxed max-w-xl mb-8">
                  Quelques spécialités africaines soigneusement sélectionnées
                  pour compléter notre carte.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                  {africanDishes.map(dish => <DishCard key={dish.id} dish={dish} />)}
                </div>
              </div>
            )}

            {unclassifiedDishes.length > 0 && (
              <div className="pt-16 lg:pt-20 border-t border-encre/8">
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

      <SiteFooter />
    </div>
  )
}
