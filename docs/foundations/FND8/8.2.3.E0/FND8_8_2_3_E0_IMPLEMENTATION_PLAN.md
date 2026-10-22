# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BOUNDED IMPLEMENTATION PLAN & ACCEPTANCE TEST PLAN (REVISED)

**Ngày cập nhật:** 2026-10-22  
**Chế độ:** DEFINE / PLAN ONLY (Rà soát & cập nhật theo kết quả audit mã nguồn thực tế)  
**Phạm vi:** 8.2.3.E.0 — Character Category / Pilot Profile UI Foundation  

---

## 1. Phân Kỳ Triển Khai (Bounded Phases)

### Phase E.0-IMPLEMENT-1: Xây Dựng Shell & Component V2 Độc Lập (Desktop + Mobile)
- **Mục tiêu:**
  - Thiết lập module V2 tại thư mục riêng `components/game/v2/character-profile/`.
  - Thiết lập Data Access Adapter tại `lib/game/v2/character-profile-data.ts`: adapter này chỉ đóng vai trò trích xuất dữ liệu canonical FND-8 đã được phê duyệt trong repo (`FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md`, `FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md`, `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`), **không nhân đôi hay tạo mới các chỉ số gameplay**, và thiết kế giao diện kiểu Provider sẵn sàng cắm trực tiếp vào FND-1 `CatalogRegistry` khi FND-8 registry được đăng ký trong tương lai.
  - Áp dụng **Chính sách WebP**: chỉ tải 2 file WebP thật trên đĩa (`/images/valentine-fullbody.webp`, `/images/valentine-portrait.webp`). Tuyệt đối không dùng `sourceFilename` để tải ảnh; 28 ảnh manifest chưa có file vật lý sẽ hiển thị dạng thẻ hồ sơ lưu trữ "Chờ Đồng Bộ WebP".
  - Triển khai song song cả **Desktop View (1440px)** và **Mobile View (375px–430px)** với 2 background controls và 4 tabs.
- **Tiêu chuẩn giao hàng:**
  - Có thể chuyển vào xem giao diện Category/Profile V2 từ Starfront Shell qua một tab hoặc nút điều hướng an toàn mà không ảnh hưởng tới `pilot-gallery.tsx` cũ.
  - Cả Desktop và Mobile hoạt động trơn tru; không lỗi 404 hình ảnh (Zero Broken Images).

### Phase E.0-IMPLEMENT-2: Hoàn Thiện Tương Tác Cảm Ứng Mobile & Phản Hồi Khiếm Khuyết
- **Mục tiêu:** Tiếp nhận phản hồi kiểm thử thực tế từ người dùng, tinh chỉnh các điểm chạm cảm ứng, hiệu ứng chuyển tab, bottom sheet chi tiết Trait trên mobile và căn chỉnh typography theo phản hồi.
- **Tiêu chuẩn giao hàng:** Không có lỗi giao diện nào trên cả Chrome desktop và Mobile emulator; build sạch `npm run build` không lỗi.

---

## 2. Kế Hoạch Thay Đổi Tệp (File-Change Plan)

### 2.1 Các Tệp Mới Được Tạo (New Isolated V2 Files)
1. **`lib/game/v2/character-profile-data.ts`**:
   - Data Access Layer cung cấp thông tin hiển thị cho UI V2: đọc dữ liệu canonical FND-8 (12 Class Personas, phân bổ 20 điểm thuộc tính, Trait V2, hồ sơ Valentine chuẩn).
   - Tách biệt rõ ràng việc đọc dữ liệu UI với logic động cơ gameplay; không nhân đôi Class stats hay Trait logic.
2. **`components/game/v2/character-profile/pilot-profile-v2.tsx`**:
   - Container component chính, tự động phát hiện viewport và quản lý trạng thái chọn nhân vật / bối cảnh.
3. **`components/game/v2/character-profile/desktop-profile-view.tsx`**:
   - Bố cục 3 cột Desktop chuẩn: Roster trái, Showcase + 2 Background Controls ở giữa, 4 Tabs thông tin ở phải.
4. **`components/game/v2/character-profile/mobile-profile-view.tsx`**:
   - Bố cục 2 trạng thái Mobile: `Mobile Info View` và `Mobile Art View` với thanh công cụ chạm đáy và 2 background toggles touch-friendly.
5. **`components/game/v2/character-profile/profile-tabs/`**:
   - `overview-tab.tsx`: 6 chỉ số thuộc tính, Traits với popover/tooltip giải thích, facts nhân thân.
   - `story-tab.tsx`: Biography summary, Chương 01 toàn văn tiếng Việt, trạng thái 02–10.
   - `gear-compat-tab.tsx`: Bảng tương thích 3 lớp Aegis, Vanguard, Falcon.
   - `gallery-tab.tsx`: Lưới ảnh thật + Thẻ lưu trữ trạng thái "Chờ Đồng Bộ WebP".
6. **`components/game/v2/character-profile/artwork-lightbox-modal.tsx`**:
   - Trình phóng to ảnh chi tiết (hỗ trợ zoom 1x-4x, pan kéo chuột, pinch-to-zoom trên màn hình chạm, nút xoay về 1x, tải ảnh).

### 2.2 Các Tệp Được Điều Chỉnh Nhẹ Cho Việc Tích Hợp (Minimal Integration Edits)
1. **`components/game/starfront-shell.tsx`**:
   - Thêm một mục menu hoặc toggle phụ chuyển sang `"Hồ Sơ Phi Công V2 (FND-8)"` (chỉ 1 nhánh điều kiện an toàn, giữ nguyên toàn bộ nhánh `"gallery"` cũ của V1).

### 2.3 Các Tệp Nghiêm Ngặt KHÔNG Chạm Vào (Isolated / Untouched)
- `components/game/pilot-gallery.tsx` (Giữ nguyên 1573 dòng legacy).
- `components/game/character-gear-select.tsx` (Giữ nguyên).
- `lib/game/data.ts` (Giữ nguyên).
- `lib/game/types.ts` (Giữ nguyên).
- `docs/art-direction/PILOT/VALENTINE/valentine_assets_manifest.json` (Giữ nguyên hồ sơ provenance gốc).
- `components/game/combat-arena.tsx`, `components/game/world/*` (Giữ nguyên).

---

## 3. Danh Mục Tiêu Chí Chấp Nhận (Acceptance Checklist)

| STT | Tiêu Chí Kiểm Tra (Acceptance Criteria) | Yêu Cầu Chi Tiết | Cách Kiểm Thử (Verification Method) |
|---|---|---|---|
| 1 | **Không Nhân Đôi Dữ Liệu Gameplay** | UI Data Access Layer chỉ đọc từ canonical FND-8; không tự bịa công thức hay duplicate stats. | Kiểm tra mã nguồn `lib/game/v2/character-profile-data.ts`. |
| 2 | **Chính Sách WebP & Zero Broken Images** | Chỉ nạp các ảnh `.webp` đã xác minh trên đĩa (`valentine-fullbody.webp`, `valentine-portrait.webp`). Không dùng `sourceFilename` để tải ảnh. | Kiểm tra Network Tab: 100% request ảnh đạt mã 200, không có mã 404. |
| 3 | **Đồng Thời Desktop & Mobile** | Hoạt động ngay ở Phase 1 trên cả màn hình rộng (>1280px) và màn hình điện thoại (375px–430px). | Thay đổi kích thước trình duyệt hoặc mở Device Mode trên DevTools. |
| 4 | **Hai Background Controls** | Có 2 điều khiển chuyển đổi bối cảnh hoạt động trên cả desktop và mobile (Elysia vs Buồng lái). | Click/tap lần lượt cả 2 nút; kiểm tra phông nền đổi mượt mà. |
| 5 | **Đầy Đủ 4 Tab** | Đủ 4 tab: `OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`. | Click chuyển qua lại từng tab; nội dung hiển thị tương ứng. |
| 6 | **Tách Biệt Quote & Short Bio** | `characterQuote` và `shortDescription` là 2 đoạn text riêng, không gộp làm một. | Kiểm tra DOM và giao diện thấy 2 khối chữ riêng biệt. |
| 7 | **Dữ Liệu Thật Của Valentine** | Chỉ số 20 điểm (2/2/2/6/6/2), 2 Trait V2, Chương 01 có toàn văn tiếng Việt, Chương 07–10 trạng thái HOLD. | Đối chiếu dữ liệu trên màn hình với `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`. |
| 8 | **Trình Soi Ảnh (Viewer/Inspector)**| Hoạt động trơn tru: zoom, kéo rê ảnh, đóng mở, phím tắt Esc. | Thao tác lăn chuột zoom, kéo chuột rê ảnh, bấm Esc để đóng. |
| 9 | **Không Phá Hỏng Legacy** | Toàn bộ các phân hệ V1 (Gallery cũ, Combat, Hangar, World) vẫn hoạt động nguyên vẹn. | Mở lại tab "Pilot Gallery" cũ kiểm tra xem mọi chức năng cũ còn nguyên. |
| 10 | **Kiểm Tra Build Sạch** | Chạy `compile_applet` không có lỗi TypeScript hoặc cú pháp. | Thực hiện lệnh compile và ghi nhận build success. |

---

## 4. Kế Hoạch Kiểm Thử Có Mục Tiêu (Targeted Test Plan)

### 4.1 Kiểm Thử Desktop Viewport (1440 × 900)
1. Mở Starfront Shell, chọn phân hệ "Hồ Sơ Phi Công V2 (FND-8)".
2. Kiểm tra Roster bên trái và chọn Valentine.
3. Kiểm tra Showcase tranh trung tâm:
   - Click Toggle Background 1 (Elysia Hangar) và Toggle Background 2 (Buồng Lái HUD).
   - Click nút phóng to mở Lightbox Inspector, thử Zoom và Pan chuột.
4. Kiểm tra Cột phải:
   - Kiểm tra hiển thị tách biệt của Quote và Short Description.
   - Tab OVERVIEW: Kiểm tra 6 chỉ số chuẩn tổng = 20; hover vào 2 Trait V2 xem tooltip.
   - Tab STORY: Đọc Chương 01; kiểm tra các chương sau có nhãn rõ ràng, chương 7-10 không hiện nội dung.
   - Tab GEAR COMPAT: Xem đánh giá tương thích 3 lớp cơ giáp Aegis/Vanguard/Falcon.
   - Tab GALLERY: Kiểm tra hiển thị 2 ảnh WebP thật và các thẻ archive fallback "Chờ Đồng Bộ WebP".

### 4.2 Kiểm Thử Mobile Viewport (390 × 844 iPhone 14 / Pixel 7)
1. Bật DevTools ở kích thước 390px.
2. Kiểm tra `Mobile Info View`:
   - Header hiển thị gọn gàng, nút chuyển sang Art View rõ ràng (touch target >= 44px).
   - Thử chuyển lần lượt 4 tab.
   - Tap vào Trait để xem chi tiết.
3. Chuyển sang `Mobile Art View`:
   - Tranh toàn thân hiển thị tràn viền sắc nét.
   - Thử 2 nút chuyển đổi bối cảnh ở thanh công cụ dưới.
   - Thử double-tap hoặc nút Zoom In để phóng to.
   - Tap nút quay lại để trở về Info View mượt mà.

### 4.3 Kiểm Thử Hồi Quy & Cô Lập (Regression & Build Test)
1. Chuyển qua các tab cũ của Starfront: "Pilot Gallery", "Combat Arena", "Hangar", "World". Đảm bảo không có lỗi runtime Console nào phát sinh.
2. Chạy `compile_applet` để xác nhận toàn bộ dự án biên dịch thành công.
