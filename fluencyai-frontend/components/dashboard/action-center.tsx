"use client"

import { BookOpen, Brain, MessageCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick?: () => void
}

function ActionCard({ icon, title, description, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 w-full p-3 sm:p-4 rounded-lg bg-surface hover:bg-surface-hover border border-border/50 hover:border-primary/40 transition-all text-left"
    >
      <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">{title}</h4>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </button>
  )
}

function WeekTracker() {
  const days = [
    { label: "S", completed: true },
    { label: "T", completed: true },
    { label: "Q", completed: true },
    { label: "Q", completed: false },
    { label: "S", completed: false },
    { label: "S", completed: false },
    { label: "D", completed: false },
  ]

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground">Semana Atual</h3>
      <div className="flex items-center justify-between">
        {days.map((day, index) => (
          <div
            key={index}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
              day.completed
                ? "bg-primary text-primary-foreground"
                : "border-2 border-border text-muted-foreground"
            }`}
          >
            {day.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ActionCenter() {
  const actions = [
    {
      icon: <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />,
      title: "Aula 3 do Cronograma",
      description: "Continue seu progresso",
    },
    {
      icon: <Brain className="h-4 w-4 sm:h-5 sm:w-5" />,
      title: "Revisar 24 cartoes",
      description: "Flashcards para hoje",
    },
    {
      icon: <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
      title: "Treinar Conversacao",
      description: "Ordering Food",
    },
  ]

  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-3 lg:gap-6">
      {/* Main action card */}
      <div className="lg:col-span-2 flex flex-col gap-3 p-4 rounded-xl bg-card border border-border/50">
        <h3 className="text-sm sm:text-base font-medium text-foreground">Continue de onde parou</h3>
        <div className="flex flex-col gap-2 sm:gap-3">
          {actions.map((action) => (
            <ActionCard key={action.title} {...action} />
          ))}
        </div>
        <Button className="w-full mt-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
          Iniciar Sessao de Estudo
        </Button>
      </div>

      {/* Consistency card */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/50">
        <h3 className="text-sm sm:text-base font-medium text-foreground">Consistencia</h3>
        <WeekTracker />
        <div className="flex flex-col gap-2 mt-auto">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Meta semanal</span>
            <span className="text-foreground font-medium">3/5 dias</span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <div className="h-full w-3/5 bg-primary rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
