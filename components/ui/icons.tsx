import { useId } from "react"
import { cn } from "@/lib/utils"

/**
 * Icônes et motifs maison, en complément des icônes Lucide.
 * Tout est en SVG : aucun emoji dans l'interface.
 */

/** Petit piment pili-pili. */
export function PiliIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} aria-hidden>
      <path d="M15.5 6C15.5 4.5 16.5 3.2 18 2.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M13 6C15 5 18.5 6.5 18.5 10C18.5 15 12 20.5 4.5 20.5C3.5 20.5 3.3 19.6 4.2 19.2C8 17.5 9.8 14.5 10 11C10.1 8.8 11 6.8 13 6Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Niveau de piquant : de zéro à trois piments. */
export function PiliScale({ level, className }: { level: 0 | 1 | 2 | 3; className?: string }) {
  return (
    <span className={cn("inline-flex items-center -space-x-1", className)} aria-hidden>
      {[1, 2, 3].map((n) => (
        <PiliIcon key={n} className={cn("h-5 w-5", n <= level ? "text-pili" : "text-encre/15")} />
      ))}
    </span>
  )
}

/**
 * Frise inspirée du bracelet du logo : points et triangles.
 * La couleur suit `currentColor` (text-kwanga, text-encre…).
 */
export function Frise({ className, height = 40 }: { className?: string; height?: number }) {
  const id = useId()
  return (
    <svg className={cn("block w-full", className)} height={height} aria-hidden>
      <defs>
        <pattern id={id} width="48" height="40" patternUnits="userSpaceOnUse" patternTransform={`scale(${height / 40})`}>
          <circle cx="12" cy="6" r="3.6" fill="currentColor" />
          <circle cx="36" cy="6" r="3.6" fill="currentColor" />
          <rect x="0" y="14" width="48" height="3" fill="currentColor" />
          <path d="M3 38 12 22l9 16Z M27 22h18l-9 16Z" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  )
}
