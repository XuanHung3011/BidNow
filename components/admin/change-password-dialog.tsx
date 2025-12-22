"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChangePasswordDto } from "@/lib/api/types"
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

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  isAdminOrSupport?: boolean // Admin/support không cần mật khẩu cũ
  onSubmit: (userId: number, passwordData: ChangePasswordDto) => Promise<void>
}

export function ChangePasswordDialog({ open, onOpenChange, userId, isAdminOrSupport = false, onSubmit }: ChangePasswordDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<ChangePasswordDto>({
    currentPassword: "",
    newPassword: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Admin/support không cần mật khẩu cũ
    if (!isAdminOrSupport && !formData.currentPassword) {
      newErrors.currentPassword = "Mật khẩu hiện tại là bắt buộc"
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Mật khẩu mới là bắt buộc"
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc"
    } else if (formData.newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp"
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

  const handleConfirmChange = async () => {
    try {
      setIsLoading(true)
      // For admin/support, don't send currentPassword (or send empty string)
      const passwordData: ChangePasswordDto = isAdminOrSupport
        ? { currentPassword: "", newPassword: formData.newPassword }
        : formData
      await onSubmit(userId, passwordData)
      
      // Close confirmation dialog first
      setConfirmOpen(false)
      
      // Show success dialog
      setSuccessOpen(true)
      
      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
      })
      setConfirmPassword("")
      setErrors({})
    } catch (error: any) {
      let message = error?.message || "Không thể đổi mật khẩu"
      
      // Map lỗi server generic thành thông báo cụ thể về mật khẩu hiện tại
      if (message.includes("Lỗi server") || message.includes("vui lòng thử lại sau")) {
        message = "Mật khẩu hiện tại không đúng"
      }
      
      setErrors((prev) => ({
        ...prev,
        currentPassword: message,
      }))
      setConfirmOpen(false)
      
      // Show error toast
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>
            {isAdminOrSupport 
              ? "Nhập mật khẩu mới cho người dùng này (không cần mật khẩu cũ)"
              : "Nhập mật khẩu hiện tại và mật khẩu mới"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAdminOrSupport && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mật khẩu hiện tại *</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={formData.currentPassword}
                onChange={(e) => {
                  setFormData({ ...formData, currentPassword: e.target.value })
                  setErrors((prev) => ({ ...prev, currentPassword: "" }))
                }}
                onBlur={() => validateForm()}
                disabled={isLoading}
                className={errors.currentPassword ? "border-destructive" : ""}
              />
              {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới *</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Ít nhất 6 ký tự"
              value={formData.newPassword}
              onChange={(e) => {
                setFormData({ ...formData, newPassword: e.target.value })
                setErrors((prev) => ({ ...prev, newPassword: "" }))
              }}
              onBlur={() => validateForm()}
              disabled={isLoading}
              className={errors.newPassword ? "border-destructive" : ""}
            />
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setErrors((prev) => ({ ...prev, confirmPassword: "" }))
              }}
              onBlur={() => validateForm()}
              disabled={isLoading}
              className={errors.confirmPassword ? "border-destructive" : ""}
            />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Xác nhận đổi mật khẩu */}
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
            <AlertDialogTitle>Xác nhận đổi mật khẩu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đổi mật khẩu cho người dùng này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} onClick={() => setConfirmOpen(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={handleConfirmChange}>
              {isLoading ? "Đang đổi..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Thông báo thành công */}
      <AlertDialog
        open={successOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessOpen(false)
            // Close main dialog and reset form when success dialog closes
            onOpenChange(false)
            setFormData({
              currentPassword: "",
              newPassword: "",
            })
            setConfirmPassword("")
            setErrors({})
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Đổi mật khẩu thành công
            </AlertDialogTitle>
            <AlertDialogDescription>
              Mật khẩu đã được đổi thành công cho người dùng này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessOpen(false)}>
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

