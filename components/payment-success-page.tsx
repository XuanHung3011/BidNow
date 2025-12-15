"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { PaymentsAPI } from "@/lib/api/payments"

export function PaymentSuccessPageClient() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    // Tự động sync payment status khi redirect về từ PayOS
    const syncPaymentStatus = async () => {
      if (!orderId) return

      try {
        setSyncing(true)
        console.log("Auto-syncing payment status for order", orderId)

        // Sync payment status từ PayOS API
        const order = await PaymentsAPI.syncPaymentStatus(parseInt(orderId))

        if (order.payment?.paymentStatus === "paid_held") {
          console.log("Payment status synced successfully:", order.payment.paymentStatus)
          setSynced(true)
        } else {
          console.log("Payment status not yet paid:", order.payment?.paymentStatus)
          // Retry after 2 seconds if not paid yet (webhook might be delayed)
          setTimeout(() => {
            syncPaymentStatus()
          }, 2000)
        }
      } catch (err) {
        console.error("Error syncing payment status:", err)
        // Retry after 3 seconds on error
        setTimeout(() => {
          syncPaymentStatus()
        }, 3000)
      } finally {
        setSyncing(false)
      }
    }

    // Sync ngay khi page load
    syncPaymentStatus()

    // Polling: check lại sau mỗi 3 giây (tối đa 5 lần = 15 giây)
    let retryCount = 0
    const maxRetries = 5
    const pollInterval = setInterval(() => {
      if (synced || retryCount >= maxRetries) {
        clearInterval(pollInterval)
        return
      }
      retryCount++
      syncPaymentStatus()
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [orderId, synced])

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Thanh toán thành công!</CardTitle>
          <CardDescription>
            {syncing && !synced ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xác nhận thanh toán...
              </span>
            ) : (
              "Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xử lý."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderId && (
            <div className="text-center text-sm text-muted-foreground">
              Mã đơn hàng: #{orderId}
            </div>
          )}
          <div className="flex gap-4">
            <Button asChild className="flex-1">
              <Link href="/buyer">Về dashboard</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">Về trang chủ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


