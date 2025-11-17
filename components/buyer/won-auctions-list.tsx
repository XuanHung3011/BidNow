"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, MessageSquare, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { AuctionsAPI, type BuyerWonAuctionDto } from "@/lib/api/auctions"
import { RatingDialog } from "@/components/rating-dialog"

interface WonAuctionsListProps {
  bidderId: number
}

export function WonAuctionsList({ bidderId }: WonAuctionsListProps) {
  const [auctions, setAuctions] = useState<BuyerWonAuctionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  const [ratingDialog, setRatingDialog] = useState<{
    open: boolean
    auctionId: number
    auctionTitle: string
    sellerName: string
  } | null>(null)

  useEffect(() => {
    if (bidderId && !isNaN(bidderId)) {
      loadWonAuctions()
    } else {
      setError('ID người dùng không hợp lệ')
      setLoading(false)
    }
  }, [bidderId, page])

  const loadWonAuctions = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading won auctions for bidderId:', bidderId, 'page:', page)
      const result = await AuctionsAPI.getBuyerWonAuctions(bidderId, page, pageSize)
      setAuctions(result.data)
      setTotalCount(result.totalCount)
    } catch (err) {
      console.error('Error loading won auctions:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách đấu giá đã thắng')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getFirstImage = (images?: string) => {
    if (!images) return "/placeholder.svg"
    try {
      const imageArray = JSON.parse(images)
      return Array.isArray(imageArray) && imageArray.length > 0 
        ? imageArray[0] 
        : "/placeholder.svg"
    } catch {
      return images || "/placeholder.svg"
    }
  }

  const handleRateClick = (auction: BuyerWonAuctionDto) => {
    setRatingDialog({
      open: true,
      auctionId: auction.auctionId,
      auctionTitle: auction.itemTitle,
      sellerName: auction.sellerName || 'Người bán',
    })
  }

  const handleRatingSubmit = async (rating: number, comment: string) => {
    console.log('Rating submitted:', { 
      rating, 
      comment, 
      auctionId: ratingDialog?.auctionId 
    })
    // TODO: Call API to save rating
    // After successful rating, reload the list
    await loadWonAuctions()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          <AlertCircle className="mx-auto h-12 w-12 mb-4" />
          <p>{error}</p>
          <Button onClick={loadWonAuctions} className="mt-4">
            Thử lại
          </Button>
        </div>
      </Card>
    )
  }

  if (auctions.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">Bạn chưa thắng đấu giá nào</p>
          <p className="text-sm">Tiếp tục tham gia đấu giá để có cơ hội chiến thắng!</p>
          <Link href="/">
            <Button className="mt-4">
              Khám phá đấu giá
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Tổng cộng: <span className="font-semibold">{totalCount}</span> phiên đã thắng
        </p>
      </div>

      {auctions.map((auction) => (
        <Card key={auction.auctionId} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <img
                src={getFirstImage(auction.itemImages)}
                alt={auction.itemTitle}
                className="h-20 w-20 rounded-lg object-cover border"
              />
              <div className="flex-1">
                <div className="flex items-start gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{auction.itemTitle}</h3>
                  <Badge className="bg-green-500 hover:bg-green-600 text-white">
                    Đã thắng
                  </Badge>
                  {auction.categoryName && (
                    <Badge variant="outline" className="text-xs">
                      {auction.categoryName}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Giá thắng: <span className="font-semibold text-green-600">{formatCurrency(auction.finalBid)}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Người bán: <span className="font-semibold text-foreground">{auction.sellerName || 'N/A'}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Ngày thắng: <span className="font-semibold text-foreground">{formatDate(auction.wonDate)}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!auction.hasRated ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 bg-transparent"
                  onClick={() => handleRateClick(auction)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Đánh giá
                </Button>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  Đã đánh giá
                </Badge>
              )}
              
              <Link href={`/auction/${auction.auctionId}`}>
                <Button variant="outline" size="sm">
                  Xem chi tiết
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Rating Dialog */}
      {ratingDialog && (
        <RatingDialog
          open={ratingDialog.open}
          onOpenChange={(open) => setRatingDialog(open ? ratingDialog : null)}
          targetName={ratingDialog.sellerName}
          targetType="seller"
          auctionTitle={ratingDialog.auctionTitle}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  )
}