# API Services

Cấu trúc API services được tổ chức để dễ kiểm soát và tái sử dụng.

## 📁 Cấu trúc thư mục

```
lib/api/
├── index.ts          # Export tất cả API services
├── config.ts         # Cấu hình API endpoints và base URL
├── types.ts          # TypeScript types cho API
├── auth.ts           # AuthAPI service
└── README.md         # Documentation
```

## 🔧 Sử dụng

### Import API services
```typescript
import { AuthAPI, API_BASE, API_ENDPOINTS } from '@/lib/api'
```

### Sử dụng AuthAPI
```typescript
// Login
const result = await AuthAPI.login({ email, password })

// Register  
const result = await AuthAPI.register({ email, password, fullName })

// Verify email
const success = await AuthAPI.verifyEmail(token)

// Resend verification
const { token } = await AuthAPI.resendVerification({ userId, email })
```

## 📋 Lợi ích

- ✅ **Tách biệt logic**: API calls tách khỏi UI components
- ✅ **Tái sử dụng**: Có thể dùng ở nhiều nơi
- ✅ **Type safety**: TypeScript types đầy đủ
- ✅ **Error handling**: Xử lý lỗi tập trung
- ✅ **Dễ test**: Có thể mock API services
- ✅ **Maintainable**: Dễ bảo trì và mở rộng

