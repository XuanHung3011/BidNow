import { Suspense } from "react"
import { PaymentCancelPageClient } from "@/components/payment-cancel-page"

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={null}>
      <PaymentCancelPageClient />
    </Suspense>
  )
}

