# STARFRONT — Hệ Thống Mô-đun Kỹ Năng & 5 Slots (Skill Module & 5-Slot Deck System)

Tài liệu này quy định chi tiết về kiến trúc 5 Slot kỹ năng, hệ thống Mô-đun kỹ năng (Skill Modules), cơ chế nâng cấp ô bằng Điểm Kỹ Năng Phi Thuyền (Aircraft Skill Points), quy tắc tương thích Gear và thiết kế lớp cơ giáp thứ tư: Specter (Tactical Support).

---

## 1. Trạng Thái Triển Khai (Implementation Status)

- `[IMPLEMENTED]` (Milestone 1–5):
  - Mỗi lớp cơ giáp (Vanguard, Falcon, Aegis) sở hữu bộ 4 kỹ năng tĩnh được định nghĩa trong `lib/game/data.ts: STARFRONT_GEAR_DEFS`.
  - Kiểu dữ liệu kỹ năng `CombatSkill` (sát thương, spCost, cooldown, targetType, statusToApply) trong `lib/game/types.ts`.
  - Cơ chế hồi chiêu theo lượt (`skillCooldowns`) và trừ hao SP trong `lib/game/engine.ts`.
- `[PLANNED]` (Milestone 5.7):
  - Mở rộng từ 4 kỹ năng cố định lên **5 Slot Kỹ Năng tùy biến linh hoạt**.
  - Tách rời kỹ năng thành các vật phẩm **Mô-đun Kỹ Năng (Skill Modules)** có thể nhận qua Loot, Chợ và thay đổi trong buồng lái.
  - Cơ chế **Aircraft Level cấp 2 Skill Points / cấp**.
  - Cơ chế **Nâng cấp gắn liền với Slot (Ô Kỹ Năng)**, độc lập với Module.
  - Giới hạn cấp độ Module theo Rarity và tính tương thích (All-Gear vs Gear-Specific).
  - Lớp cơ giáp thứ tư: **Specter — Tactical Support**.

---

## 2. Kiến Trúc 5 Slot Kỹ Năng & Quy Tắc Tương Thích (5-Slot Deck Architecture)

Buồng lái chiến đấu của mọi Cơ Giáp được chuẩn hóa thành 5 vị trí chuyên biệt:

| Vị trí Slot | Loại Kỹ Năng | Chức năng chính | Tiêu hao SP | Thời gian hồi (CD) | Quy tắc tương thích Gear |
|:---:|---|---|:---:|:---:|---|
| **Slot 1** | **Basic Attack** | Đòn tấn công cơ bản, nạp năng lượng lõi | **0 SP** (+15 SP khi đánh) | **0 lượt** | Cho phép **All-Gear** hoặc Module của đúng Gear |
| **Slot 2** | **Active Skill 1** | Kỹ năng chiến thuật sơ cấp (DPS / Phá giáp) | **20 – 30 SP** | **2 – 3 lượt** | Cho phép All-Gear hoặc đúng Gear; **Tối đa 2/3 slot** (Slot 2–4) dùng All-Gear |
| **Slot 3** | **Active Skill 2** | Kỹ năng phòng ngự / Hỗ trợ / Khống chế | **25 – 35 SP** | **3 – 4 lượt** | Cho phép All-Gear hoặc đúng Gear; **Tối đa 2/3 slot** (Slot 2–4) dùng All-Gear |
| **Slot 4** | **Active Skill 3** | Kỹ năng đột kích / Khắc chế cao cấp | **30 – 45 SP** | **3 – 4 lượt** | Cho phép All-Gear hoặc đúng Gear; **Tối đa 2/3 slot** (Slot 2–4) dùng All-Gear |
| **Slot 5** | **Ultimate Skill** | Tuyệt kỹ tối thượng uy lực áp đảo | **50 – 70 SP** | **4 – 6 lượt** | **Bắt buộc 100%** là Ultimate của đúng Gear đang điều khiển |

### Quy Tắc Tương Thích Cốt Lõi
1. **Slot 1**: Có thể gắn Basic Shot tiêu chuẩn của Liên Minh (All-Gear) hoặc đòn bắn đặc trưng của Gear (Gear-specific).
2. **Slot 2–4 (Active Deck)**: Người chơi có quyền tự do phối hợp kỹ năng All-Gear và Gear-Specific, nhưng **chỉ được gắn tối đa 2 kỹ năng All-Gear**. Ít nhất 1 trong 3 slot active phải là kỹ năng độc quyền của Gear hiện tại nhằm giữ vững bản sắc lớp cơ giáp.
3. **Slot 5 (Ultimate)**: Khóa cứng theo Gear đang lái. Không cho phép gắn Ultimate của Gear khác hoặc Ultimate chung.

---

## 3. Aircraft Level, Skill Points & Nâng Cấp Slot (Slot Upgrade System)

### 3.1. Điểm Kỹ Năng Phi Thuyền (Aircraft Skill Points)
- Mỗi khi cấp độ phi thuyền tăng thêm 1 cấp (`level` trong `StarfrontProgression`), người chơi nhận được **+2 Skill Points (SP)**.
- Khi người chơi nạp save cũ (v1/v2/v3) lên schema v4, hệ thống tự động bù đủ điểm:
  $$\text{InitialSkillPoints} = (\text{CurrentLevel} - 1) \times 2$$

### 3.2. Nâng Cấp Theo Slot, Không Theo Module (Slot-Bound Upgrades)
- Cấp nâng cấp gắn cố định với **Ô Kỹ Năng** (`slotLevels[1..5]`), thuộc về cấu trúc phi thuyền.
- **Khi thay thế hoặc hoán đổi Module khác vào ô, cấp nâng của ô không bị mất hay reset**.
- **Hệ số khuếch đại của Slot (Slot Multiplier)**:
  $$\text{SlotMultiplier} = 1 + (\text{SlotLevel} \times 0.025)$$
  *(Mỗi cấp slot tăng thêm +2.5% sát thương hoặc hiệu quả kỹ năng; đạt tối đa +50% tại Cấp 20).*

### 3.3. Giới Hạn Cấp Ô & Bảng Chi Phí Nâng Cấp Slot
- Giới hạn cấp nâng của mỗi Slot: **Tối đa Cấp 20 (Max Level 20)**.

| Khoảng Cấp Slot | Chi phí Skill Points mỗi cấp | Tổng SP tích lũy giai đoạn |
|:---:|:---:|:---:|
| **Cấp 1 ➔ 5** | 1 SP / cấp | 5 SP |
| **Cấp 6 ➔ 10** | 2 SP / cấp | 10 SP |
| **Cấp 11 ➔ 15** | 3 SP / cấp | 15 SP |
| **Cấp 16 ➔ 20** | 4 SP / cấp | 20 SP |
| **Tổng cộng (Cấp 1 ➔ 20)** | — | **50 SP / slot** |

---

## 4. Cấp Độ Mô-đun (Module Level) & Giới Hạn Theo Rarity

Khác với Slot Level (cấp của ô), **Module Level** là cấp độ nội tại của chiếc đĩa/mô-đun kỹ năng nhận được từ chiến dịch hoặc Chợ Quân Sự. Module Level quyết định chỉ số nền của kỹ năng:

| Độ hiếm Module (Rarity) | Giới hạn Cấp All-Gear | Giới hạn Cấp Gear-Specific |
|---|:---:|:---:|
| `common` | **Cấp 10** | **Cấp 20** |
| `rare` | **Cấp 15** | **Cấp 25** |
| `epic` | **Cấp 20** | **Cấp 30** |
| `legendary` | **Cấp 25** | **Cấp 35** |

*Nguyên tắc kế thừa*:
- Module Gear-specific luôn có trần cấp độ cao hơn All-Gear cùng độ hiếm **10 cấp**.
- Một module cấp 25 không thể gắn vào ô nếu ô đó chưa đạt đủ điều kiện hoặc nếu module đó vượt quá giới hạn cấp phẩm chất.

---

## 5. Quy Tắc Hiệu Ứng Kỹ Năng: Duration, Stacking, SP & Cooldown

Nhằm bảo đảm không tạo ra tình trạng mất cân bằng hoặc cộng dồn vô hạn (infinite stack), mọi hiệu ứng kỹ năng phải tuân thủ nghiêm ngặt:

1. **Thời hạn (Duration)**:
   - Buff/Debuff tiêu chuẩn kéo dài **1 – 3 lượt**.
   - Khống chế cứng (Stun): Tuyệt đối **không quá 1 lượt** cho mỗi lần kích hoạt.
2. **Cơ chế xếp chồng (Stacking)**:
   - `refresh`: Làm mới thời hạn về giá trị ban đầu (áp dụng cho các lá chắn và buff cá nhân).
   - `intensity`: Cộng thêm chỉ số nhưng khống chế số tầng tối đa (`maxStacks` từ 3 đến 5 tầng).
   - `override`: Hiệu ứng cấp cao hơn ghi đè hiệu ứng thấp hơn.
3. **Tiêu hao SP & Hồi chiêu (SP Cost & Cooldown)**:
   - Kỹ năng sát thương cao hoặc khống chế bắt buộc phải có thời gian hồi chiêu từ 3–4 lượt và tiêu hao từ 30–45 SP để tránh spam liên tục.

---

## 6. Thiết Kế Cơ Giáp Thứ Tư: Specter — Tactical Support `[PLANNED]`

### 6.1. Hồ Sơ Định Danh
- **Tên**: Specter Gear (Tiêm Kích Hỗ Trợ Tác Chiến Điện Tử).
- **Vai trò**: Tác chiến điện tử, kiểm soát nhịp độ chiến trường, quấy nhiễu radar và hỗ trợ hạm đội.
- **Màu sắc chủ đạo**: Xanh ngọc lục bảo Emerald (`#10b981`).
- **Chỉ số cơ sở (Cấp 1)**: HP 1,100; SP 140; ATK 135; DEF 80; SPD 105.
- **Tăng trưởng / cấp**: HP +70; SP +14; ATK +11; DEF +7; SPD +3.

### 6.2. Kỹ Năng Nội Tại (Passive)
- **Tên**: *Hệ Thống Phân Tích Điểm Yếu (Tactical Analyzer)*.
- **Hiệu ứng**:
  - Tỉ lệ Né Tránh của toàn bộ đối thủ giảm vĩnh viễn 15% khi đối đầu với Specter.
  - Mỗi khi Specter thi triển một kỹ năng buff cho bản thân hoặc gây debuff lên kẻ địch, nhận được 1 tầng **Điểm Sạc Chiến Thuật (Tactical Charge)**.
  - Tối đa 5 tầng. Mỗi tầng tăng thêm **+6% hiệu lực hoặc sát thương** cho kỹ năng chủ động kế tiếp (tự động tiêu thụ toàn bộ số tầng khi tung đòn kế).

### 6.3. Bộ 5 Kỹ Năng Mẫu Của Specter
1. **Slot 1 (Basic)**: *Tia Quét Phân Rã (Disruption Beam)* — Sát thương 100% ATK, hồi +15 SP, làm giảm 10% DEF của địch trong 2 lượt.
2. **Slot 2 (Active)**: *Xung Sóng EMP Làm Chậm (EMP Pulse)* — Sát thương 120% ATK, gây hiệu ứng EMP Slow (-25 SPD) trong 2 lượt (kéo lùi thứ tự lượt đi của đối thủ).
3. **Slot 3 (Active)**: *Màng Kháng Từ Trường (Nanite Dispersal Field)* — Hồi phục 350 Dung lượng Khiên cho bản thân và thanh tẩy 1 hiệu ứng bất lợi ngẫu nhiên.
4. **Slot 4 (Active)**: *Quá Tải Lõi Tăng Áp (Quantum Overdrive)* — Tăng +25 SPD và +20% Tỷ lệ Bạo Kích cho bản thân trong 2 lượt.
5. **Slot 5 (Ultimate)**: *Giao Thức Pháo Kích Quỹ Đạo (Orbital Strike Protocol)* — 240% sát thương diện rộng, gây Choáng (Stun) 1 lượt kèm hiệu ứng Acid Corrosion (-30% DEF và 5% DoT) trong 3 lượt.

---

## 7. Các Điểm Chưa Quyết Định Cần Xác Nhận (Undecided Points)

1. **Cấu trúc lưu trữ kho Mô-đun Kỹ Năng trong Save Schema**:
   - Sử dụng một mảng riêng `skillInventory: SkillModuleItem[]` hay gộp chung vào `inventory` với cờ phân loại `itemCategory: "equipment" | "skill_module"`?
   - *Khuyến nghị*: Dùng mảng riêng `skillInventory` để giữ `inventory` hoàn toàn tương thích và không làm đảo lộn logic hiện tại của Hangar và Shop.
2. **Chi phí tháo/lắp Mô-đun Kỹ Năng**:
   - Tháo lắp hoàn toàn miễn phí hay tiêu tốn một lượng nhỏ Credits?
   - *Khuyến nghị*: Hoàn toàn miễn phí để khuyến khích người chơi thử nghiệm nhiều phối hợp chiến thuật (deck-building).
