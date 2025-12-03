"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Bell, User, Gavel, LogOut, Settings, Package, ShoppingBag, Shield, MessageSquare, ArrowUpDown, Loader2 } from "lucide-react"
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
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { NotificationsAPI } from "@/lib/api/notifications"
import { NotificationResponseDto } from "@/lib/api/types"
import { MessagesAPI } from "@/lib/api/messages"
import { createMessageHubConnection } from "@/lib/realtime/messageHub"
import type { MessageResponseDto } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export function Header() {
  const { user, logout, switchRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Notifications state
  const [notifications, setNotifications] = useState<NotificationResponseDto[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
  
  // Messages state
  const [unreadMessages, setUnreadMessages] = useState(0)
  
  const userIdNumber = user?.id ? Number(user.id) : null

  // Fetch unread messages count
  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!userIdNumber) {
      setUnreadMessages(0)
      return
    }

    try {
      const unread = await MessagesAPI.getUnreadMessages(userIdNumber)
      setUnreadMessages(unread?.length ?? 0)
    } catch (error) {
      console.error("Failed to fetch unread messages:", error)
    }
  }, [userIdNumber])

  // Fetch unread notifications count
  const fetchUnreadNotificationsCount = useCallback(async () => {
    if (!user) return
    
    try {
      const count = await NotificationsAPI.getUnreadCount(parseInt(user.id))
      setUnreadCount(count)
    } catch (error) {
      console.error("Error fetching unread notifications count:", error)
    }
  }, [user])

  // Fetch notifications list
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    
    try {
      setLoadingNotifications(true)
      const data = await NotificationsAPI.getUnread(parseInt(user.id), 1, 10)
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải thông báo",
        variant: "destructive"
      })
    } finally {
      setLoadingNotifications(false)
    }
  }, [user, toast])

  // Initial load và auto refresh for notifications
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    fetchUnreadNotificationsCount()
    
    // Auto refresh mỗi 30 giây
    const interval = setInterval(() => {
      fetchUnreadNotificationsCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [user, fetchUnreadNotificationsCount])

  // Load notifications khi mở dropdown
  useEffect(() => {
    if (notificationDropdownOpen && user) {
      fetchNotifications()
    }
  }, [notificationDropdownOpen, user, fetchNotifications])

  // Messages: Initial load và SignalR connection
  useEffect(() => {
    fetchUnreadMessagesCount()
  }, [fetchUnreadMessagesCount])

  useEffect(() => {
    if (!userIdNumber) return

    const connection = createMessageHubConnection()
    let started = false

    const handleMessageReceived = (message: MessageResponseDto) => {
      if (message.receiverId === userIdNumber && !message.isRead) {
        setUnreadMessages((prev) => prev + 1)
      }
    }

    const handleNotificationReceived = (notification: NotificationResponseDto) => {
      if (notification.userId === userIdNumber && !notification.isRead) {
        // Tăng unread count
        setUnreadCount((prev) => prev + 1)
        
        // Nếu đang mở dropdown, thêm notification vào danh sách
        setNotifications((prev) => {
          // Kiểm tra xem notification đã có chưa (tránh duplicate)
          const exists = prev.some(n => n.id === notification.id)
          if (exists) return prev
          
          // Thêm vào đầu danh sách
          return [notification, ...prev]
        })
      }
    }

    connection.on("MessageReceived", handleMessageReceived)
    connection.on("NotificationReceived", handleNotificationReceived)

    const startPromise = (async () => {
      try {
        await connection.start()
        started = true
        await connection.invoke("JoinUserGroup", String(userIdNumber))
      } catch (err) {
        console.error("SignalR message hub connection error (header):", err)
      }
    })()

    return () => {
      connection.off("MessageReceived", handleMessageReceived)
      connection.off("NotificationReceived", handleNotificationReceived)
      const cleanup = async () => {
        try {
          await startPromise.catch(() => {})
          if (started && connection) {
            await connection.invoke("LeaveUserGroup", String(userIdNumber)).catch(() => {})
          }
          if (connection) {
            await connection.stop().catch(() => {})
          }
        } catch {
          // Silently ignore all cleanup errors
        }
      }
      void cleanup()
    }
  }, [userIdNumber])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleUnreadSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ count?: number }>
      if (typeof customEvent.detail?.count === "number") {
        setUnreadMessages(customEvent.detail.count)
      } else {
        fetchUnreadMessagesCount()
      }
    }

    const handleWindowFocus = () => {
      fetchUnreadMessagesCount()
    }

    window.addEventListener("messages:unread-sync", handleUnreadSync)
    window.addEventListener("focus", handleWindowFocus)

    return () => {
      window.removeEventListener("messages:unread-sync", handleUnreadSync)
      window.removeEventListener("focus", handleWindowFocus)
    }
  }, [fetchUnreadMessagesCount])

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    if (!user) return
    
    try {
      await NotificationsAPI.markAsRead(notificationId, parseInt(user.id))
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu đã đọc",
        variant: "destructive"
      })
    }
  }, [toast, user])

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!user) return
    
    try {
      await NotificationsAPI.markAllAsRead(parseInt(user.id))
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast({
        title: "Thành công",
        description: "Đã đánh dấu tất cả đã đọc"
      })
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu tất cả đã đọc",
        variant: "destructive"
      })
    }
  }

  // Handle notification click
  const buildNotificationUrl = (link: string | null | undefined, notificationId: number) => {
    if (!link) return null
    try {
      if (typeof window !== "undefined") {
        const url = new URL(link, window.location.origin)
        url.searchParams.set("notificationId", notificationId.toString())
        return `${url.pathname}${url.search}${url.hash}`
      }
    } catch {
      // fallback handled below
    }
    const separator = link.includes("?") ? "&" : "?"
    return `${link}${separator}notificationId=${notificationId}`
  }

  const handleNotificationClick = async (notification: NotificationResponseDto) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }
    
    if (notification.link) {
      setNotificationDropdownOpen(false)
      const target = buildNotificationUrl(notification.link, notification.id) ?? notification.link
      // Use replace to update URL and trigger re-render
      router.replace(target)
      // Force a small delay to ensure navigation completes
      setTimeout(() => {
        router.refresh()
      }, 100)
    }
  }

  const searchParams = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    if (!user) return
    const notificationIdParam = searchParams.get("notificationId")
    if (!notificationIdParam) return
    const notificationId = Number(notificationIdParam)
    if (Number.isNaN(notificationId) || notificationId <= 0) return

    handleMarkAsRead(notificationId).catch(() => {})

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("notificationId")
      const newQuery = params.toString()
      router.replace(`${pathname}${newQuery ? `?${newQuery}` : ""}`, { scroll: false })
    }
  }, [handleMarkAsRead, pathname, router, searchParams, user])

  const parseNotificationDate = (value: string) => {
    if (!value) return new Date()
    const hasTimezoneInfo = /([zZ])|([+\-]\d{2}:?\d{2}$)/.test(value)
    const normalizedValue = hasTimezoneInfo ? value : `${value}Z`

    const parsedUtc = new Date(normalizedValue)
    if (!Number.isNaN(parsedUtc.getTime())) {
      return parsedUtc
    }

    const fallback = new Date(value)
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback
  }

  const formatTime = (dateString: string) => {
    const date = parseNotificationDate(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Vừa xong"
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  const handleLogout = () => {
    logout()
  }

  const getRoleDashboard = () => {
    switch (user?.currentRole) {
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

  const isRestrictedRole = user?.currentRole === "admin"
  const hasMultipleRoles = user?.roles && user.roles.length > 1

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Gavel className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">BidNow</span>
        </Link>

        {!isRestrictedRole && user?.currentRole !== "seller" && (
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

              <DropdownMenu open={notificationDropdownOpen} onOpenChange={setNotificationDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Thông báo</span>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAllAsRead()
                        }}
                      >
                        Đánh dấu tất cả đã đọc
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[400px]">
                    {loadingNotifications ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Không có thông báo mới</p>
                      </div>
                    ) : (
                      <div className="py-1">
                        {notifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start justify-between w-full gap-2">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.isRead ? "font-semibold" : ""}`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatTime(notification.createdAt)}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {notifications.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      {/* <DropdownMenuItem
                        className="justify-center text-xs text-muted-foreground cursor-pointer"
                        onClick={() => router.push("/notifications")}
                      >
                        Xem tất cả thông báo
                      </DropdownMenuItem> */}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

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
                      <div className="flex items-center gap-2">
                        <p className="text-xs leading-none text-primary capitalize">{user.currentRole}</p>
                        {hasMultipleRoles && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {user.roles.length} roles
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {hasMultipleRoles && (
                    <>
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Chuyển đổi vai trò</DropdownMenuLabel>
                      {user.roles.map((role) => (
                        <DropdownMenuItem
                          key={role}
                          onClick={() => switchRole(role)}
                          className={user.currentRole === role ? "bg-primary/10" : ""}
                        >
                          <ArrowUpDown className="mr-2 h-4 w-4" />
                          {role === "admin" && "Quản trị viên"}
                          {role === "seller" && "Người bán"}
                          {role === "buyer" && "Người mua"}
                          {user.currentRole === role && " (Hiện tại)"}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem onClick={() => router.push(getRoleDashboard())}>
                    {user.currentRole === "admin" && <Shield className="mr-2 h-4 w-4" />}
                    {user.currentRole === "seller" && <Package className="mr-2 h-4 w-4" />}
                    {user.currentRole === "buyer" && <ShoppingBag className="mr-2 h-4 w-4" />}
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
