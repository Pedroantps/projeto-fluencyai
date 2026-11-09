"use client"

import { useState, useEffect } from "react"
import { User, Bell, Moon, Globe, Volume2, Clock, Target, ChevronRight, LogOut, Loader2, Edit3, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { auth, firebase } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { getMe, updatePreferences } from "@/lib/api"
import { updateProfile } from "firebase/auth"
import { useTheme } from "next-themes"

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
      // Reduzimos o padding e o gap no mobile (p-3 e gap-3)
      className={cn(
        "flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-4 rounded-3xl bg-card transition-colors",
        onClick && "hover:bg-surface-hover text-left"
      )}
    >
      <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-surface text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0 pr-2">
        {/* Adicionado 'truncate' para impedir que textos longos partam o layout */}
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        {description && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{description}</p>}
      </div>
      {children}
      {onClick && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />}
    </Wrapper>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground px-1">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export function ProfileSettings() {
  const { user: authUser, loading: authLoading } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [themeReady, setThemeReady] = useState(false)
  useEffect(() => setThemeReady(true), [])
  const [user, setUser] = useState<firebase.User | null>(null)
  // Nome exibido em estado próprio: copiar o objeto do Firebase ({ ...user }) perde
  // photoURL/email, que são getters do protótipo.
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  const [editName, setEditName] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  
  const [userStats, setUserStats] = useState({
    streak: "0", words: "0", hours: "0.0", level: "A1", studyTime: 30
  })

  const [notifications, setNotifications] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)
  const [dailyReminder, setDailyReminder] = useState(true)

  useEffect(() => {
    setNotifications(localStorage.getItem('pref_notifications') !== 'false')
    setSoundEffects(localStorage.getItem('pref_sound') !== 'false')
    setDailyReminder(localStorage.getItem('pref_reminder') !== 'false')
  }, [])

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    const load = async () => {
      setUser(authUser)
      setDisplayName(authUser?.displayName ?? null)
      if (authUser?.displayName) setEditName(authUser.displayName)

      if (authUser) {
        try {
          const data = await getMe(authUser.displayName)
          if (!cancelled) {
            setUserStats({
              streak: String(data.stats.streak),
              words: String(data.stats.words),
              hours: String(data.stats.hours),
              level: data.stats.level,
              studyTime: data.stats.studyTime || 30,
            })
          }
        } catch (error) {
          console.error("Erro ao buscar estatísticas do banco:", error);
        }
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [authUser, authLoading])

  const toggleNotification = async (checked: boolean) => {
    setNotifications(checked);
    localStorage.setItem('pref_notifications', checked.toString());
    
    if (checked && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
    }
  }

  const toggleSound = (checked: boolean) => {
    setSoundEffects(checked);
    localStorage.setItem('pref_sound', checked.toString());
    if (checked) {
      const audio = new Audio("https://actions.google.com/sounds/v1/ui/button_click.ogg");
      audio.volume = 0.5;
      audio.play().catch(()=>console.log("Áudio bloqueado pelo navegador"));
    }
  }

  const toggleReminder = (checked: boolean) => {
    setDailyReminder(checked);
    localStorage.setItem('pref_reminder', checked.toString());
  }

  const handlePreferenceChange = async (field: 'level' | 'studyTime', value: string | number) => {
    setUserStats(prev => ({ ...prev, [field]: value }));
    
    if (user) {
      try {
        await updatePreferences({ [field]: value });
      } catch (error) {
        console.error(`Erro ao atualizar ${field}:`, error);
      }
    }
  }

  const handleSaveProfile = async () => {
    const name = editName.trim();
    if (!user || !name) return;
    setIsSavingProfile(true);
    try {
      await updateProfile(user, { displayName: name });
      setShowEditModal(false);
      setDisplayName(name);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    } finally {
      setIsSavingProfile(false);
    }
  }

  const handleLogout = () => {
    auth.signOut().catch(console.error)
    setShowLogoutModal(false)
    window.location.href = "/" 
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    const names = name.split(" ")
    return names.length >= 2 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    // 'overflow-hidden' no contentor principal previne qualquer scroll horizontal acidental
    <div className="flex flex-col gap-6 max-w-2xl mx-auto overflow-hidden w-full">
      
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 p-6 rounded-[32px] bg-cat-video w-full">
        <div className="relative">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={displayName || "Perfil"}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-card"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-medium text-primary-foreground">
                {getInitials(displayName)}
              </span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-card border-2 border-cat-video flex items-center justify-center">
            <span className="text-[10px] sm:text-xs font-medium text-foreground">{userStats.level}</span>
          </div>
        </div>
        
        <div className="text-center w-full px-4">
          <h2 className="text-2xl font-medium tracking-tight text-foreground truncate">
            {displayName || "Usuário FluencyAI"}
          </h2>
          <p className="text-xs sm:text-sm text-foreground/70 truncate">
            {user?.email || "Email não informado"}
          </p>
        </div>

        {/* Estatísticas com quebra de linha ('leading-tight') para não espremer os ecrãs pequenos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full mt-2">
          <div className="flex flex-col items-center p-3 rounded-2xl bg-cat-streak">
            <span className="text-2xl font-medium tabular text-foreground">{userStats.streak}</span>
            <span className="text-xs text-foreground/70 text-center leading-tight">Dias seguidos</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-cat-cards">
            <span className="text-2xl font-medium tabular text-foreground">{userStats.words}</span>
            <span className="text-xs text-foreground/70 text-center leading-tight">Palavras salvas</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-cat-chat">
            <span className="text-2xl font-medium tabular text-foreground">{userStats.hours}h</span>
            <span className="text-xs text-foreground/70 text-center leading-tight">Horas estudo</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-card">
            <span className="text-2xl font-medium tabular text-foreground">{userStats.studyTime}m</span>
            <span className="text-xs text-foreground/70 text-center leading-tight">Meta diária</span>
          </div>
        </div>
      </div>

      <SettingsSection title="Conta & Estudos">
        <SettingsItem 
          icon={<Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />} 
          label="Editar Perfil"
          description="Nome de exibição"
          onClick={() => setShowEditModal(true)}
        />
        
        {/* SELETOR DE NÍVEL RESPONSIVO */}
        <div className="flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-4 rounded-3xl bg-card transition-colors">
          <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-surface text-muted-foreground shrink-0">
            <Target className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-sm font-medium text-foreground truncate">Nível de Inglês</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">Dificuldade da IA</p>
          </div>
          {/* text-base é OBRIGATÓRIO aqui para o iOS não dar zoom! */}
          <select 
            value={userStats.level}
            onChange={(e) => handlePreferenceChange('level', e.target.value)}
            className="bg-surface text-base sm:text-sm text-foreground rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring shrink-0 max-w-20 sm:max-w-none"
          >
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </div>

        {/* SELETOR DE TEMPO DE ESTUDO RESPONSIVO */}
        <div className="flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-4 rounded-3xl bg-card transition-colors">
          <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-surface text-muted-foreground shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-sm font-medium text-foreground truncate">Tempo de Estudo</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">Meta diária em minutos</p>
          </div>
          <select 
            value={userStats.studyTime}
            onChange={(e) => handlePreferenceChange('studyTime', parseInt(e.target.value))}
            className="bg-surface text-base sm:text-sm text-foreground rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring shrink-0 max-w-21.25 sm:max-w-none"
          >
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
          </select>
        </div>
      </SettingsSection>

      <SettingsSection title="Preferências do App">
        <SettingsItem icon={<Bell className="w-4 h-4 sm:w-5 sm:h-5" />} label="Notificações" description="Lembretes diários">
          <Switch checked={notifications} onCheckedChange={toggleNotification} />
        </SettingsItem>
        <SettingsItem icon={<Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />} label="Efeitos Sonoros" description="Sons de botões">
          <Switch checked={soundEffects} onCheckedChange={toggleSound} />
        </SettingsItem>
        <SettingsItem icon={<Moon className="w-4 h-4 sm:w-5 sm:h-5" />} label="Tema escuro" description={themeReady && resolvedTheme === "dark" ? "Ativo" : "Desativado"}>
          <Switch
            checked={themeReady && resolvedTheme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Alternar tema escuro"
          />
        </SettingsItem>
      </SettingsSection>

      <button 
        onClick={() => setShowLogoutModal(true)}
        className="flex items-center justify-center gap-2 w-full p-3 sm:p-4 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors mt-2"
      >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-sm font-medium">Sair da Conta</span>
      </button>

      {/* MODAL: EDITAR PERFIL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">Editar perfil</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-full hover:bg-surface text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome de exibição</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Seu nome"
                  // 'text-base' previne o zoom nos iPhones
                  className="w-full bg-surface rounded-2xl px-4 py-3 text-base sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            
            <button
              onClick={handleSaveProfile} disabled={!editName.trim() || isSavingProfile}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center"
            >
              {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Alterações"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <LogOut className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">Sair da conta?</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Tem certeza que deseja desconectar?
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-3 rounded-full bg-surface font-medium hover:bg-surface-hover transition-colors">
                Cancelar
              </button>
              <button onClick={handleLogout} className="flex-1 px-4 py-3 rounded-full bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors">
                Sim, Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}