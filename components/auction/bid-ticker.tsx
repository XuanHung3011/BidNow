"use client"

import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TickerBid {
  id: string
  bidder: string
  amount: number
  bidTime: string
  isWinning?: boolean
}

interface BidTickerProps {
  items: TickerBid[]
}

const formatCurrency = (price: number) => {
  if (price >= 1000000000) {
    const billions = price / 1000000000
    return `${billions.toFixed(billions % 1 === 0 ? 0 : 1)} tỷ ₫`
  } else if (price >= 1000000) {
    const millions = price / 1000000
    return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)} triệu ₫`
  }
  return new Intl.NumberFormat("vi-VN", { 
    style: "currency", 
    currency: "VND", 
    maximumFractionDigits: 0
  }).format(price)
}

export function BidTicker({ items }: BidTickerProps) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-4 py-3 text-xs text-muted-foreground">
        Chưa có giao dịch gần đây
      </div>
    )
  }

  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-xl border border-border bg-background/80 py-3 min-h-[96px]">
      <div className="absolute inset-0 flex items-center animate-[ticker_18s_linear_infinite] whitespace-nowrap [--gap:32px]">
        {[...items, ...items].map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className={cn(
              "mx-2 flex min-w-[240px] max-w-[280px] items-center gap-3 rounded-lg border px-3 py-2 shadow-sm transition-all",
              item.isWinning
                ? "border-accent bg-accent/10 text-accent-foreground"
                : "border-border bg-muted/60 text-foreground"
            )}
          >
            <div className="min-w-0 flex-1 flex flex-col text-xs">
              <span className="truncate font-semibold">{item.bidder}</span>
              <span className="text-muted-foreground">{new Date(item.bidTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1 text-xs font-bold">
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="whitespace-nowrap">{formatCurrency(item.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// keyframes for ticker
const style = `
@keyframes ticker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`

if (typeof document !== "undefined" && !document.getElementById("ticker-keyframes")) {
  const el = document.createElement("style")
  el.id = "ticker-keyframes"
  el.innerHTML = style
  document.head.appendChild(el)
}

