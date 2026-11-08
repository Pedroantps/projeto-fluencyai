import { AppShell } from "@/components/layout/app-shell"
import { SessionList } from "@/components/chat/session-list"

export default function ChatPage() {
  return (
    <AppShell>
      <SessionList />
    </AppShell>
  )
}
