"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Zap } from "lucide-react"

interface AutoBidDialogProps {
  currentBid: number
  minIncrement: number
}

export function AutoBidDialog({ currentBid, minIncrement }: AutoBidDialogProps) {
  const [maxBid, setMaxBid] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const handleActivate = () => {
    // Handle auto-bid activation
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 bg-transparent">
          <Zap className="h-4 w-4" />
          Đặt giá tự động
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đặt giá tự động</DialogTitle>
          <DialogDescription>
            Hệ thống sẽ tự động đấu giá thay bạn khi có người đặt giá cao hơn, cho đến khi đạt mức giá tối đa bạn đặt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="maxBid">Giá tối đa bạn muốn trả</Label>
            <Input
              id="maxBid"
              type="number"
              placeholder={formatPrice(currentBid + minIncrement * 5)}
              value={maxBid}
              onChange={(e) => setMaxBid(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Giá hiện tại: {formatPrice(currentBid)}</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <h4 className="mb-2 font-semibold text-foreground">Cách hoạt động:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Hệ thống tự động đấu giá khi bị vượt</li>
              <li>• Chỉ tăng giá theo bước giá tối thiểu</li>
              <li>• Dừng khi đạt giá tối đa hoặc thắng</li>
              <li>• Bạn sẽ nhận thông báo mỗi lần đấu giá</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsOpen(false)}>
            Hủy
          </Button>
          <Button className="flex-1" onClick={handleActivate}>
            Kích hoạt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
