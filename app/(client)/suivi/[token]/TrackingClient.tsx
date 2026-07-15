"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import type { Order, OrderStatus } from "@/lib/types"

const STEPS: { key: OrderStatus; label: string; emoji: string }[] = [
  { key: "recue",        label: "Commande reçue",  emoji: "📋" },
  { key: "confirmee",    label: "Confirmée",        emoji: "✅" },
  { key: "en_cuisine",   label: "En cuisine",       emoji: "👩‍🍳" },
  { key: "en_livraison", label: "En livraison",     emoji: "🛵" },
  { key: "livree",       label: "Livrée",           emoji: "🎉" },
]
const STEP_ORDER: OrderStatus[] = ["recue", "confirmee", "en_cuisine", "en_livraison", "livree"]

interface Props {
  initialOrder: Order
  token: string
}

export function TrackingClient({ initialOrder, token }: Props) {
  const [order, setOrder] = useState<Order>(initialOrder)

  // Polling toutes les 5 s, arrêt si terminé
  useEffect(() => {
    if (order.status === "livree" || order.status === "annulee") return

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/track/${token}`)
        if (res.ok) setOrder(await res.json())
      } catch { /* réseau */ }
    }, 5000)

    return () => clearInterval(id)
  }, [order.status, token])

  const currentIndex = STEP_ORDER.indexOf(order.status)
  const isCancelled  = order.status === "annulee"

  return (
    <div className="min-h-screen bg-kwanga">
      {/* Header */}
      <div className="bg-liboke text-white px-4 pt-8 pb-10">
        <p className="text-white/70 text-sm mb-1">Nathy Food — Suivi de commande</p>
        <h1 className="font-serif text-2xl font-bold">
          {isCancelled ? "Commande annulée" : STEPS[Math.max(0, currentIndex)].label}
        </h1>
        <p className="text-white/70 text-xs mt-1">
          {order.customer_name} · {order.phone}
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4 pb-12">
        {/* Timeline */}
        {!isCancelled && (
          <div className="bg-carte rounded-2xl p-5 shadow-sm">
            <div className="space-y-5">
              {STEPS.map((step, i) => {
                const isDone    = i <= currentIndex
                const isCurrent = i === currentIndex
                return (
                  <div key={step.key} className="flex items-center gap-4">
                    {/* Indicateur */}
                    <div className={[
                      "h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-colors duration-500",
                      isDone    ? "bg-liboke/10"  : "bg-encre/6",
                    ].join(" ")}>
                      {isDone ? step.emoji : <span className="h-2.5 w-2.5 rounded-full bg-encre/20 block" />}
                    </div>

                    {/* Label */}
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${isDone ? "text-encre" : "text-encre/30"}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-liboke font-medium animate-pulse">
                          En cours…
                        </p>
                      )}
                    </div>

                    {/* Ligne de connexion */}
                    {i < STEPS.length - 1 && (
                      <div className="absolute ml-5 mt-10 w-px h-5 bg-encre/10" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Détails commande */}
        <div className="bg-carte rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-serif font-bold text-encre">Votre commande</h2>
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-encre">
                {item.dish_name}
                {item.quantity > 1 && <span className="text-encre/50 ml-1">×{item.quantity}</span>}
                {item.spice && <span className="text-encre/40 ml-1">· {item.spice}</span>}
              </span>
              <span className="font-semibold text-encre shrink-0">
                {formatPrice(item.unit_price_cents * item.quantity)}
              </span>
            </div>
          ))}
          <div className="border-t border-encre/8 pt-2 flex justify-between font-bold text-encre">
            <span>Total</span>
            <span>{formatPrice(order.total_cents)}</span>
          </div>
        </div>

        {/* Infos livraison */}
        {order.type === "livraison" && order.address && (
          <div className="bg-carte rounded-2xl p-5 shadow-sm text-sm space-y-1">
            <p className="font-semibold text-encre">Livraison</p>
            <p className="text-encre/60">{order.address}, {order.postal_code}</p>
          </div>
        )}
        {order.type === "emporter" && (
          <div className="bg-carte rounded-2xl p-5 shadow-sm text-sm">
            <p className="font-semibold text-encre">À emporter</p>
            <p className="text-encre/60">Nathy vous contactera pour la récupération.</p>
          </div>
        )}

        <Link href="/" className="text-sm text-encre/50 hover:text-encre text-center block pt-2">
          ← Retour au menu
        </Link>
      </div>
    </div>
  )
}
