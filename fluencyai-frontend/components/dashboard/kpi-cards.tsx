"use client"

import { Flame, BookOpen, MessageCircle, Brain } from "lucide-react"

export interface KPIData {
  streak: number;
  reviews: number;
  words: number;
  conversationMins: number;
}

interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  iconColor?: string
}

function KPICard({ icon, label, value, subtext, iconColor = "text-primary" }: KPICardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-4 border border-border/50 hover:border-primary/30 transition-colors shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-muted-foreground truncate pr-2">{label}</span>
        <div className={`${iconColor} shrink-0`}>{icon}</div>
      </div>
      <div className="flex flex-col gap-0.5 mt-1">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{value}</span>
        {subtext && <span className="text-xs text-muted-foreground leading-tight">{subtext}</span>}
      </div>
    </div>
  )
}

export function KPICards({ data }: { data: KPIData }) {
  const kpis = [
    {
      icon: <Flame className="h-4 w-4 sm:h-5 sm:w-5" />,
      label: "Streak",
      value: data.streak,
      subtext: "dias seguidos",
      iconColor: "text-orange-500",
    },
    {
      icon: <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />,
      label: "Revisões",
      value: data.reviews,
      subtext: data.reviews === 1 ? "flashcard hoje" : "flashcards hoje",
      iconColor: data.reviews > 0 ? "text-primary" : "text-emerald-500",
    },
    {
      icon: <Brain className="h-4 w-4 sm:h-5 sm:w-5" />,
      label: "Vocabulário",
      value: data.words,
      subtext: "palavras guardadas",
      iconColor: "text-emerald-500",
    },
    {
      icon: <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
      label: "Conversação",
      value: data.conversationMins,
      subtext: "minutos de prática",
      iconColor: "text-amber-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.label} {...kpi} />
      ))}
    </div>
  )
}