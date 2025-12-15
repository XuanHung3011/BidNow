"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PasswordAPI } from "@/lib/api"

export function ResetPasswordPageClient() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get("token") || ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState<string>("")

  const handleReset = async () => {
    setMessage("")
    if (!token) { setMessage("Token không hợp lệ"); return }
    if (password.length < 6) { setMessage("Mật khẩu tối thiểu 6 ký tự"); return }
    if (password !== confirm) { setMessage("Mật khẩu xác nhận không khớp"); return }
    const ok = await PasswordAPI.resetPassword({ token, newPassword: password })
    if (ok) { setMessage("Đặt lại mật khẩu thành công"); router.push("/login") }
    else setMessage("Đặt lại mật khẩu thất bại")
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Đặt lại mật khẩu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="text-sm text-muted-foreground">{message}</div>}
          <Input type="password" placeholder="Mật khẩu mới" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input type="password" placeholder="Xác nhận mật khẩu" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button onClick={handleReset}>Xác nhận</Button>
        </CardContent>
      </Card>
    </div>
  )
}


