"use client"

import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"

interface CategoryTabsProps {
  categories: Category[]
  activeId:   string | null
  onChange:   (id: string | null) => void
}

/**
 * Filtres de catégories — texte uppercase, élément actif souligné
 * d'un trait framboise. Défilement horizontal sur mobile.
 */
export function CategoryTabs({ categories, activeId, onChange }: CategoryTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Catégories de plats"
      className="flex overflow-x-auto scrollbar-none gap-7 border-b border-encre/8"
    >
      <Tab label="Tout" active={activeId === null} onClick={() => onChange(null)} />
      {categories.map(cat => (
        <Tab
          key={cat.id}
          label={cat.name}
          active={activeId === cat.id}
          onClick={() => onChange(cat.id)}
        />
      ))}
    </div>
  )
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative shrink-0 pb-3.5 text-[11px] font-bold uppercase tracking-[0.14em] whitespace-nowrap transition-colors",
        active ? "text-liboke" : "text-encre/50 hover:text-encre"
      )}
    >
      {label}
      <span
        aria-hidden
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-opacity",
          active ? "bg-liboke opacity-100" : "opacity-0"
        )}
      />
    </button>
  )
}
