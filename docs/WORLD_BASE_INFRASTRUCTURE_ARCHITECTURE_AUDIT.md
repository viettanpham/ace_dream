# BÁO CÁO KIỂM TRA KIẾN TRÚC & PHÂN TÍCH HIỆN TRẠNG HẠ TẦNG CĂN CỨ
# STARFRONT WORLD — BASE, FACILITY, REPAIR CAPACITY & WORKFORCE AUDIT

> **TÀI LIỆU KIỂM TRA KIẾN TRÚC VÀ ĐỐI CHIẾU MÃ NGUỒN (INSPECTION / ARCHITECTURE REVIEW ONLY)**  
> **Phiên làm việc:** Kiểm tra hiện trạng hệ thống Base, Building, Repair HP/day, Workforce, Fleet/Garrison, Economy và Lưu trữ.  
> **Nguyên tắc:** KHÔNG triển khai gameplay formula mới, KHÔNG sửa đổi production runtime code, KHÔNG tự ý suy diễn các chỉ số gameplay/balance chưa được phê duyệt.

---

## 1. TỔNG QUAN HIỆN TRẠNG VÀ PHẠM VI KIỂM TRA (EXECUTIVE SUMMARY)

Hệ thống STARFRONT hiện tồn tại **hai tầng kiến trúc song song**:
1. **Tầng Trò Chơi Kế Thừa (Core / Legacy Game)** (`lib/game/`): Quản lý căn cứ tổng hành dinh của người chơi (Player Base) với 13 loại công trình (`command`, `hangar`, `factory`, v.v.), 6 phân khu dân cư (`DistrictKey`), các chỉ số kinh tế `credits`, `alloy`, `crystal`, và hồi phục HP cơ giáp cá nhân (`hangarRepairPerDay`, `districtBonus.repairHp`, `REPAIR_CREDIT_PER_HP`).
2. **Tầng Chiến Lược Thiên Hà (STARFRONT WORLD)** (`lib/game/world/`): Quản lý 8-10 Sector không gian (`WorldSector`), mạng lưới siêu không gian (`WorldRoute`), sổ cái lực lượng quân sự bảo toàn bảo vệ quân số (`MilitaryForceLedger`), 5 tài nguyên vĩ mô (`WorldResourceLedger`), hệ thống nhân khẩu học (`DemographicsState`), và máy trạng thái vòng đời Sector 5 giai đoạn (`SectorStage`).

### Bảng đối chiếu hiện trạng giữa 2 tầng kiến trúc:

| Hạng mục kiến trúc | Tầng Core / Legacy Game (`lib/game/`) | Tầng Thiên Hà STARFRONT WORLD (`lib/game/world/`) | Trạng thái hiện tại |
| :--- | :--- | :--- | :--- |
| **Mô hình Base / Sector** | Căn cứ duy nhất của người chơi (`state.buildings`, `state.districts`) | 8-10 Sectors thiên hà (`WorldSector` trong `WorldState.sectors`) | **Phân tách hoàn toàn**. Sector chưa có danh sách Base con hay Facility con. |
| **Công trình / Facility** | 13 loại Building (Cấp 1–30, nâng tức thì) | Chỉ có `fortificationLevel?: number` (Cấp công sự 1–10) | **Chưa có Facility list trong Sector**. |
| **Chỉ số Repair HP/day** | `hangarRepairPerDay` (8% + 5%/Lv Hangar) + Flat HP từ Phân khu Sửa chữa | Đang dùng `forces-ledger.ts` hồi phục 5% quân `woundedOrRepair`/ngày; `BaseInstallationRepairHpDay` mới chỉ nằm trong tài liệu đặc tả `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md` | **Chưa triển khai vào runtime code WORLD**. |
| **Nhân lực / Kỹ thuật** | % Phân bổ dân số vào Phân khu Sửa chữa (100 dân = 1.000 HP/ngày) | `DemographicsState` chỉ đếm 4 số vĩ mô; spec 3 pools (Regular, Auxiliary, Logistics) mới nằm ở `docs/WORLD_NATIONAL_PERSONNEL_TRAINING.md` | **Chưa có pool Technical Worker / Logistics Worker trong runtime**. |
| **Hạm đội / Đồn trú** | Danh sách GEAR cá nhân của người chơi (`state.gears`) | Chỉ có con số `garrisonPower: number` và các đoàn quân hành quân `TroopDeployment` | **Chưa có object Hạm đội / Garrison chi tiết tại căn cứ**. |
| **Kinh tế & Kho trữ** | `credits`, `alloy`, `crystal`, `energy` | `industrialMaterials`, `energy`, `logisticsSupplies`, `tacticalData`, `food` | **Không có Credit trong WORLD; Kho trữ chưa có giới hạn dung tích (Cap)**. |
| **Kẻ thù chiếm đóng & AI** | Chiếm Sector tăng quân số; không có AI xây dựng | 5 Stages (`normal` -> `threatened` -> `under_siege` -> `lost` -> `recovery`); Void AI chỉ tăng Threat qua `threat-ai.ts` | **Kẻ thù không có cơ chế xây hoặc nâng cấp căn cứ**. |

---

## 2. AUDIT CHI TIẾT CÔNG THỨC REPAIR HIỆN TẠI (REPAIR HP/DAY AUDIT)

### 2.1. Vị trí của `BaseInstallationRepairHpDay`
- **Nơi khai báo:** Xuất hiện **duy nhất** tại dòng 53 của tài liệu đặc tả:
  `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md`:
  ```markdown
  | `baseInstallationRepairHpDay` | `number` | `100` | **APPROVED DEFAULT** | Local facility baseline daily repair throughput. |
  ```
- **Hiện trạng trong mã nguồn runtime:**
  - **CHƯA ĐƯỢC KHAI BÁO** trong bất kỳ file TypeScript nào (`lib/game/world/types.ts`, `lib/game/world/simulator-config.ts`, `lib/game/world/initial-state.ts`).
  - **CHƯA ĐƯỢC TÍCH HỢP** vào giao diện cấu hình quản trị AdminCP (`components/game/world/admin-settings-modal.tsx`).
  - **CHƯA ĐƯỢC KẾT NỐI** với bất kỳ hệ số nhân sự (personnel) hay cơ sở hạ tầng (facility) nào.

### 2.2. Cơ chế phục hồi / sửa chữa hiện có trong mã nguồn

#### A. Trong STARFRONT WORLD (`lib/game/world/`):
- **Cơ chế:** Phục hồi quân bị thương / sửa chữa cơ giáp theo **quân số (headcount)** tại `lib/game/world/forces-ledger.ts`:
  ```ts
  export const RECOVERY_RATE_BASE = 0.05 // 5% mỗi ngày chiến lược
  export const MIN_DAILY_RECOVERY = 10   // Tối thiểu 10 đơn vị quân nếu còn tồn dư

  export function recoverWoundedForces(
    military: MilitaryForceLedger,
    recoveryRate: number = RECOVERY_RATE_BASE
  ): { recovered: number; military: MilitaryForceLedger }
  ```
- **Cách thức hoạt động:** Khi mỗi ngày trôi qua (`tick-engine.ts`), hệ thống lấy 5% số lượng trong `military.woundedOrRepair` chuyển sang `military.reserves`.
- **Đặc điểm:** Không tính toán theo điểm máu (HP), không tiêu hao tài nguyên vật tư sửa chữa, không phụ thuộc vào vị trí địa lý của Sector hay cơ sở vật chất của căn cứ.

#### B. Trong Core / Legacy Game (`lib/game/`):
- **Hồi phục tự nhiên qua ngày mới (`store.tsx` dòng 184–188):**
  ```ts
  const repairFrac = hangarRepairPerDay(state.buildings)
  // repairFrac = 0.08 + buildings.hangar * 0.05 (fraction của MaxHP)
  const repairFlat = districtBonus(state.population, state.districts).repairHp
  // repairFlat = (population * districtPercent / 100) / 100 * 1000 HP
  hpCurrent = Math.min(maxHp, g.hpCurrent + Math.round(maxHp * repairFrac) + repairFlat)
  ```
- **Sửa chữa khẩn cấp bằng Credits (`store.tsx` dòng 225, `fleet-panel.tsx` dòng 222):**
  ```ts
  const REPAIR_CREDIT_PER_HP = 0.4 // 0.4 Credits cho mỗi 1 HP bị thiếu hụt
  const cost = { credits: Math.ceil(missingHp * REPAIR_CREDIT_PER_HP) }
  ```

### 2.3. Đánh giá khoảng cách với Thiết Kế Mục Tiêu (Design Target)
Thiết kế mục tiêu đã được phê duyệt quy định:
```text
BaseInstallationRepairHpDay =
    FacilityRepairCapacityPerDay
    + WorkerRepairCapacityPerDay

WorkerRepairCapacityPerDay =
    ActiveTechnicalWorkers
    * TechnicalWorkerRepairHPPerDay
```
- **Hiện trạng:** Hoàn toàn **chưa có code**. Hiện tại chưa có biến `FacilityRepairCapacityPerDay`, chưa có `ActiveTechnicalWorkers`, và chưa có `TechnicalWorkerRepairHPPerDay`.
- **Rủi ro nếu triển khai không đúng quy chuẩn:** Dễ bị nhầm lẫn giữa việc sửa chữa quân số (`woundedOrRepair` headcount) của World State với việc sửa điểm máu (HP) của phi đội GEAR.

---

## 3. AUDIT LỰC LƯỢNG NHÂN SỰ & KỸ THUẬT (WORKFORCE & PERSONNEL AUDIT)

### 3.1. Dữ liệu nhân khẩu học hiện tại trong WORLD
File: `lib/game/world/demographics.ts` và `lib/game/world/types.ts`:
```ts
export interface DemographicsState {
  nationalTotalPopulation: number       // Tổng dân số liên minh VSS
  controlledTerritoryPopulation: number // Dân số hiện trong các sector do VSS kiểm soát
  refugeesInTransit: number             // Dân sự đang sơ tán / di cư an toàn
  civilianCasualties: number            // Thương vong dân sự tích lũy
}
```
- **Nhận xét:**
  - `DemographicsState` hiện tại chỉ ghi nhận 4 biến số vĩ mô thuần túy về số lượng cư dân.
  - **KHÔNG CÓ** phân tầng chức nghiệp: Không có trường dữ liệu nào cho `Logistics`, `Technical`, `Repair`, hay `Maintenance`.
  - Toàn bộ dân số trong sector chỉ đóng vai trò là cơ sở để tính mức tiêu thụ lương thực (`calculateDailyFoodConsumption`) và tạo ra năng lực công nghiệp vĩ mô.

### 3.2. Đối chiếu với Tài liệu Đặc tả Nhân sự Quốc gia
Tài liệu `docs/WORLD_NATIONAL_PERSONNEL_TRAINING.md` (Design Source of Truth cho Phase 6.36–6.38) quy định 3 nhóm nhân lực:
1. **Regular Forces (Quân đội thường trực):** Ban đầu tối đa 1.000.000, tăng trưởng +100.000/năm.
2. **Auxiliary Forces (Lực lượng bổ trợ / Dự bị):** Ban đầu tối đa 200.000, tăng trưởng +20.000/năm.
3. **Logistics Workforce (Lực lượng kỹ thuật / Hậu cần):** Kỹ thuật viên sửa chữa, thợ máy, chuyên gia bảo trì. Ban đầu tối đa 100.000, tăng trưởng +10.000/năm.
- **Tình trạng mã nguồn:** Cả 3 pool này **hoàn toàn chưa có trong runtime state**.
- **Chỉ số năng suất cá nhân (HP/person/day):**
  - Trong Core Game: Tương đương 10 HP/người/ngày (100 dân phân khu sửa chữa đem lại 1.000 HP/ngày).
  - Trong WORLD: **Chưa có biến `TechnicalWorkerRepairHPPerDay`**.
- **Hệ thống Đào tạo & Điều động (Training / Graduation / Allocation):**
  - Chưa có cơ chế đào tạo FREESKA (5 năm) hay NEWHORIZON (53 ngày) trong code.
  - Chưa có khái niệm Unassigned / Available Technical Workers.

---

## 4. AUDIT CĂN CỨ, CÔNG TRÌNH & CƠ SỞ VẬT CHẤT (BASE & BUILDING AUDIT)

### 4.1. Cấu trúc Sector hiện tại trong WORLD
File: `lib/game/world/types.ts` (`WorldSector`):
- Các thuộc tính hiện có:
  - `id, name, subtitle, desc, x, y`
  - `sovereignty`: `"vss" | "void" | "contested" | "neutral"`
  - `threatLevel`, `maxThreat`, `classification` (`"headquarters" | "standard"`)
  - `stage`: `"normal" | "threatened" | "under_siege" | "lost" | "recovery"`
  - `industryCapacity: number`
  - `garrisonPower: number`
  - `resources: WorldResourceLedger`
  - `population: number`
  - `stability: number`
  - `fortificationLevel?: number` (Cấp công sự)
  - `threatHistory?: SectorThreatHistoryPoint[]`
- **Điểm khuyết thiếu:**
  - **Không có danh sách công trình (Building list / Facility list).**
  - Không có chỉ số HP cho công trình.
  - Không có tiến trình hẹn giờ xây dựng hoặc nâng cấp (Construction / Upgrade Timer). Mọi nâng cấp (nếu có sau này) hiện chưa có hàng đợi hay timer.
  - Không có phân bổ nhân sự làm việc tại từng công trình.

### 4.2. Khả năng của kẻ thù (Enemy AI Rebuilding & Upgrades)
- File: `lib/game/world/threat-ai.ts`:
  - Trí tuệ nhân tạo của The Void hiện tại chỉ thực hiện các thao tác:
    1. Tăng mức độ đe dọa (`threatLevel`) theo ngày dựa trên khoảng cách đồ thị đến sào huyệt Tartarus Breach.
    2. Kích hoạt trạng thái vây hãm (`under_siege`) khi Threat vượt ngưỡng.
  - **Kẻ thù KHÔNG CÓ cơ chế xây dựng, chiếm đoạt cơ sở hay nâng cấp công trình.** Khi chiếm được một Sector (`stage = "lost"`), toàn bộ hoạt động kinh tế của sector đó bị đóng băng (`calculateEffectiveSectorIndustry` trả về 0).

---

## 5. AUDIT HẠM ĐỘI & LỰC LƯỢNG ĐỒN TRÚ (FLEET & GARRISON AUDIT)

### 5.1. Dữ liệu đồn trú hiện tại
- Tại từng Sector: Chỉ lưu một trường số nguyên duy nhất là `sector.garrisonPower: number` (và `lockedGarrisonPower?: number` khi giao tranh bị khóa).
- Toàn cục: `worldState.military` (`deployed`, `reserves`, `woundedOrRepair`, `retreating`, `casualties`).

### 5.2. Hoạt động di chuyển quân lực
- Danh sách hành quân: `worldState.activeDeployments: TroopDeployment[]`:
  - Lưu trữ: `deploymentId`, `fromSectorId`, `toSectorId`, `troopCount`, `order`, `path`, `totalDistance`, `remainingDays`, `status`.
- Giao diện `SectorIntelModal` (Tab Operations):
  - Đã hiển thị danh sách `incomingDeployments` (quân đang đến) và `outgoingDeployments` (quân đang rời đi) dựa trên mảng `activeDeployments`.
  - Đã hiển thị danh sách các sự kiện (`sectorEvents`) đang kích hoạt tại Sector.

### 5.3. Khoảng cách dữ liệu để hiển thị Base Detail đầy đủ
Để sau này màn hình **Base Detail** có thể hiển thị danh sách Hạm đội / Đồn trú hoàn chỉnh:
- **Tên Fleet / Đơn vị:** Hiện **chưa có** (hiện chỉ có con số `troopCount`).
- **Quân số:** Đã có (`garrisonPower` hoặc `troopCount`).
- **Năng lực chiến đấu (Combat Capability / Power):** Đã có cơ sở từ `garrisonPower`.
- **Trạng thái / Hoạt động hiện tại (Current Activity):** Đã có `strategicOrder` (`"normal" | "defend" | "reinforce" | "attack" | "recover"`).
- **Thời gian còn lại / ETA:** Đã có `remainingDays` trong `TroopDeployment`.
- **Liên kết nhiệm vụ (Mission Link):** Đã có cơ sở từ `MissionDispatch` (`missionDispatches[id].assignedForces`).
- **Kết luận:** Dữ liệu hành quân và nhiệm vụ đã có khung cơ bản, nhưng **chưa có mô hình thực thể Hạm đội đồn trú cố định (Stationed Fleet Entity)** gắn trực tiếp vào Sector.

---

## 6. AUDIT KINH TẾ, KHO TÀI NGUYÊN & BẢO TRÌ (ECONOMY, STORAGE & MAINTENANCE AUDIT)

### 6.1. Tiền tệ (Credits) & Faction Economy
- **Trong WORLD:** Hệ thống kinh tế vĩ mô (`lib/game/world/economy.ts`) sử dụng 5 loại tài nguyên vật thể:
  1. `industrialMaterials`: Vật liệu chế tạo và công sự.
  2. `energy`: Năng lượng plasma duy trì khiên và vận hành.
  3. `logisticsSupplies`: Vật tư đạn dược và thiết bị tiếp tế.
  4. `tacticalData`: Dữ liệu và giải mã radar.
  5. `food`: Lương thực thiết yếu dân sinh (quy tắc A-I).
  - **HOÀN TOÀN KHÔNG CÓ CREDIT** trong `WorldResourceLedger`.
  - Credit hiện tại chỉ là đơn vị tiền tệ nội bộ của Core Game (`state.resources.credits`), phục vụ mua bán đồ trong Shop, nâng cấp công trình Base, và đóng tàu.
  - Tài liệu `docs/WORLD_NATIONAL_ECONOMY.md` (Phase 6.40) đã quy định sẽ bổ sung **Ngân khố Quốc gia (National Treasury)** thu thuế bằng Credits từ công dân các Sector VSS. Tuy nhiên, tính năng này **chưa được viết code**.

### 6.2. Sức chứa kho bãi (Facility Storage Cap)
- **Hiện trạng:**
  - Mỗi Sector lưu tài nguyên tại `sector.resources: WorldResourceLedger`.
  - Không có thuộc tính `storageCapacity`, `maxStorage`, hay `overflowRate`.
  - Tài nguyên sản xuất hàng ngày cộng dồn vô hạn vào kho của Sector, sau đó được hàm `synchronizeNationalLedger` cộng dồn thành kho tổng quốc gia `state.resources`.
  - Chưa có giới hạn lưu trữ cho từng nhà kho hay cơ sở tiếp liệu.

### 6.3. Chi phí bảo trì (Upkeep / Maintenance)
- **Trong runtime code:** **CHƯA TỒN TẠI** bất kỳ logic trừ chi phí bảo trì nào hàng ngày đối với quân đội hay công trình.
- **Trong tài liệu thiết kế (`docs/WORLD_NATIONAL_ECONOMY.md`):** Đã có định mức dự kiến cho Phase 6.40:
  - Quân chính quy (Regular Forces): $2.0$ Credits/người/chu kỳ.
  - Quân bổ trợ (Auxiliary Forces): $1.0$ Credit/người/chu kỳ.
  - Nhân lực kỹ thuật (Logistics Workforce): $0.5$ Credit/người/chu kỳ.

---

## 7. CẢNH BÁO NGUY CƠ TRÙNG LẶP HỆ THỐNG (SYSTEM DUPLICATION RISK ANALYSIS)

Khi triển khai các Phase tiếp theo liên quan đến Base, Cơ sở vật chất và Sửa chữa, bắt buộc phải tránh các nguy cơ xung đột sau:

```text
[NGUY CƠ TRÙNG LẶP KIẾN TRÚC CAO]

1. Xung đột Kho Tài Nguyên (Double Ledger Risk):
   - Core Game đang có: state.resources (credits, alloy, crystal, energy).
   - WORLD đang có: state.resources (materials, energy, supplies, data, food).
   => GIẢI PHÁP: Giữ nguyên phân định phạm vi: Core Game phục vụ buồng lái/hangar cá nhân;
      WORLD phục vụ chiến lược vĩ mô. Tuyệt đối không import lẫn lộn.

2. Xung đột Sửa Chữa (Repair Logic Collision):
   - forces-ledger.ts đang hồi phục 5% headcount quân số bị thương (military.woundedOrRepair).
   - BaseInstallationRepairHpDay được thiết kế để sửa chữa điểm máu (HP) của trang thiết bị/GEAR.
   => GIẢI PHÁP: Không dùng BaseInstallationRepairHpDay để can thiệp vào headcount của military.woundedOrRepair.
      Sửa chữa HP GEAR phải đi qua sổ cái trang bị của phi đội/hangar.

3. Xung đột Công Trình (Building List Duplication):
   - components/game/base-panel.tsx đang dùng 13 buildings của Player HQ.
   => GIẢI PHÁP: Không copy nguyên 13 building này vào WorldSector. Cơ sở vật chất tại Sector
      (Facilities) phải là các module chiến lược nhẹ (ví dụ: SAR Center, Repair Bay, Fortification).
```

---

## 8. DANH MỤC THUẬT NGỮ & KHÁI NIỆM ĐÃ PHÊ DUYỆT (APPROVED CONCEPT CATALOG)

Bảng tổng hợp chuẩn hóa các biến và công thức mục tiêu theo đúng quy chuẩn ngôn ngữ:

### `BaseInstallationRepairHpDay`
- **Ý nghĩa:** Tổng năng lực sửa chữa điểm máu (HP) cơ sở vật chất mỗi ngày của một căn cứ hoặc trạm không gian.
- **Công thức mục tiêu:**
  ```text
  BaseInstallationRepairHpDay =
      FacilityRepairCapacityPerDay
      + WorkerRepairCapacityPerDay
  ```
- **Nguồn dữ liệu:** Tổng hợp từ năng lực máy móc của trạm (`FacilityRepairCapacityPerDay`) và năng lực của lực lượng thợ kỹ thuật đang làm việc (`WorkerRepairCapacityPerDay`).
- **Nơi sử dụng dự kiến:** Dùng trong tính toán thời gian sửa chữa cơ giáp hư hỏng rút lui về căn cứ (Phase 6.35, Phase 6.39) và hiển thị trên giao diện Base Detail (Phase 6.42).

### `FacilityRepairCapacityPerDay`
- **Ý nghĩa:** Năng lực sửa chữa cơ sở vật chất cố định đến từ nhà xưởng, trạm bảo dưỡng, dây chuyền robot tự động và cơ sở hạ tầng của căn cứ, không phụ thuộc vào số lượng công nhân.
- **Nguồn dữ liệu:** Cấu hình cấp bậc hoặc loại hình cơ sở vật chất (Facility Level / Type).
- **Nơi sử dụng dự kiến:** Thành phần cấu thành thứ nhất của `BaseInstallationRepairHpDay`.

### `WorkerRepairCapacityPerDay`
- **Ý nghĩa:** Tổng năng lực sửa chữa đóng góp từ toàn bộ đội ngũ nhân sự kỹ thuật thực tế đang làm việc tại căn cứ trong ngày.
- **Công thức mục tiêu:**
  ```text
  WorkerRepairCapacityPerDay =
      ActiveTechnicalWorkers
      * TechnicalWorkerRepairHPPerDay
  ```
- **Nơi sử dụng dự kiến:** Thành phần cấu thành thứ hai của `BaseInstallationRepairHpDay`.

### `ActiveTechnicalWorkers`
- **Ý nghĩa:** Số lượng nhân viên kỹ thuật, thợ máy, chuyên viên bảo trì thực tế đang được điều động và trực tiếp thực hiện nhiệm vụ sửa chữa tại căn cứ (không tính nhân sự đang nghỉ phép, đào tạo, hoặc dự bị).
- **Nguồn dữ liệu:** Phân bổ từ nhóm Logistics Workforce của căn cứ hoặc quốc gia.
- **Nơi sử dụng dự kiến:** Tính toán `WorkerRepairCapacityPerDay`.

### `TechnicalWorkerRepairHPPerDay`
- **Ý nghĩa:** Định mức năng suất sửa chữa trung bình của một nhân viên kỹ thuật trong một ngày chiến lược (đơn vị: HP/người/ngày).
- **Nguồn dữ liệu:** Cấu hình chuẩn hóa của hệ thống (AdminCP configurable hoặc hằng số cân bằng).
- **Nơi sử dụng dự kiến:** Hệ số nhân với `ActiveTechnicalWorkers`.

---

## 9. KẾT LUẬN & KHUYẾN NGHỊ KIẾN TRÚC CHO CÁC PHASE TIẾP THEO

1. **Về Phase 6.34B–6.34G (Pilot Survival & Rescue Expansion):**
   - Không bị xung đột bởi hiện trạng hạ tầng Base vì Phase 6.34A–6.34G tập trung vào phi công thoát hiểm, phân cấp tử nạn/bảo hộ, nhiệm vụ tìm kiếm cứu nạn và Nano Repair Kits.
2. **Về Phase 6.35 (GEAR Logistics & Repair):**
   - Khi triển khai phục hồi cơ giáp rút lui (Retreated Airframes), cần hiện thực hóa `BaseInstallationRepairHpDay` trên nền tảng công thức mục tiêu đã phê duyệt, tránh can thiệp nhầm vào `forces-ledger.ts`.
3. **Về Phase 6.36–6.38 (Personnel Pools & Technical Workforce):**
   - Cần bổ sung cấu trúc 3 pools (`Regular`, `Auxiliary`, `Logistics`) vào `DemographicsState` mà không làm phá vỡ Invariant Zero-Sum của dân số.
4. **Về Phase 6.42–6.43 (Base Details & Facilities UI):**
   - Tận dụng cấu trúc trực quan từ `SectorIntelModal` (Tab Overview, Operations, Resources) để phát triển thành Base Details hoàn chỉnh, bổ sung thêm tab Quản lý Cơ sở vật chất (Facilities) và danh sách Đồn trú cụ thể.

---
*Tài liệu được tạo tự động bởi hệ thống kiểm tra kiến trúc AI Studio Build — Không chứa thay đổi code thực thi.*
