// lib/api/notifications.ts
import { API_BASE, API_ENDPOINTS } from './config'
import { NotificationResponseDto, CreateNotificationDto, UnreadNotificationCountDto } from './types'

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

export const NotificationsAPI = {
  // GET /api/Notifications/user/{userId}?page={page}&pageSize={pageSize} - Lấy tất cả thông báo
  getAll: async (userId: number, page: number = 1, pageSize: number = 20): Promise<NotificationResponseDto[]> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.NOTIFICATIONS.GET_ALL(userId)}`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))
    
    const res = await fetch(url.toString(), { cache: 'no-store' })
    const data = await handleResponse<NotificationResponseDto[]>(res)
    return data || []
  },

  // GET /api/Notifications/user/{userId}/unread?page={page}&pageSize={pageSize} - Lấy thông báo chưa đọc
  getUnread: async (userId: number, page: number = 1, pageSize: number = 20): Promise<NotificationResponseDto[]> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.NOTIFICATIONS.GET_UNREAD(userId)}`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))
    
    const res = await fetch(url.toString(), { cache: 'no-store' })
    const data = await handleResponse<NotificationResponseDto[]>(res)
    return data || []
  },

  // GET /api/Notifications/user/{userId}/unread-count - Lấy số lượng thông báo chưa đọc
  getUnreadCount: async (userId: number): Promise<number> => {
    const url = `${API_BASE}${API_ENDPOINTS.NOTIFICATIONS.GET_UNREAD_COUNT(userId)}`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await handleResponse<UnreadNotificationCountDto>(res)
    return data.count
  },

  // POST /api/Notifications - Tạo thông báo mới
  create: async (data: CreateNotificationDto): Promise<NotificationResponseDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.NOTIFICATIONS.CREATE}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    })
    return handleResponse<NotificationResponseDto>(res)
  },

  // PUT /api/Notifications/{id}/read?userId={userId} - Đánh dấu đã đọc
  markAsRead: async (notificationId: number, userId: number): Promise<boolean> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(notificationId)}`)
    url.searchParams.set('userId', String(userId))
    
    const res = await fetch(url.toString(), {
      method: 'PUT',
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => null)
      throw new Error(text || `HTTP error ${res.status}`)
    }
    return res.ok
  },

  // PUT /api/Notifications/user/{userId}/mark-all-read - Đánh dấu tất cả đã đọc
  markAllAsRead: async (userId: number): Promise<boolean> => {
    const url = `${API_BASE}${API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ(userId)}`
    const res = await fetch(url, {
      method: 'PUT',
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => null)
      throw new Error(text || `HTTP error ${res.status}`)
    }
    return res.ok
  },

  // DELETE /api/Notifications/{id}?userId={userId} - Xóa thông báo
  delete: async (notificationId: number, userId: number): Promise<boolean> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId)}`)
    url.searchParams.set('userId', String(userId))
    
    const res = await fetch(url.toString(), {
      method: 'DELETE',
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => null)
      throw new Error(text || `HTTP error ${res.status}`)
    }
    return res.ok
  },
}

