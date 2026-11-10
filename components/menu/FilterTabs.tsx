"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface FilterTabItem {
  /** null = option « tout » du niveau de filtre */
  id: string | null
  label: string
  /** Libellé complet, lu par les lecteurs d'écran quand `label` est abrégé. */
  fullLabel?: string
  icon?: LucideIcon
}

interface FilterProps {
  label: string
  items: FilterTabItem[]
  activeId: string | null
  onChange: (id: string | null) => void
}

/**
 * Univers culinaire — contrôle segmenté, toujours visible en entier.
 */
export function UniverseSwitch({ label, items, activeId, onChange }: FilterProps) {
  return (
    <div role="tablist" aria-label={label} className="flex rounded-full bg-sable p-1">
      {items.map((item) => {
        const active = activeId === item.id
        return (
          <button
            key={item.id ?? "__all__"}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={item.fullLabel}
            onClick={() => onChange(item.id)}
            className={cn(
              "h-11 flex-1 rounded-full px-2 text-[14px] font-bold whitespace-nowrap transition-colors duration-150",
              active ? "bg-encre text-kwanga" : "text-encre hover:bg-encre/5"
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Catégories — chips en pilule avec icône, défilement horizontal sur mobile.
 */
export function CategoryChips({ label, items, activeId, onChange }: FilterProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0"
    >
      {items.map((item) => {
        const active = activeId === item.id
        const Icon = item.icon
        return (
          <button
            key={item.id ?? "__all__"}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex h-12 shrink-0 items-center gap-2 rounded-full pl-3.5 pr-4 text-[15px] font-bold whitespace-nowrap transition-colors duration-150",
              active ? "bg-encre text-kwanga" : "bg-carte text-encre ring-1 ring-inset ring-encre/10 hover:bg-sable"
            )}
          >
            {Icon && <Icon className={cn("h-5 w-5", active ? "text-safou" : "text-braise")} strokeWidth={2.2} aria-hidden />}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
