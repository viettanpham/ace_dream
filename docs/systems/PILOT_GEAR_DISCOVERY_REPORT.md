# STARFRONT — Báo Cáo Khảo Sát Kiến Trúc Toàn Diện: Pilot, Gear & Combat (Architecture Discovery Report)

*Ngày lập báo cáo: Tháng 10/2026*  
*Chế độ khảo sát: Read-Only / Kiến trúc & Khảo sát mã nguồn thực tế*  
*Mục tiêu: Đánh giá hiện trạng 3 Gear, 4 Pilot, cơ chế Combat, đối chiếu tài liệu kỹ thuật và mã nguồn để chuẩn bị thiết kế mở rộng.*

---

## MỤC LỤC
1. [Khảo Sát Chi Tiết 3 Lớp Cơ Giáp (Vanguard, Falcon, Aegis)](#1-khảo-sát-chi-tiết-3-lớp-cơ-giáp)
2. [Khảo Sát Hệ Thống Pilot & Nhân Vật (Marcus, Valentine, Alviss, Eric)](#2-khảo-sát-hệ-thống-pilot--nhân-vật)
3. [Khảo Sát Kỹ Năng, Mô-đun & Buồng Lái Chiến Đấu](#3-khảo-sát-kỹ-năng-mô-đun--buồng-lái-chiến-đấu)
4. [Đối Chiếu Chi Tiết: Tài Liệu Dự Án vs Mã Nguồn Thực Tế](#4-đối-chiếu-chi-tiết-tài-liệu-dự-án-vs-mã-nguồn-thực-tế)
5. [Phân Định Hai Phân Hệ: STARFRONT vs Ace Manager (Legacy)](#5-phân-định-hai-phân-hệ-starfront-vs-ace-manager-legacy)
6. [Khoảng Trống Kỹ Thuật & Đề Xuất Cho Hệ Thống 12 Pilot & Gear Mở Rộng](#6-khoảng-trống-kỹ-thuật--đề-xuất-cho-hệ-thống-12-pilot--gear-mở-rộng)

---

## 1. KHẢO SÁT CHI TIẾT 3 LỚP CƠ GIÁP

Hệ thống cơ giáp cốt lõi của STARFRONT được quản lý tập trung tại `lib/game/data.ts` (symbol `STARFRONT_GEAR_DEFS`), `lib/game/types.ts` (`StarfrontGearClassDef`, `StarfrontGearId`), và `lib/game/progression.ts` (`getBaseStatsForGearAndLevel`, `calculateTotalGearStats`, `buildPlayerCombatUnit`).

### 1.1. Bảng Dữ Liệu Định Danh & Asset 3 Gear

| Thông số | Vanguard Gear | Falcon Gear | Aegis Gear |
|---|---|---|---|
| **ID Mã Nguồn** | `"vanguard"` | `"falcon"` | `"aegis"` |
| **Tên Hiển Thị** | `Vanguard Gear` | `Falcon Gear` | `Aegis Gear` |
| **Tên Tiếng Anh** | `Vanguard Fighter` | `Falcon Interceptor` | `Aegis Siege Fortress` |
| **Vai Trò Thiết Kế** | `Cơ Giáp Cân Bằng (Balanced Striker)` | `Tiêm Kích Tốc Độ (Speed Infiltrator)` | `Pháo Đài Bọc Thép (Heavy Siege Armor)` |
| **Màu Nhận Diện** | `#06b6d4` (Cyan) | `#a855f7` (Purple) | `#f59e0b` (Amber) |
| **File Minh Họa** | `/images/vanguard.svg` | `/images/falcon.svg` | `/images/aegis.svg` |
| **File Avatar Mặc Định** | `/images/marcus-portrait.jpg` | `/images/alviss-portrait.jpg` | `/images/valentine-portrait.jpg` |
| **Mô Tả Kỹ Thuật** | Cơ giáp chiến đấu đa dụng tiêu chuẩn. Cân bằng giữa hỏa lực, bảo hộ và cơ động. | Chuyên cơ săn lùng tốc độ cao. Luôn giành quyền ra đòn trước tiên, hỏa lực bén, giáp nhẹ. | Cỗ máy chiến tranh hạng nặng bọc giáp titan. Máu dày, phòng thủ kiên cố, pháo hạt nhân. |

*Dẫn chứng mã nguồn*: `lib/game/data.ts:909-1018`.

---

### 1.2. Chỉ Số Gốc & Công Thức Tăng Trưởng (Base Stats & Scaling)

Công thức tính chỉ số cơ bản của Gear theo cấp độ người chơi được định nghĩa tại `lib/game/progression.ts:356-367`:
$$\text{Stat}_{\text{level}} = \text{BaseStat} + (\text{level} - 1) \times \text{GrowthStat}$$

#### Bảng Giá Trị Thực Tế Trong Code:

| Thuộc Tính | Vanguard (Gốc / Tăng trưởng) | Falcon (Gốc / Tăng trưởng) | Aegis (Gốc / Tăng trưởng) |
|---|---|---|---|
| **Máu (HP)** | `1,250` (+80 / cấp) | `980` (+60 / cấp) | `1,800` (+120 / cấp) |
| **Năng Lượng (SP)** | `100` (+10 / cấp) | `110` (+12 / cấp) | `90` (+8 / cấp) |
| **Tấn Công (ATK)** | `145` (+12 / cấp) | `165` (+15 / cấp) | `175` (+14 / cấp) |
| **Phòng Ngự (DEF)** | `75` (+6 / cấp) | `50` (+4 / cấp) | `120` (+10 / cấp) |
| **Tốc Độ (SPD)** | `85` (+2 / cấp) | `125` (+4 / cấp) | `60` (+1 / cấp) |

*Quan sát kiến trúc*:
- **Aegis** sở hữu HP gốc cao nhất (1,800) và DEF cao nhất (120), ATK gốc 175 (rất cao để phản ánh pháo hạt nhân) nhưng SPD rất thấp (60).
- **Falcon** có SPD vượt trội (125 so với quái Scout Drone 110), đảm bảo luôn đi trước ở cấp 1; nhưng HP (980) và DEF (50) rất mỏng.
- **Vanguard** có chỉ số phân bổ đồng đều nhất (HP 1,250, SPD 85, ATK 145, DEF 75).

---

### 1.3. Chỉ Số Chiến Đấu Đang Thực Sự Hoạt Động (Effective Combat Stats)

Trong `buildPlayerCombatUnit` (`lib/game/progression.ts:515-588`):
1. **Khiên (Shield / MaxShield)**:
   - Base Shield theo Gear: Aegis = `480`, Vanguard = `300`, Falcon = `180`.
   - Bonus từ Pilot: `+30 Shield` cho mỗi điểm thuộc tính Shield mà phi công phân bổ.
2. **Né Tránh (Evasion)**:
   - Falcon: `+15%` né tránh bẩm sinh (`gearType === "falcon"`).
   - Vanguard / Aegis: `0%` né tránh bẩm sinh.
   - Thêm `+8%` nếu Pilot là Alviss, và `+0.2%` né tránh cho mỗi điểm Agility của phi công. Giới hạn kẹp biên tối đa: `85%`.
3. **Tỉ Lệ Bạo Kích (Crit Rate)**:
   - Falcon: `25%` (0.25).
   - Vanguard / Aegis: `15%` (0.15).
   - Thêm `+0.4%` mỗi điểm Tactical của phi công. Kẹp biên tối đa: `75%`.
4. **Sát Thương Bạo Kích (Crit Damage)**:
   - Falcon: `1.75x`.
   - Vanguard / Aegis: `1.50x`.
5. **Xuyên Giáp (Armor Penetration)**:
   - Gốc theo Gear: `0%`.
   - Kích hoạt `+20%` (0.20) cố định nếu Pilot là Eric (`bunker-breaker`).

---

### 1.4. Kỹ Năng Nội Tại Của 3 Gear (Gear Passives)

Triển khai tại `lib/game/engine.ts`:

1. **Vanguard — Lõi Năng Lượng Ổn Định (`stable-core`)**:
   - `tickUnitTurn` (`engine.ts:841-859`): Hồi thêm `+5 SP` mỗi lượt (tổng `+10 SP/lượt`).
   - Cứ mỗi chu kỳ 3 lượt (`turnNumber % 3 === 0`), tự động giảm thêm 1 lượt hồi chiêu cho kỹ năng đang hồi lâu nhất.
2. **Falcon — Khí Động Học Mach (`mach-aero`)**:
   - `getEffectiveEvasion` (`engine.ts:559`): Tự động cộng vĩnh viễn `+15%` né tránh.
   - `executePlayerAction` (`engine.ts:1034-1047`): Khi đòn đánh bạo kích, có `50% tỉ lệ` tự động bắn thêm một phát bắn bồi (0 SP), gây thêm `50%` sát thương của đòn bạo kích (tối thiểu 25 DMG).
3. **Aegis — Giáp Phản Lực Titan (`titan-reactive`)**:
   - `applyStatusEffect` (`engine.ts:585-593`): Kháng `50%` hiệu lực của `emp-slow` và `armor-break` (giảm chỉ số phạt còn 1/2).
   - `executeEnemyAIAction` (`engine.ts:1468-1528`): Khi nhận sát thương từ địch, khiên gai phản lại `20%` sát thương nhận vào (tối thiểu 1 DMG) thẳng vào kẻ địch. Nếu đòn phản sát thương triệt hạ địch, lập tức chiến thắng trận đấu.

---

### 1.5. Bộ Kỹ Năng Đang Gắn Trên 3 Gear (Active Deck)

Hiện tại, mỗi Gear sở hữu bộ 4 kỹ năng trong `data.ts`:

#### Vanguard (`VANGUARD_SKILLS`, `data.ts:480-524`):
1. `basic-attack` (Pháo Năng Lượng Thường): 0 SP, 0 CD, 100% ATK, hồi +15 SP.
2. `pulse-strike` (Xung Kích Quang): 25 SP, 0 CD, 150% ATK.
3. `armor-break` (Phá Giáp Cơ Khí): 35 SP, 3 CD, 115% ATK, giảm 35% DEF địch trong 2 lượt.
4. `emergency-guard` (Lá Chắn Khẩn Cấp): 30 SP, 4 CD, tự buff giảm 50% sát thương trong 2 lượt.

#### Falcon (`FALCON_SKILLS`, `data.ts:817-861`):
1. `basic-attack` (Tia Laser Kép Siêu Tốc): 0 SP, 0 CD, 100% ATK, hồi +15 SP.
2. `falcon-dash` (Lướt Vô Ảnh): 30 SP, 3 CD, 125% ATK, giảm 40% sát thương nhận trong 2 lượt.
3. `falcon-barrage` (Mưa Laser Siêu Tốc): 35 SP, 0 CD, 165% ATK.
4. `falcon-overdrive` (Quá Tải Lõi Động Cơ): 25 SP, 4 CD, tự buff giảm 50% sát thương trong 2 lượt.

#### Aegis (`AEGIS_SKILLS`, `data.ts:863-907`):
1. `basic-attack` (Đại Pháo Hạng Nặng): 0 SP, 0 CD, 100% ATK, hồi +15 SP.
2. `aegis-shell` (Pháo Hạt Nhân Hủy Diệt): 35 SP, 0 CD, 180% ATK.
3. `armor-break` (Xung Chấn Phá Giáp): 30 SP, 3 CD, 120% ATK, giảm 45% DEF địch trong 2 lượt.
4. `emergency-guard` (Lá Chắn Titan Tuyệt Đối): 35 SP, 4 CD, giảm 65% sát thương trong 2 lượt.

---

### 1.6. Trang Bị & Cách Chỉ Số Cộng Vào Gear

- **3 Vị trí**: `weapon`, `shield`, `engine` (`types.ts:412`).
- **Kho & Cường hóa**: Mỗi trang bị có cấp `+0` đến `+10`.
- **Hàm tính toán**: `calculateTotalGearStats` (`progression.ts:375-450`):
  $$\text{TotalStat} = \text{GearBase}(\text{level}) + \sum \text{EnhancedItemBonuses} + \text{PilotAllocatedBonuses}$$
  - Điểm thuộc tính phi công được cộng trực tiếp:
    - `ATK += Pilot.attack * 2.0`
    - `DEF += Pilot.defense * 1.5`
    - `SPD += Pilot.agility * 1.0`

---

## 2. KHẢO SÁT HỆ THỐNG PILOT VÀ NHÂN VẬT

Một phát hiện cấu trúc quan trọng là **trong codebase hiện tồn tại 2 hệ thống dữ liệu Pilot song song**:
1. `PILOT_PROFILES` (`data.ts:72-77`): Dành riêng cho phân hệ **Ace Manager (Legacy)**.
2. `STARFRONT_PILOTS` (`data.ts:1531-1716`): Dành riêng cho phân hệ **STARFRONT (Phase 5.8)**.

### 2.1. Bảng So Sánh 4 Nhân Vật Trong Hai Hệ Thống

#### Marcus
- **Ace Manager (`PILOT_PROFILES`)**:
  - Tên: Marcus, Tuổi: 30, Giới tính: Nam, Gear liên kết: `A-Gear` (Heavy Armor).
  - Base Stats: ATK 10, DEF 5, AGI 4, Shield 8, Vision 3.
  - Skills: Siege Mode, Snare Shot, Barrier + 5 kỹ năng chung.
  - Trail: +20% vũ khí Cannon, +30% Armor.
- **STARFRONT (`STARFRONT_PILOTS`)**:
  - Tên: `Marcus Thorne`, Callsign: `WAR DOG`, Danh hiệu: `Chuyên Gia Vũ Khí (Weapons Specialist)`.
  - Tuổi: 30, Giới tính: Nam.
  - Khuyến nghị Gear: `vanguard` (Synergy: +10% sát thương kỹ năng & hồi phục năng lượng).
  - Passive độc quyền: `pressing-firepower` (Hỏa Lực Dồn Ép: +8% sát thương khi địch >70% HP).
  - Default Stats: Attack 10, Defense 5, Agility 4, Shield 8, Tactical 3.

#### Valentine
- **Ace Manager (`PILOT_PROFILES`)**:
  - Tên: Valentine, Tuổi: 22, Giới tính: Nữ, Gear liên kết: `M-Gear` (Support / Magician).
  - Base Stats: ATK 3, DEF 8, AGI 4, Shield 9, Vision 6.
  - Skills: Healing Field, Raging Fire, Full Recovery.
  - Trail: +30% Armor, +30% DEF, +30% hồi máu đồng minh.
- **STARFRONT (`STARFRONT_PILOTS`)**:
  - Tên: `Valentine Vance`, Callsign: `AEGIS ANGEL`, Danh hiệu: `Cứu Hộ & Phòng Ngự (Rescue / Support)`.
  - Tuổi: 22, Giới tính: Nữ.
  - Khuyến nghị Gear: `aegis` (Synergy: +15% dung lượng khiên & kháng hiệu ứng).
  - Passive độc quyền: `emergency-overcharge` (Lá Chắn Cấp Cứu: Tái tạo 30% khiên khi vỡ khiên lần đầu, 1 lần/trận).
  - Default Stats: Attack 3, Defense 8, Agility 4, Shield 9, Tactical 6.

#### Alviss / Levi Reed
- **Ace Manager (`PILOT_PROFILES`)**:
  - Tên: Alviss, Tuổi: 24, Giới tính: Nam (khai báo `gender: "Nam"`), Gear liên kết: `I-Gear` (Interceptor).
  - Base Stats: ATK 11, DEF 3, AGI 12, Shield 2, Vision 2.
  - Skills: Frenzy, Overbooster, Berserker.
- **STARFRONT (`STARFRONT_PILOTS`)**:
  - ID lưu trữ: `"alviss"`.
  - Tên hiển thị: `Levi Reed`, Callsign: `SHADOW FALCON`, Danh hiệu: `Nữ Át Chủ Tốc Độ (Supersonic Ace)`.
  - Tuổi: 24, Giới tính: Nữ (khai báo `gender: "Nữ"`).
  - Khuyến nghị Gear: `falcon` (Synergy: +15 SPD trong 3 lượt đầu & +8% né tránh).
  - Passive độc quyền: `falcon-reflexes` (Sáng Kiến Diều Hâu: +15 SPD trong 3 lượt đầu, +8% né tránh vĩnh viễn).
  - Default Stats: Attack 11, Defense 3, Agility 12, Shield 2, Tactical 5.
  *Lưu ý kiến trúc*: ID trong save data và URL code vẫn là `"alviss"`, nhưng tên và visual trong STARFRONT Phase 5.8 là nữ phi công Levi Reed.

#### Eric
- **Ace Manager (`PILOT_PROFILES`)**:
  - Tên: Eric, Tuổi: 22 (trong legacy profile khai báo tuổi 22), Giới tính: Nam, Gear liên kết: `B-Gear` (Bomber).
  - Base Stats: ATK 15, DEF 5, AGI 2, Shield 6, Vision 2.
  - Skills: Ground Bombing, Air Bombing, Big Boom.
- **STARFRONT (`STARFRONT_PILOTS`)**:
  - Tên: `Eric Brandt`, Callsign: `BUNKER BREAKER`, Danh hiệu: `Bậc Thầy Pháo Kích (Aircraft Specialist)`.
  - Tuổi: 28 (trong STARFRONT khai báo 28 tuổi), Giới tính: Nam.
  - Khuyến nghị Gear: `vanguard` (Synergy: +20% xuyên giáp cố định).
  - Passive độc quyền: `bunker-breaker` (Hạt Nhân Xuyên Giáp: Cố định +20% Armor Penetration cho mọi đòn tấn công).
  - Default Stats: Attack 15, Defense 5, Agility 2, Shield 6, Tactical 4.

---

### 2.2. Cơ Chế Tiến Trình Phi Công STARFRONT (Pilot Progression)

Được triển khai đầy đủ tại `lib/game/progression.ts:599-760` và lưu trong `StarfrontProgression.pilots`:
- **Cấp độ (Level 1–30)**: Khởi đầu cấp 1, tối đa cấp 30.
- **EXP Phi Công**:
  $$\text{ExpRequired}(\text{level}) = \text{Math.round}\left(120 \times \text{level}^{1.4}\right)$$
- **Quy tắc nhận EXP**: Chỉ **Phi công đang được ghép đôi trong `activePairing`** mới nhận EXP sau trận đấu trường hoặc nhiệm vụ chiến dịch.
- **Điểm Thuộc Tính (Attribute Points)**:
  - Mỗi khi thăng 1 cấp, phi công nhận **+5 Điểm Thuộc Tính** (`availablePoints += 5`).
  - 5 Nhánh phân bổ:
    1. `attack`: +2.0 ATK / điểm
    2. `defense`: +1.5 DEF / điểm
    3. `agility`: +1.0 SPD / điểm (+0.2% Né tránh)
    4. `shield`: +30 Max Shield / điểm
    5. `tactical`: +0.4% Crit Rate / điểm
- **Tẩy Điểm (Reset Points)**: Hàm `resetPilotPoints` hoàn trả 100% điểm đã phân bổ và khấu trừ một khoản Credits hợp lý (`level * 150`).

### 2.3. Cơ Chế Khóa Cặp Đôi (Pairing Lock & Unlock Rules)

- Khi xác nhận tại Bước 3 trong `character-gear-select.tsx`, trạng thái chuyển thành `isLocked = true`.
- Bộ đếm mở khóa: `completedMissions: 0`, `wonBattles: 0`, `targetCount: 5`.
- Điều kiện mở khóa tự động: Đạt **5 trận thắng đấu trường** HOẶC **5 nhiệm vụ chiến dịch**.
- Khi đang khóa, người chơi vẫn tự do xem hồ sơ và cộng điểm thuộc tính cho cả 4 phi công; việc đổi cặp đôi thi đấu bị khóa cứng.

---

## 3. KHẢO SÁT KỸ NĂNG, MÔ-ĐUN & BUỒNG LÁI CHIẾN ĐẤU

### 3.1. Cấu Trúc Kỹ Năng Hiện Tại Trong Mã Nguồn

Kỹ năng chiến đấu được mô tả bởi `CombatSkill` (`lib/game/types.ts:263-278`):
```typescript
export type CombatSkill = {
  id: string
  name: string
  nameEn: string
  desc: string
  spCost: number
  cooldown: number
  targetType: "single-enemy" | "self"
  damageMultiplier?: number
  defenseReduction?: number
  damageReduction?: number
  effectDuration?: number
  armorPenetration?: number
  statusToApply?: Omit<StatusEffect, "id">
  icon?: string
}
```

### 3.2. Số Lượng Slot Hiện Tại: UI vs Engine

- **Trong Buồng Lái Thực Tế (`engine.ts` & `combat-arena.tsx`)**:
  - `player.skills` chứa **4 kỹ năng cố định** lấy trực tiếp từ `STARFRONT_GEAR_DEFS[activeGear].skills`.
  - Chưa hỗ trợ tháo/lắp kỹ năng trong lúc thi đấu; 4 nút kỹ năng gắn cứng với 4 kỹ năng của Gear.
- **Trong Giao Diện Hangar & Character Gear Select (`starfront-hangar.tsx`, `character-gear-select.tsx`)**:
  - Đã xây dựng khung giao diện **5 Slot Kỹ Năng** (`buildDetailedSkillSlots`):
    - Slot 1: Basic Attack (0 SP)
    - Slot 2: Active Skill 1 (25–35 SP)
    - Slot 3: Active Skill 2 (30–35 SP)
    - Slot 4: Active Skill 3 / Defensive (25–35 SP)
    - Slot 5: Ultimate Skill (60 SP, hiển thị badge ULTIMATE)
  - Hệ thống điểm kỹ năng phi thuyền: `getAircraftSkillPoints(level)` tính toán `(level - 1) * 2` điểm SP.
  - **Trạng thái thực tế**: Khung UI 5 slot và công thức SP đã sẵn sàng, nhưng hệ thống item hóa "Mô-đun Kỹ Năng rời" (nhặt được từ loot, nằm trong kho, tháo lắp vào slot) **chưa được cài đặt trong gameplay engine** (đúng theo trạng thái Planning của tài liệu).

### 3.3. Toàn Bộ Vòng Lặp Trận Đấu (Combat Execution Pipeline)

1. **Khởi tạo (`createInitialCombatState`, `engine.ts:657`)**:
   - Nhân bản `player` và `enemy`.
   - Tính toán Tốc độ hiệu dụng `getEffectiveSpeed(player, 1)` và `getEffectiveSpeed(enemy, 1)`.
   - Nếu `player.speed >= enemy.speed` -> Người chơi đi trước (`player-turn`).
2. **Đầu mỗi lượt (`tickUnitTurn`, `engine.ts:776`)**:
   - Trừ HP nếu có DoT (Plasma Burn 15% ATK, Acid Corrosion 8% ATK x tầng).
   - Giảm hồi chiêu kỹ năng: `cooldown -= 1`.
   - Kiểm tra Stun: nếu bị Stun, bỏ qua hành động.
   - Giảm thời hạn status effects: `duration -= 1`.
   - Hồi tự nhiên +5 SP.
   - Vanguard Passive: Hồi thêm +5 SP (tổng +10 SP) và giảm 1 CD mỗi 3 lượt.
3. **Thực thi hành động (`executePlayerAction` / `executeEnemyAIAction`)**:
   - Trừ SP, kích hoạt CD.
   - `calculateCombatDamage`:
     - Kiểm tra Evasion (Falcon +15%, Alviss +8%, AGI bonus, chênh lệch SPD).
     - Tính DEF bị trừ bởi Armor Penetration (Eric +20%).
     - Tính sát thương gốc, dao động `±6%`.
     - Kiểm tra Crit (Falcon 25% crit, 1.75x dmg; Tactical bonus).
     - Kiểm tra Marcus passive: +8% sát thương nếu máu địch > 70%.
     - Kiểm tra Emergency Guard giảm trừ sát thương.
     - Trừ Khiên (Shield) trước, phần dư trừ vào HP.
     - Kiểm tra Valentine passive: hồi 30% khiên nếu vỡ khiên lần đầu.
     - Kiểm tra Aegis passive: phản 20% sát thương vào kẻ tấn công.
     - Kiểm tra Falcon passive: 50% tỉ lệ bắn bồi khi crit.
4. **Kết thúc trận**:
   - Nếu Enemy HP <= 0 -> `status = "victory"`.
   - Nếu Player HP <= 0 -> `status = "defeat"`.
   - Gọi `processPairingProgressionAfterActivity` để trao EXP cho phi công đang ghép đôi và tăng tiến độ mở khóa (1/5).

---

## 4. ĐỐI CHIẾU CHI TIẾT: TÀI LIỆU DỰ ÁN VS MÃ NGUỒN THỰC TẾ

| Hạng Mục | Mô Tả Trong Tài Liệu | Trạng Thái Trong Mã Nguồn Thực Tế | Nhận Xét & Đối Chiếu |
|---|---|---|---|
| **3 Lớp Cơ Giáp (VG, FL, AG)** | Phase 3 & Milestone 5.2 | Đã triển khai đầy đủ (`STARFRONT_GEAR_DEFS`) | Khớp 100%. Đầy đủ base stats, growth, passives, và 4 skills riêng. |
| **Nội Tại Cơ Giáp** | Stable Core, Mach Aero, Titan Reactive | Đã triển khai đầy đủ trong `engine.ts` | Khớp 100%. Có cả test tự động kiểm chứng (`passives.test.ts`). |
| **4 Hồ Sơ Phi Công STARFRONT** | Marcus, Valentine, Alviss, Eric | Đã triển khai đầy đủ (`STARFRONT_PILOTS`) | Khớp 100%. Riêng Alviss trong STARFRONT hiển thị là nữ phi công Levi Reed. |
| **Quy Trình Ghép Đôi 3 Bước** | Phase 5.8 | Đã triển khai trong `character-gear-select.tsx` | Khớp 100%. Bước 1 Pilot, Bước 2 Gear, Bước 3 Review & Confirm. |
| **Cơ Chế Khóa 5 Trận / Nhiệm Vụ** | Phase 5.8 | Đã triển khai trong `progression.ts:649` | Khớp 100%. Lưu trong `activePairing`, mở khóa khi đạt 5 trận. |
| **Cộng 5 Điểm Thuộc Tính / Cấp** | Phase 5.8 (+2 ATK, +1.5 DEF, +1 SPD, +30 Khiên, +0.4% Crit) | Đã triển khai trong `progression.ts:418-430, 540-555` | Khớp 100%. Đã tích hợp đầy đủ vào `buildPlayerCombatUnit`. |
| **Hệ Thống 5 Slot Kỹ Năng Rời (Modules)** | Milestone 5.7 (Planning) | Khung UI đã có trong Hangar, **mã gameplay chưa triển khai** | Hoàn toàn đúng như tài liệu ghi: Đang ở giai đoạn Planning. |
| **Lớp Cơ Giáp Thứ Tư: Specter** | Milestone 5.7 (Planning) | Chưa có trong `STARFRONT_GEAR_DEFS` | Đúng với tài liệu: Mới có đặc tả thiết kế, chưa triển khai code. |
| **Cấp Cường Hóa +1 Đến +10** | Milestone 5.1 | Đã triển khai đầy đủ (`ENHANCEMENT_TABLE`) | Khớp 100%. Có bảng tỉ lệ, chống rớt cấp, tăng chỉ số lũy tiến. |
| **Tái Chế / Rã Đồ (Salvage)** | Milestone 5.3 | Đã triển khai đầy đủ (`salvageItem`) | Khớp 100%. Thu hồi Alloy và Credits theo công thức. |
| **Nhiệm Vụ 1–15 & Biến Thể Quái** | Milestone 5.5 & 5.6 | Đã triển khai đầy đủ (`scaling.ts`) | Khớp 100%. 9 biến thể quái, 5 phẩm chất, 4 Sector. |
| **Lưu Trữ Save Schema** | Schema v4 | Đã triển khai `STARFRONT_SAVE_DATA_V4` | Khớp 100%. Hỗ trợ tự động migrate từ v1, v2, v3 sang v4. |

---

## 5. PHÂN ĐỊNH HAI PHÂN HỆ: STARFRONT VS ACE MANAGER (LEGACY)

Một trong những yêu cầu kiến trúc quan trọng nhất của dự án là **bảo tồn nguyên vẹn Ace Manager đồng thời vận hành STARFRONT**:

| Tiêu Chí | Phân Hệ STARFRONT (Mới) | Phân Hệ Ace Manager (Legacy) |
|---|---|---|
| **Lớp Cơ Giáp** | 3 Gear không gian: `vanguard`, `falcon`, `aegis` | 4 Gear cổ điển ACE: `A-Gear`, `B-Gear`, `I-Gear`, `M-Gear` |
| **Mô Thức Chiến Đấu** | Đấu trường 1v1 theo lượt chiến thuật với buồng lái HUD, SP, Cooldown, Status Effects, Boss 2 pha | Mô phỏng hạm đội tự động theo công thức RNG (`simulateBattle`, `simBattle`) |
| **Hồ Sơ Phi Công** | `STARFRONT_PILOTS` (Marcus Thorne, Valentine Vance, Levi Reed, Eric Brandt) | `PILOT_PROFILES` (Marcus A-Gear, Valentine M-Gear, Alviss I-Gear, Eric B-Gear) |
| **Hệ Thống Chỉ Số** | HP, SP, ATK, DEF, SPD, Shield, Crit, Evasion, Armor Pen | HP, ATK, DEF, SPD, EVA, Energy, Vision |
| **Tiến Trình Phi Công** | Cấp 1–30, EXP riêng, +5 điểm tự do/cấp, khóa 5 trận | Cấp 1–10, khóa đổi 10 ngày trong game, kỹ năng ACE cây nhánh |
| **Lưu Trữ** | `STARFRONT_SAVE_DATA_V4` trong `localStorage` | `useGame` State Provider (Day, Resources, Army, Districts, Buildings) |
| **Giao Diện Menu** | `Tổng Quan`, `Nhân Vật & Cơ Giáp`, `Chiến Trường`, `Nhiệm Vụ`, `Chợ Quân Sự`, `Hangar` | `Hạm Đội`, `Căn Cứ`, `Phòng Tác Chiến`, `Hồ Sơ Phi Công` |

*Kết luận*: Hai phân hệ chạy độc lập về dữ liệu nhưng chia sẻ menu điều hướng tổng quát trên `starfront-shell.tsx`. Không có xung đột schema giữa hai bên.

---

## 6. KHOẢNG TRỐNG KỸ THUẬT & ĐỀ XUẤT CHO HỆ THỐNG 12 PILOT & GEAR MỞ RỘNG

Khi chuẩn bị mở rộng sang hệ thống **12 Phi Công** và các lớp Gear mới (như Specter Gear):

### 6.1. Những Trường Dữ Liệu Còn Thiếu Trong Interface Pilot
Hiện tại `StarfrontPilotDef` (`data.ts:1500-1530`) đã có cấu trúc rất tốt, nhưng để hỗ trợ 12 phi công cần bổ sung:
1. `faction`: Phe phái xuất thân (`"BCU"` | `"ANI"` | `"NEUTRAL"` | `"FEDERATION"`).
2. `rarity`: Độ hiếm của phi công (`"rare"` | `"epic"` | `"legendary"`).
3. `unlockCondition`: Điều kiện chiêu mộ/mở khóa (ví dụ: hoàn thành Sector 2, đạt cấp 10, hoặc chiêu mộ bằng Credits/Danh vọng).
4. `voiceLines` hoặc `battleDialogue`: Lời thoại khi xuất trận, khi dính đòn bạo kích, khi hạ gục trùm.
5. `elementAffinity` hoặc `tacticalRole`: Vai trò chuyên sâu (Assault, Sniper, Electronic Warfare, Defense Guardian, Combat Medic).

### 6.2. Cơ Chế Lưu Trữ Pilot Mở Rộng
- Save Schema v4 hiện tại đã hỗ trợ `pilots?: Record<string, PilotProgressionData>`, nghĩa là có thể mở rộng từ 4 lên 12 pilot mà **không làm thay đổi schema lưu trữ**.
- Chỉ cần khởi tạo sẵn dữ liệu mặc định cho các Pilot mới trong `INITIAL_PILOT_PROGRESSION` và `VALID_PILOT_IDS` của `storage.ts`.

### 6.3. Khuyến Nghị Trình Tự Triển Khai Tiếp Theo
1. **Giữ nguyên tính bất biến**: Giữ nguyên vẹn 4 phi công hiện tại (Marcus, Valentine, Alviss/Levi, Eric) và 3 Gear hiện tại để đảm bảo 100% tương thích ngược và 75/75 automated tests tiếp tục PASS.
2. **Kế thừa kiến trúc 3 bước**: Luồng ghép đôi 3 bước tại `character-gear-select.tsx` đã sẵn sàng để hiển thị danh sách dạng lưới hoặc cuộn ngang cho 12 phi công và 4+ cơ giáp.
3. **Mở rộng Combat Actions**: Khi triển khai kỹ năng thứ 5 (Ultimate), cần tích hợp thêm ô bấm số 5 trong Action Deck của `combat-arena.tsx`.

---
*Báo cáo được hoàn thành trên cơ sở khảo sát 100% mã nguồn thực tế tại repository.*
