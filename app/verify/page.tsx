"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AuthAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function VerifyPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle")
  const { login } = useAuth()

  useEffect(() => {
    const token = params.get("token")
    if (!token) return
    const run = async () => {
      setStatus("verifying")
      const success = await AuthAPI.verifyEmail(token)
      if (!success) {
        setStatus("error")
        return
      }
      // Try auto login using stored pending registration info if available
      const pending = localStorage.getItem("bidnow_pending_register")
      if (pending) {
        try {
          const { email, password } = JSON.parse(pending)
          const result = await login(email, password)
          if (result.ok) {
            localStorage.removeItem("bidnow_pending_register")
            setStatus("success")
            router.push("/")
            return
          }
        } catch {
          // ignore and fallback to success without auto login
        }
      }
      setStatus("success")
      router.push("/")
    }
    run()
  }, [params])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Xác minh email</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "idle" && <p>Đang chờ token xác minh...</p>}
          {status === "verifying" && <p>Đang xác minh, vui lòng đợi...</p>}
          {status === "success" && (
            <div className="space-y-4">
              <p>Email của bạn đã được xác minh thành công. Đang chuyển về trang chủ...</p>
              <Button onClick={() => router.push("/")}>Về trang chủ</Button>
            </div>
          )}
          {status === "error" && (
            <div className="space-y-4">
              <p>Token không hợp lệ hoặc đã hết hạn.</p>
              <Button onClick={() => router.push("/")}>Về trang chủ</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



