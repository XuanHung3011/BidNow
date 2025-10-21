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
} from "lucide-react"
import { BidHistory } from "@/components/bid-history"
import { LiveChat } from "@/components/live-chat"
import { AutoBidDialog } from "@/components/auto-bid-dialog"

interface AuctionDetailProps {
  auctionId: string
}

export function AuctionDetail({ auctionId }: AuctionDetailProps) {
  const [timeLeft, setTimeLeft] = useState("")
  const [bidAmount, setBidAmount] = useState("")
  const [isWatching, setIsWatching] = useState(false)

  // Mock data
  const auction = {
    id: auctionId,
    title: "iPhone 15 Pro Max 256GB - Titan Xanh",
    images: [
      "/iphone-15-pro-max-blue-titanium-front.jpg",
      "/iphone-15-pro-max-blue-titanium-back.jpg",
      "/iphone-15-pro-max-blue-titanium-side.jpg",
    ],
    currentBid: 28500000,
    startingBid: 25000000,
    minIncrement: 500000,
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    bidCount: 45,
    category: "Điện tử",
    condition: "Mới 100%",
    description: `
      iPhone 15 Pro Max màu Titan Xanh, dung lượng 256GB. Sản phẩm chính hãng VN/A, 
      còn nguyên seal, chưa kích hoạt. Bảo hành 12 tháng tại Apple Store Việt Nam.
      
      Thông số kỹ thuật:
      - Chip A17 Pro
      - Camera 48MP chính + 12MP telephoto + 12MP ultra wide
      - Màn hình Super Retina XDR 6.7"
      - Pin 4422mAh
      - Hỗ trợ 5G
    `,
    seller: {
      name: "TechStore Official",
      rating: 4.8,
      totalRatings: 156,
      totalSales: 1234,
      joinDate: "Tháng 3, 2023",
      responseRate: 98,
      responseTime: "Trong vòng 2 giờ",
    },
  }

  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = auction.endTime.getTime() - now

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
  }, [auction.endTime])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const suggestedBid = auction.currentBid + auction.minIncrement

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Column - Images and Details */}
      <div className="lg:col-span-2">
        <Card className="overflow-hidden border-border bg-card">
          <div className="relative aspect-[4/3] bg-muted">
            <Image
              src={auction.images[selectedImage] || "/placeholder.svg"}
              alt={auction.title}
              fill
              className="object-cover"
            />
            <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground">{auction.category}</Badge>
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
            {auction.images.map((image, index) => (
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
              <div className="space-y-4 text-muted-foreground whitespace-pre-line">{auction.description}</div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="text-sm text-muted-foreground">Tình trạng</div>
                  <div className="mt-1 font-semibold text-foreground">{auction.condition}</div>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="text-sm text-muted-foreground">Danh mục</div>
                  <div className="mt-1 font-semibold text-foreground">{auction.category}</div>
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
                    {auction.seller.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-foreground">{auction.seller.name}</h3>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-lg bg-yellow-50 px-3 py-1.5">
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        <span className="text-lg font-bold text-foreground">{auction.seller.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">/ 5.0</span>
                      </div>
                      <span className="text-sm text-muted-foreground">({auction.seller.totalRatings} đánh giá)</span>
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
                        <div className="text-xl font-bold text-foreground">{auction.seller.totalSales}</div>
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
                        <div className="text-xl font-bold text-foreground">{auction.seller.responseRate}%</div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tham gia từ</span>
                    <span className="font-medium text-foreground">{auction.seller.joinDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Thời gian phản hồi</span>
                    <span className="font-medium text-foreground">{auction.seller.responseTime}</span>
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
          <h1 className="mb-4 text-2xl font-bold text-foreground">{auction.title}</h1>

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
                <div className="text-3xl font-bold text-primary">{formatPrice(auction.currentBid)}</div>
                <div className="flex items-center justify-end gap-1 text-sm text-accent">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{(((auction.currentBid - auction.startingBid) / auction.startingBid) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Giá khởi điểm</span>
              <span className="text-muted-foreground">{formatPrice(auction.startingBid)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{auction.bidCount} lượt đấu giá</span>
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
                onClick={() => setBidAmount((suggestedBid + auction.minIncrement).toString())}
              >
                {formatPrice(suggestedBid + auction.minIncrement)}
              </Button>
            </div>

            <AutoBidDialog currentBid={auction.currentBid} minIncrement={auction.minIncrement} />
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Bước giá tối thiểu: {formatPrice(auction.minIncrement)}</span>
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
