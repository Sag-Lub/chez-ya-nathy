"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, Hourglass } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { storageKeys } from "@/lib/config"
import { formatPrice, formatDateLong, formatTimeRange } from "@/lib/utils"
import { spiceLabel } from "@/lib/labels"
import { buttonClass } from "@/components/ui/Button"
import { Frise } from "@/components/ui/icons"
import type { TrackedOrder } from "@/lib/types"

/** Le webhook Stripe peut mettre quelques secondes : on interroge le suivi jusqu'à 30 s. */
const MAX_ATTEMPTS = 15

function ConfirmationContent() {
  const params    = useSearchParams()
  const token     = params.get("token")
  const clearCart = useCartStore((s) => s.clearCart)

  const [order,    setOrder]    = useState<TrackedOrder | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const attempts = useRef(0)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      attempts.current++
      try {
        const res = await fetch(`/api/track/${token}`, { cache: "no-store" })
        if (res.ok) {
          const data: TrackedOrder = await res.json()
          if (cancelled) return
          setOrder(data)
          clearCart()
          try {
            localStorage.setItem(storageKeys.lastOrderToken, token)
          } catch { /* stockage indisponible */ }
          return
        }
      } catch { /* réseau */ }

      if (cancelled) return
      if (attempts.current >= MAX_ATTEMPTS) { setTimedOut(true); return }
      timer = setTimeout(poll, 2000)
    }

    // Premier appel légèrement différé (le webhook a besoin d'un instant)
    timer = setTimeout(poll, 600)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [token, clearCart])

  // ── Lien incomplet, ou commande pas encore visible ─────────────
  if (!token || (timedOut && !order)) {
    return (
      <Shell>
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-safou text-encre">
          <Hourglass className="h-11 w-11" aria-hidden />
        </span>
        <h1 className="titre mt-6 text-[34px] text-encre text-balance">
          {token ? "Ta commande arrive chez Nathy" : "Lien de confirmation incomplet"}
        </h1>
        <p className="mt-3 max-w-xs text-[16px] leading-relaxed text-encre/75">
          {token
            ? "L'enregistrement prend plus de temps que prévu. Si tu as payé par carte, ton paiement est bien pris en compte : le suivi s'affichera dans un instant."
            : "On ne retrouve pas ta commande avec ce lien. Si tu viens de commander, ouvre le lien reçu par email."}
        </p>
        {token && (
          <Link href={`/suivi/${token}`} className={buttonClass("primary", "lg", "mt-7 w-full max-w-xs")}>
            Voir le suivi
          </Link>
        )}
        <Link href="/" className={buttonClass("ghost", "md", "mt-2")}>Retour au menu</Link>
      </Shell>
    )
  }

  // ── Chargement ────────────────────────────────────────────────
  if (!order) {
    return (
      <Shell>
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-encre/15 border-t-liboke" role="status" aria-label="Chargement" />
        <p className="mt-5 text-[17px] font-semibold text-encre">On enregistre ta commande…</p>
      </Shell>
    )
  }

  // ── Confirmation ──────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-kwanga pb-nav">
      {/* Bandeau de succès : aplat liboke + frise du bracelet */}
      <div className="relative overflow-hidden rounded-b-[40px] bg-liboke px-6 pb-[70px] pt-[max(2.5rem,env(safe-area-inset-top))] text-center">
        <span className="anim-pop mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-kwanga text-encre">
          <Check className="h-10 w-10" strokeWidth={3.5} aria-hidden />
        </span>
        <h1 className="titre mt-5 text-[40px] text-kwanga text-balance">Commande reçue&nbsp;!</h1>
        <p className="mx-auto mt-3 max-w-xs text-[19px] font-bold leading-snug text-white">
          Merci {order.first_name}. Nathy a bien reçu ta commande.
        </p>
        <div className="absolute inset-x-0 bottom-0 text-kwanga">
          <Frise height={38} />
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-5 pt-6">
        {order.type === "livraison" && order.slot && (
          <p className="rounded-[22px] bg-encre p-4 text-center text-[16px] font-bold text-kwanga">
            Livraison {formatDateLong(order.slot.slot_date)}, {formatTimeRange(order.slot.start_time, order.slot.end_time)}
          </p>
        )}
        {order.type === "emporter" && (
          <p className="rounded-[22px] bg-encre p-4 text-center text-[16px] font-bold text-kwanga">
            À emporter : Nathy t&apos;appelle pour convenir de l&apos;heure
          </p>
        )}

        <section aria-label="Résumé de la commande" className="rounded-[22px] bg-carte p-4 ring-1 ring-inset ring-encre/8">
          <ul className="space-y-2.5">
            {order.order_items.map((item) => {
              const detail = [spiceLabel(item.spice), ...item.options.map((o) => o.name)].filter(Boolean).join(" · ")
              return (
                <li key={item.id} className="flex items-start justify-between gap-3 text-[15px]">
                  <span className="min-w-0 text-encre">
                    <strong className="font-bold"><span className="tabular-nums">{item.quantity}&nbsp;×</span> {item.dish_name}</strong>
                    {detail && <span className="block text-[13px] leading-snug text-encre/70">{detail}</span>}
                  </span>
                  <span className="shrink-0 font-bold tabular-nums text-encre">
                    {formatPrice(item.unit_price_cents * item.quantity)}
                  </span>
                </li>
              )
            })}
          </ul>
          <dl className="mt-4 space-y-1 border-t-2 border-sable pt-3 text-[15px]">
            {order.delivery_fee_cents > 0 && (
              <div className="flex justify-between text-encre/75">
                <dt>Livraison</dt>
                <dd className="tabular-nums">{formatPrice(order.delivery_fee_cents)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between font-extrabold text-encre">
              <dt className="text-[17px]">{order.payment_method === "especes" ? "À régler en espèces" : "Payé par carte"}</dt>
              <dd className="text-[24px] tabular-nums">{formatPrice(order.total_cents)}</dd>
            </div>
          </dl>
        </section>

        <Link href={`/suivi/${token}`} className={buttonClass("primary", "lg", "!mt-5 w-full")}>
          Suivre ma commande
        </Link>
        <p className="text-center text-[14px] leading-relaxed text-encre/70">
          Garde ce lien : il te permet de suivre ta commande sans créer de compte.
        </p>
      </div>
    </main>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-kwanga px-7 pb-nav text-center">
      {children}
    </main>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<Shell><span className="h-12 w-12 animate-spin rounded-full border-4 border-encre/15 border-t-liboke" role="status" aria-label="Chargement" /></Shell>}>
      <ConfirmationContent />
    </Suspense>
  )
}
