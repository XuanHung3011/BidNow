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
  }
} as const;

