"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { UsersAPI } from "@/lib/api/users"
import { MessagesAPI } from "@/lib/api/messages"
import { useRouter } from "next/navigation"

const SUPPORT_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_ADMIN_EMAIL || "admin@bidnow.local"

export function ContactForm() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: "",
    category: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  const getCategoryLabel = (value: string) => {
    switch (value) {
      case "support":
        return "Hỗ trợ kỹ thuật"
      case "account":
        return "Vấn đề tài khoản"
      case "payment":
        return "Thanh toán"
      case "auction":
        return "Phiên đấu giá"
      case "report":
        return "Báo cáo vi phạm"
      case "other":
        return "Khác"
      default:
        return value || "Không xác định"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để gửi tin nhắn.",
        variant: "destructive",
      })
      return
    }

    const senderId = Number(user.id)
    if (Number.isNaN(senderId)) {
      toast({
        title: "Lỗi",
        description: "Không xác định được thông tin người gửi.",
        variant: "destructive",
      })
      return
    }

    const composedMessage = [
      `[Tiêu đề]: ${formData.subject || "Không có"}`,
      `[Danh mục]: ${getCategoryLabel(formData.category)}`,
      `[Liên hệ]: ${formData.name || "Ẩn danh"} - ${formData.email || "Không cung cấp"}`,
      "",
      "[Nội dung]:",
      formData.message || "(Không có nội dung)",
    ].join("\n")

    try {
      setIsSubmitting(true)
      const adminUser = await UsersAPI.getByEmail(SUPPORT_ADMIN_EMAIL)
      if (!adminUser?.id) {
        throw new Error("Không tìm thấy tài khoản hỗ trợ")
      }
      await MessagesAPI.send({
        senderId,
        receiverId: adminUser.id,
        content: composedMessage,
      })

      if (typeof window !== "undefined") {
        const storedMessages = JSON.parse(localStorage.getItem("bidnow_contact_messages") || "[]")
        const newMessage = {
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
          userId: String(user?.id),
          timestamp: new Date().toISOString(),
          status: "pending",
          read: false,
        }
        localStorage.setItem("bidnow_contact_messages", JSON.stringify([newMessage, ...storedMessages]))
      }

      toast({
        title: "Đã gửi tin nhắn",
        description: "Chúng tôi sẽ phản hồi bạn sớm nhất có thể.",
      })

      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        subject: "",
        category: "",
        message: "",
      })
    } catch (error) {
      console.error("Gửi liên hệ thất bại:", error)
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Nhập họ và tên"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="Nhập email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Danh mục *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="support">Hỗ trợ kỹ thuật</SelectItem>
                <SelectItem value="account">Vấn đề tài khoản</SelectItem>
                <SelectItem value="payment">Thanh toán</SelectItem>
                <SelectItem value="auction">Phiên đấu giá</SelectItem>
                <SelectItem value="report">Báo cáo vi phạm</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Tiêu đề *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              placeholder="Nhập tiêu đề"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Nội dung *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              placeholder="Mô tả chi tiết vấn đề của bạn..."
              rows={6}
            />
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi..." : "Gửi tin nhắn"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
