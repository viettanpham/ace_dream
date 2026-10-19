# STARFRONT WORLD — PHASE 6.34A-FND-4
# POPULATION / WORKFORCE SHARED FOUNDATION

> **TÀI LIỆU BÀN GIAO KIẾN TRÚC & TRIỂN KHAI NỀN TẢNG (HANDOFF ARCHITECTURE)**  
> **Trạng thái:** HOÀN TẤT (DONE)  
> **Phạm vi:** Nền tảng Dân số & Nhân lực (Population / Workforce Shared Foundation) dùng chung cho toàn bộ STARFRONT WORLD. Tích hợp trực tiếp trên FND-1 (Catalog), FND-2 (Progression), FND-3 (Decision) và tuân thủ tuyệt đối các Invariant kiến trúc đã được phê duyệt.

---

## 1. CÁC TẬP TIN ĐÃ TRIỂN KHAI (FILES CREATED / UPDATED)

### Thư mục triển khai lõi: `lib/game/world/population/`
1. `lib/game/world/population/types.ts`:
   - Định nghĩa toàn bộ kiểu dữ liệu cốt lõi:
     - `PopulationBucketKey` (`RESIDENT`, `VISITOR_TOURIST`, `EXTERNAL_WORKER`, `IN_TRANSIT`)
     - `WorkforceCategory` (`BUILDING_WORKFORCE`, `FLEET_CREW`, `LOGISTICS`, `TRAINING`, `RECOVERY`, `OTHER_ASSIGNMENTS`)
     - `StaffingTier` (`NONE`, `UNDER_MINIMUM`, `MINIMUM`, `TARGET`, `MAXIMUM`)
     - `BaseType` (13 phân loại căn cứ bao gồm `CAPITAL`, `HABITAT`, `GENERAL`, `MILITARY`, v.v.)
     - `CapacityType` (`residential`, `visitor`, `temporaryWorker`, `emergency`)
     - `BasePopulationState` (Định mức Modular Aggregate Population cho Căn cứ / Trạm)
     - `FleetCrewPool` (Biên chế Thủy thủ đoàn Hạm đội / Bang hội độc lập)
     - `WorkforceDemand` & `WorkforceAllocationResult` (Nhu cầu và kết quả phân bổ nhân lực)
     - `BaseWorkforceAllocationReport` (Báo cáo điều phối nhân lực 3 vòng)
     - `PopulationTransferRecord` & `TransferStatus` (Bản ghi điều chuyển dân số quốc gia)
     - `HubSlotPolicy` & `BaseHubStatus` (Chính sách mở khóa slot Multi-Hub theo Tier)
     - `BasePopulationSummaryVM`, `CapacityCardVM`, `WorkforceTreeNodeVM` (UI ViewModels).

2. `lib/game/world/population/capacity.ts`:
   - Đánh giá 4 hạn mức sức chứa độc lập (`residential`, `visitor`, `temporaryWorker`, `emergency`).
   - Tính toán tỷ lệ lấp đầy, số lượng vượt ngưỡng (`overflowCount`), và cảnh báo vận hành (`warnings`).
   - Invariant: Tăng sức chứa KHÔNG tự sinh ra dân số.

3. `lib/game/world/population/allocator.ts`:
   - Bộ điều phối nhân lực 3 vòng (**3-Pass Workforce Allocator**):
     - **Pass 1 (MINIMUM)**: Phân bổ nhân lực tối thiểu theo thứ tự ưu tiên chiến lược. Nếu thiếu hụt, đơn vị bị đánh dấu dưới tối thiểu (`UNDER_MINIMUM`) và không đủ điều kiện vận hành (`operationalEligibility = false`).
     - **Pass 2 (TARGET)**: Chỉ chạy khi Vòng 1 hoàn tất 100% và còn dư nhân lực khả dụng. Cấp phần chênh lệch (delta) lên mức tiêu chuẩn (`TARGET`).
     - **Pass 3 (MAXIMUM)**: Chỉ chạy khi Vòng 2 hoàn tất 100% và còn dư nhân lực khả dụng. Cấp phần chênh lệch (delta) lên mức tối đa (`MAXIMUM`).
   - Quy luật bảo toàn: `populationCurrent = populationAvailable + populationOccupied`.
   - Cơ chế giải phóng và điều phối lại chiến lược (`releaseWorkforce`, `resetReallocatableWorkforce`): Đảm bảo tính toán hoàn toàn **idempotent**, bảo vệ các phân công bị khóa (`isLocked`), và ngăn chặn Base AI tự ý thu hồi thủy thủ đoàn Hạm đội/Bang hội.

4. `lib/game/world/population/crew-pool.ts`:
   - Ranh giới quyền sở hữu thủy thủ đoàn Hạm đội/Bang hội:
     - Tuyển quân (`recruitFleetCrew`): Rút từ nhân lực khả dụng của căn cứ sang `FleetCrewPool.crewIdle`.
     - Vòng đời thủy thủ đoàn: `crewIdle` $\rightarrow$ `crewAssigned` $\rightarrow$ `crewReserve` $\rightarrow$ `crewIdle`.
     - Quy luật bảo toàn: `totalCrew = crewIdle + crewAssigned + crewReserve`.
     - Trả quân (`returnFleetCrewToBase`): Chỉ thực hiện khi có ủy quyền từ phía Hạm đội/Bang hội. Base AI không có quyền đơn phương thu hồi.

5. `lib/game/world/population/intransit-ledger.ts`:
   - Sổ cái Quốc gia Dân số Đang Di Chuyển (`NationalInTransitLedger`):
     - Khấu trừ ngay lập tức tại Căn cứ khởi hành (tránh tính trùng số liệu).
     - Lưu trữ trạng thái trên đường vận chuyển (`IN_TRANSIT`).
     - Ghi nhận nhập tịch tại Căn cứ đích chỉ khi đến nơi và được tiếp nhận.
     - Hỗ trợ lưu trú quỹ đạo tạm thời (`ORBITAL_STAY`) và hủy chuyển quân hoàn trả về căn cứ gốc (`cancelTransfer`).
     - Bảo đảm tuyệt đối người đang di chuyển không thể bị đem đi phân bổ hoặc tuyển mộ.

6. `lib/game/world/population/hub-policy.ts`:
   - Quy tắc mở slot Hub theo cấp bậc FND-2 Progression Tiers:
     - Căn cứ tiêu chuẩn (`STANDARD_BASE_HUB_POLICY`): Mở 1 slot mỗi 2 Tier, tối đa 3 loại Hub.
     - Thủ phủ quốc gia (`CAPITAL_BASE_HUB_POLICY`): Mở 1 slot mỗi 1 Tier, không giới hạn loại Hub (`unlimited`).
     - Kiểm soát ngăn trùng lặp Hub và chặn mở Hub khi chưa đủ Tier.

7. `lib/game/world/population/seed-data.ts`:
   - Dữ liệu gốc chuẩn tắc SYSTEM cho 5 danh mục:
     - `system_population_population_bucket_data.json`
     - `system_population_workforce_category_data.json`
     - `system_population_workforce_allocation_policy_data.json`
     - `system_population_capacity_policy_data.json`
     - `system_population_movement_reason_data.json`

8. `lib/game/world/population/registry-integration.ts`:
   - Đăng ký và nạp sẵn 5 danh mục vào `CatalogRegistry` (FND-1).
   - Cung cấp các hàm getter chuẩn: `getPopulationBucket`, `getWorkforceCategory`, `getAllocationPolicy`, `getCapacityPolicy`, `getMovementReason`.

9. `lib/game/world/population/view-models.ts`:
   - Xây dựng ViewModels cho giao diện:
     - `buildBasePopulationSummaryVM`
     - `buildCapacityCardVMs`
     - `buildWorkforceTreeVMs`

10. `lib/game/world/population/index.ts`:
    - Barrel export toàn bộ API công khai của module Population & Workforce.

### Tích hợp và Kiểm thử:
- `lib/game/world/index.ts`: Re-export `population` sang WORLD API chung.
- `tests/world/phase-6-34a-fnd-4-population.test.ts`: Bộ kiểm thử 23 subtests toàn diện, **PASS 100% (23/23)**.

---

## 2. NGUYÊN TẮC THIẾT KẾ & BẢO TOÀN KIẾN TRÚC (ARCHITECTURAL INVARIANTS)

1. **Bảo toàn dân số thường trú (Permanent Population Conservation):**
   $$\text{populationCurrent} = \text{populationAvailable} + \text{populationOccupied}$$
   Bất kỳ hành vi điều phối, giải phóng, hay tuyển dụng nào cũng phải duy trì đẳng thức này.

2. **Tách biệt nhóm dân sự phi thường trú (Non-Permanent Isolation):**
   Khách du lịch (`visitorPopulation`) và lao động ngoại tỉnh (`externalWorkerPopulation`) được theo dõi riêng biệt, tuyệt đối **không cộng gộp** vào `populationCurrent`.

3. **Nguyên tắc Sức chứa 4 Nhóm Độc Lập:**
   Sức chứa căn cứ chia thành 4 nhóm độc lập: Nhà ở, Du khách, Lao động tạm thời, Tiếp nhận khẩn cấp. Mở rộng công trình sức chứa chỉ tăng giới hạn trần (`maxCapacity`), **không tự sinh thêm dân số**.

4. **Thuật toán Phân bổ 3 Vòng (3-Pass Allocation):**
   - Vòng 1 ưu tiên chỉ tiêu sống còn (`minimumPersonnel`). Đơn vị không đạt mức tối thiểu không được phép vận hành.
   - Vòng 2 và 3 chỉ cấp phần chênh lệch (`delta`) khi vòng trước đó đã thỏa mãn hoàn toàn.

5. **Ranh giới sở hữu Thủy thủ đoàn (Fleet/Guild Crew Boundary):**
   Dân cư sau khi được tuyển mộ vào Hạm đội/Bang hội thuộc quyền sở hữu của Hạm đội đó. Base AI không có thẩm quyền đơn phương thu hồi hoặc phân bổ lại.

6. **Bảo toàn Số dư Di chuyển Quốc gia (National InTransit Zero-Sum):**
   Người rời Căn cứ A sẽ bị trừ ngay tại A, đưa vào Sổ cái Quốc gia, và chỉ được cộng vào Căn cứ B khi hoàn tất thủ tục nhập cảnh. Tuyệt đối không xảy ra hiện tượng đếm trùng số liệu.

---

## 3. KẾT QUẢ KIỂM THỬ & BUILD (TEST & COMPILE VERIFICATION)

### Test suite FND-4:
- `tests/world/phase-6-34a-fnd-4-population.test.ts`: **PASS 23/23 subtests**
  1. `Base Modular Aggregate Population conservation` — PASS
  2. `Non-permanent groups isolation` — PASS
  3. `4 Independent Capacities evaluation & overflow warnings` — PASS
  4. `3-Pass Workforce Allocator (Pass 1 Min, Pass 2 Target, Pass 3 Max)` — PASS
  5. `Under-minimum operational ineligibility on scarce population` — PASS
  6. `Excluded demand is skipped and marked non-operational` — PASS
  7. `Locked assignments immunity from release` — PASS
  8. `Base strategy reallocation & idempotent recomputation` — PASS
  9. `Fleet/Guild Crew Pool ownership boundary` — PASS
  10. `Fleet crew lifecycle (Idle -> Assigned -> Reserve -> Idle)` — PASS
  11. `Authorized return of Fleet crew to Base Available` — PASS
  12. `National InTransit Ledger zero-sum conservation` — PASS
  13. `Source base immediate deduction & destination admission` — PASS
  14. `In-transit population non-allocatable guarantee` — PASS
  15. `Orbital stay transfer lifecycle` — PASS
  16. `Transfer cancellation & return to source base` — PASS
  17. `Standard Base Multi-Hub slot policy (every 2 tiers, max 3)` — PASS
  18. `Capital Base Multi-Hub slot policy (every 1 tier, unlimited)` — PASS
  19. `Hub slot availability and duplicate prevention` — PASS
  20. `Pre-seeded SYSTEM default catalogs registration` — PASS
  21. `Catalog Registry resolution` — PASS
  22. `User override & custom item in population catalog` — PASS
  23. `UI ViewModels generation (Summary, Capacity Cards, Workforce Tree)` — PASS

### Hồi quy các Foundation trước (Regression Suites):
- `tests/world/phase-6-34a-fnd-1-shared-catalog.test.ts`: **PASS (23/23 subtests)**
- `tests/world/phase-6-34a-fnd-2-progression.test.ts`: **PASS (28/28 subtests)**
- `tests/world/phase-6-34a-fnd-3-decision.test.ts`: **PASS (32/32 subtests)**
- `tests/world/phase-6-34-pilot-survival.test.ts`: **PASS (10/10 subtests)**

### Biên dịch & Kiểu dữ liệu (Compilation & Typecheck):
- `tsc --noEmit` (Linter): **0 errors (CLEAN)**
- `compile_applet`: **Build succeeded**
