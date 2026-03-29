"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"

interface ProgressBarProps {
  label: string
  percentage: number
  color: string
}

function ProgressBar({ label, percentage, color }: ProgressBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

const weeklyData = [
  { day: "Seg", minutes: 45 },
  { day: "Ter", minutes: 30 },
  { day: "Qua", minutes: 60 },
  { day: "Qui", minutes: 0 },
  { day: "Sex", minutes: 0 },
  { day: "Sab", minutes: 0 },
  { day: "Dom", minutes: 0 },
]

export function ProgressSection() {
  const skills = [
    { label: "Vocabulário", percentage: 68, color: "#9D7AFF" },
    { label: "Gramática", percentage: 45, color: "#10B981" },
    { label: "Conversação", percentage: 32, color: "#FF9F43" },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <div className="flex flex-col gap-6 p-4 sm:p-6 rounded-xl bg-card border border-border/50">
        <h3 className="text-base font-medium text-foreground">Progresso por Habilidade</h3>
        <div className="flex flex-col gap-5">
          {skills.map((skill) => (
            <ProgressBar key={skill.label} {...skill} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 p-4 sm:p-6 rounded-xl bg-card border border-border/50">
        <h3 className="text-base font-medium text-foreground">Minutos Estudados na Semana</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barCategoryGap="20%">
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#A1A1AA", fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#A1A1AA", fontSize: 12 }}
                width={30}
              />
              <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                {weeklyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.minutes > 0 ? "#9D7AFF" : "#2A2A35"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
