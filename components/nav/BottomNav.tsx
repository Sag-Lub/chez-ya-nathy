"use client"

import { useState, useEffect } from "react"
import { Home, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCartStore } from "@/store/cart"
import { CartSheet } from "@/components/cart/CartSheet"

export function BottomNav() {
  const [cartOpen, setCartOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const totalItems = useCartStore(s => s.totalItems)
  const pathname = usePathname()

  const isHome = pathname === "/"

  // Pages avec leur propre barre d'action fixe — la nav céderait la place
  if (pathname.startsWith("/plat/") || pathname.startsWith("/commande")) {
    return null
  }

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="glass fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-2 py-1.5 rounded-full shadow-[0_8px_32px_rgba(43,27,18,0.18)]"
      >
        {/* Menu */}
        <Link
          href="/"
          className={[
            "flex flex-col items-center gap-0.5 px-5 py-2 rounded-full transition-colors",
            isHome
              ? "text-liboke bg-liboke/8"
              : "text-encre/45 hover:text-encre hover:bg-encre/6",
          ].join(" ")}
          aria-label="Menu"
        >
          <Home className="h-[18px] w-[18px]" />
          <span className="text-[10px] font-semibold tracking-wide">Menu</span>
        </Link>

        {/* Panier */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex flex-col items-center gap-0.5 px-5 py-2 rounded-full text-encre/45 hover:text-encre hover:bg-encre/6 transition-colors"
          aria-label="Ouvrir le panier"
        >
          <ShoppingBag className="h-[18px] w-[18px]" />
          {mounted && totalItems() > 0 && (
            <span className="absolute top-1.5 right-3 bg-pili text-kwanga text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none tabular-nums">
              {totalItems() > 9 ? "9+" : totalItems()}
            </span>
          )}
          <span className="text-[10px] font-semibold tracking-wide">Panier</span>
        </button>
      </nav>

      <CartSheet isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
