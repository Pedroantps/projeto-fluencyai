"use client"

import { useMemo, useState } from "react"
import { BookmarkPlus, Loader2, Volume2 } from "lucide-react"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { speak } from "@/lib/speech"
import { lookupWord, saveWord, type WordLookup } from "@/lib/api"
import { sentenceAt, tokenize } from "@/lib/text"

const lookupCache = new Map<string, WordLookup>()

function TappableWord({ word, text, index }: { word: string; text: string; index: number }) {
  const key = word.toLowerCase()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<WordLookup | null>(() => lookupCache.get(key) ?? null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const cached = lookupCache.get(key)
    if (cached) {
      setData(cached)
      return
    }
    setLoading(true)
    setFailed(false)
    try {
      const result = await lookupWord(word, sentenceAt(text, index))
      lookupCache.set(key, result)
      setData(result)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next && !data && !loading) void load()
  }

  const handleListen = async () => {
    const engine = await speak(word)
    if (!engine) toast.error("Não foi possível reproduzir o áudio.")
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveWord(word, sentenceAt(text, index))
      setSaved(true)
      toast.success("Palavra salva no Word Bank!")
    } catch {
      toast.error("Não foi possível guardar a palavra.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-sm underline-offset-4 hover:underline hover:decoration-dotted focus-visible:ring-2 focus-visible:ring-ring"
        >
          {word}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 text-sm" align="start">
        <div className="flex flex-col gap-2">
          <p className="font-bold text-foreground">{word}</p>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {failed && <p className="text-xs text-muted-foreground">Não foi possível traduzir agora.</p>}
          {data && (
            <div className="flex flex-col gap-1">
              <p className="text-foreground">{data.translation}</p>
              <p className="text-xs text-muted-foreground">{data.meaning}</p>
            </div>
          )}
          <div className="flex items-center gap-4 pt-2 border-t border-foreground/10">
            <button
              type="button"
              onClick={handleListen}
              className="flex items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Ouvir
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saved || saving}
              className="flex items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              {saved ? "Salva" : "Salvar"}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function TappableText({ text }: { text: string }) {
  const tokens = useMemo(() => tokenize(text), [text])
  return (
    <p className="whitespace-pre-wrap">
      {tokens.map((t) =>
        t.kind === "word" ? (
          <TappableWord key={t.index} word={t.value} text={text} index={t.index} />
        ) : (
          <span key={t.index}>{t.value}</span>
        ),
      )}
    </p>
  )
}
