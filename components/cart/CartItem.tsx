"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import { useCartStore, type CartItem as CartItemType } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { spiceLabel } from "@/lib/labels"
import { DishPhoto } from "@/components/ui/DishPhoto"

/** Ligne lisible des choix d'un article : piquant, accompagnement, suppléments. */
export function cartItemOptionLine(item: CartItemType): string {
  return [
    spiceLabel(item.options?.["spice"]),
    item.options?.["accompagnement"],
    item.options?.["suppléments"],
  ]
    .filter(Boolean)
    .join(" · ")
}

export function CartItem({ item }: { item: CartItemType }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const optionLine = cartItemOptionLine(item)

  return (
    <div className="flex items-start gap-3">
      <DishPhoto src={item.imageUrl} alt="" size={64} className="h-16 w-16" />

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[16px] font-extrabold leading-snug text-encre">{item.name}</p>
        {optionLine && <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-encre/70">{optionLine}</p>}

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[17px] font-extrabold tabular-nums text-encre">
            {formatPrice(item.priceCents * item.quantity)}
          </p>

          {/* Quantité */}
          <div className="flex shrink-0 items-center rounded-full bg-sable">
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-encre transition-colors duration-150 hover:bg-encre/10"
              aria-label={item.quantity === 1 ? `Retirer ${item.name} du panier` : `Diminuer la quantité de ${item.name}`}
            >
              {item.quantity === 1 ? (
                <Trash2 className="h-[18px] w-[18px] text-pili" aria-hidden />
              ) : (
                <Minus className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden />
              )}
            </button>
            <span className="w-6 select-none text-center text-[16px] font-extrabold tabular-nums text-encre">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.id, Math.min(20, item.quantity + 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full text-encre transition-colors duration-150 hover:bg-encre/10"
              aria-label={`Augmenter la quantité de ${item.name}`}
            >
              <Plus className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
