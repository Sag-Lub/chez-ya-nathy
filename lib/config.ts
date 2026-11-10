// ─────────────────────────────────────────────────────────────────
// Configuration centralisée — Chez ya Nathy
// Toutes les valeurs métier modifiables sont regroupées ici.
// Les champs vides sont à renseigner par Nathy (ne pas inventer).
// ─────────────────────────────────────────────────────────────────

export const branding = {
  name: "Chez ya Nathy",
  tagline: "La cuisine congolaise, livrée avec cœur",
  logo: "/Logo_ChezYaNathy.png",
  /** Zone affichée sur l'accueil — les codes postaux réels sont dans delivery_zones. */
  area: "Lyon et alentours",
}

export const restaurantSettings = {
  name: "Chez ya Nathy",
  /** À renseigner — non publié tant que vide */
  phone: "",
  /** À renseigner — non publié tant que vide */
  email: "",
  /** À renseigner — adresse de retrait, non publiée tant que vide */
  pickupAddress: "",
  /** Politique d'annulation — à renseigner */
  cancellationPolicy: "",
}

/**
 * Adresse qui reçoit le lien magique du tableau de bord cuisine.
 * Ce n'est PAS ce qui donne les droits : les droits admin viennent
 * uniquement de profiles.role = 'admin' (fonction SQL is_admin()).
 */
export const adminLoginEmail = "chezyanathy@gmail.com"

/** Clés de stockage navigateur (rien de sensible n'y est conservé). */
export const storageKeys = {
  onboardingSeen: "nathy-onboarding-seen",
  cart: "chez-ya-nathy-cart",
  /** public_token de la dernière commande — ouvre l'onglet « Suivi ». */
  lastOrderToken: "chez-ya-nathy-derniere-commande",
  kitchenSound: "chez-ya-nathy-cuisine-son",
}

/**
 * Heures limites de précommande pour les plats du week-end.
 * Précommande samedi possible jusqu'au vendredi 18h,
 * précommande dimanche possible jusqu'au samedi 18h.
 * Jours : 0 = dimanche … 6 = samedi (convention JS getDay()).
 */
export const preorderSettings = {
  weekendPreorderEnabled: true,
  timezone: "Europe/Paris",
  saturdayCutoff: { day: 5, hour: 18, minute: 0 }, // vendredi 18h00
  sundayCutoff:   { day: 6, hour: 18, minute: 0 }, // samedi 18h00
}
