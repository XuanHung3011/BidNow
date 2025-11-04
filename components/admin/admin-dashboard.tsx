"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminStats } from "./admin-stats"
import { PendingAuctions } from "./pending-auctions"
import { UserManagement } from "./user-management"
import { DisputeManagement } from "./dispute-management"
import { PlatformAnalytics } from "./platform-analytics"
import { AllAuctionsManagement } from "./all-auctions-management"
import { CategoryManagement } from "./category-management"

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bảng điều khiển quản trị</h1>
        <p className="text-muted-foreground">Quản lý nền tảng và giám sát hoạt động</p>
      </div>

      <AdminStats />

      <Tabs defaultValue="auctions" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="auctions">Sản phẩm</TabsTrigger>
          <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
          <TabsTrigger value="disputes">Tranh chấp</TabsTrigger>
          <TabsTrigger value="categories">Danh mục</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
        </TabsList>

        <TabsContent value="auctions" className="mt-6">
          <AllAuctionsManagement />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <PendingAuctions />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="disputes" className="mt-6">
          <DisputeManagement />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <PlatformAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
