"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import dynamic from "next/dynamic"
import { storageKeys } from "@/lib/config"
import { FIRST_VISIT_CLASS } from "./first-visit"

// L'onboarding (logo vectorisé + illustrations) n'est téléchargé qu'à la première visite.
const Onboarding = dynamic(() => import("./Onboarding"), { ssr: false })

function hideVeil() {
  document.documentElement.classList.remove(FIRST_VISIT_CLASS)
}

function readSeen(): boolean {
  try {
    return localStorage.getItem(storageKeys.onboardingSeen) !== null
  } catch {
    return true // stockage indisponible : on ne bloque pas l'app
  }
}

const noopSubscribe = () => () => {}

/**
 * Affiche l'onboarding à la première visite seulement (mémorisé dans le navigateur).
 * À placer sur l'accueil, avec le voile et son script (voir app/(client)/page.tsx).
 */
export function OnboardingGate() {
  // Côté serveur : « déjà vu », pour ne rien afficher avant de connaître le navigateur
  const seen = useSyncExternalStore(noopSubscribe, readSeen, () => true)
  const [closed, setClosed] = useState(false)

  const handleDone = useCallback(() => {
    try {
      localStorage.setItem(storageKeys.onboardingSeen, "true")
    } catch { /* stockage indisponible */ }
    hideVeil()
    setClosed(true)
  }, [])

  // Visiteur déjà venu : on retire le voile. On relit le navigateur ici, car
  // pendant l'hydratation `seen` vaut encore la valeur du serveur.
  useEffect(() => {
    if (readSeen()) hideVeil()
  }, [])

  if (seen || closed) return null
  return <Onboarding onDone={handleDone} />
}
