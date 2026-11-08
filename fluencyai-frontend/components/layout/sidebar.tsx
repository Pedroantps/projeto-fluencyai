"use client"

import { Home, CalendarDays, Layers, MessageCircle, User, NotebookPen } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export const navItems = [
  { href: "/", icon: Home, label: "Início" },
  { href: "/schedule", icon: CalendarDays, label: "Plano" },
  { href: "/review", icon: Layers, label: "Revisão" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/profile", icon: User, label: "Perfil" },
]

/** Rail de ícones em pílula (desktop/tablet). Mobile usa a BottomNav. */
export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-3 top-3 bottom-3 z-40 hidden w-[76px] flex-col items-center rounded-[28px] bg-sidebar py-5 md:flex">
      <Link
        href="/"
        aria-label="FluencyAI"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <NotebookPen className="h-5 w-5" />
      </Link>

      <nav className="my-auto flex flex-col gap-3" aria-label="Principal">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              title={label}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-surface-hover"
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>

      <ThemeToggle />
    </aside>
  )
}
