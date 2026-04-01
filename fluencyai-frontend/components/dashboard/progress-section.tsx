"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts"

export interface ProgressData {
  weeklyChart: { day: string, minutes: number }[];
  skillsData: { label: string, percentage: number, color: string }[];
}

function ProgressBar({ label, percentage, color }: { label: string, percentage: number, color: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">{percentage}% concluído</span>
      </div>
      <div className="h-2.5 rounded-full bg-surface overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function ProgressSection({ data }: { data: ProgressData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      
      {/* Gráfico de Barras */}
      <div className="flex flex-col gap-6 p-5 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Minutos de Estudo na Semana</h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.weeklyChart} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#A1A1AA", fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#A1A1AA", fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#18181B' }}
              />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {data.weeklyChart.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.minutes > 0 ? "var(--primary)" : "var(--surface)"} 
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Barras de Habilidades */}
      <div className="flex flex-col gap-6 p-5 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Progresso por Habilidade</h3>
        <div className="flex flex-col gap-6 mt-2">
          {data.skillsData.map((skill) => (
            <ProgressBar key={skill.label} {...skill} />
          ))}
        </div>
      </div>

    </div>
  )
}