import { Card } from "@/components/ui/card"
import { Laptop, Gem, Palette, Watch, Camera, Gamepad2 } from "lucide-react"
import Link from "next/link"

const categories = [
  { name: "Điện tử", icon: Laptop, count: 234, color: "text-primary" },
  { name: "Sưu tầm", icon: Gem, count: 156, color: "text-accent" },
  { name: "Nghệ thuật", icon: Palette, count: 89, color: "text-primary" },
  { name: "Đồng hồ", icon: Watch, count: 123, color: "text-accent" },
  { name: "Máy ảnh", icon: Camera, count: 67, color: "text-primary" },
  { name: "Gaming", icon: Gamepad2, count: 145, color: "text-accent" },
]

export function CategorySection() {
  return (
    <section className="border-b border-border bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Danh mục sản phẩm</h2>
          <p className="text-lg text-muted-foreground">
            Khám phá hàng nghìn sản phẩm đa dạng trong các danh mục phổ biến
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link key={category.name} href={`/category/${category.name.toLowerCase()}`}>
              <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/20">
                <div className="flex flex-col items-center gap-3 p-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
                    <category.icon className={`h-8 w-8 ${category.color}`} />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{category.name}</div>
                    <div className="text-sm text-muted-foreground">{category.count} sản phẩm</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
