# Hướng dẫn Deploy Frontend lên Vercel

## 1. Environment Variables trong Vercel

Trong Vercel Dashboard, thêm các environment variables sau:

### Bắt buộc:
- `NEXT_PUBLIC_API_BASE`: URL của backend API (ví dụ: `https://api.bitnow.io.vn`)

### Tùy chọn:
- `NEXT_PUBLIC_SUPPORT_ADMIN_EMAIL`: Email của admin hỗ trợ (mặc định: `admin@bidnow.local`)

## 2. Cấu hình Backend CORS

**QUAN TRỌNG**: Sau khi deploy lên Vercel, bạn cần thêm domain Vercel vào CORS policy trong backend.

### Các bước:

1. Lấy domain Vercel của bạn (ví dụ: `https://your-app.vercel.app` hoặc custom domain)

2. Mở file `BitNow-Backend/BitNow-Backend/Program.cs`

3. Tìm phần CORS configuration (khoảng dòng 133-144)

4. Thêm domain Vercel vào mảng `WithOrigins()`:

```csharp
policy.WithOrigins(
    "http://localhost:3000", 
    "https://localhost:3000",
    "https://bitnow.io.vn",
    "https://www.bitnow.io.vn",
    "https://your-app.vercel.app",  // ← Thêm domain Vercel của bạn
    "https://your-custom-domain.com" // ← Nếu có custom domain
)
```

5. Rebuild và redeploy backend lên VPS

## 3. Kiểm tra SignalR Connection

SignalR đã được cấu hình để sử dụng Long Polling (thay vì WebSocket) để tránh lỗi trên VPS. 
Nếu vẫn gặp lỗi kết nối, kiểm tra:

- Domain Vercel đã được thêm vào CORS
- Backend đang chạy và accessible từ internet
- Không có firewall chặn kết nối SignalR

## 4. Custom Domain (nếu có)

Nếu bạn sử dụng custom domain cho Vercel:
- Thêm cả domain đó vào CORS
- Đảm bảo DNS đã được cấu hình đúng
- Kiểm tra SSL certificate

## 5. Testing

Sau khi deploy:
1. Kiểm tra frontend có load được không
2. Test đăng nhập/đăng ký
3. Test SignalR connection (real-time updates)
4. Kiểm tra console browser có lỗi CORS không

## Lưu ý

- **CORS**: Với `AllowCredentials()`, không thể dùng wildcard `*`, phải list rõ từng domain
- **Cookies**: Đảm bảo cookies được gửi với requests (đã được cấu hình trong code)
- **HTTPS**: Vercel tự động cung cấp HTTPS, backend cũng cần HTTPS


