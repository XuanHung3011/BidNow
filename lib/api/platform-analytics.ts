// lib/api/platform-analytics.ts
import { API_BASE, API_ENDPOINTS } from './config'

export interface MonthlyMetricDto {
  current: number
  previous: number
  changePercent: number
}

export interface TopCategoryDto {
  name: string
  auctions: number
  revenue: number
}

export interface RecentActivityDto {
  onlineUsers: number
  activeAuctions: number
  bidsToday: number
  transactionsToday: number
}

export interface SystemAlertsDto {
  systemStatus: string // normal, warning, error
  systemStatusMessage: string
  pendingAuctions: number
  processingDisputes: number
  urgentDisputes: number
}

export interface PlatformAnalyticsDto {
  newUsers: MonthlyMetricDto
  newAuctions: MonthlyMetricDto
  totalTransactions: MonthlyMetricDto
  successRate: MonthlyMetricDto
  topCategories: TopCategoryDto[]
  recentActivity: RecentActivityDto
  systemAlerts: SystemAlertsDto
}

export interface PlatformAnalyticsDetailDto {
  chartData: Array<{
    name: string
    value: number | string
  }>
  summary?: Record<string, string | number>
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

export const PlatformAnalyticsAPI = {
  // GET /api/PlatformAnalytics - Get platform analytics data
  getAnalytics: async (): Promise<PlatformAnalyticsDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.PLATFORM_ANALYTICS.GET_ANALYTICS}`
    const res = await fetch(url, {
      cache: 'no-store',
    })
    return handleResponse<PlatformAnalyticsDto>(res)
  },
  // GET /api/PlatformAnalytics/detail/{type} - Get detailed analytics for a specific type
  getAnalyticsDetail: async (type: string): Promise<PlatformAnalyticsDetailDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.PLATFORM_ANALYTICS.GET_ANALYTICS}/detail/${type}`
    const res = await fetch(url, {
      cache: 'no-store',
    })
    return handleResponse<PlatformAnalyticsDetailDto>(res)
  },
}

