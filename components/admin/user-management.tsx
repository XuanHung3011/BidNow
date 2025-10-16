import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, MoreVertical, Ban, Shield, Mail } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function UserManagement() {
  const users = [
    {
      id: "1",
      name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      role: "seller",
      status: "active",
      joinDate: "15/01/2024",
      totalAuctions: 24,
      rating: 4.8,
    },
    {
      id: "2",
      name: "Trần Thị B",
      email: "tranthib@example.com",
      role: "buyer",
      status: "active",
      joinDate: "20/02/2024",
      totalBids: 156,
      rating: 4.9,
    },
    {
      id: "3",
      name: "Lê Văn C",
      email: "levanc@example.com",
      role: "seller",
      status: "suspended",
      joinDate: "10/03/2024",
      totalAuctions: 8,
      rating: 3.2,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm kiếm người dùng..." className="pl-9" />
        </div>
        <Button variant="outline">Lọc</Button>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{user.name}</h3>
                    <Badge variant={user.role === "seller" ? "default" : "secondary"}>
                      {user.role === "seller" ? "Người bán" : "Người mua"}
                    </Badge>
                    <Badge variant={user.status === "active" ? "default" : "destructive"}>
                      {user.status === "active" ? "Hoạt động" : "Bị khóa"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>Tham gia: {user.joinDate}</span>
                    {user.totalAuctions && <span>Phiên đấu giá: {user.totalAuctions}</span>}
                    {user.totalBids && <span>Lượt đấu giá: {user.totalBids}</span>}
                    <span>Đánh giá: {user.rating}/5.0</span>
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
                  <DropdownMenuItem>
                    <Mail className="mr-2 h-4 w-4" />
                    Gửi email
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Shield className="mr-2 h-4 w-4" />
                    Xem lịch sử
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Ban className="mr-2 h-4 w-4" />
                    {user.status === "active" ? "Khóa tài khoản" : "Mở khóa"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
