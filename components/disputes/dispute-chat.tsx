"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MessagesAPI } from "@/lib/api/messages"
import { disputesAPI, type DisputeDto } from "@/lib/api/disputes"
import { useToast } from "@/hooks/use-toast"
import type { MessageResponseDto } from "@/lib/api/types"
import type { HubConnection } from "@microsoft/signalr"
import { createMessageHubConnection } from "@/lib/realtime/messageHub"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badges"
import { UsersAPI } from "@/lib/api/users"

const SUPPORT_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_ADMIN_EMAIL || "admin@bidnow.local"

interface DisputeChatProps {
  disputeId: number
}

export function DisputeChat({ disputeId }: DisputeChatProps) {
  const [dispute, setDispute] = useState<DisputeDto | null>(null)
  const [messages, setMessages] = useState<MessageResponseDto[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const connectionRef = useRef<HubConnection | null>(null)
  const userIdRef = useRef<number | null>(null)
  const allDisputesCacheRef = useRef<DisputeDto[] | null>(null)
  const disputeIdRef = useRef<number | null>(null)
  const adminIdRef = useRef<number | null>(null)
  // Track message keys to prevent duplicates in the same batch
  const messageKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    disputeIdRef.current = disputeId
  }, [disputeId])

  useEffect(() => {
    if (user?.id != null) {
      const parsed = Number(user.id)
      userIdRef.current = Number.isNaN(parsed) ? null : parsed
    } else {
      userIdRef.current = null
    }
  }, [user?.id])

  // Get admin ID for dispute chat
  useEffect(() => {
    const getResolverId = async () => {
      if (adminIdRef.current) return adminIdRef.current
      try {
        // Ưu tiên người đang xử lý (resolvedBy)
        if (dispute?.resolvedBy) {
          adminIdRef.current = dispute.resolvedBy
          return dispute.resolvedBy
        }
        // Nếu staff đang đăng nhập, dùng chính staff đó
        if (user?.currentRole === "staff" && userIdRef.current) {
          adminIdRef.current = userIdRef.current
          return userIdRef.current
        }
        // Fallback: lấy admin mặc định
        const adminUser = await UsersAPI.getByEmail(SUPPORT_ADMIN_EMAIL)
        const adminId = adminUser?.id ?? null
        adminIdRef.current = adminId
        return adminId
      } catch (error) {
        console.error("Không thể lấy thông tin admin/staff:", error)
        return null
      }
    }
    if (dispute) {
      getResolverId()
    }
  }, [dispute, user?.currentRole])

  useEffect(() => {
    loadDispute()
  }, [disputeId])

  useEffect(() => {
    if (dispute && userIdRef.current) {
      loadMessages()
      setupSignalR()
    }

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
      }
    }
  }, [dispute, user?.id])

  const loadDispute = async () => {
    try {
      setLoading(true)
      const data = await disputesAPI.getById(disputeId)
      setDispute(data)
      // Clear cache when dispute changes
      allDisputesCacheRef.current = null
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin khiếu nại",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!dispute || !userIdRef.current) return

    try {
      setLoadingMessages(true)
      const currentUserId = userIdRef.current
      
      // Use new dedicated endpoint for dispute messages
      // Backend will handle all filtering (time window, role-based access)
      console.log("Loading dispute messages for dispute:", dispute.id)
      const messages = await MessagesAPI.getDisputeMessages(dispute.id)
      
      console.log("Loaded dispute messages count:", messages.length)
      
      // Deduplicate messages (in case of duplicates)
      const uniqueMessages = messages.filter(
        (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
      )
      
      // Sort by time
      const sortedMessages = uniqueMessages.sort((a, b) => {
        const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0
        const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0
        return timeA - timeB
      })

      console.log("Final messages to display:", sortedMessages.length)
      setMessages(sortedMessages)
      
      // Auto-scroll to bottom after loading messages
      setTimeout(() => {
        const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight
        }
      }, 100)
    } catch (error: any) {
      console.error("Error loading messages:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải tin nhắn",
        variant: "destructive",
      })
    } finally {
      setLoadingMessages(false)
    }
  }

  const setupSignalR = async () => {
    if (!user?.id || !userIdRef.current) return

    const connection = createMessageHubConnection()
    let started = false

    const handleMessageReceived = async (message: MessageResponseDto) => {
      if (!dispute || !userIdRef.current) return

      const currentUserId = userIdRef.current
      const { buyerId, sellerId } = dispute

      // Get admin ID
      let adminId = dispute.resolvedBy
      if (!adminId) {
        try {
          const adminUser = await UsersAPI.getByEmail(SUPPORT_ADMIN_EMAIL)
          adminId = adminUser?.id ?? undefined
        } catch {
          adminId = undefined
        }
      }

      // CRITICAL FIX: Check if message belongs to THIS specific dispute using DisputeId
      if (message.disputeId !== dispute.id) {
        // Message doesn't belong to this dispute - ignore it
        return
      }

      // Determine user role and filter messages accordingly
      const isBuyer = currentUserId === buyerId
      const isSeller = currentUserId === sellerId
      const isAdminOrStaff = user?.currentRole === "admin" || user?.currentRole === "staff" || user?.currentRole === "support"

      // Check if message is relevant based on user role
      let isRelevant = false
      
      if (isAdminOrStaff) {
        // Admin/Staff can see all messages between participants
        const participants = [buyerId, sellerId]
        if (adminId) {
          participants.push(adminId)
        }
        isRelevant = participants.includes(message.senderId) && participants.includes(message.receiverId)
      } else if (isBuyer) {
        // Buyer: only see messages where they are sender or receiver
        isRelevant = message.senderId === buyerId || message.receiverId === buyerId
      } else if (isSeller) {
        // Seller: only see messages where they are sender or receiver
        isRelevant = message.senderId === sellerId || message.receiverId === sellerId
      }

      if (!isRelevant) return

      // Add message to the list (avoid duplicates)
      // CRITICAL: When sending to multiple recipients, we get multiple message records
      // But they all have the same content, senderId, and disputeId, just different receiverId
      // For the sender, they receive SignalR broadcasts for ALL messages they sent
      // We should only show ONE message per unique content + senderId + disputeId + time combination
      setMessages((prev) => {
        const currentUserId = userIdRef.current
        
        // Check if message already exists by ID first (fastest check for all messages)
        if (prev.some((m) => m.id === message.id)) {
          console.log("🔔 Message already exists by ID, skipping:", message.id)
          return prev
        }
        
        // CRITICAL FIX: For messages sent by current user, only keep ONE message
        // even if we receive multiple SignalR broadcasts (one for each recipient)
        if (currentUserId && message.senderId === currentUserId) {
          // This is a message sent by current user
          // Create a unique key: content + senderId + disputeId + timestamp (rounded to nearest second)
          const msgTime = message.sentAt ? new Date(message.sentAt).getTime() : Date.now()
          const roundedTime = Math.floor(msgTime / 1000) * 1000 // Round to nearest second
          const messageKey = `${message.content}|${message.senderId}|${message.disputeId}|${roundedTime}`
          
          // Check in ref first (for messages in the same batch)
          if (messageKeysRef.current.has(messageKey)) {
            console.log("🔔 Duplicate message key detected in ref, skipping:", {
              newId: message.id,
              newReceiverId: message.receiverId,
              messageKey: messageKey.substring(0, 50)
            })
            return prev
          }
          
          // Check if we already have a message with same content + senderId + disputeId + rounded time
          const existingDuplicate = prev.find((m) => {
            // Must be same dispute
            if (m.disputeId !== message.disputeId) return false
            
            // Must be from same sender
            if (m.senderId !== message.senderId) return false
            
            // Check by content + rounded time (within 2 seconds window)
            const mTime = m.sentAt ? new Date(m.sentAt).getTime() : 0
            const mRoundedTime = Math.floor(mTime / 1000) * 1000
            const timeDiff = Math.abs(roundedTime - mRoundedTime)
            
            return (
              m.content === message.content &&
              timeDiff < 2000 // Within 2 seconds (same second or adjacent)
            )
          })
          
          if (existingDuplicate) {
            console.log("🔔 Duplicate message from sender detected, skipping:", {
              newId: message.id,
              newReceiverId: message.receiverId,
              existingId: existingDuplicate.id,
              existingReceiverId: existingDuplicate.receiverId,
              content: message.content.substring(0, 30),
              timeDiff: Math.abs((message.sentAt ? new Date(message.sentAt).getTime() : Date.now()) - (existingDuplicate.sentAt ? new Date(existingDuplicate.sentAt).getTime() : 0))
            })
            return prev // Don't add duplicate
          }
          
          // Add to ref to prevent duplicates in the same batch
          messageKeysRef.current.add(messageKey)
          
          // Clean up old keys (older than 5 seconds) to prevent memory leak
          setTimeout(() => {
            messageKeysRef.current.delete(messageKey)
          }, 5000)
        }
        
        // For messages received from others, also check for duplicates by content + sender + time
        // (in case of any edge cases)
        if (currentUserId && message.senderId !== currentUserId) {
          const msgTime = message.sentAt ? new Date(message.sentAt).getTime() : 0
          const isDuplicate = prev.some((m) => {
            if (m.id === message.id) return true // Same ID
            if (m.disputeId !== message.disputeId) return false // Different dispute
            const mTime = m.sentAt ? new Date(m.sentAt).getTime() : 0
            const timeDiff = Math.abs(msgTime - mTime)
            return (
              m.content === message.content &&
              m.senderId === message.senderId &&
              timeDiff < 2000 // Within 2 seconds
            )
          })
          if (isDuplicate) {
            console.log("🔔 Duplicate received message detected, skipping:", message.id)
            return prev
          }
        }
        
        console.log("🔔 Adding new message to list:", {
          id: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          disputeId: message.disputeId,
          content: message.content.substring(0, 30)
        })
        const next = [...prev, message]
        return next.sort((a, b) => {
          const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0
          const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0
          return timeA - timeB
        })
      })
      
      // Auto-scroll to bottom when new message arrives
      setTimeout(() => {
        const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight
        }
      }, 100)
    }

    connection.on("MessageReceived", handleMessageReceived)

    try {
      await connection.start()
      started = true
      await connection.invoke("JoinUserGroup", String(user.id))
    } catch (err) {
      console.error("SignalR connection error:", err)
    }

    connectionRef.current = connection

    return () => {
      connection.off("MessageReceived", handleMessageReceived)
      if (started && connection) {
        connection.invoke("LeaveUserGroup", String(user.id)).catch(() => {})
        connection.stop().catch(() => {})
      }
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user?.id || !dispute || sending) return

    const senderId = Number(user.id)
    if (isNaN(senderId)) return

    try {
      setSending(true)

      // Get resolver ID (ưu tiên staff/admin đang xử lý)
      let adminId = dispute.resolvedBy
      // Nếu staff/admin đang đăng nhập và dispute chưa có resolver, dùng chính họ
      if (!adminId && (user?.currentRole === "admin" || user?.currentRole === "staff") && senderId) {
        adminId = senderId
        console.log("Dispute chat send - Using current staff/admin ID:", adminId)
      }
      if (!adminId) {
        try {
          const adminUser = await UsersAPI.getByEmail(SUPPORT_ADMIN_EMAIL)
          adminId = adminUser?.id ?? undefined
          console.log("Dispute chat send - Fallback Admin ID:", adminId)
        } catch (error) {
          console.error("Không thể lấy admin ID khi gửi:", error)
          adminId = undefined
        }
      }

      // In dispute chat, all messages should be visible to all 3 participants
      // So we send to BOTH other participants (not just one)
      const otherParticipants: number[] = []
      
      // CRITICAL: Always send to buyer AND seller (if sender is not one of them)
      if (senderId !== dispute.buyerId) {
        otherParticipants.push(dispute.buyerId)
        console.log("Adding buyer", dispute.buyerId, "as recipient")
      }
      if (senderId !== dispute.sellerId) {
        otherParticipants.push(dispute.sellerId)
        console.log("Adding seller", dispute.sellerId, "as recipient")
      }
      
      // CRITICAL: Always include admin (if exists and sender is not admin)
      if (adminId && senderId !== adminId) {
        otherParticipants.push(adminId)
        console.log("Adding admin", adminId, "as recipient")
      }

      console.log("Sending message from", senderId, "to recipients:", otherParticipants)

      const messageContent = messageInput.trim()
      
      // Send message to ALL other participants (this creates multiple message records)
      // This ensures everyone sees the message in the group chat
      // CRITICAL: Include DisputeId so messages are properly associated with this dispute
      const sendPromises = otherParticipants.map(receiverId =>
        MessagesAPI.send({
          senderId,
          receiverId,
          auctionId: null,
          disputeId: dispute.id,
          content: messageContent,
        })
      )

      const sentMessages = await Promise.all(sendPromises)
      console.log("Messages sent successfully:", sentMessages.length)

      // CRITICAL FIX: Backend no longer broadcasts to sender for dispute messages
      // So we need to add optimistic update so sender sees their message immediately
      // We only add the FIRST message (they all have same content, just different receiverId)
      if (sentMessages.length > 0) {
        const firstMessage = sentMessages[0]
        setMessages((prev) => {
          // Check if message already exists (by ID or by content + sender + dispute + time)
          const msgTime = firstMessage.sentAt ? new Date(firstMessage.sentAt).getTime() : Date.now()
          const roundedTime = Math.floor(msgTime / 1000) * 1000
          const messageKey = `${firstMessage.content}|${firstMessage.senderId}|${firstMessage.disputeId}|${roundedTime}`
          
          // Check in ref
          if (messageKeysRef.current.has(messageKey)) {
            console.log("Optimistic update: Message key already exists, skipping")
            return prev
          }
          
          // Check in state
          const isDuplicate = prev.some((m) => {
            if (m.id === firstMessage.id) return true
            if (m.disputeId !== firstMessage.disputeId || m.senderId !== firstMessage.senderId) return false
            const mTime = m.sentAt ? new Date(m.sentAt).getTime() : 0
            const mRoundedTime = Math.floor(mTime / 1000) * 1000
            return m.content === firstMessage.content && Math.abs(roundedTime - mRoundedTime) < 2000
          })
          
          if (isDuplicate) {
            console.log("Optimistic update: Duplicate detected, skipping")
            return prev
          }
          
          // Add to ref
          messageKeysRef.current.add(messageKey)
          setTimeout(() => {
            messageKeysRef.current.delete(messageKey)
          }, 5000)
          
          console.log("Optimistic update: Adding message", firstMessage.id)
          const next = [...prev, firstMessage]
          return next.sort((a, b) => {
            const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0
            const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0
            return timeA - timeB
          })
        })
      }
      
      setMessageInput("")
      
      // Auto-scroll to bottom after sending
      setTimeout(() => {
        const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight
        }
      }, 100)
      
      // Reload messages after a short delay as fallback if SignalR doesn't work
      setTimeout(() => {
        loadMessages()
      }, 1000)
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi tin nhắn",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "HH:mm", { locale: vi })
    } catch {
      return dateString
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!dispute) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Không tìm thấy khiếu nại
      </Card>
    )
  }

  const isAdmin = user?.currentRole === "admin" || user?.currentRole === "staff" || user?.currentRole === "support"
  const isBuyer = user?.id && Number(user.id) === dispute.buyerId
  const isSeller = user?.id && Number(user.id) === dispute.sellerId

  return (
    <div className="space-y-6">
      {/* Dispute Info */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-destructive mt-1" />
              <div>
                <h2 className="text-xl font-bold">{dispute.reason}</h2>
                {dispute.description && (
                  <p className="text-sm text-muted-foreground mt-1">{dispute.description}</p>
                )}
              </div>
            </div>
            <Badge
              variant={
                dispute.status === "pending"
                  ? "destructive"
                  : dispute.status === "in_review"
                  ? "default"
                  : dispute.status === "buyer_won" || dispute.status === "seller_won"
                  ? "secondary"
                  : "secondary"
              }
            >
              {dispute.status === "pending"
                ? "Chờ xử lý"
                : dispute.status === "in_review"
                ? "Đang xử lý"
                : dispute.status === "buyer_won"
                ? "Người mua thắng"
                : dispute.status === "seller_won"
                ? "Người bán thắng"
                : dispute.status === "resolved"
                ? "Đã giải quyết"
                : dispute.status === "closed"
                ? "Đã đóng"
                : "Không xác định"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Người mua</p>
              <p className="font-medium">{dispute.buyerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Người bán</p>
              <p className="font-medium">{dispute.sellerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sản phẩm</p>
              <p className="font-medium">{dispute.auctionTitle || `Đơn hàng #${dispute.orderId}`}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              <p className="font-medium">
                {dispute.status === "pending"
                  ? "Chờ xử lý"
                  : dispute.status === "in_review"
                  ? "Đang xử lý"
                  : dispute.status === "buyer_won"
                  ? "Người mua thắng"
                  : dispute.status === "seller_won"
                  ? "Người bán thắng"
                  : dispute.status === "resolved"
                  ? "Đã giải quyết"
                  : dispute.status === "closed"
                  ? "Đã đóng"
                  : "Không xác định"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Tạo lúc</p>
              <p className="font-medium">{formatDate(dispute.createdAt)}</p>
            </div>
          </div>

          {dispute.order && (
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trạng thái đơn hàng:</span>
                <OrderStatusBadge status={dispute.order.orderStatus} />
              </div>
              {dispute.order.payment && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trạng thái thanh toán:</span>
                  <PaymentStatusBadge status={dispute.order.payment.paymentStatus} />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex flex-col h-[calc(100vh-250px)] max-h-[1200px]">
        <div className="flex items-center justify-between border-b p-4 flex-shrink-0">
          <div>
            <p className="font-semibold">Chat khiếu nại</p>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? "Bạn đang chat với người mua và người bán"
                : isBuyer
                ? `Bạn đang chat với ${dispute.sellerName} và admin`
                : `Bạn đang chat với ${dispute.buyerName} và admin`}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.senderId === Number(user?.id)
                    const displayName = isOwnMessage
                      ? user?.name || message.senderName
                      : message.senderName

                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.senderAvatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {displayName?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {!isOwnMessage && (
                              <p className="mb-1 text-xs font-medium text-muted-foreground">{displayName}</p>
                            )}
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{formatTime(message.sentAt)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Message Input */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex items-end gap-2">
            <Input
              placeholder={isAdmin ? "Nhập tin nhắn (sẽ gửi đến cả người mua và người bán)..." : "Nhập tin nhắn..."}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} className="shrink-0" disabled={sending || !messageInput.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

