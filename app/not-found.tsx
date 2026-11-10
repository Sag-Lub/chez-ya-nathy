import Link from "next/link"
import { buttonClass } from "@/components/ui/Button"
import { DishPlaceholder } from "@/components/ui/DishPhoto"

export const metadata = { title: "Page introuvable" }

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-kwanga px-7 text-center">
      <span className="relative block h-28 w-28 overflow-hidden rounded-full bg-safou">
        <DishPlaceholder />
      </span>
      <h1 className="titre mt-6 text-[38px] text-encre text-balance">Cette page n&apos;est pas au menu</h1>
      <p className="mt-3 max-w-xs text-[16px] leading-relaxed text-encre/75">
        Le lien est peut-être ancien, ou le plat a quitté la carte.
      </p>
      <Link href="/" className={buttonClass("primary", "lg", "mt-7 w-full max-w-xs")}>
        Voir le menu
      </Link>
    </main>
  )
}
