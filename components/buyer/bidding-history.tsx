// app/(platform)/buyer/bidding-history.tsx
"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Trophy, X, Loader2 } from "lucide-react"
import { AuctionsAPI, type BiddingHistoryDto } from "@/lib/api/auctions"
import { useAuth } from "@/lib/auth-context"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import Link from "next/link"

export function BiddingHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState<BiddingHistoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

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
      return Array.isArray(imageArray) && imageArray.length > 0 
        ? imageArray[0] 
        : "/placeholder.svg"
    } catch {
      return "/placeholder.svg"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Bạn chưa có lịch sử đấu giá nào</p>
      </Card>
    )
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-4">
      {history.map((item) => {
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
    </div>
  )
}