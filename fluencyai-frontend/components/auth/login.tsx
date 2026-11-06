"use client"

import { NotebookPen } from "lucide-react"
import { toast } from "sonner"
import { auth, googleProvider } from "@/lib/firebase"

export function Login() {
  const handleLogin = () => {
    auth.signInWithPopup(googleProvider)
      .catch((error) => {
        console.error("Erro ao fazer login:", error.message);
        toast.error("Não foi possível entrar com o Google. Tente novamente.");
      });
  }

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-[32px] bg-cat-video text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-6">
          <NotebookPen className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-medium tracking-tight mb-2 text-balance">Bem-vindo ao FluencyAI</h1>
        <p className="text-foreground/75 mb-8 text-sm text-balance">Entre para praticar inglês com a Ana, sua professora de IA.</p>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-card text-foreground font-medium rounded-full hover:bg-surface-hover transition-colors"
        >
          {/* Ícone SVG do Google */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuar com o Google
        </button>
      </div>
    </div>
  )
}