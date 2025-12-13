"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { UsersAPI } from "@/lib/api/users"
import { AuctionsAPI, type SellerAuctionDto } from "@/lib/api/auctions"
import type { UserResponse } from "@/lib/api/types"
import { Loader2, Mail, Shield, Calendar, Package, Heart, Send } from "lucide-react"
import { getImageUrls } from "@/lib/api/config"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { FavoriteSellersAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface UserPublicProfileProps {
  userId?: number | null
}

export function UserPublicProfile({ userId }: UserPublicProfileProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sellerAuctions, setSellerAuctions] = useState<SellerAuctionDto[]>([])
  const [loadingAuctions, setLoadingAuctions] = useState(false)
  const [showAllProductsDialog, setShowAllProductsDialog] = useState(false)
  const [isFavoriteSeller, setIsFavoriteSeller] = useState(false)
  const [loadingFavorite, setLoadingFavorite] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchProfile = async () => {
      if (!userId || Number.isNaN(userId)) {
        if (isMounted) {
          setError("Không tìm thấy người dùng")
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await UsersAPI.getById(userId)
        if (isMounted) {
          setProfile(data)
        }
      } catch (err) {
        console.error("Failed to load user profile:", err)
        if (isMounted) {
          setError("Không thể tải thông tin người dùng")
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      isMounted = false
    }
  }, [userId])

  // Fetch seller auctions if user is a seller
  useEffect(() => {
    let isMounted = true

    const fetchSellerAuctions = async () => {
      if (!profile || !userId || !profile.roles?.includes("seller")) {
        return
      }

      try {
        setLoadingAuctions(true)
        const auctions = await AuctionsAPI.getBySeller(userId)
        if (isMounted) {
          setSellerAuctions(auctions)
        }
      } catch (err) {
        // Silently fail - auctions are optional
        if (isMounted) {
          setSellerAuctions([])
        }
      } finally {
        if (isMounted) {
          setLoadingAuctions(false)
        }
      }
    }

    fetchSellerAuctions()

    return () => {
      isMounted = false
    }
  }, [profile, userId])

  // Check if seller is favorite
  useEffect(() => {
    if (!userId || !user?.id || !profile?.roles?.includes("seller")) {
      setIsFavoriteSeller(false)
      return
    }
    
    let mounted = true
    const checkFavorite = async () => {
      try {
        const isFav = await FavoriteSellersAPI.checkIsFavorite(userId)
        if (!mounted) return
        setIsFavoriteSeller(isFav)
      } catch (err) {
        if (!mounted) return
        setIsFavoriteSeller(false)
      }
    }
    
    checkFavorite()
    return () => { mounted = false }
  }, [userId, user?.id, profile?.roles])

  // Toggle favorite seller
  const toggleFavoriteSeller = async () => {
    if (!userId) return
    
    if (!user?.id) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để theo dõi người bán",
        variant: "destructive",
      })
      return
    }
    
    setLoadingFavorite(true)
    try {
      let result
      if (isFavoriteSeller) {
        result = await FavoriteSellersAPI.removeFavorite(userId)
        setIsFavoriteSeller(false)
      } else {
        result = await FavoriteSellersAPI.addFavorite(userId)
        setIsFavoriteSeller(true)
      }
      toast({
        title: "Thành công",
        description: result.message,
      })
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể thực hiện thao tác",
        variant: "destructive",
      })
    } finally {
      setLoadingFavorite(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return null
  }

  // Helper function để format giá
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Helper function để map trạng thái sang tiếng Việt
  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() ?? ""
    if (s === "active") return { label: "Đang diễn ra", variant: "default" as const }
    if (s === "scheduled") return { label: "Sắp diễn ra", variant: "secondary" as const }
    if (s === "paused") return { label: "Đã tạm dừng", variant: "destructive" as const }
    if (s === "completed" || s === "ended") return { label: "Đã kết thúc", variant: "outline" as const }
    if (s === "cancelled" || s === "canceled") return { label: "Đã hủy", variant: "outline" as const }
    if (s === "draft") return { label: "Bản nháp", variant: "outline" as const }
    return { label: "Không xác định", variant: "outline" as const }
  }

  // Handle toggle favorite seller
  const handleToggleFavorite = async () => {
    if (!userId || !profile) {
      return
    }

    // Kiểm tra đăng nhập trước
    if (!user?.id) {
      setFavoriteMessage("Vui lòng đăng nhập để thêm seller vào danh sách yêu thích")
      setTimeout(() => setFavoriteMessage(null), 3000)
      return
    }

    // Don't allow adding self to favorites
    if (user.id === String(userId)) {
      setFavoriteMessage("Bạn không thể thêm chính mình vào danh sách yêu thích")
      setTimeout(() => setFavoriteMessage(null), 3000)
      return
    }

    setIsTogglingFavorite(true)
    setFavoriteMessage(null)
    
    try {
      let result: { success: boolean; message: string }
      
      if (isFavorite) {
        // Remove from favorites
        result = await FavoriteSellersAPI.removeFavorite(userId)
        if (result.success) {
          setIsFavorite(false)
        }
      } else {
        // Add to favorites
        result = await FavoriteSellersAPI.addFavorite(userId)
        if (result.success) {
          setIsFavorite(true)
        }
      }
      
      // Luôn hiển thị message từ API
      setFavoriteMessage(result.message)
      setTimeout(() => setFavoriteMessage(null), 3000)
      
    } catch (error: any) {
      // Không log vào console, chỉ hiển thị message cho user
      setFavoriteMessage(error.message || "Không thể thực hiện thao tác. Vui lòng đăng nhập.")
      setTimeout(() => setFavoriteMessage(null), 3000)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  // Component để render product card
  const ProductCard = ({ auction }: { auction: SellerAuctionDto }) => {
    const imageUrls = getImageUrls(auction.itemImages)
    const statusInfo = getStatusBadge(auction.displayStatus)
    return (
      <Link href={`/auction/${auction.id}`}>
        <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <Image
              src={imageUrls[0] || "/placeholder.svg"}
              alt={auction.itemTitle}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <Badge className="absolute right-2 top-2" variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
          </div>
          <CardContent className="p-4">
            <h4 className="mb-2 line-clamp-2 font-semibold text-foreground group-hover:text-primary transition-colors">
              {auction.itemTitle}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Giá hiện tại</span>
                <span className="font-semibold text-primary">
                  {formatPrice(auction.currentBid ?? auction.startingBid)}
                </span>
              </div>
              {auction.categoryName && (
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{auction.categoryName}</p>
                </div>
              )}
              {auction.bidCount > 0 && (
                <p className="text-xs text-muted-foreground">{auction.bidCount} lượt đấu giá</p>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
              ) : (
                <AvatarFallback className="bg-primary text-3xl text-primary-foreground">
                  {profile.fullName?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <h2 className="mt-4 text-xl font-semibold">{profile.fullName || "Người dùng"}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {profile.roles?.length ? (
                profile.roles.map((role) => (
                  <Badge key={role} className="capitalize">
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">User</Badge>
              )}
            </div>

            <div className="mt-6 w-full space-y-3 text-left text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Gia nhập: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Không rõ"}</span>
              </div>
            </div>

            {/* Action Buttons - Only show if user is a seller and current user is logged in */}
            {profile.roles?.includes("seller") && user?.id && Number(user.id) !== userId && (
              <div className="mt-6 flex flex-col gap-2 w-full">
                <Button
                  size="sm"
                  variant={isFavoriteSeller ? "secondary" : "default"}
                  onClick={toggleFavoriteSeller}
                  disabled={loadingFavorite}
                  className={`w-full flex items-center justify-center gap-2 ${isFavoriteSeller ? "bg-red-50 text-red-600" : ""}`}
                >
                  {loadingFavorite ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                  {isFavoriteSeller ? "Bỏ theo dõi" : "Theo dõi"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    router.push(`/messages?sellerId=${userId}`)
                  }}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Nhắn tin
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Thông tin hoạt động</CardTitle>
          <CardDescription>Tổng quan nhanh về người dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Điểm đánh giá</p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {profile.reputationScore != null && profile.reputationScore !== undefined
                  ? profile.reputationScore.toFixed(1)
                  : "N/A"}
              </p>
              {profile.totalRatings != null && profile.totalRatings > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  ({profile.totalRatings} {profile.totalRatings === 1 ? "đánh giá" : "đánh giá"})
                </p>
              )}
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {loadingAuctions ? "..." : sellerAuctions.length}
              </p>
              {profile.roles?.includes("seller") && (
                <p className="mt-1 text-xs text-muted-foreground">Sản phẩm đã đăng</p>
              )}
            </div>
          </div>

          {/* Seller Products Section */}
          {profile.roles?.includes("seller") && (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Sản phẩm đang bán</h3>
                  <p className="text-sm text-muted-foreground">
                    {loadingAuctions ? "Đang tải..." : `${sellerAuctions.length} sản phẩm`}
                  </p>
                </div>
                {sellerAuctions.length > 6 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAllProductsDialog(true)}
                  >
                    Xem tất cả
                  </Button>
                )}
              </div>

              {loadingAuctions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sellerAuctions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Chưa có sản phẩm nào</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sellerAuctions.slice(0, 6).map((auction) => (
                    <ProductCard key={auction.id} auction={auction} />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog hiển thị tất cả sản phẩm */}
      <Dialog open={showAllProductsDialog} onOpenChange={setShowAllProductsDialog}>
        <DialogContent className="max-w-[150vw] w-full max-h-[95vh] h-[95vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-8 pb-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">Tất cả sản phẩm</DialogTitle>
                <DialogDescription className="mt-2">
                  Danh sách đầy đủ các sản phẩm của {profile.fullName || profile.email}
                </DialogDescription>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {sellerAuctions.length} sản phẩm
              </Badge>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-8 py-8">
            {sellerAuctions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">Chưa có sản phẩm nào</p>
                <p className="text-sm text-muted-foreground">Người bán này chưa đăng sản phẩm nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-8">
                {sellerAuctions.map((auction) => (
                  <ProductCard key={auction.id} auction={auction} />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

