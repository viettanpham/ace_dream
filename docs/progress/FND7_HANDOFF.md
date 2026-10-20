# STARFRONT WORLD — FND-7 HANDOFF DOCUMENTATION
## TÀI LIỆU BÀN GIAO TIẾN ĐỘ & CHECKPOINT FND-7 (SHIP / FLEET FOUNDATION)

> **Mã bàn giao:** FND7-HANDOFF-PHASE-7.3  
> **Thời điểm lập:** 20/10/2026  
> **Chế độ thực thi:** IMPLEMENT ONE PHASE ONLY  
> **Trạng thái:** PHASE 7.3 HOÀN TẤT XÁC MINH (VERIFIED & TESTED)  
> **Độ sẵn sàng:** 100% Sẵn sàng để triển khai Phase 7.4  

---

### 1. CHECKPOINT HIỆN TẠI

- **Phase cuối đã hoàn thành:** **Phase 7.3: Hybrid Workforce, Academy & Crew Pool** (15/15 Unit tests PASS, Regression tests Phase 7.1 & 7.2 PASS, Build thành công).
- **Phase đang chờ triển khai tiếp:** **Phase 7.4: Fleet Entity, Treasury & Logistics Supply**.
- **Công việc đã code & verify trong Phase 7.3:**
  * Module nhân sự hạm đội `lib/game/world/fleet/fleet-personnel.ts`: Phân định rõ ràng giữa cá thể Named Pilot và quỹ nhân lực tập thể `FleetCrewPool`.
  * Quản lý chức danh lãnh đạo: Thuyền trưởng Hạm đội (`appointFleetCaptain`, `relieveFleetCaptain`), Sĩ quan Thuyền phó (`appointFleetExecutiveOfficer`, `relieveFleetExecutiveOfficer`), và Thuyền trưởng từng tàu (`appointShipCaptain`, `relieveShipCaptain`).
  * Cơ chế Biệt phái Tạm thời (`assignPilotDetachedDuty`, `processDetachedDutyReturns`) có kỳ hạn và tự động hồi hương khi hết hạn ngày game.
  * Thuật toán phân bổ nhân lực 3 vòng (`allocateFleetCrewToShips`):
    - Pass 1 (Minimum Staffing): Cấp đủ `minimumCrew` cho mọi tàu hoạt động (`canOperate = true`), ưu tiên Soái hạm.
    - Pass 2 (Target Staffing): Cấp tiếp lên `targetCrew` (100% operational efficiency = 1.0).
    - Pass 3 (Maximum Buff Staffing): Cấp tiếp lên `maximumCrew` cho tàu ưu tiên (125% buff efficiency).
  * Đào tạo thủy thủ tại Học viện Hải quân Căn cứ (`startNavalAcademyTraining`, `processNavalAcademyGraduation`), bảo toàn tuyệt đối số lượng dân số Base (`populationAvailable` giảm đúng bằng số lượng học viên).
  * Catalog chuẩn `system_fleet_academy_training_profile_data.json` và đăng ký trong Registry.
  * Điều chuyển nhân sự không dịch chuyển tức thời (`dispatchPersonnelTransfer`, `processPersonnelArrival`) với thời gian hành trình thực tế theo tuyến Hyperlane.
  * Khấu trừ thương vong chiến trận (`applyFleetBattleCasualties`) và thủ tục giải ngũ về Base (`dischargeCrewToBase`).
  * Bộ kiểm thử độc lập 15 mục tại `tests/world/phase-7-3-fleet-workforce.test.ts`.
- **Lỗi mở (Open Issues / Bugs):** `0` (Không có lỗi).
- **Trạng thái Typecheck & Build:**
  * `tsc --noEmit`: 0 lỗi.
  * Production Next.js build: Succeeded.

---

### 2. DANH SÁCH FILE ĐÃ THAY ĐỔI TRONG CHECKPOINT NÀY

| Đường Dẫn Tệp | Loại Thao Tác | Nội Dung & Mục Đích Nghiệp Vụ |
| :--- | :---: | :--- |
| `lib/game/world/fleet/fleet-personnel.ts` | **Tạo mới** | Module cốt lõi Hybrid Workforce, 3-Pass Allocator, Naval Academy, In-Transit Transfers, Casualties và Discharge. |
| `lib/game/world/fleet/index.ts` | **Tạo mới** | Re-export các thành phần của domain fleet (`catalog-types`, `registry-integration`, `fleet-personnel`). |
| `lib/game/world/index.ts` | **Cập nhật** | Re-export domain `fleet` và `ship` tại điểm xuất khẩu tập trung của `lib/game/world`. |
| `lib/game/world/fleet/catalog-types.ts` | **Cập nhật** | Thêm interface `AcademyTrainingProfile` định nghĩa các khóa đào tạo học viện. |
| `data/catalogs/system_fleet_academy_training_profile_data.json` | **Tạo mới** | Catalog 4 khóa đào tạo chính quy của Học viện Hải quân. |
| `lib/game/world/fleet/registry-integration.ts` | **Cập nhật** | Đăng ký catalog `academy_training_profile`, seed data và query helper `getAcademyTrainingProfile`. |
| `lib/game/world/bootstrap.ts` | **Cập nhật** | Bổ sung `academy_training_profile` vào danh sách `fleetCatalogList` khi bootstrap thế giới. |
| `tests/world/phase-7-3-fleet-workforce.test.ts` | **Tạo mới** | Bộ kiểm thử 15/15 mục toàn diện cho Phase 7.3. |
| `tests/world/phase-7-1-fleet-catalogs.test.ts` | **Cập nhật** | Cập nhật điều kiện kiểm thử tương thích khi số lượng danh mục fleet mở rộng. |
| `docs/progress/FND7_PROGRESS.md` | **Cập nhật** | Bảng theo dõi tiến độ chi tiết của Phase 7.3 (DONE) và Phase 7.4 (READY). |
| `docs/progress/FND7_HANDOFF.md` | **Cập nhật** | Tài liệu bàn giao checkpoint Phase 7.3 này. |

---

### 3. CÁC FILE CẦN THỰC HIỆN Ở PHASE TIẾP THEO (PHASE 7.4)

Khi bắt đầu lượt tiếp theo, kỹ sư / AI Studio sẽ triển khai **Phase 7.4: Fleet Entity, Treasury & Logistics Supply**:

1. **`lib/game/world/fleet/fleet-entity.ts`**:
   - Quản lý thực thể Hạm đội (`FleetEntityState`), danh sách biên chế tàu (`ships`), neo đậu cảng (`currentLocation`, `status`).
   - Liên kết với `FleetPersonnelState` từ Phase 7.3 và `ShipInstance` từ Phase 7.2.
2. **`lib/game/world/fleet/fleet-treasury.ts`**:
   - Ngân khố độc lập (`credits`, `supplyCredits`, `ledgerHistory`), thu chi lương bổng thủy thủ đoàn (`Crew Payroll`), xử lý thâm hụt tài chính (chế độ `AUSTERE_MODE`).
3. **`lib/game/world/fleet/fleet-logistics.ts`**:
   - Khoang tiếp tế thực thể chứa 5 nhóm tài nguyên (`food`, `energy`, `logisticsSupplies`, `industrialMaterials`, `tacticalData`).
   - Tiêu hao hàng ngày theo tick game: Lương thực theo số quân, Năng lượng theo động cơ và di chuyển.
4. **`lib/game/world/fleet/fleet-ai-command.ts`**:
   - Trí tuệ chỉ huy Hạm đội (`FleetAIPersona`), tự động tuần tra/rút lui chiến thuật, cơ chế tiếp nhận Lệnh Khẩn Cấp Quốc Gia (National Emergency Command).
5. **`tests/world/phase-7-4-fleet-entity-treasury.test.ts`**:
   - Kiểm thử độc lập thực thể hạm đội, chuỗi tiêu hao tiếp tế, độc lập tài chính và AI chỉ huy.

---

### 4. NGUYÊN TẮC BẢO VỆ TOÀN VẸN HỆ THỐNG
- **Không Reset WORLD**: Giữ nguyên toàn bộ save game và tiến trình đang chơi.
- **Không tạo Engine song song**: Tái sử dụng triệt để `FleetCrewPool` của FND-4, `ProgressionEntity` của FND-2 và `CatalogRegistry` của FND-1.
- **Tiếp tục theo đúng hợp đồng**: Mọi logic đã được đặc tả trong `docs/foundations/FND7_SHIP_FLEET_FEATURE.md`.
