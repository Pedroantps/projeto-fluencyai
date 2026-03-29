"use client"

import { Flame, BookOpen, MessageCircle, Brain } from "lucide-react"

interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  iconColor?: string
}

function KPICard({ icon, label, value, subtext, iconColor = "text-primary" }: KPICardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-4 border border-border/50 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-muted-foreground truncate pr-2">{label}</span>
        <div className={`${iconColor} shrink-0`}>{icon}</div>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{value}</span>
        {subtext && <span className="text-xs text-muted-foreground leading-tight">{subtext}</span>}
      </div>
    </div>
  )
}

export function KPICards() {
  const kpis = [
    {
      icon: <Flame className="h-4 w-4 sm:h-5 sm:w-5" />,
      label: "Streak",
      value: 12,
      subtext: "dias seguidos",
      iconColor: "text-streak",
    },
    {
      icon: <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />,
      label: "Revisoes",
      value: 24,
      subtext: "flashcards hoje",
      iconColor: "text-primary",
    },
    {
      icon: <Brain className="h-4 w-4 sm:h-5 sm:w-5" />,
      label: "Vocabulario",
      value: "1.2k",
      subtext: "palavras aprendidas",
      iconColor: "text-success",
    },
    {
      icon: <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
      label: "Conversacao",
      value: "48",
      subtext: "minutos de pratica",
      iconColor: "text-chart-5",
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
