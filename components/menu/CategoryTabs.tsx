"use client"

import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"

interface CategoryTabsProps {
  categories: Category[]
  activeId:   string | null
  onChange:   (id: string | null) => void
}

/** Emoji par mot-clé du slug — fallback : initiale de la catégorie */
function categoryEmoji(slug: string): string | null {
  const map: [string, string][] = [
    ["plat",      "🍲"],
    ["mijote",    "🍲"],
    ["grillade",  "🍖"],
    ["poisson",   "🐟"],
    ["poulet",    "🍗"],
    ["accompagn", "🍚"],
    ["entree",    "🥟"],
    ["beignet",   "🥟"],
    ["dessert",   "🍰"],
    ["boisson",   "🥤"],
    ["jus",       "🧃"],
  ]
  const s = slug.toLowerCase()
  return map.find(([key]) => s.includes(key))?.[1] ?? null
}

export function CategoryTabs({ categories, activeId, onChange }: CategoryTabsProps) {
  return (
    <div className="sticky top-20 z-30 bg-kwanga">
      <div className="flex overflow-x-auto scrollbar-none px-4 py-3 gap-3 max-w-2xl mx-auto">
        <Bubble
          emoji="✨"
          label="Tout"
          active={activeId === null}
          onClick={() => onChange(null)}
        />
        {categories.map(cat => (
          <Bubble
            key={cat.id}
            emoji={categoryEmoji(cat.slug) ?? cat.name.charAt(0).toUpperCase()}
            label={cat.name}
            active={activeId === cat.id}
            onClick={() => onChange(cat.id)}
          />
        ))}
      </div>
    </div>
  )
}

function Bubble({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 flex flex-col items-center gap-1.5 min-w-16"
    >
      <span
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center text-xl transition-all",
          active
            ? "bg-liboke shadow-[0_6px_16px_rgba(226,87,43,0.35)] scale-105"
            : "bg-white border border-encre/10"
        )}
      >
        {emoji}
      </span>
      <span
        className={cn(
          "text-[11px] font-semibold whitespace-nowrap transition-colors",
          active ? "text-liboke" : "text-encre/55"
        )}
      >
        {label}
      </span>
    </button>
  )
}
