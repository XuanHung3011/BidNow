"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Bell, User, Gavel, LogOut, Settings, Package, ShoppingBag, Shield, MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const unreadMessages = 3

  const handleLogout = () => {
    logout()
  }

  const getRoleDashboard = () => {
    switch (user?.role) {
      case "admin":
        return "/admin"
      case "seller":
        return "/seller"
      case "buyer":
        return "/buyer"
      default:
        return "/"
    }
  }

  const isRestrictedRole = user?.role === "admin"

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Gavel className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">BidNow</span>
        </Link>

        {!isRestrictedRole && user?.role !== "seller" && (
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Trang chủ
            </Link>
            <Link
              href="/auctions"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Đấu giá
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Danh mục
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Về chúng tôi
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {!isRestrictedRole && (
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => router.push("/search")}>
              <Search className="h-5 w-5" />
            </Button>
          )}

          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/messages")}>
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadMessages}
                  </Badge>
                )}
              </Button>

              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      <p className="text-xs leading-none text-primary capitalize">{user.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => router.push(getRoleDashboard())}>
                    {user.role === "admin" && <Shield className="mr-2 h-4 w-4" />}
                    {user.role === "seller" && <Package className="mr-2 h-4 w-4" />}
                    {user.role === "buyer" && <ShoppingBag className="mr-2 h-4 w-4" />}
                    Dashboard
                  </DropdownMenuItem>

                  {!isRestrictedRole && (
                    <>
                      <DropdownMenuItem onClick={() => router.push("/profile")}>
                        <User className="mr-2 h-4 w-4" />
                        Hồ sơ
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => router.push("/settings")}>
                        <Settings className="mr-2 h-4 w-4" />
                        Cài đặt
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
              <Button className="hidden md:flex" onClick={() => router.push("/login")}>
                Đăng nhập
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
