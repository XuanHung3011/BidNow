"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, MoreVertical, ImageIcon, Paperclip, Loader2, Plus, Mail } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessagesAPI } from "@/lib/api/messages"
import { API_BASE } from "@/lib/api/config"
import type { ConversationDto, MessageResponseDto } from "@/lib/api/types"
import type { HubConnection } from "@microsoft/signalr"
import { createMessageHubConnection } from "@/lib/realtime/messageHub"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter, useSearchParams } from "next/navigation"
import { UsersAPI } from "@/lib/api/users"
import { disputesAPI, type DisputeDto } from "@/lib/api/disputes"
import { DisputeChat } from "@/components/disputes/dispute-chat"

const SUPPORT_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_ADMIN_EMAIL || "admin@bidnow.local"

export function MessagesView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null)
  const [disputeId, setDisputeId] = useState<number | null>(null)
  const [disputeInfo, setDisputeInfo] = useState<DisputeDto | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [messages, setMessages] = useState<MessageResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [selectedConversationInfo, setSelectedConversationInfo] = useState<ConversationDto | null>(null)
  const [sending, setSending] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newConversationEmail, setNewConversationEmail] = useState("")
  const [newConversationMessage, setNewConversationMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const connectionRef = useRef<HubConnection | null>(null)
  const selectedConversationRef = useRef<number | null>(null)
  const selectedAuctionIdRef = useRef<number | null>(null)
  const userIdRef = useRef<number | null>(null)
  const supportAdminIdRef = useRef<number | null>(null)

  const emitUnreadSync = useCallback((count?: number) => {
    if (typeof window === "undefined") return
    window.dispatchEvent(
      new CustomEvent("messages:unread-sync", {
        detail: { count },
      })
    )
  }, [])

  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  useEffect(() => {
    selectedAuctionIdRef.current = selectedAuctionId
  }, [selectedAuctionId])

  useEffect(() => {
    if (user?.id != null) {
      const parsed = Number(user.id)
      userIdRef.current = Number.isNaN(parsed) ? null : parsed
    } else {
      userIdRef.current = null
    }
  }, [user?.id])
  const getSupportAdminId = useCallback(async () => {
    if (supportAdminIdRef.current) {
      return supportAdminIdRef.current
    }
    try {
      const adminUser = await UsersAPI.getByEmail(SUPPORT_ADMIN_EMAIL)
      const adminId = adminUser?.id ?? null
      supportAdminIdRef.current = adminId
      return adminId
    } catch (error) {
      console.error("Không thể lấy thông tin admin:", error)
      return null
    }
  }, [])

  // Check for disputeId in URL
  useEffect(() => {
    const disputeIdParam = searchParams?.get("disputeId")
    if (disputeIdParam) {
      const id = parseInt(disputeIdParam, 10)
      if (!isNaN(id)) {
        setDisputeId(id)
      }
    }
  }, [searchParams])

  // Load dispute info when disputeId is set
  useEffect(() => {
    if (disputeId) {
      loadDisputeInfo()
    }
  }, [disputeId])

  const loadDisputeInfo = async () => {
    try {
      const data = await disputesAPI.getById(disputeId!)
      setDisputeInfo(data)
      // Auto-select conversations with buyer and seller
      if (data && userIdRef.current) {
        // For admin, show both conversations
        if (user?.currentRole === "admin") {
          // Select buyer conversation first
          setSelectedConversation(data.buyerId)
        } else {
          // For buyer/seller, select the other party
          const otherPartyId = userIdRef.current === data.buyerId ? data.sellerId : data.buyerId
          setSelectedConversation(otherPartyId)
        }
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin khiếu nại",
        variant: "destructive",
      })
    }
  }

  // Load conversations
  useEffect(() => {
    if (user?.id && !disputeId) {
      loadConversations()
    }
  }, [user?.id, disputeId])

  useEffect(() => {
    const currentUserId = userIdRef.current
    if (!user?.id || !currentUserId) {
      return
    }

    const connection = createMessageHubConnection()
    let started = false

    const handleMessageReceived = (message: MessageResponseDto) => {
      const activeUserId = userIdRef.current
      if (!activeUserId) return

      const auctionKey = message.auctionId ?? null
      const otherUserId = message.senderId === activeUserId ? message.receiverId : message.senderId
      const isCurrentConversation =
        selectedConversationRef.current === otherUserId &&
        ((selectedAuctionIdRef.current ?? null) === (auctionKey ?? null))

      const normalizedMessage: MessageResponseDto = {
        ...message,
        isRead:
          message.isRead ||
          (isCurrentConversation && message.receiverId === activeUserId ? true : message.isRead),
      }

      if (isCurrentConversation) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === normalizedMessage.id)) return prev
          const next = [...prev, normalizedMessage]
          return next.sort((a, b) => {
            const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0
            const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0
            return timeA - timeB
          })
        })
      }

      setConversations((prev) => {
        const updated = [...prev]
        const idx = updated.findIndex(
          (conv) =>
            conv.otherUserId === otherUserId && (conv.auctionId ?? null) === (auctionKey ?? null)
        )

        const otherName =
          message.senderId === activeUserId ? message.receiverName : message.senderName
        const otherAvatar =
          message.senderId === activeUserId ? message.receiverAvatarUrl : message.senderAvatarUrl

        const baseConv = idx >= 0 ? updated[idx] : undefined
        let unreadCount = baseConv?.unreadCount ?? 0
        if (message.receiverId === activeUserId) {
          unreadCount = isCurrentConversation ? 0 : unreadCount + 1
        }

        const newConversation: ConversationDto = {
          otherUserId,
          otherUserName: otherName || baseConv?.otherUserName || "Người dùng",
          otherUserAvatarUrl: otherAvatar ?? baseConv?.otherUserAvatarUrl ?? null,
          lastMessage: message.content,
          lastMessageTime: message.sentAt ?? new Date().toISOString(),
          unreadCount,
          auctionId: auctionKey,
          auctionTitle: message.auctionTitle ?? baseConv?.auctionTitle ?? null,
        }

        if (idx >= 0) {
          updated[idx] = newConversation
        } else {
          updated.push(newConversation)
        }

        return updated.sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
          return timeB - timeA
        })
      })

      if (message.receiverId === activeUserId && isCurrentConversation && !message.isRead) {
        MessagesAPI.markAsRead(message.id).catch((err) => {
          console.error("Failed to mark message as read (realtime):", err)
        })
      }
    }

    connection.on("MessageReceived", handleMessageReceived)

    const startPromise = (async () => {
      try {
        await connection.start()
        started = true
        await connection.invoke("JoinUserGroup", String(user.id))
      } catch (err) {
        console.error("SignalR message hub connection error:", err)
        throw err
      }
    })()
    connectionRef.current = connection

    return () => {
      connection.off("MessageReceived", handleMessageReceived)
      const cleanup = async () => {
        try {
          await startPromise.catch(() => {})
          if (started && connection) {
            await connection.invoke("LeaveUserGroup", String(user.id)).catch(() => {})
          }
          if (connection) {
            await connection.stop().catch(() => {})
          }
        } catch {
          // Silently ignore all cleanup errors
        } finally {
          connectionRef.current = null
        }
      }
      void cleanup()
    }
  }, [user?.id])

  // Auto-refresh conversations every 5 seconds (like Facebook Messenger)
  useEffect(() => {
    if (!user?.id) return
    
    const interval = setInterval(() => {
      loadConversations(false) // Silent refresh
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [user?.id])

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id) {
      const userId = Number(user.id)
      if (!isNaN(userId)) {
        loadMessages(userId, selectedConversation, selectedAuctionId)
      }
    } else if (!selectedConversation && user?.id) {
      // Load all messages by userId when no conversation is selected
      const userId = Number(user.id)
      if (!isNaN(userId)) {
        loadAllMessagesByUserId(userId)
      }
    }
  }, [selectedConversation, selectedAuctionId, user?.id])

  const loadConversations = async (showLoading = true) => {
    if (!user?.id) return
    const userId = Number(user.id)
    if (isNaN(userId)) return
    try {
      if (showLoading) {
        setLoading(true)
      }
      console.log("Loading conversations for user:", userId)
      const data = await MessagesAPI.getConversations(userId)
      console.log("Conversations loaded:", data, "Count:", data?.length)
      console.log("Conversations details:", JSON.stringify(data, null, 2))
      
      // Update conversations state
      setConversations(data || [])
      const totalUnread = (data || []).reduce((sum, conv) => sum + (conv?.unreadCount ?? 0), 0)
      emitUnreadSync(totalUnread)
      
      // Update selected conversation info if it still exists
      if (selectedConversation && data) {
        const updatedConv = data.find(
          (c) => c.otherUserId === selectedConversation && c.auctionId === selectedAuctionId
        )
        if (updatedConv) {
          setSelectedConversationInfo(updatedConv)
        } else {
          // If selected conversation no longer exists, clear selection
          // But don't auto-select first one - let user choose
          setSelectedConversation(null)
          setSelectedAuctionId(null)
          setSelectedConversationInfo(null)
        }
      }
      
      // Auto-select first conversation ONLY on initial load (when showLoading is true)
      // Don't auto-select on silent refresh to prevent jumping
      if (showLoading && data && data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0].otherUserId)
        setSelectedAuctionId(data[0].auctionId || null)
        setSelectedConversationInfo(data[0])
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
      if (showLoading) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách cuộc trò chuyện",
          variant: "destructive",
        })
      }
      setConversations([])
      emitUnreadSync(0)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const loadAllMessagesByUserId = async (userId: number) => {
    try {
      setLoadingMessages(true)
      // Load all messages (both sent and received) for the user
      const allMessages = await MessagesAPI.getAllMessages(userId)
      
      // Sort by sentAt (most recent first)
      const sortedMessages = (allMessages || []).sort((a, b) => {
        const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0
        const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0
        return timeB - timeA
      })
      
      setMessages(sortedMessages)
      setSelectedConversationInfo(null)
    } catch (error) {
      console.error("Error loading all messages by userId:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách tin nhắn",
        variant: "destructive",
      })
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const loadMessages = async (userId1: number, userId2: number, auctionId: number | null) => {
    try {
      setLoadingMessages(true)
      const data = await MessagesAPI.getConversation(userId1, userId2, auctionId || undefined)
      setMessages(data || [])
      
      // Find and set conversation info for display
      const convInfo = conversations.find(
        (c) => c.otherUserId === userId2 && c.auctionId === (auctionId || null)
      )
      if (convInfo) {
        setSelectedConversationInfo(convInfo)
      } else {
        // If not found in conversations, create a basic info
        setSelectedConversationInfo({
          otherUserId: userId2,
          otherUserName: "Người dùng",
          otherUserAvatarUrl: null,
          lastMessage: null,
          lastMessageTime: null,
          unreadCount: 0,
          auctionId: auctionId,
          auctionTitle: null,
        })
      }
      
      // Mark messages as read when loading conversation
      if (data && data.length > 0) {
        // Mark all unread messages in this conversation as read
        const unreadMessages = data.filter(m => !m.isRead && m.receiverId === userId1)
        for (const message of unreadMessages) {
          await MessagesAPI.markAsRead(message.id)
        }
        // Reload conversations to update unread count (silent refresh)
        loadConversations(false)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải tin nhắn",
        variant: "destructive",
      })
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const filteredConversations = conversations
    .filter((conv) => {
      if (!conv) return false
      const name = conv.otherUserName?.toLowerCase() || ""
      const search = searchQuery.toLowerCase()
      return name.includes(search)
    })
    .sort((a, b) => {
      // Sort by last message time (most recent first), like Facebook Messenger
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
      return timeB - timeA
    })

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user?.id || !selectedConversation || sending) return

    const senderId = Number(user.id)
    if (isNaN(senderId)) return

    try {
      setSending(true)
      await MessagesAPI.send({
        senderId,
        receiverId: selectedConversation,
        auctionId: selectedAuctionId || undefined,
        content: messageInput.trim(),
      })
      setMessageInput("")
      // Reload messages
      if (senderId && selectedConversation) {
        await loadMessages(senderId, selectedConversation, selectedAuctionId)
      }
      // Reload conversations to update last message (silent refresh)
      await loadConversations(false)
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Vừa xong"
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    return `${days} ngày trước`
  }

  const handleConversationSelect = (otherUserId: number, auctionId: number | null) => {
    setSelectedConversation(otherUserId)
    setSelectedAuctionId(auctionId)
    
    // Set conversation info immediately for display
    const convInfo = conversations.find(
      (c) => c.otherUserId === otherUserId && c.auctionId === (auctionId || null)
    )
    if (convInfo) {
      setSelectedConversationInfo(convInfo)
    }
  }

  const handleCreateConversation = async () => {
    if (!newConversationEmail.trim() || !user?.id || creating) return

    const senderId = Number(user.id)
    if (isNaN(senderId)) return

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newConversationEmail.trim())) {
      toast({
        title: "Lỗi",
        description: "Email không hợp lệ",
        variant: "destructive",
      })
      return
    }

    // Check if trying to message yourself
    if (user.email?.toLowerCase() === newConversationEmail.trim().toLowerCase()) {
      toast({
        title: "Lỗi",
        description: "Bạn không thể gửi tin nhắn cho chính mình",
        variant: "destructive",
      })
      return
    }

    try {
      setCreating(true)
      
      // Step 1: Find user by email
      const email = newConversationEmail.trim()
      const getUserUrl = `${API_BASE}/api/Users/email/${encodeURIComponent(email)}`
      const userResponse = await fetch(getUserUrl, { cache: 'no-store' })
      
      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy người dùng với email này",
            variant: "destructive",
          })
          return
        }
        throw new Error(`HTTP error ${userResponse.status}`)
      }

      const receiver = await userResponse.json()
      const receiverId = receiver.id

      if (!receiverId) {
        toast({
          title: "Lỗi",
          description: "Không thể lấy thông tin người nhận",
          variant: "destructive",
        })
        return
      }

      // Step 2: Send first message if provided
      if (newConversationMessage.trim()) {
        try {
          await MessagesAPI.send({
            senderId,
            receiverId,
            auctionId: null,
            content: newConversationMessage.trim(),
          })
        } catch (error: any) {
          console.error("Error sending first message:", error)
          toast({
            title: "Cảnh báo",
            description: "Đã tạo cuộc trò chuyện nhưng không thể gửi tin nhắn đầu tiên: " + (error.message || "Lỗi không xác định"),
            variant: "default",
          })
        }
      }

      // Step 3: Select the new conversation
      setSelectedConversation(receiverId)
      setSelectedAuctionId(null)
      
      // Set conversation info
      setSelectedConversationInfo({
        otherUserId: receiverId,
        otherUserName: receiver.fullName || receiver.email || "Người dùng",
        otherUserAvatarUrl: receiver.avatarUrl || null,
        lastMessage: newConversationMessage.trim() || null,
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        auctionId: null,
        auctionTitle: null,
      })

      // Clear form and close dialog
      setNewConversationEmail("")
      setNewConversationMessage("")
      setShowCreateDialog(false)

      // Reload conversations to get latest data
      await loadConversations(false)
      
      // Load messages for the new conversation
      if (senderId && receiverId) {
        await loadMessages(senderId, receiverId, null)
      }

      toast({
        title: "Thành công",
        description: newConversationMessage.trim() 
          ? "Đã tạo cuộc trò chuyện và gửi tin nhắn đầu tiên" 
          : "Đã tạo cuộc trò chuyện. Bạn có thể bắt đầu gửi tin nhắn.",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error creating conversation:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo cuộc trò chuyện",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const otherUserNameLower = selectedConversationInfo?.otherUserName?.toLowerCase() ?? ""
  const isAdminContact = otherUserNameLower.includes("admin")
  const canViewProfile = Boolean(selectedConversationInfo?.otherUserId || isAdminContact)

  const handleViewProfile = useCallback(async () => {
    let targetId = selectedConversationInfo?.otherUserId ?? null
    if (!targetId && isAdminContact) {
      targetId = await getSupportAdminId()
    }
    if (!targetId) {
      toast({
        title: "Không thể mở hồ sơ",
        description: "Không tìm thấy thông tin người dùng.",
        variant: "destructive",
      })
      return
    }
    router.push(`/profile/${targetId}`)
  }, [selectedConversationInfo?.otherUserId, isAdminContact, getSupportAdminId, router, toast])

  const conversationBody = (
    <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Conversations List */}
        <Card className="p-4">
          <div className="mb-4 space-y-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="default">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo cuộc trò chuyện mới
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo cuộc trò chuyện mới</DialogTitle>
                  <DialogDescription>
                    Nhập email của người bạn muốn trò chuyện. Bạn có thể gửi tin nhắn đầu tiên ngay bây giờ.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email người nhận</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={newConversationEmail}
                        onChange={(e) => setNewConversationEmail(e.target.value)}
                        className="pl-9"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleCreateConversation()
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Tin nhắn đầu tiên (tùy chọn)</Label>
                    <Textarea
                      id="message"
                      placeholder="Nhập tin nhắn đầu tiên..."
                      value={newConversationMessage}
                      onChange={(e) => setNewConversationMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleCreateConversation} disabled={creating || !newConversationEmail.trim()}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      "Tạo cuộc trò chuyện"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4">
                <p className="mb-2">Chưa có cuộc trò chuyện nào</p>
                <p className="text-xs text-center">Tạo cuộc trò chuyện mới để bắt đầu</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conv) => {
                  if (!conv) return null
                  const isSelected = selectedConversation === conv.otherUserId && 
                                   selectedAuctionId === (conv.auctionId || null)
                  const userName = conv.otherUserName || "Người dùng"
                  
                  return (
                    <button
                      key={`${conv.otherUserId}-${conv.auctionId || 'none'}`}
                      onClick={() => handleConversationSelect(conv.otherUserId, conv.auctionId || null)}
                      className={`w-full rounded-lg p-3 text-left transition-all ${
                        isSelected
                          ? "bg-accent border-l-2 border-l-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conv.otherUserAvatarUrl || "/placeholder.svg"} />
                            <AvatarFallback className="text-sm font-semibold">
                              {userName.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          {conv.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-xs font-bold text-primary-foreground">
                                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">{userName}</p>
                            {conv.lastMessageTime && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                                {formatTime(conv.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          {conv.auctionTitle && (
                            <p className="text-xs text-muted-foreground truncate mb-1">{conv.auctionTitle}</p>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${
                              conv.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                            }`}>
                              {conv.lastMessage || "Chưa có tin nhắn"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="flex flex-col h-[calc(100vh-120px)] max-h-[900px]">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b p-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedConversationInfo?.otherUserAvatarUrl || "/placeholder.svg"}
                    />
                    <AvatarFallback>
                      {selectedConversationInfo?.otherUserName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {selectedConversationInfo?.otherUserName || "Người dùng"}
                    </p>
                    {selectedConversationInfo?.auctionTitle && (
                      <p className="text-xs text-muted-foreground">
                        {selectedConversationInfo.auctionTitle}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleViewProfile} disabled={!canViewProfile}>
                      Xem hồ sơ
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem>Xem sản phẩm</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Báo cáo</DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                            ? (user?.name || message.senderName) 
                            : message.senderName
                          const displayAvatar = isOwnMessage 
                            ? (user?.avatar || message.senderAvatarUrl) 
                            : message.senderAvatarUrl
                          
                          return (
                            <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                              <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={displayAvatar || undefined} />
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
                  {/* <Button variant="ghost" size="icon" className="shrink-0">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Paperclip className="h-5 w-5" />
                  </Button> */}
                  <Input
                    placeholder="Nhập tin nhắn..."
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
            </>
          ) : (
            <>
              {/* All Messages Header - when no conversation selected */}
              <div className="flex items-center justify-between border-b p-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold">Tất cả tin nhắn</p>
                    <p className="text-xs text-muted-foreground">
                      {messages.length > 0 ? `${messages.length} tin nhắn (đã gửi và đã nhận)` : "Chưa có tin nhắn nào"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages List by UserId */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                        Chưa có tin nhắn nào. Hãy chọn một cuộc trò chuyện để bắt đầu!
                      </div>
                    ) : (
                      <div className="space-y-4 pb-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.senderId === Number(user?.id)
                      const displayName = isOwnMessage 
                        ? (user?.name || message.senderName) 
                        : message.senderName
                      const displayAvatar = isOwnMessage 
                        ? (user?.avatar || message.senderAvatarUrl) 
                        : message.senderAvatarUrl
                      
                      // Group messages by conversation (other user + auction)
                      const otherUserId = isOwnMessage ? message.receiverId : message.senderId
                      const otherUserName = isOwnMessage ? message.receiverName : message.senderName
                      const otherUserAvatar = isOwnMessage ? message.receiverAvatarUrl : message.senderAvatarUrl
                      
                      return (
                        <div 
                          key={message.id} 
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={() => {
                            setSelectedConversation(otherUserId)
                            setSelectedAuctionId(message.auctionId || null)
                          }}
                        >
                          <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={displayAvatar || undefined} />
                              <AvatarFallback className="text-xs">
                                {displayName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="mb-1 flex items-center gap-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                  {isOwnMessage ? `Đến: ${otherUserName}` : `Từ: ${displayName}`}
                                </p>
                                {message.auctionTitle && (
                                  <Badge variant="outline" className="text-xs">
                                    {message.auctionTitle}
                                  </Badge>
                                )}
                              </div>
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{formatTime(message.sentAt)}</p>
                              {!message.isRead && !isOwnMessage && (
                                <Badge variant="destructive" className="mt-1 text-xs">
                                  Chưa đọc
                                </Badge>
                              )}
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
            </>
          )}
        </Card>
    </div>
  )

  // If disputeId is set, show dispute chat
  if (disputeId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chat khiếu nại</h1>
          <p className="text-muted-foreground">Trao đổi về khiếu nại đơn hàng</p>
        </div>
        <DisputeChat disputeId={disputeId} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tin nhắn</h1>
        <p className="text-muted-foreground">
          {user?.currentRole === "admin"
            ? "Quản lý trao đổi với người dùng"
            : `Trò chuyện với ${user?.currentRole === "buyer" ? "mọi người" : "mọi người"}`}
        </p>
      </div>
      {conversationBody}
    </div>
  )
}