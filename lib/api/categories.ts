// lib/api/categories.ts
import { API_BASE, API_ENDPOINTS } from './config'
import { CategoryDtos, CreateCategoryDtos, UpdateCategoryDtos, CategoryFilterDto, PaginatedResult } from './types'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => null)
    throw new Error(text || `HTTP error ${res.status}`)
  }
  return res.json()
}

export const CategoriesAPI = {
  // Get all categories (no pagination)
  getAll: async (): Promise<CategoryDtos[]> => {
    const url = `${API_BASE}${API_ENDPOINTS.CATEGORIES.GET_ALL}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<CategoryDtos[]>(res)
  },

  // Get categories with pagination, filtering, and sorting
  getPaged: async (filter: CategoryFilterDto): Promise<PaginatedResult<CategoryDtos>> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.CATEGORIES.GET_PAGED}`)
    if (filter.searchTerm) url.searchParams.set('searchTerm', filter.searchTerm)
    if (filter.sortBy) url.searchParams.set('sortBy', filter.sortBy)
    if (filter.sortOrder) url.searchParams.set('sortOrder', filter.sortOrder)
    if (filter.page) url.searchParams.set('page', String(filter.page))
    if (filter.pageSize) url.searchParams.set('pageSize', String(filter.pageSize))
    
    const res = await fetch(url.toString(), { cache: 'no-store' })
    return handleResponse<PaginatedResult<CategoryDtos>>(res)
  },

  // Get category by ID
  getById: async (id: number): Promise<CategoryDtos> => {
    const url = `${API_BASE}${API_ENDPOINTS.CATEGORIES.GET_BY_ID}/${id}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<CategoryDtos>(res)
  },

  // Get category by slug
  getBySlug: async (slug: string): Promise<CategoryDtos> => {
    const url = `${API_BASE}${API_ENDPOINTS.CATEGORIES.GET_BY_SLUG}/${slug}`
    const res = await fetch(url, { cache: 'no-store' })
    return handleResponse<CategoryDtos>(res)
  },

  // Create new category
  create: async (data: CreateCategoryDtos): Promise<CategoryDtos> => {
    const url = `${API_BASE}${API_ENDPOINTS.CATEGORIES.CREATE}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    })
    return handleResponse<CategoryDtos>(res)
  },

  // Update category
  update: async (id: number, data: UpdateCategoryDtos): Promise<CategoryDtos> => {
    const url = `${API_BASE}${API_ENDPOINTS.CATEGORIES.UPDATE}/${id}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    })
    return handleResponse<CategoryDtos>(res)
  },

  // Delete category
  delete: async (id: number): Promise<boolean> => {
    const url = `${API_BASE}${API_ENDPOINTS.CATEGORIES.DELETE}/${id}`
    const res = await fetch(url, {
      method: 'DELETE',
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => null)
      throw new Error(text || `HTTP error ${res.status}`)
    }
    return res.status === 204 || res.ok
  },

  // Check if slug exists
  checkSlug: async (slug: string, excludeId?: number): Promise<boolean> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.CATEGORIES.CHECK_SLUG}/${slug}`)
    if (excludeId) url.searchParams.set('excludeId', String(excludeId))
    
    const res = await fetch(url.toString(), { cache: 'no-store' })
    return handleResponse<boolean>(res)
  },

  // Check if name exists
  checkName: async (name: string, excludeId?: number): Promise<boolean> => {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.CATEGORIES.CHECK_NAME}/${encodeURIComponent(name)}`)
    if (excludeId) url.searchParams.set('excludeId', String(excludeId))
    
    const res = await fetch(url.toString(), { cache: 'no-store' })
    return handleResponse<boolean>(res)
  },
// Check if category is currently in use (has related items)
checkInUse: async (id: number): Promise<boolean> => {
  const url = `${API_BASE}${API_ENDPOINTS.CATEGORIES.CHECK_IN_USE}/${id}/is-in-use`
  const res = await fetch(url, { cache: 'no-store' })
  const data = await handleResponse<{ id: number; isInUse: boolean }>(res)
  return data.isInUse // ✅ đúng key trả về từ API
},

}
