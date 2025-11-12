import { Footer } from "@/components/footer"
import { CategoryAuctions } from "@/components/category-auctions"

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <div className="min-h-screen">
      <main>
        <CategoryAuctions categorySlug={slug} />
      </main>
      <Footer />
    </div>
  )
}
