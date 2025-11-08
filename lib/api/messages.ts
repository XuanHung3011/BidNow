// lib/api/messages.ts
import { API_BASE, API_ENDPOINTS } from './config'
import { SendMessageRequest, MessageResponseDto, ConversationDto, CreateConversationByEmailRequest } from './types'

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
  // Send a message
  send: async (data: SendMessageRequest): Promise<MessageResponseDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.MESSAGES.SEND}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    })
    return handleResponse<MessageResponseDto>(res)
  },

  // Create a conversation by email
  createConversationByEmail: async (data: CreateConversationByEmailRequest): Promise<ConversationDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.MESSAGES.CREATE_CONVERSATION}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    })
    return handleResponse<ConversationDto>(res)
  },

  // Get conversation between two users
  getConversation: async (
    userId1: number,
    userId2: number,
    auctionId?: number | null
  ): Promise<MessageResponseDto[]> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.MESSAGES.CONVERSATION}`)
    url.searchParams.set('userId1', String(userId1))
    url.searchParams.set('userId2', String(userId2))
    if (auctionId) {
      url.searchParams.set('auctionId', String(auctionId))
    }

    const res = await fetch(url.toString(), { cache: 'no-store' })
    return handleResponse<MessageResponseDto[]>(res)
  },

  // Get all conversations for a user
  getConversations: async (userId: number): Promise<ConversationDto[]> => {
    const url = `${API_BASE}${API_ENDPOINTS.MESSAGES.CONVERSATIONS(userId)}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<ConversationDto[]>(res)
  },

  // Get unread messages for a user
  getUnreadMessages: async (userId: number): Promise<MessageResponseDto[]> => {
    const url = `${API_BASE}${API_ENDPOINTS.MESSAGES.UNREAD(userId)}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<MessageResponseDto[]>(res)
  },

  // Get unread message count for a user
  getUnreadCount: async (userId: number): Promise<number> => {
    const url = `${API_BASE}${API_ENDPOINTS.MESSAGES.UNREAD_COUNT(userId)}`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await handleResponse<{ count: number }>(res)
    return data.count
  },

  // Mark a message as read
  markAsRead: async (messageId: number): Promise<boolean> => {
    const url = `${API_BASE}${API_ENDPOINTS.MESSAGES.MARK_READ(messageId)}`
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

  // Mark all messages in a conversation as read
  markConversationAsRead: async (
    userId1: number,
    userId2: number,
    auctionId?: number | null
  ): Promise<boolean> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.MESSAGES.MARK_CONVERSATION_READ}`)
    url.searchParams.set('userId1', String(userId1))
    url.searchParams.set('userId2', String(userId2))
    if (auctionId) {
      url.searchParams.set('auctionId', String(auctionId))
    }

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

  // Get a message by ID
  getById: async (messageId: number): Promise<MessageResponseDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.MESSAGES.GET_BY_ID(messageId)}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<MessageResponseDto>(res)
  },
}

