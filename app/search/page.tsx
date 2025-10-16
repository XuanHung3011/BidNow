"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AuctionCard } from "@/components/auction-card"
import { Search } from "lucide-react"

const mockResults = [
  {
    id: "1",
    title: "iPhone 15 Pro Max 256GB",
    image: "/modern-smartphone.png",
    currentBid: 25000000,
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    bids: 45,
  },
  {
    id: "2",
    title: "MacBook Pro M3 16 inch",
    image: "/silver-macbook-on-desk.png",
    currentBid: 45000000,
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    bids: 32,
  },
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")

  return (
    <div className="min-h-screen">
      <main>
        <section className="border-b bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12">
          <div className="container mx-auto px-4">
            <h1 className="mb-6 text-4xl font-bold text-foreground">Tìm kiếm</h1>
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm đấu giá..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-24"
              />
              <Button className="absolute right-1 top-1/2 -translate-y-1/2">Tìm kiếm</Button>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            {query && (
              <>
                <p className="mb-6 text-muted-foreground">
                  Tìm thấy {mockResults.length} kết quả cho "{query}"
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {mockResults.map((auction) => (
                    <AuctionCard key={auction.id} {...auction} />
                  ))}
                </div>
              </>
            )}
            {!query && (
              <div className="py-12 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">Nhập từ khóa để tìm kiếm sản phẩm</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
