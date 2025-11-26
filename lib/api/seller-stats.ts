import { API_BASE, API_ENDPOINTS } from './config'

export interface SellerStatsDto {
  activeAuctions: number
  endingSoonAuctions: number
  totalListings: number
  completedAuctions: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueChangePercent: number
  totalBids: number
  averageRating: number
  totalRatings: number
}

export interface ChartDataPoint {
  name: string
  value: number
}

export interface SellerStatsDetailDto {
  chartData: ChartDataPoint[]
  summary?: Record<string, any>
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => null)
    throw new Error(text || `HTTP error ${res.status}`)
  }
  return res.json()
}

export const SellerStatsAPI = {
  async getStats(sellerId: number): Promise<SellerStatsDto> {
    const url = `${API_BASE}${API_ENDPOINTS.SELLER_STATS.GET_STATS(sellerId)}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<SellerStatsDto>(res)
  },

  async getStatsDetail(sellerId: number, type: string): Promise<SellerStatsDetailDto> {
    const url = `${API_BASE}${API_ENDPOINTS.SELLER_STATS.GET_STATS_DETAIL(sellerId, type)}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<SellerStatsDetailDto>(res)
  },
}

