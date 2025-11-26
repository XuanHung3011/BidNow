// lib/api/items.ts
import { API_BASE, API_ENDPOINTS } from './config'
import { ItemResponseDto, ItemFilterDto, CategoryDto, ItemFilterAllDto, PaginatedResult, CreateItemDto } from './types'

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
  // Optional userId để backend có thể log từ khóa tìm kiếm cho user đã đăng nhập
  search: async (term: string, userId?: number): Promise<ItemResponseDto[]> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.ITEMS.SEARCH}`)
    url.searchParams.set('searchTerm', term)
    if (userId && userId > 0) {
      url.searchParams.set('userId', String(userId))
    }
    const res = await fetch(url.toString(), { cache: 'no-store' })
    return handleResponse<ItemResponseDto[]>(res)
  },

  getCategories: async (): Promise<CategoryDto[]> => {
    const url = `${API_BASE}${API_ENDPOINTS.ITEMS.CATEGORIES}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<CategoryDto[]>(res)
  },

  searchPaged: async (term: string, page = 1, pageSize = 12, userId?: number): Promise<PagedResponse> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.ITEMS.SEARCH_PAGED}`)
    url.searchParams.set('searchTerm', term)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))
    if (userId && userId > 0) {
      url.searchParams.set('userId', String(userId))
    }
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
  },

  // Admin: Get item by ID
  getById: async (id: number): Promise<ItemResponseDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.ITEMS.GET_BY_ID(id)}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<ItemResponseDto>(res)
  },

  // Admin: Get all items with filter (status, category, seller, sorting)
  getAllWithFilter: async (filter: ItemFilterAllDto): Promise<PaginatedResult<ItemResponseDto>> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.ITEMS.GET_ALL_WITH_FILTER}`)
    
    if (filter.statuses && filter.statuses.length > 0) {
      url.searchParams.set('statuses', filter.statuses.join(','))
    }
    if (filter.categoryId) {
      url.searchParams.set('categoryId', String(filter.categoryId))
    }
    if (filter.sellerId) {
      url.searchParams.set('sellerId', String(filter.sellerId))
    }
    if (filter.sortBy) {
      url.searchParams.set('sortBy', filter.sortBy)
    }
    if (filter.sortOrder) {
      url.searchParams.set('sortOrder', filter.sortOrder)
    }
    if (filter.page) {
      url.searchParams.set('page', String(filter.page))
    }
    if (filter.pageSize) {
      url.searchParams.set('pageSize', String(filter.pageSize))
    }

    const res = await fetch(url.toString(), { cache: 'no-store' })
    return handleResponse<PaginatedResult<ItemResponseDto>>(res)
  },

  // Admin: Approve item
  approveItem: async (id: number): Promise<{ message: string }> => {
    const url = `${API_BASE}${API_ENDPOINTS.ITEMS.APPROVE(id)}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    return handleResponse<{ message: string }>(res)
  },

  // Admin: Reject item
  rejectItem: async (id: number): Promise<{ message: string }> => {
    const url = `${API_BASE}${API_ENDPOINTS.ITEMS.REJECT(id)}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    return handleResponse<{ message: string }>(res)
  },

  // Seller: Create new item with file upload
  createItem: async (item: CreateItemDto, imageFiles?: File[]): Promise<ItemResponseDto> => {
    const url = `${API_BASE}${API_ENDPOINTS.ITEMS.CREATE}`
    console.log('Creating item at URL:', url)
    
    try {
      const formData = new FormData()
      
      // Add item data fields
      formData.append('SellerId', item.sellerId.toString())
      formData.append('CategoryId', item.categoryId.toString())
      formData.append('Title', item.title)
      if (item.description) {
        formData.append('Description', item.description)
      }
      if (item.condition) {
        formData.append('Condition', item.condition)
      }
      if (item.location) {
        formData.append('Location', item.location)
      }
      formData.append('BasePrice', item.basePrice.toString())
      
      // Add image files
      if (imageFiles && imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formData.append('images', file)
        })
      }
      
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
        cache: 'no-store'
      })
      
      console.log('Response status:', res.status, res.statusText)
      console.log('Response headers:', Object.fromEntries(res.headers.entries()))
      
      if (!res.ok) {
        let errorText = ''
        try {
          errorText = await res.text()
          console.error('Error response body:', errorText)
        } catch (e) {
          console.error('Error reading response:', e)
          errorText = `HTTP error ${res.status} ${res.statusText}`
        }
        
        // Try to parse error message
        let errorMessage = `Failed to create item: ${res.status} ${res.statusText}`
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.message) {
              errorMessage = errorJson.message
            } else if (errorJson.error) {
              errorMessage = errorJson.error
            }
          } catch {
            // If not JSON, use the text as is
            errorMessage = errorText || errorMessage
          }
        }
        
        throw new Error(errorMessage)
      }
      
      // Check if response has content
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        console.warn('Unexpected response type:', contentType, 'Body:', text)
        throw new Error('Unexpected response format from server')
      }
      
      const result = await res.json()
      console.log('Item created successfully:', result)
      return result
    } catch (error) {
      console.error('Error creating item:', error)
      throw error
    }
  }
}