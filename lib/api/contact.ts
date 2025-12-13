import { API_BASE, API_ENDPOINTS } from "./config"

export interface ContactMessageDto {
  name: string
  email: string
  subject: string
  category: string
  message: string
  userId?: number | null
}

export class ContactAPI {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = "Đã xảy ra lỗi"
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.title || errorMessage
      } catch {
        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
      }
      
      throw new Error(errorMessage)
    }
    
    return await response.json()
  }

  /**
   * Send contact message
   */
  static async sendContactMessage(data: ContactMessageDto): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}${API_ENDPOINTS.AUTH.CONTACT}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return await this.handleResponse<{ message: string }>(response)
  }
}

