"use client"

import { useEffect, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MapPinned } from "lucide-react"
import { storageKeys } from "@/lib/config"
import { buttonClass } from "@/components/ui/Button"

function readToken(): string | null {
  try {
    return localStorage.getItem(storageKeys.lastOrderToken)
  } catch {
    return null
  }
}
const noopSubscribe = () => () => {}

export function LastOrderRedirect() {
  const router = useRouter()
  // undefined = pas encore lu (rendu serveur), null = aucune commande
  const token = useSyncExternalStore<string | null | undefined>(noopSubscribe, readToken, () => undefined)

  useEffect(() => {
    if (token) router.replace(`/suivi/${token}`)
  }, [token, router])

  if (token === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-kwanga px-7 pb-nav text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-safou text-encre">
          <MapPinned className="h-11 w-11" aria-hidden />
        </span>
        <h1 className="titre mt-6 text-[34px] text-encre text-balance">Pas encore de commande</h1>
        <p className="mt-3 max-w-xs text-[16px] leading-relaxed text-encre/70">
          Dès que tu commandes, tu retrouves ici le suivi en direct, de la cuisine jusqu&apos;à ta porte.
        </p>
        <Link href="/" className={buttonClass("primary", "lg", "mt-7 w-full max-w-xs")}>
          Voir le menu
        </Link>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-kwanga pb-nav" aria-busy="true">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-encre/15 border-t-liboke" role="status" aria-label="Chargement" />
    </main>
  )
}
