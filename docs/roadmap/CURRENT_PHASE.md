# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.22 — GALAXY MAP HITBOX & VIEWPORT INTERACTION FIX (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 32/32 Test Suites PASS, 5/5 Phase 6.22 Tests PASS, Build Succeeded)**.
- **Mục tiêu cốt lõi**:
  - Triển khai giải pháp kỹ thuật tinh gọn giải quyết triệt để 2 vấn đề tương tác cốt lõi phát hiện từ Phase 6.21 Audit:
    1. **Hitbox Sector Chuyên Dụng Trong Suốt (`world-map.tsx`)**:
       * Thêm vùng hit area SVG trong suốt kích thước lớn ($140 \times 88\text{px}$) riêng biệt cho mỗi sector node (`data-sector-node`).
       * Bao trọn cả vòng tròn trung tâm, nhãn tên sector và thanh đo Threat, xóa bỏ hoàn toàn khoảng chết (deadzone) giữa node và nhãn.
       * Hit area không làm thay đổi hình ảnh hiển thị, không chồng lấn sang tâm các sector lân cận (khoảng cách tối thiểu giữa các sector canonical $\ge 120\text{px}$).
       * Nhãn cự ly/rủi ro trên tuyến đường hyperlane được gắn `pointer-events-none select-none` để không chặn sự kiện click sector bên dưới.
    2. **Phân Biệt Chính Xác Thao Tác Click Chọn Sector Và Kéo Bản Đồ (Pointer Drag Threshold)**:
       * Thiết lập `DRAG_THRESHOLD = 5px` để phân biệt rõ ràng: nếu con trỏ dịch chuyển dưới ngưỡng ($< 5\text{px}$), xử lý như click chọn sector thông thường mà không làm dịch chuyển camera panOffset (loại bỏ rung giật micro-jitter).
       * Khi pointer dịch chuyển $\ge 5\text{px}$, chuyển sang chế độ Pan bản đồ (`isDragging = true`). Khi nhả chuột (`onPointerUp`), cờ `hasExceededDragThreshold` ngăn chặn kích hoạt click chọn sector ngoài ý muốn.
       * Áp dụng `setPointerCapture` và `releasePointerCapture` trên container bản đồ để giữ trọn vẹn thao tác kéo mượt mà ngay cả khi pointer di chuyển nhanh ra ngoài mép khung nhìn.
    3. **Tương Tác Nhất Quán Giữa Embedded Map & Fullscreen Overlay**:
       * Cả chế độ nhúng trong War Room và chế độ Toàn màn hình (`world-fullscreen-overlay.tsx`) đều dùng chung 100% logic hitbox và drag threshold.
       * Khi zoom nhỏ ($0.7\times$), diện tích hitbox $140 \times 88\text{px}$ vẫn tương đương $\approx 98 \times 61\text{px}$ trên màn hình thực tế, giúp người chơi nhấp chọn cực kỳ dễ dàng mà không làm phóng to hình ảnh đồ họa.
    4. **Làm Rõ Điều Kiện Nút Tác Chiến Trong Sector Inspector**:
       * Giữ nguyên 100% logic chiến đấu an toàn: chỉ hiển thị nút "Xuất Kích Tác Chiến" khi sector đủ điều kiện (`threatened`, `under_siege` hoặc `isLockedForCombat`).
       * Khi sector ở trạng thái bình thường/an toàn, hiển thị trạng thái minh bạch: "Tác chiến: Chưa có giao tranh" kèm nhãn "Khu vực ổn định" hoặc "Cần giải vây tuyến ngoài", giúp người chơi hiểu rõ lý do mà không tự khởi chạy combat sai quy tắc.
    5. **Bảo Toàn Hệ Thống Tuyệt Đối**:
       * Không can thiệp vào Combat Arena V1, WORLD Combat Adapter, Tick Engine, Event Engine hay Simulator.
       * Không thay đổi các save schema (`STARFRONT_WORLD_SAVE_V1`, `STARFRONT_SAVE_DATA_V4`).

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.22

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Hit area SVG trong suốt chuyên dụng ($140 \times 88\text{px}$) | **Đã hoàn thành (Done)** | `components/game/world/world-map.tsx` (dòng 950–960) |
| Xóa bỏ deadzone giữa node và nhãn tên sector | **Đã hoàn thành (Done)** | `world-map.tsx` |
| Route label không chặn click sector (`pointer-events-none`) | **Đã hoàn thành (Done)** | `world-map.tsx` (dòng 820–830) |
| Movement threshold ($5\text{px}$) phân biệt Click và Pan | **Đã hoàn thành (Done)** | `world-map.tsx` (dòng 430–480) |
| Loại bỏ micro-jitter camera khi click chuột tĩnh | **Đã hoàn thành (Done)** | `world-map.tsx` |
| Drag không kích hoạt click chọn sector ngoài ý muốn | **Đã hoàn thành (Done)** | `world-map.tsx` (`handleSectorNodePointerUp`) |
| Pointer capture xử lý nhả chuột ngoài vùng bản đồ | **Đã hoàn thành (Done)** | `world-map.tsx` (`handlePointerDown`/`handlePointerUp`) |
| Tương tác mượt mà khi zoom nhỏ ($0.7\times$) | **Đã hoàn thành (Done)** | `world-map.tsx` |
| Đồng bộ chọn sector với Ribbon và Inspector | **Đã hoàn thành (Done)** | `world-map.tsx`, `operations-center.tsx` |
| Thống nhất hành vi Embedded Map và Fullscreen Overlay | **Đã hoàn thành (Done)** | `world-map.tsx`, `world-fullscreen-overlay.tsx` |
| Trạng thái minh bạch cho nút tác chiến khi chưa có giao tranh | **Đã hoàn thành (Done)** | `world-map.tsx` (dòng 1700–1725) |
| Bộ kiểm thử Phase 6.22 (5/5 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-22-galaxy-map-hitbox-viewport.test.ts` |
| Toàn bộ 32 Test Suites vượt qua thành công (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
| Next.js Build & Typecheck thành công hoàn toàn | **Đã hoàn thành (Done)** | `compile_applet`, `lint_applet` |
