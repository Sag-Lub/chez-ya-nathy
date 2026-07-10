import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DishDetailClient } from "./DishDetailClient"
import type { Dish, Story } from "@/lib/types"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function DishPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("dishes")
    .select("*, dish_options(*), stories(*)")
    .eq("slug", slug)
    .single()

  if (error || !data) notFound()

  // Relation 1-à-1 (unique sur dish_id) : PostgREST renvoie un objet, pas un tableau
  const rawStories = (data as { stories: Story | Story[] | null }).stories
  const stories: Story[] = Array.isArray(rawStories)
    ? rawStories
    : rawStories
      ? [rawStories]
      : []

  const dish = { ...(data as Dish), stories }

  return <DishDetailClient dish={dish} />
}
