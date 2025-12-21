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

  const fetchBids = async (isInitial = false) => {
    try {
      const data = await AuctionsAPI.getRecentBids(auctionId, 100)
      
      // CRITICAL: Deduplicate bids từ API trước khi set state
      // Tránh duplicate khi merge với SignalR updates
      const uniqueData = data.filter((bid, index, self) => {
        const duplicateIndex = self.findIndex(
          (b) => b.bidderId === bid.bidderId && 
                 b.amount === bid.amount &&
                 Math.abs(new Date(b.bidTime).getTime() - new Date(bid.bidTime).getTime()) < 1000
        )
        return duplicateIndex === index
      })
      
      if (isInitial) {
        // Initial load: replace toàn bộ
        setBids(uniqueData)
      } else {
        // Periodic refresh: merge với bids hiện tại (ưu tiên bids mới hơn)
        setBids(prev => {
          const bidMap = new Map<string, BidDto>()
          
          // Thêm bids hiện tại vào map
          prev.forEach(bid => {
            const key = `${bid.bidderId}-${bid.amount}-${Math.floor(new Date(bid.bidTime).getTime() / 1000)}`
            const existing = bidMap.get(key)
            if (!existing || new Date(bid.bidTime).getTime() > new Date(existing.bidTime).getTime()) {
              bidMap.set(key, bid)
            }
          })
          
          // Thêm bids mới từ API (sẽ override nếu trùng key)
          uniqueData.forEach(bid => {
            const key = `${bid.bidderId}-${bid.amount}-${Math.floor(new Date(bid.bidTime).getTime() / 1000)}`
            const existing = bidMap.get(key)
            if (!existing || new Date(bid.bidTime).getTime() > new Date(existing.bidTime).getTime()) {
              bidMap.set(key, bid)
            }
          })
          
          // Convert về array và sort
          const merged = Array.from(bidMap.values())
          return merged.sort((a, b) => new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime())
        })
      }
    } catch {
      // ignore
    }
  }

  // Initial fetch
  useEffect(() => {
    let mounted = true
    fetchBids(true).then(() => {
      if (!mounted) return
    })
    return () => {
      mounted = false
    }
  }, [auctionId])

  // Periodic refresh để đảm bảo realtime (fallback nếu SignalR timeout)
  useEffect(() => {
    let isMounted = true
    let intervalId: NodeJS.Timeout | null = null
    
    const refreshBids = async () => {
      // Chỉ refresh khi tab đang active (tránh waste resources)
      if (document.hidden) return
      if (!isMounted) return
      
      await fetchBids(false)
    }
    
    // Refresh mỗi 15 giây để đảm bảo data luôn realtime
    // Interval này là fallback nếu SignalR bị timeout sau 60s
    // Refresh nhanh hơn để đảm bảo không bỏ lỡ bids mới
    intervalId = setInterval(refreshBids, 15000) // 15 seconds
    
    return () => {
      isMounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [auctionId])

  // Subscribe SignalR for live updates
  useEffect(() => {
    let isMounted = true
    const connection = createAuctionHubConnection()
    let started = false
    let isStarting = false
    let reconnectTimeoutId: NodeJS.Timeout | null = null
    let keepAliveInterval: NodeJS.Timeout | null = null

    const start = async () => {
      if (isStarting) return
      try {
        isStarting = true
        await connection.start()
        started = true
        isStarting = false
        await connection.invoke("JoinAuctionGroup", String(auctionId))
        console.log("✅ BidHistory: SignalR connected and joined group", auctionId)
        
        // Start keep-alive ping để đảm bảo connection không bị timeout
        // Với Long Polling, SignalR tự động gửi request mới, nhưng ta vẫn ping để đảm bảo
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval)
        }
        keepAliveInterval = setInterval(async () => {
          if (!isMounted || connection.state !== "Connected") return
          try {
            // Ping để giữ connection alive và đảm bảo vẫn trong group
            // Long Polling sẽ tự động reconnect nếu cần, nhưng ping này đảm bảo chắc chắn
            await connection.invoke("JoinAuctionGroup", String(auctionId))
          } catch (err) {
            console.warn("⚠️ BidHistory: Keep-alive ping failed:", err)
            // Nếu ping fail, có thể connection đã disconnect, sẽ tự reconnect
          }
        }, 90000) // Ping mỗi 90s (trước khi timeout 100s) để đảm bảo connection liên tục
      } catch (e) {
        isStarting = false
        console.error("❌ BidHistory: Failed to start SignalR:", e)
      }
    }

    // Handle connection close - reconnect automatically
    connection.onclose((error) => {
      console.log("🔴 BidHistory: SignalR connection closed", error)
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval)
        keepAliveInterval = null
      }
      if (!isMounted) return
      
      // Try to reconnect after a delay
      reconnectTimeoutId = setTimeout(async () => {
        if (!isMounted) return
        if (connection.state === "Disconnected") {
          console.log("🔄 BidHistory: Attempting to reconnect SignalR...")
          try {
            await start()
          } catch (err) {
            console.error("❌ BidHistory: Reconnection failed:", err)
          }
        }
      }, 2000) // Retry after 2 seconds
    })

    // Handle reconnecting state
    connection.onreconnecting((error) => {
      console.log("🔄 BidHistory: SignalR reconnecting...", error)
    })

    // Handle reconnected state
    connection.onreconnected((connectionId) => {
      console.log("✅ BidHistory: SignalR reconnected:", connectionId)
      if (isMounted) {
        // Rejoin group after reconnection
        connection.invoke("JoinAuctionGroup", String(auctionId)).catch((err) => {
          console.error("❌ BidHistory: Failed to rejoin group after reconnect:", err)
        })
      }
    })

    connection.on("BidPlaced", (payload: BidPlacedPayload) => {
      if (!isMounted) return
      if (payload.auctionId !== auctionId) return
      
      console.log("🔔 BidHistory: BidPlaced event received:", {
        auctionId: payload.auctionId,
        bidderId: payload.placedBid?.bidderId,
        amount: payload.placedBid?.amount,
      })
      
      setBids(prev => {
        // CRITICAL: Kiểm tra duplicate trước khi thêm bid mới
        // Tránh hiển thị cùng một bid nhiều lần (đặc biệt với auto bid)
        const isDuplicate = prev.some(
          (b) => b.bidderId === payload.placedBid.bidderId && 
                 b.amount === payload.placedBid.amount &&
                 Math.abs(new Date(b.bidTime).getTime() - new Date(payload.placedBid.bidTime).getTime()) < 1000
        )
        
        // Nếu đã có bid này rồi, không thêm lại
        if (isDuplicate) {
          console.log("⚠️ BidHistory: Duplicate bid detected, skipping:", {
            bidderId: payload.placedBid.bidderId,
            amount: payload.placedBid.amount,
            bidTime: payload.placedBid.bidTime
          })
          return prev
        }
        
        // Thêm bid mới vào đầu mảng (mới nhất ở đầu)
        const next = [payload.placedBid, ...prev]
        // Giữ tối đa 100 bids mới nhất
        if (next.length > 100) {
          return next.slice(0, 100)
        }
        return next
      })
    })

    // Handle reconnection when tab becomes visible
    const handleVisibilityChange = async () => {
      if (!document.hidden && isMounted) {
        // Tab became visible - ensure connection is active and rejoin group
        try {
          if (connection.state === "Disconnected") {
            console.log("🔄 BidHistory: Tab visible, reconnecting SignalR...")
            await start()
          } else if (connection.state === "Connected") {
            // Connection is active, just rejoin group to be safe
            await connection.invoke("JoinAuctionGroup", String(auctionId)).catch(() => {})
          }
        } catch (err) {
          console.error("❌ BidHistory: Failed to reconnect on visibility change:", err)
        }
      }
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Start connection
    start()

    return () => {
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId)
      }
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval)
      }
      const leaveAndStop = async () => {
        try {
          if (started) {
            await connection.invoke("LeaveAuctionGroup", String(auctionId)).catch(() => {})
            await connection.stop().catch(() => {})
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
    
    // CRITICAL: Deduplicate bids trước khi hiển thị
    // Tránh hiển thị cùng một bid nhiều lần (đặc biệt với auto bid)
    const uniqueBids = bids.filter((bid, index, self) => {
      // Tìm xem có bid nào trùng với bid này không (cùng bidderId, amount, và thời gian gần nhau)
      const duplicateIndex = self.findIndex(
        (b) => b.bidderId === bid.bidderId && 
               b.amount === bid.amount &&
               Math.abs(new Date(b.bidTime).getTime() - new Date(bid.bidTime).getTime()) < 1000
      )
      // Chỉ giữ lại bid đầu tiên (index nhỏ hơn)
      return duplicateIndex === index
    })
    
    // Sắp xếp theo thời gian (mới nhất ở đầu)
    const ordered = [...uniqueBids].sort((a, b) => new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime())
    
    return ordered.map((b, index) => ({
      id: `${b.bidderId}-${b.amount}-${b.bidTime}-${index}`, // Unique key cho React
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
        {rows.map((bid) => (
          <div
            key={bid.id}
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
