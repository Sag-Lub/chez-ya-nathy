"use client"

import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all active:scale-[.97] disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary"   && "bg-liboke   text-white hover:bg-liboke/90",
        variant === "secondary" && "bg-encre/10 text-encre hover:bg-encre/15",
        variant === "ghost"     && "text-encre  hover:bg-encre/5",
        size === "sm" && "h-8  px-4 text-sm",
        size === "md" && "h-11 px-6 text-base",
        size === "lg" && "h-14 px-8 text-base",
        className
      )}
      {...props}
    />
  )
)
Button.displayName = "Button"
