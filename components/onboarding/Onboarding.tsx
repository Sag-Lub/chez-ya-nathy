"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { branding } from "@/lib/config"
import { cn } from "@/lib/utils"
import { Frise } from "@/components/ui/icons"
import {
  LOGO_VIEWBOX,
  LOGO_MAIN,
  LOGO_BRACELET,
  LOGO_GOUTTE,
  LOGO_CHEZ_YA,
  LOGO_NATHY,
} from "@/components/brand/logo-paths"
import { IlloBol, IlloPiments, IlloScooter } from "./illustrations"
import styles from "./onboarding.module.css"

// ─── Réglages de l'écran de bienvenue ─────────────────────────────
/** Durée de la séquence animée avant l'ouverture du volet (ms). */
const WELCOME_MS = 2000
/** Avec prefers-reduced-motion : logo fixe, puis fondu. */
const WELCOME_REDUCED_MS = 1200
/** Durée du volet circulaire (ms) — au total, 2,5 s au plus. */
const WIPE_MS = 480

const KWANGA = "#FAF3E8"
const ENCRE = "#2B1B12"
const SAFOU = "#F4A93B"

/** Trois volutes de vapeur, dessinées en trait pour pouvoir « se tracer ». */
const VOLUTES = [
  { d: "M452 246C500 215 492 180 470 150C448 118 446 100 462 78", width: 15, delay: 0.38 },
  { d: "M508 246C556 205 548 160 520 118C492 76 490 40 512 6", width: 19, delay: 0.5 },
  { d: "M566 232C604 206 598 176 580 150C562 124 562 102 576 80", width: 13, delay: 0.62 },
]

interface Slide {
  id: string
  bg: string
  /** Couleur de la barre du navigateur pendant la slide. */
  theme: string
  /** true = fond foncé, texte clair. */
  dark: boolean
  title: string
  text: string
  Illo: (props: { active: boolean }) => React.ReactElement
}

const SLIDES: Slide[] = [
  {
    id: "histoire",
    bg: "bg-liboke",
    theme: "#E2572B",
    dark: true,
    title: "Chaque plat a son histoire",
    text: "Une région, une recette de famille : découvre d'où vient ton plat avant de le commander.",
    Illo: IlloBol,
  },
  {
    id: "piquant",
    bg: "bg-safou",
    theme: "#F4A93B",
    dark: false,
    title: "Ton piquant, ton rythme",
    text: "Doux, moyen, fort ou pili-pili à part. Les plats mijotés se précommandent pour le week-end.",
    Illo: IlloPiments,
  },
  {
    id: "suivi",
    bg: "bg-encre",
    theme: "#2B1B12",
    dark: true,
    title: "Suis ta commande en direct",
    text: "De la cuisine de Nathy jusqu'à ta porte, étape par étape.",
    Illo: IlloScooter,
  },
]

function setThemeColor(color: string) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color)
}

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"bienvenue" | "ouverture" | "slides">("bienvenue")
  const [exiting, setExiting] = useState(false)
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const logoRef = useRef<SVGSVGElement>(null)

  // Verrouille le défilement de la page et colore la barre du navigateur
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    setThemeColor("#E2572B")
    return () => {
      document.body.style.overflow = previous
      setThemeColor(KWANGA)
    }
  }, [])

  /** Ouvre la première slide par un volet circulaire qui part de la paume. */
  const openSlides = useCallback(() => {
    setPhase((current) => {
      if (current !== "bienvenue") return current
      const rect = logoRef.current?.getBoundingClientRect()
      if (rect) {
        setOrigin({ x: rect.left + rect.width * (500 / 810), y: rect.top + rect.height * (250 / 1000) })
      }
      return "ouverture"
    })
  }, [])

  // Séquence automatique : jamais plus de 2,5 s au total
  useEffect(() => {
    if (phase !== "bienvenue") return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const timer = setTimeout(openSlides, reduced ? WELCOME_REDUCED_MS : WELCOME_MS)
    return () => clearTimeout(timer)
  }, [phase, openSlides])

  useEffect(() => {
    if (phase !== "ouverture") return
    const timer = setTimeout(() => setPhase("slides"), WIPE_MS + 40)
    return () => clearTimeout(timer)
  }, [phase])

  const finish = useCallback(() => {
    setExiting(true)
    setTimeout(onDone, 250)
  }, [onDone])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Bienvenue chez ${branding.name}`}
      className={cn("fixed inset-0 z-[200] overflow-hidden", exiting && styles.sortie)}
    >
      {phase !== "slides" && <WelcomeScreen logoRef={logoRef} onSkip={openSlides} />}

      {phase !== "bienvenue" && (
        <div
          className={cn("absolute inset-0", phase === "ouverture" && styles.volet)}
          style={
            origin
              ? ({ "--ox": `${origin.x}px`, "--oy": `${origin.y}px` } as React.CSSProperties)
              : undefined
          }
        >
          <SlidesScreen onDone={finish} />
        </div>
      )}
    </div>
  )
}

// ─── Écran de bienvenue ───────────────────────────────────────────

function WelcomeScreen({
  logoRef,
  onSkip,
}: {
  logoRef: React.RefObject<SVGSVGElement | null>
  onSkip: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="Passer l'écran de bienvenue"
      className="absolute inset-0 block w-full bg-liboke text-left"
    >
      <span className="absolute inset-0 flex flex-col items-center justify-center px-8 pb-[12vh]">
        <svg
          ref={logoRef}
          viewBox={LOGO_VIEWBOX}
          className="h-auto w-[min(76vw,340px)] max-h-[58vh] overflow-visible"
          role="img"
          aria-label={branding.name}
        >
          <g id="vapeur">
            {VOLUTES.map((v) => (
              <path
                key={v.d}
                d={v.d}
                pathLength={1}
                className={styles.volute}
                stroke={SAFOU}
                strokeWidth={v.width}
                style={{ animationDelay: `${v.delay}s` }}
              />
            ))}
          </g>

          <g id="main" className={styles.main}>
            {LOGO_MAIN.map((d) => (
              <path key={d.slice(0, 24)} d={d} fill={ENCRE} fillRule="evenodd" />
            ))}
            <g id="bracelet">
              {LOGO_BRACELET.map((d) => (
                <path key={d.slice(0, 24)} d={d} fill={KWANGA} fillRule="evenodd" />
              ))}
            </g>
          </g>

          <g id="lettrage" fill={KWANGA} fillRule="evenodd">
            {LOGO_CHEZ_YA.map((d, i) => (
              <path key={d.slice(0, 24)} d={d} className={styles.lettre} style={{ animationDelay: `${0.58 + i * 0.055}s` }} />
            ))}
            {LOGO_NATHY.map((d, i) => (
              <path key={d.slice(0, 24)} d={d} className={styles.lettre} style={{ animationDelay: `${0.9 + i * 0.07}s` }} />
            ))}
          </g>

          <g id="goutte" className={styles.goutte} style={{ animationDelay: "1.4s" }}>
            {LOGO_GOUTTE.map((d) => (
              <path key={d.slice(0, 24)} d={d} fill={SAFOU} />
            ))}
          </g>
        </svg>

        <span
          className={cn(styles.accroche, "mt-7 block max-w-[18rem] text-center text-[19px] font-bold leading-snug text-white")}
          style={{ animationDelay: "1.5s" }}
        >
          {branding.tagline}
        </span>
      </span>

      <span className={cn(styles.frise, "absolute inset-x-0 bottom-0 block pb-[env(safe-area-inset-bottom)] text-kwanga")}>
        <Frise height={44} />
      </span>
    </button>
  )
}

// ─── Les trois slides ─────────────────────────────────────────────

function SlidesScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const slide = SLIDES[index]
  const isLast = index === SLIDES.length - 1

  useEffect(() => {
    setThemeColor(SLIDES[index].theme)
  }, [index])

  const go = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, next)))
  }, [])

  // Flèches du clavier
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(SLIDES.length - 1, i + 1))
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx < -40) go(index + 1)
    if (dx > 40) go(index - 1)
  }

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden transition-colors duration-300", slide.bg)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Piste : les trois slides côte à côte, chacune avec sa couleur de fond */}
      <div
        className="flex h-full transition-transform duration-300 ease-[cubic-bezier(0.22,0.8,0.3,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((s, i) => (
          <section
            key={s.id}
            aria-hidden={i !== index}
            className={cn("flex h-full w-full shrink-0 flex-col overflow-hidden", s.bg)}
          >
            {/* Illustration : environ 60 % de la hauteur, elle déborde du cadre */}
            <div className="min-h-0 flex-1 px-2 pt-[max(3.5rem,env(safe-area-inset-top))]">
              <div className="mx-auto h-full w-[112%] max-w-[560px] -translate-x-[5.4%]">
                <s.Illo active={i === index} />
              </div>
            </div>

            <div
              className={cn(styles.texte, "px-7 pt-4 pb-[calc(9.75rem+env(safe-area-inset-bottom))]")}
              data-active={i === index}
            >
              <h2 className={cn("titre text-[40px] leading-[0.98] text-balance", s.dark ? "text-kwanga" : "text-encre")}>
                {s.title}
              </h2>
              <p className={cn("mt-3 text-[19px] font-bold leading-snug", s.dark ? "text-white" : "text-encre")}>
                {s.text}
              </p>
            </div>
          </section>
        ))}
      </div>

      {/* Passer — masqué sur la dernière slide */}
      {!isLast && (
        <button
          type="button"
          onClick={onDone}
          className={cn(
            "absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] h-12 rounded-full px-5 text-[19px] font-bold transition-colors",
            slide.dark ? "text-white hover:bg-white/10" : "text-encre hover:bg-encre/10"
          )}
        >
          Passer
        </button>
      )}

      {/* Pagination + bouton */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 px-7 pb-[calc(1.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center" role="tablist" aria-label="Étapes de présentation">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Étape ${i + 1} sur ${SLIDES.length}`}
              onClick={() => go(i)}
              className="flex h-11 w-9 items-center justify-center"
            >
              <span
                className={cn(
                  "block h-2.5 rounded-full transition-all duration-200",
                  i === index ? "w-7" : "w-2.5",
                  slide.id === "suivi"
                    ? i === index ? "bg-safou" : "bg-kwanga/35"
                    : slide.dark
                      ? i === index ? "bg-kwanga" : "bg-kwanga/45"
                      : i === index ? "bg-encre" : "bg-encre/30"
                )}
              />
            </button>
          ))}
        </div>

        {isLast ? (
          <button
            type="button"
            onClick={onDone}
            className="h-14 w-full max-w-sm rounded-full bg-liboke text-[19px] font-bold text-white transition-transform duration-150 active:scale-[0.97]"
          >
            Commencer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="h-14 w-full max-w-sm rounded-full bg-encre text-[19px] font-bold text-kwanga transition-transform duration-150 active:scale-[0.97]"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  )
}
