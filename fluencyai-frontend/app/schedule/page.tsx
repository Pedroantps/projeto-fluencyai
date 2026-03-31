import { Sidebar } from "@/components/layout/sidebar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ScheduleKanban } from "@/components/schedule/schedule-kanban"

export default function SchedulePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <div className="p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <ScheduleKanban />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}