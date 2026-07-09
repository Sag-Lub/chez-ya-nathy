import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAIL = "chezyanathy@gmail.com"

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-encre/5">
      <header className="bg-encre text-white h-14 flex items-center px-4 gap-6 sticky top-0 z-30">
        <span className="font-serif font-bold text-liboke text-lg">Nathy Food</span>
        <nav className="flex gap-4 text-sm">
          <a href="/admin"          className="text-white/70 hover:text-white transition-colors">Commandes</a>
          <a href="/admin/plats"    className="text-white/70 hover:text-white transition-colors">Plats</a>
          <a href="/admin/creneaux" className="text-white/70 hover:text-white transition-colors">Créneaux</a>
        </nav>
        <form action="/auth/signout" method="post" className="ml-auto">
          <button className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Déconnexion
          </button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  )
}
