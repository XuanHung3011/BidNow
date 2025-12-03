"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal, Mic } from "lucide-react"
import { useRouter } from "next/navigation"

const categories = [
  { value: "all", label: "Tất cả danh mục" },
  { value: "electronics", label: "Điện tử" },
  { value: "art", label: "Nghệ thuật" },
  { value: "collectibles", label: "Sưu tầm" },
  { value: "watches", label: "Đồng hồ" },
  { value: "gaming", label: "Gaming" },
  { value: "cameras", label: "Máy ảnh" },
  { value: "jewelry", label: "Trang sức" },
  { value: "fashion", label: "Thời trang" },
  { value: "home", label: "Nhà cửa & Đời sống" },
]

const popularSearches = [
  "iPhone 15 Pro Max",
  "MacBook Pro M3",
  "Rolex Submariner",
  "Sony A7R V",
  "PlayStation 5",
  "Tranh sơn dầu",
  "Đồng hồ Omega",
  "Nintendo Switch",
]

export function HeroSearchBar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&category=${selectedCategory}`)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    router.push(`/search?q=${encodeURIComponent(suggestion)}&category=${selectedCategory}`)
  }

  const filteredSuggestions = popularSearches.filter(search =>
    search.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Category Selector */}
          <div className="flex-shrink-0">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px] h-12 border-0 rounded-none bg-gray-50 focus:ring-0">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm sản phẩm, người bán, từ khóa..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(e.target.value.length > 0)
                }}
                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="h-12 pl-12 pr-12 border-0 rounded-none focus:ring-0 text-base placeholder:text-gray-400"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2 px-2">Tìm kiếm phổ biến</div>
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                    >
                      <Search className="h-4 w-4 text-gray-400" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-medium rounded-none"
          >
            <Search className="h-5 w-5 mr-2" />
            Tìm kiếm
          </Button>
        </div>
      </form>

      {/* Popular Searches */}
      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-2">Tìm kiếm phổ biến:</div>
        <div className="flex flex-wrap gap-2">
          {popularSearches.slice(0, 6).map((search, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(search)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
            >
              {search}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
