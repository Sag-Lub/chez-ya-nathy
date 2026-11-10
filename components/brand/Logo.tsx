import Image from "next/image"
import { branding } from "@/lib/config"
import { cn } from "@/lib/utils"

/** Logo officiel (PNG d'origine, redimensionné à la volée par next/image). */
export function Logo({
  height = 48,
  priority = false,
  className,
}: {
  /** Hauteur affichée en pixels. */
  height?: number
  priority?: boolean
  className?: string
}) {
  // Proportions du fichier d'origine : 2026 × 2501
  const width = Math.round((height * 2026) / 2501)
  return (
    <Image
      src={branding.logo}
      alt={branding.name}
      width={width}
      height={height}
      priority={priority}
      className={cn("w-auto", className)}
      style={{ height }}
    />
  )
}
