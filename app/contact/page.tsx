import { ContactForm } from "@/components/contact-form"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, MessageSquare, Clock, MapPin } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <main>
        <section className="bg-gradient-to-br from-blue-50 via-white to-orange-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-6 text-5xl font-bold text-foreground">Liên hệ với chúng tôi</h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn. Gửi tin nhắn và chúng tôi sẽ phản hồi sớm nhất có thể.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_400px]">
              <div>
                <h2 className="mb-6 text-3xl font-bold text-foreground">Gửi tin nhắn cho Admin</h2>
                <ContactForm />
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                        <Mail className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold">Email</h3>
                        <p className="text-sm text-muted-foreground">support@bidnow.com</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                        <MessageSquare className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold">Hotline</h3>
                        <p className="text-sm text-muted-foreground">1900 xxxx (8:00 - 22:00)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-100">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold">Giờ làm việc</h3>
                        <p className="text-sm text-muted-foreground">Thứ 2 - Chủ nhật: 8:00 - 22:00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                        <MapPin className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold">Địa chỉ</h3>
                        <p className="text-sm text-muted-foreground">123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <h3 className="mb-2 font-semibold text-blue-900">Thời gian phản hồi</h3>
                    <p className="text-sm text-blue-800">
                      Chúng tôi cam kết phản hồi mọi yêu cầu trong vòng 24 giờ làm việc. Các trường hợp khẩn cấp sẽ được
                      ưu tiên xử lý.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
