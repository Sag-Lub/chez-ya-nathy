import { storageKeys } from "@/lib/config"

// Constantes partagées entre le layout racine (serveur) et l'onboarding (navigateur).

export const VEIL_ID = "voile-bienvenue"
export const FIRST_VISIT_CLASS = "premiere-visite"

/**
 * Script placé au tout début de <body> (app/layout.tsx), exécuté avant le premier affichage.
 * À la première visite de l'accueil, il pose la classe « premiere-visite » sur <html> :
 * le voile liboke (#voile-bienvenue) s'affiche alors tout de suite, sans flash du menu.
 * Par sécurité, la classe se retire toute seule au bout de 6 s : le voile ne bloque jamais l'app.
 */
export const FIRST_VISIT_SCRIPT = `try{if(location.pathname==="/"&&!localStorage.getItem("${storageKeys.onboardingSeen}")){var h=document.documentElement;h.classList.add("${FIRST_VISIT_CLASS}");setTimeout(function(){h.classList.remove("${FIRST_VISIT_CLASS}")},6000)}}catch(e){}`
