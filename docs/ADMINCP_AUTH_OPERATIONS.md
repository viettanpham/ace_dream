# STARFRONT WORLD V2 — TÀI LIỆU VẬN HÀNH XÁC THỰC ADMINCP (FND-8.2.3.E.0)

## 1. ĐƯỜNG DẪN CẤU HÌNH DEVELOPMENT
Trong môi trường phát triển cục bộ (Local / AI Studio), các biến bí mật được lưu tại:
- **Tệp:** `.env.local` (nằm ở thư mục gốc applet, đã được cấu hình trong `.gitignore`).
- **Tệp mẫu:** `.env.example` (chỉ chứa tên biến và placeholder, không chứa mật khẩu thực tế).

### Cấu hình mẫu trong `.env.local`:
```bash
# Tài khoản Quản trị chính (Primary Admin)
STARFRONT_ADMIN_PRIMARY_PASSWORD="MatKhauChinhCuaBan_2026!"

# Tài khoản Quản trị dự phòng (Backup Admin)
STARFRONT_ADMIN_BACKUP_PASSWORD="MatKhauDuPhongCuaBan_2026!"

# Khóa bí mật ký phiên HMAC-SHA256 (tự sinh nếu để trống)
ADMIN_SESSION_SECRET="32_ky_tu_bi_mat_ngau_nhien_o_day"
```

## 2. TÊN SECRET TRÊN PRODUCTION (GOOGLE CLOUD SECRET MANAGER)
Khi triển khai trên Cloud Run, không sử dụng file filesystem cục bộ mà truyền trực tiếp qua Google Cloud Secret Manager với các khóa môi trường server-only:
- `STARFRONT_ADMIN_PRIMARY_PASSWORD`: Mật khẩu cho tài khoản `admin`.
- `STARFRONT_ADMIN_BACKUP_PASSWORD`: Mật khẩu cho tài khoản `admin123`.
- `ADMIN_SESSION_SECRET`: Khóa ký HMAC phiên cookie 12 giờ.
- `GCS_STORY_BUCKET_NAME`: Tên bucket Google Cloud Storage (ví dụ: `starfront-world-v2-stories`).
- `GOOGLE_APPLICATION_CREDENTIALS`: Đường dẫn Service Account JSON (hoặc tự động dùng Workload Identity / Cloud Run default service account với vai trò `Storage Object Admin`).

*Lưu ý: Tuyệt đối KHÔNG sử dụng tiền tố `NEXT_PUBLIC_` cho bất kỳ biến mật khẩu nào.*

## 3. VỊ TRÍ STORE LƯU BẢN BĂM MẬT KHẨU (ACCOUNT HASH STORE)
- **Đường dẫn tệp:** `.starfront-config/admin-auth.json`
- **Cấu trúc lưu trữ:**
  ```json
  {
    "version": 2,
    "accounts": {
      "admin": {
        "username": "admin",
        "salt": "16_bytes_hex_random",
        "hash": "scrypt_64_bytes_hex",
        "createdAt": "2026-10-23T...",
        "updatedAt": "2026-10-23T..."
      },
      "admin123": {
        "username": "admin123",
        "salt": "16_bytes_hex_random_doc_lap",
        "hash": "scrypt_64_bytes_hex_doc_lap",
        "createdAt": "2026-10-23T...",
        "updatedAt": "2026-10-23T..."
      }
    },
    "updatedAt": "2026-10-23T..."
  }
  ```
- **Bảo mật:**
  - Không lưu mật khẩu dạng plaintext dưới mọi hình thức.
  - Sử dụng thuật toán băm chuẩn mật mã `crypto.scryptSync(password, salt, 64)`.
  - Mỗi tài khoản sở hữu `salt` và `hash` hoàn toàn độc lập.
  - So sánh mật khẩu bằng thuật toán kháng tấn công thời gian `crypto.timingSafeEqual`.

## 4. CÁCH ĐỔI HOẶC RESET MẬT KHẨU
### Cách 1: Đổi mật khẩu trực tiếp trên giao diện AdminCP (Khuyến nghị)
1. Đăng nhập vào AdminCP (`/v2/admin` hoặc bấm nút ADMINCP trên Header V2 Shell).
2. Trên góc trên bên phải thanh Header, bấm nút **"Đổi mật khẩu"**.
3. Nhập mật khẩu hiện tại, mật khẩu mới (tối thiểu 8 ký tự) và xác nhận mật khẩu mới.
4. Bấm **"CẬP NHẬT MẬT KHẨU"**. Hệ thống sẽ tự động cập nhật lại `salt` và `hash` mới vào store.

### Cách 2: Reset mật khẩu khẩn cấp qua biến môi trường
1. Xóa khóa tài khoản cần reset trong tệp `.starfront-config/admin-auth.json` (hoặc xóa file nếu muốn khởi tạo lại toàn bộ).
2. Khai báo mật khẩu mới trong `.env.local` (hoặc Secret Manager):
   `STARFRONT_ADMIN_PRIMARY_PASSWORD="MatKhauMoiCuaBan_2026!"`
3. Khởi động lại ứng dụng. Hệ thống sẽ tự động bootstrap lại tài khoản với salt/hash mới.

## 5. CÁCH CHUYỂN TÀI KHOẢN AI STUDIO AN TOÀN (KHÔNG ĐƯA BÍ MẬT LÊN GIT)
1. `.gitignore` đã chặn các file `.env*.local` và các tệp nhị phân nén.
2. Khi chuyển giao repository sang tài khoản AI Studio mới:
   - Chỉ commit code mã nguồn và tài liệu mẫu `.env.example`.
   - Tại môi trường AI Studio mới, tạo file `.env.local` cá nhân hoặc nhập mật khẩu trực tiếp qua giao diện Khởi tạo tài khoản lần đầu.
   - Khi chưa có tài khoản nào trong hệ thống, AdminCP sẽ tự động chuyển sang chế độ Setup an toàn với 3 trường: `Tên đăng nhập`, `Mật khẩu` và `Xác nhận mật khẩu` để người dùng thiết lập mật khẩu mà không cần ghi vào bất kỳ tệp git nào.
