import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Users, Zap, Award, FileText, Scale, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ContactForm } from "@/components/contact-form"

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <main>
        <section className="bg-gradient-to-br from-blue-50 via-white to-orange-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-6 text-5xl font-bold text-foreground">Về BidNow</h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Đấu giá thời gian thực, kết nối niềm tin và giá trị
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-3xl font-bold text-foreground">Câu chuyện của chúng tôi</h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  BidNow được thành lập với sứ mệnh tạo ra một nền tảng đấu giá trực tuyến minh bạch, công bằng và dễ
                  tiếp cận cho mọi người. Chúng tôi tin rằng mọi người đều xứng đáng có cơ hội sở hữu những sản phẩm giá
                  trị với mức giá hợp lý.
                </p>
                <p>
                  Với công nghệ đấu giá thời gian thực tiên tiến, chúng tôi mang đến trải nghiệm đấu giá mượt mà, nhanh
                  chóng và đáng tin cậy. Từ điện tử, nghệ thuật đến sưu tầm, BidNow là nơi kết nối người mua và người
                  bán trên toàn quốc.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-foreground">Giá trị cốt lõi</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Minh bạch</h3>
                  <p className="text-sm text-muted-foreground">Mọi giao dịch đều được theo dõi và xác minh công khai</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Cộng đồng</h3>
                  <p className="text-sm text-muted-foreground">Xây dựng cộng đồng đấu giá đáng tin cậy và thân thiện</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Zap className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Nhanh chóng</h3>
                  <p className="text-sm text-muted-foreground">Đấu giá thời gian thực với cập nhật tức thì</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Chất lượng</h3>
                  <p className="text-sm text-muted-foreground">Cam kết chất lượng sản phẩm và dịch vụ tốt nhất</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-8 text-center text-3xl font-bold text-foreground">Nội quy và Quy định</h2>

              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-semibold">Quy định chung</h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• Người dùng phải đủ 18 tuổi trở lên để tham gia đấu giá</li>
                          <li>• Thông tin đăng ký phải chính xác và trung thực</li>
                          <li>• Mỗi người chỉ được tạo một tài khoản duy nhất</li>
                          <li>• Nghiêm cấm hành vi gian lận, lừa đảo hoặc thao túng giá</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                        <Scale className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-semibold">Quy định cho người bán</h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• Sản phẩm phải có nguồn gốc hợp pháp và rõ ràng</li>
                          <li>• Mô tả sản phẩm phải chính xác, không gây hiểu lầm</li>
                          <li>• Hình ảnh phải thật, không sử dụng ảnh từ nguồn khác</li>
                          <li>• Cam kết giao hàng đúng hạn sau khi đấu giá kết thúc</li>
                          <li>• Không được hủy phiên đấu giá khi đã có người đặt giá</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-100">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-semibold">Quy định cho người mua</h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• Chỉ đặt giá khi có ý định mua thật sự</li>
                          <li>• Thanh toán đầy đủ trong vòng 24 giờ sau khi thắng đấu giá</li>
                          <li>• Kiểm tra kỹ sản phẩm trước khi xác nhận nhận hàng</li>
                          <li>• Đánh giá trung thực sau khi hoàn tất giao dịch</li>
                          <li>• Không được hủy giao dịch sau khi đã thắng đấu giá</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                        <Lock className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-semibold">Bảo mật và An toàn</h3>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• Không chia sẻ mật khẩu hoặc thông tin tài khoản</li>
                          <li>• Sử dụng phương thức thanh toán an toàn được nền tảng hỗ trợ</li>
                          <li>• Báo cáo ngay khi phát hiện hành vi đáng ngờ</li>
                          <li>• Không giao dịch ngoài nền tảng để tránh rủi ro</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-semibold text-orange-900">Xử lý vi phạm</h3>
                        <p className="text-orange-800">
                          Người dùng vi phạm nội quy sẽ bị cảnh cáo, tạm khóa hoặc khóa vĩnh viễn tài khoản tùy theo mức
                          độ nghiêm trọng. BidNow có quyền từ chối dịch vụ với bất kỳ người dùng nào vi phạm quy định.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 text-center">
                <h2 className="mb-6 text-3xl font-bold text-foreground">Cần hỗ trợ?</h2>
                <p className="text-lg text-muted-foreground">
                  Nếu bạn có thắc mắc hoặc cần hỗ trợ, hãy gửi tin nhắn cho Admin
                </p>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-3xl font-bold text-foreground">Tham gia cùng chúng tôi</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Hãy trở thành một phần của cộng đồng BidNow và khám phá những cơ hội đấu giá tuyệt vời mỗi ngày
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
