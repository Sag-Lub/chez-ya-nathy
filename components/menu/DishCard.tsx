"use client"

import Link from "next/link"
import { Flame, CalendarDays } from "lucide-react"
import { formatPrice, dishImageClass, cn, isWeekendOnly } from "@/lib/utils"
import type { Dish } from "@/lib/types"

interface DishCardProps {
  dish: Dish
}

export function DishCard({ dish }: DishCardProps) {
  return (
    <div className="relative mt-16">
      {/* ── Photo circulaire — déborde au-dessus de la carte ────── */}
      <Link
        href={`/plat/${dish.slug}`}
        className="absolute -top-14 left-1/2 -translate-x-1/2 z-10 block h-32 w-32 rounded-full overflow-hidden shadow-[0_12px_28px_rgba(43,27,18,0.22)]"
      >
        {dish.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={dish.image_url}
            alt={dish.name}
            className={cn(dishImageClass(dish.image_url), "transition-transform duration-300 hover:scale-110")}
          />
        ) : (
          <PlaceholderImage name={dish.name} />
        )}

        {/* Overlay épuisé */}
        {!dish.is_available && (
          <div className="absolute inset-0 bg-encre/65 flex items-center justify-center">
            <span className="text-kwanga text-[10px] font-bold text-center leading-tight px-2">
              Épuisé aujourd&apos;hui
            </span>
          </div>
        )}
      </Link>

      {/* Badge piquant — accroché au bord droit de la photo */}
      {dish.spice_customizable && (
        <span className="absolute -top-11 left-1/2 translate-x-10 z-20 flex items-center justify-center bg-pili text-white h-7 w-7 rounded-full shadow-md ring-2 ring-white">
          <Flame className="h-3.5 w-3.5" />
        </span>
      )}

      {/* ── Carte blanche ────────────────────────────────────────── */}
      <div className="bg-white rounded-[28px] pt-[4.75rem] px-5 pb-5 text-center shadow-[0_10px_30px_rgba(43,27,18,0.08)]">
        {/* Badge région / week-end */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap mb-1.5">
          {dish.region && (
            <span className="inline-block bg-safou/15 text-encre/70 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {dish.region}
            </span>
          )}
          {isWeekendOnly(dish.available_days) && (
            <span className="inline-flex items-center gap-1 bg-pili/10 text-pili text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              <CalendarDays className="h-2.5 w-2.5" />
              Week-end sur précommande
            </span>
          )}
        </div>

        {/* Nom */}
        <Link href={`/plat/${dish.slug}`}>
          <h3 className="font-serif font-semibold text-encre leading-snug text-[17px] hover:text-liboke transition-colors line-clamp-1">
            {dish.name}
          </h3>
        </Link>

        {/* Sous-titre (traduction française) */}
        {dish.subtitle && (
          <p className="text-[11px] font-medium text-liboke/70 mt-0.5 line-clamp-1">
            {dish.subtitle}
          </p>
        )}

        {/* Description */}
        <p className="text-xs text-encre/45 line-clamp-2 mt-1 mb-4 leading-relaxed">
          {dish.description}
        </p>

        {/* Prix + bouton "+" */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-liboke text-lg">
            {formatPrice(dish.price_cents)}
          </span>
          <Link
            href={`/plat/${dish.slug}`}
            className="bg-liboke text-kwanga rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold hover:bg-liboke/90 active:scale-95 transition-all shadow-[0_6px_16px_rgba(226,87,43,0.4)]"
            aria-label={`Choisir ${dish.name}`}
          >
            +
          </Link>
        </div>
      </div>
    </div>
  )
}

function PlaceholderImage({ name }: { name: string }) {
  const gradients = [
    "from-safou/40 to-liboke/30",
    "from-liboke/30 to-pili/20",
    "from-feuille/25 to-safou/35",
  ]
  const index = name.length % gradients.length
  return (
    <div className={`h-full w-full bg-gradient-to-br ${gradients[index]} flex items-center justify-center`}>
      <span className="text-4xl opacity-25 select-none">🍽</span>
    </div>
  )
}
