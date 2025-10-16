"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"
import { useState } from "react"

interface CreateAuctionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAuctionDialog({ open, onOpenChange }: CreateAuctionDialogProps) {
  const [step, setStep] = useState(1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo phiên đấu giá mới</DialogTitle>
          <DialogDescription>Điền thông tin sản phẩm để tạo phiên đấu giá. Bước {step}/3</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tên sản phẩm</Label>
              <Input id="title" placeholder="VD: iPhone 15 Pro Max 256GB" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              <Select>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Điện tử</SelectItem>
                  <SelectItem value="collectibles">Sưu tầm</SelectItem>
                  <SelectItem value="art">Nghệ thuật</SelectItem>
                  <SelectItem value="fashion">Thời trang</SelectItem>
                  <SelectItem value="home">Nhà cửa</SelectItem>
                  <SelectItem value="sports">Thể thao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả chi tiết</Label>
              <Textarea id="description" placeholder="Mô tả chi tiết về sản phẩm, tình trạng, xuất xứ..." rows={5} />
            </div>

            <div className="space-y-2">
              <Label>Hình ảnh sản phẩm</Label>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-12 transition-colors hover:border-primary">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Kéo thả hoặc click để tải ảnh lên</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG tối đa 10MB</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startPrice">Giá khởi điểm</Label>
                <Input id="startPrice" type="number" placeholder="VD: 1000000" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyNowPrice">Giá mua ngay (tùy chọn)</Label>
                <Input id="buyNowPrice" type="number" placeholder="VD: 5000000" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minIncrement">Bước giá tối thiểu</Label>
                <Input id="minIncrement" type="number" placeholder="VD: 100000" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit">Tiền đặt cọc (%)</Label>
                <Input id="deposit" type="number" placeholder="VD: 10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Thời gian đấu giá</Label>
              <Select>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Chọn thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 ngày</SelectItem>
                  <SelectItem value="3">3 ngày</SelectItem>
                  <SelectItem value="7">7 ngày</SelectItem>
                  <SelectItem value="14">14 ngày</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shipping">Phương thức vận chuyển</Label>
              <Select>
                <SelectTrigger id="shipping">
                  <SelectValue placeholder="Chọn phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Tiêu chuẩn (3-5 ngày)</SelectItem>
                  <SelectItem value="express">Nhanh (1-2 ngày)</SelectItem>
                  <SelectItem value="pickup">Gặp mặt trực tiếp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Địa điểm</Label>
              <Input id="location" placeholder="VD: Hà Nội, Việt Nam" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Tình trạng sản phẩm</Label>
              <Select>
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Chọn tình trạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Mới 100%</SelectItem>
                  <SelectItem value="like-new">Như mới</SelectItem>
                  <SelectItem value="good">Tốt</SelectItem>
                  <SelectItem value="fair">Khá</SelectItem>
                  <SelectItem value="used">Đã sử dụng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="mb-2 font-semibold text-foreground">Xem trước</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Phiên đấu giá sẽ được xem xét trong vòng 24 giờ</p>
                <p>Bạn sẽ nhận được thông báo khi phiên đấu giá được phê duyệt</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Quay lại
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Tiếp tục</Button>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Tạo phiên đấu giá</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
