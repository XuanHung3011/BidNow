// lib/api/auctions.ts
import { API_BASE, API_ENDPOINTS } from './config'

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

export interface CreateAuctionDto {
  itemId: number
  sellerId: number
  startingBid: number
  buyNowPrice?: number
  startTime: string
  endTime: string
}

export interface AuctionResponseDto {
  id: number
  itemId: number
  sellerId: number
  startingBid: number
  currentBid?: number
  buyNowPrice?: number
  startTime: string
  endTime: string
  status: string
  bidCount?: number
  createdAt?: string
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => null)
    throw new Error(text || `HTTP error ${res.status}`)
  }
  return res.json()
}

export const AuctionsAPI = {
  async getDetail(id: number): Promise<AuctionDetailDto> {
    const response = await fetch(`${API_BASE}${API_ENDPOINTS.AUCTIONS.GET_BY_ID(id)}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch auction detail')
    }
    
    return response.json()
  },

  async create(auction: CreateAuctionDto): Promise<AuctionResponseDto> {
    const url = `${API_BASE}${API_ENDPOINTS.AUCTIONS.CREATE}`
    console.log('Creating auction at URL:', url)
    console.log('Auction data:', JSON.stringify(auction, null, 2))
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(auction),
        cache: 'no-store'
      })
      
      console.log('Response status:', res.status, res.statusText)
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => `HTTP error ${res.status}`)
        console.error('Error response:', errorText)
        
        // Try to parse error message
        let errorMessage = `Failed to create auction: ${res.status} ${res.statusText}`
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.message) {
            errorMessage = errorJson.message
          } else if (errorJson.error) {
            errorMessage = errorJson.error
          }
        } catch {
          if (errorText) {
            errorMessage = errorText
          }
        }
        
        throw new Error(errorMessage)
      }
      
      const result = await res.json()
      console.log('Auction created successfully:', result)
      return result
    } catch (error) {
      console.error('Error creating auction:', error)
      throw error
    }
  },

  async getPending(): Promise<AuctionResponseDto[]> {
    const url = `${API_BASE}${API_ENDPOINTS.AUCTIONS.GET_PENDING}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<AuctionResponseDto[]>(res)
  },

  async approve(id: number): Promise<{ message: string }> {
    const url = `${API_BASE}${API_ENDPOINTS.AUCTIONS.APPROVE(id)}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    return handleResponse<{ message: string }>(res)
  },

  async reject(id: number): Promise<{ message: string }> {
    const url = `${API_BASE}${API_ENDPOINTS.AUCTIONS.REJECT(id)}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    return handleResponse<{ message: string }>(res)
  }
}