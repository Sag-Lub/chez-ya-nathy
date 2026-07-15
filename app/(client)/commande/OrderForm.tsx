"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Banknote, CreditCard, Loader2, MapPin, ShoppingBag, Truck, UtensilsCrossed } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { createClient } from "@/lib/supabase/client"
import { formatPrice, formatDateLong, formatTimeRange } from "@/lib/utils"
import { canOrderDishForDate } from "@/lib/preorder"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import type { DeliveryZone, DeliverySlot } from "@/lib/types"

// ─── Sous-composants ────────────────────────────────────────────

function StepProgress({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Vous", "Livraison", "Récap"]
  return (
    <div className="flex items-center justify-center gap-2 py-5 px-4">
      {steps.map((label, i) => {
        const n      = (i + 1) as 1 | 2 | 3
        const done   = n < current
        const active = n === current
        return (
          <div key={n} className="flex items-center gap-2">
            {i > 0 && (
              <div className={cn("h-px w-8 transition-colors", done ? "bg-liboke" : "bg-encre/15")} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                done   && "bg-liboke text-white",
                active && "bg-liboke text-white ring-4 ring-liboke/20",
                !done && !active && "bg-encre/10 text-encre/40"
              )}>
                {done ? "✓" : n}
              </div>
              <span className={cn("text-[10px] font-medium", active ? "text-liboke" : "text-encre/40")}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InputField({
  label,
  optional,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; optional?: boolean; error?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-encre mb-1.5 flex items-center gap-1">
        {label}
        {optional && <span className="text-encre/40 text-xs font-normal">(facultatif)</span>}
      </span>
      <input
        className={cn(
          "w-full h-12 px-4 rounded-xl border-2 bg-carte text-encre",
          "focus:outline-none transition-colors",
          error ? "border-pili focus:border-pili" : "border-encre/15 focus:border-liboke"
        )}
        {...props}
      />
      {error && <p className="text-xs text-pili mt-1">{error}</p>}
    </label>
  )
}

function TypeToggle({
  value,
  onChange,
}: {
  value: "livraison" | "emporter"
  onChange: (v: "livraison" | "emporter") => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["livraison", "emporter"] as const).map((t) => {
        const Icon = t === "livraison" ? Truck : UtensilsCrossed
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={cn(
              "flex flex-col items-center gap-2 py-5 rounded-2xl border-2 font-semibold text-sm transition-all",
              value === t
                ? "border-liboke bg-liboke/8 text-liboke"
                : "border-encre/15 text-encre/60 hover:border-encre/30 bg-carte"
            )}
          >
            <Icon className="h-6 w-6" />
            {t === "livraison" ? "Livraison" : "À emporter"}
          </button>
        )
      })}
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────

export function OrderForm() {
  const router   = useRouter()
  const items    = useCartStore((s) => s.items)
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // ── Étape 1 ───────────────────────────────────────────────────
  const [name,  setName]  = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [errors1, setErrors1] = useState<Record<string, string>>({})

  // ── Étape 2 ───────────────────────────────────────────────────
  const [type,           setType]           = useState<"livraison" | "emporter">("livraison")
  const [postalCode,     setPostalCode]     = useState("")
  const [zone,           setZone]           = useState<DeliveryZone | null>(null)
  const [zoneError,      setZoneError]      = useState<string | null>(null)
  const [zoneLoading,    setZoneLoading]    = useState(false)
  const [address,        setAddress]        = useState("")
  const [slots,          setSlots]          = useState<DeliverySlot[]>([])
  const [slotsLoading,   setSlotsLoading]   = useState(false)
  const [weekendOnlyRestriction, setWeekendOnlyRestriction] = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [errors2, setErrors2] = useState<Record<string, string>>({})

  // ── Étape 3 ───────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<"carte" | "especes">("carte")
  const [notes, setNotes] = useState("")

  // ─── Totaux ───────────────────────────────────────────────────
  const subtotal     = items.reduce((s, i) => s + i.priceCents * i.quantity, 0)
  const deliveryFee  = type === "livraison" ? (zone?.fee_cents ?? 0) : 0
  const total        = subtotal + deliveryFee
  const selectedSlot = slots.find((s) => s.id === selectedSlotId)

  // ─── Validation étape 1 ───────────────────────────────────────
  function validateStep1(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim() || name.trim().length < 2) e.name = "Votre nom est requis"
    if (!phone.trim() || phone.replace(/\s/g, "").length < 10)
      e.phone = "Numéro de téléphone invalide"
    setErrors1(e)
    return Object.keys(e).length === 0
  }

  // ─── Vérification zone ────────────────────────────────────────
  const checkZone = useCallback(async () => {
    if (!postalCode.match(/^\d{5}$/)) {
      setZoneError("Code postal invalide (5 chiffres)")
      return
    }
    setZoneLoading(true)
    setZoneError(null)
    setZone(null)
    setSlots([])
    setSelectedSlotId(null)

    const { data } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("postal_code", postalCode)
      .eq("is_active", true)
      .maybeSingle()

    if (!data) {
      setZoneError("Zone non desservie. Contactez Nathy si vous êtes proche.")
      setZoneLoading(false)
      return
    }

    if (subtotal < data.min_order_cents) {
      setZoneError(`Commande minimum de ${formatPrice(data.min_order_cents)} pour cette zone.`)
      setZoneLoading(false)
      return
    }

    setZone(data)

    // Chargement des créneaux disponibles
    setSlotsLoading(true)
    const today = new Date().toISOString().split("T")[0]
    const { data: rawSlots } = await supabase
      .from("delivery_slots")
      .select("*")
      .eq("is_active", true)
      .gte("slot_date", today)
      .order("slot_date")
      .order("start_time")

    // Un plat réservé au week-end restreint les jours de livraison proposés
    const dishIds = [...new Set(items.map((i) => i.dishId))]
    const { data: cartDishes } = await supabase
      .from("dishes")
      .select("id, available_days")
      .in("id", dishIds)

    const availableSlots = (rawSlots ?? []).filter((s) => s.orders_count < s.max_orders) as DeliverySlot[]
    const filteredSlots = availableSlots.filter((slot) =>
      (cartDishes ?? []).every((d) => canOrderDishForDate(d.available_days, slot.slot_date))
    )

    setWeekendOnlyRestriction(filteredSlots.length < availableSlots.length)
    setSlots(filteredSlots)
    setSlotsLoading(false)
    setZoneLoading(false)
  }, [postalCode, subtotal, items, supabase])

  // ─── Panier vide — après tous les hooks (Rules of Hooks) ─────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-kwanga flex flex-col items-center justify-center gap-5 px-6">
        <ShoppingBag className="h-14 w-14 text-encre/20" />
        <p className="text-encre/60 text-center text-sm">Votre panier est vide.</p>
        <Link href="/"><Button variant="secondary">Voir le menu</Button></Link>
      </div>
    )
  }

  // ─── Validation étape 2 ───────────────────────────────────────
  function validateStep2(): boolean {
    if (type === "emporter") return true
    const e: Record<string, string> = {}
    if (!zone) e.zone = "Vérifiez votre code postal"
    if (!address.trim()) e.address = "Votre adresse est requise"
    if (!selectedSlotId) e.slot = "Choisissez un créneau de livraison"
    setErrors2(e)
    return Object.keys(e).length === 0
  }

  // ─── Paiement Stripe ─────────────────────────────────────────
  async function handlePay() {
    setSubmitting(true)
    setGlobalError(null)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: items.map((item) => ({
            dishId:           item.dishId,
            quantity:         item.quantity,
            spice:            item.options?.["spice"] ?? null,
            selectedOptionIds: item.selectedOptionIds ?? [],
          })),
          customer: { name, phone, email: email || undefined },
          type,
          postalCode: type === "livraison" ? postalCode : undefined,
          address:    type === "livraison" ? address    : undefined,
          slotId:     type === "livraison" ? selectedSlotId ?? undefined : undefined,
          paymentMethod,
          notes:      notes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setGlobalError(data.error ?? "Une erreur est survenue")
        setSubmitting(false)
        return
      }
      // Redirection vers Stripe Checkout (carte) ou directement la confirmation (espèces)
      window.location.href = data.url
    } catch {
      setGlobalError("Impossible de contacter le serveur. Réessayez.")
      setSubmitting(false)
    }
  }

  // ─── Rendu ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-kwanga">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-kwanga/95 backdrop-blur-sm border-b border-encre/8 h-14 flex items-center px-4">
        <button onClick={() => (step === 1 ? router.back() : setStep((s) => (s - 1) as 1 | 2 | 3))}
          className="p-2 -ml-2 rounded-full hover:bg-encre/5">
          <ArrowLeft className="h-5 w-5 text-encre" />
        </button>
        <span className="font-serif font-bold text-encre ml-2">
          {weekendOnlyRestriction ? "Votre précommande" : "Votre commande"}
        </span>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-24">
        <StepProgress current={step} />

        {/* ═══ ÉTAPE 1 : Coordonnées ════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-4">
            <InputField label="Nom complet" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Marie Dupont" autoComplete="name" error={errors1.name} />
            <InputField label="Téléphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78" autoComplete="tel" error={errors1.phone} />
            <InputField label="Email" type="email" optional value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="marie@exemple.fr" autoComplete="email" />
            <Button size="lg" className="w-full mt-2"
              onClick={() => { if (validateStep1()) setStep(2) }}>
              Continuer →
            </Button>
          </div>
        )}

        {/* ═══ ÉTAPE 2 : Livraison ══════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <TypeToggle value={type} onChange={(v) => { setType(v); setZone(null); setSlots([]); setSelectedSlotId(null) }} />

            {type === "livraison" && (
              <>
                {/* Code postal */}
                <div>
                  <label className="text-sm font-medium text-encre mb-1.5 block">
                    Code postal
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text" inputMode="numeric" maxLength={5}
                      value={postalCode}
                      onChange={(e) => { setPostalCode(e.target.value); setZone(null); setZoneError(null) }}
                      placeholder="69007"
                      className="flex-1 h-12 px-4 rounded-xl border-2 border-encre/15 bg-carte text-encre focus:border-liboke focus:outline-none"
                    />
                    <Button variant="secondary" onClick={checkZone} disabled={zoneLoading}>
                      {zoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vérifier"}
                    </Button>
                  </div>
                  {zoneError && <p className="text-xs text-pili mt-1">{zoneError}</p>}
                  {errors2.zone && !zoneError && <p className="text-xs text-pili mt-1">{errors2.zone}</p>}
                  {zone && (
                    <p className="text-xs text-feuille font-semibold mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {zone.city} — livraison {formatPrice(zone.fee_cents)}
                    </p>
                  )}
                </div>

                {/* Adresse */}
                {zone && (
                  <InputField label="Adresse complète" value={address} onChange={(e) => setAddress(e.target.value)}
                    placeholder="12 rue de la Paix, Bât. A, 3ème étage"
                    autoComplete="street-address" error={errors2.address} />
                )}

                {/* Créneaux */}
                {zone && (
                  <div>
                    <p className="text-sm font-medium text-encre mb-3">Choisir un créneau</p>
                    {weekendOnlyRestriction && (
                      <p className="text-xs text-pili bg-pili/8 rounded-xl px-3 py-2 mb-3">
                        Un ou plusieurs plats de votre panier ne sont livrés que le week-end — seuls ces créneaux sont proposés.
                      </p>
                    )}
                    {slotsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-encre/50">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement des créneaux…
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-encre/50">
                        Aucun créneau disponible pour le moment. Contactez Nathy directement.
                      </p>
                    ) : (
                      <SlotPicker
                        slots={slots}
                        selectedId={selectedSlotId}
                        onSelect={setSelectedSlotId}
                      />
                    )}
                    {errors2.slot && <p className="text-xs text-pili mt-2">{errors2.slot}</p>}
                  </div>
                )}
              </>
            )}

            <Button size="lg" className="w-full"
              onClick={() => { if (validateStep2()) setStep(3) }}>
              Continuer →
            </Button>
          </div>
        )}

        {/* ═══ ÉTAPE 3 : Récapitulatif ══════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Infos client */}
            <div className="bg-carte rounded-2xl p-4 text-sm space-y-0.5">
              <p className="font-semibold text-encre">{name}</p>
              <p className="text-encre/60">{phone}</p>
              {email && <p className="text-encre/60">{email}</p>}
            </div>

            {/* Livraison */}
            <div className="bg-carte rounded-2xl p-4 text-sm space-y-0.5">
              <p className="font-semibold text-encre flex items-center gap-1.5">
                {type === "livraison" ? <Truck className="h-4 w-4 text-liboke" /> : <UtensilsCrossed className="h-4 w-4 text-liboke" />}
                {type === "livraison" ? "Livraison" : "À emporter"}
              </p>
              {type === "livraison" && (
                <>
                  <p className="text-encre/60">{address}, {postalCode}</p>
                  {selectedSlot && (
                    <p className="text-encre/60">
                      {formatDateLong(selectedSlot.slot_date)} ·{" "}
                      {formatTimeRange(selectedSlot.start_time, selectedSlot.end_time)}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Panier */}
            <div className="bg-carte rounded-2xl p-4 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-encre">
                    {item.name}
                    {item.quantity > 1 && <span className="text-encre/50 ml-1">×{item.quantity}</span>}
                  </span>
                  <span className="font-semibold text-encre">{formatPrice(item.priceCents * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-encre/8 pt-2 space-y-1">
                <div className="flex justify-between text-sm text-encre/60">
                  <span>Sous-total</span><span>{formatPrice(subtotal)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-encre/60">
                    <span>Frais de livraison</span><span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-encre pt-1">
                  <span>Total</span>
                  <span className="font-serif text-xl">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Remarques */}
            <label className="block bg-carte rounded-2xl p-4">
              <span className="text-sm font-semibold text-encre mb-1.5 flex items-center gap-1">
                Une remarque pour Nathy ?
                <span className="text-encre/40 text-xs font-normal">(facultatif)</span>
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Allergie, préférence de cuisson, digicode, instructions…"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-encre/15 bg-kwanga/40 text-sm text-encre placeholder:text-encre/35 focus:border-liboke focus:outline-none resize-none"
              />
            </label>

            {/* Mode de paiement */}
            <div className="bg-carte rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-encre">Mode de paiement</p>
              <div className="grid grid-cols-2 gap-3">
                {(["carte", "especes"] as const).map((m) => {
                  const Icon = m === "carte" ? CreditCard : Banknote
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={cn(
                        "flex flex-col items-center gap-2 py-4 rounded-2xl border-2 font-semibold text-sm transition-all",
                        paymentMethod === m
                          ? "border-liboke bg-liboke/8 text-liboke"
                          : "border-encre/15 text-encre/60 hover:border-encre/30 bg-carte"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {m === "carte" ? "Carte bancaire" : "Espèces"}
                    </button>
                  )
                })}
              </div>
              {paymentMethod === "especes" && (
                <p className="text-xs text-encre/50">
                  {type === "livraison"
                    ? "À régler en espèces auprès du livreur."
                    : "À régler en espèces au retrait."
                  }
                </p>
              )}
            </div>

            {globalError && (
              <p className="text-sm text-pili bg-pili/8 rounded-xl px-4 py-3">{globalError}</p>
            )}

            <Button size="lg" className="w-full" onClick={handlePay} disabled={submitting}>
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> {paymentMethod === "carte" ? "Redirection Stripe…" : "Envoi de la commande…"}</>
                : paymentMethod === "carte"
                  ? <>Payer {formatPrice(total)} →</>
                  : <>Confirmer la commande — {formatPrice(total)} →</>
              }
            </Button>

            <p className="text-xs text-encre/40 text-center">
              {paymentMethod === "carte"
                ? "Paiement sécurisé par Stripe. Vos données bancaires ne transitent pas par nos serveurs."
                : "Réglez directement en espèces à la réception de votre commande."
              }
            </p>
          </div>
        )}
      </div>
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
  // Grouper par date (les slots arrivent déjà triés par date puis heure)
  const grouped: Record<string, DeliverySlot[]> = {}
  slots.forEach((s) => {
    if (!grouped[s.slot_date]) grouped[s.slot_date] = []
    grouped[s.slot_date].push(s)
  })
  const dates = Object.keys(grouped)

  const selectedSlotDate = slots.find((s) => s.id === selectedId)?.slot_date ?? null
  const [activeDate, setActiveDate] = useState<string>(selectedSlotDate ?? dates[0])
  // Si les slots ont été rechargés et que la date active a disparu, retomber sur la première
  const shownDate = grouped[activeDate] ? activeDate : dates[0]

  return (
    <div className="space-y-4">
      {/* ── Bandeau calendrier — scroll horizontal ─────────────── */}
      <div className="flex overflow-x-auto scrollbar-none gap-2 -mx-1 px-1 pb-1">
        {dates.map((date) => {
          const d = new Date(date + "T12:00:00")
          const active = date === shownDate
          const hasSelection = selectedSlotDate === date
          return (
            <button
              key={date}
              type="button"
              onClick={() => setActiveDate(date)}
              className={cn(
                "shrink-0 w-16 py-2.5 rounded-2xl border-2 flex flex-col items-center gap-0.5 transition-all",
                active
                  ? "border-liboke bg-liboke text-white shadow-[0_6px_16px_rgba(226,87,43,0.3)]"
                  : "border-encre/12 bg-carte text-encre hover:border-encre/30"
              )}
            >
              <span className={cn("text-[10px] font-semibold uppercase", active ? "text-white/75" : "text-encre/45")}>
                {new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d).replace(".", "")}
              </span>
              <span className="text-lg font-bold leading-none tabular-nums">
                {d.getDate()}
              </span>
              <span className={cn("text-[10px] font-medium", active ? "text-white/75" : "text-encre/45")}>
                {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d).replace(".", "")}
              </span>
              {/* Point : un créneau est choisi ce jour-là */}
              {hasSelection && !active && (
                <span className="h-1.5 w-1.5 rounded-full bg-liboke" />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Horaires du jour sélectionné ────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-encre/50 uppercase tracking-wider mb-2">
          {formatDateLong(shownDate)}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {grouped[shownDate].map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => onSelect(slot.id)}
              className={cn(
                "py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all text-center",
                selectedId === slot.id
                  ? "border-liboke bg-liboke/8 text-liboke"
                  : "border-encre/15 bg-carte text-encre hover:border-encre/30"
              )}
            >
              {formatTimeRange(slot.start_time, slot.end_time)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
