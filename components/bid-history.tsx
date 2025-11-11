"use client"

import { useEffect, useMemo, useState } from "react"
import { Avatar } from "@/components/ui/avatar"
import { TrendingUp } from "lucide-react"
import { AuctionsAPI, type BidDto } from "@/lib/api"
import { createAuctionHubConnection, type BidPlacedPayload } from "@/lib/realtime/auctionHub"

interface BidHistoryProps {
  auctionId: number
  currentBid?: number
}

export function BidHistory({ auctionId, currentBid }: BidHistoryProps) {
  const [bids, setBids] = useState<BidDto[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await AuctionsAPI.getRecentBids(auctionId, 100)
        if (!mounted) return
        setBids(data)
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [auctionId])

  // Subscribe SignalR for live updates
  useEffect(() => {
    let isMounted = true
    const connection = createAuctionHubConnection()
    let started = false
    const start = async () => {
      try {
        await connection.start()
        started = true
        await connection.invoke("JoinAuctionGroup", String(auctionId))
      } catch {
        // ignore
      }
    }
    connection.on("BidPlaced", (payload: BidPlacedPayload) => {
      if (!isMounted) return
      if (payload.auctionId !== auctionId) return
      setBids(prev => {
        const next = [...prev, payload.placedBid]
        // keep last 100
        if (next.length > 100) next.shift()
        return next
      })
    })
    start()
    return () => {
      isMounted = false
      const leaveAndStop = async () => {
        try {
          if (started) {
            await connection.invoke("LeaveAuctionGroup", String(auctionId))
            await connection.stop()
          }
        } catch {
          // ignore
        }
      }
      void leaveAndStop()
    }
  }, [auctionId])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const rows = useMemo(() => {
    const latest = (currentBid ?? 0)
    // newest last from API Redis ascending; show newest on top
    const ordered = [...bids].sort((a, b) => new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime())
    return ordered.map(b => ({
      userLabel: b.bidderName && b.bidderName.trim().length > 0 ? b.bidderName : `User #${b.bidderId}`,
      amount: b.amount,
      bidTime: b.bidTime,
      isWinning: b.amount === latest && latest > 0,
    }))
  }, [bids, currentBid])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Người đấu giá</span>
        <span>Giá đặt</span>
      </div>

      <div className="space-y-2">
        {rows.map((bid, index) => (
          <div
            key={`${bid.bidTime}-${bid.amount}-${index}`}
            className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
              bid.isWinning ? "border-accent bg-accent/10" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                  {bid.userLabel.charAt(0)}
                </div>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{bid.userLabel}</span>
                  {bid.isWinning && <TrendingUp className="h-4 w-4 text-accent" />}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(bid.bidTime).toLocaleString("vi-VN")}
                </div>
              </div>
            </div>
            <div className={`text-right font-semibold ${bid.isWinning ? "text-accent" : "text-foreground"}`}>
              {formatPrice(bid.amount)}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-sm text-muted-foreground">Chưa có lịch sử đấu giá</div>
        )}
      </div>
    </div>
  )
}
