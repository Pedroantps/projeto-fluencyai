"use client"

import { useState } from "react"
import { User, Bell, Moon, Globe, Volume2, Clock, Target, ChevronRight, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

interface SettingsItemProps {
  icon: React.ReactNode
  label: string
  description?: string
  children?: React.ReactNode
  onClick?: () => void
}

function SettingsItem({ icon, label, description, children, onClick }: SettingsItemProps) {
  const Wrapper = onClick ? "button" : "div"
  
  return (
    <Wrapper 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 w-full p-4 rounded-xl bg-card border border-border/50 transition-colors",
        onClick && "hover:border-primary/30 text-left"
      )}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
      {onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </Wrapper>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{title}</h3>
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  )
}

export function ProfileSettings() {
  const [notifications, setNotifications] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)
  const [dailyReminder, setDailyReminder] = useState(true)

  const stats = [
    { label: "Dias de streak", value: "12" },
    { label: "Palavras aprendidas", value: "847" },
    { label: "Horas de estudo", value: "42" },
    { label: "Nível atual", value: "B1" },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-card border border-border/50">
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-primary to-primary/50 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-white">MS</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success border-2 border-card flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">B1</span>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Maria Silva</h2>
          <p className="text-sm text-muted-foreground">maria.silva@email.com</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-2">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center p-3 rounded-xl bg-surface">
              <span className="text-lg sm:text-xl font-bold text-primary">{stat.value}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground text-center">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Sections */}
      <SettingsSection title="Conta">
        <SettingsItem 
          icon={<User className="w-5 h-5" />} 
          label="Editar Perfil"
          description="Nome, email e foto"
          onClick={() => {}}
        />
        <SettingsItem 
          icon={<Target className="w-5 h-5" />} 
          label="Metas de Estudo"
          description="15 min/dia"
          onClick={() => {}}
        />
        <SettingsItem 
          icon={<Globe className="w-5 h-5" />} 
          label="Idioma de Destino"
          description="Inglês (EUA)"
          onClick={() => {}}
        />
      </SettingsSection>

      <SettingsSection title="Preferências">
        <SettingsItem 
          icon={<Bell className="w-5 h-5" />} 
          label="Notificações"
          description="Lembretes de estudo"
        >
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </SettingsItem>
        <SettingsItem 
          icon={<Clock className="w-5 h-5" />} 
          label="Lembrete Diário"
          description="20:00"
        >
          <Switch checked={dailyReminder} onCheckedChange={setDailyReminder} />
        </SettingsItem>
        <SettingsItem 
          icon={<Volume2 className="w-5 h-5" />} 
          label="Efeitos Sonoros"
          description="Sons de feedback"
        >
          <Switch checked={soundEffects} onCheckedChange={setSoundEffects} />
        </SettingsItem>
        <SettingsItem 
          icon={<Moon className="w-5 h-5" />} 
          label="Tema Escuro"
          description="Sempre ativo"
        >
          <Switch checked={true} disabled />
        </SettingsItem>
      </SettingsSection>

      <SettingsSection title="Assinatura">
        <div className="p-4 rounded-xl bg-linear-to-r from-primary/20 to-primary/5 border border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Plano Premium</p>
              <p className="text-xs text-muted-foreground mt-0.5">Renovação em 15 dias</p>
            </div>
            <button className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Gerenciar
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Logout */}
      <button className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">Sair da Conta</span>
      </button>

      <p className="text-center text-xs text-muted-foreground pb-4">
        FluencyAI v1.0.0
      </p>
    </div>
  )
}