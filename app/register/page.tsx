"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Gavel, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const [verifyToken, setVerifyToken] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }

    setIsLoading(true)

    const result = await register(email, password, name)
    if (result.ok) {
      setVerifyToken(result.verifyToken ?? null)
    } else if (result.reason === "duplicate") {
      setError("Email đã được sử dụng")
    } else {
      setError("Đăng ký thất bại, vui lòng thử lại")
    }

    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Gavel className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">BidNow</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Đăng ký</CardTitle>
            <CardDescription>Tạo tài khoản BidNow mới</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600">ℹ️</div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Tài khoản linh hoạt</p>
                    <p>Bạn sẽ đăng ký với vai trò <strong>Người mua</strong> mặc định. Sau khi đăng nhập, bạn có thể chuyển đổi sang vai trò <strong>Người bán</strong> bất cứ lúc nào trong phần cài đặt.</p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            {verifyToken ? (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Đăng ký thành công. Vui lòng xác minh email.</p>
                <p className="text-xs break-all">Link nhanh: /verify?token={verifyToken}</p>
                <Link href={`/verify?token=${verifyToken}`} className="font-medium text-primary hover:underline">
                  Xác minh ngay
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Đăng nhập
                </Link>
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
