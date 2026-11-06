"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { ActivityChart, type ProgressData } from "@/components/dashboard/progress-section"

export interface ProfileSummary {
  name: string
  photoURL?: string | null
  level: string
}

interface SidePanelProps {
  profile: ProfileSummary
  weekDays: { label: string; completed: boolean }[]
  weeklyChart: ProgressData["weeklyChart"]
}

/** Painel direito: perfil, consistência e atividade. No mobile, vira seção empilhada. */
export function SidePanel({ profile, weekDays, weeklyChart }: SidePanelProps) {
  const done = weekDays.filter((d) => d.completed).length
  const initial = profile.name.charAt(0).toUpperCase()

  return (
    <aside className="flex flex-col gap-4 rounded-[32px] bg-sidebar p-5 lg:sticky lg:top-3 lg:max-h-[calc(100dvh-1.5rem)] lg:overflow-y-auto scrollbar-thin" aria-label="Seu progresso">
      <Link href="/profile" className="flex flex-col items-center gap-3 pt-2 pb-1 text-center">
        {profile.photoURL ? (
          <img src={profile.photoURL} alt="" referrerPolicy="no-referrer" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-cat-video text-3xl font-medium text-foreground">{initial}</span>
        )}
        <span className="flex flex-col items-center gap-1.5">
          <span className="text-xl font-medium tracking-tight text-foreground">{profile.name}</span>
          <span className="rounded-full bg-card px-3 py-0.5 text-xs font-medium text-muted-foreground">Nível {profile.level}</span>
        </span>
      </Link>

      <div className="flex flex-col gap-3 rounded-[28px] bg-card p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Consistência</span>
          <span className="tabular text-sm font-medium text-foreground">{done}/7 dias</span>
        </div>
        <ol className="flex items-center justify-between">
          {weekDays.map((day, i) => (
            <li
              key={i}
              aria-label={`${day.label}: ${day.completed ? "concluído" : "pendente"}`}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium",
                day.completed ? "bg-cat-cards text-foreground" : "bg-surface text-muted-foreground"
              )}
            >
              {day.completed ? <Check className="h-4 w-4" /> : day.label}
            </li>
          ))}
        </ol>
      </div>

      <ActivityChart data={weeklyChart} />
    </aside>
  )
}
