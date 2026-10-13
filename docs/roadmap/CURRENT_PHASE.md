# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.30 — STRATEGIC GALAXY MAP & COMMAND UX ENHANCEMENT (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 40/40 Test Suites PASS, 6/6 Phase 6.30 Tests PASS, 7/7 Strategic Alignment Tests PASS, Build & Lint Succeeded)**.
- **Mục tiêu cốt lõi**:
  1. **Nâng cấp giao diện Galaxy Map Node-Only chuẩn Sci-Fi Tactical Command**:
     - Bảo toàn 100% bản đồ dạng sector nodes nối bằng hyperspace routes, không chuyển sang bản đồ địa lý hay hành tinh vẽ chi tiết.
     - Nâng cấp nền không gian có chiều sâu với các lớp tinh vân mờ ảo (nebulae gradients `#nebula-vss`, `#nebula-void`, `#nebula-center`), chùm sao tĩnh mật độ vừa phải không gây nhiễu, lưới tọa độ chiến thuật và dấu định vị góc 1000x650 MLY.
     - Phân định rõ ràng 4 trạng thái tuyến: Thông suốt (cyan solid `#06b6d4`), Nguy hiểm (amber dashed `#f59e0b`), Phong tỏa (red dashed `#ef4444`), và Ngoại tuyến (zinc dark `#52525b`).
     - Tăng cường tín hiệu thị giác cho 10 sector theo phe phái (VSS cyan, The Void crimson/purple, Tranh chấp amber) và giai đoạn (under_siege pulsing alert ring, threatened dashed ring, lost corrupted ring, recovery restoration bracket).
  2. **Chuẩn hóa trạng thái hiển thị mặc định (Default Display States)**:
     - **Map Legend**: Mặc định là **OFF** (thu gọn thành nút bấm `[🧭 Chú Giải]` tinh gọn ở góc trên trái). Cho phép bật/tắt tự do và ghi nhớ preference trong `localStorage` mà không tự ý mở lại khi re-render hoặc click sector.
     - **Node Details & Inspector**: Mặc định là **OFF** (chế độ Tổng Thể) giúp người chơi quan sát bao quát thiên hà mà không bị che khuất. Người chơi vẫn hover, click chọn sector bình thường với targeting reticle và route tags. Khi bật chế độ Chi Tiết (`showNodeDetails: true`), thanh Threat và Inspector drawer sẽ đồng bộ hiển thị.
  3. **Bổ sung các phương thức Zoom linh hoạt**:
     - **Mouse-Wheel Zoom**: Cho phép lăn chuột trực tiếp trên vùng bản đồ để phóng to / thu nhỏ mượt mà trong giới hạn [0.7x, 2.2x], tự động bỏ qua vùng cuộn của Inspector hoặc Legend.
     - **Double-Click to Zoom**: Nhấp đúp chuột vào bản đồ hoặc sector để zoom sâu về phía điểm nhấp; nếu đã phóng to (>= 1.7x), nhấp đúp sẽ đặt lại 1.0x góc nhìn chuẩn.
     - **Drag-to-Zoom**: Chủ động bỏ qua trong phase này để tránh xung đột với cử chỉ Pan camera và click sector theo drag threshold 5px.
  4. **Tích hợp Tổng Quan Tình Hình Chiến Lược Toàn Cảnh vào War Room**:
     - Thêm bảng điều khiển **War Room Strategic Situation Deck** ngay phía trên thanh Sector Command Ribbon.
     - Tận dụng 100% pure helpers từ `global-operations-hub.tsx` (`computeCriticalAlerts`, `computeCombatOperations`, `computeActiveEventsGroups`), không tạo dữ liệu giả hoặc nhân bản state.
     - Hiển thị 4 nhóm số liệu: 10 Sectors kiểm soát & chủ quyền, Threat TB & sector nguy cấp, Quân lực & hành quân, Sự kiện chờ phê chuẩn & trạng thái giao tranh.
     - Banner cảnh báo khẩn cấp P0/P1 có nút điều hướng trực tiếp: Tiếp tục trận đấu dở dang (suspended combat), Phê chuẩn sự kiện INIT, hoặc Focus thẳng vào sector nguy cơ.
  5. **Bảo tồn toàn vẹn kiến trúc & dữ liệu**:
     - Giữ nguyên 100% thuật toán `transformClientToSVG`, hitbox độc lập 140x88px, drag threshold 5px, Save Schema V1 (`STARFRONT_WORLD_SAVE_V1`) và Checksum CRC32.

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.30

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Nâng cấp nền không gian và độ sâu thị giác Node-only | **Đã hoàn thành (Done)** | `components/game/world/world-map.tsx` (`#space-depth-layer`, nebulae & stars) |
| Chuẩn hóa Map Legend mặc định OFF kèm localStorage preference | **Đã hoàn thành (Done)** | `world-map.tsx` (`showLegend`, `toggleLegend`) |
| Chuẩn hóa Node Details mặc định OFF (Tổng Thể vs Chi Tiết) | **Đã hoàn thành (Done)** | `world-map.tsx` (`showNodeDetails`, `toggleNodeDetails`) |
| Bổ sung Mouse-Wheel Zoom trên map canvas (0.7x .. 2.2x) | **Đã hoàn thành (Done)** | `world-map.tsx` (`useEffect` non-passive wheel listener) |
| Bổ sung Double-Click to Zoom & Reset | **Đã hoàn thành (Done)** | `world-map.tsx` (`handleDoubleClick`, `onDoubleClick`) |
| Chủ động loại trừ Drag-to-Zoom tránh xung đột cử chỉ Pan/Click | **Đã hoàn thành (Done)** | Báo cáo kiến trúc & loại trừ có chủ đích theo chỉ dẫn |
| War Room Strategic Situation Deck & Critical Alerts Strip | **Đã hoàn thành (Done)** | `components/game/world/operations-center.tsx` (Tab War Room) |
| Tích hợp hành động điều hướng thực tế (Combat, Event, Sector Focus) | **Đã hoàn thành (Done)** | `operations-center.tsx` (wire-up handlers) |
| Bảo toàn Strategic Map Selection Alignment Fix | **Đã hoàn thành (Done)** | `tests/world/strategic-map-selection-alignment.test.ts` (7/7 PASS) |
| Bộ kiểm thử tự động Phase 6.30 (6/6 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-30-galaxy-map-command-ux.test.ts` |
| Toàn bộ 40 Test Suites của dự án (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
| Biên dịch Next.js 16 và TypeScript Linting hoàn hảo | **Đã hoàn thành (Done)** | `compile_applet`, `tsc --noEmit` |
