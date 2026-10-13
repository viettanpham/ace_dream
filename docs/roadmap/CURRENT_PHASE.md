# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.29 — GLOBAL OPERATIONS & EVENT HUB (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 38/38 Test Suites PASS, 8/8 Phase 6.29 Tests PASS, Build & Lint Succeeded)**.
- **Mục tiêu cốt lõi**:
  1. **Tích hợp Trung Tâm Điều Hành Tổng Hợp (Global Operations & Event Hub)**:
     - Nâng cấp tab Overview thành trung tâm chỉ huy tác chiến toàn diện, kết nối trực quan toàn bộ 10 sector thiên hà, các sự kiện khẩn cấp, hoạt động tác chiến và báo cáo tình báo.
     - Tái sử dụng 100% logic và nguồn dữ liệu hiện có từ WorldState, không tạo thêm Engine mới, không nhân bản state gây lệch dữ liệu.
  2. **Tổng hợp 5 Nhóm Thông Tin Chiến Lược**:
     - **A. Critical Alerts (Cảnh báo tối khẩn)**: Tổng hợp các nguy cơ P0 (Under siege, suspended combat, lương thực/tiếp tế chạm đáy 0, sự kiện hết hạn hôm nay), P1 (Bị đe dọa, threat >= 700, tuyến đường bị chặn, sự kiện còn 1 ngày/critical), P2 (Tuyến đường nguy hiểm, cảnh báo lương thực/tiếp tế thấp).
     - **B. Active Events (Sự kiện chiến lược)**: Phân định rõ ràng sự kiện INIT (chờ quyết định -> nút "Phê Chuẩn Chiến Lược" dẫn thẳng vào bảng phê chuẩn) và PROCESSING (đang triển khai -> nút "Xem Tiến Trình", tuyệt đối không xuất hiện nút phê chuẩn hoặc tạo giao dịch trùng lặp).
     - **C. Combat Operations (Tác chiến & Encounter)**: Hiển thị trận đấu dở dang (suspended combat), trích xuất chuẩn xác Snapshot, Transaction ID và Sector; danh sách Sector bị khóa tác chiến; các kết quả trận đấu mới nhất.
     - **D. Sector Operations (Tình trạng 10 sector)**: Báo cáo tức thì các sector có hoạt động can thiệp (vây hãm, đe dọa, có sự kiện, đang có đoàn quân chi viện); cung cấp các nút thao tác nhanh: Mở Hồ Sơ Intel (`SectorIntelModal`), Mở War Room, và Điều Quân Nhanh.
     - **E. Recent Reports (Báo cáo tình báo)**: Lối tắt trực tiếp đến `DebriefingDrawer` với danh sách báo cáo kết quả gần nhất mà không tạo kho lưu trữ thứ hai.
  3. **Ưu Tiên, Sắp Xếp & Chống Đếm Trùng Lặp**:
     - Phân cấp thị giác rõ ràng P0, P1, P2; cơ chế Deduplication loại bỏ hoàn toàn các cảnh báo trùng lặp cho cùng một thực thể.
     - Bộ đếm hành động (Actionable Counter) tính đúng số lượng việc cần người chơi can thiệp và hiển thị badge động trên Header Hub cũng như Navigation Ribbon.
  4. **Bảo Toàn Lưu Trữ & Gameplay**:
     - Giữ nguyên vẹn định dạng `STARFRONT_WORLD_SAVE_V1`, thuật toán Checksum CRC32 và phân hệ RPG Save V4.

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.29

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Khởi tạo Global Operations & Event Hub Component | **Đã hoàn thành (Done)** | `components/game/world/global-operations-hub.tsx` |
| Tích hợp vào Overview Tab của Operations Center | **Đã hoàn thành (Done)** | `components/game/world/operations-center.tsx` |
| Nhóm A: Critical Alerts (P0, P1, P2) | **Đã hoàn thành (Done)** | `global-operations-hub.tsx` (`computeCriticalAlerts`) |
| Nhóm B: Active Events (INIT vs PROCESSING) | **Đã hoàn thành (Done)** | `global-operations-hub.tsx` (`computeActiveEventsGroups`) |
| Nhóm C: Combat Operations & Suspended Combat | **Đã hoàn thành (Done)** | `global-operations-hub.tsx` (`computeCombatOperations`) |
| Nhóm D: Sector Operations cho 10 sector | **Đã hoàn thành (Done)** | `global-operations-hub.tsx` (`computeSectorOperations`) |
| Nhóm E: Recent Reports & Debriefing Drawer Shortcut | **Đã hoàn thành (Done)** | `global-operations-hub.tsx` (Group E markup & callbacks) |
| Actionable Badge Counter chống đếm trùng | **Đã hoàn thành (Done)** | `global-operations-hub.tsx` (`computeActionableItemsCount`) |
| Điều hướng thực tế đến Sector Intel, War Room, Events | **Đã hoàn thành (Done)** | `operations-center.tsx` (wire-up callbacks) |
| Bộ kiểm thử tự động Phase 6.29 (8/8 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-29-global-operations-event-hub.test.ts` |
| Toàn bộ 38 Test Suites của dự án (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
| Biên dịch Next.js 16 và TypeScript Linting hoàn hảo | **Đã hoàn thành (Done)** | `compile_applet`, `tsc --noEmit` |
