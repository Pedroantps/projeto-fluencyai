"use client"

import { useEffect, useState } from "react"
import { Sparkles, Flame, Volume2, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { auth, googleProvider } from "@/lib/firebase"
import { Logo, LogoMark } from "@/components/brand/logo"
import { cn } from "@/lib/utils"

const GREETINGS = ["Hi, I'm Ana!", "Ready to talk?", "Let's practice!"]

/** Balãozinho da Ana saindo da logo: digita e alterna cumprimentos (ciclo de ~3,2 s). */
function AnaGreeting({ className }: { className?: string }) {
  const [index, setIndex] = useState(0)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let timer: ReturnType<typeof setTimeout>
    const cycle = (i: number) => {
      timer = setTimeout(() => {
        setTyping(true)
        timer = setTimeout(() => {
          setTyping(false)
          setIndex((i + 1) % GREETINGS.length)
          cycle(i + 1)
        }, 900)
      }, 2300)
    }
    cycle(0)
    return () => clearTimeout(timer)
  }, [])

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 items-center whitespace-nowrap rounded-2xl rounded-bl-md bg-cat-chat px-3.5 text-[13px] font-medium text-foreground",
        className
      )}
    >
      {typing ? (
        <span className="flex items-center gap-1 px-1">
          {[0, 1, 2].map((d) => (
            <span key={d} className="typing-dot h-1.5 w-1.5 rounded-full bg-foreground" style={{ animationDelay: `${d * 160}ms` }} />
          ))}
        </span>
      ) : (
        <span key={index} className="animate-in fade-in slide-in-from-bottom-1 duration-200">
          {GREETINGS[index]}
        </span>
      )}
    </span>
  )
}

/** "FluencyAI" com o AI azul sublinhado por um traço de caneta. */
function BrandName() {
  return (
    <>
      Fluency
      <span className="relative inline-block text-primary">
        AI
        <svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true" className="absolute -bottom-2.5 left-[-4%] h-2.5 w-[108%] overflow-visible">
          <path d="M2 8 C 28 3, 62 2, 98 6" pathLength={100} fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="pen-draw" />
        </svg>
      </span>
    </>
  )
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

/** Prévia do app montada com as mesmas peças das telas reais (decorativa). */
function AppPreview() {
  return (
    <div aria-hidden="true" className="flex h-full items-center justify-center overflow-hidden rounded-[32px] bg-sidebar p-8 xl:p-12">
      <div className="flex w-full max-w-[440px] flex-col gap-4">
      {/* Ofensiva */}
      <div style={{ "--i": 0 } as React.CSSProperties} className="rise-in flex items-center gap-3 self-start rounded-full bg-card py-2 pl-2 pr-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cat-streak text-foreground">
          <Flame className="h-5 w-5" />
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="tabular text-lg font-medium text-foreground">7</span>
          <span className="text-sm text-muted-foreground">dias seguidos</span>
        </span>
      </div>

      {/* Conversa com a Ana */}
      <div className="flex flex-col gap-3">
        <div style={{ "--i": 1 } as React.CSSProperties} className="rise-in max-w-[78%] self-end rounded-3xl rounded-br-lg bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
          Yesterday I go to the beach with my friends.
        </div>
        <div style={{ "--i": 2 } as React.CSSProperties} className="rise-in flex max-w-[86%] flex-col gap-1.5 self-start">
          <div className="rounded-3xl rounded-bl-lg bg-cat-chat px-4 py-3 text-sm leading-relaxed text-foreground">
            <div className="mb-2 flex items-center gap-2 border-b border-foreground/10 pb-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card">
                <Sparkles className="h-3 w-3 text-foreground" />
              </span>
              <span className="text-xs font-medium text-foreground">Ana (AI Teacher)</span>
            </div>
            Sounds fun! Which beach did you go to?
          </div>
          <div className="rounded-2xl border border-success/20 bg-card p-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-destructive line-through">I go to the beach</span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                <Check className="h-3.5 w-3.5" />
                I went to the beach
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div style={{ "--i": 3 } as React.CSSProperties} className="rise-in mt-2 flex flex-col items-center gap-4 rounded-[28px] bg-cat-video px-6 py-8 text-center">
        <span className="text-sm text-foreground/70">Toque para virar</span>
        <span className="text-3xl font-medium leading-tight tracking-tight text-foreground xl:text-4xl">look forward to</span>
        <span className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground">
          <Volume2 className="h-4 w-4" />
          Ouvir
        </span>
      </div>
      </div>
    </div>
  )
}

export function Login() {
  const [signingIn, setSigningIn] = useState(false)

  const handleLogin = () => {
    setSigningIn(true)
    auth.signInWithPopup(googleProvider)
      .catch((error) => {
        console.error("Erro ao fazer login:", error.message);
        if (error?.code !== "auth/popup-closed-by-user" && error?.code !== "auth/cancelled-popup-request") {
          toast.error("Não foi possível entrar com o Google. Tente novamente.");
        }
      })
      .finally(() => setSigningIn(false));
  }

  const googleButton = (
    <button
      type="button"
      onClick={handleLogin}
      disabled={signingIn}
      aria-busy={signingIn}
      className="relative flex min-h-14 w-full max-w-[300px] items-center justify-center rounded-full bg-primary py-2 pl-14 pr-5 text-[15px] font-medium text-primary-foreground transition-[background-color,transform] duration-150 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-px hover:bg-primary/90 active:translate-y-px active:scale-[0.985] disabled:cursor-wait disabled:opacity-80 min-[360px]:px-14 sm:text-base lg:max-w-none"
    >
      <span className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white">
        {signingIn ? <Loader2 className="h-5 w-5 animate-spin text-[#1E44C4]" aria-hidden="true" /> : <GoogleMark />}
      </span>
      <span className="whitespace-nowrap">{signingIn ? "Abrindo o Google…" : "Continuar com o Google"}</span>
    </button>
  )

  const footnote = "Você entra com sua conta Google, sem criar outra senha."

  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-3 lg:p-3">
      {/* Celular e tablet: tudo centralizado, marca no alto e botão na zona do polegar */}
      <section className="relative isolate mx-auto flex w-full max-w-md flex-col items-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,14dvh)] text-center lg:hidden">
        <div aria-hidden="true" className="paper-ruled absolute inset-0 -z-10" />
        <div className="relative">
          <LogoMark className="h-20 w-20" />
          <AnaGreeting className="absolute bottom-[calc(100%-6px)] left-[calc(100%-10px)]" />
        </div>
        <h1 className="mt-7 text-4xl font-medium leading-none tracking-tight text-foreground"><BrandName /></h1>
        <p className="mt-3 max-w-[28ch] text-sm text-muted-foreground text-pretty">
          Converse em inglês com a Ana, sua professora de IA, um pouco por dia.
        </p>

        <div className="mt-[max(4rem,20dvh)] flex w-full justify-center">{googleButton}</div>
        <p className="mt-auto max-w-[32ch] pt-10 text-xs text-muted-foreground text-pretty">{footnote}</p>
      </section>

      {/* Desktop */}
      <section className="relative isolate hidden flex-col px-14 py-10 lg:flex xl:px-20">
        <div aria-hidden="true" className="paper-ruled absolute inset-0 -z-10" />
        <Logo />

        <div className="my-auto flex w-full max-w-md flex-col gap-8 py-12">
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-medium leading-[1.05] tracking-tight text-foreground text-balance">
              Bem-vindo ao <span className="whitespace-nowrap"><BrandName /></span>
            </h1>
            <p className="max-w-[40ch] text-base text-muted-foreground text-pretty">
              Entre para praticar inglês com a Ana, sua professora de IA.
            </p>
          </div>
          {googleButton}
        </div>

        <p className="text-xs text-muted-foreground">{footnote}</p>
      </section>

      <div className="hidden lg:block">
        <AppPreview />
      </div>
    </main>
  )
}
