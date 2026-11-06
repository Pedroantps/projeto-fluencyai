import { synthesizeSpeech } from "@/lib/api"

let currentAudio: HTMLAudioElement | null = null

function stopCurrent() {
  currentAudio?.pause()
  currentAudio = null
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel()
}

// Fallback: voz do próprio navegador (menor qualidade, mas sempre disponível)
function speakWithBrowser(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "en-US"
  const voices = window.speechSynthesis.getVoices()
  const voice = voices.find((v) => v.lang === "en-US" && /natural|google|aria|samantha/i.test(v.name))
    ?? voices.find((v) => v.lang.startsWith("en"))
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
  return true
}

// Tenta a voz do servidor (Azure ou Kokoro); se falhar, usa a voz do navegador.
// Retorna qual motor foi usado, ou null se nenhum funcionou.
export async function speak(text: string): Promise<"server" | "browser" | null> {
  stopCurrent()
  try {
    const blob = await synthesizeSpeech(text)
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    currentAudio = audio
    await audio.play()
    return "server"
  } catch (error) {
    console.warn("TTS do servidor indisponível, usando a voz do navegador:", error)
    return speakWithBrowser(text) ? "browser" : null
  }
}
