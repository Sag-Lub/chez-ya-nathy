import Link from "next/link"
import { CalendarDays, Plus } from "lucide-react"
import { formatPrice, cn, isWeekendOnly } from "@/lib/utils"
import { DishPhoto } from "@/components/ui/DishPhoto"
import type { Dish } from "@/lib/types"

/**
 * Carte de la grille — photo ronde qui déborde en haut, nom, sous-titre, prix.
 * Toutes les cartes d'une rangée ont la même hauteur : le prix reste aligné en bas.
 * Le détail (piquant, accompagnements, suppléments, histoire) vit sur la fiche plat.
 */
export function DishCard({ dish, priority = false }: { dish: Dish; priority?: boolean }) {
  const weekend = isWeekendOnly(dish.available_days)
  const soldOut = !dish.is_available

  return (
    <Link
      href={`/plat/${dish.slug}`}
      aria-label={`${dish.name}, ${formatPrice(dish.price_cents)}${soldOut ? ", épuisé" : ""}`}
      className="group relative mt-11 flex flex-col rounded-[26px] bg-carte px-3.5 pb-3.5 pt-[76px] ring-1 ring-inset ring-encre/8 transition-transform duration-200 active:scale-[0.98]"
    >
      <div className="absolute -top-11 left-1/2 -translate-x-1/2">
        <DishPhoto
          src={dish.image_url}
          alt=""
          size={120}
          priority={priority}
          className={cn(
            "h-[120px] w-[120px] ring-[5px] ring-kwanga shadow-[0_10px_20px_rgba(43,27,18,0.16)] transition-transform duration-200 group-hover:scale-[1.04]",
            soldOut && "grayscale opacity-60"
          )}
        />
        {soldOut && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-encre px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-kwanga">
            Épuisé
          </span>
        )}
      </div>

      {weekend && !soldOut && (
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-pili px-2 py-1 text-[11px] font-bold text-white">
          <CalendarDays className="h-3 w-3" aria-hidden />
          Week-end
        </span>
      )}

      <h3 className="line-clamp-2 min-h-[2.5rem] text-[16px] font-extrabold leading-tight text-encre">
        {dish.name}
      </h3>
      <p className="mt-1 line-clamp-2 min-h-[2.25rem] text-[13px] leading-snug text-encre/70">
        {dish.subtitle ?? dish.description}
      </p>

      <div className="mt-auto flex items-center justify-between pt-3">
        <span className={cn("text-[17px] font-extrabold tabular-nums", soldOut ? "text-encre/70" : "text-encre")}>
          {formatPrice(dish.price_cents)}
        </span>
        {!soldOut && (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-liboke text-white transition-transform duration-150 group-hover:scale-110">
            <Plus className="h-5 w-5" strokeWidth={3} aria-hidden />
          </span>
        )}
      </div>
    </Link>
  )
}

const POPULAR_TONES = [
  { card: "bg-liboke text-white", button: "bg-kwanga text-encre", ring: "ring-liboke" },
  { card: "bg-safou text-encre", button: "bg-encre text-kwanga", ring: "ring-safou" },
  { card: "bg-encre text-kwanga", button: "bg-safou text-encre", ring: "ring-encre" },
] as const

/**
 * Carte « Populaires » — aplat de couleur plein, grande photo ronde qui déborde.
 * Uniquement du grand texte, pour rester lisible sur le fond liboke.
 */
export function PopularCard({ dish, index, priority = false }: { dish: Dish; index: number; priority?: boolean }) {
  const tone = POPULAR_TONES[index % POPULAR_TONES.length]

  return (
    <Link
      href={`/plat/${dish.slug}`}
      aria-label={`${dish.name}, ${formatPrice(dish.price_cents)}`}
      className={cn(
        "group relative mt-14 flex w-[204px] shrink-0 snap-start flex-col rounded-[30px] px-5 pb-5 pt-[104px] transition-transform duration-200 active:scale-[0.98]",
        tone.card
      )}
    >
      <div className="absolute -top-14 left-1/2 -translate-x-1/2">
        <DishPhoto
          src={dish.image_url}
          alt=""
          size={160}
          priority={priority}
          tone="sable"
          className={cn(
            "h-[152px] w-[152px] ring-[6px] shadow-[0_14px_24px_rgba(43,27,18,0.22)] transition-transform duration-200 group-hover:scale-[1.04]",
            tone.ring
          )}
        />
      </div>
      <h3 className="line-clamp-2 min-h-[2.9rem] text-[20px] font-extrabold leading-[1.15]">{dish.name}</h3>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[20px] font-extrabold tabular-nums">{formatPrice(dish.price_cents)}</span>
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 group-hover:scale-110", tone.button)}>
          <Plus className="h-5 w-5" strokeWidth={3} aria-hidden />
        </span>
      </div>
    </Link>
  )
}
