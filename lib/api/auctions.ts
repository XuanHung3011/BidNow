// lib/api/auctions.ts
import { API_BASE } from './config'

export interface BidRequestDto {
  bidderId: number
  amount: number
}

export interface BidDto {
  bidderId: number
  bidderName?: string
  amount: number
  bidTime: string
}

export interface BidResultDto {
  auctionId: number
  currentBid: number
  bidCount: number
  placedBid: BidDto
}

export interface AuctionDetailDto {
  id: number
  itemId: number
  itemTitle: string
  itemDescription?: string
  itemImages?: string
  categoryId: number
  categoryName?: string
  sellerId: number
  sellerName?: string
  sellerTotalRatings?: number
  startingBid: number
  currentBid?: number
  buyNowPrice?: number
  startTime: string
  endTime: string
  status: string
  bidCount?: number
}

export const AuctionsAPI = {
  async getDetail(id: number): Promise<AuctionDetailDto> {
    const response = await fetch(`${API_BASE}/api/auctions/${id}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch auction detail')
    }
    
    return response.json()
  },

  async placeBid(id: number, payload: BidRequestDto): Promise<BidResultDto> {
    const response = await fetch(`${API_BASE}/api/auctions/${id}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Đặt giá thất bại')
    }
    return response.json()
  },

  async getRecentBids(id: number, limit = 100): Promise<BidDto[]> {
    const response = await fetch(`${API_BASE}/api/auctions/${id}/bids/recent?limit=${limit}`)
    if (!response.ok) throw new Error('Không lấy được lịch sử đấu giá')
    return response.json()
  },

  async getHighestBid(id: number): Promise<number | null> {
    const response = await fetch(`${API_BASE}/api/auctions/${id}/bids/highest`)
    if (!response.ok) return null
    return response.json()
  },
}