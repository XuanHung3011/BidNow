// lib/api/favorite-sellers.ts
import { API_BASE, API_ENDPOINTS } from './config'

export interface FavoriteSellerDto {
  id: number
  buyerId: number
  sellerId: number
  sellerName?: string
  sellerEmail?: string
  sellerAvatarUrl?: string
  sellerReputationScore?: number
  sellerTotalSales?: number
  createdAt: string
}

export interface AddFavoriteSellerDto {
  sellerId: number
}

export interface FavoriteSellerResponseDto {
  success: boolean
  message: string
  data?: FavoriteSellerDto
}

async function getAuthHeaders(): Promise<HeadersInit> {
  // Get user from localStorage (session-based auth)
  const storedUser = localStorage.getItem('bidnow_user')
  
  if (!storedUser) {
    throw new Error('Vui lòng đăng nhập để sử dụng tính năng này')
  }

  const user = JSON.parse(storedUser)
  
  // Send userId in headers or use cookie-based session
  return {
    'Content-Type': 'application/json',
    'X-User-Id': String(user.id).trim(),
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401 || res.status === 403) {
    throw new Error('Vui lòng đăng nhập để tiếp tục')
  }
  
  // Xử lý 204 No Content - trả về response mặc định
  if (res.status === 204) {
    return { 
      success: true, 
      message: 'Thao tác thành công' 
    } as T
  }
  
  // Kiểm tra content type
  const contentType = res.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`)
    }
    return { 
      success: true, 
      message: 'Thao tác thành công' 
    } as T
  }
  
  // Parse JSON response
  const data = await res.json()
  
  // Nếu response không ok, throw error với message từ API
  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`)
  }
  
  return data
}

export const FavoriteSellersAPI = {
  // Lấy danh sách seller yêu thích của user hiện tại
  getMyFavorites: async (): Promise<FavoriteSellerDto[]> => {
    const url = `${API_BASE}${API_ENDPOINTS.FAVORITE_SELLERS.GET_MY_FAVORITES}`
    const res = await fetch(url, {
      headers: await getAuthHeaders(),
      cache: 'no-store'
    })
    return handleResponse<FavoriteSellerDto[]>(res)
  },

  // Kiểm tra một seller có trong danh sách yêu thích không
  checkIsFavorite: async (sellerId: number): Promise<boolean> => {
    try {
      const url = `${API_BASE}${API_ENDPOINTS.FAVORITE_SELLERS.CHECK_IS_FAVORITE(sellerId)}`
      const res = await fetch(url, {
        headers: await getAuthHeaders(),
        cache: 'no-store'
      })
      const result = await handleResponse<{ isFavorite: boolean }>(res)
      return result.isFavorite
    } catch (err: any) {
      // Nếu chưa đăng nhập, trả về false thay vì throw error
      // Chỉ log lỗi nếu không phải lỗi đăng nhập
      if (err?.message && !err.message.includes('đăng nhập')) {
        console.error('Check favorite error:', err)
      }
      return false
    }
  },

  // Thêm seller vào danh sách yêu thích
  addFavorite: async (sellerId: number): Promise<FavoriteSellerResponseDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.FAVORITE_SELLERS.ADD_FAVORITE}`
    const res = await fetch(url, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ sellerId })
    })
    return handleResponse<FavoriteSellerResponseDto>(res)
  },

  // Xóa seller khỏi danh sách yêu thích
  removeFavorite: async (sellerId: number): Promise<FavoriteSellerResponseDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.FAVORITE_SELLERS.REMOVE_FAVORITE(sellerId)}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    })
    return handleResponse<FavoriteSellerResponseDto>(res)
  }
}