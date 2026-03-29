"use client"

import { useState } from "react"
import { Home, Calendar, BookOpen, MessageCircle, User, Sparkles, X, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
}

function NavItem({ href, icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
      )}
    >
      <div className={cn(
        "relative",
        isActive && "after:absolute after:-left-4 after:top-1/2 after:-translate-y-1/2 after:w-0.5 after:h-5 after:bg-primary after:rounded-full"
      )}>
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  )
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: <Home className="h-5 w-5" />, label: "Dashboard" },
    { href: "/schedule", icon: <Calendar className="h-5 w-5" />, label: "Cronograma" },
    { href: "/review", icon: <BookOpen className="h-5 w-5" />, label: "Revisão" },
    { href: "/chat", icon: <MessageCircle className="h-5 w-5" />, label: "Prática" },
    { href: "/profile", icon: <User className="h-5 w-5" />, label: "Perfil" },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">FluencyAI</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
            onClick={onClose}
          />
        ))}
      </nav>

      <div className="p-4 mx-3 mb-4 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20">
        <p className="text-xs text-muted-foreground mb-2">Plano atual</p>
        <p className="text-sm font-medium text-foreground mb-3">Free Trial</p>
        <button className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          Fazer Upgrade
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile/Tablet drawer trigger button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-lg bg-card border border-border/50 text-muted-foreground hover:text-foreground md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Drawer overlay */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-sidebar-border bg-sidebar flex flex-col animate-in slide-in-from-left duration-300 md:hidden">
            <SidebarContent onClose={() => setIsDrawerOpen(false)} />
          </aside>
        </>
      )}
    </>
  )
}
