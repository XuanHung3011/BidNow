"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import { BidHistory } from "@/components/bid-history"
import {
  RealTimePriceChart,
  type PricePoint,
} from "@/components/auction/real-time-price-chart"
import { BidTicker, type TickerBid } from "@/components/auction/bid-ticker"
import { LiveChat } from "@/components/live-chat"
import { AutoBidDialog } from "@/components/auto-bid-dialog"
import {
  AuctionsAPI,
  FavoriteSellersAPI,
  type AuctionDetailDto,
  type FavoriteSellerResponseDto,
} from "@/lib/api"
import type { BidDto } from "@/lib/api/auctions"
import { useAuth } from "@/lib/auth-context"
import { createAuctionHubConnection, type BidPlacedPayload, type AuctionStatusUpdatedPayload } from "@/lib/realtime/auctionHub"
import { getImageUrls } from "@/lib/api/config"
import { WatchlistAPI } from "@/lib/api"

interface AuctionDetailProps {
  auctionId: string
}

export function AuctionDetail({ auctionId }: AuctionDetailProps) {
  const { user } = useAuth()
  const [timeLeft, setTimeLeft] = useState("")
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
  const [bidsLoading, setBidsLoading] = useState(true)

  // Fetch auction detail
  useEffect(() => {
    let mounted = true
    
    const fetchAuction = async () => {
      try {
        setLoading(true)
        const data = await AuctionsAPI.getDetail(Number(auctionId))
        
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
    
    return () => { mounted = false }
  }, [auctionId])
  
  // SignalR: subscribe to BidPlaced and update UI in real-time
  useEffect(() => {
    let isMounted = true
    const connection = createAuctionHubConnection()
    let started = false

    const start = async () => {
      try {
        await connection.start()
        started = true
        await connection.invoke("JoinAuctionGroup", String(auctionId))
      } catch (e) {
        // ignore transient connection errors
      }
    }

    connection.on("BidPlaced", (payload: BidPlacedPayload) => {
      if (!isMounted) return
      if (payload.auctionId !== Number(auctionId)) return
      
      // Chỉ update nếu giá mới cao hơn hoặc bằng giá hiện tại (tránh update ngược về giá cũ)
      setAuction((prev) => {
        if (!prev) return prev
        // Chỉ update nếu currentBid mới >= currentBid hiện tại
        if (payload.currentBid >= prev.currentBid) {
          return {
            ...prev,
            currentBid: payload.currentBid,
            bidCount: payload.bidCount,
          }
        }
        // Nếu giá mới thấp hơn, có thể là update cũ đến muộn, bỏ qua
        return prev
      })
      
      // Luôn thêm bid mới vào history (để track tất cả bids)
      setRecentBids((prev) => {
        // Kiểm tra xem bid này đã có chưa (tránh duplicate)
        const isDuplicate = prev.some(
          (b) => b.bidderId === payload.placedBid.bidderId && 
                 b.amount === payload.placedBid.amount &&
                 Math.abs(new Date(b.bidTime).getTime() - new Date(payload.placedBid.bidTime).getTime()) < 1000
        )
        if (isDuplicate) return prev
        
        const next: BidDto[] = [
          ...prev,
          {
            bidderId: payload.placedBid.bidderId,
            amount: payload.placedBid.amount,
            bidTime: payload.placedBid.bidTime,
          },
        ]
        // Sắp xếp theo thời gian và lấy 120 bid mới nhất
        return next
          .sort((a, b) => new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime())
          .slice(0, 120)
      })
    })

    // Listen for auction status updates (pause/resume)
    connection.on("AuctionStatusUpdated", async (payload: AuctionStatusUpdatedPayload) => {
      if (!isMounted) return
      if (payload.auctionId !== Number(auctionId)) return
      
      // Refresh auction data khi status thay đổi
      try {
        const data = await AuctionsAPI.getDetail(Number(auctionId))
        if (!isMounted) return
        setAuction(data)
      } catch (err) {
        console.error('Failed to refresh auction after status update:', err)
      }
    })

    start()

    return () => {
      isMounted = false
      connection.off("BidPlaced")
      connection.off("AuctionStatusUpdated")
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, auction?.id])

  // Fetch recent bid timeline for chart/ticker
  useEffect(() => {
    let active = true
    const fetchRecentBids = async () => {
      try {
        setBidsLoading(true)
        const data = await AuctionsAPI.getRecentBids(Number(auctionId), 120)
        if (!active) return
        setRecentBids(data)
      } catch (err) {
        console.error("Không thể tải lịch sử đấu giá gần đây", err)
      } finally {
        if (active) {
          setBidsLoading(false)
        }
      }
    }
    if (auctionId) {
      void fetchRecentBids()
    }
    return () => {
      active = false
    }
  }, [auctionId])

  // Check if seller is favorite
  useEffect(() => {
    if (!auction?.sellerId) return
    
    let mounted = true
    const checkFavorite = async () => {
      try {
        const isFav = await FavoriteSellersAPI.checkIsFavorite(auction.sellerId)
        if (!mounted) return
        setIsFavoriteSeller(isFav)
      } catch (err) {
        console.error('Failed to check favorite:', err)
        // Không hiển thị lỗi cho user, chỉ log
      }
    }
    
    checkFavorite()
    return () => { mounted = false }
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

    // Nếu auction bị tạm dừng, dừng timer và hiển thị thời gian tạm dừng
    if (auction.status?.toLowerCase() === "cancelled") {
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

    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = new Date(auction.endTime).getTime() - now

      if (distance < 0) {
        setTimeLeft("Đã kết thúc")
        return
      }

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

  const formatPriceCompact = (price: number) => {
    if (price >= 1000000000) {
      const billions = price / 1000000000
      return `${billions.toFixed(billions % 1 === 0 ? 0 : 1)} tỷ ₫`
    } else if (price >= 1000000) {
      const millions = price / 1000000
      return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)} triệu ₫`
    }
    return formatPrice(price)
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
      console.error('Toggle favorite error:', err)
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

  const tickerItems: TickerBid[] = useMemo(() => {
    return [...recentBids]
      .slice(-12)
      .reverse()
      .map((bid, index) => ({
        id: `${bid.bidderId}-${bid.bidTime}-${index}`,
        bidder: formatBidderAlias(bid.bidderId, bid.bidderName),
        amount: bid.amount,
        bidTime: bid.bidTime,
        isWinning: index === 0,
      }))
  }, [recentBids])

  const latestBid = recentBids[recentBids.length - 1]
  const leadingBidder = latestBid ? formatBidderAlias(latestBid.bidderId, latestBid.bidderName) : null
  const liveFeedEntries = useMemo(() => [...recentBids].reverse(), [recentBids])

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
  const seller = {
    name: auction.sellerName || `User #${auction.sellerId}`,
    rating: 4.8,
    totalRatings: auction.sellerTotalRatings || 0,
    totalSales: 1234,
    joinDate: "Tháng 3, 2023",
    responseRate: 98,
    responseTime: "Trong vòng 2 giờ",
  }

  return (
    <div className="space-y-10 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <section>
          <Card className="overflow-hidden border-border bg-card">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {auction.status?.toLowerCase() === "cancelled" ? (
                      <Badge className="bg-orange-500 text-white">Đã tạm dừng</Badge>
                    ) : (
                      <Badge className="bg-primary text-primary-foreground">Đang mở</Badge>
                    )}
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{auction.categoryName || "Danh mục"}</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold leading-tight text-foreground lg:text-4xl">{auction.itemTitle}</h1>
                    {/* <p className="mt-1 text-sm text-muted-foreground">{auction.status}</p> */}
                  </div>
                  {auction.status?.toLowerCase() === "cancelled" && (
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
                </div>

                <div className="grid grid-cols-3 gap-4 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Giá hiện tại</p>
                    <p className="text-lg font-bold text-primary lg:text-xl">{formatPrice(auction.currentBid || auction.startingBid)}</p>
                    <p className={`text-xs font-medium ${priceDeltaValue >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {priceDeltaValue >= 0 ? "↑" : "↓"} {Math.abs(priceDeltaPercent).toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Thời gian còn lại</p>
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
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
            <div className="mt-6 rounded-xl bg-muted/20 p-3">
              <RealTimePriceChart
                data={priceSeries}
                startingBid={auction.startingBid}
                currentBid={auction.currentBid || auction.startingBid}
                buyNowPrice={auction.buyNowPrice}
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>Ticker realtime</span>
                <span>{bidsLoading ? "Đang đồng bộ..." : "Đã cập nhật"}</span>
              </div>
              <BidTicker items={tickerItems} />
            </div>
          </Card>

          <Card className="border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Đặt giá</p>
                  <h3 className="text-2xl font-semibold text-foreground">Bảng giao dịch</h3>
                </div>
                <div className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">Realtime</div>
              </div>
              <div className="mt-6 space-y-4">
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
                disabled={auction.status?.toLowerCase() === "cancelled"}
              />
              <Button 
                disabled={placing || !user || auction.status?.toLowerCase() === "cancelled"}
                onClick={async () => {
                  if (!auction) return
                  setPlaceError(null)
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
                    setAuction({
                      ...auction,
                      currentBid: res.currentBid,
                      bidCount: res.bidCount,
                    })
                    setBidAmount("")
                  } catch (err: any) {
                    setPlaceError(err.message || "Đặt giá thất bại")
                  } finally {
                    setPlacing(false)
                  }
                }}
              >
                {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đặt giá"}
              </Button>
            </div>
            {placeError && <div className="text-sm text-destructive">{placeError}</div>}
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((idx) => (
              <Button
                        key={idx}
                variant="outline"
                className="flex-1 bg-transparent text-xs"
                        onClick={() => setBidAmount((suggestedBid + minIncrement * idx).toString())}
                        disabled={auction.status?.toLowerCase() === "cancelled"}
              >
                        <span className="truncate">{formatPriceCompact(suggestedBid + minIncrement * idx)}</span>
              </Button>
                    ))}
            </div>
            {auction.status?.toLowerCase() !== "cancelled" && (
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
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
          <Card className="border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Dòng lệnh realtime</p>
                <p className="text-lg font-semibold text-foreground">Người đang đặt giá</p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {recentBids.length} giao dịch
              </div>
            </div>
            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-2">
              {liveFeedEntries.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
                  Chưa có lượt đặt giá nào. Hãy trở thành người mở màn!
                </div>
              )}
              {liveFeedEntries.slice(0, 10).map((bid, index) => (
                <div
                  key={`${bid.bidderId}-${bid.bidTime}-${index}`}
                  className="rounded-xl border border-border bg-muted/40 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{formatBidderAlias(bid.bidderId, bid.bidderName)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(bid.bidTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-primary">{formatPrice(bid.amount)}</p>
                      {index === 0 && <span className="text-xs font-medium text-emerald-500">Đang dẫn đầu</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <details className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <summary className="cursor-pointer select-none font-medium text-foreground">Xem bảng lịch sử đầy đủ</summary>
              <div className="mt-3">
                <BidHistory auctionId={Number(auctionId)} currentBid={auction.currentBid || auction.startingBid} />
              </div>
            </details>
          </Card>

          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Hỗ trợ trực tuyến</h3>
              <div className="ml-auto flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse-glow rounded-full bg-accent" />
                <span className="text-xs text-accent">Online</span>
              </div>
            </div>
            <LiveChat />
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
                <p className="text-lg font-semibold text-foreground">Chi tiết sản phẩm</p>
                <p className="whitespace-pre-line">{auction.itemDescription || "Chưa có mô tả"}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Danh mục</p>
                    <p className="text-lg font-semibold text-foreground">
                      {auction.categoryName || `Category #${auction.categoryId}`}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="seller" className="mt-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                    {seller.name[0]}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold text-foreground">{seller.name}</h3>
                      <Button
                        size="sm"
                        variant={isFavoriteSeller ? "secondary" : "default"}
                        onClick={toggleFavoriteSeller}
                        disabled={loadingFavorite}
                        className={`flex items-center gap-2 ${isFavoriteSeller ? "bg-red-50 text-red-600" : ""}`}
                      >
                        {loadingFavorite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                        {isFavoriteSeller ? "Bỏ yêu thích" : "Yêu thích"}
                      </Button>
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
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-lg bg-yellow-50 px-3 py-1.5">
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        <span className="text-lg font-bold text-foreground">{seller.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">/ 5.0</span>
                      </div>
                      <span className="text-sm text-muted-foreground">({seller.totalRatings} đánh giá)</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="border-border bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tổng giao dịch</p>
                        <p className="text-xl font-bold text-foreground">{seller.totalSales}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="border-border bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-accent/10 p-2">
                        <Award className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tỷ lệ phản hồi</p>
                        <p className="text-xl font-bold text-foreground">{seller.responseRate}%</p>
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Tham gia từ</span>
                    <span className="font-medium text-foreground">{seller.joinDate}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span>Thời gian phản hồi</span>
                    <span className="font-medium text-foreground">{seller.responseTime}</span>
                  </div>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90">Xem trang người bán</Button>
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