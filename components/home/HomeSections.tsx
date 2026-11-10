import { ArrowRight, CalendarDays, MapPin } from "lucide-react"
import { branding } from "@/lib/config"
import { Logo } from "@/components/brand/Logo"
import { DishPhoto } from "@/components/ui/DishPhoto"
import { Frise } from "@/components/ui/icons"
import { buttonClass } from "@/components/ui/Button"
import type { Dish } from "@/lib/types"

/* ─────────────────────────────────────────────────────────────────
   En-tête : logo + zone de livraison
───────────────────────────────────────────────────────────────── */

export function HomeHeader() {
  return (
    <header className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] lg:px-0">
      <Logo height={60} priority />
      <p className="inline-flex h-11 items-center gap-1.5 rounded-full bg-sable px-4 text-[14px] font-bold text-encre">
        <MapPin className="h-4 w-4 text-braise" aria-hidden />
        {branding.area}
      </p>
    </header>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Accroche : aplat liboke, photo ronde qui déborde, frise du bracelet
───────────────────────────────────────────────────────────────── */

export function HomeHero({ dish }: { dish: Dish | null }) {
  return (
    <section className="relative mx-4 mt-6 rounded-[32px] bg-liboke lg:mx-0">
      {/* La marge droite réserve la place de la photo, quelle que soit la largeur du téléphone */}
      <div className="pb-[68px] pl-6 pr-[calc(min(38vw,168px)-4px)] pt-7 lg:pb-24 lg:pl-10 lg:pr-[320px] lg:pt-12">
        <h1>
          <span className="titre block whitespace-nowrap text-[clamp(44px,12.3vw,54px)] text-kwanga lg:text-[84px]">
            Mbote&nbsp;!
          </span>
          <span className="mt-2 block text-[21px] font-bold leading-[1.15] text-white lg:text-[28px]">
            Une faim de chez nous&nbsp;?
          </span>
        </h1>
      </div>

      {/* Photo : elle dépasse du bloc en haut et à droite */}
      <div className="absolute -right-3 -top-5 lg:right-10 lg:-top-8">
        <DishPhoto
          src={dish?.image_url}
          alt={dish?.name ?? ""}
          size={168}
          sizes="(min-width: 1024px) 260px, 168px"
          priority
          tone="safou"
          className="h-[min(38vw,168px)] w-[min(38vw,168px)] ring-[6px] ring-kwanga shadow-[0_16px_28px_rgba(43,27,18,0.28)] lg:h-[260px] lg:w-[260px]"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 overflow-hidden rounded-b-[32px] text-kwanga">
        <Frise height={38} />
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Précommandes du week-end — aplat encre
───────────────────────────────────────────────────────────────── */

export function PreorderBanner({ onShow }: { onShow: () => void }) {
  return (
    <section aria-labelledby="precommandes-titre" className="mx-4 mt-12 rounded-[30px] bg-encre p-6 text-kwanga lg:mx-0 lg:p-10">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-safou px-3 py-1.5 text-[13px] font-bold text-encre">
        <CalendarDays className="h-4 w-4" aria-hidden />
        Samedi et dimanche
      </p>
      <h2 id="precommandes-titre" className="titre mt-4 text-[32px] text-balance lg:text-[44px]">
        Les plats mijotés se précommandent
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-kwanga/85">
        Certains plats demandent des heures de cuisson. Nathy les prépare le week-end&nbsp;:
        choisis ton plat dans la semaine, puis ton jour, samedi ou dimanche.
      </p>
      <button type="button" onClick={onShow} className={buttonClass("clair", "md", "mt-5")}>
        Voir les plats du week-end
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Notre histoire — aplat safou
───────────────────────────────────────────────────────────────── */

export function StoryCard() {
  return (
    <section aria-labelledby="histoire-titre" className="mx-4 mt-4 rounded-[30px] bg-safou p-6 text-encre lg:mx-0 lg:p-10">
      <h2 id="histoire-titre" className="titre text-[32px] text-balance lg:text-[44px]">
        Ya Nathy, la grande sœur
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed">
        «&nbsp;Ya&nbsp;», c&apos;est la grande sœur en lingala. Ici, Nathy cuisine comme à la maison&nbsp;:
        les plats de notre enfance, mijotés le temps qu&apos;il faut, et livrés par la famille.
      </p>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Pied de page
───────────────────────────────────────────────────────────────── */

export function SiteFooter() {
  return (
    <footer className="mt-10 px-4 text-center lg:px-0">
      <p className="text-[13px] text-encre/70">
        © {new Date().getFullYear()} {branding.name} — cuisine congolaise faite maison
      </p>
    </footer>
  )
}
