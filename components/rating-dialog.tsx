"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { Label } from "@/components/ui/label"

interface RatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetName: string
  targetType: "seller" | "buyer"
  auctionTitle: string
  onSubmit: (rating: number, comment: string) => void
}

export function RatingDialog({
  open,
  onOpenChange,
  targetName,
  targetType,
  auctionTitle,
  onSubmit,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment)
      setRating(0)
      setComment("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Đánh giá {targetType === "seller" ? "người bán" : "người mua"}</DialogTitle>
          <DialogDescription>
            Chia sẻ trải nghiệm của bạn với {targetName} trong phiên đấu giá "{auctionTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Đánh giá của bạn</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium text-foreground">
                  {rating === 5
                    ? "Xuất sắc"
                    : rating === 4
                      ? "Tốt"
                      : rating === 3
                        ? "Trung bình"
                        : rating === 2
                          ? "Kém"
                          : "Rất kém"}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Nhận xét (tùy chọn)</Label>
            <Textarea
              id="comment"
              placeholder={`Chia sẻ trải nghiệm của bạn với ${targetName}...`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0} className="bg-primary hover:bg-primary/90">
            Gửi đánh giá
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
