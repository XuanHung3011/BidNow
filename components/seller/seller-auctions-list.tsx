"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Edit, Trash2, Eye, Star } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { RatingDialog } from "@/components/rating-dialog"
import { ItemsAPI } from "@/lib/api/items"
import { AuctionsAPI, SellerAuctionDto } from "@/lib/api/auctions"
import { ItemResponseDto } from "@/lib/api/types"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getImageUrls, getImageUrl } from "@/lib/api/config"

interface SellerAuctionsListProps {
  status: "active" | "scheduled" | "completed" | "draft"
  onSelectDraftItem?: (item: ItemResponseDto) => void
}

export function SellerAuctionsList({ status, onSelectDraftItem }: SellerAuctionsListProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [auctions, setAuctions] = useState<SellerAuctionDto[]>([])
  const [auctionsLoading, setAuctionsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0) // Force re-render for real-time updates
  const [ratingDialog, setRatingDialog] = useState<{
    open: boolean
    auctionId: number
    auctionTitle: string
    buyerName: string
  } | null>(null)
  const [draftItems, setDraftItems] = useState<ItemResponseDto[]>([])
  const [draftLoading, setDraftLoading] = useState(false)

  // Load draft items when status is "draft"
  useEffect(() => {
    if (status === "draft" && user) {
      loadDraftItems()
    }
  }, [status, user])

  const loadDraftItems = async () => {
    if (!user) return
    try {
      setDraftLoading(true)
      const sellerId = parseInt(user.id)
      const result = await ItemsAPI.getAllWithFilter({
        statuses: ["draft"],
        sellerId: sellerId,
        page: 1,
        pageSize: 100,
        sortBy: "CreatedAt",
        sortOrder: "desc"
      })
      setDraftItems(result.data || [])
    } catch (error) {
      console.error("Error loading draft items:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bản nháp",
        variant: "destructive"
      })
    } finally {
      setDraftLoading(false)
    }
  }

  const handleSelectDraft = (item: ItemResponseDto) => {
    if (onSelectDraftItem) {
      onSelectDraftItem(item)
    }
  }

  // Load auctions for non-draft statuses
  useEffect(() => {
    if (status === "draft" || !user?.id) return

    async function fetchAuctions() {
      if (!user?.id) return
      try {
        setAuctionsLoading(true)
        setError(null)
        const sellerId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id
        if (isNaN(sellerId)) return
        const data = await AuctionsAPI.getBySeller(sellerId)
        setAuctions(data) // Store all auctions, filter will be done in useMemo
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải danh sách phiên đấu giá")
        console.error("Error fetching seller auctions:", err)
      } finally {
        setAuctionsLoading(false)
      }
    }

    fetchAuctions()
  }, [user, status])

  // Client-side filtering based on real-time clock
  const filteredAuctions = useMemo(() => {
    if (!auctions.length) return []
    
    const now = new Date()
    
    return auctions
      .map(a => {
        // Calculate actual status based on current time
        const startTime = new Date(a.startTime)
        const endTime = new Date(a.endTime)
        
        let actualStatus: string
        
        // 1. Draft: status = "draft"
        if (a.status?.toLowerCase() === "draft") {
          actualStatus = "draft"
        }
        // 2. Cancelled: status = "cancelled"
        else if (a.status?.toLowerCase() === "cancelled") {
          actualStatus = "cancelled"
        }
        // 3. Scheduled: Chưa đến giờ bắt đầu (StartTime > now)
        else if (startTime > now) {
          actualStatus = "scheduled"
        }
        // 4. Active: Đã bắt đầu và chưa kết thúc (StartTime <= now && EndTime > now)
        else if (startTime <= now && endTime > now) {
          actualStatus = "active"
        }
        // 5. Completed: Đã kết thúc (EndTime <= now)
        else if (endTime <= now) {
          actualStatus = "completed"
        }
        // Fallback
        else {
          actualStatus = a.displayStatus || a.status?.toLowerCase() || "unknown"
        }
        
        // Return auction with updated displayStatus
        return {
          ...a,
          displayStatus: actualStatus
        }
      })
      .filter(a => a.displayStatus === status)
  }, [auctions, status, refreshKey]) // Include refreshKey to trigger re-calculation

  // Auto-refresh every 10 seconds to update status in real-time
  useEffect(() => {
    if (!user?.id) return
    
    const interval = setInterval(() => {
      // Update refreshKey to trigger useMemo recalculation
      setRefreshKey(prev => prev + 1)
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [user?.id])

  const handleRateClick = (auction: SellerAuctionDto) => {
    setRatingDialog({
      open: true,
      auctionId: auction.id,
      auctionTitle: auction.itemTitle,
      buyerName: auction.winnerName || "Người mua",
    })
  }

  const handleRatingSubmit = (rating: number, comment: string) => {
    console.log("Seller rating submitted:", { rating, comment, auctionId: ratingDialog?.auctionId })
    // TODO: Implement API call to save rating
    setRatingDialog(null)
  }

  const getStatusLabel = (displayStatus: string) => {
    const labels: Record<string, string> = {
      active: "Đang diễn ra",
      scheduled: "Sắp diễn ra",
      completed: "Đã kết thúc",
      draft: "Bản nháp",
      cancelled: "Đã hủy",
    }
    return labels[displayStatus] || displayStatus
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (status === "active") {
      if (diffMins < 60) {
        return `${diffMins} phút`
      } else if (diffHours < 24) {
        return `${diffHours} giờ`
      } else {
        return `${diffDays} ngày`
      }
    } else if (status === "scheduled") {
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }
  }

  // For draft status, show draft items
  if (status === "draft") {
    if (draftLoading) {
      return (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </Card>
      )
    }

    if (draftItems.length === 0) {
      return (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Không có bản nháp nào</p>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {draftItems.map((item) => {
          const imageUrls = getImageUrls(item.images)
          const firstImage = imageUrls[0] || "/placeholder.svg"
          
          return (
            <Card key={item.id} className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-4">
                  <img
                    src={firstImage}
                    alt={item.title}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <Badge variant="secondary">Bản nháp</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.categoryName || "Chưa có danh mục"}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Giá khởi điểm:{" "}
                        <span className="font-semibold text-foreground">
                          {item.basePrice ? item.basePrice.toLocaleString('vi-VN') + ' VNĐ' : 'Chưa đặt'}
                        </span>
                      </span>
                      {item.createdAt && (
                        <span className="text-muted-foreground">
                          Tạo lúc: <span className="font-semibold text-foreground">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onSelectDraftItem && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleSelectDraft(item)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Tiếp tục chỉnh sửa
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  if (auctionsLoading) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-12 text-center">
        <p className="text-destructive">{error}</p>
      </Card>
    )
  }

  if (filteredAuctions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Không có phiên đấu giá nào trong danh mục này</p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {filteredAuctions.map((auction) => (
          <Card key={auction.id} className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <img
                  src={getImageUrl(auction.itemImages)}
                  alt={auction.itemTitle}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <h3 className="font-semibold text-foreground">{auction.itemTitle}</h3>
                    <Badge
                      variant={
                        auction.displayStatus === "active"
                          ? "default"
                          : auction.displayStatus === "completed"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {getStatusLabel(auction.displayStatus)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{auction.categoryName}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {status === "completed" ? "Giá bán:" : "Giá hiện tại:"}{" "}
                      <span className="font-semibold text-foreground">
                        {auction.currentBid ? formatCurrency(auction.currentBid) : formatCurrency(auction.startingBid)}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Số lượt đấu: <span className="font-semibold text-foreground">{auction.bidCount}</span>
                    </span>
                    {status === "completed" && auction.winnerName && (
                      <span className="text-muted-foreground">
                        Người mua: <span className="font-semibold text-foreground">{auction.winnerName}</span>
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {status === "active"
                        ? "Kết thúc:"
                        : status === "scheduled"
                        ? "Bắt đầu:"
                        : "Ngày bán:"}{" "}
                      <span className="font-semibold text-foreground">
                        {status === "active" || status === "scheduled" ? formatDate(auction.endTime) : formatDate(auction.endTime)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {status === "completed" && !auction.hasRated && auction.winnerId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 bg-transparent"
                    onClick={() => handleRateClick(auction)}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Đánh giá người mua
                  </Button>
                )}
                {status === "completed" && auction.hasRated && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    Đã đánh giá
                  </Badge>
                )}
                <Link href={`/auction/${auction.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Xem
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {ratingDialog && (
        <RatingDialog
          open={ratingDialog.open}
          onOpenChange={(open) => setRatingDialog(open ? ratingDialog : null)}
          targetName={ratingDialog.buyerName}
          targetType="buyer"
          auctionTitle={ratingDialog.auctionTitle}
          onSubmit={handleRatingSubmit}
        />
      )}
    </>
  )
}
