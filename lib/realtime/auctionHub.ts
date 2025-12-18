// Client-side SignalR connection for auction real-time updates
import { HubConnectionBuilder, HubConnection, LogLevel, HttpTransportType } from "@microsoft/signalr"
import { API_BASE } from "../api"

export type BidPlacedPayload = {
  auctionId: number
  currentBid: number
  bidCount: number
  placedBid: {
    bidderId: number
    amount: number
    bidTime: string
  }
}

export type AuctionStatusUpdatedPayload = {
  auctionId: number
  status: string
  winnerId?: number | null
  finalPrice?: number | null
  timestamp: string
}

export function createAuctionHubConnection(): HubConnection {
  const connection = new HubConnectionBuilder()
    .withUrl(`${API_BASE}/hubs/auction`, {
      // Sử dụng Long Polling để tránh lỗi WebSocket trên VPS
      // Long Polling hoạt động ổn định hơn khi WebSockets bị chặn bởi proxy/firewall
      transport: HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry intervals
    .configureLogging(LogLevel.Warning) // Giảm log spam
    .build()
  return connection
}


