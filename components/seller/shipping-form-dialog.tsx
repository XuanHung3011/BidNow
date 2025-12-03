"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Truck } from "lucide-react"
import { PaymentsAPI, type OrderDto } from "@/lib/api/payments"

interface ShippingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderDto
  onSuccess: () => void
}

export function ShippingFormDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: ShippingFormDialogProps) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [shippingCompany, setShippingCompany] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trackingNumber.trim()) {
      setError("Mã vận đơn là bắt buộc")
      return
    }

    try {
      setLoading(true)
      setError(null)

      await PaymentsAPI.updateShippingInfo(order.id, {
        trackingNumber: trackingNumber.trim(),
        shippingCompany: shippingCompany.trim() || undefined,
        shippingAddress: shippingAddress.trim() || undefined,
      })

      onSuccess()
    } catch (err: any) {
      console.error("Error updating shipping info:", err)
      setError(err.message || "Không thể cập nhật thông tin vận chuyển")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Cập nhật thông tin vận chuyển
          </DialogTitle>
          <DialogDescription>
            Đơn hàng #{order.id} - {order.finalPrice.toLocaleString("vi-VN")} VNĐ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">
              Mã vận đơn <span className="text-destructive">*</span>
            </Label>
            <Input
              id="trackingNumber"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Nhập mã vận đơn"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingCompany">Đơn vị vận chuyển</Label>
            <Input
              id="shippingCompany"
              value={shippingCompany}
              onChange={(e) => setShippingCompany(e.target.value)}
              placeholder="VD: Viettel Post, Giao Hàng Nhanh, Tự ship..."
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingAddress">Địa chỉ gửi hàng</Label>
            <Textarea
              id="shippingAddress"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Địa chỉ nơi gửi hàng (nếu cần)"
              rows={3}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Truck className="mr-2 h-4 w-4" />
                  Xác nhận gửi hàng
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

