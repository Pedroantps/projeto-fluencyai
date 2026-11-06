import { AppShell } from "@/components/layout/app-shell"
import { ProfileSettings } from "@/components/profile/profile-settings"

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8">
        <ProfileSettings />
      </div>
    </AppShell>
  )
}
