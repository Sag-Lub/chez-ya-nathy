"use client"

import Link from "next/link"
import { ArrowRight, CalendarDays } from "lucide-react"
import { formatPrice, cn, isWeekendOnly, culinaryOriginLabel } from "@/lib/utils"
import type { Dish } from "@/lib/types"

interface DishCardProps {
  dish: Dish
}

/**
 * Carte produit simplifiée — photo, badge d'origine, nom, une ligne de
 * description, prix, disponibilité, CTA. Le détail (piquant, région,
 * accompagnements, suppléments) vit sur la fiche produit.
 */
export function DishCard({ dish }: DishCardProps) {
  const weekend = isWeekendOnly(dish.available_days)
  const isPng   = dish.image_url?.endsWith(".png")
  const origin  = culinaryOriginLabel(dish.culinary_origin)

  return (
    <Link
      href={`/plat/${dish.slug}`}
      className="group block bg-carte rounded-xl overflow-hidden border border-encre/8 hover:border-encre/16 hover:bg-carte2 transition-colors"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {dish.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={dish.image_url}
            alt={dish.name}
            loading="lazy"
            className={cn(
              isPng
                ? "h-full w-full object-contain p-6 bg-carte2"
                : "h-full w-full object-cover",
              "transition-transform duration-500 group-hover:scale-[1.04]"
            )}
          />
        ) : (
          <div className="h-full w-full bg-carte2 flex items-center justify-center">
            <span className="text-4xl opacity-20 select-none" aria-hidden>🍽</span>
          </div>
        )}

        {/* Prix */}
        <span className="absolute top-3.5 right-3.5 bg-liboke text-white text-xs font-bold px-2.5 py-1 rounded-md tabular-nums">
          {formatPrice(dish.price_cents)}
        </span>

        {/* Épuisé */}
        {!dish.is_available && (
          <div className="absolute inset-0 bg-black/72 flex items-center justify-center">
            <span className="text-white text-[11px] font-bold uppercase tracking-[0.14em]">
              Indisponible aujourd&apos;hui
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4.5">
        {/* Badge d'origine */}
        {origin && (
          <span className="inline-block border border-encre/20 text-encre/55 text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded mb-2.5">
            {origin}
          </span>
        )}

        {/* Nom */}
        <h3 className="font-serif font-bold text-white text-[17px] leading-snug group-hover:text-liboke transition-colors">
          {dish.name}
        </h3>

        {/* Description — une ligne maximum */}
        <p className="text-[13px] text-encre/50 line-clamp-1 mt-1.5 mb-4 leading-relaxed">
          {dish.subtitle ?? dish.description}
        </p>

        {/* Disponibilité */}
        {weekend && (
          <span className="inline-flex items-center gap-1 border border-liboke/40 text-liboke text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded mb-3">
            <CalendarDays className="h-2.5 w-2.5" aria-hidden />
            Week-end sur précommande
          </span>
        )}

        {/* CTA */}
        <span
          className={cn(
            "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]",
            dish.is_available ? "text-liboke" : "text-encre/35"
          )}
        >
          {!dish.is_available ? "Indisponible" : weekend ? "Précommander" : "Ajouter au panier"}
          {dish.is_available && (
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          )}
        </span>
      </div>
    </Link>
  )
}
