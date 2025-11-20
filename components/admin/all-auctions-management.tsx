"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Ban, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { AdminAuctionsAPI, AuctionListItemDto, AuctionDetailDto } from "@/lib/api/admin-auctions"
import { useToast } from "@/hooks/use-toast"
import { createAuctionHubConnection } from "@/lib/realtime/auctionHub"

export function AllAuctionsManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [auctions, setAuctions] = useState<AuctionListItemDto[]>([])
  const [selectedAuction, setSelectedAuction] = useState<AuctionDetailDto | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [suspendingId, setSuspendingId] = useState<number | null>(null)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  type SuspendTarget = {
    id: number
    itemTitle: string
    sellerName?: string
    displayStatus: string
  }
  const [pendingSuspendAuction, setPendingSuspendAuction] = useState<SuspendTarget | null>(null)
  const [suspendReason, setSuspendReason] = useState("")
  const [adminSignature, setAdminSignature] = useState("")
  const { toast } = useToast()

  // Fetch auctions
  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await AdminAuctionsAPI.getAll({
        searchTerm: searchQuery || undefined,
        statuses: statusFilter !== "all" ? statusFilter : undefined,
        page,
        pageSize,
      })
      setAuctions(result.data)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load auctions")
      console.error("Error fetching auctions:", err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter, page, pageSize])

  // Fetch auction detail
  const fetchAuctionDetail = useCallback(async (id: number) => {
    try {
      const detail = await AdminAuctionsAPI.getById(id)
      setSelectedAuction(detail)
      setShowDetailDialog(true)
    } catch (err) {
      console.error("Error fetching auction detail:", err)
      setError(err instanceof Error ? err.message : "Failed to load auction detail")
    }
  }, [])

  // Load auctions on mount and when filters change
  useEffect(() => {
    fetchAuctions()
  }, [fetchAuctions])

  useEffect(() => {
    const connection = createAuctionHubConnection()
    let mounted = true
    const startPromise = (async () => {
      try {
        await connection.start()
        if (!mounted) {
          await connection.stop()
          return
        }
        await connection.invoke("JoinAdminSection", "auctions")
      } catch (error) {
        console.error("Admin auctions SignalR connection error:", error)
      }
    })()

    connection.on("AdminAuctionStatusUpdated", () => {
      fetchAuctions()
    })

    return () => {
      mounted = false
      connection.off("AdminAuctionStatusUpdated")
      startPromise
        .catch(() => {})
        .finally(() => {
          if (connection.state === "Connected") {
            connection.invoke("LeaveAdminSection", "auctions").catch(() => {})
          }
          connection.stop().catch(() => {})
        })
    }
  }, [fetchAuctions])

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter])

  // Debounce search
  const [searchDebounce, setSearchDebounce] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchDebounce)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchDebounce])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Đang diễn ra</Badge>
      case "scheduled":
        return <Badge className="bg-blue-500">Sắp diễn ra</Badge>
      case "completed":
        return <Badge className="bg-gray-500">Đã kết thúc</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">Đã tạm dừng</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleViewDetails = (auction: AuctionListItemDto) => {
    fetchAuctionDetail(auction.id)
  }

  const openSuspendDialog = useCallback((auction: SuspendTarget) => {
    setPendingSuspendAuction(auction)
    setSuspendReason("")
    setAdminSignature("")
    setSuspendDialogOpen(true)
  }, [])

  const closeSuspendDialog = useCallback(() => {
    setSuspendDialogOpen(false)
    setPendingSuspendAuction(null)
    setSuspendReason("")
    setAdminSignature("")
  }, [])

  const isSuspendFormValid = suspendReason.trim().length >= 10 && adminSignature.trim() === "Admin"

  const handleConfirmSuspend = useCallback(async () => {
    if (!pendingSuspendAuction || !isSuspendFormValid) {
      return
    }
    const auctionId = pendingSuspendAuction.id
    setSuspendingId(auctionId)
    try {
      await AdminAuctionsAPI.updateStatus(auctionId, "cancelled", {
        reason: suspendReason.trim(),
        adminSignature: adminSignature.trim(),
      })
      toast({
        title: "Đã tạm dừng phiên đấu giá",
        description: `Lý do: ${suspendReason.trim()}`,
      })
      setError(null)
      fetchAuctions()
      closeSuspendDialog()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tạm dừng phiên đấu giá."
      setError(message)
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSuspendingId(null)
    }
  }, [pendingSuspendAuction, isSuspendFormValid, suspendReason, adminSignature, fetchAuctions, toast, closeSuspendDialog])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + "đ"
  }

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
              value={searchDebounce}
              onChange={(e) => setSearchDebounce(e.target.value)}
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
              <SelectItem value="cancelled">Đã tạm dừng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : auctions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Không tìm thấy phiên đấu giá nào
                  </TableCell>
                </TableRow>
              ) : (
                auctions.map((auction) => (
                  <TableRow key={auction.id}>
                    <TableCell className="font-medium">{auction.itemTitle}</TableCell>
                    <TableCell>{auction.sellerName || "N/A"}</TableCell>
                    <TableCell>{auction.categoryName || "N/A"}</TableCell>
                    <TableCell>
                      {auction.currentBid && auction.currentBid > 0
                        ? formatCurrency(auction.currentBid)
                        : formatCurrency(auction.startingBid)}
                    </TableCell>
                    <TableCell>{auction.bidCount}</TableCell>
                    <TableCell>{getStatusBadge(auction.displayStatus)}</TableCell>
                    <TableCell>{formatDate(auction.endTime)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(auction)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {auction.displayStatus === "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              openSuspendDialog({
                                id: auction.id,
                                itemTitle: auction.itemTitle,
                                sellerName: auction.sellerName,
                                displayStatus: auction.displayStatus,
                              })
                            }
                            disabled={suspendingId === auction.id}
                          >
                            <Ban
                              className={`h-4 w-4 ${
                                suspendingId === auction.id ? "animate-pulse text-muted-foreground" : "text-red-500"
                              }`}
                            />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} trong tổng số {totalCount} phiên đấu giá
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <div className="text-sm">
                Trang {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết phiên đấu giá</DialogTitle>
              <DialogDescription>Thông tin chi tiết về sản phẩm và phiên đấu giá</DialogDescription>
            </DialogHeader>
            {selectedAuction ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tên sản phẩm</p>
                    <p className="text-base font-semibold">{selectedAuction.itemTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Người bán</p>
                    <p className="text-base font-semibold">{selectedAuction.sellerName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Danh mục</p>
                    <p className="text-base font-semibold">{selectedAuction.categoryName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trạng thái</p>
                    <div className="mt-1">{getStatusBadge(selectedAuction.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Giá khởi điểm</p>
                    <p className="text-base font-semibold">{formatCurrency(selectedAuction.startingBid)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Giá hiện tại</p>
                    <p className="text-base font-semibold text-primary">
                      {selectedAuction.currentBid && selectedAuction.currentBid > 0
                        ? formatCurrency(selectedAuction.currentBid)
                        : "Chưa có giá thầu"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Số lượt đấu giá</p>
                    <p className="text-base font-semibold">{selectedAuction.bidCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Thời gian kết thúc</p>
                    <p className="text-base font-semibold">{formatDate(selectedAuction.endTime)}</p>
                  </div>
                  {selectedAuction.itemDescription && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Mô tả</p>
                      <p className="text-base">{selectedAuction.itemDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">Đang tải chi tiết...</div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Đóng
              </Button>
              {selectedAuction &&
                selectedAuction.status?.toLowerCase() === "active" &&
                new Date(selectedAuction.endTime) > new Date() && (
                  <Button
                    variant="destructive"
                    onClick={() =>
                      openSuspendDialog({
                        id: selectedAuction.id,
                        itemTitle: selectedAuction.itemTitle,
                        sellerName: selectedAuction.sellerName,
                        displayStatus: selectedAuction.status?.toLowerCase() ?? "active",
                      })
                    }
                    disabled={suspendingId === selectedAuction.id}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {suspendingId === selectedAuction.id ? "Đang tạm dừng..." : "Tạm dừng phiên đấu giá"}
                  </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={suspendDialogOpen} onOpenChange={(open) => (open ? setSuspendDialogOpen(true) : closeSuspendDialog())}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Xác nhận tạm dừng phiên đấu giá</DialogTitle>
              <DialogDescription>
                Vui lòng ghi rõ nguyên nhân tạm dừng và ký xác nhận bằng cách nhập &quot;Admin&quot; trước khi tiếp tục.
              </DialogDescription>
            </DialogHeader>
            {pendingSuspendAuction ? (
              <div className="space-y-4">
                <div className="rounded-md bg-muted p-4 text-sm">
                  <p className="font-semibold text-foreground">{pendingSuspendAuction.itemTitle}</p>
                  <p className="text-muted-foreground">Người bán: {pendingSuspendAuction.sellerName || "Không rõ"}</p>
                  <p className="text-muted-foreground">Trạng thái: {getStatusBadge(pendingSuspendAuction.displayStatus)}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="suspend-reason">
                    Nguyên nhân tạm dừng
                  </label>
                  <Textarea
                    id="suspend-reason"
                    placeholder="Nhập tối thiểu 10 ký tự để mô tả lý do tạm dừng..."
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="admin-signature">
                    Ký xác nhận (nhập &quot;Admin&quot;)
                  </label>
                  <Input
                    id="admin-signature"
                    placeholder='Nhập "Admin" để xác nhận'
                    value={adminSignature}
                    onChange={(e) => setAdminSignature(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground text-sm">Chưa chọn phiên đấu giá.</div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeSuspendDialog}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmSuspend}
                disabled={!pendingSuspendAuction || !isSuspendFormValid || suspendingId === pendingSuspendAuction?.id}
              >
                {suspendingId === pendingSuspendAuction?.id ? "Đang tạm dừng..." : "Xác nhận tạm dừng"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
