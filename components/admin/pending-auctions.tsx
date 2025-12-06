"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Check, X, Eye, Loader2, Search } from "lucide-react"
import { ItemsAPI } from "@/lib/api/items"
import { ItemResponseDto, CategoryDto } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { getImageUrls } from "@/lib/api/config"
import { createAuctionHubConnection } from "@/lib/realtime/auctionHub"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

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
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemResponseDto | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  
  // Approve confirmation state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [itemToApprove, setItemToApprove] = useState<ItemResponseDto | null>(null)
  const [approveSignature, setApproveSignature] = useState("")
  
  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectSignature, setRejectSignature] = useState("")
  const [itemToReject, setItemToReject] = useState<number | null>(null)
  
  // Result dialog state
  const [resultDialogOpen, setResultDialogOpen] = useState(false)
  const [resultDialogTitle, setResultDialogTitle] = useState("")
  const [resultDialogMessage, setResultDialogMessage] = useState("")

  // Helper function để loại bỏ duplicate items
  const removeDuplicates = useCallback((itemsData: ItemResponseDto[]): ItemResponseDto[] => {
    // Loại bỏ duplicate items
    // 1. Loại bỏ duplicate dựa trên ID (nếu backend trả về cùng item nhiều lần)
    // 2. Loại bỏ duplicate dựa trên seller + title + category (nếu người bán sửa item pending tạo item mới)
    const uniqueItemsMap = new Map<number, ItemResponseDto>()
    const duplicateKeyMap = new Map<string, ItemResponseDto>() // Key: sellerId_title_categoryId
    
    itemsData.forEach((item) => {
      // Bước 1: Loại bỏ duplicate dựa trên ID
      const existingItem = uniqueItemsMap.get(item.id)
      if (!existingItem) {
        uniqueItemsMap.set(item.id, item)
      } else {
        // Nếu đã tồn tại, so sánh thời gian tạo để giữ item mới hơn
        const existingTime = new Date(existingItem.createdAt || 0).getTime()
        const currentTime = new Date(item.createdAt || 0).getTime()
        // Nếu item hiện tại mới hơn, thay thế
        if (currentTime > existingTime) {
          uniqueItemsMap.set(item.id, item)
        }
      }
    })
    
    // Bước 2: Loại bỏ duplicate dựa trên seller + title + category
    // Chỉ áp dụng cho items có cùng seller, title, category và tạo trong vòng 5 phút
    // (Trường hợp người bán sửa item pending tạo item mới nhưng item cũ chưa bị xóa)
    const fiveMinutes = 5 * 60 * 1000
    const finalItems: ItemResponseDto[] = []
    
    // Sắp xếp items theo thời gian tạo (mới nhất trước) để ưu tiên item mới hơn
    const sortedItems = Array.from(uniqueItemsMap.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime()
      const timeB = new Date(b.createdAt || 0).getTime()
      return timeB - timeA
    })
    
    sortedItems.forEach((item) => {
      const key = `${item.sellerId || 0}_${item.title || ''}_${item.categoryId || 0}`.toLowerCase()
      const itemTime = new Date(item.createdAt || 0).getTime()
      
      // Kiểm tra xem có item tương tự đã được thêm vào finalItems chưa
      const existingDuplicate = duplicateKeyMap.get(key)
      if (existingDuplicate) {
        const existingTime = new Date(existingDuplicate.createdAt || 0).getTime()
        const timeDiff = Math.abs(itemTime - existingTime)
        
        // Nếu cách nhau ít hơn 5 phút, coi như duplicate và bỏ qua item này (vì item mới hơn đã được thêm trước)
        if (timeDiff >= fiveMinutes) {
          // Nếu cách nhau hơn 5 phút, coi như 2 items khác nhau
          duplicateKeyMap.set(key, item)
          finalItems.push(item)
        }
        // Nếu trong vòng 5 phút, bỏ qua item này (item mới hơn đã được thêm vào finalItems)
      } else {
        // Chưa có item tương tự, thêm vào
        duplicateKeyMap.set(key, item)
        finalItems.push(item)
      }
    })
    
    return finalItems.length > 0 ? finalItems : Array.from(uniqueItemsMap.values())
  }, [])

  const fetchPendingItems = useCallback(async (forceRefetch = false) => {
    try {
      // Khi force refetch (từ real-time update), không hiển thị loading để tránh flicker
      if (!forceRefetch) {
        setLoading(true)
      }
      
      const result = await ItemsAPI.getAllWithFilter({
        statuses: ["pending"],
        categoryId: selectedCategory || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder,
        page: page,
        pageSize: pageSize,
      })
      
      const itemsData = result.data || []
      
      // Loại bỏ duplicate items
      const uniqueItems = removeDuplicates(itemsData)
      
      // Mỗi khi refetch, thay thế hoàn toàn danh sách cũ bằng danh sách mới đã loại bỏ duplicate
      // Điều này đảm bảo items cũ (duplicate) sẽ bị loại bỏ ngay lập tức
      setAllItems(uniqueItems)
      
      // Items hiển thị sẽ được filter bởi useEffect riêng dựa trên searchQuery
      // Ở đây chỉ cần set items ban đầu, useEffect sẽ tự động filter lại khi allItems thay đổi
      setItems(uniqueItems)
      
      // Sử dụng totalCount từ backend, nhưng điều chỉnh nếu có duplicate
      const backendTotalCount = result.totalCount || 0
      const duplicateCount = itemsData.length - uniqueItems.length
      const adjustedTotalCount = Math.max(0, backendTotalCount - duplicateCount)
      
      setTotalCount(adjustedTotalCount)
      setTotalPages(result.totalPages || Math.ceil(adjustedTotalCount / pageSize))
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải danh sách sản phẩm chờ duyệt",
        variant: "destructive",
      })
    } finally {
      if (!forceRefetch) {
        setLoading(false)
      }
    }
  }, [selectedCategory, sortBy, sortOrder, page, pageSize, toast, removeDuplicates])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchPendingItems()
  }, [fetchPendingItems])

  const fetchCategories = async () => {
    try {
      const cats = await ItemsAPI.getCategories()
      setCategories(cats)
    } catch (error) {
      // Silently fail - categories are not critical
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

  useEffect(() => {
    const connection = createAuctionHubConnection()
    let mounted = true
    let started = false
    let isStarting = false
    
    const startPromise = (async () => {
      try {
        isStarting = true
        await connection.start()
        isStarting = false
        started = true
        if (!mounted) {
          await connection.stop().catch(() => {})
          return
        }
        await connection.invoke("JoinAdminSection", "pending").catch(() => {})
      } catch (error) {
        isStarting = false
        // Silently ignore connection errors
      }
    })()

    // Mỗi khi có thay đổi, tự động refetch lại toàn bộ danh sách
    connection.on("AdminPendingItemsChanged", () => {
      // Force refetch bằng cách gọi lại fetchPendingItems với flag forceRefetch = true
      // Không cần merge hay so sánh, chỉ cần fetch lại và thay thế hoàn toàn
      // Điều này đảm bảo item cũ (duplicate) sẽ bị loại bỏ ngay lập tức
      if (mounted) {
        fetchPendingItems(true)
      }
    })

    return () => {
      mounted = false
      connection.off("AdminPendingItemsChanged")
      const cleanup = async () => {
        // Wait for connection to finish starting
        if (isStarting) {
          const maxWait = 2000
          const startTime = Date.now()
          while (isStarting && (Date.now() - startTime) < maxWait) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }
        
        try {
          await startPromise.catch(() => {})
          if (started && connection) {
            await connection.invoke("LeaveAdminSection", "pending").catch(() => {})
          }
          if (connection) {
            await connection.stop().catch(() => {})
          }
        } catch {
          // Silently ignore all cleanup errors
        }
      }
      void cleanup()
    }
  }, [fetchPendingItems])

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
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể phê duyệt sản phẩm",
        variant: "destructive",
      })
      throw error
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleApproveClick = (item: ItemResponseDto) => {
    setItemToApprove(item)
    setApproveSignature("")
    setApproveDialogOpen(true)
  }

  const closeApproveDialog = () => {
    setApproveDialogOpen(false)
    setItemToApprove(null)
    setApproveSignature("")
  }

  const handleConfirmApprove = async () => {
    if (!itemToApprove) return

    if (approveSignature.trim() !== "Admin") {
      toast({
        title: "Thiếu chữ ký",
        description: 'Vui lòng nhập "Admin" vào ô chữ ký để xác nhận phê duyệt.',
        variant: "destructive",
      })
      return
    }

    try {
      await handleApprove(itemToApprove.id)
      closeApproveDialog()
      setResultDialogTitle("Phê duyệt sản phẩm thành công")
      setResultDialogMessage(
        `Sản phẩm "${itemToApprove.title}" đã được phê duyệt và đưa lên sàn đấu giá.`
      )
      setResultDialogOpen(true)
    } catch (error: any) {
      // Giữ dialog mở để admin thử lại
      setResultDialogTitle("Phê duyệt sản phẩm thất bại")
      setResultDialogMessage(
        error?.message || "Không thể phê duyệt sản phẩm. Vui lòng thử lại sau."
      )
      setResultDialogOpen(true)
    }
  }

  const handleRejectClick = (itemId: number) => {
    setItemToReject(itemId)
    setRejectReason("")
    setRejectSignature("")
    setRejectDialogOpen(true)
  }

  const closeRejectDialog = () => {
    setRejectDialogOpen(false)
    setRejectReason("")
    setRejectSignature("")
    setItemToReject(null)
  }

  const handleReject = async () => {
    if (!itemToReject) return
    
    if (!rejectReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      })
      return
    }

    if (rejectSignature.trim() !== "Admin") {
      toast({
        title: "Thiếu chữ ký",
        description: 'Vui lòng nhập "Admin" vào ô chữ ký để xác nhận từ chối.',
        variant: "destructive",
      })
      return
    }

    try {
      setProcessingIds((prev) => new Set(prev).add(itemToReject))
      const item = items.find((i) => i.id === itemToReject)
      await ItemsAPI.rejectItem(itemToReject, rejectReason)
      closeRejectDialog()
      // Refresh list after approve/reject
      await fetchPendingItems()
      setResultDialogTitle("Từ chối sản phẩm thành công")
      setResultDialogMessage(
        `Sản phẩm "${item?.title || "N/A"}" đã bị từ chối.\nLý do: ${rejectReason.trim()}`
      )
      setResultDialogOpen(true)
    } catch (error: any) {
      setResultDialogTitle("Từ chối sản phẩm thất bại")
      setResultDialogMessage(
        error?.message || "Không thể từ chối sản phẩm. Vui lòng thử lại sau."
      )
      setResultDialogOpen(true)
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemToReject)
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
    const urls = getImageUrls(images)
    return urls[0] || "/placeholder.svg"
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setSortBy("CreatedAt")
    setSortOrder("desc")
    setPage(1)
  }

  const handleViewDetails = async (itemId: number) => {
    try {
      setLoadingDetail(true)
      setDialogOpen(true)
      const item = await ItemsAPI.getById(itemId)
      setSelectedItem(item)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải thông tin chi tiết sản phẩm",
        variant: "destructive",
      })
      setDialogOpen(false)
    } finally {
      setLoadingDetail(false)
    }
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
                  onClick={() => handleViewDetails(itemId)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Xem chi tiết
                </Button>
                <Button 
                  size="sm" 
                  className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
                  onClick={() => handleApproveClick(item)}
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
                  onClick={() => handleRejectClick(itemId)}
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

      {/* Item Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {loadingDetail ? "Đang tải..." : selectedItem ? selectedItem.title : "Chi tiết sản phẩm"}
            </DialogTitle>
            <DialogDescription>
              {loadingDetail ? "Vui lòng chờ..." : "Chi tiết sản phẩm chờ duyệt"}
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedItem ? (
            <>

              <div className="space-y-6">
                {/* Images */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Hình ảnh</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(() => {
                      // Sử dụng getImageUrls để tạo URLs đầy đủ cho tất cả ảnh
                      const imageUrls = getImageUrls(selectedItem.images)
                      
                      if (imageUrls.length === 0 || (imageUrls.length === 1 && imageUrls[0] === "/placeholder.svg")) {
                        return (
                          <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground">Không có hình ảnh</span>
                          </div>
                        )
                      }
                      
                      return imageUrls.map((imgUrl, idx) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt={`${selectedItem.title} - ${idx + 1}`}
                          className="aspect-square rounded-lg object-cover w-full"
                        />
                      ))
                    })()}
                  </div>
                </div>

                {/* Description */}
                {selectedItem.description && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Mô tả</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedItem.description}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Thông tin cơ bản</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Danh mục:</span>
                        <span className="font-medium">{selectedItem.categoryName || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tình trạng:</span>
                        <span className="font-medium">{selectedItem.condition || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vị trí:</span>
                        <span className="font-medium">{selectedItem.location || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Giá khởi điểm:</span>
                        <span className="font-medium">{formatPrice(selectedItem.basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trạng thái:</span>
                        <Badge variant={selectedItem.status === "pending" ? "default" : "secondary"}>
                          {selectedItem.status || "N/A"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ngày tạo:</span>
                        <span className="font-medium">{formatDate(selectedItem.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Thông tin người bán</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tên:</span>
                        <span className="font-medium">{selectedItem.sellerName || "N/A"}</span>
                      </div>
                      {(selectedItem as any).sellerEmail && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{(selectedItem as any).sellerEmail}</span>
                        </div>
                      )}
                      {(selectedItem as any).sellerReputationScore !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Điểm uy tín:</span>
                          <span className="font-medium">{(selectedItem as any).sellerReputationScore.toFixed(1)}</span>
                        </div>
                      )}
                      {(selectedItem as any).sellerTotalSales !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tổng bán hàng:</span>
                          <span className="font-medium">{(selectedItem as any).sellerTotalSales}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auction Info */}
                {selectedItem.auctionId && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Thông tin đấu giá</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {selectedItem.startingBid !== null && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Giá khởi điểm đấu giá:</span>
                          <span className="font-medium">{formatPrice(selectedItem.startingBid)}</span>
                        </div>
                      )}
                      {selectedItem.currentBid !== null && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Giá hiện tại:</span>
                          <span className="font-medium">{formatPrice(selectedItem.currentBid)}</span>
                        </div>
                      )}
                      {selectedItem.bidCount !== null && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Số lượt đấu giá:</span>
                          <span className="font-medium">{selectedItem.bidCount}</span>
                        </div>
                      )}
                      {selectedItem.auctionEndTime && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Thời gian kết thúc:</span>
                          <span className="font-medium">{formatDate(selectedItem.auctionEndTime)}</span>
                        </div>
                      )}
                      {selectedItem.auctionStatus && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Trạng thái đấu giá:</span>
                          <Badge variant="outline">{selectedItem.auctionStatus}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Reject Item Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối sản phẩm</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối sản phẩm này. Lý do này sẽ được gửi đến người bán.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Lý do từ chối *</Label>
              <Textarea
                id="rejectReason"
                placeholder="Nhập lý do từ chối sản phẩm..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Lý do từ chối là bắt buộc và sẽ được gửi đến người bán
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectSignature">Chữ ký Admin *</Label>
              <Input
                id="rejectSignature"
                placeholder='Nhập "Admin" để xác nhận'
                value={rejectSignature}
                onChange={(e) => setRejectSignature(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Bạn phải nhập chính xác chữ "Admin" trước khi từ chối sản phẩm.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={closeRejectDialog}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={
                  !rejectReason.trim() ||
                  rejectSignature.trim() !== "Admin" ||
                  (itemToReject !== null && processingIds.has(itemToReject))
                }
              >
                {itemToReject !== null && processingIds.has(itemToReject) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận từ chối"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={(open) => {
        if (!open) {
          closeApproveDialog()
        } else {
          setApproveDialogOpen(true)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận phê duyệt sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn phê duyệt sản phẩm "{itemToApprove?.title}"? Hành động này sẽ đưa sản phẩm lên sàn đấu giá.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approveSignature">Chữ ký Admin *</Label>
              <Input
                id="approveSignature"
                placeholder='Nhập "Admin" để xác nhận'
                value={approveSignature}
                onChange={(e) => setApproveSignature(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Bạn phải nhập chính xác chữ "Admin" để hoàn tất phê duyệt.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeApproveDialog}>
                Hủy
              </Button>
              <Button
                onClick={handleConfirmApprove}
                disabled={
                  approveSignature.trim() !== "Admin" ||
                  (itemToApprove !== null && processingIds.has(itemToApprove.id))
                }
              >
                {itemToApprove !== null && processingIds.has(itemToApprove.id) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang phê duyệt...
                  </>
                ) : (
                  "Xác nhận phê duyệt"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{resultDialogTitle || "Thông báo"}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {resultDialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setResultDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
