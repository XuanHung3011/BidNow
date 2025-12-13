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

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  userName: string
  isSupport?: boolean // Support có thể cấp lại mật khẩu tự động
  onSubmit: (userId: number, newPassword: string) => Promise<void>
  onGeneratePassword?: (userId: number) => Promise<void> // Handler cho cấp lại mật khẩu tự động
}

export function ResetPasswordDialog({ open, onOpenChange, userId, userName, isSupport = false, onSubmit, onGeneratePassword }: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!newPassword) {
      newErrors.newPassword = "Mật khẩu mới là bắt buộc"
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc"
    } else if (newPassword !== confirmPassword) {
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

  const handleConfirmReset = async () => {
    try {
      setIsLoading(true)
      await onSubmit(userId, newPassword)
      // Reset form
      setNewPassword("")
      setConfirmPassword("")
      setErrors({})
      setConfirmOpen(false)
      onOpenChange(false)
    } catch (error: any) {
      const message = error?.message || "Không thể đặt lại mật khẩu"
      setErrors((prev) => ({
        ...prev,
        newPassword: message,
      }))
      setConfirmOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePassword = async () => {
    if (!onGeneratePassword) return
    try {
      setIsGenerating(true)
      await onGeneratePassword(userId)
      setGenerateConfirmOpen(false)
      onOpenChange(false)
    } catch (error: any) {
      const message = error?.message || "Không thể cấp lại mật khẩu"
      setErrors((prev) => ({
        ...prev,
        newPassword: message,
      }))
      setGenerateConfirmOpen(false)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cấp lại mật khẩu</DialogTitle>
            <DialogDescription>
              Đặt lại mật khẩu cho người dùng {userName}. Không cần mật khẩu hiện tại.
            </DialogDescription>
          </DialogHeader>

          {isSupport && onGeneratePassword && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Chức năng nhanh:</strong> Bạn có thể tự động tạo mật khẩu mới và gửi qua email cho người dùng.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setGenerateConfirmOpen(true)}
                disabled={isGenerating || isLoading}
                className="w-full"
              >
                {isGenerating ? "Đang tạo mật khẩu..." : "Tự động cấp lại mật khẩu và gửi email"}
              </Button>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới *</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
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
                {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Xác nhận đặt lại mật khẩu */}
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
            <AlertDialogTitle>Xác nhận đặt lại mật khẩu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đặt lại mật khẩu cho người dùng {userName}? Người dùng sẽ cần đăng nhập lại với mật khẩu mới.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} onClick={() => setConfirmOpen(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={handleConfirmReset}>
              {isLoading ? "Đang đặt lại..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Xác nhận cấp lại mật khẩu tự động */}
      {isSupport && onGeneratePassword && (
        <AlertDialog
          open={generateConfirmOpen}
          onOpenChange={(open) => {
            if (!isGenerating) {
              setGenerateConfirmOpen(open)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận cấp lại mật khẩu tự động</AlertDialogTitle>
              <AlertDialogDescription>
                Hệ thống sẽ tự động tạo mật khẩu mới và gửi qua email cho người dùng {userName}. 
                Bạn có chắc chắn muốn tiếp tục?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isGenerating} onClick={() => setGenerateConfirmOpen(false)}>
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction disabled={isGenerating} onClick={handleGeneratePassword}>
                {isGenerating ? "Đang xử lý..." : "Xác nhận"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}



