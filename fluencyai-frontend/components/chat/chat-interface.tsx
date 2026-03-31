"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Send, Volume2, ChevronDown, Sparkles, Loader2, BookOpen, X } from "lucide-react"
import { cn } from "@/lib/utils"

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

// Componente Visual do Balão de Chat (Continua igual)
function ChatBubble({ message }: { message: Message }) {
  const [showCorrection, setShowCorrection] = useState(false)
  const isUser = message.role === "user"

  // Função para ler o texto (Azure TTS)
  const handleSpeak = async () => {
    try {
      const response = await fetch("http://localhost:3333/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        {!isUser && (
          <button onClick={handleSpeak} className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            <Volume2 className="w-3 h-3" />
            Listen
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

// Componente Visual do Input - REFORMULADO COM WHISPER E SEGURAR PARA FALAR!
function ChatInput({ onSend, isLoading }: { onSend: (message: string) => void, isLoading: boolean }) {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false) // Novo estado de carregamento
  
  // Referências para o gravador de áudio real (MediaRecorder)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Enviar texto digitado
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading && !isTranscribing) {
      onSend(message)
      setMessage("")
    }
  }

  // --- Lógica Estilo WhatsApp (Segurar para Gravar Áudio Real) ---
  const handlePointerDown = async () => {
    if (isLoading || isTranscribing) return;

    try {
      // Pede permissão para o microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = []; // Limpa os chunks anteriores

      // Enquanto grava, vai salvando os pedacinhos de áudio
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Quando para de gravar, envia para o back-end (Whisper)
      mediaRecorder.onstop = async () => {
        // Cria um arquivo Blob (WEBM ou OGG dependendo do navegador)
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Desliga o microfone fisicamente
        stream.getTracks().forEach(track => track.stop());

        if (audioBlob.size > 1000) { // Evita enviar cliques acidentais vazios
          await sendAudioToWhisper(audioBlob);
        }
      };

      // Inicia a gravação
      mediaRecorder.start();
      setIsRecording(true);

    } catch (error) {
      console.error("Erro ao acessar microfone:", error);
      alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  };

  const handlePointerUp = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop(); // Isso dispara o 'onstop' acima
      setIsRecording(false);
    }
  };

  // --- Função para enviar o arquivo de áudio para o Whisper no Back-end ---
  const sendAudioToWhisper = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setMessage("Transcribing your voice...");

    try {
      // Prepara o formulário para enviar o arquivo (Multipart/Form-Data)
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Faz o pedido ao nosso back-end
      const response = await fetch("http://localhost:3333/api/transcribe", {
        method: "POST",
        body: formData, // O fetch já define o Content-Type correto para FormData
      });

      if (!response.ok) throw new Error("Falha na transcrição");

      const data = await response.json();
      
      // Coloca o texto perfeito e pontuado na caixinha!
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
      {/* Input de Texto */}
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

      {/* Botão de Microfone (Estilo WhatsApp -> Segurar para Gravar) */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp} // Se arrastar o mouse para fora, para também
        disabled={isLoading || isTranscribing}
        aria-label="Segurar para falar"
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-all select-none touch-none", // select-none e touch-none são essenciais para o hold-to-talk
          isRecording
            ? "bg-primary text-primary-foreground scale-110"
            : "bg-surface border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-50"
        )}
      >
        {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
        )}
      </button>

      {/* Botão de Enviar */}
      <button
        type="submit"
        disabled={!message.trim() || isLoading || isTranscribing}
        aria-label="Enviar"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </form>
  )
}

// Componente Principal da Interface (Continua igual)
export function ChatInterface() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingCards, setIsGeneratingCards] = useState(false)
  const [flashcards, setFlashcards] = useState<{front: string, back: string}[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello, Pedro! I'm Ana, your AI English teacher. What would you like to practice today? Don't worry if you forget a word in English, you can speak in Portuguese and I'll help you!",
    }
  ])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (content: string) => {
    const newUserMessage: Message = { id: Date.now().toString(), role: "user", content }
    setMessages((prev) => [...prev, newUserMessage])
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:3333/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content }),
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
      console.error("Erro no chat:", error)
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Oops! I had a problem connecting to the server. Please check if the back-end is running."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateFlashcards = async () => {
    // Pega apenas as mensagens de texto para não mandar IDs e dados inúteis para o Gemini
    const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
    
    setIsGeneratingCards(true);
    try {
      const response = await fetch("http://localhost:3333/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatHistory }),
      });

      if (!response.ok) throw new Error("Falha ao gerar flashcards");

      const data = await response.json();
      setFlashcards(data.flashcards);
      
    } catch (error) {
      console.error(error);
      alert("Não foi possível gerar os flashcards no momento.");
    } finally {
      setIsGeneratingCards(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho do Chat */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-foreground truncate">AI Conversation Practice</h2>
          <p className="text-xs text-muted-foreground truncate">Powered by Groq Whisper & Llama-3</p>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        <div className="flex flex-col gap-3 sm:gap-4">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Reformulado */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  )
}