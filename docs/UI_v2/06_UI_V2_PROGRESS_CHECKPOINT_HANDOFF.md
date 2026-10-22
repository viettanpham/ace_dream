# UI V2 Foundation — Progress / Checkpoint / Handoff
Ngày cập nhật: 2026-10-22  
Trạng thái: `PHASE_2_COMPLETED / SHARED_ART_VIEWER_VERIFIED / READY_FOR_PHASE_3_SHELL`

## 1. Trạng Thái Thực Tế Đã Xác Minh (Verified Reality)
- **Phase 1 (Core UI Primitives)**: Đã hoàn tất, ổn định tại `components/game/v2/ui/`.
- **Version Control Bridge**: Hoạt động hai chiều giữa V1 (`/`) và V2 Preview (`/ui-v2-preview`), an toàn trong môi trường phát triển.
- **5 Responsive Defects**: Toàn bộ **5/5 lỗi responsive** trên `/ui-v2-preview` đều mang trạng thái `FIXED` và hoạt động ổn định.
- **Phase 2 (Shared Art Viewer Completion)**: **`COMPLETE & VERIFIED`** tại `components/game/v2/ui/art-viewer.tsx`.
  - Cử chỉ pinch-to-zoom 2 ngón mượt mà trên màn hình cảm ứng di động.
  - Kéo rê (pan) 1 ngón khi zoom $> 1x$ kèm thuật toán kẹp biên an toàn (mathematical boundary clamping) chống trôi mất ảnh khỏi màn hình.
  - Thu phóng bằng nút bấm (+ / - / Reset 1x) và phím tắt (+ / - / 0) trong giới hạn cấu hình an toàn (minZoom 1, maxZoom 3).
  - Thao tác chạm đúp (double-tap trên mobile) / click đúp (double-click trên desktop) để chuyển đổi nhanh giữa 1x và 2x.
  - Nút đóng $X$ luôn hiển thị rõ ràng, diện tích chạm tối thiểu $44 \times 44\text{px}$.
  - Phím `Escape` đóng viewer; điều hướng Previous/Next qua mũi tên bàn phím hoặc nút điều hướng khi có nhiều tác phẩm.
  - Tự động đặt lại trạng thái zoom/pan (`zoom = 1`, `pan = {0,0}`) khi chuyển sang ảnh khác hoặc đóng/mở lại viewer.
  - Khóa cuộn trang nền (`document.body.style.overflow = 'hidden'`) và xử lý safe-area trên mobile (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
  - Giữ vững chính sách Zero Broken Images / Zero 404 qua khung Thẻ Lưu Trữ (Archive Pending Card) kèm đầy đủ metadata danh mục.
- **Tích Hợp Pilot Profile V2 (FND-8 / 8.2.3.E.0)**:
  - Call-sites trong `components/game/v2/pilot-profile/` đã được kết nối hoàn chỉnh, hỗ trợ duyệt tranh trước/sau mượt mà.
  - Môi trường thử nghiệm `/ui-v2-preview` đã bổ sung Section 07 để kiểm thử trực tiếp Art Viewer (cả chế độ ảnh thật WebP và thẻ archive).
- **Bảo toàn V1**: Toàn bộ mã nguồn V1 (`/`), cơ chế lưu trữ và gameplay giữ nguyên 100%.

## 2. Phase Status Matrix & Lộ Trình Kế Tiếp
| Phase | Status | Ghi chú |
|---|---|---|
| 0 — Scope & Canonical Docs | `APPROVED_DIRECTION` | Canonical package tại `docs/UI_v2/` |
| 1 — Core UI Primitives + Isolated Preview | `COMPLETE` | Bộ primitives tại `components/game/v2/ui/` |
| 1.Bridge — Dev Preview Access & Bridge | `COMPLETE` | Nút dev `V2 PREVIEW` & `QUAY LẠI V1` |
| 1.Fix — Preview Responsive Fixes | `COMPLETE & VERIFIED` | Toàn bộ 5 defect đã `FIXED` trong mã nguồn |
| 1.UXLock — UX Contract & Smart UI State | `LOCKED` | Khóa hợp đồng tại `07_UI_V2_UX_CONTRACT_AND_RESPONSIVE_SPEC.md` |
| **2 — Shared Art Viewer** | **`COMPLETE & VERIFIED`** | Fullscreen art viewer (pinch 2 ngón, pan có giới hạn biên, touch targets $\ge 44\text{px}$, Esc, Zero 404) |
| **3 — V2 Shell, Navigation & Version Switch** | **`PROPOSED_NEXT`** | Shell 4 tầng, UI Preference Store, Settings switch V1/V2, Navigation Registry |
| 4 — Pilot Category/Profile V2 Integration | `READY_FOR_SHELL_MOUNT` | Module Profile V2 đã dựng sạch, sẵn sàng gắn vào Shell V2 |

## 3. Nội Dung Kỹ Thuật Đã Chốt vs Giới Hạn Còn Lại Của Phase 2
- **Đã Hoàn Thành & Kiểm Chứng (Verified)**:
  - Thu phóng đa cấp (1x, 1.5x, 2x, 2.5x, 3x) và pinch-to-zoom mượt mà.
  - Giới hạn kéo rê an toàn (không bị kéo văng mất tranh khỏi khung nhìn).
  - Double-tap toggle zoom (1x ↔ 2x).
  - Background scroll lock và safe-area padding.
  - Không phát sinh lỗi 404 cho 28 tác phẩm đang chờ đóng gói file WebP.
  - 100% build pass (`compile_applet` passed) và lint pass (`tsc --noEmit` 0 lỗi).
- **Giới Hạn Thực Tế Cần Lưu Ý**:
  - Khả năng cảm ứng 2 ngón (pinch-to-zoom) được tính toán dựa trên sự kiện touch đa điểm chuẩn HTML5 (`e.touches.length === 2`), hoạt động trên thiết bị di động thật hoặc công cụ mô phỏng hỗ trợ touch đa điểm. Môi trường desktop giả lập qua chuột thông thường chỉ kích hoạt được 1 điểm chạm (pan) và zoom qua nút / phím tắt / click đúp.

## 4. Danh Sách Tệp Đã Chỉnh Sửa Trong Phase Này
1. `components/game/v2/ui/art-viewer.tsx`: Hoàn thiện toàn diện 10 tính năng của Shared Art Viewer.
2. `components/game/v2/pilot-profile/pilot-profile-v2.tsx`: Tích hợp logic Previous/Next artwork và chuyển tiếp an toàn.
3. `app/ui-v2-preview/page.tsx`: Bổ sung Section 07 Shared Art Viewer và các nút demo thực nghiệm.
4. `docs/UI_v2/06_UI_V2_PROGRESS_CHECKPOINT_HANDOFF.md`: Cập nhật tiến độ hoàn thành Phase 2.

## 5. Đề Xuất Task IMPLEMENT Tiếp Theo Duy Nhất
- **Tên nhiệm vụ**: `STARFRONT WORLD V2 — IMPLEMENT PHASE 3: V2 SHELL, NAVIGATION & VERSION SWITCH`
- **Mục tiêu**: Xây dựng App Shell V2 chính thức với cấu trúc 4 tầng logic (Top Bar, Left Navigation Menu Mini/Full, Subsystem Rail, Main Content Host), tích hợp cơ chế lưu UI Preference độc lập (`sf_v2_ui_prefs`), chuyển đổi giao diện trong Settings, đặt V2 làm mặc định cho người dùng mới và bảo toàn 100% dữ liệu game V1.
