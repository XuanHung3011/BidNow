"use client"

import { Card } from "@/components/ui/card"
import { Users, Gavel, DollarSign } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { AdminStatsAPI, AdminStatsDto, AdminStatsDetailDto } from "@/lib/api/admin-stats"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Bar, BarChart, Line, LineChart, ResponsiveContainer } from "recharts"
import { createAuctionHubConnection } from "@/lib/realtime/auctionHub"

function formatNumber(num: number): string {
  return new Intl.NumberFormat("vi-VN").format(num)
}

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1)} tỷ VNĐ`
    } else if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)} triệu VNĐ`
    } else if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(0)} nghìn VNĐ`
    }
    return `${amount.toLocaleString("vi-VN")} VNĐ`
  }

export function AdminStats() {
  const [stats, setStats] = useState<AdminStatsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<Record<string, AdminStatsDetailDto>>({})
  const [loadingCharts, setLoadingCharts] = useState<Record<string, boolean>>({})

  const fetchStats = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false

    try {
      if (!silent) {
        setLoading(true)
      }
      const data = await AdminStatsAPI.getStats()
      setStats(data)
      setError(null)

      const chartTypes = ["users", "auctions", "revenue"]
      const chartPromises = chartTypes.map(async (type) => {
        if (!silent) {
          setLoadingCharts((prev) => ({ ...prev, [type]: true }))
        }
        try {
          const detailData = await AdminStatsAPI.getStatsDetail(type)
          setChartData((prev) => ({ ...prev, [type]: detailData }))
        } catch (err) {
          console.error(`Error fetching chart data for ${type}:`, err)
        } finally {
          if (!silent) {
            setLoadingCharts((prev) => ({ ...prev, [type]: false }))
          }
        }
      })

      await Promise.all(chartPromises)
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load stats")
      }
      console.error("Error fetching admin stats:", err)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const connection = createAuctionHubConnection()
    let isMounted = true
    let started = false
    let isStarting = false
    
    const startPromise = (async () => {
      try {
        isStarting = true
        await connection.start()
        isStarting = false
        started = true
        if (!isMounted) {
          await connection.stop().catch(() => {})
          return
        }
        await Promise.all([
          connection.invoke("JoinAdminSection", "stats").catch(() => {}),
          connection.invoke("JoinAdminSection", "auctions").catch(() => {}),
        ])
      } catch (error) {
        isStarting = false
        // Silently ignore connection errors
      }
    })()

    const handleRealtimeUpdate = () => {
      fetchStats({ silent: true })
    }

    connection.on("AdminStatsUpdated", handleRealtimeUpdate)
    connection.on("AdminAuctionStatusUpdated", handleRealtimeUpdate)

    return () => {
      isMounted = false
      connection.off("AdminStatsUpdated", handleRealtimeUpdate)
      connection.off("AdminAuctionStatusUpdated", handleRealtimeUpdate)
      const cleanup = async () => {
        // Wait for connection to finish starting
        if (isStarting) {
          const maxWait = 2000
          const startTime = Date.now()
          while (isStarting && (Date.now() - startTime) < maxWait) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }
        
        try {
          await startPromise.catch(() => {})
          if (started && connection) {
            await Promise.all([
              connection.invoke("LeaveAdminSection", "stats").catch(() => {}),
              connection.invoke("LeaveAdminSection", "auctions").catch(() => {}),
            ])
          }
          if (connection) {
            await connection.stop().catch(() => {})
          }
        } catch {
          // Silently ignore all cleanup errors
        }
      }
      void cleanup()
    }
  }, [fetchStats])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-4"></div>
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
              <div className="h-16 bg-muted rounded mt-4"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 col-span-3">
          <p className="text-destructive">
            {error || "Failed to load statistics"}
          </p>
        </Card>
      </div>
    )
  }

  const statsData = [
    {
      id: "users",
      label: "Tổng người dùng",
      value: formatNumber(stats.totalUsers),
      change: `+${formatNumber(stats.newUsersThisWeek)} tuần này`,
      icon: Users,
      color: "text-primary",
      chartColor: "hsl(var(--chart-1))",
    },
    {
      id: "auctions",
      label: "Phiên đấu giá hoạt động",
      value: formatNumber(stats.activeAuctions),
      change: `${formatNumber(stats.pendingItems)} chờ duyệt`,
      icon: Gavel,
      color: "text-accent",
      chartColor: "hsl(var(--chart-2))",
    },
    // {
    //   id: "disputes",
    //   label: "Tranh chấp đang xử lý",
    //   value: formatNumber(stats.disputesProcessing),
    //   change: `${formatNumber(stats.urgentDisputes)} khẩn cấp`,
    //   icon: AlertCircle,
    //   color: "text-destructive",
    //   chartColor: "hsl(var(--chart-3))",
    // },
    {
      id: "revenue",
      label: "Doanh thu tháng này",
      value: formatCurrency(stats.revenueThisMonth),
      change: `${stats.revenueChangePercent >= 0 ? "+" : ""}${stats.revenueChangePercent.toFixed(1)}% so với tháng trước`,
      icon: DollarSign,
      color: "text-primary",
      chartColor: "hsl(var(--chart-4))",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {statsData.map((stat, index) => {
        const Icon = stat.icon
        const currentChartData = chartData[stat.id]
        const isLoadingChart = loadingCharts[stat.id]
        
        return (
          <Card 
            key={index} 
            className="p-6 hover:shadow-md transition-shadow"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                </div>
                <div className={`rounded-full bg-muted p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              
              {/* Chart */}
              <div className="h-48 w-full">
                {isLoadingChart ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : currentChartData && currentChartData.chartData.length > 0 ? (
                  <ChartContainer 
                    config={{
                      value: {
                        label: stat.label,
                        color: stat.chartColor,
                      },
                    }} 
                    className="h-full w-full"
                  >
                    {stat.id === "users" ? (
                      // LineChart cho Users - với fill và tension như mẫu Chart.js
                      <AreaChart data={currentChartData.chartData.map(d => ({ name: d.name, value: Number(d.value) }))}>
                        <defs>
                          <linearGradient id={`line-gradient-${stat.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(147,197,253,0.4)" />
                            <stop offset="100%" stopColor="rgba(147,197,253,0)" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          width={40}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            formatter={(value) => formatNumber(Number(value))}
                          />} 
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="rgba(37,99,235,1)"
                          fill={`url(#line-gradient-${stat.id})`}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    ) : stat.id === "auctions" ? (
                      // AreaChart cho Auctions - phù hợp để hiển thị số lượng phiên đấu giá
                      <AreaChart data={currentChartData.chartData.map(d => ({ name: d.name, value: Number(d.value) }))}>
                        <defs>
                          <linearGradient id={`gradient-${stat.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={stat.chartColor} stopOpacity={0.4} />
                            <stop offset="50%" stopColor={stat.chartColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={stat.chartColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          width={40}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            formatter={(value) => formatNumber(Number(value))}
                          />} 
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={stat.chartColor}
                          fill={`url(#gradient-${stat.id})`}
                          strokeWidth={3}
                        />
                      </AreaChart>
                    ) : (
                      // LineChart cho Revenue - với fill và tension như mẫu Chart.js
                      <AreaChart data={currentChartData.chartData.map(d => ({ name: d.name, value: Number(d.value) }))}>
                        <defs>
                          <linearGradient id={`revenue-gradient-${stat.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(34,197,94,0.3)" />
                            <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                          interval={0}
                        />
                        <YAxis 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          width={60}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            formatter={(value) => formatCurrency(Number(value))}
                          />} 
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#16a34a"
                          fill={`url(#revenue-gradient-${stat.id})`}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    )}
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    Không có dữ liệu
                  </div>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
