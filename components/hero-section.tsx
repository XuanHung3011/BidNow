import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Users, Gavel, TrendingUp } from "lucide-react"
import { HeroSearchBar } from "./hero-search-bar"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container relative mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Nền tảng đấu giá trực tuyến hàng đầu Việt Nam</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Đấu giá thời gian thực,{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              kết nối niềm tin
            </span>{" "}
            và giá trị
          </h1>

          <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
            Tham gia hàng nghìn phiên đấu giá trực tuyến với sản phẩm đa dạng từ điện tử, sưu tầm đến nghệ thuật. Đấu
            giá dễ dàng, nhanh chóng và an toàn.
          </p>

          {/* Hero Search Bar */}
          <div className="mb-8">
            <HeroSearchBar />
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="group w-full sm:w-auto bg-primary hover:bg-primary/90">
              Tham gia đấu giá ngay
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
              Khám phá sản phẩm
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="absolute right-4 top-4 opacity-10 transition-opacity group-hover:opacity-20">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <div className="relative">
                <div className="mb-2 text-4xl font-bold text-primary">10K+</div>
                <div className="text-sm font-medium text-muted-foreground">Người dùng tin tưởng</div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="absolute right-4 top-4 opacity-10 transition-opacity group-hover:opacity-20">
                <Gavel className="h-12 w-12 text-accent" />
              </div>
              <div className="relative">
                <div className="mb-2 text-4xl font-bold text-accent">5K+</div>
                <div className="text-sm font-medium text-muted-foreground">Phiên đấu giá thành công</div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="absolute right-4 top-4 opacity-10 transition-opacity group-hover:opacity-20">
                <TrendingUp className="h-12 w-12 text-primary" />
              </div>
              <div className="relative">
                <div className="mb-2 text-4xl font-bold text-primary">98%</div>
                <div className="text-sm font-medium text-muted-foreground">Khách hàng hài lòng</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
