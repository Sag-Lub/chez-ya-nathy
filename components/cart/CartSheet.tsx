"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { CalendarDays, ShoppingBag, X } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { formatPrice, cn } from "@/lib/utils"
import { buttonClass } from "@/components/ui/Button"
import { CartItem } from "./CartItem"

interface CartSheetProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Panneau du panier, en verre : il monte du bas sur téléphone
 * et glisse depuis la droite sur grand écran.
 * Les articles sont posés sur des cartes pleines pour rester lisibles sur le flou.
 */
export function CartSheet({ isOpen, onClose }: CartSheetProps) {
  const items = useCartStore((s) => s.items)
  const totalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)
  const count = items.reduce((n, i) => n + i.quantity, 0)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Verrouille le défilement de la page, ferme avec Échap
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Voile derrière le panneau */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-encre/45 transition-opacity duration-200",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ton panier"
        inert={!isOpen}
        className={cn(
          "verre fixed z-50 flex flex-col text-kwanga transition-[transform,visibility] duration-[250ms] ease-[cubic-bezier(0.22,0.8,0.3,1)]",
          // Téléphone : feuille qui monte du bas
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[32px]",
          // Grand écran : panneau latéral
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-l-[32px] sm:rounded-tr-none",
          isOpen ? "visible translate-y-0 sm:translate-x-0" : "invisible translate-y-full sm:translate-x-full sm:translate-y-0"
        )}
      >
        {/* Poignée (téléphone) */}
        <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-11 shrink-0 rounded-full bg-kwanga/35 sm:hidden" />

        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-3 sm:pt-5">
          <h2 className="titre text-[30px] text-kwanga">Ton panier</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer le panier"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-kwanga/15 text-kwanga transition-colors duration-150 hover:bg-kwanga/25"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center px-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-safou text-encre">
              <ShoppingBag className="h-9 w-9" aria-hidden />
            </span>
            <p className="mt-5 text-[19px] font-bold text-white">Ton panier est vide</p>
            <p className="mt-1 text-[15px] text-kwanga/85">Choisis un plat sur la carte, il arrive ici.</p>
            <button type="button" onClick={onClose} className={buttonClass("clair", "md", "mt-6")}>
              Voir la carte
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 pb-4">
              {items.some((i) => i.weekendOnly) && (
                <p className="flex gap-2.5 rounded-[20px] bg-safou p-3.5 text-[14px] font-semibold leading-snug text-encre">
                  <CalendarDays className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden />
                  Ton panier contient un plat du week-end : toute la commande sera préparée pour samedi ou dimanche.
                </p>
              )}
              {items.map((item) => (
                <div key={item.id} className="rounded-[22px] bg-kwanga p-3">
                  <CartItem item={item} />
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-kwanga/15 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <span className="text-[16px] font-semibold text-kwanga/90">
                  {count} article{count > 1 ? "s" : ""}
                </span>
                <span className="text-[26px] font-extrabold tabular-nums text-white">{formatPrice(totalCents)}</span>
              </div>
              <p className="mt-0.5 text-right text-[13px] text-kwanga/80">Hors frais de livraison</p>
              <Link href="/commande" onClick={onClose} className={buttonClass("primary", "lg", "mt-3 w-full")}>
                Commander
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
