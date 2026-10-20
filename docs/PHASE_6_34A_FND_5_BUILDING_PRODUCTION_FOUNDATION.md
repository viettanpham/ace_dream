# STARFRONT WORLD — PHASE 6.34A-FND-5
# FOUNDATION AUDIT REPAIR + BUILDING / PRODUCTION FOUNDATION SPECIFICATION

> **TÀI LIỆU THIẾT KẾ & KHẾ ƯỚC KỸ THUẬT NỀN TẢNG (TECHNICAL SPECIFICATION)**  
> **Phiên bản:** v1.0 — Approved Foundation Blueprint  
> **Phạm vi:**  
> 1. Sửa chữa dứt điểm 6 GAP kiến trúc đã phát hiện trong tài liệu audit `docs/STARFRONT_FOUNDATION_DEFAULT_INIT_AUDIT_FND1_FND4.md`.  
> 2. Triển khai nền tảng Công trình & Sản xuất chung (Building / Production Shared Foundation — FND-5) theo chuẩn `Type → Class → Definition → Instance`.  
> 3. Tái sử dụng trọn vẹn FND-1 (Catalog), FND-2 (Progression/Tier), FND-3 (Decision), FND-4 (Population/Workforce), không tạo engine trùng lặp, không phá vỡ tính tương thích ngược của `STARFRONT_WORLD_SAVE_V1`.

---

## PHẦN I: KHẮC PHỤC 6 GAP TỪ FND-1 ĐẾN FND-4

### 1. GAP 1: Đồng bộ Progression SYSTEM JSON và Seed Code
- **Hiện trạng:** Tệp đĩa `data/catalogs/system_progression_progression_profile_data.json` có 2 items (`profile_standard_100`, `profile_compact_50`), trong khi `lib/game/world/progression/seed-data.ts` có 3 items (bổ sung `profile_auto_progression`).
- **Giải pháp:** Cập nhật tệp JSON trên đĩa để đồng bộ chuẩn xác 3 items với `seed-data.ts`. Bổ sung kiểm thử xác thực 100% đồng nhất giữa đĩa và in-memory.

### 2. GAP 2: Bổ sung Persistence cho DecisionEngineState và InTransitLedger
- **Hiện trạng:** `WorldState` chưa chứa `decisions?: DecisionEngineState` và `inTransitLedger?: PopulationTransferRecord[]`. Khi người chơi lưu game (`saveWorldState`), các quyết định PENDING và các đợt chuyển quân đang di chuyển bị thất lạc.
- **Giải pháp:**
  - Khai báo thêm trong `lib/game/world/types.ts`:
    - `decisions?: DecisionEngineState` (FND-3)
    - `inTransitTransfers?: PopulationTransferRecord[]` (FND-4)
    - `bases?: Record<string, BaseEntityState>` (FND-5)
  - Cập nhật `storage.ts` để lưu và nạp nguyên vẹn các trường này mà không làm hỏng Save Schema V1 (các trường mới đều là optional, có fallback tự động khi load save cũ).

### 3. GAP 3: Centralized Catalog Bootstrap (`bootstrapWorldCatalogs`)
- **Hiện trạng:** Việc đăng ký catalog nằm rải rác dưới dạng side-effect import trong các file `registry-integration.ts`. Nếu không import trực tiếp thì `defaultCatalogRegistry` có thể chưa được nạp.
- **Giải pháp:** Cung cấp hàm tập trung `bootstrapWorldCatalogs(registry = defaultCatalogRegistry, provider?)`:
  - Lũy đẳng (Idempotent): an toàn tuyệt đối khi gọi nhiều lần.
  - Tự động nạp và đăng ký tất cả các catalog SYSTEM từ FND-1, FND-2, FND-3, FND-4 và FND-5.

### 4. GAP 4: Chuyển Dân số Khởi tạo sang `BasePopulationState` Đầy Đủ
- **Hiện trạng:** 8 Sector trong `INITIAL_WORLD_SECTORS` chỉ chứa một số nguyên thô `population: number` (ví dụ `sol_command_hq`: 260,000). Không có cấu trúc sức chứa, lao động, khả dụng, và slot Hub theo FND-4.
- **Giải pháp:** Trong `createInitialWorldState()`:
  - Khởi tạo `basePopulationStates: Record<string, BasePopulationState>` tương ứng cho từng Căn cứ / Trạm trong Sector.
  - Phân loại `baseType` phù hợp: `sol_command_hq` là `CAPITAL`, `helios_perimeter` là `DEFENSE`, `mining_outpost_k7` là `GENERAL`, v.v.
  - Khởi tạo sức chứa 4 nhóm độc lập: `residentialCapacity`, `visitorCapacity`, `temporaryWorkerCapacity`, `emergencyCapacity`.
  - Bảo toàn 100% nguyên tắc: `populationCurrent = populationAvailable + populationOccupied = sector.population`.
  - Không nhân bản người khi một Sector có nhiều căn cứ (chia tỷ lệ hoặc chỉ định căn cứ chính).

### 5. GAP 5: Integration Tests Cho Fresh WORLD Initialization
- **Hiện trạng:** Chưa có bài test nào gọi trực tiếp `createInitialWorldState()` để xác nhận các Foundation đã được đấu nối vào WORLD State thực tế.
- **Giải pháp:** Viết test suite `tests/world/phase-6-34a-fnd-5-world-init.test.ts` kiểm thử:
  - Tạo mới WORLD State với seed.
  - Kiểm tra các catalog đã được nạp qua bootstrap.
  - Kiểm tra `basePopulationStates` trong World State bảo toàn số dân.
  - Kiểm tra Decision Engine và InTransit Ledger được kết nối và lưu/nạp an toàn.

### 6. GAP 6: Xử lý Khác và Bằng chứng Kiểm chứng
- Kiểm tra toàn bộ schema, đảm bảo không có bất kỳ placeholder nào và toàn bộ hệ thống biên dịch `tsc --noEmit` đạt 0 lỗi.

---

## PHẦN II: KIẾN TRÚC CÔNG TRÌNH & SẢN XUẤT (FND-5 BUILDING / PRODUCTION)

### 1. Kiến Trúc Phân Tầng Thực Thể (Building Entity Architecture)
Áp dụng mô hình chuẩn công nghiệp:
$$\text{Building Type} \longrightarrow \text{Building Class} \longrightarrow \text{Building Definition} \longrightarrow \text{Building Instance}$$

1. **Building Type (19 Loại Chuẩn Tắc):**
   - `RESIDENTIAL`: Nhà ở dân cư, cư xá đô thị.
   - `MEDICAL`: Bệnh viện chiến trường, trung tâm hồi phục sinh học.
   - `AGRICULTURE`: Nông trang thủy canh, tổng hợp dinh dưỡng.
   - `INDUSTRY`: Nhà máy chế tạo, xưởng luyện kim, phân xưởng lắp ráp.
   - `STORAGE`: Kho chứa tài nguyên vĩ mô, bồn chứa năng lượng.
   - `LOGISTICS`: Trạm trung chuyển hàng hóa, điều phối luồng xe tải.
   - `RESEARCH`: Viện công nghệ cao, phòng thí nghiệm vật lý lượng tử.
   - `FINANCE`: Ngân khố trung ương, sàn giao dịch liên hành tinh.
   - `ENTERTAINMENT`: Khu phức hợp văn hóa, cải thiện tinh thần dân cư.
   - `SUPPORT`: Trạm hỗ trợ kỹ thuật, trạm phát điện phụ trợ.
   - `COMMAND`: Trung tâm chỉ huy tác chiến căn cứ / tổng hành dinh.
   - `DEFENSE`: Tháp pháo tầm xa, pháo đài phòng thủ công sự.
   - `OFFENSE`: Trận địa tên lửa chiến lược, bệ phóng xung kích.
   - `MILITARY`: Doanh trại quân đồn trú, căn cứ huấn luyện tân binh.
   - `SPACEPORT`: Cảng hàng không vũ trụ, bến đỗ tàu vận tải.
   - `ORBITAL_DEFENSE`: Đài quan sát quỹ đạo, pháo hạt nhân không gian.
   - `GUILD`: Trụ sở Bang hội liên minh, câu lạc bộ thợ săn tiền thưởng.
   - `RESCUE`: Trung tâm Tìm kiếm & Cứu nạn (SAR), trạm cứu hộ phi công.
   - `GENERIC`: Cơ sở hạ tầng đa năng tiêu chuẩn.

2. **Building Class:**
   Mỗi Type có ít nhất 1–2 Class định hình quy mô: `LIGHT`, `MEDIUM`, `HEAVY`, `ORBITAL_OUTPOST`, `CORE_FACILITY`.

3. **Building Definition (Master Catalog Data):**
   - Định nghĩa thông số gốc: baseCost, buildDurationGameDays, slotProfileRef, workforceDemands, maintenancePolicy, productionRecipes, maxHp, initialCondition.

4. **Building Instance (Runtime State):**
   - Thể hiện thực tế của một công trình được xây trên Base:
     `instanceId`, `baseId`, `definitionId`, `currentLevel`, `currentTier`, `currentHp`, `maxHp`, `conditionHp`, `operationalState` (`ACTIVE`, `INACTIVE`, `DAMAGED`, `UPGRADING`, `OFFLINE`), `assignedPersonnel`, `maintenancePolicy`, `equippedModules`, `productionLines`, `storageLocal`.

---

### 2. Hệ Thống Khe Cắm Dùng Chung & Quy Tắc Tăng Trưởng (Shared Slot & Tier Framework)

1. **Cấu trúc Khe Cắm (Slot Profile):**
   - **Typed Slots:** Khe cắm chuyên dụng (ví dụ: `WEAPON_SLOT`, `SHIELD_SLOT`, `PRODUCTION_LINE_SLOT`, `STORAGE_MODULE_SLOT`).
   - **Flexible Generic Slots:** Khe cắm vạn năng, có thể lắp đặt mọi module tương thích.

2. **Slot Growth theo Tier Milestones (FND-2):**
   - Khi công trình hoặc Căn cứ thăng hạng Tier (từ Tier I lên Tier X theo FND-2), số lượng slot tự động tăng theo công thức định nghĩa trong `slotProfile`.
   - **Quy tắc MAX TIER BONUS (Cột mốc MK X):**
     - Khi thực thể đạt cấp tối đa **MK X (Tier X)**:
       $$\text{TotalSlots}_{\text{MK X}} = \text{BaseSlots}_{\text{MK X}} + \text{MaxTierStepBonus}$$
     - *Ví dụ 1 (Border Outpost):* MK IX có 15 slots; MK X cơ bản có 16 slots; nhận thêm `MAX_TIER_BONUS = 1` $\rightarrow$ **17 slots**.
     - *Ví dụ 2 (Orbital Sub-Base):* MK I = 3 slots; MK III = 4; MK V = 5; MK VII = 6; MK IX = 7; MK X cơ bản = 7 + 1 bonus $\rightarrow$ **8 slots**.
     - *Bảo đảm lũy đẳng:* Khi nạp lại Save Game, hệ thống kiểm tra cờ `maxTierBonusApplied` để tuyệt đối **không cộng trùng lần thứ hai**.

3. **Thực thể Phụ thuộc Quỹ đạo (Orbital Sub-Base):**
   - Orbital Sub-Base là trạm không gian trực thuộc Base hành tinh mẹ (`parentBaseId`).
   - Có giới hạn slot nhỏ hơn và không thể mở rộng thành Capital hoặc Base độc lập đầy đủ.

---

### 3. Vận Hành Công Trình (Building Operations & Maintenance)

1. **Phân bổ Nhân lực 3 Vòng (3-Pass Integration):**
   - Mỗi công trình nộp nhu cầu nhân lực: `minimumPersonnel`, `targetPersonnel`, `maximumPersonnel`.
   - Sử dụng đúng engine `allocateWorkforce` của FND-4:
     - Đơn vị không đạt `minimumPersonnel` $\rightarrow$ `UNDER_MINIMUM`, bị đánh dấu `operationalEligibility = false` (ngừng sản xuất / ngừng cung cấp buff).
     - Công trình bị tắt chủ động (`Building OFF`) $\rightarrow$ được đánh dấu `isExcluded = true`, lập tức giải phóng toàn bộ nhân sự về `populationAvailable` của Căn cứ và kích hoạt tính toán lại phân bổ.

2. **Quyền Ghi đè của Chỉ huy (Commander Override):**
   - Chỉ huy có quyền khóa (`isLocked = true`) hoặc cưỡng chế mức nhân sự tối thiểu/tối đa cho một công trình.
   - Override có hiệu lực vĩnh viễn cho đến khi Chỉ huy hủy bỏ, hoặc hết hạn theo số ngày GAME_DAY cấu hình.
   - Base AI **tuyệt đối không được vượt quyền** trừ các tình huống khẩn cấp được quy định trong chính sách (`EMERGENCY_OVERRIDE`), kèm theo ghi nhận nhật ký lý do (`reasonCodes`).

3. **Chỉ số Tình trạng Kỹ thuật & Sức Khỏe (HP & Condition):**
   - `MaxConditionHP = MaxHP`.
   - Áp dụng đúng công thức Condition Overflow:
     $$\text{HPAfterDamage} = \text{CurrentHP} - \text{IncomingDamage}$$
     $$\text{RawConditionAfterDamage} = \text{CurrentConditionHP} - \text{IncomingDamage}$$
     $$\text{ConditionOverflowDamage} = \max(-\text{RawConditionAfterDamage}, 0)$$
     $$\text{NewConditionHP} = \max(\text{RawConditionAfterDamage}, 0)$$
     $$\text{NewHP} = \max(\text{HPAfterDamage} - \text{ConditionOverflowDamage}, 0)$$

4. **Chính Sách Bảo Trì (Maintenance Policies):**
   - `AUTO`: Tự động trích vật tư bảo dưỡng khi Condition < 80%.
   - `MANUAL`: Chỉ bảo dưỡng khi có lệnh điều phối của người chơi.
   - `EMERGENCY`: Chỉ sửa chữa khẩn cấp khi HP hoặc Condition rơi xuống dưới 25%.
   - `DISABLED`: Tắt bảo trì hoàn toàn để tiết kiệm chi phí.

---

### 4. Động Cơ Sản Xuất & Lưu Trữ (Production & Storage Engine)

1. **Quy trình Sản xuất theo Chu kỳ GAME_DAY (Cycle-Based Production):**
   - Mỗi công thức (`ProductionRecipe`) quy định:
     - `inputs: Record<ResourceId, number>`
     - `outputs: Record<ResourceId, number>`
     - `cycleDays: number` (Số ngày game để hoàn thành 1 lô)
     - `maxParallelLines: number`
   - **Cơ chế Giữ chỗ Nguyên liệu (Input Reservation):**
     - Khi bắt đầu chu kỳ tác chế, lượng nguyên liệu đầu vào được **giữ chỗ (RESERVED)** ngay lập tức khỏi kho để tránh chi tiêu trùng lặp.
     - Tại thời điểm quyết toán chu kỳ (`settlement`): tiêu thụ nguyên liệu thực tế, hoàn trả phần thừa (nếu có), và cộng thành phẩm vào kho.
   - **Xử lý Đầy Kho (`OUTPUT_BLOCKED`):**
     - Nếu kho chứa không còn đủ sức chứa để tiếp nhận thành phẩm, dây chuyền chuyển sang trạng thái `OUTPUT_BLOCKED`, tạm dừng sản xuất cho đến khi kho được giải phóng.

2. **Hệ Thống Kho Chứa Hai Tầng (Storage Architecture):**
   - **Base Shared Storage:** Kho dùng chung của toàn căn cứ (mặc định cho tài nguyên chiến lược).
   - **Building Local Storage:** Kho cục bộ của từng công trình (cho sản phẩm trung gian hoặc vật tư chuyên dụng).
   - Core Storage và Storage tăng thêm từ các công trình được tính toán lũy đẳng, không cộng dồn sai lệch khi tick.

---

### 5. Xây Dựng, Nâng Cấp & Tái Quy Hoạch (Construction & Upgrade Lifecycle)

1. **Cơ sở Cốt lõi (Core Facilities):**
   - Mỗi Base được cấu hình sẵn các Cơ sở Cốt lõi (Command Hub, Primary Life Support, Core Storage, Emergency Medical) mà **không chiếm dụng Expansion Slots**.
2. **Quy trình Xây dựng / Nâng cấp:**
   - Thực thi qua hàng đợi xây dựng (`constructionQueue`) theo GAME_DAY.
   - Khi nâng cấp: giữ nguyên các Module đang gắn, bảo lưu nhân lực và kho chứa, không làm mất nguyên liệu đang giữ chỗ.
3. **Phá dỡ & Thay thế (Demolition):**
   - Base AI chỉ được phép phá dỡ công trình không thiết yếu khi có chính sách cho phép; các công trình phòng thủ chiến lược và cơ sở cốt lõi được bảo vệ nghiêm ngặt.

---

### 6. Khởi Tạo Thế Giới & Tạo Mới Seed (WORLD Generation & Reset)

1. **Khởi tạo Thế giới Xác định (Deterministic Seed Generation):**
   - Khởi tạo thế giới với cùng Seed và cùng Catalog Version sẽ sinh ra bản đồ các Căn cứ và Công trình giống hệt nhau.
2. **Quy tắc Reset WORLD:**
   - Khi người chơi yêu cầu Reset WORLD:
     - Bắt buộc xác nhận.
     - Luôn luôn sinh một **SEED MỚI** ngẫu nhiên.
     - Cho phép tùy chỉnh tên Liên đoàn CC0 và Tên Chỉ huy; mặc định:
       - **CC0 Faction:** `Liên minh VSS`
       - **Commander:** `Alviss`
     - Tuyệt đối không ngẫu nhiên hóa lại World khi tải save game (`loadWorldState`).

---

## PHẦN III: HỆ THỐNG KIỂM THỬ BẮT BUỘC (TEST MATRIX)

1. **Regression Suites:**
   - FND-1 Shared Catalog (23/23 PASS)
   - FND-2 Shared Progression (28/28 PASS)
   - FND-3 Shared Decision (32/32 PASS)
   - FND-4 Population / Workforce (23/23 PASS)
   - Pilot Survival & SAR (10/10 PASS)
2. **FND-5 Building & Production Suites:**
   - 19 Building Types, Classes, và Definitions nạp chuẩn từ Catalog.
   - Shared Slot Profile & Slot Growth theo Tier.
   - MAX TIER BONUS (Cộng đúng ở MK X, không cộng trùng khi reload).
   - 3-Pass Workforce Allocator cho công trình, trạng thái Building OFF.
   - Commander Override hiệu lực và quyền hạn AI trong trường hợp khẩn cấp.
   - Production Reservation, Settlement và chống chi tiêu trùng lặp.
   - Đầy kho chuyển sang `OUTPUT_BLOCKED`.
   - Fresh World Initialization & Reset World.
   - Lũy đẳng và tương thích World Save V1.
   - Compaction lưu trữ lịch sử hoạt động.
