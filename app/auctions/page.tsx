import { Footer } from "@/components/footer"
import { AllAuctions } from "@/components/all-auctions"

export default function AuctionsPage() {
  return (
    <div className="min-h-screen">
      <main>
        <AllAuctions />
      </main>
      <Footer />
    </div>
  )
}
