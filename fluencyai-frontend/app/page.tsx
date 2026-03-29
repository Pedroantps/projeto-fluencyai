import { Sidebar } from "@/components/layout/sidebar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { ActionCenter } from "@/components/dashboard/action-center"
import { ProgressSection } from "@/components/dashboard/progress-section"

export default function DashboardPage() {
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
