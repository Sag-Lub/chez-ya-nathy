"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Banknote,
  BellRing,
  Bike,
  ChevronDown,
  CircleAlert,
  CreditCard,
  Phone,
  Store,
  Volume2,
  VolumeX,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ACTIVE_STATUSES, fetchKitchenOrders, isCashPayment } from "@/lib/kitchen"
import { storageKeys } from "@/lib/config"
import { spiceLabel, statusLabel } from "@/lib/labels"
import { formatPrice, formatDateLabel, formatTimeRange, cn } from "@/lib/utils"
import type { KitchenOrder, OrderStatus, OrderType } from "@/lib/types"

/** Filet de sécurité si le temps réel décroche : relecture régulière (ms). */
const REFRESH_MS = 20_000
/** Tant qu'une nouvelle commande n'a pas été vue, l'alerte sonore se répète (ms). */
const CHIME_REPEAT_MS = 15_000

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  recue:        "confirmee",
  confirmee:    "en_cuisine",
  en_cuisine:   "en_livraison",
  en_livraison: "livree",
}

/** Libellé du gros bouton : ce que la cuisine fait maintenant. */
function nextActionLabel(status: OrderStatus, type: OrderType): string | null {
  switch (status) {
    case "recue":        return "Confirmer la commande"
    case "confirmee":    return "Passer en cuisine"
    case "en_cuisine":   return type === "emporter" ? "C'est prêt" : "Partie en livraison"
    case "en_livraison": return type === "emporter" ? "Récupérée" : "Livrée"
    default:             return null
  }
}

const STATUS_BADGE: Record<OrderStatus, string> = {
  recue:        "bg-liboke text-white",
  confirmee:    "bg-safou text-encre",
  en_cuisine:   "bg-encre text-kwanga",
  en_livraison: "bg-feuille text-white",
  livree:       "bg-sable text-encre",
  annulee:      "bg-pili text-white",
}

// ─── Alerte sonore (Web Audio : aucun fichier à charger) ──────────
function playChime(ctx: AudioContext) {
  const now = ctx.currentTime
  ;[880, 1174.66, 1318.51].forEach((frequency, i) => {
    const start = now + i * 0.19
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.6, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.6)
  })
}

interface Props {
  initialOrders: KitchenOrder[]
}

export function OrdersBoard({ initialOrders }: Props) {
  const [supabase] = useState(() => createClient())
  const [orders,   setOrders]   = useState<KitchenOrder[]>(initialOrders)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [live,     setLive]     = useState(false)
  /** Nouvelles commandes pas encore vues par la cuisine. */
  const [unseen,   setUnseen]   = useState<Set<string>>(new Set())
  const [soundOn,  setSoundOn]  = useState(false)
  const [showDone, setShowDone] = useState(false)

  const knownIds = useRef(new Set(initialOrders.map((o) => o.id)))
  const audioRef = useRef<AudioContext | null>(null)

  const chime = useCallback(() => {
    const ctx = audioRef.current
    if (!ctx) return
    if (ctx.state === "suspended") void ctx.resume()
    playChime(ctx)
  }, [])

  // ── Relecture des commandes + détection des nouvelles ─────────
  const refresh = useCallback(async () => {
    const { orders: next, error: fetchError } = await fetchKitchenOrders(supabase)
    if (fetchError) return // on garde l'affichage actuel, la prochaine relecture réessaiera

    const fresh = next.filter((o) => !knownIds.current.has(o.id))
    next.forEach((o) => knownIds.current.add(o.id))
    setOrders(next)

    const freshActive = fresh.filter((o) => o.status === "recue")
    if (freshActive.length > 0) {
      setUnseen((prev) => new Set([...prev, ...freshActive.map((o) => o.id)]))
      chime()
    }
  }, [supabase, chime])

  // ── Temps réel (Supabase Realtime sur orders) + filet de sécurité ─
  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = []
    const scheduleRefresh = () => {
      timers.forEach(clearTimeout)
      // Deux relectures : tout de suite, puis une fois les lignes de commande écrites
      timers = [setTimeout(() => void refresh(), 150), setTimeout(() => void refresh(), 1500)]
    }

    const channel = supabase
      .channel("orders-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, scheduleRefresh)
      .subscribe((status) => setLive(status === "SUBSCRIBED"))

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refresh()
    }, REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
      void supabase.removeChannel(channel)
    }
  }, [supabase, refresh])

  // ── Son : préférence mémorisée, réactivée au premier toucher ──
  // (un navigateur ne joue aucun son avant un geste de l'utilisateur)
  useEffect(() => {
    let wanted = false
    try {
      wanted = localStorage.getItem(storageKeys.kitchenSound) === "on"
    } catch { /* stockage indisponible */ }
    if (!wanted) return

    const unlock = () => {
      if (!audioRef.current) {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        audioRef.current = new Ctx()
      }
      void audioRef.current.resume()
      setSoundOn(true)
    }
    document.addEventListener("pointerdown", unlock, { once: true })
    return () => document.removeEventListener("pointerdown", unlock)
  }, [])

  function toggleSound() {
    if (soundOn) {
      setSoundOn(false)
      void audioRef.current?.suspend()
      try { localStorage.setItem(storageKeys.kitchenSound, "off") } catch { /* rien */ }
      return
    }
    if (!audioRef.current) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioRef.current = new Ctx()
    }
    void audioRef.current.resume()
    playChime(audioRef.current) // on entend tout de suite à quoi ressemble l'alerte
    setSoundOn(true)
    try { localStorage.setItem(storageKeys.kitchenSound, "on") } catch { /* rien */ }
  }

  // L'alerte se répète tant qu'une nouvelle commande n'a pas été vue
  useEffect(() => {
    if (unseen.size === 0 || !soundOn) return
    const id = setInterval(chime, CHIME_REPEAT_MS)
    return () => clearInterval(id)
  }, [unseen.size, soundOn, chime])

  // Le titre de l'onglet annonce aussi les nouvelles commandes
  useEffect(() => {
    document.title = unseen.size > 0 ? `(${unseen.size}) Nouvelle commande — cuisine` : "Commandes — cuisine"
  }, [unseen.size])

  const markSeen = useCallback((id: string) => {
    setUnseen((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // ── Changement de statut ──────────────────────────────────────
  const updateStatus = useCallback(async (order: KitchenOrder, status: OrderStatus) => {
    setUpdating(order.id)
    setError(null)
    markSeen(order.id)

    const { data, error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", order.id)
      .select("id")

    if (updateError || !data || data.length === 0) {
      setError(`Le statut de la commande de ${order.customer_name} n'a pas pu être changé. Vérifie la connexion et réessaie.`)
    } else {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
    }
    setUpdating(null)
  }, [supabase, markSeen])

  const active   = orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
  const finished = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status))

  return (
    <div>
      {/* ─── En-tête : titre, état du direct, son ───────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="titre text-[36px] text-encre">Commandes</h1>
        <span
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[14px] font-bold",
            live ? "bg-feuille text-white" : "bg-sable text-encre"
          )}
        >
          <span className={cn("h-2.5 w-2.5 rounded-full", live ? "bg-white" : "bg-encre/50")} aria-hidden />
          {live ? "En direct" : "Relecture toutes les 20 s"}
        </span>
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          className={cn(
            "ml-auto flex h-12 items-center gap-2 rounded-full px-5 text-[16px] font-bold transition-colors",
            soundOn ? "bg-encre text-kwanga" : "border-2 border-encre bg-carte text-encre"
          )}
        >
          {soundOn ? <Volume2 className="h-5 w-5" aria-hidden /> : <VolumeX className="h-5 w-5" aria-hidden />}
          {soundOn ? "Son activé" : "Activer le son"}
        </button>
      </div>

      {/* ─── Bandeau d'état : toujours à la même place, pour que rien ne bouge
              sous le doigt quand une commande arrive ─────────────────────── */}
      <div
        aria-live="assertive"
        className={cn(
          "mt-4 flex h-[76px] items-center gap-3 rounded-[22px] px-4 transition-colors duration-200",
          unseen.size > 0 ? "bg-liboke text-white" : "bg-sable text-encre"
        )}
      >
        <span className={cn("relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full", unseen.size > 0 ? "bg-kwanga text-encre" : "bg-carte text-encre/70")}>
          {unseen.size > 0 && <span aria-hidden className="anim-pouls absolute inset-0 rounded-full bg-kwanga" />}
          <BellRing className="relative h-6 w-6" aria-hidden />
        </span>
        {unseen.size > 0 ? (
          <>
            <p className="text-[22px] font-extrabold leading-tight">
              {unseen.size === 1 ? "Nouvelle commande !" : `${unseen.size} nouvelles commandes !`}
            </p>
            <button
              type="button"
              onClick={() => setUnseen(new Set())}
              className="ml-auto h-12 shrink-0 rounded-full bg-encre px-6 text-[17px] font-bold text-kwanga"
            >
              Vu
            </button>
          </>
        ) : (
          <p className="text-[18px] font-bold">
            {soundOn ? "Pas de nouvelle commande. Une sonnerie te préviendra." : "Pas de nouvelle commande. Active le son pour être prévenue."}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 flex gap-2.5 rounded-[18px] bg-pili p-4 text-[16px] font-semibold text-white">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {/* ─── Commandes en cours ─────────────────────────────────── */}
      <section className="mt-6" aria-label="Commandes en cours">
        <h2 className="text-[18px] font-extrabold text-encre">En cours ({active.length})</h2>
        {active.length === 0 ? (
          <p className="mt-3 rounded-[22px] bg-carte p-8 text-center text-[18px] font-semibold text-encre/75 ring-2 ring-inset ring-encre/10">
            Aucune commande en cours. La prochaine s&apos;affichera ici toute seule.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {active.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isNew={unseen.has(order.id)}
                updating={updating === order.id}
                onSeen={() => markSeen(order.id)}
                onAdvance={() => {
                  const next = NEXT_STATUS[order.status]
                  if (next) void updateStatus(order, next)
                }}
                onCancel={() => void updateStatus(order, "annulee")}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Terminées / annulées ───────────────────────────────── */}
      {finished.length > 0 && (
        <section className="mt-8" aria-label="Commandes terminées">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            aria-expanded={showDone}
            className="flex h-12 items-center gap-2 rounded-full bg-sable px-5 text-[16px] font-bold text-encre"
          >
            Terminées et annulées ({finished.length})
            <ChevronDown className={cn("h-5 w-5 transition-transform duration-200", showDone && "rotate-180")} aria-hidden />
          </button>
          {showDone && (
            <ul className="mt-3 space-y-2">
              {finished.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[18px] bg-carte px-4 py-3 ring-1 ring-inset ring-encre/10">
                  <span className={cn("rounded-full px-3 py-1 text-[14px] font-bold", STATUS_BADGE[order.status])}>
                    {statusLabel(order.status, order.type)}
                  </span>
                  <span className="text-[17px] font-bold text-encre">{order.customer_name}</span>
                  <span className="text-[15px] text-encre/75">
                    {(order.order_items ?? []).map((i) => `${i.quantity} × ${i.dish_name}`).join(", ")}
                  </span>
                  <span className="ml-auto text-[17px] font-extrabold tabular-nums text-encre">{formatPrice(order.total_cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

// ─── Carte de commande ───────────────────────────────────────────

function OrderCard({
  order,
  isNew,
  updating,
  onSeen,
  onAdvance,
  onCancel,
}: {
  order: KitchenOrder
  isNew: boolean
  updating: boolean
  onSeen: () => void
  onAdvance: () => void
  onCancel: () => void
}) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const actionLabel = nextActionLabel(order.status, order.type)
  const cash = isCashPayment(order.payment_method)
  const slot = order.delivery_slots ?? null

  const receivedAt = new Date(order.created_at).toLocaleString("fr-FR", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  })

  return (
    <article
      // « Vu » au clic (et non à l'appui) : le bouton touché reçoit bien son clic d'abord
      onClick={isNew ? onSeen : undefined}
      className={cn(
        "flex flex-col rounded-[26px] bg-carte p-5",
        isNew ? "ring-[5px] ring-inset ring-liboke" : "ring-2 ring-inset ring-encre/12"
      )}
    >
      {/* Statut + total */}
      <div className="flex items-center gap-2">
        <span className={cn("rounded-full px-3.5 py-1.5 text-[15px] font-extrabold", STATUS_BADGE[order.status])}>
          {isNew ? "Nouvelle" : statusLabel(order.status, order.type)}
        </span>
        <span className="text-[15px] font-semibold text-encre/75">reçue {receivedAt}</span>
        <span className="ml-auto text-[24px] font-extrabold tabular-nums text-encre">{formatPrice(order.total_cents)}</span>
      </div>

      {/* Client */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h3 className="text-[24px] font-extrabold leading-tight text-encre">{order.customer_name}</h3>
        <a
          href={`tel:${order.phone.replace(/\s/g, "")}`}
          className="-my-1 inline-flex h-11 items-center gap-2 rounded-full bg-sable px-4 text-[17px] font-bold tabular-nums text-encre"
        >
          <Phone className="h-[18px] w-[18px]" aria-hidden />
          {order.phone}
        </a>
      </div>

      {/* Livraison ou retrait : quand et où */}
      <div className="mt-3 flex gap-3 rounded-[18px] bg-sable p-3.5">
        {order.type === "livraison" ? (
          <Bike className="mt-0.5 h-6 w-6 shrink-0 text-encre" aria-hidden />
        ) : (
          <Store className="mt-0.5 h-6 w-6 shrink-0 text-encre" aria-hidden />
        )}
        <p className="text-[17px] leading-snug text-encre">
          <strong className="block text-[19px] font-extrabold">
            {order.type === "livraison" ? "Livraison" : "À emporter"}
            {slot && (
              <span className="first-letter:uppercase">
                {" · "}{formatDateLabel(slot.slot_date)}, {formatTimeRange(slot.start_time, slot.end_time)}
              </span>
            )}
          </strong>
          {order.type === "livraison"
            ? [order.address, order.postal_code].filter(Boolean).join(", ")
            : "Appeler le client pour convenir de l'heure"}
          {order.type === "livraison" && !slot && (
            <span className="block font-bold text-pili">Pas de créneau : appeler le client</span>
          )}
        </p>
      </div>

      {/* Plats */}
      <ul className="mt-3 space-y-2">
        {(order.order_items ?? []).map((item) => {
          const detail = [spiceLabel(item.spice), ...(item.options ?? []).map((o) => o.name)].filter(Boolean).join(" · ")
          return (
            <li key={item.id} className="flex gap-3">
              <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-encre px-2 text-[18px] font-extrabold tabular-nums text-kwanga">
                {item.quantity}
              </span>
              <span className="pt-0.5">
                <span className="block text-[20px] font-extrabold leading-tight text-encre">{item.dish_name}</span>
                {detail && <span className="block text-[17px] font-semibold leading-snug text-encre/80">{detail}</span>}
              </span>
            </li>
          )
        })}
        {(order.order_items ?? []).length === 0 && (
          <li className="text-[17px] font-semibold text-pili">Détail des plats en cours de chargement…</li>
        )}
      </ul>

      {/* Remarque du client */}
      {order.notes && (
        <p className="mt-3 rounded-[18px] bg-safou p-3.5 text-[17px] font-semibold leading-snug text-encre">
          « {order.notes} »
        </p>
      )}

      {/* Paiement */}
      <p className={cn("mt-3 flex items-center gap-2 text-[17px] font-bold", cash ? "text-pili" : "text-encre/75")}>
        {cash ? <Banknote className="h-5 w-5" aria-hidden /> : <CreditCard className="h-5 w-5" aria-hidden />}
        {cash ? `Espèces à encaisser : ${formatPrice(order.total_cents)}` : "Déjà payé par carte"}
      </p>

      {/* Actions */}
      <div className="mt-4 flex gap-2 pt-1">
        {actionLabel && !confirmCancel && (
          <button
            type="button"
            onClick={onAdvance}
            disabled={updating}
            className="h-16 flex-1 rounded-full bg-liboke px-5 text-[21px] font-extrabold text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-50"
          >
            {updating ? "Un instant…" : actionLabel}
          </button>
        )}
        {order.status === "recue" && !confirmCancel && (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            disabled={updating}
            className="h-16 rounded-full border-2 border-encre px-5 text-[17px] font-bold text-encre disabled:opacity-50"
          >
            Annuler
          </button>
        )}
        {confirmCancel && (
          <>
            <button
              type="button"
              onClick={() => { setConfirmCancel(false); onCancel() }}
              disabled={updating}
              className="h-16 flex-1 rounded-full bg-pili px-5 text-[19px] font-extrabold text-white disabled:opacity-50"
            >
              Oui, annuler la commande
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancel(false)}
              className="h-16 rounded-full border-2 border-encre px-5 text-[17px] font-bold text-encre"
            >
              Non
            </button>
          </>
        )}
      </div>
    </article>
  )
}
