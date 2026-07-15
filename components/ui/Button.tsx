"use client"

import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
}

/**
 * Bouton premium — uppercase, rayon modéré (pas de pilule).
 * primary   : fond framboise, texte blanc
 * secondary : transparent, bordure claire subtile
 * ghost     : texte seul, hover discret
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.08em] rounded-lg transition-all active:scale-[.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-liboke",
        variant === "primary"   && "bg-liboke text-white hover:bg-[#ff3a60]",
        variant === "secondary" && "bg-transparent border border-encre/25 text-encre hover:bg-encre/8 hover:border-encre/40",
        variant === "ghost"     && "text-encre hover:bg-encre/5",
        size === "sm" && "h-9  px-4 text-[11px]",
        size === "md" && "h-11 px-6 text-xs",
        size === "lg" && "h-13 px-8 text-[13px]",
        className
      )}
      {...props}
    />
  )
)
Button.displayName = "Button"
