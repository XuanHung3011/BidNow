import { Footer } from "@/components/footer"
import { CategoriesGrid } from "@/components/categories-grid"

export default function CategoriesPage() {
  return (
    <div className="min-h-screen">
      <main>
        <section className="border-b bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12">
          <div className="container mx-auto px-4">
            <h1 className="mb-4 text-4xl font-bold text-foreground">Danh mục sản phẩm</h1>
            <p className="text-lg text-muted-foreground">
              Khám phá các danh mục đấu giá đa dạng từ điện tử, nghệ thuật đến sưu tầm
            </p>
          </div>
        </section>
        <section className="py-12">
          <div className="container mx-auto px-4">
            <CategoriesGrid />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
