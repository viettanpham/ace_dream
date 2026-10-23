# STARFRONT WORLD V2 — WEB-01.3.A
# KẾ HOẠCH PHÂN KỲ TRIỂN KHAI CHI TIẾT
## ADMINCP ASSET VERSION MANAGER — PHASED IMPLEMENTATION ROADMAP

**Mã tài liệu:** WEB01-3A-PHASES-01  
**Chế độ:** PLAN/DEFINE ONLY (KHÔNG TRIỂN KHAI CODE TRONG GIAI ĐOẠN NÀY)  
**Ngày lập:** 2026-10-22  
**Ngôn ngữ:** 100% Tiếng Việt  

---

## 1. Sơ đồ Tuần tự 5 Subphase Triển khai

```
+-----------------------------------------------------------------------------------+
|               LỘ TRÌNH 5 SUBPHASE TRIỂN KHAI WEB-01.3.A                           |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [WEB-01.3.A.1: Cấu hình Bền vững & Dynamic Resolver Hook]                       |
|  ├── Tạo schema .starfront-config/runtime-asset-config.json                       |
|  ├── Xây dựng API Route: GET /api/admin/asset-version                             |
|  └── Tích hợp hook useAssetConfig() & AssetConfigProvider                         |
|         |                                                                         |
|         v                                                                         |
|  [WEB-01.3.A.2: GitHub Discovery Proxy & Engine Kiểm định]                        |
|  ├── Xây dựng API Route: GET /api/admin/asset-version/releases (Cache TTL 10m)    |
|  ├── Xây dựng Fast Validation qua jsDelivr CDN HEAD requests                      |
|  └── Xây dựng Full Canonical Audit đối chiếu 26 ảnh cốt lõi                       |
|         |                                                                         |
|         v                                                                         |
|  [WEB-01.3.A.3: Giao diện AdminCP Tab 9 & Hộp cát Xem trước]                     |
|  ├── Tích hợp Tab 9 vào components/game/world/admin-settings-modal.tsx            |
|  ├── Khối Active Version Card & Bảng danh sách Release Tags                       |
|  └── Khối Sandboxed Artwork Preview độc lập không ảnh hưởng game                 |
|         |                                                                         |
|         v                                                                         |
|  [WEB-01.3.A.4: Quy trình Kích hoạt 2 Bước, Khóa Tương tranh & Audit Log]        |
|  ├── Dialog Xác nhận Bước 1 (So sánh chi tiết & kiểm định)                        |
|  ├── Dialog Cảnh báo Bước 2 (Nhập mã xác nhận / Hold-to-confirm)                 |
|  ├── API Route: POST /api/admin/asset-version (Admin Key, Revision Locking)       |
|  └── Ghi Audit Log vào hệ thống                                                   |
|         |                                                                         |
|         v                                                                         |
|  [WEB-01.3.A.5: Cơ chế Hoàn tác 1 Chạm & Kiểm thử Hồi quy Toàn diện]              |
|  ├── Nút One-Click Rollback tức thời về previousVersion                           |
|  ├── Cập nhật phản ứng tức thời trên Client React Context                         |
|  ├── Kiểm thử hồi quy toàn diện (Typecheck, Build, Live Tag Switch Test)          |
|  └── Nghiệm thu và cập nhật tài liệu Checkpoint Bàn giao                          |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Chi tiết Từng Subphase & Tiêu chí Nghiệm thu (Exit Criteria)

### Subphase WEB-01.3.A.1 — Runtime Configuration Architecture & Dynamic Hook
- **Mục tiêu:** Xây dựng tầng lưu trữ cấu hình bền vững trên máy chủ và cầu nối đồng bộ xuống client.
- **Nội dung công việc:**
  1. Tạo module máy chủ quản lý tệp cấu hình `.starfront-config/runtime-asset-config.json`.
  2. Tạo API Route `GET /api/admin/asset-version` cấp phát cấu hình công khai cho game.
  3. Xây dựng `AssetConfigProvider` và hook `useAssetConfig()` trong React.
  4. Mở rộng `resolveImageUrl()` để tự động ưu tiên cấu hình động từ Provider khi có sẵn.
- **Tiêu chí nghiệm thu:**
  - TypeScript `tsc --noEmit` PASS.
  - Next.js build PASS.
  - Không có cảnh báo Hydration Mismatch giữa SSR và Client.

---

### Subphase WEB-01.3.A.2 — GitHub Discovery Proxy & Validation Engine
- **Mục tiêu:** Tự động lấy danh sách phiên bản từ GitHub mà không sợ bị chặn IP, và kiểm định chất lượng tệp trước khi áp dụng.
- **Nội dung công việc:**
  1. Xây dựng API Route `GET /api/admin/asset-version/releases` có bộ đệm máy chủ TTL = 10 phút.
  2. Xây dựng hàm kiểm định nhanh `runFastValidation(tag)` qua CDN HEAD request.
  3. Xây dựng hàm kiểm định toàn diện `runFullCanonicalAudit(tag)` đối chiếu với 26 ảnh cốt lõi.
- **Tiêu chí nghiệm thu:**
  - Gọi API 10 lần liên tục chỉ tiêu tốn 1 request tới GitHub API (bộ đệm hoạt động chính xác).
  - Phân loại chuẩn xác các trạng thái: `ACTIVE`, `VERIFIED`, `INCOMPATIBLE`, `INVALID`.

---

### Subphase WEB-01.3.A.3 — AdminCP UI Integration & Sandboxed Preview
- **Mục tiêu:** Đưa giao diện quản lý phiên bản trực quan vào bảng điều khiển AdminCP.
- **Nội dung công việc:**
  1. Thêm Tab thứ 9 vào `components/game/world/admin-settings-modal.tsx`.
  2. Thiết kế khối `Active Version Card` với trạng thái kết nối thời gian thực.
  3. Thiết kế bảng danh sách Release Tags có phân trang/thanh cuộn và nút làm mới.
  4. Thiết kế khối `Sandboxed Artwork Preview` cho phép xem trước tranh của tag mục tiêu.
  5. Đảm bảo hiển thị hoàn hảo trên cả Desktop và Mobile.
- **Tiêu chí nghiệm thu:**
  - Giao diện đồng nhất với ngôn ngữ Sci-Fi Terminal của AdminCP.
  - Xem trước ảnh của tag mới không làm thay đổi ảnh hiển thị của game chính.

---

### Subphase WEB-01.3.A.4 — Two-Step Activation, Revision Locking & Audit Log
- **Mục tiêu:** Hiện thực hóa quy trình chuyển đổi phiên bản an toàn tuyệt đối.
- **Nội dung công việc:**
  1. Hiện thực hóa Dialog Bước 1: Tóm tắt so sánh và kết quả kiểm định.
  2. Hiện thực hóa Dialog Bước 2: Cảnh báo nguy cấp và yêu cầu gõ lại tên Tag để xác nhận.
  3. Xây dựng API Route `POST /api/admin/asset-version` có bảo vệ bằng `ADMIN_SECRET_KEY`.
  4. Cơ chế khóa tương tranh lạc quan dựa trên số hiệu `revision`.
  5. Ghi tệp nhật ký kiểm toán `.starfront-config/asset-version-audit.log`.
- **Tiêu chí nghiệm thu:**
  - Không thể kích hoạt nếu thiếu xác nhận bước 2 hoặc sai mã Admin.
  - Ngăn chặn hoàn toàn lỗi ghi đè đồng thời khi 2 phiên admin cùng kích hoạt.

---

### Subphase WEB-01.3.A.5 — One-Click Rollback & End-to-End Regression
- **Mục tiêu:** Hoàn thiện tính năng hoàn tác tức thì và nghiệm thu toàn diện hệ thống.
- **Nội dung công việc:**
  1. Hiện thực hóa nút bấm `Hoàn tác về phiên bản trước` (One-Click Rollback) trong giao diện.
  2. Kiểm thử kịch bản: Kích hoạt Tag mới ➔ Kiểm tra ảnh hiển thị ➔ Bấm Rollback ➔ Kiểm tra ảnh quay về bản cũ mượt mà.
  3. Chạy toàn bộ test suite (Resolver Unit Tests, TypeScript, Next.js Production Build).
  4. Cập nhật tài liệu bàn giao Checkpoint chính thức.
- **Tiêu chí nghiệm thu:**
  - Rollback hoàn tất trong vòng dưới 1 giây.
  - Build PASS, Lint PASS, Zero broken images.

---

## 3. Điều kiện Khởi động Thực thi (Pre-requisites for Implementation)

Hệ thống **CHỈ BẮT ĐẦU TRIỂN KHAI CODE** khi:
1. Bản tài liệu kế hoạch này (`WEB01_3A_...`) được chủ dự án xem xét và phê duyệt chính thức.
2. Chủ dự án xác nhận lựa chọn phương thức xác thực Admin (Mã PIN cố định hoặc Secret Token).
3. Người dùng cấp lệnh rõ ràng yêu cầu triển khai subphase cụ thể (ví dụ: `Bắt đầu triển khai WEB-01.3.A.1`).
