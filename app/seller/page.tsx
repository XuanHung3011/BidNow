"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Footer } from "@/components/footer"
import { SellerDashboard } from "@/components/seller/seller-dashboard"

export default function SellerPage() {
  return (
    <ProtectedRoute allowedRoles={["seller", "admin"]}>
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-8">
          <SellerDashboard />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
