# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.28 — GALAXY EXPANSION TO 10 SECTORS & SECTOR INTEL (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 37/37 Test Suites PASS, 7/7 Phase 6.28 Tests PASS, Build & Lint Succeeded)**.
- **Mục tiêu cốt lõi**:
  1. **Mở rộng Galaxy Map từ 8 lên 10 sector với topology tối ưu**:
     - Bổ sung 2 sector chiến lược hoàn toàn mới: `elysium_sanctuary` (Thánh Địa Elysium, VSS, vựa nông nghiệp và an dưỡng phi công) và `abyssal_rift` (Khe Nứt Vô Tận, The Void, pháo đài tiền tiêu hắc ám).
     - Thiết lập mạng lưới 16 tuyến đường siêu không gian (routes) bảo đảm đồ thị liên thông hoàn hảo, thuật toán tìm đường ngắn nhất Dijkstra hoạt động thông suốt trên cả 10 sector.
     - Bảo toàn 100% ID, thuộc tính, tài nguyên và cấu trúc của 8 sector nguyên bản.
  2. **Khắc phục triệt để tương tác chọn Node trên Galaxy Map**:
     - Hitbox chuyên dụng độc lập (`rect` kích thước 120x82 px) nằm ngay trên tọa độ node chuẩn `(cx, cy)`, bao trùm cả hình cầu node và nhãn tên.
     - Tách biệt 100% vùng tương tác khỏi hiệu ứng quay (reticle spinner), pulse nhấp nháy, text nhãn (`pointer-events-none`) để không bao giờ bị lệch tâm hay nuốt event.
     - Tách biệt lớp tuyến đường (routes-layer) phía dưới, ngăn chặn đường nối cắt ngang che mất node click.
     - Ngưỡng phân biệt thao tác rõ ràng (`DRAG_THRESHOLD = 5px`): di chuyển chuột dưới 5px được tính là click chọn sector, từ 5px trở lên kích hoạt camera panning, loại bỏ hoàn toàn micro-jitter và lỗi nhầm lẫn giữa kéo bản đồ và chọn sector.
  3. **Hồ sơ tình báo chuyên sâu Sector Intel (`SectorIntelModal`)**:
     - Bối cảnh thị giác đặc trưng (visual characteristic backdrop) với gradient, tone màu và hiệu ứng ánh sáng riêng biệt cho từng sector trong số 10 sector.
     - Thông tin chiến lược toàn diện: Phe kiểm soát, cấp độ đe dọa (Threat Level), độ ổn định (Stability), công sự (Fortifications), dân số, tài nguyên và kho lương thực.
     - Hoạt động tại địa điểm: Danh sách các sự kiện đang diễn ra, chiến dịch hành quân (deployments) đến/đi, tình trạng khóa giao tranh (Combat Lock).
     - Thanh công cụ tác chiến tức thì: Nút mở nhanh trong War Room (`onNavigateToSectorOperations`), điều hướng/focus trên bản đồ, điều quân hỏa tốc (Quick Dispatch), và bộ chuyển sector kế tiếp/trước đó.
  4. **Tương thích ngược & bảo toàn dữ liệu save (Backward Compatibility)**:
     - Tự động di chuyển (migration) các file save cũ từ mạng lưới 8 sector lên 10 sector mà không làm mất bất kỳ dữ liệu nào của người chơi.
     - Bảo toàn cấu trúc `STARFRONT_WORLD_SAVE_V1` và phân hệ `STARFRONT_SAVE_DATA_V4` (RPG Pilot/Gear).

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.28

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Mở rộng 10 sector và 16 tuyến đường chuẩn hóa | **Đã hoàn thành (Done)** | `initial-state.ts`, `initial-map.ts` (`INITIAL_WORLD_SECTORS`, `INITIAL_WORLD_ROUTES`) |
| Kết nối đồ thị & Dijkstra trên 10 sector | **Đã hoàn thành (Done)** | `graph.ts` (`findShortestPath`, `getAdjacentSectors`, `findConnectingRoute`) |
| Hitbox độc lập 120x82 & pointer-events tách bạch | **Đã hoàn thành (Done)** | `world-map.tsx` (dedicated hit area, pointer-events: none trên đồ họa) |
| Ngưỡng phân biệt Click vs Pan (DRAG_THRESHOLD = 5px) | **Đã hoàn thành (Done)** | `world-map.tsx` (`handlePointerDown`, `handlePointerMove`, `DRAG_THRESHOLD`) |
| Giao diện Sector Intel toàn diện 10 sector | **Đã hoàn thành (Done)** | `sector-intel-modal.tsx` (`SectorIntelModal`, `SECTOR_INTEL_THEMES`) |
| Tích hợp nút xem Intel trên Inspector & War Room | **Đã hoàn thành (Done)** | `world-map.tsx` (Inspector header & button), `operations-center.tsx` |
| Tự động migration save 8 sector lên 10 sector | **Đã hoàn thành (Done)** | `storage.ts` (`migrateWorldStateTo10Sectors`, `loadWorldState`) |
| Bảo toàn tuyệt đối RPG Save V4 và Checksum CRC32 | **Đã hoàn thành (Done)** | `storage.ts`, `tests/world/phase6-28-galaxy-expansion-sector-intel.test.ts` |
| Bộ kiểm thử tự động Phase 6.28 (7/7 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-28-galaxy-expansion-sector-intel.test.ts` |
| Toàn bộ 37 Test Suites của dự án (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
| Biên dịch Next.js 16 và TypeScript Linting hoàn hảo | **Đã hoàn thành (Done)** | `compile_applet`, `tsc --noEmit` |
