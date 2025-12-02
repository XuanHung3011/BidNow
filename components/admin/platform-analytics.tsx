"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { PlatformAnalyticsAPI, PlatformAnalyticsDto, PlatformAnalyticsDetailDto } from "@/lib/api/platform-analytics"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { createAuctionHubConnection } from "@/lib/realtime/auctionHub"

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

export function PlatformAnalytics() {
  const [analytics, setAnalytics] = useState<PlatformAnalyticsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<Record<string, PlatformAnalyticsDetailDto>>({})
  const [loadingCharts, setLoadingCharts] = useState<Record<string, boolean>>({})

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await PlatformAnalyticsAPI.getAnalytics()
      setAnalytics(data)

      const chartTypes = ["newUsers", "newAuctions", "totalTransactions", "successRate"]
      const chartPromises = chartTypes.map(async (type) => {
        setLoadingCharts((prev) => ({ ...prev, [type]: true }))
        try {
          const detailData = await PlatformAnalyticsAPI.getAnalyticsDetail(type)
          setChartData((prev) => ({ ...prev, [type]: detailData }))
        } catch (err) {
          console.error(`Error fetching chart data for ${type}:`, err)
        } finally {
          setLoadingCharts((prev) => ({ ...prev, [type]: false }))
        }
      })

      await Promise.all(chartPromises)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics")
      console.error("Error fetching platform analytics:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  useEffect(() => {
    const connection = createAuctionHubConnection()
    let mounted = true
    let started = false
    let isStarting = false
    
    const startPromise = (async () => {
      try {
        isStarting = true
        await connection.start()
        isStarting = false
        started = true
        if (!mounted) {
          await connection.stop().catch(() => {})
          return
        }
        await connection.invoke("JoinAdminSection", "analytics").catch(() => {})
      } catch (error) {
        isStarting = false
        // Silently ignore connection errors
      }
    })()

    connection.on("AdminAnalyticsUpdated", () => {
      fetchAnalytics()
    })

    return () => {
      mounted = false
      connection.off("AdminAnalyticsUpdated")
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
            await connection.invoke("LeaveAdminSection", "analytics").catch(() => {})
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
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-4"></div>
                <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                <div className="h-3 bg-muted rounded w-40"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-destructive">{error || "Failed to load analytics"}</p>
        </Card>
      </div>
    )
  }

  const metrics = [
    {
      id: "newUsers",
      title: "Người dùng mới",
      current: formatNumber(analytics.newUsers.current),
      previous: formatNumber(analytics.newUsers.previous),
      change: analytics.newUsers.changePercent >= 0
        ? `+${analytics.newUsers.changePercent.toFixed(1)}%`
        : `${analytics.newUsers.changePercent.toFixed(1)}%`,
      trend: analytics.newUsers.changePercent >= 0 ? "up" : "down",
      chartColor: "rgba(37,99,235,1)",
    },
    {
      id: "newAuctions",
      title: "Phiên đấu giá mới",
      current: formatNumber(analytics.newAuctions.current),
      previous: formatNumber(analytics.newAuctions.previous),
      change: analytics.newAuctions.changePercent >= 0
        ? `+${analytics.newAuctions.changePercent.toFixed(1)}%`
        : `${analytics.newAuctions.changePercent.toFixed(1)}%`,
      trend: analytics.newAuctions.changePercent >= 0 ? "up" : "down",
      chartColor: "rgba(249,115,22,1)",
    },
    {
      id: "totalTransactions",
      title: "Tổng giao dịch",
      current: formatCurrency(analytics.totalTransactions.current),
      previous: formatCurrency(analytics.totalTransactions.previous),
      change: analytics.totalTransactions.changePercent >= 0
        ? `+${analytics.totalTransactions.changePercent.toFixed(1)}%`
        : `${analytics.totalTransactions.changePercent.toFixed(1)}%`,
      trend: analytics.totalTransactions.changePercent >= 0 ? "up" : "down",
      chartColor: "rgba(34,197,94,1)",
    },
    {
      id: "successRate",
      title: "Tỷ lệ thành công",
      current: `${analytics.successRate.current}%`,
      previous: `${analytics.successRate.previous}%`,
      change: analytics.successRate.changePercent >= 0
        ? `+${analytics.successRate.changePercent.toFixed(1)}%`
        : `${analytics.successRate.changePercent.toFixed(1)}%`,
      trend: analytics.successRate.changePercent >= 0 ? "up" : "down",
      chartColor: "rgba(168,85,247,1)",
    },
  ]

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-primary"
      case "warning":
        return "bg-accent"
      case "error":
        return "bg-destructive"
      default:
        return "bg-primary"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Chỉ số tháng này</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            const currentChartData = chartData[metric.id]
            const isLoadingChart = loadingCharts[metric.id]
            
            return (
              <Card key={index} className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">{metric.current}</p>
                    <div className="mt-2 flex items-center gap-1 text-sm">
                      {metric.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-primary" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span className={metric.trend === "up" ? "text-primary" : "text-destructive"}>{metric.change}</span>
                      <span className="text-muted-foreground">so với tháng trước</span>
                    </div>
                  </div>
                  
                  {/* Chart */}
                  <div className="h-32 w-full">
                    {isLoadingChart ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      </div>
                    ) : currentChartData && currentChartData.chartData.length > 0 ? (
                      <ChartContainer 
                        config={{
                          value: {
                            label: metric.title,
                            color: metric.chartColor,
                          },
                        }} 
                        className="h-full w-full"
                      >
                        <AreaChart data={currentChartData.chartData.map(d => ({ name: d.name, value: Number(d.value) }))}>
                          <defs>
                            <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={metric.chartColor} stopOpacity={0.4} />
                              <stop offset="100%" stopColor={metric.chartColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                            hide
                          />
                          <YAxis 
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                            width={30}
                            hide
                          />
                          <ChartTooltip 
                            content={<ChartTooltipContent 
                              formatter={(value) => metric.id === "totalTransactions" ? formatCurrency(Number(value)) : 
                                metric.id === "successRate" ? `${Number(value).toFixed(1)}%` : formatNumber(Number(value))}
                            />} 
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={metric.chartColor}
                            fill={`url(#gradient-${metric.id})`}
                            strokeWidth={2}
                          />
                        </AreaChart>
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
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Danh mục hàng đầu</h3>
        <Card className="p-6">
          {analytics.topCategories.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Chưa có dữ liệu danh mục</p>
          ) : (
            <div className="space-y-4">
              {analytics.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                  <div>
                    <p className="font-semibold text-foreground">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{formatNumber(category.auctions)} phiên đấu giá</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(category.revenue)}</p>
                    <p className="text-sm text-muted-foreground">Doanh thu</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <Card className="p-6">
          <h4 className="mb-4 font-semibold text-foreground">Hoạt động gần đây</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Người dùng trực tuyến</span>
              <span className="font-semibold text-foreground">{formatNumber(analytics.recentActivity.onlineUsers)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phiên đấu giá đang diễn ra</span>
              <span className="font-semibold text-foreground">{formatNumber(analytics.recentActivity.activeAuctions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lượt đấu giá hôm nay</span>
              <span className="font-semibold text-foreground">{formatNumber(analytics.recentActivity.bidsToday)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Giao dịch hôm nay</span>
              <span className="font-semibold text-foreground">{formatCurrency(analytics.recentActivity.transactionsToday)}</span>
            </div>
          </div>
        </Card>

        {/* <Card className="p-6">
          <h4 className="mb-4 font-semibold text-foreground">Cảnh báo hệ thống</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className={`mt-0.5 h-2 w-2 rounded-full ${getSystemStatusColor(analytics.systemAlerts.systemStatus)}`} />
              <div>
                <p className="font-medium text-foreground">{analytics.systemAlerts.systemStatusMessage}</p>
                <p className="text-muted-foreground">Tất cả dịch vụ đang chạy tốt</p>
              </div>
            </div>
            {analytics.systemAlerts.pendingAuctions > 0 && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-accent" />
                <div>
                  <p className="font-medium text-foreground">{formatNumber(analytics.systemAlerts.pendingAuctions)} phiên đấu giá chờ duyệt</p>
                  <p className="text-muted-foreground">Cần xem xét trong 24 giờ</p>
                </div>
              </div>
            )}
            {analytics.systemAlerts.processingDisputes > 0 && (
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 h-2 w-2 rounded-full ${analytics.systemAlerts.urgentDisputes > 0 ? "bg-destructive" : "bg-accent"}`} />
                <div>
                  <p className="font-medium text-foreground">{formatNumber(analytics.systemAlerts.processingDisputes)} tranh chấp đang xử lý</p>
                  {analytics.systemAlerts.urgentDisputes > 0 && (
                    <p className="text-muted-foreground">{formatNumber(analytics.systemAlerts.urgentDisputes)} trường hợp khẩn cấp</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card> */}
      </div>
    </div>
  )
}
