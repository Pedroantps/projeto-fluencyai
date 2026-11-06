import { AppShell } from "@/components/layout/app-shell"
import { ScheduleKanban } from "@/components/schedule/schedule-kanban"

export default function SchedulePage() {
  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8">
        <ScheduleKanban />
      </div>
    </AppShell>
  )
}
