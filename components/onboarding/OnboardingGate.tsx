"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "nathy-onboarding-seen"

// ─── Illustrations SVG ────────────────────────────────────────────

function IlloBol() {
  return (
    <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Bol */}
      <ellipse cx="80" cy="90" rx="54" ry="14" fill="#F4A93B" opacity=".35" />
      <path d="M30 72 Q30 108 80 108 Q130 108 130 72 Z" fill="#E2572B" />
      <ellipse cx="80" cy="72" rx="50" ry="14" fill="#F4A93B" />
      {/* Vapeur */}
      <path d="M60 60 Q58 50 62 42 Q66 34 64 26" stroke="#E2572B" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <path d="M80 56 Q78 44 82 36 Q86 28 84 18" stroke="#E2572B" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <path d="M100 60 Q98 50 102 42 Q106 34 104 26" stroke="#E2572B" strokeWidth="3" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}

function IlloPiment() {
  return (
    <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Piment 1 – grand */}
      <path d="M70 30 Q68 20 72 16 Q76 12 78 18 Q82 28 80 50 Q78 72 68 88 Q58 100 52 96 Q44 90 48 76 Q54 58 70 30Z" fill="#B23A2E" />
      <path d="M70 30 Q66 48 62 66 Q58 80 54 88" stroke="#8B2020" strokeWidth="1.5" strokeLinecap="round" opacity=".4" />
      {/* Piment 2 – petit */}
      <path d="M98 42 Q96 34 99 30 Q102 26 104 31 Q107 40 106 56 Q104 70 98 80 Q92 88 88 85 Q83 80 86 70 Q91 56 98 42Z" fill="#E2572B" />
      {/* Queue */}
      <path d="M72 18 Q75 10 80 8 Q85 6 86 10" stroke="#4F7A4A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M99 31 Q101 24 104 22 Q107 20 108 23" stroke="#4F7A4A" strokeWidth="2" strokeLinecap="round" />
      {/* Petits points décoratifs */}
      <circle cx="40" cy="110" r="4" fill="#F4A93B" opacity=".5" />
      <circle cx="120" cy="100" r="6" fill="#F4A93B" opacity=".3" />
      <circle cx="130" cy="50" r="3" fill="#E2572B" opacity=".3" />
    </svg>
  )
}

function IlloScooter() {
  return (
    <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Corps scooter */}
      <path d="M50 80 L60 58 L90 56 L110 64 L118 80 Z" fill="#E2572B" />
      {/* Guidon */}
      <path d="M108 64 L120 56 L124 60" stroke="#2B1B12" strokeWidth="2.5" strokeLinecap="round" />
      {/* Siège */}
      <rect x="62" y="52" width="30" height="8" rx="4" fill="#2B1B12" />
      {/* Roue arrière */}
      <circle cx="58" cy="88" r="14" fill="#2B1B12" />
      <circle cx="58" cy="88" r="8" fill="#FAF3E8" />
      <circle cx="58" cy="88" r="3" fill="#2B1B12" />
      {/* Roue avant */}
      <circle cx="114" cy="88" r="14" fill="#2B1B12" />
      <circle cx="114" cy="88" r="8" fill="#FAF3E8" />
      <circle cx="114" cy="88" r="3" fill="#2B1B12" />
      {/* Boîte de livraison */}
      <rect x="60" y="56" width="28" height="20" rx="4" fill="#F4A93B" />
      <path d="M60 66 L88 66" stroke="#E2572B" strokeWidth="1.5" />
      {/* Lignes de vitesse */}
      <path d="M30 76 L46 76" stroke="#E2572B" strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
      <path d="M24 84 L44 84" stroke="#E2572B" strokeWidth="2" strokeLinecap="round" opacity=".35" />
      <path d="M28 92 L46 92" stroke="#E2572B" strokeWidth="1.5" strokeLinecap="round" opacity=".25" />
    </svg>
  )
}

// ─── Données slides ───────────────────────────────────────────────

const SLIDES = [
  {
    title:   "Une cuisine qui raconte une histoire",
    text:    "Chaque plat vient d'une région, d'une recette de famille. Découvrez leur histoire avant de commander.",
    Illo:    IlloBol,
  },
  {
    title:   "À votre goût, à votre rythme",
    text:    "Réglez le piquant comme vous l'aimez. Précommandez les plats mijotés pour qu'ils soient prêts à temps.",
    Illo:    IlloPiment,
  },
  {
    title:   "Suivez votre commande en direct",
    text:    "De la cuisine à votre porte, suivez chaque étape en temps réel.",
    Illo:    IlloScooter,
  },
]

// ─── Composant principal ──────────────────────────────────────────

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [seen,    setSeen]    = useState(true)   // true = ne rien afficher (SSR-safe)
  const [phase,   setPhase]   = useState<"welcome" | "slides">("welcome")
  const [slide,   setSlide]   = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setSeen(false)
  }, [])

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true")
      setSeen(true)
    }, 350)
  }, [])

  // Transition welcome → slides après 1.5s (ou tap)
  useEffect(() => {
    if (seen || phase !== "welcome") return
    const t = setTimeout(() => setPhase("slides"), 1500)
    return () => clearTimeout(t)
  }, [seen, phase])

  if (seen) return <>{children}</>

  return (
    <>
      {children}
      <div
        className={cn(
          "fixed inset-0 z-[200] transition-opacity duration-350",
          exiting ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        {phase === "welcome" ? (
          <WelcomeScreen onTap={() => setPhase("slides")} />
        ) : (
          <SlidesScreen slide={slide} setSlide={setSlide} onDone={dismiss} />
        )}
      </div>
    </>
  )
}

// ─── Écran de bienvenue ───────────────────────────────────────────

function WelcomeScreen({ onTap }: { onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="w-full h-full bg-liboke flex flex-col items-center justify-center gap-4 px-8"
      aria-label="Continuer"
    >
      {/* Logotype */}
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Logo_ChezYaNathy.png"
          alt="Chez ya Nathy"
          className="w-56 h-auto drop-shadow-lg"
        />
        <p className="mt-2 text-kwanga/70 text-base font-medium">
          La cuisine congolaise, livrée avec cœur
        </p>
      </div>

      {/* Indicateur pulse */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kwanga opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-kwanga/80" />
        </span>
        <span className="text-kwanga/50 text-xs">Appuyez pour continuer</span>
      </div>
    </button>
  )
}

// ─── Carousel de slides ───────────────────────────────────────────

function SlidesScreen({
  slide,
  setSlide,
  onDone,
}: {
  slide:    number
  setSlide: (n: number) => void
  onDone:   () => void
}) {
  const touchStartX  = useRef<number | null>(null)
  const isLast       = slide === SLIDES.length - 1

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx < -40 && slide < SLIDES.length - 1) setSlide(slide + 1)
    if (dx >  40 && slide > 0)                 setSlide(slide - 1)
  }

  const { title, text, Illo } = SLIDES[slide]

  return (
    <div
      className="w-full h-full bg-kwanga flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Bouton "Passer" fixe en haut à droite — masqué sur la dernière slide */}
      <div className="h-14 flex items-center justify-end px-5">
        {!isLast && (
          <button
            onClick={onDone}
            className="text-sm font-semibold text-encre/40 hover:text-encre transition-colors"
          >
            Passer
          </button>
        )}
      </div>

      {/* Illustration */}
      <div className="flex-1 flex items-center justify-center px-12">
        <div className="w-52 h-44">
          <Illo />
        </div>
      </div>

      {/* Texte */}
      <div className="px-8 pb-4 text-center space-y-3">
        <h2 className="font-serif text-[22px] font-bold text-encre leading-tight">
          {title}
        </h2>
        <p className="text-sm text-encre/60 leading-relaxed">
          {text}
        </p>
      </div>

      {/* Pagination + bouton */}
      <div className="pb-12 px-8 flex flex-col items-center gap-6">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === slide
                  ? "w-6 h-2.5 bg-liboke"
                  : "w-2.5 h-2.5 bg-encre/20 hover:bg-encre/35"
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Bouton avancer / commencer */}
        {isLast ? (
          <button
            onClick={onDone}
            className="w-full max-w-xs bg-liboke text-kwanga font-bold text-base py-4 rounded-full active:scale-[.97] transition-all"
          >
            Commencer
          </button>
        ) : (
          <button
            onClick={() => setSlide(slide + 1)}
            className="w-full max-w-xs bg-encre text-kwanga font-semibold text-sm py-3.5 rounded-full active:scale-[.97] transition-all"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  )
}
