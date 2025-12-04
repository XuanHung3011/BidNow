"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BuyerStats } from "./buyer-stats"
import { ActiveBidsList } from "./active-bids-list"
import { WonAuctionsList } from "./won-auctions-list"
import { WatchlistList } from "./watchlist-list"
import { BiddingHistory } from "./bidding-history"
import { FavoriteSellersList } from "./FavoriteSellersList"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function BuyerDashboard() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("active")

  // Update active tab when URL query param changes
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && ["active", "watchlist", "history", "favorites"].includes(tabParam)) {
      setActiveTab(tabParam)
    } else {
      setActiveTab("active")
    }
  }, [searchParams])

  // Guard clause - don't render if no user
  if (!user) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vui lòng đăng nhập để xem trang này</p>
        </div>
      </div>
    )
  }

  const userId = parseInt(user.id)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString())
    if (value === "active") {
      params.delete("tab")
    } else {
      params.set("tab", value)
    }
    const newQuery = params.toString()
    router.replace(`/buyer${newQuery ? `?${newQuery}` : ""}`, { scroll: false })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bảng điều khiển người mua</h1>
        <p className="text-muted-foreground">Theo dõi các phiên đấu giá và quản lý giá thầu của bạn</p>
      </div>

      <BuyerStats />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="active">Đang đấu giá</TabsTrigger>
          {/*
          <TabsTrigger value="won">Đã thắng</TabsTrigger>
          */}
          <TabsTrigger value="watchlist">Theo dõi</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
          <TabsTrigger value="favorites">Seller yêu thích</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <ActiveBidsList bidderId={userId} />
        </TabsContent>
        {/*
        <TabsContent value="won" className="mt-6">
          <WonAuctionsList bidderId={userId} />
        </TabsContent>
        */}
        <TabsContent value="watchlist" className="mt-6">
          <WatchlistList />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <BiddingHistory />
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <FavoriteSellersList />
        </TabsContent>
      </Tabs>
    </div>
  )
}