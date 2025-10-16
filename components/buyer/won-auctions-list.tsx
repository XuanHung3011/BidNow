"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, MessageSquare, Star } from "lucide-react"
import { useState } from "react"
import { RatingDialog } from "@/components/rating-dialog"

export function WonAuctionsList() {
  const [ratingDialog, setRatingDialog] = useState<{
    open: boolean
    auctionId: string
    auctionTitle: string
    sellerName: string
  } | null>(null)

  const wonAuctions = [
    {
      id: "7",
      title: "Canon EOS R6 Mark II",
      image: "/professional-camera.png",
      finalBid: "₫42,500,000",
      wonDate: "12/04/2025",
      status: "pending-payment",
      statusLabel: "Chờ thanh toán",
      sellerName: "Nguyễn Văn A",
      rated: false,
    },
    {
      id: "8",
      title: "Apple Watch Ultra 2",
      image: "/smartwatch-closeup.png",
      finalBid: "₫18,200,000",
      wonDate: "10/04/2025",
      status: "paid",
      statusLabel: "Đã thanh toán",
      sellerName: "Trần Thị B",
      rated: false,
    },
    {
      id: "9",
      title: "Samsung Galaxy Tab S9 Ultra",
      image: "/tablet-device.png",
      finalBid: "₫22,800,000",
      wonDate: "08/04/2025",
      status: "completed",
      statusLabel: "Hoàn thành",
      sellerName: "Lê Văn C",
      rated: true,
    },
  ]

  const handleRateClick = (auction: any) => {
    setRatingDialog({
      open: true,
      auctionId: auction.id,
      auctionTitle: auction.title,
      sellerName: auction.sellerName,
    })
  }

  const handleRatingSubmit = (rating: number, comment: string) => {
    console.log("[v0] Rating submitted:", { rating, comment, auctionId: ratingDialog?.auctionId })
    // Here you would save the rating to your backend
  }

  return (
    <div className="space-y-4">
      {wonAuctions.map((auction) => (
        <Card key={auction.id} className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <img
                src={auction.image || "/placeholder.svg"}
                alt={auction.title}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-foreground">{auction.title}</h3>
                  <Badge
                    variant={
                      auction.status === "pending-payment"
                        ? "destructive"
                        : auction.status === "paid"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {auction.statusLabel}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Giá thắng: <span className="font-semibold text-foreground">{auction.finalBid}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Người bán: <span className="font-semibold text-foreground">{auction.sellerName}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Ngày thắng: <span className="font-semibold text-foreground">{auction.wonDate}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {auction.status === "completed" && !auction.rated && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 bg-transparent"
                  onClick={() => handleRateClick(auction)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Đánh giá
                </Button>
              )}
              {auction.status === "completed" && auction.rated && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  Đã đánh giá
                </Badge>
              )}
              {auction.status === "pending-payment" && (
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Thanh toán ngay
                </Button>
              )}
              {auction.status === "shipped" && (
                <Button variant="outline" size="sm">
                  <Package className="mr-2 h-4 w-4" />
                  Theo dõi đơn hàng
                </Button>
              )}
              <Button variant="outline" size="sm">
                <MessageSquare className="mr-2 h-4 w-4" />
                Liên hệ người bán
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {ratingDialog && (
        <RatingDialog
          open={ratingDialog.open}
          onOpenChange={(open) => setRatingDialog(open ? ratingDialog : null)}
          targetName={ratingDialog.sellerName}
          targetType="seller"
          auctionTitle={ratingDialog.auctionTitle}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  )
}
