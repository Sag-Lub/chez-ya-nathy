import type { OrderStatus, OrderType, SpiceLevel } from "@/lib/types"

// Libellés partagés entre le site, le tableau de bord cuisine et les emails.

export const SPICE_LEVELS: { value: SpiceLevel; label: string; hint: string; chilis: 0 | 1 | 2 | 3 }[] = [
  { value: "doux",             label: "Doux",             hint: "Sans piment",       chilis: 0 },
  { value: "moyen",            label: "Moyen",            hint: "Un peu relevé",     chilis: 1 },
  { value: "fort",             label: "Fort",             hint: "Bien relevé",       chilis: 2 },
  { value: "pili_pili_a_part", label: "Pili-pili à part", hint: "Tu doses toi-même", chilis: 3 },
]

export function spiceLabel(spice: string | null | undefined): string | null {
  return SPICE_LEVELS.find((s) => s.value === spice)?.label ?? null
}

/** Les cinq étapes du suivi, dans l'ordre. */
export const ORDER_STEPS: OrderStatus[] = ["recue", "confirmee", "en_cuisine", "en_livraison", "livree"]

/** Libellé d'un statut. « En livraison » devient « Prête » pour une commande à emporter. */
export function statusLabel(status: OrderStatus, type: OrderType = "livraison"): string {
  switch (status) {
    case "recue":        return "Reçue"
    case "confirmee":    return "Confirmée"
    case "en_cuisine":   return "En cuisine"
    case "en_livraison": return type === "emporter" ? "Prête" : "En livraison"
    case "livree":       return type === "emporter" ? "Récupérée" : "Livrée"
    case "annulee":      return "Annulée"
  }
}

/** Phrase courte qui accompagne le statut sur la page de suivi. */
export function statusSentence(status: OrderStatus, type: OrderType = "livraison"): string {
  switch (status) {
    case "recue":        return "Nathy a bien reçu ta commande."
    case "confirmee":    return "C'est noté, ta commande est acceptée."
    case "en_cuisine":   return "Ça mijote en cuisine."
    case "en_livraison": return type === "emporter" ? "C'est prêt, tu peux venir la chercher." : "Ta commande est en route."
    case "livree":       return type === "emporter" ? "Commande récupérée. Bon appétit !" : "Commande livrée. Bon appétit !"
    case "annulee":      return "Cette commande a été annulée."
  }
}

/** Les 14 allergènes à déclaration obligatoire (règlement européen INCO). */
export const ALLERGENS = [
  "Gluten",
  "Crustacés",
  "Œufs",
  "Poisson",
  "Arachides",
  "Soja",
  "Lait",
  "Fruits à coque",
  "Céleri",
  "Moutarde",
  "Sésame",
  "Sulfites",
  "Lupin",
  "Mollusques",
] as const
