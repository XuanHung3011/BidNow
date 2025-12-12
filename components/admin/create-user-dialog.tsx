"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { UserCreateDto, UserResponse } from "@/lib/api/types"
import { Upload, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (userData: UserCreateDto, role?: string) => Promise<UserResponse>
}

export function CreateUserDialog({ open, onOpenChange, onSubmit }: CreateUserDialogProps) {
  const [formData, setFormData] = useState<UserCreateDto>({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    avatarUrl: "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    if (!selectedRole) {
      newErrors.role = "Vai trò là bắt buộc"
    }

    if (!formData.phone) {
      newErrors.phone = "Số điện thoại là bắt buộc"
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ"
    }

    if (avatarFile) {
      if (!avatarFile.type.startsWith("image/")) {
        newErrors.avatar = "Chỉ chấp nhận file hình ảnh"
      } else if (avatarFile.size > 10 * 1024 * 1024) {
        newErrors.avatar = "Kích thước file không được vượt quá 10MB"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrors((prev) => ({ ...prev, avatar: "" }))

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, avatar: "Chỉ chấp nhận file hình ảnh" }))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: "Kích thước file không được vượt quá 10MB" }))
      return
    }

    setAvatarFile(file)
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setErrors((prev) => ({ ...prev, avatar: "" }))
  }

  const uploadAvatarFile = async (file: File, userId: number): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5167"
    const response = await fetch(`${API_BASE}/api/Users/${userId}/avatar`, {
      method: "POST",
      body: formData,
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Không thể upload avatar" }))
      throw new Error(error.message || "Không thể upload avatar")
    }

    const data = await response.json()
    return data.avatarUrl
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
      setErrors({})

      // First create user without avatar
      const userData: UserCreateDto = {
        ...formData,
        avatarUrl: undefined, // Don't send avatarUrl in create
      }

      // Role is required, so always pass it
      const createdUser = await onSubmit(userData, selectedRole)
      
      // Upload avatar file if selected (after user is created)
      if (avatarFile && createdUser?.id) {
        try {
          await uploadAvatarFile(avatarFile, createdUser.id)
        } catch (error: any) {
          // Log error but don't fail the entire operation
          console.warn("Failed to upload avatar:", error)
        }
      }
      
      // Reset form
      setFormData({
        email: "",
        password: "",
        fullName: "",
        phone: "",
        avatarUrl: "",
      })
      setSelectedRole("")
      setAvatarFile(null)
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
      setAvatarPreview(null)
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
        serverErrors.avatar = "URL avatar không hợp lệ"
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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        email: "",
        password: "",
        fullName: "",
        phone: "",
        avatarUrl: "",
      })
      setSelectedRole("")
      setAvatarFile(null)
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
      setAvatarPreview(null)
      setErrors({})
    }
  }, [open])

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
            <Label htmlFor="role">Vai trò *</Label>
            <Select 
              value={selectedRole || undefined} 
              onValueChange={(value) => setSelectedRole(value)} 
              disabled={isLoading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
            <p className="text-xs text-muted-foreground">
              Chọn vai trò cho tài khoản (Staff hoặc Support).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Ảnh đại diện</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Chọn ảnh
                </Button>
              </div>
              {avatarPreview && (
                <div className="relative inline-block">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview} alt="Preview" />
                    <AvatarFallback>Preview</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveAvatar}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {errors.avatar && <p className="text-sm text-destructive">{errors.avatar}</p>}
            </div>
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


