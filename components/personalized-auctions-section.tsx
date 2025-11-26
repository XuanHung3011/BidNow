"use client"

import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { AuctionCard } from "@/components/auction-card"
import { Button } from "@/components/ui/button"
import { RecommendationsAPI } from "@/lib/api"
import { getImageUrls } from "@/lib/api/config"
import { useAuth } from "@/lib/auth-context"

type CardAuction = {
  id: string
  title: string
  image: string
  currentBid: number
  startingBid: number
  endTime: Date
  bidCount: number
  category: string
  sellerName?: string
}

export function PersonalizedAuctionsSection() {
  const { user } = useAuth()
  const [auctions, setAuctions] = useState<CardAuction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchRecommendations = async () => {
      setIsLoading(true)
      setHasError(false)
      try {
        const items = await RecommendationsAPI.getPersonalized(Number(user.id), 4)
        const mapped: CardAuction[] = items
          .filter((i) => i.auctionStatus === "active" && i.auctionId)
          .map((i) => ({
            id: String(i.auctionId!),
            title: i.title,
            image: getImageUrls(i.images as any)[0] || "/placeholder.jpg",
            currentBid: Number(i.currentBid || i.startingBid || i.basePrice || 0),
            startingBid: Number(i.startingBid || i.basePrice || 0),
            endTime: i.auctionEndTime ? (new Date(i.auctionEndTime) as any) : new Date(),
            bidCount: Number(i.bidCount || 0),
            category: i.categoryName || "Khác",
            sellerName: i.sellerName,
          }))

        setAuctions(mapped)
      } catch (e) {
        setHasError(true)
        setAuctions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [user])

  // Nếu chưa đăng nhập thì không hiển thị section
  if (!user) {
    return null
  }

  // Nếu không có dữ liệu (do chưa có lịch sử hoặc lỗi), ẩn section để không làm rối UI
  if (!isLoading && (hasError || auctions.length === 0)) {
    return null
  }

  return (
    <section className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">Dành riêng cho bạn</h2>
            <p className="text-lg text-muted-foreground">
              Gợi ý những phiên đấu giá phù hợp với lịch sử quan tâm và đấu giá của bạn
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Được gợi ý bởi AI</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-64 animate-pulse rounded-xl border border-border bg-muted/60 shadow-sm"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}

        {auctions.length > 0 && (
          <div className="mt-8 text-center">
            <Link href="/auctions">
              <Button size="lg" variant="outline" className="group bg-transparent">
                Xem thêm các phiên đấu giá
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}


