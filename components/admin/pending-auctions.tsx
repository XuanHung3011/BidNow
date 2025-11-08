"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Eye, Loader2 } from "lucide-react"
import { ItemsAPI } from "@/lib/api/items"
import { ItemResponseDto } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"

export function PendingAuctions() {
  const { toast } = useToast()
  const [items, setItems] = useState<ItemResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchPendingItems()
  }, [])

  const fetchPendingItems = async () => {
    try {
      setLoading(true)
      const result = await ItemsAPI.getAllWithFilter({
        statuses: ["pending"],
        sortBy: "CreatedAt",
        sortOrder: "desc",
        page: 1,
        pageSize: 100,
      })
      setItems(result.data || [])
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

  const handleApprove = async (itemId: number) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(itemId))
      await ItemsAPI.approveItem(itemId)
      toast({
        title: "Thành công",
        description: "Đã phê duyệt sản phẩm",
      })
      // Remove item from list
      setItems((prev) => prev.filter((item) => Number(item.id) !== itemId))
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
      // Remove item from list
      setItems((prev) => prev.filter((item) => Number(item.id) !== itemId))
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Không có sản phẩm nào đang chờ duyệt</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
    </div>
  )
}
