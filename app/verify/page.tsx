"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { API_BASE } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function VerifyPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle")

  useEffect(() => {
    const token = params.get("token")
    if (!token) return
    const run = async () => {
      setStatus("verifying")
      const res = await fetch(`${API_BASE}/api/Auth/verify?token=${encodeURIComponent(token)}`, { method: "POST" })
      setStatus(res.ok ? "success" : "error")
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
              <p>Email của bạn đã được xác minh thành công. Bạn có thể đăng nhập.</p>
              <Button onClick={() => router.push("/login")}>Đăng nhập</Button>
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


