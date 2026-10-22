# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# CHARACTER CATEGORY / PILOT PROFILE UI FEATURE & ARCHITECTURE REFERENCE (E.0-REBUILD-1 COMPLETED)

**Ngày cập nhật:** 2026-10-22  
**Chế độ:** IMPLEMENT / ONE BOUNDED PHASE — Đã hoàn tất Phase E.0-REBUILD-1  
**Tài liệu tham chiếu cốt lõi:**
- `docs/art-direction/UI_CONCEPTS/` (3 ảnh concept WebP chính thức đã được người dùng phê duyệt)
- `docs/UI_v2/` (Bộ tài liệu kiến trúc UI V2 Foundation 01 đến 07)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_UI_V2_DESIGN_SYSTEM.md` (Design System Baseline V2)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_CHARACTER_CATEGORY_PROFILE_UI_CONCEPT.md` (Hợp đồng ý tưởng đã duyệt)
- `docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` (Dữ liệu lore, chỉ số & cốt truyện)
- `docs/art-direction/PILOT/VALENTINE/valentine_assets_manifest.json` (Hồ sơ danh mục artwork)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md` (12 Class Persona V2)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md` (Danh mục Trait V2 chuẩn)

---

## 1. Hiện Trạng Triển Khai Thực Tế (Implemented Architecture)

### 1.1 Vị Trí Module Mới Sạch Sẽ
- **Namespace chính thức:** `components/game/v2/pilot-profile/`
  - `pilot-profile-v2.tsx`: Master view coordinator, quản lý state và chuyển đổi responsive.
  - `desktop-view.tsx`: Bố cục Desktop 3 cột chuẩn 1440px theo concept đã duyệt.
  - `mobile-art-view.tsx`: Bố cục Mobile Art View gần full-screen kèm floating controls touch-friendly ($\ge 44 \times 44\text{px}$).
  - `mobile-info-view.tsx`: Bố cục Mobile Info View gồm horizontal avatar rail (min-w 76px, hiển thị trọn vẹn tên), typography tối ưu và 4 tabs.
  - `tabs/overview-tab.tsx`: 6 chỉ số Base Attributes (**TUYỆT ĐỐI KHÔNG hiển thị tổng 20 điểm**), 2 Traits tương tác và hồ sơ nhân thân.
  - `tabs/story-tab.tsx`: Toàn văn Chương 01 (`APPROVED`), tóm tắt Chương 02–04 (`APPROVED`), Chương 05–06 (`PROVISIONAL`), Chương 07–10 (`HOLD` niêm phong).
  - `tabs/gear-compat-tab.tsx`: Ma trận tương thích 3 dòng cơ giáp Aegis, Vanguard, Falcon minh bạch, không tạo công thức gameplay bịa đặt.
  - `tabs/gallery-tab.tsx`: Bộ sưu tập 2 ảnh WebP thật + Thẻ lưu trữ danh mục (Archive Pending Card) cho 28 ảnh chờ đồng bộ WebP (đảm bảo 100% Zero broken image / Zero 404).

### 1.2 Fast-Track Shared Art Viewer
- **Vị trí component:** `components/game/v2/ui/art-viewer.tsx` (xuất qua `components/game/v2/ui/index.ts`).
- **Khả năng thực tế:**
  - Thu phóng: 1x, 1.5x, 2x, 2.5x, 3x qua nút bấm hoặc phím tắt `+` / `-` / `0`.
  - Kéo rê (pan/drag): Hỗ trợ kéo chuột và cảm ứng vuốt khi đang zoom $> 1x$.
  - Đóng modal: Phím `Escape`, nút đóng $X$ với vùng chạm $\ge 44 \times 44\text{px}$.
  - Fallback chống lỗi 404: Tự động hiển thị khung Archive Card có metadata khi ảnh chưa có file nhị phân trên đĩa.

---

## 2. Bản Đối Chiếu Các Quy Chuẩn Thiết Kế Đã Đạt Được

| Hạng Mục | Yêu Cầu Thiết Kế Đã Khóa | Hiện Trạng Trong Mã Nguồn Thực Tế |
|---|---|---|
| **Zero CSS V1** | Không kế thừa class scanlines CRT hay layout legacy cũ. | 100% sử dụng Tailwind v4 và UI V2 Primitives. |
| **Quy Tắc Base Stats** | Tuyệt đối KHÔNG hiển thị nhãn "Tổng cộng 20 điểm", "20 Class Points" hay thanh tổng điểm. | Đã loại bỏ hoàn toàn các nhãn tổng 20 điểm trên UI; chỉ hiển thị 6 thanh chỉ số độc lập. |
| **Phân Tách Quote / Bio** | `characterQuote` và `shortDescription` là 2 khối riêng biệt. | Đã bố trí 2 khối DOM riêng: Quote nghiêng viền Cyan, Bio khối mô tả Slate-300. |
| **2 Background Controls** | Hoạt động trên cả Desktop và Mobile (Standard vs Tactical HUD). | Desktop: 2 nút đối xứng 2 bên sườn tranh. Mobile: thanh nút nổi ở đáy Art View. |
| **Story Status Invariant** | Chương 01 toàn văn, 02–04 tóm tắt, 05–06 đề cương, 07–10 HOLD niêm phong. | Chương 7–10 hiển thị biểu tượng ổ khóa và nhãn Niêm phong, không mở nội dung. |
| **Chính Sách WebP & Zero 404** | Chỉ nạp ảnh có thật trên đĩa (`valentine-fullbody.webp`, `valentine-portrait.webp`). 28 ảnh còn lại là thẻ Archive Card. | 100% request hình ảnh đạt HTTP 200, 0 lỗi 404 trên Network tab. |
| **Bảo Toàn 100% V1** | Không sửa đổi code V1, không xóa legacy. | `starfront-shell.tsx`, `pilot-gallery.tsx`, `character-gear-select.tsx` giữ nguyên 100%. |
