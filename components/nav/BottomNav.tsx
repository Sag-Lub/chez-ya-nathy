"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MapPinned, ShoppingBag, UtensilsCrossed } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { CartSheet } from "@/components/cart/CartSheet"
import { cn } from "@/lib/utils"

const ITEM =
  "relative flex h-[52px] min-w-[86px] flex-col items-center justify-center gap-0.5 rounded-full px-4 text-[12px] font-bold transition-colors duration-150"
const IDLE = "text-kwanga hover:bg-kwanga/10"
const ACTIVE = "bg-safou text-encre"

/**
 * Navigation basse flottante, en verre : Menu, Panier (avec le nombre d'articles), Suivi.
 * Elle s'efface sur la fiche plat et dans le tunnel de commande, qui ont déjà
 * leur propre action principale en bas d'écran.
 */
export function BottomNav() {
  const [cartOpen, setCartOpen] = useState(false)
  const pathname = usePathname()

  // Nombre d'articles — lu côté client uniquement (panier conservé dans le navigateur)
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const storedCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))
  const count = mounted ? storedCount : 0

  const focusedFlow =
    pathname.startsWith("/plat/") || (pathname.startsWith("/commande") && !pathname.startsWith("/commande/confirmation"))

  const onMenu = pathname === "/"
  const onSuivi = pathname.startsWith("/suivi") || pathname.startsWith("/commande/confirmation")

  return (
    <>
      {!focusedFlow && (
        <nav
          aria-label="Navigation principale"
          className="verre fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full p-1.5 shadow-[0_12px_32px_rgba(43,27,18,0.3)] bottom-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <Link href="/" aria-current={onMenu ? "page" : undefined} className={cn(ITEM, onMenu ? ACTIVE : IDLE)}>
            <UtensilsCrossed className="h-[22px] w-[22px]" aria-hidden />
            Menu
          </Link>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={count > 0 ? `Ouvrir le panier, ${count} article${count > 1 ? "s" : ""}` : "Ouvrir le panier"}
            className={cn(ITEM, cartOpen ? ACTIVE : IDLE)}
          >
            <span className="relative">
              <ShoppingBag className="h-[22px] w-[22px]" aria-hidden />
              {count > 0 && (
                <span
                  key={count}
                  className="anim-pop absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-pili px-1 text-[11px] font-bold leading-none text-white tabular-nums"
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </span>
            Panier
          </button>

          <Link href="/suivi" aria-current={onSuivi ? "page" : undefined} className={cn(ITEM, onSuivi ? ACTIVE : IDLE)}>
            <MapPinned className="h-[22px] w-[22px]" aria-hidden />
            Suivi
          </Link>
        </nav>
      )}

      <CartSheet isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
