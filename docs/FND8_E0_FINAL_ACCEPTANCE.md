# CHECKPOINT: FND-8.2.3.E.0 FINAL ADMINCP ACCESS & CONTENT MANAGEMENT ACCEPTANCE

- **Mã Checkpoint:** `FND8-E0-FINAL-ACCEPTANCE-01`
- **Thời gian:** 2026-10-23
- **Chế độ:** IMPLEMENT ONE CONSOLIDATED PASS — COMPLETED
- **Ngôn ngữ:** 100% Tiếng Việt

---

## 1. TỔNG QUAN KẾT QUẢ ĐÃ HOÀN THÀNH
1. **Khắc phục triệt để lỗi đăng nhập/khởi tạo AdminCP:**
   - Đã xác định đúng nguyên nhân: Form khởi tạo trước đó thiếu trường `confirmPassword` trong khi endpoint `/api/admin/auth/setup` yêu cầu kiểm tra xác nhận, dẫn đến thông báo "Mật khẩu xác nhận không khớp".
   - Bổ sung trường `Xác nhận mật khẩu` (`confirmPassword`) hiển thị rõ ràng và kiểm tra khớp cả ở client và server.
   - Khi tài khoản đã tồn tại, tự động chuyển sang màn hình Đăng nhập (`XÁC THỰC QUẢN TRỊ VIÊN`) thay vì Setup.
2. **Hỗ trợ 2 tài khoản Quản trị viên độc lập:**
   - Primary Admin: `admin`
   - Backup Admin: `admin123`
   - Mỗi tài khoản có `salt` và `hash` scrypt hoàn toàn độc lập, lưu trữ tại `.starfront-config/admin-auth.json`.
   - Hỗ trợ biến môi trường server-only `STARFRONT_ADMIN_PRIMARY_PASSWORD` và `STARFRONT_ADMIN_BACKUP_PASSWORD` (idempotent, không ghi đè khi restart).
   - Tích hợp tính năng đổi mật khẩu an toàn (`/api/admin/auth/change-password`).
   - Tích hợp nút Đăng xuất (`/api/admin/auth/logout`) và badge tài khoản trên thanh Header AdminCP.
3. **Triển khai tải lên file WebP nhị phân thật (Artwork Binary Upload):**
   - Tạo endpoint `/api/admin/artwork/upload` tiếp nhận `multipart/form-data`.
   - Tính toán mã băm mật mã SHA-256 và kích thước file thực tế.
   - Ghi trực tiếp vào `public/assets/artworks/{pilotId}/{filename}` và đăng ký vào manifest store.
   - Giao diện AdminCP bổ sung nút nổi bật **"TẢI LÊN FILE WEBP THẬT"** với hộp thoại chọn file, xem trước hình ảnh (image preview), hiển thị tiến trình và mã băm SHA-256.
4. **Phân cấp trung thực trạng thái lưu trữ sản xuất (Storage Tiers):**
   - `LOCAL DEV ONLY`: Lưu trữ cục bộ độc lập và nguyên tử (Atomic CAS) tại `.starfront-config/character-content-manifest.json`.
   - `PERSISTENT STORAGE CONFIGURED`: Cấu hình GCS bucket đã khai báo.
   - `BLOCKED BY GCS/IAM CONFIG`: Khi khai báo bucket nhưng thiếu credentials hoặc IAM role `Storage Object Admin`.
   - Không giả lập trạng thái ảo khi chưa có thông tin xác thực Google Cloud.
5. **Nghiệm thu toàn diện 3 module AdminCP:**
   - Module 1 (Character Profile): Chỉnh sửa, lưu trữ, rollback và ghi audit log cho 12 phi công Canonical.
   - Module 2 (Artwork Binary): Tải lên file thật, preview, băm SHA-256, phân loại vai trò.
   - Module 3 (Story Lifecycle): Quản lý 10 chương, chuyển đổi bật/tắt xuất bản (PUBLISHED / HIDDEN), validation gates chặn nghiêm ngặt các chương HOLD / PROVISIONAL.
6. **Kiểm thử tự động:**
   - `tests/admin-auth-e2e.test.ts`: 10/10 test cases PASS.
   - `tests/admincp-modules-workflow.test.ts`: 3/3 test cases PASS.
   - `tests/character-category-story-content-e2e.test.ts`: 5/5 test cases PASS.
   - `tsc --noEmit` (lint_applet): PASS 0 lỗi.
   - `next build` (compile_applet): PASS.
