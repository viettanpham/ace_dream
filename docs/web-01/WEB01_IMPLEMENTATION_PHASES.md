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
- **Trạng thái:** **PACKAGE_READY (Giai đoạn chuẩn bị hoàn tất, chờ xác nhận GitHub Owner & Drive Backup)**
- **Đầu vào:** 26 tệp WebP nguồn trong `public/images/`.
- **Kết quả thực hiện:**
  1. Đã tạo staging package độc lập: `starfront-world-assets/` gồm:
     - `images/`: 26 tệp WebP nguyên gốc (5.94 MB / 6,230,606 bytes), không biến đổi hay resize.
     - `manifests/assets-manifest.json`: Chứa metadata, kích thước, nhóm và mã SHA-256 từng tệp.
     - `SHA256SUMS.txt`: Bảng đối chiếu mã băm SHA-256 chuẩn hóa cho 26 tệp.
     - `README.md`: Hướng dẫn cấu trúc, cú pháp jsDelivr và quy ước tag `@v2.0-assets-r1`.
  2. Đã đóng gói kho lưu trữ dự phòng: `starfront-world-assets-v2.0-backup.zip` (5.95 MB / 6,239,884 bytes).
  3. Đã cấu hình `.gitignore` để tránh commit nhầm tệp nhị phân staging vào repository mã nguồn.
  4. Đã chạy kiểm thử tự động `sha256sum`: Đạt 26/26 tệp khớp 100% với nguồn `public/images/`.
- **Trạng thái thành phần:**
  - `PACKAGE_READY`: Đã đạt 100%.
  - `BACKUP_PENDING`: Tệp ZIP sẵn sàng, chờ chủ dự án tải lên Google Drive cá nhân.
  - `REPOSITORY_PENDING`: Package sẵn sàng, chờ chủ dự án tạo GitHub repository `starfront-world-assets` và gắn tag `v2.0-assets-r1`.
- **Tiêu chí nghiệm thu (Exit Criteria):**
  - Khi chủ dự án tạo xong repo và push tag `v2.0-assets-r1`, kiểm tra thử 1 URL qua jsDelivr (`https://cdn.jsdelivr.net/gh/<owner>/starfront-world-assets@v2.0-assets-r1/images/marcus-portrait.webp`) trả về HTTP 200 trước khi sang WEB-01.3.

---

### Phase WEB-01.3 — CDN & Resolver Implementation (Tích hợp Module Phân giải)
- **Trạng thái:** **HOÀN THÀNH (VERIFIED - 8/8 UNIT TESTS PASS, BUILD PASS)**
- **Điều kiện bắt đầu:** Phase WEB-01.2 hoàn thành và tag `v2.0-assets-r1` đã hoạt động.
- **Nội dung đã thực hiện:**
  1. Tạo module `lib/game/assets/image-resolver.ts` với hàm `resolveImageUrl()`, `isCdnEnabled()`, `getResolverConfig()`.
  2. Cập nhật `next.config.mjs`: Thêm `cdn.jsdelivr.net` vào danh sách `images.remotePatterns` (`/gh/viettanpham/starfront-assets@**`).
  3. Cập nhật `.env.example` với `NEXT_PUBLIC_ASSET_STORAGE_MODE=jsdelivr` và `NEXT_PUBLIC_ASSET_CDN_URL`.
  4. Tạo bộ unit test `tests/image-resolver.test.ts` (8/8 ca kiểm thử PASS bao quát CDN, local, R2, empty string, URL tuyệt đối, query params).
  5. Tích hợp `resolveImageUrl` vào toàn bộ các component UI V2 (9 tệp) và UI V1 (6 tệp).
- **Tiêu chí nghiệm thu (Exit Criteria):**
  - Typecheck `tsc --noEmit` PASS.
  - Build `npm run build` PASS.
  - Các hàm kiểm thử resolver đạt 100% PASS (8/8).
  - Tải live từ jsDelivr thành công HTTP 200, MIME `image/webp`.

---

### Phase WEB-01.4 — Pilot Migration & Regression Plan (Chuyển đổi Thử nghiệm 3 Ảnh GEAR)
- **Trạng thái:** **HOÀN THÀNH (VERIFIED - 26/26 ASSETS MATCH, GEAR PASS, PILOT PASS, ROLLBACK PASS)**
- **Điều kiện bắt đầu:** Phase WEB-01.3 hoàn thành.
- **Phạm vi thử nghiệm:**
  - 3 tệp phi cơ GEAR V1: `vanguard-gear.webp`, `falcon-gear.webp`, `aegis-gear.webp`.
  - 8 phi công V1: Marcus, Valentine, Alviss, Eric, Lyra, Kaelen, Selena, Victor.
  - Character Category V2 (`/v2/pilots`): Valentine Profile, Gallery, Lightbox, Mobile/Desktop layouts, Archive Pending.
- **Nội dung đã thực hiện & Kết quả kiểm thử:**
  1. **GEAR V1 (3/3):** Cả 3 tệp tải thành công từ jsDelivr với HTTP 200, Content-Type `image/webp`, mã băm SHA-256 khớp 100% với tệp local.
  2. **Pilot V1 (8/8):** Cả 8 phi công với 23 tệp WebP (portrait, fullbody, combat...) tải thành công qua CDN, khớp 100% SHA-256.
  3. **V2 Archive Pending Protection:** Đã xác minh 10 tác phẩm dạng Archive Pending không tạo bất kỳ thẻ `<img>` lỗi hay request mạng 404 nào.
  4. **Local Rollback Test:** Khi đặt `mode: 'local'`, resolver phân giải chính xác về `/images/...` không bị lỗi.
  5. **Bảo toàn dữ liệu gốc:** Không can thiệp `data.ts`, `character-profile-data.ts`, không sửa `.starfront-saves/`, giữ nguyên 26 tệp trong `public/images/`.
- **Tiêu chí nghiệm thu (Exit Criteria):**
  - Màn hình Hangar, Chọn phi cơ và Roster V2 hiển thị chuẩn xác không lỗi console.
  - Zero lỗi network request 404.
  - Build PASS, Lint PASS, 8/8 unit tests PASS, 26/26 CDN SHA256 MATCH.

---

### Phase WEB-01.3.A — AdminCP Runtime Asset Version Manager (Roadmap Concept Approved)
- **Trạng thái:** ROADMAP CONCEPT APPROVED (Ghi nhận kiến trúc, KHÔNG code trong WEB-01.4)
- **Mô tả chức năng:**
  1. Liệt kê GitHub release/tag từ `viettanpham/starfront-assets`.
  2. Hiển thị Active Version hiện hành.
  3. Preview artwork ở version được chọn.
  4. Validate manifest và tính sẵn sàng của asset trên CDN trước khi áp dụng.
  5. Quy trình xác nhận 2 bước an toàn (Two-step confirmation).
  6. Kích hoạt phiên bản runtime không cần rebuild server.
  7. Rollback tức thời về tag trước đó.
  8. Phân quyền Admin và Audit Log.
  9. Bảo vệ FND-8 Gallery: Không tự động đưa artwork chưa đăng ký vào hồ sơ phi công.

---

### Phase WEB-01.5 — Full Image Migration & Safe Repository Cleanup (Chuyển đổi Toàn bộ & Dọn dẹp)
- **Trạng thái:** **HOÀN THÀNH (CLEANUP_VERIFIED - 26/26 WEBP REMOVED, 5.94 MB FREED, ZERO REGRESSION)**
- **Điều kiện bắt đầu:** Phase WEB-01.4 nghiệm thu đạt yêu cầu và backup Google Drive / Staging đã xác minh.
- **Nội dung đã thực hiện:**
  1. Loại bỏ an toàn 26 tệp WebP khỏi thư mục `public/images/`.
  2. Bảo toàn nguyên vẹn tệp `public/icon.svg` và duy trì cấu trúc thư mục rỗng với `.gitkeep`.
  3. Giải phóng 6,230,606 bytes (~5.94 MB) dung lượng tệp nhị phân khỏi working tree. Thư mục `public/` giảm từ 6.0 MB xuống còn 2.5 KB.
  4. Chạy kiểm thử tự động sau dọn dẹp `scripts/web01-post-cleanup-verify.ts`: 26/26 ảnh trên CDN khớp 100% SHA-256 theo manifest.
  5. Cập nhật tài liệu và quy trình phục hồi khẩn cấp (Emergency Local Rollback).
- **Tiêu chí nghiệm thu (Exit Criteria):**
  - Số file WebP trong `public/images/`: 0 tệp.
  - Tệp `public/icon.svg`: Tồn tại nguyên vẹn.
  - Build PASS, Lint PASS, 8/8 unit tests PASS, 26/26 CDN SHA256 MATCH.
  - Tuyến đường `/v2/pilots` và `/` phản hồi HTTP 200.

---

### Phase WEB-01.6 — Web Hosting & Cloud Save Roadmap (Lộ trình Tương lai)
- **Trạng thái:** PROPOSED FUTURE ARCHITECTURE (Chỉ lập kế hoạch, KHÔNG code trong đợt này)
- **Mô hình mục tiêu đã thống nhất:** **Single-player Online (Model A)**.
- **Các thành phần tương lai:**
  1. **Web Frontend Hosting:** Triển khai Next.js Standalone lên nền tảng miễn phí/tối ưu (Cloudflare Pages, Vercel Hobby hoặc container Cloud Run).
  2. **Image Delivery:** Duy trì jsDelivr CDN qua kho GitHub Assets hoặc Cloudflare R2 khi đạt quy mô lớn.
  3. **Backend Cloud Save:** Triển khai API Route `/api/user/save` kết hợp cơ sở dữ liệu nhẹ (Cloud SQL PostgreSQL hoặc Firebase Firestore theo Foundation FND-6/FND-7) để lưu trữ tiến trình phi đội, tài nguyên và cấu hình phi công mà không phụ thuộc vào `localStorage` của trình duyệt.
