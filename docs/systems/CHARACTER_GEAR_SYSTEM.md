# STARFRONT — Hệ Thống Nhân Vật & Cơ Giáp (Character & Gear System)

Tài liệu thiết kế kiến trúc chuẩn cho Phân hệ Nhân Vật (Phi Công) và Cơ Giáp trong STARFRONT.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Hệ thống **Character & Gear (Nhân Vật & Cơ Giáp)** thiết lập mối liên kết chiến thuật cốt lõi giữa **Phi Công (Pilot)** và **Chiến Đấu Cơ (Gear)** trước khi xuất kích vào Chiến Trường (Battlefield) hoặc Chiến Dịch (Campaign):
- **Phân tách trách nhiệm**:
  - **Phi công (Pilot)**: Cung cấp điểm thuộc tính tăng trưởng tự do (ATK, DEF, SPD, Shield, Tactical/Crit) và kỹ năng nội tại (Pilot Passive) độc nhất.
  - **Cơ giáp (Gear)**: Cung cấp khung thân cơ bản (Base Stats: HP, SP, ATK, DEF, SPD), vai trò chiến thuật (Striker, Infiltrator, Fortress), nội tại cơ giáp (Gear Passive), và 5 ô kỹ năng (Skill Slots).
  - **Trang bị (Equipment)**: 3 vị trí trang bị trong Hangar (Weapon, Shield, Engine) gia tăng chỉ số trực tiếp.
- **Vị trí Menu**: Menu cấp cao mới **"Nhân Vật & Cơ Giáp" (Character & Gear)** đứng độc lập trên thanh điều hướng chính, chuyển toàn bộ chức năng chọn Gear ra khỏi Hangar. Hangar tập trung hoàn toàn vào Trang bị, Kho đồ, Cường hóa và Tái chế.

---

## 2. Quy Trình Ghép Đôi 3 Bước (Linked 3-Step Selection Flow)

Quy trình chọn và ghép cặp giữa Phi công và Cơ giáp được tổ chức theo luồng liên kết 3 bước:

```
[Bước 1: Chọn Phi Công] ➔ [Bước 2: Chọn Cơ Giáp] ➔ [Bước 3: Đánh Giá & Xác Nhận Cặp Đôi]
       ▲                         ▲                                 │
       └────── Cho phép Quay Lại (Back Navigation) ───────────────┘
```

### Bước 1: Chọn Phi Công (Pilot Selection)
- Hiển thị danh sách hồ sơ phi công (Marcus, Valentine, Alviss, Eric,...).
- Mỗi thẻ phi công hiển thị:
  - Ảnh chân dung (Portrait).
  - Tên, Danh hiệu, Chuyên môn chiến thuật (Specialty).
  - Cấp độ (Level), Thanh tiến trình kinh nghiệm (EXP Bar).
  - Kỹ năng nội tại độc nhất (Pilot Passive).
  - Điểm thuộc tính đã phân bổ và điểm cộng dồn.
- Trạng thái trực quan:
  - Phi công đang chọn: Viền sáng chủ đạo (cyan/gold), hiệu ứng radar quét, hiển thị nhãn "Đang Chọn".
  - Phi công chưa chọn: Hiển thị mờ hơn (subdued), không vô hiệu hóa (disabled) để người chơi vẫn có thể bấm "Xem Chi Tiết" (View Details).

### Bước 2: Chọn Cơ Giáp (Gear Selection)
- Hiển thị danh mục Cơ giáp khả dụng (Vanguard, Falcon, Aegis,...).
- Mỗi thẻ cơ giáp hiển thị:
  - Hình minh họa vector chuyên biệt (Illustration SVG).
  - Tên cơ giáp, Lớp/Vai trò chiến đấu (Role), Cấp độ khung thân (Gear Level).
  - Kỹ năng nội tại cơ giáp (Gear Passive).
  - Lực chiến tổng thể (Combat Readiness Rating).
  - 5 Ô kỹ năng trang bị sẵn.
- Tính liên kết tương hỗ (Cross-Highlight):
  - Khi chọn Phi công ở Bước 1, hệ thống gợi ý nổi bật cơ giáp có độ tương thích cao (Synergy Match).
  - Khi đổi sang Cơ giáp khác ở Bước 2, thẻ Phi công tương ứng hiển thị cập nhật chỉ số dự kiến.

### Bước 3: Xem Xét & Xác Nhận Cặp Đôi (Review & Confirmation)
- Màn hình tổng hợp trước khi khóa cặp đôi xuất kích:
  - **Cột Trái**: Hồ sơ Phi công (Chân dung, Cấp độ, Điểm thuộc tính, Nội tại phi công).
  - **Cột Giữa**: Chỉ số chiến đấu tổng hợp thực tế sau khi ghép đôi:
    - HP, SP, ATK, DEF, SPD, Khiên tối đa, Tỉ lệ Bạo kích, Né tránh.
    - Phân rã nguồn gốc từng chỉ số (Gốc cơ giáp + Trang bị Hangar + Điểm phi công).
  - **Cột Phải**: Hồ sơ Cơ Giáp (Hình ảnh, Lớp, Nội tại cơ giáp, Tổng quan 5 Ô kỹ năng).
  - **Khu vực Xác Nhận**: Nút "XÁC NHẬN GHÉP ĐÔI & XUẤT KÍCH" (Confirm Pairing).
  - Cảnh báo điều kiện khóa: *"Cặp đôi này sẽ được khóa cố định trong 5 nhiệm vụ hoặc 5 trận thắng tiếp theo"*.

---

## 3. Cơ Chế Khóa & Mở Khóa Cặp Đôi (Lock & Unlock Mechanism)

Nhằm tăng tính cam kết chiến thuật và chiều sâu nhập vai, việc ghép đôi áp dụng cơ chế khóa có điều kiện:

### Quy tắc Khóa (Lock Rule)
- Khi người chơi bấm **Xác Nhận (Confirm)** tại Bước 3:
  1. Cặp đôi Phi công — Cơ giáp được lưu trữ vào tiến trình.
  2. Trạng thái khóa được kích hoạt: `isLocked = true`.
  3. Khởi tạo bộ đếm mở khóa: `completedMissions = 0`, `wonBattles = 0`.
- Khi đang bị khóa:
  - Cả Phi công và Cơ giáp được chọn đều bị khóa cứng khỏi việc thay đổi trong buồng lái chiến đấu.
  - Người chơi **vẫn có thể mở menu Character & Gear để xem thông tin, duyệt hồ sơ phi công/cơ giáp khác, hoặc phân bổ điểm thuộc tính** mà không làm thay đổi cặp đôi đang khóa.
  - Thao tác chọn trong lúc xem không vô tình ghi đè cặp đôi đang khóa.
  - Nút xác nhận đổi cặp đôi bị vô hiệu hóa kèm thanh tiến độ hiển thị rõ:
    `Tiến độ mở khóa: X/5 Nhiệm Vụ HOẶC Y/5 Trận Thắng`.

### Quy tắc Mở Khóa (Unlock Rule)
- Điều kiện mở khóa: Đạt một trong hai điều kiện sau (Whichever occurs first):
  - **Hoàn thành 5 nhiệm vụ chiến dịch hợp lệ** (`completedMissions >= 5`), HOẶC
  - **Thắng 5 trận đấu trường hợp lệ** (`wonBattles >= 5`).
- Khi đạt mốc 5:
  - Trạng thái tự động chuyển sang `isLocked = false`.
  - Hiển thị thông báo chiến thuật: *"Đã hoàn thành thời hạn phục vụ! Phi công và Cơ giáp đã sẵn sàng tái cơ cấu tổ đội."*
  - Người chơi được quyền tự do thực hiện lại luồng 3 bước để chọn cặp đôi mới hoặc giữ nguyên cặp đôi cũ.

### Xử lý An Toàn Các Tình Huống Ngoại Lệ (Edge Cases)
1. **Trận đấu chưa kết thúc (Incomplete / Surrendered Battles)**:
   - Nếu người chơi thoát giữa chừng, tải lại trang web, hoặc bị đánh bại (`status === 'defeat'`), bộ đếm `wonBattles` **không tăng**.
2. **Chống đếm trùng sự kiện (Duplicate Event Prevention)**:
   - Bộ đếm chỉ tăng khi sự kiện chiến thắng kích hoạt qua cờ xác nhận `rewardClaimedRef.current === false` trong `applyVictoryReward` hoặc `applyMissionClearReward`. Mỗi trận thắng chỉ cộng đúng 1 lần.
3. **Tải lại trang & Lưu trữ (Reloads & Persistence)**:
   - Bộ đếm được lưu bền vững trong `StarfrontProgression` (Schema v4). Tải lại trang web bảo toàn 100% số lượng nhiệm vụ/trận thắng đã tích lũy.
4. **Người chơi mới (First-time Onboarding)**:
   - Khi chưa từng xác nhận cặp đôi nào, trạng thái là `isLocked = false`. Người chơi không bị hạn chế khi chọn cặp đôi ban đầu.

---

## 4. Tiến Trình Độc Lập Của Phi Công (Pilot Progression)

Mỗi phi công sở hữu một lộ trình tăng trưởng hoàn toàn độc lập:

### Cấp độ & Kinh nghiệm (Level & EXP)
- Mỗi phi công có chỉ số `level` (khởi đầu cấp 1, tối đa cấp 30) và `exp` riêng.
- **Quy tắc nhận EXP**: Chỉ **Phi công đang được chọn và ghép đôi xuất kích** mới nhận được EXP sau khi hoàn thành nhiệm vụ hoặc chiến thắng đấu trường. Các phi công không tham chiến không nhận EXP.
- **Công thức EXP đề xuất (Proposed EXP Curve)**:
  `pilotExpRequired = Math.round(120 * Math.pow(level, 1.4))`
  - Cấp 1 ➔ 2: 120 EXP
  - Cấp 2 ➔ 3: 317 EXP
  - Cấp 5 ➔ 6: 1,141 EXP
  - Cấp 10 ➔ 11: 3,015 EXP

### Điểm Thuộc Tính & Phân Bổ (Attribute Points)
- Mỗi lần phi công thăng 1 cấp (Level Up), nhận được **5 Điểm Thuộc Tính (Attribute Points)**.
- Người chơi tự do phân bổ vào 5 nhánh thuộc tính:
  1. **Tấn Công (ATK)**: +2.0 ATK / điểm vào tổng lực công phá của cơ giáp.
  2. **Phòng Ngự (DEF)**: +1.5 DEF / điểm vào giáp bảo vệ của cơ giáp.
  3. **Cơ Động (SPD)**: +1.0 SPD / điểm vào tốc độ sáng kiến của cơ giáp (+0.2% Né tránh).
  4. **Khiên Năng Lượng (Shield)**: +30 Shield tối đa / điểm.
  5. **Chiến Thuật / Bạo Kích (Tactical / Crit)**: +0.4% Tỉ lệ Bạo Kích / điểm.
- Hỗ trợ nút "Cài lại điểm thuộc tính" (Reset Points) bằng một khoản Credits hợp lý.

### Kỹ Năng Nội Tại Của Phi Công (Pilot Passives)
1. **Marcus (Chuyên Gia Vũ Khí)**:
   - *Hỏa Lực Dồn Ép (Pressing Firepower)*: Tăng 8% tổng sát thương đòn đánh khi mục tiêu còn trên 70% HP.
2. **Valentine (Cứu Hộ & Hỗ Trợ)**:
   - *Lá Chắn Cấp Cứu (Emergency Overcharge)*: Khi Khiên cơ giáp lần đầu giảm về 0 trong trận, lập tức tái tạo 30% Khiên tối đa (1 lần / trận).
3. **Alviss (Chiến Thuật Gia Tốc Độ)**:
   - *Sáng Kiến Diều Hâu (Falcon Reflexes)*: Nhận +15 SPD trong 3 lượt đầu tiên của trận chiến; tăng cố định +8% tỉ lệ né tránh.
4. **Eric (Bậc Thầy Pháo Kích)**:
   - *Hạt Nhân Xuyên Giáp (Bunker Breaker)*: Tất cả các đòn tấn công sở hữu cố định +20% Xuyên Giáp (Armor Penetration).

---

## 5. Tiến Trình Cơ Giáp & 5 Ô Kỹ Năng (Gear Progression & Skill Slots)

### Phân Định Tiến Trình Cơ Giáp vs Phi Công
- **Gear Level**: Cấp độ khung thân cơ giáp, quyết định chỉ số nền tảng (HP, SP, ATK, DEF, SPD gốc của tàu).
- **Slot Upgrade System**: Gắn cố định với từng vị trí Ô Kỹ Năng trên từng cơ giáp (Slot-bound), không gắn với Mô-đun.

### 5 Vị Trí Slot Kỹ Năng Chuẩn
1. **Slot 1: Đòn Đánh Cơ Bản (Basic Attack)**: 0 SP, hồi +15 SP, 0 CD. Hỗ trợ All-Gear hoặc Gear-specific.
2. **Slot 2: Kỹ Năng Chủ Động 1 (Active 1)**: Đòn tấn công sát thương chủ lực (DPS).
3. **Slot 3: Kỹ Năng Chủ Động 2 (Active 2)**: Đòn khống chế/debuff hoặc DoT.
4. **Slot 4: Kỹ Năng Chủ Động 3 (Active 3)**: Kỹ năng phòng ngự/hồi khiên/buff tốc độ.
   *(Quy tắc ràng buộc: Tối đa 2 trong 3 slot chủ động được dùng kỹ năng All-Gear; ít nhất 1 slot phải là kỹ năng độc quyền của Gear).*
5. **Slot 5: Tuyệt Kỹ Tối Thượng (Ultimate)**: Khóa cứng 100% Ultimate của đúng Gear đang điều khiển (Vanguard Nova, Falcon Blitz, Aegis Fortress Cannon).

### Phương Án Hòa Giải Điểm Nâng Cấp Slot (SP Reconciliation Proposal)
- **Vấn đề**: Bản thiết kế gốc đề xuất 3 điểm kỹ năng / cấp; mã nguồn Phase 5.7 triển khai `getAircraftSkillPoints` với công thức 2 điểm / cấp.
- **Phương án hòa giải thống nhất (Reconciliation)**:
  - **Giữ nguyên 2 SP / cấp độ cơ giáp** làm tốc độ tăng trưởng cơ sở cho mỗi level (`total = (gearLevel - 1) * 2`).
  - **Thưởng thêm +2 SP thưởng mốc** mỗi khi người chơi tiêu diệt Trùm cuối một Sector trong Chiến Dịch (Ải 1-3, 2-3, 3-3, 4-3).
  - Điều này giữ nguyên vẹn tính nhất quán toán học đã có trong `progression.ts`, đồng thời cung cấp đủ ngân sách điểm cho 5 ô kỹ năng khi người chơi hoàn thành các chiến dịch lớn.

---

## 6. Trình Bày Chỉ Số Minh Bạch (Stat Presentation Breakdown)

Để tránh nhầm lẫn giữa chỉ số tĩnh ngoài buồng lái và các hiệu ứng động trong chiến đấu:
1. **Chỉ số Gốc Cơ Giáp (Gear Base)**: Chỉ số theo Cấp Khung Thân.
2. **Cộng Dồn Trang Bị (Equipment Bonuses)**: Từ Vũ Khí, Khiên, Động Cơ (bao gồm cả cấp cường hóa +1..+10).
3. **Cộng Dồn Phi Công (Pilot Attributes)**: Điểm cộng trực tiếp từ các nhánh thuộc tính của phi công ghép đôi.
4. **Hệ Số Khuếch Đại Slot (Slot Multiplier)**: Cấp ô kỹ năng (+2.5% hiệu lực / cấp slot).
5. **Chỉ Số Thực Tế Trước Trận (Effective Loadout Stats)**: Tổng hợp hiển thị trên giao diện buồng lái trước khi bấm xuất kích.
6. **Hiệu Ứng Điều Kiện Trong Trận (In-Combat Conditional Effects)**: Các hiệu ứng như "Tăng 8% khi HP địch >70%" hoặc "Nội tại Vanguard hồi SP mỗi lượt" được dán nhãn riêng: `[Hiệu Ứng Kích Hoạt Trong Trận]`.
