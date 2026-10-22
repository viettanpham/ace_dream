# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BOUNDED IMPLEMENTATION PLAN & ACCEPTANCE TEST PLAN (DESIGN SYSTEM ALIGNED)

**Ngày cập nhật:** 2026-10-22  
**Chế độ:** DEFINE / PLAN ONLY (Đã đồng bộ hóa Design System V2 & Ghi nhận Cổng Chặn Blocker)  
**Phạm vi:** 8.2.3.E.0 — Character Category / Pilot Profile UI Foundation  

---

## 1. Cổng Kiểm Soát Tiền Triển Khai (Pre-Implementation Blocker Gate)

> [!WARNING]
> ### 🚨 CỔNG CHẶN TRƯỚC KHI IMPLEMENT: 3 ẢNH CONCEPT PNG
> - **Tình trạng:** Thư mục `docs/art-direction/UI_CONCEPTS/` và 3 file PNG concept chưa có trong container filesystem.
> - **Nguyên tắc:** Concept được duyệt là chuẩn thiết kế cao nhất; không tự suy diễn layout từ mô tả chữ.
> - **Điều kiện giải phóng cổng:** Người dùng cung cấp tệp ảnh hoặc hướng dẫn khôi phục 3 file PNG vào `docs/art-direction/UI_CONCEPTS/`, HOẶC xác nhận phê duyệt tiến hành dựng khung xương theo đúng hợp đồng văn bản đã ghi nhận trong `FND8_8_2_3_E0_FEATURE_UI_REFERENCE.md`.

---

## 2. Phân Kỳ Triển Khai Có Giới Hạn (Bounded Phases)

### Phase E.0-IMPLEMENT-1: Dựng Module V2 Độc Lập (Desktop + Mobile) Chuẩn Design System V2
- **Mục tiêu:**
  - Thiết lập module V2 tại thư mục cách ly `components/game/v2/character-profile/`.
  - Triển khai Data Access Adapter tại `lib/game/v2/character-profile-data.ts`:
    - Chỉ đọc dữ liệu canonical FND-8 (`FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md`, `FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md`, `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`).
    - Tuyệt đối không nhân đôi Class stats, Traits hay sáng tác logic/công thức gameplay mới.
    - Cung cấp dữ liệu chuẩn bị sẵn cho FND-1 `CatalogRegistry`.
  - Áp dụng **Design System V2**:
    - Typography: Story body font 15–16px, line-height 1.65, giới hạn độ rộng dòng tối ưu (65–75 ký tự).
    - Touch targets: Tất cả các nút bấm, Tab, Toggle trên mobile đạt kích thước tối thiểu **44 × 44px**.
    - Phân tách độc lập `characterQuote` và `shortDescription`.
  - Áp dụng **Chính Sách WebP & Zero Broken Images**:
    - Tải 2 ảnh WebP thật trên đĩa: `/images/valentine-fullbody.webp` và `/images/valentine-portrait.webp`.
    - 28 ảnh còn lại trong manifest hiển thị dưới dạng thẻ "Hồ Sơ Lưu Trữ Chờ Đồng Bộ WebP".
    - Không sử dụng `sourceFilename` để tạo đường dẫn ảnh.
  - Triển khai đồng thời cả **Desktop View (1440px 3 cột)** và **Mobile View (375px–430px Paired States)** với 2 background controls và 4 tabs.
- **Tiêu chuẩn giao hàng:**
  - Lối vào tối thiểu trong Starfront Shell để xem thử UI V2, không làm ảnh hưởng UI V1 cũ.
  - Không có lỗi 404 hình ảnh (100% request đạt HTTP 200).
  - Không có lỗi biên dịch TypeScript (`compile_applet` passed).

### Phase E.0-IMPLEMENT-2: Kiểm Thử Thực Địa & Hiệu Chỉnh Theo Phản Hồi Người Dùng
- **Mục tiêu:** Nhận phản hồi thực tế từ người dùng sau khi trải nghiệm bản build V2, hiệu chỉnh chi tiết cảm ứng trên thiết bị thật, tinh chỉnh độ tương phản màu sắc và bố cục nếu cần.
- **Tiêu chuẩn giao hàng:** 100% tiêu chí chấp nhận được kiểm chứng; giao diện chạy mượt mà trên cả Desktop và Mobile.

---

## 3. Kế Hoạch Thay Đổi Tệp (File-Change Plan)

### 3.1 Các Tệp Mới Được Tạo (Isolated New Files)
1. `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_UI_V2_DESIGN_SYSTEM.md` *(Đã tạo trong turn này)*.
2. `lib/game/v2/character-profile-data.ts`: Data Access Adapter trích xuất dữ liệu canonical FND-8.
3. `components/game/v2/character-profile/pilot-profile-v2.tsx`: Container điều phối responsive và quản lý state.
4. `components/game/v2/character-profile/desktop-profile-view.tsx`: Bố cục Desktop 3 cột chuẩn 1440px.
5. `components/game/v2/character-profile/mobile-profile-view.tsx`: Bố cục Mobile Paired States (Info View & Art View).
6. `components/game/v2/character-profile/profile-tabs/`:
   - `overview-tab.tsx`: 6 chỉ số 20 điểm, Trait cards với tooltip, nhân thân.
   - `story-tab.tsx`: Story reader tối ưu khả năng đọc, Chương 01 toàn văn, trạng thái 02–10.
   - `gear-compat-tab.tsx`: Bảng xếp hạng tương thích cơ giáp (Aegis/Vanguard/Falcon).
   - `gallery-tab.tsx`: Bộ sưu tập 2 ảnh WebP thật + Thẻ lưu trữ cho 28 ảnh chờ đồng bộ.
7. `components/game/v2/character-profile/artwork-lightbox-modal.tsx`: Trình soi tranh (Zoom 1x-4x, Pan chuột, Esc).

### 3.2 Tệp Thay Đổi Nhỏ Cho Tích Hợp Thử Nghiệm
1. `components/game/starfront-shell.tsx`: Thêm một tab điều hướng tối thiểu `"Hồ Sơ Phi Công V2 (FND-8)"` (chỉ 1 nhánh điều kiện an toàn, giữ nguyên toàn bộ V1).

### 3.3 Tệp Nghiêm Ngặt Giữ Nguyên (Untouched Legacy)
- `components/game/pilot-gallery.tsx` (Giữ nguyên toàn bộ 1573 dòng).
- `components/game/character-gear-select.tsx` (Giữ nguyên).
- `lib/game/data.ts` (Giữ nguyên).
- `lib/game/types.ts` (Giữ nguyên).
- `docs/art-direction/PILOT/VALENTINE/valentine_assets_manifest.json` (Giữ nguyên hồ sơ provenance).

---

## 4. Danh Mục Tiêu Chí Chấp Nhận (Acceptance Checklist)

| STT | Tiêu Chí Kiểm Tra | Yêu Cầu Chi Tiết Theo Design System V2 | Cách Kiểm Thử |
|---|---|---|---|
| 1 | **Không Kế Thừa CSS V1** | UI mới độc lập, không dùng CSS CRT scanlines xanh lá hay cấu trúc cũ của V1. | Kiểm tra CSS/Classes trong module V2. |
| 2 | **Khả Năng Đọc & Kiểu Chữ** | Story body font >= 15px, line-height 1.65, max-w-prose. Không dùng font < 12px. | Kiểm tra Inspector kích thước font & line-height. |
| 3 | **Touch Target Mobile >= 44px** | Nút bấm, Tab, Toggle chuyển bối cảnh trên mobile đều có vùng bấm >= 44 × 44px. | Kiểm tra bounding box trên DevTools Mobile Mode. |
| 4 | **Data Adapter & Không Nhân Đôi** | UI Data Adapter đọc từ canonical FND-8; không tự bịa công thức gameplay hay nhân đôi stats. | Kiểm tra mã nguồn `lib/game/v2/character-profile-data.ts`. |
| 5 | **Chính Sách WebP & Zero 404** | Chỉ nạp ảnh `.webp` có thật (`valentine-fullbody.webp`, `valentine-portrait.webp`). Không dùng `sourceFilename`. | Kiểm tra tab Network: 100% ảnh đạt HTTP 200, 0 lỗi 404. |
| 6 | **Hai Background Controls** | Hoạt động trên cả Desktop (2 bên tranh) và Mobile (floating bar ở Art View). | Thao tác chuyển đổi và kiểm tra thay đổi nền. |
| 7 | **Đồng Thời Desktop & Mobile** | Hoàn thành ngay trong Phase 1 cho cả màn hình rộng (>1280px) và smartphone (375px–430px). | Thử nghiệm trên cả 2 độ phân giải. |
| 8 | **Đầy Đủ 4 Tab & Tách Biệt Quote** | 4 Tab chuẩn; `characterQuote` và `shortDescription` là 2 khối riêng biệt. | Kiểm tra trực quan và cấu trúc DOM. |
| 9 | **Dữ Liệu Thật Của Valentine** | 20 điểm thuộc tính chuẩn, 2 Trait V2, Chương 01 toàn văn tiếng Việt, Chương 7–10 HOLD. | Đối chiếu hiển thị với tài liệu lore gốc. |
| 10 | **Trình Soi Tranh (Inspector)** | Zoom 1x-4x, Pan kéo ảnh, phím Esc đóng modal hoạt động trơn tru. | Thử lăn chuột, kéo rê chuột và bấm Esc. |
| 11 | **Không Phá Hỏng Legacy** | Toàn bộ phân hệ V1 cũ (Gallery, Combat, Hangar) vẫn hoạt động nguyên vẹn. | Truy cập lại các tab cũ kiểm tra hoạt động. |
| 12 | **Biên Dịch Sạch Sẽ** | `compile_applet` thành công với 0 lỗi TypeScript hoặc Lint. | Chạy lệnh build kiểm tra. |

---

## 5. Kế Hoạch Kiểm Thử Chi Tiết

### 5.1 Desktop Viewport (1440 × 900)
1. Mở Starfront Shell, chọn tab `"Hồ Sơ Phi Công V2 (FND-8)"`.
2. Kiểm tra cột Roster bên trái và chọn Valentine.
3. Kiểm tra Showcase tranh trung tâm:
   - Click Toggle Background 1 (Elysia Hangar) và Toggle Background 2 (Buồng Lái HUD).
   - Click nút phóng to mở Lightbox Inspector, thử Zoom và Pan chuột.
4. Kiểm tra Cột phải:
   - Đảm bảo `characterQuote` và `shortDescription` hiển thị thành 2 khối tách biệt rõ ràng.
   - Tab OVERVIEW: Kiểm tra 6 chỉ số chuẩn (2/2/2/6/6/2); hover 2 Trait xem tooltip.
   - Tab STORY: Đọc Chương 01 toàn văn với cỡ chữ thoải mái; kiểm tra các chương 2–10.
   - Tab GEAR COMPAT: Xem đánh giá tương thích 3 lớp cơ giáp Aegis/Vanguard/Falcon.
   - Tab GALLERY: Kiểm tra 2 ảnh WebP thật và các thẻ archive fallback "Chờ Đồng Bộ WebP".

### 5.2 Mobile Viewport (390 × 844)
1. Bật DevTools ở kích thước 390px.
2. Kiểm tra `Mobile Info View`:
   - Top bar 56px, nút switch sang Art View, header thu gọn.
   - Touch targets của các Tab và nút bấm đều đạt >= 44px.
   - Font chữ Story đạt 15px, cuộn đọc dễ dàng.
3. Chuyển sang `Mobile Art View`:
   - Tranh toàn thân hiển thị tràn viền sắc nét.
   - 2 nút chuyển đổi bối cảnh ở thanh công cụ đáy touch-friendly (>=44px).
   - Thử nghiệm zoom và chạm nút quay lại Info View.

### 5.3 Kiểm Thử Hồi Quy (Regression & Build Test)
1. Mở lại tab "Pilot Gallery" V1 cũ: xác nhận mọi chức năng cũ không bị ảnh hưởng.
2. Chạy `compile_applet`: đảm bảo 0 lỗi biên dịch.
