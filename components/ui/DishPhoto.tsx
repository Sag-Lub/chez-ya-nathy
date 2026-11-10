import Image from "next/image"
import { cn } from "@/lib/utils"

type Tone = "safou" | "liboke" | "sable" | "encre"

const TONE_BG: Record<Tone, string> = {
  safou:  "bg-safou",
  liboke: "bg-liboke",
  sable:  "bg-sable",
  encre:  "bg-encre",
}

/** next/image n'optimise que les images locales et le stockage Supabase du projet. */
function canOptimize(src: string): boolean {
  if (src.startsWith("/")) return true
  try {
    const host = new URL(src).hostname
    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost").hostname
    return host === supabaseHost && host.endsWith(".supabase.co")
  } catch {
    return false
  }
}

/** Les .png sont des visuels détourés (bouteilles) : on les montre en entier sur un plateau clair. */
function isCutout(src: string): boolean {
  return src.split("?")[0].toLowerCase().endsWith(".png")
}

interface DishPhotoProps {
  src: string | null | undefined
  alt: string
  /** Largeur affichée en pixels (sert à choisir la bonne taille de fichier). */
  size: number
  /** Couleur du plateau quand il n'y a pas de photo. */
  tone?: Tone
  priority?: boolean
  className?: string
}

/**
 * Photo de plat ronde. Sans vraie photo : un plateau de couleur
 * avec une illustration, jamais un emoji.
 */
export function DishPhoto({ src, alt, size, tone = "safou", priority = false, className }: DishPhotoProps) {
  const cutout = src ? isCutout(src) : false

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        !src ? TONE_BG[tone] : cutout ? "bg-sable" : "bg-encre/10",
        className
      )}
    >
      {!src ? (
        <DishPlaceholder dark={tone === "encre" || tone === "liboke"} />
      ) : canOptimize(src) ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${size}px`}
          priority={priority}
          className={cutout ? "object-contain p-[12%] mix-blend-multiply" : "object-cover"}
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn("absolute inset-0 h-full w-full", cutout ? "object-contain p-[12%] mix-blend-multiply" : "object-cover")}
        />
      )}
    </div>
  )
}

/** Illustration de remplacement : un bol fumant, aux couleurs de la marque. */
export function DishPlaceholder({ dark = false }: { dark?: boolean }) {
  const main = dark ? "#FAF3E8" : "#2B1B12"
  const accent = dark ? "#F4A93B" : "#E2572B"
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      <g fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round">
        <path d="M38 40c-5-6 5-10 0-17" />
        <path d="M50 38c-5-7 5-11 0-19" />
        <path d="M62 40c-5-6 5-10 0-17" />
      </g>
      <path d="M22 50h56c0 17-12 28-28 28S22 67 22 50Z" fill={main} />
      <rect x="18" y="46" width="64" height="7" rx="3.5" fill={main} />
      <rect x="40" y="76" width="20" height="5" rx="2.5" fill={main} />
    </svg>
  )
}
