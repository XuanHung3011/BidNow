"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Clock,
  TrendingUp,
  Users,
  Heart,
  Share2,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Star,
  Award,
  ShoppingBag,
  Loader2,
} from "lucide-react"
import { BidHistory } from "@/components/bid-history"
import { LiveChat } from "@/components/live-chat"
import { AutoBidDialog } from "@/components/auto-bid-dialog"
import { AuctionsAPI, type AuctionDetailDto } from "@/lib/api"

interface AuctionDetailProps {
  auctionId: string
}

export function AuctionDetail({ auctionId }: AuctionDetailProps) {
  const [timeLeft, setTimeLeft] = useState("")
  const [bidAmount, setBidAmount] = useState("")
  const [isWatching, setIsWatching] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  
  // State cho API data
  const [auction, setAuction] = useState<AuctionDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch auction detail
  useEffect(() => {
    let mounted = true
    
    const fetchAuction = async () => {
      try {
        setLoading(true)
        const data = await AuctionsAPI.getDetail(Number(auctionId))
        
        if (!mounted) return
        setAuction(data)
        setError(null)
      } catch (err: any) {
        if (!mounted) return
        console.error('Failed to fetch auction:', err)
        setError(err.message || 'Không thể tải thông tin đấu giá')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    
    fetchAuction()
    
    return () => { mounted = false }
  }, [auctionId])

  // Update countdown timer
  useEffect(() => {
    if (!auction) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = new Date(auction.endTime).getTime() - now

      if (distance < 0) {
        setTimeLeft("Đã kết thúc")
        return
      }

      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [auction])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error || !auction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error || 'Không tìm thấy thông tin đấu giá'}</p>
        <Button onClick={() => window.location.reload()}>Thử lại</Button>
      </div>
    )
  }

  // Parse images from comma-separated string
  const images = auction.itemImages 
    ? auction.itemImages.split(',').map(img => img.trim())
    : ['/placeholder.jpg']

  const minIncrement = 500000 // Có thể lấy từ config hoặc API
  const suggestedBid = (auction.currentBid || auction.startingBid) + minIncrement

  // Mock seller data (có thể fetch từ API khác nếu cần)
  const seller = {
    name: auction.sellerName || `User #${auction.sellerId}`,
    rating: 4.8,
    totalRatings: auction.sellerTotalRatings || 0,
    totalSales: 1234,
    joinDate: "Tháng 3, 2023",
    responseRate: 98,
    responseTime: "Trong vòng 2 giờ",
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Column - Images and Details */}
      <div className="lg:col-span-2">
        <Card className="overflow-hidden border-border bg-card">
          <div className="relative aspect-[4/3] bg-muted">
            <Image
              src={images[selectedImage] || "/placeholder.svg"}
              alt={auction.itemTitle}
              fill
              className="object-cover"
            />
            <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground">
              {auction.categoryName || `Category #${auction.categoryId}`}
            </Badge>
            <div className="absolute right-4 top-4 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="bg-background/90 backdrop-blur"
                onClick={() => setIsWatching(!isWatching)}
              >
                <Heart className={`h-5 w-5 ${isWatching ? "fill-accent text-accent" : ""}`} />
              </Button>
              <Button size="icon" variant="secondary" className="bg-background/90 backdrop-blur">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto p-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  selectedImage === index ? "border-primary" : "border-border"
                }`}
              >
                <Image src={image || "/placeholder.svg"} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </Card>

        <Card className="mt-6 border-border bg-card p-6">
          <Tabs defaultValue="description">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">
                Mô tả
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                Lịch sử đấu giá
              </TabsTrigger>
              <TabsTrigger value="seller" className="flex-1">
                Người bán
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <h3 className="mb-4 text-xl font-semibold text-foreground">Chi tiết sản phẩm</h3>
              <div className="space-y-4 text-muted-foreground whitespace-pre-line">
                {auction.itemDescription || 'Không có mô tả'}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
{/*
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="text-sm text-muted-foreground">Trạng thái</div>
                  <div className="mt-1 font-semibold text-foreground">{auction.status}</div>
                </div>
*/}
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="text-sm text-muted-foreground">Danh mục</div>
                  <div className="mt-1 font-semibold text-foreground">
                    {auction.categoryName || `Category #${auction.categoryId}`}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <BidHistory />
            </TabsContent>

            <TabsContent value="seller" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                    {seller.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-foreground">{seller.name}</h3>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-lg bg-yellow-50 px-3 py-1.5">
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        <span className="text-lg font-bold text-foreground">{seller.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">/ 5.0</span>
                      </div>
                      <span className="text-sm text-muted-foreground">({seller.totalRatings} đánh giá)</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="border-border bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Tổng giao dịch</div>
                        <div className="text-xl font-bold text-foreground">{seller.totalSales}</div>
                      </div>
                    </div>
                  </Card>

                  <Card className="border-border bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-accent/10 p-2">
                        <Award className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Tỷ lệ phản hồi</div>
                        <div className="text-xl font-bold text-foreground">{seller.responseRate}%</div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tham gia từ</span>
                    <span className="font-medium text-foreground">{seller.joinDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Thời gian phản hồi</span>
                    <span className="font-medium text-foreground">{seller.responseTime}</span>
                  </div>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90">Xem trang người bán</Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Right Column - Bidding */}
      <div className="space-y-6">
        <Card className="border-border bg-card p-6">
          <h1 className="mb-4 text-2xl font-bold text-foreground">{auction.itemTitle}</h1>

          <div className="mb-6 rounded-lg border border-accent/20 bg-accent/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Kết thúc sau</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-accent" />
                <span className="font-mono text-lg font-bold text-accent">{timeLeft}</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-3/4 animate-pulse-glow bg-accent" />
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Giá hiện tại</span>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(auction.currentBid || auction.startingBid)}
                </div>
                {auction.currentBid && (
                  <div className="flex items-center justify-end gap-1 text-sm text-accent">
                    <TrendingUp className="h-3 w-3" />
                    <span>+{(((auction.currentBid - auction.startingBid) / auction.startingBid) * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Giá khởi điểm</span>
              <span className="text-muted-foreground">{formatPrice(auction.startingBid)}</span>
            </div>

            {auction.buyNowPrice && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Giá mua ngay</span>
                <span className="font-semibold text-foreground">{formatPrice(auction.buyNowPrice)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{auction.bidCount || 0} lượt đấu giá</span>
            </div>
          </div>

          <div className="mb-4 space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Tối thiểu ${formatPrice(suggestedBid)}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="flex-1"
              />
              <Button className="px-6">Đặt giá</Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setBidAmount(suggestedBid.toString())}
              >
                {formatPrice(suggestedBid)}
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setBidAmount((suggestedBid + minIncrement).toString())}
              >
                {formatPrice(suggestedBid + minIncrement)}
              </Button>
            </div>

            <AutoBidDialog currentBid={auction.currentBid || auction.startingBid} minIncrement={minIncrement} />
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Bước giá tối thiểu: {formatPrice(minIncrement)}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
              <span className="text-muted-foreground">Bạn sẽ nhận thông báo khi bị vượt giá</span>
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Hỗ trợ trực tuyến</h3>
            <div className="ml-auto flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse-glow rounded-full bg-accent" />
              <span className="text-xs text-accent">Online</span>
            </div>
          </div>
          <LiveChat />
        </Card>
      </div>
    </div>
  )
}