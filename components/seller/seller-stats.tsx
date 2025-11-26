"use client"

import { Card } from "@/components/ui/card"
import { Package, DollarSign, Clock, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { SellerStatsAPI, SellerStatsDto } from "@/lib/api/seller-stats"
import { useAuth } from "@/lib/auth-context"

export function SellerStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<SellerStatsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    async function fetchStats() {
      if (!user?.id) return
      try {
        setLoading(true)
        setError(null)
        const sellerId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id
        if (isNaN(sellerId)) return
        const data = await SellerStatsAPI.getStats(sellerId)
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải thống kê")
        console.error("Error fetching seller stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `₫${(amount / 1_000_000_000).toFixed(1)}B`
    } else if (amount >= 1_000_000) {
      return `₫${(amount / 1_000_000).toFixed(1)}M`
    } else if (amount >= 1_000) {
      return `₫${(amount / 1_000).toFixed(1)}K`
    }
    return `₫${amount.toLocaleString("vi-VN")}`
  }

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? "+" : ""
    return `${sign}${percent.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-4"></div>
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 col-span-4">
          <p className="text-destructive">{error || "Không thể tải thống kê"}</p>
        </Card>
      </div>
    )
  }

  const statsData = [
    {
      label: "Điểm uy tín",
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0",
      change: `Từ ${stats.totalRatings} đánh giá`,
      icon: Star,
      color: "text-yellow-500",
    },
    {
      label: "Tổng sản phẩm",
      value: stats.totalListings.toString(),
      change: `${stats.activeAuctions} đang đấu giá`,
      icon: Package,
      color: "text-primary",
    },
    {
      label: "Đang đấu giá",
      value: stats.activeAuctions.toString(),
      change: `${stats.endingSoonAuctions} sắp kết thúc`,
      icon: Clock,
      color: "text-accent",
    },
    {
      label: "Doanh thu tháng này",
      value: formatCurrency(stats.revenueThisMonth),
      change: `${formatPercent(stats.revenueChangePercent)} so với tháng trước`,
      icon: DollarSign,
      color: "text-primary",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => {
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
