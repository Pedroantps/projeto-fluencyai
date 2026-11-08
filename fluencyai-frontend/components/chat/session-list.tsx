"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Loader2, MessageCircle, Plus, SpellCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/auth-provider"
import {
  createChatSession, deleteChatSession, getErrors, listChatSessions,
  type ChatSessionSummary,
} from "@/lib/api"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

export function SessionList() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [pendingErrors, setPendingErrors] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setFailed(false)
    try {
      setSessions(await listChatSessions())
    } catch (error) {
      console.error("Erro ao listar sessões:", error)
      setFailed(true)
    } finally {
      setLoading(false)
    }
    // A contagem de erros é um extra: se falhar, o card aparece sem número
    getErrors().then((e) => setPendingErrors(e.pending)).catch(() => setPendingErrors(null))
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (user) load()
    else setLoading(false)
  }, [user, authLoading, load])

  const handleNew = async () => {
    setCreating(true)
    try {
      const s = await createChatSession()
      router.push(`/chat/${s.id}`)
    } catch (error) {
      console.error("Erro ao criar sessão:", error)
      toast.error("Não foi possível criar a conversa.")
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apagar esta conversa? Seus erros corrigidos continuam salvos em Meus erros.")) return
    try {
      await deleteChatSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      console.error("Erro ao apagar sessão:", error)
      toast.error("Não foi possível apagar a conversa.")
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const errorsLabel =
    pendingErrors === null ? "Revise o que a Ana corrigiu"
    : pendingErrors === 0 ? "Nenhum erro pendente"
    : `${pendingErrors} ${pendingErrors === 1 ? "erro pendente" : "erros pendentes"}`

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full gap-6 px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground">Conversas</h1>
          <p className="text-sm text-muted-foreground mt-1">Pratique com a Ana, uma sessão por assunto.</p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          disabled={creating}
          aria-label="Nova conversa"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 shrink-0"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span className="hidden sm:inline">Nova conversa</span>
        </button>
      </div>

      <Link href="/errors" className="flex items-center gap-3 p-4 rounded-3xl bg-cat-streak hover:opacity-90 transition-opacity">
        <div className="w-11 h-11 rounded-full bg-card flex items-center justify-center shrink-0">
          <SpellCheck className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Meus erros</p>
          <p className="text-xs text-foreground/70">{errorsLabel}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-foreground/60 shrink-0" />
      </Link>

      {failed ? (
        <div className="flex flex-col items-center p-8 bg-cat-cards rounded-3xl text-center gap-4">
          <p className="text-foreground/75 text-sm">Não foi possível carregar suas conversas.</p>
          <button type="button" onClick={() => { setLoading(true); load() }} className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium">Tentar de novo</button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center p-8 bg-cat-chat rounded-3xl text-center gap-2">
          <p className="text-foreground/75 text-sm">Nenhuma conversa ainda. Comece uma nova ou abra uma tarefa de chat no seu plano.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-2 p-3 rounded-3xl bg-card">
              <Link href={`/chat/${s.id}`} className="flex flex-1 min-w-0 items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cat-chat flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.preview || "Sem mensagens"}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(s.updatedAt)}</span>
              </Link>
              <button
                type="button"
                aria-label={`Apagar conversa ${s.title}`}
                onClick={() => handleDelete(s.id)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
