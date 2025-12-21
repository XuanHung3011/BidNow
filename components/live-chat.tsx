"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, RefreshCcw, Send } from "lucide-react"
import { AuctionChatAPI } from "@/lib/api/auction-chat"
import type { AuctionChatMessageDto } from "@/lib/api/types"
import { useAuth } from "@/lib/auth-context"
import { createMessageHubConnection } from "@/lib/realtime/messageHub"
import type { HubConnection } from "@microsoft/signalr"

interface LiveChatProps {
  auctionId: number
}

// Helper: build alias giống backend (AuctionChatService.BuildAlias)
const buildAliasFromUserId = (userId?: string | number | null) => {
  if (userId == null) return null
  const parsed = typeof userId === "string" ? Number(userId) : userId
  if (!Number.isFinite(parsed)) return null
  const sanitized = Math.abs(parsed).toString()
  const suffix = sanitized.length <= 4 ? sanitized.padStart(4, "0") : sanitized.slice(-4)
  return `Người dùng #${suffix}`
}

const formatRelativeTime = (value?: string) => {
  if (!value) return "Vừa xong"
  
  // Parse date - handle UTC datetime từ backend
  let date: Date
  try {
    // Backend trả về UTC datetime, có thể có hoặc không có timezone info
    const timezonePattern = /([zZ])|([+\-]\d{2}:?\d{2}$)/
    const hasTimezoneInfo = timezonePattern.test(value)
    
    let normalizedValue = value
    if (!hasTimezoneInfo) {
      // Nếu không có timezone, thêm 'Z' để đánh dấu là UTC
      if (value.includes('T') && !value.includes('Z') && !value.includes('+') && !value.includes('-', value.indexOf('T'))) {
        normalizedValue = value + 'Z'
      } else if (!value.includes('T') && value.includes(' ')) {
        normalizedValue = value.replace(' ', 'T') + 'Z'
      }
    }
    
    date = new Date(normalizedValue)
    if (Number.isNaN(date.getTime())) {
      date = new Date(value) // Fallback
    }
  } catch {
    date = new Date(value)
  }
  
  if (Number.isNaN(date.getTime())) return "Vừa xong"
  
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  
  // Nếu diffMs < 0, có nghĩa là date trong tương lai (timezone issue)
  if (diffMs < 0) {
    return "Vừa xong"
  }
  
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Vừa xong"
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString("vi-VN")
}

const formatFullTime = (value?: string) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function LiveChat({ auctionId }: LiveChatProps) {
  const { user } = useAuth()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const scrollToBottomRef = useRef<(force?: boolean) => void>(undefined)

  const [messages, setMessages] = useState<AuctionChatMessageDto[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")

  const fetchMessages = useCallback(async () => {
    if (!auctionId) return
    setError(null)
    setLoading(true)
    try {
      const data = await AuctionChatAPI.list(auctionId, user?.id ? Number(user.id) : undefined)
      // Merge với messages hiện tại để không mất messages từ SignalR
      setMessages((prev) => {
        // Create a map of existing messages by ID
        const existingMap = new Map(prev.map(m => [m.id, m]))
        // Add new messages, keeping existing ones
        data.forEach(msg => {
          if (!existingMap.has(msg.id)) {
            existingMap.set(msg.id, msg)
          }
        })
        // Sort by sentAt to maintain order
        return Array.from(existingMap.values()).sort((a, b) => {
          const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0
          const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0
          return timeA - timeB
        })
      })
    } catch (err: any) {
      setError(err?.message || "Không thể tải bình luận")
    } finally {
      setLoading(false)
    }
  }, [auctionId, user?.id])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Auto scroll to bottom when new message arrives (only if user is near bottom)
  const scrollToBottom = useCallback((force = false) => {
    // Find the ScrollArea viewport element
    const scrollContainer = scrollViewportRef.current?.closest('[data-slot="scroll-area"]')
    const viewport = scrollContainer?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
    
    if (!viewport) return
    
    const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100
    
    // Only auto scroll if user is near bottom or force scroll (when sending own message)
    if (force || shouldAutoScrollRef.current || isNearBottom) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: force ? "auto" : "smooth"
      })
      shouldAutoScrollRef.current = true
    }
  }, [])

  // Store scrollToBottom in ref for use in SignalR handler
  useEffect(() => {
    scrollToBottomRef.current = scrollToBottom
  }, [scrollToBottom])

  // Track scroll position to determine if user is viewing old messages
  const handleScroll = useCallback(() => {
    const scrollContainer = scrollViewportRef.current?.closest('[data-slot="scroll-area"]')
    const viewport = scrollContainer?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
    
    if (!viewport) return
    
    const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100
    shouldAutoScrollRef.current = isNearBottom
  }, [])

  useEffect(() => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      scrollToBottom(false)
    }, 100)
  }, [messages, scrollToBottom])

  // Attach scroll listener to viewport
  useEffect(() => {
    const scrollContainer = scrollViewportRef.current?.closest('[data-slot="scroll-area"]')
    const viewport = scrollContainer?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
    
    if (!viewport) return
    
    viewport.addEventListener('scroll', handleScroll)
    
    return () => {
      viewport.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // SignalR connection for real-time messages
  useEffect(() => {
    if (!auctionId) return

    let connection: HubConnection | null = null
    let mounted = true
    let connectionStarted = false
    let isStarting = false

    const setupConnection = async () => {
      try {
        connection = createMessageHubConnection()
        isStarting = true

        // Register event handler BEFORE starting connection
        connection.on("AuctionChatMessageReceived", (newMessage: AuctionChatMessageDto) => {
          console.log("🔔 SignalR: Received real-time message:", newMessage)
          if (!mounted) {
            console.log("🔔 Component unmounted, ignoring message")
            return
          }
          // Since we're in the auction-specific group, all messages are for this auction
          console.log("🔔 Message received, adding to state")
          setMessages((prev) => {
            // Check if message already exists (avoid duplicates)
            if (prev.some((m) => m.id === newMessage.id)) {
              console.log("🔔 Message already exists, skipping:", newMessage.id)
              return prev
            }
            console.log("🔔 Adding new message to list:", newMessage.id, "Total messages:", prev.length + 1)
            return [...prev, newMessage]
          })
          // Auto scroll when receiving new message (if user is near bottom)
          setTimeout(() => {
            scrollToBottomRef.current?.(false)
          }, 100)
        })

        // Handle connection state changes
        connection.onclose((error) => {
          console.log("🔴 SignalR connection closed", error)
          setConnectionStatus("disconnected")
          if (mounted && connection) {
            // Try to reconnect after a delay
            setTimeout(() => {
              if (mounted && connection && connection.state === "Disconnected") {
                console.log("🔄 Attempting to reconnect...")
                setConnectionStatus("connecting")
                connection.start()
                  .then(() => {
                    console.log("✅ Reconnected successfully")
                    setConnectionStatus("connected")
                    if (connection && connection.state === "Connected") {
                      connection.invoke("JoinAuctionChatGroup", auctionId).catch(() => {})
                    }
                  })
                  .catch(() => {
                    setConnectionStatus("disconnected")
                  })
              }
            }, 3000)
          }
        })

        connection.onreconnecting((error) => {
          console.log("🔄 SignalR reconnecting...", error)
          setConnectionStatus("connecting")
        })

        connection.onreconnected((connectionId) => {
          console.log("✅ SignalR reconnected:", connectionId)
          setConnectionStatus("connected")
          if (mounted && connection) {
            connection.invoke("JoinAuctionChatGroup", auctionId).catch(() => {})
          }
        })

        console.log("🚀 Starting SignalR connection...")
        setConnectionStatus("connecting")
        await connection.start()
        isStarting = false
        
        console.log("✅ SignalR connection started, state:", connection.state)
        setConnectionStatus("connected")
        
        if (!mounted) {
          console.log("⚠️ Component unmounted during start, cleaning up")
          // Component unmounted during start, cleanup immediately
          if (connection && connection.state !== "Disconnected") {
            await connection.stop().catch(() => {})
          }
          return
        }
        
        if (connection.state !== "Connected") {
          console.error("❌ Connection not in Connected state:", connection.state)
          return
        }
        
        connectionStarted = true
        console.log("👥 Joining auction chat group:", auctionId)
        try {
          await connection.invoke("JoinAuctionChatGroup", auctionId)
          console.log("✅ Successfully joined auction chat group:", auctionId, "Connection state:", connection.state)
          
          // Verify we're in the group by checking connection state
          console.log("📊 Connection details:", {
            state: connection.state,
            connectionId: connection.connectionId,
            auctionId: auctionId
          })
          
          // Test connection by sending a test message (optional, for debugging)
          console.log("🧪 SignalR setup complete. Waiting for messages...")
        } catch (joinError) {
          // Silently ignore join errors
        }
      } catch (err) {
        isStarting = false
        setConnectionStatus("disconnected")
        // Silently ignore connection errors
      }
    }

    setupConnection()

    return () => {
      mounted = false
      if (connection) {
        // Cleanup connection safely
        const cleanup = async () => {
          // If connection is still starting, wait for it to complete or fail
          if (isStarting) {
            const maxWait = 2000
            const startTime = Date.now()
            while (isStarting && (Date.now() - startTime) < maxWait) {
              await new Promise((resolve) => setTimeout(resolve, 100))
            }
          }
          
          try {
            // Try to leave group if connection was started
            if (connectionStarted && connection) {
              await connection.invoke("LeaveAuctionChatGroup", auctionId).catch(() => {})
            }
          } catch {
            // Ignore all errors silently
          }
          
          try {
            // Stop connection - ignore all errors silently
            if (connection) {
              await connection.stop().catch(() => {
                // Silently ignore all errors
              })
            }
          } catch {
            // Ignore all errors silently
          }
        }
        void cleanup()
      }
    }
  }, [auctionId])

  const redirectToLogin = () => {
    router.push(`/login?returnUrl=/auction/${auctionId}`)
  }

  const handleSend = async () => {
    if (!user?.id) {
      redirectToLogin()
      return
    }

    const content = input.trim()
    if (!content) {
      setError("Nội dung bình luận không được để trống.")
      return
    }

    setSending(true)
    setError(null)
    try {
      const newMessage = await AuctionChatAPI.create({
        auctionId,
        senderId: Number(user.id),
        content,
      })
      
      // Add message to local state immediately for instant feedback
      // SignalR will also broadcast it, but we handle duplicates in the handler
      setMessages((prev) => {
        // Check if message already exists (avoid duplicates from SignalR)
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev
        }
        // Đảm bảo tin nhắn vừa gửi luôn được đánh dấu là của mình trên client
        return [...prev, { ...newMessage, isMine: true }]
      })
      
      setInput("")
      console.log("Message sent successfully, added to local state:", newMessage.id)
      
      // Force scroll to bottom when sending own message
      setTimeout(() => {
        scrollToBottom(true)
      }, 50)
    } catch (err: any) {
      setError(err?.message || "Không thể gửi bình luận")
      console.error("Error sending message:", err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>{messages.length} bình luận</span>
          {/* {connectionStatus === "connected" && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Đang kết nối
            </span>
          )}
          {connectionStatus === "connecting" && (
            <span className="flex items-center gap-1 text-xs text-yellow-600">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              Đang kết nối...
            </span>
          )}
          {connectionStatus === "disconnected" && (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              Mất kết nối
            </span>
          )} */}
        </div>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={fetchMessages} disabled={loading}>
          <RefreshCcw className="h-3 w-3" />
          Làm mới
        </Button>
      </div>

      <div ref={scrollViewportRef}>
        <ScrollArea className="h-[400px] rounded-lg border border-border bg-muted/30">
          <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải bình luận...
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có bình luận nào. Hãy là người đầu tiên đặt câu hỏi!</p>
          ) : (
            <>
              {messages.map((msg) => {
                const myAlias = buildAliasFromUserId(user?.id ?? null)
                const isMine = msg.isMine || (myAlias != null && msg.alias === myAlias)
                return (
                  <div
                    key={msg.id}
                    className={`rounded-md border border-border/40 bg-background/80 p-3 ${isMine ? "border-primary/60 bg-primary/5" : ""}`}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span className={isMine ? "font-semibold text-primary" : ""}>{msg.alias}</span>
                      <div className="flex flex-col items-end gap-0.5">
                        <span>{formatRelativeTime(msg.sentAt)}</span>
                        <span className="text-[10px] opacity-70">{formatFullTime(msg.sentAt)}</span>
                      </div>
                    </div>
                    <p className={`text-sm text-foreground ${isMine ? "font-semibold" : ""}`}>{msg.content}</p>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder={user ? "Đặt câu hỏi hoặc chia sẻ thông tin về phiên đấu giá này..." : "Đăng nhập để bình luận"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          className="min-h-[80px]"
          disabled={!user}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button onClick={handleSend} disabled={sending || !auctionId || !user}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi
              </>
            ) : (
              <>
                Gửi bình luận
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        {!user && (
          <p className="text-xs text-muted-foreground">
            Bạn cần{" "}
            <button className="text-primary underline" onClick={redirectToLogin}>
              đăng nhập
            </button>{" "}
            để tham gia bình luận.
          </p>
        )}
      </div>
    </div>
  )
}
