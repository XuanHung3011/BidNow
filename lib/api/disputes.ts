import { API_BASE } from "./config"

export interface DisputeDto {
  id: number
  orderId: number
  buyerId: number
  buyerName: string
  sellerId: number
  sellerName: string
  reason: string
  description?: string
  status: string // pending, in_review, buyer_won, seller_won, resolved, closed
  resolution?: string
  resolvedBy?: number
  resolverName?: string
  createdAt: string
  resolvedAt?: string
  closedAt?: string
  adminNotes?: string
  order?: any
  auctionTitle?: string
  orderAmount?: number
}

export interface CreateDisputeDto {
  orderId: number
  reason: string
  description?: string
}

export interface ResolveDisputeDto {
  winner: string // "buyer" or "seller"
  adminNotes?: string
}

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

class DisputesAPI {
  private baseUrl = `${API_BASE}/api/Dispute`

  async getAll(): Promise<DisputeDto[]> {
    const response = await fetch(this.baseUrl, {
      headers: await getAuthHeaders(),
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch disputes")
    return response.json()
  }

  async getByStatus(status: string): Promise<DisputeDto[]> {
    const response = await fetch(`${this.baseUrl}/status/${status}`, {
      headers: await getAuthHeaders(),
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch disputes")
    return response.json()
  }

  async getById(id: number): Promise<DisputeDto> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      headers: await getAuthHeaders(),
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch dispute")
    return response.json()
  }

  async getByOrderId(orderId: number): Promise<DisputeDto> {
    const response = await fetch(`${this.baseUrl}/order/${orderId}`, {
      headers: await getAuthHeaders(),
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch dispute")
    return response.json()
  }

  async getByBuyerId(buyerId: number): Promise<DisputeDto[]> {
    const response = await fetch(`${this.baseUrl}/buyer/${buyerId}`, {
      headers: await getAuthHeaders(),
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch disputes")
    return response.json()
  }

  async getBySellerId(sellerId: number): Promise<DisputeDto[]> {
    const response = await fetch(`${this.baseUrl}/seller/${sellerId}`, {
      headers: await getAuthHeaders(),
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch disputes")
    return response.json()
  }

  async create(dto: CreateDisputeDto): Promise<DisputeDto> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: await getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(dto),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create dispute" }))
      throw new Error(error.message || "Failed to create dispute")
    }
    return response.json()
  }

  async startReview(id: number): Promise<DisputeDto> {
    const response = await fetch(`${this.baseUrl}/${id}/start-review`, {
      method: "POST",
      headers: await getAuthHeaders(),
      credentials: "include",
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to start review" }))
      throw new Error(error.message || "Failed to start review")
    }
    return response.json()
  }

  async resolve(id: number, dto: ResolveDisputeDto): Promise<DisputeDto> {
    const response = await fetch(`${this.baseUrl}/${id}/resolve`, {
      method: "POST",
      headers: await getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(dto),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to resolve dispute" }))
      throw new Error(error.message || "Failed to resolve dispute")
    }
    return response.json()
  }
}

export const disputesAPI = new DisputesAPI()

