import { redirect } from "next/navigation"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Logo } from "@/components/brand/Logo"
import { AdminNav } from "@/components/admin/AdminNav"

export const metadata = { robots: { index: false, follow: false } }

/**
 * Garde d'accès du tableau de bord cuisine.
 * Une seule méthode pour les droits admin : profiles.role = 'admin',
 * la même que la fonction SQL is_admin() utilisée par les policies RLS.
 * (/admin/login reste hors de ce layout, sinon : « trop de redirections ».)
 */
export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") redirect("/admin/login?error=acces_refuse")

  return (
    <div className="min-h-screen bg-kwanga">
      <header className="sticky top-0 z-30 border-b-2 border-encre bg-carte">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-4 px-4 md:px-6">
          <Logo height={52} priority />
          <AdminNav />
          <form action="/auth/signout" method="post" className="ml-auto">
            <button
              type="submit"
              className="flex h-12 items-center gap-2 rounded-full px-4 text-[15px] font-bold text-encre transition-colors hover:bg-sable"
            >
              <LogOut className="h-5 w-5" aria-hidden />
              <span className="hidden md:inline">Déconnexion</span>
              <span className="sr-only md:hidden">Déconnexion</span>
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">{children}</main>
    </div>
  )
}
