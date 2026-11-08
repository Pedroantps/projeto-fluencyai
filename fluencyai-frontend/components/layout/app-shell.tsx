import { Sidebar } from "@/components/layout/sidebar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
  /** Ocupa exatamente a altura da tela (chat). */
  fullHeight?: boolean
  className?: string
}

/** Casca compartilhada: rail à esquerda, conteúdo, pílula de navegação no mobile. */
export function AppShell({ children, fullHeight, className }: AppShellProps) {
  return (
    <div className={cn("bg-background", fullHeight ? "flex h-dvh" : "min-h-screen")}>
      <Sidebar />
      <main
        className={cn(
          "min-w-0 md:ml-[100px]",
          // Pílula mobile: 60px de altura + 12px até a borda; o chat deixa mais 12px de respiro acima dela
          fullHeight ? "flex flex-1 flex-col pb-[84px] md:pb-0" : "pb-28 md:pb-10",
          className
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
