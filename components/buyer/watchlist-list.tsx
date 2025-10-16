import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, X } from "lucide-react"
import Link from "next/link"

export function WatchlistList() {
  const watchlist = [
    {
      id: "10",
      title: "Nintendo Switch OLED",
      image: "/gaming-console-setup.png",
      currentBid: "₫7,500,000",
      timeLeft: "1 ngày 5 giờ",
      bids: 23,
      status: "active",
    },
    {
      id: "11",
      title: "Bose QuietComfort 45",
      image: "/premium-headphones.png",
      currentBid: "₫5,200,000",
      timeLeft: "3 ngày 12 giờ",
      bids: 15,
      status: "active",
    },
    {
      id: "12",
      title: "iPad Pro 12.9 inch M2",
      image: "/tablet-device.png",
      currentBid: "₫0",
      timeLeft: "Bắt đầu 16/04/2025",
      bids: 0,
      status: "scheduled",
    },
  ]

  return (
    <div className="space-y-4">
      {watchlist.map((item) => (
        <Card key={item.id} className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  {item.status === "scheduled" && <Badge variant="secondary">Sắp diễn ra</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {item.status === "active" ? "Giá hiện tại:" : "Giá khởi điểm:"}{" "}
                    <span className="font-semibold text-foreground">{item.currentBid || "Chưa có"}</span>
                  </span>
                  {item.status === "active" && (
                    <span className="text-muted-foreground">
                      Số lượt đấu: <span className="font-semibold text-foreground">{item.bids}</span>
                    </span>
                  )}
                  <span className="flex items-center text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {item.timeLeft}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/auction/${item.id}`}>
                <Button variant="outline" size="sm">
                  Xem chi tiết
                </Button>
              </Link>
              {item.status === "active" && (
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Đấu giá ngay
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
