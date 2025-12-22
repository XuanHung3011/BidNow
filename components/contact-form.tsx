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
import { ContactAPI } from "@/lib/api/contact"


export function ContactForm() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: "",
    category: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Không yêu cầu đăng nhập - cho phép người dùng chưa có tài khoản gửi form

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

    try {
      setIsSubmitting(true)
      
      // Gửi email trực tiếp đến admin
      await ContactAPI.sendContactMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        category: formData.category,
        message: formData.message,
        userId: user?.id ? Number(user.id) : null,
      })
      
      // Lưu vào localStorage
      if (typeof window !== "undefined") {
        const storedMessages = JSON.parse(localStorage.getItem("bidnow_contact_messages") || "[]")
        const newMessage = {
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
          userId: user?.id ? String(user.id) : null,
          timestamp: new Date().toISOString(),
          status: "sent",
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
