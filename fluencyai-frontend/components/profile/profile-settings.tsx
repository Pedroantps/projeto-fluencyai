"use client"

import { useState, useEffect } from "react"
import { User, Bell, Moon, Globe, Volume2, Clock, Target, ChevronRight, LogOut, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { auth, firebase } from "@/lib/firebase"

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
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
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
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export function ProfileSettings() {
  const [user, setUser] = useState<firebase.User | null>(null)
  const [loading, setLoading] = useState(true)

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  // Estado das Estatísticas vindo do Banco de Dados
  const [userStats, setUserStats] = useState({
    streak: "0", words: "0", hours: "0.0", level: "A1"
  })

  // Estados dos Switches inicializados lendo o LocalStorage do navegador
  const [notifications, setNotifications] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)
  const [dailyReminder, setDailyReminder] = useState(true)

  // Efeito 1: Carregar preferências salvas ao iniciar
  useEffect(() => {
    setNotifications(localStorage.getItem('pref_notifications') !== 'false')
    setSoundEffects(localStorage.getItem('pref_sound') !== 'false')
    setDailyReminder(localStorage.getItem('pref_reminder') !== 'false')
  }, [])

  // Efeito 2: Escutar Auth do Firebase e buscar estatísticas no Back-end
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser)
      
      if (currentUser && currentUser.email) {
        try {
          // Comunica com o back-end para sincronizar a conta e puxar os dados
          const response = await fetch("http://localhost:3333/api/user/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email: currentUser.email, 
              name: currentUser.displayName 
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setUserStats(data.stats);
          }
        } catch (error) {
          console.error("Erro ao buscar estatísticas do banco:", error);
        }
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Funções para atualizar os Switches e salvar no LocalStorage
  const toggleNotification = (checked: boolean) => {
    setNotifications(checked);
    localStorage.setItem('pref_notifications', checked.toString());
  }
  const toggleSound = (checked: boolean) => {
    setSoundEffects(checked);
    localStorage.setItem('pref_sound', checked.toString());
  }
  const toggleReminder = (checked: boolean) => {
    setDailyReminder(checked);
    localStorage.setItem('pref_reminder', checked.toString());
  }

  const handleLogout = () => {
    auth.signOut().catch(console.error)
    setShowLogoutModal(false)
    window.location.href = "/" // Redireciona para a página inicial após logout
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    const names = name.split(" ")
    return names.length >= 2 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Profile Header Dinâmico */}
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-card border border-border/50">
        <div className="relative">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "Perfil"} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-surface"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-primary to-primary/50 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {getInitials(user?.displayName)}
              </span>
            </div>
          )}
          
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success border-2 border-card flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{userStats.level}</span>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            {user?.displayName || "Usuário FluencyAI"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {user?.email || "Email não informado"}
          </p>
        </div>

        {/* Estatísticas injetadas diretamente do Banco de Dados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-2">
          <div className="flex flex-col items-center p-3 rounded-xl bg-surface">
            <span className="text-lg sm:text-xl font-bold text-primary">{userStats.streak}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground text-center">Dias de streak</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-surface">
            <span className="text-lg sm:text-xl font-bold text-primary">{userStats.words}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground text-center">Palavras salvas</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-surface">
            <span className="text-lg sm:text-xl font-bold text-primary">{userStats.hours}h</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground text-center">Horas de estudo</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-surface">
            <span className="text-lg sm:text-xl font-bold text-primary">{userStats.level}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground text-center">Nível atual</span>
          </div>
        </div>
      </div>

      <SettingsSection title="Preferências">
        <SettingsItem icon={<Bell className="w-5 h-5" />} label="Notificações" description="Lembretes de estudo">
          <Switch checked={notifications} onCheckedChange={toggleNotification} />
        </SettingsItem>
        <SettingsItem icon={<Clock className="w-5 h-5" />} label="Lembrete Diário" description="20:00">
          <Switch checked={dailyReminder} onCheckedChange={toggleReminder} />
        </SettingsItem>
        <SettingsItem icon={<Volume2 className="w-5 h-5" />} label="Efeitos Sonoros" description="Sons de feedback">
          <Switch checked={soundEffects} onCheckedChange={toggleSound} />
        </SettingsItem>
        <SettingsItem icon={<Moon className="w-5 h-5" />} label="Tema Escuro" description="Sempre ativo">
          <Switch checked={true} disabled />
        </SettingsItem>
      </SettingsSection>

      <button 
        onClick={() => setShowLogoutModal(true)}
        className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors mt-4"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">Sair da Conta</span>
      </button>

      <p className="text-center text-xs text-muted-foreground pb-4">
        FluencyAI v1.0.0
      </p>
      {/* MODAL DE CONFIRMAÇÃO DE LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            
            {/* Ícone de Alerta */}
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <LogOut className="w-8 h-8 text-destructive" />
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2">Sair da conta?</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Tem certeza que deseja desconectar? Você precisará fazer login com o Google novamente para voltar a estudar.
            </p>
            
            {/* Botões de Ação */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-border/50 font-medium hover:bg-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-3 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors shadow-lg shadow-destructive/20"
              >
                Sim, Sair
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}