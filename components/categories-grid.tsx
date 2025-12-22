"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Palette, Watch, Gem, Car, Home, Music, Camera, Package, Loader2 } from "lucide-react"
import { CategoriesAPI } from "@/lib/api/categories"
import { CategoryDtos } from "@/lib/api/types"

// Icon mapping based on category name or slug
const getCategoryIcon = (name: string, slug: string): any => {
  const lowerName = name.toLowerCase()
  const lowerSlug = slug.toLowerCase()
  
  if (lowerName.includes("điện tử") || lowerName.includes("electronics") || lowerSlug.includes("dien-tu") || lowerSlug.includes("electronics")) {
    return Smartphone
  }
  if (lowerName.includes("nghệ thuật") || lowerName.includes("art") || lowerSlug.includes("nghe-thuat") || lowerSlug.includes("art")) {
    return Palette
  }
  if (lowerName.includes("sưu tầm") || lowerName.includes("collectibles") || lowerSlug.includes("suu-tam") || lowerSlug.includes("collectibles")) {
    return Watch
  }
  if (lowerName.includes("trang sức") || lowerName.includes("jewelry") || lowerSlug.includes("trang-suc") || lowerSlug.includes("jewelry")) {
    return Gem
  }
  if (lowerName.includes("xe") || lowerName.includes("vehicle") || lowerSlug.includes("xe") || lowerSlug.includes("vehicle")) {
    return Car
  }
  if (lowerName.includes("bất động sản") || lowerName.includes("real estate") || lowerSlug.includes("bat-dong-san") || lowerSlug.includes("real-estate")) {
    return Home
  }
  if (lowerName.includes("nhạc") || lowerName.includes("music") || lowerSlug.includes("nhac") || lowerSlug.includes("music")) {
    return Music
  }
  if (lowerName.includes("nhiếp ảnh") || lowerName.includes("photography") || lowerSlug.includes("nhiep-anh") || lowerSlug.includes("photography")) {
    return Camera
  }
  return Package // Default icon
}

// Color mapping
const getCategoryColor = (index: number): string => {
  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-orange-100 text-orange-600",
    "bg-pink-100 text-pink-600",
    "bg-green-100 text-green-600",
    "bg-indigo-100 text-indigo-600",
    "bg-yellow-100 text-yellow-600",
    "bg-teal-100 text-teal-600",
  ]
  return colors[index % colors.length]
}

export function CategoriesGrid() {
  const [categories, setCategories] = useState<CategoryDtos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        const data = await CategoriesAPI.getAll()
        setCategories(data)
      } catch (err) {
        console.error("Error loading categories:", err)
        setError("Không thể tải danh mục")
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{error}</p>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Chưa có danh mục nào</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category, index) => {
        const Icon = getCategoryIcon(category.name, category.slug)
        const color = getCategoryColor(index)
        return (
          <Link key={category.id} href={`/categories/${category.slug}`}>
            <Card className="group transition-all hover:shadow-lg">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${color}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
