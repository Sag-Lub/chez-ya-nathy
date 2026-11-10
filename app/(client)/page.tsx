import { createClient } from "@/lib/supabase/server"
import { MenuPage } from "@/components/menu/MenuPage"
import { OnboardingGate } from "@/components/onboarding/OnboardingGate"
import { VEIL_ID } from "@/components/onboarding/first-visit"
import type { Category, Dish } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = await createClient()

  const [categoriesResult, dishesResult] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .order("sort_order"),
    // Tous les plats, épuisés compris : la carte affiche alors le badge « épuisé »
    supabase
      .from("dishes")
      .select("*, dish_options(*)")
      .order("sort_order"),
  ])

  // Une erreur de lecture ne doit jamais ressembler à un menu vide :
  // on l'écrit dans les journaux du serveur (Vercel → Logs) et on le dit au visiteur.
  const readError = categoriesResult.error ?? dishesResult.error
  if (readError) {
    console.error("[accueil] lecture du menu impossible :", readError.code, readError.message)
  }
  const categories = categoriesResult.data
  const dishes = dishesResult.data

  return (
    <>
      {/* Voile de première visite : montré avant le premier rendu (script du layout racine),
          puis relayé par l'onboarding */}
      <div id={VEIL_ID} aria-hidden className="fixed inset-0 z-[190] bg-liboke" />
      <OnboardingGate />

      <MenuPage
        categories={(categories ?? []) as Category[]}
        dishes={(dishes ?? []) as Dish[]}
        loadError={Boolean(readError)}
      />
    </>
  )
}
