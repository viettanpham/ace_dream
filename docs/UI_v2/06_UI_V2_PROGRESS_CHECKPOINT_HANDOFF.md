# UI V2 Foundation — Progress / Checkpoint / Handoff
Ngày cập nhật: 2026-10-22  
Trạng thái: `RESPONSIVE_STATUS_RECONCILED / UX_CONTRACT_LOCKED / READY_FOR_PHASE_2`

## 1. Trạng Thái Thực Tế Đã Xác Minh (Verified Reality)
- **Phase 1 (Core UI Primitives)**: Đã hoàn tất, ổn định tại `components/game/v2/ui/`.
- **Version Control Bridge**: Hoạt động hai chiều giữa V1 (`/`) và V2 Preview (`/ui-v2-preview`), có chốt an toàn `process.env.NODE_ENV !== 'production'`.
- **Đối chiếu 5 Responsive Defects**: Đã đối chiếu trực tiếp mã nguồn thực tế và kiểm thử; toàn bộ **5/5 lỗi responsive đều mang trạng thái `FIXED`**:
  - DEFECT-01 (Multi-column grid crush): `FIXED` (`app/ui-v2-preview/page.tsx` dòng 59–76).
  - DEFECT-02 (Button overflow): `FIXED` (`components/game/v2/ui/button.tsx` dòng 43, 63, 73–82).
  - DEFECT-03 (Tabs overflow): `FIXED` (`components/game/v2/ui/tabs.tsx` dòng 83–124, 144–150).
  - DEFECT-04 (Header preview quá tải): `FIXED` (`app/ui-v2-preview/page.tsx` dòng 83–161).
  - DEFECT-05 (Tooltip trên cảm ứng): `FIXED` (`components/game/v2/ui/tooltip.tsx` dòng 46–131).
- **UX Contract & Smart UI State**: Đã khóa toàn diện tại `docs/UI_v2/07_UI_V2_UX_CONTRACT_AND_RESPONSIVE_SPEC.md`:
  - Desktop: Global Left Menu (Full 240px / Mini 64px) và Pilot Roster (Full 260px / Mini 72px) độc lập tuyệt đối. Main Content flex-1 co giãn.
  - Mobile: Hamburger Drawer cho Global Menu, Horizontal Avatar Rail + Bottom Sheet cho Pilot Roster; bố cục chia rõ **Artwork View** (tranh toàn màn hình) và **Info View** (thông số & story) theo concept đã duyệt.
  - UI State: Tách biệt Persistent UI state (`sf_v2_ui_prefs`) khỏi gameplay save data; modal/drawer/tooltip/viewer là ephemeral state không lưu sau F5.
- **Bảo toàn V1**: Giao diện V1 (`/`), cơ chế lưu trữ và gameplay giữ nguyên 100%.

## 2. Phase Status Matrix & Lộ Trình Kế Tiếp
| Phase | Status | Ghi chú |
|---|---|---|
| 0 — Scope & Canonical Docs | `APPROVED_DIRECTION` | Canonical package tại `docs/UI_v2/` |
| 1 — Core UI Primitives + Isolated Preview | `COMPLETE` | Bộ primitives tại `components/game/v2/ui/` |
| 1.Bridge — Dev Preview Access & Bridge | `COMPLETE` | Nút dev `V2 PREVIEW` & `QUAY LẠI V1` |
| 1.Fix — Preview Responsive Fixes | `COMPLETE & VERIFIED` | Toàn bộ 5 defect đã `FIXED` trong mã nguồn |
| 1.UXLock — UX Contract & Smart UI State | `LOCKED` | Khóa hợp đồng tại `07_UI_V2_UX_CONTRACT_AND_RESPONSIVE_SPEC.md` |
| **2 — Shared Art Viewer** | **`PROPOSED_NEXT`** | Fullscreen art viewer (zoom, pan, drag, touch, close) |
| 3 — V2 Shell, Navigation & Version Switch | `NOT_STARTED` | Shell 4 tầng, UI Preference Store, Settings switch |
| 4 — Pilot Category/Profile V2 | `NOT_STARTED` | Dựng lại trang Valentine theo concept desktop/mobile đã duyệt |

## 3. Nội Dung UX Đã Chốt vs Còn Mở
- **Đã Chốt (Locked)**:
  - Bảng màu & tokens Modern Aerospace Sci-Fi V2.
  - Cấu trúc 4 tầng logic (Top Bar, Left Menu, System Selector, Main Content).
  - Khả năng co giãn độc lập của Left Menu và Pilot Roster (Full/Mini).
  - Ưu tiên mặc định trên Desktop cho Pilot Category là Global Menu Mini và Pilot Roster Mini.
  - Bố cục Mobile: Hamburger Drawer + Horizontal Avatar Rail + phân định Artwork View vs Info View.
  - Nguyên tắc lưu trữ: UI State độc lập với Gameplay Save.
  - Touch targets $\ge 44 \times 44\text{px}$, body text $16\text{px}$, story $17$–$18\text{px}$.
- **Còn Mở Cho Phase Sau (Open)**:
  - Cấu hình mức zoom tối đa và độ nhạy kéo pan của Shared Art Viewer (Phase 2).
  - Danh sách đăng ký các phân hệ tiếp theo ngoài Pilot Category vào Shell (Phase 3).
  - Interface TypeScript chi tiết của `UIPreferenceStore` (Phase 3).

## 4. Danh Sách Tài Liệu Đã Cập Nhật Trong Phiên Này
1. `docs/UI_v2/07_UI_V2_UX_CONTRACT_AND_RESPONSIVE_SPEC.md`: Cập nhật bảng đối chiếu 5 defect với mã nguồn thực tế, bổ sung chi tiết hợp đồng UX Desktop/Mobile và Smart UI State matrix.
2. `docs/UI_v2/06_UI_V2_PROGRESS_CHECKPOINT_HANDOFF.md`: Cập nhật trạng thái reconciliation và đề xuất task tiếp theo.

## 5. Đề Xuất Task IMPLEMENT Tiếp Theo Duy Nhất
- **Tên nhiệm vụ**: `STARFRONT WORLD V2 — IMPLEMENT PHASE 2: SHARED ART VIEWER`
- **Mục tiêu**: Xây dựng component `components/game/v2/ui/art-viewer.tsx` phục vụ xem tranh phóng to/thu nhỏ toàn màn hình, hỗ trợ zoom, drag/pan, touch pinch, nút đóng $X$ $\ge 44\text{px}$, phím Escape, và fallback container chống broken image.
- **Tiêu chí nghiệm thu**: Tích hợp mục thử nghiệm Art Viewer vào `/ui-v2-preview`, kiểm thử mượt mà trên cả desktop và mobile, không phát sinh lỗi build/lint.

## 6. Xác Nhận Tuân Thủ Giới Hạn
- **Chế độ**: `PLAN / DEFINE ONLY`.
- **Mã nguồn**: **KHÔNG CÓ DÒNG CODE SOURCE HAY GAMEPLAY NÀO BỊ THAY ĐỔI** trong phiên làm việc này.
- **Tiến độ**: Phase 2 (Shared Art Viewer), Phase 3 (V2 Shell) và Phase 4 (Pilot Category/Profile) **CHƯA ĐƯỢC BẮT ĐẦU** (`NOT_STARTED`).
