"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDateLong, formatTimeRange } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Plus, Trash2, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
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

interface Props {
  initialSlots: DeliverySlot[]
}

export function SlotManager({ initialSlots }: Props) {
  const [slots,    setSlots]    = useState<DeliverySlot[]>(initialSlots)
  const [loading,  setLoading]  = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Formulaire création
  const [date,      setDate]      = useState("")
  const [maxOrders, setMaxOrders] = useState(5)
  const [selected,  setSelected]  = useState<Set<string>>(new Set())

  // Générateur en masse
  const [genDays,      setGenDays]      = useState(14)
  const [genWeekdays,  setGenWeekdays]  = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]))
  const [genTimes,     setGenTimes]     = useState<Set<string>>(
    new Set(TIME_SLOTS.map((t) => `${t.start}|${t.end}`))
  )
  const [genMaxOrders, setGenMaxOrders] = useState(5)
  const [generating,   setGenerating]   = useState(false)
  const [genResult,     setGenResult]   = useState<string | null>(null)

  const supabase = createClient()

  // Grouper par date
  const today = new Date().toISOString().split("T")[0]
  const futureSlots = slots
    .filter((s) => s.slot_date >= today)
    .sort((a, b) => a.slot_date.localeCompare(b.slot_date) || a.start_time.localeCompare(b.start_time))

  const grouped: Record<string, DeliverySlot[]> = {}
  futureSlots.forEach((s) => {
    if (!grouped[s.slot_date]) grouped[s.slot_date] = []
    grouped[s.slot_date].push(s)
  })

  // ── Création ──────────────────────────────────────────────────
  const createSlots = useCallback(async () => {
    if (!date || selected.size === 0) return
    setLoading(true)

    const toInsert = Array.from(selected).map((key) => {
      const [start, end] = key.split("|")
      return {
        slot_date:    date,
        start_time:   start,
        end_time:     end,
        max_orders:   maxOrders,
        orders_count: 0,
        is_active:    true,
      }
    })

    const { data, error } = await supabase
      .from("delivery_slots")
      .insert(toInsert)
      .select()

    if (!error && data) {
      setSlots((prev) => [...prev, ...(data as DeliverySlot[])])
      setSelected(new Set())
      setDate("")
    } else {
      console.error("[admin] slot create error:", error)
    }
    setLoading(false)
  }, [date, selected, maxOrders, supabase])

  // ── Génération en masse sur une plage de dates ──────────────────
  const generateSlots = useCallback(async () => {
    if (genWeekdays.size === 0 || genTimes.size === 0) return
    setGenerating(true)
    setGenResult(null)

    const existingKeys = new Set(slots.map((s) => `${s.slot_date}|${s.start_time}`))
    const toInsert: Omit<DeliverySlot, "id">[] = []

    for (let i = 0; i < genDays; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const isoDate = d.toISOString().split("T")[0]
      if (!genWeekdays.has(d.getDay())) continue

      for (const key of genTimes) {
        const [start, end] = key.split("|")
        if (existingKeys.has(`${isoDate}|${start}`)) continue
        toInsert.push({
          slot_date:    isoDate,
          start_time:   start,
          end_time:     end,
          max_orders:   genMaxOrders,
          orders_count: 0,
          is_active:    true,
        })
      }
    }

    if (toInsert.length === 0) {
      setGenResult("Tous ces créneaux existent déjà.")
      setGenerating(false)
      return
    }

    const { data, error } = await supabase
      .from("delivery_slots")
      .insert(toInsert)
      .select()

    if (!error && data) {
      setSlots((prev) => [...prev, ...(data as DeliverySlot[])])
      setGenResult(`${data.length} créneau${data.length > 1 ? "x" : ""} créé${data.length > 1 ? "s" : ""}.`)
    } else {
      console.error("[admin] bulk slot generation error:", error)
      setGenResult("Erreur lors de la génération.")
    }
    setGenerating(false)
  }, [genDays, genWeekdays, genTimes, genMaxOrders, slots, supabase])

  const toggleGenWeekday = (value: number) => {
    setGenWeekdays((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value); else next.add(value)
      return next
    })
  }

  const toggleGenTime = (start: string, end: string) => {
    const key = `${start}|${end}`
    setGenTimes((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  // ── Suppression ───────────────────────────────────────────────
  const deleteSlot = useCallback(async (id: string) => {
    setDeleting(id)
    const { error } = await supabase.from("delivery_slots").delete().eq("id", id)
    if (!error) setSlots((prev) => prev.filter((s) => s.id !== id))
    setDeleting(null)
  }, [supabase])

  const toggleTime = (start: string, end: string) => {
    const key = `${start}|${end}`
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-8">
      {/* ── Génération automatique en masse ─────────────────────── */}
      <div className="bg-carte rounded-2xl p-5 shadow-sm border border-liboke/20 space-y-4">
        <h2 className="font-semibold text-encre flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-liboke" />
          Générer des créneaux à l&apos;avance
        </h2>

        <label className="block">
          <span className="text-sm font-medium text-encre mb-1.5 block">
            Nombre de jours à générer (à partir d&apos;aujourd&apos;hui)
          </span>
          <input
            type="number" min={1} max={90}
            value={genDays}
            onChange={(e) => setGenDays(Number(e.target.value))}
            className="w-24 h-11 px-3 rounded-xl border-2 border-encre/15 focus:border-liboke focus:outline-none text-encre"
          />
        </label>

        <div>
          <span className="text-sm font-medium text-encre mb-2 block">Jours de la semaine</span>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map(({ value, label }) => {
              const active = genWeekdays.has(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleGenWeekday(value)}
                  className={cn(
                    "py-2 rounded-xl border text-xs font-semibold transition-all",
                    active
                      ? "border-liboke bg-liboke/10 text-liboke"
                      : "border-encre/15 text-encre/50 hover:border-encre/30"
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium text-encre mb-2 block">Horaires</span>
          <div className="grid grid-cols-2 gap-2">
            {TIME_SLOTS.map(({ start, end }) => {
              const key    = `${start}|${end}`
              const active = genTimes.has(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleGenTime(start, end)}
                  className={cn(
                    "py-2.5 rounded-xl border text-sm font-medium transition-all",
                    active
                      ? "border-liboke bg-liboke/10 text-liboke"
                      : "border-encre/15 text-encre/70 hover:border-encre/30"
                  )}
                >
                  {formatTimeRange(start, end)}
                </button>
              )
            })}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-encre mb-1.5 block">
            Commandes max par créneau
          </span>
          <input
            type="number" min={1} max={20}
            value={genMaxOrders}
            onChange={(e) => setGenMaxOrders(Number(e.target.value))}
            className="w-24 h-11 px-3 rounded-xl border-2 border-encre/15 focus:border-liboke focus:outline-none text-encre"
          />
        </label>

        <Button
          onClick={generateSlots}
          disabled={generating || genWeekdays.size === 0 || genTimes.size === 0}
          className="w-full"
        >
          {generating
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération…</>
            : <><Sparkles className="h-4 w-4" /> Générer les créneaux</>
          }
        </Button>

        {genResult && (
          <p className="text-sm text-center text-encre/60">{genResult}</p>
        )}
      </div>

      {/* ── Formulaire création manuelle ─────────────────────────── */}
      <div className="bg-carte rounded-2xl p-5 shadow-sm border border-encre/8 space-y-4">
        <h2 className="font-semibold text-encre">Ajouter un créneau ponctuel</h2>

        <label className="block">
          <span className="text-sm font-medium text-encre mb-1.5 block">Date</span>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 px-3 rounded-xl border-2 border-encre/15 focus:border-liboke focus:outline-none text-encre bg-kwanga/50"
          />
        </label>

        <div>
          <span className="text-sm font-medium text-encre mb-2 block">Horaires</span>
          <div className="grid grid-cols-2 gap-2">
            {TIME_SLOTS.map(({ start, end }) => {
              const key     = `${start}|${end}`
              const active  = selected.has(key)
              // Vérifier si ce créneau existe déjà pour cette date
              const exists  = slots.some((s) => s.slot_date === date && s.start_time === start)
              return (
                <button
                  key={key}
                  type="button"
                  disabled={exists}
                  onClick={() => toggleTime(start, end)}
                  className={cn(
                    "py-2.5 rounded-xl border text-sm font-medium transition-all",
                    exists  && "opacity-30 cursor-not-allowed border-encre/10 text-encre/30",
                    !exists && active  && "border-liboke bg-liboke/10 text-liboke",
                    !exists && !active && "border-encre/15 text-encre/70 hover:border-encre/30"
                  )}
                >
                  {formatTimeRange(start, end)}
                  {exists && " ✓"}
                </button>
              )
            })}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-encre mb-1.5 block">
            Commandes max par créneau
          </span>
          <input
            type="number" min={1} max={20}
            value={maxOrders}
            onChange={(e) => setMaxOrders(Number(e.target.value))}
            className="w-24 h-11 px-3 rounded-xl border-2 border-encre/15 focus:border-liboke focus:outline-none text-encre"
          />
        </label>

        <Button
          onClick={createSlots}
          disabled={!date || selected.size === 0 || loading}
          className="w-full"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Création…</>
            : <><Plus className="h-4 w-4" /> Créer {selected.size > 0 ? `${selected.size} créneau${selected.size > 1 ? "x" : ""}` : "les créneaux"}</>
          }
        </Button>
      </div>

      {/* ── Créneaux existants ───────────────────────────────────── */}
      {Object.entries(grouped).length > 0 ? (
        <div className="space-y-5">
          {Object.entries(grouped).map(([d, daySlots]) => (
            <section key={d}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-encre/40 mb-2 px-1">
                {formatDateLong(d)}
              </h3>
              <div className="space-y-2">
                {daySlots.map((slot) => (
                  <div key={slot.id}
                    className="bg-carte rounded-xl px-4 py-3 flex items-center gap-3 border border-encre/8">
                    <div className="flex-1 text-sm">
                      <span className="font-medium text-encre">
                        {formatTimeRange(slot.start_time, slot.end_time)}
                      </span>
                      <span className="text-encre/40 ml-3">
                        {slot.orders_count}/{slot.max_orders} commandes
                      </span>
                    </div>
                    <div className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      slot.orders_count >= slot.max_orders
                        ? "bg-pili/10 text-pili"
                        : "bg-feuille/10 text-feuille"
                    )}>
                      {slot.orders_count >= slot.max_orders ? "Complet" : "Disponible"}
                    </div>
                    {slot.orders_count === 0 && (
                      <button
                        onClick={() => deleteSlot(slot.id)}
                        disabled={deleting === slot.id}
                        className="text-encre/20 hover:text-pili transition-colors p-1"
                      >
                        {deleting === slot.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="text-sm text-encre/40 text-center py-8">
          Aucun créneau à venir. Créez-en un ci-dessus.
        </p>
      )}
    </div>
  )
}
