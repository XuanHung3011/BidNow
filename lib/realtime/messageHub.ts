import { HubConnectionBuilder, HubConnection, LogLevel, HttpTransportType } from "@microsoft/signalr"
import { API_BASE } from "../api"

export function createMessageHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${API_BASE}/hubs/messages`, {
      transport: HttpTransportType.WebSockets,
      skipNegotiation: true,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build()
}


