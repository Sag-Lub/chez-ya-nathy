"use client"

import { ChefHat, CalendarClock, Truck, HeartHandshake } from "lucide-react"

/**
 * Hero d'accueil — affiché au-dessus du menu.
 * Le bouton « Commander maintenant » fait défiler jusqu'à la carte.
 */
export function HomeHero() {
  const scrollToMenu = () => {
    document.getElementById("carte")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="max-w-2xl mx-auto px-4 pt-8 pb-2 text-center">
      <p className="text-xs font-bold text-liboke uppercase tracking-[0.18em] mb-3">
        Mbote&nbsp;! Bienvenue chez Chez ya Nathy 👋🏾
      </p>
      <h1 className="font-serif text-[32px] font-bold text-encre leading-[1.12] text-balance mb-3">
        Une cuisine congolaise généreuse,{" "}
        <span className="italic text-liboke">préparée avec amour</span>
      </h1>
      <p className="text-sm text-encre/60 leading-relaxed max-w-md mx-auto mb-6">
        Retrouvez les saveurs de chez nous à travers des plats faits maison,
        généreux et préparés avec soin. Commandez pour une livraison ou un retrait.
      </p>

      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={scrollToMenu}
          className="bg-liboke text-kwanga font-semibold text-sm px-6 py-3.5 rounded-full shadow-[0_8px_20px_rgba(226,87,43,0.35)] hover:bg-liboke/90 active:scale-[0.98] transition-all"
        >
          Commander maintenant
        </button>
        <button
          onClick={scrollToMenu}
          className="bg-white text-encre font-semibold text-sm px-6 py-3.5 rounded-full border border-encre/12 hover:border-encre/30 active:scale-[0.98] transition-all"
        >
          Découvrir la carte
        </button>
      </div>

      {/* Éléments de confiance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
        <TrustItem icon={ChefHat}        label="Fait maison"           detail="Spécialités congolaises" />
        <TrustItem icon={HeartHandshake} label="Préparé avec soin"     detail="Recettes de famille" />
        <TrustItem icon={Truck}          label="Livraison ou retrait"  detail="Au choix, selon vos envies" />
        <TrustItem icon={CalendarClock}  label="Précommande"           detail="Plats du week-end dès le lundi" />
      </div>
    </section>
  )
}

function TrustItem({
  icon: Icon,
  label,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  detail: string
}) {
  return (
    <div className="bg-white rounded-2xl px-3.5 py-3 flex items-start gap-2.5 border border-encre/6">
      <Icon className="h-4 w-4 text-liboke shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-bold text-encre leading-tight">{label}</p>
        <p className="text-[11px] text-encre/50 leading-tight mt-0.5">{detail}</p>
      </div>
    </div>
  )
}

/**
 * Sections informatives — affichées sous le menu.
 * « Comment commander », « À propos ».
 */
export function HomeInfoSections() {
  return (
    <>
      {/* ─── Comment commander ──────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 py-10" aria-labelledby="comment-commander">
        <h2 id="comment-commander" className="font-serif text-xl font-bold text-encre mb-5 text-center">
          Comment commander&nbsp;?
        </h2>
        <ol className="space-y-3">
          {[
            "Choisissez vos plats dans la carte.",
            "Personnalisez votre commande : accompagnements, piquant, quantité.",
            "Choisissez une date et un créneau.",
            "Sélectionnez la livraison ou le retrait.",
            "Confirmez votre commande — vous recevez un lien de suivi.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 bg-white rounded-2xl px-4 py-3.5 border border-encre/6">
              <span className="h-6 w-6 shrink-0 rounded-full bg-liboke text-kwanga text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-encre/75 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-encre/55 leading-relaxed text-center mt-4 max-w-md mx-auto">
          Certains plats demandant une préparation longue sont disponibles
          uniquement le week-end. Ils peuvent être précommandés pendant toute la semaine.
        </p>
      </section>

      {/* ─── À propos ───────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-12" aria-labelledby="a-propos">
        <div className="bg-safou/12 border border-safou/20 rounded-3xl px-6 py-8 text-center">
          <h2 id="a-propos" className="font-serif text-xl font-bold text-encre mb-3">
            À propos de Chez ya Nathy
          </h2>
          <p className="text-sm text-encre/70 leading-relaxed mb-3">
            Chez ya Nathy est une cuisine congolaise familiale née de l&apos;envie
            de partager des plats généreux, authentiques et préparés avec amour.
            Chaque recette met à l&apos;honneur les saveurs de notre enfance, la
            convivialité et le plaisir de bien manger.
          </p>
          <p className="text-sm text-encre/70 leading-relaxed">
            Notre carte réunit des spécialités congolaises ainsi que quelques
            recettes africaines soigneusement sélectionnées.
          </p>
        </div>
      </section>
    </>
  )
}
