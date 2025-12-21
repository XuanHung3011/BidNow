"use client"

import { useId, useMemo } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
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

const STEP_TABLE = [
  { threshold: 200_000, step: 20_000 },
  { threshold: 500_000, step: 50_000 },
  { threshold: 2_000_000, step: 100_000 },
  { threshold: 5_000_000, step: 250_000 },
  { threshold: 10_000_000, step: 500_000 },
  { threshold: 50_000_000, step: 1_000_000 },
  { threshold: 100_000_000, step: 2_500_000 },
  { threshold: 250_000_000, step: 5_000_000 },
  { threshold: 500_000_000, step: 10_000_000 },
  { threshold: 1_000_000_000, step: 25_000_000 },
  { threshold: Infinity, step: 50_000_000 },
]

const getAxisStep = (min: number, max: number) => {
  const range = Math.max(Math.ceil(max - min), 1)
  const entry = STEP_TABLE.find((item) => range <= item.threshold)
  return entry?.step ?? 1_000_000
}

const formatAxisTick = (value: number) => {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""

  const formatWithSuffix = (num: number, suffix: string) => {
    const formatted = num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)
    return `${formatted}${suffix}`
  }

  if (abs >= 1_000_000_000) {
    return `${sign}${formatWithSuffix(abs / 1_000_000_000, "b")}`
  }
  if (abs >= 1_000_000) {
    return `${sign}${formatWithSuffix(abs / 1_000_000, "m")}`
  }
  if (abs >= 1_000) {
    return `${sign}${formatWithSuffix(abs / 1_000, "k")}`
  }

  return `${sign}${abs.toLocaleString("en-US")}`
}

export function RealTimePriceChart({
  data,
  startingBid,
  currentBid,
  buyNowPrice,
  className,
}: RealTimePriceChartProps) {
  const gradientId = useId()

  const domain = useMemo<[number, number]>(() => {
    const prices = data.length ? data.map((d) => d.price) : [startingBid]
    const min = Math.min(startingBid, ...prices)
    const maxCandidate = Math.max(currentBid, ...prices, buyNowPrice ?? 0)
    const padding = Math.max(Math.round((maxCandidate - min) * 0.12), 1_000_000)
    const lower = Math.max(0, min - padding * 0.3)
    const upper = Math.max(lower + 1, maxCandidate + padding)
    return [lower, upper]
  }, [data, startingBid, currentBid, buyNowPrice])

  const axisTicks = useMemo(() => {
    const [min, max] = domain
    const step = getAxisStep(min, max)
    const rawStart = Math.floor(min / step) * step
    const start = Math.max(0, rawStart)
    const end = Math.ceil(max / step) * step
    const ticks: number[] = []
    for (let value = start; value <= end; value += step) {
      ticks.push(value)
      if (ticks.length > 11) break
    }
    if (!ticks.length) {
      return [0, max]
    }
    if (ticks[ticks.length - 1] < max) {
      ticks.push(max)
    }
    return ticks
  }, [domain])

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
    <div
      className={cn(
        "h-[380px] rounded-xl border border-border bg-muted/30 px-4 py-4 md:h-[460px]",
        className,
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="rgba(15,23,42,0.35)"
            strokeDasharray="2 4"
            vertical={false}
            horizontalCoordinatesGenerator={() => axisTicks}
          />
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
            ticks={axisTicks}
            tickFormatter={formatAxisTick}
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            fontSize={11}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            width={48}
            domain={domain}
          />
          <Tooltip content={tooltipContent} />
          <ReferenceLine
            y={startingBid}
            stroke="#0f172a"
            strokeWidth={1.5}
            strokeDasharray="5 5"
          />
          {axisTicks.map((tick) => (
            <ReferenceLine
              key={`tick-${tick}`}
              y={tick}
              stroke="rgba(15,23,42,0.4)"
              strokeDasharray="2 4"
            />
          ))}
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

