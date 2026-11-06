export type TextToken = { kind: "word" | "text"; value: string; index: number }

// Candidates are any letter run; only plain ASCII words (what the backend accepts for
// /api/words/lookup) are tappable, so accented/non-English words stay plain text.
const WORD_RE = /\p{L}+(?:['’-]\p{L}+)*/gu
const LOOKUP_RE = /^[A-Za-z]+(?:['’-][A-Za-z]+)*$/

export function tokenize(text: string): TextToken[] {
  const tokens: TextToken[] = []
  let last = 0
  for (const match of text.matchAll(WORD_RE)) {
    const start = match.index ?? 0
    if (start > last) tokens.push({ kind: "text", value: text.slice(last, start), index: last })
    const tappable = match[0].length <= 60 && LOOKUP_RE.test(match[0])
    tokens.push({ kind: tappable ? "word" : "text", value: match[0], index: start })
    last = start + match[0].length
  }
  if (last < text.length) tokens.push({ kind: "text", value: text.slice(last), index: last })
  return tokens
}

// Trimmed sentence containing `index`; delimited by . ! ? or newline; max 500 chars.
export function sentenceAt(text: string, index: number): string {
  const isDelim = (c: string) => c === "." || c === "!" || c === "?" || c === "\n"
  let start = index
  while (start > 0 && !isDelim(text[start - 1])) start--
  let end = index
  while (end < text.length && !isDelim(text[end])) end++
  if (end < text.length && text[end] !== "\n") end++ // keep the terminating punctuation
  return text.slice(start, end).trim().slice(0, 500)
}
