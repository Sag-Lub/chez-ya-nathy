"use client"

import { useState } from "react"
import { CalendarPlus, Check, CircleAlert, Loader2, Plus, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { nowInParis } from "@/lib/preorder"
import { formatDateLong, formatTimeRange, cn } from "@/lib/utils"
import type { DeliverySlot } from "@/lib/types"

const TIME_SLOTS = [
  { start: "11:00:00", end: "11:30:00" },
  { start: "11:30:00", end: "12:00:00" },
  { start: "12:00:00", end: "12:30:00" },
  { start: "12:30:00", end: "13:00:00" },
  { start: "18:00:00", end: "18:30:00" },
  { start: "18:30:00", end: "19:00:00" },
  { start: "19:00:00", end: "19:30:00" },
  { start: "19:30:00", end: "20:00:00" },
]

const WEEKDAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 0, label: "Dim" },
]

/** Décale une date YYYY-MM-DD de n jours. */
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00Z")
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split("T")[0]
}

const CARD = "rounded-[22px] bg-carte p-5 ring-2 ring-inset ring-encre/12"
const LABEL = "mb-2 block text-[15px] font-bold text-encre"
const NUMBER = "h-14 w-28 rounded-[16px] border-2 border-encre/25 bg-carte px-4 text-[18px] font-bold tabular-nums text-encre focus:border-liboke focus:outline-none"

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center gap-1.5 rounded-full px-3 text-[16px] font-bold tabular-nums transition-colors",
        disabled && "bg-sable text-encre/60",
        !disabled && active && "bg-encre text-kwanga",
        !disabled && !active && "border-2 border-encre/25 text-encre"
      )}
    >
      {children}
    </button>
  )
}

interface Props {
  initialSlots: DeliverySlot[]
}

export function SlotManager({ initialSlots }: Props) {
  const [supabase] = useState(() => createClient())
  const [slots,    setSlots]    = useState<DeliverySlot[]>(initialSlots)
  const [loading,  setLoading]  = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  // Ajout ponctuel
  const [date,      setDate]      = useState("")
  const [maxOrders, setMaxOrders] = useState(5)
  const [selected,  setSelected]  = useState<Set<string>>(new Set())

  // Génération pour plusieurs jours
  const [genDays,      setGenDays]      = useState(7)
  const [genWeekdays,  setGenWeekdays]  = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]))
  const [genTimes,     setGenTimes]     = useState<Set<string>>(
    new Set(TIME_SLOTS.map((t) => `${t.start}|${t.end}`))
  )
  const [genMaxOrders, setGenMaxOrders] = useState(5)
  const [generating,   setGenerating]   = useState(false)
  const [genResult,    setGenResult]    = useState<string | null>(null)

  // Jour courant à Paris (et non en UTC : sinon décalage d'un jour autour de minuit)
  const today = nowInParis().date

  const futureSlots = slots
    .filter((s) => s.slot_date >= today)
    .sort((a, b) => a.slot_date.localeCompare(b.slot_date) || a.start_time.localeCompare(b.start_time))

  const grouped: Record<string, DeliverySlot[]> = {}
  futureSlots.forEach((s) => {
    if (!grouped[s.slot_date]) grouped[s.slot_date] = []
    grouped[s.slot_date].push(s)
  })

  // ── Ajout ponctuel ────────────────────────────────────────────
  async function createSlots() {
    if (!date || selected.size === 0) return
    setLoading(true)
    setError(null)

    const toInsert = Array.from(selected).map((key) => {
      const [start, end] = key.split("|")
      return { slot_date: date, start_time: start, end_time: end, max_orders: maxOrders, orders_count: 0, is_active: true }
    })

    const { data, error: insertError } = await supabase.from("delivery_slots").insert(toInsert).select()

    if (!insertError && data) {
      setSlots((prev) => [...prev, ...(data as DeliverySlot[])])
      setSelected(new Set())
      setDate("")
    } else {
      setError("Les créneaux n'ont pas été créés. Vérifie la connexion et réessaie.")
    }
    setLoading(false)
  }

  // ── Génération pour plusieurs jours ───────────────────────────
  async function generateSlots() {
    if (genWeekdays.size === 0 || genTimes.size === 0) return
    setGenerating(true)
    setGenResult(null)
    setError(null)

    const existingKeys = new Set(slots.map((s) => `${s.slot_date}|${s.start_time}`))
    const toInsert: Omit<DeliverySlot, "id">[] = []

    for (let i = 0; i < genDays; i++) {
      const isoDate = addDays(today, i)
      const weekday = new Date(isoDate + "T12:00:00Z").getUTCDay()
      if (!genWeekdays.has(weekday)) continue

      for (const key of genTimes) {
        const [start, end] = key.split("|")
        if (existingKeys.has(`${isoDate}|${start}`)) continue
        toInsert.push({ slot_date: isoDate, start_time: start, end_time: end, max_orders: genMaxOrders, orders_count: 0, is_active: true })
      }
    }

    if (toInsert.length === 0) {
      setGenResult("Tous ces créneaux existent déjà.")
      setGenerating(false)
      return
    }

    const { data, error: insertError } = await supabase.from("delivery_slots").insert(toInsert).select()

    if (!insertError && data) {
      setSlots((prev) => [...prev, ...(data as DeliverySlot[])])
      setGenResult(`${data.length} créneau${data.length > 1 ? "x" : ""} créé${data.length > 1 ? "s" : ""}.`)
    } else {
      setError("Les créneaux n'ont pas été créés. Vérifie la connexion et réessaie.")
    }
    setGenerating(false)
  }

  // ── Suppression ───────────────────────────────────────────────
  async function deleteSlot(id: string) {
    setDeleting(id)
    setError(null)
    const { error: deleteError } = await supabase.from("delivery_slots").delete().eq("id", id)
    if (!deleteError) setSlots((prev) => prev.filter((s) => s.id !== id))
    else setError("Ce créneau n'a pas pu être supprimé.")
    setDeleting(null)
  }

  const toggleIn = <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) =>
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })

  return (
    <div>
      <h1 className="titre text-[36px] text-encre">Créneaux de livraison</h1>

      {error && (
        <p role="alert" className="mt-4 flex gap-2.5 rounded-[18px] bg-pili p-4 text-[16px] font-semibold text-white">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* ── Créneaux de la semaine ──────────────────────────────── */}
        <section className={CARD} aria-labelledby="creneaux-semaine">
          <h2 id="creneaux-semaine" className="flex items-center gap-2 text-[20px] font-extrabold text-encre">
            <CalendarPlus className="h-5 w-5" aria-hidden />
            Ouvrir les prochains jours
          </h2>

          <div className="mt-4 flex flex-wrap gap-5">
            <label>
              <span className={LABEL}>Nombre de jours</span>
              <input type="number" inputMode="numeric" min={1} max={90} value={genDays}
                onChange={(e) => setGenDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))} className={NUMBER} />
            </label>
            <label>
              <span className={LABEL}>Commandes max par créneau</span>
              <input type="number" inputMode="numeric" min={1} max={20} value={genMaxOrders}
                onChange={(e) => setGenMaxOrders(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className={NUMBER} />
            </label>
          </div>

          <div className="mt-4">
            <span className={LABEL}>Jours de la semaine</span>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map(({ value, label }) => (
                <Chip key={value} active={genWeekdays.has(value)} onClick={() => toggleIn(setGenWeekdays, value)}>
                  {label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <span className={LABEL}>Horaires</span>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map(({ start, end }) => {
                const key = `${start}|${end}`
                return (
                  <Chip key={key} active={genTimes.has(key)} onClick={() => toggleIn(setGenTimes, key)}>
                    {formatTimeRange(start, end)}
                  </Chip>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void generateSlots()}
            disabled={generating || genWeekdays.size === 0 || genTimes.size === 0}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-liboke text-[19px] font-extrabold text-white disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <CalendarPlus className="h-5 w-5" aria-hidden />}
            Créer les créneaux
          </button>

          <p className="mt-3 min-h-6 text-center text-[16px] font-semibold text-encre" aria-live="polite">{genResult}</p>
        </section>

        {/* ── Ajout ponctuel ──────────────────────────────────────── */}
        <section className={CARD} aria-labelledby="creneau-ponctuel">
          <h2 id="creneau-ponctuel" className="flex items-center gap-2 text-[20px] font-extrabold text-encre">
            <Plus className="h-5 w-5" aria-hidden />
            Ajouter un jour précis
          </h2>

          <div className="mt-4 flex flex-wrap gap-5">
            <label>
              <span className={LABEL}>Date</span>
              <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)}
                className="h-14 rounded-[16px] border-2 border-encre/25 bg-carte px-4 text-[17px] font-bold text-encre focus:border-liboke focus:outline-none" />
            </label>
            <label>
              <span className={LABEL}>Commandes max par créneau</span>
              <input type="number" inputMode="numeric" min={1} max={20} value={maxOrders}
                onChange={(e) => setMaxOrders(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className={NUMBER} />
            </label>
          </div>

          <div className="mt-4">
            <span className={LABEL}>Horaires</span>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map(({ start, end }) => {
                const key = `${start}|${end}`
                // Ce créneau existe-t-il déjà pour cette date ?
                const exists = slots.some((s) => s.slot_date === date && s.start_time === start)
                return (
                  <Chip key={key} active={selected.has(key)} disabled={exists} onClick={() => toggleIn(setSelected, key)}>
                    {formatTimeRange(start, end)}
                    {exists && <Check className="h-4 w-4" strokeWidth={3} aria-label="déjà créé" />}
                  </Chip>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void createSlots()}
            disabled={!date || selected.size === 0 || loading}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-encre text-[19px] font-extrabold text-kwanga disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Plus className="h-5 w-5" aria-hidden />}
            {selected.size > 0 ? `Ajouter ${selected.size} créneau${selected.size > 1 ? "x" : ""}` : "Ajouter"}
          </button>
        </section>
      </div>

      {/* ── Créneaux ouverts ─────────────────────────────────────── */}
      <section className="mt-8" aria-labelledby="creneaux-ouverts">
        <h2 id="creneaux-ouverts" className="text-[18px] font-extrabold text-encre">
          Créneaux ouverts ({futureSlots.length})
        </h2>

        {Object.keys(grouped).length === 0 ? (
          <p className="mt-3 rounded-[22px] bg-carte p-8 text-center text-[18px] font-semibold text-encre/75 ring-2 ring-inset ring-encre/10">
            Aucun créneau à venir : les clients ne peuvent pas commander en livraison.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {Object.entries(grouped).map(([day, daySlots]) => (
              <div key={day} className={CARD}>
                <h3 className="text-[19px] font-extrabold text-encre first-letter:uppercase">{formatDateLong(day)}</h3>
                <ul className="mt-3 space-y-2">
                  {daySlots.map((slot) => {
                    const full = slot.orders_count >= slot.max_orders
                    return (
                      <li key={slot.id} className="flex min-h-12 items-center gap-3">
                        <span className="w-[136px] text-[18px] font-extrabold tabular-nums text-encre">
                          {formatTimeRange(slot.start_time, slot.end_time)}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-[15px] font-bold tabular-nums",
                            full ? "bg-pili text-white" : slot.orders_count > 0 ? "bg-safou text-encre" : "bg-sable text-encre"
                          )}
                        >
                          {slot.orders_count}/{slot.max_orders}{full ? " · complet" : ""}
                        </span>
                        {slot.orders_count === 0 ? (
                          <button
                            type="button"
                            onClick={() => void deleteSlot(slot.id)}
                            disabled={deleting === slot.id}
                            aria-label={`Supprimer le créneau ${formatTimeRange(slot.start_time, slot.end_time)} du ${formatDateLong(day)}`}
                            className="ml-auto flex h-12 w-12 items-center justify-center rounded-full text-pili transition-colors hover:bg-pili hover:text-white disabled:opacity-50"
                          >
                            {deleting === slot.id ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Trash2 className="h-5 w-5" aria-hidden />}
                          </button>
                        ) : (
                          <span className="ml-auto text-[14px] font-semibold text-encre/70">déjà réservé</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
