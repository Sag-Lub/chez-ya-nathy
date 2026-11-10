"use client"

import { useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, CalendarDays, Check, MapPin, Minus, Plus, TriangleAlert } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { formatPrice, cn, isWeekendOnly, culinaryOriginLabel } from "@/lib/utils"
import { getNextAvailableWeekendDate, formatWeekendDate } from "@/lib/preorder"
import { SPICE_LEVELS } from "@/lib/labels"
import { Button } from "@/components/ui/Button"
import { DishPhoto } from "@/components/ui/DishPhoto"
import { PiliScale } from "@/components/ui/icons"
import type { Dish, SpiceLevel, Story } from "@/lib/types"

interface Props {
  dish: Dish & { stories?: Story[] }
}

const noopSubscribe = () => () => {}

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

  const soldOut     = !dish.is_available
  const weekendDish = isWeekendOnly(dish.available_days)
  // Date calculée dans le navigateur uniquement (heure de Paris, change à l'heure limite)
  const nextWeekendDate = useSyncExternalStore(
    noopSubscribe,
    () => (weekendDish ? getNextAvailableWeekendDate() : null),
    () => null
  )

  const extrasPrice = [...selectedExtras].reduce((sum, id) => {
    return sum + (extras.find(o => o.id === id)?.extra_price_cents ?? 0)
  }, 0)
  const unitPrice  = dish.price_cents + extrasPrice
  const totalPrice = unitPrice * quantity

  function goBack() {
    if (window.history.length > 1) router.back()
    else router.push("/")
  }

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
    setTimeout(goBack, 800)
  }

  const origin = culinaryOriginLabel(dish.culinary_origin)

  return (
    <div className="min-h-screen overflow-x-clip bg-kwanga">
      {/* ─── Plateau de couleur : la photo déborde en bas ────────── */}
      <div className="relative h-[196px] rounded-b-[44px] bg-safou">
        <button
          type="button"
          onClick={goBack}
          aria-label="Retour au menu"
          className="absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))] flex h-12 w-12 items-center justify-center rounded-full bg-kwanga text-encre transition-transform duration-150 active:scale-95"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden />
        </button>
      </div>

      <div className="mx-auto max-w-lg px-5 pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
        <div className="-mt-[150px] flex flex-col items-center">
          <DishPhoto
            src={dish.image_url}
            alt={dish.name}
            size={280}
            priority
            tone="liboke"
            className={cn(
              "h-[264px] w-[264px] ring-[8px] ring-kwanga shadow-[0_22px_40px_rgba(43,27,18,0.28)]",
              soldOut && "grayscale"
            )}
          />

          {/* Quantité — pilule à cheval sur la photo */}
          <div className="relative z-10 -mt-7 flex items-center gap-1 rounded-full bg-encre p-1.5 text-kwanga shadow-[0_8px_18px_rgba(43,27,18,0.25)]">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1 || soldOut}
              aria-label="Diminuer la quantité"
              className="flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-150 hover:bg-kwanga/10 disabled:opacity-35"
            >
              <Minus className="h-5 w-5" strokeWidth={2.6} aria-hidden />
            </button>
            <span className="w-9 text-center text-[20px] font-extrabold tabular-nums" aria-live="polite" aria-label={`Quantité : ${quantity}`}>
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(q => Math.min(20, q + 1))}
              disabled={soldOut}
              aria-label="Augmenter la quantité"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-kwanga text-encre transition-transform duration-150 active:scale-95 disabled:opacity-35"
            >
              <Plus className="h-5 w-5" strokeWidth={2.6} aria-hidden />
            </button>
          </div>
        </div>

        {/* ─── Titre, origine, prix ─────────────────────────────── */}
        <div className="mt-5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {origin && (
              <span className="rounded-full bg-sable px-3 py-1.5 text-[13px] font-bold text-encre">{origin}</span>
            )}
            {dish.region && (
              <span className="inline-flex items-center gap-1 rounded-full bg-safou px-3 py-1.5 text-[13px] font-bold text-encre">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {dish.region}
              </span>
            )}
            {weekendDish && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pili px-3 py-1.5 text-[13px] font-bold text-white">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                Week-end
              </span>
            )}
          </div>

          <h1 className="titre mt-3 text-[38px] text-encre text-balance">{dish.name}</h1>
          {dish.subtitle && (
            <p className="mt-2 text-[17px] font-semibold text-encre/75">{dish.subtitle}</p>
          )}
          <p className="mt-2 text-[24px] font-extrabold tabular-nums text-encre">{formatPrice(dish.price_cents)}</p>
        </div>

        <p className="mt-4 text-center text-[16px] leading-relaxed text-encre/80">{dish.description}</p>

        {soldOut && (
          <p className="mt-5 rounded-[22px] bg-encre px-5 py-4 text-center text-[16px] font-bold text-kwanga">
            Épuisé pour aujourd&apos;hui. Reviens vite, Nathy en refait.
          </p>
        )}

        {/* Explication précommande week-end */}
        {weekendDish && !soldOut && (
          <div className="mt-5 flex gap-3 rounded-[22px] bg-sable p-4">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-pili" aria-hidden />
            <p className="text-[15px] leading-relaxed text-encre">
              Ce plat mijote longtemps&nbsp;: il se précommande pour samedi ou dimanche.
              {nextWeekendDate && (
                <strong className="mt-1 block font-bold">
                  Prochaine date&nbsp;: {formatWeekendDate(nextWeekendDate)}
                </strong>
              )}
            </p>
          </div>
        )}

        {/* ─── Histoire du plat ─────────────────────────────────── */}
        {story && <StoryBlock story={story} />}

        {/* ─── Niveau de piquant ────────────────────────────────── */}
        {dish.spice_customizable && (
          <Section title="Ton piquant">
            <div role="radiogroup" aria-label="Niveau de piquant" className="grid grid-cols-2 gap-2.5">
              {SPICE_LEVELS.map(opt => {
                const selected = spice === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSpice(opt.value)}
                    className={cn(
                      "flex min-h-[84px] flex-col items-start justify-between rounded-[20px] p-3.5 text-left transition-colors duration-150",
                      selected ? "bg-encre text-kwanga" : "bg-carte text-encre ring-1 ring-inset ring-encre/12"
                    )}
                  >
                    <PiliScale level={opt.chilis} onDark={selected} />
                    <span>
                      <span className="block text-[16px] font-extrabold leading-tight">{opt.label}</span>
                      <span className={cn("block text-[13px]", selected ? "text-kwanga/80" : "text-encre/70")}>{opt.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Section>
        )}

        {/* ─── Accompagnement (options incluses) ────────────────── */}
        {baseOptions.length > 0 && (
          <Section title="Ton accompagnement" hint="Inclus">
            <div role="radiogroup" aria-label="Accompagnement" className="space-y-2">
              {baseOptions.map(opt => (
                <OptionRow
                  key={opt.id}
                  role="radio"
                  label={opt.name}
                  selected={selectedBase === opt.id}
                  onClick={() => setSelectedBase(opt.id)}
                />
              ))}
            </div>
          </Section>
        )}

        {/* ─── Suppléments (options payantes) ───────────────────── */}
        {extras.length > 0 && (
          <Section title="Des suppléments ?" hint="Facultatif">
            <div className="space-y-2">
              {extras.map(opt => {
                const checked = selectedExtras.has(opt.id)
                return (
                  <OptionRow
                    key={opt.id}
                    role="checkbox"
                    label={opt.name}
                    detail={`+ ${formatPrice(opt.extra_price_cents)}`}
                    selected={checked}
                    onClick={() => {
                      setSelectedExtras(prev => {
                        const next = new Set(prev)
                        if (checked) next.delete(opt.id)
                        else next.add(opt.id)
                        return next
                      })
                    }}
                  />
                )
              })}
            </div>
          </Section>
        )}

        {/* ─── Allergènes ───────────────────────────────────────── */}
        <Section title="Allergènes">
          <AllergensBlock allergens={dish.allergens ?? null} />
        </Section>
      </div>

      {/* ─── Barre d'action en verre — flotte au-dessus du contenu ─ */}
      <div className="fixed inset-x-0 z-40 px-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="verre mx-auto flex max-w-lg items-center gap-3 rounded-full p-2 pl-6 shadow-[0_12px_32px_rgba(43,27,18,0.3)]">
          <p className="shrink-0 leading-tight text-kwanga">
            <span className="block text-[12px] font-semibold text-kwanga/80">Total</span>
            <span className="block text-[20px] font-extrabold tabular-nums" aria-live="polite">{formatPrice(totalPrice)}</span>
          </p>
          <Button className="min-w-0 flex-1" onClick={handleAdd} disabled={added || soldOut}>
            {soldOut ? (
              "Épuisé"
            ) : added ? (
              <>
                <Check className="h-5 w-5" strokeWidth={3} aria-hidden />
                Ajouté
              </>
            ) : weekendDish ? (
              "Précommander"
            ) : (
              "Ajouter au panier"
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
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="titre text-[26px] text-encre">{title}</h2>
        {hint && <span className="text-[14px] font-semibold text-encre/70">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

function OptionRow({
  role,
  label,
  detail,
  selected,
  onClick,
}: {
  role: "radio" | "checkbox"
  label: string
  detail?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-[56px] w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left text-[16px] font-bold transition-colors duration-150",
        selected ? "bg-encre text-kwanga" : "bg-carte text-encre ring-1 ring-inset ring-encre/12"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center border-2",
          role === "radio" ? "rounded-full" : "rounded-[8px]",
          selected ? "border-safou bg-safou text-encre" : "border-encre/35"
        )}
      >
        {selected && <Check className="h-4 w-4" strokeWidth={3.5} />}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      {detail && <span className="shrink-0 tabular-nums">{detail}</span>}
    </button>
  )
}

/** L'histoire du plat : d'abord le texte, puis la version audio quand elle existe. */
function StoryBlock({ story }: { story: Story }) {
  const [open, setOpen] = useState(false)
  const long = story.body.length > 320

  return (
    <section aria-labelledby="histoire-plat" className="mt-8 rounded-[28px] bg-liboke p-6 text-white">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-encre px-3 py-1.5 text-[13px] font-bold text-kwanga">
        <BookOpen className="h-4 w-4" aria-hidden />
        L&apos;histoire du plat
      </p>
      <h2 id="histoire-plat" className="titre mt-4 text-[30px] text-kwanga text-balance">{story.title}</h2>
      <p className={cn("mt-3 whitespace-pre-line text-[19px] font-bold leading-snug", long && !open && "line-clamp-6")}>
        {story.body}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="mt-3 h-11 rounded-full bg-encre px-5 text-[15px] font-bold text-kwanga"
        >
          {open ? "Replier" : "Lire la suite"}
        </button>
      )}
      {story.audio_url && (
        <div className="mt-4">
          <p className="mb-2 text-[19px] font-bold">Écoute l&apos;histoire</p>
          <audio controls preload="none" src={story.audio_url} className="h-11 w-full">
            Ton navigateur ne peut pas lire cet audio.
          </audio>
        </div>
      )}
    </section>
  )
}

function AllergensBlock({ allergens }: { allergens: string[] | null }) {
  if (allergens === null) {
    return (
      <div className="flex gap-3 rounded-[20px] bg-sable p-4">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-pili" aria-hidden />
        <p className="text-[15px] leading-relaxed text-encre">
          La liste n&apos;est pas encore renseignée pour ce plat. Si tu as une allergie,
          écris-le dans la remarque de ta commande&nbsp;: Nathy te répondra avant de cuisiner.
        </p>
      </div>
    )
  }
  if (allergens.length === 0) {
    return (
      <p className="rounded-[20px] bg-sable p-4 text-[15px] leading-relaxed text-encre">
        Aucun des 14 allergènes à déclaration obligatoire dans la recette.
        La cuisine en manipule d&apos;autres&nbsp;: des traces restent possibles.
      </p>
    )
  }
  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {allergens.map(a => (
          <li key={a} className="rounded-full bg-pili px-3.5 py-2 text-[15px] font-bold text-white">{a}</li>
        ))}
      </ul>
      <p className="mt-3 text-[14px] leading-relaxed text-encre/70">
        La cuisine manipule aussi d&apos;autres allergènes&nbsp;: des traces restent possibles.
      </p>
    </div>
  )
}
