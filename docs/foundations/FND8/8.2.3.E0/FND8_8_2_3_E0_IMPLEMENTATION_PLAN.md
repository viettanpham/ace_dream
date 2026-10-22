# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BOUNDED IMPLEMENTATION & TEST PLAN (V2 FOUNDATION & DUAL SHELL ALIGNED)

**Ngày cập nhật:** 2026-10-22  
**Chế độ:** DEFINE / PLAN ONLY — Khóa kế hoạch triển khai và ma trận nghiệm thu  
**Phạm vi:** 8.2.3.E.0 — Character Category / Pilot Profile UI Rebuild  

---

## 1. Tình Trạng Cổng Kiểm Soát (Blocker Gate Status)

> [!NOTE]
> ### ✅ CỔNG CHẶN BLOCKER ĐÃ GIẢI PHÓNG: 3 ẢNH CONCEPT PNG ĐÃ CÓ MẶT
> - Thư mục `docs/art-direction/UI_CONCEPTS/` chứa đủ 3 file PNG:
>   - `FND8_823_CHARACTER_CATEGORY_PROFILE_DESKTOP_APPROVED.png`
>   - `FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_APPROVED.png`
>   - `FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_INFO_VIEW_REFERENCE.png`
> - Đạt điều kiện kiểm chứng trực quan; kế hoạch triển khai sau này sẽ bám sát 100% bố cục và chi tiết từ các ảnh này.

---

## 2. Phân Kỳ Triển Khai Có Giới Hạn (Bounded Phases)

### 2.1 Ma Trận Phụ Thuộc Với Lộ Trình UI Foundation
Theo `docs/UI_v2/05_UI_V2_IMPLEMENTATION_ROADMAP.md`:
- **Phase 1 (Core Primitives):** Đã hoàn tất (`components/game/v2/ui/`).
- **Phase 2 (Shared Art Viewer):** Xây dựng component xem ảnh phóng to/thu nhỏ chuẩn `components/game/v2/ui/art-viewer.tsx`.
- **Phase 3 (Official V2 Shell):** Shell 4 tầng, Navigation Registry, Settings switch V1/V2.
- **Phase 4 / E.0 (Pilot Profile V2 Rebuild):** Xây dựng lại trang Pilot Profile.

**Chiến Lược Khuyến Nghị Về Ranh Giới (Recommended Sequencing):**
1. **Lộ trình chuẩn tắc:** Người dùng kích hoạt triển khai **Foundation Phase 2 (Shared Art Viewer)** trước, sau đó đến **Foundation Phase 3 (V2 Shell)**, rồi E.0 Rebuild sẽ được đặt trực tiếp vào V2 Shell chính thức.
2. **Lộ trình độc lập có ranh giới an toàn (Fast-Track Bounded Phase):** Nếu người dùng muốn triển khai E.0 Rebuild ngay, E.0 sẽ dùng bộ Primitives có sẵn từ Phase 1 và tích hợp một module xem ảnh chuẩn hóa (tuân thủ interface của Phase 2 Art Viewer) để khi Phase 2 và Phase 3 hoàn tất chỉ cần cắm vào mà không phải sửa lại giao diện.

---

### 2.2 Các Pha Của Gói E.0 Rebuild

#### Phase E.0-PLAN: Rà Soát Thực Địa & Khóa Thiết Kế (Phiên Hiện Tại)
- **Mục tiêu:** Rà soát mã nguồn, kiểm chứng dữ liệu Valentine, xác minh asset WebP, khóa hợp đồng UI Desktop/Mobile và cập nhật tài liệu chuẩn.
- **Kết quả:** Không sửa code; xuất báo cáo toàn diện và chờ phê duyệt từ người dùng.

#### Phase E.0-REBUILD-1: Xây Dựng Bản UI V2 Mới Sạch Sẽ (Desktop + Mobile Đồng Thời)
- **Mục tiêu:**
  - Cô lập hoàn toàn bản thử nghiệm cũ `components/game/v2/character-profile/` (đánh dấu `LEGACY_V2_EXPERIMENT`).
  - Xây dựng module mới sử dụng trực tiếp **UI Primitives V2** (`components/game/v2/ui/`): Button, Tabs, Card, Tooltip, Dialog/Drawer.
  - Xây dựng **Desktop View 1440px (3 cột)**:
    - Roster phi công (hỗ trợ Full/Mini).
    - Khung trưng bày trung tâm với **2 điều khiển bối cảnh (Standard vs Tactical HUD)** và nút mở Art Viewer.
    - Cột thông tin 4 tabs (`OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`).
    - Phân tách độc lập `characterQuote` và `shortDescription`.
  - Xây dựng **Mobile Paired States (375px–430px)**:
    - **Mobile Art View**: Tranh toàn màn hình, nút chuyển bối cảnh cảm ứng $\ge 44 \times 44\text{px}$, nút xem hồ sơ nổi.
    - **Mobile Info View**: Horizontal Roster 76px/ô, header gọn, 4 tabs, cỡ chữ body 16px, story 17px.
    - Bỏ hoàn toàn nút Wizard ("CHỌN NHÂN VẬT") và padding rườm rà.
  - Tích hợp **Data Adapter V2** và **Chính Sách WebP & Zero 404**:
    - Nạp 2 ảnh thật: `valentine-fullbody.webp` và `valentine-portrait.webp`.
    - 28 ảnh còn lại hiển thị dạng thẻ lưu trữ "Chờ Đồng Bộ WebP", 0 lỗi 404 trên Network.
- **Tiêu chuẩn hoàn tất:** Compile pass 0 lỗi TypeScript, 0 lỗi lint, kiểm thử mượt mà trên Desktop và Mobile.

#### Phase E.0-REBUILD-2: Nghiệm Thu Thực Tế & Tinh Chỉnh Cảm Ứng
- **Mục tiêu:** Kiểm thử thực tế trên thiết bị thật, ghi nhận phản hồi và xử lý các vi chỉnh (nếu có).

---

## 3. Kế Hoạch Thay Đổi Tệp (File-Change Plan)

### 3.1 Tệp Sẽ Tạo Mới Trong Phase Implementation Sau
1. `lib/game/v2/character-profile-data.ts`: Data Adapter trích xuất dữ liệu canonical FND-8.
2. `components/game/v2/pilot-profile/`: Thư mục module mới độc lập (thay vì ghi đè lên thư mục thử nghiệm cũ):
   - `pilot-profile-container.tsx`: Điều phối responsive desktop/mobile.
   - `desktop-view.tsx`: Giao diện desktop 3 cột.
   - `mobile-art-view.tsx`: Giao diện ngắm tranh mobile tràn màn hình.
   - `mobile-info-view.tsx`: Giao diện thông số & story mobile.
   - `tabs/overview-tab.tsx`: 6 chỉ số 20 điểm, 2 Traits tooltip, thông tin nhân thân.
   - `tabs/story-tab.tsx`: Toàn văn Chương 01, lộ trình 10 chương.
   - `tabs/gear-compat-tab.tsx`: Bảng tương thích cơ giáp (Aegis/Vanguard/Falcon).
   - `tabs/gallery-tab.tsx`: 2 ảnh WebP thật + Thẻ Archive cho 28 ảnh chờ đồng bộ.

### 3.2 Tệp Giữ Nguyên Tuyệt Đối (Untouched Files)
- `components/game/starfront-shell.tsx` (V1 shell, không sửa layout).
- `components/game/pilot-gallery.tsx` (V1 gallery giữ nguyên).
- `components/game/character-gear-select.tsx` (V1 gear select giữ nguyên).
- `lib/game/data.ts` (V1 data).
- `lib/game/types.ts` (V1 types).
- `docs/art-direction/PILOT/VALENTINE/valentine_assets_manifest.json` (Hồ sơ provenance gốc).

---

## 4. Danh Mục Tiêu Chí Chấp Nhận (Acceptance Checklist)

| STT | Tiêu Chí Kiểm Tra | Yêu Cầu Chi Tiết | Cách Kiểm Thử |
|---|---|---|---|
| 1 | **Không Kế Thừa CSS V1** | Sử dụng toàn bộ Tailwind v4 và Primitives V2; không dùng CSS scanline xanh lá V1. | Kiểm tra mã nguồn module mới. |
| 2 | **Khả Năng Đọc & Kiểu Chữ** | Story font 16–17px, line-height 1.65, max-w-prose. Body font 15–16px. Không font < 12px. | Kiểm tra DevTools Inspector. |
| 3 | **Touch Target Mobile >= 44px** | Toàn bộ Tabs, Nút bấm, Toggle chuyển bối cảnh trên mobile đạt $\ge 44 \times 44\text{px}$. | Kiểm tra DevTools Mobile Mode bounding box. |
| 4 | **Hai Background Controls** | Hoạt động trên cả Desktop (2 bên tranh) và Mobile (floating bar ở Art View). | Click chuyển đổi giữa Standard và Tactical HUD. |
| 5 | **Đồng Thời Desktop & Mobile** | Hoàn thành ngay trong cùng một phase triển khai; mobile có bố cục riêng biệt. | Kiểm tra màn hình 1440px và 390px. |
| 6 | **Đầy Đủ 4 Tab & Tách Biệt Quote** | 4 Tab chuẩn; `characterQuote` và `shortDescription` là 2 khối riêng biệt. | Kiểm tra cấu trúc DOM và giao diện. |
| 7 | **Dữ Liệu Thật Của Valentine** | 20 điểm thuộc tính chuẩn, 2 Trait V2, Chương 01 toàn văn tiếng Việt, Chương 7–10 HOLD. | Đối chiếu với hồ sơ lore canonical. |
| 8 | **Chính Sách WebP & Zero 404** | Chỉ nạp ảnh có thật trên đĩa (`valentine-fullbody.webp`, `valentine-portrait.webp`). 28 ảnh còn lại là thẻ Archive Card. 0 lỗi 404. | Kiểm tra tab Network: 100% request HTTP 200. |
| 9 | **Không Có Wizard Artifacts** | Không có nút "CHỌN NHÂN VẬT", không có step wizard. | Kiểm tra giao diện không có tàn tích wizard. |
| 10 | **Bảo Toàn 100% V1 & Build Pass** | V1 hoạt động bình thường, `compile_applet` và `lint_applet` đạt 0 lỗi. | Chạy lệnh build kiểm tra. |

---

## 5. Quy Trình Kiểm Thử Đích (Targeted Test Plan)

### 5.1 Desktop Viewport (1440 × 900)
1. Mở trang Category/Profile V2.
2. Kiểm tra cột Roster bên trái và chọn Valentine.
3. Kiểm tra Showcase tranh trung tâm:
   - Thử nghiệm Toggle Background 1 (Standard) và Toggle Background 2 (Tactical HUD).
   - Thử nghiệm mở Art Viewer phóng to, rê kéo chuột và bấm phím Escape để đóng.
4. Kiểm tra Cột phải:
   - Đảm bảo `characterQuote` và `shortDescription` hiển thị thành 2 khối tách biệt rõ ràng.
   - Duyệt qua 4 tab: `OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`.

### 5.2 Mobile Viewport (390 × 844)
1. Bật DevTools ở kích thước 390px.
2. Kiểm tra `Mobile Art View`:
   - Tranh toàn thân hiển thị tràn viền, không bị cắt crop.
   - Thao tác 2 nút chuyển đổi bối cảnh ở thanh công cụ đáy touch-friendly ($\ge 44\text{px}$).
   - Bấm nút `[ 📄 Xem Hồ Sơ ]` để chuyển sang `Mobile Info View`.
3. Kiểm tra `Mobile Info View`:
   - Horizontal Roster cuộn mượt, chiều rộng mỗi ô 76px, tên nhân vật đầy đủ.
   - Duyệt qua 4 tab với cỡ chữ thoải mái, touch target lớn.
