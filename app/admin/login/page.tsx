"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Loader2 } from "lucide-react"

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: sbErr } = await supabase.auth.signInWithOtp({
      email: "chezyanathy@gmail.com",
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    })

    if (sbErr) {
      setError("Impossible d'envoyer le lien. Réessayez.")
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-kwanga flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-encre">Nathy Food</h1>
          <p className="text-encre/50 text-sm mt-1">Espace cuisine</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl p-6 text-center space-y-3 shadow-sm">
            <div className="text-4xl">📧</div>
            <p className="font-semibold text-encre">Lien envoyé !</p>
            <p className="text-sm text-encre/60">
              Vérifiez votre boîte mail <strong>chezyanathy@gmail.com</strong> et cliquez sur le lien de connexion.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4 shadow-sm">
            <p className="text-sm text-encre/70 text-center">
              Un lien magique sera envoyé à<br />
              <strong className="text-encre">chezyanathy@gmail.com</strong>
            </p>

            {error && (
              <p className="text-xs text-pili bg-pili/8 rounded-xl px-4 py-3 text-center">{error}</p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</>
                : "Recevoir le lien de connexion"
              }
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
