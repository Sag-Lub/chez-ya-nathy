import { preorderSettings } from "@/lib/config"

// ─────────────────────────────────────────────────────────────────
// Logique métier des précommandes week-end.
// Toutes les décisions de date se prennent en heure de Paris,
// que le code tourne dans le navigateur ou sur un serveur UTC.
// ─────────────────────────────────────────────────────────────────

/** Date et heure courantes en Europe/Paris, décomposées. */
export function nowInParis(): { date: string; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: preorderSettings.timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
    weekday: "short",
  }).formatToParts(new Date())

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  const dayMap: Record<string, number> = { "dim.": 0, "lun.": 1, "mar.": 2, "mer.": 3, "jeu.": 4, "ven.": 5, "sam.": 6 }

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    day: dayMap[get("weekday")] ?? new Date().getDay(),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  }
}

/** Jour de semaine (0=dim … 6=sam) d'une date YYYY-MM-DD, stable quel que soit le fuseau. */
export function dayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T12:00:00").getDay()
}

/** Décale une date YYYY-MM-DD de n jours. */
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00")
  d.setDate(d.getDate() + n)
  return d.toISOString().split("T")[0]
}

/**
 * L'heure limite de précommande est-elle dépassée pour une date de
 * récupération donnée (samedi ou dimanche) ?
 * - samedi : limite le vendredi précédent à 18h (configurable)
 * - dimanche : limite le samedi précédent à 18h (configurable)
 * Pour une date qui n'est pas un week-end, retourne false (non concerné).
 */
export function isPreorderCutoffReached(slotDate: string): boolean {
  if (!preorderSettings.weekendPreorderEnabled) return false

  const target = dayOfWeek(slotDate)
  const cutoff = target === 6 ? preorderSettings.saturdayCutoff
              : target === 0 ? preorderSettings.sundayCutoff
              : null
  if (!cutoff) return false

  // Date calendaire du jour de cutoff (ex: le vendredi précédant ce samedi)
  const offset = target === 6
    ? cutoff.day - 6            // vendredi (5) - samedi (6) = -1
    : cutoff.day - 7            // samedi (6) - dimanche (0=7) = -1
  const cutoffDate = addDays(slotDate, offset)

  const now = nowInParis()
  if (now.date > cutoffDate) return true
  if (now.date < cutoffDate) return false
  return now.hour > cutoff.hour || (now.hour === cutoff.hour && now.minute >= cutoff.minute)
}

/**
 * Une date de récupération est-elle commandable pour un plat donné ?
 * Combine jours autorisés (available_days) et heure limite de précommande.
 */
export function canOrderDishForDate(availableDays: number[] | null, slotDate: string): boolean {
  if (availableDays && !availableDays.includes(dayOfWeek(slotDate))) return false
  const isWeekendDish = !!availableDays
  if (isWeekendDish && isPreorderCutoffReached(slotDate)) return false
  return true
}

/**
 * Prochaine date de week-end encore précommandable (samedi ou dimanche),
 * en tenant compte des heures limites. Cherche sur 3 semaines.
 */
export function getNextAvailableWeekendDate(): string | null {
  const today = nowInParis().date
  for (let i = 0; i <= 21; i++) {
    const d = addDays(today, i)
    const dow = dayOfWeek(d)
    if ((dow === 6 || dow === 0) && !isPreorderCutoffReached(d)) return d
  }
  return null
}

/** Libellé court d'une date pour l'affichage. Ex : "samedi 18 juillet" */
export function formatWeekendDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
    timeZone: preorderSettings.timezone,
  }).format(new Date(dateStr + "T12:00:00"))
}
