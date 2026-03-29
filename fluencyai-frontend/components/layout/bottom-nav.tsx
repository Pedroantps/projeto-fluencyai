"use client"

import { Home, Calendar, BookOpen, MessageCircle, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/schedule", icon: Calendar, label: "Plano" },
  { href: "/review", icon: BookOpen, label: "Revisao" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/profile", icon: User, label: "Perfil" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around h-16 border-t border-border/50 bg-sidebar/95 backdrop-blur-sm md:hidden">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 flex-1 text-[10px] sm:text-xs transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isActive && (
              <span className="absolute top-0 inset-x-0 mx-auto w-8 h-0.5 bg-primary rounded-full" />
            )}
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
