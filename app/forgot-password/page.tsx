"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PasswordAPI } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)
    const res = await PasswordAPI.forgotPassword({ email })
    setLoading(false)
    if (res.ok) setMessage("Đã gửi link đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư.")
    else if (res.reason === 'not_found') setMessage("Email chưa được đăng ký.")
    else setMessage("Gửi yêu cầu thất bại. Thử lại sau.")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Quên mật khẩu</CardTitle>
            <CardDescription>Nhập email để nhận link đặt lại mật khẩu</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Đang gửi..." : "Gửi yêu cầu"}</Button>
            </form>
            {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">Quay lại đăng nhập</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


