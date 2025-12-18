import { HubConnectionBuilder, HubConnection, LogLevel, HttpTransportType } from "@microsoft/signalr"
import { API_BASE } from "../api"

export function createMessageHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${API_BASE}/hubs/messages`, {
      // Sử dụng Long Polling để tránh lỗi WebSocket trên VPS
      // Long Polling hoạt động ổn định hơn khi WebSockets bị chặn bởi proxy/firewall
      transport: HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry intervals
    .configureLogging(LogLevel.Warning) // Giảm log spam
    .build()
}


