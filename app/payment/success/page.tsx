"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Thanh toán thành công!</CardTitle>
          <CardDescription>
            Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xử lý.
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


