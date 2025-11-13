"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Gavel, Trophy, Eye, TrendingUp } from "lucide-react"
import { AuctionsAPI } from "@/lib/api/auctions"
import { useAuth } from "@/lib/auth-context"

export function BuyerStats() {
  const { user } = useAuth()
  const [activeCount, setActiveCount] = useState<number>(0)
  const [endingSoonCount, setEndingSoonCount] = useState<number>(0)
  const [loadingActive, setLoadingActive] = useState(true)
  const [activeError, setActiveError] = useState<string | null>(null)
  
  const [wonCount, setWonCount] = useState<number>(0)
  const [wonThisMonth, setWonThisMonth] = useState<number>(0)
  const [loadingWon, setLoadingWon] = useState(true)
  const [wonError, setWonError] = useState<string | null>(null)

  useEffect(() => {
    const bidderId = user ? parseInt(user.id) : NaN

    if (!bidderId || Number.isNaN(bidderId)) {
      setLoadingActive(false)
      setLoadingWon(false)
      setActiveError("Không xác định được người dùng")
      setWonError("Không xác định được người dùng")
      return
    }

    const loadActiveStats = async () => {
      try {
        setLoadingActive(true)
        setActiveError(null)

        const pageSize = 50
        const result = await AuctionsAPI.getBuyerActiveBids(bidderId, 1, pageSize)

        setActiveCount(result.totalCount)

        const now = Date.now()
        const soonThreshold = now + 24 * 60 * 60 * 1000 // 24 hours
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

        const pageSize = 50
        const result = await AuctionsAPI.getBuyerWonAuctions(bidderId, 1, pageSize)

        setWonCount(result.totalCount)

        // Tính số đã thắng trong tháng này
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const wonThisMonthCount = result.data.filter((auction) => {
          const wonDate = new Date(auction.wonDate)
          return wonDate >= firstDayOfMonth
        }).length

        setWonThisMonth(wonThisMonthCount)
      } catch (error) {
        console.error("Failed to load buyer won stats:", error)
        const message = error instanceof Error ? error.message : "Không thể tải dữ liệu"
        setWonError(message)
        setWonCount(0)
        setWonThisMonth(0)
      } finally {
        setLoadingWon(false)
      }
    }

    loadActiveStats()
    loadWonStats()
  }, [user?.id])

  // Tính tỷ lệ thắng
  const winRate = useMemo(() => {
    const totalParticipated = activeCount + wonCount
    if (totalParticipated === 0) return 0
    return Math.round((wonCount / totalParticipated) * 100)
  }, [activeCount, wonCount])

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
        value: "24",
        change: "3 bắt đầu hôm nay",
        icon: Eye,
        color: "text-primary",
      },
      {
        label: "Tỷ lệ thắng",
        value: loadingActive || loadingWon
          ? "..."
          : activeError || wonError
            ? "--"
            : `${winRate}%`,
        change: loadingActive || loadingWon
          ? "Đang tải dữ liệu"
          : activeError || wonError
            ? "Không thể tính toán"
            : `${wonCount} / ${activeCount + wonCount} phiên`,
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
      wonThisMonth,
      loadingWon,
      wonError,
      winRate,
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
