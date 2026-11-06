import { apiBlob, apiJson, jsonBody } from "./client"
import type {
  ChatMessage, ChatReply, DaySchedule, Flashcard, MeResponse,
  PreferencesInput, TaskUpdate, TranscribeResponse,
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

export function sendChat(message: string) {
  return apiJson<ChatReply>("/api/chat", jsonBody("POST", { message }))
}

export function getChatHistory() {
  return apiJson<ChatMessage[]>("/api/chat/history")
}

export function clearChatHistory() {
  return apiJson<unknown>("/api/chat/history", { method: "DELETE" })
}

export function saveWord(word: string, context?: string) {
  return apiJson<unknown>("/api/words/save", jsonBody("POST", { word, context }))
}

export function generateDeck() {
  return apiJson<unknown>("/api/flashcards/generate-batch", { method: "POST" })
}

export function getDueCards() {
  return apiJson<Flashcard[]>("/api/flashcards/due", { cache: "no-store" })
}

export function reviewCard(id: string, quality: number) {
  return apiJson<unknown>(`/api/flashcards/${encodeURIComponent(id)}/review`, jsonBody("PATCH", { quality }))
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
