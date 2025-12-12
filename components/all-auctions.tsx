"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuctionCard } from "@/components/auction-card"
import { Search, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ItemsAPI } from "@/lib/api/items"
import { AuctionsAPI, AuctionListItemDto, AuctionFilterParams } from "@/lib/api/auctions"
import type { ItemFilterDto, CategoryDto } from "@/lib/api/types"
import { useSearchParams } from "next/navigation"
import { getImageUrls, getImageUrl } from "@/lib/api/config"
import { useAuth } from "@/lib/auth-context"

// helper nhỏ
const formatCurrency = (v?: number) =>
  v == null ? "-" : v.toLocaleString('vi-VN') + " ₫"

export function AllAuctions() {
  const searchParams = useSearchParams()
  const qParam = searchParams?.get("q") ?? ""
  const { user } = useAuth()

  // search
  const [searchQuery, setSearchQuery] = useState<string>(qParam)
  const [debouncedQuery, setDebouncedQuery] = useState<string>(qParam)
  
  // Track last logged query to prevent duplicate logging
  const lastLoggedQueryRef = useRef<string>("")

  // filter states (form values inside sheet)
  // Note: Category and price filters are not yet supported by auctions API
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [minPriceStr, setMinPriceStr] = useState<string>("")
  const [maxPriceStr, setMaxPriceStr] = useState<string>("")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])

  const [sortBy, setSortBy] = useState("ending-soon")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)

  const [auctions, setAuctions] = useState<AuctionListItemDto[]>([])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

// sync q param -> searchQuery, reset page
useEffect(() => {
  const newQ = searchParams?.get("q") ?? ""
  setSearchQuery(newQ)
  setDebouncedQuery(newQ)
  setPage(1)

  // Note: Category filter from URL is not yet supported by auctions API
  // Can be added later if needed

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams?.toString()])

  // fetch categories once on mount
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const cats = await ItemsAPI.getCategories()
        if (!mounted) return
        setCategories(cats)
      } catch (err) {
        console.error("Cannot load categories", err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Log search keyword when URL query changes (only once per search)
  useEffect(() => {
    const queryFromUrl = searchParams?.get("q")?.trim() ?? ""
    // Only log if query changed and user is logged in
    if (queryFromUrl && queryFromUrl !== lastLoggedQueryRef.current && user?.id) {
      try {
        const userId = Number(user.id)
        if (userId > 0) {
          // Update ref before logging to prevent duplicate logs
          lastLoggedQueryRef.current = queryFromUrl
          // Call searchPaged API to log search keyword (fire and forget)
          ItemsAPI.searchPaged(queryFromUrl, 1, 1, userId).catch(err => {
            console.error('Failed to log search keyword:', err)
            // Reset ref on error so it can be retried if needed
            lastLoggedQueryRef.current = ""
          })
        }
      } catch (err) {
        console.error('Error logging search keyword:', err)
        lastLoggedQueryRef.current = ""
      }
    } else if (!queryFromUrl) {
      // Reset ref when query is cleared
      lastLoggedQueryRef.current = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString(), user?.id])

  // debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300)
    return () => clearTimeout(id)
  }, [searchQuery])

  // helper toggles for checkbox lists (numbers)
  const toggleArrayItemNum = (arr: number[], value: number) =>
    arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]

  // Apply filter: Note - Category and price filters are not yet supported by auctions API
  const applyFilter = () => {
    // For now, just show a message that these filters are not yet supported
    // In the future, these can be added to the backend auctions API
    console.log("Category and price filters are not yet supported for auctions API")
    setPage(1)
  }

  const resetFilter = () => {
    setSelectedCategories([])
    setSelectedStatuses([])
    setMinPriceStr("")
    setMaxPriceStr("")
    setPage(1)
  }

  // fetch whenever page / debouncedQuery / activeFilter / sortBy changes
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        // Map sortBy to backend sortBy values
        let backendSortBy = "EndTime"
        if (sortBy === 'ending-soon') backendSortBy = "EndTime"
        else if (sortBy === 'newest') backendSortBy = "EndTime" // Use EndTime as proxy for newest
        else if (sortBy === 'price-low' || sortBy === 'price-high') backendSortBy = "CurrentBid"
        else if (sortBy === 'most-bids') backendSortBy = "BidCount"

        const backendSortOrder = (sortBy === 'price-low' || sortBy === 'newest') ? "asc" : "desc"

        const params: AuctionFilterParams = {
          page,
          pageSize,
          sortBy: backendSortBy,
          sortOrder: backendSortOrder
        }

        if (debouncedQuery) {
          params.searchTerm = debouncedQuery
        }

        // Note: Category and price filters are not yet supported by auctions API
        // These would need backend support to filter auctions by category/price

        const res = await AuctionsAPI.getAll(params)
        if (!isMounted) return
        setAuctions(res.data)
        setTotalCount(res.totalCount)
      } catch (err: any) {
        console.error('Fetch auctions error', err)
        if (!isMounted) return
        setError(err.message || 'Lỗi khi tải dữ liệu')
        setAuctions([])
        setTotalCount(null)
      } finally {
        if (!isMounted) return
        setLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [debouncedQuery, page, pageSize, sortBy, user?.id])

  // Sort is now handled by backend, but we can do additional client-side sorting if needed
  const sortedAuctions = useMemo(() => {
    // Backend already sorts, but we can apply additional sorting if needed
    return [...auctions]
  }, [auctions])

  // Hiển thị tất cả auctions (bao gồm cả đã kết thúc), chỉ ẩn những phiên đã bị hủy
  const visibleItems = useMemo(() => {
    const isVisibleStatus = (status?: string | null) => {
      const s = status?.toLowerCase() ?? ""
      // Chỉ ẩn các phiên đã bị hủy, hiển thị cả những phiên đã kết thúc (completed/ended)
      if (s === "cancelled" || s === "canceled") {
        return false
      }
      return true
    }

    return sortedAuctions.filter((auction) => {
      if (!auction.id) return false
      return isVisibleStatus(auction.status)
    })
  }, [sortedAuctions])

  const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1

  // statuses list (could be dynamic from API)
  const statusOptions = ["active", "pending", "ended"] // map to backend status values if needed

  return (
    <>
      <section className="border-b bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="mb-4 text-4xl font-bold text-foreground">Tất cả phiên đấu giá</h1>
          <p className="mb-6 text-lg text-muted-foreground">Khám phá hàng nghìn sản phẩm đang được đấu giá</p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              {/*
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                className="pl-10"
              />
              */}
            </div>
            
          </div>
        </div>
      </section>

<section className="py-8">
  <div className="container mx-auto px-4">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        {loading ? "Đang tải..." : `Hiển thị ${visibleItems.length} kết quả`}
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

    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Filter */}
      <aside className="lg:col-span-1 rounded-xl border p-4 bg-white shadow-sm h-fit sticky top-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <SlidersHorizontal className="mr-2 h-5 w-5" />
          Bộ lọc nâng cao
        </h2>

        {/* Danh mục */}
        <div className="space-y-3 mb-6">
          <Label className="text-base font-semibold">Danh mục</Label>
          <div className="space-y-2 max-h-48 overflow-auto pr-2">
            {categories.length === 0 ? (
              <div className="text-sm text-muted-foreground">Đang tải danh mục...</div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={selectedCategories.includes(Number(category.id))}
                    onCheckedChange={() =>
                      setSelectedCategories(toggleArrayItemNum(selectedCategories, Number(category.id)))
                    }
                  />
                  <label htmlFor={`cat-${category.id}`} className="text-sm leading-none">
                    {category.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Khoảng giá */}
        <div className="space-y-3 mb-6">
          <Label className="text-base font-semibold">Khoảng giá</Label>
          <div className="flex gap-2">
            <Input
              value={minPriceStr}
              onChange={(e) => setMinPriceStr(e.target.value)}
              type="number"
              placeholder="Tối thiểu"
            />
            <Input
              value={maxPriceStr}
              onChange={(e) => setMaxPriceStr(e.target.value)}
              type="number"
              placeholder="Tối đa"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={applyFilter}>Áp dụng</Button>
          <Button variant="ghost" className="flex-1" onClick={resetFilter}>Xóa</Button>
        </div>
      </aside>

      {/* Danh sách đấu giá */}
      <div className="lg:col-span-3">
        {error && <div className="mb-4 text-red-600">Lỗi: {error}</div>}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {loading
            ? Array.from({ length: pageSize }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-lg bg-gray-100" />
              ))
            : visibleItems.map((auction, index) => {
                // Parse images from itemImages
                let firstImage = "/placeholder.jpg"
                if (auction.itemImages) {
                  try {
                    const imageUrls = getImageUrls(auction.itemImages)
                    firstImage = imageUrls[0] || "/placeholder.jpg"
                  } catch {
                    // If not JSON, try comma-separated or direct URL
                    firstImage = getImageUrl(auction.itemImages) || "/placeholder.jpg"
                  }
                }

                return (
                  <AuctionCard
                    key={`auction-${auction.id}-${index}`}
                    auction={{
                      id: String(auction.id),
                      title: auction.itemTitle,
                      image: firstImage,
                      currentBid: auction.currentBid ?? auction.startingBid ?? 0,
                      startingBid: auction.startingBid ?? 0,
                      startTime: auction.startTime ? new Date(auction.startTime) : undefined,
                      endTime: auction.endTime ? new Date(auction.endTime) : new Date(0),
                      bidCount: auction.bidCount ?? 0,
                      category: auction.categoryName ?? "Chưa phân loại",
                      status: auction.displayStatus ?? auction.status ?? undefined,
                      pausedAt: auction.pausedAt ?? undefined,
                    }}
                  />
                )
              })}
        </div>

        {/* Phân trang */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Trước
          </Button>
          <span>
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  </div>
</section>

    </>
  )
}
