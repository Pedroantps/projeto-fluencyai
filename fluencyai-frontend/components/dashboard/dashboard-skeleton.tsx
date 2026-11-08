import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/* Esqueletos com as mesmas medidas dos blocos reais, para a home abrir já montada sem pular. */

export function KPICardsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2.5" aria-hidden="true">
      {["w-40", "w-44", "w-36", "w-44"].map((w, i) => (
        <Skeleton key={i} className={cn("h-14 rounded-full bg-card", w)} />
      ))}
    </div>
  )
}

export function ActionCenterSkeleton() {
  return (
    <section className="flex flex-col gap-5" aria-hidden="true">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-foreground">Para hoje</h2>
        <div className="flex gap-2 overflow-hidden">
          {["w-20", "w-24", "w-28", "w-28"].map((w, i) => (
            <Skeleton key={i} className={cn("h-12 shrink-0 rounded-full bg-card", w)} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {["bg-cat-video", "bg-cat-cards", "bg-cat-chat"].map((bg, i) => (
          <Skeleton key={i} className={cn("min-h-44 rounded-[28px] opacity-60", bg, i === 2 && "hidden sm:block")} />
        ))}
      </div>
    </section>
  )
}

export function ProgressSectionSkeleton() {
  return (
    <section className="flex flex-col gap-5 rounded-[28px] bg-card p-6" aria-hidden="true">
      <h2 className="text-lg font-medium text-foreground">Progresso por habilidade</h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24 bg-surface" />
            <Skeleton className="h-3 rounded-full bg-surface" />
          </div>
        ))}
      </div>
    </section>
  )
}

export function SidePanelSkeleton({ name, photoURL }: { name?: string; photoURL?: string | null }) {
  return (
    <aside className="flex flex-col gap-4 rounded-[32px] bg-sidebar p-5 lg:sticky lg:top-3 lg:self-start" aria-hidden="true">
      <div className="flex flex-col items-center gap-3 pt-2 pb-1">
        {photoURL ? (
          <img src={photoURL} alt="" referrerPolicy="no-referrer" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <Skeleton className="h-20 w-20 rounded-full bg-card" />
        )}
        {name ? (
          <span className="text-xl font-medium tracking-tight text-foreground">{name}</span>
        ) : (
          <Skeleton className="h-7 w-32 bg-card" />
        )}
        <Skeleton className="h-5 w-16 rounded-full bg-card" />
      </div>
      <Skeleton className="h-[108px] rounded-[28px] bg-card" />
      <Skeleton className="h-64 rounded-[28px] bg-card" />
    </aside>
  )
}
