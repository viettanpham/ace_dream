# STARFRONT WORLD — FND-7 IMPLEMENTATION PROGRESS TRACKER
## BẢNG THEO DÕI TIẾN ĐỘ TRIỂN KHAI NỀN TẢNG HẠM ĐỘI & TÀU CHIẾN (FND-7)

> **Cập nhật lúc:** 20/10/2026  
> **Chế độ thực thi:** IMPLEMENT ONE PHASE ONLY  
> **Giai đoạn vừa hoàn thành:** Phase 7.2: Ship Entity & Progression MK I–X Engine (**DONE**)  
> **Giai đoạn tiếp theo:** Phase 7.3: Hybrid Workforce, Academy & Crew Pool (**READY**)  

---

### 1. BẢNG TIẾN ĐỘ 7 GIAI ĐOẠN FND-7

| Mã Phase | Tên Giai Đoạn Triển Khai | Phạm Vi & Trọng Tâm Kỹ Thuật | Trạng Thái | Test Suite Đạt Chuẩn |
| :---: | :--- | :--- | :---: | :---: |
| **Phase 7.1** | **Master Data Catalogs & Schemas** | 7 canonical JSON catalogs, TypeScript contracts, Registry bootstrap, in-memory seed & disk sync. | **DONE** | `phase-7-1-fleet-catalogs.test.ts` (12/12 PASS) |
| **Phase 7.2** | **Ship Entity & Progression Engine** | `ShipInstance`, tích hợp FND-2 MK I–X, slot modules, crew ratios/efficiency, hao mòn `condition`, đại tu docking port, MAX TIER BONUS, bảo trì policy, soft migration. | **DONE** | `phase-7-2-ship-progression.test.ts` (15/15 PASS) |
| **Phase 7.3** | **Hybrid Workforce & Crew Pool** | `FleetCrewPool`, phi công tinh anh vs thủy thủ đoàn `FLEET_CREW`, Học viện `NAVAL_ACADEMY`, 3-Pass Allocator. | `READY` | Sẵn sàng triển khai ở phiên tiếp theo |
| **Phase 7.4** | **Fleet Entity, Treasury & Supply** | `FleetEntityState`, độc lập tài chính, AI Persona tự chủ, tiêu hao lương thực/nhiên liệu theo tick ngày. | `PENDING` | Chờ Phase 7.3 |
| **Phase 7.5** | **FRAME Engine & Annual Decay** | 3 số dư FRAME, suy giảm thường niên 360 ngày ($BaseDecay = Avg/2$, trần 50%), miễn trừ `NEW_GUILD_PROTECTION`, trợ cấp. | `PENDING` | Chờ Phase 7.4 |
| **Phase 7.6** | **World Integration & Combat V2** | Mở rộng `WorldState.fleets`, `NationalFleetRegistry` facade $O(1)$, adapter Combat V2, báo cáo 7/30 ngày & Autosave Checkpoint. | `PENDING` | Chờ Phase 7.5 |
| **Phase 7.7** | **UI Fleet Command & AdminCP** | Modal chỉ huy hạm đội, Sector Intel docking tab, danh thiếp chiến hạm, điều phối hành quân, Admin CP audit view. | `PENDING` | Chờ Phase 7.6 |

---

### 2. CHI TIẾT CÔNG VIỆC ĐÃ HOÀN THÀNH TRONG PHASE 7.2

1. **Kiến Trúc Thực Thể Tàu Chiến (`lib/game/world/ship/types.ts` & `ship-entity.ts`)**:
   - Triển khai `ShipInstance` theo mô hình 4 tầng chuẩn tắc: `Type -> Class -> Definition -> Instance`.
   - Mỗi con tàu là một thực thể độc lập có `instanceId`, `customName`, `serialNumber`, chủ quyền `ownerRef` độc lập, và vị trí linh hoạt.
   - Cơ chế Decoupling: Tách tàu khỏi Hạm đội (`detachShipFromFleet`) để đồn trú căn cứ hoặc cập cảng xưởng cạn, và nhập lại biên chế (`assignShipToFleet`).
2. **Hệ Thống Phân Bổ & Hiệu Năng Thủy Thủ Đoàn (Crew Ratios & Efficiency Curve)**:
   - Tự động tính toán linh hoạt từ bản vẽ thiết kế: `minimumCrew` (theo `minimumCrewRatio`, mặc định 50%), `targetCrew` (100%), `maximumCrew` (theo `maximumCrewRatio`, mặc định 150%).
   - Đường cong hiệu suất vận hành:
     * Crew < Minimum: Hiệu suất 0.40, khóa vận hành tác chiến / nhảy siêu không gian (`canOperate = false`).
     * Minimum <= Crew < Target: Hiệu suất 0.60..0.99, vận hành hạn chế.
     * Target <= Crew < Maximum: Hiệu suất 1.00 chuẩn tắc.
     * Crew >= Maximum: Hiệu suất 1.25 (+25% tốc độ sửa chữa & phục hồi).
   - Chuẩn bị đầy đủ contract để sẵn sàng kết nối với `FleetCrewPool` của Phase 7.3.
3. **Cơ Chế Slot & Module Tiến Trình Chuẩn Hóa**:
   - Hỗ trợ cả typed slots (vũ khí, lá chắn, động cơ) và generic slots theo framework FND-5.
   - Thăng hạng module theo slot profile của từng lớp tàu, hỗ trợ mở rộng số slot khi nâng cấp Tier.
4. **Tích Hợp FND-2 Shared Progression Engine (`lib/game/world/ship/ship-progression.ts`)**:
   - Chiến hạm sở hữu Level + EXP + Tier MK I..X thông qua `ProgressionEntity`.
   - Tích lũy EXP từ dặm bay tuần tra (`grantShipMileageExp`) và giao tranh (`grantShipCombatExp`).
   - Khi chạm mốc cấp tối đa của Tier (ví dụ: Level 10 của MK I), tàu chuyển sang trạng thái `AWAITING_UPGRADE`.
   - Kỷ luật **Zero Hidden Overflow**: Tuyệt đối không cho phép EXP tràn ẩn khi đang chờ nâng cấp.
5. **Cơ Chế Thăng Cấp Xưởng Đóng Tàu (Dockyard Upgrade Tasks)**:
   - Kiểm tra điều kiện Căn cứ: Base phải có cảng docking hoạt động (`fleetDockingCapacity > 0`), không đang bị vây hãm (`stage !== "under_siege"`).
   - Xác định thời gian thực thi (Game Days) và chi phí tài nguyên ($400 \times Tier$ Industrial Materials, $200 \times Tier$ Energy, $800 \times Tier$ Credits).
   - Nhiệm vụ nâng cấp (`ShipUpgradeTask`) chạy qua các tick ngày game, tự động hoàn tất tại `completeDay`.
6. **MAX TIER BONUS (MK X Capstone)**:
   - Khi chiến hạm đạt mốc tối thượng MK X (Tier 10), nhận vĩnh viễn danh vị Capstone:
     * +25% Max Hull HP vĩnh viễn.
     * +25% Max Shield HP vĩnh viễn.
     * +1 Bonus Module Slot vĩnh viễn.
     * Khóa 1-lần duy nhất (`maxTierBonus.applied = true`), không cộng dồn trùng lặp.
7. **Hao Mòn & Bảo Dưỡng (`lib/game/world/ship/ship-maintenance.ts`)**:
   - Tách biệt rạch ròi giữa Hull HP (sinh mệnh tức thời) và Condition (độ hao mòn khí tài [0.00..100.00%]).
   - Hao mòn tất định theo dặm bay (0.05% / 1,000 km) và lượt giao tranh (1.5% / round).
   - Phân cấp trạng thái: `PRISTINE` (90-100%), `SERVICEABLE` (75-89%), `WORN` (50-74%), `DEGRADED` (25-49%), `CRITICAL` (0-24%).
   - Đại tu xưởng cạn (`repairShipAtBase`) phục hồi 100% HP, Shield và Condition, hạch toán tiêu hao vật tư.
   - Quản lý chính sách bảo dưỡng (`maintenancePolicy`: "AUTO", "MANUAL", "EMERGENCY_ONLY") với cơ chế tự động quyết toán `settleShipMaintenancePolicy`.
8. **Mở Rộng Danh Mục Ship Class Lên 10 Bậc MK I..X**:
   - Bổ sung đủ 10 lớp công nghệ đóng tàu MK I đến MK X trong `system_fleet_ship_class_data.json` và seed data `registry-integration.ts`.
9. **Tích Hợp Khởi Tạo Thế Giới & Lưu Trữ (WorldState Integration & Storage Migration)**:
   - Bổ sung trường `ships?: Record<string, ShipInstance>` vào `WorldState`.
   - Khởi tạo 2 tàu chiến hạt nhân mặc định của VSS (`VSS Valiant Alpha` và `VSS Hermes Resupply 01`) trong `createInitialWorldState()` và `generate30NodeWorld()`.
   - Cơ chế Soft Migration trong `storage.ts` (`migrateFoundationState`): Tự động bổ sung tàu mặc định cho các save game cũ, bảo vệ save an toàn 100%.

---

### 3. KẾT QUẢ KIỂM THỬ TỔNG HỢP
* `tests/world/phase-7-2-ship-progression.test.ts`: **15/15 PASS** (~75ms).
* `tests/world/phase-7-1-fleet-catalogs.test.ts`: **12/12 PASS** (~35ms).
* Regression FND-1 → FND-6: **163/163 PASS** (100% pass across all foundation test suites).
* `tsc --noEmit`: **0 errors**.
* Production Build `npm run build`: **Compiled successfully**.

---

### 4. CHỈ DẪN CHO GIAI ĐOẠN TIẾP THEO (NEXT ACTION)

Tài khoản AI Studio tiếp theo chỉ cần mở `docs/foundations/FND7_MULTI_PHASE_ROADMAP.md` và thực hiện **Phase 7.3: Hybrid Workforce, Academy & Crew Pool**:
- Xây dựng `lib/game/world/fleet/fleet-personnel.ts`.
- Quản lý `FleetCrewPool` (Idle, Assigned, Reserve, Deficit) liên kết với FND-4.
- Đào tạo thủy thủ tại công trình `NAVAL_ACADEMY` từ quỹ dân số `RESIDENT` của Căn cứ.
- Bộ phân bổ nhân lực 3 vòng (3-Pass Workforce Allocator).
- Viết `tests/world/phase-7-3-fleet-workforce.test.ts` và kiểm thử.
