// ─────────────────────────────────────────────────────────────────
// Configuration centralisée — Chez ya Nathy
// Toutes les valeurs métier modifiables sont regroupées ici.
// Les champs vides sont à renseigner par Nathy (ne pas inventer).
// ─────────────────────────────────────────────────────────────────

export const branding = {
  name: "Chez ya Nathy",
  tagline: "Cuisine congolaise et spécialités africaines maison",
  logo: "/Logo_ChezYaNathy.png",
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
