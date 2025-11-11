"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Star, ShoppingBag, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { FavoriteSellersAPI, type FavoriteSellerDto } from "@/lib/api"

// Update BuyerDashboard component như sau:
// Import: import { FavoriteSellersList } from "./favorite-sellers-list"
// 
// Thay đổi TabsList:
// <TabsList className="grid w-full grid-cols-5 lg:w-auto">
//   ...các tab cũ...
//   <TabsTrigger value="favorites">Seller yêu thích</TabsTrigger>
// </TabsList>
//
// Thêm TabsContent:
// <TabsContent value="favorites" className="mt-6">
//   <FavoriteSellersList />
// </TabsContent>

export function FavoriteSellersList() {
  const [favorites, setFavorites] = useState<FavoriteSellerDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  // Fetch danh sách seller yêu thích
  useEffect(() => {
    let mounted = true

    const fetchFavorites = async () => {
      try {
        setLoading(true)
        const data = await FavoriteSellersAPI.getMyFavorites()
        
        if (!mounted) return
        setFavorites(data)
        setError(null)
      } catch (err: any) {
        if (!mounted) return
        console.error('Failed to fetch favorites:', err)
        setError(err.message || 'Không thể tải danh sách người bán yêu thích')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    fetchFavorites()
    return () => { mounted = false }
  }, [])

  // Xóa seller khỏi danh sách yêu thích
  const handleRemove = async (sellerId: number) => {
    setRemovingId(sellerId)
    
    try {
      const result = await FavoriteSellersAPI.removeFavorite(sellerId)
      
      if (result.success) {
        // Cập nhật state local - remove khỏi list
        setFavorites(prev => prev.filter(fav => fav.sellerId !== sellerId))
      }
    } catch (err: any) {
      console.error('Failed to remove favorite:', err)
      alert(err.message || 'Không thể xóa người bán khỏi danh sách yêu thích')
    } finally {
      setRemovingId(null)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Không thể tải danh sách</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </Card>
    )
  }

  // Empty state
  if (favorites.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-muted p-4">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Chưa có người bán yêu thích
            </h3>
            <p className="text-sm text-muted-foreground">
              Thêm người bán vào danh sách yêu thích để dễ dàng theo dõi các phiên đấu giá của họ
            </p>
          </div>
          <Link href="/auctions">
            <Button>Khám phá đấu giá</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {favorites.map((favorite) => (
        <Card key={favorite.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Seller Info */}
            <div className="flex gap-4 flex-1">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {favorite.sellerAvatarUrl ? (
                  <img
                    src={favorite.sellerAvatarUrl}
                    alt={favorite.sellerName || 'Seller'}
                    className="h-20 w-20 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground border-2 border-border">
                    {favorite.sellerName?.[0] || 'U'}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="font-semibold text-foreground text-lg truncate">
                    {favorite.sellerName || `User #${favorite.sellerId}`}
                  </h3>
                  <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                    <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                    Yêu thích
                  </Badge>
                </div>

                {favorite.sellerEmail && (
                  <p className="text-sm text-muted-foreground mb-3 truncate">
                    {favorite.sellerEmail}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {favorite.sellerReputationScore !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-foreground">
                        {favorite.sellerReputationScore.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">/ 5.0</span>
                    </div>
                  )}

                  {favorite.sellerTotalSales !== undefined && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ShoppingBag className="h-4 w-4" />
                      <span>
                        <span className="font-semibold text-foreground">{favorite.sellerTotalSales}</span> giao dịch
                      </span>
                    </div>
                  )}

                  <span className="text-muted-foreground">
                    Đã thêm: {new Date(favorite.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/seller/${favorite.sellerId}`}>
                <Button variant="outline" size="sm">
                  Xem trang
                </Button>
              </Link>
              {/*
              <Link href={`/auctions?sellerId=${favorite.sellerId}`}>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Xem đấu giá
                </Button>
              </Link>
*/}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(favorite.sellerId)}
                disabled={removingId === favorite.sellerId}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Bỏ yêu thích"
              >
                {removingId === favorite.sellerId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className="h-4 w-4 fill-red-500" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {favorites.length > 0 && (
        <div className="text-center text-sm text-muted-foreground pt-4">
          Tổng cộng {favorites.length} người bán yêu thích
        </div>
      )}
    </div>
  )
}