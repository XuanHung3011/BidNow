"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuctionCard } from "@/components/auction-card"
import { Search, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const allAuctions = [
  {
    id: "1",
    title: "iPhone 15 Pro Max 256GB - Titan Xanh",
    image: "/iphone-15-pro-max-blue-titanium.jpg",
    currentBid: 28500000,
    startingBid: 25000000,
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    bidCount: 45,
    category: "Điện tử",
  },
  {
    id: "2",
    title: "MacBook Pro M3 Max 16 inch - 64GB RAM",
    image: "/silver-macbook-on-desk.png",
    currentBid: 72000000,
    startingBid: 65000000,
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    bidCount: 56,
    category: "Điện tử",
  },
  {
    id: "3",
    title: "Đồng hồ Rolex Submariner Date",
    image: "/rolex-watch.jpg",
    currentBid: 185000000,
    startingBid: 150000000,
    endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
    bidCount: 78,
    category: "Đồng hồ",
  },
  {
    id: "4",
    title: "Tranh sơn dầu trừu tượng hiện đại",
    image: "/abstract-oil-painting.png",
    currentBid: 45000000,
    startingBid: 35000000,
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
    bidCount: 23,
    category: "Nghệ thuật",
  },
  {
    id: "5",
    title: "PlayStation 5 Pro + 2 Tay cầm",
    image: "/gaming-console-setup.png",
    currentBid: 18500000,
    startingBid: 15000000,
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    bidCount: 67,
    category: "Gaming",
  },
  {
    id: "6",
    title: "Tai nghe Sony WH-1000XM5",
    image: "/premium-headphones.png",
    currentBid: 6500000,
    startingBid: 5500000,
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
    bidCount: 34,
    category: "Điện tử",
  },
  {
    id: "7",
    title: "Sony A7R V + Lens 24-70mm F2.8",
    image: "/professional-camera.png",
    currentBid: 95000000,
    startingBid: 85000000,
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    bidCount: 42,
    category: "Máy ảnh",
  },
  {
    id: "8",
    title: "Apple Watch Ultra 2 - Titanium",
    image: "/smartwatch-closeup.png",
    currentBid: 18000000,
    startingBid: 16000000,
    endTime: new Date(Date.now() + 7 * 60 * 60 * 1000),
    bidCount: 51,
    category: "Điện tử",
  },
  {
    id: "9",
    title: "iPad Pro M2 12.9 inch - 1TB",
    image: "/modern-smartphone.png",
    currentBid: 32000000,
    startingBid: 28000000,
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    bidCount: 38,
    category: "Điện tử",
  },
  {
    id: "10",
    title: "Samsung Galaxy S24 Ultra 512GB",
    image: "/modern-smartphone.png",
    currentBid: 24000000,
    startingBid: 22000000,
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    bidCount: 29,
    category: "Điện tử",
  },
  {
    id: "11",
    title: "Đồng hồ Omega Seamaster Professional",
    image: "/rolex-watch.jpg",
    currentBid: 125000000,
    startingBid: 110000000,
    endTime: new Date(Date.now() + 10 * 60 * 60 * 1000),
    bidCount: 62,
    category: "Đồng hồ",
  },
  {
    id: "12",
    title: "Tranh sơn dầu Phố cổ Hà Nội",
    image: "/vietnamese-oil-painting-hanoi-old-quarter.jpg",
    currentBid: 38000000,
    startingBid: 30000000,
    endTime: new Date(Date.now() + 9 * 60 * 60 * 1000),
    bidCount: 19,
    category: "Nghệ thuật",
  },
  {
    id: "13",
    title: "Nintendo Switch OLED + 10 Games",
    image: "/gaming-console-setup.png",
    currentBid: 9500000,
    startingBid: 8000000,
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    bidCount: 44,
    category: "Gaming",
  },
  {
    id: "14",
    title: "Bose QuietComfort Ultra Headphones",
    image: "/premium-headphones.png",
    currentBid: 8500000,
    startingBid: 7500000,
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
    bidCount: 27,
    category: "Điện tử",
  },
  {
    id: "15",
    title: "Canon EOS R5 + RF 24-105mm",
    image: "/professional-camera.png",
    currentBid: 82000000,
    startingBid: 75000000,
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
    bidCount: 36,
    category: "Máy ảnh",
  },
  {
    id: "16",
    title: "Garmin Fenix 7X Sapphire Solar",
    image: "/smartwatch-closeup.png",
    currentBid: 22000000,
    startingBid: 19000000,
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    bidCount: 31,
    category: "Điện tử",
  },
  {
    id: "17",
    title: "Microsoft Surface Pro 9 - i7 32GB",
    image: "/silver-macbook-on-desk.png",
    currentBid: 35000000,
    startingBid: 30000000,
    endTime: new Date(Date.now() + 7 * 60 * 60 * 1000),
    bidCount: 25,
    category: "Điện tử",
  },
  {
    id: "18",
    title: "Đồng hồ TAG Heuer Carrera Chronograph",
    image: "/rolex-watch.jpg",
    currentBid: 95000000,
    startingBid: 85000000,
    endTime: new Date(Date.now() + 11 * 60 * 60 * 1000),
    bidCount: 48,
    category: "Đồng hồ",
  },
  {
    id: "19",
    title: "Tượng gỗ Phật Quan Âm - Gỗ Hương",
    image: "/abstract-oil-painting.png",
    currentBid: 28000000,
    startingBid: 22000000,
    endTime: new Date(Date.now() + 10 * 60 * 60 * 1000),
    bidCount: 16,
    category: "Sưu tầm",
  },
  {
    id: "20",
    title: "Xbox Series X + Game Pass Ultimate",
    image: "/gaming-console-setup.png",
    currentBid: 14500000,
    startingBid: 12000000,
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    bidCount: 53,
    category: "Gaming",
  },
  {
    id: "21",
    title: "AirPods Max - Space Gray",
    image: "/premium-headphones.png",
    currentBid: 12000000,
    startingBid: 10500000,
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    bidCount: 39,
    category: "Điện tử",
  },
  {
    id: "22",
    title: "Nikon Z9 + Z 24-120mm f/4 S",
    image: "/professional-camera.png",
    currentBid: 135000000,
    startingBid: 120000000,
    endTime: new Date(Date.now() + 9 * 60 * 60 * 1000),
    bidCount: 28,
    category: "Máy ảnh",
  },
  {
    id: "23",
    title: "Samsung Galaxy Watch 6 Classic",
    image: "/smartwatch-closeup.png",
    currentBid: 8500000,
    startingBid: 7500000,
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
    bidCount: 33,
    category: "Điện tử",
  },
  {
    id: "24",
    title: "ASUS ROG Zephyrus G16 - RTX 4090",
    image: "/silver-macbook-on-desk.png",
    currentBid: 85000000,
    startingBid: 75000000,
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
    bidCount: 41,
    category: "Điện tử",
  },
]

export function AllAuctions() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("ending-soon")

  return (
    <>
      <section className="border-b bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="mb-4 text-4xl font-bold text-foreground">Tất cả phiên đấu giá</h1>
          <p className="mb-6 text-lg text-muted-foreground">Khám phá hàng nghìn sản phẩm đang được đấu giá</p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Bộ lọc
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Bộ lọc nâng cao</SheetTitle>
                  <SheetDescription>Tùy chỉnh kết quả tìm kiếm của bạn</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Danh mục</Label>
                    <div className="space-y-2">
                      {["Điện tử", "Nghệ thuật", "Sưu tầm", "Đồng hồ", "Gaming", "Máy ảnh"].map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox id={category} />
                          <label htmlFor={category} className="text-sm font-medium leading-none">
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Khoảng giá</Label>
                    <div className="space-y-2">
                      <Input type="number" placeholder="Giá tối thiểu" />
                      <Input type="number" placeholder="Giá tối đa" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Trạng thái</Label>
                    <div className="space-y-2">
                      {["Đang diễn ra", "Sắp kết thúc", "Mới bắt đầu"].map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox id={status} />
                          <label htmlFor={status} className="text-sm font-medium leading-none">
                            {status}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full">Áp dụng bộ lọc</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Hiển thị {allAuctions.length} kết quả</p>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ending-soon">Sắp kết thúc</SelectItem>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
                <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
                <SelectItem value="most-bids">Nhiều lượt đấu nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
