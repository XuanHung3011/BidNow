"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Footer } from "@/components/footer"
import { UserSettings } from "@/components/user-settings"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-8">
          <UserSettings />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
