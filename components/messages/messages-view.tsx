"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, MoreVertical, ImageIcon, Paperclip, Loader2, Plus, Mail, AlertCircle, MessageSquare, HeadphonesIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [disputeConversations, setDisputeConversations] = useState<Array<{disputeId: number, orderId: number, title: string, lastMessageTime: string, createdAt: string, buyerId: number, sellerId: number, adminId: number | null}>>([])
  const [disputeParticipantPairs, setDisputeParticipantPairs] = useState<Set<string>>(new Set())
  const [disputesLoaded, setDisputesLoaded] = useState(false)
  const [messages, setMessages] = useState<MessageResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [selectedConversationInfo, setSelectedConversationInfo] = useState<ConversationDto | null>(null)
  const [sending, setSending] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newConversationEmail, setNewConversationEmail] = useState("")
  const [newConversationMessage, setNewConversationMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const [showSupportDialog, setShowSupportDialog] = useState(false)
  const [supportMessage, setSupportMessage] = useState("")
  const [sendingSupportMessage, setSendingSupportMessage] = useState(false)
  const [supportUsers, setSupportUsers] = useState<Array<{id: number, email: string, fullName: string, avatarUrl?: string}>>([])
  const [selectedSupportUserId, setSelectedSupportUserId] = useState<number | null>(null)
  const [loadingSupportUsers, setLoadingSupportUsers] = useState(false)
  const [activeTab, setActiveTab] = useState<"personal" | "dispute" | "support">("personal")
  const { user } = useAuth()
  const { toast } = useToast()

  const connectionRef = useRef<HubConnection | null>(null)
  const selectedConversationRef = useRef<number | null>(null)
  const selectedAuctionIdRef = useRef<number | null>(null)
  const userIdRef = useRef<number | null>(null)
  const supportAdminIdRef = useRef<number | null>(null)
  const disputeIdRef = useRef<number | null>(null)

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
      // Lấy tất cả users và tìm user có role "support"
      // Cần lấy nhiều pages để đảm bảo tìm thấy support
      let allUsers: any[] = []
      let page = 1
      const pageSize = 100
      
      // Lấy tối đa 5 pages (500 users) để tìm support
      while (page <= 5) {
        const users = await UsersAPI.getAll(page, pageSize)
        if (users.length === 0) break
        allUsers = [...allUsers, ...users]
        if (users.length < pageSize) break
        page++
      }
      
      const supportUser = allUsers.find(user => 
        user.roles && user.roles.some((role: string) => role.toLowerCase() === "support")
      )
      
      if (supportUser) {
        console.log("Found support user:", supportUser.id, supportUser.email, supportUser.roles)
        supportAdminIdRef.current = supportUser.id
        return supportUser.id
      }
      
      console.error("Không tìm thấy user có role support trong", allUsers.length, "users")
      // KHÔNG fallback về admin - chỉ trả về null nếu không tìm thấy support
      return null
    } catch (error) {
      console.error("Không thể lấy thông tin support:", error)
      return null
    }
  }, [])

  // Check for disputeId in URL
  useEffect(() => {
    const disputeIdParam = searchParams?.get("disputeId")
    if (disputeIdParam) {
      const id = parseInt(disputeIdParam, 10)
      if (!isNaN(id) && id !== disputeId) {
        setDisputeId(id)
        disputeIdRef.current = id
      }
    } else {
      // Only clear if we're not already showing a dispute chat
      if (disputeId !== null) {
        setDisputeId(null)
        setDisputeInfo(null)
        disputeIdRef.current = null
      }
    }
  }, [searchParams, disputeId])

  // Load dispute info when disputeId is set
  useEffect(() => {
    if (disputeId) {
      setActiveTab("dispute")
      // Support role không được xử lý chat khiếu nại
      if (user?.currentRole === "support") {
        toast({
          title: "Không có quyền",
          description: "Support chỉ xử lý chat 1-1, không tham gia khiếu nại.",
          variant: "destructive",
        })
        router.replace("/messages")
        setDisputeId(null)
        setDisputeInfo(null)
        disputeIdRef.current = null
        return
      }
      loadDisputeInfo()
    }
  }, [disputeId, user?.currentRole, router, toast])

  const loadDisputeInfo = async () => {
    try {
      const data = await disputesAPI.getById(disputeId!)
      setDisputeInfo(data)
      // Auto-select conversations with buyer and seller
      if (data && userIdRef.current) {
        // For admin/staff/support, show both conversations
        if (user?.currentRole === "admin" || user?.currentRole === "staff" || user?.currentRole === "support") {
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

  // Load conversations and disputes
  useEffect(() => {
    if (user?.id && !disputeId) {
      // Load support ID first, then load conversations
      getSupportAdminId().then(() => {
        loadConversations()
        loadDisputeConversations()
        // Auto switch to support tab if user is support
        if (user.currentRole === "support") {
          setActiveTab("support")
        }
      })
    }
  }, [user?.id, user?.currentRole, disputeId, getSupportAdminId])

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

  const loadDisputeConversations = async () => {
    if (!user?.id) return
    const userId = Number(user.id)
    if (isNaN(userId)) return

    // Support chỉ chat 1-1, không tải danh sách khiếu nại
    if (user.currentRole === "support") {
      setDisputeConversations([])
      setDisputesLoaded(true)
      return
    }
    
    try {
      let disputes: DisputeDto[] = []
      
      // Load disputes based on user role
      if (user.currentRole === "admin" || user.currentRole === "staff") {
        disputes = await disputesAPI.getAll()
      } else if (user.currentRole === "buyer") {
        disputes = await disputesAPI.getByBuyerId(userId)
      } else {
        // seller or other
        disputes = await disputesAPI.getBySellerId(userId)
      }
      
      // Filter only active disputes (pending or in_review)
      const activeDisputes = disputes.filter(d => 
        d.status === "pending" || d.status === "in_review"
      )
      
      // Store dispute participant IDs to filter conversations later
      const pairs = new Set<string>()
      for (const dispute of activeDisputes) {
        const { buyerId, sellerId } = dispute
        let adminId = dispute.resolvedBy
        if (!adminId) {
          try {
            const adminUser = await UsersAPI.getByEmail(SUPPORT_ADMIN_EMAIL)
            adminId = adminUser?.id ?? null
          } catch {
            adminId = null
          }
        }
        // Create pairs for filtering: "buyerId-sellerId", "buyerId-adminId", "sellerId-adminId"
        pairs.add(`${buyerId}-${sellerId}`)
        pairs.add(`${sellerId}-${buyerId}`)
        if (adminId) {
          pairs.add(`${buyerId}-${adminId}`)
          pairs.add(`${adminId}-${buyerId}`)
          pairs.add(`${sellerId}-${adminId}`)
          pairs.add(`${adminId}-${sellerId}`)
        }
      }
      setDisputeParticipantPairs(pairs)
      setDisputesLoaded(true)
      
      // Get last message time for each dispute (from dispute chat messages)
      const disputeConvs = await Promise.all(
        activeDisputes.map(async (dispute) => {
          try {
            // Get last message from dispute chat
            const { buyerId, sellerId } = dispute
            let adminId = dispute.resolvedBy
            if (!adminId) {
              try {
                const adminUser = await UsersAPI.getByEmail(SUPPORT_ADMIN_EMAIL)
                adminId = adminUser?.id ?? null
              } catch {
                adminId = null
              }
            }
            
            // Load messages between participants
            const allMessagePromises: Promise<MessageResponseDto[]>[] = []
            allMessagePromises.push(
              MessagesAPI.getConversation(buyerId, sellerId, null)
            )
            if (adminId) {
              allMessagePromises.push(
                MessagesAPI.getConversation(buyerId, adminId, null),
                MessagesAPI.getConversation(sellerId, adminId, null)
              )
            }
            
            const allMessageArrays = await Promise.all(allMessagePromises)
            const allMessages = allMessageArrays.flat()
            
            // Filter messages after dispute created
            const disputeCreatedAt = new Date(dispute.createdAt).getTime()
            const relevantMessages = allMessages.filter(msg => {
              const msgTime = msg.sentAt ? new Date(msg.sentAt).getTime() : 0
              return msgTime >= disputeCreatedAt - 60000
            })
            
            // Get last message time
            const lastMessage = relevantMessages.sort((a, b) => {
              const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0
              const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0
              return timeB - timeA
            })[0]
            
            return {
              disputeId: dispute.id,
              orderId: dispute.orderId,
              title: `Khiếu nại đơn hàng #${dispute.orderId}`,
              lastMessageTime: lastMessage?.sentAt || dispute.createdAt,
              createdAt: dispute.createdAt,
              buyerId: dispute.buyerId,
              sellerId: dispute.sellerId,
              adminId: adminId
            }
          } catch (error) {
            console.error(`Error loading messages for dispute ${dispute.id}:`, error)
            return {
              disputeId: dispute.id,
              orderId: dispute.orderId,
              title: `Khiếu nại đơn hàng #${dispute.orderId}`,
              lastMessageTime: dispute.createdAt,
              createdAt: dispute.createdAt,
              buyerId: dispute.buyerId,
              sellerId: dispute.sellerId,
              adminId: null
            }
          }
        })
      )
      
      setDisputeConversations(disputeConvs)
    } catch (error) {
      console.error("Error loading dispute conversations:", error)
      setDisputeConversations([])
      setDisputesLoaded(true) // Mark as loaded even on error
    }
  }

  const loadConversations = async (showLoading = true) => {
    if (!user?.id) return
    const userId = Number(user.id)
    if (isNaN(userId)) return
    try {
      if (showLoading) {
        setLoading(true)
      }
      // Load support ID if needed
      await getSupportAdminId()
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
      
      // Filter out messages that belong to active dispute chats
      // (to avoid showing dispute chat messages in regular 1-1 conversations)
      let filteredData = data || []
      
      if (!auctionId && disputeConversations.length > 0) {
        // Check if this conversation is between dispute participants
        const matchingDisputes = disputeConversations.filter(disputeConv => {
          const { buyerId, sellerId, adminId } = disputeConv
          const participants = [buyerId, sellerId]
          if (adminId) participants.push(adminId)
          return participants.includes(userId1) && participants.includes(userId2)
        })
        
        if (matchingDisputes.length > 0) {
          // Filter out messages sent after dispute was created
          filteredData = (data || []).filter(msg => {
            const msgTime = msg.sentAt ? new Date(msg.sentAt).getTime() : 0
            // Keep message only if it was sent before ALL matching disputes were created
            return matchingDisputes.every(dispute => {
              const disputeCreatedAt = new Date(dispute.createdAt).getTime()
              return msgTime < disputeCreatedAt - 60000 // Before dispute (with 1 minute buffer)
            })
          })
        }
      }
      
      setMessages(filteredData)
      
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
      if (filteredData && filteredData.length > 0) {
        // Mark all unread messages in this conversation as read
        const unreadMessages = filteredData.filter(m => !m.isRead && m.receiverId === userId1)
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

  // Filter out conversations that are part of active disputes
  // (to avoid showing buyer-seller, buyer-admin, seller-admin conversations separately)
  // BUT keep regular 1-1 conversations that are NOT part of disputes
  const filteredRegularConversations = conversations.filter(conv => {
    if (!conv || !user?.id) return true
    
    // Always keep conversations with auctionId (they are auction-related, not dispute chats)
    if (conv.auctionId) {
      return true
    }
    
    // If disputes haven't loaded yet, keep all conversations (to avoid flickering)
    if (!disputesLoaded) {
      return true
    }
    
    // If no active disputes, keep all conversations
    if (disputeParticipantPairs.size === 0 || disputeConversations.length === 0) {
      return true
    }
    
    const currentUserId = Number(user.id)
    const otherUserId = conv.otherUserId
    
    // Check if this conversation pair is part of an active dispute
    const pairKey1 = `${currentUserId}-${otherUserId}`
    const pairKey2 = `${otherUserId}-${currentUserId}`
    
    // Only filter if this pair is in dispute participants
    if (!disputeParticipantPairs.has(pairKey1) && !disputeParticipantPairs.has(pairKey2)) {
      return true // Not a dispute participant pair, keep it
    }
    
    // This pair is in dispute participants, check if there's an active dispute between them
    // Find ALL matching disputes (there could be multiple disputes with same participants)
    const matchingDisputes = disputeConversations.filter(disputeConv => {
      const { buyerId, sellerId, adminId } = disputeConv
      // Check if this conversation is between any two participants of this dispute
      const participants = [buyerId, sellerId]
      if (adminId) participants.push(adminId)
      
      return participants.includes(currentUserId) && participants.includes(otherUserId)
    })
    
    if (matchingDisputes.length > 0) {
      // Check if conversation's last message is after dispute was created
      // Only filter if last message is after dispute (meaning it's part of dispute chat)
      // Keep conversations with messages before dispute (regular 1-1 chats)
      const convLastMessageTime = conv.lastMessageTime ? new Date(conv.lastMessageTime).getTime() : 0
      
      if (convLastMessageTime === 0) {
        // No last message time - be conservative and keep it (don't filter)
        console.log("Keeping conversation (no lastMessageTime):", conv.otherUserId)
        return true
      }
      
      // Check against all matching disputes
      // Only filter if last message is CLEARLY after dispute was created
      const isAfterAnyDispute = matchingDisputes.some(dispute => {
        const disputeCreatedAt = new Date(dispute.createdAt).getTime()
        // Only filter if last message is clearly after dispute (with 1 minute buffer to account for timing)
        const isAfter = convLastMessageTime >= disputeCreatedAt - 60000
        if (isAfter) {
          console.log("Filtering conversation (after dispute):", {
            otherUserId: conv.otherUserId,
            lastMessageTime: new Date(convLastMessageTime).toISOString(),
            disputeCreatedAt: new Date(disputeCreatedAt).toISOString(),
            disputeId: dispute.disputeId
          })
        }
        return isAfter
      })
      
      if (isAfterAnyDispute) {
        return false // Filter out - it's part of a dispute chat
      }
      
      // Last message is before dispute - it's a regular conversation, keep it
      console.log("Keeping conversation (before dispute):", {
        otherUserId: conv.otherUserId,
        lastMessageTime: new Date(convLastMessageTime).toISOString()
      })
      return true
    }
    
    return true // Keep this conversation (regular 1-1 chat before dispute or not matching any dispute)
  })

  // Separate conversations into 3 types
  const isSupportUser = user?.currentRole === "support"
  const supportId = supportAdminIdRef.current
  
  console.log("Separating conversations - isSupportUser:", isSupportUser, "supportId:", supportId, "total conversations:", filteredRegularConversations.length)
  
  const personalConversations = filteredRegularConversations
    .filter(conv => {
      // If current user is support, all their conversations go to support tab (not personal)
      if (isSupportUser) return false
      // For other users, exclude conversations with support
      if (supportId && conv.otherUserId === supportId) return false
      return true
    })
    .map(conv => ({ ...conv, type: 'personal' as const }))

  const supportConversations = filteredRegularConversations
    .filter(conv => {
      // If current user is support, show ALL their conversations in support tab
      if (isSupportUser) {
        console.log("Support user - including conversation:", conv.otherUserId, conv.otherUserName)
        return true
      }
      // For other users (buyer/seller), show only conversations with support user
      const isWithSupport = supportId && conv.otherUserId === supportId
      if (isWithSupport) {
        console.log("Non-support user - showing conversation with support:", supportId, "otherUserId:", conv.otherUserId)
      }
      return isWithSupport
    })
    .map(conv => ({ ...conv, type: 'support' as const }))
  
  console.log("Support conversations count:", supportConversations.length, "Personal conversations count:", personalConversations.length)

  const disputeConversationsList = disputeConversations.map(dispute => ({
    otherUserId: 0, // Special marker for dispute
    otherUserName: dispute.title,
    otherUserAvatarUrl: null,
    lastMessage: "Chat khiếu nại",
    lastMessageTime: dispute.lastMessageTime,
    unreadCount: 0,
    auctionId: null,
    auctionTitle: null,
    type: 'dispute' as const,
    disputeId: dispute.disputeId,
    orderId: dispute.orderId
  }))

  // Get conversations for active tab
  const getConversationsForTab = () => {
    let tabConversations: typeof personalConversations = []
    if (activeTab === "personal") {
      tabConversations = personalConversations
    } else if (activeTab === "dispute") {
      tabConversations = disputeConversationsList
    } else if (activeTab === "support") {
      tabConversations = supportConversations
    }
    
    return tabConversations
      .filter((conv) => {
        if (!conv) return false
        const name = conv.otherUserName?.toLowerCase() || ""
        const search = searchQuery.toLowerCase()
        return name.includes(search)
      })
      .sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
        return timeB - timeA
      })
  }

  const filteredConversations = getConversationsForTab()

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

  const handleConversationSelect = (otherUserId: number, auctionId: number | null, disputeId?: number) => {
    // If it's a dispute conversation, open dispute chat
    if (disputeId) {
      router.push(`/messages?disputeId=${disputeId}`)
      return
    }
    
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

  const loadSupportUsers = useCallback(async () => {
    try {
      setLoadingSupportUsers(true)
      // Lấy tất cả users và filter những user có role "support"
      let allUsers: any[] = []
      let page = 1
      const pageSize = 100
      
      // Lấy tối đa 5 pages (500 users) để tìm tất cả support users
      while (page <= 5) {
        const users = await UsersAPI.getAll(page, pageSize)
        if (users.length === 0) break
        allUsers = [...allUsers, ...users]
        if (users.length < pageSize) break
        page++
      }
      
      const supports = allUsers.filter(user => 
        user.roles && user.roles.some((role: string) => role.toLowerCase() === "support")
      ).map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName || user.email,
        avatarUrl: user.avatarUrl
      }))
      
      setSupportUsers(supports)
      
      // Auto-select first support user if available
      if (supports.length > 0 && !selectedSupportUserId) {
        setSelectedSupportUserId(supports[0].id)
      }
      
      console.log("Loaded support users:", supports.length, supports)
    } catch (error) {
      console.error("Error loading support users:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách nhân viên hỗ trợ",
        variant: "destructive",
      })
    } finally {
      setLoadingSupportUsers(false)
    }
  }, [selectedSupportUserId, toast])

  const startSupportChat = useCallback(() => {
    setShowSupportDialog(true)
    loadSupportUsers()
  }, [loadSupportUsers])

  const handleSendSupportMessage = useCallback(async () => {
    if (!supportMessage.trim()) {
      toast({
        title: "Vui lòng nhập nội dung",
        description: "Bạn cần nhập nội dung hỗ trợ trước khi gửi.",
        variant: "destructive",
      })
      return
    }

    if (!selectedSupportUserId) {
      toast({
        title: "Vui lòng chọn nhân viên hỗ trợ",
        description: "Bạn cần chọn một nhân viên hỗ trợ trước khi gửi.",
        variant: "destructive",
      })
      return
    }

    try {
      setSendingSupportMessage(true)
      const supportId = selectedSupportUserId
      const userId = userIdRef.current
      if (!userId) return

      // Tìm thông tin support user đã chọn
      const selectedSupport = supportUsers.find(s => s.id === supportId)
      const supportName = selectedSupport?.fullName || "Hỗ trợ"

      // Gửi tin nhắn đến support user đã chọn
      console.log("Sending support message to supportId:", supportId, "from userId:", userId)
      await MessagesAPI.send({
        senderId: userId,
        receiverId: supportId,
        auctionId: undefined,
        content: supportMessage.trim(),
      })

      console.log("Support message sent successfully")

      // Đóng dialog và reset message
      setShowSupportDialog(false)
      setSupportMessage("")

      // Chuyển sang tab support và mở conversation
      setActiveTab("support")
      
      // Tạo entry conversation tối thiểu nếu chưa có
      setConversations((prev) => {
        const exists = prev.some((c) => c.otherUserId === supportId && c.auctionId === null)
        if (exists) return prev
        return [
          {
            otherUserId: supportId,
            otherUserName: supportName,
            otherUserAvatarUrl: selectedSupport?.avatarUrl || null,
            lastMessage: supportMessage.trim(),
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0,
            auctionId: null,
            auctionTitle: null,
          },
          ...prev,
        ]
      })

      setSelectedConversation(supportId)
      setSelectedAuctionId(null)
      setSelectedConversationInfo({
        otherUserId: supportId,
        otherUserName: supportName,
        otherUserAvatarUrl: selectedSupport?.avatarUrl || null,
        lastMessage: supportMessage.trim(),
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        auctionId: null,
        auctionTitle: null,
      })

      // Load messages
      await loadMessages(userId, supportId, null)
      
      // Reload conversations để cập nhật
      await loadConversations(false)

      toast({
        title: "Đã gửi",
        description: `Tin nhắn của bạn đã được gửi đến ${supportName}.`,
      })
    } catch (error: any) {
      console.error("Send support message error:", error)
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể gửi tin nhắn hỗ trợ",
        variant: "destructive",
      })
    } finally {
      setSendingSupportMessage(false)
    }
  }, [supportMessage, selectedSupportUserId, supportUsers, loadMessages, loadConversations, toast])

  const conversationBody = (
    <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Conversations List */}
        <Card className="p-4">
          <div className="mb-4 space-y-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Cá nhân</TabsTrigger>
                <TabsTrigger value="dispute">Khiếu nại</TabsTrigger>
                <TabsTrigger value="support">Hỗ trợ</TabsTrigger>
              </TabsList>
            </Tabs>

            {activeTab === "personal" && (
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
            )}

            {activeTab === "support" && (user?.currentRole === "buyer" || user?.currentRole === "seller") && (
              <>
                <Button variant="outline" className="w-full" onClick={startSupportChat}>
                  Liên hệ nhân viên hỗ trợ
                </Button>
                
                <Dialog open={showSupportDialog} onOpenChange={(open) => {
                  setShowSupportDialog(open)
                  if (!open) {
                    setSupportMessage("")
                    setSelectedSupportUserId(null)
                  }
                }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bạn muốn hỗ trợ gì?</DialogTitle>
                      <DialogDescription>
                        Chọn nhân viên hỗ trợ và mô tả vấn đề bạn gặp phải.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="support-user">Chọn nhân viên hỗ trợ</Label>
                        {loadingSupportUsers ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Đang tải danh sách...</span>
                          </div>
                        ) : supportUsers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Không có nhân viên hỗ trợ nào
                          </div>
                        ) : (
                          <Select
                            value={selectedSupportUserId?.toString() || ""}
                            onValueChange={(value) => setSelectedSupportUserId(Number(value))}
                          >
                            <SelectTrigger id="support-user">
                              <SelectValue placeholder="Chọn nhân viên hỗ trợ" />
                            </SelectTrigger>
                            <SelectContent>
                              {supportUsers.map((support) => (
                                <SelectItem key={support.id} value={support.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={support.avatarUrl || "/placeholder.svg"} />
                                      <AvatarFallback className="text-xs">
                                        {support.fullName.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">{support.fullName}</span>
                                      <span className="text-xs text-muted-foreground">{support.email}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="support-message">Nội dung hỗ trợ</Label>
                        <Textarea
                          id="support-message"
                          placeholder="Ví dụ: Tôi gặp vấn đề với đơn hàng #123..."
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          rows={5}
                          className="resize-none"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowSupportDialog(false)
                        setSupportMessage("")
                        setSelectedSupportUserId(null)
                      }}>
                        Hủy
                      </Button>
                      <Button 
                        onClick={handleSendSupportMessage} 
                        disabled={sendingSupportMessage || !supportMessage.trim() || !selectedSupportUserId}
                      >
                        {sendingSupportMessage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          "Gửi tin nhắn"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
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
                  const isDispute = conv.type === 'dispute'
                  const disputeId = (conv as any).disputeId
                  const isSelected = isDispute 
                    ? disputeId === disputeIdRef.current
                    : selectedConversation === conv.otherUserId && 
                      selectedAuctionId === (conv.auctionId || null)
                  const userName = conv.otherUserName || "Người dùng"
                  
                  return (
                    <button
                      key={isDispute ? `dispute-${disputeId}` : `${conv.otherUserId}-${conv.auctionId || 'none'}`}
                      onClick={() => handleConversationSelect(
                        conv.otherUserId, 
                        conv.auctionId || null,
                        disputeId
                      )}
                      className={`w-full rounded-lg p-3 text-left transition-all ${
                        isSelected
                          ? "bg-accent border-l-2 border-l-primary"
                          : "hover:bg-muted/50"
                      } ${isDispute ? "border-l-2 border-l-red-500" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12">
                            {isDispute ? (
                              <AvatarFallback className="text-sm font-semibold bg-red-100 text-red-700">
                                <AlertCircle className="h-6 w-6" />
                              </AvatarFallback>
                            ) : (
                              <>
                                <AvatarImage src={conv.otherUserAvatarUrl || "/placeholder.svg"} />
                                <AvatarFallback className="text-sm font-semibold">
                                  {userName.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          {!isDispute && conv.unreadCount > 0 && (
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

  // If disputeId is set, show dispute chat integrated into messages view
  if (disputeId && disputeInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tin nhắn</h1>
          <p className="text-muted-foreground">
            Chat khiếu nại - Đơn hàng #{disputeInfo.orderId} - {disputeInfo.auctionTitle || "Khiếu nại"}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Conversations List - Show dispute info */}
          <Card className="p-4">
            <div className="mb-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setDisputeId(null)
                  setDisputeInfo(null)
                  disputeIdRef.current = null
                  router.replace('/messages')
                }}
              >
                ← Quay lại danh sách chat
              </Button>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Thông tin khiếu nại</h3>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><span className="font-medium text-foreground">Lý do:</span> {disputeInfo.reason}</p>
                <p><span className="font-medium text-foreground">Trạng thái:</span> {disputeInfo.status}</p>
                <p><span className="font-medium text-foreground">Người mua:</span> {disputeInfo.buyerName}</p>
                <p><span className="font-medium text-foreground">Người bán:</span> {disputeInfo.sellerName}</p>
              </div>
            </div>
          </Card>

          {/* Dispute Chat Area */}
          <Card className="flex flex-col h-[calc(100vh-120px)] max-h-[900px]">
            <DisputeChat disputeId={disputeId} />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tin nhắn</h1>
        <p className="text-muted-foreground">
          {user?.currentRole === "admin" || user?.currentRole === "staff" || user?.currentRole === "support"
            ? "Quản lý trao đổi với người dùng"
            : `Trò chuyện với ${user?.currentRole === "buyer" ? "mọi người" : "mọi người"}`}
        </p>
      </div>
      {conversationBody}
    </div>
  )
}