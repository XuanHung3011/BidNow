"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UsersAPI } from "@/lib/api/users"
import type { UserResponse } from "@/lib/api/types"
import { Loader2, Mail, Shield, Calendar } from "lucide-react"

interface UserPublicProfileProps {
  userId?: number | null
}

export function UserPublicProfile({ userId }: UserPublicProfileProps) {
  const [profile, setProfile] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchProfile = async () => {
      if (!userId || Number.isNaN(userId)) {
        if (isMounted) {
          setError("Không tìm thấy người dùng")
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await UsersAPI.getById(userId)
        if (isMounted) {
          setProfile(data)
        }
      } catch (err) {
        console.error("Failed to load user profile:", err)
        if (isMounted) {
          setError("Không thể tải thông tin người dùng")
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      isMounted = false
    }
  }, [userId])

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
              ) : (
                <AvatarFallback className="bg-primary text-3xl text-primary-foreground">
                  {profile.fullName?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <h2 className="mt-4 text-xl font-semibold">{profile.fullName || "Người dùng"}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {profile.roles?.length ? (
                profile.roles.map((role) => (
                  <Badge key={role} className="capitalize">
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">User</Badge>
              )}
            </div>

            <div className="mt-6 w-full space-y-3 text-left text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>ID: {profile.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Gia nhập: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Không rõ"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Thông tin hoạt động</CardTitle>
          <CardDescription>Tổng quan nhanh về người dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Tổng giao dịch</p>
              <p className="mt-2 text-3xl font-bold text-primary">{profile.totalSales ?? 0}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Lượt mua</p>
              <p className="mt-2 text-3xl font-bold text-primary">{profile.totalPurchases ?? 0}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Điểm uy tín</p>
              <p className="mt-2 text-3xl font-bold text-primary">{profile.reputationScore ?? "N/A"}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Đánh giá</p>
              <p className="mt-2 text-3xl font-bold text-primary">{profile.totalRatings ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

