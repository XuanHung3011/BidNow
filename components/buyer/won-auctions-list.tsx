"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, MessageSquare, Loader2, AlertCircle, CreditCard, CheckCircle2, Clock, XCircle, Filter } from "lucide-react"
import Link from "next/link"
import { AuctionsAPI, type BuyerWonAuctionDto } from "@/lib/api/auctions"
import { RatingDialog } from "@/components/rating-dialog"
import { PaymentButton } from "@/components/payment-button"

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
  const [filterStatus, setFilterStatus] = useState<"all" | "unpaid" | "paid" | "completed">("all")

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

  // Refresh data when component becomes visible (e.g., after returning from payment)
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible' && bidderId && !isNaN(bidderId)) {
        loadWonAuctions()
      }
    }
    
    document.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  }, [bidderId])

  const loadWonAuctions = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading won auctions for bidderId:', bidderId, 'page:', page)
      const result = await AuctionsAPI.getBuyerWonAuctions(bidderId, page, pageSize)
      setAuctions(result.data)
      setTotalCount(result.totalCount)
      
      // Sync payment status for orders that might have been paid but webhook not called
      // Only sync if payment status is pending or unknown
      for (const auction of result.data) {
        if (auction.hasOrder && auction.orderId && 
            (!auction.hasPayment || auction.paymentStatus === 'pending')) {
          try {
            // Try to sync payment status in background (don't wait)
            const { PaymentsAPI } = await import('@/lib/api/payments')
            PaymentsAPI.syncPaymentStatus(auction.orderId).catch(err => {
              console.log('Background sync payment status failed (non-critical):', err)
            })
          } catch (err) {
            // Ignore errors in background sync
            console.log('Background sync payment status error (non-critical):', err)
          }
        }
      }
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

  const getPaymentStatusBadge = (auction: BuyerWonAuctionDto) => {
    if (!auction.hasOrder) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Chưa có đơn hàng
        </Badge>
      )
    }

    // Check payment status first (most important)
    const paymentStatus = auction.paymentStatus?.toLowerCase() || ''
    
    // Priority: Check paid status first
    if (paymentStatus === 'paid_held' || paymentStatus === 'released_to_seller') {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Đã thanh toán
        </Badge>
      )
    }

    if (paymentStatus === 'refunded_to_buyer') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          <XCircle className="h-3 w-3 mr-1" />
          Đã hoàn tiền
        </Badge>
      )
    }

    // If has payment record but status is pending or unknown
    if (auction.hasPayment) {
      if (paymentStatus === 'pending') {
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Đang chờ thanh toán
          </Badge>
        )
      }
      // Other payment statuses
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
          <CreditCard className="h-3 w-3 mr-1" />
          {auction.paymentStatus || 'Chưa xác định'}
        </Badge>
      )
    }

    // No payment record yet
    return (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
        <CreditCard className="h-3 w-3 mr-1" />
        Chưa thanh toán
      </Badge>
    )
  }

  // Import utility functions for status display
  const getOrderStatusText = (orderStatus?: string) => {
    if (!orderStatus) return null
    
    const statusMap: Record<string, string> = {
      'awaiting_payment': 'Chờ thanh toán',
      'awaiting_shipment': 'Chờ vận chuyển',
      'shipped': 'Đã gửi hàng',
      'dispute': 'Đang khiếu nại',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    }
    
    return statusMap[orderStatus.toLowerCase()] || orderStatus
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

  // Kiểm tra xem có thể hiển thị nút thanh toán không (trong vòng 24 giờ từ khi thắng)
  const canShowPaymentButton = (auction: BuyerWonAuctionDto): boolean => {
    if (!auction.wonDate) return false
    
    const wonDate = new Date(auction.wonDate)
    const now = new Date()
    const hoursSinceWon = (now.getTime() - wonDate.getTime()) / (1000 * 60 * 60)
    
    // Chỉ hiển thị nếu chưa quá 24 giờ
    return hoursSinceWon <= 24
  }

  // Sắp xếp và lọc auctions
  const filteredAndSortedAuctions = useMemo(() => {
    let filtered = [...auctions]
    
    // Lọc theo trạng thái
    if (filterStatus === "unpaid") {
      // Chưa thanh toán: chưa có payment hoặc payment status không phải paid_held/released_to_seller
      filtered = filtered.filter(a => 
        !a.hasPayment || 
        (a.paymentStatus !== 'paid_held' && a.paymentStatus !== 'released_to_seller')
      )
    } else if (filterStatus === "paid") {
      // Đã thanh toán nhưng chưa hoàn thành: có payment nhưng order chưa completed
      filtered = filtered.filter(a => 
        a.hasPayment && 
        (a.paymentStatus === 'paid_held' || a.paymentStatus === 'released_to_seller') &&
        a.orderStatus !== 'completed'
      )
    } else if (filterStatus === "completed") {
      // Đã hoàn thành: order status = completed
      filtered = filtered.filter(a => a.orderStatus === 'completed')
    }
    // "all" không filter gì cả
    
    // Sắp xếp: chưa thanh toán lên đầu, sau đó mới đến đã thanh toán, cuối cùng là đã hoàn thành
    filtered.sort((a, b) => {
      const aUnpaid = !a.hasPayment || (a.paymentStatus !== 'paid_held' && a.paymentStatus !== 'released_to_seller')
      const bUnpaid = !b.hasPayment || (b.paymentStatus !== 'paid_held' && b.paymentStatus !== 'released_to_seller')
      const aCompleted = a.orderStatus === 'completed'
      const bCompleted = b.orderStatus === 'completed'
      
      // Ưu tiên: chưa thanh toán > đã thanh toán > đã hoàn thành
      if (aUnpaid && !bUnpaid && !bCompleted) return -1
      if (!aUnpaid && !aCompleted && bUnpaid) return 1
      if (aCompleted && !bCompleted) return 1
      if (!aCompleted && bCompleted) return -1
      
      // Nếu cùng trạng thái, sắp xếp theo ngày thắng (mới nhất trước)
      const aDate = new Date(a.wonDate).getTime()
      const bDate = new Date(b.wonDate).getTime()
      return bDate - aDate
    })
    
    return filtered
  }, [auctions, filterStatus])

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Tổng cộng: <span className="font-semibold">{totalCount}</span> phiên đã thắng
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
              variant={filterStatus === "unpaid" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("unpaid")}
            >
              Chưa thanh toán
            </Button>
            <Button
              variant={filterStatus === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("paid")}
            >
              Đã thanh toán
            </Button>
            <Button
              variant={filterStatus === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("completed")}
            >
              Đã hoàn thành
            </Button>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadWonAuctions}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải...
            </>
          ) : (
            'Làm mới'
          )}
        </Button>
      </div>

      {filteredAndSortedAuctions.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">
              {filterStatus === "unpaid" 
                ? "Không có phiên nào chưa thanh toán"
                : filterStatus === "paid"
                ? "Không có phiên nào đã thanh toán"
                : filterStatus === "completed"
                ? "Không có phiên nào đã hoàn thành"
                : "Không có phiên đấu giá nào"}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {filteredAndSortedAuctions.map((auction) => (
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
                  {getPaymentStatusBadge(auction)}
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
                  {auction.orderStatus && (
                    <span className="text-muted-foreground">
                      Trạng thái đơn: <span className="font-semibold text-foreground">{getOrderStatusText(auction.orderStatus)}</span>
                    </span>
                  )}
                  {auction.paidAt && (
                    <span className="text-muted-foreground">
                      Đã thanh toán: <span className="font-semibold text-green-600">{formatDate(auction.paidAt)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                {/* Chỉ hiển thị nút thanh toán nếu:
                    1. Chưa có order hoặc đang chờ thanh toán
                    2. Và chưa quá 24 giờ từ khi thắng */}
                {(!auction.hasOrder || (!auction.hasPayment && auction.orderStatus === 'awaiting_payment')) && 
                 canShowPaymentButton(auction) ? (
                  <PaymentButton auctionId={auction.auctionId} />
                ) : null}
                
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
          </div>
        </Card>
          ))}
        </>
      )}

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