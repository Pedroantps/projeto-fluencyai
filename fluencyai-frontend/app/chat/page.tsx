import { Sidebar } from "@/components/layout/sidebar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ChatInterface } from "@/components/chat/chat-interface"

export default function ChatPage() {
  return (
    <div className="flex bg-background" style={{ height: "100dvh" }}>
      <Sidebar />
      {/* pt-14 on mobile compensates the floating menu button; pb-16 clears bottom nav */}
      <main className="flex-1 md:ml-64 flex flex-col min-w-0 pt-14 md:pt-0 pb-16 md:pb-0">
        <ChatInterface />
      </main>
      <BottomNav />
    </div>
  )
}
