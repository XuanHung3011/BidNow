"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuctionCard } from "@/components/auction-card"
import { Search, SlidersHorizontal } from "lucide-react"

const categories = [
  { value: "all", label: "Tất cả danh mục" },
  { value: "electronics", label: "Điện tử" },
  { value: "art", label: "Nghệ thuật" },
  { value: "collectibles", label: "Sưu tầm" },
  { value: "watches", label: "Đồng hồ" },
  { value: "gaming", label: "Gaming" },
  { value: "cameras", label: "Máy ảnh" },
]

const mockResults = [
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
    title: "MacBook Pro M3 Max 16 inch - 64GB RAM",
    image: "/silver-macbook-on-desk.png",
    currentBid: 72000000,
    startingBid: 65000000,
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    bidCount: 56,
    category: "Điện tử",
  },
  {
    id: "3",
    title: "Đồng hồ Rolex Submariner Date",
    image: "/rolex-watch.jpg",
    currentBid: 185000000,
    startingBid: 150000000,
    endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
    bidCount: 78,
    category: "Đồng hồ",
  },
  {
    id: "4",
    title: "Tranh sơn dầu trừu tượng hiện đại",
    image: "/abstract-oil-painting.png",
    currentBid: 45000000,
    startingBid: 35000000,
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
    bidCount: 23,
    category: "Nghệ thuật",
  },
  {
    id: "5",
    title: "PlayStation 5 Pro + 2 Tay cầm",
    image: "/gaming-console-setup.png",
    currentBid: 18500000,
    startingBid: 15000000,
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    bidCount: 67,
    category: "Gaming",
  },
  {
    id: "6",
    title: "Sony A7R V + Lens 24-70mm F2.8",
    image: "/sony-a7r-v-camera-with-lens.jpg",
    currentBid: 95000000,
    startingBid: 85000000,
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    bidCount: 42,
    category: "Máy ảnh",
  },
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [sortBy, setSortBy] = useState("ending-soon")

  useEffect(() => {
    setQuery(searchParams.get("q") || "")
    setCategory(searchParams.get("category") || "all")
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      const params = new URLSearchParams()
      params.set("q", query)
      if (category !== "all") params.set("category", category)
      window.history.pushState({}, "", `/search?${params.toString()}`)
    }
  }

  const filteredResults = mockResults.filter(auction => {
    const matchesQuery = !query || auction.title.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === "all" || auction.category === categories.find(c => c.value === category)?.label
    return matchesQuery && matchesCategory
  })

  return (
    <div className="min-h-screen">
      <main>
        <section className="border-b bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12">
          <div className="container mx-auto px-4">
            <h1 className="mb-6 text-4xl font-bold text-foreground">Tìm kiếm sản phẩm</h1>
            
            <form onSubmit={handleSearch} className="max-w-4xl">
              <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Category Selector */}
                <div className="flex-shrink-0">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full sm:w-[200px] h-12 border-0 rounded-none bg-gray-50 focus:ring-0">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm, thương hiệu, từ khóa..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-12 pl-12 pr-4 border-0 rounded-none focus:ring-0 text-base placeholder:text-gray-400"
                  />
                </div>

                {/* Search Button */}
                <Button
                  type="submit"
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-medium rounded-none"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Tìm kiếm
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            {query && (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-muted-foreground">
                    Tìm thấy <span className="font-semibold text-foreground">{filteredResults.length}</span> kết quả cho "<span className="font-semibold text-foreground">{query}</span>"
                    {category !== "all" && (
                      <span className="ml-2 text-sm">
                        trong danh mục <span className="font-semibold">{categories.find(c => c.value === category)?.label}</span>
                      </span>
                    )}
                  </p>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ending-soon">Sắp kết thúc</SelectItem>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
                      <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
                      <SelectItem value="most-bids">Nhiều lượt đấu nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredResults.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredResults.map((auction) => (
                      <AuctionCard key={auction.id} auction={auction} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground mb-2">Không tìm thấy kết quả nào</p>
                    <p className="text-sm text-muted-foreground">Thử thay đổi từ khóa tìm kiếm hoặc danh mục</p>
                  </div>
                )}
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
