// lib/api/items.ts
import { API_BASE, API_ENDPOINTS } from './config'
import { ItemResponseDto, ItemFilterDto, CategoryDto } from './types'

type PagedResponse = {
  items: ItemResponseDto[]
  pagination?: {
    currentPage: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => null)
    throw new Error(text || `HTTP error ${res.status}`)
  }
  return res.json()
}

export const ItemsAPI = {
  // 🔹 Lấy tất cả (no pagination)
  getAll: async (): Promise<ItemResponseDto[]> => {
    const url = `${API_BASE}${API_ENDPOINTS.ITEMS.GET_ALL}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<ItemResponseDto[]>(res)
  },

  // 🔹 Lấy paged (trả về items + pagination info)
  getPaged: async (page = 1, pageSize = 12): Promise<PagedResponse> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.ITEMS.GET_PAGED}`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))
    const res = await fetch(url.toString(), { cache: 'no-store' })
    return handleResponse<PagedResponse>(res)
  },

  // 🔹 Search (no pagination)
  search: async (term: string): Promise<ItemResponseDto[]> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.ITEMS.SEARCH}`)
    url.searchParams.set('searchTerm', term)
    const res = await fetch(url.toString(), { cache: 'no-store' })
    return handleResponse<ItemResponseDto[]>(res)
  },

  getCategories: async (): Promise<CategoryDto[]> => {
    const url = `${API_BASE}${API_ENDPOINTS.ITEMS.CATEGORIES}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<CategoryDto[]>(res)
  },

  searchPaged: async (term: string, page = 1, pageSize = 12): Promise<PagedResponse> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.ITEMS.SEARCH_PAGED}`)
    url.searchParams.set('searchTerm', term)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))
    const res = await fetch(url.toString(), { cache: 'no-store' })
    return handleResponse<PagedResponse>(res)
  },

  // ---------------------------
  // Filter (POST) with body + pagination query
  // ---------------------------
  filterPaged: async (filter: ItemFilterDto, page = 1, pageSize = 12): Promise<PagedResponse> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.ITEMS.FILTER}`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filter),
      cache: 'no-store'
    })

    return handleResponse<PagedResponse>(res)
  },

  // 🔥 Get hottest active auctions
  getHot: async (limit = 8): Promise<ItemResponseDto[]> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.ITEMS.HOT}`)
    url.searchParams.set('limit', String(limit))
    const res = await fetch(url.toString(), { cache: 'no-store' })
    return handleResponse<ItemResponseDto[]>(res)
  }
}