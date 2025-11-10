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
  id: number;
  title: string;
  description?: string;
  basePrice?: number;
  condition?: string;
  images?: string | string[];
  location?: string;
  status?: string;
  createdAt?: string;
  categoryId?: number;
  categoryName?: string;
  sellerId?: number;
  sellerName?: string;
  sellerAvatar?: string;
  auctionId?: number | null;
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

export interface ItemFilterAllDto {
  statuses?: string[] | null;
  categoryId?: number | null;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Category Management Types
export interface CategoryDtos {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt?: string;
}

export interface CreateCategoryDtos {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface UpdateCategoryDtos {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface CategoryFilterDto {
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Message Types
export interface SendMessageRequest {
  senderId: number;
  receiverId: number;
  auctionId?: number | null;
  content: string;
}

export interface CreateConversationByEmailRequest {
  senderId: number;
  receiverEmail: string;
  auctionId?: number | null;
  initialMessage?: string | null;
}

export interface MessageResponseDto {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl?: string | null;
  receiverId: number;
  receiverName: string;
  receiverAvatarUrl?: string | null;
  auctionId?: number | null;
  auctionTitle?: string | null;
  content: string;
  isRead: boolean;
  sentAt?: string | null;
}

export interface ConversationDto {
  otherUserId: number;
  otherUserName: string;
  otherUserAvatarUrl?: string | null;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  unreadCount: number;
  auctionId?: number | null;
  auctionTitle?: string | null;
}
