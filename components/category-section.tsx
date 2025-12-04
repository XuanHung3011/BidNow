/*
"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Package, Loader2 } from "lucide-react"
import Link from "next/link"
import { ItemsAPI } from "@/lib/api/items"
import type { CategoryDto } from "@/lib/api/types"

// Icon mapping based on category name (fallback)
const getCategoryIcon = (name: string) => {
  const nameLower = name.toLowerCase()
  if (nameLower.includes("điện") || nameLower.includes("electron")) return "💻"
  if (nameLower.includes("nghệ thuật") || nameLower.includes("art")) return "🎨"
  if (nameLower.includes("sưu tầm") || nameLower.includes("collect")) return "💎"
  if (nameLower.includes("đồng hồ") || nameLower.includes("watch")) return "⌚"
  if (nameLower.includes("máy ảnh") || nameLower.includes("camera")) return "📷"
  if (nameLower.includes("gaming") || nameLower.includes("game")) return "🎮"
  if (nameLower.includes("trang sức") || nameLower.includes("jewelry")) return "💍"
  if (nameLower.includes("thời trang") || nameLower.includes("fashion")) return "👕"
  if (nameLower.includes("nhà") || nameLower.includes("home")) return "🏠"
  return "📦"
}

interface CategoryWithCount extends CategoryDto {
  itemCount: number
}

export function CategorySection() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadCategoriesWithCounts = async () => {
      try {
        setLoading(true)
        
        // Get all categories
        const allCategories = await ItemsAPI.getCategories()
        if (!mounted) return

        // Get item count for each category by filtering
        const categoriesWithCounts = await Promise.all(
          allCategories.map(async (category) => {
            try {
              // Filter items by categoryId to get count
              const result = await ItemsAPI.filterPaged(
                { categoryIds: [category.id] },
                1,
                1 // Only need pagination info, not items
              )
              return {
                ...category,
                itemCount: result.pagination?.totalCount || 0,
              }
            } catch (error) {
              // If error, set count to 0
              return {
                ...category,
                itemCount: 0,
              }
            }
          })
        )

        if (!mounted) return

        // Sort by item count descending and take top categories
        const sortedCategories = categoriesWithCounts
          .filter((cat) => cat.itemCount > 0) // Only show categories with items
          .sort((a, b) => b.itemCount - a.itemCount)
          .slice(0, 6) // Show top 6 categories

        setCategories(sortedCategories)
      } catch (error) {
        console.error("Error loading categories:", error)
        if (mounted) {
          setCategories([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadCategoriesWithCounts()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="border-b border-border bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Danh mục sản phẩm</h2>
          <p className="text-lg text-muted-foreground">
            Khám phá hàng nghìn sản phẩm đa dạng trong các danh mục phổ biến. Tại phần này hiển thị vài danh mục có nhiều sản phẩm nhất
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Package className="mx-auto mb-4 h-12 w-12" />
            <p>Chưa có danh mục nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/auctions?categoryId=${category.id}`}>
                <Card className="group relative cursor-pointer overflow-hidden border-2 border-border bg-gradient-to-br from-card to-card/50 transition-all duration-300 hover:border-primary hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-1">
                  <div className="flex flex-col items-center gap-4 p-8">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-4xl transition-all duration-300 group-hover:scale-110 group-hover:from-primary/20 group-hover:via-primary/10 group-hover:shadow-lg">
                      {category.icon ? (
                        <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{category.icon}</span>
                      ) : (
                        <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{getCategoryIcon(category.name)}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="text-base font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/0 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-5" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
*/

// Component tạm thời không sử dụng
export function CategorySection() {
  return null
}
