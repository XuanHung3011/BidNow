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
      // Timeout phải nhỏ hơn server PollTimeout (120s) để client tự reconnect trước khi server timeout
      // Client sẽ tự động gửi request mới mỗi ~100s để giữ connection liên tục
      timeout: 100000, // 100 seconds - nhỏ hơn server timeout 120s
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        // Exponential backoff: 0s, 2s, 5s, 10s, 20s, 30s, sau đó giữ ở 30s
        if (retryContext.previousRetryCount === 0) return 0
        if (retryContext.previousRetryCount === 1) return 2000
        if (retryContext.previousRetryCount === 2) return 5000
        if (retryContext.previousRetryCount === 3) return 10000
        if (retryContext.previousRetryCount === 4) return 20000
        return 30000 // Giữ ở 30s cho các lần retry tiếp theo
      }
    })
    .configureLogging(LogLevel.Warning) // Giảm log spam
    .build()
  return connection
}


