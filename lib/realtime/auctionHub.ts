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
      transport: HttpTransportType.WebSockets,
      skipNegotiation: true,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build()
  return connection
}


