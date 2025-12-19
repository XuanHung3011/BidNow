// app/(platform)/buyer/bidding-history.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Trophy, X, Loader2, Star, Filter } from "lucide-react"
import { AuctionsAPI, type BiddingHistoryDto, AuctionDetailDto } from "@/lib/api/auctions"
import { getImageUrl } from "@/lib/api/config"
import { RatingsAPI } from "@/lib/api/ratings"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { RatingDialog } from "@/components/rating-dialog"
import Link from "next/link"

export function BiddingHistory() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [history, setHistory] = useState<BiddingHistoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10
  const [filterStatus, setFilterStatus] = useState<"all" | "won" | "lost">("all")
  
  // Rating dialog state
  const [ratingDialog, setRatingDialog] = useState<{
    open: boolean
    auctionId: number
    auctionTitle: string
    sellerName: string
    sellerId?: number
  } | null>(null)
  const [submittingRating, setSubmittingRating] = useState(false)

  useEffect(() => {
    if (!user) return
    loadHistory()
  }, [user, page])

  const loadHistory = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const result = await AuctionsAPI.getBiddingHistory(parseInt(user.id), page, pageSize)
      setHistory(result.data)
      setTotalCount(result.totalCount)
    } catch (error) {
      console.error("Failed to load bidding history:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "leading":
        return {
          variant: "default" as const,
          icon: <TrendingUp className="h-3 w-3" />,
          label: "Đang dẫn đầu",
        }
      case "won":
        return {
          variant: "default" as const,
          icon: <Trophy className="h-3 w-3" />,
          label: "Đã thắng",
        }
      case "outbid":
        return {
          variant: "destructive" as const,
          icon: <TrendingDown className="h-3 w-3" />,
          label: "Bị vượt giá",
        }
      case "lost":
        return {
          variant: "secondary" as const,
          icon: <X className="h-3 w-3" />,
          label: "Không thắng",
        }
      default:
        return {
          variant: "secondary" as const,
          icon: null,
          label: status,
        }
    }
  }

  const getFirstImage = (images?: string) => {
    if (!images) return "/placeholder.svg"
    try {
      const imageArray = JSON.parse(images)
      if (Array.isArray(imageArray) && imageArray.length > 0) {
        return getImageUrl(imageArray[0])
      }
      return "/placeholder.svg"
    } catch {
      return getImageUrl(images) || "/placeholder.svg"
    }
  }

  // Filter và sắp xếp history
  const filteredHistory = useMemo(() => {
    let filtered = [...history]
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(item => item.status === filterStatus)
    }
    
    // Sắp xếp theo thời gian đấu giá (mới nhất trước)
    filtered.sort((a, b) => {
      const aTime = new Date(a.bidTime).getTime()
      const bTime = new Date(b.bidTime).getTime()
      return bTime - aTime
    })
    
    return filtered
  }, [history, filterStatus])

  const handleRateClick = async (auctionId: number, itemTitle: string) => {
    if (!user) return
    
    try {
      // Fetch auction detail to get seller info and verify winner
      const buyerId = parseInt(user.id)
      const auctionDetail = await AuctionsAPI.getDetail(auctionId, buyerId)
      
      // Validate: Only winner can rate seller
      if (!auctionDetail.winnerId || auctionDetail.winnerId !== buyerId) {
        toast({
          title: "Lỗi",
          description: "Chỉ người thắng phiên đấu giá mới được đánh giá người bán",
          variant: "destructive"
        })
        return
      }
      
      setRatingDialog({
        open: true,
        auctionId: auctionId,
        auctionTitle: itemTitle,
        sellerName: auctionDetail.sellerName || "Người bán",
        sellerId: auctionDetail.sellerId,
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
    if (!ratingDialog || !user || !ratingDialog.sellerId) {
      toast({
        title: "Lỗi",
        description: "Thông tin không đầy đủ để đánh giá",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmittingRating(true)
      const buyerId = parseInt(user.id)
      
      // Validate: Only winner can rate seller - fetch auction detail to verify
      const auctionDetail = await AuctionsAPI.getDetail(ratingDialog.auctionId, buyerId)
      if (!auctionDetail.winnerId || auctionDetail.winnerId !== buyerId) {
        toast({
          title: "Lỗi",
          description: "Chỉ người thắng phiên đấu giá mới được đánh giá người bán",
          variant: "destructive"
        })
        return
      }
      
      await RatingsAPI.create({
        auctionId: ratingDialog.auctionId,
        raterId: buyerId,
        ratedId: ratingDialog.sellerId,
        rating: rating,
        comment: comment || undefined,
      })

      toast({
        title: "Thành công",
        description: "Đã gửi đánh giá thành công",
      })

      // Refresh history to update hasRated status
      await loadHistory()

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm text-muted-foreground">
          Tổng cộng: <span className="font-semibold">{totalCount}</span> lượt đấu giá
        </p>
        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            Tất cả
          </Button>
          <Button
            variant={filterStatus === "won" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("won")}
          >
            Đã thắng
          </Button>
          <Button
            variant={filterStatus === "lost" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("lost")}
          >
            Không thắng
          </Button>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {filterStatus === "all"
              ? "Bạn chưa có lịch sử đấu giá nào"
              : filterStatus === "won"
              ? "Không có lượt đấu giá nào đã thắng"
              : "Không có lượt đấu giá nào không thắng"}
          </p>
        </Card>
      ) : (
        <>
          {filteredHistory.map((item) => {
        const statusConfig = getStatusConfig(item.status)
        
        return (
          <Card key={item.bidId} className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <Link href={`/auctions/${item.auctionId}`}>
                  <img
                    src={getFirstImage(item.itemImages)}
                    alt={item.itemTitle}
                    className="h-20 w-20 rounded-lg object-cover hover:opacity-80 transition-opacity cursor-pointer"
                  />
                </Link>
                <div className="flex-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <Link href={`/auctions/${item.auctionId}`}>
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
                        {item.itemTitle}
                      </h3>
                    </Link>
                    <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                    {item.isAutoBid && (
                      <Badge variant="outline" className="text-xs">
                        Auto Bid
                      </Badge>
                    )}
                  </div>
                  {item.categoryName && (
                    <p className="text-sm text-muted-foreground mt-1">{item.categoryName}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Giá đặt: <span className="font-semibold text-foreground">{formatCurrency(item.yourBid)}</span>
                    </span>
                    {item.currentBid && item.status !== "won" && item.status !== "lost" && (
                      <span className="text-muted-foreground">
                        Giá hiện tại: <span className="font-semibold text-foreground">{formatCurrency(item.currentBid)}</span>
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      Thời gian: <span className="font-semibold text-foreground">{formatDateTime(item.bidTime)}</span>
                    </span>
                  </div>
                  {item.endTime && (item.status === "leading" || item.status === "outbid") && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Kết thúc: {formatDateTime(item.endTime)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.status === "won" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 bg-transparent"
                    onClick={() => handleRateClick(item.auctionId, item.itemTitle)}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Đánh giá người bán
                  </Button>
                )}
                <Link href={`/auction/${item.auctionId}`}>
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )
          })}
        </>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </Button>
          <div className="flex items-center gap-2 px-4">
            <span className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      {ratingDialog && user && (
        <RatingDialog
          open={ratingDialog.open}
          onOpenChange={(open) => setRatingDialog(open ? ratingDialog : null)}
          targetName={ratingDialog.sellerName}
          targetType="seller"
          auctionTitle={ratingDialog.auctionTitle}
          auctionId={ratingDialog.auctionId}
          raterId={parseInt(user.id)}
          ratedId={ratingDialog.sellerId || 0}
          onSubmit={handleRatingSubmit}
          submitting={submittingRating}
        />
      )}
    </div>
  )
}