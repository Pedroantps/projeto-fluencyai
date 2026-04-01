"use client"

import { Bell } from "lucide-react"

interface HeaderProps {
  userName?: string
  reviewsCount?: number
}

export function Header({
  userName = "Estudante",
  reviewsCount = 0,
}: HeaderProps) {
  // Processa uma mensagem contextual ao usuário atrelada ao número de atividades em atraso
  const getMotivationalMessage = () => {
    if (reviewsCount > 0) {
      return `Você tem ${reviewsCount} ${reviewsCount === 1 ? 'flashcard pendente' : 'flashcards pendentes'} hoje. Vamos manter a ofensiva!`
    }
    return "Tudo em dia por aqui! Que tal praticar um pouco de conversação?"
  }

  return (
    <header className="flex items-center justify-between pt-14 pb-4 md:pt-6 md:pb-6 gap-3">
      {/* Área primária contendo a recepção nominal e estado do sistema */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground leading-tight truncate">
          Welcome, <span className="text-primary">{userName}</span>
        </h1>
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2 text-pretty italic">
          {getMotivationalMessage()}
        </p>
      </div>

      {/* Área secundária contendo botões interativos de notificação e perfil */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          aria-label="Notificações"
          className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <Bell className="h-4 w-4" />
          {reviewsCount > 0 && (
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
          )}
        </button>
        
        {/* Ícone imagético gerado programaticamente em função da String formatada */}
        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-sm">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}