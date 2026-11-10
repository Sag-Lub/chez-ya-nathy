import { createClient } from "@/lib/supabase/server"
import { MenuPage } from "@/components/menu/MenuPage"
import { OnboardingGate, VEIL_ID, VEIL_SCRIPT } from "@/components/onboarding/OnboardingGate"
import type { Category, Dish } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = await createClient()

  const [{ data: categories }, { data: dishes }] = await Promise.all([
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

  return (
    <>
      {/* Voile de première visite : affiché avant le premier rendu, puis relayé par l'onboarding */}
      <div id={VEIL_ID} aria-hidden suppressHydrationWarning className="fixed inset-0 z-[190] hidden bg-liboke" />
      <script dangerouslySetInnerHTML={{ __html: VEIL_SCRIPT }} />
      <OnboardingGate />

      <MenuPage
        categories={(categories ?? []) as Category[]}
        dishes={(dishes ?? []) as Dish[]}
      />
    </>
  )
}
