import { Card } from "@/components/ui/card"
import { Package, DollarSign, Clock, Star } from "lucide-react"

export function SellerStats() {
  const stats = [
    {
      label: "Điểm uy tín",
      value: "4.8",
      change: "Từ 156 đánh giá",
      icon: Star,
      color: "text-yellow-500",
    },
    {
      label: "Tổng sản phẩm",
      value: "24",
      change: "+3 tuần này",
      icon: Package,
      color: "text-primary",
    },
    {
      label: "Đang đấu giá",
      value: "8",
      change: "5 sắp kết thúc",
      icon: Clock,
      color: "text-accent",
    },
    {
      label: "Doanh thu tháng này",
      value: "₫45.2M",
      change: "+12% so với tháng trước",
      icon: DollarSign,
      color: "text-primary",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
              </div>
              <div className={`rounded-full bg-muted p-3 ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
