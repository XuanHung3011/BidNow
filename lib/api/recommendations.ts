import { API_BASE, API_ENDPOINTS } from "./config"
import type { ItemResponseDto } from "./types"

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => null)
    throw new Error(text || `HTTP error ${res.status}`)
  }
  return res.json()
}

export const RecommendationsAPI = {
  async getPersonalized(userId: number, limit = 8): Promise<ItemResponseDto[]> {
    const url = new URL(`${API_BASE}${API_ENDPOINTS.RECOMMENDATIONS.PERSONALIZED}`)
    url.searchParams.set("userId", String(userId))
    url.searchParams.set("limit", String(limit))

    const res = await fetch(url.toString(), {
      cache: "no-store",
    })

    return handleResponse<ItemResponseDto[]>(res)
  },
}


