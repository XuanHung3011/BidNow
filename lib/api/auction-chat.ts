"use client"

import { API_BASE, API_ENDPOINTS } from "./config"
import type { AuctionChatMessageDto, CreateAuctionChatMessageRequest } from "./types"

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => null)
    throw new Error(text || `HTTP error ${res.status}`)
  }
  return res.json()
}

export const AuctionChatAPI = {
  async list(auctionId: number, viewerId?: number, limit = 100): Promise<AuctionChatMessageDto[]> {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.AUCTION_CHAT.LIST(auctionId)}`)
    if (viewerId) {
      url.searchParams.set("viewerId", String(viewerId))
    }
    if (limit) {
      url.searchParams.set("limit", String(limit))
    }
    const res = await fetch(url.toString(), { cache: "no-store" })
    return handleResponse<AuctionChatMessageDto[]>(res)
  },

  async create(payload: CreateAuctionChatMessageRequest): Promise<AuctionChatMessageDto> {
    const res = await fetch(`${API_BASE}${API_ENDPOINTS.AUCTION_CHAT.CREATE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    return handleResponse<AuctionChatMessageDto>(res)
  },
}


