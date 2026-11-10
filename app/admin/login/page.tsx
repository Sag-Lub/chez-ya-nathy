import { Logo } from "@/components/brand/Logo"
import { LoginForm } from "./LoginForm"

export const metadata = { title: "Espace cuisine", robots: { index: false, follow: false } }

const ERRORS: Record<string, string> = {
  lien_invalide: "Ce lien de connexion n'est plus valable. Demande-en un nouveau.",
  acces_refuse: "Ce compte n'a pas accès à l'espace cuisine.",
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-kwanga px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Logo height={120} priority />
          <h1 className="titre mt-5 text-[34px] text-encre">Espace cuisine</h1>
        </div>
        <LoginForm initialError={error ? ERRORS[error] ?? null : null} />
      </div>
    </main>
  )
}
