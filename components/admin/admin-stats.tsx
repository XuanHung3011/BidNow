import { Card } from "@/components/ui/card"
import { Users, Gavel, AlertCircle, DollarSign } from "lucide-react"

export function AdminStats() {
  const stats = [
    {
      label: "Tổng người dùng",
      value: "10,234",
      change: "+234 tuần này",
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Phiên đấu giá hoạt động",
      value: "156",
      change: "23 chờ duyệt",
      icon: Gavel,
      color: "text-accent",
    },
    {
      label: "Tranh chấp đang xử lý",
      value: "8",
      change: "2 khẩn cấp",
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      label: "Doanh thu tháng này",
      value: "₫2.4B",
      change: "+18% so với tháng trước",
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
