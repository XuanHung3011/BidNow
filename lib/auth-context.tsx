"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AuthAPI } from "@/lib/api"

export type UserRole = "guest" | "buyer" | "seller" | "admin"

export interface User {
  id: string
  email: string
  name: string
  roles: UserRole[] // Changed from single role to array of roles
  currentRole: UserRole // Current active role
  avatar?: string
  rating?: number
  totalRatings?: number
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ ok: boolean; reason?: string }>
  register: (email: string, password: string, name: string) => Promise<{ ok: boolean; verifyToken?: string; reason?: string }>
  switchRole: (role: UserRole) => void
  addRole: (role: UserRole) => void
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

      // Allow navigating to public pages for all roles
      const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))
      if (isPublicPath) {
        return
      }

      if (user.currentRole === "admin") {
        // Admin can only access /admin and /messages
        if (!pathname.startsWith("/admin") && !pathname.startsWith("/messages") && !allowedPaths.includes(pathname)) {
          router.push("/admin")
        }
      } else if (user.currentRole === "seller") {
        if (
          !pathname.startsWith("/seller") &&
          !pathname.startsWith("/profile") &&
          !pathname.startsWith("/settings") &&
          !pathname.startsWith("/messages") &&
          !allowedPaths.includes(pathname)
        ) {
          router.push("/seller")
        }
      } else if (user.currentRole === "buyer") {
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

  const login = async (email: string, password: string): Promise<{ ok: boolean; reason?: string }> => {
    const result = await AuthAPI.login({ email, password })
    
    if (result.ok && result.data) {
      const userData = result.data
      const mapped: User = {
        id: String(userData.id),
        email: userData.email,
        name: userData.fullName,
        roles: (userData.roles ?? []).includes("admin") ? (["admin"] as UserRole[]) : (["buyer"] as UserRole[]),
        currentRole: ((userData.roles ?? []).includes("admin") ? "admin" : "buyer") as UserRole,
        avatar: userData.avatarUrl ?? undefined,
        rating: userData.reputationScore ?? undefined,
        totalRatings: userData.totalRatings ?? undefined,
      }
      setUser(mapped)
      localStorage.setItem("bidnow_user", JSON.stringify(mapped))
      return { ok: true }
    }
    
    return { ok: false, reason: result.reason }
  }

  const register = async (email: string, password: string, name: string): Promise<{ ok: boolean; verifyToken?: string; reason?: string }> => {
    const result = await AuthAPI.register({ email, password, fullName: name })
    return result
  }

  const switchRole = (role: UserRole) => {
    if (user && user.roles.includes(role)) {
      const updatedUser = { ...user, currentRole: role }
      setUser(updatedUser)
      localStorage.setItem("bidnow_user", JSON.stringify(updatedUser))
    }
  }

  const addRole = (role: UserRole) => {
    if (user && !user.roles.includes(role)) {
      const updatedUser = { 
        ...user, 
        roles: [...user.roles, role],
        currentRole: role // Switch to the new role
      }
      setUser(updatedUser)
      localStorage.setItem("bidnow_user", JSON.stringify(updatedUser))
      
      // Also update in registered users
      const users = JSON.parse(localStorage.getItem("bidnow_users") || "[]")
      const userIndex = users.findIndex((u: any) => u.id === user.id)
      if (userIndex !== -1) {
        users[userIndex].roles = updatedUser.roles
        users[userIndex].currentRole = updatedUser.currentRole
        localStorage.setItem("bidnow_users", JSON.stringify(users))
      }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("bidnow_user")
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, login, register, switchRole, addRole, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
