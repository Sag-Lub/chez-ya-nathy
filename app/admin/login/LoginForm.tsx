"use client"

import { useState } from "react"
import { CircleAlert, Loader2, MailCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { adminLoginEmail } from "@/lib/config"
import { Button } from "@/components/ui/Button"

export function LoginForm({ initialError }: { initialError: string | null }) {
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(initialError)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: sbErr } = await supabase.auth.signInWithOtp({
      email: adminLoginEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    })

    if (sbErr) {
      setError("Impossible d'envoyer le lien. Réessaie dans une minute.")
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="mt-7 rounded-[26px] bg-carte p-6 text-center ring-2 ring-inset ring-encre/10" role="status">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-safou text-encre">
          <MailCheck className="h-8 w-8" aria-hidden />
        </span>
        <p className="mt-4 text-[19px] font-extrabold text-encre">Lien envoyé</p>
        <p className="mt-2 text-[16px] leading-relaxed text-encre/80">
          Ouvre la boîte mail <strong className="break-all text-encre">{adminLoginEmail}</strong> sur cette tablette et touche le lien de connexion.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 rounded-[26px] bg-carte p-6 ring-2 ring-inset ring-encre/10">
      <p className="text-center text-[16px] leading-relaxed text-encre/80">
        Un lien de connexion sera envoyé à<br />
        <strong className="break-all text-encre">{adminLoginEmail}</strong>
      </p>

      {error && (
        <p role="alert" className="mt-4 flex gap-2.5 rounded-[18px] bg-pili p-3.5 text-[15px] font-semibold leading-snug text-white">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Button type="submit" className="mt-5 w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Envoi…
          </>
        ) : (
          "Recevoir le lien"
        )}
      </Button>
    </form>
  )
}
