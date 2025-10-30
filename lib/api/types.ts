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
export interface ItemResponseDto {
  id: string;
  title: string;
  description?: string;
  basePrice?: number;
  condition?: string;
  images?: string[];
  location?: string;
  status?: string;
  createdAt?: string;
  categoryId?: string;
  categoryName?: string;
  sellerId?: string;
  sellerName?: string;
  sellerAvatar?: string;
  auctionId?: string | null;
  startingBid?: number | null;
  currentBid?: number | null;
  bidCount?: number | null;
  auctionEndTime?: string | null;
  auctionStatus?: string | null;
}
export interface CategoryDto {
  id: number;
  name: string;
  slug?: string;
  icon?: string | null;
}
export interface ItemFilterDto {
  searchTerm?: string | null;

  categoryIds?: number[] | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  
  auctionStatuses?: string[] | null;
  condition?: string | null;
}