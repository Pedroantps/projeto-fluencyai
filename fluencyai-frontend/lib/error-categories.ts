import type { ErrorCategory } from "@/lib/api/types"

export const ERROR_CATEGORY_LABEL: Record<ErrorCategory, string> = {
  verb_tense: "Tempo verbal",
  preposition: "Preposição",
  article: "Artigo",
  word_order: "Ordem das palavras",
  word_choice: "Escolha de palavra",
  portuguese_word: "Palavra em português",
  spelling: "Ortografia",
  other: "Outros",
}

export const SOURCE_LABEL: Record<string, string> = {
  chat: "Chat",
  cronograma: "Cronograma",
  aleatorio: "Aleatório",
  erro: "Meus erros",
}
