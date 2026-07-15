"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import { useCartStore, type CartItem as CartItemType } from "@/store/cart"
import { formatPrice, dishImageClass } from "@/lib/utils"

const SPICE_LABELS: Record<string, string> = {
  doux:              "Doux",
  moyen:             "Moyen 🌶",
  fort:              "Fort 🌶🌶",
  pili_pili_a_part:  "Pili-pili 🌶🌶🌶",
}

export function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity } = useCartStore()

  const optionLine = [
    item.options?.["spice"]          && SPICE_LABELS[item.options["spice"]],
    item.options?.["accompagnement"],
    item.options?.["suppléments"],
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="flex items-center gap-3">
      {/* Vignette ronde */}
      <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden ring-2 ring-encre/15 shadow-sm">
        {item.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.imageUrl}
            alt={item.name}
            className={dishImageClass(item.imageUrl)}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-safou/40 to-liboke/30 flex items-center justify-center text-xl opacity-30 select-none">
            🍽
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-encre text-sm leading-snug line-clamp-1">{item.name}</p>
        {optionLine && (
          <p className="text-xs text-encre/50 mt-0.5 line-clamp-1">{optionLine}</p>
        )}

        {/* Quantité */}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex items-center gap-1 bg-encre/8 rounded-full px-1.5 py-0.5">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-encre/10 transition-colors"
              aria-label="Diminuer"
            >
              {item.quantity === 1
                ? <Trash2 className="h-3.5 w-3.5 text-pili" />
                : <Minus  className="h-3.5 w-3.5 text-encre" />
              }
            </button>
            <span className="text-sm font-semibold text-encre w-4 text-center select-none">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-encre/10 transition-colors"
              aria-label="Augmenter"
            >
              <Plus className="h-3.5 w-3.5 text-encre" />
            </button>
          </div>
        </div>
      </div>

      {/* Prix ligne */}
      <span className="font-semibold text-encre text-sm shrink-0">
        {formatPrice(item.priceCents * item.quantity)}
      </span>
    </div>
  )
}
