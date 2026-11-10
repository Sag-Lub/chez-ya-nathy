"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarClock, ClipboardList, CookingPot } from "lucide-react"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/admin", label: "Commandes", icon: ClipboardList },
  { href: "/admin/plats", label: "Plats", icon: CookingPot },
  { href: "/admin/creneaux", label: "Créneaux", icon: CalendarClock },
]

/** Onglets du tableau de bord : gros, contrastés, faciles à viser sur tablette. */
export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Tableau de bord cuisine" className="flex gap-1.5">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-12 items-center gap-2 rounded-full px-4 text-[16px] font-bold transition-colors",
              active ? "bg-encre text-kwanga" : "text-encre hover:bg-sable"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span className={cn(active ? "inline" : "hidden sm:inline")}>{label}</span>
            {!active && <span className="sr-only sm:hidden">{label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
