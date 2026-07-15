"use client"

import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import type { Dish } from "@/lib/types"

/* ─────────────────────────────────────────────────────────────────
   Primitives éditoriales partagées
───────────────────────────────────────────────────────────────── */

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-liboke mb-3">
      {children}
    </p>
  )
}

function scrollTo(href: string) {
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" })
}

/* ─────────────────────────────────────────────────────────────────
   Hero plein écran
───────────────────────────────────────────────────────────────── */

export function HomeHero() {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Image de fond */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/poulet-a-la-moambe.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: "var(--overlay-hero)" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-kwanga/60 via-transparent to-kwanga" />

      {/* Contenu */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto animate-fade-up">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-liboke mb-5">
          Bienvenue chez ya Nathy
        </p>
        <h1 className="font-serif text-[42px] sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] text-balance mb-6">
          La cuisine congolaise, sublimée avec élégance
        </h1>
        <p className="text-sm sm:text-base text-encre/75 leading-relaxed max-w-xl mx-auto mb-9">
          Découvrez une cuisine congolaise généreuse et raffinée, préparée avec
          soin à partir de recettes familiales et de spécialités africaines.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={() => scrollTo("#carte")}
            className="w-full sm:w-auto bg-liboke text-white text-xs font-bold uppercase tracking-[0.14em] px-8 h-13 rounded-lg hover:bg-[#ff3a60] transition-colors"
          >
            Commander maintenant
          </button>
          <button
            onClick={() => scrollTo("#carte")}
            className="w-full sm:w-auto bg-transparent border border-white/25 text-white text-xs font-bold uppercase tracking-[0.14em] px-8 h-13 rounded-lg hover:bg-white/10 transition-colors"
          >
            Découvrir la carte
          </button>
        </div>
      </div>

      {/* Indicateur de scroll */}
      <button
        onClick={() => scrollTo("#incontournables")}
        aria-label="Faire défiler vers le contenu"
        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white transition-colors"
      >
        <ChevronDown className="h-6 w-6" />
      </button>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Plats à l'honneur — « Les spécialités de Nathy »
───────────────────────────────────────────────────────────────── */

export function FeaturedDishes({ dishes }: { dishes: Dish[] }) {
  if (dishes.length === 0) return null

  return (
    <section
      id="incontournables"
      aria-labelledby="incontournables-titre"
      className="max-w-[1440px] mx-auto px-5 lg:px-20 py-[clamp(72px,10vw,140px)] scroll-mt-16"
    >
      <SectionLabel>Les incontournables</SectionLabel>
      <h2 id="incontournables-titre" className="font-serif text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-10 lg:mb-14">
        Les spécialités de Nathy
      </h2>

      <div className="flex lg:grid lg:grid-cols-3 gap-5 lg:gap-8 overflow-x-auto lg:overflow-visible scrollbar-none -mx-5 px-5 lg:mx-0 lg:px-0 snap-x snap-mandatory">
        {dishes.slice(0, 3).map(dish => (
          <Link
            key={dish.id}
            href={`/plat/${dish.slug}`}
            className="group shrink-0 w-[78vw] sm:w-96 lg:w-auto snap-start"
          >
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-encre/8">
              {dish.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={dish.image_url}
                  alt={dish.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="h-full w-full bg-carte" />
              )}
              <span className="absolute top-4 right-4 bg-liboke text-white text-xs font-bold px-3 py-1.5 rounded-md tabular-nums">
                {formatPrice(dish.price_cents)}
              </span>
            </div>
            <h3 className="font-serif text-xl font-bold text-white mt-5 mb-1.5">{dish.name}</h3>
            <p className="text-sm text-encre/55 leading-relaxed line-clamp-2 mb-3">
              {dish.description}
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-liboke">
              Voir le détail
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Notre histoire — split-screen
───────────────────────────────────────────────────────────────── */

export function StorySection() {
  return (
    <section
      id="histoire"
      aria-labelledby="histoire-titre"
      className="bg-[#120a0c] scroll-mt-16"
    >
      <div className="max-w-[1440px] mx-auto px-5 lg:px-20 py-[clamp(72px,10vw,140px)] grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <div className="relative aspect-[4/3] lg:aspect-[5/6] rounded-xl overflow-hidden border border-encre/8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/pondu-sauce-arachide.jpg"
            alt="Pondu sauce arachide, plat traditionnel congolais"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <SectionLabel>Notre histoire</SectionLabel>
          <h2 id="histoire-titre" className="font-serif text-3xl lg:text-5xl font-extrabold text-white leading-tight text-balance mb-6">
            Des recettes familiales qui racontent notre héritage
          </h2>
          <p className="text-sm lg:text-base text-encre/60 leading-relaxed max-w-xl mb-4">
            Chez ya Nathy est née de l&apos;envie de partager une cuisine congolaise
            familiale, généreuse et authentique. Chaque plat met à l&apos;honneur
            les saveurs de notre enfance, la convivialité et le plaisir de recevoir.
          </p>
          <p className="text-sm lg:text-base text-encre/60 leading-relaxed max-w-xl">
            Notre carte réunit des spécialités congolaises ainsi que quelques
            recettes africaines soigneusement sélectionnées.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Précommandes du week-end
───────────────────────────────────────────────────────────────── */

export function PreorderSection() {
  return (
    <section
      id="precommandes"
      aria-labelledby="precommandes-titre"
      className="scroll-mt-16"
    >
      <div className="max-w-[1440px] mx-auto px-5 lg:px-20 py-[clamp(72px,10vw,140px)] grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <div className="lg:order-2 relative aspect-[4/3] lg:aspect-[5/6] rounded-xl overflow-hidden border border-encre/8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/liboke-ya-mbisi.jpg"
            alt="Liboke de poisson en feuilles de bananier"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="lg:order-1">
          <SectionLabel>Précommandes du week-end</SectionLabel>
          <h2 id="precommandes-titre" className="font-serif text-3xl lg:text-5xl font-extrabold text-white leading-tight text-balance mb-6">
            Certaines saveurs méritent du temps
          </h2>
          <p className="text-sm lg:text-base text-encre/60 leading-relaxed max-w-xl mb-8">
            Certains plats demandent une préparation plus longue afin de préserver
            toute leur authenticité. Ils sont disponibles le samedi et le dimanche
            et peuvent être précommandés pendant toute la semaine.
          </p>

          <ol className="space-y-4 mb-9">
            {[
              "Choisissez votre plat.",
              "Sélectionnez le samedi ou le dimanche.",
              "Récupérez votre commande ou faites-vous livrer.",
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-4">
                <span className="font-serif text-2xl font-extrabold text-liboke/80 tabular-nums w-9 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm text-encre/70">{step}</span>
              </li>
            ))}
          </ol>

          <button
            onClick={() => scrollTo("#carte")}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-liboke hover:gap-3 transition-all"
          >
            Voir les plats à précommander
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Comment commander — 4 étapes numérotées
───────────────────────────────────────────────────────────────── */

const ORDER_STEPS = [
  { num: "01", title: "Choisissez vos plats",              text: "Parcourez la carte et laissez-vous guider par vos envies." },
  { num: "02", title: "Personnalisez votre commande",      text: "Accompagnements, niveau de piquant, quantités et remarques." },
  { num: "03", title: "Sélectionnez la date et le créneau", text: "Commandez pour aujourd'hui ou précommandez pour le week-end." },
  { num: "04", title: "Livraison ou retrait",              text: "Recevez votre commande ou récupérez-la au moment choisi." },
]

export function HowToOrder() {
  return (
    <section
      id="comment-commander"
      aria-labelledby="commander-titre"
      className="bg-[#120a0c] scroll-mt-16"
    >
      <div className="max-w-[1440px] mx-auto px-5 lg:px-20 py-[clamp(72px,10vw,140px)]">
        <SectionLabel>Commander</SectionLabel>
        <h2 id="commander-titre" className="font-serif text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-12 lg:mb-16">
          Comment commander&nbsp;?
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
          {ORDER_STEPS.map(step => (
            <div key={step.num} className="border-t border-encre/12 pt-6">
              <p className="font-serif text-4xl font-extrabold text-liboke/70 tabular-nums mb-4">
                {step.num}
              </p>
              <h3 className="font-bold text-white text-base mb-2">{step.title}</h3>
              <p className="text-sm text-encre/55 leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Footer
───────────────────────────────────────────────────────────────── */

export function SiteFooter() {
  return (
    <footer className="bg-[#070405] border-t border-encre/8">
      <div className="max-w-[1440px] mx-auto px-5 lg:px-20 pt-16 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12 mb-14">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo_ChezYaNathy.png" alt="Chez ya Nathy" className="h-14 w-auto mb-4" />
            <p className="text-sm text-encre/50 leading-relaxed max-w-xs">
              Cuisine congolaise et spécialités africaines maison, préparées
              avec générosité et le goût de recevoir.
            </p>
          </div>

          <nav aria-label="Navigation pied de page">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-encre/40 mb-4">
              Navigation
            </p>
            <ul className="space-y-2.5">
              {[
                { href: "#carte",             label: "La carte" },
                { href: "#histoire",          label: "Notre histoire" },
                { href: "#precommandes",      label: "Précommandes" },
                { href: "#comment-commander", label: "Comment commander" },
              ].map(link => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="text-sm text-encre/70 hover:text-liboke transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-encre/40 mb-4">
              Commander
            </p>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => scrollTo("#carte")} className="text-sm text-encre/70 hover:text-liboke transition-colors">
                  Commander maintenant
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("#precommandes")} className="text-sm text-encre/70 hover:text-liboke transition-colors">
                  Précommander pour le week-end
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-encre/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-encre/35">
            © {new Date().getFullYear()} Chez ya Nathy — Tous droits réservés
          </p>
          <p className="text-xs text-encre/35">
            Cuisine congolaise &amp; spécialités africaines maison
          </p>
        </div>
      </div>
    </footer>
  )
}
