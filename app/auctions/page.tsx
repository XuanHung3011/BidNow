import { Suspense } from "react"
import { Footer } from "@/components/footer"
import { AllAuctions } from "@/components/all-auctions"

export default function AuctionsPage() {
  return (
    <div className="min-h-screen">
      <main>
        <Suspense fallback={null}>
          <AllAuctions />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
