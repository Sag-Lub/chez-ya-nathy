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

  // Supabase retourne stories sous forme d'un tableau (relation 1-to-1 unique)
  const dish = data as Dish & { stories: Story[] }

  return <DishDetailClient dish={dish} />
}
