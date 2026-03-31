"use client"

import { useState } from "react"
import { Play, MessageCircle, Clock, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type TaskType = "video" | "flashcard" | "chat"

interface Task {
  id: string
  type: TaskType
  title: string
  duration: number
  completed: boolean
}

interface DaySchedule {
  dayName: string
  date: string
  tasks: Task[]
}

const mockSchedule: DaySchedule[] = [
  {
    dayName: "Segunda-feira",
    date: "12/04",
    tasks: [
      { id: "1", type: "video", title: "Assistir vídeo sobre Present Perfect no YouTube", duration: 5, completed: true },
      { id: "2", type: "flashcard", title: "Revisar 15 Flashcards", duration: 10, completed: false },
      { id: "3", type: "chat", title: "Sessão de Chat: Pedindo comida", duration: 10, completed: false },
    ]
  },
  {
    dayName: "Terça-feira",
    date: "13/04",
    tasks: [
      { id: "4", type: "flashcard", title: "Revisar 20 Flashcards", duration: 15, completed: false },
      { id: "5", type: "chat", title: "Sessão de Chat: Falando sobre hobbies", duration: 15, completed: false },
    ]
  },
  {
    dayName: "Quarta-feira",
    date: "14/04",
    tasks: [
      { id: "6", type: "video", title: "Assistir vídeo sobre Phrasal Verbs", duration: 8, completed: false },
      { id: "7", type: "flashcard", title: "Revisar 10 Flashcards", duration: 5, completed: false },
    ]
  },
  {
    dayName: "Quinta-feira",
    date: "15/04",
    tasks: [
      { id: "8", type: "chat", title: "Sessão de Chat: Fazendo reservas", duration: 12, completed: false },
      { id: "9", type: "flashcard", title: "Revisar 25 Flashcards", duration: 20, completed: false },
    ]
  },
  {
    dayName: "Sexta-feira",
    date: "16/04",
    tasks: [
      { id: "10", type: "video", title: "Assistir vídeo sobre Conditionals", duration: 10, completed: false },
      { id: "11", type: "chat", title: "Sessão de Chat: Entrevista de emprego", duration: 15, completed: false },
    ]
  },
  {
    dayName: "Sábado",
    date: "17/04",
    tasks: [
      { id: "12", type: "flashcard", title: "Revisar 30 Flashcards", duration: 25, completed: false },
    ]
  },
  {
    dayName: "Domingo",
    date: "18/04",
    tasks: [
      { id: "13", type: "video", title: "Revisão semanal em vídeo", duration: 15, completed: false },
    ]
  },
]

const taskIcons: Record<TaskType, { icon: React.ElementType; color: string; bg: string }> = {
  video: { icon: Play, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  flashcard: { icon: FlashcardIcon, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  chat: { icon: MessageCircle, color: "text-amber-400", bg: "bg-amber-400/10" },
}

function FlashcardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  )
}

function TaskCard({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const { icon: Icon, color, bg } = taskIcons[task.type]

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-card border transition-all",
      task.completed ? "border-border/30 opacity-60" : "border-border/50 hover:border-primary/30"
    )}>
      <div className={cn("flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0", bg)}>
        <span className={color}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium leading-snug",
          task.completed ? "text-muted-foreground line-through" : "text-foreground"
        )}>
          {task.title}
        </p>
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{task.duration} min</span>
        </div>
      </div>

      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full border-2 shrink-0 transition-colors",
          task.completed 
            ? "bg-primary border-primary text-primary-foreground" 
            : "border-muted-foreground/30 hover:border-primary/50"
        )}
      >
        {task.completed && <Check className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

function DayColumn({ day, isToday, onToggleTask }: { day: DaySchedule; isToday?: boolean; onToggleTask: (id: string) => void }) {
  return (
    <div className="flex flex-col min-w-70 sm:min-w-75">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-foreground">{day.dayName}</h3>
        {isToday && (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/20 text-primary uppercase tracking-wide">
            Hoje
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{day.date}</span>
      </div>
      
      <div className="flex flex-col gap-3">
        {day.tasks.map((task) => (
          <TaskCard key={task.id} task={task} onToggle={onToggleTask} />
        ))}
      </div>
    </div>
  )
}

export function ScheduleKanban() {
  const [schedule, setSchedule] = useState(mockSchedule)
  const [scrollPosition, setScrollPosition] = useState(0)

  const handleToggleTask = (taskId: string) => {
    setSchedule(prev => prev.map(day => ({
      ...day,
      tasks: day.tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    })))
  }

  const totalTasks = schedule.reduce((acc, day) => acc + day.tasks.length, 0)
  const completedTasks = schedule.reduce((acc, day) => acc + day.tasks.filter(t => t.completed).length, 0)

  const scrollLeft = () => {
    const container = document.getElementById("kanban-scroll")
    if (container) {
      container.scrollBy({ left: -320, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    const container = document.getElementById("kanban-scroll")
    if (container) {
      container.scrollBy({ left: 320, behavior: "smooth" })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Cronograma Semanal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {completedTasks} de {totalTasks} tarefas concluídas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-surface border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollRight}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-surface border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progresso da semana</span>
          <span>{Math.round((completedTasks / totalTasks) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface overflow-hidden">
          <div 
            className="h-full rounded-full bg-linear-to-r from-primary to-primary/70 transition-all duration-500"
            style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div 
        id="kanban-scroll"
        className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        onScroll={(e) => setScrollPosition((e.target as HTMLDivElement).scrollLeft)}
      >
        {schedule.map((day, index) => (
          <DayColumn 
            key={day.dayName} 
            day={day} 
            isToday={index === 0}
            onToggleTask={handleToggleTask}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/30">
        <span className="text-xs text-muted-foreground">Legenda:</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-cyan-400/10">
            <Play className="w-3 h-3 text-cyan-400" />
          </div>
          <span className="text-xs text-muted-foreground">Vídeo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-emerald-400/10">
            <span className="text-emerald-400"><FlashcardIcon /></span>
          </div>
          <span className="text-xs text-muted-foreground">Flashcard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-amber-400/10">
            <MessageCircle className="w-3 h-3 text-amber-400" />
          </div>
          <span className="text-xs text-muted-foreground">Conversação</span>
        </div>
      </div>
    </div>
  )
}