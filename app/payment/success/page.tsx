import { Suspense } from "react"
import { PaymentSuccessPageClient } from "@/components/payment-success-page"

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessPageClient />
    </Suspense>
  )
}

