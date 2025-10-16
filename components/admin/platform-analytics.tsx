import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export function PlatformAnalytics() {
  const metrics = [
    {
      title: "Người dùng mới",
      current: "1,234",
      previous: "1,056",
      change: "+16.9%",
      trend: "up",
    },
    {
      title: "Phiên đấu giá mới",
      current: "456",
      previous: "523",
      change: "-12.8%",
      trend: "down",
    },
    {
      title: "Tổng giao dịch",
      current: "₫2.4B",
      previous: "₫2.1B",
      change: "+14.3%",
      trend: "up",
    },
    {
      title: "Tỷ lệ thành công",
      current: "87%",
      previous: "84%",
      change: "+3.6%",
      trend: "up",
    },
  ]

  const topCategories = [
    { name: "Điện tử", auctions: 234, revenue: "₫850M" },
    { name: "Sưu tầm", auctions: 156, revenue: "₫620M" },
    { name: "Nghệ thuật", auctions: 89, revenue: "₫480M" },
    { name: "Thời trang", auctions: 67, revenue: "₫320M" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Chỉ số tháng này</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="p-6">
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{metric.current}</p>
              <div className="mt-2 flex items-center gap-1 text-sm">
                {metric.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-primary" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={metric.trend === "up" ? "text-primary" : "text-destructive"}>{metric.change}</span>
                <span className="text-muted-foreground">so với tháng trước</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Danh mục hàng đầu</h3>
        <Card className="p-6">
          <div className="space-y-4">
            {topCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                <div>
                  <p className="font-semibold text-foreground">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.auctions} phiên đấu giá</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{category.revenue}</p>
                  <p className="text-sm text-muted-foreground">Doanh thu</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h4 className="mb-4 font-semibold text-foreground">Hoạt động gần đây</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Người dùng trực tuyến</span>
              <span className="font-semibold text-foreground">1,234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phiên đấu giá đang diễn ra</span>
              <span className="font-semibold text-foreground">156</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lượt đấu giá hôm nay</span>
              <span className="font-semibold text-foreground">2,456</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Giao dịch hôm nay</span>
              <span className="font-semibold text-foreground">₫125M</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="mb-4 font-semibold text-foreground">Cảnh báo hệ thống</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
              <div>
                <p className="font-medium text-foreground">Hệ thống hoạt động bình thường</p>
                <p className="text-muted-foreground">Tất cả dịch vụ đang chạy tốt</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-accent" />
              <div>
                <p className="font-medium text-foreground">23 phiên đấu giá chờ duyệt</p>
                <p className="text-muted-foreground">Cần xem xét trong 24 giờ</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-destructive" />
              <div>
                <p className="font-medium text-foreground">8 tranh chấp đang xử lý</p>
                <p className="text-muted-foreground">2 trường hợp khẩn cấp</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
