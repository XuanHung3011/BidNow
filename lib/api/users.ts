// lib/api/users.ts
import { API_BASE, API_ENDPOINTS } from './config';
import { 
  UserResponse, 
  UserCreateDto, 
  UserUpdateDto, 
  ChangePasswordDto, 
  UserLoginDto,
  AddRoleRequest,
  ValidateCredentialsResponse 
} from './types';

export class UsersAPI {
  private static async handleResponse<T>(response: Response): Promise<T> {
    // Handle 204 No Content - no body expected
    if (response.status === 204) {
      return undefined as T;
    }
    
    // Read response text (Fetch API will return empty string if no body)
    let responseText = '';
    try {
      responseText = await response.text();
    } catch (error: any) {
      // If we can't read the body
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}: ${error.message || 'Unable to read response'}`);
      }
      // If response is ok but we can't read body, return undefined
      return undefined as T;
    }
    
    // Handle error responses (status code >= 400)
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      
      // Try to parse error message from response body
      if (responseText && responseText.trim().length > 0) {
        try {
          const error = JSON.parse(responseText);

          // Nếu là lỗi validation (ASP.NET style) thì map sang tiếng Việt thân thiện
          if (error.errors && typeof error.errors === 'object') {
            const friendlyMessages: string[] = [];

            // Phone validation
            if (error.errors.Phone) {
              friendlyMessages.push('Số điện thoại không hợp lệ');
            }

            // AvatarUrl validation
            if (error.errors.AvatarUrl) {
              friendlyMessages.push('URL avatar không hợp lệ');
            }

            if (friendlyMessages.length > 0) {
              errorMessage = friendlyMessages.join(', ');
            } else {
              // Fallback: ghép tất cả message validation lại
              const errorDetails = Object.values(error.errors).flat().join(', ');
              errorMessage = (error.message || error.error || error.title || errorMessage) +
                             (errorDetails ? `: ${errorDetails}` : '');
            }
          } else {
            // Các lỗi khác: dùng message/error/title hoặc text gốc
            errorMessage = error.message || error.error || error.title || errorMessage;
          }
        } catch (e) {
          // If not JSON, use text as error message (could be plain text error from server)
          errorMessage = responseText.trim() || errorMessage;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Handle successful responses with no content (empty body)
    if (!responseText || responseText.trim().length === 0) {
      return undefined as T;
    }
    
    // Parse JSON for successful responses
    try {
      return JSON.parse(responseText) as T;
    } catch (error: any) {
      console.error('Error parsing JSON response:', error);
      console.error('Response status:', response.status);
      console.error('Response text (first 500 chars):', responseText.substring(0, 500));
      throw new Error(`Invalid JSON response from server: ${error.message}`);
    }
  }

  /**
   * Get all users with pagination
   */
  static async getAll(page: number = 1, pageSize: number = 10): Promise<UserResponse[]> {
    try {
      const response = await fetch(
        `${API_BASE}${API_ENDPOINTS.USERS.GET_ALL}?page=${page}&pageSize=${pageSize}`
      );
      return await this.handleResponse<UserResponse[]>(response);
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getById(id: number): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.USERS.GET_BY_ID(id)}`);
      return await this.handleResponse<UserResponse>(response);
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  static async getByEmail(email: string): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.USERS.GET_BY_EMAIL(email)}`);
      return await this.handleResponse<UserResponse>(response);
    } catch (error) {
      console.error('Get user by email error:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  static async create(userData: UserCreateDto): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.USERS.CREATE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return await this.handleResponse<UserResponse>(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(id: number, userData: UserUpdateDto): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.USERS.UPDATE(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return await this.handleResponse<UserResponse>(response);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(id: number, passwordData: ChangePasswordDto): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}${API_ENDPOINTS.USERS.CHANGE_PASSWORD(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordData),
    });
    return await this.handleResponse<{ message: string }>(response);
  }

  /**
   * Activate user
   */
  static async activate(id: number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.USERS.ACTIVATE(id)}`, {
        method: 'PUT',
      });
      return await this.handleResponse<{ message: string }>(response);
    } catch (error) {
      console.error('Activate user error:', error);
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  static async deactivate(id: number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.USERS.DEACTIVATE(id)}`, {
        method: 'PUT',
      });
      return await this.handleResponse<{ message: string }>(response);
    } catch (error) {
      console.error('Deactivate user error:', error);
      throw error;
    }
  }

  /**
   * Add role to user
   */
  static async addRole(userId: number, role: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.USERS.ADD_ROLE(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role } as AddRoleRequest),
      });
      return await this.handleResponse<{ message: string }>(response);
    } catch (error) {
      console.error('Add role error:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  static async removeRole(userId: number, role: string): Promise<{ message: string }> {
    try {
      const url = `${API_BASE}${API_ENDPOINTS.USERS.REMOVE_ROLE(userId, role)}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return await this.handleResponse<{ message: string }>(response);
    } catch (error: any) {
      // Handle network errors (CORS, connection issues, etc.)
      if (error instanceof TypeError) {
        // Network errors: failed to fetch, CORS, etc.
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc cấu hình CORS.');
        }
      }
      // Re-throw other errors (handled by handleResponse)
      throw error;
    }
  }

  /**
   * Search users
   */
  static async search(searchTerm: string, page: number = 1, pageSize: number = 10): Promise<UserResponse[]> {
    try {
      const response = await fetch(
        `${API_BASE}${API_ENDPOINTS.USERS.SEARCH}?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${pageSize}`
      );
      return await this.handleResponse<UserResponse[]>(response);
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  /**
   * Validate user credentials
   */
  static async validateCredentials(credentials: UserLoginDto): Promise<ValidateCredentialsResponse> {
    try {
      const response = await fetch(`${API_BASE}${API_ENDPOINTS.USERS.VALIDATE_CREDENTIALS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return await this.handleResponse<ValidateCredentialsResponse>(response);
    } catch (error) {
      console.error('Validate credentials error:', error);
      throw error;
    }
  }
}

