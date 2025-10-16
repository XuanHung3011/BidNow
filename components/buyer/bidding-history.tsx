import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Trophy, X } from "lucide-react"

export function BiddingHistory() {
  const history = [
    {
      id: "1",
      title: "iPhone 15 Pro Max 256GB",
      image: "/modern-smartphone.png",
      yourBid: "₫25,000,000",
      date: "14/04/2025 14:30",
      status: "leading",
      statusLabel: "Đang dẫn đầu",
    },
    {
      id: "2",
      title: "MacBook Pro M3 14 inch",
      image: "/silver-macbook-on-desk.png",
      yourBid: "₫37,000,000",
      date: "14/04/2025 12:15",
      status: "outbid",
      statusLabel: "Bị vượt giá",
    },
    {
      id: "7",
      title: "Canon EOS R6 Mark II",
      image: "/professional-camera.png",
      yourBid: "₫42,500,000",
      date: "12/04/2025 18:45",
      status: "won",
      statusLabel: "Đã thắng",
    },
    {
      id: "13",
      title: "Sony PlayStation 5 Pro",
      image: "/gaming-console-setup.png",
      yourBid: "₫15,000,000",
      date: "10/04/2025 20:00",
      status: "lost",
      statusLabel: "Không thắng",
    },
  ]

  return (
    <div className="space-y-4">
      {history.map((item) => (
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
                  <Badge
                    variant={
                      item.status === "leading"
                        ? "default"
                        : item.status === "won"
                          ? "default"
                          : item.status === "outbid"
                            ? "destructive"
                            : "secondary"
                    }
                    className="flex items-center gap-1"
                  >
                    {item.status === "leading" && <TrendingUp className="h-3 w-3" />}
                    {item.status === "won" && <Trophy className="h-3 w-3" />}
                    {item.status === "outbid" && <TrendingDown className="h-3 w-3" />}
                    {item.status === "lost" && <X className="h-3 w-3" />}
                    {item.statusLabel}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Giá đặt: <span className="font-semibold text-foreground">{item.yourBid}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Thời gian: <span className="font-semibold text-foreground">{item.date}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
