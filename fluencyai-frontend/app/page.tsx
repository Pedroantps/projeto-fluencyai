"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { getMe, getSchedule, getDueCards } from "@/lib/api"
import { Login } from "@/components/auth/login"
import { Loader2 } from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"

import { KPICards, KPIData } from "@/components/dashboard/kpi-cards"
import { ActionCenter, ActionData } from "@/components/dashboard/action-center"
import { ProgressSection, ProgressData } from "@/components/dashboard/progress-section"

interface DashboardData {
  kpis: KPIData;
  actions: ActionData;
  progress: ProgressData;
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
        conversationMins: Math.round((Number(profile.stats.hours) || 0) * 60)
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
        const mins = d.tasks.filter((t:any) => t.completed).reduce((acc:number, t:any) => acc + t.duration, 0);
        // Formata o descritor de dia para visualização enxuta no gráfico
        const shortName = d.dayName.substring(0, 3);
        const capitalizedShortName = shortName.charAt(0).toUpperCase() + shortName.slice(1);
        return { day: capitalizedShortName, minutes: mins };
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
          { label: "Gramática", percentage: safePercent(compVid, totalVid), color: "#10B981" },
          { label: "Vocabulário", percentage: safePercent(compFlash, totalFlash), color: "#8B5CF6" },
          { label: "Conversação", percentage: safePercent(compChat, totalChat), color: "#F59E0B" },
        ]
      };

      setDashboardData({ kpis, actions: { todayTasks, weekDays }, progress });

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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Header 
            userName={user.displayName?.split(' ')[0] || "Estudante"} 
            reviewsCount={dashboardData?.kpis.reviews || 0} 
          />
          <div className="flex flex-col gap-6 sm:gap-8 pb-24 md:pb-12 mt-4">
            <KPICards data={dashboardData!.kpis} />
            <ActionCenter data={dashboardData!.actions} />
            <ProgressSection data={dashboardData!.progress} />
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}