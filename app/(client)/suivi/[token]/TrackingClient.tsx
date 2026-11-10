"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  BadgeCheck,
  Bike,
  Check,
  ClipboardCheck,
  CookingPot,
  House,
  SearchX,
  ShoppingBag,
  Store,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { storageKeys } from "@/lib/config"
import { formatPrice, formatDateLong, formatTimeRange, cn } from "@/lib/utils"
import { ORDER_STEPS, spiceLabel, statusLabel, statusSentence } from "@/lib/labels"
import { buttonClass } from "@/components/ui/Button"
import type { OrderStatus, OrderType, TrackedOrder } from "@/lib/types"

/** Intervalle de rafraîchissement du suivi (ms). */
const REFRESH_MS = 5000

function stepIcon(status: OrderStatus, type: OrderType): LucideIcon {
  switch (status) {
    case "recue":        return ClipboardCheck
    case "confirmee":    return BadgeCheck
    case "en_cuisine":   return CookingPot
    case "en_livraison": return type === "emporter" ? ShoppingBag : Bike
    default:             return type === "emporter" ? Store : House
  }
}

type LoadState = "chargement" | "introuvable" | "erreur" | "ok"

export function TrackingClient({ token }: { token: string }) {
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [state, setState] = useState<LoadState>("chargement")

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/track/${token}`, { cache: "no-store" })
      if (res.ok) {
        setOrder(await res.json())
        setState("ok")
        try {
          localStorage.setItem(storageKeys.lastOrderToken, token)
        } catch { /* stockage indisponible */ }
      } else if (res.status === 404) {
        setState((s) => (s === "ok" ? s : "introuvable"))
      } else {
        setState((s) => (s === "ok" ? s : "erreur"))
      }
    } catch {
      // Réseau coupé : on garde la dernière commande connue
      setState((s) => (s === "ok" ? s : "erreur"))
    }
  }, [token])

  const finished = order?.status === "livree" || order?.status === "annulee"

  // Premier chargement, puis rafraîchissement régulier tant que la commande est en cours.
  // En pause quand l'onglet est caché, relancé dès qu'il revient au premier plan.
  useEffect(() => {
    if (finished) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation avec le serveur
    void refresh()
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh()
    }, REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [finished, refresh])

  if (state === "chargement") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-kwanga pb-nav" aria-busy="true">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-encre/15 border-t-liboke" role="status" aria-label="Chargement du suivi" />
      </main>
    )
  }

  if (!order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-kwanga px-7 pb-nav text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-safou text-encre">
          <SearchX className="h-11 w-11" aria-hidden />
        </span>
        <h1 className="titre mt-6 text-[34px] text-encre text-balance">
          {state === "introuvable" ? "Commande introuvable" : "Suivi indisponible"}
        </h1>
        <p className="mt-3 max-w-xs text-[16px] leading-relaxed text-encre/75">
          {state === "introuvable"
            ? "Ce lien ne correspond à aucune commande. Si tu viens de payer, attends quelques secondes : elle arrive."
            : "On n'arrive pas à joindre le serveur. Vérifie ta connexion."}
        </p>
        <button type="button" onClick={() => { setState("chargement"); void refresh() }} className={buttonClass("sombre", "lg", "mt-7 w-full max-w-xs")}>
          Réessayer
        </button>
        <Link href="/" className={buttonClass("ghost", "md", "mt-2")}>Retour au menu</Link>
      </main>
    )
  }

  const cancelled    = order.status === "annulee"
  const currentIndex = ORDER_STEPS.indexOf(order.status)

  return (
    <main className="min-h-screen bg-kwanga pb-nav">
      {/* ─── Statut en grand ───────────────────────────────────── */}
      <div className={cn("rounded-b-[40px] px-6 pb-9 pt-[max(1.75rem,env(safe-area-inset-top))]", cancelled ? "bg-encre" : "bg-liboke")}>
        <div className="mx-auto max-w-lg">
          <p className="inline-flex items-center gap-2 rounded-full bg-encre px-3 py-1.5 text-[13px] font-bold text-kwanga">
            {!finished && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="anim-pouls absolute inset-0 rounded-full bg-safou" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-safou" />
              </span>
            )}
            {finished ? "Suivi terminé" : "Suivi en direct"}
          </p>
          <h1 className="titre mt-4 text-[46px] text-kwanga text-balance" aria-live="polite">
            {statusLabel(order.status, order.type)}
          </h1>
          <p className="mt-2 text-[19px] font-bold leading-snug text-white">
            {statusSentence(order.status, order.type)}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-5 pt-5">
        {/* ─── Les cinq étapes ─────────────────────────────────── */}
        {!cancelled && (
          <section aria-label="Étapes de la commande" className="rounded-[26px] bg-carte p-5 ring-1 ring-inset ring-encre/8">
            <ol>
              {ORDER_STEPS.map((step, i) => {
                const done    = i < currentIndex || order.status === "livree"
                const current = i === currentIndex && order.status !== "livree"
                const Icon    = done ? Check : stepIcon(step, order.type)
                const last    = i === ORDER_STEPS.length - 1
                return (
                  <li key={step} className="relative flex gap-4 pb-5 last:pb-0" aria-current={current ? "step" : undefined}>
                    {/* Trait qui relie les étapes */}
                    {!last && (
                      <span
                        aria-hidden
                        className={cn("absolute left-[21px] top-11 h-[calc(100%-2.75rem)] w-1 rounded-full", i < currentIndex ? "bg-encre" : "bg-sable")}
                      />
                    )}
                    <span
                      className={cn(
                        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                        done && "bg-encre text-kwanga",
                        current && "bg-liboke text-white",
                        !done && !current && "bg-sable text-encre/55"
                      )}
                    >
                      {current && <span aria-hidden className="anim-pouls absolute inset-0 rounded-full bg-liboke" />}
                      <Icon className="relative h-5 w-5" strokeWidth={done ? 3 : 2.2} aria-hidden />
                    </span>
                    <span className="flex min-h-11 flex-col justify-center">
                      <span className={cn("text-[17px] leading-tight", done || current ? "font-extrabold text-encre" : "font-semibold text-encre/60")}>
                        {statusLabel(step, order.type)}
                      </span>
                      {current && <span className="text-[14px] font-semibold text-braise">En cours</span>}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        {cancelled && (
          <section className="flex gap-3 rounded-[22px] bg-pili p-4 text-white">
            <X className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={3} aria-hidden />
            <p className="text-[15px] font-semibold leading-relaxed">
              Cette commande ne sera pas préparée. Si tu as payé par carte, Nathy te contacte pour le remboursement.
            </p>
          </section>
        )}

        {/* ─── Infos de livraison ──────────────────────────────── */}
        <section className="rounded-[22px] bg-carte p-4 ring-1 ring-inset ring-encre/8">
          <h2 className="text-[15px] font-extrabold text-encre">
            {order.type === "livraison" ? "Livraison" : "À emporter"}
          </h2>
          {order.type === "livraison" ? (
            <p className="mt-1 text-[15px] leading-relaxed text-encre/80">
              {order.slot && (
                <strong className="block font-bold text-encre first-letter:uppercase">
                  {formatDateLong(order.slot.slot_date)}, {formatTimeRange(order.slot.start_time, order.slot.end_time)}
                </strong>
              )}
              {[order.address, order.postal_code].filter(Boolean).join(", ")}
            </p>
          ) : (
            <p className="mt-1 text-[15px] leading-relaxed text-encre/80">
              Nathy t&apos;appelle pour convenir de l&apos;heure de retrait.
            </p>
          )}
        </section>

        {/* ─── Récapitulatif ───────────────────────────────────── */}
        <section className="rounded-[22px] bg-carte p-4 ring-1 ring-inset ring-encre/8">
          <h2 className="text-[15px] font-extrabold text-encre">{order.first_name ? `La commande de ${order.first_name}` : "Ta commande"}</h2>
          <ul className="mt-2 space-y-2.5">
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

        <Link href="/" className={buttonClass("sombre", "lg", "!mt-5 w-full")}>
          {finished ? "Commander à nouveau" : "Retour au menu"}
        </Link>
      </div>
    </main>
  )
}
