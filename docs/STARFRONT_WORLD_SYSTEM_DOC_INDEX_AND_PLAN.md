# STARFRONT WORLD — TỔNG MỤC LỤC TÀI LIỆU HỆ THỐNG & KẾ HOẠCH NỀN TẢNG
## MASTER SYSTEM DOCUMENTATION INDEX & FOUNDATION ROADMAP

> **Trạng thái:** ACTIVE & UP-TO-DATE  
> **Phiên bản:** v1.0 (Cập nhật sau đợt kiểm toán SYSTEM DEFAULT / WORLD INIT AUDIT FND-1 → FND-4)  
> **Mục tiêu:** Tập trung hóa toàn bộ các tài liệu kiến trúc, khế ước thiết kế, báo cáo kiểm toán và kế hoạch triển khai của phân hệ STARFRONT WORLD.

---

## 1. CÁC TÀI LIỆU NỀN TẢNG ĐÃ HOÀN THÀNH (FOUNDATIONS FND-1 → FND-4)

| Mã Phase | Tên Nền Tảng | Tài Liệu Thiết Kế & Handoff | Trạng Thái | Test Suite |
| :--- | :--- | :--- | :---: | :--- |
| **6.34A-FND-1** | Shared Catalog / Master Data Foundation | [`docs/PHASE_6_34A_FND_1_SHARED_CATALOG_DATA_FOUNDATION.md`](./PHASE_6_34A_FND_1_SHARED_CATALOG_DATA_FOUNDATION.md) | **DONE** | 23/23 PASS |
| **6.34A-FND-2** | Shared Progression + Tier Boundary Foundation | [`docs/PHASE_6_34A_FND_2_SHARED_PROGRESSION_TIER_FOUNDATION.md`](./PHASE_6_34A_FND_2_SHARED_PROGRESSION_TIER_FOUNDATION.md) | **DONE** | 28/28 PASS |
| **6.34A-FND-3** | Shared Decision / Event Interaction Foundation | [`docs/PHASE_6_34A_FND_3_SHARED_DECISION_EVENT_FOUNDATION.md`](./PHASE_6_34A_FND_3_SHARED_DECISION_EVENT_FOUNDATION.md) | **DONE** | 32/32 PASS |
| **6.34A-FND-4** | Population / Workforce Shared Foundation | [`docs/PHASE_6_34A_FND_4_POPULATION_WORKFORCE_FOUNDATION.md`](./PHASE_6_34A_FND_4_POPULATION_WORKFORCE_FOUNDATION.md) | **DONE** | 23/23 PASS |
| **6.34A-FND-5** | Foundation Audit Repair + Building / Production Foundation | [`docs/PHASE_6_34A_FND_5_BUILDING_PRODUCTION_FOUNDATION.md`](./PHASE_6_34A_FND_5_BUILDING_PRODUCTION_FOUNDATION.md) | **DONE** | 7/7 World Init PASS + 12/12 Building PASS |
| **6.34A-FND-6** | Base / Hub / Capital / Orbital Sub-Base Foundation | [`docs/PHASE_6_34A_FND_6_BASE_FOUNDATION_ACCEPTANCE.md`](./PHASE_6_34A_FND_6_BASE_FOUNDATION_ACCEPTANCE.md) | **DONE** | 19/19 FND-6 PASS (142/142 All FNDs PASS) |

---

## 2. TÀI LIỆU KIỂM TOÁN HỆ THỐNG MỚI NHẤT (SYSTEM AUDIT)

- **Tài liệu kiểm toán toàn diện FND-1 đến FND-4**:  
  [`docs/STARFRONT_FOUNDATION_DEFAULT_INIT_AUDIT_FND1_FND4.md`](./STARFRONT_FOUNDATION_DEFAULT_INIT_AUDIT_FND1_FND4.md)  
  *Nội dung:* Kiểm tra chi tiết 13 canonical catalogs `system_*_data.json`, 50 items dữ liệu chuẩn tắc, độ đồng bộ giữa đĩa và in-memory seed, phân tích GAP về tích hợp runtime vào `createInitialWorldState()`, phân loại các việc cần làm cho Phase FND-5 và các Domain Phase sau.

---

## 3. TÀI LIỆU KIẾN TRÚC & HỆ THỐNG CỐT LÕI (CORE ARCHITECTURE & SYSTEMS)

- **Hạ tầng Căn cứ & Quy hoạch Đô thị**:
  - [`docs/WORLD_BASE_INFRASTRUCTURE_ARCHITECTURE_AUDIT.md`](./WORLD_BASE_INFRASTRUCTURE_ARCHITECTURE_AUDIT.md): Kiểm toán 13 Core Buildings hiện có.
  - [`docs/WORLD_BASE_BUILDING_CATALOG.md`](./WORLD_BASE_BUILDING_CATALOG.md): Danh mục công trình căn cứ phân tách rõ Existing Core vs Planned World.
  - [`docs/WORLD_BASE_SECTOR_UX.md`](./WORLD_BASE_SECTOR_UX.md): Trải nghiệm người dùng và điều phối căn cứ khu vực.
- **Sinh tồn Phi công & Tác chiến V2**:
  - [`docs/WORLD_PILOT_SURVIVAL_RESCUE.md`](./WORLD_PILOT_SURVIVAL_RESCUE.md) & [`docs/PHASE_6_34A_RESCUE_ARCHITECTURE_PLAN.md`](./PHASE_6_34A_RESCUE_ARCHITECTURE_PLAN.md): Thiết kế cứu hộ phi công, POW registry và SAR operations.
  - [`docs/WORLD_COMBAT_V2_DESIGN.md`](./WORLD_COMBAT_V2_DESIGN.md): Thiết kế tác chiến thế hệ mới nhiều làn, hạm đội hỗ trợ.
  - [`docs/roadmap/COMBAT_V2_REVIEW.md`](./roadmap/COMBAT_V2_REVIEW.md): Báo cáo đánh giá kiến trúc Combat V2.
- **Kinh tế, Hậu cần & Quản trị**:
  - [`docs/WORLD_NATIONAL_ECONOMY.md`](./WORLD_NATIONAL_ECONOMY.md): Chu trình tài nguyên và kinh tế vĩ mô.
  - [`docs/WORLD_GEAR_LOGISTICS_REPAIR.md`](./WORLD_GEAR_LOGISTICS_REPAIR.md): Hậu cần, sửa chữa cỗ máy GEAR và quy tắc Asset Condition.
  - [`docs/WORLD_ADMINCP_CONFIG_REFERENCE.md`](./WORLD_ADMINCP_CONFIG_REFERENCE.md): Tham chiếu cấu hình quản trị hệ thống.
  - [`docs/WORLD_SYSTEM_INVARIANTS.md`](./WORLD_SYSTEM_INVARIANTS.md): Các bất biến hệ thống bảo đảm tính toàn vẹn.

---

## 4. KẾ HOẠCH TRIỂN KHAI TIẾP THEO (NEXT PHASES)

1. **Phase 6.34A-FND-5: Foundation Audit Repair + Building / Production Foundation (HOÀN TẤT)**:
   - Sửa dứt điểm 6 GAP kiến trúc trong tài liệu audit FND-1 → FND-4.
   - Đồng bộ JSON `system_progression_progression_profile_data.json` có đủ 3 items.
   - Mở rộng `WorldState` lưu trữ `decisions`, `inTransitTransfers`, `basePopulationStates`, `bases`, `worldResetConfig`.
   - Cung cấp hàm tập trung `bootstrapWorldCatalogs()` idempotent nạp 20 canonical catalogs.
   - Khởi tạo đầy đủ `BasePopulationState` và `BaseEntityState` cho tất cả các sector trong `createInitialWorldState()`.
   - Triển khai toàn bộ nền tảng Building / Production: 19 Building Types, Slot Profiles, 3-Pass Workforce, Building OFF, Condition Overflow, Production Cycles, Construction Queue, History Retention.
   - Kiểm thử 7/7 World Init Integration + 12/12 Building & Production Unit tests đạt 100% PASS.
2. **Domain Phases tiếp theo**:
   - Base Management & Building Staffing (FND-4 + FND-5 + Catalog).
   - Fleet Management & Crew Recruitment (FND-4).
   - Gear Progression & Breakthrough Tech Tree (FND-2 + FND-3).
   - Operations Hub & Event Overhaul (FND-3).
