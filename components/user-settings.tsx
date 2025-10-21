"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Lock, CreditCard, Globe, User, Package, ShoppingBag } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function UserSettings() {
  const { user, switchRole, addRole } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [bidUpdates, setBidUpdates] = useState(true)
  const [newAuctions, setNewAuctions] = useState(false)

  const hasSellerRole = user?.roles?.includes("seller")
  const hasBuyerRole = user?.roles?.includes("buyer")

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Cài đặt</h1>
        <p className="text-muted-foreground">Quản lý tùy chọn tài khoản và thông báo</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account">
            <User className="mr-2 h-4 w-4" />
            Tài khoản
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Thông báo
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

        <TabsContent value="account">
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
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600">ℹ️</div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Muốn trở thành người bán?</p>
                      <p>Kích hoạt vai trò người bán để có thể tạo và quản lý các phiên đấu giá của riêng bạn.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt thông báo</CardTitle>
              <CardDescription>Quản lý cách bạn nhận thông báo từ BidNow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Thông báo Email</Label>
                  <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                </div>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Thông báo đẩy</Label>
                  <p className="text-sm text-muted-foreground">Nhận thông báo trên trình duyệt</p>
                </div>
                <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="bid-updates">Cập nhật đấu giá</Label>
                  <p className="text-sm text-muted-foreground">Thông báo khi bị vượt giá</p>
                </div>
                <Switch id="bid-updates" checked={bidUpdates} onCheckedChange={setBidUpdates} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-auctions">Phiên đấu giá mới</Label>
                  <p className="text-sm text-muted-foreground">Thông báo về phiên đấu giá mới</p>
                </div>
                <Switch id="new-auctions" checked={newAuctions} onCheckedChange={setNewAuctions} />
              </div>

              <Button>Lưu cài đặt</Button>
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
              <div className="space-y-2">
                <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                <Input id="current-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Mật khẩu mới</Label>
                <Input id="new-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                <Input id="confirm-password" type="password" />
              </div>

              <Button>Đổi mật khẩu</Button>
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
              <p className="text-sm text-muted-foreground">Chưa có phương thức thanh toán nào được lưu</p>
              <Button>Thêm phương thức thanh toán</Button>
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
                <Input id="language" value="Tiếng Việt" disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                <Input id="currency" value="VND (₫)" disabled />
              </div>

              <Button>Lưu tùy chọn</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
