/** Concatène des classes CSS en filtrant les falsy. */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Convertit un prix en centimes en chaîne euros lisible. Ex : 1250 → "12,50 €" */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/**
 * Classes d'affichage d'une photo de plat dans un cercle.
 * Convention : les .png sont des détourés (fond transparent) → contain sur fond blanc ;
 * les autres formats sont des photos pleines → cover.
 */
export function dishImageClass(url: string): string {
  return url.endsWith(".png")
    ? "h-full w-full object-contain p-3 bg-white"
    : "h-full w-full object-cover"
}

/** Formate un créneau ISO en heure française. Ex : "2024-12-15T12:30:00" → "12h30" */
export function formatSlot(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(isoDate))
    .replace(":", "h");
}

/** Formate une date YYYY-MM-DD en libellé court. Ex : "2024-12-21" → "Sam. 21 déc." */
export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00"); // midi pour éviter les décalages UTC
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

/** Formate une date YYYY-MM-DD en libellé long. Ex : "samedi 21 décembre" */
export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

/** Formate une plage horaire HH:MM:SS. Ex : ("18:00:00","18:30:00") → "18h00–18h30" */
export function formatTimeRange(start: string, end: string): string {
  return `${start.slice(0, 5).replace(":", "h")}–${end.slice(0, 5).replace(":", "h")}`;
}
