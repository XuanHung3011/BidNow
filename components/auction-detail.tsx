"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Clock,
  TrendingUp,
  Users,
  Heart,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Star,
  Award,
  ShoppingBag,
  Loader2,
  Send,
} from "lucide-react"
import { BidHistory } from "@/components/bid-history"
import {
  RealTimePriceChart,
  type PricePoint,
} from "@/components/auction/real-time-price-chart"
import { LiveChat } from "@/components/live-chat"
import { AutoBidDialog } from "@/components/auto-bid-dialog"
import {
  AuctionsAPI,
  FavoriteSellersAPI,
  UsersAPI,
  type AuctionDetailDto,
  type FavoriteSellerResponseDto,
} from "@/lib/api"
import type { BidDto } from "@/lib/api/auctions"
import { useAuth } from "@/lib/auth-context"
import { createAuctionHubConnection, type BidPlacedPayload, type AuctionStatusUpdatedPayload } from "@/lib/realtime/auctionHub"
import { getImageUrls, getImageUrl } from "@/lib/api/config"
import { WatchlistAPI, MessagesAPI } from "@/lib/api"
import { PaymentButton } from "@/components/payment-button"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface AuctionDetailProps {
  auctionId: string
}

export function AuctionDetail({ auctionId }: AuctionDetailProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [timeLeft, setTimeLeft] = useState("")
  const [auctionStatus, setAuctionStatus] = useState<"scheduled" | "active" | "ended" | "paused" | "cancelled">("active")
  const [bidAmount, setBidAmount] = useState("")
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)
  const [isWatching, setIsWatching] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  
  // State cho API data
  const [auction, setAuction] = useState<AuctionDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State cho favorite seller
  const [isFavoriteSeller, setIsFavoriteSeller] = useState(false)
  const [loadingFavorite, setLoadingFavorite] = useState(false)
  const [favoriteMessage, setFavoriteMessage] = useState<string | null>(null)
  //watch list
  const [loadingWatchlist, setLoadingWatchlist] = useState(false)
  const [watchlistMessage, setWatchlistMessage] = useState<string | null>(null)
  const [recentBids, setRecentBids] = useState<BidDto[]>([])
  const [buyNowLoading, setBuyNowLoading] = useState(false)
  const [buyNowMessage, setBuyNowMessage] = useState<string | null>(null)
  const [buyNowError, setBuyNowError] = useState<string | null>(null)
  const [sellerInfo, setSellerInfo] = useState<{ email?: string; reputationScore?: number; totalProducts?: number; avatarUrl?: string } | null>(null)
  const [loadingSellerInfo, setLoadingSellerInfo] = useState(false)

  // Buy now availability: disable if current bid đã vượt giá mua ngay
  const isBuyNowUnavailable = useMemo(() => {
    if (!auction?.buyNowPrice) return false
    const current = auction.currentBid ?? auction.startingBid ?? 0
    return current >= auction.buyNowPrice
  }, [auction?.buyNowPrice, auction?.currentBid, auction?.startingBid])

  const normalizedStatus = useMemo(() => auction?.status?.toLowerCase() ?? "", [auction?.status])
  const isAuctionLocked = useMemo(() => ["paused", "cancelled", "completed"].includes(normalizedStatus), [normalizedStatus])
  const isAuctionEnded = useMemo(() => auctionStatus === "ended" || normalizedStatus === "completed", [auctionStatus, normalizedStatus])

  const handleBuyNow = async () => {
    if (!auction?.buyNowPrice) {
      return
    }
    if (!user) {
      setBuyNowError("Bạn cần đăng nhập để sử dụng mua ngay")
      return
    }
    if (isAuctionLocked) {
      setBuyNowError("Phiên đấu giá đã không còn hoạt động")
      return
    }

    try {
      setBuyNowLoading(true)
      setBuyNowError(null)
      setBuyNowMessage(null)

      const result = await AuctionsAPI.buyNow(Number(auctionId), { buyerId: Number(user.id) })
      setBuyNowMessage("Mua ngay thành công! Chúng tôi đã kết thúc phiên đấu giá.")

      setAuction((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          status: result.status,
          currentBid: result.finalPrice ?? prev.currentBid,
          winnerId: result.winnerId ?? prev.winnerId,
          winnerName:
            result.winnerId && result.winnerId === Number(user.id)
              ? user.name ?? user.email ?? "Bạn"
              : prev.winnerName,
        }
      })
    } catch (err: any) {
      setBuyNowError(err.message || "Không thể mua ngay")
    } finally {
      setBuyNowLoading(false)
    }
  }


  // Fetch auction detail (kèm userId để backend log view cho AI recommend)

  // Fetch auction detail
  const fetchAuction = async () => {
    try {
      setLoading(true)
      const data = await AuctionsAPI.getDetail(Number(auctionId))
      setAuction(data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch auction:', err)
      setError(err.message || 'Không thể tải thông tin đấu giá')
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    let mounted = true
    
    const loadAuction = async () => {
      try {
        setLoading(true)
        const data = await AuctionsAPI.getDetail(
          Number(auctionId),
          user?.id ? Number(user.id) : undefined
        )
        
        if (!mounted) return
        setAuction(data)
        setError(null)
      } catch (err: any) {
        if (!mounted) return
        console.error('Failed to fetch auction:', err)
        setError(err.message || 'Không thể tải thông tin đấu giá')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    fetchAuction()
    
    loadAuction()
    
    return () => { mounted = false }
  }, [auctionId, user?.id])

  useEffect(() => {
    setBuyNowError(null)
    setBuyNowMessage(null)
  }, [auctionId])
  
  // SignalR: subscribe to BidPlaced and update UI in real-time
  useEffect(() => {
    let isMounted = true
    const connection = createAuctionHubConnection()
    let started = false
    let isStarting = false

    const start = async () => {
      try {
        isStarting = true
        await connection.start()
        started = true
        isStarting = false
        await connection.invoke("JoinAuctionGroup", String(auctionId))
      } catch (e) {
        isStarting = false
        // ignore transient connection errors
      }
    }

    // Handle reconnection when tab becomes visible again
    const handleVisibilityChange = async () => {
      if (!document.hidden && isMounted) {
        // Tab became visible - ensure connection is active and rejoin group
        try {
          if (connection.state === "Disconnected") {
            console.log("🔄 Tab visible, reconnecting SignalR...")
            await connection.start()
            await connection.invoke("JoinAuctionGroup", String(auctionId))
          } else if (connection.state === "Connected") {
            // Connection is active, just rejoin group to be safe
            await connection.invoke("JoinAuctionGroup", String(auctionId)).catch(() => {})
          }
        } catch (err) {
          console.error("Failed to reconnect SignalR on visibility change:", err)
        }
      }
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    connection.on("BidPlaced", (payload: BidPlacedPayload) => {
      if (!isMounted) return
      if (payload.auctionId !== Number(auctionId)) return
      
      console.log("🔔 BidPlaced event received:", {
        auctionId: payload.auctionId,
        currentBid: payload.currentBid,
        bidCount: payload.bidCount,
        bidderId: payload.placedBid?.bidderId,
        amount: payload.placedBid?.amount
      })
      
      // CRITICAL: Update "Giá hiện tại" ngay lập tức với giá bid mới nhất
      // Ưu tiên payload.placedBid.amount (giá bid mới) hoặc payload.currentBid
      setAuction((prev) => {
        if (!prev) return prev

        // Dùng giá hiện tại với fallback về startingBid (tránh undefined)
        const prevCurrent = prev.currentBid ?? prev.startingBid ?? 0
        
        // CRITICAL: Ưu tiên payload.placedBid.amount (giá bid mới nhất) để update ngay lập tức
        // Nếu không có, dùng payload.currentBid
        const newBidAmount = payload.placedBid?.amount ?? payload.currentBid ?? prevCurrent
        const newBidCount = payload.bidCount ?? prev.bidCount ?? 0

        // Update ngay nếu:
        // 1. Giá bid mới >= giá hiện tại (bid hợp lệ)
        // 2. Hoặc bidCount tăng (có bid mới)
        if (newBidAmount >= prevCurrent || newBidCount > (prev.bidCount ?? 0)) {
          console.log("✅ Updating auction currentBid immediately:", {
            oldBid: prevCurrent,
            newBid: newBidAmount,
            placedBidAmount: payload.placedBid?.amount,
            payloadCurrentBid: payload.currentBid,
            oldBidCount: prev.bidCount,
            newBidCount: newBidCount
          })
          return {
            ...prev,
            // CRITICAL: Dùng giá bid mới nhất để update ngay lập tức
            currentBid: Math.max(prevCurrent, newBidAmount),
            bidCount: newBidCount,
          }
        }
        // Nếu giá mới thấp hơn, có thể là update cũ đến muộn, bỏ qua
        console.log("⚠️ Ignoring older bid:", {
          prevCurrent,
          newBidAmount: newBidAmount
        })
        return prev
      })
      
      // Luôn thêm bid mới vào history (để track tất cả bids)
      // CRITICAL: Update recentBids để chart "Biểu đồ giá trực tuyến" và "Bảng giao dịch" real-time
      setRecentBids((prev) => {
        // Kiểm tra xem bid này đã có chưa (tránh duplicate)
        const isDuplicate = prev.some(
          (b) => b.bidderId === payload.placedBid.bidderId && 
                 b.amount === payload.placedBid.amount &&
                 Math.abs(new Date(b.bidTime).getTime() - new Date(payload.placedBid.bidTime).getTime()) < 1000
        )
        if (isDuplicate) {
          console.log("⚠️ Duplicate bid in recentBids, skipping:", {
            bidderId: payload.placedBid.bidderId,
            amount: payload.placedBid.amount,
            bidTime: payload.placedBid.bidTime
          })
          return prev
        }
        
        console.log("✅ Adding new bid to recentBids:", {
          bidderId: payload.placedBid.bidderId,
          amount: payload.placedBid.amount,
          bidTime: payload.placedBid.bidTime
        })
        
        const next: BidDto[] = [
          ...prev,
          {
            bidderId: payload.placedBid.bidderId,
            amount: payload.placedBid.amount,
            bidTime: payload.placedBid.bidTime,
            // bidderName sẽ được fetch từ API khi cần
          },
        ]
        // Sắp xếp theo thời gian và lấy 120 bid mới nhất
        return next
          .sort((a, b) => new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime())
          .slice(0, 120)
      })
    })

    // Listen for auction status updates (pause/resume/completed)
    connection.on("AuctionStatusUpdated", async (payload: AuctionStatusUpdatedPayload) => {
      if (!isMounted) return
      if (payload.auctionId !== Number(auctionId)) return
      
      console.log("🔔 AuctionStatusUpdated event received:", payload)
      
      const normalizedStatus = payload.status?.toLowerCase() ?? ""
      
      // CRITICAL: Update auctionStatus state immediately để UI cập nhật realtime
      if (normalizedStatus === "paused") {
        setAuctionStatus("paused")
      } else if (normalizedStatus === "cancelled") {
        setAuctionStatus("cancelled")
      } else if (normalizedStatus === "completed") {
        setAuctionStatus("ended")
      } else if (normalizedStatus === "active") {
        setAuctionStatus("active")
      }
      
      // CRITICAL: Chỉ update status và winnerId, KHÔNG refresh toàn bộ để tránh mất giá mới từ auto bid
      setAuction((prev) => {
        if (!prev) return prev
        
        // If auction is completed, update winnerId and status immediately from payload
        if (payload.status === "completed" && payload.winnerId) {
          return {
            ...prev,
            status: "completed",
            winnerId: payload.winnerId,
            // Chỉ update finalPrice nếu >= giá hiện tại (tránh override giá mới)
            currentBid: payload.finalPrice && payload.finalPrice >= (prev.currentBid ?? prev.startingBid) 
              ? payload.finalPrice 
              : prev.currentBid
          }
        }
        
        // Chỉ update status, giữ nguyên currentBid và bidCount
        return {
          ...prev,
          status: payload.status ?? prev.status
        }
      })
      
      // CHỈ refresh auction data khi status thay đổi sang completed/paused/cancelled
      // KHÔNG refresh khi status vẫn là "active" để tránh mất giá mới từ auto bid
      if (payload.status === "completed" || payload.status === "paused" || payload.status === "cancelled") {
        try {
          const data = await AuctionsAPI.getDetail(Number(auctionId))
          if (!isMounted) return
          // Merge với state hiện tại, ưu tiên giá cao hơn
          setAuction((prev) => {
            if (!prev) return data
            const prevCurrent = prev.currentBid ?? prev.startingBid
            const dataCurrent = data.currentBid ?? data.startingBid
            return {
              ...data,
              // Giữ giá cao hơn nếu có
              currentBid: Math.max(prevCurrent, dataCurrent)
            }
          })
        } catch (err) {
          console.error('Failed to refresh auction after status update:', err)
        }
      }
    })

    start()

    return () => {
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      connection.off("BidPlaced")
      connection.off("AuctionStatusUpdated")
      const leaveAndStop = async () => {
        try {
          // If connection is still starting, wait for it to complete or fail
          if (isStarting) {
            const maxWait = 2000
            const startTime = Date.now()
            while (isStarting && (Date.now() - startTime) < maxWait) {
              await new Promise((resolve) => setTimeout(resolve, 100))
            }
          }
          
          // Try to leave group if connection was started
          if (started && connection) {
            await connection.invoke("LeaveAuctionGroup", String(auctionId)).catch(() => {})
          }
          
          // Stop connection - ignore all errors silently
          if (connection) {
            await connection.stop().catch(() => {
              // Silently ignore all errors
            })
          }
        } catch {
          // Ignore all errors silently
        }
      }
      void leaveAndStop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, auction?.id])

  // Handle tab visibility change - refresh when tab becomes active again
  useEffect(() => {
    if (!auction?.id) return
    if (isAuctionEnded || isAuctionLocked) return

    const handleVisibilityChange = async () => {
      // Khi tab trở lại active, refresh auction data để sync lại
      if (!document.hidden) {
        console.log("🔄 Tab became visible, refreshing auction data...")
        try {
          const data = await AuctionsAPI.getDetail(Number(auctionId))
          setAuction((prev) => {
            if (!prev) return data
            const prevCurrent = prev.currentBid ?? prev.startingBid ?? 0
            const dataCurrent = data.currentBid ?? data.startingBid ?? 0
            return {
              ...data,
              // Luôn lấy giá cao hơn để đảm bảo sync đúng
              currentBid: Math.max(prevCurrent, dataCurrent),
              bidCount: Math.max(prev.bidCount ?? 0, data.bidCount ?? 0),
            }
          })
        } catch (err) {
          console.error('Failed to refresh auction on visibility change:', err)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [auction?.id, auctionId, isAuctionEnded, isAuctionLocked])

  // Periodic refresh cho giá tiền để đảm bảo realtime (fallback nếu SignalR miss)
  useEffect(() => {
    if (!auction?.id) return
    if (isAuctionEnded || isAuctionLocked) return // Không refresh nếu auction đã kết thúc hoặc bị khóa
    
    let isMounted = true
    let intervalId: NodeJS.Timeout | null = null
    
    const refreshPrice = async () => {
      // Chỉ refresh khi tab đang active (tránh waste resources khi tab không active)
      if (document.hidden) return
      
      try {
        // Chỉ fetch giá hiện tại từ API (nhẹ hơn fetch toàn bộ auction)
        const data = await AuctionsAPI.getDetail(Number(auctionId))
        if (!isMounted) return
        
        // Chỉ update giá nếu giá mới >= giá hiện tại (tránh override giá mới từ SignalR)
        setAuction((prev) => {
          if (!prev) return data
          const prevCurrent = prev.currentBid ?? prev.startingBid ?? 0
          const dataCurrent = data.currentBid ?? data.startingBid ?? 0
          
          // Chỉ update nếu giá mới >= giá hiện tại hoặc status thay đổi
          if (dataCurrent >= prevCurrent || data.status !== prev.status) {
            return {
              ...prev,
              currentBid: Math.max(prevCurrent, dataCurrent),
              bidCount: data.bidCount ?? prev.bidCount,
              status: data.status ?? prev.status
            }
          }
          return prev
        })
      } catch (err) {
        console.error('Failed to refresh price:', err)
      }
    }
    
    // Refresh mỗi 5 giây để đảm bảo giá luôn realtime
    intervalId = setInterval(refreshPrice, 5000)
    
    return () => {
      isMounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [auction?.id, auctionId, isAuctionEnded, isAuctionLocked])

  // Fetch auction data (initial load)
  useEffect(() => {
    if (auctionId) {
      fetchAuction()
    }
  }, [auctionId])

  // Periodic refresh cho auction data để đảm bảo "Bảng giao dịch" luôn real-time (fallback nếu SignalR disconnect)
  useEffect(() => {
    let isMounted = true
    let intervalId: NodeJS.Timeout | null = null
    
    const refreshAuction = async () => {
      // Chỉ refresh khi tab đang active (tránh waste resources)
      if (document.hidden) return
      if (!isMounted) return
      if (!auctionId) return
      
      try {
        const data = await AuctionsAPI.getDetail(Number(auctionId), user?.id ? Number(user.id) : undefined)
        if (!isMounted) return
        
        // CRITICAL: Merge với auction hiện tại, ưu tiên giá cao hơn (tránh race condition)
        setAuction((prev) => {
          if (!prev) return data
          
          const prevCurrent = prev.currentBid ?? prev.startingBid ?? 0
          const dataCurrent = data.currentBid ?? data.startingBid ?? 0
          
          // Chỉ update nếu giá mới >= giá hiện tại hoặc bidCount tăng
          if (dataCurrent >= prevCurrent || (data.bidCount ?? 0) > (prev.bidCount ?? 0)) {
            console.log("✅ Periodic refresh: Updated auction data", {
              oldBid: prevCurrent,
              newBid: dataCurrent,
              oldBidCount: prev.bidCount,
              newBidCount: data.bidCount
            })
            return {
              ...data,
              // Luôn lấy giá cao hơn để tránh rollback
              currentBid: Math.max(prevCurrent, dataCurrent)
            }
          }
          return prev
        })
      } catch (err) {
        console.error("Error refreshing auction data:", err)
      }
    }
    
    // Refresh mỗi 15 giây để đảm bảo "Bảng giao dịch" luôn real-time
    // Interval này là fallback nếu SignalR bị disconnect
    intervalId = setInterval(refreshAuction, 15000) // 15 seconds
    
    return () => {
      isMounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [auctionId])

  // Fetch recent bid timeline for chart/ticker
  useEffect(() => {
    let active = true
    const fetchRecentBids = async () => {
      try {
        const data = await AuctionsAPI.getRecentBids(Number(auctionId), 120)
        if (!active) return
        setRecentBids(data)
        console.log("✅ Fetched recentBids for chart:", data.length, "bids")
      } catch (err) {
        console.error("Không thể tải lịch sử đấu giá gần đây", err)
      }
    }
    if (auctionId) {
      void fetchRecentBids()
    }
    return () => {
      active = false
    }
  }, [auctionId])

  // Periodic refresh cho recentBids để đảm bảo chart real-time (fallback nếu SignalR timeout)
  useEffect(() => {
    let isMounted = true
    let intervalId: NodeJS.Timeout | null = null
    
    const refreshRecentBids = async () => {
      // Chỉ refresh khi tab đang active (tránh waste resources)
      if (document.hidden) return
      if (!isMounted) return
      if (!auctionId) return
      
      try {
        const data = await AuctionsAPI.getRecentBids(Number(auctionId), 120)
        if (!isMounted) return
        
        // Merge với bids hiện tại (ưu tiên bids mới hơn)
        setRecentBids(prev => {
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
          data.forEach(bid => {
            const key = `${bid.bidderId}-${bid.amount}-${Math.floor(new Date(bid.bidTime).getTime() / 1000)}`
            const existing = bidMap.get(key)
            if (!existing || new Date(bid.bidTime).getTime() > new Date(existing.bidTime).getTime()) {
              bidMap.set(key, bid)
            }
          })
          
          // Convert về array và sort
          const merged = Array.from(bidMap.values())
          return merged.sort((a, b) => new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime()).slice(0, 120)
        })
      } catch (err) {
        console.error("Error refreshing recentBids:", err)
      }
    }
    
    // Refresh mỗi 15 giây để đảm bảo chart luôn real-time
    // Interval này là fallback nếu SignalR bị timeout sau 60s
    intervalId = setInterval(refreshRecentBids, 15000) // 15 seconds
    
    return () => {
      isMounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [auctionId])

  // Check if seller is favorite
  useEffect(() => {
    if (!auction?.sellerId) return
    // Chỉ check favorite nếu user đã đăng nhập
    if (!user?.id) {
      setIsFavoriteSeller(false)
      return
    }
    
    let mounted = true
    const checkFavorite = async () => {
      try {
        const isFav = await FavoriteSellersAPI.checkIsFavorite(auction.sellerId)
        if (!mounted) return
        setIsFavoriteSeller(isFav)
      } catch (err) {
        // Không log lỗi nếu user chưa đăng nhập (đã được xử lý ở trên)
        if (!mounted) return
        setIsFavoriteSeller(false)
      }
    }
    
    checkFavorite()
    return () => { mounted = false }
  }, [auction?.sellerId, user?.id])

  // Fetch seller info (email, reputationScore, totalProducts, avatarUrl)
  useEffect(() => {
    if (!auction?.sellerId) return

    const fetchSellerInfo = async () => {
      setLoadingSellerInfo(true)
      try {
        // Fetch seller user data
        const sellerUser = await UsersAPI.getById(auction.sellerId)
        
        // Fetch seller auctions to count total products
        const sellerAuctions = await AuctionsAPI.getBySeller(auction.sellerId)
        
        setSellerInfo({
          email: sellerUser.email,
          reputationScore: sellerUser.reputationScore ?? undefined,
          totalProducts: sellerAuctions.length,
          avatarUrl: sellerUser.avatarUrl ?? undefined,
        })
      } catch (error) {
        console.error("Failed to fetch seller info:", error)
      } finally {
        setLoadingSellerInfo(false)
      }
    }

    fetchSellerInfo()
  }, [auction?.sellerId])

  // 3. USEEFFECT - Thêm useEffect mới để check watchlist
  useEffect(() => {
    if (!user?.id || !auctionId) return

    let mounted = true
    const checkWatchlist = async () => {
      try {
        // Add timeout to prevent blocking
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), 5000) // 5 second timeout
        })
        
        const checkPromise = WatchlistAPI.checkExists(Number(user.id), Number(auctionId))
        const exists = await Promise.race([checkPromise, timeoutPromise])
        
        if (!mounted) return
        setIsWatching(exists)
      } catch (err) {
        // Silently fail - 404 is expected if item not in watchlist
        if (!mounted) return
        setIsWatching(false)
      }
    }

    checkWatchlist()
    return () => { mounted = false }
  }, [user?.id, auctionId])
  
  // Update countdown timer
  useEffect(() => {
    if (!auction) return

    const normalizedStatus = auction.status?.toLowerCase() ?? ""

    // Nếu auction bị tạm dừng, dừng timer và hiển thị thời gian tạm dừng
    if (normalizedStatus === "paused") {
      setAuctionStatus("paused")
      if (auction.pausedAt) {
        const pausedDate = new Date(auction.pausedAt)
        const pausedTime = pausedDate.toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        setTimeLeft(`Tạm dừng từ ${pausedTime}`)
      } else {
        setTimeLeft("Đã tạm dừng")
      }
      return
    }

    // Nếu auction đã bị hủy, dừng timer và hiển thị trạng thái hủy
    if (normalizedStatus === "cancelled") {
      setAuctionStatus("cancelled")
      setTimeLeft("Đã hủy")
      return
    }

    const updateTimer = () => {
      const now = new Date().getTime()
      const startTime = new Date(auction.startTime).getTime()
      const endTime = new Date(auction.endTime).getTime()

      // Nếu auction chưa bắt đầu (scheduled), đếm ngược đến StartTime
      if (startTime > now) {
        setAuctionStatus("scheduled")
        const distance = startTime - now
        const hours = Math.floor(distance / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)
        setTimeLeft(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
        return
      }

      // Nếu auction đã bắt đầu, đếm ngược đến EndTime
      const distance = endTime - now

      if (distance < 0) {
        setTimeLeft("Đã kết thúc")
        setAuctionStatus("ended")
        return
      }

      setAuctionStatus("active")
      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [auction])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Tính bước nhảy giá dựa trên giá hiện tại (tham khảo từ bảng bid increment)
  const calculateBidIncrement = (currentPrice: number): number => {
    if (currentPrice < 25000) {
      // 0 - 24,999 VND: 1,250 VND (tương đương $0.05)
      return 1250
    } else if (currentPrice < 125000) {
      // 25,000 - 124,999 VND: 6,250 VND (tương đương $0.25)
      return 6250
    } else if (currentPrice < 625000) {
      // 125,000 - 624,999 VND: 12,500 VND (tương đương $0.50)
      return 12500
    } else if (currentPrice < 2500000) {
      // 625,000 - 2,499,999 VND: 25,000 VND (tương đương $1.00)
      return 25000
    } else if (currentPrice < 6250000) {
      // 2,500,000 - 6,249,999 VND: 62,500 VND (tương đương $2.50)
      return 62500
    } else if (currentPrice < 12500000) {
      // 6,250,000 - 12,499,999 VND: 125,000 VND (tương đương $5.00)
      return 125000
    } else if (currentPrice < 25000000) {
      // 12,500,000 - 24,999,999 VND: 250,000 VND (tương đương $10.00)
      return 250000
    } else if (currentPrice < 62500000) {
      // 25,000,000 - 62,499,999 VND: 625,000 VND (tương đương $25.00)
      return 625000
    } else if (currentPrice < 125000000) {
      // 62,500,000 - 124,999,999 VND: 1,250,000 VND (tương đương $50.00)
      return 1250000
    } else {
      // 125,000,000+ VND: 2,500,000 VND (tương đương $100.00)
      return 2500000
    }
  }

  // Toggle favorite seller
  const toggleFavoriteSeller = async () => {
    if (!auction?.sellerId) return
    
    // Kiểm tra đăng nhập trước
    if (!user?.id) {
      setFavoriteMessage("Vui lòng đăng nhập để theo dõi người bán")
      setTimeout(() => setFavoriteMessage(null), 3000)
      return
    }
    
    setLoadingFavorite(true)
    setFavoriteMessage(null)
    
    try {
      let result: FavoriteSellerResponseDto
      
      if (isFavoriteSeller) {
        // Nếu đã yêu thích -> XÓA
        result = await FavoriteSellersAPI.removeFavorite(auction.sellerId)
        if (result.success) {
          setIsFavoriteSeller(false)
        }
      } else {
        // Nếu chưa yêu thích -> THÊM
        result = await FavoriteSellersAPI.addFavorite(auction.sellerId)
        if (result.success) {
          setIsFavoriteSeller(true)
        }
      }
      
      // Luôn hiển thị message từ API
      setFavoriteMessage(result.message)
      setTimeout(() => setFavoriteMessage(null), 3000)
      
    } catch (err: any) {
      // Không log vào console, chỉ hiển thị message cho user
      setFavoriteMessage(err.message || "Không thể thực hiện thao tác. Vui lòng đăng nhập.")
      setTimeout(() => setFavoriteMessage(null), 3000)
    } finally {
      setLoadingFavorite(false)
    }
  }

  const formatBidderAlias = (bidderId: number, bidderName?: string) => bidderName || `Người #${bidderId}`

  const priceSeries: PricePoint[] = useMemo(() => {
    if (!auction) return []
    const orderedBids = [...recentBids].sort(
      (a, b) => new Date(a.bidTime).getTime() - new Date(b.bidTime).getTime(),
    )
    const points: PricePoint[] = [
      {
        sequence: 1,
        price: auction.startingBid,
        label: "Giá khởi điểm",
        bidder: undefined,
        timeLabel: new Date(auction.startTime).toLocaleTimeString("vi-VN"),
      },
    ]
    orderedBids.forEach((bid, idx) => {
      points.push({
        sequence: idx + 2,
        price: bid.amount,
        label: formatBidderAlias(bid.bidderId, bid.bidderName),
        bidder: formatBidderAlias(bid.bidderId, bid.bidderName),
        timeLabel: new Date(bid.bidTime).toLocaleTimeString("vi-VN"),
      })
    })
    return points
  }, [auction, recentBids])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error || !auction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error || 'Không tìm thấy thông tin đấu giá'}</p>
        <Button onClick={() => window.location.reload()}>Thử lại</Button>
      </div>
    )
  }

  //  FUNCTION - Thêm function toggleWatchlist
  const toggleWatchlist = async () => {
    if (!user?.id) {
      setWatchlistMessage("Vui lòng đăng nhập để thêm vào danh sách theo dõi")
      setTimeout(() => setWatchlistMessage(null), 3000)
      return
    }

    setLoadingWatchlist(true)
    setWatchlistMessage(null)

    try {
      const request = {
        userId: Number(user.id),
        auctionId: Number(auctionId)
      }

      let result: { message: string }

      if (isWatching) {
        result = await WatchlistAPI.remove(request)
        setIsWatching(false)
      } else {
        result = await WatchlistAPI.add(request)
        setIsWatching(true)
      }

      setWatchlistMessage(result.message)
      setTimeout(() => setWatchlistMessage(null), 3000)

    } catch (err: any) {
      console.error('Toggle watchlist error:', err)
      setWatchlistMessage(err.message || "Không thể thực hiện thao tác")
      setTimeout(() => setWatchlistMessage(null), 3000)
    } finally {
      setLoadingWatchlist(false)
    }
  }


  // Parse images từ comma-separated string và tạo URLs đầy đủ
  const images = getImageUrls(auction.itemImages)

  const currentPrice = auction.currentBid || auction.startingBid
  const minIncrement = calculateBidIncrement(currentPrice)
  const suggestedBid = currentPrice + minIncrement

  const priceDeltaValue = auction.currentBid ? auction.currentBid - auction.startingBid : 0
  const priceDeltaPercent =
    auction.currentBid && auction.startingBid ? (priceDeltaValue / auction.startingBid) * 100 : 0
  
  // Lấy thông tin seller từ auction
  const seller = {
    id: auction.sellerId,
    name: auction.sellerName || `User #${auction.sellerId}`,
    rating: auction.sellerTotalRatings && auction.sellerTotalRatings > 0 ? 4.8 : 0, // Default rating, TODO: Lấy từ API
    totalRatings: auction.sellerTotalRatings || 0,
    totalSales: 0, // TODO: Lấy từ API nếu có
    joinDate: "Không rõ", // TODO: Lấy từ API nếu có
    responseRate: 98, // TODO: Lấy từ API nếu có
    responseTime: "Trong vòng 2 giờ", // TODO: Lấy từ API nếu có
  }

  return (
    <div className="space-y-10 py-6">
      <div className="space-y-10 px-4 sm:px-6 lg:px-8">
        <section>
          <Card className="overflow-hidden border-border bg-card">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {auction.status?.toLowerCase() === "paused" ? (
                      <Badge className="bg-orange-500 text-white">Đã tạm dừng</Badge>
                    ) : auction.status?.toLowerCase() === "cancelled" ? (
                      <Badge className="bg-gray-500 text-white">Đã hủy</Badge>
                    ) : (
                      <Badge className="bg-primary text-primary-foreground">Đang mở</Badge>
                    )}
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{auction.categoryName || "Danh mục"}</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold leading-tight text-foreground lg:text-4xl">{auction.itemTitle}</h1>
                    {/* <p className="mt-1 text-sm text-muted-foreground">{auction.status}</p> */}
                  </div>
                  {auction.status?.toLowerCase() === "paused" && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-orange-900">Phiên đấu giá đang tạm dừng</p>
                          <p className="mt-1 text-sm text-orange-700">
                            Phiên đấu giá này đã bị tạm dừng bởi quản trị viên. Bạn không thể đặt giá trong thời gian này.
                            {auction.pausedAt && (
                              <span className="block mt-1">
                                Thời gian tạm dừng: {new Date(auction.pausedAt).toLocaleString("vi-VN")}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {auction.status?.toLowerCase() === "cancelled" && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                        <div>
                          <p className="font-semibold text-red-900">Phiên đấu giá đã bị hủy</p>
                          <p className="mt-1 text-sm text-red-700">
                            Phiên đấu giá này đã bị hủy bởi quản trị viên hoặc hệ thống. Bạn không thể tiếp tục đặt giá cho phiên này.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Giá hiện tại</p>
                    <p className="text-lg font-bold text-primary lg:text-xl">{formatPrice(auction.currentBid || auction.startingBid)}</p>
                    <p className={`text-xs font-medium ${priceDeltaValue >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {priceDeltaValue >= 0 ? "↑" : "↓"} {Math.abs(priceDeltaPercent).toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Trạng thái</p>
                    <Badge 
                      variant={
                        auctionStatus === "scheduled" ? "secondary" :
                        auctionStatus === "active" ? "default" :
                        auctionStatus === "paused" ? "destructive" :
                        auctionStatus === "cancelled" ? "destructive" :
                        "outline"
                      }
                      className={
                        auctionStatus === "scheduled" ? "bg-blue-500 text-white" :
                        auctionStatus === "active" ? "bg-green-500 text-white" :
                        auctionStatus === "paused" ? "bg-orange-500 text-white" :
                        auctionStatus === "cancelled" ? "bg-gray-500 text-white" :
                        "bg-gray-500 text-white"
                      }
                    >
                      {auctionStatus === "scheduled" ? "Sắp diễn ra" :
                       auctionStatus === "active" ? "Đang diễn ra" :
                       auctionStatus === "paused" ? "Đã tạm dừng" :
                       auctionStatus === "cancelled" ? "Đã hủy" :
                       "Đã kết thúc"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {auctionStatus === "scheduled" ? "Phiên đấu giá sẽ bắt đầu sau" : "Thời gian còn lại"}
                    </p>
                    <p className="text-lg font-semibold text-foreground lg:text-xl">{timeLeft}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Lượt đấu giá</p>
                    <p className="text-lg font-semibold text-foreground lg:text-xl">{auction.bidCount ?? 0}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted/50">
                  <Image
                    src={images[selectedImage] || "/placeholder.svg"}
                    alt={auction.itemTitle}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImage === index ? "border-primary ring-2 ring-primary/20" : "border-border opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image src={image || "/placeholder.svg"} alt={`Thumb ${index + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={toggleWatchlist}
                  disabled={loadingWatchlist}
                  className={`w-full ${isWatching ? "bg-accent text-accent-foreground" : ""}`}
                >
                  {loadingWatchlist ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${isWatching ? "fill-accent text-accent" : ""}`} />}
                  <span className="ml-2">{isWatching ? "Đang theo dõi" : "Theo dõi phiên này"}</span>
                </Button>
                {watchlistMessage && (
                  <div
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      watchlistMessage.toLowerCase().includes("không")
                        ? "bg-red-50 border-red-200 text-red-800"
                        : "bg-green-50 border-green-200 text-green-800"
                    }`}
                  >
                    {watchlistMessage}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px_360px]">
          <Card className="min-w-0 border border-border bg-card p-6 shadow-lg">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Market Pulse</p>
                <h3 className="text-2xl font-bold text-foreground">Biểu đồ giá trực tuyến</h3>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                {["1D", "7D", "1M", "1Y"].map((label) => (
                  <span
                    key={label}
                    className={`rounded-full px-3 py-1 ${label === "1D" ? "bg-primary/20 text-primary" : "bg-muted"}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6 mb-8 rounded-xl bg-muted/20 p-3 pb-8">
              <RealTimePriceChart
                data={priceSeries}
                startingBid={auction.startingBid}
                currentBid={auction.currentBid || auction.startingBid}
                buyNowPrice={auction.buyNowPrice}
              />
            </div>
          </Card>

          <Card className={`border border-border bg-card p-6 shadow-lg ${isAuctionEnded ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Đặt giá</p>
                  <h3 className="text-2xl font-semibold text-foreground">Bảng giao dịch</h3>
                </div>
                <div className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">Realtime</div>
              </div>
              {isAuctionEnded && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Phiên đấu giá đã kết thúc</AlertTitle>
                  <AlertDescription>
                    Phiên đấu giá này đã kết thúc. Bạn không thể đặt giá nữa.
                  </AlertDescription>
                </Alert>
              )}
              <div className={`mt-6 space-y-4 ${isAuctionEnded ? "pointer-events-none" : ""}`}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Giá hiện tại</span>
              <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{formatPrice(auction.currentBid || auction.startingBid)}</p>
                    <p className={`${priceDeltaValue >= 0 ? "text-emerald-600" : "text-rose-600"} text-xs font-semibold`}>
                      {priceDeltaValue >= 0 ? "+" : "-"}
                      {Math.abs(priceDeltaPercent).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border bg-muted/50 p-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Giá khởi điểm</p>
                    <p className="text-lg font-semibold text-foreground">{formatPrice(auction.startingBid)}</p>
                  </div>
            {auction.buyNowPrice && (
                    <div className="rounded-xl border border-border bg-muted/50 p-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Giá mua ngay</p>
                      <p className="text-lg font-semibold text-foreground">{formatPrice(auction.buyNowPrice)}</p>
              </div>
            )}
            </div>
                <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">3 bước đặt giá nhanh</p>
                  <ol className="space-y-1">
                    <li>1. Nhập mức giá bạn muốn đấu.</li>
                    <li>2. Kiểm tra thời gian & vị thế.</li>
                    <li>3. Nhấn "Đặt giá" để xác nhận.</li>
                  </ol>
          </div>
              <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Tối thiểu ${formatPrice(suggestedBid)}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="flex-1"
                disabled={isAuctionEnded || ["paused", "cancelled"].includes(auction.status?.toLowerCase() ?? "")}
              />
              <Button 
                disabled={isAuctionEnded || placing || !user || ["paused", "cancelled"].includes(auction.status?.toLowerCase() ?? "")}
                onClick={async () => {
                  if (!auction) return
                  setPlaceError(null)
                  
                  // Kiểm tra nếu phiên đấu giá đã kết thúc
                  if (isAuctionEnded || normalizedStatus === "completed") {
                    setPlaceError("Phiên đấu giá đã kết thúc. Bạn không thể đặt giá nữa.")
                    return
                  }
                  
                  const amount = Number(bidAmount)
                        if (!amount || isNaN(amount)) {
                          setPlaceError("Vui lòng nhập số hợp lệ")
                          return
                        }
                        if (amount < suggestedBid) {
                          setPlaceError(`Giá tối thiểu ${formatPrice(suggestedBid)}`)
                          return
                        }
                        if (!user) {
                          setPlaceError("Bạn cần đăng nhập để đặt giá")
                          return
                        }
                  try {
                    setPlacing(true)
                    const res = await AuctionsAPI.placeBid(Number(auctionId), { bidderId: Number(user.id), amount })
                    // CRITICAL: Chỉ update nếu giá từ API >= giá hiện tại (tránh override giá mới từ auto bid)
                    // SignalR BidPlaced event sẽ handle real-time updates, API response chỉ là fallback
                    setAuction((prev) => {
                      if (!prev) return prev
                      const prevCurrent = prev.currentBid ?? prev.startingBid
                      // Chỉ update nếu giá từ API >= giá hiện tại (tránh race condition với auto bid)
                      if (res.currentBid >= prevCurrent) {
                        return {
                          ...prev,
                          currentBid: res.currentBid,
                          bidCount: res.bidCount,
                        }
                      }
                      // Nếu giá từ API thấp hơn, giữ nguyên giá hiện tại (có thể đã bị auto bid vượt)
                      return prev
                    })
                    setBidAmount("")
                  } catch (err: any) {
                    // Cải thiện thông báo lỗi từ backend
                    const errorMessage = err.message || "Đặt giá thất bại"
                    if (errorMessage.includes("not active") || errorMessage.includes("ended")) {
                      setPlaceError("Phiên đấu giá đã kết thúc hoặc không còn hoạt động.")
                    } else {
                      setPlaceError(errorMessage)
                    }
                  } finally {
                    setPlacing(false)
                  }
                }}
              >
                {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đặt giá"}
              </Button>
            </div>
            {placeError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lỗi đặt giá</AlertTitle>
                <AlertDescription>{placeError}</AlertDescription>
              </Alert>
            )}
                  {auction.buyNowPrice && (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="default"
                      className={`w-full ${isBuyNowUnavailable ? "bg-muted text-muted-foreground border-muted pointer-events-none" : ""}`}
                        disabled={
                          buyNowLoading ||
                          !user ||
                          isAuctionLocked ||
                        auctionStatus !== "active" ||
                        isBuyNowUnavailable
                        }
                        onClick={handleBuyNow}
                      >
                        {buyNowLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingBag className="mr-2 h-4 w-4" />
                        )}
                        Mua ngay với giá {formatPrice(auction.buyNowPrice)}
                      </Button>
                      {buyNowMessage && (
                        <Alert className="border-emerald-200 bg-emerald-50">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <AlertTitle className="text-emerald-900">Thành công</AlertTitle>
                          <AlertDescription className="text-emerald-800">{buyNowMessage}</AlertDescription>
                        </Alert>
                      )}
                      {buyNowError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Lỗi mua ngay</AlertTitle>
                          <AlertDescription>{buyNowError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((idx) => (
              <Button
                        key={idx}
                      variant="outline"
                      className="flex-1 bg-transparent text-xs"
                        onClick={() => setBidAmount((suggestedBid + minIncrement * idx).toString())}
                        disabled={isAuctionEnded || ["paused", "cancelled"].includes(auction.status?.toLowerCase() ?? "")}
              >
                        <span className="truncate">{formatPrice(suggestedBid + minIncrement * idx)}</span>
              </Button>
                    ))}
            </div>
            {!isAuctionEnded && ![ "paused", "cancelled" ].includes(auction.status?.toLowerCase() ?? "") && (
              <AutoBidDialog auctionId={Number(auctionId)} currentBid={auction.currentBid || auction.startingBid} minIncrement={minIncrement} />
            )}
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    <span className="text-muted-foreground">Nhận thông báo ngay khi bị vượt.</span>
                  </div>
            </div>
          </div>
          </Card>
          <Card className="border-border bg-card p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Dòng lệnh realtime</p>
                <p className="text-lg font-semibold text-foreground">Người đang đặt giá</p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {recentBids.length} giao dịch
              </div>
            </div>
            <div className="mt-4 max-h-[420px] overflow-y-auto pr-2">
              <BidHistory auctionId={Number(auctionId)} currentBid={auction.currentBid || auction.startingBid} />
            </div>
          </Card>

          {/* Payment Button - Show when auction completed and current user is winner */}
          {auction && 
           auction.status?.toLowerCase() === "completed" && 
           auction.winnerId && 
           user && 
           Number(user.id) === Number(auction.winnerId) && (
            <div className="mt-4">
              <PaymentButton
                auctionId={Number(auctionId)}
                winnerId={auction.winnerId}
                finalPrice={auction.currentBid || auction.startingBid}
                onPaymentSuccess={() => {
                  fetchAuction();
                }}
              />
            </div>
          )}
        </section>

        <section>
          <Card className="border-border bg-card p-6">
            <div className="mb-2 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Phòng Chat Đấu Giá</h3>
                <p className="text-xs text-muted-foreground">Trao đổi ẩn danh, mọi người đều xem được.</p>
              </div>
            </div>
            <LiveChat auctionId={Number(auctionId)} />
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_1fr]">
          <Card className="border-border bg-card p-6">
            <Tabs defaultValue="description">
              <TabsList className="w-full">
                <TabsTrigger value="description" className="flex-1">
                  Mô tả
                </TabsTrigger>
                <TabsTrigger value="seller" className="flex-1">
                  Người bán
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6 space-y-4 text-muted-foreground">
                {/* Item Specifics Section */}
                {auction.itemSpecifics && (() => {
                  try {
                    const parsed = JSON.parse(auction.itemSpecifics)
                    if (typeof parsed === 'object' && parsed !== null) {
                      const entries = Object.entries(parsed)
                      if (entries.length > 0) {
                        return (
                          <div className="space-y-3">
                            <p className="text-lg font-semibold text-foreground">Đặc tính thông số sản phẩm</p>
                            <div className="rounded-lg border border-border bg-muted/30 p-4">
                              <div className="space-y-2">
                                {entries.map(([key, value], index) => (
                                  <div key={index} className="flex gap-4 py-2 border-b border-border last:border-b-0">
                                    <div className="font-medium text-foreground min-w-[120px]">{key}:</div>
                                    <div className="text-foreground flex-1">{String(value)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      }
                    }
                  } catch {
                    // Fallback to plain text if not valid JSON
                    return (
                      <div className="space-y-3">
                        <p className="text-lg font-semibold text-foreground">Đặc tính thông số sản phẩm</p>
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                          <pre className="whitespace-pre-wrap text-sm text-foreground font-normal">
                            {auction.itemSpecifics}
                          </pre>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

                {/* Item Description from Seller Section */}
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-foreground">Mô tả chi tiết từ người bán</p>
                  <p className="whitespace-pre-line text-foreground">{auction.itemDescription || "Chưa có mô tả"}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Danh mục</p>
                    <p className="text-lg font-semibold text-foreground">
                      {auction.categoryName || `Category #${auction.categoryId}`}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="seller" className="mt-6 space-y-4">
                {loadingSellerInfo ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-20 w-20">
                        {sellerInfo?.avatarUrl ? (
                          <AvatarImage src={getImageUrl(sellerInfo.avatarUrl)} alt={seller.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                          {seller.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground">{seller.name}</h3>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Tên</span>
                          <span className="font-medium text-foreground">{seller.name}</span>
                        </div>
                        {sellerInfo?.email && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Email</span>
                            <span className="font-medium text-foreground">{sellerInfo.email}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Điểm đánh giá</span>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            <span className="font-medium text-foreground">
                              {sellerInfo?.reputationScore != null && sellerInfo.reputationScore !== undefined
                                ? sellerInfo.reputationScore.toFixed(1)
                                : "N/A"}
                            </span>
                            {seller.totalRatings > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({seller.totalRatings} {seller.totalRatings === 1 ? "đánh giá" : "đánh giá"})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Tổng sản phẩm</span>
                          <span className="font-medium text-foreground">
                            {sellerInfo?.totalProducts ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={isFavoriteSeller ? "secondary" : "default"}
                        onClick={toggleFavoriteSeller}
                        disabled={loadingFavorite}
                        className={`flex items-center gap-2 ${isFavoriteSeller ? "bg-red-50 text-red-600" : ""}`}
                      >
                        {loadingFavorite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                        {isFavoriteSeller ? "Bỏ yêu thích" : "Theo dõi người bán"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!user?.id) {
                            toast({
                              title: "Cần đăng nhập",
                              description: "Vui lòng đăng nhập để nhắn tin với người bán",
                              variant: "destructive",
                            })
                            return
                          }
                          // Navigate to messages page with sellerId
                          router.push(`/messages?sellerId=${auction.sellerId}`)
                        }}
                        className="flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Nhắn tin
                      </Button>
                      <Link href={`/profile/${auction.sellerId}`}>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          Xem trang người bán
                        </Button>
                      </Link>
                    </div>
                    {favoriteMessage && (
                      <div
                        className={`rounded-lg border p-3 text-sm ${
                          favoriteMessage.includes("thành công") || favoriteMessage.includes("Đã")
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}
                      >
                        {favoriteMessage}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>

          <Card className="border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">Thông tin thêm</h3>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                <span>Thời gian bắt đầu</span>
                <span className="font-medium text-foreground">
                  {new Date(auction.startTime).toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                <span>Thời gian kết thúc</span>
                <span className="font-medium text-foreground">
                  {new Date(auction.endTime).toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                <span>Người bán</span>
                <span className="font-medium text-foreground">{seller.name}</span>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}