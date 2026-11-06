"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { getMe, getSchedule, getDueCards } from "@/lib/api"
import { Login } from "@/components/auth/login"
import { Loader2 } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Header } from "@/components/layout/header"

import { KPICards, KPIData } from "@/components/dashboard/kpi-cards"
import { ActionCenter, ActionData } from "@/components/dashboard/action-center"
import { ProgressSection, ProgressData } from "@/components/dashboard/progress-section"
import { SidePanel, ProfileSummary } from "@/components/dashboard/side-panel"

interface DashboardData {
  kpis: KPIData;
  actions: ActionData;
  progress: ProgressData;
  profile: ProfileSummary;
}

export default function DashboardPage() {
  const { user, loading: loadingAuth } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  // Centraliza a requisição e a formatação de dados do painel do usuário
  const fetchDashboard = useCallback(async () => {
    if (!user) return;

    try {
      // Executa chamadas simultâneas aos endpoints desabilitando o cache para garantir precisão
      const [profile, rawSchedule, dueCards] = await Promise.all([
        getMe(user.displayName || 'Estudante'),
        getSchedule(),
        getDueCards()
      ]);

      // Padroniza as datas base do calendário do cronograma para prevenir desalinhamento de fuso
      const fixedSchedule = rawSchedule.map((day: any) => {
        const [year, month, dayNumber] = day.fullDate.split('T')[0].split('-')
        const safeDate = new Date(Number(year), Number(month) - 1, Number(dayNumber), 12, 0, 0)
        
        return {
          ...day,
          safeDate,
          dayName: safeDate.toLocaleDateString('pt-BR', { weekday: 'long' })
        }
      });

      // Consolida as métricas chave (KPIs) com base nos retornos processados
      const kpis: KPIData = {
        streak: Number(profile.stats.streak) || 0,
        reviews: dueCards.length || 0,
        words: Number(profile.stats.words) || 0,
        studyMins: profile.stats.studyMinutes ?? 0
      };

      // Identifica e agrupa as tarefas disponíveis para a data atual
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const todaySchedule = fixedSchedule.find((d: any) => d.fullDate.startsWith(todayStr));
      const todayTasks = todaySchedule ? todaySchedule.tasks.filter((t: any) => !t.completed) : [];

      // Define o progresso de check-in para a semana em andamento no Action Center
      const weekDays = fixedSchedule.slice(0, 7).map((d: any) => {
        const allCompleted = d.tasks.length > 0 && d.tasks.every((t: any) => t.completed);
        return { label: d.dayName.charAt(0).toUpperCase(), completed: allCompleted };
      });

      // Extrai o tempo de estudo agrupado por dia para o gráfico semanal
      const weeklyChart = fixedSchedule.slice(0, 7).map((d: any) => {
        const minsOf = (type: string) => d.tasks.filter((t:any) => t.completed && t.type === type).reduce((acc:number, t:any) => acc + t.duration, 0);
        // Formata o descritor de dia para visualização enxuta no gráfico
        const shortName = d.dayName.substring(0, 3);
        const capitalizedShortName = shortName.charAt(0).toUpperCase() + shortName.slice(1);
        return { day: capitalizedShortName, video: minsOf("video"), flashcard: minsOf("flashcard"), chat: minsOf("chat") };
      });

      let totalVid = 0, compVid = 0, totalFlash = 0, compFlash = 0, totalChat = 0, compChat = 0;
      fixedSchedule.forEach((d: any) => {
        d.tasks.forEach((t: any) => {
          if (t.type === 'video') { totalVid++; if(t.completed) compVid++; }
          if (t.type === 'flashcard') { totalFlash++; if(t.completed) compFlash++; }
          if (t.type === 'chat') { totalChat++; if(t.completed) compChat++; }
        });
      });

      const safePercent = (comp: number, tot: number) => tot === 0 ? 0 : Math.round((comp / tot) * 100);

      const progress: ProgressData = {
        weeklyChart,
        skillsData: [
          { label: "Gramática", percentage: safePercent(compVid, totalVid), color: "var(--chart-1)" },
          { label: "Vocabulário", percentage: safePercent(compFlash, totalFlash), color: "var(--chart-2)" },
          { label: "Conversação", percentage: safePercent(compChat, totalChat), color: "var(--chart-3)" },
        ]
      };

      const profileSummary: ProfileSummary = {
        name: user.displayName || 'Estudante',
        photoURL: user.photoURL,
        level: profile.stats.level || 'A1',
      };

      setDashboardData({ kpis, actions: { todayTasks, weekDays }, progress, profile: profileSummary });

    } catch (error) {
      console.error("Erro a carregar o dashboard:", error);
    }
  }, [user]);

  // Configura os ouvintes de atualização de estado automático
  useEffect(() => {
    fetchDashboard(); 

    // Regista atualização ao focar a aba para garantir reatividade global de informações
    window.addEventListener('focus', fetchDashboard);
    return () => window.removeEventListener('focus', fetchDashboard);
  }, [fetchDashboard]);

  if (loadingAuth || (user && !dashboardData)) {
    return (
      <div className="flex h-screen flex-col gap-4 items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">A sincronizar o seu progresso...</p>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <AppShell>
      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-3 lg:py-3 lg:pr-3">
        <div className="flex min-w-0 flex-col gap-8 lg:px-6">
          <Header
            userName={user.displayName?.split(' ')[0] || "Estudante"}
            reviewsCount={dashboardData!.kpis.reviews}
          />
          <KPICards data={dashboardData!.kpis} />
          <ActionCenter data={dashboardData!.actions} />
          <ProgressSection data={dashboardData!.progress} />
        </div>
        <SidePanel
          profile={dashboardData!.profile}
          weekDays={dashboardData!.actions.weekDays}
          weeklyChart={dashboardData!.progress.weeklyChart}
        />
      </div>
    </AppShell>
  )
}
