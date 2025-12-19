"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, AlertCircle, Loader2, Filter } from "lucide-react"
import Link from "next/link"
import { AuctionsAPI, type BuyerActiveBidDto } from "@/lib/api/auctions"
import { getImageUrl } from "@/lib/api/config"

interface ActiveBidsListProps {
  bidderId: number
}

export function ActiveBidsList({ bidderId }: ActiveBidsListProps) {
  const [bids, setBids] = useState<BuyerActiveBidDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10
  const [filterStatus, setFilterStatus] = useState<"all" | "leading" | "outbid">("all")

  useEffect(() => {
    // Only load if bidderId is valid
    if (bidderId && !isNaN(bidderId)) {
      loadActiveBids()
    } else {
      setError('ID người dùng không hợp lệ')
      setLoading(false)
    }
  }, [bidderId, page])

  const loadActiveBids = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading active bids for bidderId:', bidderId, 'page:', page) // Debug log
      const result = await AuctionsAPI.getBuyerActiveBids(bidderId, page, pageSize)
      setBids(result.data)
      setTotalCount(result.totalCount)
    } catch (err) {
      console.error('Error loading active bids:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách đấu giá')
    } finally {
      setLoading(false)
    }
  }

  // ... rest of the component remains the same
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return "Đã kết thúc"
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} ngày ${hours % 24} giờ`
    }
    
    return `${hours} giờ ${minutes} phút`
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

  // Filter và sắp xếp bids
  const filteredBids = useMemo(() => {
    let filtered = [...bids]
    
    if (filterStatus === "leading") {
      filtered = filtered.filter(b => b.isLeading)
    } else if (filterStatus === "outbid") {
      filtered = filtered.filter(b => !b.isLeading)
    }
    
    // Sắp xếp: đang dẫn đầu lên đầu, sau đó bị vượt giá
    filtered.sort((a, b) => {
      if (a.isLeading && !b.isLeading) return -1
      if (!a.isLeading && b.isLeading) return 1
      return 0
    })
    
    return filtered
  }, [bids, filterStatus])

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
          <Button onClick={loadActiveBids} className="mt-4">
            Thử lại
          </Button>
        </div>
      </Card>
    )
  }

  if (bids.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">Bạn chưa tham gia đấu giá nào</p>
          <p className="text-sm">Hãy bắt đầu đấu giá để xem danh sách ở đây</p>
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
            Tổng cộng: <span className="font-semibold">{totalCount}</span> phiên đấu giá
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
              variant={filterStatus === "leading" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("leading")}
            >
              Đang dẫn đầu
            </Button>
            <Button
              variant={filterStatus === "outbid" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("outbid")}
            >
              Bị vượt giá
            </Button>
          </div>
        </div>
      </div>

      {filteredBids.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">
              {filterStatus === "leading" 
                ? "Không có phiên nào đang dẫn đầu"
                : filterStatus === "outbid"
                ? "Không có phiên nào bị vượt giá"
                : "Không có phiên đấu giá nào"}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {filteredBids.map((bid) => (
        <Card key={bid.auctionId} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <img
                src={getFirstImage(bid.itemImages)}
                alt={bid.itemTitle}
                className="h-20 w-20 rounded-lg object-cover border"
              />
              <div className="flex-1">
                <div className="flex items-start gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{bid.itemTitle}</h3>
                  {bid.isLeading ? (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Đang dẫn đầu
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Bị vượt giá
                    </Badge>
                  )}
                  {bid.categoryName && (
                    <Badge variant="outline" className="text-xs">
                      {bid.categoryName}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Giá hiện tại: <span className="font-semibold text-foreground">{formatCurrency(bid.currentBid)}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Giá của bạn: <span className={`font-semibold ${bid.isLeading ? 'text-green-600' : 'text-orange-600'}`}>
                      {formatCurrency(bid.yourHighestBid)}
                    </span>
                  </span>
                  <span className="flex items-center text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {getTimeRemaining(bid.endTime)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Tổng số lượt: {bid.totalBids} | Lượt của bạn: {bid.yourBidCount}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/*
              <Link href={`/auction/${bid.auctionId}`}>
                <Button variant="outline" size="sm">
                  Xem chi tiết
                </Button>
              </Link>
              */}
              {!bid.isLeading && (
                <Link href={`/auction/${bid.auctionId}`}>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Đấu giá ngay
                  </Button>
                </Link>
              )}
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
    </div>
  )
}