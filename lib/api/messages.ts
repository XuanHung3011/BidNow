// lib/api/messages.ts
import { API_BASE, API_ENDPOINTS } from './config'
import { SendMessageRequest, MessageResponseDto, ConversationDto } from './types'

// Helper to get auth headers with X-User-Id
async function getAuthHeaders(): Promise<HeadersInit> {
  const storedUser = localStorage.getItem("bidnow_user")
  if (!storedUser) {
    return { 'Content-Type': 'application/json' }
  }
  
  try {
    const user = JSON.parse(storedUser)
    return {
      'Content-Type': 'application/json',
      'X-User-Id': String(user.id).trim(),
    }
  } catch {
    return { 'Content-Type': 'application/json' }
  }
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

export const MessagesAPI = {
  // POST /api/messages - Gửi tin nhắn
  send: async (data: SendMessageRequest): Promise<MessageResponseDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.MESSAGES.SEND}`
    const res = await fetch(url, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
      cache: 'no-store',
      credentials: 'include',
    })
    return handleResponse<MessageResponseDto>(res)
  },

  // GET /api/messages/conversations?userId={userId} - Danh sách hội thoại
  getConversations: async (userId: number): Promise<ConversationDto[]> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.MESSAGES.CONVERSATIONS}`)
    url.searchParams.set('userId', String(userId))
    
    const res = await fetch(url.toString(), {
      headers: await getAuthHeaders(),
      cache: 'no-store',
      credentials: 'include',
    })
    const data = await handleResponse<ConversationDto[]>(res)
    return data || []
  },

  // GET /api/messages/conversation?userId1={id}&userId2={id}&auctionId={id?}&fromDate={date?}&toDate={date?} - Chi tiết cuộc hội thoại
  getConversation: async (
    userId1: number,
    userId2: number,
    auctionId?: number | null,
    fromDate?: Date | null,
    toDate?: Date | null
  ): Promise<MessageResponseDto[]> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.MESSAGES.CONVERSATION}`)
    url.searchParams.set('userId1', String(userId1))
    url.searchParams.set('userId2', String(userId2))
    if (auctionId) {
      url.searchParams.set('auctionId', String(auctionId))
    }
    if (fromDate) {
      url.searchParams.set('fromDate', fromDate.toISOString())
    }
    if (toDate) {
      url.searchParams.set('toDate', toDate.toISOString())
    }

    const res = await fetch(url.toString(), {
      headers: await getAuthHeaders(),
      cache: 'no-store',
      credentials: 'include',
    })
    return handleResponse<MessageResponseDto[]>(res)
  },

  // PUT /api/messages/{id}/read - Đánh dấu đã đọc
  markAsRead: async (messageId: number): Promise<boolean> => {
    const url = `${API_BASE}${API_ENDPOINTS.MESSAGES.MARK_READ(messageId)}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      cache: 'no-store',
      credentials: 'include',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => null)
      throw new Error(text || `HTTP error ${res.status}`)
    }
    return res.ok
  },

  // GET /api/messages/unread?userId={userId} - Xem tin nhắn chưa đọc
  getUnreadMessages: async (userId: number): Promise<MessageResponseDto[]> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.MESSAGES.UNREAD}`)
    url.searchParams.set('userId', String(userId))
    
    const res = await fetch(url.toString(), {
      headers: await getAuthHeaders(),
      cache: 'no-store',
      credentials: 'include',
    })
    return handleResponse<MessageResponseDto[]>(res)
  },

  // GET /api/messages/all?userId={userId} - Tất cả tin nhắn (đã gửi và đã nhận)
  getAllMessages: async (userId: number): Promise<MessageResponseDto[]> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.MESSAGES.ALL}`)
    url.searchParams.set('userId', String(userId))
    
    const res = await fetch(url.toString(), {
      headers: await getAuthHeaders(),
      cache: 'no-store',
      credentials: 'include',
    })
    return handleResponse<MessageResponseDto[]>(res)
  },

  // GET /api/messages/dispute/{disputeId} - Tin nhắn của dispute chat
  getDisputeMessages: async (disputeId: number): Promise<MessageResponseDto[]> => {
    const url = `${API_BASE}${API_ENDPOINTS.MESSAGES.DISPUTE_MESSAGES(disputeId)}`
    
    const res = await fetch(url, {
      headers: await getAuthHeaders(),
      cache: 'no-store',
      credentials: 'include',
    })
    return handleResponse<MessageResponseDto[]>(res)
  },
}

