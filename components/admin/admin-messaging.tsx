"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, MailOpen, Clock, CheckCircle, XCircle, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  category: string
  message: string
  userId?: string
  timestamp: string
  status: "pending" | "replied" | "closed"
  read: boolean
  reply?: string
  repliedAt?: string
}

export function AdminMessaging() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [replyText, setReplyText] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = () => {
    const storedMessages = JSON.parse(localStorage.getItem("bidnow_contact_messages") || "[]")
    setMessages(
      storedMessages.sort(
        (a: ContactMessage, b: ContactMessage) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    )
  }

  const markAsRead = (messageId: string) => {
    const updatedMessages = messages.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
    setMessages(updatedMessages)
    localStorage.setItem("bidnow_contact_messages", JSON.stringify(updatedMessages))
  }

  const handleReply = (messageId: string) => {
    if (!replyText.trim()) return

    const updatedMessages = messages.map((msg) =>
      msg.id === messageId
        ? {
            ...msg,
            status: "replied" as const,
            reply: replyText,
            repliedAt: new Date().toISOString(),
            read: true,
          }
        : msg,
    )
    setMessages(updatedMessages)
    localStorage.setItem("bidnow_contact_messages", JSON.stringify(updatedMessages))

    toast({
      title: "Đã gửi phản hồi",
      description: "Phản hồi đã được gửi đến người dùng.",
    })

    setReplyText("")
    setSelectedMessage(null)
  }

  const handleClose = (messageId: string) => {
    const updatedMessages = messages.map((msg) =>
      msg.id === messageId ? { ...msg, status: "closed" as const, read: true } : msg,
    )
    setMessages(updatedMessages)
    localStorage.setItem("bidnow_contact_messages", JSON.stringify(updatedMessages))

    toast({
      title: "Đã đóng tin nhắn",
      description: "Tin nhắn đã được đánh dấu là đã xử lý.",
    })

    setSelectedMessage(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      support: "Hỗ trợ kỹ thuật",
      account: "Tài khoản",
      payment: "Thanh toán",
      auction: "Đấu giá",
      report: "Báo cáo",
      other: "Khác",
    }
    return labels[category] || category
  }

  const pendingMessages = messages.filter((msg) => msg.status === "pending")
  const repliedMessages = messages.filter((msg) => msg.status === "replied")
  const closedMessages = messages.filter((msg) => msg.status === "closed")
  const unreadCount = messages.filter((msg) => !msg.read).length

  const MessageList = ({ messageList }: { messageList: ContactMessage[] }) => (
    <ScrollArea className="h-[600px]">
      <div className="space-y-3">
        {messageList.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">Không có tin nhắn</div>
        ) : (
          messageList.map((msg) => (
            <Card
              key={msg.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedMessage?.id === msg.id ? "border-primary bg-accent" : ""
              } ${!msg.read ? "border-l-4 border-l-primary" : ""}`}
              onClick={() => {
                setSelectedMessage(msg)
                if (!msg.read) markAsRead(msg.id)
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      {!msg.read ? <MailOpen className="h-4 w-4 text-primary" /> : <Mail className="h-4 w-4" />}
                      <p className="font-semibold text-sm truncate">{msg.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(msg.category)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium truncate">{msg.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground truncate">{msg.message}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(msg.timestamp)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý tin nhắn</h2>
          <p className="text-muted-foreground">Xem và phản hồi tin nhắn từ người dùng</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {unreadCount} chưa đọc
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Danh sách tin nhắn</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">
                  Chờ xử lý
                  {pendingMessages.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingMessages.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="replied">Đã trả lời</TabsTrigger>
                <TabsTrigger value="closed">Đã đóng</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                <MessageList messageList={pendingMessages} />
              </TabsContent>

              <TabsContent value="replied" className="mt-4">
                <MessageList messageList={repliedMessages} />
              </TabsContent>

              <TabsContent value="closed" className="mt-4">
                <MessageList messageList={closedMessages} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chi tiết tin nhắn</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Từ</p>
                      <p className="font-semibold">{selectedMessage.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                    </div>
                    <Badge
                      variant={
                        selectedMessage.status === "pending"
                          ? "default"
                          : selectedMessage.status === "replied"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {selectedMessage.status === "pending"
                        ? "Chờ xử lý"
                        : selectedMessage.status === "replied"
                          ? "Đã trả lời"
                          : "Đã đóng"}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Danh mục</p>
                    <p className="font-medium">{getCategoryLabel(selectedMessage.category)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Tiêu đề</p>
                    <p className="font-medium">{selectedMessage.subject}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Thời gian</p>
                    <p className="font-medium">{formatDate(selectedMessage.timestamp)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Nội dung</p>
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedMessage.reply && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Phản hồi của bạn</p>
                      <Card className="border-primary/50 bg-primary/5">
                        <CardContent className="pt-4">
                          <p className="whitespace-pre-wrap">{selectedMessage.reply}</p>
                          {selectedMessage.repliedAt && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Đã gửi lúc {formatDate(selectedMessage.repliedAt)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {selectedMessage.status === "pending" && (
                  <div className="space-y-4 border-t pt-6">
                    <div>
                      <p className="mb-2 text-sm font-medium">Phản hồi</p>
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập phản hồi của bạn..."
                        rows={6}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleReply(selectedMessage.id)} className="flex-1">
                        <Send className="mr-2 h-4 w-4" />
                        Gửi phản hồi
                      </Button>
                      <Button variant="outline" onClick={() => handleClose(selectedMessage.id)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Đóng
                      </Button>
                    </div>
                  </div>
                )}

                {selectedMessage.status === "replied" && (
                  <div className="border-t pt-6">
                    <Button variant="outline" onClick={() => handleClose(selectedMessage.id)} className="w-full">
                      <XCircle className="mr-2 h-4 w-4" />
                      Đóng tin nhắn
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-[500px] items-center justify-center text-muted-foreground">
                Chọn một tin nhắn để xem chi tiết
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
