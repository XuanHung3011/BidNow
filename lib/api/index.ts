// Export all API services
export { AuthAPI } from './auth';
export { PasswordAPI } from './password';
export { API_BASE, API_ENDPOINTS } from './config';
export type {
  ApiResponse,
  UserResponse,
  LoginRequest,
  RegisterRequest,
  ResendVerificationRequest,
  AuthResult,
} from './types';

// lib/api/index.ts
export * from './config'
export * from './types'
export * from './items'
export * from './categories'
export * from './auctions'
export * from './users'
export * from './messages'
export * from './favorite-sellers'
export * from './watchlist'
export * from './recommendations'
export * from './auto-bids'
export * from './auction-chat'
export * from './ratings'
