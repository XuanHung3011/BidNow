"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, MoreVertical, Ban, Shield, Mail, Edit, Key, UserPlus, Users, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { UsersAPI, UserResponse, UserCreateDto, UserUpdateDto, ChangePasswordDto } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { CreateUserDialog } from "./create-user-dialog"
import { EditUserDialog } from "./edit-user-dialog"
import { ChangePasswordDialog } from "./change-password-dialog"
import { ResetPasswordDialog } from "./reset-password-dialog"
import { UserRoleDialog } from "./user-role-dialog"

interface UserManagementProps {
  userRole?: string
}

export function UserManagement({ userRole }: UserManagementProps) {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [filterRole, setFilterRole] = useState<"all" | "buyer" | "seller" | "staff" | "support">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  
  const isAdmin = userRole === "admin"
  const isStaff = userRole === "staff"
  const isSupport = userRole === "support"

  const [confirmAction, setConfirmAction] = useState<{
    type: "toggleActive"
    user: UserResponse
  } | null>(null)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)

  const { toast } = useToast()

  const fetchUsers = async (search: string = searchTerm, currentPage: number = page, showLoading: boolean = true) => {
    try {
      if (showLoading) {
        if (search.trim()) {
          setIsSearching(true)
        } else {
          setLoading(true)
        }
      }
      
      let data: UserResponse[]
      
      if (search.trim()) {
        data = await UsersAPI.search(search.trim(), currentPage, pageSize)
      } else {
        data = await UsersAPI.getAll(currentPage, pageSize)
      }

      data = data.filter((user) => !user.roles?.includes("admin"))
      
      // Chỉ update nếu search term vẫn khớp (tránh race condition)
      setUsers(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách người dùng",
        variant: "destructive",
      })
    } finally {
      if (showLoading) {
        setLoading(false)
        setIsSearching(false)
      }
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        setPage(1) // Reset về trang 1 khi search
        fetchUsers(searchTerm, 1, true)
      } else {
        fetchUsers("", page, true)
      }
    }, searchTerm.trim() ? 700 : 0) // Debounce search để mượt hơn

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    if (!searchTerm.trim()) {
      fetchUsers("", page, true)
    }
  }, [page])

  const handleCreateUser = async (userData: UserCreateDto, role?: string): Promise<UserResponse> => {
    try {
      const createdUser = await UsersAPI.create(userData)
      
      // Add role if specified (staff or support)
      if (role && (role === "staff" || role === "support") && createdUser?.id) {
        try {
          console.log("Adding role", role, "to user", createdUser.id)
          await UsersAPI.addRole(createdUser.id, role)
          console.log("Role added successfully")
          
          // Remove buyer role since staff/support should only have their specific role
          try {
            await UsersAPI.removeRole(createdUser.id, "buyer")
            console.log("Buyer role removed successfully")
          } catch (removeError: any) {
            console.warn("Failed to remove buyer role:", removeError)
            // Don't show error to user, just log it
          }
        } catch (roleError: any) {
          // Log error but don't fail the entire operation
          console.error("Failed to add role:", roleError)
          toast({
            title: "Cảnh báo",
            description: `Tạo người dùng thành công nhưng không thể thêm vai trò ${role}: ${roleError?.message || "Lỗi không xác định"}`,
            variant: "destructive",
          })
        }
      }
      
      toast({
        title: "Thành công",
        description: role ? `Tạo người dùng với vai trò ${role} thành công` : "Tạo người dùng thành công",
      })
      fetchUsers()
      return createdUser
    } catch (error: any) {
      let message = error?.message || "Không thể tạo người dùng"

      // Map thông báo lỗi email trùng sang tiếng Việt rõ ràng
      if (message.toLowerCase().includes("email") && message.toLowerCase().includes("already exists")) {
        message = "Email đã tồn tại"
      }

      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      })

      // Ném lại lỗi với message đã xử lý để CreateUserDialog hiển thị bên dưới ô email
      throw new Error(message)
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

  const handleResetPassword = async (userId: number, newPassword: string) => {
    try {
      await UsersAPI.resetPassword(userId, newPassword)
      toast({
        title: "Thành công",
        description: "Đặt lại mật khẩu thành công",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể đặt lại mật khẩu",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleGeneratePassword = async (userId: number) => {
    try {
      const result = await UsersAPI.generateAndSendPassword(userId)
      toast({
        title: "Thành công",
        description: result.message || "Đã tạo mật khẩu mới và gửi qua email thành công",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cấp lại mật khẩu",
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
      await fetchUsers()
      // Refresh selectedUser to show updated roles
      if (selectedUser && selectedUser.id === userId) {
        const updatedUser = await UsersAPI.getById(userId)
        if (updatedUser) {
          setSelectedUser(updatedUser)
        }
      }
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
      await fetchUsers()
      // Refresh selectedUser to show updated roles
      if (selectedUser && selectedUser.id === userId) {
        const updatedUser = await UsersAPI.getById(userId)
        if (updatedUser) {
          setSelectedUser(updatedUser)
        }
      }
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
    if (role === "staff") return "secondary"
    if (role === "support") return "secondary"
    return "outline"
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Quản trị viên",
      seller: "Người bán",
      buyer: "Người mua",
      staff: "Nhân viên",
      support: "Hỗ trợ",
    }
    return labels[role] || role
  }

  // Filter và sắp xếp users - Phải đặt trước các early returns
  const filteredUsers = useMemo(() => {
    let filtered = [...users]
    
    // Filter theo role
    if (filterRole !== "all") {
      filtered = filtered.filter(user => 
        user.roles?.some(role => role.toLowerCase() === filterRole)
      )
    }
    
    // Filter theo trạng thái
    if (filterStatus === "active") {
      filtered = filtered.filter(user => user.isActive)
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter(user => !user.isActive)
    }
    
    // Sắp xếp: active lên đầu, sau đó theo ngày tạo (mới nhất trước)
    filtered.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1
      if (!a.isActive && b.isActive) return 1
      
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bDate - aDate
    })
    
    return filtered
  }, [users, filterRole, filterStatus])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quản lý người dùng</h2>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Thêm người dùng mới
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              // Không reset page ngay, để debounce xử lý
            }}
          />
        </div>
        {/* Filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={filterRole === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("all")}
          >
            Tất cả vai trò
          </Button>
          <Button
            variant={filterRole === "buyer" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("buyer")}
          >
            Người mua
          </Button>
          <Button
            variant={filterRole === "seller" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("seller")}
          >
            Người bán
          </Button>
          <Button
            variant={filterRole === "staff" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("staff")}
          >
            Nhân viên
          </Button>
          <Button
            variant={filterRole === "support" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("support")}
          >
            Hỗ trợ
          </Button>
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            Tất cả
          </Button>
          <Button
            variant={filterStatus === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("active")}
          >
            Hoạt động
          </Button>
          <Button
            variant={filterStatus === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("inactive")}
          >
            Bị khóa
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {isSearching && (
            <div className="flex items-center justify-center py-2">
              <p className="text-sm text-muted-foreground">Đang tìm kiếm...</p>
            </div>
          )}
          {filteredUsers.length === 0 && !isSearching ? (
            <Card className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Không tìm thấy người dùng nào"
                  : filterRole !== "all" || filterStatus !== "all"
                  ? "Không có người dùng nào phù hợp với bộ lọc"
                  : "Không tìm thấy người dùng nào"}
              </p>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Hiển thị <span className="font-semibold">{filteredUsers.length}</span> người dùng
              </p>
              {filteredUsers.map((user) => (
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
                        {/* {user.reputationScore !== null && user.reputationScore !== undefined && (
                          <span>Đánh giá: {user.reputationScore.toFixed(1)}/5.0</span>
                        )} */}
                        {/* {user.totalRatings && <span>Lượt đánh giá: {user.totalRatings}</span>}
                        {user.totalSales && <span>Đã bán: {user.totalSales}</span>}
                        {user.totalPurchases && <span>Đã mua: {user.totalPurchases}</span>} */}
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
                      {/* Support: Edit, Change Password, Reset Password */}
                      {(isAdmin || isSupport) && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                      )}
                      {(isAdmin || isSupport) && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setPasswordDialogOpen(true)
                          }}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Đổi mật khẩu
                        </DropdownMenuItem>
                      )}
                      {/* Support: Reset Password (no current password required) */}
                      {isSupport && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setResetPasswordDialogOpen(true)
                          }}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Cấp lại mật khẩu
                        </DropdownMenuItem>
                      )}
                      {/* Admin only: Role Management */}
                      {isAdmin && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setRoleDialogOpen(true)
                          }}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Quản lý vai trò
                        </DropdownMenuItem>
                      )}
                      {/* Staff/Admin: Activate/Deactivate (only for buyer/seller) */}
                      {(isAdmin || isStaff) && (
                        <DropdownMenuItem
                          onClick={() => {
                            // Only allow activate/deactivate for buyer/seller
                            const isBuyerOrSeller = user.roles.some(r => r === "buyer" || r === "seller")
                            const isAdminStaffSupport = user.roles.some(r => r === "admin" || r === "staff" || r === "support")
                            if (isBuyerOrSeller && !isAdminStaffSupport) {
                              setConfirmAction({ type: "toggleActive", user })
                            } else {
                              toast({
                                title: "Không thể thực hiện",
                                description: "Chỉ có thể vô hiệu hóa/kích hoạt người dùng buyer hoặc seller",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                        </DropdownMenuItem>
                      )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
              ))}
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
        </div>
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
            isAdminOrSupport={isAdmin || isSupport}
            onSubmit={handleChangePassword}
          />

          <ResetPasswordDialog
            open={resetPasswordDialogOpen}
            onOpenChange={setResetPasswordDialogOpen}
            userId={selectedUser.id}
            userName={selectedUser.fullName}
            isSupport={isSupport}
            onSubmit={handleResetPassword}
            onGeneratePassword={isSupport ? handleGeneratePassword : undefined}
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

      {/* Confirmation dialog chỉ cho kích hoạt / vô hiệu hóa */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!isProcessingAction) {
            setConfirmAction(open ? confirmAction : null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.user.isActive ? "Xác nhận vô hiệu hóa người dùng" : "Xác nhận kích hoạt người dùng"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction &&
                (confirmAction.user.isActive
                  ? `Bạn có chắc chắn muốn vô hiệu hóa người dùng "${confirmAction.user.fullName}"?`
                  : `Bạn có chắc chắn muốn kích hoạt người dùng "${confirmAction.user.fullName}"?`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isProcessingAction}
              onClick={() => {
                if (!isProcessingAction) setConfirmAction(null)
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isProcessingAction || !confirmAction}
              onClick={async () => {
                if (!confirmAction) return

                setIsProcessingAction(true)
                try {
                  if (confirmAction.user.isActive) {
                    await handleDeactivateUser(confirmAction.user.id)
                  } else {
                    await handleActivateUser(confirmAction.user.id)
                  }
                } finally {
                  setIsProcessingAction(false)
                  setConfirmAction(null)
                }
              }}
            >
              {isProcessingAction ? "Đang xử lý..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
