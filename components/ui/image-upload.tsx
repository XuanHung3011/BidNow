"use client"

import { useState, useRef, DragEvent, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  maxSizeMB?: number
}

export function ImageUpload({ images, onChange, maxImages = 10, maxSizeMB = 10 }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      return "Chỉ chấp nhận file hình ảnh"
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `Kích thước file không được vượt quá ${maxSizeMB}MB`
    }

    return null
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setError("")

    const newImages: string[] = []
    const remainingSlots = maxImages - images.length

    if (files.length > remainingSlots) {
      setError(`Chỉ có thể thêm tối đa ${remainingSlots} hình ảnh nữa`)
      return
    }

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i]
      const validationError = validateFile(file)
      
      if (validationError) {
        setError(validationError)
        continue
      }

      try {
        const base64 = await convertToBase64(file)
        newImages.push(base64)
      } catch (err) {
        setError("Không thể đọc file hình ảnh")
      }
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages])
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    await handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    await handleFiles(e.target.files)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const formatImagesString = (): string => {
    return images.join(",")
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50",
          images.length >= maxImages && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (images.length < maxImages) {
            fileInputRef.current?.click()
          }
        }}
      >
        <div className="text-center">
          <Upload className={cn("mx-auto h-12 w-12 mb-4", isDragging ? "text-primary" : "text-muted-foreground")} />
          <p className="text-sm font-medium text-foreground mb-1">
            Kéo thả hình ảnh vào đây hoặc click để chọn
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG tối đa {maxSizeMB}MB (Tối đa {maxImages} hình)
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
        disabled={images.length >= maxImages}
      />

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(index)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="flex items-center justify-center rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            <span>Chưa có hình ảnh nào được tải lên</span>
          </div>
        </div>
      )}

      {/* Hidden input to store images as comma-separated string */}
      <input
        type="hidden"
        name="images"
        value={formatImagesString()}
      />
    </div>
  )
}



