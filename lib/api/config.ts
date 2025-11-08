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
    GET_BY_ID: "/api/Users",
    SEARCH: "/api/Users/search",
    ADD_ROLE: (userId: number) => `/api/Users/${userId}/roles`,
    REMOVE_ROLE: (userId: number, role: string) => `/api/Users/${userId}/roles/${encodeURIComponent(role)}`,
  },
    ITEMS: {
    GET_ALL: "/api/home/items",
    GET_PAGED: "/api/home/items/paged",
    SEARCH: "/api/home/search",
    SEARCH_PAGED: "/api/home/search/paged",
    FILTER: "/api/home/filter",            // <-- endpoint filter (POST)
    CATEGORIES: "/api/home/categories",
    HOT: "/api/home/hot",
    // Admin endpoints
    GET_ALL_WITH_FILTER: "/api/Items",
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
    SEND: "/api/Messages/send",
    CREATE_CONVERSATION: "/api/Messages/create-conversation",
    CONVERSATION: "/api/Messages/conversation",
    CONVERSATIONS: (userId: number) => `/api/Messages/conversations/${userId}`,
    UNREAD: (userId: number) => `/api/Messages/unread/${userId}`,
    UNREAD_COUNT: (userId: number) => `/api/Messages/unread-count/${userId}`,
    MARK_READ: (messageId: number) => `/api/Messages/read/${messageId}`,
    MARK_CONVERSATION_READ: "/api/Messages/conversation/read",
    GET_BY_ID: (messageId: number) => `/api/Messages/${messageId}`,
  }
} as const;

