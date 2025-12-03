"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { UserCreateDto } from "@/lib/api/types"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (userData: UserCreateDto) => Promise<void>
}

export function CreateUserDialog({ open, onOpenChange, onSubmit }: CreateUserDialogProps) {
  const [formData, setFormData] = useState<UserCreateDto>({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    avatarUrl: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = "Email là bắt buộc"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ"
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc"
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự"
    }

    if (!formData.fullName) {
      newErrors.fullName = "Họ tên là bắt buộc"
    }

    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ"
    }

    if (formData.avatarUrl && !/^https?:\/\/.+/.test(formData.avatarUrl)) {
      newErrors.avatarUrl = "URL avatar không hợp lệ"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setConfirmOpen(true)
  }

  const handleConfirmCreate = async () => {
    try {
      setIsLoading(true)
      await onSubmit(formData)
      // Reset form
      setFormData({
        email: "",
        password: "",
        fullName: "",
        phone: "",
        avatarUrl: "",
      })
      setErrors({})
      setConfirmOpen(false)
      onOpenChange(false)
    } catch (error: any) {
      const message = error?.message || "Không thể tạo người dùng"
      const lowerMsg = message.toLowerCase()
      const serverErrors: Record<string, string> = {}

      if (lowerMsg.includes("email") && lowerMsg.includes("tồn tại")) {
        serverErrors.email = "Email đã tồn tại"
      }
      if (lowerMsg.includes("số điện thoại") || lowerMsg.includes("phone")) {
        serverErrors.phone = "Số điện thoại không hợp lệ"
      }
      if (lowerMsg.includes("url avatar") || lowerMsg.includes("avatar url")) {
        serverErrors.avatarUrl = "URL avatar không hợp lệ"
      }

      setErrors((prev) => ({
        ...prev,
        ...(Object.keys(serverErrors).length > 0 ? serverErrors : { email: message }),
      }))
      setConfirmOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo người dùng mới</DialogTitle>
          <DialogDescription>Điền thông tin để tạo tài khoản người dùng mới</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
  <Label htmlFor="email">Email *</Label>
  <Input
    id="email"
    type="email"
    placeholder="user@example.com"
    value={formData.email}
    onChange={(e) => {
      setFormData({ ...formData, email: e.target.value })
      setErrors((prev) => ({ ...prev, email: "" })) // XÓA LỖI EMAIL KHI USER NHẬP LẠI
    }}
    disabled={isLoading}
  />
  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
</div>


          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Ít nhất 6 ký tự"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Họ tên *</Label>
            <Input
              id="fullName"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={isLoading}
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0901234567"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value })
                setErrors((prev) => ({ ...prev, phone: "" }))
              }}
              disabled={isLoading}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">URL Avatar</Label>
            <Input
              id="avatarUrl"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={formData.avatarUrl}
              onChange={(e) => {
                setFormData({ ...formData, avatarUrl: e.target.value })
                setErrors((prev) => ({ ...prev, avatarUrl: "" }))
              }}
              disabled={isLoading}
            />
            {errors.avatarUrl && <p className="text-sm text-destructive">{errors.avatarUrl}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang tạo..." : "Tạo người dùng"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Xác nhận tạo người dùng */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isLoading) {
            setConfirmOpen(open)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận tạo người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn tạo người dùng mới với các thông tin đã nhập?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} onClick={() => setConfirmOpen(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={handleConfirmCreate}>
              {isLoading ? "Đang tạo..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

