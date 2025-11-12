"use client"

import { Card } from "@/components/ui/card"
import { Users, Gavel, AlertCircle, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"
import { AdminStatsAPI, AdminStatsDto } from "@/lib/api/admin-stats"

function formatNumber(num: number): string {
  return new Intl.NumberFormat("vi-VN").format(num)
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `₫${(amount / 1_000_000_000).toFixed(1)}B`
  } else if (amount >= 1_000_000) {
    return `₫${(amount / 1_000_000).toFixed(1)}M`
  } else if (amount >= 1_000) {
    return `₫${(amount / 1_000).toFixed(1)}K`
  }
  return `₫${formatNumber(amount)}`
}

export function AdminStats() {
  const [stats, setStats] = useState<AdminStatsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)
        const data = await AdminStatsAPI.getStats()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats")
        console.error("Error fetching admin stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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
          <p className="text-destructive">
            {error || "Failed to load statistics"}
          </p>
        </Card>
      </div>
    )
  }

  const statsData = [
    {
      label: "Tổng người dùng",
      value: formatNumber(stats.totalUsers),
      change: `+${formatNumber(stats.newUsersThisWeek)} tuần này`,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Phiên đấu giá hoạt động",
      value: formatNumber(stats.activeAuctions),
      change: `${formatNumber(stats.pendingItems)} chờ duyệt`,
      icon: Gavel,
      color: "text-accent",
    },
    {
      label: "Tranh chấp đang xử lý",
      value: formatNumber(stats.disputesProcessing),
      change: `${formatNumber(stats.urgentDisputes)} khẩn cấp`,
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      label: "Doanh thu tháng này",
      value: formatCurrency(stats.revenueThisMonth),
      change: `${stats.revenueChangePercent >= 0 ? "+" : ""}${stats.revenueChangePercent.toFixed(1)}% so với tháng trước`,
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
