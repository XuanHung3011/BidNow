"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Gavel, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { AuthAPI } from "@/lib/api"
import Link from "next/link"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const [showVerifyInfo, setShowVerifyInfo] = useState(false)
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [timeLeft, setTimeLeft] = useState(0) // minutes
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
      setShowVerifyInfo(true)
      setTimeLeft(24 * 60) // 24 hours in minutes
      if ((result as any).data?.id) {
        setRegisteredUserId((result as any).data.id)
      }
    } else if (result.reason === "duplicate") {
      setError("Email đã được sử dụng")
    } else {
      setError("Đăng ký thất bại, vui lòng thử lại")
    }

    setIsLoading(false)
  }

  // Countdown timer (hidden from UI)
  useEffect(() => {
    if (timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) return 0
        return prev - 1
      })
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [timeLeft])

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendMessage("")
    
    try {
      if (!registeredUserId) {
        setResendMessage("Không tìm thấy thông tin người dùng vừa đăng ký.")
        return
      }

      const result = await AuthAPI.resendVerification({ 
        userId: registeredUserId, 
        email: email 
      })
      
      if (result.token) {
        setResendMessage("Đã gửi lại email xác minh thành công!")
        setTimeLeft(24 * 60) // Reset timer
      } else {
        setResendMessage("Gửi lại email thất bại. Vui lòng thử lại sau.")
      }
    } catch (error) {
      setResendMessage("Có lỗi xảy ra. Vui lòng thử lại sau.")
    } finally {
      setIsResending(false)
    }
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
                  placeholder="Nhập mật khẩu"
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
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>


              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            {showVerifyInfo ? (
              <div className="text-center space-y-4 w-full">
                <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-lg">✓</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-green-800 mb-2">Đăng ký thành công!</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Chúng tôi đã gửi link xác minh đến email của bạn. 
                    Vui lòng kiểm tra hộp thư và nhấn vào link để kích hoạt tài khoản.
                  </p>
                  
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                    <h4 className="font-semibold text-blue-800 mb-2">Không thấy email?</h4>
                    <ul className="text-sm text-blue-700 space-y-1 text-left">
                      <li>• Kiểm tra thư mục <strong>Spam</strong> hoặc <strong>Junk</strong></li>
                      <li>• Đảm bảo email từ <strong>xuanhungdz3011@gmail.com</strong></li>
                      <li>• Có thể mất vài phút để email được gửi</li>
                    </ul>
                  </div>
                  

                  {/* Resend Message */}
                  {resendMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      resendMessage.includes("thành công") 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {resendMessage}
                    </div>
                  )}

                  {/* Resend Button */}
                  <Button 
                    onClick={handleResendEmail}
                    disabled={isResending || timeLeft <= 0}
                    variant="outline"
                    className="w-full"
                  >
                    {isResending ? "Đang gửi lại..." : "Gửi lại mã xác minh"}
                  </Button>
                </div>
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
