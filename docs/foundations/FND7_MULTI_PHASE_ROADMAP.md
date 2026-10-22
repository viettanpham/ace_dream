# STARFRONT WORLD — FND-7 MULTI-PHASE IMPLEMENTATION ROADMAP
## KẾ HOẠCH TRIỂN KHAI PHÂN KỲ NỀN TẢNG HẠM ĐỘI & TÀU CHIẾN

> **Mã kế hoạch:** FND-7-ROADMAP  
> **Trạng thái:** APPROVED FOR MULTI-PHASE EXECUTION  
> **Chiến lược thực thi:** Chia nhỏ thành 7 Phase kỹ thuật độc lập, tuần tự (Sequential Sub-Phases), kiểm thử đơn vị & tích hợp từng bước, bảo đảm không gây hồi quy (Zero Regressions) lên hệ thống hiện có.  

---

### TỔNG QUAN LỘ TRÌNH 7 GIAI ĐOẠN

```
[ Phase 7.1: Master Data Catalogs ]
                │
                ▼
[ Phase 7.2: Ship Entities & Progression MK I-X ]
                │
                ▼
[ Phase 7.3: Hybrid Workforce, Academy & Crew Pool ]
                │
                ▼
[ Phase 7.4: Fleet Entities, Treasury & Logistics Supply ]
                │
                ▼
[ Phase 7.5: FRAME Accounting, Annual Decay & Subsidies ]
                │
                ▼
[ Phase 7.6: WorldState Integration, Combat V2 & Reports ]
                │
                ▼
[ Phase 7.7: UI Fleet Command, Sector Intel & AdminCP ]
```

---

### CHI TIẾT TỪNG GIAI ĐOẠN (SUB-PHASE SPECIFICATIONS)

#### PHASE 7.1: MASTER DATA CATALOGS & SCHEMAS FOUNDATION
- **Mục tiêu**: Thiết lập toàn bộ 7 danh mục Master Catalog chuẩn tắc theo nguyên lý FND-1, đăng ký vào Registry tập trung của Game World.
- **Phạm vi (Scope)**:
  - Khởi tạo 7 tệp JSON tại `/data/catalogs/`:
    1. `system_fleet_fleet_type_data.json`
    2. `system_fleet_fleet_class_data.json`
    3. `system_fleet_ship_type_data.json`
    4. `system_fleet_ship_class_data.json`
    5. `system_fleet_ship_definition_data.json`
    6. `system_fleet_policy_profile_data.json`
    7. `system_fleet_frame_award_catalog_data.json`
  - Đăng ký tự động qua `bootstrapWorldCatalogs()` trong `lib/game/world/catalog/registry.ts`.
  - Viết Type Guards và Validation Schemas cho domain `fleet`.
- **Sản phẩm bàn giao (Deliverables)**:
  - 7 tệp JSON trong `/data/catalogs/`.
  - TypeScript types mở rộng trong `lib/game/world/catalog/types.ts`.
  - Bộ kiểm thử `tests/world/phase-7-1-fleet-catalogs.test.ts`.
- **Bất biến cần bảo vệ (Invariants)**:
  - Không phá vỡ 20 catalogs hiện có của FND-1 đến FND-6.
  - Tính năng nạp idempotent (`bootstrapWorldCatalogs` có thể gọi nhiều lần mà không tạo rác).
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - Tất cả 7 danh mục nạp thành công từ đĩa với đầy đủ dữ liệu định nghĩa.
  - Bộ kiểm thử đạt 100% PASS, 0 lỗi TypeScript `tsc --noEmit`.

---

#### PHASE 7.2: SHIP ENTITIES & PROGRESSION MK I–X ENGINE
- **Mục tiêu**: Xây dựng thực thể tàu chiến độc lập (`ShipInstance`), tích hợp cơ chế thăng cấp FND-2 Progression MK I – MK X, hệ thống Slot Module, và chỉ số hao mòn Condition.
- **Phạm vi (Scope)**:
  - Triển khai `lib/game/world/ship/`:
    * `ship-entity.ts`: Khởi tạo tàu chiến từ `ShipDefinition`, quản lý HP, Shield, Speed, và Slot Modules.
    * `ship-progression.ts`: Tích hợp `ProgressionEntity`, tính EXP từ dặm bay / giao tranh, xử lý khóa EXP khi chạm ngưỡng `AWAITING_UPGRADE`.
    * `ship-maintenance.ts`: Tính toán suy giảm `condition` theo dặm bay, cơ chế sửa chữa tại Docking Port.
    * `ship-capstone.ts`: Cơ chế kích hoạt 1-time `MAX TIER BONUS` khi tàu đạt mốc MK X Level 50.
- **Sản phẩm bàn giao (Deliverables)**:
  - Thư mục mã nguồn `lib/game/world/ship/`.
  - Bộ kiểm thử `tests/world/phase-7-2-ship-progression.test.ts`.
- **Bất biến cần bảo vệ (Invariants)**:
  - Tàu đạt mốc Tier không được tự động thăng cấp nếu chưa thỏa mãn điều kiện xưởng đóng tàu và tài nguyên tại Base.
  - Chỉ số `condition` luôn nằm trong biên độ `[0.00..100.00%]`.
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - Kiểm chứng thành công vòng đời tiến trình tàu: MK I -> MK X, nhận đủ MAX TIER BONUS.
  - Sửa chữa và đại tu tiêu hao đúng số lượng `logisticsSupplies` và `credits`.

---

#### PHASE 7.3: HYBRID WORKFORCE, ACADEMY & CREW POOL
- **Mục tiêu**: Tích hợp nhân sự hai luồng: Phi công Tinh anh (Character V1 / Pilot Survival) và Thủy thủ đoàn tiêu chuẩn (`FleetCrewPool`), kết nối với Học viện Hải quân (`NAVAL_ACADEMY`) và Bộ phân bổ nhân lực 3-Pass của FND-4.
- **Phạm vi (Scope)**:
  - Triển khai `lib/game/world/fleet/fleet-personnel.ts`:
    * Quản lý `FleetCrewPool` (Idle, Assigned, Reserve, Deficit).
    * Bổ nhiệm / Miễn nhiệm Thuyền trưởng (Captain) và Sĩ quan Thuyền phó (XO) từ danh bạ Pilot chuẩn.
    * Đào tạo thủy thủ tại công trình `NAVAL_ACADEMY` từ quỹ dân số `RESIDENT` của Căn cứ.
    * Tích hợp điều chuyển nhân sự thực thể qua `inTransitTransfers` (Không teleport).
- **Sản phẩm bàn giao (Deliverables)**:
  - Module `fleet-personnel.ts`.
  - Bộ kiểm thử `tests/world/phase-7-3-fleet-workforce.test.ts`.
- **Bất biến cần bảo vệ (Invariants)**:
  - Bảo toàn quân số: Dân số Base giảm đúng bằng số lượng tuyển vào Fleet + số lượng đang In-Transit.
  - Thuyền viên đã vào Fleet thuộc quyền sở hữu của Fleet, Base không được tự ý rút lại.
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - 3-Pass Allocator phân bổ chuẩn xác: Pass 1 (Minimum), Pass 2 (Target), Pass 3 (Maximum).
  - Điều chuyển nhân sự có độ trễ thời gian thực tế khớp với khoảng cách tuyến Hyperlane.

---

#### PHASE 7.4: FLEET ENTITIES, TREASURY & LOGISTICS SUPPLY
- **Mục tiêu**: Xây dựng thực thể Hạm đội (`FleetEntityState`), cơ chế độc lập tài chính (`FleetTreasuryState`), AI Persona tự chủ, và chuỗi tiêu hao hậu cần thực tế (`WorldResourceLedger`).
- **Phạm vi (Scope)**:
  - Triển khai `lib/game/world/fleet/`:
    * `fleet-entity.ts`: Quản lý thực thể Hạm đội, biên chế tàu, neo đậu cảng.
    * `fleet-treasury.ts`: Sổ cái tín dụng, thu chi lương bổng, xử lý thâm hụt tài chính.
    * `fleet-logistics.ts`: Khoang hàng chứa Food, Energy, Supplies, tính tiêu hao theo tick (Daily Consumption).
    * `fleet-ai-command.ts`: AI Persona tự chủ, thẩm quyền chỉ huy tự vệ, cơ chế Lệnh khẩn cấp quốc gia (National Emergency Command).
- **Sản phẩm bàn giao (Deliverables)**:
  - Modules quản lý thực thể hạm đội, ngân khố và AI chỉ huy.
  - Bộ kiểm thử `tests/world/phase-7-4-fleet-entity-treasury.test.ts`.
- **Bất biến cần bảo vệ (Invariants)**:
  - Base không tự ý chiếm dụng Treasury hoặc Cargo của Fleet.
  - Tiêu hao Lương thực (Food) và Năng lượng (Energy) phản ánh đúng số quân và công suất động cơ.
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - Hạm đội cạn lương thực bị áp dụng trạng thái Đói khát (`Starvation`), sĩ khí suy giảm.
  - Hạm đội hết nhiên liệu bị trôi dạt dừng bước trên tuyến đường.
  - AI chỉ huy tự động ra lệnh rút lui khi tổn thất vượt ngưỡng an toàn.

---

#### PHASE 7.5: FRAME ACCOUNTING, ANNUAL DECAY & SUBSIDIES
- **Mục tiêu**: Xây dựng toàn bộ hệ thống kế toán điểm FRAME với 3 số dư độc lập, cơ chế suy giảm thường niên (Annual FRAME Decay) 360 ngày, gói bảo hộ tân binh (`NEW_GUILD_PROTECTION`), và chính sách trợ cấp hạm đội.
- **Phạm vi (Scope)**:
  - Triển khai `lib/game/world/fleet/fleet-frame-engine.ts`:
    * Quản lý 3 số dư: `cycleFrame`, `availableFrame`, `totalFrame`.
    * Hệ số thưởng phạt (-1000% đến +1000% Cycle).
    * Quy tắc giảm Total khi phạt vượt Available (Sàn = 0, tuyệt đối không để âm).
    * Cơ chế tính toán suy giảm thường niên:
      $$BaseDecay = NationalAverageCycle / 2, \quad ActualDecay = \min(BaseDecay, Total \times 50\%)$$
    * Bút toán Idempotent (không trừ 2 lần/năm).
    * Miễn trừ Decay cho các hạm đội có buff `NEW_GUILD_PROTECTION`.
    * Quản lý hạn mức trợ cấp theo Tier ($10 \times Tier$), giảm dần đều với sàn 30%.
- **Sản phẩm bàn giao (Deliverables)**:
  - Module `fleet-frame-engine.ts`.
  - Bộ kiểm thử `tests/world/phase-7-5-fleet-frame-policies.test.ts`.
- **Bất biến cần bảo vệ (Invariants)**:
  - Không bao giờ để `availableFrame` hoặc `totalFrame` bị âm.
  - Khấu trừ thường niên chỉ chạy đúng 1 lần cho mỗi năm tài chính 360 ngày.
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - Mô phỏng chu kỳ 360 ngày kiểm tra Decay chính xác 100%.
  - Hạm đội tân binh được miễn trừ hoàn toàn Decay trong 360 ngày đầu.

---

#### PHASE 7.6: WORLDSTATE INTEGRATION, COMBAT V2 & REPORTS
- **Mục tiêu**: Mở rộng `WorldState` để lưu trữ `fleets`, xây dựng `NationalFleetRegistry` facade, adapter kết nối với Combat V2, và chu kỳ báo cáo 7 ngày / quyết toán 30 ngày kèm Autosave Checkpoint.
- **Phạm vi (Scope)**:
  - Cập nhật `WorldState` trong `lib/game/world/types.ts`:
    * Thêm trường `fleets?: Record<string, FleetEntityState>`.
    * Thêm trường `nationalFleetRegistryConfig?: NationalFleetRegistryConfig`.
  - Triển khai `lib/game/world/fleet/fleet-registry.ts`: Facade tra cứu tức thời $O(1)$ theo FleetId, SectorId, BaseId.
  - Triển khai `lib/game/world/fleet/fleet-combat-adapter.ts`: Chuyển đổi hạm đội thành `CombatSupportEntity` và các đơn vị giao tranh trong Combat V2.
  - Triển khai chu kỳ báo cáo 7 ngày và 30 ngày trong `tick-engine.ts`, kích hoạt `Autosave Report Checkpoint`.
- **Sản phẩm bàn giao (Deliverables)**:
  - Các module tích hợp WorldState, Combat Adapter và Registry Facade.
  - Bộ kiểm thử tích hợp `tests/world/phase-7-6-fleet-world-integration.test.ts`.
- **Bất biến cần bảo vệ (Invariants)**:
  - Registry không sao chép dữ liệu, chỉ tham chiếu và lập chỉ mục.
  - Autosave Report Checkpoint lưu trữ an toàn độc lập với autosave thông thường.
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - Hạm đội tham chiến trong Combat V2 chịu tổn thất HP, hư hại Condition và ghi nhận chiến công vào `FleetServiceLog`.
  - Báo cáo chu kỳ 7 ngày và 30 ngày xuất dữ liệu thống kê chuẩn xác.

---

#### PHASE 7.7: UI FLEET COMMAND, SECTOR INTEL & ADMINCP
- **Mục tiêu**: Triển khai giao diện điều hành hạm đội trực quan, tích hợp vào Sector Intel Modal, Bảng điều khiển Admin CP, và trung tâm chỉ huy chiến lược.
- **Phạm vi (Scope)**:
  - Xây dựng component `components/game/world/fleet-command-modal.tsx`:
    * Xem danh sách Hạm đội quốc gia, lọc theo phân loại và căn cứ thường trú.
    * Xem chi tiết từng chiến hạm (Inspection Sheet, Slot Layout, Pilot, Crew, Condition).
    * Biểu đồ 3 số dư FRAME, lịch sử bút toán và cửa hàng đổi thưởng FRAME Store.
    * Lộ trình hành quân trên bản đồ thiên hà 30 Sector.
  - Tích hợp Tab "Hạm Đội Đồn Trú & Cập Cảng" vào `SectorIntelModal`.
  - Mở rộng Admin CP: Xem thống kê toàn bộ hạm đội, kiểm tra tính toàn vẹn sổ cái, và công cụ gỡ lỗi (Debug Inspector).
- **Sản phẩm bàn giao (Deliverables)**:
  - React UI components với animation mượt mà (Motion), chuẩn responsive mobile/desktop.
  - Kiểm thử giao diện và độ khả dụng.
- **Bất biến cần bảo vệ (Invariants)**:
  - Zero-micromanagement: UI tập trung vào chỉ đạo chiến lược vĩ mô, không làm rối loạn luồng tự động của AI Hạm đội.
  - Đồng bộ typography và design system STARFRONT chuẩn tối giản công nghệ cao.
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - Giao diện hiển thị sắc nét, phản hồi tức thời dưới 16ms, không giật lag.
  - Tích hợp hoàn hảo với toàn bộ hệ sinh thái STARFRONT WORLD.

---
*(Hết tài liệu Kế Hoạch Triển Khai Phân Kỳ FND-7 Roadmap)*
