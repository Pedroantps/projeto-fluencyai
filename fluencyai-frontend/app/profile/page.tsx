import { Sidebar } from "@/components/layout/sidebar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ProfileSettings } from "@/components/profile/profile-settings"

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <div className="p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <ProfileSettings />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}