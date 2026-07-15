"use client"

import { useState, useEffect, useSyncExternalStore } from "react"
import Link from "next/link"
import { Menu, ShoppingBag, X } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { CartSheet } from "@/components/cart/CartSheet"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "#carte",        label: "La carte" },
  { href: "#histoire",     label: "Notre histoire" },
  { href: "#precommandes", label: "Précommandes" },
]

/**
 * Header premium — transparent au-dessus du hero, opaque au scroll.
 * Desktop : logo, navigation, panier, bouton Commander.
 * Mobile : logo, panier, menu plein écran sombre.
 */
export function SiteHeader() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [cartOpen, setCartOpen]   = useState(false)

  const totalItems = useCartStore(s => s.totalItems)

  // true côté client uniquement — évite le mismatch d'hydratation du compteur
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Verrouille le scroll quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  const goTo = (href: string) => {
    setMenuOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          scrolled
            ? "bg-kwanga/92 backdrop-blur-md border-b border-encre/8"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between h-16 px-5 lg:px-10">
          {/* Logo */}
          <Link href="/" aria-label="Chez ya Nathy — Accueil" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo_ChezYaNathy.png" alt="Chez ya Nathy" className="h-11 w-auto" />
          </Link>

          {/* Navigation desktop */}
          <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <button
                key={link.href}
                onClick={() => goTo(link.href)}
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-encre/75 hover:text-liboke transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Panier */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-lg text-encre/80 hover:text-encre hover:bg-encre/8 transition-colors"
              aria-label="Ouvrir le panier"
            >
              <ShoppingBag className="h-5 w-5" />
              {mounted && totalItems() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-liboke text-white text-[9px] font-bold rounded-full h-4.5 w-4.5 min-w-4 flex items-center justify-center leading-none tabular-nums">
                  {totalItems() > 9 ? "9+" : totalItems()}
                </span>
              )}
            </button>

            {/* CTA desktop */}
            <button
              onClick={() => goTo("#carte")}
              className="hidden lg:inline-flex items-center bg-liboke text-white text-[11px] font-bold uppercase tracking-[0.12em] px-5 h-10 rounded-lg hover:bg-[#ff3a60] transition-colors"
            >
              Commander
            </button>

            {/* Burger mobile */}
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-lg text-encre/80 hover:bg-encre/8 transition-colors"
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Menu mobile plein écran ─────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className={cn(
          "fixed inset-0 z-50 bg-kwanga/98 backdrop-blur-lg flex flex-col transition-opacity duration-300 lg:hidden",
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between h-16 px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo_ChezYaNathy.png" alt="" aria-hidden className="h-11 w-auto" />
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2.5 rounded-lg text-encre/80 hover:bg-encre/8"
            aria-label="Fermer le menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav aria-label="Navigation mobile" className="flex-1 flex flex-col justify-center px-8 gap-2">
          <button
            onClick={() => goTo("body")}
            className="text-left font-serif text-3xl font-bold text-encre py-3 border-b border-encre/8 hover:text-liboke transition-colors"
          >
            Accueil
          </button>
          {NAV_LINKS.map(link => (
            <button
              key={link.href}
              onClick={() => goTo(link.href)}
              className="text-left font-serif text-3xl font-bold text-encre py-3 border-b border-encre/8 hover:text-liboke transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="px-8 pb-10">
          <button
            onClick={() => goTo("#carte")}
            className="w-full bg-liboke text-white text-sm font-bold uppercase tracking-[0.12em] h-13 rounded-lg hover:bg-[#ff3a60] transition-colors"
          >
            Commander maintenant
          </button>
        </div>
      </div>

      <CartSheet isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
