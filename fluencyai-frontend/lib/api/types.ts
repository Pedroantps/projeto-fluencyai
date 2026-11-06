export type TaskType = "video" | "flashcard" | "chat"

export interface UserStats {
  streak: string | number
  words: string | number
  hours: string | number
  studyMinutes: number
  todayMinutes: number
  level: string
  studyTime: number | null
}

export interface MeResponse {
  userId: string
  stats: UserStats
}

export interface PreferencesInput {
  level?: string
  studyTime?: number
}

export interface Task {
  id: string
  type: TaskType
  title: string
  duration: number
  completed: boolean
  link?: string
  date: string
  order: number
}

export interface DaySchedule {
  dayName: string
  date: string
  fullDate: string
  tasks: Task[]
}

export interface TaskUpdate {
  completed?: boolean
  date?: string
  order?: number
}

export interface Correction {
  original: string
  corrected: string
  explanation: string
}

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  correction?: Correction
}

export interface ChatReply {
  reply: string
  correction?: Correction
}

export interface Flashcard {
  id: string
  front: string
  back: string
  source: string
}

export interface TranscribeResponse {
  text: string
}
