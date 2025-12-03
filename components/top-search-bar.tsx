"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function TopSearchBar() {
  const [query, setQuery] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const isAdmin = user?.currentRole === "admin"
  
  // Only show on home page, auctions page, and categories page
  const shouldShow = pathname === "/" || pathname === "/auctions" || pathname.startsWith("/categories")

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  if (!query.trim()) return
  router.push(`/search?q=${encodeURIComponent(query.trim())}`)
}

  if (isAdmin || !shouldShow) return null

  return (
    <div className="border-b border-border bg-background/95">
      <div className="container mx-auto px-4 py-3">
        <form onSubmit={handleSubmit} className="relative mx-auto w-full max-w-3xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm sản phẩm, người bán, từ khóa..."
            className="h-11 pl-10 pr-28"
          />
          <Button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 h-9 px-4">
            Tìm kiếm
          </Button>
        </form>
      </div>
    </div>
  )
}


