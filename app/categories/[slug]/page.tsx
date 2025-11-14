import { Footer } from "@/components/footer"
import { CategoryAuctions } from "@/components/category-auctions"

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen">
      <main>
        <CategoryAuctions categorySlug={params.slug} />
      </main>
      <Footer />
    </div>
  )
}
