"use client"

import { useRef, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Banknote,
  Bike,
  CalendarDays,
  Check,
  CircleAlert,
  CreditCard,
  Loader2,
  MapPin,
  ShoppingBag,
  Store,
} from "lucide-react"
import { useCartStore } from "@/store/cart"
import { formatPrice, formatDateLong, formatTimeRange, cn } from "@/lib/utils"
import { canOrderDishForSlot } from "@/lib/preorder"
import { restaurantSettings } from "@/lib/config"
import { Button, buttonClass } from "@/components/ui/Button"
import { DishPhoto } from "@/components/ui/DishPhoto"
import { cartItemOptionLine } from "@/components/cart/CartItem"
import type { DeliveryZone, DeliverySlot } from "@/lib/types"

type Step = 1 | 2 | 3
type OrderKind = "livraison" | "emporter"
type Payment = "carte" | "especes"

const STEPS = ["Coordonnées", "Livraison", "Paiement"]

// ─── Sous-composants ────────────────────────────────────────────

function StepProgress({ current }: { current: Step }) {
  return (
    <ol className="flex gap-2" aria-label="Étapes de la commande">
      {STEPS.map((label, i) => {
        const n = i + 1
        const reached = n <= current
        return (
          <li key={label} className="flex-1" aria-current={n === current ? "step" : undefined}>
            <span className={cn("block h-2 rounded-full transition-colors duration-200", reached ? "bg-liboke" : "bg-encre/12")} />
            <span className={cn("mt-2 block text-[13px] font-bold", n === current ? "text-encre" : "text-encre/70")}>
              {n}. {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

const FIELD =
  "h-14 w-full rounded-[18px] border-2 bg-carte px-4 text-[16px] text-encre placeholder:text-encre/55 transition-colors duration-150 focus:outline-none"

function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[14px] font-semibold text-pili">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

function InputField({
  label,
  hint,
  error,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-bold text-encre">{label}</span>
        {hint && <span className="text-[13px] text-encre/70">{hint}</span>}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-erreur` : undefined}
        className={cn(FIELD, error ? "border-pili" : "border-encre/15 focus:border-liboke")}
        {...props}
      />
      {error && <FieldError id={`${id}-erreur`}>{error}</FieldError>}
    </div>
  )
}

/** Deux grands choix côte à côte (livraison / à emporter, carte / espèces). */
function ChoiceCards<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon: React.ComponentType<{ className?: string }> }[]
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-3">
      {options.map((opt) => {
        const selected = value === opt.value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex min-h-[96px] flex-col items-start justify-between rounded-[22px] p-4 text-left transition-colors duration-150",
              selected ? "bg-encre text-kwanga" : "bg-carte text-encre ring-1 ring-inset ring-encre/12"
            )}
          >
            <Icon className={cn("h-7 w-7", selected ? "text-safou" : "text-braise")} aria-hidden />
            <span className="text-[17px] font-extrabold">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function RecapCard({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit?: () => void
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[22px] bg-carte p-4 ring-1 ring-inset ring-encre/8">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold text-encre">{title}</h2>
        {onEdit && (
          <button type="button" onClick={onEdit} className="-my-2 -mr-2 h-11 rounded-full px-3 text-[14px] font-bold text-braise underline underline-offset-2">
            Modifier
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

// ─── Composant principal ─────────────────────────────────────────

export function OrderForm() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  // Le panier vit dans le navigateur : on attend d'y être avant d'afficher quoi que ce soit
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // ── Étape 1 ───────────────────────────────────────────────────
  const [name,  setName]  = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [errors1, setErrors1] = useState<Record<string, string>>({})

  // ── Étape 2 ───────────────────────────────────────────────────
  const [type,           setType]           = useState<OrderKind>("livraison")
  const [postalCode,     setPostalCode]     = useState("")
  const [zone,           setZone]           = useState<DeliveryZone | null>(null)
  const [zoneError,      setZoneError]      = useState<string | null>(null)
  const [zoneLoading,    setZoneLoading]    = useState(false)
  const [address,        setAddress]        = useState("")
  const [slots,          setSlots]          = useState<DeliverySlot[]>([])
  const [weekendOnlyRestriction, setWeekendOnlyRestriction] = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [errors2, setErrors2] = useState<Record<string, string>>({})
  const zoneRequest = useRef(0)

  // ── Étape 3 ───────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<Payment>("carte")
  const [notes, setNotes] = useState("")

  // ─── Totaux (affichage seulement : le serveur recalcule tout) ──
  const subtotal     = items.reduce((s, i) => s + i.priceCents * i.quantity, 0)
  const deliveryFee  = type === "livraison" ? (zone?.fee_cents ?? 0) : 0
  const total        = subtotal + deliveryFee
  const selectedSlot = slots.find((s) => s.id === selectedSlotId)
  const hasWeekendDish = items.some((i) => i.weekendOnly)

  function goToStep(next: Step) {
    setStep(next)
    setGlobalError(null)
    window.scrollTo({ top: 0 })
  }

  // ─── Validation étape 1 ───────────────────────────────────────
  function validateStep1(): boolean {
    const e: Record<string, string> = {}
    if (name.trim().length < 2) e.name = "Dis-nous comment tu t'appelles"
    if (phone.replace(/\D/g, "").length < 10) e.phone = "Ce numéro semble incomplet (10 chiffres)"
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Cette adresse email semble incorrecte"
    setErrors1(e)
    return Object.keys(e).length === 0
  }

  // ─── Vérification de la zone + chargement des créneaux ────────
  async function checkZone(code: string) {
    const requestId = ++zoneRequest.current
    setZoneLoading(true)
    setZoneError(null)
    setZone(null)
    setSlots([])
    setSelectedSlotId(null)

    // Chargé à la demande : la page s'affiche sans attendre le client Supabase
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()

    const { data } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("postal_code", code)
      .eq("is_active", true)
      .maybeSingle()

    if (requestId !== zoneRequest.current) return // une saisie plus récente a pris le relais

    if (!data) {
      setZoneError("On ne livre pas encore ce code postal. Tu peux choisir « À emporter ».")
      setZoneLoading(false)
      return
    }

    if (subtotal < data.min_order_cents) {
      setZoneError(`Le minimum de commande est de ${formatPrice(data.min_order_cents)} pour ${data.city}. Ajoute un plat ou un accompagnement.`)
      setZoneLoading(false)
      return
    }

    // Créneaux ouverts à partir d'aujourd'hui
    const today = new Date().toISOString().split("T")[0]
    const dishIds = [...new Set(items.map((i) => i.dishId))]
    const [{ data: rawSlots }, { data: cartDishes }] = await Promise.all([
      supabase
        .from("delivery_slots")
        .select("*")
        .eq("is_active", true)
        .gte("slot_date", today)
        .order("slot_date")
        .order("start_time"),
      // Un plat réservé au week-end, ou qui demande un délai de préparation,
      // restreint les créneaux proposés
      supabase.from("dishes").select("id, available_days, lead_time_hours").in("id", dishIds),
    ])

    if (requestId !== zoneRequest.current) return

    const openSlots = ((rawSlots ?? []) as DeliverySlot[]).filter((s) => s.orders_count < s.max_orders)
    const upcomingSlots = openSlots.filter((slot) =>
      canOrderDishForSlot({ available_days: null, lead_time_hours: 0 }, slot)
    )
    const filteredSlots = upcomingSlots.filter((slot) =>
      (cartDishes ?? []).every((d) => canOrderDishForSlot(d, slot))
    )

    setWeekendOnlyRestriction(filteredSlots.length < upcomingSlots.length)
    setSlots(filteredSlots)
    setZone(data as DeliveryZone)
    setZoneLoading(false)
  }

  function handlePostalCode(value: string) {
    const code = value.replace(/\D/g, "").slice(0, 5)
    setPostalCode(code)
    setErrors2({})
    if (code.length === 5) {
      void checkZone(code)
    } else {
      zoneRequest.current++
      setZone(null)
      setZoneError(null)
      setZoneLoading(false)
      setSlots([])
      setSelectedSlotId(null)
    }
  }

  // ─── Validation étape 2 ───────────────────────────────────────
  function validateStep2(): boolean {
    if (type === "emporter") return true
    const e: Record<string, string> = {}
    if (!zone) e.zone = zoneError ? "" : "Indique ton code postal pour vérifier la zone de livraison"
    if (zone && address.trim().length < 5) e.address = "Indique ton adresse complète"
    if (zone && !selectedSlotId) e.slot = "Choisis un créneau de livraison"
    setErrors2(e)
    return Object.keys(e).length === 0
  }

  // ─── Envoi : Stripe (carte) ou création directe (espèces) ─────
  async function handlePay() {
    setSubmitting(true)
    setGlobalError(null)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: items.map((item) => ({
            dishId:            item.dishId,
            quantity:          item.quantity,
            spice:             item.options?.["spice"] ?? null,
            selectedOptionIds: item.selectedOptionIds ?? [],
          })),
          customer:   { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined },
          type,
          postalCode: type === "livraison" ? postalCode : undefined,
          address:    type === "livraison" ? address.trim() : undefined,
          slotId:     type === "livraison" ? selectedSlotId ?? undefined : undefined,
          paymentMethod,
          notes:      notes.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        setGlobalError(data.error ?? "Une erreur est survenue. Réessaie dans un instant.")
        setSubmitting(false)
        return
      }
      // Redirection vers Stripe Checkout (carte) ou directement la confirmation (espèces)
      window.location.href = data.url
    } catch {
      setGlobalError("Impossible de joindre le serveur. Vérifie ta connexion et réessaie.")
      setSubmitting(false)
    }
  }

  // ─── Chargement / panier vide ─────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kwanga" aria-busy="true">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-encre/15 border-t-liboke" role="status" aria-label="Chargement" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-kwanga px-7 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-safou text-encre">
          <ShoppingBag className="h-11 w-11" aria-hidden />
        </span>
        <h1 className="titre mt-6 text-[34px] text-encre">Ton panier est vide</h1>
        <p className="mt-3 max-w-xs text-[16px] leading-relaxed text-encre/70">
          Choisis d&apos;abord un plat sur la carte, puis reviens ici pour commander.
        </p>
        <Link href="/" className={buttonClass("primary", "lg", "mt-7 w-full max-w-xs")}>
          Voir le menu
        </Link>
      </main>
    )
  }

  // ─── Rendu ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-kwanga">
      <header className="mx-auto max-w-lg px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (step === 1 ? router.push("/") : goToStep((step - 1) as Step))}
            aria-label={step === 1 ? "Retour au menu" : "Étape précédente"}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sable text-encre transition-transform duration-150 active:scale-95"
          >
            <ArrowLeft className="h-6 w-6" aria-hidden />
          </button>
          <h1 className="titre text-[30px] text-encre">
            {hasWeekendDish ? "Ta précommande" : "Ta commande"}
          </h1>
        </div>
        <div className="mt-5">
          <StepProgress current={step} />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-7">
        {/* ═══ ÉTAPE 1 : Coordonnées ════════════════════════════════ */}
        {step === 1 && (
          <form
            noValidate
            className="anim-apparait space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (validateStep1()) goToStep(2)
            }}
          >
            <h2 className="titre text-[26px] text-encre">Qui commande&nbsp;?</h2>
            <InputField id="commande-nom" label="Prénom et nom" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Marie Mbala" autoComplete="name" autoCapitalize="words" enterKeyHint="next" error={errors1.name} />
            <InputField id="commande-tel" label="Téléphone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78" autoComplete="tel" enterKeyHint="next" error={errors1.phone} />
            <InputField id="commande-email" label="Email" hint="Facultatif" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="marie@exemple.fr" autoComplete="email" autoCapitalize="none" enterKeyHint="go" error={errors1.email} />
            <p className="text-[14px] leading-relaxed text-encre/70">
              Le téléphone sert à te joindre pour la livraison. L&apos;email, si tu le donnes, reçoit la confirmation et le lien de suivi.
            </p>
            <Button type="submit" className="!mt-6 w-full">Continuer</Button>
          </form>
        )}

        {/* ═══ ÉTAPE 2 : Livraison ══════════════════════════════════ */}
        {step === 2 && (
          <div className="anim-apparait space-y-5">
            <h2 className="titre text-[26px] text-encre">Comment tu la récupères&nbsp;?</h2>
            <ChoiceCards<OrderKind>
              label="Mode de retrait"
              value={type}
              onChange={(v) => { setType(v); setErrors2({}) }}
              options={[
                { value: "livraison", label: "Livraison", icon: Bike },
                { value: "emporter", label: "À emporter", icon: Store },
              ]}
            />

            {type === "emporter" && (
              <div className="flex gap-3 rounded-[22px] bg-sable p-4">
                <Store className="mt-0.5 h-5 w-5 shrink-0 text-braise" aria-hidden />
                <p className="text-[15px] leading-relaxed text-encre">
                  {restaurantSettings.pickupAddress && (
                    <strong className="block font-bold">{restaurantSettings.pickupAddress}</strong>
                  )}
                  Nathy t&apos;appelle après ta commande pour convenir de l&apos;heure de retrait.
                </p>
              </div>
            )}

            {type === "livraison" && (
              <>
                {/* Code postal — vérifié dès le cinquième chiffre */}
                <div>
                  <label htmlFor="commande-cp" className="mb-1.5 block text-[15px] font-bold text-encre">Code postal</label>
                  <div className="relative">
                    <input
                      id="commande-cp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={5}
                      value={postalCode}
                      onChange={(e) => handlePostalCode(e.target.value)}
                      placeholder="69200"
                      aria-describedby="commande-cp-etat"
                      className={cn(FIELD, "pr-12 tabular-nums", zoneError ? "border-pili" : zone ? "border-feuille" : "border-encre/15 focus:border-liboke")}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                      {zoneLoading && <Loader2 className="h-5 w-5 animate-spin text-encre/70" aria-hidden />}
                      {zone && !zoneLoading && <Check className="h-5 w-5 text-feuille" strokeWidth={3} aria-hidden />}
                    </span>
                  </div>
                  <div id="commande-cp-etat" aria-live="polite">
                    {zoneError && <FieldError>{zoneError}</FieldError>}
                    {errors2.zone && !zoneError && <FieldError>{errors2.zone}</FieldError>}
                    {zone && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[14px] font-semibold text-encre">
                        <MapPin className="h-4 w-4 shrink-0 text-feuille" aria-hidden />
                        {zone.city} — livraison {zone.fee_cents > 0 ? formatPrice(zone.fee_cents) : "offerte"}
                      </p>
                    )}
                  </div>
                </div>

                {zone && (
                  <InputField id="commande-adresse" label="Adresse" hint="Bâtiment, étage, digicode" value={address}
                    onChange={(e) => setAddress(e.target.value)} placeholder="12 rue de la Paix, bât. A, 3e étage"
                    autoComplete="street-address" error={errors2.address} />
                )}

                {zone && (
                  <div>
                    <h3 className="mb-2 text-[15px] font-bold text-encre">Créneau de livraison</h3>
                    {weekendOnlyRestriction && slots.length > 0 && (
                      <p className="mb-3 flex gap-2.5 rounded-[18px] bg-sable p-3.5 text-[14px] leading-snug text-encre">
                        <CalendarDays className="mt-0.5 h-[18px] w-[18px] shrink-0 text-pili" aria-hidden />
                        Ton panier contient un plat qui demande du temps : on ne te propose que les créneaux où il peut être prêt.
                      </p>
                    )}
                    {slots.length === 0 ? (
                      <p className="rounded-[18px] bg-sable p-4 text-[15px] leading-relaxed text-encre">
                        Aucun créneau n&apos;est ouvert pour le moment. Reviens un peu plus tard&nbsp;: Nathy en ajoute chaque semaine.
                      </p>
                    ) : (
                      <SlotPicker slots={slots} selectedId={selectedSlotId} onSelect={(id) => { setSelectedSlotId(id); setErrors2({}) }} />
                    )}
                    {errors2.slot && <FieldError>{errors2.slot}</FieldError>}
                  </div>
                )}
              </>
            )}

            <Button className="!mt-7 w-full" onClick={() => { if (validateStep2()) goToStep(3) }}>
              Continuer
            </Button>
          </div>
        )}

        {/* ═══ ÉTAPE 3 : Récapitulatif et paiement ══════════════════ */}
        {step === 3 && (
          <div className="anim-apparait space-y-3">
            <h2 className="titre mb-4 text-[26px] text-encre">On vérifie, puis on paie</h2>

            {/* Panier, avec vignettes */}
            <RecapCard title="Ton panier">
              <ul className="mt-2 space-y-3">
                {items.map((item) => {
                  const optionLine = cartItemOptionLine(item)
                  return (
                    <li key={item.id} className="flex items-center gap-3">
                      <DishPhoto src={item.imageUrl} alt="" size={48} className="h-12 w-12" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold leading-snug text-encre">
                          <span className="tabular-nums">{item.quantity}&nbsp;×</span> {item.name}
                        </p>
                        {optionLine && <p className="line-clamp-2 text-[13px] leading-snug text-encre/70">{optionLine}</p>}
                      </div>
                      <span className="shrink-0 text-[15px] font-bold tabular-nums text-encre">
                        {formatPrice(item.priceCents * item.quantity)}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <dl className="mt-4 space-y-1 border-t-2 border-sable pt-3 text-[15px]">
                <div className="flex justify-between text-encre/75">
                  <dt>Sous-total</dt>
                  <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
                {type === "livraison" && (
                  <div className="flex justify-between text-encre/75">
                    <dt>Livraison</dt>
                    <dd className="tabular-nums">{deliveryFee > 0 ? formatPrice(deliveryFee) : "Offerte"}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between pt-1 font-extrabold text-encre">
                  <dt className="text-[17px]">Total</dt>
                  <dd className="text-[24px] tabular-nums">{formatPrice(total)}</dd>
                </div>
              </dl>
            </RecapCard>

            <RecapCard title="Tes coordonnées" onEdit={() => goToStep(1)}>
              <p className="text-[15px] leading-relaxed text-encre/80">
                {name.trim()} · {phone.trim()}
                {email.trim() && <span className="block break-all">{email.trim()}</span>}
              </p>
            </RecapCard>

            <RecapCard title={type === "livraison" ? "Livraison" : "À emporter"} onEdit={() => goToStep(2)}>
              {type === "livraison" ? (
                <p className="text-[15px] leading-relaxed text-encre/80">
                  {address.trim()}, {postalCode} {zone?.city}
                  {selectedSlot && (
                    <strong className="block font-bold text-encre">
                      {formatDateLong(selectedSlot.slot_date)}, {formatTimeRange(selectedSlot.start_time, selectedSlot.end_time)}
                    </strong>
                  )}
                </p>
              ) : (
                <p className="text-[15px] leading-relaxed text-encre/80">
                  Nathy t&apos;appelle pour convenir de l&apos;heure de retrait.
                </p>
              )}
            </RecapCard>

            {/* Remarque */}
            <div className="pt-2">
              <label htmlFor="commande-remarque" className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-bold text-encre">Un mot pour Nathy&nbsp;?</span>
                <span className="text-[13px] text-encre/70">Facultatif</span>
              </label>
              <textarea
                id="commande-remarque"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Allergie, digicode, précision pour le livreur…"
                className="w-full resize-none rounded-[18px] border-2 border-encre/15 bg-carte px-4 py-3 text-[16px] text-encre placeholder:text-encre/55 transition-colors duration-150 focus:border-liboke focus:outline-none"
              />
            </div>

            {/* Mode de paiement */}
            <div className="pt-2">
              <h2 className="mb-2 text-[15px] font-bold text-encre">Tu paies comment&nbsp;?</h2>
              <ChoiceCards<Payment>
                label="Mode de paiement"
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={[
                  { value: "carte", label: "Carte bancaire", icon: CreditCard },
                  { value: "especes", label: "Espèces", icon: Banknote },
                ]}
              />
              <p className="mt-2.5 text-[14px] leading-relaxed text-encre/70">
                {paymentMethod === "carte"
                  ? "Paiement sécurisé par Stripe : tes données bancaires ne passent pas par nos serveurs."
                  : type === "livraison"
                    ? "Tu règles en espèces au livreur, à la réception. Prévois l'appoint si tu peux."
                    : "Tu règles en espèces au moment du retrait."}
              </p>
            </div>

            <div aria-live="assertive">
              {globalError && (
                <p role="alert" className="flex gap-2.5 rounded-[18px] bg-pili p-4 text-[15px] font-semibold leading-snug text-white">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                  {globalError}
                </p>
              )}
            </div>

            <Button className="!mt-5 w-full" onClick={handlePay} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  {paymentMethod === "carte" ? "Vers le paiement…" : "Envoi en cours…"}
                </>
              ) : paymentMethod === "carte" ? (
                <>Payer {formatPrice(total)}</>
              ) : (
                <>Confirmer · {formatPrice(total)}</>
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── SlotPicker ──────────────────────────────────────────────────

function SlotPicker({
  slots,
  selectedId,
  onSelect,
}: {
  slots: DeliverySlot[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  // Grouper par date (les créneaux arrivent déjà triés par date puis heure)
  const grouped: Record<string, DeliverySlot[]> = {}
  slots.forEach((s) => {
    if (!grouped[s.slot_date]) grouped[s.slot_date] = []
    grouped[s.slot_date].push(s)
  })
  const dates = Object.keys(grouped)

  const selectedSlotDate = slots.find((s) => s.id === selectedId)?.slot_date ?? null
  const [activeDate, setActiveDate] = useState<string>(selectedSlotDate ?? dates[0])
  // Si les créneaux ont été rechargés et que la date active a disparu, retomber sur la première
  const shownDate = grouped[activeDate] ? activeDate : dates[0]

  return (
    <div className="space-y-4">
      {/* ── Jours — défilement horizontal ───────────────────────── */}
      <div role="tablist" aria-label="Jour de livraison" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {dates.map((date) => {
          const d = new Date(date + "T12:00:00")
          const active = date === shownDate
          const hasSelection = selectedSlotDate === date
          return (
            <button
              key={date}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={formatDateLong(date)}
              onClick={() => setActiveDate(date)}
              className={cn(
                "relative flex h-[84px] w-[68px] shrink-0 flex-col items-center justify-center rounded-[20px] transition-colors duration-150",
                active ? "bg-encre text-kwanga" : "bg-carte text-encre ring-1 ring-inset ring-encre/12"
              )}
            >
              <span className={cn("text-[12px] font-bold uppercase", active ? "text-safou" : "text-encre/70")}>
                {new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d).replace(".", "")}
              </span>
              <span className="text-[24px] font-extrabold leading-tight tabular-nums">{d.getDate()}</span>
              <span className={cn("text-[12px] font-semibold", active ? "text-kwanga/85" : "text-encre/70")}>
                {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d).replace(".", "")}
              </span>
              {/* Pastille : un créneau est choisi ce jour-là */}
              {hasSelection && !active && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-liboke" />}
            </button>
          )
        })}
      </div>

      {/* ── Horaires du jour affiché ────────────────────────────── */}
      <div>
        <p className="mb-2 text-[14px] font-semibold text-encre/70 first-letter:uppercase">{formatDateLong(shownDate)}</p>
        <div role="radiogroup" aria-label="Heure de livraison" className="grid grid-cols-2 gap-2">
          {grouped[shownDate].map((slot) => {
            const selected = selectedId === slot.id
            return (
              <button
                key={slot.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(slot.id)}
                className={cn(
                  "flex h-[52px] items-center justify-center gap-2 rounded-full text-[16px] font-bold tabular-nums transition-colors duration-150",
                  selected ? "bg-encre text-kwanga" : "bg-carte text-encre ring-1 ring-inset ring-encre/12"
                )}
              >
                {selected && <Check className="h-4 w-4 text-safou" strokeWidth={3.5} aria-hidden />}
                {formatTimeRange(slot.start_time, slot.end_time)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
