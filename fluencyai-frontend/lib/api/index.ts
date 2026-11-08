import { apiBlob, apiJson, jsonBody } from "./client"
import type {
  ChatMessage, ChatReply, ChatSessionSummary, DaySchedule, ErrorsResponse, Flashcard, MeResponse,
  PreferencesInput, TaskUpdate, TranscribeResponse, WordLookup,
} from "./types"

export { ApiError } from "./client"
export * from "./types"

export function getMe(name?: string | null) {
  const qs = name ? `?name=${encodeURIComponent(name)}` : ""
  return apiJson<MeResponse>(`/api/me${qs}`, { cache: "no-store" })
}

export function updatePreferences(prefs: PreferencesInput) {
  return apiJson<unknown>("/api/user/preferences", jsonBody("PATCH", prefs))
}

export function getSchedule() {
  return apiJson<DaySchedule[]>("/api/schedule", { cache: "no-store" })
}

export function resetSchedule() {
  return apiJson<DaySchedule[]>("/api/schedule/reset", { method: "POST" })
}

export function updateTask(id: string, update: TaskUpdate) {
  return apiJson<unknown>(`/api/schedule/task/${encodeURIComponent(id)}`, jsonBody("PATCH", update))
}

export function listChatSessions() {
  return apiJson<ChatSessionSummary[]>("/api/chat/sessions", { cache: "no-store" })
}

export function createChatSession(title?: string) {
  return apiJson<ChatSessionSummary>("/api/chat/sessions", jsonBody("POST", title ? { title } : {}))
}

export function deleteChatSession(id: string) {
  return apiJson<unknown>(`/api/chat/sessions/${encodeURIComponent(id)}`, { method: "DELETE" })
}

export function getSessionMessages(id: string) {
  return apiJson<ChatMessage[]>(`/api/chat/sessions/${encodeURIComponent(id)}/messages`, { cache: "no-store" })
}

export function sendSessionMessage(id: string, message: string) {
  return apiJson<ChatReply>(`/api/chat/sessions/${encodeURIComponent(id)}/messages`, jsonBody("POST", { message }))
}

export function openTaskSession(taskId: string) {
  return apiJson<{ sessionId: string; created: boolean }>("/api/chat/sessions/open-task", jsonBody("POST", { taskId }))
}

export function saveWord(word: string, context?: string) {
  return apiJson<unknown>("/api/words/save", jsonBody("POST", { word, context }))
}

export function lookupWord(word: string, context?: string) {
  return apiJson<WordLookup>("/api/words/lookup", jsonBody("POST", { word, context }))
}

export function generateDeck() {
  return apiJson<unknown>("/api/flashcards/generate-batch", { method: "POST" })
}

export function getDueCards() {
  return apiJson<Flashcard[]>("/api/flashcards/due", { cache: "no-store" })
}

export function reviewCard(id: string, quality: number, mode?: "normal" | "dictation") {
  const body = mode ? { quality, mode } : { quality }
  return apiJson<unknown>(`/api/flashcards/${encodeURIComponent(id)}/review`, jsonBody("PATCH", body))
}

export function transcribeAudio(audio: Blob, filename = "recording.webm") {
  const formData = new FormData()
  formData.append("audio", audio, filename)
  // Sem Content-Type manual: o browser define o boundary do multipart
  return apiJson<TranscribeResponse>("/api/transcribe", { method: "POST", body: formData })
}

export function synthesizeSpeech(text: string) {
  return apiBlob("/api/tts", jsonBody("POST", { text }))
}

export function getErrors() {
  return apiJson<ErrorsResponse>("/api/errors", { cache: "no-store" })
}

export function createErrorCards(ids?: string[]) {
  return apiJson<{ count: number }>("/api/errors/flashcards", jsonBody("POST", ids ? { ids } : {}))
}
