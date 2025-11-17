// lib/api/watchlist.ts
import { API_BASE, API_ENDPOINTS } from './config'

export interface WatchlistItemDto {
  watchlistId: number
  userId: number
  auctionId: number
  addedAt?: string
  itemTitle: string
  itemImages?: string
  categoryName?: string
  startingBid: number
  currentBid?: number
  buyNowPrice?: number
  endTime: string
  status: string
  bidCount?: number
}

export interface AddToWatchlistRequest {
  userId: number
  auctionId: number
}

export interface RemoveFromWatchlistRequest {
  userId: number
  auctionId: number
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => null)
    throw new Error(text || `HTTP error ${res.status}`)
  }
  return res.json()
}

export const WatchlistAPI = {
  async getByUser(userId: number): Promise<WatchlistItemDto[]> {
    const url = `${API_BASE}${API_ENDPOINTS.WATCHLIST.GET_BY_USER(userId)}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<WatchlistItemDto[]>(res)
  },

  async add(request: AddToWatchlistRequest): Promise<{ message: string }> {
    const url = `${API_BASE}${API_ENDPOINTS.WATCHLIST.ADD}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    return handleResponse<{ message: string }>(res)
  },

  async remove(request: RemoveFromWatchlistRequest): Promise<{ message: string }> {
    const url = `${API_BASE}${API_ENDPOINTS.WATCHLIST.REMOVE}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    return handleResponse<{ message: string }>(res)
  },

  async checkExists(userId: number, auctionId: number): Promise<boolean> {
    try {
      const url = `${API_BASE}${API_ENDPOINTS.WATCHLIST.GET_BY_USER_AUCTION(userId, auctionId)}`
      const res = await fetch(url, { cache: 'no-store' })
      return res.ok
    } catch {
      return false
    }
  }
}