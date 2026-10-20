# STARFRONT WORLD — FND-7 IMPLEMENTATION PROGRESS TRACKER
## BẢNG THEO DÕI TIẾN ĐỘ TRIỂN KHAI NỀN TẢNG HẠM ĐỘI & TÀU CHIẾN (FND-7)

> **Cập nhật lúc:** 20/10/2026  
> **Chế độ thực thi:** IMPLEMENT ONE PHASE ONLY  
> **Giai đoạn vừa hoàn thành:** Phase 7.1: Master Data Catalogs & Schemas Foundation (**DONE**)  
> **Giai đoạn tiếp theo:** Phase 7.2: Ship Entity & Progression MK I–X Engine (**READY**)  

---

### 1. BẢNG TIẾN ĐỘ 7 GIAI ĐOẠN FND-7

| Mã Phase | Tên Giai Đoạn Triển Khai | Phạm Vi & Trọng Tâm Kỹ Thuật | Trạng Thái | Test Suite Đạt Chuẩn |
| :---: | :--- | :--- | :---: | :---: |
| **Phase 7.1** | **Master Data Catalogs & Schemas** | 7 canonical JSON catalogs, TypeScript contracts, Registry bootstrap, in-memory seed & disk sync. | **DONE** | `phase-7-1-fleet-catalogs.test.ts` (12/12 PASS) |
| **Phase 7.2** | **Ship Entity & Progression Engine** | `ShipInstance`, tích hợp FND-2 MK I–X, slot modules, hao mòn `condition`, đại tu docking port, MAX TIER BONUS. | `READY` | Chưa triển khai (Mục tiêu lượt tới) |
| **Phase 7.3** | **Hybrid Workforce & Crew Pool** | `FleetCrewPool`, phi công tinh anh vs thủy thủ đoàn `FLEET_CREW`, Học viện `NAVAL_ACADEMY`, 3-Pass Allocator. | `PENDING` | Chờ Phase 7.2 |
| **Phase 7.4** | **Fleet Entity, Treasury & Supply** | `FleetEntityState`, độc lập tài chính, AI Persona tự chủ, tiêu hao lương thực/nhiên liệu theo tick ngày. | `PENDING` | Chờ Phase 7.3 |
| **Phase 7.5** | **FRAME Engine & Annual Decay** | 3 số dư FRAME, suy giảm thường niên 360 ngày ($BaseDecay = Avg/2$, trần 50%), miễn trừ `NEW_GUILD_PROTECTION`, trợ cấp. | `PENDING` | Chờ Phase 7.4 |
| **Phase 7.6** | **World Integration & Combat V2** | Mở rộng `WorldState.fleets`, `NationalFleetRegistry` facade $O(1)$, adapter Combat V2, báo cáo 7/30 ngày & Autosave Checkpoint. | `PENDING` | Chờ Phase 7.5 |
| **Phase 7.7** | **UI Fleet Command & AdminCP** | Modal chỉ huy hạm đội, Sector Intel docking tab, danh thiếp chiến hạm, điều phối hành quân, Admin CP audit view. | `PENDING` | Chờ Phase 7.6 |

---

### 2. CHI TIẾT CÔNG VIỆC ĐÃ HOÀN THÀNH TRONG PHASE 7.1

1. **Hợp đồng Dữ liệu TypeScript (`lib/game/world/fleet/catalog-types.ts`)**:
   - `FleetTypeDefinition`, `FleetClassDefinition`, `ShipTypeDefinition`, `ShipClassDefinition`, `ShipDefinition`, `FleetPolicyProfile`, `FrameAwardDefinition`.
   - Các định nghĩa enum và union types chặt chẽ (`FleetStrategicRole`, `ShipHullClass`, `FrameRecipientType`).
2. **7 Danh Mục Master Catalog JSON Chuẩn Tắc (`/data/catalogs/`)**:
   - `system_fleet_fleet_type_data.json`: 4 loại hạm đội (Viễn chinh, Vệ binh, SAR cứu hộ, Vận tải chiến lược).
   - `system_fleet_fleet_class_data.json`: 5 bậc quy mô MK I..MK V (Squad, Flotilla, Task Force, Battle Group, Armada).
   - `system_fleet_ship_type_data.json`: 7 lớp tàu (Corvette, Frigate, Destroyer, Cruiser, Battleship, Carrier, Freighter).
   - `system_fleet_ship_class_data.json`: 5 bậc phẩm cấp kỹ thuật MK I..MK V (Standard, Reinforced, Advanced, Stellar, Dread).
   - `system_fleet_ship_definition_data.json`: 5 bản thiết kế chuẩn (Sol Valiant, Aegis Line Cruiser, Hyperion Carrier, Hermes Tender, Asclepius SAR).
   - `system_fleet_policy_profile_data.json`: Chính sách quốc gia VSS 2026 (Decay 360 ngày, trần 50%, trợ cấp $10 \times Tier$, bảo hộ tân binh 360 ngày).
   - `system_fleet_frame_award_catalog_data.json`: 4 biểu mẫu điểm thưởng chiến công (Boss Elimination 2500p, SAR Rescue 450p, Trade Lane 150p, Fortification 850p).
3. **Mã Nguồn Đăng Ký Hệ Thống (`lib/game/world/fleet/registry-integration.ts`)**:
   - Dữ liệu in-memory đồng bộ 100% với tệp JSON trên đĩa.
   - Hàm `registerFleetCatalogs()` nạp an toàn và tự động thông qua `seedFleetCatalogData()`.
   - Các hàm getter có kiểu dữ liệu mạnh: `getFleetType()`, `getFleetClass()`, `getShipType()`, `getShipClass()`, `getShipDefinition()`, `getFleetPolicyProfile()`, `getFrameAward()`.
4. **Tích Hợp Vào Điểm Khởi Tạo Thế Giới (`lib/game/world/bootstrap.ts`)**:
   - Tự động nạp 7 catalog của domain `fleet` trong `bootstrapWorldCatalogs()`.
   - Duy trì tính Idempotent tuyệt đối và bảo toàn số liệu kiểm thử hồi quy của FND-5 (20 catalog cơ bản) và FND-6 (4 catalog căn cứ).
5. **Kiểm Thử Đơn Vị Mục Tiêu (`tests/world/phase-7-1-fleet-catalogs.test.ts`)**:
   - 12/12 bài test đạt trạng thái **PASS** tuyệt đối (Thời gian thực thi ~31ms).
   - Kiểm tra hồi quy FND-5 (7/7 PASS) và FND-6 (19/19 PASS) không phát sinh bất kỳ xung đột nào.
   - `tsc --noEmit`: 0 lỗi.
   - Production Build `npm run build`: Hoàn tất thành công.

---

### 3. CHỈ DẪN CHO GIAI ĐOẠN TIẾP THEO (NEXT ACTION)

Tài khoản AI Studio tiếp theo chỉ cần mở `docs/foundations/FND7_MULTI_PHASE_ROADMAP.md` và thực hiện **Phase 7.2: Ship Entity & Progression MK I–X Engine**:
- Tạo `lib/game/world/ship/ship-entity.ts` (khởi tạo thực thể tàu từ `ShipDefinition`).
- Tạo `lib/game/world/ship/ship-progression.ts` (tích hợp FND-2 Progression MK I–X).
- Tạo `lib/game/world/ship/ship-maintenance.ts` (hao mòn `condition` và sửa chữa tại Docking Port).
- Viết `tests/world/phase-7-2-ship-progression.test.ts` và kiểm thử.
