# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BOUNDED IMPLEMENTATION PLAN & ACCEPTANCE TEST PLAN

**Ngày lập:** 2026-10-22  
**Chế độ:** DEFINE / PLAN ONLY (Chờ người dùng phê duyệt trước khi kích hoạt IMPLEMENT)  
**Phạm vi:** 8.2.3.E.0 — Character Category / Pilot Profile UI Foundation  

---

## 1. Phân Kỳ Triển Khai (Bounded Phases)

Để đảm bảo an toàn tuyệt đối, không làm hỏng app hiện tại và bàn giao được sản phẩm testable ngay trong bước đầu:

### Phase E.0-IMPLEMENT-1: Xây Dựng Shell & Component V2 Độc Lập (Desktop + Mobile)
- **Mục tiêu:** Tạo mới toàn bộ module V2 tại thư mục riêng `components/game/v2/character-profile/`, bao gồm layout Desktop và Mobile, nạp dữ liệu chuẩn Valentine và kết nối 2 ảnh WebP thật.
- **Tiêu chuẩn giao hàng:**
  - Có thể chuyển vào xem giao diện Category/Profile V2 từ Starfront Shell qua một tab hoặc nút điều hướng an toàn mà không ảnh hưởng tới `pilot-gallery.tsx` cũ.
  - Cả Desktop (1440px) và Mobile (<=430px) hoạt động hoàn hảo ngay từ lần đầu mở.
  - 4 tab: `OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY` chuyển đổi mượt mà.
  - 2 background controls chuyển đổi qua lại giữa 2 phông nền/bối cảnh.
  - Trình xem ảnh (Artwork Viewer/Inspector) hoạt động độc lập (zoom/pan/fullscreen/reset).

### Phase E.0-IMPLEMENT-2: Hoàn Thiện Tương Tác Cảm Ứng Mobile & Phản Hồi Khiếm Khuyết (Defect Correction)
- **Mục tiêu:** Tiếp nhận phản hồi kiểm thử thực tế từ người dùng, tinh chỉnh các điểm chạm cảm ứng, hiệu ứng chuyển tab, bottom sheet chi tiết Trait trên mobile và căn chỉnh typography theo phản hồi.
- **Tiêu chuẩn giao hàng:** Không có lỗi giao diện nào trên cả Chrome desktop và Mobile emulator; build sạch `npm run build` không lỗi.

---

## 2. Kế Hoạch Thay Đổi Tệp (File-Change Plan)

### 2.1 Các Tệp Mới Được Tạo (New Isolated V2 Files)
1. **`lib/game/v2/character-canon-data.ts`**:
   - Chứa định nghĩa TypeScript và dữ liệu canonical V2: 12 Class Personas, phân bổ 20 điểm thuộc tính, Traits V2, hồ sơ Valentine chuẩn (`FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`), và dữ liệu tương thích GEAR.
   - Hoàn toàn tách biệt khỏi `lib/game/data.ts` (không sửa đổi dữ liệu V1).
2. **`components/game/v2/character-profile/pilot-profile-v2.tsx`**:
   - Container component chính, tự động phát hiện viewport hoặc cho phép toggle preview Desktop / Mobile.
3. **`components/game/v2/character-profile/desktop-profile-view.tsx`**:
   - Bố cục 3 cột Desktop chuẩn: Roster trái, Showcase + 2 Background Controls ở giữa, 4 Tabs thông tin ở phải.
4. **`components/game/v2/character-profile/mobile-profile-view.tsx`**:
   - Bố cục 2 trạng thái Mobile: `Mobile Info View` và `Mobile Art View` với thanh công cụ chạm đáy và 2 background toggles touch-friendly.
5. **`components/game/v2/character-profile/profile-tabs/`**:
   - `overview-tab.tsx`: 6 chỉ số, Traits với popover/tooltip giải thích, facts nhân thân.
   - `story-tab.tsx`: Biography summary, Chương 01 toàn văn tiếng Việt, trạng thái 02–10.
   - `gear-compat-tab.tsx`: Bảng tương thích 3 lớp Aegis, Vanguard, Falcon.
   - `gallery-tab.tsx`: Lưới ảnh thật + Thẻ lưu trữ trạng thái chờ nạp ảnh.
6. **`components/game/v2/character-profile/artwork-lightbox-modal.tsx`**:
   - Trình phóng to ảnh chi tiết (hỗ trợ zoom 1x-4x, pan kéo chuột, pinch-to-zoom trên màn hình chạm, nút xoay về 1x, tải ảnh).

### 2.2 Các Tệp Được Điều Chỉnh Nhẹ Cho Việc Tích Hợp (Minimal Integration Edits)
1. **`components/game/starfront-shell.tsx`**:
   - Thêm một mục menu hoặc toggle phụ chuyển sang `"Hồ Sơ Phi Công V2 (FND-8)"` (chỉ 1 nhánh điều kiện an toàn, giữ nguyên toàn bộ nhánh `"gallery"` cũ của V1).
   - Tuyệt đối không xóa bỏ hay sửa đổi code của `pilot-gallery.tsx`.

### 2.3 Các Tệp Nghiêm Ngặt KHÔNG Chạm Vào (Isolated / Untouched)
- `components/game/pilot-gallery.tsx` (Giữ nguyên 1573 dòng legacy).
- `components/game/character-gear-select.tsx` (Giữ nguyên).
- `lib/game/data.ts` (Giữ nguyên).
- `lib/game/types.ts` (Giữ nguyên).
- `components/game/combat-arena.tsx`, `components/game/world/*` (Giữ nguyên).

---

## 3. Danh Mục Tiêu Chí Chấp Nhận (Acceptance Checklist)

| STT | Tiêu Chí Kiểm Tra (Acceptance Criteria) | Yêu Cầu Chi Tiết | Cách Kiểm Thử (Verification Method) |
|---|---|---|---|
| 1 | **Độ Trung Thực Với Concept** | Bám sát concept đã duyệt; không tự bịa layout khác; không dùng ảnh chụp làm background tĩnh. | So sánh trực quan bố cục Desktop 3 cột và Mobile 2 trạng thái. |
| 2 | **Đồng Thời Desktop & Mobile** | Hoạt động ngay ở Phase 1 trên cả màn hình rộng (>1280px) và màn hình điện thoại (375px–430px). | Thay đổi kích thước trình duyệt hoặc mở Device Mode trên DevTools. |
| 3 | **Hai Background Controls** | Có 2 điều khiển chuyển đổi bối cảnh hoạt động trên cả desktop và mobile (Elysia vs Buồng lái). | Click/tap lần lượt cả 2 nút; kiểm tra phông nền đổi mượt mà. |
| 4 | **Đầy Đủ 4 Tab** | Đủ 4 tab: `OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`. | Click chuyển qua lại từng tab; nội dung hiển thị tương ứng. |
| 5 | **Tách Biệt Quote & Short Bio** | `characterQuote` và `shortDescription` là 2 đoạn text riêng, không gộp làm một. | Kiểm tra DOM và giao diện thấy 2 khối chữ riêng biệt. |
| 6 | **Dữ Liệu Thật Của Valentine** | Chỉ số 20 điểm (2/2/2/6/6/2), 2 Trait V2, Chương 01 có toàn văn tiếng Việt, Chương 07–10 trạng thái HOLD. | Đối chiếu dữ liệu trên màn hình với `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`. |
| 7 | **Zero Broken Images** | Không có thẻ `<img>` nào bị vỡ/404; chỉ tải ảnh thực có trên đĩa (`valentine-fullbody.webp`, `valentine-portrait.webp`). | Mở Network tab kiểm tra mã phản hồi HTTP của toàn bộ ảnh (đều 200). |
| 8 | **Trình Soi Ảnh (Viewer/Inspector)**| Hoạt động trơn tru: zoom, kéo rê ảnh, đóng mở, phím tắt Esc. | Thao tác lăn chuột zoom, kéo chuột rê ảnh, bấm Esc để đóng. |
| 9 | **Không Phá Hỏng Legacy** | Toàn bộ các phân hệ V1 (Gallery cũ, Combat, Hangar, World) vẫn hoạt động nguyên vẹn. | Mở lại tab "Pilot Gallery" cũ kiểm tra xem mọi chức năng cũ còn nguyên. |
| 10 | **Kiểm Tra Build Sạch** | Chạy `npm run build` không có lỗi TypeScript hoặc cú pháp. | Thực hiện lệnh compile và ghi nhận exit code 0. |

---

## 4. Kế Hoạch Kiểm Thử Có Mục Tiêu (Targeted Test Plan)

### 4.1 Kiểm Thử Desktop Viewport (1440 × 900)
1. Truy cập vào ứng dụng qua URL máy chủ dev.
2. Điều hướng vào phân hệ "Hồ Sơ Phi Công V2 (FND-8)".
3. Kiểm tra hiển thị cột trái (Roster 12 archetype), chọn Valentine.
4. Kiểm tra tranh toàn thân ở giữa:
   - Click Toggle Background 1 (Bối cảnh Trạm Y Tế Elysia).
   - Click Toggle Background 2 (Bối cảnh Buồng Lái Tactical HUD).
   - Click nút phóng to tranh để mở Lightbox Inspector, thử Zoom và Pan.
5. Kiểm tra cột phải:
   - Đọc Quote và Short Description.
   - Tab OVERVIEW: Kiểm tra 6 chỉ số chuẩn tổng = 20; hover vào 2 Trait V2 xem tooltip.
   - Tab STORY: Đọc Chương 01; kiểm tra các chương sau có nhãn rõ ràng, chương 7-10 không hiện nội dung.
   - Tab GEAR COMPAT: Xem đánh giá tương thích 3 lớp cơ giáp Aegis/Vanguard/Falcon.
   - Tab GALLERY: Kiểm tra hiển thị 2 ảnh thật và các thẻ archive fallback.

### 4.2 Kiểm Thử Mobile Viewport (390 × 844 iPhone 14 / Pixel 7)
1. Thu nhỏ trình duyệt hoặc bật DevTools kích thước 390px.
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
