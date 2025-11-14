import { AuctionDetail } from "@/components/auction-detail"
import { Footer } from "@/components/footer"

export default async function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <AuctionDetail auctionId={id} />
      </main>
      <Footer />
    </div>
  )
}
