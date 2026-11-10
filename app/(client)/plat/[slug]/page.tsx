import type { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DishDetailClient } from "./DishDetailClient"
import type { Dish, Story } from "@/lib/types"

interface PageProps {
  params: Promise<{ slug: string }>
}

// Une seule requête pour la page et ses métadonnées
const getDish = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("dishes")
    .select("*, dish_options(*), stories(*)")
    .eq("slug", slug)
    .single()

  if (error || !data) return null

  // Relation 1-à-1 (unique sur dish_id) : PostgREST renvoie un objet, pas un tableau
  const rawStories = (data as { stories: Story | Story[] | null }).stories
  const stories: Story[] = Array.isArray(rawStories)
    ? rawStories
    : rawStories
      ? [rawStories]
      : []

  const dish = data as Dish
  const dish_options = [...(dish.dish_options ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return { ...dish, dish_options, stories }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const dish = await getDish(slug)
  if (!dish) return { title: "Plat introuvable" }
  return {
    title: dish.name,
    description: dish.subtitle ? `${dish.subtitle}. ${dish.description}` : dish.description,
  }
}

export default async function DishPage({ params }: PageProps) {
  const { slug } = await params
  const dish = await getDish(slug)

  if (!dish) notFound()

  return <DishDetailClient dish={dish} />
}
