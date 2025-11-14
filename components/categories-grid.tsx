import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Palette, Watch, Gem, Car, Home, Music, Camera } from "lucide-react"

const categories = [
  {
    id: "electronics",
    name: "Điện tử",
    icon: Smartphone,
    count: 234,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "art",
    name: "Nghệ thuật",
    icon: Palette,
    count: 156,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "collectibles",
    name: "Sưu tầm",
    icon: Watch,
    count: 189,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: "jewelry",
    name: "Trang sức",
    icon: Gem,
    count: 98,
    color: "bg-pink-100 text-pink-600",
  },
  {
    id: "vehicles",
    name: "Xe cộ",
    icon: Car,
    count: 67,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "real-estate",
    name: "Bất động sản",
    icon: Home,
    count: 45,
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "music",
    name: "Nhạc cụ",
    icon: Music,
    count: 123,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    id: "photography",
    name: "Nhiếp ảnh",
    icon: Camera,
    count: 87,
    color: "bg-teal-100 text-teal-600",
  },
]

export function CategoriesGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => {
        const Icon = category.icon
        return (
          <Link key={category.id} href={`/categories/${category.id}`}>
            <Card className="group transition-all hover:shadow-lg">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${category.color}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.count} phiên đấu giá</p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
