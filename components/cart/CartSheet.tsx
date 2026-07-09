"use client"

import { useEffect } from "react"
import { ShoppingBag, X } from "lucide-react"
import Link from "next/link"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { CartItem } from "./CartItem"

interface CartSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function CartSheet({ isOpen, onClose }: CartSheetProps) {
  const items     = useCartStore(s => s.items)
  const totalCents = useCartStore(s => s.totalCents)

  // Verrouille le scroll du body
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  return (
    <>
      {/* Overlay sombre derrière le sheet */}
      <div
        aria-hidden
        onClick={onClose}
        style={{ background: "var(--glass-bg-dark)" }}
        className={[
          "fixed inset-0 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Sheet panier — verre */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Votre panier"
        className={[
          "glass fixed right-0 top-0 z-50 h-full w-full max-w-sm flex flex-col",
          "rounded-l-3xl shadow-[−4px_0_40px_rgba(43,27,18,0.18)]",
          "transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/20">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-liboke" />
            <h2 className="font-serif font-bold text-lg text-encre">Mon panier</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-encre/8 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5 text-encre/60" />
          </button>
        </div>

        {/* Articles — cartes kwanga pleines pour rester lisibles sur le flou */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-encre/30 py-16">
              <ShoppingBag className="h-14 w-14" />
              <p className="text-sm font-medium">Votre panier est vide</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-kwanga rounded-2xl border border-encre/8 px-3 py-2.5">
                <CartItem item={item} />
              </div>
            ))
          )}
        </div>

        {/* Pied de page — plus opaque */}
        {items.length > 0 && (
          <div
            className="px-5 py-5 space-y-4 border-t border-white/20"
            style={{ background: "rgba(250, 243, 232, 0.92)" }}
          >
            <div className="flex items-center justify-between text-encre">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-2xl font-serif">{formatPrice(totalCents())}</span>
            </div>
            <Link href="/commande" onClick={onClose} className="block">
              <Button size="lg" className="w-full">
                Commander →
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
