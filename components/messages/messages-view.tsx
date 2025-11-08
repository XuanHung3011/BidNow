"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, MoreVertical, ImageIcon, Paperclip, Loader2, Plus, Mail } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AdminMessaging } from "@/components/admin/admin-messaging"
import { MessagesAPI } from "@/lib/api/messages"
import type { ConversationDto, MessageResponseDto } from "@/lib/api/types"
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

export function MessagesView() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [messages, setMessages] = useState<MessageResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newConversationEmail, setNewConversationEmail] = useState("")
  const [newConversationMessage, setNewConversationMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  if (user?.currentRole === "admin") {
    return <AdminMessaging />
  }

  // Load conversations
  useEffect(() => {
    if (user?.id) {
      loadConversations()
    }
  }, [user?.id])

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id) {
      const userId = Number(user.id)
      if (!isNaN(userId)) {
        loadMessages(userId, selectedConversation, selectedAuctionId)
      }
    }
  }, [selectedConversation, selectedAuctionId, user?.id])

  const loadConversations = async () => {
    if (!user?.id) return
    const userId = Number(user.id)
    if (isNaN(userId)) return
    try {
      setLoading(true)
      const data = await MessagesAPI.getConversations(userId)
      setConversations(data)
      // Auto-select first conversation if available
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0].otherUserId)
        setSelectedAuctionId(data[0].auctionId || null)
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách cuộc trò chuyện",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (userId1: number, userId2: number, auctionId: number | null) => {
    try {
      const data = await MessagesAPI.getConversation(userId1, userId2, auctionId || undefined)
      setMessages(data)
      // Mark conversation as read
      if (data.length > 0) {
        await MessagesAPI.markConversationAsRead(userId1, userId2, auctionId || undefined)
        // Reload conversations to update unread count
        loadConversations()
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải tin nhắn",
        variant: "destructive",
      })
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
      // Reload conversations to update last message
      await loadConversations()
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

    try {
      setCreating(true)
      const conversation = await MessagesAPI.createConversationByEmail({
        senderId,
        receiverEmail: newConversationEmail.trim(),
        auctionId: null,
        initialMessage: newConversationMessage.trim() || undefined,
      })

      // Add to conversations list
      setConversations((prev) => [conversation, ...prev])
      
      // Select the new conversation
      setSelectedConversation(conversation.otherUserId)
      setSelectedAuctionId(conversation.auctionId || null)

      // Clear form and close dialog
      setNewConversationEmail("")
      setNewConversationMessage("")
      setShowCreateDialog(false)

      toast({
        title: "Thành công",
        description: "Cuộc trò chuyện đã được tạo",
      })

      // Reload conversations to get latest data
      await loadConversations()
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tin nhắn</h1>
        <p className="text-muted-foreground">Trò chuyện với {user?.currentRole === "buyer" ? "người bán" : "người mua"}</p>
      </div>

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
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Chưa có cuộc trò chuyện nào
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <button
                    key={`${conv.otherUserId}-${conv.auctionId || 'none'}`}
                    onClick={() => handleConversationSelect(conv.otherUserId, conv.auctionId || null)}
                    className={`w-full rounded-lg p-3 text-left transition-colors hover:bg-accent ${
                      selectedConversation === conv.otherUserId && selectedAuctionId === (conv.auctionId || null)
                        ? "bg-accent"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.otherUserAvatarUrl || "/placeholder.svg"} />
                        <AvatarFallback>{conv.otherUserName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm">{conv.otherUserName}</p>
                          {conv.lastMessageTime && (
                            <span className="text-xs text-muted-foreground">{formatTime(conv.lastMessageTime)}</span>
                          )}
                        </div>
                        {conv.auctionTitle && (
                          <p className="text-xs text-muted-foreground truncate">{conv.auctionTitle}</p>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || "Chưa có tin nhắn"}</p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="h-5 min-w-5 rounded-full px-1.5 text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        conversations.find(
                          (c) => c.otherUserId === selectedConversation && c.auctionId === selectedAuctionId
                        )?.otherUserAvatarUrl || "/placeholder.svg"
                      }
                    />
                    <AvatarFallback>
                      {conversations
                        .find((c) => c.otherUserId === selectedConversation && c.auctionId === selectedAuctionId)
                        ?.otherUserName.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {conversations.find(
                        (c) => c.otherUserId === selectedConversation && c.auctionId === selectedAuctionId
                      )?.otherUserName || "Người dùng"}
                    </p>
                    {conversations.find(
                      (c) => c.otherUserId === selectedConversation && c.auctionId === selectedAuctionId
                    )?.auctionTitle && (
                      <p className="text-xs text-muted-foreground">
                        {conversations.find(
                          (c) => c.otherUserId === selectedConversation && c.auctionId === selectedAuctionId
                        )?.auctionTitle}
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
                    <DropdownMenuItem>Xem hồ sơ</DropdownMenuItem>
                    <DropdownMenuItem>Xem sản phẩm</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Báo cáo</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.senderId === Number(user?.id)
                      return (
                        <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                          <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={isOwnMessage ? message.senderAvatarUrl || undefined : message.senderAvatarUrl || undefined} />
                              <AvatarFallback className="text-xs">{message.senderName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
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
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Paperclip className="h-5 w-5" />
                  </Button>
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
            <div className="flex h-[600px] items-center justify-center text-muted-foreground">
              Chọn một cuộc trò chuyện để bắt đầu
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
