# STARFRONT WORLD — AdminCP Configuration Reference & Balancing Registry

Status: DESIGN SOURCE OF TRUTH
Related Phases: 6.32, 6.33, 6.35, 6.36, 6.37, 6.38, 6.39, 6.40, 6.45

## Read With
- ../WORLD_ROADMAP_6_32_6_45.md
- WORLD_SYSTEM_INVARIANTS.md
- WORLD_COMBAT_V2_DESIGN.md

## Scope
This document serves as the authoritative configuration registry for STARFRONT WORLD.
All configurable parameters across combat, personnel, repair, economy, and simulation are declared here.
It distinguishes between APPROVED DEFAULT, CONCEPTUAL EXAMPLE, and UNRESOLVED DESIGN.

---

## 1. Combat V2 Configuration (`combatV2Config`)

| Configuration Key | Type | Default Value | Status | Purpose / Rule |
| :--- | :--- | :--- | :--- | :--- |
| `defaultRetreatDurationRounds` | `number` | `1` | **APPROVED DEFAULT** | Number of completed combat rounds a unit spends in `RETREATING` before transitioning to `RETREATED`. Explicitly approved design default. |
| `maxCombatRounds` | `number` | `30` | **TECHNICAL SAFETY DEFAULT** | Engine loop safety guard preventing infinite simulation. NOT a canonical gameplay rule or battle design limit. |
| `retreatOffenseReductionRatio` | `number` | `1.0` | **TEMPORARY TECHNICAL DEFAULT** | Temporary technical placeholder (1.0 = 100% suppression). Exact gameplay balance percentage remains unresolved and configurable. |
| `retreatDefenseRetentionRatio` | `number` | `1.0` | **TEMPORARY TECHNICAL DEFAULT** | Temporary technical placeholder (1.0 = 100% retention). Exact gameplay balance percentage remains unresolved and configurable. |
| `defaultMoraleValue` | `number` | `100` | **UNRESOLVED CONFIG DEFAULT** | Temporary baseline rating required for engine/tests. NOT yet approved as canonical gameplay balance. |
| `moraleThresholdPanic` | `number` | `30` | **CONCEPTUAL EXAMPLE** | Conceptual non-approved example threshold below which NPC units evaluate automated tactical withdrawal. |
| `npcRetreatHpRatioThreshold` | `number` | `0.25` | **TEMPORARY TECHNICAL DEFAULT** | Temporary threshold (25% max HP) below which NPC units evaluate automated tactical withdrawal when in morale panic. |
| `supportedFactions` | `string[]` | `["vss", "void"]`| **APPROVED DEFAULT** | Faction keys participating in Combat V2 engagements. |

---

## 2. Pilot Survival & Rescue Configuration (`survivalConfig`)

| Configuration Key | Type | Default Value | Status | Purpose / Rule |
| :--- | :--- | :--- | :--- | :--- |
| `thresholdSafe` | `number` | `70` | **APPROVED DEFAULT** | Score $\ge 70$ yields `SAFE` tier. |
| `thresholdProtected` | `number` | `50` | **APPROVED DEFAULT** | Score $50 - 69$ yields `PROTECTED` tier. |
| `thresholdCritical` | `number` | `30` | **APPROVED DEFAULT** | Score $30 - 49$ yields `CRITICAL` tier. Below 30 yields `KIA`. |
| `baseRescueChance` | `number` | `0.30` | **CONCEPTUAL EXAMPLE** | Baseline probability (30%) of friendly extraction. |
| `baseCaptureChance` | `number` | `0.40` | **CONCEPTUAL EXAMPLE** | Baseline probability (40%) of enemy capture. |
| `facilityRescuePowerBonusPerTier` | `number` | `0.10` | **CONCEPTUAL EXAMPLE** | Additional rescue probability per facility tier. |

---

## 3. GEAR Logistics, Procurement & Repair Configuration (`repairConfig`)

| Configuration Key | Type | Default Value | Status | Purpose / Rule |
| :--- | :--- | :--- | :--- | :--- |
| `baseGearPriceCredits` | `number` | `10000` | **APPROVED DEFAULT** | Baseline credit cost to procure replacement GEAR chassis. |
| `pilotRecoveryTotalDays` | `number` | `10` | **APPROVED DEFAULT** | Sequential days for psychological recovery (3d) + procurement (2d) + familiarization (5d). |
| `repairNormalizationUnit` | `string` | `"HP_PER_DAY"` | **APPROVED DEFAULT** | Mandatory metric for all strategic repair. |
| `baseInstallationRepairHpDay`| `number` | `100` | **APPROVED DEFAULT** | Local facility baseline daily repair throughput. |
| `globalTechGroupSize` | `number` | `100` | **CONCEPTUAL EXAMPLE** | Number of national technicians required per bonus tier. |
| `globalTechBonusHpDay` | `number` | `50` | **CONCEPTUAL EXAMPLE** | $+50$ HP/day per global technician group. |
| `localTechGroupSize` | `number` | `100` | **CONCEPTUAL EXAMPLE** | Number of local technicians required per bonus tier. |
| `localTechBonusHpDay` | `number` | `20` | **CONCEPTUAL EXAMPLE** | $+20$ HP/day per local technician group. |
| `distanceDecayMode` | `"FIXED" \| "BASE_RATIO"` | `"BASE_RATIO"` | **APPROVED DEFAULT** | Method of attenuating global repair contribution over hyperlanes. |
| `distanceDecayRatePerHop` | `number` | `0.20` | **CONCEPTUAL EXAMPLE** | 20% loss per hyperlane hop; clamped at $\ge 0$. |

---

## 4. National Personnel Pools & Training Configuration (`personnelConfig`)

| Configuration Key | Type | Default Value | Status | Purpose / Rule |
| :--- | :--- | :--- | :--- | :--- |
| `regularForcesInitialMax` | `number` | `1000000` | **APPROVED DEFAULT** | Regular Forces initial maximum ceiling. |
| `regularForcesAnnualGrowth`| `number` | `100000` | **APPROVED DEFAULT** | Regular Forces annual capacity growth (+100k/yr). |
| `auxiliaryForcesInitialMax`| `number` | `200000` | **APPROVED DEFAULT** | Auxiliary Forces initial maximum ceiling. |
| `auxiliaryForcesAnnualGrowth`| `number` | `20000` | **APPROVED DEFAULT** | Auxiliary Forces annual capacity growth (+20k/yr). |
| `logisticsWorkforceInitialMax`| `number`| `100000` | **APPROVED DEFAULT** | Logistics Workforce initial maximum ceiling. |
| `logisticsWorkforceAnnualGrowth`| `number`| `10000` | **APPROVED DEFAULT** | Logistics Workforce annual capacity growth (+10k/yr). |
| `capacityGrowthInterval` | `"DAY" \| "MONTH" \| "YEAR"` | `"YEAR"` | **APPROVED DEFAULT** | Cadence for pool capacity expansion evaluations. |
| `trainingCapPolicy` | `string` | `"FINISH_CURRENT"` | **APPROVED DEFAULT** | Enrolled cohorts finish curricula; new enrollment pauses at projected cap. |
| `freeskaAcademyCapacity` | `number` | `100000` | **APPROVED DEFAULT** | FREESKA Officer Academy maximum cadet capacity. |
| `freeskaProgramDurationYears` | `number` | `5` | **APPROVED DEFAULT** | Standard 5-year curriculum duration. |
| `technicalVocationalDurationYears` | `number` | `5` | **APPROVED DEFAULT** | Standard 5-year technical apprenticeship duration. |

---

## 5. National Economy & Tax Configuration (`economyConfig`)

| Configuration Key | Type | Default Value | Status | Purpose / Rule |
| :--- | :--- | :--- | :--- | :--- |
| `regularPersonnelUpkeepCoeff` | `number` | `2.0` | **APPROVED DEFAULT** | Credits per active regular soldier per cycle. |
| `auxiliaryPersonnelUpkeepCoeff` | `number` | `1.0` | **APPROVED DEFAULT** | Credits per active auxiliary soldier per cycle. |
| `logisticsPersonnelUpkeepCoeff` | `number` | `0.5` | **APPROVED DEFAULT** | Credits per active logistics technician per cycle. |
| `taxCycleIntervalValue` | `number` | `1` | **APPROVED DEFAULT** | Fiscal assessment cycle value. |
| `taxCycleIntervalUnit` | `"DAY" \| "MONTH" \| "YEAR"` | `"YEAR"` | **APPROVED DEFAULT** | Standard annual tax assessment cycle. |
| `shortTaxCycleTestingDays` | `number` | `2` | **APPROVED DEFAULT** | Rapid testing cycle interval (2 days). |

---

## 6. Strategic Threat & HP-Based Formula Configuration (`threatConfig`) — Phase 6.33_FIX4

| Configuration Key | Type | Default Value | Status | Purpose / Rule |
| :--- | :--- | :--- | :--- | :--- |
| `hpPerThreatPoint` | `number` | `100` | **APPROVED DEFAULT** | Number of total battle HP equivalent to 1 Threat Point (100 HP = 1 Threat). |
| `winnerRatio` | `number` | `2` | **APPROVED DEFAULT** | Weighting coefficient applied to winning side's total effective HP (`WinnerCurrentHP + WinnerMaxHP`). |
| `maxThreatHQ` | `number` | `100000000` | **APPROVED DEFAULT** | Maximum Threat ceiling for Headquarters sectors / origin bases (`100,000,000`). |
| `maxThreatStandard` | `number` | `1000000` | **APPROVED DEFAULT** | Maximum Threat ceiling for Standard sectors / secondary bases (`1,000,000`). |

### Canonical HP-Based Threat Formula

All encounters with combat results calculate threat consequences via one authoritative formula:

```text
ThreatChange =
floor(
    (
        (WinnerCurrentHP + WinnerMaxHP) * WinnerRatio
        + LoserMaxHP
    )
    / HPPerThreatPoint
)
```

- **Friendly Victory**: `NewThreat = max(0, CurrentThreat - ThreatChange)`
- **Enemy Victory / Defeat**: `NewThreat = min(SectorMaxThreat, CurrentThreat + ThreatChange)`
- **Rounding**: `Math.floor(...)` strictly enforced (no round, no ceil).
- **Lower Max Warning**: Reducing Max Threat below any sector's Current Threat requires warning modal; confirmation triggers WORLD Year-1 reset while preserving RPG save data and UI preferences.

---

## 7. Cấu Hình Công Trình & Sản Xuất (`buildingProductionConfig`) — Phase 6.34A-FND-5

| Biến Cấu Hình AdminCP | Tên Tiếng Việt | Mô Tả Dễ Hiểu | Đơn Vị | Giá Trị Mặc Định | Giới Hạn Hợp Lệ | Kiểm Tra Hợp Lệ (Validation) | Cảnh Báo Ảnh Hưởng Khi Thay Đổi |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `maxExpansionSlotsCapital` | Trần Slot Mở Rộng Thủ Phủ | Số lượng công trình mở rộng tối đa mà Thủ Phủ có thể chứa ở Tier I. | Slot | `8` | `[4..32]` | Số nguyên dương, không được nhỏ hơn số công trình hiện có. | Tăng sẽ cho phép xây thêm nhiều công trình; giảm đột ngột dưới mức đã xây có thể khiến công trình bị đình chỉ vận hành. |
| `maxExpansionSlotsStandard` | Trần Slot Căn Cứ Tiêu Chuẩn | Số lượng công trình mở rộng tối đa mà Căn Cứ tiêu chuẩn có thể chứa ở Tier I. | Slot | `6` | `[2..24]` | Số nguyên dương $\le$ trần của Thủ Phủ. | Ảnh hưởng tới quy mô các đồn tiền tiêu và trạm khai khoáng. |
| `maxTierStepBonusDefault` | Điểm Thưởng Slot Cấp MK X | Số lượng slot đa năng được cộng thêm một lần duy nhất khi đạt MK X (Tier 10). | Slot | `1` | `[0..5]` | Số nguyên $\ge 0$. | Tăng sẽ kích thích thăng cấp lên MK X; áp dụng lũy đẳng không cộng trùng khi nạp save. |
| `maintenanceAutoThresholdCondition` | Ngưỡng Tự Động Bảo Trì Condition | Tỷ lệ Tình Trạng Kỹ Thuật (Condition) kích hoạt chế độ bảo dưỡng tự động AUTO. | Tỷ lệ | `0.80` (80%) | `[0.10..0.95]` | Số thực trong khoảng [0.1..0.95]. | Đặt quá cao sẽ gây lãng phí tài nguyên bảo dưỡng liên tục; đặt quá thấp khiến nguy cơ hỏng hóc cao. |
| `maintenanceEmergencyThresholdHp` | Ngưỡng Sửa Chữa Khẩn Cấp HP | Tỷ lệ HP hoặc Condition kích hoạt sửa chữa cưỡng chế ở chế độ EMERGENCY. | Tỷ lệ | `0.25` (25%) | `[0.05..0.50]` | Số thực trong khoảng [0.05..0.5]. | Khi vượt qua ngưỡng này, hệ thống cảnh báo đỏ và trích lập vật tư cứu hộ khẩn cấp. |
| `productionCycleMinDays` | Chu Kỳ Tác Chế Tối Thiểu | Số ngày game tối thiểu cần thiết để hoàn thành 1 lô sản xuất. | GAME_DAY | `1` | `[1..30]` | Số nguyên $\ge 1$. | Đặt dưới 1 ngày sẽ vi phạm nguyên tắc mô phỏng theo ngày game (GAME_DAY). |
| `outputBlockedPolicy` | Chính Sách Khi Đầy Kho Sản Phẩm | Hành vi dây chuyền khi kho đích không còn chỗ tiếp nhận thành phẩm. | Enum | `"OUTPUT_BLOCKED"` | `"OUTPUT_BLOCKED" \| "DISCARD_SURPLUS"` | Bắt buộc là giá trị enum hợp lệ. | Mặc định giữ nguyên thành phẩm và tạm dừng chu kỳ cho tới khi kho được giải phóng; chọn DISCARD sẽ làm mất nguyên liệu. |
| `historyMaxDetailedEvents` | Trần Lưu Sự Kiện Chi Tiết | Số lượng sự kiện lịch sử đầy đủ tối đa được lưu trữ trước khi kích hoạt nén (compaction). | Sự kiện | `50` | `[10..500]` | Số nguyên dương. | Giúp bảo vệ dung lượng bộ nhớ `localStorage` không bị tràn khi chơi phiên dài hàng nghìn ngày. |

