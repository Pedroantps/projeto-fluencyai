"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Send, Volume2, ChevronDown, Sparkles, Loader2, BookmarkPlus, X, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/firebase" // Precisamos disto para pegar o email

// Tipagem das Mensagens
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

// ==========================================
// 1. COMPONENTE VISUAL DO BALÃO DE CHAT
// ==========================================
function ChatBubble({ message, onSaveWord }: { message: Message, onSaveWord?: (context: string) => void }) {
  const [showCorrection, setShowCorrection] = useState(false)
  const isUser = message.role === "user"

  // Função para ler o texto (Azure TTS)
  const handleSpeak = async () => {
    try {
      const response = await fetch("http://localhost:3333/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message.content }),
      });

      if (!response.ok) throw new Error("Falha ao obter áudio");

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error("Erro ao reproduzir áudio:", error);
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[88%] sm:max-w-[80%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-primary/20 text-foreground rounded-bl-md"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs text-primary font-medium">Ana (AI Teacher)</span>
          </div>
        )}
        
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {/* BOTÕES DE AÇÃO DA IA (Listen & Save Word) */}
        {!isUser && (
          <div className="mt-3 flex items-center gap-4 border-t border-border/30 pt-2">
            <button onClick={handleSpeak} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Volume2 className="w-3.5 h-3.5" />
              Listen
            </button>
            
            <button 
              onClick={() => onSaveWord?.(message.content)} 
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save Word
            </button>
          </div>
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

// ==========================================
// 2. COMPONENTE VISUAL DO INPUT
// ==========================================
function ChatInput({ onSend, isLoading }: { onSend: (message: string) => void, isLoading: boolean }) {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading && !isTranscribing) {
      onSend(message)
      setMessage("")
    }
  }

  const handlePointerDown = async () => {
    if (isLoading || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        if (audioBlob.size > 1000) await sendAudioToWhisper(audioBlob);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erro ao acessar microfone:", error);
      alert("Não foi possível acessar o microfone.");
    }
  };

  const handlePointerUp = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToWhisper = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setMessage("Transcribing your voice...");
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const response = await fetch("http://localhost:3333/api/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Falha na transcrição");
      const data = await response.json();
      setMessage(data.text); 
    } catch (error) {
      console.error("Erro no Whisper:", error);
      setMessage("Could not transcribe audio. Please type.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 bg-card border-t border-border/50">
      <div className="flex-1 min-w-0 flex items-center px-3 py-2 rounded-xl bg-surface border border-border/50 focus-within:border-primary/50 transition-colors">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading || isTranscribing}
          placeholder={isTranscribing ? "Whisper is thinking..." : "Type or hold to speak..."}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
        />
      </div>
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        disabled={isLoading || isTranscribing}
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-all select-none touch-none",
          isRecording ? "bg-primary text-primary-foreground scale-110" : "bg-surface border border-border/50 text-muted-foreground hover:text-foreground"
        )}
      >
        {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
        {isRecording && <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />}
      </button>
      <button
        type="submit"
        disabled={!message.trim() || isLoading || isTranscribing}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shrink-0 disabled:opacity-40 hover:bg-primary/90 transition-colors"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </form>
  )
}

// ==========================================
// 3. COMPONENTE PRINCIPAL (INTERFACE)
// ==========================================
// ==========================================
// 3. COMPONENTE PRINCIPAL (INTERFACE)
// ==========================================
export function ChatInterface() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Começa vazio, vai ser preenchido pela base de dados
  const [messages, setMessages] = useState<Message[]>([])

  const [wordModalOpen, setWordModalOpen] = useState(false)
  const [wordContext, setWordContext] = useState("")
  const [wordToSave, setWordToSave] = useState("")
  const [isSavingWord, setIsSavingWord] = useState(false)

  // Busca o histórico assim que o email estiver disponível
  const loadHistory = async (email: string) => {
    try {
      const res = await fetch(`http://localhost:3333/api/chat/history?email=${email}`)
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          setMessages(data) // Carrega as 24h
        } else {
          // Se estiver vazio, dá o "Olá" inicial
          setMessages([{
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm Ana, your AI English teacher. What would you like to practice today? You can speak in Portuguese if you forget a word!"
          }])
        }
      }
    } catch (error) {
      console.error("Erro a carregar histórico", error)
    }
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        setUserEmail(user.email);
        loadHistory(user.email);
      }
    });
    return () => unsubscribe();
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Lógica de Envio de Mensagem (Agora envia o Email junto)
  const handleSend = async (content: string) => {
    if (!userEmail) return;

    const newUserMessage: Message = { id: Date.now().toString(), role: "user", content }
    setMessages((prev) => [...prev, newUserMessage])
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:3333/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, message: content }), // MUDANÇA: enviando email!
      })

      if (!response.ok) throw new Error("Falha ao comunicar com o servidor.")

      const data = await response.json() 
      
      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        correction: data.correction
      }

      setMessages((prev) => [...prev, newAiMessage])

    } catch (error) {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Oops! I had a problem connecting to the server."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Lógica do NOVO CHAT (Limpa tudo)
  const handleNewChat = async () => {
    if (!userEmail || isLoading) return;
    
    // Limpa o ecrã instantaneamente
    setMessages([{
      id: Date.now().toString(),
      role: "assistant",
      content: "Chat cleared! What's on your mind today? Let's start fresh."
    }]);

    try {
      // Pede à base de dados para apagar o histórico
      await fetch(`http://localhost:3333/api/chat/history?email=${userEmail}`, {
        method: "DELETE"
      });
    } catch (error) {
      console.error("Erro ao limpar chat", error);
    }
  }

  const handleSaveWord = async () => {
    if (!wordToSave.trim() || !userEmail) return;
    setIsSavingWord(true);
    try {
      const res = await fetch("http://localhost:3333/api/words/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, word: wordToSave.trim(), context: wordContext })
      });
      if (res.ok) {
        setWordToSave("");
        setWordModalOpen(false);
      }
    } finally {
      setIsSavingWord(false);
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* CABEÇALHO COM BOTÃO DE NOVO CHAT */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium text-foreground truncate">AI Conversation Practice</h2>
          <p className="text-xs text-muted-foreground truncate">Powered by Groq Whisper & Llama-3</p>
        </div>
        
        {/* NOVO BOTÃO AQUI */}
        <button 
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Novo Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        <div className="flex flex-col gap-3 sm:gap-4">
          {messages.map((message) => (
            <ChatBubble 
              key={message.id} 
              message={message} 
              onSaveWord={(context) => {
                setWordContext(context);
                setWordModalOpen(true);
              }}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSend={handleSend} isLoading={isLoading} />

      {/* MODAL DE GUARDAR PALAVRA (Manteve-se inalterado) */}
      {wordModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-primary">
                <BookmarkPlus className="w-5 h-5" />
                <h3 className="font-bold">Guardar no Word Bank</h3>
              </div>
              <button onClick={() => setWordModalOpen(false)} className="p-2 rounded-full hover:bg-surface text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Palavra ou Expressão</label>
                <input
                  type="text" autoFocus placeholder="Ex: Overwhelmed"
                  value={wordToSave} onChange={(e) => setWordToSave(e.target.value)}
                  className="w-full bg-surface border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Contexto Capturado</label>
                <div className="p-3 bg-surface/50 rounded-xl text-xs text-muted-foreground italic border border-border/30 max-h-24 overflow-y-auto">
                  "{wordContext}"
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveWord} disabled={!wordToSave.trim() || isSavingWord}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingWord ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Palavra"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}