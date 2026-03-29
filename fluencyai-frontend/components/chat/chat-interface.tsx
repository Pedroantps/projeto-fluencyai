"use client"

import { useState } from "react"
import { Mic, Send, Volume2, ChevronDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  correction?: {
    original: string
    corrected: string
    explanation: string
  }
}

function ChatBubble({ message }: { message: Message }) {
  const [showCorrection, setShowCorrection] = useState(false)
  const isUser = message.role === "user"

  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[88%] sm:max-w-[80%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed",
          isUser
            ? "bg-surface text-foreground rounded-br-md"
            : "bg-card border border-primary/20 text-foreground rounded-bl-md"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs text-primary font-medium">FluencyAI</span>
          </div>
        )}
        <p>{message.content}</p>
        {!isUser && (
          <button className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            <Volume2 className="w-3 h-3" />
            Ouvir
          </button>
        )}
      </div>

      {message.correction && (
        <button
          onClick={() => setShowCorrection(!showCorrection)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors"
        >
          <span>{"Teacher's Note"}</span>
          <ChevronDown className={cn("w-3 h-3 transition-transform", showCorrection && "rotate-180")} />
        </button>
      )}

      {message.correction && showCorrection && (
        <div className="max-w-[88%] sm:max-w-[80%] p-3 rounded-lg bg-success/5 border border-success/20 text-sm">
          <div className="flex flex-col gap-1.5">
            <span className="line-through text-xs text-destructive">{message.correction.original}</span>
            <span className="text-xs font-medium text-success">{message.correction.corrected}</span>
            <p className="text-xs text-muted-foreground">{message.correction.explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ChatInput({ onSend }: { onSend: (message: string) => void }) {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSend(message)
      setMessage("")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 bg-card border-t border-border/50"
    >
      {/* Text input — takes all remaining space */}
      <div className="flex-1 min-w-0 flex items-center px-3 py-2 rounded-xl bg-surface border border-border/50 focus-within:border-primary/50 transition-colors">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite em ingles..."
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {/* Mic button */}
      <button
        type="button"
        onClick={() => setIsRecording(!isRecording)}
        aria-label="Gravar voz"
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-all",
          isRecording
            ? "bg-primary text-primary-foreground"
            : "bg-surface border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
        )}
      >
        <Mic className="w-4 h-4" />
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
        )}
      </button>

      {/* Send button */}
      <button
        type="submit"
        disabled={!message.trim()}
        aria-label="Enviar"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! Today we're going to practice ordering food at a restaurant. Imagine you're at a nice Italian restaurant in New York. How would you start the conversation with the waiter?",
    },
    {
      id: "2",
      role: "user",
      content: "Hi, I would like to see the menu, please.",
    },
    {
      id: "3",
      role: "assistant",
      content: "Excellent! That's a polite and natural way to start. The waiter hands you the menu. Now, you've decided on what you want. How would you order a pasta dish and a drink?",
    },
    {
      id: "4",
      role: "user",
      content: "I want the spaghetti carbonara and a glass of wine red.",
      correction: {
        original: "a glass of wine red",
        corrected: "a glass of red wine",
        explanation: "In English, adjectives (like colors) come before the noun. So it's 'red wine', not 'wine red'.",
      },
    },
    {
      id: "5",
      role: "assistant",
      content: "Good order! I noticed a small grammar point — remember in English, colors come before the noun: 'red wine', not 'wine red'. The waiter asks if you'd like anything else. What do you say?",
    },
  ])

  const handleSend = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content },
    ])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-foreground truncate">Pratica de Conversacao</h2>
          <p className="text-xs text-muted-foreground truncate">Ordering Food at a Restaurant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        <div className="flex flex-col gap-3 sm:gap-4">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  )
}
