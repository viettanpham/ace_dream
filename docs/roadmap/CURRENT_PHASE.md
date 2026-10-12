# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.17 — TÁI CẤU TRÚC ĐIỀU HƯỚNG CHÍNH & NỀN TẢNG WAR ROOM (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 28/28 Test Suites PASS, 7/7 Phase 6.17 Tests PASS, Build Thành Công)**.
- **Mục tiêu cốt lõi**:
  - Triển khai giai đoạn P0 từ `WORLD_UI_UX_AUDIT.md`:
    1. **Tái Cấu Trúc Điều Hướng Shell (`components/game/starfront-shell.tsx`)**:
       * Đưa **STARFRONT WORLD** thành mục chỉ huy tối cao ở vị trí đầu tiên của Khối 1 với huy hiệu `LIVE GALAXY`, viền phát sáng cyan, chấm ping radar nhấp nháy.
       * Tổ chức menu theo **Mô hình 3 Tầng Chỉ Huy (`COMMAND_TIERS`)**: Khối 1: Tổng Hành Dinh Chiến Lược (`world`, `home`), Khối 2: Buồng Lái & Tác Chiến (`battlefield`, `character-gear`, `gallery`), Khối 3: Hậu Phương & Khí Tài (`hangar`, `shop`, `missions`, `mission-logs`).
       * Phân định rõ Chiến Dịch Cốt Truyện RPG (12 ải) và Sự Kiện Chiến Trường WORLD (8 sector thiên hà).
       * Giữ trọn vẹn trạng thái active, luồng chọn nhân vật, khóa phi công/gear, và nhóm mở rộng `OPERATION_SECTIONS`.
    2. **Nền Tảng War Room Trung Tâm (`components/game/world/operations-center.tsx`, `components/game/world/world-map.tsx`)**:
       * Biến Galaxy Map thành trung tâm tác chiến mặc định (`initialTab="map"`), nâng chiều cao khung nhìn lên `680px-780px` (min 580px).
       * Tích hợp **Thanh Điều Phối Sector Nhanh (Sector Command Ribbon)** hiển thị 8 sector đồng bộ thời gian thực (chấm chủ quyền, threat level, quân đồn trú, trạng thái khóa combat).
       * Đồng bộ hai chiều tức thì: Bấm chọn trên Ribbon hoặc trên SVG Map đều cập nhật `selectedSectorId` và mở Sector Inspector chi tiết.
       * Tích hợp toàn bộ thao tác vào Sector Inspector: Đổi lệnh chiến lược, Nâng cấp công sự (50 Materials), Quick Dispatch, Combat Deploy, Sparkline xu hướng Threat 5 ngày, nút tập trung góc nhìn có bù trừ vị trí Inspector.
       * Khử bỏ tab `sectors` văn bản trùng lặp, bảo đảm tương thích ngược hoàn hảo.
  - **Bảo toàn toàn vẹn hệ thống**:
    * Không thay đổi logic simulator, công thức tính toán, event strategy policy hay tick engine.
    * Bảo vệ tuyệt đối phân hệ RPG Save V4 (`STARFRONT_SAVE_DATA_V4`) và World State (`STARFRONT_WORLD_SAVE_V1`).

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.17

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Mô hình 3 Tầng Chỉ Huy Shell (Command Tier Architecture) | **Đã hoàn thành (Done)** | `components/game/starfront-shell.tsx` |
| Ghim WORLD làm trung tâm chỉ huy tối cao Khối 1 | **Đã hoàn thành (Done)** | `components/game/starfront-shell.tsx` |
| Phân định ngữ cảnh RPG Campaign vs WORLD Galaxy Events | **Đã hoàn thành (Done)** | `components/game/starfront-shell.tsx` |
| War Room Viewport trung tâm (680px-780px) | **Đã hoàn thành (Done)** | `components/game/world/operations-center.tsx` |
| Thanh Điều Phối Sector Nhanh (Sector Command Ribbon 8 Sectors) | **Đã hoàn thành (Done)** | `components/game/world/operations-center.tsx` |
| Đồng bộ hóa lựa chọn Sector hai chiều giữa Ribbon, Map & Inspector | **Đã hoàn thành (Done)** | `components/game/world/operations-center.tsx`, `world-map.tsx` |
| Sector Inspector tích hợp đầy đủ Strategic Orders, Fortification (+50) | **Đã hoàn thành (Done)** | `components/game/world/world-map.tsx` |
| Căn chỉnh Camera thông minh bù trừ vị trí Inspector | **Đã hoàn thành (Done)** | `components/game/world/world-map.tsx` |
| Khử bỏ tab Sectors trùng lặp, tương thích ngược an toàn | **Đã hoàn thành (Done)** | `components/game/world/operations-center.tsx` |
| Bộ kiểm thử Phase 6.17 War Room Foundation (7/7 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-17-war-room.test.ts` |
| Zero-Regression toàn diện 28/28 Test Suites | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
