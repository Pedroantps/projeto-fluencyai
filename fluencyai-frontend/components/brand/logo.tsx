import { cn } from "@/lib/utils"

/** Balão da Ana (canto inferior esquerdo reto) com o "f" da DM Sans 500 em contorno. */
const BUBBLE = "M22 4H42A18 18 0 0 1 60 22V42A18 18 0 0 1 42 60H8A4 4 0 0 1 4 56V22A18 18 0 0 1 22 4Z"
const LETTER_F =
  "M28.18 50.72V20.99Q28.18 18.26 29.1 16.56Q30.02 14.86 31.77 14.07Q33.53 13.28 36.04 13.28H39.1V17.72H36.84Q35.01 17.72 34.2 18.46Q33.38 19.21 33.38 21.06V50.72ZM24.3 28.88V24.51H39.7V28.88Z"

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="4 4 56 56" aria-hidden="true" className={cn("h-11 w-11 shrink-0", className)}>
      <path d={BUBBLE} className="fill-primary" />
      <path d={LETTER_F} className="fill-primary-foreground" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      <span className="text-lg font-medium tracking-tight text-foreground">FluencyAI</span>
    </span>
  )
}
