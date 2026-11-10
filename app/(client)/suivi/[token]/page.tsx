import type { Metadata } from "next"
import { TrackingClient } from "./TrackingClient"

// Lien privé : on ne veut pas qu'il soit indexé
export const metadata: Metadata = {
  title: "Suivi de commande",
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ token: string }>
}

/**
 * Suivi sans compte, par public_token.
 * La commande est lue par le navigateur via /api/track/[token] : la clé service role
 * ne sort ainsi jamais de app/api/ (règle d'architecture n° 4).
 */
export default async function SuiviPage({ params }: PageProps) {
  const { token } = await params
  return <TrackingClient token={token} />
}
