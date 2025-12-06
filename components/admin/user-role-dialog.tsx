"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserResponse } from "@/lib/api/types"
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

interface UserRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserResponse | null
  onAddRole: (userId: number, role: string) => Promise<void>
  onRemoveRole: (userId: number, role: string) => Promise<void>
}

const MANAGEABLE_ROLES = ["buyer", "seller"]

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: "Quản trị viên",
    seller: "Người bán",
    buyer: "Người mua",
  }
  return labels[role] || role
}

export function UserRoleDialog({ open, onOpenChange, user, onAddRole, onRemoveRole }: UserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: "add" | "remove"; role: string } | null>(null)

  const handleAddRole = () => {
    if (!user || !selectedRole) return

    setConfirmAction({ type: "add", role: selectedRole })
  }

  const handleRemoveRole = (role: string) => {
    if (!user) return

    setConfirmAction({ type: "remove", role })
  }

  const handleConfirm = async () => {
    if (!user || !confirmAction) return

    setIsLoading(true)
    try {
      if (confirmAction.type === "add") {
        await onAddRole(user.id, confirmAction.role)
        setSelectedRole("")
      } else {
        await onRemoveRole(user.id, confirmAction.role)
      }
      setConfirmAction(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  const availableRolesToAdd = MANAGEABLE_ROLES.filter((role) => !user.roles.includes(role))
  const displayedRoles = user.roles.filter((role) => MANAGEABLE_ROLES.includes(role))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quản lý vai trò</DialogTitle>
          <DialogDescription>Quản lý vai trò cho người dùng {user.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Vai trò hiện tại</Label>
            <div className="flex flex-wrap gap-2">
              {displayedRoles.length > 0 ? (
                displayedRoles.map((role) => (
                  <div
                    key={role}
                    className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-sm"
                  >
                    <span>{getRoleLabel(role)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveRole(role)}
                      disabled={isLoading}
                    >
                      ×
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có vai trò nào</p>
              )}
            </div>
          </div>

          {availableRolesToAdd.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="role">Thêm vai trò</Label>
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role" className="flex-1">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRolesToAdd.map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleAddRole}
                  disabled={!selectedRole || isLoading}
                >
                  Thêm
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Xác nhận thay đổi vai trò */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!isLoading) {
            setConfirmAction(open ? confirmAction : null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "add" ? "Xác nhận thêm vai trò" : "Xác nhận xóa vai trò"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "add"
                ? `Bạn có chắc chắn muốn thêm vai trò "${getRoleLabel(confirmAction.role)}" cho người dùng ${
                    user?.email
                  }?`
                : `Bạn có chắc chắn muốn xóa vai trò "${getRoleLabel(confirmAction?.role || "")}" khỏi người dùng ${
                    user?.email
                  }?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isLoading}
              onClick={() => {
                if (!isLoading) setConfirmAction(null)
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction disabled={isLoading || !confirmAction} onClick={handleConfirm}>
              {isLoading ? "Đang xử lý..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

