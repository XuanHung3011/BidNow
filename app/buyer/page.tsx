"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Footer } from "@/components/footer"
import { BuyerDashboard } from "@/components/buyer/buyer-dashboard"

export default function BuyerPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "admin"]}>
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-8">
          <BuyerDashboard />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
