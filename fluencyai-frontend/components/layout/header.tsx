"use client"

import { Bell } from "lucide-react"

interface HeaderProps {
  userName?: string
  motivationalMessage?: string
}

export function Header({
  userName = "Lucas",
  motivationalMessage = "Voce tem 24 flashcards pendentes hoje. Vamos manter a ofensiva!",
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between pt-14 pb-4 md:pt-6 md:pb-6 gap-3">
      {/* Left: greeting */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground leading-tight truncate">
          Welcome, <span className="text-primary">{userName}</span>
        </h1>
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2 text-pretty">
          {motivationalMessage}
        </p>
      </div>

      {/* Right: actions — compact on mobile */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          aria-label="Notificacoes"
          className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-streak rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-medium text-sm shrink-0">
          L
        </div>
      </div>
    </header>
  )
}
