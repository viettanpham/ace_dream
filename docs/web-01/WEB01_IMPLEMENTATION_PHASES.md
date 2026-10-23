# STARFRONT WORLD V2 — WEB-01
# KẾ HOẠCH TRIỂN KHAI PHÂN KỲ CHI TIẾT (IMPLEMENTATION PHASES SPECIFICATION)

**Mã tài liệu:** WEB01-PHASES-01  
**Trạng thái:** PROPOSED PHASED ROADMAP  
**Ngày lập:** 2026-10-22  
**Nguyên tắc triển khai:** Thực hiện từng phase tuần tự, độc lập; dừng tại checkpoint để nghiệm thu; tuyệt đối không nhảy cóc hoặc chạy gộp các phase.

---

## 1. Sơ đồ tuần tự các Phase & Điều kiện phụ thuộc

```
+-----------------------------------------------------------------------------------+
|                              LỘ TRÌNH TRIỂN KHAI WEB-01                           |
|                                                                                   |
|  [WEB-01.1: Audit & Inventory] ---------------------> ĐÃ HOÀN TẤT (PLAN)          |
|         |                                                                         |
|         v                                                                         |
|  [WEB-01.2: Asset Repo & Backup Prep] -------------> Chờ phê duyệt tài khoản GitHub |
|         |                                            và tạo backup Google Drive   |
|         v                                                                         |
|  [WEB-01.3: CDN & Resolver Implementation] ---------> Viết image-resolver.ts      |
|         |                                            và cấu hình Next.js          |
|         v                                                                         |
|  [WEB-01.4: Pilot Migration - 3 GEARs] -------------> Thử nghiệm 3 ảnh GEAR       |
|         |                                            Kiểm tra V1 Hangar & Shop    |
|         v                                                                         |
|  [WEB-01.5: Full Migration & Repo Cleanup] ---------> Chuyển 23 ảnh Pilot V1 & V2 |
|         |                                            Dọn dẹp public/images/       |
|         v                                                                         |
|  [WEB-01.6: Web Hosting & Cloud Save Roadmap] ------> Định hướng tương lai Model A |
+-----------------------------------------------------------------------------------+
```

---

## 2. Chi tiết từng Phase

### Phase WEB-01.1 — Audit & Asset Inventory (Khảo sát & Kiểm kê)
- **Trạng thái:** **HOÀN THÀNH (VERIFIED TRONG PLAN)**
- **Đầu vào:** Thư mục `public/images/`, các component V1 và FND-8 V2.
- **Nội dung đã làm:**
  - Quét 26 tệp WebP (5.44 MB) và tính toán mã băm SHA-256.
  - Rà soát 21 component UI, 31 reference trong `data.ts`, 36 reference trong `character-profile-data.ts`.
  - Phân tích rủi ro môi trường AI Studio container.
- **Đầu ra:** Báo cáo kiểm kê `WEB01_PUBLIC_IMAGES_INVENTORY.md` và kiểm toán `WEB01_IMAGE_REFERENCE_AUDIT.md`.

---

### Phase WEB-01.2 — Asset Repository & Backup Preparation (Chuẩn bị Kho lưu trữ & Sao lưu)
- **Trạng thái:** PENDING APPROVAL (Chờ duyệt tài khoản GitHub)
- **Điều kiện bắt đầu:** Chủ dự án phê duyệt kế hoạch Master Plan và xác nhận tên tài khoản GitHub (Owner).
- **Nội dung thực hiện:**
  1. Chủ dự án tạo hoặc ủy quyền tạo GitHub Public Repository: `starfront-world-assets`.
  2. Tạo bản sao lưu dự phòng toàn bộ 26 tệp WebP lên Google Drive an toàn.
  3. Đẩy cấu trúc thư mục chuẩn lên repo assets:
     ```
     starfront-world-assets/
       ├── images/
       │     ├── aegis-gear.webp
       │     ├── ... (26 tệp webp)
       ├── manifest.json (bảng băm SHA-256 và metadata)
       └── README.md
     ```
  4. Đóng gói Git Release Tag đầu tiên: `v2.0-assets-r1`.
- **Tiêu chí nghiệm thu (Exit Criteria):**
  - Truy cập thử trực tiếp 1 URL qua jsDelivr: `https://cdn.jsdelivr.net/gh/<owner>/starfront-world-assets@v2.0-assets-r1/images/marcus-portrait.webp` trả về HTTP 200 trong trình duyệt.

---

### Phase WEB-01.3 — CDN & Resolver Implementation (Tích hợp Module Phân giải)
- **Trạng thái:** PENDING APPROVAL
- **Điều kiện bắt đầu:** Phase WEB-01.2 hoàn thành và tag `v2.0-assets-r1` đã hoạt động.
- **Nội dung thực hiện:**
  1. Tạo module `lib/game/assets/image-resolver.ts` với hàm `resolveImageUrl()`.
  2. Cập nhật `next.config.mjs`: Thêm `cdn.jsdelivr.net` vào danh sách `images.remotePatterns`.
  3. Cập nhật `.env.example` với các biến môi trường cấu hình `NEXT_PUBLIC_ASSET_STORAGE_MODE` và `NEXT_PUBLIC_ASSET_CDN_URL`.
  4. Tạo test kiểm thử đơn vị cho `resolveImageUrl()` (kiểm tra các case: relative path, absolute path, empty path, local mode, cdn mode).
- **Tiêu chí nghiệm thu (Exit Criteria):**
  - Typecheck `tsc --noEmit` PASS.
  - Build `npm run build` PASS.
  - Các hàm kiểm thử resolver đạt 100% PASS.

---

### Phase WEB-01.4 — Pilot Migration & Regression Plan (Chuyển đổi Thử nghiệm 3 Ảnh GEAR)
- **Trạng thái:** PENDING APPROVAL
- **Điều kiện bắt đầu:** Phase WEB-01.3 hoàn thành.
- **Phạm vi thử nghiệm hẹp:**
  - Chỉ 3 tệp phi cơ GEAR V1: `vanguard-gear.webp`, `falcon-gear.webp`, `aegis-gear.webp`.
- **Nội dung thực hiện:**
  1. Bọc hàm `resolveImageUrl()` tại điểm render của các component hiển thị GEAR:
     - `components/game/starfront-hangar.tsx`
     - `components/game/character-gear-select.tsx`
  2. Bật chế độ `NEXT_PUBLIC_ASSET_STORAGE_MODE=jsdelivr` trong môi trường preview.
  3. Giữ nguyên 3 tệp trên đĩa cục bộ (chưa xóa) để bảo đảm fallback an toàn.
  4. Kiểm tra Network tab: Xác nhận 3 ảnh GEAR tải thành công từ `cdn.jsdelivr.net` với HTTP Status 200.
  5. Đổi sang `NEXT_PUBLIC_ASSET_STORAGE_MODE=local`: Xác nhận game tự động quay lại nạp từ đĩa không có lỗi.
- **Tiêu chí nghiệm thu (Exit Criteria):**
  - Màn hình Hangar và Chọn phi cơ hiển thị đúng 100% hình ảnh GEAR trên cả desktop và mobile.
  - Zero lỗi console hoặc warning trong Network tab.

---

### Phase WEB-01.5 — Full Image Migration & Safe Repository Cleanup (Chuyển đổi Toàn bộ & Dọn dẹp)
- **Trạng thái:** PENDING APPROVAL
- **Điều kiện bắt đầu:** Phase WEB-01.4 nghiệm thu đạt yêu cầu.
- **Nội dung thực hiện:**
  1. Áp dụng `resolveImageUrl()` cho các điểm render còn lại:
     - Avatar phi công V1 (`pilot-gallery.tsx`, `war-room.tsx`, `pilot-panel.tsx`, `starfront-home.tsx`).
     - Character Profile V2 (`desktop-view.tsx`, `mobile-art-view.tsx`, `mobile-info-view.tsx`, `art-viewer.tsx`).
  2. Bật CDN cho toàn bộ 26 tệp.
  3. Kiểm tra hồi quy toàn diện (Regression Test):
     - Màn hình V1: Đăng nhập -> Chọn phi công -> Trang bị -> Hangar -> Combat log.
     - Màn hình V2 (`/v2/pilots`): Bố cục Desktop 3 cột, Mobile Art View, Mobile Info View, Tab Gallery (chuyển đổi giữa 7 ảnh thật và 5 thẻ Archive Card).
  4. Sau khi kiểm tra thành công: Di chuyển các tệp ảnh trong `public/images/` vào thư mục lưu trữ ngoài hoặc dọn dẹp có kiểm soát (giữ lại `public/icon.svg`).
  5. Đánh giá kích thước working tree sau dọn dẹp (giảm ngay 5.44 MB binary).
- **Tiêu chí nghiệm thu (Exit Criteria):**
  - Build PASS, Lint PASS, UI hiển thị toàn diện không gãy ảnh.

---

### Phase WEB-01.6 — Web Hosting & Cloud Save Roadmap (Lộ trình Tương lai)
- **Trạng thái:** PROPOSED FUTURE ARCHITECTURE (Chỉ lập kế hoạch, KHÔNG code trong đợt này)
- **Mô hình mục tiêu đã thống nhất:** **Single-player Online (Model A)**.
- **Các thành phần tương lai:**
  1. **Web Frontend Hosting:** Triển khai Next.js Standalone lên nền tảng miễn phí/tối ưu (Cloudflare Pages, Vercel Hobby hoặc container Cloud Run).
  2. **Image Delivery:** Duy trì jsDelivr CDN qua kho GitHub Assets hoặc Cloudflare R2 khi đạt quy mô lớn.
  3. **Backend Cloud Save:** Triển khai API Route `/api/user/save` kết hợp cơ sở dữ liệu nhẹ (Cloud SQL PostgreSQL hoặc Firebase Firestore theo Foundation FND-6/FND-7) để lưu trữ tiến trình phi đội, tài nguyên và cấu hình phi công mà không phụ thuộc vào `localStorage` của trình duyệt.
