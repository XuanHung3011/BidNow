"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Ban } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const mockAuctions = [
  {
    id: 1,
    title: "iPhone 15 Pro Max 256GB",
    seller: "Nguyễn Văn A",
    category: "Điện tử",
    currentBid: 25000000,
    startPrice: 20000000,
    endTime: "2024-01-20 15:00",
    status: "active",
    bids: 45,
  },
  {
    id: 2,
    title: "Đồng hồ Rolex Submariner",
    seller: "Trần Thị B",
    category: "Sưu tầm",
    currentBid: 180000000,
    startPrice: 150000000,
    endTime: "2024-01-21 18:00",
    status: "active",
    bids: 32,
  },
  {
    id: 3,
    title: "Tranh sơn dầu trừu tượng",
    seller: "Lê Văn C",
    category: "Nghệ thuật",
    currentBid: 15000000,
    startPrice: 10000000,
    endTime: "2024-01-19 20:00",
    status: "active",
    bids: 18,
  },
  {
    id: 4,
    title: "MacBook Pro M3 Max",
    seller: "Phạm Thị D",
    category: "Điện tử",
    currentBid: 0,
    startPrice: 45000000,
    endTime: "2024-01-25 10:00",
    status: "scheduled",
    bids: 0,
  },
  {
    id: 5,
    title: "Túi xách Louis Vuitton",
    seller: "Hoàng Văn E",
    category: "Thời trang",
    currentBid: 35000000,
    startPrice: 30000000,
    endTime: "2024-01-18 14:00",
    status: "completed",
    bids: 67,
  },
]

export function AllAuctionsManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedAuction, setSelectedAuction] = useState<any>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Đang diễn ra</Badge>
      case "scheduled":
        return <Badge className="bg-blue-500">Sắp diễn ra</Badge>
      case "completed":
        return <Badge className="bg-gray-500">Đã kết thúc</Badge>
      case "suspended":
        return <Badge className="bg-red-500">Đã tạm dừng</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleViewDetails = (auction: any) => {
    setSelectedAuction(auction)
    setShowDetailDialog(true)
  }

  const handleSuspendAuction = (auctionId: number) => {
    console.log("[v0] Suspending auction:", auctionId)
    // Logic to suspend auction
  }

  const filteredAuctions = mockAuctions.filter((auction) => {
    const matchesSearch =
      auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auction.seller.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || auction.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý tất cả sản phẩm đấu giá</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sản phẩm hoặc người bán..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang diễn ra</SelectItem>
              <SelectItem value="scheduled">Sắp diễn ra</SelectItem>
              <SelectItem value="completed">Đã kết thúc</SelectItem>
              <SelectItem value="suspended">Đã tạm dừng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Người bán</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá hiện tại</TableHead>
                <TableHead>Lượt đấu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian kết thúc</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuctions.map((auction) => (
                <TableRow key={auction.id}>
                  <TableCell className="font-medium">{auction.title}</TableCell>
                  <TableCell>{auction.seller}</TableCell>
                  <TableCell>{auction.category}</TableCell>
                  <TableCell>
                    {auction.currentBid > 0
                      ? `${auction.currentBid.toLocaleString("vi-VN")}đ`
                      : `${auction.startPrice.toLocaleString("vi-VN")}đ`}
                  </TableCell>
                  <TableCell>{auction.bids}</TableCell>
                  <TableCell>{getStatusBadge(auction.status)}</TableCell>
                  <TableCell>{auction.endTime}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(auction)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {auction.status === "active" && (
                        <Button variant="ghost" size="icon" onClick={() => handleSuspendAuction(auction.id)}>
                          <Ban className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết phiên đấu giá</DialogTitle>
              <DialogDescription>Thông tin chi tiết về sản phẩm và phiên đấu giá</DialogDescription>
            </DialogHeader>
            {selectedAuction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tên sản phẩm</p>
                    <p className="text-base font-semibold">{selectedAuction.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Người bán</p>
                    <p className="text-base font-semibold">{selectedAuction.seller}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Danh mục</p>
                    <p className="text-base font-semibold">{selectedAuction.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trạng thái</p>
                    <div className="mt-1">{getStatusBadge(selectedAuction.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Giá khởi điểm</p>
                    <p className="text-base font-semibold">{selectedAuction.startPrice.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Giá hiện tại</p>
                    <p className="text-base font-semibold text-primary">
                      {selectedAuction.currentBid > 0
                        ? `${selectedAuction.currentBid.toLocaleString("vi-VN")}đ`
                        : "Chưa có giá thầu"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Số lượt đấu giá</p>
                    <p className="text-base font-semibold">{selectedAuction.bids}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Thời gian kết thúc</p>
                    <p className="text-base font-semibold">{selectedAuction.endTime}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Đóng
              </Button>
              {selectedAuction?.status === "active" && (
                <Button variant="destructive" onClick={() => handleSuspendAuction(selectedAuction.id)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Tạm dừng phiên đấu giá
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
