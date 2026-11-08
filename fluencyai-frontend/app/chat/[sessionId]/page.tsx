import { AppShell } from "@/components/layout/app-shell"
import { ChatInterface } from "@/components/chat/chat-interface"

export default async function ChatSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  return (
    <AppShell fullHeight>
      <ChatInterface sessionId={sessionId} />
    </AppShell>
  )
}
