import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"

export function ActiveBidsList() {
  const activeBids = [
    {
      id: "1",
      title: "iPhone 15 Pro Max 256GB",
      image: "/modern-smartphone.png",
      currentBid: "₫25,000,000",
      yourBid: "₫25,000,000",
      timeLeft: "2 giờ 30 phút",
      isLeading: true,
      bids: 45,
    },
    {
      id: "2",
      title: "MacBook Pro M3 14 inch",
      image: "/silver-macbook-on-desk.png",
      currentBid: "₫38,500,000",
      yourBid: "₫37,000,000",
      timeLeft: "5 giờ 15 phút",
      isLeading: false,
      bids: 32,
    },
    {
      id: "6",
      title: "Sony WH-1000XM5 Headphones",
      image: "/premium-headphones.png",
      currentBid: "₫6,200,000",
      yourBid: "₫6,200,000",
      timeLeft: "45 phút",
      isLeading: true,
      bids: 18,
    },
  ]

  return (
    <div className="space-y-4">
      {activeBids.map((bid) => (
        <Card key={bid.id} className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <img
                src={bid.image || "/placeholder.svg"}
                alt={bid.title}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-foreground">{bid.title}</h3>
                  {bid.isLeading ? (
                    <Badge className="bg-primary text-primary-foreground">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Đang dẫn đầu
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Bị vượt giá
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Giá hiện tại: <span className="font-semibold text-foreground">{bid.currentBid}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Giá của bạn: <span className="font-semibold text-foreground">{bid.yourBid}</span>
                  </span>
                  <span className="flex items-center text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {bid.timeLeft}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/auction/${bid.id}`}>
                <Button variant="outline" size="sm">
                  Xem chi tiết
                </Button>
              </Link>
              {!bid.isLeading && (
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Đấu giá ngay
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
