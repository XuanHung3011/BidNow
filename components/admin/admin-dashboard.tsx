"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminStats } from "./admin-stats"
import { PendingAuctions } from "./pending-auctions"
import { UserManagement } from "./user-management"
import { DisputeManagement } from "./dispute-management"
import { PlatformAnalytics } from "./platform-analytics"
import { AllAuctionsManagement } from "./all-auctions-management"
import { CategoryManagement } from "./category-management"
import { AdminMessaging } from "./admin-messaging"

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tổng quan hệ thống</h1>
        <p className="text-muted-foreground">Quản lý nền tảng và giám sát hoạt động</p>
      </div>

      <AdminStats />

      <Tabs defaultValue="auctions" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger
            value="auctions"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Sản phẩm
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Chờ duyệt
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Người dùng
          </TabsTrigger>
          {/* <TabsTrigger value="disputes">Tranh chấp</TabsTrigger> */}
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Danh mục
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Phân tích
          </TabsTrigger>
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
