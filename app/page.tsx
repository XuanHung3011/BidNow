import { HeroSection } from "@/components/hero-section"
import { CategorySection } from "@/components/category-section"
import { LiveAuctionsSection } from "@/components/live-auctions-section"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <CategorySection />
        <LiveAuctionsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
