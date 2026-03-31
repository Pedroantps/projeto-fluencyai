"use client"

import { useState, useEffect } from "react"
import { firebase, auth } from "@/lib/firebase"
import { Login } from "@/components/auth/login"
import { Loader2 } from "lucide-react"

// Seus imports originais do Dashboard
import { Sidebar } from "@/components/layout/sidebar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { ActionCenter } from "@/components/dashboard/action-center"
import { ProgressSection } from "@/components/dashboard/progress-section"

export default function DashboardPage() {
  const [user, setUser] = useState<firebase.User | null>(null)
  const [loading, setLoading] = useState(true)

  // Fica escutando se o usuário está logado ou não
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [])

  // 1. Tela de carregamento enquanto o Firebase checa o status
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // 2. Se NÃO estiver logado, exibe a tela de Login isolada que criamos
  if (!user) {
    return <Login />
  }

  // 3. Se ESTIVER logado, renderiza o seu Dashboard original e intacto!
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 min-w-0">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-8">
          <Header />
          <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 pb-20 md:pb-10">
            <KPICards />
            <ActionCenter />
            <ProgressSection />
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}