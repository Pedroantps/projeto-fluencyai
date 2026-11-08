"use client"

import { useState } from "react"
import { Brain, MessageCircle, Play, LayoutGrid, CheckCircle, ArrowUpRight, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { youtubeLessonUrl } from "@/lib/youtube"

export interface ActionData {
  todayTasks: any[];
  weekDays: { label: string; completed: boolean }[];
}

type Filter = "all" | "video" | "flashcard" | "chat"

const categories = {
  video: { label: "Vídeo", icon: Play, bg: "bg-cat-video" },
  flashcard: { label: "Cartões", icon: Brain, bg: "bg-cat-cards" },
  chat: { label: "Conversa", icon: MessageCircle, bg: "bg-cat-chat" },
} as const

const chips: { id: Filter; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "Tudo", icon: LayoutGrid },
  { id: "video", label: "Vídeo", icon: Play },
  { id: "flashcard", label: "Cartões", icon: Brain },
  { id: "chat", label: "Conversa", icon: MessageCircle },
]

function TaskCard({ task, onClick, index }: { task: any; onClick: () => void; index: number }) {
  const cat = categories[task.type as keyof typeof categories] ?? categories.chat
  const Icon = cat.icon
  return (
    <button
      onClick={onClick}
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "rise-in group flex min-h-44 flex-col justify-between rounded-[28px] p-5 text-left transition-[filter] hover:brightness-[0.97]",
        cat.bg
      )}
    >
      <span className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-sm text-foreground/75">{cat.label}</span>
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card/70 text-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </span>
      <span className="flex flex-col gap-2">
        <span className="text-xl font-medium leading-snug tracking-tight text-foreground text-balance line-clamp-3">{task.title}</span>
        <span className="flex items-center gap-1.5 text-sm text-foreground/75">
          <Clock className="h-3.5 w-3.5" />
          {task.duration} min
        </span>
      </span>
    </button>
  )
}

export function ActionCenter({ data }: { data: ActionData }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")

  const tasks = data.todayTasks.filter((t) => filter === "all" || t.type === filter)

  const handleActionClick = (task: any) => {
    if (task.type === "video") window.open(youtubeLessonUrl(task.title), "_blank", "noopener,noreferrer")
    else if (task.type === "chat") router.push("/chat")
    else if (task.type === "flashcard") router.push("/review")
  }

  return (
    <section className="flex flex-col gap-5" aria-labelledby="today-title">
      <div className="flex flex-col gap-4">
        <h2 id="today-title" className="text-lg font-medium text-foreground">Para hoje</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 scrollbar-thin" role="tablist" aria-label="Filtrar por tipo">
          {chips.map(({ id, label, icon: Icon }) => {
            const active = filter === id
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full py-2 pl-2 pr-4 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-surface-hover"
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", active ? "bg-primary-foreground/15" : "bg-surface")}>
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tasks.map((task, i) => (
            <TaskCard key={task.id} task={task} index={i} onClick={() => handleActionClick(task)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-[28px] bg-cat-cards p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card">
            <CheckCircle className="h-6 w-6 text-success" />
          </span>
          <p className="text-xl font-medium tracking-tight text-foreground">
            {data.todayTasks.length === 0 ? "Tudo concluído por hoje" : "Nada neste filtro"}
          </p>
          <p className="max-w-[44ch] text-sm text-foreground/75">
            {data.todayTasks.length === 0
              ? "Você completou a rotina de hoje. Veja o plano da semana para se antecipar."
              : "Escolha outro tipo de atividade para ver o que falta."}
          </p>
          <button
            onClick={() => router.push("/schedule")}
            className="mt-1 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ver plano da semana
          </button>
        </div>
      )}
    </section>
  )
}
