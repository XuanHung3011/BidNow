"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuctionCard } from "@/components/auction-card"
import { Package, Loader2, Smartphone, Palette, Watch, Gem, Car, Home, Music, Camera } from "lucide-react"
import { CategoriesAPI } from "@/lib/api/categories"
import { AuctionsAPI, AuctionListItemDto, AuctionFilterParams } from "@/lib/api/auctions"
import { CategoryDtos } from "@/lib/api/types"
import { getImageUrl } from "@/lib/api/config"

// Icon mapping based on category name or slug
const getCategoryIcon = (name: string, slug: string): any => {
  const lowerName = name.toLowerCase()
  const lowerSlug = slug.toLowerCase()
  
  if (lowerName.includes("điện tử") || lowerName.includes("electronics") || lowerSlug.includes("dien-tu") || lowerSlug.includes("electronics")) {
    return Smartphone
  }
  if (lowerName.includes("nghệ thuật") || lowerName.includes("art") || lowerSlug.includes("nghe-thuat") || lowerSlug.includes("art")) {
    return Palette
  }
  if (lowerName.includes("sưu tầm") || lowerName.includes("collectibles") || lowerSlug.includes("suu-tam") || lowerSlug.includes("collectibles")) {
    return Watch
  }
  if (lowerName.includes("trang sức") || lowerName.includes("jewelry") || lowerSlug.includes("trang-suc") || lowerSlug.includes("jewelry")) {
    return Gem
  }
  if (lowerName.includes("xe") || lowerName.includes("vehicle") || lowerSlug.includes("xe") || lowerSlug.includes("vehicle")) {
    return Car
  }
  if (lowerName.includes("bất động sản") || lowerName.includes("real estate") || lowerSlug.includes("bat-dong-san") || lowerSlug.includes("real-estate")) {
    return Home
  }
  if (lowerName.includes("nhạc") || lowerName.includes("music") || lowerSlug.includes("nhac") || lowerSlug.includes("music")) {
    return Music
  }
  if (lowerName.includes("nhiếp ảnh") || lowerName.includes("photography") || lowerSlug.includes("nhiep-anh") || lowerSlug.includes("photography")) {
    return Camera
  }
  return Package // Default icon
}

export function CategoryAuctions({ categorySlug }: { categorySlug: string }) {
  const [sortBy, setSortBy] = useState("ending-soon")
  const [priceRange, setPriceRange] = useState("all")
  const [category, setCategory] = useState<CategoryDtos | null>(null)
  const [auctions, setAuctions] = useState<AuctionListItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 12

  // Load category by slug
  useEffect(() => {
    const loadCategory = async () => {
      try {
        setLoading(true)
        const cat = await CategoriesAPI.getBySlug(categorySlug)
        setCategory(cat)
      } catch (err) {
        console.error("Error loading category:", err)
        setError("Không tìm thấy danh mục")
      } finally {
        setLoading(false)
      }
    }
    loadCategory()
  }, [categorySlug])

  // Load auctions when category is loaded
  useEffect(() => {
    if (!category) return

    const loadAuctions = async () => {
      try {
        setLoading(true)
        setError(null)

        // Map sortBy to backend sortBy values
        let backendSortBy = "EndTime"
        if (sortBy === 'ending-soon') backendSortBy = "EndTime"
        else if (sortBy === 'newest') backendSortBy = "EndTime"
        else if (sortBy === 'price-low' || sortBy === 'price-high') backendSortBy = "CurrentBid"
        else if (sortBy === 'most-bids') backendSortBy = "BidCount"

        const backendSortOrder = (sortBy === 'price-low' || sortBy === 'newest') ? "asc" : "desc"

        // Filter by active and scheduled auctions
        const params: AuctionFilterParams = {
          categoryId: category.id,
          statuses: "active,scheduled",
          sortBy: backendSortBy,
          sortOrder: backendSortOrder,
          page,
          pageSize,
        }

        const result = await AuctionsAPI.getAll(params)
        setAuctions(result.data || [])
        // Store totalCount from backend (before price filter)
        setTotalCount(result.totalCount || 0)
      } catch (err) {
        console.error("Error loading auctions:", err)
        setError("Không thể tải danh sách đấu giá")
      } finally {
        setLoading(false)
      }
    }

    loadAuctions()
  }, [category, sortBy, page])

  // Reset page when priceRange or sortBy changes
  useEffect(() => {
    setPage(1)
  }, [priceRange, sortBy])

  // Map AuctionListItemDto to AuctionCard format and filter by price range
  const mappedAuctions = auctions
    .filter((auction) => {
      // Filter by price range
      if (priceRange === "all") return true
      
      const currentPrice = auction.currentBid || auction.startingBid || 0
      const priceInMillions = currentPrice / 1000000 // Convert to millions
      
      switch (priceRange) {
        case "0-10m":
          return priceInMillions < 10
        case "10m-50m":
          return priceInMillions >= 10 && priceInMillions < 50
        case "50m-100m":
          return priceInMillions >= 50 && priceInMillions < 100
        case "100m+":
          return priceInMillions >= 100
        default:
          return true
      }
    })
    .map((auction) => {
      const images = auction.itemImages 
        ? (typeof auction.itemImages === 'string' 
            ? (auction.itemImages.includes('[') 
                ? JSON.parse(auction.itemImages) 
                : auction.itemImages.split(','))
            : [])
        : []
      const firstImage = images.length > 0 ? images[0] : "/placeholder.png"
      
      return {
        id: auction.id,
        title: auction.itemTitle,
        image: getImageUrl(firstImage),
        currentBid: auction.currentBid || auction.startingBid,
        startingBid: auction.startingBid,
        endTime: new Date(auction.endTime),
        startTime: auction.startTime ? new Date(auction.startTime) : undefined,
        bidCount: auction.bidCount || 0,
        category: auction.categoryName || category?.name || "",
        sellerName: auction.sellerName,
        status: auction.status,
        pausedAt: auction.pausedAt ? new Date(auction.pausedAt) : null,
      }
    })

  if (loading && !category) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !category) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{error}</p>
      </div>
    )
  }

  const Icon = category ? getCategoryIcon(category.name, category.slug) : Package

  return (
    <>
      <section className="border-b bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Icon className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold text-foreground">{category?.name || "Danh mục"}</h1>
              <p className="text-lg text-muted-foreground">
                {loading ? "Đang tải..." : `${totalCount} phiên đấu giá đang diễn ra`}
              </p>
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : mappedAuctions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Không có sản phẩm nào trong danh mục này</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mappedAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
              {mappedAuctions.length > 0 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    Trước
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Trang {page} / {Math.ceil(totalCount / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(totalCount / pageSize) || loading}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
