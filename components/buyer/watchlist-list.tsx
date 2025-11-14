"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, X, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { WatchlistAPI, type WatchlistItemDto } from "@/lib/api/watchlist"
import { useAuth } from "@/lib/auth-context"

export function WatchlistList() {
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState<WatchlistItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    if (user) {
      loadWatchlist()
    } else {
      setLoading(false)
      setError('Vui lòng đăng nhập')
    }
  }, [user?.id])

  const loadWatchlist = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const userId = parseInt(user.id)
      console.log('Loading watchlist for userId:', userId)
      const items = await WatchlistAPI.getByUser(userId)
      setWatchlist(items)
    } catch (err) {
      console.error('Error loading watchlist:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách theo dõi')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (auctionId: number) => {
    if (!user) return

    try {
      setRemovingId(auctionId)
      const userId = parseInt(user.id)
      await WatchlistAPI.remove({ userId, auctionId })
      
      // Remove from local state
      setWatchlist(prev => prev.filter(item => item.auctionId !== auctionId))
    } catch (err) {
      console.error('Error removing from watchlist:', err)
      alert('Không thể xóa khỏi danh sách theo dõi')
    } finally {
      setRemovingId(null)
    }
  }

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
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return `${days} ngày ${hours} giờ`
    }
    
    return `${hours} giờ ${minutes} phút`
  }

  const getAuctionStatus = (status: string, endTime: string) => {
    const now = new Date()
    const end = new Date(endTime)
    
    if (status === "completed" || end < now) {
      return { label: "Đã kết thúc", variant: "secondary" as const }
    }
    
    if (status === "active") {
      return { label: "Đang diễn ra", variant: "default" as const }
    }
    
    return { label: "Sắp diễn ra", variant: "outline" as const }
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
          <Button onClick={loadWatchlist} className="mt-4">
            Thử lại
          </Button>
        </div>
      </Card>
    )
  }

  if (watchlist.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">Danh sách theo dõi trống</p>
          <p className="text-sm">Thêm các phiên đấu giá vào danh sách để theo dõi dễ dàng hơn</p>
          <Link href="/">
            <Button className="mt-4">
              Khám phá đấu giá
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Tổng cộng: <span className="font-semibold">{watchlist.length}</span> phiên đang theo dõi
        </p>
      </div>

      {watchlist.map((item) => {
        const status = getAuctionStatus(item.status, item.endTime)
        const isActive = status.label === "Đang diễn ra"
        const isEnded = status.label === "Đã kết thúc"

        return (
          <Card key={item.watchlistId} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <img
                  src={getFirstImage(item.itemImages)}
                  alt={item.itemTitle}
                  className="h-20 w-20 rounded-lg object-cover border"
                />
                <div className="flex-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{item.itemTitle}</h3>
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                    {item.categoryName && (
                      <Badge variant="outline" className="text-xs">
                        {item.categoryName}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {isActive ? "Giá hiện tại:" : "Giá khởi điểm:"}{" "}
                      <span className="font-semibold text-foreground">
                        {item.currentBid 
                          ? formatCurrency(item.currentBid) 
                          : formatCurrency(item.startingBid)}
                      </span>
                    </span>
                    {isActive && item.bidCount !== undefined && (
                      <span className="text-muted-foreground">
                        Số lượt đấu: <span className="font-semibold text-foreground">{item.bidCount}</span>
                      </span>
                    )}
                    <span className="flex items-center text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {getTimeRemaining(item.endTime)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/auction/${item.auctionId}`}>
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                </Link>
                {isActive && (
                  <Link href={`/auction/${item.auctionId}`}>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      Đấu giá ngay
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemove(item.auctionId)}
                  disabled={removingId === item.auctionId}
                >
                  {removingId === item.auctionId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}