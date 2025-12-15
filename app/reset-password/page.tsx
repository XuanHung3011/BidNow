import { Suspense } from "react"
import { ResetPasswordPageClient } from "@/components/reset-password-page"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageClient />
    </Suspense>
  )
}

