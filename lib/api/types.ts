// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success: boolean;
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  reputationScore?: number;
  totalRatings?: number;
  totalSales?: number;
  totalPurchases?: number;
  isActive?: boolean;
  createdAt?: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ResendVerificationRequest {
  userId: number;
  email: string;
}

export interface AuthResult {
  ok: boolean;
  reason?: string;
  verifyToken?: string;
  data?: UserResponse;
}
