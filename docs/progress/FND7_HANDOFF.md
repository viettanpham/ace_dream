# STARFRONT WORLD — FND-7 HANDOFF DOCUMENTATION
## TÀI LIỆU BÀN GIAO TIẾN ĐỘ & CHECKPOINT FND-7 (SHIP / FLEET FOUNDATION)

> **Mã bàn giao:** FND7-HANDOFF-PHASE-7.2  
> **Thời điểm lập:** 20/10/2026  
> **Chế độ thực thi:** IMPLEMENT ONE PHASE ONLY  
> **Trạng thái:** PHASE 7.2 HOÀN TẤT XÁC MINH (VERIFIED & TESTED)  
> **Độ sẵn sàng:** 100% Sẵn sàng để triển khai Phase 7.3  

---

### 1. CHECKPOINT HIỆN TẠI

- **Phase cuối đã hoàn thành:** **Phase 7.2: Ship Entity & Progression MK I–X Engine** (15/15 Unit tests PASS, 12/12 Phase 7.1 PASS, 163/163 Regression FND-1..6 PASS, Build thành công).
- **Phase đang chờ triển khai tiếp:** **Phase 7.3: Hybrid Workforce, Academy & Crew Pool**.
- **Công việc đã code & verify trong Phase 7.2:**
  * Mô đun thực thể tàu chiến `lib/game/world/ship/ship-entity.ts`: Khởi tạo tàu chiến độc lập theo 4 tầng Type → Class → Definition → Instance, Decoupling khỏi Fleet/Base/Dock, tính toán crew ratios (`minimumCrewRatio`, `maximumCrewRatio`) và hiệu suất vận hành `efficiency`, quản lý slot typed/generic.
  * Mô đun tiến trình FND-2 `lib/game/world/ship/ship-progression.ts`: Tích hợp `ProgressionEntity`, hàm dặm bay `grantShipMileageExp`, chiến đấu `grantShipCombatExp`, ranh giới khóa cứng `AWAITING_UPGRADE` không tràn ẩn (Zero Hidden Overflow), thẩm định Dockyard `validateShipTierUpgradeEligibility`, nhiệm vụ thăng cấp `ShipUpgradeTask` qua Game Days, và Capstone 1-lần vĩnh viễn `MAX TIER BONUS` khi đạt MK X (Tier 10).
  * Mô đun hao mòn & bảo trì `lib/game/world/ship/ship-maintenance.ts`: Tách biệt sinh mệnh Hull HP vs độ hao mòn `condition` [0..100%], xếp hạng tình trạng (`PRISTINE`, `SERVICEABLE`, `WORN`, `DEGRADED`, `CRITICAL`), dự toán chi phí `estimateShipRepairCost`, đại tu xưởng cạn `repairShipAtBase`, và giải quyết chính sách bảo dưỡng tự động `settleShipMaintenancePolicy` ("AUTO", "MANUAL", "EMERGENCY_ONLY").
  * Mở rộng danh mục chuẩn `system_fleet_ship_class_data.json` và `lib/game/world/fleet/registry-integration.ts` lên đầy đủ 10 bậc công nghệ đóng tàu MK I đến MK X.
  * Tích hợp WorldState & Soft Migration: `WorldState.ships` được khởi tạo với 2 chiến hạm mẫu của VSS, hàm `migrateFoundationState` trong `lib/game/world/storage.ts` tự động bổ sung cho các save game cũ.
  * Bộ kiểm thử độc lập 15 mục tại `tests/world/phase-7-2-ship-progression.test.ts`.
- **Lỗi mở (Open Issues / Bugs):** `0` (Không có lỗi).
- **Trạng thái Typecheck & Build:**
  * `tsc --noEmit`: 0 lỗi.
  * Production Next.js build: Succeeded.

---

### 2. DANH SÁCH FILE ĐÃ THAY ĐỔI TRONG CHECKPOINT NÀY

| Đường Dẫn Tệp | Loại Thao Tác | Nội Dung & Mục Đích Nghiệp Vụ |
| :--- | :---: | :--- |
| `lib/game/world/ship/types.ts` | **Cập nhật** | Bổ sung `maintenancePolicy`, `unlockedGenericSlotsCount`, `unlockedTypedSlots` vào `ShipInstance` & `CreateShipParams`. |
| `lib/game/world/ship/ship-entity.ts` | **Cập nhật** | Khởi tạo typed/generic slots, lưu `maintenancePolicy`, hỗ trợ dynamic ratios `minimumCrewRatio` / `maximumCrewRatio`. |
| `lib/game/world/ship/ship-progression.ts` | **Cập nhật** | Bổ sung `grantShipMileageExp`, `grantShipCombatExp` và hoàn thiện hook nâng cấp dockyard. |
| `lib/game/world/ship/ship-maintenance.ts` | **Cập nhật** | Bổ sung `estimateShipRepairCost` và `settleShipMaintenancePolicy` phục vụ bảo trì tự động / khẩn cấp tại cảng. |
| `data/catalogs/system_fleet_ship_class_data.json` | **Cập nhật** | Mở rộng danh mục phẩm cấp tàu lên đủ 10 bậc MK I đến MK X chuẩn tắc. |
| `lib/game/world/fleet/registry-integration.ts` | **Cập nhật** | Đồng bộ mảng `SYSTEM_DEFAULT_SHIP_CLASSES` 10 bậc MK I..X với `hasCapstoneBonus: true` tại MK X. |
| `lib/game/world/storage.ts` | **Cập nhật** | Soft migration trong `migrateFoundationState` tự động nạp `state.ships` cho save game cũ. |
| `tests/world/phase-7-2-ship-progression.test.ts` | **Cập nhật** | Bộ kiểm thử mở rộng 15 mục toàn diện cho Phase 7.2 (15/15 PASS). |
| `tests/world/phase-7-1-fleet-catalogs.test.ts` | **Cập nhật** | Tương thích linh hoạt khi mở rộng số lớp tàu MK I..X (12/12 PASS). |
| `docs/progress/FND7_PROGRESS.md` | **Cập nhật** | Bảng theo dõi tiến độ chi tiết của Phase 7.2. |
| `docs/progress/FND7_HANDOFF.md` | **Cập nhật** | Tài liệu bàn giao checkpoint Phase 7.2 này. |

---

### 3. CÁC FILE CẦN THỰC HIỆN Ở PHASE TIẾP THEO (PHASE 7.3)

Khi bắt đầu lượt tiếp theo, kỹ sư / AI Studio sẽ triển khai **Phase 7.3: Hybrid Workforce, Academy & Crew Pool**:

1. **`lib/game/world/fleet/fleet-personnel.ts`**:
   - Quản lý `FleetCrewPool` (Idle, Assigned, Reserve, Deficit) gắn với từng Hạm đội / Bang hội.
   - Bổ nhiệm / Miễn nhiệm Thuyền trưởng (Captain) và Sĩ quan Thuyền phó (XO) từ danh bạ Pilot chuẩn.
   - Đào tạo thủy thủ tại công trình `NAVAL_ACADEMY` từ quỹ dân số `RESIDENT` của Căn cứ.
   - Tích hợp điều chuyển nhân sự thực thể qua `inTransitTransfers` (Không teleport).
   - Bộ phân bổ nhân lực 3 vòng (3-Pass Workforce Allocator):
     * Pass 1: Phân bổ Minimum Crew cho mọi tàu hoạt động.
     * Pass 2: Phân bổ Target Crew cho các tàu ưu tiên tác chiến.
     * Pass 3: Phân bổ Maximum Crew cho soái hạm hoặc tàu sửa chữa.
2. **`tests/world/phase-7-3-fleet-workforce.test.ts`**:
   - Kiểm thử bảo toàn quân số: Dân số Base giảm đúng bằng số lượng tuyển vào Fleet + số lượng đang In-Transit.
   - Kiểm thử quyền sở hữu thuyền viên: Thủy thủ đã vào Fleet thuộc quyền của Fleet, Base không tự ý rút lại.
   - Kiểm thử thuật toán phân bổ 3-Pass và thời gian di chuyển Hyperlane.

---

### 4. NGUYÊN TẮC BẢO VỆ TOÀN VẸN HỆ THỐNG
- **Không Reset WORLD**: Giữ nguyên toàn bộ save game và tiến trình đang chơi.
- **Không tạo Engine song song**: Tái sử dụng triệt để `ProgressionEntity` của FND-2 và `CatalogRegistry` của FND-1.
- **Tiếp tục theo đúng hợp đồng**: Mọi logic đã được đặc tả trong `docs/foundations/FND7_SHIP_FLEET_FEATURE.md`.
