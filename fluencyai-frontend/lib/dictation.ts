import type { Flashcard } from "@/lib/api"

export function normalizeAnswer(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’‘`']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function isDictationMatch(expected: string, typed: string): boolean {
  const t = normalizeAnswer(typed)
  return t.length > 0 && normalizeAnswer(expected) === t
}

// Cartões de erro: o alvo é a frase corrigida (1ª linha do verso)
export function dictationTarget(card: Flashcard): string {
  return card.source === "erro" ? card.back.split("\n")[0] : card.front
}
