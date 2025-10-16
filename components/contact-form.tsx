"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Store message in localStorage for admin to view
    const messages = JSON.parse(localStorage.getItem("bidnow_contact_messages") || "[]")
    const newMessage = {
      id: Date.now().toString(),
      ...formData,
      userId: user?.id,
      timestamp: new Date().toISOString(),
      status: "pending",
      read: false,
    }
    messages.push(newMessage)
    localStorage.setItem("bidnow_contact_messages", JSON.stringify(messages))

    toast({
      title: "Đã gửi tin nhắn",
      description: "Chúng tôi sẽ phản hồi bạn sớm nhất có thể.",
    })

    // Reset form
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      subject: "",
      category: "",
      message: "",
    })
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

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
            Gửi tin nhắn
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
