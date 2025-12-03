"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Save, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useToast } from "@/hooks/use-toast"
import { CategoriesAPI } from "@/lib/api/categories"
import type { CategoryDtos, CreateCategoryDtos, UpdateCategoryDtos, CategoryFilterDto } from "@/lib/api/types"

export function CategoryManagement() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<CategoryDtos[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("Name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryDtos | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categoriesInUse, setCategoriesInUse] = useState<Record<number, boolean>>({})
  const [confirmAction, setConfirmAction] = useState<"create" | "update" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Result dialog state
  const [resultDialogOpen, setResultDialogOpen] = useState(false)
  const [resultDialogTitle, setResultDialogTitle] = useState("")
  const [resultDialogMessage, setResultDialogMessage] = useState("")

  // Form states
  const [formData, setFormData] = useState<CreateCategoryDtos>({
    name: "",
    slug: "",
    description: "",
    icon: "",
  })

  // Validation states
  const [nameError, setNameError] = useState<string>("")
  const [slugError, setSlugError] = useState<string>("")
  const [isCheckingName, setIsCheckingName] = useState(false)
  const [touched, setTouched] = useState<{
    name: boolean
    slug: boolean
  }>({
    name: false,
    slug: false,
  })

  const loadCategories = async () => {
  setLoading(true)
  try {
    const filter: CategoryFilterDto = {
      searchTerm: searchTerm || undefined,
      sortBy,
      sortOrder,
      page,
      pageSize,
    }
    const result = await CategoriesAPI.getPaged(filter)
    setCategories(result.data)
    setTotalCount(result.totalCount)
    setTotalPages(result.totalPages)

    // ✅ Kiểm tra trạng thái sử dụng
    const usageStatus: Record<number, boolean> = {}
    await Promise.all(
      result.data.map(async (category) => {
        try {
          const isInUse = await CategoriesAPI.checkInUse(category.id)
          usageStatus[category.id] = isInUse
        } catch {
          usageStatus[category.id] = false
        }
      })
    )
    setCategoriesInUse(usageStatus)
  } catch (error: any) {
    toast({
      title: "Lỗi",
      description: error.message || "Không thể tải danh sách danh mục",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}


  useEffect(() => {
    loadCategories()
  }, [page, pageSize, sortBy, sortOrder])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadCategories()
      } else {
        setPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Validate form fields
  const validateField = (field: "name" | "slug", value: string) => {
    const trimmedValue = value.trim()
    
    if (field === "name") {
      if (!trimmedValue) {
        setNameError("Tên danh mục không được để trống")
        return false
      }
      // Clear empty error, but keep duplicate error if exists (will be checked by useEffect)
      // Only clear if current error is about empty field
      if (nameError === "Tên danh mục không được để trống") {
        setNameError("")
      }
      // Name existence check will be handled separately by useEffect
      return true
    }
    
    if (field === "slug") {
      if (!trimmedValue) {
        setSlugError("Slug không được để trống")
        return false
      }
      setSlugError("")
      return true
    }
    
    return true
  }

  const checkNameAvailability = useCallback(
    async (showEmptyError: boolean) => {
      const name = formData.name.trim()

      if (!name) {
        if (showEmptyError) {
          setNameError("Tên danh mục không được để trống")
        } else {
          setNameError("")
        }
        return false
      }

      if (!showCreateDialog && !showEditDialog) {
        return true
      }

      setIsCheckingName(true)
      try {
        const excludeId = showEditDialog && selectedCategory ? selectedCategory.id : undefined
        const exists = await CategoriesAPI.checkName(name, excludeId)

        if (exists) {
          setNameError("Tên danh mục này đã tồn tại")
          return false
        }

        setNameError("")
        return true
      } catch {
        setNameError("")
        return true
      } finally {
        setIsCheckingName(false)
      }
    },
    [formData.name, showCreateDialog, showEditDialog, selectedCategory]
  )

  // Check name existence when name changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showCreateDialog && !showEditDialog) {
        return
      }
      // Trong edit mode, chỉ check nếu tên đã thay đổi
      if (showEditDialog && selectedCategory) {
        const currentName = formData.name.trim()
        const originalName = selectedCategory.name.trim()
        if (currentName === originalName) {
          // Tên không thay đổi, không cần check
          setNameError("")
          setIsCheckingName(false)
          return
        }
      }
      void checkNameAvailability(touched.name)
    }, 500) // Debounce 500ms

    return () => clearTimeout(timer)
  }, [formData.name, checkNameAvailability, showCreateDialog, showEditDialog, touched.name, selectedCategory])

  // Validate slug when it changes (chỉ khi đã touched)
  useEffect(() => {
    if (touched.slug && (showCreateDialog || showEditDialog)) {
      validateField("slug", formData.slug)
    }
  }, [formData.slug, touched.slug, showCreateDialog, showEditDialog])

  const validateForm = useCallback(async () => {
    setTouched({ name: true, slug: true })

    const isNameValid = validateField("name", formData.name)
    const isSlugValid = validateField("slug", formData.slug)

    if (!isNameValid || !isSlugValid) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      })
      return false
    }

    const isNameAvailable = await checkNameAvailability(true)
    if (!isNameAvailable) {
      toast({
        title: "Lỗi",
        description: nameError || "Tên danh mục này đã tồn tại",
        variant: "destructive",
      })
      return false
    }

    return true
  }, [checkNameAvailability, formData.name, formData.slug, nameError, toast])

  const requestConfirmation = async (action: "create" | "update") => {
    const isValid = await validateForm()
    if (!isValid) {
      return
    }
    setConfirmAction(action)
  }

  const handleCreate = async () => {
    setIsSubmitting(true)
    try {
      await CategoriesAPI.create(formData)
      setShowCreateDialog(false)
      resetForm()
      loadCategories()
      setResultDialogTitle("Tạo danh mục thành công")
      setResultDialogMessage(
        `Danh mục "${formData.name}" đã được tạo thành công.`
      )
      setResultDialogOpen(true)
    } catch (error: any) {
      setResultDialogTitle("Tạo danh mục thất bại")
      setResultDialogMessage(
        error.message || "Không thể tạo danh mục. Vui lòng thử lại sau."
      )
      setResultDialogOpen(true)
    } finally {
      setIsSubmitting(false)
      setConfirmAction(null)
    }
  }

  const handleUpdate = async () => {
    if (!selectedCategory) return

    setIsSubmitting(true)
    try {
      await CategoriesAPI.update(selectedCategory.id, formData)
      setShowEditDialog(false)
      resetForm()
      loadCategories()
      setResultDialogTitle("Cập nhật danh mục thành công")
      setResultDialogMessage(
        `Danh mục "${formData.name}" đã được cập nhật thành công.`
      )
      setResultDialogOpen(true)
    } catch (error: any) {
      setResultDialogTitle("Cập nhật danh mục thất bại")
      setResultDialogMessage(
        error.message || "Không thể cập nhật danh mục. Vui lòng thử lại sau."
      )
      setResultDialogOpen(true)
    } finally {
      setIsSubmitting(false)
      setConfirmAction(null)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory || isDeleting) return
  
    setIsDeleting(true)
    const categoryName = selectedCategory.name
  
    try {
      await CategoriesAPI.delete(selectedCategory.id)
      setShowDeleteDialog(false)
      setSelectedCategory(null)
      loadCategories()
      setResultDialogTitle("Xóa danh mục thành công")
      setResultDialogMessage(
        `Danh mục "${categoryName}" đã được xóa thành công.`
      )
      setResultDialogOpen(true)
    } catch (error: any) {
      // Giữ dialog mở khi thất bại
      setResultDialogTitle("Xóa danh mục thất bại")
      setResultDialogMessage(
        error.message ||
          "Danh mục này đang được sử dụng hoặc có ràng buộc dữ liệu. Vui lòng kiểm tra lại."
      )
      setResultDialogOpen(true)
    } finally {
      setIsDeleting(false)
    }
  }
  

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "",
    })
    setSelectedCategory(null)
    setNameError("")
    setSlugError("")
    setIsCheckingName(false)
    setTouched({ name: false, slug: false })
  }

  const openEditDialog = (category: CategoryDtos) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
    })
    setNameError("") // Reset validation error when opening edit dialog
    setSlugError("")
    setIsCheckingName(false)
    setTouched({ name: false, slug: false })
    setShowEditDialog(true)
  }
  
  // Reset form when closing edit dialog
  useEffect(() => {
    if (!showEditDialog) {
      setSelectedCategory(null)
      setNameError("")
      setSlugError("")
      setIsCheckingName(false)
      setTouched({ name: false, slug: false })
    }
  }, [showEditDialog])

  const openDeleteDialog = (category: CategoryDtos) => {
    setSelectedCategory(category)
    setShowDeleteDialog(true)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("vi-VN")
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quản lý danh mục</CardTitle>
            <Button onClick={() => {
              resetForm()
              setShowCreateDialog(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm danh mục
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Name">Tên</SelectItem>
                  <SelectItem value="CreatedAt">Ngày tạo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Thứ tự" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Tăng dần</SelectItem>
                  <SelectItem value="desc">Giảm dần</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Hiển thị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Không có danh mục nào</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                     
                      <TableHead>Tên</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {category.description || "-"}
                        </TableCell>
                        <TableCell>{category.icon || "-"}</TableCell>
                        <TableCell>{formatDate(category.createdAt)}</TableCell>
                        <TableCell className="text-right">
  <div className="flex justify-end gap-2">
    <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
      <Edit className="h-4 w-4" />
    </Button>

    {/* ✅ Ẩn nút Xóa nếu category đang sử dụng */}
    {!categoriesInUse[category.id] && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openDeleteDialog(category)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    )}
  </div>
</TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} trong tổng số{" "}
                  {totalCount} danh mục
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    Trước
                  </Button>
                  <div className="flex items-center px-4 text-sm">
                    Trang {page} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm danh mục mới</DialogTitle>
            <DialogDescription>Nhập thông tin để tạo danh mục mới</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên danh mục *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (nameError && nameError !== "Tên danh mục này đã tồn tại") {
                    setNameError("")
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, name: true }))
                  validateField("name", formData.name)
                }}
                placeholder="Ví dụ: Điện tử"
                className={nameError ? "border-destructive" : ""}
              />
              {isCheckingName && (
                <p className="text-sm text-muted-foreground">Đang kiểm tra...</p>
              )}
              {nameError && !isCheckingName && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => {
                  setFormData({ ...formData, slug: e.target.value })
                  setSlugError("")
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, slug: true }))
                  validateField("slug", formData.slug)
                }}
                placeholder="Ví dụ: dien-tu"
                className={slugError ? "border-destructive" : ""}
              />
              {slugError && (
                <p className="text-sm text-destructive">{slugError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về danh mục"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Ví dụ: Smartphone"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button
              onClick={() => requestConfirmation("create")}
              disabled={
                !!nameError ||
                !!slugError ||
                isCheckingName ||
                !formData.name.trim() ||
                !formData.slug.trim()
              }
            >
              <Save className="mr-2 h-4 w-4" />
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa danh mục</DialogTitle>
            <DialogDescription>Cập nhật thông tin danh mục</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tên danh mục *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (nameError && nameError !== "Tên danh mục này đã tồn tại") {
                    setNameError("")
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, name: true }))
                  validateField("name", formData.name)
                }}
                placeholder="Ví dụ: Điện tử"
                className={nameError ? "border-destructive" : ""}
              />
              {isCheckingName && (
                <p className="text-sm text-muted-foreground">Đang kiểm tra...</p>
              )}
              {nameError && !isCheckingName && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => {
                  setFormData({ ...formData, slug: e.target.value })
                  setSlugError("")
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, slug: true }))
                  validateField("slug", formData.slug)
                }}
                placeholder="Ví dụ: dien-tu"
                className={slugError ? "border-destructive" : ""}
              />
              {slugError && (
                <p className="text-sm text-destructive">{slugError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về danh mục"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Icon</Label>
              <Input
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Ví dụ: Smartphone"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button
              onClick={() => requestConfirmation("update")}
              disabled={
                !!nameError ||
                !!slugError ||
                isCheckingName ||
                !formData.name.trim() ||
                !formData.slug.trim()
              }
            >
              <Save className="mr-2 h-4 w-4" />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Update Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!isSubmitting) {
            setConfirmAction(open ? confirmAction : null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "create" ? "Xác nhận thêm danh mục" : "Xác nhận lưu chỉnh sửa"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "create"
                ? "Bạn có chắc chắn muốn tạo danh mục mới với các thông tin đã nhập?"
                : `Bạn có chắc chắn muốn lưu thay đổi cho danh mục "${selectedCategory?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} onClick={() => setConfirmAction(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction === "create" ? handleCreate : handleUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
  open={showDeleteDialog}
  onOpenChange={(open) => {
    if (!isDeleting) {
      setShowDeleteDialog(open)
      if (!open) setSelectedCategory(null) // Chỉ reset khi đóng dialog bình thường
    }
  }}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
      <AlertDialogDescription>
        Bạn có chắc chắn muốn xóa danh mục "{selectedCategory?.name}"? Hành động này không thể hoàn tác.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        disabled={isDeleting}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
      >
        {isDeleting ? "Đang xóa..." : "Xóa"}
      </AlertDialogAction>
    </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>

      {/* Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{resultDialogTitle || "Thông báo"}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {resultDialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setResultDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
