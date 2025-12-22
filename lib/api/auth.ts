import { API_BASE, API_ENDPOINTS } from './config';
import { LoginRequest, RegisterRequest, ResendVerificationRequest, UserResponse, AuthResult } from './types';

export class AuthAPI {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  }

  static async login(credentials: LoginRequest): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (response.status === 404) return { ok: false, reason: 'user_not_found' };
      
      // Check response message for both 401 and 403 to handle account deactivated
      if (response.status === 401 || response.status === 403) {
        try {
          // Read response as text (ASP.NET Core returns plain text for Forbid/Unauthorized)
          const errorText = await response.text();
          console.log(`[Login] ${response.status} Response:`, errorText);
          
          // Check if message contains "khóa" (locked/deactivated in Vietnamese) or "deactivated"
          const lowerText = errorText.toLowerCase();
          if (lowerText.includes("khóa") || 
              lowerText.includes("deactivated") || 
              lowerText.includes("account deactivated") ||
              lowerText.includes("bị khóa") ||
              lowerText.includes("đã bị khóa")) {
            console.log("[Login] Detected account deactivated");
            return { ok: false, reason: 'account_deactivated' };
          }
          
          // If 403 and not deactivated, it's not verified
          if (response.status === 403) {
            console.log("[Login] Account not verified");
            return { ok: false, reason: 'not_verified' };
          }
          
          // If 401 and not deactivated, it's invalid password
          if (response.status === 401) {
            console.log("[Login] Invalid password");
            return { ok: false, reason: 'invalid_password' };
          }
        } catch (e) {
          console.error(`[Login] Error parsing ${response.status} response:`, e);
          // Default based on status code
          if (response.status === 401) return { ok: false, reason: 'invalid_password' };
          if (response.status === 403) return { ok: false, reason: 'not_verified' };
        }
      }
      if (!response.ok) return { ok: false, reason: 'invalid' };

      const userData: UserResponse = await this.handleResponse(response);
      return { ok: true, data: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { ok: false, reason: 'network' };
    }
  }

  static async register(userData: RegisterRequest): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.status === 409) return { ok: false, reason: 'duplicate' };
      if (!response.ok) return { ok: false, reason: 'invalid' };

      const newUser: UserResponse = await this.handleResponse(response);
      // Email verification is sent by backend; no extra call here
      return { ok: true, data: newUser };
    } catch (error) {
      console.error('Register error:', error);
      return { ok: false, reason: 'network' };
    }
  }

  static async verifyEmail(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.AUTH.VERIFY}?token=${encodeURIComponent(token)}`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Verify email error:', error);
      return false;
    }
  }

  static async addRole(userId: number, role: string): Promise<boolean> {
    try {
      // Get current user ID from localStorage for authorization
      const currentUserId = localStorage.getItem("bidnow_user") 
        ? JSON.parse(localStorage.getItem("bidnow_user")!).id 
        : null;
      
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.USERS.ADD_ROLE(userId)}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId || ''
        },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      return response.ok;
    } catch (error) {
      console.error('Add role error:', error);
      return false;
    }
  }

  static async resendVerification(request: ResendVerificationRequest): Promise<{ token?: string }> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.AUTH.RESEND_VERIFICATION}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      
      if (response.ok) {
        return await response.json();
      }
      return { token: undefined };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { token: undefined };
    }
  }
}

