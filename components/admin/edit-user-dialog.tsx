"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserResponse, UserUpdateDto } from "@/lib/api/types"
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
import { Upload, X } from "lucide-react"
import { getImageUrl, API_BASE } from "@/lib/api/config"

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
      })
      setAvatarFile(null)
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
      setAvatarPreview(user.avatarUrl ? getImageUrl(user.avatarUrl) : null)
      setErrors({})
    }
  }, [user])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName || !formData.fullName.trim()) {
      newErrors.fullName = "Họ tên là bắt buộc"
    }

    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
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
    if (avatarPreview && avatarFile) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarPreview(user?.avatarUrl ? getImageUrl(user.avatarUrl) : null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setErrors((prev) => ({ ...prev, avatar: "" }))
  }

  const uploadAvatarFile = async (file: File, userId: number): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

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

    if (!user || !validateForm()) {
      return
    }

    setConfirmOpen(true)
  }

  const handleConfirmUpdate = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setErrors({})

      let avatarUrl: string | undefined = undefined

      // Upload avatar file if selected
      if (avatarFile) {
        try {
          await uploadAvatarFile(avatarFile, user.id)
          // Avatar is already updated by the upload endpoint, so we don't need to include it in updateData
        } catch (error: any) {
          setErrors((prev) => ({
            ...prev,
            avatar: error?.message || "Không thể upload avatar",
          }))
          setConfirmOpen(false)
          return
        }
      }

      const updateData: UserUpdateDto = {
        fullName: formData.fullName?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        // Only update avatarUrl if no file was uploaded (using existing URL)
        avatarUrl: avatarFile ? undefined : (formData.avatarUrl || undefined),
      }

      await onSubmit(user.id, updateData)
      
      setAvatarFile(null)
      if (avatarPreview && avatarFile) {
        URL.revokeObjectURL(avatarPreview)
      }
      setConfirmOpen(false)
      onOpenChange(false)
    } catch (error: any) {
      const message = error?.message || "Không thể cập nhật người dùng"
      const lowerMsg = message.toLowerCase()
      const serverErrors: Record<string, string> = {}

      if (lowerMsg.includes("số điện thoại") || lowerMsg.includes("phone")) {
        serverErrors.phone = "Số điện thoại không hợp lệ"
      }
      if (lowerMsg.includes("url avatar") || lowerMsg.includes("avatar url")) {
        serverErrors.avatar = "URL avatar không hợp lệ"
      }

      setErrors((prev) => ({
        ...prev,
        ...(Object.keys(serverErrors).length > 0 ? serverErrors : { fullName: message }),
      }))
      setConfirmOpen(false)
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
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value })
                setErrors((prev) => ({ ...prev, fullName: "" }))
              }}
              onBlur={() => validateForm()}
              disabled={isLoading}
              className={errors.fullName ? "border-destructive" : ""}
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
              onBlur={() => validateForm()}
              disabled={isLoading}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
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
                    <AvatarFallback>
                      {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
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
              {isLoading ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Xác nhận cập nhật người dùng */}
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
            <AlertDialogTitle>Xác nhận cập nhật người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn lưu thay đổi cho người dùng {user?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} onClick={() => setConfirmOpen(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={handleConfirmUpdate}>
              {isLoading ? "Đang cập nhật..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

