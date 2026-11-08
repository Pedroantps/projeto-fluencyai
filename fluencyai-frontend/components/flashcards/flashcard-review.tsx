"use client"

import { useState, useEffect, useRef } from "react"
import { BrainCircuit, Sparkles, RefreshCw, Loader2, XCircle, CheckCircle, Smile, Volume2, Headphones } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { SOURCE_LABEL } from "@/lib/error-categories"
import { speak } from "@/lib/speech"
import { dictationTarget, isDictationMatch } from "@/lib/dictation"
import { generateDeck, getDueCards, reviewCard, type Flashcard } from "@/lib/api"

export function FlashcardReview() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [mode, setMode] = useState<"normal" | "dictation">("normal")
  const [typed, setTyped] = useState("")
  const [result, setResult] = useState<"correct" | "wrong" | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const reviewing = useRef(false)
  const { user, loading: authLoading } = useAuth()

  // 1. Vai buscar os cartões que precisam ser revistos hoje
  const fetchDueCards = async () => {
    setLoading(true)
    try {
      const data = await getDueCards()
      setCards(data)
    } catch (error) {
      console.error("Erro ao procurar flashcards:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (user) {
      fetchDueCards()
    } else {
      setLoading(false)
    }
  }, [user, authLoading])

  // 2. Chama a IA para Gerar o Deck Inteligente
  const handleGenerateDeck = async () => {
    if (!user) return
    setGenerating(true)
    try {
      await generateDeck()
      // Depois de gerar, vai buscar a lista atualizada
      await fetchDueCards()
    } catch (error) {
      console.error("Erro a gerar deck:", error)
    } finally {
      setGenerating(false)
    }
  }

  const isDictation = mode === "dictation"

  // Ditado: toca o áudio uma vez quando o cartão aparece (ou o modo muda).
  // O navegador pode bloquear o autoplay antes de um gesto; o botão de repetir cobre isso.
  useEffect(() => {
    if (!isDictation) return
    const card = cards[currentIndex]
    if (!card) return
    void speak(dictationTarget(card))
  }, [isDictation, currentIndex, cards.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const switchMode = (next: "normal" | "dictation") => {
    if (next === mode) return
    setMode(next)
    setTyped("")
    setResult(null)
    setIsFlipped(false)
  }

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault()
    const card = cards[currentIndex]
    if (!card || result || typed.trim().length === 0) return
    setResult(isDictationMatch(dictationTarget(card), typed) ? "correct" : "wrong")
    setIsFlipped(true)
  }

  const playTarget = (e: React.MouseEvent, card: Flashcard) => {
    e.stopPropagation()
    void speak(dictationTarget(card))
  }

  // 3. Avalia o cartão e passa para o próximo
  const handleReview = async (quality: number) => {
    const currentCard = cards[currentIndex]
    if (!currentCard || reviewing.current) return
    reviewing.current = true

    // Atualiza o Back-end em segundo plano
    reviewCard(currentCard.id, quality, isDictation ? "dictation" : undefined).catch(err => console.error("Erro ao guardar revisão", err))

    // Passa para a próxima carta no Front-end
    setIsFlipped(false)
    setTyped("")
    setResult(null)

    // Pequeno atraso para a animação de virar terminar antes de mudar o texto
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      reviewing.current = false
    }, 150)
  }

  // --- RENDERIZAÇÃO ---

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const isFinished = currentIndex >= cards.length
  const currentCard = cards[currentIndex]

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full gap-8 px-4 py-8 sm:py-12">
      
      {/* Cabeçalho */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-14 h-14 rounded-full bg-cat-cards flex items-center justify-center mb-2">
          <BrainCircuit className="w-6 h-6 text-foreground" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground">Revisão Diária</h1>
        <p className="text-sm text-muted-foreground">
          A repetição espaçada é o segredo da fluência.
        </p>

        <div className="flex gap-2 mt-2" role="group" aria-label="Modo de revisão">
          {([["normal", "Normal"], ["dictation", "Ditado"]] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => switchMode(value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                mode === value ? "bg-primary text-primary-foreground" : "bg-cat-cards text-foreground hover:brightness-95"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Se não houver cartões ou se já tiver terminado */}
      {isFinished ? (
        <div className="flex flex-col items-center justify-center p-8 bg-cat-cards rounded-3xl w-full text-center gap-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <div>
            <h2 className="text-2xl font-medium tracking-tight text-foreground mb-2">Tudo em dia!</h2>
            <p className="text-foreground/75 text-sm max-w-sm">
              Não tem mais nenhuma revisão atrasada. Pode descansar ou pedir à IA para preparar material novo.
            </p>
          </div>
          
          <button 
            onClick={handleGenerateDeck}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
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
            <span className="bg-cat-cards text-foreground px-3 py-1 rounded-full">
              Origem: {SOURCE_LABEL[currentCard.source] ?? currentCard.source}
            </span>
          </div>

          {/* O Card 3D */}
          <div 
            className="w-full aspect-4/3 sm:aspect-video cursor-pointer perspective-1000"
            onClick={() => { if (isDictation && !result) return; setIsFlipped(!isFlipped) }}
          >
            <div className={cn(
              "relative w-full h-full transition-all duration-500 transform-style-3d",
              isFlipped ? "rotate-y-180" : ""
            )}>
              
              {/* FRENTE (Inglês) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-cat-video rounded-[32px] flex flex-col items-center justify-center p-8 text-center">
                {isDictation ? (
                  <>
                    <Headphones className="w-12 h-12 text-foreground mb-4" />
                    <h3 className="text-2xl sm:text-4xl font-medium tracking-tight text-foreground mb-6">Ouça e escreva</h3>
                    <button
                      type="button"
                      onClick={(e) => playTarget(e, currentCard)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-card text-foreground text-sm font-medium hover:brightness-95 transition"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Ouvir novamente</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-foreground/70 mb-6">Toque para virar</span>
                    <h3 className="text-3xl sm:text-5xl font-medium tracking-tight text-foreground leading-tight text-balance">
                      {currentCard.front}
                    </h3>
                    {currentCard.source !== "erro" && (
                      <button
                        type="button"
                        onClick={(e) => playTarget(e, currentCard)}
                        className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-card text-foreground text-sm font-medium hover:brightness-95 transition"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Ouvir</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* VERSO (Português + Contexto) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-cat-chat rounded-[32px] flex flex-col items-center justify-center min-h-0 overflow-y-auto p-8 text-center rotate-y-180">
                {currentCard.source === "erro" ? (
                  <>
                    <h3 className="text-2xl sm:text-4xl font-medium tracking-tight text-foreground mb-3 text-balance">
                      {currentCard.back.split("\n")[0]}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line mb-4">
                      {currentCard.back.split("\n").slice(1).join("\n").trim()}
                    </p>
                  </>
                ) : (
                  <h3 className="text-2xl sm:text-4xl font-medium tracking-tight text-foreground mb-4 text-balance">
                    {currentCard.back}
                  </h3>
                )}
                {currentCard.source === "erro" && (
                  <button
                    type="button"
                    onClick={(e) => playTarget(e, currentCard)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-card text-foreground text-sm font-medium hover:brightness-95 transition"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Ouvir</span>
                  </button>
                )}
              </div>

            </div>
          </div>

          {isDictation && (
            <div className="w-full flex flex-col gap-3">
              {result === null ? (
                <form onSubmit={handleCheck} className="flex w-full gap-3">
                  <input
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder="Digite o que ouviu..."
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-1 px-5 py-3 rounded-full bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={typed.trim().length === 0}
                    className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Verificar
                  </button>
                </form>
              ) : (
                <p
                  role="status"
                  className={cn(
                    "text-center text-sm font-medium",
                    result === "correct" ? "text-success" : "text-destructive"
                  )}
                >
                  {result === "correct" ? "Correto!" : `Resposta: ${dictationTarget(currentCard)}`}
                </p>
              )}
            </div>
          )}

          {/* Botões de Decisão (Só aparecem se o cartão estiver virado) */}
          <div className={cn(
            "flex w-full gap-3 transition-all duration-300",
            isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )} aria-hidden={!isFlipped}>
            <button 
              disabled={!isFlipped}
              onClick={() => handleReview(0)}
              className="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-3xl bg-cat-streak hover:brightness-95 text-foreground transition"
            >
              <XCircle className="w-6 h-6" />
              <span className="text-xs font-medium">Não sabia</span>
            </button>
            <button 
              disabled={!isFlipped}
              onClick={() => handleReview(1)}
              className="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-3xl bg-cat-chat hover:brightness-95 text-foreground transition"
            >
              <RefreshCw className="w-6 h-6" />
              <span className="text-xs font-medium">Lembrei</span>
            </button>
            <button 
              disabled={!isFlipped}
              onClick={() => handleReview(2)}
              className="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-3xl bg-cat-cards hover:brightness-95 text-foreground transition"
            >
              <Smile className="w-6 h-6" />
              <span className="text-xs font-medium">Fácil</span>
            </button>
          </div>

        </div>
      )}
    </div>
  )
}