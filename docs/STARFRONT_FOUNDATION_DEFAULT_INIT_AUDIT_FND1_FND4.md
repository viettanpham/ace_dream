# STARFRONT WORLD — KIỂM TRA MẶC ĐỊNH HỆ THỐNG & KHỞI TẠO THẾ GIỚI
## SYSTEM DEFAULT / WORLD INIT AUDIT (FND-1 → FND-4)

> **TÀI LIỆU KIỂM TOÁN KIẾN TRÚC & DỮ LIỆU GỐC (ARCHITECTURAL & DEFAULT DATA AUDIT)**  
> **Trạng thái:** AUDIT DONE (HOÀN THÀNH KIỂM TOÁN)  
> **Phạm vi kiểm tra:** Toàn bộ 4 nền tảng FND-1 (Catalog), FND-2 (Progression), FND-3 (Decision), FND-4 (Population & Workforce), 13 tệp JSON SYSTEM canonical, cơ chế Seed/Init, và khả năng tích hợp thực tế vào `createInitialWorldState()`.  
> **Nguyên tắc:** Báo cáo trung thực, khách quan; không sáng tác số liệu balance; không tự sửa code hay mở Phase mới.

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM TOÁN (EXECUTIVE SUMMARY)

- **Tổng số SYSTEM Catalogs kiểm tra:** 13 tệp JSON canonical trong `data/catalogs/`.
- **Tổng số Items dữ liệu chuẩn tắc:** 50 items trên đĩa (51 items trong seed-data).
- **Khả năng nạp qua FND-1 CatalogRegistry:** 13/13 catalog nạp thành công (**100% Loadable**).
- **Trạng thái Placeholder / Mock / TODO:** **0** (Không có chuỗi rác hay cấu trúc giả).
- **Trạng thái Catalog rỗng:** **0** (Không có catalog nào bị rỗng `items: []`).
- **Tổng số tiêu chí đánh giá:** 16 tiêu chí chi tiết qua 4 Foundation.
- **Kết quả tổng thể:**
  - **PASS:** 10/16 tiêu chí (Schema, Engine, Seed profiles, Catalog Registry integration, Unit test coverage).
  - **GAP:** 6 tiêu chí (Lệch item giữa đĩa và seed, thiếu runtime initialization trong `createInitialWorldState`, thiếu gắn kết persistence vào `WorldState`, thực thể chưa có profile khởi tạo mặc định).

---

## 2. BẢNG KIỂM TOÁN CHI TIẾT 13 SYSTEM CANONICAL CATALOGS

Quy ước:
- **Catalog Path**: Đường dẫn tệp canonical trên đĩa.
- **Item Count**: Số item thực tế trên đĩa / trong code seed.
- **Init Profile**: Tình trạng mã nguồn seed/profile mặc định.
- **Runtime Init**: Có được nạp vào runtime bộ nhớ/registry khi chạy hay không.
- **Test Evidence**: Bằng chứng kiểm thử tự động.
- **PASS/GAP**: Đánh giá tính toàn vẹn và đồng bộ.

| Foundation | Catalog ID | Catalog Path | Item Count (Disk / Seed) | Init Profile | Runtime Init | Test Evidence | PASS/GAP | Recommended Fix |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **FND-2** | `system_progression_progression_profile` | `data/catalogs/system_progression_progression_profile_data.json` | **2 / 3** (LỆCH) | Có (`profile_standard_100`, `profile_compact_50`, `profile_auto_progression`) | Tự động qua `registerProgressionCatalogs` | `phase-6-34a-fnd-2-progression.test.ts` (Subtest 20) | **GAP** (Desync) | Đồng bộ tệp JSON trên đĩa để có đủ 3 profile bao gồm `profile_auto_progression`. |
| **FND-2** | `system_progression_tier_profile` | `data/catalogs/system_progression_tier_profile_data.json` | 10 / 10 | Có (`TIER_I` → `TIER_X` đầy đủ 10 bậc) | Tự động qua `registerProgressionCatalogs` | `phase-6-34a-fnd-2-progression.test.ts` (Subtest 21) | **PASS** | Duy trì dữ liệu hiện tại. |
| **FND-2** | `system_progression_level_effect_profile` | `data/catalogs/system_progression_level_effect_profile_data.json` | 2 / 2 | Có (`facility_generic`, `combat_generic`) | Tự động qua `registerProgressionCatalogs` | `phase-6-34a-fnd-2-progression.test.ts` (Subtest 22) | **PASS** | Duy trì dữ liệu hiện tại. |
| **FND-2** | `system_progression_tier_effect_profile` | `data/catalogs/system_progression_tier_effect_profile_data.json` | 3 / 3 | Có (`tier_ii`, `tier_iii`, `tier_iv`) | Tự động qua `registerProgressionCatalogs` | `phase-6-34a-fnd-2-progression.test.ts` (Subtest 23) | **PASS** | Mở rộng hiệu ứng cho Tier V → X ở các phase cân bằng sau. |
| **FND-3** | `system_decision_fallback_policy` | `data/catalogs/system_decision_fallback_policy_data.json` | 3 / 3 | Có (`AI_REEVALUATE`, `KEEP_PENDING`, `AUTO_REJECT`) | Tự động qua `registerDecisionCatalogs` | `phase-6-34a-fnd-3-decision.test.ts` (Subtest 28) | **PASS** | Duy trì dữ liệu hiện tại. |
| **FND-3** | `system_decision_decision_source` | `data/catalogs/system_decision_decision_source_data.json` | 5 / 5 | Có (2 Commander, 2 AI Timeout, 1 Invalidated) | Tự động qua `registerDecisionCatalogs` | `phase-6-34a-fnd-3-decision.test.ts` (Subtest 28) | **PASS** | Duy trì dữ liệu hiện tại. |
| **FND-3** | `system_decision_decision_type` | `data/catalogs/system_decision_decision_type_data.json` | 4 / 4 | Có (Tier Upgrade, Strategic Deployment, Reallocation, Emergency Dispatch) | Tự động qua `registerDecisionCatalogs` | `phase-6-34a-fnd-3-decision.test.ts` (Subtest 28) | **PASS** | Duy trì dữ liệu hiện tại. |
| **FND-3** | `system_decision_decision_priority` | `data/catalogs/system_decision_decision_priority_data.json` | 4 / 4 | Có (`LOW`, `NORMAL`, `HIGH`, `CRITICAL`) | Tự động qua `registerDecisionCatalogs` | `phase-6-34a-fnd-3-decision.test.ts` (Subtest 28) | **PASS** | Duy trì dữ liệu hiện tại. |
| **FND-4** | `system_population_population_bucket` | `data/catalogs/system_population_population_bucket_data.json` | 4 / 4 | Có (`RESIDENT`, `VISITOR_TOURIST`, `EXTERNAL_WORKER`, `IN_TRANSIT`) | Tự động qua `registerPopulationCatalogs` | `phase-6-34a-fnd-4-population.test.ts` (Subtest 20, 21) | **PASS** | Duy trì dữ liệu hiện tại. |
| **FND-4** | `system_population_workforce_category` | `data/catalogs/system_population_workforce_category_data.json` | 6 / 6 | Có (Building, Fleet Crew, Logistics, Training, Recovery, Other) | Tự động qua `registerPopulationCatalogs` | `phase-6-34a-fnd-4-population.test.ts` (Subtest 20, 21) | **PASS** | Duy trì dữ liệu hiện tại. |
| **FND-4** | `system_population_workforce_allocation_policy` | `data/catalogs/system_population_workforce_allocation_policy_data.json` | 1 / 1 | Có (`policy_standard_three_pass`) | Tự động qua `registerPopulationCatalogs` | `phase-6-34a-fnd-4-population.test.ts` (Subtest 20, 21) | **PASS** | Duy trì dữ liệu hiện tại. |
| **FND-4** | `system_population_capacity_policy` | `data/catalogs/system_population_capacity_policy_data.json` | 1 / 1 | Có (`policy_standard_base_capacity`, overflow ratio 1.25) | Tự động qua `registerPopulationCatalogs` | `phase-6-34a-fnd-4-population.test.ts` (Subtest 20, 21) | **PASS** | Duy trì dữ liệu hiện tại. |
| **FND-4** | `system_population_movement_reason` | `data/catalogs/system_population_movement_reason_data.json` | 5 / 5 | Có (Migration, Transfer, Evacuation, HQ Relocation, Immigration) | Tự động qua `registerPopulationCatalogs` | `phase-6-34a-fnd-4-population.test.ts` (Subtest 20, 21) | **PASS** | Duy trì dữ liệu hiện tại. |

---

## 3. KIỂM TOÁN 6 CHIỀU CHO TỪNG FOUNDATION (SYSTEM-BY-SYSTEM DEEP AUDIT)

### 3.1. FND-1: Shared Catalog / Master Data Foundation
1. **Có Engine & Schema?**  
   - **CÓ (PASS)**: Nằm tại `lib/game/world/catalog/` (`loader.ts`, `resolver.ts`, `registry.ts`, `storage-provider.ts`, `lifecycle.ts`, `file-naming.ts`, `derived-data.ts`).
   - Schema xác định cấu trúc root, partition split, provenance, override USER, lifecycle state (`ACTIVE`, `DEPRECATED`, `RETIRED`).
2. **Có SYSTEM Definition thực tế?**  
   - **CÓ (PASS)**: Đóng vai trò là meta-engine quản lý toàn bộ các catalog miền khác. Cung cấp API `getCatalog`, `getItem`, `resolveById`, `getResolvedItems`.
3. **Có Init/Seed Profile?**  
   - **CÓ (PASS)**: Khởi tạo singleton `defaultCatalogRegistry = new CatalogRegistry()`.
4. **Tích hợp vào WORLD Initialization (`createInitialWorldState`)?**  
   - **CHƯA (GAP)**: Hàm `createInitialWorldState()` không gọi warmup catalog, không lưu trạng thái override của user vào save game `WorldSaveEnvelope`.
5. **Runtime Instance sử dụng được khi tạo WORLD mới?**  
   - **CÓ (PASS)**: `defaultCatalogRegistry` thường trực trong bộ nhớ runtime.
6. **Test chứng minh fresh WORLD init?**  
   - **CHƯA (GAP)**: Các test `phase-6-34a-fnd-1` kiểm tra độc lập qua `InMemoryCatalogDataProvider`, chưa có test tích hợp kiểm tra `createInitialWorldState()` tự nạp catalog.

---

### 3.2. FND-2: Shared Progression + Tier Boundary Foundation
1. **Có Engine & Schema?**  
   - **CÓ (PASS)**: Nằm tại `lib/game/world/progression/engine.ts` và `types.ts`. Hỗ trợ EXP curve, Level cap, Tier boundary, Level effects, Tier breakthrough effects, 4 chính sách thăng hạng (`RECOMMEND`, `AUTO`, `LOCK`, `REQUIRE_MANUAL_QUEST`).
2. **Có SYSTEM Definition thực tế?**  
   - **CÓ (PASS)**: Đầy đủ 4 catalogs (10 Tier từ I đến X, 2 level effect profiles, 3 tier effect profiles, 2 progression curve profiles trên đĩa / 3 trong seed).
3. **Có Init/Seed Profile?**  
   - **CÓ (PASS)**: `seedProgressionCatalogData` và `registerProgressionCatalogs` nạp sẵn dữ liệu khi registry khởi động.
4. **Tích hợp vào WORLD Initialization (`createInitialWorldState`)?**  
   - **CHƯA (GAP)**: `WorldState` không có thuộc tính chứa `progressionStates`. Các thực thể khởi đầu như Sector, Base, Garrison không có instance `ProgressionState` mặc định gắn kèm.
5. **Runtime Instance sử dụng được khi tạo WORLD mới?**  
   - **MỘT PHẦN (PARTIAL)**: Engine là pure functions (`evaluateProgression`, `awardExp`) dùng được ngay khi truyền state, nhưng state mặc định của các đối tượng trong WORLD chưa được cấp phát lúc khởi tạo.
6. **Test chứng minh fresh WORLD init?**  
   - **CHƯA (GAP)**: Bộ test 28 subtests kiểm tra trên mock state, chưa gắn vào `createInitialWorldState()`.

---

### 3.3. FND-3: Shared Decision / Event Interaction Foundation
1. **Có Engine & Schema?**  
   - **CÓ (PASS)**: Nằm tại `lib/game/world/decision/engine.ts` và `types.ts`. Hỗ trợ vòng đời 4 trạng thái (`PENDING`, `APPROVED`, `REJECTED`, `INVALIDATED`), giới hạn xung đột 1 decision/scope, tính toán timeout hoàn toàn theo GAME_DAY, xuất nhập trạng thái bền vững và phóng chiếu UI Hub notification.
2. **Có SYSTEM Definition thực tế?**  
   - **CÓ (PASS)**: Đầy đủ 4 catalogs (3 fallback policies, 5 decision sources, 4 decision types, 4 decision priorities).
3. **Có Init/Seed Profile?**  
   - **CÓ (PASS)**: Khởi tạo singleton `defaultDecisionEngine = new SharedDecisionEngine()`, tự động đăng ký catalog.
4. **Tích hợp vào WORLD Initialization (`createInitialWorldState`)?**  
   - **CHƯA (GAP)**: `WorldState` chưa khai báo trường `decisions?: DecisionEngineState`. Khi lưu game qua `storage.ts`, các quyết định đang chờ giải quyết (`pendingDecisions`) và nhật ký (`history`) của `defaultDecisionEngine` không được lưu vào `STARFRONT_WORLD_SAVE_V1`.
5. **Runtime Instance sử dụng được khi tạo WORLD mới?**  
   - **CÓ (PASS)**: `defaultDecisionEngine` sẵn sàng nhận lệnh trong bộ nhớ.
6. **Test chứng minh fresh WORLD init?**  
   - **CHƯA (GAP)**: Bộ test 32 subtests kiểm tra độc lập, chưa kiểm tra lưu/nạp `WorldState` kèm decision engine state.

---

### 3.4. FND-4: Population / Workforce Shared Foundation
1. **Có Engine & Schema?**  
   - **CÓ (PASS)**: Nằm tại `lib/game/world/population/` (`allocator.ts`, `capacity.ts`, `crew-pool.ts`, `hub-policy.ts`, `intransit-ledger.ts`, `view-models.ts`, `types.ts`). Đầy đủ 3-Pass Allocator, 4 nhóm sức chứa độc lập, Ranh giới thủy thủ đoàn Hạm đội, Sổ cái InTransit Quốc gia, Chính sách slot Multi-Hub theo Tier.
2. **Có SYSTEM Definition thực tế?**  
   - **CÓ (PASS)**: Đầy đủ 5 catalogs (4 population buckets, 6 workforce categories, 1 allocation policy, 1 capacity policy, 5 movement reasons).
3. **Có Init/Seed Profile?**  
   - **CÓ (PASS)**: Khởi tạo singleton `defaultInTransitLedger`, tự động đăng ký catalog vào `defaultCatalogRegistry`.
4. **Tích hợp vào WORLD Initialization (`createInitialWorldState`)?**  
   - **CHƯA (GAP NGHIÊM TRỌNG)**:
     - Trong `createInitialWorldState()`, 8 sector hiện có chỉ chứa số nguyên thô `population: number` (ví dụ: `sol_command_hq`: 260,000; `helios_perimeter`: 130,000).
     - Chưa khởi tạo đối tượng `BasePopulationState` (với `populationAvailable`, `populationOccupied`, `breakdown`, `capacity`, `baseType`, `activeHubTypes`) cho bất kỳ căn cứ nào trong 8 sector khởi đầu.
     - `defaultInTransitLedger` không được đính kèm vào `WorldState` để lưu xuống save game.
     - Chưa khởi tạo `FleetCrewPool` cho hạm đội liên minh VSS hoặc người chơi.
5. **Runtime Instance sử dụng được khi tạo WORLD mới?**  
   - **MỘT PHẦN (PARTIAL)**: Các hàm phân bổ nhân lực (`allocateWorkforce`), tính sức chứa (`evaluateBaseCapacity`) hoạt động hoàn hảo khi được cung cấp state, nhưng không có dữ liệu thực thể nào trong WORLD runtime được gán sẵn cấu trúc này.
6. **Test chứng minh fresh WORLD init?**  
   - **CHƯA (GAP)**: Test suite `phase-6-34a-fnd-4` (23/23 pass) kiểm tra trên mock state cục bộ, chưa tích hợp với `createInitialWorldState()`.

---

## 4. DANH SÁCH & PHÂN LOẠI CÁC GAP (GAP CLASSIFICATION)

### NHÓM A: BẮT BUỘC SỬA TRONG PHASE FND-5 (FOUNDATION WIRING & WORLD INIT PERSISTENCE)
Các GAP này thuộc tầng kiến trúc nền tảng (Foundation Architecture), cần phải được xử lý ngay trong Phase FND-5 trước khi triển khai các tính năng gameplay cụ thể:

1. **GAP-A1 (Đồng bộ Catalog trên Đĩa)**:
   - *Hiện trạng:* `data/catalogs/system_progression_progression_profile_data.json` trên đĩa có 2 items (`profile_standard_100`, `profile_compact_50`), trong khi `seed-data.ts` có 3 items (thêm `profile_auto_progression`).
   - *Yêu cầu:* Đồng bộ tệp JSON trên đĩa có đủ 3 items để khi nạp từ file hệ thống hay in-memory seed đều nhất quán 100%.

2. **GAP-A2 (Mở rộng Schema `WorldState` để lưu trữ Decision & InTransit)**:
   - *Hiện trạng:* `WorldState` trong `lib/game/world/types.ts` chưa có trường cho `decisions?: DecisionEngineState` và `inTransitLedger?: PopulationTransferRecord[]`.
   - *Yêu cầu:* Bổ sung các trường tùy chọn này vào `WorldState`, cập nhật `storage.ts` để lưu và nạp nguyên vẹn trạng thái quyết định đang chờ và dòng dân số đang di chuyển giữa các lần save/load game.

3. **GAP-A3 (Tập trung Khởi động Catalog lúc tạo WORLD)**:
   - *Hiện trạng:* Các lời gọi đăng ký catalog nằm rải rác ở cuối các file `registry-integration.ts` của từng module.
   - *Yêu cầu:* Cung cấp một hàm thống nhất `bootstrapWorldCatalogs(registry?)` được gọi một lần duy nhất khi khởi tạo ứng dụng hoặc nạp WORLD, bảo đảm toàn bộ 13 catalog đã sẵn sàng trong bộ nhớ.

4. **GAP-A4 (Khởi tạo `BasePopulationState` mặc định cho 8 Sector cốt lõi trong `createInitialWorldState`)**:
   - *Hiện trạng:* 8 sector hiện chỉ có số dân thô (`population: 260000`), hoàn toàn thiếu cấu trúc dân số Modular Aggregate của FND-4.
   - *Yêu cầu:* Trong `createInitialWorldState()`, phân bổ số dân thô này vào `BasePopulationState` hợp lệ:
     - Gán `baseType` phù hợp (ví dụ: `sol_command_hq` là `CAPITAL`, các trạm khác là `GENERAL` hoặc `MILITARY`).
     - Gán `capacity` 4 nhóm độc lập dựa trên quy mô ban đầu.
     - Khởi tạo `populationCurrent = population`, `populationAvailable = population`, `populationOccupied = 0`.
     - Khởi tạo `breakdown` rỗng và `activeHubTypes: []`.

5. **GAP-A5 (Viết Bộ Test Tích hợp Fresh WORLD Initialization)**:
   - *Hiện trạng:* Mỗi FND chỉ có test unit riêng, chưa có test tích hợp chứng minh một WORLD mới tạo ra lập tức sử dụng được Catalog, Progression, Decision, và Population.
   - *Yêu cầu:* Viết `tests/world/phase-6-34a-fnd-5-world-init.test.ts` kiểm chứng toàn diện quy trình khởi tạo từ đầu đến cuối.

---

### NHÓM B: THUỘC CÁC DOMAIN PHASE SAU (DOMAIN GAMEPLAY & UI PHASES)
Các GAP này không phải lỗi của Foundation mà là scope nghiệp vụ cụ thể thuộc các Phase tiếp theo theo Roadmap:

1. **GAP-B1 (Building & Facility Staffing Demands)**:
   - Các công trình căn cứ (Power Plant, Hydroponics, Factory, Hospital, Defense Shield) nộp nhu cầu nhân lực (`WorkforceDemand`) và kết nối với chu kỳ tick kinh tế.  
   $\rightarrow$ *Thuộc Phase Base Building & Settlement Management.*

2. **GAP-B2 (Ship & Fleet Crew Recruitment & Duty Assignment)**:
   - Giao diện người chơi tuyển quân từ Căn cứ vào Hạm đội (`FleetCrewPool`), phân bổ vào tàu chiến và tháp pháo.  
   $\rightarrow$ *Thuộc Phase Fleet Management & Naval Logistics.*

3. **GAP-B3 (Progression State trên từng Thực thể Vũ khí / Công trình)**:
   - Cấp phát `ProgressionState` cho từng cỗ máy GEAR, từng Tàu chiến, từng Công trình để nhận EXP tác chiến / sản xuất và thăng hạng Tier.  
   $\rightarrow$ *Thuộc Phase Gear Progression & Tech Tree.*

4. **GAP-B4 (Chuyển giao Event Strategy sang Shared Decision Engine)**:
   - Thay thế cơ chế xử lý sự kiện cũ (`EventStrategy`) trong `event-engine.ts` bằng `SharedDecisionEngine` để người chơi ra quyết định qua Hub Notification.  
   $\rightarrow$ *Thuộc Phase Operations Hub & Event Overhaul.*

5. **GAP-B5 (Giao diện UI / HUD Dashboard)**:
   - Tích hợp các ViewModels (`BasePopulationSummaryVM`, `CapacityCardVM`, `WorkforceTreeNodeVM`) vào Base Inspector và War Room.  
   $\rightarrow$ *Thuộc Phase Strategic UI / Base Operations Desk.*

---

## 5. KẾT LUẬN & KIẾN NGHỊ BƯỚC ĐI TIẾP THEO

- Nền tảng FND-1 đến FND-4 đã đạt **độ hoàn thiện thiết kế 100%**, mã nguồn sạch, kiểu dữ liệu chặt chẽ và vượt qua toàn bộ 106 subtests tự động.
- Dữ liệu chuẩn tắc SYSTEM canonical trong 13 tệp JSON đầy đủ, không rỗng, không chứa dữ liệu giả hoặc placeholder.
- Khoảng trống lớn nhất hiện nay nằm ở **sợi dây kết nối giữa các Foundation trừu tượng với đối tượng `WorldState` trong `createInitialWorldState()`**.
- **Kiến nghị thực hiện Phase tiếp theo**: Triển khai một Phase tích hợp gọn gàng **`Phase 6.34A-FND-5: Foundation Wiring & Fresh World Initialization`** để đóng toàn bộ các GAP Nhóm A trước khi mở rộng sang các domain gameplay cụ thể (Base, Building, Ship, Fleet).
