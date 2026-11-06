"use client"

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts"

export interface ProgressData {
  weeklyChart: { day: string; video: number; flashcard: number; chat: number }[];
  skillsData: { label: string; percentage: number; color: string }[];
}

const series = [
  { key: "video", label: "Vídeo", color: "var(--chart-1)" },
  { key: "flashcard", label: "Cartões", color: "var(--chart-2)" },
  { key: "chat", label: "Conversa", color: "var(--chart-3)" },
] as const

/** Barras empilhadas por tipo de atividade (minutos concluídos). */
export function ActivityChart({ data }: { data: ProgressData["weeklyChart"] }) {
  const total = data.reduce((acc, d) => acc + d.video + d.flashcard + d.chat, 0)
  return (
    <div className="flex flex-col gap-3 rounded-[28px] bg-card p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">Atividade da semana</span>
        <span className="tabular text-sm font-medium text-foreground">{total} min</span>
      </div>
      <div className="h-40 w-full" role="img" aria-label={`Minutos estudados por dia, total ${total}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="18%">
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} dy={6} />
            <Tooltip
              cursor={{ fill: "var(--surface)", radius: 12 }}
              contentStyle={{
                borderRadius: 16,
                border: "none",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
              itemStyle={{ color: "var(--popover-foreground)" }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              formatter={(v: number, name: string) => [`${v} min`, series.find((s) => s.key === name)?.label ?? name]}
            />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="a"
                fill={s.color}
                radius={i === series.length - 1 ? [8, 8, 0, 0] : 0}
                maxBarSize={30}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProgressBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular text-muted-foreground">{percentage}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export function ProgressSection({ data }: { data: ProgressData }) {
  return (
    <section className="flex flex-col gap-5 rounded-[28px] bg-card p-6" aria-labelledby="skills-title">
      <h2 id="skills-title" className="text-lg font-medium text-foreground">Progresso por habilidade</h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {data.skillsData.map((skill) => (
          <ProgressBar key={skill.label} {...skill} />
        ))}
      </div>
    </section>
  )
}
