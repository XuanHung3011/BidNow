// lib/api/admin-stats.ts
import { API_BASE, API_ENDPOINTS } from './config'

export interface AdminStatsDto {
  totalUsers: number
  newUsersThisWeek: number
  activeAuctions: number
  pendingItems: number
  disputesProcessing: number
  urgentDisputes: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueChangePercent: number
}

export interface AdminStatsDetailDto {
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

export const AdminStatsAPI = {
  // GET /api/AdminStats - Get admin statistics
  getStats: async (): Promise<AdminStatsDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.ADMIN_STATS.GET_STATS}`
    const res = await fetch(url, {
      cache: 'no-store',
    })
    return handleResponse<AdminStatsDto>(res)
  },
  // GET /api/AdminStats/detail/{type} - Get detailed statistics for a specific type
  getStatsDetail: async (type: string): Promise<AdminStatsDetailDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.ADMIN_STATS.GET_STATS}/detail/${type}`
    const res = await fetch(url, {
      cache: 'no-store',
    })
    return handleResponse<AdminStatsDetailDto>(res)
  },
}

