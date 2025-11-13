export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5167";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/Auth/login",
    REGISTER: "/api/Auth/register", 
    VERIFY: "/api/Auth/verify",
    RESEND_VERIFICATION: "/api/Auth/resend-verification",
    FORGOT_PASSWORD: "/api/Auth/forgot-password",
    RESET_PASSWORD: "/api/Auth/reset-password",
  },
    USERS: {
    GET_ALL: "/api/Users",
    GET_BY_ID: (id: number) => `/api/Users/${id}`,
    GET_BY_EMAIL: (email: string) => `/api/Users/email/${encodeURIComponent(email)}`,
    CREATE: "/api/Users",
    UPDATE: (id: number) => `/api/Users/${id}`,
    CHANGE_PASSWORD: (id: number) => `/api/Users/${id}/change-password`,
    ACTIVATE: (id: number) => `/api/Users/${id}/activate`,
    DEACTIVATE: (id: number) => `/api/Users/${id}/deactivate`,
    ADD_ROLE: (userId: number) => `/api/Users/${userId}/roles`,
    REMOVE_ROLE: (userId: number, role: string) => `/api/Users/${userId}/roles/${encodeURIComponent(role)}`,
    SEARCH: "/api/Users/search",
    VALIDATE_CREDENTIALS: "/api/Users/validate-credentials",
  },
    ITEMS: {
    GET_ALL: "/api/home/items",
    GET_PAGED: "/api/home/items/paged",
    SEARCH: "/api/home/search",
    SEARCH_PAGED: "/api/home/search/paged",
    FILTER: "/api/home/filter",            // <-- endpoint filter (POST)
    CATEGORIES: "/api/home/categories",
    HOT: "/api/home/hot",
    // Admin/Seller endpoints
    GET_ALL_WITH_FILTER: "/api/Items",
    GET_BY_ID: (id: number) => `/api/Items/${id}`,
    CREATE: "/api/Items",
    APPROVE: (id: number) => `/api/Items/${id}/approve`,
    REJECT: (id: number) => `/api/Items/${id}/reject`,
  },
  CATEGORIES: {
    GET_ALL: "/api/Categories",
    GET_PAGED: "/api/Categories/paged",
    GET_BY_ID: "/api/Categories",
    GET_BY_SLUG: "/api/Categories/slug",
    CREATE: "/api/Categories",
    UPDATE: "/api/Categories",
    DELETE: "/api/Categories",
    CHECK_SLUG: "/api/Categories/check-slug",
    CHECK_NAME: "/api/Categories/check-name",
    CHECK_IN_USE: "/api/Categories",

  },
  MESSAGES: {
    SEND: "/api/Messages", // POST - Gửi tin nhắn
    CONVERSATIONS: "/api/Messages/conversations", // GET - Danh sách hội thoại
    CONVERSATION: "/api/Messages/conversation", // GET - Chi tiết cuộc hội thoại
    MARK_READ: (messageId: number) => `/api/Messages/${messageId}/read`, // PUT - Đánh dấu đã đọc
    UNREAD: "/api/Messages/unread", // GET - Tin nhắn chưa đọc
    ALL: "/api/Messages/all", // GET - Tất cả tin nhắn (đã gửi và đã nhận)
  },
  FAVORITE_SELLERS: {
    GET_MY_FAVORITES: "/api/FavoriteSellers",
    CHECK_IS_FAVORITE: (sellerId: number) => `/api/FavoriteSellers/check/${sellerId}`,
    ADD_FAVORITE: "/api/FavoriteSellers",
    REMOVE_FAVORITE: (sellerId: number) => `/api/FavoriteSellers/${sellerId}`,
  },
  ADMIN_STATS: {
    GET_STATS: "/api/AdminStats",
  },
  ADMIN_AUCTIONS: {
    GET_ALL: "/api/AdminAuctions",
    GET_BY_ID: (id: number) => `/api/AdminAuctions/${id}`,
  },
  PLATFORM_ANALYTICS: {
    GET_ANALYTICS: "/api/PlatformAnalytics",
  },
  AUCTIONS: {
    GET_BY_ID: (id: number) => `/api/Auctions/${id}`,
    CREATE: "/api/Auctions",
    GET_PENDING: "/api/Auctions/pending",
    APPROVE: (id: number) => `/api/Auctions/${id}/approve`,
    REJECT: (id: number) => `/api/Auctions/${id}/reject`,
    GET_BUYER_ACTIVE_BIDS: (bidderId: number) => `/api/Auctions/buyer/${bidderId}/active`,
  }
} as const;

