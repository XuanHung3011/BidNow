// components/top-category-bar.tsx
"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { ItemsAPI } from "@/lib/api/items"
import type { CategoryDto } from "@/lib/api/types"

export function TopCategoryBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const isAdmin = user?.currentRole === "admin"

  // Only show on home page, auctions page, and categories page
  const shouldShow = pathname === "/" || pathname === "/auctions" || pathname?.startsWith("/categories")

  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const cats = await ItemsAPI.getCategories()
        if (!mounted) return
        setCategories(cats)
      } catch (err) {
        console.error("TopCategoryBar: cannot load categories", err)
        if (!mounted) return
        setCategories([])
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (isAdmin || !shouldShow) return null

  // Build active detection: if current URL has categoryId param that matches one of the categories,
  // highlight that item as active. We'll read searchParams for "categoryId".
  const activeCategoryId = searchParams?.get("categoryId")

  return (
    <nav className="border-b border-border bg-background/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <ul className="flex flex-wrap items-center justify-center gap-2 py-3 text-sm">
            <li key="all">
              <Link
                href="/auctions"
                className={`rounded-full border border-border bg-background px-4 py-2 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-sm ${
                  !activeCategoryId ? "text-primary border-primary bg-primary/5" : "text-muted-foreground"
                }`}
              >
                Tất cả
              </Link>
            </li>

            {loading && <li className="text-sm text-muted-foreground px-4 py-2">Đang tải...</li>}

            {categories.map((c) => {
              // Ensure id is string/number for URL; use Number(c.id) if needed
              const idStr = String(c.id)
              const isActive = activeCategoryId === idStr

              return (
                <li key={idStr}>
                  <Link
                    href={`/auctions?categoryId=${encodeURIComponent(idStr)}`}
                    className={`rounded-full border border-border bg-background px-4 py-2 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-sm ${
                      isActive ? "text-primary border-primary bg-primary/5" : "text-muted-foreground"
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </nav>
  )
}
