import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Award } from "lucide-react"
import Link from "next/link"

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

          <h1 className="mb-6 text-balance text-4xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            <span className="font-serif italic text-foreground/90">Đấu giá</span>{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent font-bold">
              thời gian thực
            </span>
            <br className="hidden sm:block" />
            <span className="text-foreground/80">kết nối niềm tin và giá trị</span>
          </h1>

          <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
            Tham gia hàng nghìn phiên đấu giá trực tuyến với sản phẩm đa dạng từ điện tử, sưu tầm đến nghệ thuật. Đấu
            giá dễ dàng, nhanh chóng và an toàn.
          </p>

          {/* CTA buttons only; search moved to global top bar */}

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auctions">
              <Button size="lg" className="group w-full sm:w-auto bg-primary hover:bg-primary/90">
                Tham gia đấu giá ngay
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/categories">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Khám phá sản phẩm
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl hover:border-primary/30">
              <div className="absolute right-4 top-4 rounded-full bg-primary/10 p-3 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div className="relative">
                <div className="mb-2 text-lg font-bold text-foreground">Đấu giá realtime</div>
                <div className="text-sm text-muted-foreground leading-relaxed">Cập nhật giá theo thời gian thực, không bỏ lỡ cơ hội</div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl hover:border-accent/30">
              <div className="absolute right-4 top-4 rounded-full bg-accent/10 p-3 transition-all group-hover:bg-accent/20 group-hover:scale-110">
                <Award className="h-6 w-6 text-accent" />
              </div>
              <div className="relative">
                <div className="mb-2 text-lg font-bold text-foreground">Đa dạng sản phẩm</div>
                <div className="text-sm text-muted-foreground leading-relaxed">Từ điện tử, nghệ thuật đến sưu tầm quý hiếm</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
