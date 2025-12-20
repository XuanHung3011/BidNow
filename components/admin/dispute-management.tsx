"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, MessageSquare, Loader2, CheckCircle2, XCircle, Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { disputesAPI, type DisputeDto } from "@/lib/api/disputes"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function DisputeManagement() {
  const [disputes, setDisputes] = useState<DisputeDto[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<DisputeDto | null>(null)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [resolveWinner, setResolveWinner] = useState<"buyer" | "seller">("buyer")
  const [resolveNotes, setResolveNotes] = useState("")
  const [resolving, setResolving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortDate, setSortDate] = useState<"newest" | "oldest">("newest")
  const [sortName, setSortName] = useState<"a-z" | "z-a">("a-z")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadDisputes()
  }, [])

  const loadDisputes = async () => {
    try {
      setLoading(true)
      const data = await disputesAPI.getAll()
      setDisputes(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách khiếu nại",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartReview = async (dispute: DisputeDto) => {
    try {
      await disputesAPI.startReview(dispute.id)
      toast({
        title: "Thành công",
        description: "Đã bắt đầu xử lý khiếu nại",
      })
      await loadDisputes()
      // Navigate to messages page with disputeId
      router.push(`/messages?disputeId=${dispute.id}`)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể bắt đầu xử lý",
        variant: "destructive",
      })
    }
  }

  const handleOpenChat = (dispute: DisputeDto) => {
    router.push(`/messages?disputeId=${dispute.id}`)
  }

  const handleResolve = async () => {
    if (!selectedDispute) return

    try {
      setResolving(true)
      await disputesAPI.resolve(selectedDispute.id, {
        winner: resolveWinner,
        adminNotes: resolveNotes || undefined,
      })
      toast({
        title: "Thành công",
        description: `Đã giải quyết khiếu nại. ${resolveWinner === "buyer" ? "Người mua" : "Người bán"} thắng.`,
      })
      setShowResolveDialog(false)
      setResolveWinner("buyer")
      setResolveNotes("")
      await loadDisputes()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể giải quyết khiếu nại",
        variant: "destructive",
      })
    } finally {
      setResolving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
      pending: { label: "Chờ xử lý", variant: "destructive" },
      in_review: { label: "Đang xử lý", variant: "default" },
      buyer_won: { label: "Người mua thắng", variant: "secondary" },
      seller_won: { label: "Người bán thắng", variant: "secondary" },
      resolved: { label: "Đã giải quyết", variant: "outline" },
      closed: { label: "Đã đóng", variant: "outline" },
    }

    const config = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  // Filter and sort disputes
  const filteredDisputes = useMemo(() => {
    let filtered = [...disputes]

    // Filter by search term (buyer name or seller name)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (d) =>
          d.buyerName?.toLowerCase().includes(searchLower) ||
          d.sellerName?.toLowerCase().includes(searchLower)
      )
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortDate === "newest" ? dateB - dateA : dateA - dateB
    })

    // Sort by name (buyer name or seller name)
    if (sortName === "a-z") {
      filtered.sort((a, b) => {
        const nameA = (a.buyerName || "").toLowerCase()
        const nameB = (b.buyerName || "").toLowerCase()
        if (nameA !== nameB) return nameA.localeCompare(nameB, "vi")
        // If buyer names are equal, sort by seller name
        const sellerA = (a.sellerName || "").toLowerCase()
        const sellerB = (b.sellerName || "").toLowerCase()
        return sellerA.localeCompare(sellerB, "vi")
      })
    } else {
      filtered.sort((a, b) => {
        const nameA = (a.buyerName || "").toLowerCase()
        const nameB = (b.buyerName || "").toLowerCase()
        if (nameA !== nameB) return nameB.localeCompare(nameA, "vi")
        // If buyer names are equal, sort by seller name
        const sellerA = (a.sellerName || "").toLowerCase()
        const sellerB = (b.sellerName || "").toLowerCase()
        return sellerB.localeCompare(sellerA, "vi")
      })
    }

    return filtered
  }, [disputes, searchTerm, sortDate, sortName])

  const pendingDisputes = filteredDisputes.filter((d) => d.status === "pending")
  const inReviewDisputes = filteredDisputes.filter((d) => d.status === "in_review")
  const resolvedDisputes = filteredDisputes.filter((d) => ["buyer_won", "seller_won", "resolved", "closed"].includes(d.status))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quản lý khiếu nại</h2>
        <p className="text-muted-foreground">Xem và xử lý các khiếu nại từ người dùng</p>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên người mua/bán..."
            className="pl-9 pr-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchTerm("")}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={sortDate} onValueChange={(value) => setSortDate(value as "newest" | "oldest")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sắp xếp theo ngày" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Ngày gần nhất</SelectItem>
              <SelectItem value="oldest">Ngày xa nhất</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortName} onValueChange={(value) => setSortName(value as "a-z" | "z-a")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sắp xếp theo tên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a-z">Tên A-Z</SelectItem>
              <SelectItem value="z-a">Tên Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          Hiển thị <span className="font-semibold">{filteredDisputes.length}</span> kết quả
          {disputes.length !== filteredDisputes.length && ` (tổng ${disputes.length})`}
        </p>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Chờ xử lý
            {pendingDisputes.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingDisputes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_review">
            Đang xử lý
            {inReviewDisputes.length > 0 && (
              <Badge variant="default" className="ml-2">
                {inReviewDisputes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Đã giải quyết
            {resolvedDisputes.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {resolvedDisputes.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingDisputes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Không có khiếu nại nào chờ xử lý
              </CardContent>
            </Card>
          ) : (
            pendingDisputes.map((dispute) => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                onStartReview={() => handleStartReview(dispute)}
                onOpenChat={() => handleOpenChat(dispute)}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="in_review" className="space-y-4">
          {inReviewDisputes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Không có khiếu nại nào đang xử lý
              </CardContent>
            </Card>
          ) : (
            inReviewDisputes.map((dispute) => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                onStartReview={() => handleStartReview(dispute)}
                onOpenChat={() => handleOpenChat(dispute)}
                onResolve={() => {
                  setSelectedDispute(dispute)
                  setShowResolveDialog(true)
                }}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
                showResolveButton
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedDisputes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Không có khiếu nại nào đã giải quyết
              </CardContent>
            </Card>
          ) : (
            resolvedDisputes.map((dispute) => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                onStartReview={() => handleStartReview(dispute)}
                onOpenChat={() => handleOpenChat(dispute)}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Giải quyết khiếu nại</DialogTitle>
            <DialogDescription>
              Chọn người thắng khiếu nại và thêm ghi chú (nếu có)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Người thắng</Label>
              <RadioGroup value={resolveWinner} onValueChange={(v) => setResolveWinner(v as "buyer" | "seller")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="buyer" id="buyer" />
                  <Label htmlFor="buyer" className="font-normal cursor-pointer">
                    Người mua thắng (hoàn tiền cho người mua)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="seller" id="seller" />
                  <Label htmlFor="seller" className="font-normal cursor-pointer">
                    Người bán thắng (giải phóng tiền cho người bán)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="notes"
                placeholder="Nhập ghi chú về quyết định..."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleResolve} disabled={resolving}>
              {resolving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface DisputeCardProps {
  dispute: DisputeDto
  onStartReview: () => void
  onOpenChat: () => void
  onResolve?: () => void
  formatDate: (date: string) => string
  formatCurrency: (amount?: number) => string
  getStatusBadge: (status: string) => JSX.Element
  showResolveButton?: boolean
}

function DisputeCard({
  dispute,
  onStartReview,
  onOpenChat,
  onResolve,
  formatDate,
  formatCurrency,
  getStatusBadge,
  showResolveButton,
}: DisputeCardProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-1 h-5 w-5 text-destructive" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground">{dispute.reason}</h3>
                {getStatusBadge(dispute.status)}
              </div>
              {dispute.description && (
                <p className="mt-1 text-sm text-muted-foreground">{dispute.description}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                Phiên đấu giá: {dispute.auctionTitle || `#${dispute.orderId}`}
              </p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>
                  Người mua: <span className="font-medium text-foreground">{dispute.buyerName}</span>
                </p>
                <p>
                  Người bán: <span className="font-medium text-foreground">{dispute.sellerName}</span>
                </p>
                <p>
                  Giá trị: <span className="font-medium text-foreground">{formatCurrency(dispute.orderAmount)}</span>
                </p>
                <p>Tạo lúc: {formatDate(dispute.createdAt)}</p>
                {dispute.resolverName && (
                  <p>
                    Xử lý bởi: <span className="font-medium text-foreground">{dispute.resolverName}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onOpenChat}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Mở chat
          </Button>
          {dispute.status === "pending" && (
            <Button size="sm" className="w-full bg-primary hover:bg-primary/90 sm:w-auto" onClick={onStartReview}>
              Bắt đầu xử lý
            </Button>
          )}
          {showResolveButton && onResolve && (
            <Button size="sm" variant="default" className="w-full sm:w-auto" onClick={onResolve}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Giải quyết
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
