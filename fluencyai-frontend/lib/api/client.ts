import { auth } from "@/lib/firebase"

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser
  if (!user) throw new ApiError(401, "Utilizador não autenticado")
  const token = await user.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

/** fetch com Bearer token do Firebase; lança ApiError quando !res.ok. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const authHeader = await getAuthHeader()
  headers.set("Authorization", authHeader.Authorization)

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    let message = res.statusText || "Erro na requisição"
    try {
      const body: unknown = await res.json()
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
        message = body.error
      }
    } catch {
      // corpo não é JSON; mantém a mensagem padrão
    }
    throw new ApiError(res.status, message)
  }
  return res
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init)
  return (await res.json()) as T
}

export async function apiBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const res = await apiFetch(path, init)
  return res.blob()
}

export function jsonBody(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }
}
