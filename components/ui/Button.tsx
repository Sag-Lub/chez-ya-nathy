import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "sombre" | "clair" | "contour" | "ghost" | "secondary"
type Size = "md" | "lg"

/**
 * Boutons en pilule, aplats pleins.
 * primary : pilule liboke — UNE seule par écran, pour l'action principale.
 *           Texte blanc en 19 px gras (contraste AA « grand texte »).
 * sombre  : aplat encre — actions secondaires fortes
 * clair   : aplat sable — actions discrètes
 * contour : bordure encre — alternative à côté d'une action principale
 * ghost   : texte seul
 * Toutes les tailles gardent une zone tactile d'au moins 44 px.
 */
export function buttonClass(variant: Variant = "primary", size: Size = "lg", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-bold select-none",
    "transition-[transform,background-color,opacity] duration-150 active:scale-[0.97]",
    "disabled:opacity-45 disabled:pointer-events-none",
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre",
    variant === "primary" && "bg-liboke text-white text-[19px] hover:bg-braise",
    variant === "sombre"  && "bg-encre text-kwanga hover:bg-encre/90",
    variant === "clair"   && "bg-sable text-encre hover:bg-sable/70",
    (variant === "contour" || variant === "secondary") && "border-2 border-encre text-encre hover:bg-encre/5",
    variant === "ghost"   && "text-encre hover:bg-encre/5",
    size === "md" && "h-12 px-5",
    size === "lg" && "h-14 px-7",
    variant !== "primary" && (size === "lg" ? "text-[17px]" : "text-[15px]"),
    className
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "lg", type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />
  )
)
Button.displayName = "Button"
