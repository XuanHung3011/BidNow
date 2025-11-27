"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { SellerStats } from "./seller-stats"
import { SellerAuctionsList } from "./seller-auctions-list"
import { CreateAuctionDialog } from "./create-auction-dialog"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export function SellerDashboard() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedDraftItem, setSelectedDraftItem] = useState<any>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Check if openAuctionDialog query param is present
  useEffect(() => {
    const openAuctionDialog = searchParams.get("openAuctionDialog")
    if (openAuctionDialog === "true") {
      setShowCreateDialog(true)
      // Remove query param from URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete("openAuctionDialog")
      const newQuery = params.toString()
      router.replace(`/seller${newQuery ? `?${newQuery}` : ""}`, { scroll: false })
    }
  }, [searchParams, router])

  const handleSelectDraftItem = (item: any) => {
    setSelectedDraftItem(item)
    setShowCreateDialog(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bảng điều khiển người bán</h1>
          <p className="text-muted-foreground">Quản lý sản phẩm và phiên đấu giá của bạn</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Tạo phiên đấu giá mới
        </Button>
      </div>

      <SellerStats />

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="active">Đang diễn ra</TabsTrigger>
          <TabsTrigger value="scheduled">Sắp diễn ra</TabsTrigger>
          <TabsTrigger value="completed">Đã kết thúc</TabsTrigger>
          <TabsTrigger value="draft">Bản nháp</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <SellerAuctionsList status="active" />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <SellerAuctionsList status="scheduled" />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <SellerAuctionsList status="completed" />
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <SellerAuctionsList status="draft" onSelectDraftItem={handleSelectDraftItem} />
        </TabsContent>
      </Tabs>

      <CreateAuctionDialog 
        open={showCreateDialog} 
        onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) {
            setSelectedDraftItem(null)
          }
        }}
        draftItem={selectedDraftItem}
      />
    </div>
  )
}
