import { Suspense } from "react"
import { VerifyPageClient } from "@/components/verify-page"

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageClient />
    </Suspense>
  )
}