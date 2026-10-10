# STARFRONT — Hệ Thống Trang Bị & Kho Đồ (Equipment System & Loadout)

Tài liệu này quy định chi tiết về 3 vị trí trang bị, phân cấp tương thích (All-Gear vs Gear-Specific), quy trình cường hóa, tái chế rã đồ và giao diện trang bị trong xưởng Hangar.

---

## 1. Trạng Thái Triển Khai (Implementation Status)

- `[IMPLEMENTED]` (Milestones 5.1–5.6):
  - 3 vị trí trang bị chính: `weapon` (Vũ khí), `shield` (Khiên phòng hộ), `engine` (Động cơ đẩy) trong `types.ts: StarfrontItemSlot`.
  - Cường hóa trang bị từ `+0` đến `+10` tiêu hao Credits và Hợp Kim (Alloy) trong `progression.ts: enhanceItem`.
  - Tái chế rã đồ (Salvage) thu hồi Alloy cơ sở và hoàn trả 70% Alloy, 40% Credits cường hóa trong `progression.ts: salvageInventoryItem`.
  - Chợ quân sự phân tầng theo Sector, mua sắm, bán vật phẩm thừa và Làm mới (Refresh) gian hàng bằng lượt miễn phí / 100 Credits trong `progression.ts` và `starfront-shop.tsx`.
  - Hệ thống rơi đồ sau trận chiến (Loot Drops) có cấp độ và thuộc tính ngẫu nhiên cố định trong `scaling.ts`.
- `[PLANNED]` (Milestone 5.7):
  - Phạm vi tương thích: Phân định rõ ràng giữa **All-Gear Equipment** và **Gear-Specific Equipment**.
  - Hiển thị nhãn tương thích `ALL-GEAR` hoặc `VANGUARD / FALCON / AEGIS / SPECTER` rõ ràng trên UI Hangar và Shop.
  - Tích hợp điểm số Đánh Giá Trang Bị (`Equipment Rating`) hiển thị trực quan.
  - Tỷ lệ xuất hiện: All-Gear (75%) và Gear-Specific (25%).

---

## 2. Các Vị Trí Trang Bị & Bể Thuộc Tính (Equipment Slots & Stat Pools)

Mỗi Cơ Giáp sở hữu đúng **3 ô trang bị**:

| Vị trí Ô | Tên gọi | Thuộc tính chính | Thuộc tính phụ có thể xuất hiện (Affixes) | Định hướng chiến thuật |
|---|---|---|---|---|
| `weapon` | **Vũ Khí Chính** | `attackBonus` (ATK) | SPD, SP, HP, Crit Rate, Armor Pen | Nâng cao sát thương nổ, đục thủng giáp và chỉ số tấn công cơ bản |
| `shield` | **Khiên Phòng Hộ** | `defenseBonus` (DEF) | HP, SP, SPD, Damage Mitigation | Nâng cao khả năng sinh tồn, giảm sát thương nhận vào, chống sốc |
| `engine` | **Động Cơ Đẩy** | `speedBonus` (SPD) | ATK, SP, HP, Evasion | Chi phối tốc độ ra đòn (Speed Initiative), lượt đi và né tránh |

*Quy tắc sinh thuộc tính (`scaling.ts: generateRandomEquipmentStats`)*:
- Thuộc tính chính luôn xuất hiện và có tỷ trọng lớn nhất (tối thiểu 55% ngân sách PT).
- Số lượng thuộc tính phụ tăng dần theo Rarity: Common (1), Rare (2), Epic (3), Legendary (4).

---

## 3. Phạm Vi Tương Thích: All-Gear vs Gear-Specific `[PLANNED]`

Khác với hệ thống ban đầu nơi mọi trang bị đều dùng chung, Phase 5.7 chuẩn hóa hai phạm vi tương thích:

### 3.1. All-Gear Equipment (Trang Bị Toàn Năng)
- **Đặc điểm**: Bất kỳ lớp cơ giáp nào (Vanguard, Falcon, Aegis, Specter) đều có thể trang bị.
- **Tỷ lệ xuất hiện**: Chiếm **75%** trong bể rơi đồ chiến dịch và hàng Chợ Quân Sự.
- **Ngân sách sức mạnh**: Hệ số tiêu chuẩn `1.00x`.
- **Ưu thế**: Tính thanh khoản và linh hoạt cao; người chơi đổi Gear mà không cần đổi lại trang bị.

### 3.2. Gear-Specific Equipment (Trang Bị Chuyên Biệt)
- **Đặc điểm**: Chỉ có thể trang bị cho **đúng lớp cơ giáp tương ứng** (ví dụ: Vũ khí chỉ Vanguard dùng được, Động cơ chỉ Falcon gắn được).
- **Tỷ lệ xuất hiện**: Chiếm **25%** (Hiếm gặp hơn rõ rệt).
- **Ngân sách sức mạnh**: Được hưởng bonus **+10% ngân sách sức mạnh** (`1.10x PT`).
- **Giá thương mại**: Giá mua cao hơn **+30%** so với All-Gear cùng cấp và phẩm chất.
- **Ưu thế**: Tối ưu hóa sâu sắc cho bộ kỹ năng và nội tại riêng biệt của từng lớp Gear:
  - *Vanguard-specific*: Tối ưu cộng thêm SP và giảm hồi chiêu.
  - *Falcon-specific*: Tối ưu cực đại SPD, Crit Rate và Né Tránh.
  - *Aegis-specific*: Tối ưu cực đại DEF, Phản đòn và Dung lượng Khiên.
  - *Specter-specific*: Tối ưu Xuyên giáp, Điểm sạc chiến thuật và Hiệu lực debuff.

---

## 4. Hệ Thống Cường Hóa (+0 đến +10) `[IMPLEMENTED]`

Cường hóa tăng trực tiếp phần trăm toàn bộ các chỉ số của trang bị (cả chỉ số chính lẫn chỉ số phụ đã roll), được quy định tại `progression.ts: ENHANCEMENT_TABLE`:

| Cấp | Tỷ lệ Bonus | Chi phí Credits | Chi phí Alloy | Tỷ lệ thành công |
|:---:|:---:|:---:|:---:|:---:|
| `+1` | +10% | 150 | 5 | 100% |
| `+2` | +20% | 300 | 8 | 100% |
| `+3` | +30% | 500 | 12 | 100% |
| `+4` | +45% | 800 | 18 | 90% |
| `+5` | +60% | 1,200 | 25 | 80% |
| `+6` | +75% | 1,800 | 35 | 70% |
| `+7` | +95% | 2,600 | 50 | 60% |
| `+8` | +115% | 3,800 | 70 | 50% |
| `+9` | +135% | 5,500 | 95 | 40% |
| `+10` | +160% | 8,000 | 130 | 30% |

*Quy tắc an toàn*: Thất bại không làm giảm cấp hay phá hủy trang bị (an toàn 100% cho trải nghiệm người chơi).

---

## 5. Quy Tắc Giao Diện Kho Đồ & Hangar (UI & UX)

1. **Nhãn tương thích nổi bật**:
   Mọi thẻ trang bị phải hiển thị nhãn:
   - `[ALL-GEAR]`: Huy hiệu màu xám sáng hoặc xanh lam trung tính.
   - `[VANGUARD]`, `[FALCON]`, `[AEGIS]`, `[SPECTER]`: Huy hiệu mang màu đặc trưng của Gear đó (Vanguard: Cyan `#06b6d4`, Falcon: Tím `#a855f7`, Aegis: Hổ phách `#f59e0b`, Specter: Lục `#10b981`).
2. **So sánh chỉ số tức thời (Compare Preview)**:
   Khi nhấn vào trang bị trong kho, buồng lái Hangar hiển thị bảng so sánh chỉ số cũ vs mới (chênh lệch `+` xanh lá hoặc `-` đỏ).
3. **Bảo toàn cấp cường hóa và chỉ số**:
   Trang bị khi tháo ra khỏi Gear vẫn giữ nguyên cấp `+X` và các thuộc tính đã roll vĩnh viễn trong kho.

---

## 6. Các Điểm Chưa Quyết Định Cần Xác Nhận (Undecided Points)

1. **Trường dữ liệu tương thích trong schema**:
   - Thêm thuộc tính `compatibleGear?: StarfrontGearId | "all"` vào `StarfrontItem`.
   - Nếu để `undefined` hoặc `"all"`, mặc định hiểu là All-Gear (để tương thích 100% với toàn bộ save cũ).
2. **Quy tắc khi người chơi chuyển Gear trong Hangar**:
   - Nếu đang trang bị món Gear-Specific của Vanguard, khi chuyển sang Falcon thì:
     - *Phương án A*: Tự động tháo món đó về kho đồ (vị trí slot để trống).
     - *Phương án B*: Vẫn giữ trang bị trong cấu hình riêng của từng chiếc Gear (mỗi chiếc Gear có 1 bộ loadout riêng).
     - *Khuyến nghị*: Phương án B mang lại trải nghiệm tiện lợi hơn, hoặc Phương án A với thông báo rõ ràng.
