"use client"

import { useState } from "react"
import { Volume2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Flashcard {
  id: string
  term: string
  definition: string
  example: string
  phonetic?: string
}

const sampleCards: Flashcard[] = [
  {
    id: "1",
    term: "Serendipity",
    definition: "The occurrence of events by chance in a happy or beneficial way.",
    example: "Finding that antique shop was pure serendipity.",
    phonetic: "/ˌserənˈdipədē/",
  },
  {
    id: "2",
    term: "Ephemeral",
    definition: "Lasting for a very short time.",
    example: "The ephemeral beauty of cherry blossoms attracts millions of visitors.",
    phonetic: "/əˈfem(ə)rəl/",
  },
  {
    id: "3",
    term: "Ubiquitous",
    definition: "Present, appearing, or found everywhere.",
    example: "Smartphones have become ubiquitous in modern society.",
    phonetic: "/yo͞oˈbikwədəs/",
  },
]

function FlashcardComponent({
  card,
  isFlipped,
  onFlip,
}: {
  card: Flashcard
  isFlipped: boolean
  onFlip: () => void
}) {
  return (
    /* Fixed height instead of aspect-ratio — avoids overflow on small screens */
    <div
      className="relative w-full max-w-lg cursor-pointer perspective-1000"
      style={{ height: "clamp(200px, 45vw, 280px)" }}
      onClick={onFlip}
    >
      <div
        className={cn(
          "absolute inset-0 w-full h-full transition-transform duration-500 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="flex flex-col items-center justify-center h-full px-4 py-5 sm:p-8 rounded-2xl bg-card border border-border/50 shadow-lg">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-2xl sm:text-4xl font-semibold text-foreground">{card.term}</span>
              {card.phonetic && (
                <span className="text-xs sm:text-sm text-muted-foreground">{card.phonetic}</span>
              )}
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Ouvir Pronuncia</span>
              </button>
            </div>
            <p className="absolute bottom-4 text-xs text-muted-foreground">Toque para ver a resposta</p>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="flex flex-col items-center justify-center h-full px-4 py-5 sm:p-8 rounded-2xl bg-card border border-primary/30 shadow-lg overflow-hidden">
            <div className="flex flex-col items-center gap-4 text-center max-w-full">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Definicao</span>
                <p className="text-sm sm:text-lg text-foreground leading-snug">{card.definition}</p>
              </div>
              <div className="flex flex-col gap-1.5 pt-3 border-t border-border/50 w-full">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Exemplo</span>
                <p className="text-xs sm:text-sm text-muted-foreground italic">{`"${card.example}"`}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SRSButtonProps {
  label: string
  subtext: string
  variant: "hard" | "good" | "easy"
  onClick: () => void
}

function SRSButton({ label, subtext, variant, onClick }: SRSButtonProps) {
  const variants = {
    hard: "hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive",
    good: "hover:bg-primary/10 hover:border-primary/50 hover:text-primary",
    easy: "hover:bg-success/10 hover:border-success/50 hover:text-success",
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-4 sm:px-8 py-2.5 sm:py-4 rounded-xl bg-surface border border-border/50 transition-all flex-1 sm:flex-none",
        variants[variant]
      )}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{subtext}</span>
    </button>
  )
}

export function FlashcardReview() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const currentCard = sampleCards[currentIndex]
  const totalCards = sampleCards.length

  const handleFlip = () => setIsFlipped(!isFlipped)

  const handleSRS = (_difficulty: "hard" | "good" | "easy") => {
    setIsFlipped(false)
    setReviewedCount((c) => c + 1)
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % totalCards)
    }, 200)
  }

  const goToPrevious = () => {
    setIsFlipped(false)
    setCurrentIndex((i) => (i === 0 ? totalCards - 1 : i - 1))
  }

  const goToNext = () => {
    setIsFlipped(false)
    setCurrentIndex((i) => (i + 1) % totalCards)
  }

  return (
    <div className="flex flex-col items-center w-full px-3 sm:px-6 py-4 sm:py-8 overflow-y-auto">
      {/* Progress */}
      <div className="w-full max-w-lg mb-5 sm:mb-8">
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
          <span>Progresso da sessao</span>
          <span>{reviewedCount} de {totalCards}</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(reviewedCount / totalCards) * 100}%` }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mb-4 sm:mb-6">
        <button
          onClick={goToPrevious}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {currentIndex + 1} / {totalCards}
        </span>
        <button
          onClick={goToNext}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Flashcard */}
      <div className="w-full max-w-lg">
        <FlashcardComponent card={currentCard} isFlipped={isFlipped} onFlip={handleFlip} />
      </div>

      {/* SRS Controls */}
      {isFlipped && (
        <div className="flex items-stretch gap-2 sm:gap-4 mt-5 sm:mt-8 w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          <SRSButton label="Errei" subtext="< 1 min" variant="hard" onClick={() => handleSRS("hard")} />
          <SRSButton label="Bom" subtext="10 min" variant="good" onClick={() => handleSRS("good")} />
          <SRSButton label="Facil" subtext="4 dias" variant="easy" onClick={() => handleSRS("easy")} />
        </div>
      )}

      {/* Flip hint */}
      {!isFlipped && (
        <button
          onClick={handleFlip}
          className="flex items-center gap-2 mt-5 sm:mt-8 px-4 py-2 rounded-lg bg-surface border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Virar Cartao</span>
        </button>
      )}
    </div>
  )
}
