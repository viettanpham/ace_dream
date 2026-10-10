# STARFRONT — Khảo Sát Hiện Trạng 3 Lớp Cơ Giáp (Gear Current State Dossier)

Tài liệu khảo sát hiện trạng kỹ thuật của 3 lớp Cơ Giáp (Gear) hiện hữu trong STARFRONT: **Vanguard**, **Falcon**, và **Aegis**.
Mọi dữ liệu trong tài liệu này được đối chiếu trực tiếp từ mã nguồn thực tế tại `lib/game/types.ts`, `lib/game/data.ts`, `lib/game/engine.ts`, `lib/game/progression.ts` và các thành phần giao diện liên quan.

---

## 1. Bảng Ma Trận Định Danh & Vai Trò (Identity & Asset Dossier)

| Thuộc tính | Vanguard Gear | Falcon Gear | Aegis Gear |
|---|---|---|---|
| **Mã định danh (ID)** | `"vanguard"` | `"falcon"` | `"aegis"` |
| **Tên hiển thị** | Vanguard Gear (`Vanguard Fighter`) | Falcon Gear (`Falcon Interceptor`) | Aegis Gear (`Aegis Siege Fortress`) |
| **Màu sắc chủ đạo (Theme)** | Cyan (`#06b6d4`, `var(--color-gear-i)` / cyan-500) | Tím Neon (`#a855f7`, `var(--color-gear-b)` / purple-500) | Hổ Phách / Vàng Kim (`#f59e0b`, `var(--color-gear-a)` / amber-500) |
| **Minh họa chính (SVG)** | `/images/vanguard.svg` | `/images/falcon.svg` | `/images/aegis.svg` |
| **Ảnh chân dung mặc định** | `/images/marcus-portrait.jpg` | `/images/alviss-portrait.jpg` | `/images/valentine-portrait.jpg` |
| **Vai trò thiết kế (Role)** | Cơ Giáp Cân Bằng (*Balanced Striker*) | Tiêm Kích Tốc Độ (*Speed Infiltrator*) | Pháo Đài Bọc Thép (*Heavy Siege Armor*) |
| **Khẩu hiệu chiến thuật** | "Cân bằng hoàn hảo giữa hỏa lực, bảo hộ và tốc độ" | "Luôn giành quyền ra đòn trước tiên, hỏa lực sắc bén" | "Máu cực dày, phòng thủ kiên cố, pháo hạt nhân khủng khiếp" |
| **Phi công hiệp đồng gợi ý** | **Marcus Thorne** (*WAR DOG*) | **Alviss / Levi Reed** (*SHADOW FALCON*) | **Valentine Vance** (*AEGIS ANGEL*) |
| **Danh hiệu Hiệp đồng** | "Hiệp Đồng Hỏa Lực Vanguard" | "Hiệp Đồng Tốc Biến Falcon" | "Hiệp Đồng Bất Hoại Aegis" |
| **Vị trí khai báo** | `lib/game/data.ts: STARFRONT_GEAR_DEFS.vanguard` | `lib/game/data.ts: STARFRONT_GEAR_DEFS.falcon` | `lib/game/data.ts: STARFRONT_GEAR_DEFS.aegis` |

---

## 2. Thông Số Cơ Bản, Tăng Trưởng & Công Thức Chỉ Số (Base Stats & Growth)

### 2.1. Bảng Chỉ Số Gốc (Level 1) & Tăng Trưởng Mỗi Cấp

Các chỉ số được khai báo trong `StarfrontGearClassDef` (`lib/game/data.ts: STARFRONT_GEAR_DEFS`):

| Chỉ số | Vanguard (Gốc / Tăng) | Falcon (Gốc / Tăng) | Aegis (Gốc / Tăng) | Ý nghĩa chiến đấu |
|---|:---:|:---:|:---:|---|
| **Độ bền (HP)** | 1,250 / +80 | 980 / +60 | 1,800 / +120 | Lượng máu gánh chịu sát thương thực tế |
| **Năng lượng (SP)** | 100 / +10 | 110 / +12 | 90 / +8 | Bể chứa năng lượng thi triển kỹ năng (Max SP) |
| **Tấn công (ATK)** | 145 / +12 | 165 / +15 | 175 / +14 | Lực sát thương cơ bản trước giảm trừ giáp |
| **Phòng thủ (DEF)** | 75 / +6 | 50 / +4 | 120 / +10 | Giá trị giảm trừ sát thương theo đường cong bão hòa |
| **Tốc độ (SPD)** | 85 / +2 | 125 / +4 | 60 / +1 | Sáng kiến xác định thứ tự lượt hành động |
| **Khiên cơ sở (Shield)** | 300 | 180 | 480 | Khiên hấp thụ sát thương trước HP (`progression.ts`) |
| **Tỉ lệ Bạo kích (Crit)** | 15% (1.5x) | 25% (1.75x) | 15% (1.5x) | Khả năng và hệ số nhân sát thương chí mạng |
| **Né tránh bẩm sinh (EVA)**| 0% | +15% | 0% | Tỉ lệ né tránh đòn đánh độc quyền |

### 2.2. Công Thức Tính Chỉ Số Tổng Thể (`progression.ts: calculateTotalGearStats`)

Chỉ số chiến đấu cuối cùng của Cơ giáp được phân rã thành 3 thành phần độc lập:

$$\text{FinalStat} = \text{BaseStat}(\text{Level}) + \text{EquipmentBonus} + \text{PilotBonus}$$

1. **Khung thân cơ sở theo cấp độ người chơi** (`level`):
   $$\text{BaseStat} = \text{baseStats} + \text{growth} \times (\text{level} - 1)$$
2. **Cộng dồn từ Trang bị Hangar** (3 ô: Weapon, Shield, Engine):
   - Tính toán qua `getEnhancedItemStats(item)` bao gồm cấp cường hóa `+1..+10` (+12% đến +155% chỉ số gốc).
   - Cộng dồn `hpBonus`, `spBonus`, `attackBonus`, `defenseBonus`, `speedBonus`.
3. **Cộng dồn từ Điểm Phân Bổ Phi Công** (`pilotData.allocatedStats`):
   - Tấn công: $+2.0\ \text{ATK} \times \text{allocated.attack}$
   - Phòng ngự: $+1.5\ \text{DEF} \times \text{allocated.defense}$
   - Cơ động: $+1.0\ \text{SPD} \times \text{allocated.agility}$
   - Khiên tối đa: $+30\ \text{Shield} \times \text{allocated.shield}$
   - Chiến thuật: $+0.4\%\ \text{Crit} \times \text{allocated.tactical}$
   - Tỉ lệ né tránh phụ: $+0.2\%\ \text{EVA} \times \text{allocated.agility}$

---

## 3. Bản Sắc Nội Tại Độc Quyền (Gear Passives In Combat)

Mỗi Cơ giáp có một kỹ năng nội tại can thiệp sâu vào vòng lặp chiến đấu tại `lib/game/engine.ts`:

### 3.1. Vanguard — Lõi Năng Lượng Ổn Định (`stable-core`)
- **Triển khai tại code**: `lib/game/engine.ts: tickUnitTurn` (dòng 840–858).
- **Cơ chế 1 (Hồi SP)**: Tại đầu mỗi lượt đi, ngoài +5 SP hồi phục tự nhiên, Vanguard nhận thêm **+5 SP** (tổng hồi **+10 SP/lượt**).
- **Cơ chế 2 (Giảm CD chu kỳ)**: Tại mỗi chu kỳ 3 lượt (`turnNumber % 3 === 0` với $turn > 0$), tự động giảm thêm **1 lượt hồi chiêu** cho kỹ năng đang có thời gian hồi lớn nhất.

### 3.2. Falcon — Khí Động Học Mach (`mach-aero`)
- **Triển khai tại code**: `lib/game/engine.ts: getEffectiveEvasion` (dòng 558–561) và `calculateCombatDamage` (dòng 748, 1030–1047).
- **Cơ chế 1 (Né tránh bẩm sinh)**: Tự động cộng cố định **+15% Tỉ lệ Né tránh** vào chỉ số hiệu dụng (Evasion tối đa kẹp biên ở mức 85%).
- **Cơ chế 2 (Bạo kích bẩm sinh)**: Bạo kích cơ sở nâng lên **25%** (thay vì 15%), sát thương bạo kích đạt **1.75x** (thay vì 1.5x).
- **Cơ chế 3 (Đòn bắn phụ siêu tốc)**: Khi một đòn đánh gây bạo kích, có **50% tỉ lệ** tự động kích hoạt một đòn bắn bồi không tốn SP, gây thêm sát thương bằng $50\%$ sát thương chí mạng gốc (tối thiểu 25 DMG).

### 3.3. Aegis — Giáp Phản Lực Titan (`titan-reactive`)
- **Triển khai tại code**: `lib/game/engine.ts: applyStatusEffect` (dòng 582–593) và `executeEnemyAIAction` (dòng 1468–1472).
- **Cơ chế 1 (Phản đòn sát thương)**: Khi kẻ địch gây sát thương trúng Aegis, lớp khiên gai titan tự động phản ngược lại **20% sát thương nhận vào** trừ thẳng vào HP của kẻ địch (`aegisReflectDamage = Math.max(1, Math.round(damage * 0.20))`).
- **Cơ chế 2 (Kháng debuff)**: Triệt tiêu **50% hiệu lực** của hiệu ứng làm chậm (`emp-slow` giảm từ -25 SPD xuống -13 SPD) và phá giáp (`armor-break` giảm từ -35% xuống -18% hoặc từ -45% xuống -23%).

---

## 4. Bộ Kỹ Năng Tác Chiến Hiện Tại (Combat Skill Registry)

Toàn bộ kỹ năng được định nghĩa cố định tại `lib/game/data.ts`:

### 4.1. Vanguard Skills (`VANGUARD_SKILLS`)
1. `basic-attack` (**Pháo Năng Lượng Thường** / *Photon Blaster*): 0 SP, 0 CD, Đơn mục tiêu, $100\%$ ATK, **hồi phục +15 SP**.
2. `pulse-strike` (**Xung Kích Quang** / *Pulse Strike*): 25 SP, 0 CD, Đơn mục tiêu, $150\%$ ATK.
3. `armor-break` (**Phá Giáp Cơ Khí** / *Armor Break*): 35 SP, 3 CD, Đơn mục tiêu, $115\%$ ATK, **giảm 35% DEF mục tiêu trong 2 lượt**.
4. `emergency-guard` (**Lá Chắn Khẩn Cấp** / *Emergency Guard*): 30 SP, 4 CD, Bản thân, **giảm 50% mọi sát thương nhận vào trong 2 lượt**.

### 4.2. Falcon Skills (`FALCON_SKILLS`)
1. `basic-attack` (**Tia Laser Xung Kích** / *Pulse Laser*): 0 SP, 0 CD, Đơn mục tiêu, $100\%$ ATK, **hồi phục +15 SP**.
2. `ghost-dash` (**Lướt Vô Ảnh** / *Ghost Dash*): 30 SP, 3 CD, Đơn mục tiêu, $125\%$ ATK, **bản thân giảm 40% sát thương trong 2 lượt**.
3. `falcon-barrage` (**Mưa Laser Siêu Tốc** / *Laser Barrage*): 35 SP, 0 CD, Đơn mục tiêu, $165\%$ ATK (Thiên hướng bạo kích cao).
4. `falcon-overdrive` (**Quá Tải Lõi Động Cơ** / *Overdrive Surge*): 25 SP, 4 CD, Bản thân, **giảm 50% sát thương nhận vào trong 2 lượt**.

### 4.3. Aegis Skills (`AEGIS_SKILLS`)
1. `basic-attack` (**Đại Pháo Hạng Nặng** / *Heavy Auto Cannon*): 0 SP, 0 CD, Đơn mục tiêu, $100\%$ ATK, **hồi phục +15 SP**.
2. `aegis-shell` (**Pháo Hạt Nhân Hủy Diệt** / *Nuclear Siege Shell*): 35 SP, 0 CD, Đơn mục tiêu, $180\%$ ATK xuyên phá.
3. `armor-break` (**Xung Chấn Phá Giáp** / *Armor Disruptor*): 30 SP, 3 CD, Đơn mục tiêu, $120\%$ ATK, **giảm 45% DEF mục tiêu trong 2 lượt**.
4. `emergency-guard` (**Lá Chắn Titan Tuyệt Đối** / *Absolute Titan Barrier*): 35 SP, 4 CD, Bản thân, **giảm 65% mọi sát thương nhận vào trong 2 lượt**.

---

## 5. Khác Biệt Thực Tế Giữa 3 Gear Trong Combat Engine

| Tiêu chí | Vanguard Gear | Falcon Gear | Aegis Gear | Nguồn đối chiếu code |
|---|---|---|---|---|
| **Ưu thế Lượt đi (Initiative)** | Trung bình (SPD 85) | **Cực cao (SPD 125)** — hầu như luôn đi trước | Thấp (SPD 60) — thường đi sau địch | `engine.ts: calculateTurnQueue` |
| **Khả năng Né đòn (Evasion)** | Phụ thuộc điểm AGI | **Cực cao (+15% gốc + đòn bồi)** | Thấp, chấp nhận gánh đòn | `engine.ts: getEffectiveEvasion` |
| **Sức bền Khiên (Shield)** | 300 | 180 | **480 (Dày nhất game)** | `progression.ts: buildPlayerCombatUnit` |
| **Chu kỳ Hồi chiêu (CD)** | **Nhanh nhất** (-1 CD mỗi 3 lượt) | Tiêu chuẩn | Tiêu chuẩn | `engine.ts: tickUnitTurn` |
| **Quản trị Năng lượng (SP)** | **Dồi dào nhất** (+10 SP/lượt) | Tiêu chuẩn (+5 SP/lượt) | Thấp nhất (Max SP 90, +5/lượt) | `engine.ts: tickUnitTurn` |
| **Phản đòn khi bị đánh** | Không | Không | **Có (Phản 20% sát thương)** | `engine.ts: executeEnemyAIAction` |
| **Kháng hiệu ứng bất lợi** | Không | Không | **Kháng 50% EMP Slow & Armor Break** | `engine.ts: applyStatusEffect` |
| **Độ giảm thương tối đa** | 50% (Emergency Guard) | 50% (Overdrive) / 40% (Ghost Dash) | **65% (Absolute Titan Barrier)** | `data.ts: AEGIS_SKILLS` |

---

## 6. Ma Trận Trạng Thái Triển Khai Kỹ Thuật (Implementation Status Matrix)

| Hạng mục chức năng | Trạng thái kỹ thuật | Ghi chú và Bằng chứng mã nguồn |
|---|:---:|---|
| Định danh, màu sắc, hình ảnh 3 Gear | `IMPLEMENTED` | `lib/game/data.ts: STARFRONT_GEAR_DEFS`, `/public/images/{vanguard,falcon,aegis}.svg` |
| Bảng chỉ số cơ sở và tăng trưởng cấp độ | `IMPLEMENTED` | `lib/game/data.ts: baseStats, growth`; `lib/game/progression.ts: calculateTotalGearStats` |
| Lực chiến tổng thể (Gear Combat Rating) | `IMPLEMENTED` | `lib/game/progression.ts: calculateGearCombatRating` |
| 3 Kỹ năng nội tại Gear trong Engine | `IMPLEMENTED` | `lib/game/engine.ts` (Stable Core, Mach Aero, Titan Reactive) |
| Bộ 4 kỹ năng tác chiến trong Arena Deck | `IMPLEMENTED` | `lib/game/data.ts` (Vanguard, Falcon, Aegis skills); `components/game/combat-arena.tsx` |
| 3 Vị trí trang bị Hangar & Cường hóa | `IMPLEMENTED` | Weapon, Shield, Engine; Cường hóa +1..+10 tại `starfront-hangar.tsx` |
| Menu chọn độc lập & Khóa 5 trận xuất kích | `IMPLEMENTED` | `components/game/character-gear-select.tsx`, Schema v4 tại `storage.ts` |
| Ô kỹ năng thứ 5 (Tuyệt kỹ Tối thượng) | `UI_ONLY` | Chỉ có hàm sinh hiển thị `buildDetailedSkillSlots` trong `starfront-hangar.tsx`, chưa có trong `CombatUnit.skills` hay buồng lái `combat-arena.tsx` |
| Nâng cấp cấp ô kỹ năng (Slot Level 1..20) | `DATA_ONLY` | Đã có trường `gearSlotLevels` trong Schema v4 (`storage.ts`), nhưng chưa có giao diện chi tiêu điểm hay hàm tính toán trong engine |
| Kho đĩa mô-đun kỹ năng rời (Skill Modules) | `NOT_IMPLEMENTED` | Kỹ năng vẫn gắn cứng theo mảng tĩnh `gearDef.skills` |
| Cơ chế nhiều mẫu mã (Models) trong 1 Gear | `NOT_IMPLEMENTED` | Mỗi class hiện tại chỉ có duy nhất 1 model tương ứng với chính ID của nó |
