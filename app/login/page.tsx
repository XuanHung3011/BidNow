"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
// duplicate import removed
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Gavel, AlertCircle, Eye, EyeOff, LogIn } from "lucide-react"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)

  const getRedirectPath = (role?: UserRole) => {
    if (role === "admin") {
      return "/admin"
    }
    return "/"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await login(email, password)

    if (result.ok) {
      toast({ title: "Đăng nhập thành công", description: "Chào mừng bạn trở lại BidNow!" })
      router.push(getRedirectPath(result.role))
    } else {
      const message =
        result.reason === "user_not_found"
          ? "Tài khoản chưa được đăng ký"
          : result.reason === "invalid_password"
          ? "Mật khẩu không đúng"
          : result.reason === "not_verified"
          ? "Email chưa được xác minh"
          : result.reason === "account_deactivated"
          ? "Tài khoản đã bị khóa"
          : result.reason === "network"
          ? "Lỗi kết nối, vui lòng thử lại"
          : "Tài khoản đã bị khóa"
      setError(message)
      toast({ title: "Không thể đăng nhập", description: message, variant: "destructive" })
    }

    setIsLoading(false)
  }

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setIsLoading(true)
    const result = await login(demoEmail, demoPassword)
    if (result.ok) {
      router.push(getRedirectPath(result.role))
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4">
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
            <CardTitle>Đăng nhập</CardTitle>
            <CardDescription>Đăng nhập vào tài khoản BidNow của bạn</CardDescription>
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang đăng nhập..." : (<span className="inline-flex items-center gap-2"><LogIn className="h-4 w-4"/>Đăng nhập</span>)}
              </Button>
            </form>

            {/* <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Tài khoản demo</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleDemoLogin("admin@bidnow.com", "admin123")}
                  disabled={isLoading}
                >
                  <span className="font-semibold">Admin:</span>
                  <span className="ml-2 text-muted-foreground">admin@bidnow.com / admin123</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleDemoLogin("seller@bidnow.com", "seller123")}
                  disabled={isLoading}
                >
                  <span className="font-semibold">Seller:</span>
                  <span className="ml-2 text-muted-foreground">seller@bidnow.com / seller123</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleDemoLogin("buyer@bidnow.com", "buyer123")}
                  disabled={isLoading}
                >
                  <span className="font-semibold">Buyer:</span>
                  <span className="ml-2 text-muted-foreground">buyer@bidnow.com / buyer123</span>
                </Button>
              </div>
            </div> */}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">Quên mật khẩu?</Link>
        </div>
      </div>
    </div>
  )
}
