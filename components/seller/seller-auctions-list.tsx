"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Edit, Trash2, Eye, Star, Loader2, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { RatingDialog } from "@/components/rating-dialog"
import { ItemsAPI } from "@/lib/api/items"
import { AuctionsAPI, SellerAuctionDto, AuctionDetailDto } from "@/lib/api/auctions"
import { RatingsAPI } from "@/lib/api/ratings"
import { ItemResponseDto } from "@/lib/api/types"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getImageUrls, getImageUrl } from "@/lib/api/config"

interface SellerAuctionsListProps {
  status: "active" | "scheduled" | "completed" | "draft" | "pending"
  onSelectDraftItem?: (item: ItemResponseDto) => void
  onItemDeleted?: () => void
  refreshTrigger?: number
}

export function SellerAuctionsList({ status, onSelectDraftItem, onItemDeleted, refreshTrigger }: SellerAuctionsListProps) {
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
    winnerId?: number
  } | null>(null)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [draftItems, setDraftItems] = useState<ItemResponseDto[]>([])
  const [draftLoading, setDraftLoading] = useState(false)
  const [pendingItems, setPendingItems] = useState<ItemResponseDto[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  
  // Auction detail dialog state
  const [auctionDetailDialogOpen, setAuctionDetailDialogOpen] = useState(false)
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null)
  const [auctionDetail, setAuctionDetail] = useState<AuctionDetailDto | null>(null)
  const [loadingAuctionDetail, setLoadingAuctionDetail] = useState(false)
  const [filterSort, setFilterSort] = useState<"newest" | "oldest" | "price-high" | "price-low" | "bids-high" | "bids-low">("newest")

  // Load draft items when status is "draft"
  useEffect(() => {
    if (status === "draft" && user) {
      loadDraftItems()
    }
  }, [status, user, refreshTrigger])

  // Load pending items when status is "pending"
  useEffect(() => {
    if (status === "pending" && user) {
      loadPendingItems()
    }
  }, [status, user, refreshTrigger])

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

  const loadPendingItems = async () => {
    if (!user) return
    try {
      setPendingLoading(true)
      const sellerId = parseInt(user.id)
      const result = await ItemsAPI.getAllWithFilter({
        statuses: ["pending"],
        sellerId: sellerId,
        page: 1,
        pageSize: 100,
        sortBy: "CreatedAt",
        sortOrder: "desc"
      })
      setPendingItems(result.data || [])
    } catch (error) {
      console.error("Error loading pending items:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm đang chờ duyệt",
        variant: "destructive"
      })
    } finally {
      setPendingLoading(false)
    }
  }

  const handleSelectDraft = (item: ItemResponseDto) => {
    if (onSelectDraftItem) {
      onSelectDraftItem(item)
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      return
    }

    try {
      await ItemsAPI.deleteItem(itemId)
      toast({
        title: "Thành công",
        description: "Đã xóa sản phẩm thành công",
      })
      // Reload the list
      if (status === "draft") {
        loadDraftItems()
      } else if (status === "pending") {
        loadPendingItems()
      }
      // Trigger parent refresh
      if (onItemDeleted) {
        onItemDeleted()
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa sản phẩm",
        variant: "destructive"
      })
    }
  }

  // Load auctions for non-draft and non-pending statuses
  useEffect(() => {
    if (status === "draft" || status === "pending" || !user?.id) return

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
        // 2. Paused: status = "paused"
        else if (a.status?.toLowerCase() === "paused") {
          actualStatus = "paused"
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
      .sort((a, b) => {
        // Sắp xếp theo filterSort
        switch (filterSort) {
          case "newest":
            return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          case "oldest":
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          case "price-high":
            return (b.currentBid || b.startingBid) - (a.currentBid || a.startingBid)
          case "price-low":
            return (a.currentBid || a.startingBid) - (b.currentBid || b.startingBid)
          case "bids-high":
            return (b.bidCount || 0) - (a.bidCount || 0)
          case "bids-low":
            return (a.bidCount || 0) - (b.bidCount || 0)
          default:
            return 0
        }
      })
  }, [auctions, status, refreshKey, filterSort]) // Include filterSort in dependencies

  // Auto-refresh every 10 seconds to update status in real-time
  useEffect(() => {
    if (!user?.id) return
    
    const interval = setInterval(() => {
      // Update refreshKey to trigger useMemo recalculation
      setRefreshKey(prev => prev + 1)
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [user?.id])

  const handleRateClick = async (auction: SellerAuctionDto) => {
    if (!user) return
    
    try {
      // Fetch auction detail to verify seller is owner and buyer is winner
      const sellerId = parseInt(user.id)
      const auctionDetail = await AuctionsAPI.getDetail(auction.id, sellerId)
      
      // Validate: Seller must be owner of auction
      if (auctionDetail.sellerId !== sellerId) {
        toast({
          title: "Lỗi",
          description: "Bạn chỉ có thể đánh giá người mua của phiên đấu giá do bạn tạo",
          variant: "destructive"
        })
        return
      }
      
      // Validate: Only rate winner
      if (!auctionDetail.winnerId) {
        toast({
          title: "Lỗi",
          description: "Chỉ có thể đánh giá người thắng phiên đấu giá",
          variant: "destructive"
        })
        return
      }
      
      setRatingDialog({
        open: true,
        auctionId: auction.id,
        auctionTitle: auction.itemTitle,
        buyerName: auction.winnerName || "Người mua",
        winnerId: auction.winnerId,
      })
    } catch (error: any) {
      console.error("Error fetching auction detail:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin phiên đấu giá",
        variant: "destructive"
      })
    }
  }

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!ratingDialog || !user || !ratingDialog.winnerId) {
      toast({
        title: "Lỗi",
        description: "Thông tin không đầy đủ để đánh giá",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmittingRating(true)
      const sellerId = parseInt(user.id)
      
      // Validate: Seller must be owner and buyer must be winner
      const auctionDetail = await AuctionsAPI.getDetail(ratingDialog.auctionId, sellerId)
      
      // Validate seller is owner
      if (auctionDetail.sellerId !== sellerId) {
        toast({
          title: "Lỗi",
          description: "Bạn chỉ có thể đánh giá người mua của phiên đấu giá do bạn tạo",
          variant: "destructive"
        })
        return
      }
      
      // Validate buyer is winner
      if (!auctionDetail.winnerId || auctionDetail.winnerId !== ratingDialog.winnerId) {
        toast({
          title: "Lỗi",
          description: "Chỉ có thể đánh giá người thắng phiên đấu giá",
          variant: "destructive"
        })
        return
      }
      
      await RatingsAPI.create({
        auctionId: ratingDialog.auctionId,
        raterId: sellerId,
        ratedId: ratingDialog.winnerId,
        rating: rating,
        comment: comment || undefined,
      })

      toast({
        title: "Thành công",
        description: "Đã gửi đánh giá thành công",
      })

      // Refresh auctions list to update hasRated status
      if (status === "completed") {
        const sellerId = parseInt(user.id)
        const data = await AuctionsAPI.getBySeller(sellerId)
        setAuctions(data)
      }

      setRatingDialog(null)
    } catch (error: any) {
      console.error("Error submitting rating:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi đánh giá",
        variant: "destructive"
      })
    } finally {
      setSubmittingRating(false)
    }
  }

  const handleViewAuction = async (auctionId: number) => {
    setSelectedAuctionId(auctionId)
    setAuctionDetailDialogOpen(true)
    setLoadingAuctionDetail(true)
    setAuctionDetail(null)
    
    try {
      const detail = await AuctionsAPI.getDetail(auctionId)
      setAuctionDetail(detail)
    } catch (error: any) {
      console.error("Error fetching auction detail:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin chi tiết phiên đấu giá",
        variant: "destructive"
      })
    } finally {
      setLoadingAuctionDetail(false)
    }
  }

  const getStatusLabel = (displayStatus: string) => {
    const labels: Record<string, string> = {
      active: "Đang diễn ra",
      scheduled: "Sắp diễn ra",
      completed: "Đã kết thúc",
      draft: "Bản nháp",
      paused: "Đã tạm dừng",
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

  // For pending status, show pending items
  if (status === "pending") {
    if (pendingLoading) {
      return (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </Card>
      )
    }

    if (pendingItems.length === 0) {
      return (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Không có sản phẩm nào đang chờ duyệt</p>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {pendingItems.map((item) => {
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
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">Đang chờ duyệt</Badge>
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
                          Gửi lúc: <span className="font-semibold text-foreground">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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
                      Chỉnh sửa
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa
                  </Button>
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
        {/* Filter/Sort controls - Only show for active, scheduled, completed */}
        {status !== "draft" && status !== "pending" && filteredAuctions.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <p className="text-sm text-muted-foreground">
              Tổng cộng: <span className="font-semibold">{filteredAuctions.length}</span> phiên đấu giá
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={filterSort === "newest" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterSort("newest")}
              >
                Mới nhất
              </Button>
              <Button
                variant={filterSort === "oldest" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterSort("oldest")}
              >
                Cũ nhất
              </Button>
              <Button
                variant={filterSort === "price-high" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterSort("price-high")}
              >
                Giá cao
              </Button>
              <Button
                variant={filterSort === "price-low" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterSort("price-low")}
              >
                Giá thấp
              </Button>
              <Button
                variant={filterSort === "bids-high" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterSort("bids-high")}
              >
                Nhiều lượt
              </Button>
              <Button
                variant={filterSort === "bids-low" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterSort("bids-low")}
              >
                Ít lượt
              </Button>
            </div>
          </div>
        )}

        {filteredAuctions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Không có phiên đấu giá nào trong danh mục này</p>
          </Card>
        ) : (
          <>
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
                        {status === "active" || status === "scheduled" ? formatDate(auction.startTime) : formatDate(auction.endTime)}
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewAuction(auction.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Xem
                </Button>
                {/* <DropdownMenu>
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
                </DropdownMenu> */}
              </div>
            </div>
          </Card>
            ))}
          </>
        )}
      </div>

      {ratingDialog && user && (
        <RatingDialog
          open={ratingDialog.open}
          onOpenChange={(open) => setRatingDialog(open ? ratingDialog : null)}
          targetName={ratingDialog.buyerName}
          targetType="buyer"
          auctionTitle={ratingDialog.auctionTitle}
          auctionId={ratingDialog.auctionId}
          raterId={parseInt(user.id)}
          ratedId={ratingDialog.winnerId || 0}
          onSubmit={handleRatingSubmit}
          submitting={submittingRating}
        />
      )}

      {/* Auction Detail Dialog */}
      <Dialog open={auctionDetailDialogOpen} onOpenChange={setAuctionDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết phiên đấu giá</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về phiên đấu giá
            </DialogDescription>
          </DialogHeader>

          {loadingAuctionDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : auctionDetail ? (
            <div className="space-y-6">
              {/* Basic Information Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Thông tin cơ bản</h3>
                <div className="rounded-lg border border-border bg-card">
                  <table className="w-full">
                    <tbody className="divide-y divide-border">
                      {/* <tr>
                        <td className="px-4 py-3 text-sm font-medium text-muted-foreground w-1/3">ID phiên đấu giá</td>
                        <td className="px-4 py-3 text-sm text-foreground">{auctionDetail.id}</td>
                      </tr> */}
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-muted-foreground">Tên sản phẩm</td>
                        <td className="px-4 py-3 text-sm text-foreground font-semibold">{auctionDetail.itemTitle}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-muted-foreground">Danh mục</td>
                        <td className="px-4 py-3 text-sm text-foreground">{auctionDetail.categoryName || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-muted-foreground">Trạng thái</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={
                            auctionDetail.status?.toLowerCase() === "active" ? "default" :
                            auctionDetail.status?.toLowerCase() === "completed" ? "secondary" :
                            auctionDetail.status?.toLowerCase() === "paused" ? "destructive" :
                            "outline"
                          }>
                            {auctionDetail.status || "N/A"}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price Information Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Thông tin giá</h3>
                <div className="rounded-lg border border-border bg-card">
                  <table className="w-full">
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-muted-foreground w-1/3">Giá khởi điểm</td>
                        <td className="px-4 py-3 text-sm text-foreground font-semibold">
                          {formatCurrency(auctionDetail.startingBid)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-muted-foreground">Giá hiện tại</td>
                        <td className="px-4 py-3 text-sm text-foreground font-semibold text-primary">
                          {auctionDetail.currentBid ? formatCurrency(auctionDetail.currentBid) : formatCurrency(auctionDetail.startingBid)}
                        </td>
                      </tr>
                      {auctionDetail.buyNowPrice && (
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-muted-foreground">Giá mua ngay</td>
                          <td className="px-4 py-3 text-sm text-foreground font-semibold">
                            {formatCurrency(auctionDetail.buyNowPrice)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-muted-foreground">Số lượt đấu giá</td>
                        <td className="px-4 py-3 text-sm text-foreground">{auctionDetail.bidCount || 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Time Information Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Thông tin thời gian</h3>
                <div className="rounded-lg border border-border bg-card">
                  <table className="w-full">
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-muted-foreground w-1/3">Thời gian bắt đầu</td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {new Date(auctionDetail.startTime).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-muted-foreground">Thời gian kết thúc</td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {new Date(auctionDetail.endTime).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                      {auctionDetail.pausedAt && (
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-muted-foreground">Thời gian tạm dừng</td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {new Date(auctionDetail.pausedAt).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Winner Information (if completed) */}
              {auctionDetail.status?.toLowerCase() === "completed" && auctionDetail.winnerName && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Thông tin người thắng</h3>
                  <div className="rounded-lg border border-border bg-card">
                    <table className="w-full">
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-muted-foreground w-1/3">Người thắng</td>
                          <td className="px-4 py-3 text-sm text-foreground font-semibold">{auctionDetail.winnerName}</td>
                        </tr>
                        {auctionDetail.winnerId && (
                          <tr>
                            <td className="px-4 py-3 text-sm font-medium text-muted-foreground">ID người thắng</td>
                            <td className="px-4 py-3 text-sm text-foreground">{auctionDetail.winnerId}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Item Description */}
              {auctionDetail.itemDescription && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Mô tả từ người bán</h3>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{auctionDetail.itemDescription}</p>
                  </div>
                </div>
              )}

              {/* Item Specifics */}
              {auctionDetail.itemSpecifics && (() => {
                try {
                  const parsed = JSON.parse(auctionDetail.itemSpecifics)
                  if (typeof parsed === 'object' && parsed !== null) {
                    const entries = Object.entries(parsed)
                    if (entries.length > 0) {
                      return (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-foreground">Đặc tính thông số sản phẩm</h3>
                          <div className="rounded-lg border border-border bg-card">
                            <table className="w-full">
                              <tbody className="divide-y divide-border">
                                {entries.map(([key, value], index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-3 text-sm font-medium text-muted-foreground w-1/3">{key}</td>
                                    <td className="px-4 py-3 text-sm text-foreground">{String(value)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    }
                  }
                } catch {
                  // Fallback to plain text if not valid JSON
                  return (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-foreground">Đặc tính thông số sản phẩm</h3>
                      <div className="rounded-lg border border-border bg-card p-4">
                        <pre className="whitespace-pre-wrap text-sm text-foreground font-normal">
                          {auctionDetail.itemSpecifics}
                        </pre>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {/* Item Images */}
              {auctionDetail.itemImages && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Hình ảnh sản phẩm</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getImageUrls(auctionDetail.itemImages).map((imgUrl, idx) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt={`${auctionDetail.itemTitle} - ${idx + 1}`}
                        className="aspect-square rounded-lg object-cover w-full border border-border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Không thể tải thông tin chi tiết</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
