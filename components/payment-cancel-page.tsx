"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import Link from "next/link"

export function PaymentCancelPageClient() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Thanh toán đã bị hủy</CardTitle>
          <CardDescription>
            Bạn đã hủy quá trình thanh toán. Đơn hàng vẫn chờ thanh toán.
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
              <Link href="/">Về trang chủ</Link>
            </Button>
            {orderId && (
              <Button variant="outline" asChild className="flex-1">
                <Link href="/auctions">Thử lại</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


