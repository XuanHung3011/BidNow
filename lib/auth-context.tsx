"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

export type UserRole = "guest" | "buyer" | "seller" | "admin"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  rating?: number
  totalRatings?: number
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo accounts for testing
const DEMO_ACCOUNTS = [
  {
    id: "1",
    email: "admin@bidnow.com",
    password: "admin123",
    name: "Admin User",
    role: "admin" as UserRole,
  },
  {
    id: "2",
    email: "seller@bidnow.com",
    password: "seller123",
    name: "Seller User",
    role: "seller" as UserRole,
  },
  {
    id: "3",
    email: "buyer@bidnow.com",
    password: "buyer123",
    name: "Buyer User",
    role: "buyer" as UserRole,
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("bidnow_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading && user) {
      const allowedPaths = ["/login", "/register"]
      const publicPaths = ["/", "/about", "/contact", "/auctions", "/auction", "/categories", "/search"]

      // Allow navigating to public pages for all roles
      const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))
      if (isPublicPath) {
        return
      }

      if (user.role === "admin") {
        // Admin can only access /admin and /messages
        if (!pathname.startsWith("/admin") && !pathname.startsWith("/messages") && !allowedPaths.includes(pathname)) {
          router.push("/admin")
        }
      } else if (user.role === "seller") {
        if (
          !pathname.startsWith("/seller") &&
          !pathname.startsWith("/profile") &&
          !pathname.startsWith("/settings") &&
          !pathname.startsWith("/messages") &&
          !allowedPaths.includes(pathname)
        ) {
          router.push("/seller")
        }
      } else if (user.role === "buyer") {
        if (
          !pathname.startsWith("/buyer") &&
          !pathname.startsWith("/messages") &&
          !pathname.startsWith("/profile") &&
          !pathname.startsWith("/settings") &&
          !pathname.startsWith("/auction") &&
          !pathname.startsWith("/auctions") &&
          !pathname.startsWith("/categories") &&
          !pathname.startsWith("/search") &&
          pathname !== "/" &&
          !allowedPaths.includes(pathname)
        ) {
          router.push("/buyer")
        }
      }
    }
  }, [user, pathname, isLoading, router])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check demo accounts
    const account = DEMO_ACCOUNTS.find((acc) => acc.email === email && acc.password === password)

    if (account) {
      const { password: _, ...userWithoutPassword } = account
      setUser(userWithoutPassword)
      localStorage.setItem("bidnow_user", JSON.stringify(userWithoutPassword))
      return true
    }

    // Check registered users
    const users = JSON.parse(localStorage.getItem("bidnow_users") || "[]")
    const registeredUser = users.find((u: any) => u.email === email && u.password === password)

    if (registeredUser) {
      const { password: _, ...userWithoutPassword } = registeredUser
      setUser(userWithoutPassword)
      localStorage.setItem("bidnow_user", JSON.stringify(userWithoutPassword))
      return true
    }

    return false
  }

  const register = async (email: string, password: string, name: string, role: UserRole): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem("bidnow_users") || "[]")

    // Check if email already exists
    if (users.some((u: any) => u.email === email)) {
      return false
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role,
    }

    users.push(newUser)
    localStorage.setItem("bidnow_users", JSON.stringify(users))

    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem("bidnow_user", JSON.stringify(userWithoutPassword))

    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("bidnow_user")
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
