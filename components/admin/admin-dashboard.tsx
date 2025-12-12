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
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function AdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("auctions")
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Determine available tabs based on role
  const isAdmin = user?.currentRole === "admin"
  const isStaff = user?.currentRole === "staff"
  const isSupport = user?.currentRole === "support"
  
  // Staff tabs: Sản phẩm, Chờ duyệt, Danh mục, Khiếu nại (không quản lý users)
  const staffTabs: string[] = ["auctions", "pending", "categories", "disputes"]
  // Support tabs: chỉ quản lý người dùng
  const supportTabs = ["users"]
  // Admin tabs: ẩn Chờ duyệt/Khiếu nại/Danh mục (theo yêu cầu), giữ Sản phẩm, Người dùng, Phân tích
  const adminTabs = ["auctions", "users", "analytics"]
  
  const availableTabs = isAdmin ? adminTabs : isStaff ? staffTabs : isSupport ? supportTabs : []
  
  // Set default tab based on role
  useEffect(() => {
    if (user && activeTab && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || "auctions")
    }
  }, [user, availableTabs, activeTab])

  // Check if tab query param is present
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && availableTabs.includes(tabParam)) {
      setActiveTab(tabParam)
      // Remove query param from URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete("tab")
      const newQuery = params.toString()
      router.replace(`/admin${newQuery ? `?${newQuery}` : ""}`, { scroll: false })
    }
  }, [searchParams, router, availableTabs])

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tổng quan hệ thống</h1>
            <p className="text-muted-foreground">Quản lý nền tảng và giám sát hoạt động</p>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Vai trò:</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                {isAdmin ? "Quản trị viên" : isStaff ? "Nhân viên" : isSupport ? "Hỗ trợ" : user.currentRole}
              </span>
            </div>
          )}
        </div>
      </div>

      {isAdmin && <AdminStats />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full lg:w-auto" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))` }}>
          {availableTabs.includes("auctions") && (
            <TabsTrigger
              value="auctions"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Sản phẩm
            </TabsTrigger>
          )}
          {availableTabs.includes("pending") && (
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Chờ duyệt
            </TabsTrigger>
          )}
          {availableTabs.includes("users") && (
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Người dùng
            </TabsTrigger>
          )}
          {availableTabs.includes("disputes") && (
            <TabsTrigger
              value="disputes"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Khiếu nại
            </TabsTrigger>
          )}
          {availableTabs.includes("categories") && (
            <TabsTrigger
              value="categories"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Danh mục
            </TabsTrigger>
          )}
          {availableTabs.includes("analytics") && (
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Phân tích
            </TabsTrigger>
          )}
        </TabsList>

        {availableTabs.includes("auctions") && (
          <TabsContent value="auctions" className="mt-6">
            <AllAuctionsManagement />
          </TabsContent>
        )}

        {availableTabs.includes("pending") && (
          <TabsContent value="pending" className="mt-6">
            <PendingAuctions />
          </TabsContent>
        )}

        {availableTabs.includes("users") && (
          <TabsContent value="users" className="mt-6">
            <UserManagement userRole={user?.currentRole} />
          </TabsContent>
        )}

        {availableTabs.includes("disputes") && (
          <TabsContent value="disputes" className="mt-6">
            <DisputeManagement />
          </TabsContent>
        )}

        {availableTabs.includes("categories") && (
          <TabsContent value="categories" className="mt-6">
            <CategoryManagement />
          </TabsContent>
        )}

        {availableTabs.includes("analytics") && (
          <TabsContent value="analytics" className="mt-6">
            <PlatformAnalytics />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
