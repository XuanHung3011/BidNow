"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AuthAPI, UsersAPI } from "@/lib/api"

export type UserRole = "guest" | "buyer" | "seller" | "admin" | "staff" | "support"

export interface User {
  id: string
  email: string
  name: string
  fullName?: string // Alias for name, for compatibility
  phone?: string
  roles: UserRole[] // Changed from single role to array of roles
  currentRole: UserRole // Current active role
  avatar?: string
  avatarUrl?: string // Alias for avatar, for compatibility
  rating?: number
  totalRatings?: number
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ ok: boolean; reason?: string; role?: UserRole }>
  register: (email: string, password: string, name: string) => Promise<{ ok: boolean; verifyToken?: string; reason?: string }>
  switchRole: (role: UserRole) => void
  addRole: (role: UserRole) => void
  refreshUser: () => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo accounts removed; now using backend

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

      if (user.currentRole === "admin" || user.currentRole === "staff" || user.currentRole === "support") {
        // Admin/Staff/Support are restricted to /admin and /messages only (no homepage/public pages)
        if (!pathname.startsWith("/admin") && !pathname.startsWith("/messages") && !allowedPaths.includes(pathname)) {
          router.push("/admin")
        }
        return
      }

      if (user.currentRole === "seller") {
        // Seller is restricted to /seller, /profile, /settings, /messages only (no homepage/public pages)
        const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))
        if (isPublicPath) {
          router.push("/seller")
          return
        }
        
        if (
          !pathname.startsWith("/seller") &&
          !pathname.startsWith("/profile") &&
          !pathname.startsWith("/settings") &&
          !pathname.startsWith("/messages") &&
          !allowedPaths.includes(pathname)
        ) {
          router.push("/seller")
        }
        return
      }

      // For buyer role, allow navigating to public pages
      const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))
      if (isPublicPath) {
        return
      }

      if (user.currentRole === "buyer") {
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

  const login = async (email: string, password: string): Promise<{ ok: boolean; reason?: string; role?: UserRole }> => {
    const result = await AuthAPI.login({ email, password })
    
    if (result.ok && result.data) {
      const userData = result.data
      const mapped: User = {
        id: String(userData.id),
        email: userData.email,
        name: userData.fullName,
        fullName: userData.fullName,
        phone: userData.phone ?? undefined,
        roles: (userData.roles ?? []) as UserRole[],
        currentRole: ((userData.roles ?? []).includes("admin") ? "admin" : 
                     (userData.roles ?? []).includes("staff") ? "staff" :
                     (userData.roles ?? []).includes("support") ? "support" :
                     (userData.roles ?? []).includes("seller") ? "seller" : "buyer") as UserRole,
        avatar: userData.avatarUrl ?? undefined,
        avatarUrl: userData.avatarUrl ?? undefined,
        rating: userData.reputationScore ?? undefined,
        totalRatings: userData.totalRatings ?? undefined,
      }
      setUser(mapped)
      localStorage.setItem("bidnow_user", JSON.stringify(mapped))
      return { ok: true, role: mapped.currentRole }
    }
    
    return { ok: false, reason: result.reason }
  }

  const register = async (email: string, password: string, name: string): Promise<{ ok: boolean; verifyToken?: string; reason?: string }> => {
    const result = await AuthAPI.register({ email, password, fullName: name })

    // Store pending registration creds for auto login after verification
    if (result.ok) {
      localStorage.setItem("bidnow_pending_register", JSON.stringify({ email, password }))
    }

    // Do NOT log the user in yet
    return result
  }

  const switchRole = (role: UserRole) => {
    if (user && user.roles.includes(role)) {
      const updatedUser = { ...user, currentRole: role }
      setUser(updatedUser)
      localStorage.setItem("bidnow_user", JSON.stringify(updatedUser))
    }
  }

  const addRole = async (role: UserRole) => {
    if (user && !user.roles.includes(role)) {
      // Persist to backend first
      const ok = await AuthAPI.addRole(Number(user.id), role)
      if (!ok) return

      const updatedUser = { 
        ...user, 
        roles: [...user.roles, role],
        currentRole: role
      }
      setUser(updatedUser)
      localStorage.setItem("bidnow_user", JSON.stringify(updatedUser))
    }
  }

  const refreshUser = async () => {
    if (!user?.id) return
    
    try {
      const userData = await UsersAPI.getById(Number(user.id))
      const mapped: User = {
        id: String(userData.id),
        email: userData.email,
        name: userData.fullName,
        fullName: userData.fullName,
        phone: userData.phone ?? undefined,
        roles: user.roles, // Keep existing roles
        currentRole: user.currentRole, // Keep current role
        avatar: userData.avatarUrl ?? undefined,
        avatarUrl: userData.avatarUrl ?? undefined,
        rating: userData.reputationScore ?? undefined,
        totalRatings: userData.totalRatings ?? undefined,
      }
      setUser(mapped)
      localStorage.setItem("bidnow_user", JSON.stringify(mapped))
    } catch (error) {
      console.error("Error refreshing user:", error)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("bidnow_user")
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, login, register, switchRole, addRole, refreshUser, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
