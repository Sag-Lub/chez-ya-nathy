"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface FilterTabItem {
  /** null = option « tout » du niveau de filtre */
  id: string | null
  label: string
  icon?: LucideIcon
}

interface FilterTabsProps {
  label: string
  items: FilterTabItem[]
  activeId: string | null
  onChange: (id: string | null) => void
  /** "text" : onglets typographiques soulignés — "icons" : pictogrammes fins */
  variant?: "text" | "icons"
}

/**
 * Filtres de la carte — deux rendus :
 * - texte uppercase souligné d'un trait framboise (univers culinaire) ;
 * - pictogrammes en traits fins avec libellé (types de produits).
 * Défilement horizontal sur mobile.
 */
export function FilterTabs({ label, items, activeId, onChange, variant = "text" }: FilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex overflow-x-auto scrollbar-none",
        variant === "text" ? "gap-7 border-b border-encre/8" : "gap-2"
      )}
    >
      {items.map(item =>
        variant === "text" ? (
          <TextTab
            key={item.id ?? "__all__"}
            label={item.label}
            active={activeId === item.id}
            onClick={() => onChange(item.id)}
          />
        ) : (
          <IconTab
            key={item.id ?? "__all__"}
            label={item.label}
            icon={item.icon}
            active={activeId === item.id}
            onClick={() => onChange(item.id)}
          />
        )
      )}
    </div>
  )
}

function TextTab({
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
        "relative shrink-0 pb-3 text-[11px] font-bold uppercase tracking-[0.14em] whitespace-nowrap transition-colors",
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

function IconTab({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon?: LucideIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "shrink-0 flex flex-col items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors",
        active ? "text-liboke" : "text-encre/50 hover:text-encre hover:bg-encre/5"
      )}
    >
      {Icon && <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />}
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap">
        {label}
      </span>
    </button>
  )
}
