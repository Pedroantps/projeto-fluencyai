"use client"

import { Flame, Layers, MessageCircle, Brain } from "lucide-react"

export interface KPIData {
  streak: number;
  reviews: number;
  words: number;
  studyMins: number;
}

function Stat({ icon, bg, value, label }: { icon: React.ReactNode; bg: string; value: number; label: string }) {
  return (
    // Celular: card compacto em grade 2x2 (número em cima, rótulo embaixo). sm+: pílula em linha.
    <div className="flex min-w-0 items-center gap-2.5 rounded-[20px] bg-card p-2 pr-3 sm:gap-3 sm:rounded-full sm:py-2 sm:pl-2 sm:pr-5">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground ${bg}`}>{icon}</span>
      <span className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
        <span className="tabular text-lg font-medium leading-tight text-foreground">{value}</span>
        <span className="text-xs leading-snug text-muted-foreground sm:text-sm">{label}</span>
      </span>
    </div>
  )
}

export function KPICards({ data }: { data: KPIData }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap" aria-label="Resumo">
      <Stat icon={<Flame className="h-5 w-5" />} bg="bg-cat-streak" value={data.streak} label={data.streak === 1 ? "dia seguido" : "dias seguidos"} />
      <Stat icon={<Layers className="h-5 w-5" />} bg="bg-cat-video" value={data.reviews} label={data.reviews === 1 ? "revisão hoje" : "revisões hoje"} />
      <Stat icon={<Brain className="h-5 w-5" />} bg="bg-cat-cards" value={data.words} label="palavras" />
      <Stat icon={<MessageCircle className="h-5 w-5" />} bg="bg-cat-chat" value={data.studyMins} label="min de estudo" />
    </div>
  )
}
