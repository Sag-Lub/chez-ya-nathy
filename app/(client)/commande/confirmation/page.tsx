"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Loader2, PackageSearch } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import type { Order } from "@/lib/types"

export default function ConfirmationPage() {
  const params    = useSearchParams()
  const token     = params.get("token")
  const clearCart = useCartStore((s) => s.clearCart)

  const [order,  setOrder]  = useState<Order | null>(null)
  const [status, setStatus] = useState<"polling" | "found" | "timeout">("polling")
  const attempts = useRef(0)

  useEffect(() => {
    if (!token) { setStatus("timeout"); return }

    const poll = async () => {
      attempts.current++
      try {
        const res = await fetch(`/api/track/${token}`)
        if (res.ok) {
          const data: Order = await res.json()
          setOrder(data)
          setStatus("found")
          clearCart()
          return
        }
      } catch { /* réseau */ }

      if (attempts.current >= 15) { setStatus("timeout"); return }
      setTimeout(poll, 2000)
    }

    // Premier appel différé de 1,5 s (le webhook a besoin d'un instant)
    setTimeout(poll, 1500)
  }, [token, clearCart])

  // ── Timeout ────────────────────────────────────────────────────
  if (status === "timeout") {
    return (
      <Shell>
        <PackageSearch className="h-12 w-12 text-encre/30 mx-auto" />
        <h1 className="font-serif text-xl font-bold text-encre text-center">
          Commande en cours de traitement…
        </h1>
        <p className="text-sm text-encre/60 text-center">
          Le paiement est bien validé. Un email de confirmation vous sera envoyé dès que la commande est confirmée.
        </p>
        <Link href={`/suivi/${token}`}>
          <Button className="w-full">Suivre ma commande</Button>
        </Link>
      </Shell>
    )
  }

  // ── Chargement ────────────────────────────────────────────────
  if (status === "polling" || !order) {
    return (
      <Shell>
        <Loader2 className="h-10 w-10 text-liboke animate-spin mx-auto" />
        <p className="text-sm text-encre/60 text-center">
          Confirmation du paiement en cours…
        </p>
      </Shell>
    )
  }

  // ── Confirmation ──────────────────────────────────────────────
  const subtotal = order.subtotal_cents
  const fee      = order.delivery_fee_cents
  const total    = order.total_cents

  return (
    <Shell>
      <div className="flex flex-col items-center gap-2">
        <CheckCircle className="h-14 w-14 text-feuille" />
        <h1 className="font-serif text-2xl font-bold text-encre text-center">
          Commande reçue !
        </h1>
        <p className="text-sm text-encre/60 text-center">
          Merci {order.customer_name.split(" ")[0]} 🙏 Nathy a bien reçu votre commande.
        </p>
      </div>

      {/* Articles */}
      <div className="bg-white rounded-2xl p-4 space-y-2 w-full">
        {order.order_items?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-encre">
              {item.dish_name}
              {item.quantity > 1 && <span className="text-encre/50 ml-1">×{item.quantity}</span>}
            </span>
            <span className="font-semibold text-encre">
              {formatPrice(item.unit_price_cents * item.quantity)}
            </span>
          </div>
        ))}
        <div className="border-t border-encre/8 pt-2 mt-2 space-y-1">
          <div className="flex justify-between text-sm text-encre/60">
            <span>Sous-total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {fee > 0 && (
            <div className="flex justify-between text-sm text-encre/60">
              <span>Livraison</span>
              <span>{formatPrice(fee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-encre">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* CTA suivi */}
      <Link href={`/suivi/${token}`} className="block w-full">
        <Button size="lg" className="w-full">
          Suivre ma commande →
        </Button>
      </Link>
      <Link href="/" className="text-sm text-encre/50 hover:text-encre text-center block">
        Retour au menu
      </Link>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kwanga flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col gap-5">
        {children}
      </div>
    </div>
  )
}
