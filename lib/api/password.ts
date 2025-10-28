import { API_BASE, API_ENDPOINTS } from './config';
import { ForgotPasswordRequest, ResetPasswordRequest } from './types';

export class PasswordAPI {
  private static async handleOk(response: Response): Promise<boolean> {
    return response.ok;
  }

  static async forgotPassword(payload: ForgotPasswordRequest): Promise<{ ok: boolean; reason?: 'not_found' | 'invalid' }>{
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email }),
      });
      if (response.status === 404) return { ok: false, reason: 'not_found' }
      if (!response.ok) return { ok: false, reason: 'invalid' }
      return { ok: true }
    } catch (e) {
      console.error('Forgot password error:', e);
      return { ok: false, reason: 'invalid' };
    }
  }

  static async resetPassword(payload: ResetPasswordRequest): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await this.handleOk(response);
    } catch (e) {
      console.error('Reset password error:', e);
      return false;
    }
  }
}


