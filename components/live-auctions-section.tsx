"use client"

import { AuctionCard } from "@/components/auction-card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ItemsAPI } from "@/lib/api/items"

type CardAuction = {
  id: string
  title: string
  image: string
  currentBid: number
  startingBid: number
  endTime: Date
  bidCount: number
  category: string
  sellerRating?: number
  sellerName?: string
}

export function LiveAuctionsSection() {
  const [auctions, setAuctions] = useState<CardAuction[]>([])

  useEffect(() => {
    const fetchHot = async () => {
      try {
        const items = await ItemsAPI.getHot(8)
        const mapped: CardAuction[] = items
          .filter(i => i.auctionStatus === "active" && (i.auctionId ?? i.id))
          .map(i => ({
            id: String(i.auctionId ?? i.id),
            title: i.title,
            image: (i.images && i.images[0]) || "/placeholder.jpg",
            currentBid: Number(i.currentBid || i.startingBid || 0),
            startingBid: Number(i.startingBid || 0),
            endTime: i.auctionEndTime ? new Date(i.auctionEndTime) as any : new Date(),
            bidCount: Number(i.bidCount || 0),
            category: i.categoryName || "Khác",
            sellerName: i.sellerName,
          }))
        setAuctions(mapped)
      } catch (e) {
        setAuctions([])
      }
    }
    fetchHot()
  }, [])

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">Phiên đấu giá nổi bật</h2>
            <p className="text-lg text-muted-foreground">Những sản phẩm hot nhất đang được đấu giá</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse-glow rounded-full bg-accent" />
            <span className="text-sm font-medium text-accent">LIVE</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/auctions">
            <Button size="lg" variant="outline" className="group bg-transparent">
              Xem tất cả phiên đấu giá
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
