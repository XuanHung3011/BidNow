import { AuctionDetail } from "@/components/auction-detail"
import { Footer } from "@/components/footer"

export default function AuctionDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <AuctionDetail auctionId={params.id} />
      </main>
      <Footer />
    </div>
  )
}
