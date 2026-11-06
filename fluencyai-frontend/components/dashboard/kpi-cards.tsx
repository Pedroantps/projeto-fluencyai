"use client"

import { Flame, Layers, MessageCircle, Brain } from "lucide-react"

export interface KPIData {
  streak: number;
  reviews: number;
  words: number;
  conversationMins: number;
}

function Stat({ icon, bg, value, label }: { icon: React.ReactNode; bg: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full bg-card py-2 pl-2 pr-5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full text-foreground ${bg}`}>{icon}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="tabular text-lg font-medium text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </span>
    </div>
  )
}

export function KPICards({ data }: { data: KPIData }) {
  return (
    <div className="flex flex-wrap gap-2.5" aria-label="Resumo">
      <Stat icon={<Flame className="h-5 w-5" />} bg="bg-cat-streak" value={data.streak} label={data.streak === 1 ? "dia seguido" : "dias seguidos"} />
      <Stat icon={<Layers className="h-5 w-5" />} bg="bg-cat-video" value={data.reviews} label={data.reviews === 1 ? "revisão hoje" : "revisões hoje"} />
      <Stat icon={<Brain className="h-5 w-5" />} bg="bg-cat-cards" value={data.words} label="palavras" />
      <Stat icon={<MessageCircle className="h-5 w-5" />} bg="bg-cat-chat" value={data.conversationMins} label="min de conversa" />
    </div>
  )
}
