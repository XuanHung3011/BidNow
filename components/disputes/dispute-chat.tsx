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
  const disputeIdRef = useRef<number | null>(null)
  const adminIdRef = useRef<number | null>(null)

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
    const getAdminId = async () => {
      if (adminIdRef.current) return adminIdRef.current
      try {
        // Try to get admin from dispute resolver first
        if (dispute?.resolvedBy) {
          adminIdRef.current = dispute.resolvedBy
          return dispute.resolvedBy
        }
        // Otherwise get first admin
        const adminUser = await UsersAPI.getByEmail(SUPPORT_ADMIN_EMAIL)
        const adminId = adminUser?.id ?? null
        adminIdRef.current = adminId
        return adminId
      } catch (error) {
        console.error("Không thể lấy thông tin admin:", error)
        return null
      }
    }
    if (dispute) {
      getAdminId()
    }
  }, [dispute])

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
      const { buyerId, sellerId } = dispute
      
      // Get admin ID (use resolvedBy if available, otherwise get first admin)
      let adminId = dispute.resolvedBy
      if (!adminId) {
        try {
          const adminUser = await UsersAPI.getByEmail(SUPPORT_ADMIN_EMAIL)
          adminId = adminUser?.id ?? null
          console.log("Dispute chat - Admin ID:", adminId)
        } catch (error) {
          console.error("Không thể lấy admin ID:", error)
          adminId = null
        }
      } else {
        console.log("Dispute chat - Using resolvedBy admin ID:", adminId)
      }

      // Always load messages between these 3 participants, regardless of who is viewing
      // This ensures buyer, seller, and admin all see the same messages
      const allMessagePromises: Promise<MessageResponseDto[]>[] = []
      
      // 1. Messages between buyer and seller (CRITICAL: both buyer and seller need to see these)
      console.log("Loading messages between buyer", buyerId, "and seller", sellerId)
      allMessagePromises.push(
        MessagesAPI.getConversation(buyerId, sellerId, null)
      )
      
      // 2. Messages between buyer and admin (if admin exists)
      if (adminId) {
        console.log("Loading messages between buyer", buyerId, "and admin", adminId)
        allMessagePromises.push(
          MessagesAPI.getConversation(buyerId, adminId, null)
        )
      }
      
      // 3. Messages between seller and admin (if admin exists)
      // CRITICAL: buyer needs to see seller-admin messages, seller needs to see buyer-admin messages
      if (adminId) {
        console.log("Loading messages between seller", sellerId, "and admin", adminId)
        allMessagePromises.push(
          MessagesAPI.getConversation(sellerId, adminId, null)
        )
      }

      const allMessageArrays = await Promise.all(allMessagePromises)
      console.log("Loaded message arrays:", allMessageArrays.map(arr => arr.length))
      
      // Flatten and deduplicate messages
      const allMessages = allMessageArrays.flat()
      console.log("Total messages before deduplication:", allMessages.length)
      
      // First deduplicate by ID
      const uniqueById = allMessages.filter(
        (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
      )
      
      // Then deduplicate by content + senderId + timestamp (within 5 seconds)
      // This handles the case where we send 2 messages (one to each recipient) with same content
      const uniqueMessages = uniqueById.filter((msg, index, self) => {
        const msgTime = msg.sentAt ? new Date(msg.sentAt).getTime() : 0
        // Check if there's another message with same content, same sender, within 5 seconds
        const duplicate = self.find((m, i) => {
          if (i === index) return false
          const mTime = m.sentAt ? new Date(m.sentAt).getTime() : 0
          const timeDiff = Math.abs(msgTime - mTime)
          return (
            m.content === msg.content &&
            m.senderId === msg.senderId &&
            timeDiff < 5000 // Within 5 seconds
          )
        })
        // Keep the first one (lower index)
        return !duplicate || self.indexOf(duplicate) > index
      })
      console.log("Unique messages after deduplication:", uniqueMessages.length)

      // Define the 3 participants for filtering
      const participants = [buyerId, sellerId]
      if (adminId) {
        participants.push(adminId)
      }
      console.log("Dispute participants:", participants, "Current user:", currentUserId)

      // Filter: only show messages where both sender and receiver are in the dispute participants
      // AND messages sent after dispute was created (to avoid showing old messages from other disputes)
      const disputeCreatedAt = new Date(dispute.createdAt).getTime()
      const filteredMessages = uniqueMessages.filter(msg => {
        // Check if both sender and receiver are participants
        const isBetweenParticipants = 
          participants.includes(msg.senderId) && 
          participants.includes(msg.receiverId)
        
        // Only show messages sent after dispute was created (with 1 minute buffer)
        const msgTime = msg.sentAt ? new Date(msg.sentAt).getTime() : 0
        const isAfterDisputeCreated = msgTime >= disputeCreatedAt - 60000
        
        const shouldInclude = isBetweenParticipants && isAfterDisputeCreated
        if (!shouldInclude) {
          console.log("Filtered out message:", {
            id: msg.id,
            sender: msg.senderId,
            receiver: msg.receiverId,
            isBetweenParticipants,
            isAfterDisputeCreated,
            msgTime,
            disputeCreatedAt
          })
        }
        
        return shouldInclude
      })

      console.log("Filtered messages count:", filteredMessages.length)

      // Sort by time
      const sortedMessages = filteredMessages.sort((a, b) => {
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
      if (!dispute) return

      // Get admin ID
      let adminId = dispute.resolvedBy
      if (!adminId) {
        try {
          const adminUser = await UsersAPI.getByEmail(SUPPORT_ADMIN_EMAIL)
          adminId = adminUser?.id ?? null
        } catch {
          adminId = null
        }
      }

      // Define the 3 participants: buyer, seller, and admin
      const disputeParticipantIds = [dispute.buyerId, dispute.sellerId]
      if (adminId) {
        disputeParticipantIds.push(adminId)
      }

      // Check if message is between any two participants
      const isRelevant = 
        disputeParticipantIds.includes(message.senderId) && 
        disputeParticipantIds.includes(message.receiverId)

      // Also check if message was sent after dispute was created
      const disputeCreatedAt = new Date(dispute.createdAt).getTime()
      const msgTime = message.sentAt ? new Date(message.sentAt).getTime() : 0
      const isAfterDisputeCreated = msgTime >= disputeCreatedAt - 60000

      if (!isRelevant || !isAfterDisputeCreated) return

      // Add message to the list (avoid duplicates by ID and by content + sender + time)
      setMessages((prev) => {
        // Check if message already exists by ID
        if (prev.some((m) => m.id === message.id)) return prev
        
        // Check if duplicate by content + sender + timestamp (within 5 seconds)
        const msgTime = message.sentAt ? new Date(message.sentAt).getTime() : 0
        const isDuplicate = prev.some((m) => {
          const mTime = m.sentAt ? new Date(m.sentAt).getTime() : 0
          const timeDiff = Math.abs(msgTime - mTime)
          return (
            m.content === message.content &&
            m.senderId === message.senderId &&
            timeDiff < 5000 // Within 5 seconds
          )
        })
        if (isDuplicate) return prev
        
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

      // Get admin ID
      let adminId = dispute.resolvedBy
      if (!adminId) {
        try {
          const adminUser = await UsersAPI.getByEmail(SUPPORT_ADMIN_EMAIL)
          adminId = adminUser?.id ?? null
          console.log("Dispute chat send - Admin ID:", adminId)
        } catch (error) {
          console.error("Không thể lấy admin ID khi gửi:", error)
          adminId = user?.currentRole === "admin" ? senderId : null
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
      const sendPromises = otherParticipants.map(receiverId =>
        MessagesAPI.send({
          senderId,
          receiverId,
          auctionId: null,
          content: messageContent,
        })
      )

      const sentMessages = await Promise.all(sendPromises)
      console.log("Messages sent successfully:", sentMessages.length)

      // Optimistically add the first message to UI immediately (before reload)
      // This prevents showing duplicate messages
      if (sentMessages.length > 0) {
        const firstMessage = sentMessages[0]
        setMessages((prev) => {
          // Check if message already exists (by content + sender + time)
          const msgTime = firstMessage.sentAt ? new Date(firstMessage.sentAt).getTime() : Date.now()
          const isDuplicate = prev.some((m) => {
            const mTime = m.sentAt ? new Date(m.sentAt).getTime() : 0
            const timeDiff = Math.abs(msgTime - mTime)
            return (
              m.content === firstMessage.content &&
              m.senderId === firstMessage.senderId &&
              timeDiff < 5000
            )
          })
          if (isDuplicate) return prev
          
          const next = [...prev, firstMessage]
          const sorted = next.sort((a, b) => {
            const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0
            const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0
            return timeA - timeB
          })
          
          // Auto-scroll to bottom after adding message
          setTimeout(() => {
            const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollArea) {
              scrollArea.scrollTop = scrollArea.scrollHeight
            }
          }, 50)
          
          return sorted
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
      
      // Auto-scroll to bottom after sending
      setTimeout(() => {
        const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight
        }
      }, 100)
      
      // Don't reload immediately - let SignalR handle real-time updates
      // Only reload if SignalR doesn't work (as fallback, after 2 seconds)
      setTimeout(() => {
        loadMessages()
      }, 2000)
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

  const isAdmin = user?.currentRole === "admin"
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
                : "Đã giải quyết"}
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
      <Card className="flex flex-col h-[calc(100vh-400px)] max-h-[800px]">
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

