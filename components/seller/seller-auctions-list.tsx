"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Edit, Trash2, Eye, Star } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useState } from "react"
import { RatingDialog } from "@/components/rating-dialog"

interface SellerAuctionsListProps {
  status: "active" | "scheduled" | "completed" | "draft"
}

export function SellerAuctionsList({ status }: SellerAuctionsListProps) {
  const [ratingDialog, setRatingDialog] = useState<{
    open: boolean
    auctionId: string
    auctionTitle: string
    buyerName: string
  } | null>(null)

  const auctions = getAuctionsByStatus(status)

  const handleRateClick = (auction: any) => {
    setRatingDialog({
      open: true,
      auctionId: auction.id,
      auctionTitle: auction.title,
      buyerName: auction.buyerName || "Người mua",
    })
  }

  const handleRatingSubmit = (rating: number, comment: string) => {
    console.log("[v0] Seller rating submitted:", { rating, comment, auctionId: ratingDialog?.auctionId })
    // Here you would save the rating to your backend
  }

  if (auctions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Không có phiên đấu giá nào trong danh mục này</p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {auctions.map((auction) => (
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
                    <Badge variant={auction.status === "active" ? "default" : "secondary"}>{auction.statusLabel}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{auction.category}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {status === "completed" ? "Giá bán:" : "Giá hiện tại:"}{" "}
                      <span className="font-semibold text-foreground">{auction.currentBid}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Số lượt đấu: <span className="font-semibold text-foreground">{auction.bids}</span>
                    </span>
                    {status === "completed" && auction.buyerName && (
                      <span className="text-muted-foreground">
                        Người mua: <span className="font-semibold text-foreground">{auction.buyerName}</span>
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {status === "active" ? "Kết thúc:" : status === "scheduled" ? "Bắt đầu:" : "Ngày bán:"}{" "}
                      <span className="font-semibold text-foreground">{auction.time}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {status === "completed" && !auction.buyerRated && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 bg-transparent"
                    onClick={() => handleRateClick(auction)}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Đánh giá người mua
                  </Button>
                )}
                {status === "completed" && auction.buyerRated && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    Đã đánh giá
                  </Badge>
                )}
                <Link href={`/auction/${auction.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Xem
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {ratingDialog && (
        <RatingDialog
          open={ratingDialog.open}
          onOpenChange={(open) => setRatingDialog(open ? ratingDialog : null)}
          targetName={ratingDialog.buyerName}
          targetType="buyer"
          auctionTitle={ratingDialog.auctionTitle}
          onSubmit={handleRatingSubmit}
        />
      )}
    </>
  )
}

function getAuctionsByStatus(status: string) {
  const allAuctions = [
    {
      id: "1",
      title: "iPhone 15 Pro Max 256GB",
      category: "Điện tử",
      image: "/modern-smartphone.png",
      currentBid: "₫25,000,000",
      bids: 45,
      time: "2 giờ 30 phút",
      status: "active",
      statusLabel: "Đang diễn ra",
    },
    {
      id: "2",
      title: "MacBook Pro M3 14 inch",
      category: "Điện tử",
      image: "/silver-macbook-on-desk.png",
      currentBid: "₫38,500,000",
      bids: 32,
      time: "5 giờ 15 phút",
      status: "active",
      statusLabel: "Đang diễn ra",
    },
    {
      id: "3",
      title: "Đồng hồ Rolex Submariner",
      category: "Sưu tầm",
      image: "/rolex-watch.jpg",
      currentBid: "₫0",
      bids: 0,
      time: "15/04/2025 10:00",
      status: "scheduled",
      statusLabel: "Sắp diễn ra",
    },
    {
      id: "4",
      title: "Tranh sơn dầu phong cảnh",
      category: "Nghệ thuật",
      image: "/abstract-oil-painting.png",
      currentBid: "₫12,800,000",
      bids: 28,
      time: "10/04/2025",
      status: "completed",
      statusLabel: "Đã bán",
      buyerName: "Nguyễn Văn D",
      buyerRated: false,
    },
    {
      id: "6",
      title: "Samsung Galaxy S24 Ultra",
      category: "Điện tử",
      image: "/modern-smartphone.png",
      currentBid: "₫22,500,000",
      bids: 38,
      time: "05/04/2025",
      status: "completed",
      statusLabel: "Đã bán",
      buyerName: "Trần Thị E",
      buyerRated: true,
    },
    {
      id: "5",
      title: "Sony PlayStation 5 Pro",
      category: "Điện tử",
      image: "/gaming-console-setup.png",
      currentBid: "₫0",
      bids: 0,
      time: "Chưa xuất bản",
      status: "draft",
      statusLabel: "Bản nháp",
    },
  ]

  return allAuctions.filter((auction) => auction.status === status)
}
