import { API_BASE, API_ENDPOINTS } from './config'

export interface RatingCreateDto {
  auctionId: number
  raterId: number
  ratedId: number
  rating: number // 1-5
  comment?: string
}

export interface RatingResponseDto {
  id: number
  auctionId: number
  raterId: number
  ratedId: number
  rating: number
  comment?: string
  createdAt?: string
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text()
    let errorMessage = 'An error occurred'
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.message || errorJson.error || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new Error(errorMessage)
  }
  return res.json()
}

export const RatingsAPI = {
  /**
   * Create a rating (seller rates buyer or buyer rates seller)
   */
  create: async (dto: RatingCreateDto): Promise<RatingResponseDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.RATINGS.CREATE}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
      cache: 'no-store',
    })
    return handleResponse<RatingResponseDto>(res)
  },

  /**
   * Get ratings for a user
   */
  getForUser: async (userId: number, page = 1, pageSize = 10): Promise<{ data: RatingResponseDto[]; totalCount: number }> => {
    const url = `${API_BASE}${API_ENDPOINTS.RATINGS.GET_FOR_USER(userId)}?page=${page}&pageSize=${pageSize}`
    const res = await fetch(url, {
      cache: 'no-store',
    })
    return handleResponse<{ data: RatingResponseDto[]; totalCount: number }>(res)
  },

  /**
   * Get ratings for an auction
   */
  getForAuction: async (auctionId: number): Promise<RatingResponseDto[]> => {
    const url = `${API_BASE}${API_ENDPOINTS.RATINGS.GET_FOR_AUCTION(auctionId)}`
    const res = await fetch(url, {
      cache: 'no-store',
    })
    return handleResponse<RatingResponseDto[]>(res)
  },
}

