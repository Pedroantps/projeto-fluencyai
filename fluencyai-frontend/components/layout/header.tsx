"use client"

import { useEffect, useState } from "react"

interface HeaderProps {
  userName?: string
  reviewsCount?: number
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

/** Sem `userName` ou `reviewsCount` (ainda carregando), mostra esqueletos no lugar. */
export function Header({ userName, reviewsCount }: HeaderProps) {
  // A saudação depende do relógio do usuário: calculada só no navegador para não divergir
  // do HTML gerado no servidor (UTC), o que causava o erro de hidratação #418.
  const [hello, setHello] = useState<string | null>(null)
  useEffect(() => setHello(greeting()), [])

  const message =
    reviewsCount === undefined
      ? null
      : reviewsCount > 0
        ? `${reviewsCount} ${reviewsCount === 1 ? "flashcard espera" : "flashcards esperam"} por você hoje. Vamos manter a ofensiva.`
        : "Tudo em dia por aqui. Que tal conversar um pouco com a Ana?"

  return (
    <header className="flex flex-col gap-3 pt-6 pb-2 lg:pt-10">
      <h1 className="max-w-[16ch] text-4xl font-medium leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
        {hello ?? <span aria-hidden="true" className="inline-block h-[0.8em] w-[5ch] animate-pulse rounded-lg bg-accent align-baseline" />},{" "}
        {userName ?? <span aria-hidden="true" className="inline-block h-[0.8em] w-[4ch] animate-pulse rounded-lg bg-accent align-baseline" />}
      </h1>
      {message ? (
        <p className="max-w-[48ch] text-base text-muted-foreground text-pretty">{message}</p>
      ) : (
        <span aria-hidden="true" className="h-6 w-full max-w-[40ch] animate-pulse rounded-md bg-accent" />
      )}
    </header>
  )
}
