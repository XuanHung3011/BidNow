"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BuyerStats } from "./buyer-stats"
import { ActiveBidsList } from "./active-bids-list"
import { WonAuctionsList } from "./won-auctions-list"
import { WatchlistList } from "./watchlist-list"
import { BiddingHistory } from "./bidding-history"

export function BuyerDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bảng điều khiển người mua</h1>
        <p className="text-muted-foreground">Theo dõi các phiên đấu giá và quản lý giá thầu của bạn</p>
      </div>

      <BuyerStats />

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="active">Đang đấu giá</TabsTrigger>
          <TabsTrigger value="won">Đã thắng</TabsTrigger>
          <TabsTrigger value="watchlist">Theo dõi</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <ActiveBidsList />
        </TabsContent>

        <TabsContent value="won" className="mt-6">
          <WonAuctionsList />
        </TabsContent>

        <TabsContent value="watchlist" className="mt-6">
          <WatchlistList />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <BiddingHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
