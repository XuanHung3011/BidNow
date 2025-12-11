"use client"

import { Suspense, use } from "react"
import { Footer } from "@/components/footer"
import { UserPublicProfile } from "@/components/user-public-profile"

type ParamsPromise = Promise<{ id: string }>

interface ProfileParams {
  params: ParamsPromise | { id: string }
}

export default function UserProfileByIdPage({ params }: ProfileParams) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const userId = Number(resolvedParams.id)

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">Hồ sơ người dùng</h1>
        <Suspense fallback={<p>Đang tải...</p>}>
          <UserPublicProfile userId={Number.isNaN(userId) ? undefined : userId} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

