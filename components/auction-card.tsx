"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, Users, Star } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import Image from "next/image"

interface AuctionCardProps {
  auction: {
    id: string | number
    title: string
    image: string
    currentBid: number
    startingBid: number
    endTime: Date
    startTime?: Date | string
    bidCount: number
    category: string
    sellerRating?: number
    sellerName?: string
    status?: string | null
    pausedAt?: string | Date | null
  }
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState("")
  const [status, setStatus] = useState<"scheduled" | "active" | "ended" | "paused" | "cancelled">("active")

  useEffect(() => {
    const normalizedStatus = auction.status?.toLowerCase() ?? ""
    const isPaused = normalizedStatus === "paused"
    const isCancelled = normalizedStatus === "cancelled"

    if (isPaused) {
      setStatus("paused")
      if (auction.pausedAt) {
        const pausedDate =
          auction.pausedAt instanceof Date ? auction.pausedAt : new Date(auction.pausedAt)
        if (!Number.isNaN(pausedDate.getTime())) {
          const pausedTime = pausedDate.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          setTimeLeft(`Tạm dừng từ ${pausedTime}`)
        } else {
          setTimeLeft("Đã tạm dừng")
        }
      } else {
        setTimeLeft("Đã tạm dừng")
      }
      return
    }

    if (isCancelled) {
      setStatus("cancelled")
      setTimeLeft("Đã hủy")
      return
    }

    if (!auction.endTime) {
      setTimeLeft("Đã kết thúc")
      setStatus("ended")
      return
    }

    const updateTimer = () => {
      const now = new Date().getTime()
      
      // Parse startTime và endTime - giống logic trong auction-detail.tsx
      const startTime = auction.startTime 
        ? (auction.startTime instanceof Date ? auction.startTime.getTime() : new Date(auction.startTime).getTime())
        : null
      const endTime = auction.endTime instanceof Date 
        ? auction.endTime.getTime() 
        : new Date(auction.endTime).getTime()

      // Nếu có startTime và chưa đến giờ bắt đầu (scheduled), đếm ngược đến StartTime
      // Ưu tiên kiểm tra startTime trước để đảm bảo hiển thị đúng trạng thái
      if (startTime && startTime > now) {
        setStatus("scheduled")
        const distance = startTime - now
        const hours = Math.floor(distance / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)
        setTimeLeft(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
        return
      }

      // Nếu auction đã bắt đầu, đếm ngược đến EndTime
      const distance = endTime - now

      if (distance < 0) {
        setTimeLeft("Đã kết thúc")
        setStatus("ended")
        return
      }

      // Nếu đã qua startTime và chưa đến endTime -> active
      setStatus("active")
      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [auction.endTime, auction.startTime, auction.status, auction.pausedAt])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const priceIncrease =
    auction.startingBid > 0 ? ((auction.currentBid - auction.startingBid) / auction.startingBid) * 100 : 0

  return (
    <Link href={`/auction/${auction.id}`}>
      <Card className="group overflow-hidden border-border bg-card transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={auction.image || "/placeholder.svg"}
            alt={auction.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">{auction.category}</Badge>
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
            {/* Status Badge */}
            <Badge 
              variant={
                status === "scheduled" ? "secondary" :
                status === "active" ? "default" :
              status === "paused" ? "destructive" :
                "destructive"
              }
              className={
                status === "scheduled" ? "bg-blue-500/90 text-white" :
                status === "active" ? "bg-green-500/90 text-white" :
              status === "paused" ? "bg-orange-500/90 text-white" :
              status === "cancelled" ? "bg-gray-500/90 text-white" :
              "bg-gray-500/90 text-white"
              }
            >
              {status === "scheduled" ? "Sắp diễn ra" :
               status === "active" ? "Đang diễn ra" :
               status === "paused" ? "Đã tạm dừng" :
             status === "cancelled" ? "Đã hủy" :
             "Đã kết thúc"}
            </Badge>
            {/* Countdown Timer */}
            <div className="flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 backdrop-blur">
              <Clock className="h-3 w-3 text-accent" />
              <span className="text-xs font-mono font-semibold text-foreground">{timeLeft}</span>
            </div>
          </div>
          {auction.sellerRating && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 backdrop-blur">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span className="text-xs font-semibold text-foreground">{auction.sellerRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="mb-3 line-clamp-2 text-lg font-semibold text-foreground">{auction.title}</h3>

          {auction.sellerName && <p className="mb-2 text-sm text-muted-foreground">Người bán: {auction.sellerName}</p>}

          <div className="mb-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Giá hiện tại</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">{formatPrice(auction.currentBid)}</span>
                {priceIncrease > 0 && (
                  <Badge variant="secondary" className="gap-1 bg-accent/10 text-accent">
                    <TrendingUp className="h-3 w-3" />+{priceIncrease.toFixed(0)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Giá khởi điểm</span>
              <span className="text-muted-foreground">{formatPrice(auction.startingBid)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{auction.bidCount} lượt đấu giá</span>
            </div>
            <Button size="sm" className="group/btn">
              Đấu giá
              <TrendingUp className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-y-[-2px]" />
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  )
}
