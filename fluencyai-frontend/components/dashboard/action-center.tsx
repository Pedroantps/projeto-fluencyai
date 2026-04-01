"use client"

import { BookOpen, Brain, MessageCircle, ChevronRight, Play, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export interface ActionData {
  todayTasks: any[];
  weekDays: { label: string; completed: boolean }[];
}

function ActionCard({ task, onClick }: { task: any, onClick: () => void }) {
  // Escolhe o ícone dinamicamente com base no tipo de tarefa
  const getIcon = () => {
    if (task.type === 'video') return <Play className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
    if (task.type === 'flashcard') return <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
    return <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
  }

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 w-full p-3 sm:p-4 rounded-xl bg-surface hover:bg-surface/80 border border-border/50 hover:border-primary/40 transition-all text-left shadow-sm"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background border border-border/30 shrink-0 shadow-sm">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground truncate">{task.title}</h4>
        <p className="text-xs text-muted-foreground truncate">{task.duration} minutos estimados</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </button>
  )
}

function WeekTracker({ days }: { days: any[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground">Progresso da Semana</h3>
      <div className="flex items-center justify-between">
        {days.map((day, index) => (
          <div
            key={index}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
              day.completed
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110"
                : "bg-surface border border-border/50 text-muted-foreground"
            }`}
          >
            {day.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ActionCenter({ data }: { data: ActionData }) {
  const router = useRouter()
  const completedDaysCount = data.weekDays.filter(d => d.completed).length;

  const handleActionClick = (task: any) => {
    if (task.type === "video" && task.link) window.open(task.link, "_blank");
    else if (task.type === "chat") router.push("/chat");
    else if (task.type === "flashcard") router.push("/review");
  }

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6">
      
      {/* Central de Tarefas */}
      <div className="lg:col-span-2 flex flex-col gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          {data.todayTasks.length > 0 ? "Continue de onde parou" : "Tudo concluído por hoje!"}
        </h3>
        
        <div className="flex flex-col gap-3">
          {data.todayTasks.length > 0 ? (
            data.todayTasks.map((task) => (
              <ActionCard key={task.id} task={task} onClick={() => handleActionClick(task)} />
            ))
          ) : (
             <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-border/50 rounded-xl">
               <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                 <CheckCircle className="w-6 h-6 text-emerald-500" />
               </div>
               <p className="text-sm font-medium text-foreground">Excelente trabalho!</p>
               <p className="text-xs text-muted-foreground mt-1">Você já completou todas as tarefas da rotina de hoje.</p>
             </div>
          )}
        </div>
        
        {data.todayTasks.length > 0 && (
          <Button onClick={() => router.push('/schedule')} className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl h-11">
            Ver Cronograma Completo
          </Button>
        )}
      </div>

      {/* Cartão de Consistência */}
      <div className="flex flex-col gap-5 p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Consistência</h3>
        <WeekTracker days={data.weekDays} />
        <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-border/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Dias concluídos</span>
            <span className="text-foreground font-bold">{completedDaysCount}/7 dias</span>
          </div>
          <div className="h-2.5 rounded-full bg-surface overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${(completedDaysCount / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}