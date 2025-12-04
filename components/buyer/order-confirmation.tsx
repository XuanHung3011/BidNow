"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle2, AlertTriangle, Package, Loader2 } from "lucide-react"
import { PaymentsAPI, type OrderDto } from "@/lib/api/payments"

interface OrderConfirmationProps {
  order: OrderDto
  onUpdate: () => void
}

export function OrderConfirmation({ order, onUpdate }: OrderConfirmationProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showIssueDialog, setShowIssueDialog] = useState(false)
  const [issueDescription, setIssueDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirmReceived = async () => {
    try {
      setLoading(true)
      setError(null)
      await PaymentsAPI.confirmOrderReceived(order.id)
      setShowConfirmDialog(false)
      onUpdate()
    } catch (err: any) {
      console.error("Error confirming order receipt:", err)
      setError(err.message || "Không thể xác nhận nhận hàng")
    } finally {
      setLoading(false)
    }
  }

  const handleReportIssue = async () => {
    if (!issueDescription.trim()) {
      setError("Vui lòng mô tả sự cố")
      return
    }

    try {
      setLoading(true)
      setError(null)
      await PaymentsAPI.reportOrderIssue(order.id, issueDescription.trim())
      setShowIssueDialog(false)
      setIssueDescription("")
      onUpdate()
    } catch (err: any) {
      console.error("Error reporting issue:", err)
      setError(err.message || "Không thể báo cáo sự cố")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Only show for shipped orders
  if (order.orderStatus !== 'shipped') {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Đơn hàng đã được gửi
          </CardTitle>
          <CardDescription>
            Đơn hàng #{order.id} đã được gửi. Vui lòng xác nhận khi nhận được hàng.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.trackingNumber && (
            <div className="space-y-1">
              <Label>Mã vận đơn</Label>
              <p className="font-semibold">{order.trackingNumber}</p>
            </div>
          )}
          
          {order.shippingCompany && (
            <div className="space-y-1">
              <Label>Đơn vị vận chuyển</Label>
              <p className="font-semibold">{order.shippingCompany}</p>
            </div>
          )}

          {order.shippedAt && (
            <div className="space-y-1">
              <Label>Ngày gửi</Label>
              <p className="font-semibold">{formatDate(order.shippedAt)}</p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Đã nhận được hàng
            </Button>
            <Button
              onClick={() => setShowIssueDialog(true)}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Báo cáo sự cố
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Received Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đã nhận hàng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn đã nhận được đơn hàng #{order.id}? Sau khi xác nhận, tiền sẽ được giải phóng cho người bán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmReceived}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Xác nhận
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Báo cáo sự cố</DialogTitle>
            <DialogDescription>
              Mô tả chi tiết sự cố với đơn hàng #{order.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issueDescription">Mô tả sự cố</Label>
              <Textarea
                id="issueDescription"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="VD: Hàng bị hỏng, không đúng mô tả, thiếu hàng..."
                rows={4}
                disabled={loading}
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowIssueDialog(false)
                setIssueDescription("")
                setError(null)
              }}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleReportIssue}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Gửi báo cáo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

