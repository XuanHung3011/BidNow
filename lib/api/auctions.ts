// lib/api/auctions.ts
import { API_BASE } from './config'

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
  }
}