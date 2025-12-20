import Link from "next/link"
import { Gavel, Facebook, Twitter, Instagram, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Gavel className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">BidNow</span>
            </Link>
            <p className="mb-4 text-sm text-muted-foreground">Đấu giá thời gian thực, kết nối niềm tin và giá trị.</p>
            <div className="flex gap-2">

     
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Về BidNow</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="transition-colors hover:text-foreground">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-foreground">
                  Quy định đấu giá
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>


          <div>
            <h3 className="mb-4 font-semibold text-foreground">Liên hệ</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: bidnowvn@gmail.com</li>              
              <li>Địa chỉ: Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, xã Hòa Lạc, huyện Thạch Thất, TP. Hà Nội.</li>
              <li>Giờ làm việc: 8:00 - 17:00</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 BidNow. </p>
        </div>
      </div>
    </footer>
  )
}
