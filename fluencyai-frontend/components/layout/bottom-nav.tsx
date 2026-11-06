"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navItems } from "@/components/layout/sidebar"
import { ThemeToggle } from "@/components/layout/theme-toggle"

/** Pílula flutuante no mobile. */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-between gap-0.5 rounded-full sm:gap-1 bg-sidebar p-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] md:hidden"
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-12 min-w-11 flex-1 items-center justify-center gap-2 rounded-full text-xs font-medium transition-colors",
              active ? "bg-primary text-primary-foreground sm:px-4 sm:flex-[1.6]" : "text-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {active && <span className="hidden sm:inline">{label}</span>}
          </Link>
        )
      })}
      <ThemeToggle className="h-12 w-12 shrink-0 bg-transparent" />
    </nav>
  )
}
