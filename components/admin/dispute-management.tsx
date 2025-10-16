import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, MessageSquare } from "lucide-react"

export function DisputeManagement() {
  const disputes = [
    {
      id: "1",
      title: "Sản phẩm không đúng mô tả",
      auction: "iPhone 15 Pro Max 256GB",
      buyer: "Nguyễn Văn D",
      seller: "Trần Văn E",
      amount: "₫25,000,000",
      status: "open",
      priority: "high",
      createdDate: "14/04/2025 08:00",
    },
    {
      id: "2",
      title: "Người bán không giao hàng",
      auction: "MacBook Pro M3 14 inch",
      buyer: "Lê Thị F",
      seller: "Phạm Văn G",
      amount: "₫38,500,000",
      status: "investigating",
      priority: "high",
      createdDate: "13/04/2025 15:30",
    },
    {
      id: "3",
      title: "Yêu cầu hoàn tiền",
      auction: "Sony WH-1000XM5",
      buyer: "Hoàng Văn H",
      seller: "Vũ Thị I",
      amount: "₫6,200,000",
      status: "resolved",
      priority: "normal",
      createdDate: "12/04/2025 10:15",
    },
  ]

  return (
    <div className="space-y-4">
      {disputes.map((dispute) => (
        <Card key={dispute.id} className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-1 h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{dispute.title}</h3>
                    <Badge
                      variant={
                        dispute.status === "open"
                          ? "destructive"
                          : dispute.status === "investigating"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {dispute.status === "open"
                        ? "Mới"
                        : dispute.status === "investigating"
                          ? "Đang xử lý"
                          : "Đã giải quyết"}
                    </Badge>
                    {dispute.priority === "high" && <Badge variant="destructive">Khẩn cấp</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Phiên đấu giá: {dispute.auction}</p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>
                      Người mua: <span className="font-medium text-foreground">{dispute.buyer}</span>
                    </p>
                    <p>
                      Người bán: <span className="font-medium text-foreground">{dispute.seller}</span>
                    </p>
                    <p>
                      Giá trị: <span className="font-medium text-foreground">{dispute.amount}</span>
                    </p>
                    <p>Tạo lúc: {dispute.createdDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                <MessageSquare className="mr-2 h-4 w-4" />
                Xem chi tiết
              </Button>
              {dispute.status !== "resolved" && (
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90 sm:w-auto">
                  Xử lý ngay
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
