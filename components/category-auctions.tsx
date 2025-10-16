"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuctionCard } from "@/components/auction-card"
import { Smartphone, Palette, Watch, Gem, Car, Home, Music, Camera } from "lucide-react"

const categoryInfo: Record<string, { name: string; icon: any }> = {
  electronics: { name: "Điện tử", icon: Smartphone },
  art: { name: "Nghệ thuật", icon: Palette },
  collectibles: { name: "Sưu tầm", icon: Watch },
  jewelry: { name: "Trang sức", icon: Gem },
  vehicles: { name: "Xe cộ", icon: Car },
  "real-estate": { name: "Bất động sản", icon: Home },
  music: { name: "Nhạc cụ", icon: Music },
  photography: { name: "Nhiếp ảnh", icon: Camera },
}

const mockAuctions = [
  {
    id: "1",
    title: "iPhone 15 Pro Max 256GB",
    image: "/modern-smartphone.png",
    currentBid: 25000000,
    startingBid: 22000000,
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    bidCount: 45,
    category: "Điện tử",
    sellerRating: 4.8,
    sellerName: "TechStore VN",
  },
  {
    id: "2",
    title: "MacBook Pro M3 16 inch",
    image: "/silver-macbook-on-desk.png",
    currentBid: 45000000,
    startingBid: 40000000,
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    bidCount: 32,
    category: "Điện tử",
    sellerRating: 4.9,
    sellerName: "Apple Store",
  },
  {
    id: "3",
    title: "Tranh sơn dầu trừu tượng",
    image: "/abstract-oil-painting.png",
    currentBid: 15000000,
    startingBid: 12000000,
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
    bidCount: 28,
    category: "Nghệ thuật",
    sellerRating: 4.7,
    sellerName: "Art Gallery",
  },
  {
    id: "4",
    title: "Đồng hồ Rolex Submariner",
    image: "/rolex-watch.jpg",
    currentBid: 180000000,
    startingBid: 150000000,
    endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
    bidCount: 67,
    category: "Sưu tầm",
    sellerRating: 5.0,
    sellerName: "Luxury Watches",
  },
]

export function CategoryAuctions({ categorySlug }: { categorySlug: string }) {
  const [sortBy, setSortBy] = useState("ending-soon")
  const [priceRange, setPriceRange] = useState("all")

  const category = categoryInfo[categorySlug] || { name: "Danh mục", icon: Smartphone }
  const Icon = category.icon

  const filteredAuctions = mockAuctions.filter((auction) => {
    const categoryName = categoryInfo[categorySlug]?.name || ""
    return auction.category === categoryName || categorySlug === "all"
  })

  return (
    <>
      <section className="border-b bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Icon className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold text-foreground">{category.name}</h1>
              <p className="text-lg text-muted-foreground">{filteredAuctions.length} phiên đấu giá đang diễn ra</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Tất cả
              </Button>
              <Button variant="ghost" size="sm">
                Đang diễn ra
              </Button>
              <Button variant="ghost" size="sm">
                Sắp kết thúc
              </Button>
              <Button variant="ghost" size="sm">
                Mới nhất
              </Button>
            </div>

            <div className="flex gap-2">
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Khoảng giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả giá</SelectItem>
                  <SelectItem value="0-10m">Dưới 10 triệu</SelectItem>
                  <SelectItem value="10m-50m">10 - 50 triệu</SelectItem>
                  <SelectItem value="50m-100m">50 - 100 triệu</SelectItem>
                  <SelectItem value="100m+">Trên 100 triệu</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ending-soon">Sắp kết thúc</SelectItem>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
                  <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
                  <SelectItem value="most-bids">Nhiều lượt đấu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
