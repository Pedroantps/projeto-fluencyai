"use client"

import { useState, useEffect } from "react"
import { Play, MessageCircle, Clock, Check, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { youtubeLessonUrl } from "@/lib/youtube"
import { useAuth } from "@/components/auth/auth-provider"
import { getSchedule, openTaskSession, resetSchedule, updateTask, type Task, type TaskType, type DaySchedule } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Importa módulos de comportamento de interface Drag and Drop via biblioteca genérica
import { 
  DndContext, DragOverlay, closestCorners, KeyboardSensor, 
  PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'


const taskIcons: Record<TaskType, { icon: React.ElementType; color: string; bg: string }> = {
  video: { icon: Play, color: "text-foreground", bg: "bg-cat-video" },
  flashcard: { icon: FlashcardIcon, color: "text-foreground", bg: "bg-cat-cards" },
  chat: { icon: MessageCircle, color: "text-foreground", bg: "bg-cat-chat" },
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

// Renderiza o invólucro interativo unitário contendo as definições de uma tarefa
function SortableTaskCard({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  const normalizedType = (task.type || "").toLowerCase() as TaskType;

  const typeInfo = taskIcons[normalizedType] || { 
    icon: Clock, // Ícone padrão se a IA inventar algo novo
    color: "text-muted-foreground", 
    bg: "bg-surface" 
  };

  const { icon: Icon, color, bg } = typeInfo;

  // Redireciona a ação baseada no tipo principal da atividade ao disparar um clique
  const handleCardClick = () => {
    if (normalizedType === "video") {
      window.open(youtubeLessonUrl(task.title), "_blank", "noopener,noreferrer");
    } else if (normalizedType === "chat") {
      if (opening) return;
      setOpening(true);
      openTaskSession(task.id)
        .then(({ sessionId }) => router.push(`/chat/${sessionId}`))
        .catch((error) => {
          console.error("Erro ao abrir a sessão:", error);
          toast.error("Não foi possível abrir a conversa.");
          setOpening(false);
        });
    } else if (normalizedType === "flashcard") {
      router.push("/review"); 
    }
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      onClick={handleCardClick}
      className={cn(
        "flex items-start gap-3 p-3 rounded-2xl bg-card transition-all cursor-grab active:cursor-grabbing hover:bg-surface-hover relative",
        task.completed && "opacity-60"
      )}
    >
      <div className={cn("flex items-center justify-center w-9 h-9 rounded-full shrink-0", bg)}>
        <span className={color}><Icon className="w-4 h-4" /></span>
      </div>
      
      <div className="flex-1 min-w-0 pointer-events-none">
        <p className={cn("text-sm font-medium leading-tight", task.completed ? "text-muted-foreground line-through" : "text-foreground")}>
          {task.title}
        </p>
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{task.duration} min</span>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation() 
          onToggle(task.id)
        }}
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full border-2 shrink-0 transition-colors z-10",
          task.completed 
            ? "bg-primary border-primary text-primary-foreground" 
            : "border-muted-foreground/40 hover:border-foreground bg-card"
        )}
      >
        {task.completed && <Check className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

// Renderiza o eixo de conteúdo de uma coluna mapeada por um dia da semana
function DayColumn({ day, isToday, onToggleTask }: { day: DaySchedule; isToday?: boolean; onToggleTask: (id: string) => void }) {
  return (
    <div className={cn(
      "flex flex-col w-full p-4 rounded-[28px] transition-colors h-full",
      isToday ? "bg-cat-video" : "bg-surface"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className={cn("text-base font-medium", "text-foreground")}>
          {day.dayName}
        </h3>
        {isToday && (
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
            Hoje
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground font-medium">{day.date}</span>
      </div>
      
      <SortableContext items={day.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 min-h-30 h-full">
          {day.tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onToggle={onToggleTask} />
          ))}
          {day.tasks.length === 0 && (
            <div className="h-full min-h-20 border-2 border-dashed border-border rounded-2xl flex items-center justify-center text-xs text-muted-foreground opacity-50">
              Sem tarefas
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// Controla o layout inteiro do quadro e as ações principais de carregamento e gestão de tarefas
export function ScheduleKanban() {
  const { user, loading: authLoading } = useAuth()
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Recupera e higieniza a malha de agendamento disponível na montagem da tela
  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    const load = async () => {
      if (user) {
        try {
          {
            const rawData = await getSchedule()
            
            const fixedData = rawData.map((day: DaySchedule) => {
              const [year, month, dayNumber] = day.fullDate.split('T')[0].split('-')
              const safeDate = new Date(Number(year), Number(month) - 1, Number(dayNumber), 12, 0, 0)
              const dayName = safeDate.toLocaleDateString('pt-BR', { weekday: 'long' })
              const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1)
              
              return {
                ...day,
                dayName: capitalizedDayName,
                date: safeDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
              }
            })

            if (!cancelled) setSchedule(fixedData)
          }
        } catch (error) {
          console.error("Erro ao buscar cronograma:", error)
        }
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [user, authLoading])

  // Exige do servidor e processa a recriação limpa de todas as tarefas de longo prazo
  const handleResetSchedule = async () => {
    if (!user) return;
    
    if (!confirm("Isto vai substituir as tarefas pendentes de hoje em diante por uma nova rotina. Tem a certeza?")) return;

    setIsGenerating(true);
    try {
      {
        const rawData = await resetSchedule();
        
        const fixedData = rawData.map((day: DaySchedule) => {
          const [year, month, dayNumber] = day.fullDate.split('T')[0].split('-')
          const safeDate = new Date(Number(year), Number(month) - 1, Number(dayNumber), 12, 0, 0)
          const dayName = safeDate.toLocaleDateString('pt-BR', { weekday: 'long' })
          return {
            ...day,
            dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            date: safeDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          }
        })
        setSchedule(fixedData);
      }
    } catch (error) {
      console.error("Erro ao gerar novo cronograma:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  // Sinaliza de forma assíncrona o salvamento do status de conclusão de uma tarefa
  const handleToggleTask = async (taskId: string) => {
    let newStatus = false;
    
    setSchedule(prev => prev.map(day => ({
      ...day,
      tasks: day.tasks.map(task => {
        if (task.id === taskId) {
          newStatus = !task.completed;
          return { ...task, completed: newStatus }
        }
        return task
      })
    })))

    try {
      await updateTask(taskId, { completed: newStatus })
    } catch (error) {
      console.error("Erro ao atualizar tarefa no banco.", error)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = schedule.flatMap(d => d.tasks).find(t => t.id === active.id)
    if (task) setActiveTask(task)
  }

  // Calcula a transferência do cartão no DOM e encaminha o patch ao banco de dados
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const sourceDayIndex = schedule.findIndex(day => day.tasks.some(t => t.id === activeId))
    const destinationDayIndex = schedule.findIndex(day => 
      day.tasks.some(t => t.id === overId) || day.fullDate === overId
    )

    if (sourceDayIndex === -1 || destinationDayIndex === -1) return

    const sourceDay = schedule[sourceDayIndex]
    const destDay = schedule[destinationDayIndex]
    
    if (sourceDayIndex !== destinationDayIndex) {
      const taskToMove = sourceDay.tasks.find(t => t.id === activeId)
      
      if (!taskToMove) return;

      setSchedule(prev => {
        return prev.map((day, index) => {
          if (index === sourceDayIndex) {
            return { ...day, tasks: day.tasks.filter(t => t.id !== activeId) }
          }
          if (index === destinationDayIndex) {
            return { ...day, tasks: [...day.tasks, { ...taskToMove, date: destDay.fullDate }] }
          }
          return day;
        })
      })

      try {
        await updateTask(activeId, { date: destDay.fullDate })
      } catch (error) {
        console.error("Erro ao mover a tarefa no banco de dados.", error)
      }
    }
  }

  const totalTasks = schedule.reduce((acc, day) => acc + day.tasks.length, 0)
  const completedTasks = schedule.reduce((acc, day) => acc + day.tasks.filter(t => t.completed).length, 0)
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const todayDate = new Date();
  const todayString = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  return (
    // Container mestre provendo espaçamento adicional em mobile para evitar sobreposições
    <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
      
      {/* Cabeçalho superior englobando resumo quantitativo e os controles gerais */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground">Seu plano da semana</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {completedTasks} de {totalTasks} tarefas concluídas
          </p>
        </div>
        <button
          onClick={handleResetSchedule}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 shrink-0 w-full sm:w-auto"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isGenerating ? "Gerando semana..." : "Gerar novo plano"}
        </button>
      </div>

      {/* Ilustração fluida para acompanhamento de tarefas finalizadas */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progresso da semana</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface overflow-hidden">
          <div 
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Inicializa o rastreamento contextual flexível de componentes colunares arrastáveis */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-2">
          {schedule.map((day) => (
            <DayColumn 
              key={day.fullDate} 
              day={day} 
              isToday={day.fullDate === todayString}
              onToggleTask={handleToggleTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-95 shadow-2xl scale-[1.02] rotate-2 cursor-grabbing rounded-2xl">
              <SortableTaskCard task={activeTask} onToggle={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}