"use client"

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

export function Header({ userName = "Estudante", reviewsCount = 0 }: HeaderProps) {
  const message =
    reviewsCount > 0
      ? `${reviewsCount} ${reviewsCount === 1 ? "flashcard espera" : "flashcards esperam"} por você hoje. Vamos manter a ofensiva.`
      : "Tudo em dia por aqui. Que tal conversar um pouco com a Ana?"

  return (
    <header className="flex flex-col gap-3 pt-6 pb-2 lg:pt-10">
      <h1 className="max-w-[16ch] text-4xl font-medium leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
        {greeting()}, {userName}
      </h1>
      <p className="max-w-[48ch] text-base text-muted-foreground text-pretty">{message}</p>
    </header>
  )
}
