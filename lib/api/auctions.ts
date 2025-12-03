// lib/api/auctions.ts
import { API_BASE, API_ENDPOINTS } from './config'
import type { PaginatedResult } from './types'

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
  itemSpecifics?: string
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
  pausedAt?: string
  winnerId?: number
  winnerName?: string
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

export interface BuyerActiveBidDto {
  auctionId: number
  itemTitle: string
  itemImages?: string
  categoryName?: string
  currentBid: number
  yourHighestBid: number
  isLeading: boolean
  endTime: string
  totalBids: number
  yourBidCount: number
}

export interface PaginatedResultA<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
}

export interface BuyerWonAuctionDto {
  auctionId: number
  itemTitle: string
  itemImages?: string
  categoryName?: string
  finalBid: number
  wonDate: string
  endTime: string
  status: string
  sellerName?: string
  sellerId: number
  hasRated: boolean
}

export interface BiddingHistoryDto {
  bidId: number
  auctionId: number
  itemTitle: string
  itemImages?: string
  categoryName?: string
  yourBid: number
  bidTime: string
  status: 'leading' | 'outbid' | 'won' | 'lost'
  currentBid?: number
  endTime?: string
  auctionStatus?: string
  isAutoBid: boolean
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => null)
    throw new Error(text || `HTTP error ${res.status}`)
  }
  return res.json()
}

export interface AuctionListItemDto {
  id: number
  itemTitle: string
  itemImages?: string // Images from the item (JSON string or comma-separated)
  sellerName?: string
  categoryName?: string
  startingBid: number
  currentBid?: number
  startTime: string
  endTime: string
  status: string
  displayStatus: string // active, scheduled, completed, cancelled
  bidCount: number
  pausedAt?: string
}

export interface AuctionFilterParams {
  searchTerm?: string
  statuses?: string // comma-separated: active,scheduled,completed,cancelled
  sortBy?: string // ItemTitle, EndTime, CurrentBid, BidCount
  sortOrder?: string // asc, desc
  page?: number
  pageSize?: number
}

export const AuctionsAPI = {
  // Get all auctions with pagination, search, and filtering (Public endpoint)
  async getAll(params?: AuctionFilterParams): Promise<PaginatedResult<AuctionListItemDto>> {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.AUCTIONS.GET_ALL}`)
    
    if (params?.searchTerm) {
      url.searchParams.set('searchTerm', params.searchTerm)
    }
    if (params?.statuses) {
      url.searchParams.set('statuses', params.statuses)
    }
    if (params?.sortBy) {
      url.searchParams.set('sortBy', params.sortBy)
    }
    if (params?.sortOrder) {
      url.searchParams.set('sortOrder', params.sortOrder)
    }
    if (params?.page) {
      url.searchParams.set('page', String(params.page))
    }
    if (params?.pageSize) {
      url.searchParams.set('pageSize', String(params.pageSize))
    }

    const res = await fetch(url.toString(), {
      cache: 'no-store',
    })
    return handleResponse<PaginatedResult<AuctionListItemDto>>(res)
  },

  async getDetail(id: number): Promise<AuctionDetailDto> {
    const response = await fetch(`${API_BASE}${API_ENDPOINTS.AUCTIONS.GET_BY_ID(id)}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch auction detail')
    }
    
    return response.json()
  },

  // Create auction
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

  // Admin: Get pending auctions
  async getPending(): Promise<AuctionResponseDto[]> {
    const url = `${API_BASE}${API_ENDPOINTS.AUCTIONS.GET_PENDING}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<AuctionResponseDto[]>(res)
  },

  // Admin: Approve auction
  async approve(id: number): Promise<{ message: string }> {
    const url = `${API_BASE}${API_ENDPOINTS.AUCTIONS.APPROVE(id)}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    return handleResponse<{ message: string }>(res)
  },

  // Admin: Reject auction
  async reject(id: number): Promise<{ message: string }> {
    const url = `${API_BASE}${API_ENDPOINTS.AUCTIONS.REJECT(id)}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    return handleResponse<{ message: string }>(res)
  },

  // Place bid on auction
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

  async buyNow(id: number, payload: BuyNowRequestDto): Promise<AuctionCompletionResultDto> {
    const response = await fetch(`${API_BASE}/api/auctions/${id}/buy-now`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const raw = await response.text().catch(() => '')
      try {
        const parsed = raw ? JSON.parse(raw) : {}
        throw new Error(parsed.message || 'Mua ngay thất bại')
      } catch {
        throw new Error(raw || 'Mua ngay thất bại')
      }
    }

    return response.json()
  },

  // Get recent bids for an auction
  async getRecentBids(id: number, limit = 100): Promise<BidDto[]> {
    const response = await fetch(`${API_BASE}/api/auctions/${id}/bids/recent?limit=${limit}`)
    if (!response.ok) throw new Error('Không lấy được lịch sử đấu giá')
    return response.json()
  },

  // Get highest bid for an auction
  async getHighestBid(id: number): Promise<number | null> {
    const response = await fetch(`${API_BASE}/api/auctions/${id}/bids/highest`)
    if (!response.ok) return null
    return response.json()
  },

  async getBuyerActiveBids(bidderId: number, page = 1, pageSize = 10): Promise<PaginatedResultA<BuyerActiveBidDto>> {
    const url = `${API_BASE}${API_ENDPOINTS.AUCTIONS.GET_BUYER_ACTIVE_BIDS(bidderId)}?page=${page}&pageSize=${pageSize}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<PaginatedResultA<BuyerActiveBidDto>>(res)
  },

  async getBuyerWonAuctions(bidderId: number, page = 1, pageSize = 10): Promise<PaginatedResultA<BuyerWonAuctionDto>> {
    const url = `${API_BASE}${API_ENDPOINTS.AUCTIONS.GET_BUYER_WON_AUCTIONS(bidderId)}?page=${page}&pageSize=${pageSize}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<PaginatedResultA<BuyerWonAuctionDto>>(res)
  },

  async getBiddingHistory(bidderId: number, page = 1, pageSize = 10): Promise<PaginatedResultA<BiddingHistoryDto>> {
    const url = `${API_BASE}${API_ENDPOINTS.AUCTIONS.GET_BUYER_BIDDING_HISTORY(bidderId)}?page=${page}&pageSize=${pageSize}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<PaginatedResultA<BiddingHistoryDto>>(res)
  },

  // Get auctions by seller
  async getBySeller(sellerId: number): Promise<SellerAuctionDto[]> {
    const url = `${API_BASE}${API_ENDPOINTS.AUCTIONS.GET_BY_SELLER(sellerId)}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<SellerAuctionDto[]>(res)
  }
}

export interface SellerAuctionDto {
  id: number
  itemId: number
  itemTitle: string
  itemImages?: string
  categoryName?: string
  startingBid: number
  currentBid?: number
  buyNowPrice?: number
  bidCount: number
  startTime: string
  endTime: string
  status: string
  displayStatus: string // active, scheduled, completed, draft
  winnerId?: number
  winnerName?: string
  hasRated: boolean
}

export interface BuyNowRequestDto {
  buyerId: number
}

export interface AuctionCompletionResultDto {
  auctionId: number
  winnerId?: number
  finalPrice?: number
  status: string
  completionType: string
  completedAt: string
}