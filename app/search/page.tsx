"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AuctionCard } from "@/components/auction-card"
import { Search, SlidersHorizontal, User, Mail, Star, Package, Loader2 } from "lucide-react"
import { ItemsAPI } from "@/lib/api/items"
import { UsersAPI } from "@/lib/api/users"
import type { ItemResponseDto, UserResponse, CategoryDto } from "@/lib/api/types"
import { getImageUrls } from "@/lib/api/config"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [sortBy, setSortBy] = useState("ending-soon")
  const [activeTab, setActiveTab] = useState<"auctions" | "sellers">("auctions")
  const [categories, setCategories] = useState<CategoryDto[]>([])
  
  // Search results states
  const [auctionResults, setAuctionResults] = useState<ItemResponseDto[]>([])
  const [sellerResults, setSellerResults] = useState<UserResponse[]>([])
  const [loadingAuctions, setLoadingAuctions] = useState(false)
  const [loadingSellers, setLoadingSellers] = useState(false)
  const [auctionError, setAuctionError] = useState<string | null>(null)
  const [sellerError, setSellerError] = useState<string | null>(null)
  const lastLoggedSearch = useRef<string>("") // tránh log trùng khi StrictMode render 2 lần

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await ItemsAPI.getCategories()
        setCategories(cats)
      } catch (err) {
        // Silently fail
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const q = searchParams.get("q") || ""
    const cat = searchParams.get("category") || "all"
    setQuery(q)
    setCategory(cat)
    
    // Auto search when query changes
    if (q.trim()) {
      performSearch(q, cat)
    } else {
      setAuctionResults([])
      setSellerResults([])
    }
  }, [searchParams])

  const performSearch = async (searchQuery: string, searchCategory: string) => {
    // Log search keyword for signed-in users (backend records via /home/search/paged)
    const userId = user?.id ? Number(user.id) : undefined
    if (userId) {
      const trimmed = searchQuery.trim()
      const logKey = `${userId}|${trimmed}`
      if (trimmed && lastLoggedSearch.current !== logKey) {
        lastLoggedSearch.current = logKey
        // Fire and forget to avoid blocking UI; small page size to minimize payload
        ItemsAPI.searchPaged(trimmed, 1, 1, userId).catch(() => {})
      }
    }

    // Search auctions
    setLoadingAuctions(true)
    setAuctionError(null)
    try {
      const filter: any = {
        searchTerm: searchQuery,
      }
      if (searchCategory !== "all") {
        // Note: This assumes category is a string, adjust if needed
        filter.categoryIds = [Number(searchCategory)]
      }
      const result = await ItemsAPI.filterPaged(filter, 1, 50)
      setAuctionResults(result.items || [])
    } catch (err: any) {
      setAuctionError(err.message || "Không thể tải kết quả đấu giá")
      setAuctionResults([])
    } finally {
      setLoadingAuctions(false)
    }

    // Search sellers
    setLoadingSellers(true)
    setSellerError(null)
    try {
      const sellers = await UsersAPI.search(searchQuery, 1, 50)
      // Filter only sellers (users with seller role)
      const sellersOnly = sellers.filter(user => user.roles?.includes("seller"))
      setSellerResults(sellersOnly)
    } catch (err: any) {
      setSellerError(err.message || "Không thể tải kết quả người bán")
      setSellerResults([])
    } finally {
      setLoadingSellers(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      const params = new URLSearchParams()
      params.set("q", query)
      if (category !== "all") params.set("category", category)
      router.push(`/search?${params.toString()}`)
    }
  }

  // Filter visible auctions (exclude completed and cancelled)
  const visibleAuctions = useMemo(() => {
    return auctionResults.filter((item) => {
      if (!item.auctionId) return false
      const status = item.auctionStatus?.toLowerCase() ?? ""
      return status !== "completed" && status !== "cancelled" && status !== "canceled" && status !== "ended"
    })
  }, [auctionResults])

  return (
    <div className="min-h-screen">
      <main>
        <section className="border-b bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12">
          <div className="container mx-auto px-4">
            <h1 className="mb-6 text-4xl font-bold text-foreground">Tìm kiếm</h1>
            
            <form onSubmit={handleSearch} className="max-w-4xl">
              <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Category Selector */}
                <div className="flex-shrink-0">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full sm:w-[200px] h-12 border-0 rounded-none bg-gray-50 focus:ring-0">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả danh mục</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
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
                    placeholder="Tìm kiếm sản phẩm, người bán, từ khóa..."
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
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "auctions" | "sellers")} className="w-full">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <p className="text-muted-foreground">
                        Tìm thấy{" "}
                        <span className="font-semibold text-foreground">
                          {activeTab === "auctions" ? visibleAuctions.length : sellerResults.length}
                        </span>{" "}
                        kết quả cho "<span className="font-semibold text-foreground">{query}</span>"
                      </p>
                      <TabsList>
                        <TabsTrigger value="auctions">
                          <Package className="h-4 w-4 mr-2" />
                          Phiên đấu giá ({visibleAuctions.length})
                        </TabsTrigger>
                        <TabsTrigger value="sellers">
                          <User className="h-4 w-4 mr-2" />
                          Người bán ({sellerResults.length})
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {activeTab === "auctions" && (
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
                    )}
                  </div>

                  <TabsContent value="auctions" className="mt-6">
                    {loadingAuctions ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : auctionError ? (
                      <div className="py-12 text-center">
                        <p className="text-lg text-destructive mb-2">Lỗi: {auctionError}</p>
                      </div>
                    ) : visibleAuctions.length > 0 ? (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {visibleAuctions.map((item) => {
                          const imageUrls = getImageUrls(item.images)
                          return (
                            <AuctionCard
                              key={item.auctionId}
                              auction={{
                                id: String(item.auctionId!),
                                title: item.title,
                                image: imageUrls[0] || "/placeholder.jpg",
                                currentBid: item.currentBid ?? item.startingBid ?? item.basePrice ?? 0,
                                startingBid: item.startingBid ?? item.basePrice ?? 0,
                                startTime: item.auctionStartTime ? new Date(item.auctionStartTime) : undefined,
                                endTime: item.auctionEndTime ? new Date(item.auctionEndTime) : new Date(0),
                                bidCount: item.bidCount ?? 0,
                                category: item.categoryName ?? "Chưa phân loại",
                                status: item.auctionStatus ?? undefined,
                                pausedAt: item.pausedAt ?? undefined,
                              }}
                            />
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-lg text-muted-foreground mb-2">Không tìm thấy phiên đấu giá nào</p>
                        <p className="text-sm text-muted-foreground">Thử thay đổi từ khóa tìm kiếm</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="sellers" className="mt-6">
                    {loadingSellers ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : sellerError ? (
                      <div className="py-12 text-center">
                        <p className="text-lg text-destructive mb-2">Lỗi: {sellerError}</p>
                      </div>
                    ) : sellerResults.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {sellerResults.map((seller) => (
                          <Link key={seller.id} href={`/profile/${seller.id}`}>
                            <Card className="group transition-all hover:shadow-lg hover:border-primary cursor-pointer h-full">
                              <CardContent className="p-6">
                                <div className="flex flex-col items-center text-center">
                                  <Avatar className="h-20 w-20 mb-4">
                                    {seller.avatarUrl ? (
                                      <AvatarImage src={seller.avatarUrl} alt={seller.fullName} />
                                    ) : (
                                      <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                                        {seller.fullName?.charAt(0).toUpperCase() || seller.email?.charAt(0).toUpperCase() || "U"}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                                    {seller.fullName || "Người dùng"}
                                  </h3>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{seller.email}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                                    {seller.roles?.map((role) => (
                                      <Badge key={role} variant={role === "seller" ? "default" : "secondary"} className="capitalize">
                                        {role === "seller" ? "Người bán" : role}
                                      </Badge>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t">
                                    {/* <div className="text-center">
                                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                        <Star className="h-4 w-4" />
                                        <span className="text-xs">Điểm uy tín</span>
                                      </div>
                                      <p className="text-lg font-semibold text-foreground">
                                        {seller.reputationScore?.toFixed(1) || "N/A"}
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                        <Package className="h-4 w-4" />
                                        <span className="text-xs">Đã bán</span>
                                      </div>
                                      <p className="text-lg font-semibold text-foreground">
                                        {seller.totalSales ?? 0}
                                      </p>
                                    </div> */}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-lg text-muted-foreground mb-2">Không tìm thấy người bán nào</p>
                        <p className="text-sm text-muted-foreground">Thử thay đổi từ khóa tìm kiếm</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
            {!query && (
              <div className="py-12 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">Nhập từ khóa để tìm kiếm sản phẩm hoặc người bán</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}