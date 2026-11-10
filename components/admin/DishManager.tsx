"use client"

import { useState } from "react"
import { Check, CircleAlert, Loader2, Pencil, Star, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatPrice, cn } from "@/lib/utils"
import { ALLERGENS } from "@/lib/labels"
import { DishPhoto } from "@/components/ui/DishPhoto"
import type { Dish, Category } from "@/lib/types"

/** Champs d'un plat modifiables depuis le tableau de bord. */
type DishPatch = Partial<Omit<Dish, "dish_options" | "id" | "created_at">>

interface Props {
  initialDishes:     Dish[]
  initialCategories: Category[]
}

/** « 13,50 » → 1350. Les prix restent des entiers en centimes ; l'euro n'existe qu'à l'écran. */
function parseEuros(input: string): number | null {
  const clean = input.trim().replace(/\s|€/g, "").replace(",", ".")
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(clean)) return null
  return Math.round(Number(clean) * 100)
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",")
}

const FIELD =
  "w-full rounded-[16px] border-2 border-encre/25 bg-carte px-4 text-[17px] text-encre focus:border-liboke focus:outline-none"

export function DishManager({ initialDishes, initialCategories }: Props) {
  const [supabase] = useState(() => createClient())
  const [dishes,   setDishes]   = useState<Dish[]>(initialDishes)
  const [toggling, setToggling] = useState<string | null>(null)
  const [editing,  setEditing]  = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  /** Écrit une modification, et vérifie qu'elle a bien été acceptée par la base (RLS). */
  async function saveDish(id: string, patch: DishPatch): Promise<boolean> {
    setError(null)
    const { data, error: updateError } = await supabase.from("dishes").update(patch).eq("id", id).select("id")
    if (updateError || !data || data.length === 0) {
      setError("La modification n'a pas été enregistrée. Vérifie la connexion et réessaie.")
      return false
    }
    setDishes((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
    return true
  }

  async function toggleAvailability(dish: Dish) {
    setToggling(dish.id)
    await saveDish(dish.id, { is_available: !dish.is_available })
    setToggling(null)
  }

  const categories = [...initialCategories].sort((a, b) => a.sort_order - b.sort_order)
  const soldOutCount = dishes.filter((d) => !d.is_available).length

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="titre text-[36px] text-encre">Plats</h1>
        <p className="text-[17px] font-semibold text-encre/75">
          {soldOutCount === 0 ? "Tout est disponible" : `${soldOutCount} plat${soldOutCount > 1 ? "s" : ""} épuisé${soldOutCount > 1 ? "s" : ""}`}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 flex gap-2.5 rounded-[18px] bg-pili p-4 text-[16px] font-semibold text-white">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="mt-5 space-y-8">
        {categories.map((cat) => {
          const catDishes = dishes
            .filter((d) => d.category_id === cat.id)
            .sort((a, b) => a.sort_order - b.sort_order)

          if (catDishes.length === 0) return null

          return (
            <section key={cat.id} aria-label={cat.name}>
              <h2 className="text-[18px] font-extrabold text-encre">{cat.name}</h2>
              <ul className="mt-3 grid gap-3 lg:grid-cols-2">
                {catDishes.map((dish) => (
                  <li
                    key={dish.id}
                    className={cn(
                      "rounded-[22px] bg-carte p-4 ring-2 ring-inset",
                      editing === dish.id ? "ring-encre lg:col-span-2" : "ring-encre/12"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <DishPhoto src={dish.image_url} alt="" size={64} className={cn("h-16 w-16", !dish.is_available && "grayscale")} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-[19px] font-extrabold leading-tight text-encre">
                          <span className="truncate">{dish.name}</span>
                          {dish.is_featured && <Star className="h-4 w-4 shrink-0 fill-safou text-safou" aria-label="Populaire" />}
                        </p>
                        <p className="text-[17px] font-bold tabular-nums text-encre/80">{formatPrice(dish.price_cents)}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditing(editing === dish.id ? null : dish.id)}
                        aria-expanded={editing === dish.id}
                        aria-label={`Modifier ${dish.name}`}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-encre text-encre"
                      >
                        {editing === dish.id ? <X className="h-6 w-6" aria-hidden /> : <Pencil className="h-5 w-5" aria-hidden />}
                      </button>

                      {/* Bouton « épuisé » : un toucher suffit */}
                      <button
                        type="button"
                        onClick={() => void toggleAvailability(dish)}
                        disabled={toggling === dish.id}
                        aria-pressed={!dish.is_available}
                        className={cn(
                          "flex h-14 w-[132px] shrink-0 items-center justify-center gap-2 rounded-full text-[17px] font-extrabold transition-colors disabled:opacity-60",
                          dish.is_available ? "bg-feuille text-white" : "bg-pili text-white"
                        )}
                      >
                        {toggling === dish.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        ) : dish.is_available ? (
                          "Disponible"
                        ) : (
                          "Épuisé"
                        )}
                      </button>
                    </div>

                    {editing === dish.id && (
                      <DishEditor
                        dish={dish}
                        onCancel={() => setEditing(null)}
                        onSave={async (patch) => {
                          const ok = await saveDish(dish.id, patch)
                          if (ok) setEditing(null)
                          return ok
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

// ─── Modification rapide ─────────────────────────────────────────

function DishEditor({
  dish,
  onSave,
  onCancel,
}: {
  dish: Dish
  onSave: (patch: DishPatch) => Promise<boolean>
  onCancel: () => void
}) {
  const [price,       setPrice]       = useState(centsToInput(dish.price_cents))
  const [subtitle,    setSubtitle]    = useState(dish.subtitle ?? "")
  const [description, setDescription] = useState(dish.description)
  const [featured,    setFeatured]    = useState(dish.is_featured)
  // null = pas encore renseigné ; [] = aucun allergène
  const [allergens,   setAllergens]   = useState<string[] | null>(dish.allergens ?? null)
  const [saving,      setSaving]      = useState(false)
  const [priceError,  setPriceError]  = useState<string | null>(null)

  const id = `plat-${dish.id}`

  function toggleAllergen(name: string) {
    setAllergens((prev) => {
      const list = prev ?? []
      return list.includes(name) ? list.filter((a) => a !== name) : [...list, name]
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cents = parseEuros(price)
    if (cents === null) {
      setPriceError("Prix invalide. Exemple : 13,50")
      return
    }
    setPriceError(null)
    setSaving(true)
    await onSave({
      price_cents: cents,
      subtitle: subtitle.trim() || null,
      description: description.trim(),
      is_featured: featured,
      allergens,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t-2 border-sable pt-4">
      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div>
          <label htmlFor={`${id}-prix`} className="mb-1.5 block text-[15px] font-bold text-encre">Prix (en euros)</label>
          <input
            id={`${id}-prix`}
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={priceError ? true : undefined}
            className={cn(FIELD, "h-14 tabular-nums", priceError && "border-pili")}
          />
          {priceError && <p role="alert" className="mt-1.5 text-[14px] font-semibold text-pili">{priceError}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-sous-titre`} className="mb-1.5 block text-[15px] font-bold text-encre">Sous-titre</label>
          <input
            id={`${id}-sous-titre`}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={120}
            placeholder="Ex. Poulet à la sauce d'arachide"
            className={cn(FIELD, "h-14")}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-description`} className="mb-1.5 block text-[15px] font-bold text-encre">
          Description <span className="font-normal text-encre/70">— d&apos;abord l&apos;origine, ensuite les ingrédients</span>
        </label>
        <textarea
          id={`${id}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={600}
          className={cn(FIELD, "resize-none py-3")}
        />
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={featured}
        onClick={() => setFeatured((v) => !v)}
        className={cn(
          "flex h-14 w-full items-center gap-3 rounded-[16px] px-4 text-left text-[17px] font-bold",
          featured ? "bg-safou text-encre" : "border-2 border-encre/25 text-encre"
        )}
      >
        <Star className={cn("h-5 w-5", featured && "fill-encre")} aria-hidden />
        <span className="flex-1">Afficher dans « Populaires » sur l&apos;accueil</span>
        <span className="text-[15px]">{featured ? "Oui" : "Non"}</span>
      </button>

      <fieldset>
        <legend className="mb-2 text-[15px] font-bold text-encre">
          Allergènes{" "}
          <span className="font-normal text-encre/70">
            — {allergens === null ? "pas encore renseigné" : allergens.length === 0 ? "aucun" : `${allergens.length} sélectionné${allergens.length > 1 ? "s" : ""}`}
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((name) => {
            const checked = allergens?.includes(name) ?? false
            return (
              <button
                key={name}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggleAllergen(name)}
                className={cn(
                  "flex h-12 items-center gap-1.5 rounded-full px-4 text-[16px] font-bold",
                  checked ? "bg-pili text-white" : "border-2 border-encre/25 text-encre"
                )}
              >
                {checked && <Check className="h-4 w-4" strokeWidth={3.5} aria-hidden />}
                {name}
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAllergens([])}
            className={cn(
              "h-12 rounded-full px-4 text-[16px] font-bold",
              allergens !== null && allergens.length === 0 ? "bg-feuille text-white" : "border-2 border-encre/25 text-encre"
            )}
          >
            Aucun allergène
          </button>
          <button
            type="button"
            onClick={() => setAllergens(null)}
            className={cn(
              "h-12 rounded-full px-4 text-[16px] font-bold",
              allergens === null ? "bg-encre text-kwanga" : "border-2 border-encre/25 text-encre"
            )}
          >
            Pas encore renseigné
          </button>
        </div>
      </fieldset>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-liboke px-5 text-[19px] font-extrabold text-white disabled:opacity-50"
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          Enregistrer
        </button>
        <button type="button" onClick={onCancel} className="h-14 rounded-full border-2 border-encre px-5 text-[17px] font-bold text-encre">
          Fermer
        </button>
      </div>
    </form>
  )
}
