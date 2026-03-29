import { Sidebar } from "@/components/layout/sidebar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { FlashcardReview } from "@/components/flashcards/flashcard-review"

export default function ReviewPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {/* pt-14 on mobile gives room for the floating menu button */}
      <main className="flex-1 md:ml-64 min-w-0 pt-14 md:pt-0 pb-20 md:pb-8">
        <FlashcardReview />
      </main>
      <BottomNav />
    </div>
  )
}
