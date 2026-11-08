"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, SpellCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { createErrorCards, getErrors, type ErrorCategory, type ErrorsResponse } from "@/lib/api"
import { ERROR_CATEGORY_LABEL } from "@/lib/error-categories"

export function ErrorBank() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<ErrorsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [creating, setCreating] = useState<string | null>(null)
  const [filter, setFilter] = useState<ErrorCategory | "all">("all")

  const fetchErrors = useCallback(async () => {
    setFailed(false)
    try {
      setData(await getErrors())
    } catch (error) {
      console.error("Erro ao procurar erros:", error)
      setFailed(true)
      toast.error("Não foi possível carregar seus erros.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (user) {
      fetchErrors()
    } else {
      setLoading(false)
    }
  }, [user, authLoading, fetchErrors])

  const create = async (key: string, ids?: string[]) => {
    setCreating(key)
    try {
      const { count } = await createErrorCards(ids)
      toast.success(count === 1 ? "1 flashcard criado" : `${count} flashcards criados`)
      await fetchErrors()
    } catch (error) {
      console.error("Erro ao criar flashcards:", error)
      toast.error("Não foi possível criar os flashcards.")
    } finally {
      setCreating(null)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const groups = data?.groups ?? []
  // Se a categoria filtrada desaparecer (ex.: dados atualizados), volta a mostrar tudo
  const activeFilter = filter !== "all" && !groups.some(g => g.category === filter) ? "all" : filter
  const visible = activeFilter === "all" ? groups : groups.filter(g => g.category === activeFilter)
  const pending = data?.pending ?? 0
  const chips = [
    { key: "all" as const, label: "Todos" },
    ...groups.map(g => ({ key: g.category, label: `${ERROR_CATEGORY_LABEL[g.category]} · ${g.count}` })),
  ]

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full gap-6 px-4 py-8 sm:py-12">
      <Link href="/chat" className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Conversas
      </Link>
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-14 h-14 rounded-full bg-cat-streak flex items-center justify-center mb-2">
          <SpellCheck className="w-6 h-6 text-foreground" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground">Meus erros</h1>
        <p className="text-sm text-muted-foreground">Os erros que a Ana corrigiu, agrupados por tipo.</p>
      </div>

      {failed && !data ? (
        <div className="flex flex-col items-center p-8 bg-cat-cards rounded-3xl text-center gap-4">
          <p className="text-foreground/75 text-sm max-w-sm">Não foi possível carregar seus erros.</p>
          <button
            type="button"
            onClick={() => { setLoading(true); fetchErrors() }}
            className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Tentar de novo
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center p-8 bg-cat-cards rounded-3xl text-center gap-4">
          <p className="text-foreground/75 text-sm max-w-sm">
            Nenhum erro por aqui ainda. Converse com a Ana para começar!
          </p>
          <Link
            href="/chat"
            className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Ir para o chat
          </Link>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => create("all")}
            disabled={pending === 0 || creating !== null}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {creating === "all" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span>Criar flashcards ({pending})</span>
          </button>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
            {chips.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={activeFilter === key}
                onClick={() => setFilter(key)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-medium transition-colors",
                  activeFilter === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-surface-hover"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {visible.map(group => {
            const pendingIds = group.items.filter(i => !i.flashcardCreated).map(i => i.id).slice(0, 20)
            return (
              <section key={group.category} className="bg-card rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-medium tracking-tight text-foreground">
                    {ERROR_CATEGORY_LABEL[group.category]}
                    <span className="ml-2 text-sm text-muted-foreground">{group.count}</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => create(group.category, pendingIds)}
                    disabled={pendingIds.length === 0 || creating !== null}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface text-foreground text-xs font-medium hover:bg-surface-hover transition-colors disabled:opacity-50"
                  >
                    {creating === group.category && <Loader2 className="w-4 h-4 animate-spin" />}
                    Criar flashcards
                  </button>
                </div>
                <ul className="flex flex-col gap-3">
                  {group.items.map(item => (
                    <li key={item.id} className="bg-surface rounded-2xl p-4 flex flex-col gap-1.5 text-sm">
                      <p className="line-through text-destructive break-words">{item.original}</p>
                      <p className="text-success font-medium break-words">{item.corrected}</p>
                      <p className="text-muted-foreground break-words">{item.explanation}</p>
                      {item.flashcardCreated && (
                        <span className="self-start mt-1 bg-cat-cards text-foreground px-3 py-1 rounded-full text-xs font-medium">
                          Virou flashcard
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
