"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, X, Eye, Loader2, Search } from "lucide-react"
import { ItemsAPI } from "@/lib/api/items"
import { ItemResponseDto, CategoryDto } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"

export function PendingAuctions() {
  const { toast } = useToast()
  const [items, setItems] = useState<ItemResponseDto[]>([])
  const [allItems, setAllItems] = useState<ItemResponseDto[]>([]) // For client-side search
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set())
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState("CreatedAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Categories
  const [categories, setCategories] = useState<CategoryDto[]>([])

  useEffect(() => {
    fetchCategories()
    fetchPendingItems()
  }, [])

  useEffect(() => {
    fetchPendingItems()
  }, [selectedCategory, sortBy, sortOrder, page])

  const fetchCategories = async () => {
    try {
      const cats = await ItemsAPI.getCategories()
      setCategories(cats)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchPendingItems = async () => {
    try {
      setLoading(true)
      const result = await ItemsAPI.getAllWithFilter({
        statuses: ["pending"],
        categoryId: selectedCategory || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder,
        page: page,
        pageSize: pageSize,
      })
      setAllItems(result.data || [])
      setItems(result.data || [])
      setTotalCount(result.totalCount || 0)
      setTotalPages(result.totalPages || 0)
    } catch (error) {
      console.error("Error fetching pending items:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm chờ duyệt",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Client-side search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setItems(allItems)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = allItems.filter((item) => {
      const titleMatch = item.title?.toLowerCase().includes(query)
      const sellerMatch = item.sellerName?.toLowerCase().includes(query)
      const categoryMatch = item.categoryName?.toLowerCase().includes(query)
      return titleMatch || sellerMatch || categoryMatch
    })
    setItems(filtered)
  }, [searchQuery, allItems])

  const handleApprove = async (itemId: number) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(itemId))
      await ItemsAPI.approveItem(itemId)
      toast({
        title: "Thành công",
        description: "Đã phê duyệt sản phẩm",
      })
      // Refresh list after approve/reject
      await fetchPendingItems()
    } catch (error) {
      console.error("Error approving item:", error)
      toast({
        title: "Lỗi",
        description: "Không thể phê duyệt sản phẩm",
        variant: "destructive",
      })
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleReject = async (itemId: number) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(itemId))
      await ItemsAPI.rejectItem(itemId)
      toast({
        title: "Thành công",
        description: "Đã từ chối sản phẩm",
      })
      // Refresh list after approve/reject
      await fetchPendingItems()
    } catch (error) {
      console.error("Error rejecting item:", error)
      toast({
        title: "Lỗi",
        description: "Không thể từ chối sản phẩm",
        variant: "destructive",
      })
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return "N/A"
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getImageUrl = (images?: string | string[]) => {
    if (!images) return "/placeholder.svg"
    
    // If it's a string, try to parse as JSON
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0]
        }
        return images
      } catch {
        return images
      }
    }
    
    // If it's an array
    if (Array.isArray(images) && images.length > 0) {
      return images[0]
    }
    
    return "/placeholder.svg"
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setSortBy("CreatedAt")
    setSortOrder("desc")
    setPage(1)
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên sản phẩm, người bán, danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Category Filter */}
            <Select
              value={selectedCategory?.toString() || "all"}
              onValueChange={(value) => {
                setSelectedCategory(value === "all" ? null : Number(value))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CreatedAt">Ngày tạo</SelectItem>
                <SelectItem value="Title">Tên sản phẩm</SelectItem>
                <SelectItem value="BasePrice">Giá khởi điểm</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select
              value={sortOrder}
              onValueChange={(value) => {
                setSortOrder(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Thứ tự" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Giảm dần</SelectItem>
                <SelectItem value="asc">Tăng dần</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full sm:w-auto"
            >
              Đặt lại
            </Button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {searchQuery ? (
              <span>
                Tìm thấy {items.length} kết quả
                {selectedCategory && ` trong danh mục đã chọn`}
              </span>
            ) : (
              <span>
                Tổng cộng {totalCount} sản phẩm chờ duyệt
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>
            {searchQuery
              ? "Không tìm thấy sản phẩm nào phù hợp với từ khóa tìm kiếm"
              : "Không có sản phẩm nào đang chờ duyệt"}
          </p>
        </div>
      ) : (
        <>
      {items.map((item) => {
        const itemId = item.id
        const isProcessing = processingIds.has(itemId)
        
        return (
          <Card key={item.id} className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <img
                  src={getImageUrl(item.images)}
                  alt={item.title}
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Người bán: <span className="font-medium text-foreground">{item.sellerName || "N/A"}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Danh mục: <span className="font-medium text-foreground">{item.categoryName || "N/A"}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Giá khởi điểm: <span className="font-medium text-foreground">{formatPrice(item.basePrice)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Gửi lúc: <span className="font-medium text-foreground">{formatDate(item.createdAt)}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto bg-transparent"
                  disabled={isProcessing}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Xem chi tiết
                </Button>
                <Button 
                  size="sm" 
                  className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
                  onClick={() => handleApprove(itemId)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Phê duyệt
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full sm:w-auto"
                  onClick={() => handleReject(itemId)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <X className="mr-2 h-4 w-4" />
                  )}
                  Từ chối
                </Button>
              </div>
            </div>
          </Card>
        )
      })}

          {/* Pagination */}
          {!searchQuery && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} trong tổng số {totalCount} sản phẩm
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  Trước
                </Button>
                <div className="flex items-center px-4 text-sm">
                  Trang {page} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
