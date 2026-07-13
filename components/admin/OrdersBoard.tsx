"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Order, OrderStatus } from "@/lib/types"

const STATUSES: { key: OrderStatus; label: string; color: string }[] = [
  { key: "recue",        label: "Reçue",        color: "bg-safou/20 text-safou border-safou/30" },
  { key: "confirmee",    label: "Confirmée",    color: "bg-feuille/20 text-feuille border-feuille/30" },
  { key: "en_cuisine",   label: "En cuisine",   color: "bg-liboke/20 text-liboke border-liboke/30" },
  { key: "en_livraison", label: "En livraison", color: "bg-encre/10 text-encre border-encre/20" },
  { key: "livree",       label: "Livrée",       color: "bg-feuille/30 text-feuille border-feuille/40" },
  { key: "annulee",      label: "Annulée",      color: "bg-pili/10 text-pili border-pili/20" },
]

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  recue:        "confirmee",
  confirmee:    "en_cuisine",
  en_cuisine:   "en_livraison",
  en_livraison: "livree",
}

const ACTIVE_STATUSES: OrderStatus[] = ["recue", "confirmee", "en_cuisine", "en_livraison"]

interface Props {
  initialOrders: Order[]
}

export function OrdersBoard({ initialOrders }: Props) {
  const [orders,   setOrders]   = useState<Order[]>(initialOrders)
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  // ── Realtime subscription ─────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("orders-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order
            setOrders((prev) => [newOrder, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? { ...o, ...(payload.new as Order) } : o))
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // ── Changement de statut ──────────────────────────────────────
  const updateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setUpdating(orderId)
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)

    if (error) console.error("[admin] status update error:", error)
    setUpdating(null)
  }, [supabase])

  const active   = orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
  const archived = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status))

  if (active.length === 0 && archived.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-encre/40">
        <span className="text-5xl">🍽</span>
        <p className="text-sm">Aucune commande pour l'instant</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Commandes actives */}
      {active.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-encre/40 mb-3 px-1">
            En cours ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                updating={updating === order.id}
                onAdvance={() => {
                  const next = NEXT_STATUS[order.status]
                  if (next) updateStatus(order.id, next)
                }}
                onCancel={() => updateStatus(order.id, "annulee")}
              />
            ))}
          </div>
        </section>
      )}

      {/* Commandes archivées (aujourd'hui) */}
      {archived.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-encre/40 mb-3 px-1">
            Terminées / Annulées ({archived.length})
          </h2>
          <div className="space-y-2">
            {archived.map((order) => (
              <OrderCard key={order.id} order={order} updating={false} archived />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── OrderCard ───────────────────────────────────────────────────

function OrderCard({
  order,
  updating,
  archived = false,
  onAdvance,
  onCancel,
}: {
  order: Order
  updating: boolean
  archived?: boolean
  onAdvance?: () => void
  onCancel?:  () => void
}) {
  const statusMeta = STATUSES.find((s) => s.key === order.status)
  const nextLabel  = NEXT_STATUS[order.status]
    ? STATUSES.find((s) => s.key === NEXT_STATUS[order.status])?.label
    : null

  const time = new Date(order.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className={cn(
      "bg-white rounded-2xl p-4 shadow-sm border transition-opacity",
      archived ? "opacity-50 border-transparent" : "border-encre/8"
    )}>
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-bold text-encre">{order.customer_name}</p>
          <p className="text-xs text-encre/50">{time} · {order.phone}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full border",
            statusMeta?.color
          )}>
            {statusMeta?.label}
          </span>
          <span className="font-serif font-bold text-encre text-sm">
            {formatPrice(order.total_cents)}
          </span>
        </div>
      </div>

      {/* Type + adresse */}
      <p className="text-xs text-encre/60 mb-1.5">
        {order.type === "livraison"
          ? `🛵 ${order.address ?? ""} ${order.postal_code ?? ""}`
          : "🥡 À emporter"
        }
      </p>

      {/* Mode de paiement */}
      <p className="text-xs mb-3">
        {order.payment_method === "especes" ? (
          <span className="font-semibold text-safou">💵 Espèces à encaisser</span>
        ) : (
          <span className="text-encre/40">💳 Payé par carte</span>
        )}
      </p>

      {/* Détail des plats */}
      {order.order_items && order.order_items.length > 0 && (
        <ul className="space-y-1.5 mb-3 bg-encre/[0.03] rounded-xl p-3">
          {order.order_items.map((item) => (
            <li key={item.id} className="text-sm text-encre">
              <span className="font-semibold">{item.quantity}×</span> {item.dish_name}
              {item.spice && (
                <span className="text-xs text-encre/50"> · {item.spice}</span>
              )}
              {item.options.length > 0 && (
                <span className="text-xs text-encre/50">
                  {" "}· {item.options.map((o) => o.name).join(", ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Notes du client */}
      {order.notes && (
        <p className="text-xs text-encre/60 italic mb-3 bg-safou/10 rounded-xl px-3 py-2">
          « {order.notes} »
        </p>
      )}

      {/* Boutons de statut */}
      {!archived && (
        <div className="flex gap-2">
          {nextLabel && (
            <button
              onClick={onAdvance}
              disabled={updating}
              className="flex-1 bg-liboke text-white text-sm font-semibold rounded-xl py-2.5 px-4 hover:bg-liboke/90 active:scale-[.97] transition-all disabled:opacity-50"
            >
              {updating ? "…" : `→ ${nextLabel}`}
            </button>
          )}
          {order.status === "recue" && (
            <button
              onClick={onCancel}
              disabled={updating}
              className="bg-encre/8 text-encre/50 text-sm rounded-xl py-2.5 px-3 hover:bg-pili/10 hover:text-pili transition-all disabled:opacity-50"
            >
              Annuler
            </button>
          )}
        </div>
      )}
    </div>
  )
}
