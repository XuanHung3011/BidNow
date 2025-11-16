export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5167";

/**
 * Tạo URL đầy đủ cho ảnh từ tên file
 * Ảnh được serve qua endpoint /images/ trên backend
 */
export function getImageUrl(imageName?: string | null): string {
  if (!imageName) return "/placeholder.svg";
  
  // Nếu đã là URL đầy đủ (bắt đầu bằng http), trả về nguyên
  if (imageName.startsWith("http://") || imageName.startsWith("https://")) {
    return imageName;
  }
  
  // Nếu đã có /images/ trong path, chỉ cần thêm API_BASE
  if (imageName.startsWith("/images/")) {
    return `${API_BASE}${imageName}`;
  }
  
  // Nếu chỉ là tên file, thêm API_BASE + /images/
  return `${API_BASE}/images/${imageName}`;
}

/**
 * Parse và tạo URLs cho nhiều ảnh từ string (comma-separated) hoặc array
 */
export function getImageUrls(images?: string | string[] | null): string[] {
  if (!images) return ["/placeholder.svg"];
  
  if (typeof images === "string") {
    // Thử parse JSON nếu có
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        return parsed.map(img => getImageUrl(img));
      }
    } catch {
      // Không phải JSON, xử lý như comma-separated string
      if (images.includes(",")) {
        return images.split(",").map(img => getImageUrl(img.trim())).filter(Boolean);
      }
      return [getImageUrl(images)];
    }
  }
  
  if (Array.isArray(images)) {
    return images.map(img => getImageUrl(img)).filter(Boolean);
  }
  
  return ["/placeholder.svg"];
}

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
    UPDATE_STATUS: (id: number) => `/api/AdminAuctions/${id}/status`,
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
    // Buyer endpoints
    GET_BUYER_ACTIVE_BIDS: (bidderId: number) => `/api/Auctions/buyer/${bidderId}/active`,
    GET_BUYER_WON_AUCTIONS: (bidderId: number) => `/api/Auctions/buyer/${bidderId}/won`,
    GET_BUYER_BIDDING_HISTORY: (bidderId: number) => `/api/Auctions/buyer/${bidderId}/history`,
  },
  NOTIFICATIONS: {
    GET_ALL: (userId: number) => `/api/Notifications/user/${userId}`,
    GET_UNREAD: (userId: number) => `/api/Notifications/user/${userId}/unread`,
    GET_UNREAD_COUNT: (userId: number) => `/api/Notifications/user/${userId}/unread-count`,
    CREATE: "/api/Notifications",
    MARK_AS_READ: (id: number) => `/api/Notifications/${id}/read`,
    MARK_ALL_AS_READ: (userId: number) => `/api/Notifications/user/${userId}/mark-all-read`,
    DELETE: (id: number) => `/api/Notifications/${id}`,
  },
  WATCHLIST: {
    ADD: "/api/Watchlist/add",
    REMOVE: "/api/Watchlist/remove",
    GET_BY_USER: (userId: number) => `/api/Watchlist/user/${userId}`,
    GET_DETAIL: (watchlistId: number) => `/api/Watchlist/detail/${watchlistId}`,
    GET_BY_USER_AUCTION: (userId: number, auctionId: number) => 
      `/api/Watchlist/user/${userId}/auction/${auctionId}`,
  }
} as const;

