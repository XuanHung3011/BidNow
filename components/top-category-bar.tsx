"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const categories: { href: string; label: string }[] = [
  { href: "/categories", label: "Tất cả" },
  { href: "/categories?slug=dien-tu", label: "Điện tử" },
  { href: "/categories?slug=nghe-thuat", label: "Nghệ thuật" },
  { href: "/categories?slug=suu-tam", label: "Sưu tầm" },
  { href: "/categories?slug=dong-ho", label: "Đồng hồ" },
  { href: "/categories?slug=gaming", label: "Gaming" },
  { href: "/categories?slug=may-anh", label: "Máy ảnh" },
]

export function TopCategoryBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const isAdmin = user?.currentRole === "admin"
  
  // Only show on home page, auctions page, and categories page
  const shouldShow = pathname === "/" || pathname === "/auctions" || pathname.startsWith("/categories")
  
  if (isAdmin || !shouldShow) return null

  return (
    <nav className="border-b border-border bg-background/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <ul className="flex flex-wrap items-center justify-center gap-2 py-3 text-sm">
            {categories.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className="rounded-full border border-border bg-background px-4 py-2 text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-sm"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}


