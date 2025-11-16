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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { ItemsAPI } from "@/lib/api/items"
import { AuctionsAPI } from "@/lib/api/auctions"
import { ItemResponseDto, CategoryDto, CreateItemDto } from "@/lib/api/types"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUploadFile } from "@/components/ui/image-upload-file"

interface CreateAuctionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAuctionDialog({ open, onOpenChange }: CreateAuctionDialogProps) {
  const [step, setStep] = useState(1)
  const [itemMode, setItemMode] = useState<"select" | "create">("select")
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ItemResponseDto[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  
  // Item creation form
  const [newItemTitle, setNewItemTitle] = useState("")
  const [newItemCategoryId, setNewItemCategoryId] = useState<string>("")
  const [newItemDescription, setNewItemDescription] = useState("")
  const [newItemBasePrice, setNewItemBasePrice] = useState("")
  const [newItemCondition, setNewItemCondition] = useState("")
  const [newItemLocation, setNewItemLocation] = useState("")
  const [newItemImages, setNewItemImages] = useState<File[]>([])
  
  // Auction form
  const [startingBid, setStartingBid] = useState("")
  const [buyNowOption, setBuyNowOption] = useState<string>("no") // "yes" hoặc "no"
  const [buyNowPrice, setBuyNowPrice] = useState("")
  const [duration, setDuration] = useState("7")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customStartTime, setCustomStartTime] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [customEndTime, setCustomEndTime] = useState("")

  useEffect(() => {
    if (open && user) {
      loadApprovedItems()
      loadCategories()
      // Reset form khi mở dialog
      setStep(1)
      setSelectedItemId("")
      setStartingBid("")
      setBuyNowOption("no")
      setBuyNowPrice("")
      setDuration("7")
      setCustomStartDate("")
      setCustomStartTime("")
      setCustomEndDate("")
      setCustomEndTime("")
    }
  }, [open, user])

  // Tự động điền giá khởi điểm từ basePrice của item khi chọn sản phẩm
  useEffect(() => {
    if (selectedItemId) {
      const selectedItem = items.find(i => String(i.id) === selectedItemId)
      if (selectedItem && selectedItem.basePrice) {
        // Điền giá khởi điểm từ basePrice của item
        setStartingBid(selectedItem.basePrice.toString())
      }
    }
  }, [selectedItemId, items])

  const loadApprovedItems = async () => {
    if (!user) return
    try {
      setLoading(true)
      const sellerId = parseInt(user.id)
      console.log('Loading items for sellerId:', sellerId, 'user.id:', user.id)
      
      // Only load approved items - can only create auction for approved items
      const result = await ItemsAPI.getAllWithFilter({
        statuses: ["approved"],
        sellerId: sellerId,
        page: 1,
        pageSize: 100,
        sortBy: "CreatedAt",
        sortOrder: "desc"
      })
      
      console.log('Received items:', result.data.length, 'items')
      console.log('Items sellerIds:', result.data.map(i => ({ id: i.id, title: i.title, sellerId: i.sellerId })))
      
      // Filter out items that already have active auctions
      const availableItems = result.data.filter(item => 
        !item.auctionId || item.auctionStatus !== "active"
      )
      
      // Double-check: chỉ giữ lại items của seller hiện tại (bảo vệ bổ sung)
      const ownItems = availableItems.filter(item => item.sellerId === sellerId)
      console.log('Filtered to own items:', ownItems.length)
      
      setItems(ownItems)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await ItemsAPI.getCategories()
      setCategories(cats)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách danh mục",
        variant: "destructive"
      })
    }
  }

  const handleCreateItem = async () => {
    if (!user) return

    if (!newItemTitle.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên sản phẩm",
        variant: "destructive"
      })
      return
    }

    if (!newItemCategoryId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn danh mục",
        variant: "destructive"
      })
      return
    }

    if (!newItemBasePrice || parseFloat(newItemBasePrice) <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập giá cơ bản hợp lệ",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const sellerId = parseInt(user.id)
      const itemData: CreateItemDto = {
        sellerId,
        categoryId: parseInt(newItemCategoryId),
        title: newItemTitle,
        description: newItemDescription || undefined,
        basePrice: parseFloat(newItemBasePrice),
        condition: newItemCondition || undefined,
        location: newItemLocation || undefined
      }

      const createdItem = await ItemsAPI.createItem(itemData, newItemImages.length > 0 ? newItemImages : undefined)
      
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được tạo và đang chờ phê duyệt. Sau khi được admin phê duyệt, bạn có thể tạo phiên đấu giá."
      })

      // Reset form
      setNewItemTitle("")
      setNewItemCategoryId("")
      setNewItemDescription("")
      setNewItemBasePrice("")
      setNewItemCondition("")
      setNewItemLocation("")
      setNewItemImages([])
      
      // Reload items to include the new one
      await loadApprovedItems()
      
      // Switch to select mode but don't auto-select or proceed
      // User needs to wait for admin approval first
      setItemMode("select")
      
      // Don't proceed to next step - item needs approval first
      // User will need to come back later after admin approves
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo sản phẩm",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateEndTime = (startTime: Date, days: number): Date => {
    const end = new Date(startTime)
    end.setDate(end.getDate() + days)
    return end
  }

  const handleSubmit = async () => {
    console.log('handleSubmit called', { user, selectedItemId, startingBid, duration })
    
    if (!user || !selectedItemId) {
      console.error('Validation failed: missing user or selectedItemId', { user: !!user, selectedItemId })
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn sản phẩm",
        variant: "destructive"
      })
      return
    }

    if (!startingBid || parseFloat(startingBid) <= 0) {
      console.error('Validation failed: invalid startingBid', { startingBid })
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập giá khởi điểm hợp lệ",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      console.log('Starting auction creation...')
      const sellerId = parseInt(user.id)
      const itemId = parseInt(selectedItemId)
      
      console.log('Parsed IDs:', { sellerId, itemId })

      // Calculate start and end times
      let startTime: Date
      let endTime: Date

      console.log('Calculating times, duration:', duration)

      if (duration === "custom") {
        console.log('Using custom time:', { customStartDate, customStartTime, customEndDate, customEndTime })
        if (!customStartDate || !customStartTime || !customEndDate || !customEndTime) {
          setLoading(false)
          toast({
            title: "Lỗi",
            description: "Vui lòng nhập đầy đủ thời gian",
            variant: "destructive"
          })
          return
        }
        startTime = new Date(`${customStartDate}T${customStartTime}`)
        endTime = new Date(`${customEndDate}T${customEndTime}`)
      } else {
        console.log('Using preset duration:', duration, 'days')
        const now = new Date()
        startTime = new Date(now)
        startTime.setMinutes(0)
        startTime.setSeconds(0)
        startTime.setMilliseconds(0)
        // Add 1 hour to start time to ensure it's in the future
        startTime.setHours(startTime.getHours() + 1)
        endTime = calculateEndTime(startTime, parseInt(duration))
      }

      console.log('Calculated times:', { 
        startTime: startTime.toISOString(), 
        endTime: endTime.toISOString(),
        startTimeValue: startTime.getTime(),
        endTimeValue: endTime.getTime(),
        now: new Date().toISOString()
      })

      // Validate times
      const now = new Date()
      if (startTime >= endTime) {
        console.error('Validation failed: startTime >= endTime', {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        })
        setLoading(false)
        toast({
          title: "Lỗi",
          description: "Thời gian kết thúc phải sau thời gian bắt đầu",
          variant: "destructive"
        })
        return
      }

      // Allow start time to be in the past by a small margin (5 minutes) to handle timezone issues
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      if (startTime < fiveMinutesAgo) {
        console.error('Validation failed: startTime too far in past', { 
          startTime: startTime.toISOString(), 
          now: now.toISOString(),
          fiveMinutesAgo: fiveMinutesAgo.toISOString()
        })
        setLoading(false)
        toast({
          title: "Lỗi",
          description: "Thời gian bắt đầu không thể quá xa trong quá khứ",
          variant: "destructive"
        })
        return
      }

      // Validation: Đảm bảo item được chọn thuộc về seller hiện tại
      const selectedItem = items.find(i => String(i.id) === selectedItemId)
      if (!selectedItem) {
        toast({
          title: "Lỗi",
          description: "Sản phẩm không tồn tại hoặc không thuộc về bạn",
          variant: "destructive"
        })
        setLoading(false)
        return
      }
      
      if (selectedItem.sellerId !== sellerId) {
        toast({
          title: "Lỗi",
          description: "Bạn chỉ có thể tạo phiên đấu giá cho sản phẩm của chính mình",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      const auctionData = {
        itemId,
        sellerId,
        startingBid: parseFloat(startingBid),
        // Chỉ gửi buyNowPrice nếu chọn "Có" và có giá trị
        buyNowPrice: buyNowOption === "yes" && buyNowPrice ? parseFloat(buyNowPrice) : undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      }

      console.log('Auction data to send:', auctionData)
      
      try {
        const result = await AuctionsAPI.create(auctionData)
        console.log('Auction created successfully:', result)

        toast({
          title: "Thành công",
          description: "Phiên đấu giá đã được tạo và đang hoạt động"
        })

        // Reload items to update the list (hide item with active auction)
        await loadApprovedItems()

        onOpenChange(false)
        // Reset form
        setStep(1)
        setSelectedItemId("")
        setStartingBid("")
        setBuyNowOption("no")
        setBuyNowPrice("")
        setDuration("7")
        setCustomStartDate("")
        setCustomStartTime("")
        setCustomEndDate("")
        setCustomEndTime("")
      } catch (apiError: any) {
        console.error('Error calling API:', apiError)
        throw apiError // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      console.error('Error creating auction:', error)
      const errorMessage = error?.message || error?.error || "Không thể tạo phiên đấu giá"
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo phiên đấu giá mới</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Chọn hoặc tạo sản phẩm để đấu giá" : `Bước ${step}/3`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <Tabs value={itemMode} onValueChange={(v) => setItemMode(v as "select" | "create")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="select">Chọn sản phẩm có sẵn</TabsTrigger>
                <TabsTrigger value="create">Tạo sản phẩm mới</TabsTrigger>
              </TabsList>

              <TabsContent value="select" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="item">Chọn sản phẩm đã được phê duyệt</Label>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                  <p className="mb-2">Bạn chưa có sản phẩm nào đã được phê duyệt.</p>
                  <p className="text-xs">Vui lòng tạo sản phẩm mới và chờ admin phê duyệt trước khi tạo phiên đấu giá.</p>
                </div>
              ) : (
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger id="item">
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.title} - {item.basePrice?.toLocaleString('vi-VN')} VNĐ
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedItemId && (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  {(() => {
                    const item = items.find(i => String(i.id) === selectedItemId)
                    return item ? (
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold">{item.title}</p>
                        {item.description && (
                          <p className="text-muted-foreground">{item.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <p>Giá khởi điểm: <span className="font-medium">{item.basePrice?.toLocaleString('vi-VN')} VNĐ</span></p>
                          <p>Danh mục: <span className="font-medium">{item.categoryName}</span></p>
                        </div>
                        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-2 mt-2">
                          <p className="text-xs text-green-800 dark:text-green-300">
                            ✅ Sản phẩm đã được phê duyệt. Bạn có thể tạo phiên đấu giá cho sản phẩm này.
                          </p>
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              )}
            </div>
              </TabsContent>

              <TabsContent value="create" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newItemTitle">Tên sản phẩm *</Label>
                    <Input 
                      id="newItemTitle" 
                      placeholder="VD: iPhone 15 Pro Max 256GB" 
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newItemCategory">Danh mục *</Label>
                    <Select value={newItemCategoryId} onValueChange={setNewItemCategoryId}>
                      <SelectTrigger id="newItemCategory">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newItemDescription">Mô tả chi tiết</Label>
                    <Textarea 
                      id="newItemDescription" 
                      placeholder="Mô tả chi tiết về sản phẩm, tình trạng, xuất xứ..." 
                      rows={4}
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newItemBasePrice">Giá khởi điểm (VNĐ) *</Label>
                      <Input 
                        id="newItemBasePrice" 
                        type="number" 
                        placeholder="VD: 20000000" 
                        value={newItemBasePrice}
                        onChange={(e) => setNewItemBasePrice(e.target.value)}
                        min="0"
                        step="1000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newItemCondition">Tình trạng</Label>
                      <Select value={newItemCondition} onValueChange={setNewItemCondition}>
                        <SelectTrigger id="newItemCondition">
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newItemLocation">Địa điểm</Label>
                    <Input 
                      id="newItemLocation" 
                      placeholder="VD: Hà Nội, Việt Nam" 
                      value={newItemLocation}
                      onChange={(e) => setNewItemLocation(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hình ảnh sản phẩm</Label>
                    <ImageUploadFile
                      files={newItemImages}
                      onChange={setNewItemImages}
                      maxImages={10}
                      maxSizeMB={10}
                    />
                  </div>

                  <div className="rounded-lg border border-border bg-blue-50 dark:bg-blue-950/20 p-4">
                    <p className="text-sm text-muted-foreground">
                      Sản phẩm sẽ được tạo với trạng thái "Chờ phê duyệt". Sau khi được admin phê duyệt, bạn mới có thể tạo phiên đấu giá cho sản phẩm này.
                    </p>
                  </div>

                  <Button 
                    onClick={handleCreateItem} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      "Tạo sản phẩm"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startPrice">Bạn muốn thay đổi giá khởi điểm? (VNĐ) *</Label>
                <Input 
                  id="startPrice" 
                  type="number" 
                  placeholder="VD: 1000000" 
                  value={startingBid}
                  onChange={(e) => setStartingBid(e.target.value)}
                  min="0"
                  step="1000"
                />
                {selectedItemId && (() => {
                  const item = items.find(i => String(i.id) === selectedItemId)
                  return item?.basePrice ? (
                    <p className="text-xs text-muted-foreground">
                      Giá khởi điểm ban đầu: {item.basePrice.toLocaleString('vi-VN')} VNĐ
                    </p>
                  ) : null
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyNowOption">Bạn có muốn thiếp lập giá mua ngay?</Label>
                <Select value={buyNowOption} onValueChange={(value) => {
                  setBuyNowOption(value)
                  // Reset giá mua ngay khi chọn "Không"
                  if (value === "no") {
                    setBuyNowPrice("")
                  }
                }}>
                  <SelectTrigger id="buyNowOption">
                    <SelectValue placeholder="Chọn tùy chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Không</SelectItem>
                    <SelectItem value="yes">Có</SelectItem>
                  </SelectContent>
                </Select>
                {buyNowOption === "yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="buyNowPrice">Giá mua ngay (VNĐ) *</Label>
                    <Input 
                      id="buyNowPrice" 
                      type="number" 
                      placeholder="VD: 5000000" 
                      value={buyNowPrice}
                      onChange={(e) => setBuyNowPrice(e.target.value)}
                      min="0"
                      step="1000"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Thiết lập thời gian đấu giá</Label>
              <Select value={duration} onValueChange={setDuration}>
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

            {duration === "custom" && (
              <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-border bg-muted/50 p-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Ngày bắt đầu</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Giờ bắt đầu</Label>
                  <Input 
                    id="startTime" 
                    type="time" 
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Ngày kết thúc</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Giờ kết thúc</Label>
                  <Input 
                    id="endTime" 
                    type="time" 
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="mb-4 font-semibold text-foreground">Xem trước thông tin phiên đấu giá</h4>
              <div className="space-y-2 text-sm">
                {(() => {
                  const item = items.find(i => String(i.id) === selectedItemId)
                  const startTime = duration === "custom" && customStartDate && customStartTime
                    ? new Date(`${customStartDate}T${customStartTime}`)
                    : new Date()
                  const endTime = duration === "custom" && customEndDate && customEndTime
                    ? new Date(`${customEndDate}T${customEndTime}`)
                    : calculateEndTime(startTime, parseInt(duration))
                  
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Sản phẩm:</span>
                        <span className="font-medium">{item?.title}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Giá khởi điểm:</span>
                        <span className="font-medium">{parseFloat(startingBid || "0").toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                      {buyNowOption === "yes" && buyNowPrice && (
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-muted-foreground">Giá mua ngay:</span>
                          <span className="font-medium">{parseFloat(buyNowPrice).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Thời gian bắt đầu:</span>
                        <span className="font-medium">{startTime.toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Thời gian kết thúc:</span>
                        <span className="font-medium">{endTime.toLocaleString('vi-VN')}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-blue-50 dark:bg-blue-950/20 p-4">
              <h4 className="mb-2 font-semibold text-foreground">Lưu ý</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Phiên đấu giá sẽ bắt đầu ngay sau khi được tạo</p>
                <p>• Phiên đấu giá sẽ tự động kết thúc theo thời gian đã đặt</p>
                <p>• Sản phẩm đã có phiên đấu giá active sẽ không hiển thị trong danh sách chọn</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                if (!loading) {
                  setStep(step - 1)
                }
              }} 
              disabled={loading}
            >
              Quay lại
            </Button>
          )}
          {step < 3 ? (
            <Button 
              onClick={() => {
                if (step === 1) {
                  if (itemMode === "select" && !selectedItemId) {
                    toast({
                      title: "Lỗi",
                      description: "Vui lòng chọn sản phẩm",
                      variant: "destructive"
                    })
                    return
                  }
                  // If creating item, don't proceed - user needs to create item first
                  if (itemMode === "create") {
                    return
                  }
                }
                if (step === 2 && (!startingBid || parseFloat(startingBid) <= 0)) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng nhập giá khởi điểm hợp lệ",
                    variant: "destructive"
                  })
                  return
                }
                setStep(step + 1)
              }}
              disabled={loading || (step === 1 && itemMode === "create")}
            >
              Tiếp tục
            </Button>
          ) : (
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Create auction button clicked', { 
                  step, 
                  selectedItemId, 
                  startingBid, 
                  loading,
                  user: !!user 
                })
                if (!loading) {
                  handleSubmit()
                }
              }} 
              disabled={loading}
              className="min-w-[150px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo phiên đấu giá"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
