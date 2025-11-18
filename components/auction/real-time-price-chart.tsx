"use client"

import { useId, useMemo } from "react"
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"

export interface PricePoint {
  sequence: number
  price: number
  label: string
  bidder?: string
  timeLabel?: string
}

interface RealTimePriceChartProps {
  data: PricePoint[]
  startingBid: number
  currentBid: number
  buyNowPrice?: number
  className?: string
}

interface TooltipPayload {
  value: number
  payload: PricePoint
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)

export function RealTimePriceChart({
  data,
  startingBid,
  currentBid,
  buyNowPrice,
  className,
}: RealTimePriceChartProps) {
  const gradientId = useId()

  const domain = useMemo(() => {
    const prices = data.length ? data.map((d) => d.price) : [startingBid]
    const min = Math.min(startingBid, ...prices)
    const maxCandidate = Math.max(currentBid, ...prices, buyNowPrice ?? 0)
    const padding = Math.max(Math.round((maxCandidate - min) * 0.12), 1_000_000)
    return [min - padding * 0.3, maxCandidate + padding]
  }, [data, startingBid, currentBid, buyNowPrice])

  const tooltipContent = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (!active || !payload?.length) return null
    const point = payload[0].payload
    return (
      <div className="rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-lg">
        <div className="font-semibold text-primary">{formatCurrency(point.price)}</div>
        <div className="text-muted-foreground">{point.label}</div>
        {point.timeLabel && <div className="text-[10px] text-foreground/70">{point.timeLabel}</div>}
        {point.bidder && <div className="text-foreground/80">{point.bidder}</div>}
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className={cn("flex h-[220px] items-center justify-center rounded-xl bg-muted/40", className)}>
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu đấu giá để hiển thị biểu đồ</p>
      </div>
    )
  }

  return (
    <div className={cn("h-[260px] rounded-xl border border-border bg-muted/30 px-3 py-2", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="sequence"
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(value) => `#${value}`}
          />
          <YAxis
            dataKey="price"
            tickFormatter={(value) => `${Math.round(value / 1_000_000)}tr`}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            width={36}
            domain={domain as [number, number]}
          />
          <Tooltip content={tooltipContent} />
          <ReferenceLine
            y={startingBid}
            stroke="hsl(var(--border))"
            strokeDasharray="4 4"
            label={{
              value: "Giá khởi điểm",
              position: "left",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
            }}
          />
          {buyNowPrice && (
            <ReferenceLine
              y={buyNowPrice}
              stroke="hsl(var(--destructive))"
              strokeDasharray="4 4"
              label={{
                value: "Giá mua ngay",
                position: "left",
                fill: "hsl(var(--destructive))",
                fontSize: 11,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="price"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

