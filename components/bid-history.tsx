"use client"

import { Avatar } from "@/components/ui/avatar"
import { TrendingUp } from "lucide-react"

const mockBids = [
  { user: "Nguyễn V.A", amount: 28500000, time: "2 phút trước", isWinning: true },
  { user: "Trần T.B", amount: 28000000, time: "5 phút trước", isWinning: false },
  { user: "Lê H.C", amount: 27500000, time: "8 phút trước", isWinning: false },
  { user: "Phạm M.D", amount: 27000000, time: "12 phút trước", isWinning: false },
  { user: "Hoàng T.E", amount: 26500000, time: "15 phút trước", isWinning: false },
  { user: "Đỗ V.F", amount: 26000000, time: "20 phút trước", isWinning: false },
  { user: "Vũ T.G", amount: 25500000, time: "25 phút trước", isWinning: false },
  { user: "Bùi H.H", amount: 25000000, time: "30 phút trước", isWinning: false },
]

export function BidHistory() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Người đấu giá</span>
        <span>Giá đặt</span>
      </div>

      <div className="space-y-2">
        {mockBids.map((bid, index) => (
          <div
            key={index}
            className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
              bid.isWinning ? "border-accent bg-accent/10" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                  {bid.user[0]}
                </div>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{bid.user}</span>
                  {bid.isWinning && <TrendingUp className="h-4 w-4 text-accent" />}
                </div>
                <div className="text-xs text-muted-foreground">{bid.time}</div>
              </div>
            </div>
            <div className={`text-right font-semibold ${bid.isWinning ? "text-accent" : "text-foreground"}`}>
              {formatPrice(bid.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
