"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import {
  Smartphone,
  Palette,
  Watch,
  Gem,
  Car,
  Home,
  Music,
  Camera,
  Shapes,
  type LucideIcon,
} from "lucide-react"
import { CategoriesAPI } from "@/lib/api/categories"
import type { CategoryDtos } from "@/lib/api/types"

const iconMap: Record<string, LucideIcon> = {
  electronics: Smartphone,
  art: Palette,
  collectibles: Watch,
  jewelry: Gem,
  vehicles: Car,
  "real-estate": Home,
  realestate: Home,
  property: Home,
  music: Music,
  instruments: Music,
  photography: Camera,
  camera: Camera,
  default: Shapes,
}

function pickIcon(icon?: string | null) {
  if (!icon) return iconMap.default
  const key = icon.toLowerCase()
  return iconMap[key] ?? iconMap.default
}

function avatarColor(index: number) {
  const palette = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-orange-100 text-orange-600",
    "bg-pink-100 text-pink-600",
    "bg-green-100 text-green-600",
    "bg-indigo-100 text-indigo-600",
    "bg-yellow-100 text-yellow-600",
    "bg-teal-100 text-teal-600",
  ]
  return palette[index % palette.length]
}

export function CategoriesGrid() {
  const [categories, setCategories] = useState<CategoryDtos[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await CategoriesAPI.getAll()
        if (isMounted) {
          setCategories(data)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Không thể tải danh mục")
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [])

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 h-16 w-16 rounded-full bg-muted" />
              <div className="mb-2 h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">Chưa có danh mục nào.</div>
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category, index) => {
        const Icon = pickIcon(category.icon ?? category.slug)
        const link = category.slug ? `/categories/${category.slug}` : `/categories/${category.id}`
        return (
          <Link key={category.id} href={link}>
            <Card className="group transition-all hover:shadow-lg">
              <CardContent className="flex h-full flex-col items-center p-6 text-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${avatarColor(index)}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{category.name}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {category.description || "Khám phá các sản phẩm nổi bật trong danh mục này."}
                </p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
