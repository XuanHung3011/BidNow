import { API_BASE } from './config'

export interface AutoBidDto {
  id: number
  auctionId: number
  userId: number
  maxAmount: number
  isActive: boolean
  createdAt?: string
}

export interface CreateAutoBidDto {
  auctionId: number
  userId: number
  maxAmount: number
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => null)
    let errorMessage = `HTTP error ${res.status}`
    try {
      const errorJson = JSON.parse(text || '{}')
      errorMessage = errorJson.message || errorMessage
    } catch {
      if (text) errorMessage = text
    }
    throw new Error(errorMessage)
  }
  return res.json()
}

export const AutoBidsAPI = {
  /**
   * Tạo hoặc cập nhật auto bid
   */
  async createOrUpdate(dto: CreateAutoBidDto): Promise<AutoBidDto> {
    const response = await fetch(`${API_BASE}/api/autobids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
    return handleResponse<AutoBidDto>(response)
  },

  /**
   * Lấy auto bid của user cho một phiên đấu giá
   */
  async get(auctionId: number, userId: number): Promise<AutoBidDto | null> {
    const response = await fetch(`${API_BASE}/api/autobids/auction/${auctionId}/user/${userId}`)
    if (response.status === 404) return null
    if (!response.ok) throw new Error('Không lấy được thông tin auto bid')
    return handleResponse<AutoBidDto>(response)
  },

  /**
   * Hủy auto bid
   */
  async deactivate(auctionId: number, userId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/api/autobids/auction/${auctionId}/user/${userId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const text = await response.text().catch(() => null)
      let errorMessage = 'Không thể hủy auto bid'
      try {
        const errorJson = JSON.parse(text || '{}')
        errorMessage = errorJson.message || errorMessage
      } catch {
        if (text) errorMessage = text
      }
      throw new Error(errorMessage)
    }
  },

  /**
   * Lấy bước nhảy giá dựa trên giá hiện tại
   */
  async getBidIncrement(currentPrice: number): Promise<number> {
    const response = await fetch(`${API_BASE}/api/autobids/increment/${currentPrice}`)
    if (!response.ok) throw new Error('Không tính được bước nhảy giá')
    const data = await handleResponse<{ increment: number }>(response)
    return data.increment
  },
}

