"use client"

import { useState, useEffect } from "react"
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

  // Form states
  const [formData, setFormData] = useState<CreateCategoryDtos>({
    name: "",
    slug: "",
    description: "",
    icon: "",
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

  const handleCreate = async () => {
    try {
      if (!formData.name.trim() || !formData.slug.trim()) {
        toast({
          title: "Lỗi",
          description: "Tên và slug là bắt buộc",
          variant: "destructive",
        })
        return
      }

      await CategoriesAPI.create(formData)
      toast({
        title: "Thành công",
        description: "Đã tạo danh mục mới",
      })
      setShowCreateDialog(false)
      resetForm()
      loadCategories()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo danh mục",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedCategory) return

    try {
      if (!formData.name.trim() || !formData.slug.trim()) {
        toast({
          title: "Lỗi",
          description: "Tên và slug là bắt buộc",
          variant: "destructive",
        })
        return
      }

      await CategoriesAPI.update(selectedCategory.id, formData)
      toast({
        title: "Thành công",
        description: "Đã cập nhật danh mục",
      })
      setShowEditDialog(false)
      resetForm()
      loadCategories()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật danh mục",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory || isDeleting) return
  
    setIsDeleting(true)
    const categoryName = selectedCategory.name
  
    try {
      await CategoriesAPI.delete(selectedCategory.id)
      toast({
        title: "Xóa thành công",
        description: `Đã xóa danh mục "${categoryName}"`,
      })
      setShowDeleteDialog(false)
      setSelectedCategory(null)
      loadCategories()
    } catch (error: any) {
      // Giữ dialog mở khi thất bại
      toast({
        title: "Không thể xóa",
        description:
          error.message ||
          "Danh mục này đang được sử dụng hoặc có ràng buộc dữ liệu. Vui lòng kiểm tra lại.",
        variant: "destructive",
      })
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
  }

  const openEditDialog = (category: CategoryDtos) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
    })
    setShowEditDialog(true)
  }

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
            <Button onClick={() => setShowCreateDialog(true)}>
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
                      <TableHead>ID</TableHead>
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
                        <TableCell className="font-medium">{category.id}</TableCell>
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Điện tử"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Ví dụ: dien-tu"
              />
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
            <Button onClick={handleCreate}>
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Điện tử"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Ví dụ: dien-tu"
              />
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
            <Button onClick={handleUpdate}>
              <Save className="mr-2 h-4 w-4" />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

    </div>
  )
}
