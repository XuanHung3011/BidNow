// lib/api/payments.ts
import { API_BASE } from './config'

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

export interface OrderDto {
  id: number
  auctionId: number
  buyerId: number
  sellerId: number
  finalPrice: number
  orderStatus: string // awaiting_payment, awaiting_shipment, shipped, dispute, completed, cancelled
  createdAt: string
  updatedAt?: string
  cancelledAt?: string
  cancelReason?: string
  trackingNumber?: string
  shippingCompany?: string
  shippedAt?: string
  shippingAddress?: string
  payment?: PaymentDto
}

export interface PaymentDto {
  id: number
  orderId: number
  amount: number
  paymentStatus: string // pending, paid_held, hold_dispute, refunded_to_buyer, released_to_seller
  paymentMethod?: string
  transactionId?: string
  paymentProvider?: string
  paidAt?: string
  releasedAt?: string
  refundedAt?: string
  createdAt: string
  updatedAt?: string
  notes?: string
}

export interface PayOsPaymentLinkDto {
  orderId: number
  paymentLink: string
  paymentLinkId?: string
  qrCode?: string
}

export interface CreatePaymentLinkRequestDto {
  orderId: number
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || `HTTP error! status: ${res.status}`)
  }
  return res.json()
}

export const PaymentsAPI = {
  /**
   * Lấy order theo auction ID
   */
  async getOrderByAuctionId(auctionId: number): Promise<OrderDto | null> {
    try {
      const res = await fetch(`${API_BASE}/api/Payment/auction/${auctionId}/order`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (res.status === 404) {
        return null
      }
      return handleResponse<OrderDto>(res)
    } catch (error) {
      console.error('Error getting order by auction ID:', error)
      return null
    }
  },

  /**
   * Tạo payment link cho order
   */
  async createPaymentLink(request: CreatePaymentLinkRequestDto): Promise<PayOsPaymentLinkDto> {
    const res = await fetch(`${API_BASE}/api/Payment/create-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    })
    return handleResponse<PayOsPaymentLinkDto>(res)
  },

  /**
   * Đồng bộ lại trạng thái thanh toán cho order
   */
  async syncPaymentStatus(orderId: number): Promise<OrderDto> {
    const res = await fetch(`${API_BASE}/api/Payment/order/${orderId}/sync-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    return handleResponse<OrderDto>(res)
  },

  /**
   * Đánh dấu order đã thanh toán (cho trường hợp webhook chưa được gọi)
   */
  async markOrderAsPaid(orderId: number): Promise<OrderDto> {
    const res = await fetch(`${API_BASE}/api/Payment/order/${orderId}/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    return handleResponse<OrderDto>(res)
  },

  /**
   * Lấy orders của buyer
   */
  async getBuyerOrders(buyerId: number): Promise<OrderDto[]> {
    const res = await fetch(`${API_BASE}/api/Payment/buyer/${buyerId}/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    return handleResponse<OrderDto[]>(res)
  },

  /**
   * Lấy orders của seller
   */
  async getSellerOrders(sellerId: number): Promise<OrderDto[]> {
    const res = await fetch(`${API_BASE}/api/Payment/seller/${sellerId}/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    return handleResponse<OrderDto[]>(res)
  },

  /**
   * Cập nhật thông tin vận chuyển (seller)
   */
  async updateShippingInfo(orderId: number, data: {
    trackingNumber: string
    shippingCompany?: string
    shippingAddress?: string
  }): Promise<OrderDto> {
    const res = await fetch(`${API_BASE}/api/Payment/order/${orderId}/update-shipping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    return handleResponse<OrderDto>(res)
  },

  /**
   * Buyer xác nhận đã nhận hàng
   */
  async confirmOrderReceived(orderId: number): Promise<OrderDto> {
    const res = await fetch(`${API_BASE}/api/Payment/order/${orderId}/confirm-received`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    return handleResponse<OrderDto>(res)
  },

  /**
   * Buyer báo cáo sự cố
   */
  async reportOrderIssue(orderId: number, issueDescription: string): Promise<OrderDto> {
    const res = await fetch(`${API_BASE}/api/Payment/order/${orderId}/report-issue`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ issueDescription }),
    })
    return handleResponse<OrderDto>(res)
  },
}


