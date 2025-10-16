import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Eye } from "lucide-react"

export function PendingAuctions() {
  const pendingAuctions = [
    {
      id: "14",
      title: "Rolex Submariner Date 41mm",
      seller: "Nguyễn Văn A",
      category: "Sưu tầm",
      image: "/rolex-watch.jpg",
      startPrice: "₫150,000,000",
      submittedDate: "14/04/2025 10:30",
      priority: "high",
    },
    {
      id: "15",
      title: "MacBook Pro M3 Max 16 inch",
      seller: "Trần Thị B",
      category: "Điện tử",
      image: "/silver-macbook-on-desk.png",
      startPrice: "₫65,000,000",
      submittedDate: "14/04/2025 09:15",
      priority: "normal",
    },
    {
      id: "16",
      title: "Tranh sơn dầu cổ điển",
      seller: "Lê Văn C",
      category: "Nghệ thuật",
      image: "/abstract-oil-painting.png",
      startPrice: "₫25,000,000",
      submittedDate: "13/04/2025 16:45",
      priority: "normal",
    },
  ]

  return (
    <div className="space-y-4">
      {pendingAuctions.map((auction) => (
        <Card key={auction.id} className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <img
                src={auction.image || "/placeholder.svg"}
                alt={auction.title}
                className="h-24 w-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-foreground">{auction.title}</h3>
                  {auction.priority === "high" && <Badge variant="destructive">Ưu tiên cao</Badge>}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    Người bán: <span className="font-medium text-foreground">{auction.seller}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Danh mục: <span className="font-medium text-foreground">{auction.category}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Giá khởi điểm: <span className="font-medium text-foreground">{auction.startPrice}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Gửi lúc: <span className="font-medium text-foreground">{auction.submittedDate}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </Button>
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 sm:w-auto">
                <Check className="mr-2 h-4 w-4" />
                Phê duyệt
              </Button>
              <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Từ chối
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
