"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Footer } from "@/components/footer"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { Suspense } from "react"

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-8">
          <Suspense fallback={<div>Loading...</div>}>
            <AdminDashboard />
          </Suspense>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
