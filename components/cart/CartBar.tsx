"use client"

import { useState, useSyncExternalStore } from "react"
import { ShoppingBag } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { CartSheet } from "./CartSheet"

/**
 * Barre panier fixe en bas de l'écran (mobile) — apparaît dès qu'un
 * article est ajouté : « 2 articles · 27,50 € — Voir mon panier ».
 */
export function CartBar() {
  const [cartOpen, setCartOpen] = useState(false)
  const totalItems = useCartStore(s => s.totalItems)
  const totalCents = useCartStore(s => s.totalCents)

  // true côté client uniquement — évite le mismatch d'hydratation du panier persisté
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  const count = mounted ? totalItems() : 0
  if (count === 0) return <CartSheet isOpen={cartOpen} onClose={() => setCartOpen(false)} />

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden glass-footer px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button
          onClick={() => setCartOpen(true)}
          className="w-full flex items-center justify-between gap-3 bg-liboke text-white rounded-lg px-5 h-13 active:scale-[0.99] transition-transform"
        >
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            <ShoppingBag className="h-4.5 w-4.5" aria-hidden />
            {count} article{count > 1 ? "s" : ""} · {formatPrice(totalCents())}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
            Voir mon panier
          </span>
        </button>
      </div>

      <CartSheet isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
