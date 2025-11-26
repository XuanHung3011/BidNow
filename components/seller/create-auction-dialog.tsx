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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [itemValidationErrors, setItemValidationErrors] = useState<Record<string, string>>({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [auctionValidationErrors, setAuctionValidationErrors] = useState<Record<string, string>>({})
  const [showConfirmAuctionDialog, setShowConfirmAuctionDialog] = useState(false)
  const [showAuctionSuccessMessage, setShowAuctionSuccessMessage] = useState(false)
  
  // Auction form
  const [startingBid, setStartingBid] = useState("")
  const [buyNowOption, setBuyNowOption] = useState<string>("no") // "yes" hoặc "no"
  const [buyNowPrice, setBuyNowPrice] = useState("")
  const [duration, setDuration] = useState("custom")
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
      setDuration("custom")
      setCustomStartDate("")
      setCustomStartTime("")
      setCustomEndDate("")
      setCustomEndTime("")
      // Reset item form
      setNewItemTitle("")
      setNewItemCategoryId("")
      setNewItemDescription("")
      setNewItemBasePrice("")
      setNewItemCondition("")
      setNewItemLocation("")
      setNewItemImages([])
      setItemValidationErrors({})
      setShowConfirmDialog(false)
      setShowSuccessMessage(false)
      setAuctionValidationErrors({})
      setShowConfirmAuctionDialog(false)
      setShowAuctionSuccessMessage(false)
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

  const validateItemForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Validate tên sản phẩm
    if (!newItemTitle.trim()) {
      errors.title = "Tên sản phẩm là bắt buộc"
    } else if (newItemTitle.trim().length < 3) {
      errors.title = "Tên sản phẩm phải có ít nhất 3 ký tự"
    } else if (newItemTitle.trim().length > 255) {
      errors.title = "Tên sản phẩm không được vượt quá 255 ký tự"
    }

    // Validate danh mục
    if (!newItemCategoryId) {
      errors.categoryId = "Vui lòng chọn danh mục"
    }

    // Validate giá khởi điểm
    if (!newItemBasePrice || newItemBasePrice.trim() === "") {
      errors.basePrice = "Giá khởi điểm là bắt buộc"
    } else {
      const price = parseFloat(newItemBasePrice)
      if (isNaN(price) || price <= 0) {
        errors.basePrice = "Giá khởi điểm phải lớn hơn 0"
      } else if (price < 1000) {
        errors.basePrice = "Giá khởi điểm tối thiểu là 1,000 VNĐ"
      }
    }

    // Validate mô tả (optional but if provided, check length)
    if (newItemDescription && newItemDescription.length > 2000) {
      errors.description = "Mô tả không được vượt quá 2000 ký tự"
    }

    // Validate địa điểm (optional but if provided, check length)
    if (newItemLocation && newItemLocation.length > 255) {
      errors.location = "Địa điểm không được vượt quá 255 ký tự"
    }

    // Validate hình ảnh (optional but if provided, check count and size)
    if (newItemImages.length > 10) {
      errors.images = "Tối đa 10 hình ảnh"
    }
    for (let i = 0; i < newItemImages.length; i++) {
      const file = newItemImages[i]
      if (file.size > 10 * 1024 * 1024) {
        errors.images = `Hình ảnh ${i + 1} vượt quá 10MB`
        break
      }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!validTypes.includes(file.type)) {
        errors.images = `Hình ảnh ${i + 1} phải là định dạng JPG hoặc PNG`
        break
      }
    }

    setItemValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateItemClick = () => {
    if (!validateItemForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(itemValidationErrors)[0]
      if (firstErrorField) {
        const element = document.getElementById(`newItem${firstErrorField.charAt(0).toUpperCase() + firstErrorField.slice(1)}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element?.focus()
      }
      return
    }
    setShowConfirmDialog(true)
  }

  const handleConfirmCreateItem = async () => {
    if (!user) return

    setShowConfirmDialog(false)

    try {
      setLoading(true)
      const sellerId = parseInt(user.id)
      const itemData: CreateItemDto = {
        sellerId,
        categoryId: parseInt(newItemCategoryId),
        title: newItemTitle.trim(),
        description: newItemDescription.trim() || undefined,
        basePrice: parseFloat(newItemBasePrice),
        condition: newItemCondition || undefined,
        location: newItemLocation.trim() || undefined
      }

      await ItemsAPI.createItem(itemData, newItemImages.length > 0 ? newItemImages : undefined)
      
      // Show success message
      setShowSuccessMessage(true)

      // Reset form
      setNewItemTitle("")
      setNewItemCategoryId("")
      setNewItemDescription("")
      setNewItemBasePrice("")
      setNewItemCondition("")
      setNewItemLocation("")
      setNewItemImages([])
      setItemValidationErrors({})
      
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

  const validateAuctionForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Validate giá khởi điểm
    if (!startingBid || startingBid.trim() === "") {
      errors.startingBid = "Giá khởi điểm là bắt buộc"
    } else {
      const price = parseFloat(startingBid)
      if (isNaN(price) || price <= 0) {
        errors.startingBid = "Giá khởi điểm phải lớn hơn 0"
      } else if (price < 1000) {
        errors.startingBid = "Giá khởi điểm tối thiểu là 1,000 VNĐ"
      }
    }
    
    // Validate giá mua ngay nếu có chọn
    if (buyNowOption === "yes") {
      if (!buyNowPrice || buyNowPrice.trim() === "") {
        errors.buyNowPrice = "Giá mua ngay là bắt buộc khi chọn tùy chọn này"
      } else {
        const buyNow = parseFloat(buyNowPrice)
        const startPrice = parseFloat(startingBid || "0")
        if (isNaN(buyNow) || buyNow <= 0) {
          errors.buyNowPrice = "Giá mua ngay phải lớn hơn 0"
        } else if (buyNow <= startPrice) {
          errors.buyNowPrice = "Giá mua ngay phải lớn hơn giá khởi điểm"
        }
      }
    }
    
    // Validate thời gian (bắt buộc phải nhập)
    if (!customStartDate || !customStartTime) {
      errors.customTime = "Vui lòng nhập đầy đủ ngày và giờ bắt đầu"
    } else if (!customEndDate || !customEndTime) {
      errors.customTime = "Vui lòng nhập đầy đủ ngày và giờ kết thúc"
    } else {
      const start = new Date(`${customStartDate}T${customStartTime}`)
      const end = new Date(`${customEndDate}T${customEndTime}`)
      if (start >= end) {
        errors.customTime = "Thời gian kết thúc phải sau thời gian bắt đầu"
      }
      const now = new Date()
      // Check local time (user-friendly)
      // Backend will handle UTC conversion, so we only validate local time here
      if (start < now) {
        errors.customTime = "Thời gian bắt đầu không thể trong quá khứ"
      }
    }
    
    setAuctionValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitClick = () => {
    console.log('handleSubmitClick called')
    console.log('Form values:', {
      selectedItemId,
      startingBid,
      buyNowOption,
      buyNowPrice,
      duration,
      customStartDate,
      customStartTime,
      customEndDate,
      customEndTime
    })
    
    if (!validateAuctionForm()) {
      console.error('Validation failed:', auctionValidationErrors)
      const firstError = Object.values(auctionValidationErrors)[0]
      if (firstError) {
        toast({
          title: "Lỗi validation",
          description: firstError,
          variant: "destructive"
        })
      }
      // Scroll to first error
      const firstErrorField = Object.keys(auctionValidationErrors)[0]
      if (firstErrorField === "startingBid") {
        document.getElementById("startPrice")?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        document.getElementById("startPrice")?.focus()
      } else if (firstErrorField === "buyNowPrice") {
        document.getElementById("buyNowPrice")?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        document.getElementById("buyNowPrice")?.focus()
      } else if (firstErrorField === "customTime") {
        document.getElementById("startDate")?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    console.log('Validation passed, showing confirm dialog')
    setShowConfirmAuctionDialog(true)
  }

  const handleSubmit = async () => {
    console.log('handleSubmit called', { user: !!user, selectedItemId, step })
    
    if (!user || !selectedItemId) {
      console.error('Validation failed: missing user or selectedItemId', { user: !!user, selectedItemId })
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn sản phẩm",
        variant: "destructive"
      })
      return
    }

    setShowConfirmAuctionDialog(false)

    try {
      setLoading(true)
      console.log('Starting auction creation...')
      const sellerId = parseInt(user.id)
      const itemId = parseInt(selectedItemId)
      console.log('Parsed IDs:', { sellerId, itemId })

      // Calculate start and end times
      let startTime: Date
      let endTime: Date
      const now = new Date()
      const nowUTC = new Date() // Current UTC time

      console.log('Calculating times, duration:', duration)

      // Always use custom datetime - interpret as local time
      console.log('Using custom time:', { customStartDate, customStartTime, customEndDate, customEndTime })
      
      if (!customStartDate || !customStartTime || !customEndDate || !customEndTime) {
        setLoading(false)
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc",
          variant: "destructive"
        })
        return
      }
      
      startTime = new Date(`${customStartDate}T${customStartTime}`)
      endTime = new Date(`${customEndDate}T${customEndTime}`)
      console.log('Parsed custom times:', {
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        startTimeISO: startTime.toISOString(),
        endTimeISO: endTime.toISOString()
      })

      console.log('Calculated times:', { 
        startTime: startTime.toISOString(), 
        endTime: endTime.toISOString(),
        startTimeValue: startTime.getTime(),
        endTimeValue: endTime.getTime(),
        now: new Date().toISOString()
      })

      // Validate times (local time check for user-friendly validation)
      console.log('Validating times...')
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

      if (startTime < now) {
        console.error('Validation failed: startTime < now', {
          startTime: startTime.toISOString(),
          now: now.toISOString()
        })
        setLoading(false)
        toast({
          title: "Lỗi",
          description: "Thời gian bắt đầu không thể trong quá khứ",
          variant: "destructive"
        })
        return
      }

      // Note: Backend will handle UTC to local time conversion
      // Backend converts UTC time from frontend to Vietnam local time (UTC+7)
      // and compares with DateTime.Now (local time)
      // So we only need to validate local time here
      console.log('Time validation passed (local time)')

      // Validation: Đảm bảo item được chọn thuộc về seller hiện tại
      console.log('Validating item ownership...')
      const selectedItem = items.find(i => String(i.id) === selectedItemId)
      if (!selectedItem) {
        console.error('Validation failed: item not found', { selectedItemId, items: items.map(i => ({ id: i.id, sellerId: i.sellerId })) })
        toast({
          title: "Lỗi",
          description: "Sản phẩm không tồn tại hoặc không thuộc về bạn",
          variant: "destructive"
        })
        setLoading(false)
        return
      }
      
      console.log('Selected item:', { id: selectedItem.id, sellerId: selectedItem.sellerId, currentSellerId: sellerId })
      if (selectedItem.sellerId !== sellerId) {
        console.error('Validation failed: item does not belong to seller', {
          itemSellerId: selectedItem.sellerId,
          currentSellerId: sellerId
        })
        toast({
          title: "Lỗi",
          description: "Bạn chỉ có thể tạo phiên đấu giá cho sản phẩm của chính mình",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      console.log('Item validation passed')

      // Convert local time to ISO string (UTC) for backend
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
      console.log('Start time details:', {
        local: startTime.toString(),
        utc: startTime.toISOString(),
        timestamp: startTime.getTime(),
        now: Date.now(),
        diff: startTime.getTime() - Date.now(),
        diffMinutes: (startTime.getTime() - Date.now()) / 1000 / 60
      })
      
      console.log('Calling AuctionsAPI.create...')
      try {
        const result = await AuctionsAPI.create(auctionData)
        console.log('Auction created successfully:', result)
      } catch (apiError: any) {
        console.error('Error calling API:', apiError)
        throw apiError // Re-throw to be caught by outer catch
      }

      // Show success message
      setShowAuctionSuccessMessage(true)

      // Reload items to update the list (hide item with active auction)
      await loadApprovedItems()

      // Reset form
      setStep(1)
      setSelectedItemId("")
      setStartingBid("")
      setBuyNowOption("no")
      setBuyNowPrice("")
      setDuration("custom")
      setCustomStartDate("")
      setCustomStartTime("")
      setCustomEndDate("")
      setCustomEndTime("")
      setAuctionValidationErrors({})
      
      // Close dialog after showing success message
      setTimeout(() => {
        onOpenChange(false)
      }, 2000)
    } catch (error: any) {
      console.error('Error creating auction:', error)
      const errorMessage = error?.message || error?.error || "Không thể tạo phiên đấu giá"
      console.error('Error message:', errorMessage)
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
                      onChange={(e) => {
                        setNewItemTitle(e.target.value)
                        if (itemValidationErrors.title) {
                          setItemValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.title
                            return newErrors
                          })
                        }
                      }}
                      className={itemValidationErrors.title ? "border-red-500" : ""}
                    />
                    {itemValidationErrors.title && (
                      <p className="text-sm text-red-500">{itemValidationErrors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newItemCategory">Danh mục *</Label>
                    <Select 
                      value={newItemCategoryId} 
                      onValueChange={(value) => {
                        setNewItemCategoryId(value)
                        if (itemValidationErrors.categoryId) {
                          setItemValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.categoryId
                            return newErrors
                          })
                        }
                      }}
                    >
                      <SelectTrigger 
                        id="newItemCategory"
                        className={itemValidationErrors.categoryId ? "border-red-500" : ""}
                      >
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
                    {itemValidationErrors.categoryId && (
                      <p className="text-sm text-red-500">{itemValidationErrors.categoryId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newItemDescription">Mô tả chi tiết</Label>
                    <Textarea 
                      id="newItemDescription" 
                      placeholder="Mô tả chi tiết về sản phẩm, tình trạng, xuất xứ..." 
                      rows={4}
                      value={newItemDescription}
                      onChange={(e) => {
                        setNewItemDescription(e.target.value)
                        if (itemValidationErrors.description) {
                          setItemValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.description
                            return newErrors
                          })
                        }
                      }}
                      className={itemValidationErrors.description ? "border-red-500" : ""}
                    />
                    {itemValidationErrors.description && (
                      <p className="text-sm text-red-500">{itemValidationErrors.description}</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newItemBasePrice">Giá khởi điểm (VNĐ) *</Label>
                      <Input 
                        id="newItemBasePrice" 
                        type="number" 
                        placeholder="VD: 20000000" 
                        value={newItemBasePrice}
                        onChange={(e) => {
                          setNewItemBasePrice(e.target.value)
                          if (itemValidationErrors.basePrice) {
                            setItemValidationErrors(prev => {
                              const newErrors = { ...prev }
                              delete newErrors.basePrice
                              return newErrors
                            })
                          }
                        }}
                        min="0"
                        step="1000"
                        className={itemValidationErrors.basePrice ? "border-red-500" : ""}
                      />
                      {itemValidationErrors.basePrice && (
                        <p className="text-sm text-red-500">{itemValidationErrors.basePrice}</p>
                      )}
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
                      onChange={(e) => {
                        setNewItemLocation(e.target.value)
                        if (itemValidationErrors.location) {
                          setItemValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.location
                            return newErrors
                          })
                        }
                      }}
                      className={itemValidationErrors.location ? "border-red-500" : ""}
                    />
                    {itemValidationErrors.location && (
                      <p className="text-sm text-red-500">{itemValidationErrors.location}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Hình ảnh sản phẩm</Label>
                    <ImageUploadFile
                      files={newItemImages}
                      onChange={(files) => {
                        setNewItemImages(files)
                        if (itemValidationErrors.images) {
                          setItemValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.images
                            return newErrors
                          })
                        }
                      }}
                      maxImages={10}
                      maxSizeMB={10}
                    />
                    {itemValidationErrors.images && (
                      <p className="text-sm text-red-500">{itemValidationErrors.images}</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-border bg-blue-50 dark:bg-blue-950/20 p-4">
                    <p className="text-sm text-muted-foreground">
                      Sản phẩm sẽ được tạo với trạng thái "Chờ phê duyệt". Sau khi được admin phê duyệt, bạn mới có thể tạo phiên đấu giá cho sản phẩm này.
                    </p>
                  </div>

                  <Button 
                    onClick={handleCreateItemClick} 
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
                  onChange={(e) => {
                    setStartingBid(e.target.value)
                    if (auctionValidationErrors.startingBid) {
                      setAuctionValidationErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.startingBid
                        return newErrors
                      })
                    }
                  }}
                  min="0"
                  step="1000"
                  className={auctionValidationErrors.startingBid ? "border-red-500" : ""}
                />
                {auctionValidationErrors.startingBid && (
                  <p className="text-sm text-red-500">{auctionValidationErrors.startingBid}</p>
                )}
                {selectedItemId && (() => {
                  const item = items.find(i => String(i.id) === selectedItemId)
                  return item?.basePrice ? (
                    <p className="text-xs text-muted-foreground">
                      {/* Giá khởi điểm ban đầu: {item.basePrice.toLocaleString('vi-VN')} VNĐ */}
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
                    setAuctionValidationErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.buyNowPrice
                      return newErrors
                    })
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
                      onChange={(e) => {
                        setBuyNowPrice(e.target.value)
                        if (auctionValidationErrors.buyNowPrice) {
                          setAuctionValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.buyNowPrice
                            return newErrors
                          })
                        }
                      }}
                      min="0"
                      step="1000"
                      className={auctionValidationErrors.buyNowPrice ? "border-red-500" : ""}
                    />
                    {auctionValidationErrors.buyNowPrice && (
                      <p className="text-sm text-red-500">{auctionValidationErrors.buyNowPrice}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Thiết lập thời gian đấu giá *</Label>
                <p className="text-sm text-muted-foreground">
                  Vui lòng chọn thời gian bắt đầu và kết thúc cho phiên đấu giá
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-border bg-muted/50 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value)
                        if (auctionValidationErrors.customTime) {
                          setAuctionValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.customTime
                            return newErrors
                          })
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className={auctionValidationErrors.customTime ? "border-red-500" : ""}
                    />
                  </div>
                   <div className="space-y-2">
                     <Label htmlFor="startTime">Thời gian bắt đầu: *</Label>
                     <Input 
                       id="startTime" 
                       type="time" 
                       value={customStartTime}
                       onChange={(e) => {
                         setCustomStartTime(e.target.value)
                         if (auctionValidationErrors.customTime) {
                           setAuctionValidationErrors(prev => {
                             const newErrors = { ...prev }
                             delete newErrors.customTime
                             return newErrors
                           })
                         }
                       }}
                       className={auctionValidationErrors.customTime ? "border-red-500" : ""}
                     />
                     {/* <p className="text-xs text-muted-foreground">Định dạng: 00:00 - 23:59 (24 giờ, không dùng AM/PM)</p> */}
                   </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Ngày kết thúc *</Label>
                    <Input 
                      id="endDate" 
                      type="date" 
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value)
                        if (auctionValidationErrors.customTime) {
                          setAuctionValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.customTime
                            return newErrors
                          })
                        }
                      }}
                      min={customStartDate || new Date().toISOString().split('T')[0]}
                      className={auctionValidationErrors.customTime ? "border-red-500" : ""}
                    />
                  </div>
                   <div className="space-y-2">
                     <Label htmlFor="endTime">Thời gian kết thúc *</Label>
                     <Input 
                       id="endTime" 
                       type="time" 
                       value={customEndTime}
                       onChange={(e) => {
                         setCustomEndTime(e.target.value)
                         if (auctionValidationErrors.customTime) {
                           setAuctionValidationErrors(prev => {
                             const newErrors = { ...prev }
                             delete newErrors.customTime
                             return newErrors
                           })
                         }
                       }}
                       className={auctionValidationErrors.customTime ? "border-red-500" : ""}
                     />
                     {/* <p className="text-xs text-muted-foreground">Định dạng: 00:00 - 23:59 (24 giờ, không dùng AM/PM)</p> */}
                   </div>
                </div>
                {auctionValidationErrors.customTime && (
                  <p className="text-sm text-red-500">{auctionValidationErrors.customTime}</p>
                )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="mb-4 font-semibold text-foreground">Xem trước thông tin phiên đấu giá</h4>
              <div className="space-y-2 text-sm">
                {(() => {
                  const item = items.find(i => String(i.id) === selectedItemId)
                  const startTime = customStartDate && customStartTime
                    ? new Date(`${customStartDate}T${customStartTime}`)
                    : new Date()
                  const endTime = customEndDate && customEndTime
                    ? new Date(`${customEndDate}T${customEndTime}`)
                    : new Date()
                  
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
                 if (step === 2) {
                   if (!validateAuctionForm()) {
                     // Scroll to first error
                     const firstErrorField = Object.keys(auctionValidationErrors)[0]
                     if (firstErrorField === "startingBid") {
                       document.getElementById("startPrice")?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                       document.getElementById("startPrice")?.focus()
                     } else if (firstErrorField === "buyNowPrice") {
                       document.getElementById("buyNowPrice")?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                       document.getElementById("buyNowPrice")?.focus()
                     } else if (firstErrorField === "customTime") {
                       document.getElementById("startDate")?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                     }
                     return
                   }
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
                 if (!loading) {
                   handleSubmitClick()
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận tạo sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn tạo sản phẩm này? Sản phẩm sẽ được gửi cho admin phê duyệt trước khi có thể sử dụng để tạo phiên đấu giá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreateItem}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {/* Success Message Dialog */}
       <AlertDialog open={showSuccessMessage} onOpenChange={setShowSuccessMessage}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle className="text-green-600 dark:text-green-400">
               Thành công!
             </AlertDialogTitle>
             <AlertDialogDescription>
               Sản phẩm đã được gửi đi cho admin phê duyệt. Bạn sẽ nhận được thông báo khi sản phẩm được phê duyệt.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogAction onClick={() => setShowSuccessMessage(false)}>
               Đóng
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

       {/* Confirm Auction Creation Dialog */}
       <AlertDialog open={showConfirmAuctionDialog} onOpenChange={setShowConfirmAuctionDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Xác nhận tạo phiên đấu giá</AlertDialogTitle>
             <AlertDialogDescription>
               Bạn có chắc chắn muốn tạo phiên đấu giá này? Phiên đấu giá sẽ được tạo và hiển thị trên trang đấu giá ngay sau khi xác nhận.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Hủy</AlertDialogCancel>
             <AlertDialogAction onClick={handleSubmit}>
               Xác nhận
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

       {/* Auction Success Message Dialog */}
       <AlertDialog open={showAuctionSuccessMessage} onOpenChange={setShowAuctionSuccessMessage}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle className="text-green-600 dark:text-green-400">
               Thành công!
             </AlertDialogTitle>
             <AlertDialogDescription>
               Sản phẩm đã lên trang đấu giá. Phiên đấu giá của bạn đã được tạo và đang hoạt động.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogAction onClick={() => {
               setShowAuctionSuccessMessage(false)
               onOpenChange(false)
             }}>
               Đóng
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </Dialog>
   )
 }
