# STARFRONT WORLD — PHASE 6.34A
# PILOT SURVIVAL & RESCUE ARCHITECTURE PLAN (HANDOFF BASELINE)

> **SOURCE OF TRUTH HANDOFF DOCUMENT**  
> Tài liệu này đóng băng toàn bộ kết quả tái lập kế hoạch (Re-Planning), căn chỉnh kiến trúc và phân rã các phân kỳ triển khai cho Phase 6.34A.  
> Các session hoặc AI agent tiếp theo bắt đầu từ Phase 6.34B sử dụng tài liệu này làm Source of Truth duy nhất mà không cần đọc lại toàn bộ lịch sử hội thoại trước đó.

---

## A. Status

```text
Phase 6.34A: PLANNING APPROVED
Implementation: NOT STARTED
Next Phase: 6.34B (Core Survival, Protection & FATAL)
```

---

## B. Architecture Principles

1. **Kế thừa & Không nhân bản**:
   - Tái sử dụng tối đa hạ tầng Phase 6.34 hiện hữu (`lib/game/world/pilot-survival-engine.ts`, `pilot-survival-types.ts`, `state.pilotSurvivalRegistry`, `state.nationalPowRegistry`).
   - Tái sử dụng động cơ chiến đấu Combat V2 (`combat-v2-engine.ts`) cho mô phỏng giao tranh ngầm.
   - Tái sử dụng đồ thị mạng lưới tuyến đường (`graph.ts`) và sổ cái lực lượng (`forces-ledger.ts`).
   - **Tuyệt đối không xây dựng engine, store hoặc state song song/thay thế.**
2. **Kỷ luật Cấu hình Tập trung (System Invariant #16)**:
   - Toàn bộ tham số cân bằng, ngưỡng điểm và hệ số phải nằm trong `SurvivalConfig` (quản lý qua AdminCP).
   - Không rải rác magic number trong mã nguồn gameplay.
3. **Kỷ luật Trình diễn vs Cân bằng (System Invariant #17)**:
   - AI Studio được quyền suy diễn, tối ưu hóa giao diện (cards, drawers, tooltips, responsive layout, animations, semantic styling).
   - AI Studio **tuyệt đối không tự ý bịa đặt** công thức, tài nguyên kinh tế mới hoặc hệ số gameplay chưa được phê duyệt.

---

## C. Approved Core Survival Design

### 1. Công thức Sinh tồn & Tương quan Lực lượng

- **`CombatEffectivenessRatio`** (Runtime derived per faction, không chứa Tactical Effect):
  ```text
  HpConditionRatio = TotalCurrentHP / TotalMaxHP
  OffenseEffectivenessRatio = CurrentEffectiveOffense / BaseOffenseOfCurrentForce
  DefenseEffectivenessRatio = CurrentEffectiveDefense / BaseDefenseOfCurrentForce

  CombatEffectivenessRatio = (HpConditionRatio + OffenseEffectivenessRatio + DefenseEffectivenessRatio) / 3
  ```

- **`GearArmyAdvantagePoint`**:
  ```text
  GearArmyAdvantagePoint = RemainingGearCount × GearAdvantageBase × GearAdvantageRatio × CombatEffectivenessRatio × TacticalEffectRatio
  ```
  - `GearAdvantageRatio`: Default = `1.0` (AdminCP configurable).
  - `TacticalEffectRatio`: Default = `1.0` (Tách biệt khỏi CombatEffectiveness).
  - `GearAdvantageBase`: *UNRESOLVED CONFIG — USER REVIEW REQUIRED*.

- **`EnemySecurityPower` & `AllySecurityPower`** (Tận dụng Sector Threat sẵn có):
  ```text
  EnemySecurityPower = CurrentThreat × SectorSecurityEffectRatio
  AllySecurityPower  = max(0, MaxThreat - CurrentThreat) × SectorSecurityEffectRatio
  ```
  - `SectorSecurityEffectRatio`: Default = `1.0` (AdminCP configurable).

- **`EffectivePower`**:
  ```text
  EffectivePower = GearArmyAdvantagePoint + SecurityPower (Tính riêng Ally / Enemy)
  ```

- **`RelativePowerDifference`** (Kẹp [-1.0..+1.0], xử lý an toàn chia cho 0):
  ```text
  RelativePowerDifference = (AllyEffectivePower - EnemyEffectivePower) / max(AllyEffectivePower, EnemyEffectivePower)
  ```

- **`SurvivalScore`** (Kẹp [0..100]):
  ```text
  PowerSurvivalModifier = RelativePowerDifference × PowerSurvivalMaxModifier
  SurvivalScore = clamp((BaseSurvival + PowerSurvivalModifier + EventSurvivalModifier) × SurvivalRatio, 0, 100)
  ```
  - `BaseSurvival`: Default = `50` (AdminCP configurable).
  - `PowerSurvivalMaxModifier`: Default = `20` (AdminCP configurable).
  - `EventSurvivalModifier`: Default = `0`.
  - `SurvivalRatio`: Default = `1.0` (AdminCP configurable).

- **`ProtectionCapabilityRatio`** (Kẹp [0.0..1.0]):
  ```text
  ProtectionCapabilityRatio = clamp(
      (AllyEffectivePower / (AllyEffectivePower + EnemyEffectivePower))
      × ProtectionEffectRatio
      × ProtectionEventEffectRatio,
      0.0,
      1.0
  )
  ```
  - `ProtectionEffectRatio`: Default = `1.0`.
  - `ProtectionEventEffectRatio`: Default = `1.0`.
  - `ProtectedCapabilityThreshold`: Default = `0.50`.

- **`FatalityPressureRatio`**:
  ```text
  FatalityPressureRatio = clamp(BaseFatalityRatio × FatalityEventEffectRatio, 0.0, 1.0)
  ```
  - `CriticalFatalityBaseRatio`: Default = `0.30` (Approved).
  - `FatalFatalityBaseRatio`: Default = `0.60` (Approved, bắt buộc > Critical).
  - `FatalityEventEffectRatio`: Default = `1.0`.
  - `CaptureEligibilityMaxFatalityRatio`: Default = `0.80`. Nếu `FatalityPressureRatio >= 0.80` $\to$ xác nhận KIA ngay, không thể bị bắt sống.

- **`CaptureCapabilityRatio`**:
  ```text
  BaseCaptureControlRatio = WinningSideEffectivePower / (AllyEffectivePower + EnemyEffectivePower)
  CaptureCapabilityRatio = clamp(BaseCaptureControlRatio × CaptureEffectRatio × CaptureEventEffectRatio, 0.0, 1.0)
  ```
  - Phe thắng bắt phi công phe thua (chỉ áp dụng khi phi công còn sống). `KIA` tuyệt đối không bị capture.

---

## D. Pilot State Semantics

### 1. Phân loại Ban đầu (Initial Survival Classification)
- **`SAFE`** ($Score \ge SafeThreshold$, default 70): Thoát hiểm an toàn, định vị chính xác, 100% cứu hộ.
- **`PROTECTED`** ($Score \ge ProtectedThresholdScore$, default 50; hoặc $Score \ge CriticalThreshold$ và $ProtectionCapabilityRatio \ge ProtectedCapabilityThreshold$): Được đồng minh che chắn hỏa lực, 100% cứu hộ.
- **`CRITICAL`** ($Score \ge CriticalThreshold$, default 30, nhưng năng lực che chở $< 0.50$): Buồng lái kẹt hỏa tuyến, giải quyết theo xác suất hậu chiến.
- **`FATAL`** ($Score < CriticalThreshold$): Buồng lái vỡ nát, rủi ro tử vong cực cao.
  - **QUY TẮC CỐT LÕI**: `FATAL` **KHÔNG PHẢI LÀ KIA**. Phi công `FATAL` vẫn có thể sống sót (`RESCUED`, `CAPTURED`, hoặc `MISSING`) nếu SAR can thiệp kịp thời.

### 2. Kết quả Chung cuộc (Final Outcomes)
- **`RESCUED`**: Phi công sống và đã được đưa về căn cứ an toàn.
- **`CAPTURED`**: Phi công còn sống và đang bị giam giữ trong `nationalPowRegistry`.
- **`MISSING`**: Mất liên lạc, chưa xác nhận sống chết, cần chiến dịch tìm kiếm SAR.
- **`KIA`**: Đã xác nhận tử trận vĩnh viễn (Final confirmed state).

---

## E. MISSING / POW Rules

1. **Gỡ bỏ Auto-Raid**: Khi phi công bị `CAPTURED`, hệ thống chuyển vào `state.nationalPowRegistry` nhưng **KHÔNG tự động tạo nhiệm vụ giải cứu raid** trong `Mission Dispatcher`. Hoạt động giải cứu thực hiện qua can thiệp của người chơi, chiến dịch hoặc sự kiện.
2. **Chiến dịch Tìm kiếm Mất tích (MISSING Search Chain)**:
   - **`LARGE`**: Cho phép khi $SectorThreatRatio < 0.50$, thời lượng = 120 ngày.
   - **`STANDARD`**: Cho phép khi $SectorThreatRatio < 0.70$, thời lượng = 60 ngày.
   - Nếu cả hai hợp lệ $\to$ tự động chọn `LARGE`.
   - Nếu $SectorThreatRatio \ge 0.70$ $\to$ Không cho phép phát động tìm kiếm, không tiêu tốn lượt tìm kiếm, `MissingAgeDays` tiếp tục tăng.
3. **Số lượt tìm kiếm & Cửa sổ chờ**:
   - `MaxMissingSearchCampaigns` = `3` lần tối đa.
   - `TimeWaitingToResultDays` = `30` ngày chờ phán quyết cuối cùng sau khi hết lượt tìm kiếm.
4. **Suy giảm theo tuổi mất tích (`MissingAgeDays`)**:
   - 0–30 ngày: Hệ số `1.00`.
   - 31–60 ngày: Hệ số `0.90`.
   - 61–120 ngày: Hệ số `0.75`.
   - > 120 ngày: Hệ số `0.50`.
5. **Giải quyết tìm kiếm**:
   - `ResolvedPilotCount = round(MissingPilotCount × SearchCapabilityRatio)`.
   - Kết quả phân giải: `RESCUED`, `KIA`, hoặc `CAPTURED_CONFIRMED`. Phần còn lại là `STILL_MISSING`.

---

## F. Rescue Operation Architecture

1. **Căn cứ Cứu hộ Gần nhất (Nearest Eligible Base)**:
   - Tìm căn cứ có cơ sở cứu hộ gần nhất trên đồ thị tuyến đường (`graph.ts` qua Dijkstra), không dùng khoảng cách hình học pixel.
   - `RescueFacilityDistanceDecayPerEdge` = `0.10` (mỗi bước nhảy trên cạnh đồ thị suy giảm 10% hiệu lực cơ sở).
2. **Quản lý Lộ trình Độc lập**:
   - `PlannedRoute`: Danh sách Sector kế hoạch ban đầu, bất biến không bị ghi đè.
   - `ActualRoute`: Lộ trình thực tế đã di chuyển (bao gồm chặng đi vòng, rẽ nhánh).
3. **Tái đánh giá tại Trạm kiểm soát (Checkpoint-based Re-evaluation)**:
   - Chỉ đánh giá lại chặng tiếp theo khi hạm đội đến căn cứ kiểm soát (Checkpoint Base), không tính toán lại toàn bộ mỗi tick.
   - Ánh xạ trạng thái tuyến đường: `open` $\equiv$ `SAFE`, `hazardous` $\equiv$ `THREATENED`, `blocked` / `offline` $\equiv$ `CLOSED`.
4. **Cơ chế Thử lại khi Tuyến đường Đóng**:
   - `RouteAutoRetryMax` = `3` lần (khoảng cách 1 ngày/lần).
   - `CommandExtendedRetryMax` = `5` lần theo lệnh chỉ huy. Nếu hết hạn vẫn `CLOSED` $\to$ `RETURN_TO_BASE`.
5. **Ràng buộc Thời gian & Khả năng Sống sót**:
   - `MissionMaxDurationRatio` = `3.0` (Thời gian thực tế tối đa không vượt quá 3 lần kế hoạch).
   - `MinimumContinueSurvivalChance` = `0.05` (Nếu cơ hội sống sót dưới 5% $\to$ chuyển giao thức hủy/quay về).
   - Hệ số thời gian hành quân (`RescueTravelTimeEffectRatio`): 0–3 ngày = 1.00; 4–7 ngày = 0.90; 8–14 ngày = 0.75; > 14 ngày = 0.50.

---

## G. Rescue Fleet & Personnel

1. **Cơ cấu Hạm đội**:
   - `CommandShipCount >= 1` (Small: 1, Medium: 2, Large: 3).
   - Ràng buộc hộ tống:
     ```text
     GearCount >= ceil(RescueShipCount × MinimumGearPerRescueShipRatio)
     ```
     với `MinimumGearPerRescueShipRatio = 1.5`.
2. **Quy trình Phê duyệt**:
   - Trạng thái chờ: `WAITING_COMMANDER_APPROVAL`.
   - Nếu quá hạn $\to$ tự động ủy quyền khẩn cấp cho Hội đồng Cứu hộ Liên Minh VSS (`VSS_RESCUE_COUNCIL`).
3. **Nhân sự Cứu hộ (`RescuePersonnelPool`)**:
   - Ràng buộc: `AllocatedPopulation <= NationalPopulation`.
   - Phân rã: `RescueCombatPersonnel`, `RescueSpecialistPersonnel`, `RescueMaintenancePersonnel`.

---

## H. Route Encounter & Repair

1. **Giao tranh Ngầm (Background Combat V2)**:
   - Mô phỏng chạy nền, không mở UI điều khiển trận đánh toàn màn hình.
   - **Bất biến đặc biệt**: `RouteRescueGearDestructionAllowed = false`. GEAR không bị tiêu diệt vĩnh viễn trong giao tranh cứu hộ; khi hết máu tự động rút lui về hangar Command Ship.
2. **Sửa chữa Dã chiến tại Trạm Kiểm soát**:
   - Tự động dùng `NanoRepairKit` trước.
   - Nếu chưa đạt ngưỡng sẵn sàng, dừng sửa chữa tại căn cứ (`HP/day`).
   - Ngưỡng xuất phát: Tuyến kế tiếp là `SAFE` cần $\ge 0.65$; `THREATENED` cần $\ge 0.85$; `CLOSED` không được xuất phát.

---

## I. NanoRepairKit, Loot & SRP

1. **Catalog Bộ Kit Sửa Chữa Nano**:
   - Class S = $1000\text{ HP}$ (Giá: $10\text{ SRP}$).
   - Class A = $800\text{ HP}$ (Giá: $8\text{ SRP}$).
   - Class B = $500\text{ HP}$ (Giá: $5\text{ SRP}$).
   - Class C = $300\text{ HP}$ (Giá: $3\text{ SRP}$).
2. **Tự động sử dụng**: Tự động chọn kit phù hợp để phục hồi tối đa mà giảm thiểu lãng phí (không trừ một phần vật tư).
3. **Chuỗi Nhặt Đồ Tuần Tự ($C \to B \to A \to S$)**:
   - `GlobalItemLootPercentBase = 0.20`, `GlobalItemLootMax = 10`.
   - Roll theo thứ tự từ thấp lên cao: $C \to B \to A \to S$.
   - **Thất bại ở bất kỳ lớp nào $\to$ DỪNG NGAY CHUỖI**; đạt trần 10 vật tư $\to$ DỪNG NGAY.
4. **Điểm Hậu Cần Cứu Hộ (`SRP`)**:
   - `BaseRescueOperationBudget` = `100 SRP`.
   - `RepairKitPricePer100HP` = `1 SRP / 100 HP`.
   - `RescueCenterSRPMax` = `1,000,000 SRP`.
   - `BaseRescueEventSuccessSRP` = `+1000`.
   - `SRPOverflowCreditExchangeRate` = `1 SRP = 1000 Credits`.
   - Khi hạm đội hoàn thành nhiệm vụ trở về: Thu hồi toàn bộ vật tư thừa $\to$ quy đổi sang SRP $\to$ phần tràn trần 1,000,000 SRP đổi ra Credits chuyển vào ngân sách. **Không lưu kho vật tư vĩnh viễn sau chiến dịch.**

---

## J. UI Architecture

```text
National HUB (global-operations-hub.tsx)
    │
    ▼ [VSS Rescue Operations Summary Widget]
    │   - Active Operations, Available Fleets, SRP, Alerts
    │   - Button: "Open Rescue Center"
    │
    ▼
VSS Rescue Center (components/game/world/rescue-center/)
    ├─ OVERVIEW: Tổng quan năng lực SAR toàn quốc
    ├─ OPERATIONS: Danh sách chiến dịch & Chi tiết lộ trình/ETA/Log
    ├─ FLEETS: Roster tàu chỉ huy, tàu cứu hộ, phi đội hộ tống
    ├─ PERSONNEL: Báo cáo nhân sự 3 nhóm chuyên trách
    ├─ SUPPLY / SRP: Ngân sách SRP, kho vật tư dã chiến, tỷ lệ quy đổi
    └─ HISTORY: Nhật ký chiến dịch đã hoàn tất & giải quyết tù binh
```

---

## K. Implementation Phase Breakdown (Phân Kỳ Triển Khai)

### Phase 6.34B — Core Survival, Protection & FATAL
- **Mục tiêu**: Chuẩn hóa công thức sinh tồn, tách biệt hiệu quả chiến thuật, tích hợp an ninh Sector, bổ sung năng lực che chở, thay đổi phân loại `KIA` $\to$ `FATAL`.
- **Tập tin sửa đổi**:
  - `lib/game/world/pilot-survival-types.ts`
  - `lib/game/world/pilot-survival-engine.ts`
  - `lib/game/world/initial-state.ts`
  - `lib/game/world/storage.ts`
  - `tests/world/phase-6-34-pilot-survival.test.ts`
- **Output tài liệu**: `docs/PHASE_6_34B_CORE_SURVIVAL.md`.

### Phase 6.34C — POW Decoupling & MISSING Search
- **Mục tiêu**: Gỡ bỏ auto-raid khi bị bắt, quản lý Sổ bộ Tù binh sạch, móc nối giá chuộc, triển khai chuỗi tìm kiếm mất tích (`LARGE` / `STANDARD`), giới hạn 3 lần và cửa sổ chờ 30 ngày.
- **Tập tin sửa đổi**:
  - `lib/game/world/pilot-survival-engine.ts`
  - `lib/game/world/mission-dispatch.ts`
  - `lib/game/world/initial-state.ts`
  - `tests/world/phase-6-34a-missing-pow.test.ts` (Tạo mới)
- **Output tài liệu**: `docs/PHASE_6_34C_POW_MISSING.md`.

### Phase 6.34D — Rescue Fleet, Personnel & Base Selection
- **Mục tiêu**: Định nghĩa schema hạm đội cứu hộ, thuật toán tìm căn cứ cứu hộ gần nhất qua Dijkstra, suy giảm 0.10/cạnh, ràng buộc lực lượng ($1.5$ GEAR / Rescue Ship) và quy trình phê duyệt Chỉ huy / Hội đồng VSS.
- **Tập tin sửa đổi/tạo mới**:
  - `lib/game/world/types.ts`
  - `lib/game/world/rescue-operations-types.ts` (Tạo mới)
  - `lib/game/world/rescue-operations-engine.ts` (Tạo mới)
  - `tests/world/phase-6-34a-rescue-operations.test.ts` (Tạo mới)
- **Output tài liệu**: `docs/PHASE_6_34D_FLEET_BASE.md`.

### Phase 6.34E — Route Navigation, Encounters & Checkpoint Repair
- **Mục tiêu**: Động cơ hành quân chặng đường, tái đánh giá tại trạm kiểm soát, cơ chế thử lại khi đường đóng, giao tranh ngầm Combat V2 (cấm hủy GEAR vĩnh viễn), dừng sửa chữa dã chiến theo ngưỡng sẵn sàng (SAFE: 65%, THREATENED: 85%).
- **Tập tin sửa đổi**:
  - `lib/game/world/rescue-operations-engine.ts`
  - `lib/game/world/combat-v2-engine.ts`
  - `tests/world/phase-6-34a-rescue-operations.test.ts`
- **Output tài liệu**: `docs/PHASE_6_34E_ROUTE_COMBAT_REPAIR.md`.

### Phase 6.34F — Nano Repair Items, Loot & SRP
- **Mục tiêu**: Quản lý catalog `NanoRepairKit` (S/A/B/C), thuật toán tự dùng chống lãng phí, chuỗi nhặt đồ tuần tự, ngân sách SRP, thu hồi vật tư quy đổi SRP, trần trữ lượng 1M và cơ chế tràn đổi sang Credits.
- **Tập tin sửa đổi/tạo mới**:
  - `lib/game/world/repair-items-engine.ts` (Tạo mới)
  - `lib/game/world/rescue-operations-engine.ts`
  - `tests/world/phase-6-34a-items-srp.test.ts` (Tạo mới)
- **Output tài liệu**: `docs/PHASE_6_34F_ITEMS_SRP.md`.

### Phase 6.34G — National HUB, Rescue Center & AdminCP UX
- **Mục tiêu**: Hoàn thiện toàn bộ giao diện: Widget tóm tắt cứu hộ tại National HUB, Trung tâm Cứu hộ Liên Minh VSS hoàn chỉnh, bảng báo cáo thương vong toàn trận, tái cấu trúc Tab 5 AdminCP thành 4 nhóm thiết lập.
- **Tập tin sửa đổi/tạo mới**:
  - `components/game/world/global-operations-hub.tsx`
  - `components/game/world/combat-v2/combat-v2-dashboard.tsx`
  - `components/game/world/admin-settings-modal.tsx`
  - `components/game/world/rescue-center/` (Tạo mới module UI)
- **Output tài liệu**: `docs/PHASE_6_34G_UI_ADMINCP.md`.

---

## L. Dependency Order

```text
Phase 6.34B (Core Survival, Protection & FATAL)
       │
       ▼
Phase 6.34C (POW Decoupling & MISSING Search)
       │
       ▼
Phase 6.34D (Rescue Fleet, Personnel & Base Selection)
       │
       ▼
Phase 6.34E (Route Navigation, Encounters & Checkpoint Repair)
       │
       ▼
Phase 6.34F (Nano Repair Items, Loot & SRP)
       │
       ▼
Phase 6.34G (National HUB, Rescue Center & AdminCP UX)
       │
       ▼
Phase 6.35 (GEAR Logistics, Repair & Pilot Recovery — KHÔNG BẮT ĐẦU)
```

---

## M. Unresolved User Decisions (Cần Phê Duyệt Trước / Trong Phân Kỳ Tương Ứng)

1. **`GearAdvantageBase`**: Điểm sức mạnh cơ sở trên mỗi GEAR trong `GearArmyAdvantagePoint`.  
   *Cần chốt*: **Trước hoặc trong Phase 6.34B**. (Khuyến nghị: 10 hoặc 50 điểm).
2. **`Rescue Ship / Command Ship Detailed Stats`**: Lượng máu HP, buồng bệnh, tốc độ hành quân.  
   *Cần chốt*: **Trước hoặc trong Phase 6.34D**.
3. **`RescuePersonnelPool Allocation Cap`**: Tỷ lệ trích xuất nhân sự tối đa từ quân đội sang lực lượng cứu hộ.  
   *Cần chốt*: **Trước hoặc trong Phase 6.34D**.
4. **`SAFE & THREATENED Route Encounter Chance`**: Tỷ lệ chạm trán ngầm mặc định (Khuyến nghị: 10% cho SAFE, 30% cho THREATENED).  
   *Cần chốt*: **Trước hoặc trong Phase 6.34E**.
5. **`BaseRescueEventFailureSRP`**: Mức phạt SRP cơ sở khi chiến dịch thất bại (Khuyến nghị: -1500 hoặc -2000 SRP).  
   *Cần chốt*: **Trước hoặc trong Phase 6.34F**.
6. **`Rescue Threat Budget Scaling`**: Bảng bước nhảy SRP nhân theo độ nguy hiểm tuyến đường.  
   *Cần chốt*: **Trước hoặc trong Phase 6.34F**.

---

## N. Documentation Strategy Cho Các Phase Sau

- Mỗi implementation phase từ 6.34B đến 6.34G phải xuất ra đúng 1 file markdown cô đọng:
  `docs/PHASE_6_34B_CORE_SURVIVAL.md`, `docs/PHASE_6_34C_POW_MISSING.md`, v.v.
- Các tài liệu chuẩn hóa tương lai (`docs/WORLD_PILOT_SURVIVAL_RESCUE.md`, `docs/WORLD_RESCUE_OPERATIONS.md`, `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md`) sẽ được cập nhật đồng bộ tại Phase 6.34G hoặc khi hoàn tất toàn bộ chuỗi 6.34B–6.34G.
