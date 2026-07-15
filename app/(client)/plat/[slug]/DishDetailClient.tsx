"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CalendarDays, Flame, Minus, Plus, ShoppingBag } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { formatPrice, cn, dishImageClass, isWeekendOnly } from "@/lib/utils"
import { getNextAvailableWeekendDate, formatWeekendDate } from "@/lib/preorder"
import { Button } from "@/components/ui/Button"
import type { Dish, SpiceLevel, Story } from "@/lib/types"

const SPICE_OPTIONS: { value: SpiceLevel; label: string; color: string }[] = [
  { value: "doux",             label: "Doux",              color: "border-feuille  text-feuille  bg-feuille/10"  },
  { value: "moyen",            label: "Moyen 🌶",          color: "border-safou    text-safou    bg-safou/10"    },
  { value: "fort",             label: "Fort 🌶🌶",         color: "border-liboke   text-liboke   bg-liboke/10"   },
  { value: "pili_pili_a_part", label: "Pili-pili 🌶🌶🌶",  color: "border-pili     text-pili     bg-pili/10"     },
]

interface Props {
  dish: Dish & { stories?: Story[] }
}

export function DishDetailClient({ dish }: Props) {
  const router = useRouter()
  const addItem = useCartStore(s => s.addItem)

  const baseOptions = dish.dish_options?.filter(o => o.extra_price_cents === 0) ?? []
  const extras      = dish.dish_options?.filter(o => o.extra_price_cents > 0)  ?? []
  const story       = dish.stories?.[0] ?? null

  const [spice,          setSpice]          = useState<SpiceLevel | null>(dish.spice_customizable ? "doux" : null)
  const [selectedBase,   setSelectedBase]   = useState<string | null>(baseOptions[0]?.id ?? null)
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set())
  const [quantity,       setQuantity]       = useState(1)
  const [added,          setAdded]          = useState(false)

  const weekendDish     = isWeekendOnly(dish.available_days)
  const nextWeekendDate = weekendDish ? getNextAvailableWeekendDate() : null

  const extrasPrice = [...selectedExtras].reduce((sum, id) => {
    return sum + (extras.find(o => o.id === id)?.extra_price_cents ?? 0)
  }, 0)
  const unitPrice  = dish.price_cents + extrasPrice
  const totalPrice = unitPrice * quantity

  function handleAdd() {
    const baseOpt = baseOptions.find(o => o.id === selectedBase)
    const extrasList = extras.filter(o => selectedExtras.has(o.id))

    const comboKey = [spice ?? "", selectedBase ?? "", ...[...selectedExtras].sort()].join("_")
    const itemId   = `${dish.id}_${comboKey}`

    addItem({
      id:                itemId,
      dishId:            dish.id,
      slug:              dish.slug,
      name:              dish.name,
      priceCents:        unitPrice,
      quantity,
      imageUrl:          dish.image_url,
      weekendOnly:       weekendDish,
      selectedOptionIds: [
        ...(selectedBase ? [selectedBase] : []),
        ...[...selectedExtras],
      ],
      options: {
        ...(spice         && { spice }),
        ...(baseOpt       && { accompagnement: baseOpt.name }),
        ...(extrasList.length > 0 && {
          "suppléments": extrasList.map(o => o.name).join(", "),
        }),
      },
    })

    setAdded(true)
    setTimeout(() => router.back(), 900)
  }

  return (
    <div className="min-h-screen bg-kwanga">
      {/* ─── Hero — photo circulaire centrée ───────────────────── */}
      <div className="relative max-w-lg mx-auto px-5 pt-4">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-5 z-20 bg-carte border border-encre/10 rounded-full p-2.5 shadow-sm transition-opacity hover:opacity-70"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5 text-encre" />
        </button>

        <div className="flex flex-col items-center pt-10">
          {/* Photo ronde */}
          <div className="relative h-60 w-60 rounded-full overflow-hidden shadow-[0_24px_48px_rgba(43,27,18,0.25)]">
            {dish.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={dish.image_url}
                alt={dish.name}
                className={dishImageClass(dish.image_url)}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-safou/40 to-liboke/30 flex items-center justify-center text-6xl opacity-25 select-none">
                🍽
              </div>
            )}
          </div>

          {/* Quantité — pill sous la photo */}
          <div className="flex items-center gap-3 bg-carte border border-encre/10 rounded-full px-2 py-1 -mt-5 relative z-10 shadow-[0_6px_16px_rgba(43,27,18,0.12)]">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-encre/8 transition-colors"
              aria-label="Diminuer"
            >
              <Minus className="h-4 w-4 text-liboke" />
            </button>
            <span className="font-bold text-encre w-5 text-center tabular-nums">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-liboke hover:bg-liboke/90 transition-colors"
              aria-label="Augmenter"
            >
              <Plus className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Contenu ────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-5 pt-5 pb-36">
        {/* Titre + région — centrés */}
        <div className="mb-4 text-center">
          <div className="flex items-center justify-center gap-1.5 flex-wrap mb-2">
            {dish.region && (
              <span className="inline-block bg-safou text-encre text-[10px] font-bold px-2.5 py-1 rounded-full">
                {dish.region}
              </span>
            )}
            {isWeekendOnly(dish.available_days) && (
              <span className="inline-flex items-center gap-1 bg-pili/10 text-pili text-[10px] font-bold px-2.5 py-1 rounded-full">
                <CalendarDays className="h-3 w-3" />
                Week-end sur précommande
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl font-bold text-encre leading-tight text-balance">
            {dish.name}
          </h1>
          {dish.subtitle && (
            <p className="text-sm font-medium text-liboke/70 mt-0.5">{dish.subtitle}</p>
          )}
          <p className="mt-1 font-serif text-xl font-semibold text-liboke">
            {formatPrice(dish.price_cents)}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-encre/70 leading-relaxed mb-6 text-center">
          {dish.description}
        </p>

        {/* Explication précommande week-end */}
        {isWeekendOnly(dish.available_days) && (
          <div className="bg-pili/8 border border-pili/15 rounded-2xl p-4 mb-6 text-center">
            <p className="text-sm text-encre/75 leading-relaxed">
              Ce plat demande une préparation plus longue. Vous pouvez le
              précommander dès maintenant pour le samedi ou le dimanche.
            </p>
            {nextWeekendDate && (
              <p className="text-xs font-semibold text-pili mt-2">
                Prochaine date disponible : {formatWeekendDate(nextWeekendDate)}
              </p>
            )}
          </div>
        )}

        {/* Histoire du plat */}
        {story && (
          <div className="bg-safou/12 rounded-2xl p-4 mb-6 border border-safou/20">
            <p className="font-serif font-semibold text-encre text-sm mb-1">{story.title}</p>
            <p className="text-xs text-encre/65 leading-relaxed">{story.body}</p>
          </div>
        )}

        {/* ─── Choix du piquant ─────────────────────────────── */}
        {dish.spice_customizable && (
          <Section icon={<Flame className="h-4 w-4 text-pili" />} title="Niveau de piquant">
            <div className="grid grid-cols-2 gap-2">
              {SPICE_OPTIONS.map(opt => (
                <RadioChip
                  key={opt.value}
                  label={opt.label}
                  color={opt.color}
                  selected={spice === opt.value}
                  onClick={() => setSpice(opt.value)}
                />
              ))}
            </div>
          </Section>
        )}

        {/* ─── Accompagnement (options gratuites) ───────────── */}
        {baseOptions.length > 0 && (
          <Section title="Accompagnement">
            <div className="space-y-2">
              {baseOptions.map(opt => (
                <RadioChip
                  key={opt.id}
                  label={opt.name}
                  color="border-encre/20 text-encre bg-carte"
                  selected={selectedBase === opt.id}
                  onClick={() => setSelectedBase(opt.id)}
                />
              ))}
            </div>
          </Section>
        )}

        {/* ─── Suppléments (options payantes) ───────────────── */}
        {extras.length > 0 && (
          <Section title="Suppléments">
            <div className="space-y-2">
              {extras.map(opt => (
                <CheckChip
                  key={opt.id}
                  label={opt.name}
                  extra={opt.extra_price_cents}
                  checked={selectedExtras.has(opt.id)}
                  onChange={checked => {
                    setSelectedExtras(prev => {
                      const next = new Set(prev)
                      if (checked) next.add(opt.id)
                      else next.delete(opt.id)
                      return next
                    })
                  }}
                />
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* ─── Barre action en VERRE — flotte au-dessus du contenu ─ */}
      <div className="glass-footer fixed bottom-0 left-0 right-0 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {/* Bouton ajouter — plein liboke */}
          <Button
            size="lg"
            className="flex-1"
            onClick={handleAdd}
            disabled={added}
          >
            {added ? (
              <>✓ Ajouté !</>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                {weekendDish ? "Précommander" : "Ajouter"} · {formatPrice(totalPrice)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-3">
        {icon}
        <h2 className="font-semibold text-encre text-sm uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function RadioChip({
  label,
  color,
  selected,
  onClick,
}: {
  label: string
  color: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all",
        selected ? color : "border-encre/15 text-encre/60 bg-carte hover:border-encre/30"
      )}
    >
      {label}
    </button>
  )
}

function CheckChip({
  label,
  extra,
  checked,
  onChange,
}: {
  label: string
  extra: number
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all",
        checked
          ? "border-safou bg-safou/10 text-encre"
          : "border-encre/15 bg-carte text-encre/60 hover:border-encre/30"
      )}
    >
      <span>{label}</span>
      <span className={checked ? "text-encre font-semibold" : "text-encre/40"}>
        +{formatPrice(extra)}
      </span>
    </button>
  )
}
