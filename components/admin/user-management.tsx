"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, MoreVertical, Ban, Shield, Mail, Edit, Key, UserPlus, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UsersAPI, UserResponse, UserCreateDto, UserUpdateDto, ChangePasswordDto } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { CreateUserDialog } from "./create-user-dialog"
import { EditUserDialog } from "./edit-user-dialog"
import { ChangePasswordDialog } from "./change-password-dialog"
import { UserRoleDialog } from "./user-role-dialog"

export function UserManagement() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)

  const { toast } = useToast()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      let data: UserResponse[]
      
      if (searchTerm.trim()) {
        data = await UsersAPI.search(searchTerm.trim(), page, pageSize)
      } else {
        data = await UsersAPI.getAll(page, pageSize)
      }
      
      setUsers(data)
    } catch (error: any) {
      console.error("Error fetching users:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách người dùng",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers()
    }, searchTerm ? 500 : 0) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [page, searchTerm])

  const handleCreateUser = async (userData: UserCreateDto) => {
    try {
      await UsersAPI.create(userData)
      toast({
        title: "Thành công",
        description: "Tạo người dùng thành công",
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo người dùng",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleUpdateUser = async (userId: number, userData: UserUpdateDto) => {
    try {
      await UsersAPI.update(userId, userData)
      toast({
        title: "Thành công",
        description: "Cập nhật người dùng thành công",
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật người dùng",
        variant: "destructive",
      })
      throw error
    }
  }


  const handleChangePassword = async (userId: number, passwordData: ChangePasswordDto) => {
    try {
      await UsersAPI.changePassword(userId, passwordData)
      toast({
        title: "Thành công",
        description: "Đổi mật khẩu thành công",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể đổi mật khẩu",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleActivateUser = async (userId: number) => {
    try {
      await UsersAPI.activate(userId)
      toast({
        title: "Thành công",
        description: "Kích hoạt người dùng thành công",
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể kích hoạt người dùng",
        variant: "destructive",
      })
    }
  }

  const handleDeactivateUser = async (userId: number) => {
    try {
      await UsersAPI.deactivate(userId)
      toast({
        title: "Thành công",
        description: "Vô hiệu hóa người dùng thành công",
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể vô hiệu hóa người dùng",
        variant: "destructive",
      })
    }
  }

  const handleAddRole = async (userId: number, role: string) => {
    try {
      await UsersAPI.addRole(userId, role)
      toast({
        title: "Thành công",
        description: `Thêm vai trò ${role} thành công`,
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm vai trò",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleRemoveRole = async (userId: number, role: string) => {
    try {
      await UsersAPI.removeRole(userId, role)
      toast({
        title: "Thành công",
        description: `Xóa vai trò ${role} thành công`,
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa vai trò",
        variant: "destructive",
      })
      throw error
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    if (role === "admin") return "default"
    if (role === "seller") return "secondary"
    return "outline"
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Quản trị viên",
      seller: "Người bán",
      buyer: "Người mua",
    }
    return labels[role] || role
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quản lý người dùng</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tạo người dùng
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Không tìm thấy người dùng nào</p>
        </Card>
      ) : (
        <>
      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                      {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{user.fullName}</h3>
                        {user.roles.map((role) => (
                          <Badge key={role} variant={getRoleBadgeVariant(role)}>
                            {getRoleLabel(role)}
                    </Badge>
                        ))}
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "Hoạt động" : "Bị khóa"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {user.phone && <span>Điện thoại: {user.phone}</span>}
                        {user.createdAt && (
                          <span>Tham gia: {new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
                        )}
                        {user.reputationScore !== null && user.reputationScore !== undefined && (
                          <span>Đánh giá: {user.reputationScore.toFixed(1)}/5.0</span>
                        )}
                        {user.totalRatings && <span>Lượt đánh giá: {user.totalRatings}</span>}
                        {user.totalSales && <span>Đã bán: {user.totalSales}</span>}
                        {user.totalPurchases && <span>Đã mua: {user.totalPurchases}</span>}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user)
                          setEditDialogOpen(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user)
                          setPasswordDialogOpen(true)
                        }}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Đổi mật khẩu
                  </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user)
                          setRoleDialogOpen(true)
                        }}
                      >
                    <Shield className="mr-2 h-4 w-4" />
                        Quản lý vai trò
                  </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (user.isActive) {
                            handleDeactivateUser(user.id)
                          } else {
                            handleActivateUser(user.id)
                          }
                        }}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        {user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                      </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Trước
            </Button>
            <span className="text-sm text-muted-foreground">Trang {page}</span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={users.length < pageSize}
            >
              Sau
            </Button>
          </div>
        </>
      )}

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateUser}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onSubmit={handleUpdateUser}
      />

      {selectedUser && (
        <>
          <ChangePasswordDialog
            open={passwordDialogOpen}
            onOpenChange={setPasswordDialogOpen}
            userId={selectedUser.id}
            onSubmit={handleChangePassword}
          />

          <UserRoleDialog
            open={roleDialogOpen}
            onOpenChange={setRoleDialogOpen}
            user={selectedUser}
            onAddRole={handleAddRole}
            onRemoveRole={handleRemoveRole}
          />
        </>
      )}
    </div>
  )
}
