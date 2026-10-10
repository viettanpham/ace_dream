# STARFRONT — Hệ Thống Cân Bằng Vật Phẩm Dùng Chung (Shared Item Balance System)

Tài liệu này quy định kiến trúc cân bằng toán học, ngân sách sức mạnh (Power Budget), cơ chế tạo thuộc tính ngẫu nhiên (Random Rolls), đánh giá xếp hạng (Rating) và định giá kinh tế (Pricing) dùng chung cho cả **Trang Bị (Equipment)** và **Mô-đun Kỹ Năng (Skill Modules)**.

---

## 1. Trạng Thái Triển Khai (Implementation Status)

- `[IMPLEMENTED]` (Milestone 5.1–5.6):
  - 4 bậc Rarity (`common`, `rare`, `epic`, `legendary`) áp dụng cho Trang bị trong `types.ts`.
  - Cấp độ trang bị (Level 1–15) rớt theo cấp độ nhiệm vụ trong `scaling.ts`.
  - Sinh ngẫu nhiên thuộc tính trang bị theo vị trí ô (`generateRandomEquipmentStats` trong `scaling.ts`) với số lượng affixes theo độ hiếm.
  - Bảng chi phí cường hóa `ENHANCEMENT_TABLE` (+0 đến +10) trong `progression.ts`.
  - Công thức tính tài nguyên rã đồ `calculateSalvageEstimate` (Alloy + Credits) trong `progression.ts`.
- `[PLANNED]` (Milestone 5.7):
  - Khung quy đổi đơn vị sức mạnh chuẩn (Power Tokens - PT) dùng chung.
  - Phân bổ ngân sách sức mạnh (Power Budget) theo Type, Level, Rarity và Compatibility.
  - Chỉ số Rating cho Trang bị (`itemRating`) và Mô-đun kỹ năng (`skillRating`).
  - Công thức định giá mua Chợ động dựa trên Rating và hệ số chuyên biệt Gear (+30%).
  - Giới hạn cấp độ (Level Cap) mở rộng phân hóa theo Rarity và Compatibility.

---

## 2. Hệ Thống Độ Hiếm & Giới Hạn Cấp Độ (Rarity & Level Caps)

Hệ thống STARFRONT sử dụng **4 bậc độ hiếm cố định** trong mã nguồn (`StarfrontItemRarity`):

| Độ hiếm (Rarity) | Màu nhận diện UI | Số Affix phụ (Equipment) | Giới hạn Cấp All-Gear `[PLANNED]` | Giới hạn Cấp Gear-Specific `[PLANNED]` |
|---|---|:---:|:---:|:---:|
| `common` | Trắng / Xám (`#94a3b8`) | 1 affix | **Cấp 10** | **Cấp 20** |
| `rare` | Lam (`#38bdf8`) | 2 affixes | **Cấp 15** | **Cấp 25** |
| `epic` | Tím (`#c084fc`) | 3 affixes | **Cấp 20** | **Cấp 30** |
| `legendary` | Vàng cam (`#fbbf24`) | 4 affixes | **Cấp 25** | **Cấp 35** |

*Nguyên tắc kế thừa cấp độ*:
- All-Gear: Mức cơ sở Common tối đa cấp 10; mỗi bậc độ hiếm tăng thêm 5 cấp tối đa.
- Gear-specific: Luôn có giới hạn cấp cao hơn All-Gear cùng độ hiếm **10 cấp** (đáp ứng đúng quy tắc thiết kế Phase 5.7).

---

## 3. Khung Ngân Sách Sức Mạnh (Power Budget & Power Tokens) `[PLANNED]`

Mọi trang bị và skill module được định lượng thông qua đơn vị chuẩn hóa: **Power Tokens (PT)**. Hệ thống không cộng dồn thô phần trăm mà quy đổi tác động chiến thuật thực tế.

### 3.1. Bảng Quy Đổi Trọng Số (Weight Table / Power Tokens)

| Thuộc tính / Hiệu ứng | Quy đổi sang PT | Ghi chú chiến thuật |
|---|:---:|---|
| **1 Điểm Tấn Công (ATK)** | `1.0 PT` | Chỉ số tăng sát thương tuyến tính cơ bản |
| **1 Điểm Phòng Thủ (DEF)** | `1.2 PT` | 100 DEF giảm ~50% sát thương nhận vào |
| **1 Điểm Tốc Độ (SPD)** | `1.5 PT` | Chi phối thứ tự hành động và tần suất lượt |
| **10 Điểm Máu (HP)** | `0.8 PT` (`0.08 PT` / 1 HP) | Dung lượng sinh tồn thụ động |
| **1 Điểm Năng Lượng (SP)** | `1.2 PT` | Khả năng duy trì kỹ năng tiêu hao cao |
| **1% Tỷ lệ Bạo Kích (Crit Rate)** | `3.0 PT` | Tác động đột biến sát thương |
| **1% Sát Thương Bạo Kích (Crit Dmg)**| `1.5 PT` | Khuếch đại khi nổ bạo kích |
| **1% Né Tránh (Evasion)** | `3.5 PT` | Triệt tiêu hoàn toàn 100% đòn đánh của địch |
| **1% Xuyên Giáp (Armor Pen)** | `2.0 PT` | Bỏ qua phòng thủ địch, mạnh lên ở late game |
| **1% Giảm Sát Thương (Damage Mit)** | `3.0 PT` | Giảm sát thương thuần túy |
| **DoT (1% Max HP địch / lượt)** | `2.5 PT` | Sát thương duy trì theo thời gian |
| **Debuff (-10% DEF trong 2 lượt)** | `15.0 PT` | Tăng khuếch đại sát thương đồng đội |
| **Choáng / Mất lượt (Stun 1 lượt)** | `45.0 PT` | Khống chế cứng làm ngắt nhịp đối thủ |

### 3.2. Công Thức Tính Ngân Sách Sức Mạnh (Power Budget Formula)

$$\text{PowerBudget} = \left(\text{BaseBudget} + \text{Level} \times \text{Growth}\right) \times \text{RarityMultiplier} \times \text{CompatibilityMultiplier}$$

Trong đó:
- `BaseBudget`: 50 PT (Equipment), 40 PT (Skill Module).
- `Growth`: 8 PT / level.
- `RarityMultiplier`:
  - Common: `1.00x`
  - Rare: `1.25x`
  - Epic: `1.55x`
  - Legendary: `1.90x`
- `CompatibilityMultiplier`:
  - All-Gear: `1.00x` (Linh hoạt trang bị cho mọi cơ giáp, phổ biến 75%).
  - Gear-Specific: `1.10x` (+10% ngân sách do chuyên biệt hóa, hiếm gặp 25%).

---

## 4. Quy Tắc Random Có Giới Hạn & Ràng Buộc (Roll Constraints & Validation)

1. **Ràng buộc bù trừ (Zero-Sum Distribution)**:
   Nếu một thuộc tính được roll gần chạm ngưỡng tối đa (Max), các thuộc tính phụ còn lại phải bị trừ ngân sách PT tương ứng để tổng PT không vượt quá `PowerBudget ± 5%`.
2. **Kẹp biên chỉ số (Clamping Bounds)**:
   Mọi chỉ số sau khi roll phải đi qua hàm kiểm tra hợp lệ:
   - Thuộc tính chính: Phải chiếm tối thiểu 55% tổng PT của vật phẩm.
   - Thuộc tính phụ: Không chỉ số nào được âm; không được vượt quá 30% tổng PT.
3. **Cố định vĩnh viễn (Immutability)**:
   Khi vật phẩm được sinh ra (qua Loot, Shop hoặc Crafting), đối tượng phải lưu cố định các chỉ số đã roll kèm cờ `statsRandomized: true`. Không sinh lại khi nạp save, xem trước hay trang bị.

---

## 5. Hệ Thống Xếp Hạng (Item & Skill Rating)

Chỉ số Rating dùng để người chơi so sánh nhanh sức mạnh thực tế giữa hai trang bị hoặc hai kỹ năng mà không bị đánh lừa bởi cấp độ hay phẩm chất đơn thuần:

$$\text{Rating} = \text{Math.round}\left(\frac{\text{TotalActualPowerTokens}}{1.5}\right)$$

- **Equipment Rating**: Tính trên tổng giá trị PT của các chỉ số thực tế sau khi đã cộng cấp cường hóa (+1..+10).
- **Skill Rating**: Tính trên sát thương cơ bản quy đổi, hiệu ứng phụ, thời gian hồi chiêu và mức tiêu hao SP.

---

## 6. Công Thức Giá Mua, Giá Bán & Thu Hồi (Shop Economy)

### 6.1. Giá Mua Tại Chợ Quân Sự (Buy Price)

$$\text{BuyPrice} = \text{Math.round}\left(\text{BasePrice} \times \left(1 + \text{Level} \times 0.15\right) \times \text{RarityMult} \times \text{CompPriceMult} \times \frac{\text{Rating}}{\text{BaseRating}}\right)$$

- `BasePrice`: 500 Credits (Equipment), 750 Credits (Skill Module).
- `CompPriceMult`: All-Gear = `1.00x`; Gear-Specific = `1.30x` (+30% giá do độ quý hiếm và sức mạnh chuyên biệt).

### 6.2. Giá Bán Lại (Sell Price) `[IMPLEMENTED]`

- Giá bán lại thu hồi Credits: `sellPrice = Math.round(item.price * 0.35)` (Thu hồi 35% giá gốc).
- Khóa an toàn: Chặn tuyệt đối việc bán vật phẩm đang gắn trên cơ giáp (`progression.ts: sellInventoryItem`).

### 6.3. Thu Hồi Tái Chế (Salvage / Scrap) `[IMPLEMENTED]`

Triển khai tại `progression.ts: calculateSalvageEstimate`:
- **Hợp Kim (Alloy) thu hồi**:
  - `BaseAlloy`: Common (2), Rare (5), Epic (12), Legendary (25).
  - Hoàn trả 70% tổng Alloy đã tiêu tốn cho các cấp cường hóa (+1..+10).
- **Tín Dụng (Credits) thu hồi**:
  - `BaseCredits`: Common (100), Rare (250), Epic (600), Legendary (1200).
  - Hoàn trả 40% tổng Credits đã tiêu tốn cho các cấp cường hóa.

---

## 7. Các Điểm Chưa Quyết Định Cần Xác Nhận (Undecided Points)

Trước khi viết code Phase 5.7, các quyết định sau cần chốt cụ thể:
1. **Có cho phép Tái Chế (Salvage) Mô-đun Kỹ Năng lấy Alloy không?**
   - *Phương án A*: Cho phép rã module lấy Alloy như trang bị.
   - *Phương án B*: Module rã ra loại tài nguyên mới (ví dụ: Data Chips / Lõi Kỹ Thuật), hoặc chỉ cho bán lấy Credits.
2. **Thuộc tính ngẫu nhiên trên Mô-đun Kỹ Năng**:
   - Module có thuộc tính ngẫu nhiên (ví dụ: roll thêm +3% Crit hoặc -1 turn CD) hay chỉ số module là cố định theo tên/rarity?
   - *Đề xuất*: Giữ chỉ số kỹ năng cố định theo type/rarity trong giai đoạn đầu để chống mất cân bằng, chỉ random thuộc tính trên Trang bị.
