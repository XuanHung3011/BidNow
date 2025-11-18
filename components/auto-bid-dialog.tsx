"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Zap, Info, Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AutoBidsAPI } from "@/lib/api/auto-bids"
import { useAuth } from "@/lib/auth-context"

interface AutoBidDialogProps {
  auctionId: number
  currentBid: number
  minIncrement: number
}

// Tính bước nhảy giá dựa trên giá hiện tại (tham khảo từ bảng bid increment)
const calculateBidIncrement = (currentPrice: number): number => {
  if (currentPrice < 25000) {
    return 1250
  } else if (currentPrice < 125000) {
    return 6250
  } else if (currentPrice < 625000) {
    return 12500
  } else if (currentPrice < 2500000) {
    return 25000
  } else if (currentPrice < 6250000) {
    return 62500
  } else if (currentPrice < 12500000) {
    return 125000
  } else if (currentPrice < 25000000) {
    return 250000
  } else if (currentPrice < 62500000) {
    return 625000
  } else if (currentPrice < 125000000) {
    return 1250000
  } else {
    return 2500000
  }
}

export function AutoBidDialog({ auctionId, currentBid, minIncrement }: AutoBidDialogProps) {
  const { user } = useAuth()
  const [maxBid, setMaxBid] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [existingAutoBid, setExistingAutoBid] = useState<{ maxAmount: number } | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Tính các bước nhảy có thể xảy ra trong quá trình auto bid
  const bidIncrementRanges = useMemo(() => {
    return [
      { range: "0 - 24,999 ₫", increment: "1,250 ₫" },
      { range: "25,000 - 124,999 ₫", increment: "6,250 ₫" },
      { range: "125,000 - 624,999 ₫", increment: "12,500 ₫" },
      { range: "625,000 - 2,499,999 ₫", increment: "25,000 ₫" },
      { range: "2,500,000 - 6,249,999 ₫", increment: "62,500 ₫" },
      { range: "6,250,000 - 12,499,999 ₫", increment: "125,000 ₫" },
      { range: "12,500,000 - 24,999,999 ₫", increment: "250,000 ₫" },
      { range: "25,000,000 - 62,499,999 ₫", increment: "625,000 ₫" },
      { range: "62,500,000 - 124,999,999 ₫", increment: "1,250,000 ₫" },
      { range: "125,000,000 ₫ trở lên", increment: "2,500,000 ₫" },
    ]
  }, [])

  // Load existing auto bid khi mở dialog
  useEffect(() => {
    if (isOpen && user) {
      AutoBidsAPI.get(auctionId, Number(user.id))
        .then((autoBid) => {
          if (autoBid) {
            setExistingAutoBid({ maxAmount: autoBid.maxAmount })
            setMaxBid(autoBid.maxAmount.toString())
          } else {
            setExistingAutoBid(null)
          }
        })
        .catch(() => {
          setExistingAutoBid(null)
        })
    }
  }, [isOpen, auctionId, user])

  const handleActivate = async () => {
    if (!user) {
      setError("Bạn cần đăng nhập để sử dụng tính năng này")
      return
    }

    const amount = Number(maxBid)
    if (!amount || isNaN(amount) || amount <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ")
      return
    }

    if (amount <= currentBid) {
      setError(`Giá tối đa phải cao hơn giá hiện tại (${formatPrice(currentBid)})`)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await AutoBidsAPI.createOrUpdate({
        auctionId,
        userId: Number(user.id),
        maxAmount: amount,
      })
      setSuccess(true)
      setExistingAutoBid({ maxAmount: amount })
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Không thể kích hoạt auto bid")
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await AutoBidsAPI.deactivate(auctionId, Number(user.id))
      setExistingAutoBid(null)
      setMaxBid("")
      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Không thể hủy auto bid")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 bg-transparent">
          <Zap className="h-4 w-4" />
          Đặt giá tự động
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đặt giá tự động</DialogTitle>
          <DialogDescription>
            Hệ thống sẽ tự động đấu giá thay bạn khi có người đặt giá cao hơn, cho đến khi đạt mức giá tối đa bạn đặt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {existingAutoBid && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <p className="font-semibold text-primary">Auto bid đang hoạt động</p>
              <p className="text-muted-foreground">Giá tối đa: {formatPrice(existingAutoBid.maxAmount)}</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
              {existingAutoBid ? "Auto bid đã được cập nhật thành công!" : "Auto bid đã được hủy thành công!"}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maxBid">Giá tối đa bạn muốn trả</Label>
            <Input
              id="maxBid"
              type="number"
              placeholder={formatPrice(currentBid + minIncrement * 5)}
              value={maxBid}
              onChange={(e) => {
                setMaxBid(e.target.value)
                setError(null)
              }}
              disabled={loading}
            />
            <div className="flex items-center justify-between text-xs">
              <p className="text-muted-foreground">Giá hiện tại: {formatPrice(currentBid)}</p>
              <p className="text-muted-foreground">Bước nhảy hiện tại: {formatPrice(minIncrement)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <div className="mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-foreground">Cách hoạt động:</h4>
            </div>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>• Hệ thống tự động đấu giá khi bị vượt</li>
              <li>• Tăng giá theo bước nhảy tương ứng với từng mức giá (xem bảng bên dưới)</li>
              <li>• Dừng khi đạt giá tối đa hoặc thắng phiên đấu giá</li>
              <li>• Bạn sẽ nhận thông báo mỗi lần hệ thống đấu giá thay bạn</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">Bảng bước nhảy giá</h4>
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Giá hiện tại</TableHead>
                    <TableHead className="text-xs">Bước nhảy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bidIncrementRanges.map((item, index) => {
                    const incrementValue = parseInt(item.increment.replace(/[^\d]/g, ""))
                    const isCurrentRange = calculateBidIncrement(currentBid) === incrementValue
                    return (
                      <TableRow
                        key={index}
                        className={isCurrentRange ? "bg-primary/10 font-medium" : ""}
                      >
                        <TableCell className="text-xs">{item.range}</TableCell>
                        <TableCell className="text-xs font-semibold">{item.increment}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              * Bước nhảy sẽ tự động điều chỉnh khi giá tăng lên các mức cao hơn
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={() => {
              setIsOpen(false)
              setError(null)
              setSuccess(false)
            }}
            disabled={loading}
          >
            Hủy
          </Button>
          {existingAutoBid ? (
            <>
              <Button className="flex-1" onClick={handleActivate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cập nhật"}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDeactivate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hủy auto bid"}
              </Button>
            </>
          ) : (
            <Button className="flex-1" onClick={handleActivate} disabled={loading || !user}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kích hoạt"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
