# STARFRONT — Hệ Thống Chiến Đấu Theo Lượt (Turn-Based Combat System)

Tài liệu này quy định toàn bộ cơ chế chiến đấu theo lượt trong buồng lái chiến đấu (`lib/game/engine.ts` và `components/game/combat-arena.tsx`): vòng lặp lượt đi, sáng kiến tốc độ, công thức tính sát thương, hiệu ứng trạng thái, nội tại cơ giáp và trí tuệ nhân tạo (AI) của kẻ địch.

---

## 1. Trạng Thái Triển Khai (Implementation Status)

- `[IMPLEMENTED]` (Milestone 1–4):
  - Sáng kiến tốc độ động (Dynamic Speed Initiative & Turn Queue) trong `engine.ts: calculateTurnQueue`.
  - Công thức tính sát thương đầy đủ (ATK, DEF, Xuyên giáp, Giảm trừ, Dao động ±5%, Bạo kích, Né tránh) trong `engine.ts: calculateCombatDamage`.
  - Hệ thống 11 loại hiệu ứng trạng thái (DoT Plasma/Acid, Stun, EMP Slow, ECM Jamming, Lá chắn) kèm 3 cơ chế xếp chồng trong `engine.ts: applyStatusEffect` và `tickUnitTurn`.
  - Quản lý năng lượng SP và hồi chiêu kỹ năng (Cooldown) qua từng lượt trong `engine.ts: tickUnitTurn`.
  - Kỹ năng nội tại của 3 lớp Gear (Vanguard, Falcon, Aegis) can thiệp trực tiếp vào diễn biến trận đấu trong `engine.ts`.
  - Cơ chế Boss đa pha (Enrage Overdrive khi HP < 50%) và Đòn đánh cảnh báo tích năng lượng (Telegraphed Attack).
  - Trí tuệ nhân tạo đối thủ theo 4 Archetype chiến thuật (`aggressive`, `defensive`, `disruptor`, `adaptive-boss`).
- `[PLANNED]` (Milestone 5.7):
  - Tích hợp hệ số nhân khuếch đại cấp ô kỹ năng `SlotMultiplier = 1 + (SlotLevel * 0.025)` vào công thức sát thương.
  - Tích hợp cơ chế sạc chiến thuật `Tactical Charge` của lớp cơ giáp Specter.
  - Hỗ trợ thi triển đòn Tuyệt kỹ tối thượng (Ultimate Slot 5) với tiêu hao 50–70 SP.

---

## 2. Vòng Lặp Lượt Đi & Sáng Kiến Tốc Độ (Turn Flow & Initiative)

### 2.1. Vòng Lặp Trạng Thái Trận Đấu
Trận đấu vận hành qua cỗ máy trạng thái (State Machine):
$$\text{ready} \longrightarrow \text{player-turn} \longleftrightarrow \text{enemy-turn} \longrightarrow \text{animating} \longrightarrow \text{victory} \ / \ \text{defeat}$$

1. **Khởi tạo (`ready`)**: Khởi tạo bản sao hai đơn vị (`cloneUnit`), áp dụng trang bị và nội tại.
2. **Xác định quyền ra đòn đầu tiên**:
   - So sánh Tốc độ hiệu dụng (`getEffectiveSpeed`) giữa Người chơi và Kẻ địch.
   - Bên có SPD cao hơn giành lượt đi trước (`turnQueue = [firstUnitId, secondUnitId]`).
   - Nếu SPD bằng nhau: Người chơi luôn được ưu tiên đi trước.
3. **Đầu mỗi lượt đi (`tickUnitTurn`)**:
   - Trừ 1 lượt thời hạn của toàn bộ hiệu ứng trạng thái đang kích hoạt.
   - Kích hoạt sát thương DoT (Plasma Burn, Acid Corrosion).
   - Kiểm tra Choáng (Stun): Nếu bị choáng, bỏ qua lượt hành động và chuyển quyền ngay sang đối phương.
   - Trừ 1 lượt hồi chiêu cho các kỹ năng đang trong thời gian hồi (`skillCooldowns`).
   - Kích hoạt hồi phục SP (Nội tại Vanguard +5 SP; hoặc trạng thái Recharge).
4. **Thực thi hành động**:
   - Người chơi chọn kỹ năng (`executePlayerAction`).
   - Hoặc AI kẻ địch tự động tính toán (`executeEnemyAIAction`).
5. **Kiểm tra kết thúc**:
   - Đơn vị nào có HP chạm 0 sẽ bị tiêu diệt ngay lập tức, chuyển trạng thái sang `victory` hoặc `defeat`.

---

## 3. Công Thức Tính Sát Thương Thực Tế (Damage Calculation Formula)

Công thức sát thương chuẩn hóa trong `lib/game/engine.ts: calculateCombatDamage`:

### 3.1. Chỉ Số Hiệu Dụng (Effective Stats)
- **Tấn công hiệu dụng (`effectiveAtk`)**:
  $$\text{effectiveAtk} = \text{baseAtk} \times \left(1 + \sum \text{atkBuffs} - \sum \text{atkDebuffs}\right)$$
- **Phòng thủ hiệu dụng (`effectiveDef`)**:
  $$\text{effectiveDef} = \text{baseDef} \times \left(1 + \sum \text{defBuffs} - \sum \text{defDebuffs}\right)$$
- **Xuyên giáp (`effectiveArmorPen`)**:
  Chỉ số xuyên giáp làm suy giảm tỷ lệ phòng thủ của đối thủ:
  $$\text{mitigatedDef} = \max\left(0, \text{effectiveDef} \times \left(1 - \text{armorPen}\right)\right)$$

### 3.2. Sát Thương Giảm Trừ Theo Giáp
Tỷ lệ sát thương đi qua lớp giáp tuân theo đường cong bão hòa tiệm cận:
$$\text{ArmorMitigationFactor} = \frac{100}{100 + \text{mitigatedDef}}$$
*(Ví dụ: 100 DEF giảm ~50% sát thương; 200 DEF giảm ~66.7% sát thương).*

### 3.3. Kiểm Tra Bạo Kích & Né Tránh
1. **Kiểm tra Né tránh (Evasion Check)**:
   - Hệ thống so sánh `effectiveEvasion` của mục tiêu với chỉ số xúc xắc ngẫu nhiên (RNG).
   - Nếu né thành công: Sát thương nhận vào = `0`, nhật ký ghi nhận `[NÉ TRÁNH]`.
2. **Kiểm tra Bạo kích (Critical Check)**:
   - Nếu `rng <= effectiveCritRate`: Đòn đánh bạo kích, nhân thêm hệ số `critDamage` (mặc định 1.5x hoặc cao hơn theo trang bị).
3. **Dao động ngẫu nhiên (Variance)**:
   - Áp dụng hệ số dao động nhỏ `±5%` (khoảng `0.95` đến `1.05`) để tránh trận đấu trở nên cứng nhắc.
4. **Giảm trừ trực tiếp (Damage Mitigation)**:
   - Áp dụng các hiệu ứng lá chắn như Emergency Guard (giảm 50% sát thương):
   $$\text{FinalDamage} = \text{Math.round}\left(\text{RawDamage} \times \left(1 - \text{damageReduction}\right)\right)$$
   *(Sát thương tối thiểu luôn được kẹp biên không nhỏ hơn 1).*

---

## 4. Hệ Thống Hiệu Ứng Trạng Thái (Status Effects System)

Mọi hiệu ứng được định nghĩa trong `lib/game/types.ts: CombatStatusType`:

| Loại Hiệu Ứng | Tên Hiển Thị | Phân Loại | Cơ Chế Tác Động | Cơ Chế Xếp Chồng |
|---|---|:---:|---|:---:|
| `plasma-burn` | **Bỏng Plasma** | Debuff (DoT) | Gây sát thương bằng % ATK người thi triển ở đầu mỗi lượt | `intensity` (Tối đa 3 tầng) |
| `acid-corrosion` | **Axit Ăn Mòn** | Debuff (DoT) | Gây sát thương DoT kèm giảm 15% DEF mục tiêu | `intensity` (Tối đa 3 tầng) |
| `stun` | **Choáng Quá Tải** | Khống chế cứng | Mục tiêu mất hoàn toàn quyền hành động trong 1 lượt | `override` |
| `emp-slow` | **Xung EMP Làm Chậm** | Debuff | Giảm 25 SPD của mục tiêu, đảo lộn hàng đợi lượt đi | `refresh` |
| `ecm-jamming` | **Nhiễu Sóng ECM** | Debuff | Giảm độ chính xác của mục tiêu (tăng 25% tỷ lệ trượt đòn) | `refresh` |
| `armor-break` | **Phá Giáp** | Debuff | Giảm 35% Phòng Thủ trong 2 lượt | `refresh` |
| `emergency-guard`| **Lá Chắn Khẩn Cấp** | Buff | Giảm 50% mọi sát thương nhận vào trong 2 lượt | `refresh` |
| `speed-boost` | **Gia Tốc Động Cơ** | Buff | Tăng +20 SPD, đẩy nhanh thứ tự ra đòn | `refresh` |
| `boss-overdrive` | **Quá Tải Trùm Cuối** | Buff Đặc Biệt | Boss dưới 50% HP: Tăng +30% ATK, +20 SPD vĩnh viễn | `override` |

---

## 5. Kỹ Năng Nội Tại Của 3 Lớp Cơ Giáp (Gear Passives) `[IMPLEMENTED]`

Mỗi cơ giáp có nội tại chiến thuật riêng biệt can thiệp sâu vào toán học giao tranh:

1. **Vanguard Gear — Lõi Năng Lượng Ổn Định (`stable-core`)**:
   - Tự động hồi thêm `+5 SP` ở đầu mỗi lượt đi (tổng cộng `+10 SP/lượt`).
   - Cứ mỗi chu kỳ 3 lượt thi đấu, kích hoạt xung năng lượng giảm thêm 1 lượt hồi chiêu cho các kỹ năng đang trong thời gian hồi.
2. **Falcon Gear — Khí Động Học Mach (`mach-aero`)**:
   - Tỷ lệ né tránh bẩm sinh tăng vĩnh viễn `+15%`.
   - Mỗi khi đòn đánh nổ bạo kích (Critical Hit), có `50% tỷ lệ` kích hoạt thêm 1 đòn bắn phụ siêu tốc (0 SP, gây 75% ATK).
3. **Aegis Gear — Giáp Phản Lực Titan (`titan-reactive`)**:
   - Khiên gai titan phản lại `20% sát thương nhận vào` cho chính kẻ địch vừa tấn công.
   - Kháng `50% hiệu lực` của các hiệu ứng Làm Chậm (EMP Slow) và Phá Giáp (Armor Break).

---

## 6. Trí Tuệ Nhân Tạo Đối Thủ Theo 4 Archetype (Enemy AI Decision Tree)

Kẻ địch vận hành theo 4 cây quyết định logic trong `engine.ts: executeEnemyAIAction`:

1. **Aggressive (Hiếu Chiến)**:
   Ưu tiên tung các kỹ năng có sát thương cao nhất (`damageMultiplier`), dồn hỏa lực kết liễu người chơi khi HP đối phương thấp; chỉ dùng Basic Shot khi thiếu SP.
2. **Defensive (Phòng Ngự Phản Kích)**:
   Liên tục theo dõi lượng máu. Khi HP < 50%, ưu tiên hàng đầu là bật kỹ năng dựng khiên hoặc phòng hộ; phản công khi an toàn.
3. **Disruptor (Quấy Nhiễu & Tác Chiến Điện Tử)**:
   Mở đầu trận đấu bằng các đòn Phá giáp (`armor-break`), Làm chậm (`emp-slow`) hoặc Gây nhiễu (`ecm-jamming`) trước khi cho các đòn sát thương tiếp cận.
4. **Adaptive-Boss (Trùm Cuối Biến Ảo)**:
   - Kích hoạt trạng thái **Boss Overdrive** ngay khi HP tụt xuống dưới 50%.
   - Kích hoạt đòn đánh cảnh báo **Telegraphed Attack**: Dành 1 lượt để nạp năng lượng (kèm biểu tượng cảnh báo đỏ trên giao diện), và phóng đại pháo nguyên tử hủy diệt ở lượt kế tiếp.

---

## 7. Các Điểm Chưa Quyết Định Cần Xác Nhận (Undecided Points)

1. **Tương tác giữa Ultimate (Slot 5) và cơ chế Stun**:
   - Nếu đơn vị đang nạp năng lượng cho chiêu Ultimate mà bị dính Stun, chiêu đó bị hủy hoàn toàn hay chỉ bị hoãn sang lượt kế tiếp?
   - *Khuyến nghị*: Bị gián đoạn hoàn toàn (mất lượt và đưa kỹ năng vào hồi chiêu 1 lượt) để tạo giá trị chiến thuật cho kỹ năng Stun.
2. **Công thức tính né tránh cực đại (Evasion Cap)**:
   - Hiện tại né tránh chưa có giới hạn trần cứng (Hard Cap).
   - *Khuyến nghị*: Thiết lập Hard Cap ở mức `75%` để tránh việc Falcon build né tránh đạt 100% khiến đối thủ không thể chạm tới.
