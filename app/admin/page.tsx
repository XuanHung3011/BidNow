"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Footer } from "@/components/footer"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-8">
          <AdminDashboard />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
