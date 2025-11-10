"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserResponse } from "@/lib/api/types"

interface UserRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserResponse | null
  onAddRole: (userId: number, role: string) => Promise<void>
  onRemoveRole: (userId: number, role: string) => Promise<void>
}

const AVAILABLE_ROLES = ["buyer", "seller", "admin"]

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

  const handleAddRole = async () => {
    if (!user || !selectedRole) return

    try {
      setIsLoading(true)
      await onAddRole(user.id, selectedRole)
      setSelectedRole("")
    } catch (error) {
      console.error("Error adding role:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveRole = async (role: string) => {
    if (!user) return

    try {
      setIsLoading(true)
      await onRemoveRole(user.id, role)
    } catch (error) {
      console.error("Error removing role:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  const availableRolesToAdd = AVAILABLE_ROLES.filter(role => !user.roles.includes(role))

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
              {user.roles.length > 0 ? (
                user.roles.map((role) => (
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
    </Dialog>
  )
}

