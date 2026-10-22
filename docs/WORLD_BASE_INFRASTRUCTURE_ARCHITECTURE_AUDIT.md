# BÁO CÁO KIỂM TRA KIẾN TRÚC & PHÂN TÍCH HIỆN TRẠNG HẠ TẦNG CĂN CỨ
# STARFRONT WORLD — BASE, FACILITY, REPAIR CAPACITY & WORKFORCE AUDIT

> **TÀI LIỆU KIỂM TRA KIẾN TRÚC VÀ ĐỐI CHIẾU MÃ NGUỒN (INSPECTION / ARCHITECTURE REVIEW ONLY)**  
> **Phiên làm việc:** Kiểm tra hiện trạng hệ thống Base, Building, Repair HP/day, Workforce, Fleet/Garrison, Economy và Lưu trữ.  
> **Nguyên tắc:** KHÔNG triển khai gameplay formula mới, KHÔNG sửa đổi production runtime code, KHÔNG tự ý suy diễn các chỉ số gameplay/balance chưa được phê duyệt.

---

## 1. TỔNG QUAN HIỆN TRẠNG VÀ PHẠM VI KIỂM TRA (EXECUTIVE SUMMARY)

Hệ thống STARFRONT hiện tồn tại **hai tầng kiến trúc song song**:
1. **Tầng Trò Chơi Kế Thừa (Core / Legacy Game)** (`lib/game/`): Quản lý căn cứ tổng hành dinh của người chơi (Player Base) với 13 loại công trình (`command`, `hangar`, `factory`, v.v.), 6 phân khu dân cư (`DistrictKey`), các chỉ số kinh tế `credits`, `alloy`, `crystal`, và hồi phục HP cơ giáp cá nhân (`hangarRepairPerDay`, `districtBonus.repairHp`, `REPAIR_CREDIT_PER_HP`).
2. **Tầng Chiến Lược Thiên Hà (STARFRONT WORLD)** (`lib/game/world/`): Quản lý 8-10 Sector không gian (`WorldSector`), mạng lưới siêu không gian (`WorldRoute`), sổ cái lực lượng quân sự bảo toàn quân số (`MilitaryForceLedger`), 5 tài nguyên vĩ mô (`WorldResourceLedger`), hệ thống nhân khẩu học (`DemographicsState`), và máy trạng thái vòng đời Sector 5 giai đoạn (`SectorStage`).

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

## 2. AUDIT CHI TIẾT 13 BUILDING TYPES HIỆN CÓ (`state.buildings`)

Tất cả 13 công trình dưới đây được định nghĩa trong `lib/game/types.ts` (`BuildingKey`, `BuildingDef`, `Building`) và cấu hình tại `lib/game/data.ts` (`BUILDING_DEFS`, `BUILDING_ORDER`).

### 1. `command` — Sở Chỉ Huy
- **ID / Key:** `command`
- **Tên hiện tại:** Sở Chỉ Huy
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "command"`), `lib/game/data.ts` (`BUILDING_DEFS.command`).
- **Chức năng gameplay:** Trung tâm điều hành căn cứ chính. Gatekeeper mở khóa cấp công trình khác (công trình khác không thể vượt quá `commandLevel + 2`).
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `1`.
- **Upgrade formula:** `scale = Math.pow(costScale, currentLevel)` với `costScale = 1.8`. Chi phí từng loại tài nguyên: `Math.round(baseCost * scale)`.
- **Resource / Credit cost:** `baseCost: { credits: 2000, alloy: 600, crystal: 40 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `+ giới hạn cấp công trình, + uy tín`.
  - Trong runtime (`lib/game/engine.ts`):
    - `coreProduction`: Đóng góp `300 + command * 120` credits/ngày; đóng góp một phần tinh thể: `Math.floor((command + refinery) / 4) * 5` crystal/ngày.
    - `baseDefense`: Đóng góp `command * 90` điểm phòng thủ căn cứ.
- **Personnel liên quan:** Không có nhân sự gắn kèm (chỉ phụ thuộc cấp công trình).
- **Repair / Storage / Training / Military effect:**
  - Repair: Không.
  - Storage: Không.
  - Training: Không.
  - Military: Có gián tiếp (tăng `baseDefense` +90/cấp).
- **UI hiện tại:** `components/game/base-panel.tsx` (SummaryCard "Cấp chỉ huy", icon `Building2`, điều kiện khóa "Cần Chỉ Huy" cho các công trình khác).

---

### 2. `hangar` — Nhà Chứa (Hangar)
- **ID / Key:** `hangar`
- **Tên hiện tại:** Nhà Chứa (Hangar)
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "hangar"`), `lib/game/data.ts` (`BUILDING_DEFS.hangar`).
- **Chức năng gameplay:** Sửa chữa, bảo dưỡng phi thuyền/cơ giáp (GEAR) qua đêm; tăng giới hạn số lượng Gear tối đa (`gearCap`).
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `1`.
- **Upgrade formula:** `scale = Math.pow(1.6, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 1200, alloy: 400 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `+ hồi durability mỗi ngày, + số Gear tối đa`.
  - Trong runtime (`lib/game/engine.ts` & `lib/game/store.tsx`):
    - `hangarRepairPerDay(buildings)`: Hồi phục `0.08 + buildings.hangar * 0.05` tỷ lệ MaxHP mỗi ngày cho tất cả GEAR của người chơi khi qua ngày (`NEXT_DAY`).
    - `gearCap`: Tăng thêm `+ buildings.hangar` vào sức chứa hạm đội.
- **Personnel liên quan:** Không có nhân sự kỹ thuật gắn kèm trực tiếp.
- **Repair / Storage / Training / Military effect:**
  - Repair: CÓ (8% base + 5%/cấp MaxHP/ngày).
  - Storage: CÓ (+1 sức chứa GEAR/cấp).
  - Training: Không.
  - Military: CÓ (phục hồi khí tài và duy trì quy mô phi đội).
- **UI hiện tại:** `components/game/base-panel.tsx` (SummaryCard "Sức chứa hạm đội", card nâng cấp Nhà Chứa), `components/game/fleet-panel.tsx`.

---

### 3. `factory` — Nhà Máy Vũ Khí
- **ID / Key:** `factory`
- **Tên hiện tại:** Nhà Máy Vũ Khí
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "factory"`), `lib/game/data.ts` (`BUILDING_DEFS.factory`).
- **Chức năng gameplay:** Chế tạo vũ khí, trang bị, giảm chi phí sản xuất trang bị.
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `0`.
- **Upgrade formula:** `scale = Math.pow(1.6, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 1400, alloy: 500, crystal: 20 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `- chi phí chế tạo trang bị`.
  - Trong runtime (`lib/game/engine.ts`): Hiện tại chỉ là placeholder mô tả UI, chưa có logic runtime trừ giá trong shop đồ (`ITEM_MAP`).
- **Personnel liên quan:** Không có.
- **Repair / Storage / Training / Military effect:**
  - Repair: Không.
  - Storage: Không.
  - Training: Không.
  - Military: Dự kiến phục vụ chế tạo trang bị vũ khí.
- **UI hiện tại:** `components/game/base-panel.tsx` (icon `Factory`).

---

### 4. `reactor` — Lò Phản Ứng
- **ID / Key:** `reactor`
- **Tên hiện tại:** Lò Phản Ứng
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "reactor"`), `lib/game/data.ts` (`BUILDING_DEFS.reactor`).
- **Chức năng gameplay:** Sản xuất năng lượng (`energy`) mỗi ngày cho căn cứ.
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `1`.
- **Upgrade formula:** `scale = Math.pow(1.5, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 900, alloy: 260 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `+ Năng lượng / ngày`.
  - Trong runtime (`lib/game/engine.ts`):
    - `coreProduction`: Cung cấp `60 + buildings.reactor * 50` năng lượng mỗi ngày.
- **Personnel liên quan:** Không có.
- **Repair / Storage / Training / Military effect:**
  - Repair: Không.
  - Storage: Không.
  - Training: Không.
  - Military: Không (cung cấp tài nguyên năng lượng để đóng tàu/vận hành).
- **UI hiện tại:** `components/game/base-panel.tsx` (icon `Zap`).

---

### 5. `refinery` — Xưởng Luyện Kim
- **ID / Key:** `refinery`
- **Tên hiện tại:** Xưởng Luyện Kim
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "refinery"`), `lib/game/data.ts` (`BUILDING_DEFS.refinery`).
- **Chức năng gameplay:** Khai thác & tinh luyện hợp kim (`alloy`) và tinh thể (`crystal`) mỗi ngày.
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `1`.
- **Upgrade formula:** `scale = Math.pow(1.5, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 900, alloy: 200 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `+ Hợp kim / ngày`.
  - Trong runtime (`lib/game/engine.ts`):
    - `coreProduction`: Cung cấp `60 + buildings.refinery * 55` hợp kim/ngày; đóng góp tính toán `Math.floor((command + refinery) / 4) * 5` crystal/ngày.
- **Personnel liên quan:** Không có.
- **Repair / Storage / Training / Military effect:**
  - Repair: Không.
  - Storage: Không.
  - Training: Không.
  - Military: Không (cung cấp nguyên liệu sản xuất).
- **UI hiện tại:** `components/game/base-panel.tsx` (icon `Layers`).

---

### 6. `barracks` — Doanh Trại
- **ID / Key:** `barracks`
- **Tên hiện tại:** Doanh Trại
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "barracks"`), `lib/game/data.ts` (`BUILDING_DEFS.barracks`).
- **Chức năng gameplay:** Tăng giới hạn quân số (`armyCap`) cho lực lượng đồn trú và hạm đội viễn chinh.
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `1`.
- **Upgrade formula:** `scale = Math.pow(1.55, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 1100, alloy: 340 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `+ giới hạn quân số`.
  - Trong runtime (`lib/game/engine.ts`):
    - `armyCap(buildings)`: Đóng góp `120 + barracks * 60 + residential * 60`.
- **Personnel liên quan:** Không có nhân sự quản lý trực tiếp (chỉ lưu trữ quân số).
- **Repair / Storage / Training / Military effect:**
  - Repair: Không.
  - Storage: CÓ (sức chứa quân số đồn trú `armyCap` +60/cấp).
  - Training: Không (chỉ mở trần dung lượng quân số, không đào tạo).
  - Military: CÓ (mở rộng quy mô quân lực đồn trú).
- **UI hiện tại:** `components/game/base-panel.tsx` (SummaryCard "Quân số", Panel "Lực lượng đồn trú", icon `Users`).

---

### 7. `turret` — Tháp Phòng Thủ
- **ID / Key:** `turret`
- **Tên hiện tại:** Tháp Phòng Thủ
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "turret"`), `lib/game/data.ts` (`BUILDING_DEFS.turret`).
- **Chức năng gameplay:** Phòng thủ căn cứ trước các cuộc phản kích của địch.
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `1`.
- **Upgrade formula:** `scale = Math.pow(1.5, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 800, alloy: 420, crystal: 15 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `+ phòng thủ căn cứ`.
  - Trong runtime (`lib/game/engine.ts`):
    - `baseDefense(buildings)`: Đóng góp `buildings.turret * 260` điểm phòng thủ.
- **Personnel liên quan:** Không có.
- **Repair / Storage / Training / Military effect:**
  - Repair: Không.
  - Storage: Không.
  - Training: Không.
  - Military / Defense: CÓ (+260 điểm Base Defense mỗi cấp).
- **UI hiện tại:** `components/game/base-panel.tsx` (SummaryCard "Phòng thủ căn cứ", icon `Crosshair`).

---

### 8. `shipyard` — Xưởng Đóng Tàu
- **ID / Key:** `shipyard`
- **Tên hiện tại:** Xưởng Đóng Tàu
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "shipyard"`), `lib/game/data.ts` (`BUILDING_DEFS.shipyard`).
- **Chức năng gameplay:** Đóng phi thuyền (GEAR) mới nhanh và rẻ hơn, đồng thời mở rộng số lượng GEAR tối đa.
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `0`.
- **Upgrade formula:** `scale = Math.pow(1.7, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 1600, alloy: 560, crystal: 30 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `- chi phí đóng Gear, + Gear tối đa`.
  - Trong runtime (`lib/game/engine.ts`):
    - `gearCap`: Tăng thêm `+ buildings.shipyard` vào số lượng GEAR tối đa.
    - `gearBuildCost`: Giảm chi phí đóng Gear theo tỷ lệ: `pct = 1 - Math.min(0.4, buildings.shipyard * 0.05)` (tối đa giảm 40%).
- **Personnel liên quan:** Không có.
- **Repair / Storage / Training / Military effect:**
  - Repair: Không trực tiếp (chỉ sản xuất đóng mới khí tài).
  - Storage: CÓ (+1 sức chứa GEAR/cấp).
  - Training: Không.
  - Military: CÓ (sản xuất trang bị và mở rộng hạm đội).
- **UI hiện tại:** `components/game/base-panel.tsx`, `components/game/starfront-hangar.tsx` (Tab đóng tàu, icon `Hammer`).

---

### 9. `finance` — Trung Tâm Tài Chính
- **ID / Key:** `finance`
- **Tên hiện tại:** Trung Tâm Tài Chính
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "finance"`), `lib/game/data.ts` (`BUILDING_DEFS.finance`).
- **Chức năng gameplay:** Quản lý ngân khố và đầu tư liên hành tinh, tạo nguồn thu nhập Credits ổn định.
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `0`.
- **Upgrade formula:** `scale = Math.pow(1.45, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 1500, alloy: 300 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `+250 credits/ngày mỗi cấp`.
  - Trong runtime (`lib/game/engine.ts`):
    - `civicProduction`: Tăng `buildings.finance * 250` credits/ngày.
    - `prosperity`: Đóng góp `civic * 3` vào điểm phồn vinh.
- **Personnel liên quan:** Không có.
- **Repair / Storage / Training / Military effect:**
  - Repair: Không.
  - Storage: Không.
  - Training: Không.
  - Military: Không (thuần túy tài chính).
- **UI hiện tại:** `components/game/base-panel.tsx` (icon `Landmark`).

---

### 10. `alliance` — Khu Liên Hợp Liên Minh
- **ID / Key:** `alliance`
- **Tên hiện tại:** Khu Liên Hợp Liên Minh
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "alliance"`), `lib/game/data.ts` (`BUILDING_DEFS.alliance`).
- **Chức năng gameplay:** Cảng neo đậu chung của các đồng minh, mở rộng sức chứa hạm đội.
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `0`.
- **Upgrade formula:** `scale = Math.pow(1.5, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 2500, alloy: 900, crystal: 40 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `+1 sức chứa hạm đội mỗi cấp`.
  - Trong runtime (`lib/game/engine.ts`):
    - `gearCap`: Tăng thêm `+ (buildings.alliance ?? 0)` vào tổng số GEAR tối đa.
- **Personnel liên quan:** Không có.
- **Repair / Storage / Training / Military effect:**
  - Repair: Không.
  - Storage: CÓ (+1 sức chứa GEAR/cấp).
  - Training: Không.
  - Military: CÓ (sức chứa hỗ trợ liên minh).
- **UI hiện tại:** `components/game/base-panel.tsx` (icon `Handshake`).

---

### 11. `residential` — Khu Dân Cư
- **ID / Key:** `residential`
- **Tên hiện tại:** Khu Dân Cư
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "residential"`), `lib/game/data.ts` (`BUILDING_DEFS.residential`).
- **Chức năng gameplay:** Nhà ở cho di dân, nền tảng nhân lực, tăng tốc độ tăng dân số, mở rộng giới hạn quân đội, đóng góp thu nhập và phồn vinh.
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `0`.
- **Upgrade formula:** `scale = Math.pow(1.42, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 1200, alloy: 500 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `+0.5% tăng dân số, +60 quân số, +100 credits/ngày mỗi cấp`.
  - Trong runtime (`lib/game/engine.ts`):
    - `populationGrowthRate`: Tăng thêm `0.05 + residential * 0.005` mỗi chu kỳ.
    - `armyCap`: Tăng thêm `+ residential * 60` vào giới hạn quân số.
    - `civicProduction`: Tăng thêm `+ residential * 100` credits/ngày.
    - `prosperity`: Đóng góp `civic * 3` vào điểm phồn vinh.
- **Personnel liên quan:** Tác động trực tiếp lên quy mô dân số tổng thể (`population`), gián tiếp cung cấp nhân lực cho các phân khu.
- **Repair / Storage / Training / Military effect:**
  - Repair: Không trực tiếp.
  - Storage: CÓ (tăng trần quân đội `armyCap` +60/cấp).
  - Training: Không.
  - Military: CÓ (cơ sở tạo nguồn tuyển quân).
- **UI hiện tại:** `components/game/base-panel.tsx` (SummaryCard "Dân cư", icon `Home`).

---

### 12. `trade` — Khu Giao Dịch
- **ID / Key:** `trade`
- **Tên hiện tại:** Khu Giao Dịch
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "trade"`), `lib/game/data.ts` (`BUILDING_DEFS.trade`).
- **Chức năng gameplay:** Chợ liên sao trao đổi hàng hóa và khoáng sản. Sản xuất đa tài nguyên (Credits, Hợp kim, Tinh thể).
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `0`.
- **Upgrade formula:** `scale = Math.pow(1.5, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 2200, alloy: 400, crystal: 20 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `+400 credits, +40 hợp kim, +1 tinh thể/ngày mỗi cấp`.
  - Trong runtime (`lib/game/engine.ts`):
    - `civicProduction`: Tăng `trade * 400` credits, `trade * 40` alloy, `trade * 1` crystal mỗi ngày.
    - `prosperity`: Đóng góp `civic * 3` vào điểm phồn vinh.
- **Personnel liên quan:** Không có.
- **Repair / Storage / Training / Military effect:**
  - Repair: Không.
  - Storage: Không.
  - Training: Không.
  - Military: Không.
- **UI hiện tại:** `components/game/base-panel.tsx` (icon `Store`).

---

### 13. `entertainment` — Khu Vui Chơi
- **ID / Key:** `entertainment`
- **Tên hiện tại:** Khu Vui Chơi
- **File / Type định nghĩa:** `lib/game/types.ts` (`BuildingKey = "entertainment"`), `lib/game/data.ts` (`BUILDING_DEFS.entertainment`).
- **Chức năng gameplay:** Giải trí, sòng bạc và đấu trường mô phỏng. Cung cấp dòng tiền Credits lớn và tăng điểm phồn vinh.
- **Level:** Cấp tối đa `maxLevel = 30`. Cấp mặc định khởi đầu: `0`.
- **Upgrade formula:** `scale = Math.pow(1.48, currentLevel)`.
- **Resource / Credit cost:** `baseCost: { credits: 1800, alloy: 350 }`.
- **Effect / Buff hiện tại:**
  - Mô tả: `+500 credits/ngày mỗi cấp`.
  - Trong runtime (`lib/game/engine.ts`):
    - `civicProduction`: Tăng `entertainment * 500` credits/ngày.
    - `prosperity`: Đóng góp `civic * 3` vào điểm phồn vinh.
- **Personnel liên quan:** Không có.
- **Repair / Storage / Training / Military effect:**
  - Repair: Không.
  - Storage: Không.
  - Training: Không.
  - Military: Không.
- **UI hiện tại:** `components/game/base-panel.tsx` (icon `FerrisWheel`).

---

## 3. AUDIT PHÂN KHU & HẠ TẦNG CĂN CỨ HIỆN CÓ (DISTRICT & INFRASTRUCTURE AUDIT)

Hệ thống phân khu hiện tại (`DistrictKey`, `DistrictAllocation`, `DistrictBonus`) định nghĩa tại `lib/game/types.ts` và hiển thị tại `components/game/district-panel.tsx`.

### 3.1. Chi tiết 6 Phân khu Dân cư (`DistrictKey`)

1. **`finance` (Tài chính):**
   - *Cơ chế:* Phân bổ % dân số (bước nhảy 5%, tối thiểu 5%). Cứ 100 dân cho ra `+50 credits/ngày`.
   - *Đánh giá hợp nhất:* Thuộc riêng Player Core Base. Không nên merge vào Sector vì WORLD dùng hệ thống thuế vĩ mô (`National Treasury`).
2. **`service` (Dịch vụ):**
   - *Cơ chế:* Cứ 100 dân cho ra `+1 tinh thể/ngày`.
   - *Đánh giá hợp nhất:* Thuộc riêng Player Core Base.
3. **`industry` (Công nghiệp):**
   - *Cơ chế:* Cứ 100 dân cho ra `+5 hợp kim/ngày`.
   - *Đánh giá hợp nhất:* Có thể ánh xạ tương đương với `industryCapacity` trong WORLD Sector.
4. **`power` (Điện lực / Lò phản ứng):**
   - *Cơ chế:* Cứ 100 dân cho ra `+10 năng lượng/ngày`.
   - *Đánh giá hợp nhất:* Có thể ánh xạ sang hạ tầng năng lượng vĩ mô của Sector (`INFRASTRUCTURE`).
5. **`repair` (Sửa chữa):**
   - *Cơ chế:* Cứ 100 dân phân bổ cho ra `+1.000 HP hồi phục cho mỗi Gear/ngày` (`repairHp: units("repair") * 1000`).
   - *Đánh giá hợp nhất:* **Tiền thân quan trọng nhất** của cơ chế nhân lực kỹ thuật làm việc sửa chữa (`ActiveTechnicalWorkers`), nhưng hiện tại đang cho flat HP hồi phục trên toàn bộ phi thuyền mà không có giới hạn trần dung lượng hay phân bổ ưu tiên.
6. **`shipbuilding` (Đóng tàu):**
   - *Cơ chế:* Cứ 100 dân giảm 100 chi phí đóng Gear (`shipDiscount`) và tăng +1 sức chứa Gear (`gearCap`).
   - *Đánh giá hợp nhất:* Thuộc riêng xưởng đóng tàu cá nhân của người chơi tại Căn Cứ Chính.

### 3.2. Phân loại kế thừa và tái sử dụng hạ tầng

| Nhóm phân loại | Các thành phần cụ thể | Định hướng kiến trúc |
| :--- | :--- | :--- |
| **Nên REUSE** | - Tư duy điều động tỷ lệ nhân lực (`DistrictAllocation` slider) sang điều động nhân lực kỹ thuật `ActiveTechnicalWorkers`.<br>- Phân khu `repair` (ánh xạ sang `LOGISTICS` / Repair Bay).<br>- Phân khu `industry` & `power` (ánh xạ sang `INDUSTRIAL` & `INFRASTRUCTURE`). | Tái sử dụng nguyên lý phân bổ nhân lực, chuẩn hóa lại đầu ra thành năng suất sửa chữa (HP/day) và sản lượng tài nguyên có kho lưu trữ. |
| **Chỉ thuộc PLAYER CORE BASE** | - Toàn bộ 6 thanh trượt slider 100% trong `DistrictPanel` (gắn chặt với `state.population` đơn lẻ của người chơi).<br>- Phân khu `service` (+crystal), `finance` (+credits vào túi người chơi), `shipbuilding` (giảm giá đóng gear cá nhân). | Giữ nguyên tại `components/game/district-panel.tsx` để người chơi quản lý căn cứ chính của mình. |
| **Chuyển thành GENERIC WORLD BUILDING** | - `command` $\rightarrow$ Trụ sở điều hành Sector (`INFRASTRUCTURE` / `CIVIL`).<br>- `hangar` $\rightarrow$ Trạm bảo dưỡng & sửa chữa phi đội (`LOGISTICS`).<br>- `shipyard` $\rightarrow$ Xưởng đóng tàu chiến lược liên sao (`MILITARY` / `INDUSTRIAL`).<br>- `turret` $\rightarrow$ Hệ thống công sự phòng thủ pháo đài (`DEFENSE`).<br>- `barracks` $\rightarrow$ Doanh trại đồn trú tiền phương (`MILITARY`).<br>- `factory` / `refinery` $\rightarrow$ Tổ hợp công nghiệp luyện kim (`INDUSTRIAL`).<br>- `reactor` $\rightarrow$ Trạm năng lượng phản ứng (`INFRASTRUCTURE`). | Xây dựng thành các module Facility độc lập mà Sector VSS hoặc kẻ thù có thể sở hữu, nâng cấp hoặc chiếm đóng. |
| **KHÔNG NÊN MERGE** | - `entertainment`, `trade`, `finance` của Core Game.<br>- `alliance` (liên hợp liên minh cá nhân). | Các công trình này phục vụ tăng trưởng kinh tế cá nhân của người chơi, nếu merge vào Sector sẽ phá vỡ hệ thống thuế quốc gia `National Treasury` và nhân khẩu học `DemographicsState`. |

---

## 4. BẢNG MA TRẬN ÁNH XẠ CÔNG TRÌNH (BUILDING MAPPING MATRIX)

Bảng đối chiếu toàn diện 13 Core Buildings sang danh mục mục tiêu của STARFRONT WORLD:

| Existing Core Building | Existing Function | Proposed WORLD Category | Reuse / Extend / Keep Separate | Duplicate Risk | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`command`** (Sở Chỉ Huy) | Mở khóa cấp công trình khác, tăng Credits, Tinh thể và Phòng thủ. | **`CIVIL` / `INFRASTRUCTURE`** | **EXTEND** | **Trung bình:** Dễ nhầm giữa Player HQ và Sector Administrative Outpost. | Mở rộng thành Sector HQ tại mỗi Sector; tại Player Base giữ vai trò Commander HQ. |
| **`hangar`** (Nhà Chứa) | Hồi phục 8% + 5%/cấp MaxHP/ngày; tăng sức chứa Gear. | **`LOGISTICS`** | **EXTEND** | **Cao:** Xung đột giữa hồi phục % tự động của Core Game và `BaseInstallationRepairHpDay` của WORLD. | Core Game giữ nguyên; WORLD triển khai thành Facility `RepairBay` tuân thủ công thức năng lực sửa chữa dùng chung. |
| **`factory`** (Nhà Máy Vũ Khí) | Giảm chi phí chế tạo trang bị (placeholder). | **`INDUSTRIAL`** | **REUSE** | **Thấp:** Hiện Core Game chưa có logic runtime phức tạp. | Chuẩn hóa thành xưởng sản xuất vật tư công nghiệp `industrialMaterials` cho Sector. |
| **`reactor`** (Lò Phản Ứng) | Sản xuất Năng lượng (`energy`) hàng ngày. | **`INFRASTRUCTURE`** | **REUSE** | **Trung bình:** Core Game dùng `energy` cho đóng tàu; WORLD dùng `energy` duy trì khiên và vận hành route. | Ánh xạ cấp lò phản ứng thành sản lượng `energy` trong `WorldResourceLedger`. |
| **`refinery`** (Xưởng Luyện Kim) | Khai thác Hợp kim (`alloy`) và Tinh thể. | **`INDUSTRIAL`** | **REUSE** | **Thấp:** Tách biệt rõ giữa kho cá nhân và kho Sector. | Ánh xạ thành cơ sở khai thác tài nguyên công nghiệp chiến lược của Sector. |
| **`barracks`** (Doanh Trại) | Tăng trần quân số đồn trú (`armyCap` +60/cấp). | **`MILITARY`** | **EXTEND** | **Cao:** Xung đột giữa `state.army` (Core) và `military.reserves` / `garrisonPower` (WORLD). | Dùng làm cơ sở tính trần sức chứa đồn trú (`maxGarrisonPower`) tại Sector. |
| **`turret`** (Tháp Phòng Thủ) | Tăng phòng thủ căn cứ (+260 Base Defense/cấp). | **`DEFENSE`** | **EXTEND** | **Thấp:** Hiện Sector chỉ có `fortificationLevel`. | Kết nối cấp Tháp phòng thủ / Pháo đài với chỉ số phòng thủ và giảm sát thương khi Sector bị vây hãm. |
| **`shipyard`** (Xưởng Đóng Tàu) | Giảm giá đóng phi thuyền, tăng sức chứa Gear. | **`MILITARY` / `INDUSTRIAL`** | **KEEP SEPARATE** | **Cao:** Xung đột giữa đóng GEAR cá nhân và mua sắm khung thân thay thế (Procurement). | Giữ nguyên xưởng cá nhân cho người chơi; WORLD sử dụng cơ chế Procurement hàng đợi qua Ngân khố Quốc gia. |
| **`finance`** (TT Tài Chính) | Thu nhập 250 credits/ngày/cấp; tăng phồn vinh. | **`ECONOMIC`** | **KEEP SEPARATE** | **Cao:** Xung đột trực tiếp với hệ thống thu thuế `National Treasury` của WORLD. | Giữ nguyên tại căn cứ người chơi để tạo thu nhập cá nhân; không đưa vào Sector vĩ mô. |
| **`alliance`** (Khu Liên Minh) | Tăng sức chứa hạm đội (+1 Gear/cấp). | **`SPECIAL`** | **KEEP SEPARATE** | **Thấp:** Thuần túy tính năng cá nhân người chơi. | Giữ riêng ở Core Base. |
| **`residential`** (Khu Dân Cư) | Tăng dân số (+0.5%/cấp), tăng trần lính (+60/cấp), sinh Credits. | **`CIVIL`** | **EXTEND** | **Cao:** Xung đột với Invariant Zero-Sum của `DemographicsState` thiên hà. | Tại Sector, dân số được quản lý theo nhân khẩu học vĩ mô, không dùng công thức tăng % tự do của Core. |
| **`trade`** (Khu Giao Dịch) | Sinh Credits, Hợp kim, Tinh thể mỗi ngày; tăng phồn vinh. | **`ECONOMIC`** | **KEEP SEPARATE** | **Trung bình:** Tác động trực tiếp lên kinh tế vi mô. | Giữ ở Core Base cho giao dịch cá nhân. |
| **`entertainment`** (Khu Vui Chơi) | Sinh 500 credits/ngày/cấp; tăng phồn vinh. | **`SPECIAL` / `CIVIL`** | **KEEP SEPARATE** | **Thấp:** Tính năng giải trí vi mô căn cứ chính. | Giữ ở Core Base. |

---

## 5. THIẾT KẾ ĐÃ ĐƯỢC DUYỆT (APPROVED DESIGN DECISIONS)

Phần này ghi nhận đầy đủ các quyết định thiết kế mới về Tình trạng Khí tài (Condition), Cơ chế Bảo trì (Maintenance), Cổng Điều kiện Chiến đấu (Combat Condition Gate), Sửa chữa Hiện trường & Xưởng, Năng lực Sửa chữa Căn cứ & Chiến hạm (Base & Ship Repair Capacity).

### 5.1. Tình trạng Khí tài & Công thức Sát thương (Asset Condition & Damage Overflow)

Khí tài (GEAR, tàu chiến, thiết bị không gian) được quản lý bởi hai chỉ số song song:

```text
HP:
Thiệt hại thực thể/vật lý do hỏa lực chiến đấu gây ra (Combat/physical damage).
Mất khi bị đối phương tấn công; chạm 0 thì khí tài bị PHÁ HỦY HOÀN TOÀN (DESTROYED / IRREVOCABLE LOSS).

ConditionHP:
Tình trạng kỹ thuật, hao mòn máy móc và độ tin cậy cơ khí của khí tài.

ConditionHPMax:
Mức trần tình trạng kỹ thuật tối đa của khí tài. Mặc định: ConditionHPMax = MaxHP.
```

#### Quy tắc thiết kế (Design Invariant):
1. **Không suy giảm chỉ số trực tiếp:** Trong thiết kế hiện tại, `ConditionHP` **KHÔNG** làm suy giảm trực tiếp các chỉ số chiến đấu (`Offense`, `Defense`, `Mobility`) của khí tài.
2. **Khóa triển khai (Deployment Gate):** Khí tài có `ConditionHP` nằm dưới ngưỡng yêu cầu của nhiệm vụ (Mission Condition Requirement) thì **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP TRIỂN KHAI** xuất kích.

#### Cơ chế Sát thương Chiến đấu & Tràn Sát thương (Combat Damage & Overflow):
Khi khí tài nhận sát thương từ đòn đánh của đối phương (`IncomingDamage`):

```ts
HPAfterDamage =
    CurrentHP - IncomingDamage

RawConditionAfterDamage =
    CurrentConditionHP - IncomingDamage

ConditionOverflowDamage =
    Math.max(-RawConditionAfterDamage, 0)

NewConditionHP =
    Math.max(RawConditionAfterDamage, 0)

NewHP =
    Math.max(
        HPAfterDamage - ConditionOverflowDamage,
        0
    )
```

*Ý nghĩa vật lý:* Sát thương chiến đấu làm tổn hại đồng thời cả cấu trúc vật lý (`HP`) lẫn tình trạng kỹ thuật (`ConditionHP`). Khi tình trạng kỹ thuật đã cạn kiệt (`ConditionHP = 0`), phần thiệt hại vượt mức không còn được lớp đệm kỹ thuật hấp thụ sẽ tràn (`overflow`) thành sát thương cấu trúc bổ sung trực tiếp lên điểm `HP`.

---

### 5.2. Cổng Điều kiện Chiến đấu (Combat Condition Gate)

```text
CombatMinimumConditionRatio:
Ngưỡng Condition tối thiểu để GEAR còn đủ tình trạng kỹ thuật tiếp tục chiến đấu trên chiến trường.
Default approved: 0.05 (5% MaxConditionHP) — Configurable qua AdminCP / Combat Config.
```

#### Quy tắc xử lý:
- Khi một GEAR trong trận đấu có:
  $$\frac{\text{NewConditionHP}}{\text{ConditionHPMax}} \le \text{CombatMinimumConditionRatio} \quad (\le 0.05)$$
- Khí tài lập tức rơi vào trạng thái:
  ```text
  COMBAT_UNFIT
  ```
- **Hành động bắt buộc:** GEAR rơi vào `COMBAT_UNFIT` **phải rút lui** về Mother Ship / Command Ship / Hangar nếu có khả năng thực hiện (sử dụng luồng `orderGearRetreat`).
- **Ngưỡng Condition riêng theo nhiệm vụ (Mission-Specific Condition Requirement):** Là trường cấu hình riêng biệt cho từng nhiệm vụ xuất kích, có thể yêu cầu cao hơn nhiều so với `CombatMinimumConditionRatio`.
  - *Ví dụ đã phê chuẩn:* Tàu Cứu Hộ (Rescue Ship) trước khi xuất kích thực hiện Chiến dịch Cứu nạn (Rescue Operation) bắt buộc phải đạt:
    $$\text{ConditionRatio} = 1.00 \quad (100\%)$$

---

### 5.3. Cơ chế Bảo trì Kỹ thuật (Maintenance Triggers)

Hệ thống thiết lập hai ngưỡng tỷ lệ bảo trì chuẩn hóa (cấu hình qua AdminCP):

```text
MaintenanceTriggerMinRatio = 0.50 (50%)
MaintenanceTriggerMaxRatio = 0.90 (90%)
```

#### Quy tắc kích hoạt bảo trì:
1. **Bắt buộc bảo trì (Compulsory Maintenance):**
   - Khi $\frac{\text{ConditionHP}}{\text{ConditionHPMax}} < \text{MaintenanceTriggerMinRatio}$ ($< 50\%$):
   - Khí tài rơi vào trạng thái *Kỹ thuật nguy cấp*, **BẮT BUỘC** phải đưa vào xưởng bảo trì. Bị cấm hoàn toàn gán vào các đội hình xuất kích.
2. **Bảo trì tự nguyện (Voluntary / Elective Maintenance):**
   - Khi $\text{MaintenanceTriggerMinRatio} \le \frac{\text{ConditionHP}}{\text{ConditionHPMax}} < \text{MaintenanceTriggerMaxRatio}$ ($50\% - 89\%$):
   - Khí tài vẫn đủ tiêu chuẩn kỹ thuật thông thường để xuất kích, nhưng người chơi hoặc hệ thống điều phối có thể chủ động đưa vào xưởng bảo trì định kỳ để phục hồi về $100\%$.

---

### 5.4. Sửa chữa Hiện trường vs. Sửa chữa Toàn diện tại Xưởng (Field vs. Workshop Repair)

#### A. Sửa chữa Hiện trường (Field Repair / Nano Repair Kit):
- Khi sử dụng Nano Repair Kit hoặc sửa chữa khẩn cấp ngoài thực địa:
  ```text
  FieldRepairConditionRecoveryRatio = 0.50 (Approved Default, Configurable)
  ```
- Công thức phục hồi Condition ngoài thực địa:
  ```ts
  FieldConditionRecovered =
      Math.ceil(
          ActualHPRepaired
          * FieldRepairConditionRecoveryRatio
      )
  ```
- *Ví dụ:* Nano Repair Kit hồi phục thực tế 1.000 HP $\rightarrow$ hồi phục thêm 500 ConditionHP.
- *Quy tắc:* Sửa chữa hiện trường **KHÔNG BAO GIỜ** tự động đưa `ConditionHP` về $100\%$.

#### B. Sửa chữa Toàn diện tại Xưởng (Workshop Full Repair):
- Khi việc sửa chữa thiệt hại chiến đấu (Combat Damage Repair) hoàn tất tại:
  - Căn cứ (Base);
  - Phân xưởng cơ khí (Workshop);
  - Nhà chứa (Hangar);
- Thì tình trạng kỹ thuật được tự động phục hồi trọn vẹn:
  ```ts
  ConditionHP = ConditionHPMax
  ```
- *Lý do:* Quy trình sửa chữa chính quy tại xưởng bao gồm toàn bộ các bước kiểm chuẩn, cân chỉnh khung gầm và thay thế linh kiện hao mòn kỹ thuật.

---

### 5.5. Năng lực Sửa chữa Dùng Chung tại Căn cứ (Shared Base Repair Capacity)

Chỉ số `BaseInstallationRepairHpDay` là năng lực sửa chữa dùng chung (Shared Capacity) cho cả Combat HP Repair và Maintenance Condition HP Restore:

```ts
BaseInstallationRepairHpDay =
    FacilityRepairCapacityPerDay
    + WorkerRepairCapacityPerDay

WorkerRepairCapacityPerDay =
    ActiveTechnicalWorkers
    * TechnicalWorkerRepairHPPerDay
```

#### Nguyên lý điều phối và ưu tiên:
- **Ưu tiên 1 (Priority 1 — Combat HP Repair):** Khí tài bị thương tổn sau chiến đấu luôn được ưu tiên sửa chữa trước.
- **Ưu tiên 2 (Priority 2 — Scheduled Maintenance):** Bảo trì kỹ thuật chỉ hấp thụ phần thông lượng sửa chữa còn dư thừa (`Surplus Capacity`) sau khi đã hoàn tất Combat Repair.
- Cấu hình phân chia tỷ lệ năng lực qua AdminCP / Base Management (ví dụ: 70% Combat / 30% Maintenance).

---

### 5.6. Năng lực Sửa chữa & Bảo trì trên Chiến hạm (Ship Repair & Maintenance Capacity)

Mother Ship, Command Ship và Rescue Ship có thể sở hữu trạm sửa chữa (Repair Modules) và đội ngũ kỹ thuật viên riêng:

```ts
ShipRepairCapacityPerDay =
    ShipFacilityRepairCapacityPerDay
    + ShipWorkerRepairCapacityPerDay

ShipWorkerRepairCapacityPerDay =
    ActiveShipTechnicalWorkers
    * TechnicalWorkerRepairHPPerDay
```

- **Tính kế thừa:** Không xây dựng một repair engine khác; tái sử dụng hoàn toàn semantics và cơ chế của Base.
- **Hiệu suất bảo trì trên tàu (Ship Maintenance Efficiency):**
  - Cấu hình độc lập: `ShipMaintenanceEfficiencyRatio = 1.5` (Approved Default).
  - Không dẫn xuất runtime từ Base ratio. Base và Ship là 2 cấu hình riêng biệt.
  - Công thức bảo trì kỹ thuật trên tàu:
    ```ts
    ShipConditionRepairPerDay =
        AllocatedShipMaintenanceRepairCapacity
        * ShipMaintenanceEfficiencyRatio
    ```

---

## 6. KIỂM TRA ĐÍCH KIẾN TRÚC COMBAT V2 (TARGETED COMBAT V2 INSPECTION)

Thực hiện kiểm tra trực tiếp mã nguồn Combat V2 (`lib/game/world/combat-v2-*`) nhằm chuẩn bị điểm nối (hooks) cho ConditionHP và trạng thái COMBAT_UNFIT:

### 6.1. Vị trí áp sát thương hiện tại (Current HP Damage Application)
- **File:** `lib/game/world/combat-v2-engine.ts`
- **Function:** `executeCombatRound(snapshot, roundNumber, config, prng)` (dòng 536–556).
- **Mã nguồn hiện tại:**
  ```ts
  const damage = Math.max(1, Math.round((rawAttack - rawDefense) * variance))
  target.currentHp = Math.max(0, target.currentHp - damage)
  if (target.currentHp === 0) {
    target.state = "DESTROYED"
    // Tạo destructionEvents, downedPilotCandidates...
  }
  ```

### 6.2. Vị trí nối ConditionHP tối ưu nhất (Best Hook Location)
- Ngay sau khi tính giá trị `damage` tại dòng 536 của `executeCombatRound`.
- Thay thế đoạn trừ thẳng `target.currentHp` bằng khối logic Combat Damage Overflow:
  ```ts
  const rawConditionAfter = (target.conditionHp ?? target.currentHp) - damage
  const overflow = Math.max(-rawConditionAfter, 0)
  target.conditionHp = Math.max(rawConditionAfter, 0)
  target.currentHp = Math.max(0, target.currentHp - damage - overflow)
  ```
- Kiểm tra cổng Combat Condition Gate:
  ```ts
  const minConditionRatio = config.combatMinimumConditionRatio ?? 0.05
  const conditionRatio = target.maxHp > 0 ? (target.conditionHp ?? 0) / target.maxHp : 0
  if (conditionRatio <= minConditionRatio && target.state === "ACTIVE") {
    // Kích hoạt COMBAT_UNFIT và tự động phát lệnh orderGearRetreat(target)
  }
  ```

### 6.3. Luồng Rút lui, Vô hiệu hóa và Tiêu diệt hiện có (Retreat / Destroyed Flow)
- Đơn vị rút lui được xử lý qua hàm `orderGearRetreat(gear, retreatDurationRounds)`:
  - Chuyển `gear.state` từ `"ACTIVE"` sang `"RETREATING"`.
  - Khởi tạo bộ đếm hiệp rút lui: `gear.retreatTurnsRemaining = retreatDurationRounds` (mặc định 2 hiệp).
  - Ở cuối mỗi hiệp trong `executeCombatRound`, bộ đếm giảm đi 1. Khi chạm 0, `gear.state` chuyển sang `"RETREATED"` và tạo sự kiện `retreatEvents`.
  - Đơn vị `"RETREATED"` hoàn toàn thoát khỏi vòng lặp tấn công và không thể bị nhắm bắn tiếp.
- Khi `target.currentHp === 0`, chuyển ngay sang `"DESTROYED"`, tạo `destructionEvents`, và ghi nhận vào danh sách ứng viên phi công thoát hiểm `downedPilotCandidates`.

### 6.4. Trạng thái tái sử dụng cho `COMBAT_UNFIT`
- `CombatGearState` hiện tại gồm 4 trạng thái: `"ACTIVE" | "RETREATING" | "RETREATED" | "DESTROYED"`.
- Luồng `orderGearRetreat` hiện có hoàn toàn có thể **TÁI SỬ DỤNG NGAY** cho `COMBAT_UNFIT`: Khi rơi vào `COMBAT_UNFIT`, cỗ máy kích hoạt `orderGearRetreat(gear)` để bắt đầu tiến trình rút lui về tàu mẹ hoặc hangar.
- Cần mở rộng trường cờ trên `CombatV2Gear`: `isCombatUnfit?: boolean` để UI và battle log nhận diện nguyên nhân rút lui là do kiệt quệ tình trạng kỹ thuật.

### 6.5. Kiểm tra thực thể Mother Ship / Command Ship / Hangar
- **Trong `lib/game/world/`:** Hiện **CHƯA CÓ** thực thể runtime nào đại diện cho Mother Ship, Command Ship, hay Rescue Ship dưới vai trò là trạm neo đậu có xưởng sửa chữa.
- "mothership" hiện mới chỉ là một enum `SectorKind` trong Core Game đại diện cho sector boss của kẻ thù.
- "hangar" hiện mới chỉ là chỉ số công trình cấp 1–30 tại Player Core Base.
- **Đánh giá mở rộng Model:** Cần mở rộng định nghĩa hạm đội và tàu mẹ (Fleet / Flagship entity) trong Phase 6.34D (Rescue Fleet) và Phase 6.35 (GEAR Logistics) để gán chỉ số `ShipRepairCapacityPerDay`.

---

## 7. DANH MỤC THUẬT NGỮ & KHÁI NIỆM ĐÃ PHÊ DUYỆT (APPROVED CONCEPT CATALOG)

```text
BaseInstallationRepairHpDay:
Tổng năng lực sửa chữa điểm máu (HP) cơ sở vật chất mỗi ngày của một căn cứ hoặc trạm không gian.
Là Shared Capacity cho cả Combat HP Repair và Maintenance Condition HP Restore.

FacilityRepairCapacityPerDay:
Năng lực sửa chữa cơ sở vật chất cố định đến từ nhà xưởng, trạm bảo dưỡng, dây chuyền robot tự động.

WorkerRepairCapacityPerDay:
Tổng năng lực sửa chữa đóng góp từ toàn bộ đội ngũ nhân sự kỹ thuật thực tế đang làm việc tại căn cứ.
Công thức: ActiveTechnicalWorkers * TechnicalWorkerRepairHPPerDay.

ActiveTechnicalWorkers:
Số lượng nhân viên kỹ thuật, thợ máy, chuyên viên bảo trì thực tế đang được điều động và trực tiếp làm việc tại căn cứ.

TechnicalWorkerRepairHPPerDay:
Định mức năng suất sửa chữa trung bình của một nhân viên kỹ thuật trong một ngày chiến lược (HP/người/ngày).

ConditionHP:
Điểm đo lường tình trạng hao mòn và kỹ thuật của khí tài ngoài điểm HP chiến đấu.

ConditionHPMax:
Mức trần tình trạng kỹ thuật tối đa của khí tài. Mặc định bằng MaxHP.

CombatMinimumConditionRatio:
Ngưỡng Condition tối thiểu để GEAR còn đủ tiêu chuẩn kỹ thuật tiếp tục chiến đấu. Default: 0.05.

COMBAT_UNFIT:
Trạng thái khí tài mất khả năng duy trì chiến đấu do kiệt quệ kỹ thuật; bắt buộc phải rút lui.

FieldRepairConditionRecoveryRatio:
Tỷ lệ phục hồi Condition khi sửa chữa ngoài thực địa / dùng Nano Kit. Default: 0.50.

ShipRepairCapacityPerDay:
Tổng năng lực sửa chữa điểm máu mỗi ngày trên Tàu Mẹ / Soái Hạm. Kế thừa semantics từ Base.

ShipMaintenanceEfficiencyRatio:
Hệ số hiệu suất bảo trì kỹ thuật trên Tàu Mẹ. Default: 1.5. Độc lập với Base ratio.

MaintenanceTriggerMinRatio:
Ngưỡng tỷ lệ tối thiểu (mặc định 0.50). Dưới ngưỡng này khí tài bắt buộc phải đưa vào bảo trì và bị cấm triển khai.

MaintenanceTriggerMaxRatio:
Ngưỡng tỷ lệ tối đa (mặc định 0.90). Dưới ngưỡng này khí tài có thể được bảo dưỡng tự nguyện.
```

---

## 8. KẾT LUẬN & KIỂM TRA HỆ THỐNG

1. **An toàn mã nguồn:** Không có bất kỳ thay đổi nào tác động đến production logic code (`lib/game/world/*`, `lib/game/*`).
2. **Khả năng tương thích:** Toàn bộ 13 công trình và 6 phân khu hiện có được bảo toàn 100%, có lộ trình chuyển tiếp rõ ràng sang các Phase 6.35–6.43 của roadmap thiên hà.
3. **Kiểm tra hồi quy:** Toàn bộ các test suite hiện hữu đạt kết quả **PASS 100%**.

---
*Tài liệu đối chiếu và phân tích hiện trạng được cập nhật và đóng băng kiến trúc an toàn.*

