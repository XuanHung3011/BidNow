"use client"

import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { AuctionCard } from "@/components/auction-card"
import { Button } from "@/components/ui/button"
import { RecommendationsAPI, ItemsAPI } from "@/lib/api"
import { getImageUrls } from "@/lib/api/config"
import { useAuth } from "@/lib/auth-context"

type CardAuction = {
  id: string
  title: string
  image: string
  currentBid: number
  startingBid: number
  startTime?: Date | string
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
        console.log("🔍 Fetching personalized recommendations for user:", user.id)
        const items = await RecommendationsAPI.getPersonalized(Number(user.id), 4)
        console.log("✅ Received recommendations:", items.length, "items")
        
        const mapped: CardAuction[] = items
          .filter((i) => i.auctionStatus === "active" && i.auctionId)
          .map((i) => ({
            id: String(i.auctionId!),
            title: i.title,
            image: getImageUrls(i.images as any)[0] || "/placeholder.jpg",
            currentBid: Number(i.currentBid || i.startingBid || i.basePrice || 0),
            startingBid: Number(i.startingBid || i.basePrice || 0),
            startTime: i.auctionStartTime ? (new Date(i.auctionStartTime) as any) : undefined,
            endTime: i.auctionEndTime ? (new Date(i.auctionEndTime) as any) : new Date(),
            bidCount: Number(i.bidCount || 0),
            category: i.categoryName || "Khác",
            sellerName: i.sellerName,
          }))

        console.log("📊 Mapped to active auctions:", mapped.length)
        
        // Fallback: Nếu không có personalized recommendations, lấy hot auctions
        if (mapped.length === 0) {
          console.log("⚠️ No personalized recommendations, fetching hot auctions as fallback")
          try {
            const hotItems = await ItemsAPI.getHot(4)
            const fallbackMapped: CardAuction[] = hotItems
              .filter((i) => i.auctionStatus === "active" && i.auctionId)
              .map((i) => ({
                id: String(i.auctionId!),
                title: i.title,
                image: getImageUrls(i.images as any)[0] || "/placeholder.jpg",
                currentBid: Number(i.currentBid || i.startingBid || i.basePrice || 0),
                startingBid: Number(i.startingBid || i.basePrice || 0),
                startTime: i.auctionStartTime ? (new Date(i.auctionStartTime) as any) : undefined,
                endTime: i.auctionEndTime ? (new Date(i.auctionEndTime) as any) : new Date(),
                bidCount: Number(i.bidCount || 0),
                category: i.categoryName || "Khác",
                sellerName: i.sellerName,
              }))
            console.log("✅ Fallback: Got", fallbackMapped.length, "hot auctions")
            setAuctions(fallbackMapped)
          } catch (fallbackError) {
            console.error("❌ Fallback also failed:", fallbackError)
            setAuctions([])
          }
        } else {
          setAuctions(mapped)
        }
      } catch (e) {
        console.error("❌ Error fetching recommendations:", e)
        setHasError(true)
        // Thử fallback khi có lỗi
        try {
          console.log("🔄 Trying fallback to hot auctions...")
          const hotItems = await ItemsAPI.getHot(4)
          const fallbackMapped: CardAuction[] = hotItems
            .filter((i) => i.auctionStatus === "active" && i.auctionId)
            .map((i) => ({
              id: String(i.auctionId!),
              title: i.title,
              image: getImageUrls(i.images as any)[0] || "/placeholder.jpg",
              currentBid: Number(i.currentBid || i.startingBid || i.basePrice || 0),
              startingBid: Number(i.startingBid || i.basePrice || 0),
              startTime: i.auctionStartTime ? (new Date(i.auctionStartTime) as any) : undefined,
              endTime: i.auctionEndTime ? (new Date(i.auctionEndTime) as any) : new Date(),
              bidCount: Number(i.bidCount || 0),
              category: i.categoryName || "Khác",
              sellerName: i.sellerName,
            }))
          console.log("✅ Fallback success:", fallbackMapped.length, "auctions")
          setAuctions(fallbackMapped)
          setHasError(false) // Reset error nếu fallback thành công
        } catch (fallbackError) {
          console.error("❌ Fallback failed:", fallbackError)
          setAuctions([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [user])

  // Realtime updates: Polling nhẹ mỗi 20 giây (chỉ khi tab active và user đã đăng nhập)
  useEffect(() => {
    if (!user || auctions.length === 0) return

    let intervalId: NodeJS.Timeout | null = null
    let isMounted = true

    const updateAuctions = async () => {
      // Chỉ update khi tab đang active
      if (document.hidden) return

      try {
        const items = await RecommendationsAPI.getPersonalized(Number(user.id), 4)
        if (!isMounted) return

        const mapped: CardAuction[] = items
          .filter((i) => i.auctionStatus === "active" && i.auctionId)
          .map((i) => ({
            id: String(i.auctionId!),
            title: i.title,
            image: getImageUrls(i.images as any)[0] || "/placeholder.jpg",
            currentBid: Number(i.currentBid || i.startingBid || i.basePrice || 0),
            startingBid: Number(i.startingBid || i.basePrice || 0),
            startTime: i.auctionStartTime ? (new Date(i.auctionStartTime) as any) : undefined,
            endTime: i.auctionEndTime ? (new Date(i.auctionEndTime) as any) : new Date(),
            bidCount: Number(i.bidCount || 0),
            category: i.categoryName || "Khác",
            sellerName: i.sellerName,
          }))

        setAuctions((prev) => {
          // Merge với auctions hiện tại, chỉ update giá và bidCount
          return mapped.map((newAuction) => {
            const existing = prev.find((a) => a.id === newAuction.id)
            if (existing) {
              // Giữ nguyên nếu giá không thay đổi
              if (
                existing.currentBid === newAuction.currentBid &&
                existing.bidCount === newAuction.bidCount
              ) {
                return existing
              }
              // Update giá và bidCount
              return {
                ...existing,
                currentBid: newAuction.currentBid,
                bidCount: newAuction.bidCount,
              }
            }
            return newAuction
          })
        })
      } catch (e) {
        // Silently fail - không làm gián đoạn UI
      }
    }

    // Polling mỗi 20 giây (lâu hơn một chút vì đây là recommendations)
    intervalId = setInterval(updateAuctions, 20000)

    return () => {
      isMounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [user, auctions.length])

  // Nếu chưa đăng nhập thì không hiển thị section
  if (!user) {
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
        ) : auctions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-lg text-muted-foreground">
              {hasError 
                ? "Không thể tải gợi ý lúc này. Vui lòng thử lại sau." 
                : "Chưa có gợi ý phù hợp. Hãy khám phá các phiên đấu giá để chúng tôi hiểu sở thích của bạn hơn!"}
            </p>
            <Link href="/auctions" className="mt-4 inline-block">
              <Button variant="outline" className="mt-4">
                Khám phá ngay
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
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


