"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Gavel, Trophy, Eye, TrendingUp } from "lucide-react"
import { AuctionsAPI } from "@/lib/api/auctions"
import { useAuth } from "@/lib/auth-context"
import { WatchlistAPI } from "@/lib/api/watchlist"

export function BuyerStats() {
  const { user } = useAuth()
  const [activeCount, setActiveCount] = useState<number>(0)
  const [endingSoonCount, setEndingSoonCount] = useState<number>(0)
  const [loadingActive, setLoadingActive] = useState(true)
  const [activeError, setActiveError] = useState<string | null>(null)
  
  const [wonCount, setWonCount] = useState<number>(0)
  const [lostCount, setLostCount] = useState<number>(0)
  const [wonThisMonth, setWonThisMonth] = useState<number>(0)
  const [loadingWon, setLoadingWon] = useState(true)
  const [wonError, setWonError] = useState<string | null>(null)

  const [watchlistCount, setWatchlistCount] = useState<number>(0)
  const [watchlistStartingToday, setWatchlistStartingToday] = useState<number>(0)
  const [loadingWatchlist, setLoadingWatchlist] = useState(true)
  const [watchlistError, setWatchlistError] = useState<string | null>(null)

  useEffect(() => {
    const bidderId = user ? parseInt(user.id) : NaN

    if (!bidderId || Number.isNaN(bidderId)) {
      setLoadingActive(false)
      setLoadingWon(false)
      setLoadingWatchlist(false)
      setActiveError("Không xác định được người dùng")
      setWonError("Không xác định được người dùng")
      setWatchlistError("Không xác định được người dùng")
      return
    }

    const loadWatchlistStats = async () => {
      try {
        setLoadingWatchlist(true)
        setWatchlistError(null)

        const items = await WatchlistAPI.getByUser(bidderId)
        setWatchlistCount(items.length)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const startingToday = items.filter(item => {
          const candidate = item.addedAt ? new Date(item.addedAt) : new Date(item.endTime)
          return candidate >= today && candidate < tomorrow
        }).length

        setWatchlistStartingToday(startingToday)
      } catch (error) {
        console.error("Failed to load watchlist stats:", error)
        const message = error instanceof Error ? error.message : "Không thể tải dữ liệu watchlist"
        setWatchlistError(message)
        setWatchlistCount(0)
        setWatchlistStartingToday(0)
      } finally {
        setLoadingWatchlist(false)
      }
    }

    const loadActiveStats = async () => {
      try {
        setLoadingActive(true)
        setActiveError(null)

        const result = await AuctionsAPI.getBuyerActiveBids(bidderId, 1, 1000)
        setActiveCount(result.totalCount)

        const now = Date.now()
        const soonThreshold = now + 24 * 60 * 60 * 1000
        const endingSoon = result.data.filter((bid) => {
          const end = new Date(bid.endTime).getTime()
          return end > now && end <= soonThreshold
        }).length

        setEndingSoonCount(endingSoon)
      } catch (error) {
        console.error("Failed to load buyer active stats:", error)
        const message = error instanceof Error ? error.message : "Không thể tải dữ liệu"
        setActiveError(message)
        setActiveCount(0)
        setEndingSoonCount(0)
      } finally {
        setLoadingActive(false)
      }
    }

    const loadWonStats = async () => {
      try {
        setLoadingWon(true)
        setWonError(null)

        // Lấy tất cả lịch sử đấu giá để tính chính xác won/lost
        const historyResult = await AuctionsAPI.getBiddingHistory(bidderId, 1, 10000)
        
        // Đếm số phiên thắng và thua
        const wonAuctions = historyResult.data.filter(h => h.status === 'won')
        const lostAuctions = historyResult.data.filter(h => h.status === 'lost')
        
        setWonCount(wonAuctions.length)
        setLostCount(lostAuctions.length)

        // Tính số đã thắng trong tháng này
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const wonThisMonthCount = wonAuctions.filter((auction) => {
          const bidDate = new Date(auction.bidTime)
          return bidDate >= firstDayOfMonth
        }).length

        setWonThisMonth(wonThisMonthCount)
      } catch (error) {
        console.error("Failed to load buyer won stats:", error)
        const message = error instanceof Error ? error.message : "Không thể tải dữ liệu"
        setWonError(message)
        setWonCount(0)
        setLostCount(0)
        setWonThisMonth(0)
      } finally {
        setLoadingWon(false)
      }
    }

    loadActiveStats()
    loadWonStats()
    loadWatchlistStats()
  }, [user?.id])

  // Tính tỷ lệ thắng dựa trên các phiên ĐÃ KẾT THÚC
  // Công thức: (Số đã thắng) / (Số đã thắng + Số đã thua) * 100
  const winRate = useMemo(() => {
    const totalCompleted = wonCount + lostCount
    if (totalCompleted === 0) return 0
    return Math.round((wonCount / totalCompleted) * 100)
  }, [wonCount, lostCount])

  const stats = useMemo(
    () => [
      {
        label: "Đang tham gia",
        value: loadingActive ? "..." : activeError ? "--" : activeCount.toString(),
        change: loadingActive
          ? "Đang tải dữ liệu"
          : activeError
            ? activeError
            : `${endingSoonCount} sắp kết thúc`,
        icon: Gavel,
        color: "text-primary",
      },
      {
        label: "Đã thắng",
        value: loadingWon ? "..." : wonError ? "--" : wonCount.toString(),
        change: loadingWon
          ? "Đang tải dữ liệu"
          : wonError
            ? wonError
            : `${wonThisMonth} tháng này`,
        icon: Trophy,
        color: "text-accent",
      },
      {
        label: "Đang theo dõi",
        value: loadingWatchlist ? "..." : watchlistError ? "--" : watchlistCount.toString(),
        change: loadingWatchlist
          ? "Đang tải dữ liệu"
          : watchlistError
            ? watchlistError
            : `${watchlistStartingToday} thêm hôm nay`,
        icon: Eye,
        color: "text-primary",
      },
      {
        label: "Tỷ lệ thắng",
        value: loadingWon
          ? "..."
          : wonError
            ? "--"
            : `${winRate}%`,
        change: loadingWon
          ? "Đang tải dữ liệu"
          : wonError
            ? "Không thể tính toán"
            : wonCount + lostCount === 0
              ? "Chưa có phiên nào kết thúc"
              : `${wonCount} / ${wonCount + lostCount} phiên`,
        icon: TrendingUp,
        color: "text-accent",
      },
    ],
    [
      activeCount,
      activeError,
      endingSoonCount,
      loadingActive,
      wonCount,
      lostCount,
      wonThisMonth,
      loadingWon,
      wonError,
      winRate,
      watchlistCount,
      watchlistStartingToday,
      loadingWatchlist,
      watchlistError,
    ],
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
              </div>
              <div className={`rounded-full bg-muted p-3 ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}