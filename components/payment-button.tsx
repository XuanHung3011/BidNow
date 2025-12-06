"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react"
import { PaymentsAPI, type OrderDto } from "@/lib/api/payments"

interface PaymentButtonProps {
  auctionId: number
  winnerId?: number
  finalPrice?: number
  onPaymentSuccess?: () => void
}

export function PaymentButton({ auctionId, winnerId, finalPrice, onPaymentSuccess }: PaymentButtonProps) {
  const [order, setOrder] = useState<OrderDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingLink, setCreatingLink] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsPayment = order?.orderStatus === "awaiting_payment"
  const isPaid = order?.payment?.paymentStatus === "paid_held"

  useEffect(() => {
    loadOrder()
  }, [auctionId])

  const loadOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const orderData = await PaymentsAPI.getOrderByAuctionId(auctionId)
      setOrder(orderData)
      
      // Nếu order có payment status là pending, tự động sync từ PayOS API
      // Điều này giúp fix trường hợp webhook chưa được gọi nhưng đã thanh toán
      if (orderData && orderData.id && orderData.orderStatus === 'awaiting_payment' &&
          orderData.payment && orderData.payment.paymentStatus === 'pending' && 
          orderData.payment.transactionId) {
        try {
          console.log('Auto-syncing payment status from PayOS for order', orderData.id)
          // Sync payment status từ PayOS API
          const syncedOrder = await PaymentsAPI.syncPaymentStatus(orderData.id)
          // Cập nhật order state nếu payment status thay đổi
          if (syncedOrder.payment?.paymentStatus !== orderData.payment?.paymentStatus ||
              syncedOrder.orderStatus !== orderData.orderStatus) {
            console.log('Payment status synced:', {
              old: orderData.payment?.paymentStatus,
              new: syncedOrder.payment?.paymentStatus,
              oldOrderStatus: orderData.orderStatus,
              newOrderStatus: syncedOrder.orderStatus
            })
            setOrder(syncedOrder)
            // Nếu đã thanh toán thành công, gọi callback
            if (syncedOrder.payment?.paymentStatus === 'paid_held' && onPaymentSuccess) {
              onPaymentSuccess()
            }
          }
        } catch (syncErr) {
          // Log nhưng không block UI
          console.warn('Background sync payment status failed (non-critical):', syncErr)
        }
      }
    } catch (err) {
      console.error("Error loading order:", err)
      setError("Không thể tải thông tin đơn hàng")
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePaymentLink = async () => {
    if (!order) return

    try {
      setCreatingLink(true)
      setError(null)

      const paymentLink = await PaymentsAPI.createPaymentLink({
        orderId: order.id,
      })

      if (paymentLink.paymentLink) {
        window.location.href = paymentLink.paymentLink
      } else {
        throw new Error("Payment link is empty")
      }
    } catch (err: any) {
      console.error("Error creating payment link:", err)
      setError(err.message || "Không thể tạo link thanh toán")
    } finally {
      setCreatingLink(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Đang tải thông tin đơn hàng...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!order) {
    // If order is null but we're still loading, show loading state
    if (loading) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Đang tải thông tin đơn hàng...</span>
            </div>
          </CardContent>
        </Card>
      )
    }
    
    // If order is null after loading, show message but still allow retry
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Thanh toán đơn hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Chưa có đơn hàng cho phiên đấu giá này
            </p>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button onClick={loadOrder} variant="outline" size="sm">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Thanh toán đơn hàng
        </CardTitle>
        <CardDescription>
          Đơn hàng #{order.id} - Giá cuối: {order.finalPrice.toLocaleString("vi-VN")} VNĐ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Trạng thái đơn hàng:</span>
            <span className="font-medium">{order.orderStatus}</span>
          </div>
          {order.payment && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Trạng thái thanh toán:</span>
              <span className="font-medium">{order.payment.paymentStatus}</span>
            </div>
          )}
        </div>

        {needsPayment && !isPaid && (
          <div className="space-y-2">
            <Button
              onClick={handleCreatePaymentLink}
              disabled={creatingLink}
              className="w-full"
              size="lg"
            >
              {creatingLink ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo link thanh toán...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Thanh toán ngay qua PayOS
                </>
              )}
            </Button>
            {order.payment && order.payment.paymentStatus === 'pending' && (
              <Button
                onClick={async () => {
                  if (!order) return
                  try {
                    setLoading(true)
                    const updatedOrder = await PaymentsAPI.markOrderAsPaid(order.id)
                    setOrder(updatedOrder)
                    if (onPaymentSuccess) {
                      onPaymentSuccess()
                    }
                  } catch (err: any) {
                    console.error("Error marking order as paid:", err)
                    setError(err.message || "Không thể đánh dấu đã thanh toán")
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                variant="outline"
                className="w-full"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Đã thanh toán trên PayOS (đồng bộ)
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {isPaid && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Đã thanh toán thành công</span>
            </div>
            {order.payment?.paidAt && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-500">
                Thời gian thanh toán: {new Date(order.payment.paidAt).toLocaleString("vi-VN")}
              </p>
            )}
          </div>
        )}

        {order.orderStatus === "awaiting_shipment" && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Đã thanh toán - Đang chờ vận chuyển</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

