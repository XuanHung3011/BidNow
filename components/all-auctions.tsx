"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuctionCard } from "@/components/auction-card"
import { Search, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ItemsAPI } from "@/lib/api/items"
import type { ItemResponseDto, ItemFilterDto, CategoryDto } from "@/lib/api/types"
import { useSearchParams } from "next/navigation"

// helper nhỏ
const formatCurrency = (v?: number) =>
  v == null ? "-" : v.toLocaleString('vi-VN') + " ₫"

export function AllAuctions() {
  const searchParams = useSearchParams()
  const qParam = searchParams?.get("q") ?? ""

  // search
  const [searchQuery, setSearchQuery] = useState<string>(qParam)
  const [debouncedQuery, setDebouncedQuery] = useState<string>(qParam)

  // filter states (form values inside sheet)
  // <-- CHANGED: store category IDs as numbers
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [minPriceStr, setMinPriceStr] = useState<string>("")
  const [maxPriceStr, setMaxPriceStr] = useState<string>("")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])

  // activeFilter = filter đã nhấn "Áp dụng"
  const [activeFilter, setActiveFilter] = useState<ItemFilterDto | null>(null)

  const [sortBy, setSortBy] = useState("ending-soon")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)

  const [items, setItems] = useState<ItemResponseDto[]>([])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

// sync q param & categoryId param -> searchQuery, reset page
useEffect(() => {
  const newQ = searchParams?.get("q") ?? ""
  setSearchQuery(newQ)
  setDebouncedQuery(newQ)
  setPage(1)

  // NEW: check categoryId param and auto-apply or clear
  const catIdParam = searchParams?.get("categoryId")

  if (catIdParam) {
    const parsed = Number(catIdParam)
    if (!Number.isNaN(parsed)) {
      // if categoryId exists -> set selection + apply filter for that single category
      setSelectedCategories([parsed])
      const newFilter: ItemFilterDto = {
        categoryIds: [parsed],
        // keep searchTerm if present
        searchTerm: newQ || undefined
      }
      setActiveFilter(newFilter)
      setPage(1)
    } else {
      // malformed param -> clear filters
      setSelectedCategories([])
      setActiveFilter(null)
      setPage(1)
    }
  } else {
    // NO categoryId param -> clear category filter so "Tất cả" shows everything
    setSelectedCategories([])
    // Only clear activeFilter if it was set by URL category. 
    // For simplicity and to match "All" behavior, we clear activeFilter here.
    setActiveFilter(null)
    setPage(1)
  }

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

  // debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300)
    return () => clearTimeout(id)
  }, [searchQuery])

  // helper toggles for checkbox lists (numbers)
  const toggleArrayItemNum = (arr: number[], value: number) =>
    arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]

  // Apply filter: build ItemFilterDto and set activeFilter
  const applyFilter = () => {
    const filter: ItemFilterDto = {}

    // <-- CHANGED: send categoryIds as number[] to match backend DTO
    if (selectedCategories.length) filter.categoryIds = selectedCategories

    // <-- CHANGED: send auctionStatuses (backend expects auctionStatuses)
    if (selectedStatuses.length) filter.auctionStatuses = selectedStatuses

    const min = Number(minPriceStr)
    const max = Number(maxPriceStr)
    if (!Number.isNaN(min) && min > 0) filter.minPrice = min
    if (!Number.isNaN(max) && max > 0) filter.maxPrice = max
    // include search term if present (optional)
    if (debouncedQuery) filter.searchTerm = debouncedQuery

    setActiveFilter(filter)
    setPage(1)
  }

  const resetFilter = () => {
    setSelectedCategories([])
    setSelectedStatuses([])
    setMinPriceStr("")
    setMaxPriceStr("")
    setActiveFilter(null)
    // optionally refetch unfiltered results; page already set to 1
    setPage(1)
  }

  // fetch whenever page / debouncedQuery / activeFilter changes
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        if (activeFilter) {
          const res = await ItemsAPI.filterPaged(activeFilter, page, pageSize)
          if (!isMounted) return
          setItems(res.items)
          setTotalCount(res.pagination?.totalCount ?? res.items.length)
        } else if (debouncedQuery) {
          const res = await ItemsAPI.searchPaged(debouncedQuery, page, pageSize)
          if (!isMounted) return
          setItems(res.items)
          setTotalCount(res.pagination?.totalCount ?? res.items.length)
        } else {
          const res = await ItemsAPI.getPaged(page, pageSize)
          if (!isMounted) return
          setItems(res.items)
          setTotalCount(res.pagination?.totalCount ?? res.items.length)
        }
      } catch (err: any) {
        console.error('Fetch items error', err)
        if (!isMounted) return
        setError(err.message || 'Lỗi khi tải dữ liệu')
        setItems([])
        setTotalCount(null)
      } finally {
        if (!isMounted) return
        setLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [debouncedQuery, activeFilter, page, pageSize])

  // sort client-side unchanged
  const sortedItems = useMemo(() => {
    const copy = [...items]
    if (sortBy === 'ending-soon') {
      return copy.sort((a, b) => {
        const at = a.auctionEndTime ? new Date(a.auctionEndTime).getTime() : Infinity
        const bt = b.auctionEndTime ? new Date(b.auctionEndTime).getTime() : Infinity
        return at - bt
      })
    }
    if (sortBy === 'newest') {
      return copy.sort((a,b)=> new Date(b.createdAt||0).getTime() - new Date(a.createdAt||0).getTime())
    }
    if (sortBy === 'price-low') {
      return copy.sort((a,b)=>(a.currentBid ?? a.startingBid ?? a.basePrice ?? 0) - (b.currentBid ?? b.startingBid ?? b.basePrice ?? 0))
    }
    if (sortBy === 'price-high') {
      return copy.sort((a,b)=>(b.currentBid ?? b.startingBid ?? b.basePrice ?? 0) - (a.currentBid ?? a.startingBid ?? a.basePrice ?? 0))
    }
    if (sortBy === 'most-bids') {
      return copy.sort((a,b)=> (b.bidCount ?? 0) - (a.bidCount ?? 0))
    }
    return copy
  }, [items, sortBy])

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
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                className="pl-10"
              />
            </div>
            
          </div>
        </div>
      </section>

<section className="py-8">
  <div className="container mx-auto px-4">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        {loading ? 'Đang tải...' : `Hiển thị ${totalCount ?? 0} kết quả`}
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

       {/*
  <div className="space-y-3 mb-6">
    <Label className="text-base font-semibold">Trạng thái</Label>
    <div className="space-y-2">
      {statusOptions.map((status) => (
        <div key={status} className="flex items-center space-x-2">
          <Checkbox
            id={`status-${status}`}
            checked={selectedStatuses.includes(status)}
            onCheckedChange={() =>
              setSelectedStatuses(
                selectedStatuses.includes(status)
                  ? selectedStatuses.filter((s) => s !== status)
                  : [...selectedStatuses, status]
              )
            }
          />
          <label
            htmlFor={`status-${status}`}
            className="text-sm leading-none capitalize"
          >
            {status}
          </label>
        </div>
      ))}
    </div>
  </div>
*/}


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
            : sortedItems.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  auction={{
                    id: (auction.auctionId ?? auction.id).toString(),
                    title: auction.title,
                    image:
                      (auction.images && auction.images[0]) || "/placeholder.jpg",
                    currentBid:
                      auction.currentBid ??
                      auction.startingBid ??
                      auction.basePrice ??
                      0,
                    startingBid:
                      auction.startingBid ?? auction.basePrice ?? 0,
                    endTime: auction.auctionEndTime
                      ? new Date(auction.auctionEndTime)
                      : new Date(0),
                    bidCount: auction.bidCount ?? 0,
                    category: auction.categoryName ?? "Chưa phân loại",
                  }}
                />
              ))}
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
