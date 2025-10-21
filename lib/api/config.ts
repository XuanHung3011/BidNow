export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5167";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/Auth/login",
    REGISTER: "/api/Auth/register", 
    VERIFY: "/api/Auth/verify",
    RESEND_VERIFICATION: "/api/Auth/resend-verification",
  },
  USERS: {
    GET_ALL: "/api/Users",
    GET_BY_ID: "/api/Users",
    SEARCH: "/api/Users/search",
  }
} as const;
