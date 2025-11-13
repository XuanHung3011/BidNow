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

  useEffect(() => {
    const bidderId = user ? parseInt(user.id) : NaN

    if (!bidderId || Number.isNaN(bidderId)) {
      setLoadingActive(false)
      setActiveError("Không xác định được người dùng")
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

    loadActiveStats()
  }, [user?.id])

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
        value: "8",
        change: "Tháng này",
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
        value: "67%",
        change: "+8% so với tháng trước",
        icon: TrendingUp,
        color: "text-accent",
      },
    ],
    [activeCount, activeError, endingSoonCount, loadingActive],
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
