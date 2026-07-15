"use client"

import { cn } from "@/lib/utils"

export interface FilterTabItem {
  id: string
  label: string
}

interface FilterTabsProps {
  label: string
  items: FilterTabItem[]
  activeId: string | null
  allLabel: string
  onChange: (id: string | null) => void
  /** Rend la barre collante sous le header au défilement (niveau univers). */
  sticky?: boolean
}

/**
 * Filtres génériques — texte uppercase, élément actif souligné d'un trait
 * framboise. Sert aux deux niveaux de la carte : univers culinaire et type
 * de produit. Défilement horizontal sur mobile.
 */
export function FilterTabs({ label, items, activeId, allLabel, onChange, sticky }: FilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex overflow-x-auto scrollbar-none gap-7 border-b border-encre/8",
        sticky && "sticky top-16 z-30 bg-kwanga/95 backdrop-blur-md"
      )}
    >
      <Tab label={allLabel} active={activeId === null} onClick={() => onChange(null)} />
      {items.map(item => (
        <Tab
          key={item.id}
          label={item.label}
          active={activeId === item.id}
          onClick={() => onChange(item.id)}
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
