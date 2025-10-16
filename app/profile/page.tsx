"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Footer } from "@/components/footer"
import { UserProfile } from "@/components/user-profile"

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-8">
          <UserProfile />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
