"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import dynamic from "next/dynamic"
import { storageKeys } from "@/lib/config"

// L'onboarding (logo vectorisé + illustrations) n'est téléchargé qu'à la première visite.
const Onboarding = dynamic(() => import("./Onboarding"), { ssr: false })

export const VEIL_ID = "voile-bienvenue"

/**
 * Script exécuté avant le premier affichage : à la première visite, il montre
 * un voile liboke pour que la marque s'impose tout de suite, sans flash du menu.
 * Par sécurité, le voile se retire tout seul au bout de 6 s : il ne bloque jamais l'app.
 */
export const VEIL_SCRIPT = `try{if(!localStorage.getItem("${storageKeys.onboardingSeen}")){var v=document.getElementById("${VEIL_ID}");v.style.display="block";setTimeout(function(){v.style.display="none"},6000)}}catch(e){}`

function hideVeil() {
  const veil = document.getElementById(VEIL_ID)
  if (veil) veil.style.display = "none"
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
