"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Calendar, Award, Phone, Upload, X } from "lucide-react"
import { UsersAPI, UserUpdateDto, API_BASE, getImageUrl } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
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

export function UserProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || "")
  const [phone, setPhone] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch user data to get phone
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return
      try {
        const userData = await UsersAPI.getById(parseInt(user.id))
        setPhone(userData.phone || "")
        if (userData.avatarUrl) {
          setAvatarPreview(getImageUrl(userData.avatarUrl))
        }
      } catch (error) {
        // Silently fail - user data might not be available
      }
    }
    fetchUserData()
  }, [user?.id])

  useEffect(() => {
    if (user) {
      setName(user.name || "")
    }
  }, [user])

  if (!user) return null

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name || !name.trim()) {
      newErrors.name = "Họ tên là bắt buộc"
    }

    if (phone && !/^[0-9+\-\s()]+$/.test(phone)) {
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
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setErrors((prev) => ({ ...prev, avatar: "" }))
  }

  const handleSave = () => {
    if (!validateForm()) {
      return
    }
    setConfirmOpen(true)
  }

  const uploadAvatarFile = async (file: File): Promise<string> => {
    if (!user?.id) {
      throw new Error("User ID is required")
    }

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE}/api/Users/${user.id}/avatar`, {
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

  const handleConfirmSave = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      setErrors({})

      // Upload avatar file if selected (endpoint tự động cập nhật avatarUrl)
      if (avatarFile) {
        try {
          await uploadAvatarFile(avatarFile)
        } catch (error: any) {
          setErrors((prev) => ({
            ...prev,
            avatar: error?.message || "Không thể upload avatar",
          }))
          setConfirmOpen(false)
          return
        }
      }

      // Chỉ cập nhật fullName và phone (avatar đã được cập nhật bởi upload endpoint)
      const updateData: UserUpdateDto = {
        fullName: name.trim(),
        phone: phone.trim() || undefined,
        // Không gửi avatarUrl vì đã được cập nhật bởi upload endpoint
      }

      await UsersAPI.update(parseInt(user.id), updateData)
      
      // Fetch updated user data from API
      const updatedUserData = await UsersAPI.getById(parseInt(user.id))
      
      // Update auth context user
      const storedUser = localStorage.getItem("bidnow_user")
      if (storedUser) {
        const userObj = JSON.parse(storedUser)
        userObj.name = updatedUserData.fullName
        userObj.avatar = updatedUserData.avatarUrl ? getImageUrl(updatedUserData.avatarUrl) : undefined
        localStorage.setItem("bidnow_user", JSON.stringify(userObj))
      }

      // Update local state
      setName(updatedUserData.fullName)
      setPhone(updatedUserData.phone || "")
      // Update avatar preview with new avatar from API
      if (updatedUserData.avatarUrl) {
        // Revoke old preview URL if exists
        if (avatarPreview && avatarFile) {
          URL.revokeObjectURL(avatarPreview)
        }
        setAvatarPreview(getImageUrl(updatedUserData.avatarUrl))
      } else {
        setAvatarPreview(null)
      }

      toast({
        title: "Thành công",
        description: "Cập nhật thông tin thành công",
      })

      setConfirmOpen(false)
      setIsEditing(false)
      setAvatarFile(null)
      
      // Reload page to refresh avatar display everywhere
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error: any) {
      const message = error?.message || "Không thể cập nhật thông tin"
      const lowerMsg = message.toLowerCase()
      const serverErrors: Record<string, string> = {}

      if (lowerMsg.includes("số điện thoại") || lowerMsg.includes("phone")) {
        serverErrors.phone = "Số điện thoại không hợp lệ"
      }
      if (lowerMsg.includes("url avatar") || lowerMsg.includes("avatar url")) {
        serverErrors.avatar = "URL avatar không hợp lệ"
      }
      if (lowerMsg.includes("họ tên") || lowerMsg.includes("fullname")) {
        serverErrors.name = message
      }

      setErrors((prev) => ({
        ...prev,
        ...(Object.keys(serverErrors).length > 0 ? serverErrors : { name: message }),
      }))
      setConfirmOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setName(user.name || "")
    setPhone("")
    setAvatarFile(null)
    if (avatarPreview && avatarFile) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarPreview(null)
    setErrors({})
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                {avatarPreview || user.avatar ? (
                  <AvatarImage src={avatarPreview || user.avatar} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-primary text-3xl text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {user.roles?.map((role) => (
                  <Badge key={role} className="capitalize">
                    {role}
                  </Badge>
                ))}
              </div>

              <div className="mt-6 w-full space-y-2 text-left">
                {/* <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tham gia: Tháng 1, 2025</span>
                </div> */}
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Thành viên đáng tin cậy</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Thông tin tài khoản</CardTitle>
                <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setErrors((prev) => ({ ...prev, name: "" }))
                      }}
                      onBlur={() => {
                        if (!name.trim()) {
                          setErrors((prev) => ({ ...prev, name: "Họ tên là bắt buộc" }))
                        }
                      }}
                      disabled={!isEditing}
                    />
                  </div>
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value)
                        setErrors((prev) => ({ ...prev, phone: "" }))
                      }}
                      onBlur={() => {
                        if (phone && !/^[0-9+\-\s()]+$/.test(phone)) {
                          setErrors((prev) => ({ ...prev, phone: "Số điện thoại không hợp lệ" }))
                        }
                      }}
                      disabled={!isEditing}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">Ảnh đại diện</Label>
                  {isEditing ? (
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
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Chọn ảnh
                        </Button>
                      </div>
                      {avatarPreview && (
                        <div className="relative inline-block">
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="h-24 w-24 rounded-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                            onClick={handleRemoveAvatar}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {errors.avatar && <p className="text-sm text-destructive">{errors.avatar}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-12 w-12">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {user.avatar ? "Đã có ảnh đại diện" : "Chưa có ảnh đại diện"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={user.email} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Vai trò</Label>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Input id="role" value={user.roles?.join(", ") || ""} disabled className="capitalize" />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                      Hủy
                    </Button>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận chỉnh sửa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn cập nhật thông tin cá nhân không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} disabled={isLoading}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
