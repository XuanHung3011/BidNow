import { Card } from "@/components/ui/card"
import { Gavel, Trophy, Eye, TrendingUp } from "lucide-react"

export function BuyerStats() {
  const stats = [
    {
      label: "Đang tham gia",
      value: "12",
      change: "5 sắp kết thúc",
      icon: Gavel,
      color: "text-primary",
    },
    {
      label: "Đã thắng",
      value: "8",
      change: "Tháng này",
      icon: Trophy,
      color: "text-accent",
    },
    {
      label: "Đang theo dõi",
      value: "24",
      change: "3 bắt đầu hôm nay",
      icon: Eye,
      color: "text-primary",
    },
    {
      label: "Tỷ lệ thắng",
      value: "67%",
      change: "+8% so với tháng trước",
      icon: TrendingUp,
      color: "text-accent",
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
