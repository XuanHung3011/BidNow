"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserResponse, UserUpdateDto } from "@/lib/api/types"

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserResponse | null
  onSubmit: (userId: number, userData: UserUpdateDto) => Promise<void>
}

export function EditUserDialog({ open, onOpenChange, user, onSubmit }: EditUserDialogProps) {
  const [formData, setFormData] = useState<UserUpdateDto>({
    fullName: "",
    phone: "",
    avatarUrl: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
      })
      setErrors({})
    }
  }, [user])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ"
    }

    if (formData.avatarUrl && !/^https?:\/\/.+/.test(formData.avatarUrl)) {
      newErrors.avatarUrl = "URL avatar không hợp lệ"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !validateForm()) {
      return
    }

    try {
      setIsLoading(true)
      await onSubmit(user.id, formData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          <DialogDescription>Cập nhật thông tin người dùng {user.email}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user.email} disabled />
            <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Họ tên</Label>
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
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              disabled={isLoading}
            />
            {errors.avatarUrl && <p className="text-sm text-destructive">{errors.avatarUrl}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

