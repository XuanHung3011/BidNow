"use client"

import { useState, useEffect } from "react"
import { UsersAPI, getImageUrl } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Lock, CreditCard, Globe, User, Package, ShoppingBag, Upload, CheckCircle2, XCircle, Loader2, Camera } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
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

// LocalStorage keys
const NOTIFICATION_PREFS_KEY = "bidnow_notification_preferences"
const USER_PREFS_KEY = "bidnow_user_preferences"

interface NotificationPreferences {
  pushNotifications: boolean
  bidUpdates: boolean
  newAuctions: boolean
}

interface UserPreferences {
  language: string
  currency: string
}

export function UserSettings() {
  const { user, switchRole, addRole, refreshUser } = useAuth()
  const { toast } = useToast()
  
  // Profile state
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false)
  
  // Notification preferences
  const [pushNotifications, setPushNotifications] = useState(true)
  const [bidUpdates, setBidUpdates] = useState(true)
  const [newAuctions, setNewAuctions] = useState(false)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  
  // User preferences
  const [language, setLanguage] = useState("Tiếng Việt")
  const [currency, setCurrency] = useState("VND (₫)")
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

  const hasSellerRole = user?.roles?.includes("seller")
  const hasBuyerRole = user?.roles?.includes("buyer")

  // Load user data and preferences
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || "")
      setPhone(user.phone || "")
      setAvatarUrl(user.avatarUrl || user.avatar || null)
      
      // Load notification preferences from localStorage
      const savedNotifications = localStorage.getItem(NOTIFICATION_PREFS_KEY)
      if (savedNotifications) {
        try {
          const prefs: NotificationPreferences = JSON.parse(savedNotifications)
          setPushNotifications(prefs.pushNotifications ?? true)
          setBidUpdates(prefs.bidUpdates ?? true)
          setNewAuctions(prefs.newAuctions ?? false)
        } catch (e) {
          console.error("Error loading notification preferences:", e)
        }
      }
      
      // Load user preferences from localStorage
      const savedUserPrefs = localStorage.getItem(USER_PREFS_KEY)
      if (savedUserPrefs) {
        try {
          const prefs: UserPreferences = JSON.parse(savedUserPrefs)
          setLanguage(prefs.language || "Tiếng Việt")
          setCurrency(prefs.currency || "VND (₫)")
        } catch (e) {
          console.error("Error loading user preferences:", e)
        }
      }
    }
  }, [user])

  // Open confirm dialog
  const handleUpdateProfile = () => {
    setConfirmUpdateOpen(true)
  }

  // Confirm and update profile
  const handleConfirmUpdate = async () => {
    if (!user?.id) return
    
    setIsUpdatingProfile(true)
    try {
      await UsersAPI.update(user.id, {
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      
      setConfirmUpdateOpen(false)
      toast({
        title: "Thành công",
        description: "Cập nhật thông tin tài khoản thành công",
      })
      
      // Refresh user data
      await refreshUser?.()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thông tin",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    // Get file extension
    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1)
    const allowedExtensions = ['jpg', 'jpeg', 'png']

    // Validate file extension
    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Lỗi",
        description: `Định dạng file .${fileExtension} không được hỗ trợ. Vui lòng chọn file ảnh định dạng: .jpg, .jpeg, .png`,
        variant: "destructive",
      })
      // Reset input
      e.target.value = ''
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ảnh",
        variant: "destructive",
      })
      // Reset input
      e.target.value = ''
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước file không được vượt quá 10MB",
        variant: "destructive",
      })
      // Reset input
      e.target.value = ''
      return
    }

    setIsUploadingAvatar(true)
    try {
      const result = await UsersAPI.uploadAvatar(user.id, file)
      setAvatarUrl(result.avatarUrl)
      
      toast({
        title: "Thành công",
        description: "Cập nhật avatar thành công",
      })
      
      // Refresh user data
      await refreshUser?.()
    } catch (error: any) {
      let errorMessage = error.message || "Không thể tải lên avatar"
      
      // Check if error is about file extension
      if (errorMessage.includes("File extension") || errorMessage.includes("not allowed") || errorMessage.includes("Allowed:")) {
        errorMessage = "Định dạng file không được hỗ trợ. Vui lòng chọn file ảnh định dạng: .jpg, .jpeg, .png"
      }
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
      // Reset input
      e.target.value = ""
    }
  }

  // Save notification preferences
  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true)
    try {
      const prefs: NotificationPreferences = {
        pushNotifications,
        bidUpdates,
        newAuctions,
      }
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs))
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notification:prefs", { detail: prefs }))
      }
      
      toast({
        title: "Thành công",
        description: "Đã lưu cài đặt thông báo",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt",
        variant: "destructive",
      })
    } finally {
      setIsSavingNotifications(false)
    }
  }

  // Save user preferences
  const handleSavePreferences = async () => {
    setIsSavingPreferences(true)
    try {
      const prefs: UserPreferences = {
        language,
        currency,
      }
      localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs))
      
      toast({
        title: "Thành công",
        description: "Đã lưu tùy chọn",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu tùy chọn",
        variant: "destructive",
      })
    } finally {
      setIsSavingPreferences(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Cài đặt</h1>
        <p className="text-muted-foreground">Quản lý tùy chọn tài khoản và thông báo</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">
            <User className="mr-2 h-4 w-4" />
            Tài khoản
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Bảo mật
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            Thanh toán
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Globe className="mr-2 h-4 w-4" />
            Tùy chọn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-border">
                    {avatarUrl ? (
                      <img
                        src={getImageUrl(avatarUrl)}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                        <User className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" asChild disabled={isUploadingAvatar}>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploadingAvatar ? "Đang tải lên..." : "Tải ảnh đại diện"}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG tối đa 10MB
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Email không thể thay đổi
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <Button
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Role Management */}
          <Card>
            <CardHeader>
              <CardTitle>Quản lý vai trò</CardTitle>
              <CardDescription>Chuyển đổi giữa các vai trò người mua và người bán</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Người mua</p>
                      <p className="text-sm text-muted-foreground">Tham gia đấu giá và mua sản phẩm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.currentRole === "buyer" && (
                      <span className="text-sm text-primary font-medium">Đang hoạt động</span>
                    )}
                    {hasBuyerRole && user?.currentRole !== "buyer" && (
                      <Button size="sm" onClick={() => switchRole("buyer")}>
                        Chuyển sang
                      </Button>
                    )}
                    {!hasBuyerRole && (
                      <span className="text-sm text-muted-foreground">Mặc định</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Người bán</p>
                      <p className="text-sm text-muted-foreground">Tạo và quản lý phiên đấu giá</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.currentRole === "seller" && (
                      <span className="text-sm text-primary font-medium">Đang hoạt động</span>
                    )}
                    {hasSellerRole && user?.currentRole !== "seller" && (
                      <Button size="sm" onClick={() => switchRole("seller")}>
                        Chuyển sang
                      </Button>
                    )}
                    {!hasSellerRole && (
                      <Button size="sm" variant="outline" onClick={() => addRole("seller")}>
                        Kích hoạt
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {!hasSellerRole && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 dark:text-blue-400">ℹ️</div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">Muốn trở thành người bán?</p>
                      <p>Kích hoạt vai trò người bán để có thể tạo và quản lý các phiên đấu giá của riêng bạn.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Bảo mật tài khoản</CardTitle>
              <CardDescription>Quản lý mật khẩu và bảo mật tài khoản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Phương thức thanh toán</CardTitle>
              <CardDescription>Quản lý thông tin thanh toán của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-6 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Hiện tại hệ thống sử dụng PayOS để xử lý thanh toán. Bạn không cần lưu thông tin thẻ tín dụng trên hệ thống.
                </p>
                <p className="text-sm text-muted-foreground">
                  Khi thanh toán, bạn sẽ được chuyển hướng đến trang thanh toán an toàn của PayOS.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Tùy chọn hiển thị</CardTitle>
              <CardDescription>Tùy chỉnh trải nghiệm của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language">Ngôn ngữ</Label>
                <Input
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="Tiếng Việt"
                />
                <p className="text-sm text-muted-foreground">
                  Hiện tại chỉ hỗ trợ Tiếng Việt
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="VND (₫)"
                />
                <p className="text-sm text-muted-foreground">
                  Hiện tại chỉ hỗ trợ VND (₫)
                </p>
              </div>

              <Button
                onClick={handleSavePreferences}
                disabled={isSavingPreferences}
              >
                {isSavingPreferences ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu tùy chọn"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AlertDialog xác nhận cập nhật profile */}
      <AlertDialog open={confirmUpdateOpen} onOpenChange={setConfirmUpdateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận cập nhật thông tin</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn lưu các thay đổi thông tin tài khoản?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingProfile} onClick={() => setConfirmUpdateOpen(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              disabled={isUpdatingProfile} 
              onClick={handleConfirmUpdate}
            >
              {isUpdatingProfile ? "Đang cập nhật..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()

  const onSubmit = async () => {
    setMessage(null)
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin" })
      return
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" })
      return
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự" })
      return
    }
    
    if (!user) {
      setMessage({ type: "error", text: "Bạn cần đăng nhập" })
      return
    }
    
    setIsLoading(true)
    try {
      await UsersAPI.changePassword(user.id, {
        currentPassword,
        newPassword,
      })
      
      setMessage({ type: "success", text: "Đổi mật khẩu thành công" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      toast({
        title: "Thành công",
        description: "Mật khẩu đã được thay đổi",
      })
    } catch (error: any) {
      const errorMessage = error.message || "Đổi mật khẩu thất bại"
      setMessage({ type: "error", text: errorMessage })
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Nhập mật khẩu hiện tại"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="new-password">Mật khẩu mới</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu mới"
        />
      </div>
      
      <Button onClick={onSubmit} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          "Đổi mật khẩu"
        )}
      </Button>
    </div>
  )
}
