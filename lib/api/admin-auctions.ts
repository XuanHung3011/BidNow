// lib/api/admin-auctions.ts
import { API_BASE, API_ENDPOINTS } from './config'

export interface AuctionListItemDto {
  id: number
  itemTitle: string
  sellerName?: string
  categoryName?: string
  startingBid: number
  currentBid?: number
  endTime: string
  status: string
  displayStatus: string // active, scheduled, completed, suspended
  bidCount: number
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
  sellerTotalRatings?: number
  sellerName?: string
  startingBid: number
  currentBid?: number
  buyNowPrice?: number
  startTime: string
  endTime: string
  status: string
  bidCount?: number
}

export interface PaginatedResult<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface AuctionFilterParams {
  searchTerm?: string
  statuses?: string // comma-separated: active,scheduled,completed,suspended
  sortBy?: string // ItemTitle, EndTime, CurrentBid, BidCount
  sortOrder?: string // asc, desc
  page?: number
  pageSize?: number
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => null)
    let errorMessage = `HTTP error ${res.status}`
    try {
      const error = JSON.parse(text || '{}')
      errorMessage = error.message || errorMessage
    } catch {
      errorMessage = text || errorMessage
    }
    throw new Error(errorMessage)
  }
  return res.json()
}

export const AdminAuctionsAPI = {
  // GET /api/AdminAuctions - Get all auctions with pagination, search, and filtering
  getAll: async (params?: AuctionFilterParams): Promise<PaginatedResult<AuctionListItemDto>> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.ADMIN_AUCTIONS.GET_ALL}`)
    
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

  // GET /api/AdminAuctions/{id} - Get auction detail by ID
  getById: async (id: number): Promise<AuctionDetailDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.ADMIN_AUCTIONS.GET_BY_ID(id)}`
    const res = await fetch(url, {
      cache: 'no-store',
    })
    return handleResponse<AuctionDetailDto>(res)
  },

  // PUT /api/AdminAuctions/{id}/status - Update auction status (e.g., cancel/suspend)
  updateStatus: async (id: number, status: "draft" | "active" | "completed" | "cancelled"): Promise<void> => {
    const url = `${API_BASE}${API_ENDPOINTS.ADMIN_AUCTIONS.UPDATE_STATUS(id)}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => null)
      let errorMessage = `HTTP error ${res.status}`
      try {
        const error = JSON.parse(text || '{}')
        errorMessage = error.message || errorMessage
      } catch {
        errorMessage = text || errorMessage
      }
      throw new Error(errorMessage)
    }
  },
}

