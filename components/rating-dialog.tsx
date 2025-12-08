"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { RatingsAPI, type RatingResponseDto } from "@/lib/api/ratings"

interface RatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetName: string
  targetType: "seller" | "buyer"
  auctionTitle: string
  auctionId: number
  raterId: number
  ratedId: number
  onSubmit: (rating: number, comment: string) => void | Promise<void>
  submitting?: boolean
}

export function RatingDialog({
  open,
  onOpenChange,
  targetName,
  targetType,
  auctionTitle,
  auctionId,
  raterId,
  ratedId,
  onSubmit,
  submitting = false,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [existingRating, setExistingRating] = useState<RatingResponseDto | null>(null)
  const [loadingRating, setLoadingRating] = useState(false)

  const handleSubmitClick = () => {
    if (rating > 0) {
      setConfirmDialogOpen(true)
    }
  }

  const handleConfirmSubmit = async () => {
    if (rating > 0) {
      await onSubmit(rating, comment)
      setRating(0)
      setComment("")
      setConfirmDialogOpen(false)
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setConfirmDialogOpen(false)
  }

  const handleClose = (open: boolean) => {
    if (!open && !confirmDialogOpen) {
      setRating(0)
      setComment("")
    }
    onOpenChange(open)
  }

  // Fetch existing rating when dialog opens
  useEffect(() => {
    if (open && auctionId && raterId && ratedId) {
      setLoadingRating(true)
      RatingsAPI.getForAuction(auctionId)
        .then((ratings) => {
          // Find rating where raterId matches current user
          const found = ratings.find(r => r.raterId === raterId && r.ratedId === ratedId)
          if (found) {
            setExistingRating(found)
            setRating(found.rating)
            setComment(found.comment || "")
          } else {
            setExistingRating(null)
            setRating(0)
            setComment("")
          }
        })
        .catch((error) => {
          console.error("Error fetching existing rating:", error)
          setExistingRating(null)
          setRating(0)
          setComment("")
        })
        .finally(() => {
          setLoadingRating(false)
        })
    } else if (!open) {
      // Reset when dialog closes
      setExistingRating(null)
      setRating(0)
      setComment("")
    }
  }, [open, auctionId, raterId, ratedId])

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5: return "Xuất sắc"
      case 4: return "Tốt"
      case 3: return "Trung bình"
      case 2: return "Kém"
      case 1: return "Rất kém"
      default: return ""
    }
  }

  return (
    <>
      <Dialog open={open && !confirmDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {existingRating ? "Đánh giá của bạn" : `Đánh giá ${targetType === "seller" ? "người bán" : "người mua"}`}
            </DialogTitle>
            <DialogDescription>
              {existingRating 
                ? `Đánh giá của bạn cho ${targetName} trong phiên đấu giá "${auctionTitle}"`
                : `Chia sẻ trải nghiệm của bạn với ${targetName} trong phiên đấu giá "${auctionTitle}"`
              }
            </DialogDescription>
          </DialogHeader>

          {loadingRating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : existingRating ? (
            // Display existing rating (read-only)
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Đánh giá của bạn</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 ${
                        star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium text-foreground">
                    {getRatingLabel(rating)}
                  </span>
                </div>
              </div>

              {comment && (
                <div className="space-y-2">
                  <Label>Nhận xét của bạn</Label>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{comment}</p>
                  </div>
                </div>
              )}

              {existingRating.createdAt && (
                <div className="text-sm text-muted-foreground">
                  Đánh giá vào: {new Date(existingRating.createdAt).toLocaleString("vi-VN")}
                </div>
              )}
            </div>
          ) : (
            // Rating form (for new rating)
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
                      disabled={submitting}
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
                      {getRatingLabel(rating)}
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
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
              {existingRating ? "Đóng" : "Hủy"}
            </Button>
            {!existingRating && (
              <Button onClick={handleSubmitClick} disabled={rating === 0 || submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi đánh giá"
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Xác nhận gửi đánh giá</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn gửi đánh giá này? Đánh giá này sẽ được gửi đến {targetName} và không thể chỉnh sửa sau khi gửi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Đánh giá:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium text-foreground">{getRatingLabel(rating)}</span>
                </div>
              </div>
              {comment && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Nhận xét:</span>
                  <p className="text-sm text-foreground mt-1">{comment}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Xác nhận gửi"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
