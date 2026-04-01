"use client"

import { useState, useEffect } from "react"
import { BrainCircuit, Sparkles, RefreshCw, Loader2, XCircle, CheckCircle, Smile } from "lucide-react"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/firebase"

interface Flashcard {
  id: string
  front: string
  back: string
  source: string
}

export function FlashcardReview() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // 1. Vai buscar os cartões que precisam ser revistos hoje
  const fetchDueCards = async (email: string) => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:3333/api/flashcards/due?email=${email}`)
      if (res.ok) {
        const data = await res.json()
        setCards(data)
      }
    } catch (error) {
      console.error("Erro ao procurar flashcards:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        setUserEmail(user.email)
        fetchDueCards(user.email)
      } else {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  // 2. Chama a IA para Gerar o Deck Inteligente
  const handleGenerateDeck = async () => {
    if (!userEmail) return
    setGenerating(true)
    try {
      const res = await fetch("http://localhost:3333/api/flashcards/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
      })
      if (res.ok) {
        // Depois de gerar, vai buscar a lista atualizada
        await fetchDueCards(userEmail)
      }
    } catch (error) {
      console.error("Erro a gerar deck:", error)
    } finally {
      setGenerating(false)
    }
  }

  // 3. Avalia o cartão e passa para o próximo
  const handleReview = async (quality: number) => {
    const currentCard = cards[currentIndex]
    
    // Atualiza o Back-end em segundo plano
    fetch(`http://localhost:3333/api/flashcards/${currentCard.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quality })
    }).catch(err => console.error("Erro ao guardar revisão", err))

    // Passa para a próxima carta no Front-end
    setIsFlipped(false)
    
    // Pequeno atraso para a animação de virar terminar antes de mudar o texto
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, 150)
  }

  // --- RENDERIZAÇÃO ---

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const isFinished = currentIndex >= cards.length
  const currentCard = cards[currentIndex]

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full gap-8 py-8">
      
      {/* Cabeçalho */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
          <BrainCircuit className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Revisão Diária</h1>
        <p className="text-sm text-muted-foreground">
          A repetição espaçada é o segredo da fluência.
        </p>
      </div>

      {/* Se não houver cartões ou se já tiver terminado */}
      {isFinished ? (
        <div className="flex flex-col items-center justify-center p-8 bg-surface border border-border/50 rounded-2xl w-full text-center gap-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-400/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Tudo em dia!</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Não tem mais nenhuma revisão atrasada. Pode descansar ou pedir à IA para preparar material novo.
            </p>
          </div>
          
          <button 
            onClick={handleGenerateDeck}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span>{generating ? "A analisar o seu nível..." : "Gerar Deck com IA"}</span>
          </button>
        </div>
      ) : (
        /* O CARTÃO DE REVISÃO E O JOGO */
        <div className="w-full flex flex-col items-center gap-8">
          
          <div className="flex justify-between w-full text-xs font-medium text-muted-foreground px-4">
            <span>Cartão {currentIndex + 1} de {cards.length}</span>
            <span className="uppercase tracking-wider text-primary/70 bg-primary/10 px-2 py-0.5 rounded">
              Origem: {currentCard.source}
            </span>
          </div>

          {/* O Card 3D */}
          <div 
            className="w-full aspect-4/3 sm:aspect-video cursor-pointer perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={cn(
              "relative w-full h-full transition-all duration-500 transform-style-3d",
              isFlipped ? "rotate-y-180" : ""
            )}>
              
              {/* FRENTE (Inglês) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-card border-2 border-border/50 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center hover:border-primary/30 transition-colors">
                <span className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-widest">Toque para virar</span>
                <h3 className="text-3xl sm:text-5xl font-bold text-foreground leading-tight">
                  {currentCard.front}
                </h3>
              </div>

              {/* VERSO (Português + Contexto) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-surface border-2 border-primary/20 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center rotate-y-180">
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  {currentCard.back}
                </h3>
              </div>

            </div>
          </div>

          {/* Botões de Decisão (Só aparecem se o cartão estiver virado) */}
          <div className={cn(
            "flex w-full gap-3 transition-all duration-300",
            isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}>
            <button 
              onClick={() => handleReview(0)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive transition-colors"
            >
              <XCircle className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">Não Sabia</span>
            </button>
            <button 
              onClick={() => handleReview(1)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-500 transition-colors"
            >
              <RefreshCw className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">Lembrei</span>
            </button>
            <button 
              onClick={() => handleReview(2)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 transition-colors"
            >
              <Smile className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">Fácil</span>
            </button>
          </div>

        </div>
      )}
    </div>
  )
}