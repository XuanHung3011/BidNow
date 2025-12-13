"use client"

import { Button } from "@/components/ui/button"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "Làm thế nào để tham gia đấu giá?",
    answer:
      "Để tham gia đấu giá, bạn cần đăng ký tài khoản, xác thực tài khoản . Sau đó, bạn có thể tham gia bất kỳ phiên đấu giá nào đang diễn ra.",
  },
  {
    question: "Tôi có thể hủy giá thầu đã đặt không?",
    answer:
      "Giá thầu một khi đã đặt sẽ không thể hủy. Vui lòng cân nhắc kỹ trước khi đặt giá để đảm bảo bạn thực sự muốn sở hữu sản phẩm.",
  },
  
  {
    question: "Làm thế nào để bán sản phẩm trên BidNow?",
    answer:
      "Bạn cần đăng ký tài khoản và vào cài đặt để chuyển sang thành người bán, tạo phiên đấu giá mới. Đội ngũ của chúng tôi sẽ xem xét và phê duyệt sản phẩm trong vòng 24 giờ.",
  },
  {
    question: "Tôi phải làm sao nếu sản phẩm không đúng mô tả?",
    answer:
      " Nếu sản phẩm không đúng mô tả, bạn có thể khiếu nại sản phẩm để đội ngũ chúng tôi xem xét và sử lí.",
  },
  {
    question: "Tính năng đặt giá tự động hoạt động như thế nào?",
    answer:
      "Tính năng auto-bid cho phép bạn đặt mức giá tối đa sẵn sàng trả. Hệ thống sẽ tự động tăng giá thầu của bạn khi có người đặt giá cao hơn, cho đến khi đạt mức giá tối đa bạn đã đặt.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="border-t border-border bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Câu hỏi thường gặp</h2>
            <p className="text-lg text-muted-foreground">Tìm câu trả lời cho những thắc mắc phổ biến về BidNow</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="pr-4 font-semibold text-foreground">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform",
                      openIndex === index && "rotate-180",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all",
                    openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-border px-6 pb-6 pt-4 text-muted-foreground">{faq.answer}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
