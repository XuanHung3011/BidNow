"use client"

import { AuctionCard } from "@/components/auction-card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const featuredAuctions = [
  {
    id: "1",
    title: "iPhone 15 Pro Max 256GB - Titan Xanh",
    image: "/iphone-15-pro-max-blue-titanium.jpg",
    currentBid: 28500000,
    startingBid: 25000000,
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    bidCount: 45,
    category: "Điện tử",
  },
  {
    id: "2",
    title: "Đồng hồ Rolex Submariner Date - Chính hãng",
    image: "/rolex-submariner-luxury-watch.jpg",
    currentBid: 185000000,
    startingBid: 150000000,
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    bidCount: 78,
    category: "Đồng hồ",
  },
  {
    id: "3",
    title: 'MacBook Pro M3 Max 16" - 64GB RAM',
    image: "/macbook-pro-m3-max-laptop.jpg",
    currentBid: 72000000,
    startingBid: 65000000,
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    bidCount: 56,
    category: "Điện tử",
  },
  {
    id: "4",
    title: "Sony A7R V + Lens 24-70mm F2.8 GM II",
    image: "/sony-a7r-v-camera-with-lens.jpg",
    currentBid: 95000000,
    startingBid: 85000000,
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
    bidCount: 34,
    category: "Máy ảnh",
  },
]

export function LiveAuctionsSection() {
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
          {featuredAuctions.map((auction) => (
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
