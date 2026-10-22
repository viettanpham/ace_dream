# UI V2 Foundation — Progress / Checkpoint / Handoff
Ngày cập nhật: 2026-10-22  
Trạng thái: `V2_SHELL_MINIMUM_AND_PILOT_CATEGORY_DELIVERED / ROUTE_V2_PILOTS_ACTIVE`

## 1. Trạng Thái Thực Tế Đã Xác Minh (Verified Reality)
- **Đường Dẫn Trực Tiếp Độc Lập**: `/v2/pilots` (và chuyển hướng từ `/v2`) đã hoạt động 100%, độc lập hoàn toàn với V1 (`/`).
- **Phase 1 (Core UI Primitives)**: Đã hoàn tất, ổn định tại `components/game/v2/ui/`.
- **Phase 2 (Shared Art Viewer Completion)**: `COMPLETE & VERIFIED` tại `components/game/v2/ui/art-viewer.tsx` với pinch-to-zoom 2 ngón, pan 1 ngón kẹp biên an toàn, phím Esc, an toàn Zero 404.
- **V2 Shell Minimum (Fast Delivery)**:
  - **Desktop (1440px)**:
    - Top Bar V2 gọn gàng (Logo STARFRONT, route indicator, nút Quay lại V1, trạng thái mạng).
    - Global Left Menu có 2 chế độ Full (240px) / Mini (64px), mặc định `mini`.
    - Pilot Roster có 2 chế độ Full (256px) / Mini (72px) độc lập, mặc định `mini`.
    - Main Stage mở rộng tối đa, ưu tiên hiển thị artwork phi công sắc nét.
    - 2 Controls bối cảnh: Standard (Tiêu Chuẩn) vs Tactical HUD (Radar Tác Chiến).
    - 4 Tabs thông tin hoạt động đầy đủ: `OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`.
  - **Mobile (375px–430px)**:
    - Hamburger Drawer mở menu hệ thống V2 toàn diện với vùng chạm $\ge 44\text{px}$.
    - Horizontal Pilot Avatar Rail (chiều rộng tối thiểu 76px/item) hiển thị đầy đủ tên, không tràn ngang.
    - Hai chế độ hiển thị độc lập: `Mobile Art View` (chiêm ngưỡng tranh tràn viền) và `Mobile Info View` (xem chi tiết hồ sơ).
    - Không trùng lặp header, không giật lag.
  - **Lưu Trữ Tùy Chọn UI (`sf_v2_ui_prefs`)**:
    - Trạng thái Full/Mini của Global Menu và Pilot Roster được lưu độc lập vào `localStorage ('sf_v2_ui_prefs')`.
    - Tuyệt đối không ghi vào dữ liệu lưu gameplay (save game isolation).
- **Zero Broken Images / Invariants**:
  - Valentine và 7 phi công gốc hiển thị ảnh WebP thật; 4 phi công mở rộng và 28 tranh manifest hiển thị Thẻ Lưu Trữ (Archive Pending Card) kèm đầy đủ metadata, Zero 404.
  - Không hiển thị "Tổng 20 điểm Class", bảo toàn 6 Base Attributes và 2 Traits.
  - Chương 01–04 APPROVED, 05–06 PROVISIONAL, 07–10 HOLD locked.
- **Bảo Toàn V1 Tuyệt Đối**:
  - Không sửa bất kỳ dòng mã nào của `components/game/starfront-shell.tsx`, `pilot-gallery.tsx` hoặc `app/page.tsx`.
  - Nút quay lại V1 hoạt động an toàn, không tạo vòng lặp điều hướng.

## 2. Phase Status Matrix & Lộ Trình
| Phase | Status | Ghi chú |
|---|---|---|
| 0 — Scope & Canonical Docs | `APPROVED_DIRECTION` | Canonical package tại `docs/UI_v2/` |
| 1 — Core UI Primitives + Isolated Preview | `COMPLETE` | Bộ primitives tại `components/game/v2/ui/` |
| 1.Bridge — Dev Preview Access & Bridge | `COMPLETE` | Nút bridge `V2 PREVIEW`, `/v2/pilots` & `QUAY LẠI V1` |
| 1.Fix — Preview Responsive Fixes | `COMPLETE & VERIFIED` | Toàn bộ 5 defect đã `FIXED` |
| 1.UXLock — UX Contract & Smart UI State | `LOCKED` | Khóa hợp đồng tại `07_UI_V2_UX_CONTRACT_AND_RESPONSIVE_SPEC.md` |
| 2 — Shared Art Viewer | `COMPLETE & VERIFIED` | Fullscreen art viewer (pinch 2 ngón, pan có giới hạn biên, Esc, Zero 404) |
| **V2 Shell Minimum + Category Integration** | **`DELIVERED & VERIFIED`** | **Route `/v2/pilots` trực tiếp, V2 Shell gọn, Mini/Full sidebars, Roster, 4 tabs, Mobile views** |
| 3 — V2 Global Navigation Expansion | `READY_WHEN_NEEDED` | Mở rộng thêm các Category khác (Hangar, Gear, Combat) vào V2 Shell |

## 3. Danh Sách Tệp Đã Hoàn Thành Cho Delivery Phase Này
1. `lib/game/v2/ui-preferences.ts`: Module quản lý UI Preferences (`sf_v2_ui_prefs`) cô lập hoàn toàn với game save.
2. `components/game/v2/shell/v2-shell.tsx`: V2 Shell tối thiểu với Top Bar, Global Left Menu Mini/Full và Mobile Drawer.
3. `components/game/v2/pilot-profile/desktop-view.tsx`: Desktop 3 cột tích hợp Roster Mini/Full độc lập và bối cảnh controls.
4. `components/game/v2/pilot-profile/mobile-art-view.tsx` & `mobile-info-view.tsx`: 2 chế độ hiển thị mobile hoàn thiện.
5. `components/game/v2/pilot-profile/pilot-profile-v2.tsx`: Master coordinator đồng bộ UI state.
6. `app/v2/pilots/page.tsx`: Route chính thức độc lập `/v2/pilots` cho Pilot Category V2.
7. `app/v2/page.tsx`: Route `/v2` tự động chuyển tiếp tới `/v2/pilots`.
8. `app/ui-v2-preview/page.tsx`: Liên kết trực tiếp sang `/v2/pilots` từ preview harness.

## 4. Hướng Dẫn Nghiệm Thu Trực Tiếp
- Truy cập trực tiếp route: **`/v2/pilots`**
- Thử nghiệm trên Desktop: Thu gọn/mở rộng Global Menu (Mini 64px ↔ Full 240px) và Pilot Roster (Mini 72px ↔ Full 256px), bấm 2 chế độ nền, duyệt 4 tabs, mở Art Viewer Soi Tranh.
- Thử nghiệm trên Mobile: Mở Hamburger Drawer, chuyển Art View ↔ Info View, cuộn Horizontal Avatar Rail.
