"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, MoreVertical, ImageIcon, Paperclip } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AdminMessaging } from "@/components/admin/admin-messaging"

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: "buyer" | "seller"
  content: string
  timestamp: Date
  read: boolean
}

interface Conversation {
  id: string
  userId: string
  userName: string
  userRole: "buyer" | "seller"
  userAvatar?: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  auctionTitle?: string
}

export function MessagesView() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1")
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()

  if (user?.role === "admin") {
    return <AdminMessaging />
  }

  // Mock conversations
  const conversations: Conversation[] = [
    {
      id: "1",
      userId: user?.role === "buyer" ? "seller1" : "buyer1",
      userName: user?.role === "buyer" ? "Nguyễn Văn A" : "Trần Thị B",
      userRole: user?.role === "buyer" ? "seller" : "buyer",
      lastMessage: "Sản phẩm còn hàng không ạ?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
      unreadCount: 2,
      auctionTitle: "iPhone 15 Pro Max 256GB",
    },
    {
      id: "2",
      userId: user?.role === "buyer" ? "seller2" : "buyer2",
      userName: user?.role === "buyer" ? "Lê Văn C" : "Phạm Thị D",
      userRole: user?.role === "buyer" ? "seller" : "buyer",
      lastMessage: "Cảm ơn bạn đã quan tâm!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
      unreadCount: 0,
      auctionTitle: "MacBook Pro M3",
    },
    {
      id: "3",
      userId: user?.role === "buyer" ? "seller3" : "buyer3",
      userName: user?.role === "buyer" ? "Hoàng Văn E" : "Đỗ Thị F",
      userRole: user?.role === "buyer" ? "seller" : "buyer",
      lastMessage: "Tôi có thể xem sản phẩm trực tiếp không?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      unreadCount: 0,
      auctionTitle: "Đồng hồ Rolex Submariner",
    },
  ]

  // Mock messages for selected conversation
  const messages: Message[] = [
    {
      id: "1",
      senderId: user?.role === "buyer" ? user.id : "buyer1",
      senderName: user?.role === "buyer" ? user.name : "Trần Thị B",
      senderRole: "buyer",
      content: "Xin chào, tôi muốn hỏi về sản phẩm này",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      read: true,
    },
    {
      id: "2",
      senderId: user?.role === "seller" ? user.id : "seller1",
      senderName: user?.role === "seller" ? user.name : "Nguyễn Văn A",
      senderRole: "seller",
      content: "Chào bạn! Tôi có thể giúp gì cho bạn?",
      timestamp: new Date(Date.now() - 1000 * 60 * 55),
      read: true,
    },
    {
      id: "3",
      senderId: user?.role === "buyer" ? user.id : "buyer1",
      senderName: user?.role === "buyer" ? user.name : "Trần Thị B",
      senderRole: "buyer",
      content: "Sản phẩm có bảo hành không ạ?",
      timestamp: new Date(Date.now() - 1000 * 60 * 50),
      read: true,
    },
    {
      id: "4",
      senderId: user?.role === "seller" ? user.id : "seller1",
      senderName: user?.role === "seller" ? user.name : "Nguyễn Văn A",
      senderRole: "seller",
      content: "Có ạ, sản phẩm được bảo hành 12 tháng chính hãng",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      read: true,
    },
    {
      id: "5",
      senderId: user?.role === "buyer" ? user.id : "buyer1",
      senderName: user?.role === "buyer" ? user.name : "Trần Thị B",
      senderRole: "buyer",
      content: "Sản phẩm còn hàng không ạ?",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
    },
  ]

  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Handle sending message
      console.log("[v0] Sending message:", messageInput)
      setMessageInput("")
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    return `${days} ngày trước`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tin nhắn</h1>
        <p className="text-muted-foreground">Trò chuyện với {user?.role === "buyer" ? "người bán" : "người mua"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Conversations List */}
        <Card className="p-4">
          <div className="mb-4">
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
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full rounded-lg p-3 text-left transition-colors hover:bg-accent ${
                    selectedConversation === conv.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conv.userAvatar || "/placeholder.svg"} />
                      <AvatarFallback>{conv.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm">{conv.userName}</p>
                        <span className="text-xs text-muted-foreground">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      {conv.auctionTitle && (
                        <p className="text-xs text-muted-foreground truncate">{conv.auctionTitle}</p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
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
                    <AvatarFallback>
                      {conversations.find((c) => c.id === selectedConversation)?.userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {conversations.find((c) => c.id === selectedConversation)?.userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {conversations.find((c) => c.id === selectedConversation)?.auctionTitle}
                    </p>
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
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.senderId === user?.id
                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                          <Avatar className="h-8 w-8">
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
                            <p className="mt-1 text-xs text-muted-foreground">{formatTime(message.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
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
                  <Button onClick={handleSendMessage} className="shrink-0">
                    <Send className="h-4 w-4" />
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
