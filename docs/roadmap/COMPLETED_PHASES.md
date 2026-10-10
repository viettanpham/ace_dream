# STARFRONT — Lịch Sử Các Giai Đoạn Đã Hoàn Thành (Completed Phases)

Tài liệu tóm tắt ngắn gọn các cột mốc đã hoàn thành và được kiểm định trong dự án STARFRONT.

---

## Giai Đoạn 1: Nguyên Mẫu Chiến Đấu Theo Lượt (Phase 1 — Prototype Combat)
- **Trạng thái**: **HOÀN THÀNH (DONE)**.
- **Kết quả bàn giao**:
  - Đấu trường cơ giáp theo lượt với cơ chế Sáng kiến Tốc độ (Speed Initiative).
  - Lớp cơ giáp khởi đầu: Vanguard Gear với 4 kỹ năng cơ bản (Pulse Strike, Armor Break, Emergency Guard, Basic Shot).
  - 3 Chủng loại kẻ địch nguyên mẫu với AI tự động: Scout Drone, Raider Mech, Siege Walker.
  - Vòng lặp chiến đấu: `player-turn` ➔ `enemy-turn` ➔ phân định thắng bại, kèm Nhật ký chiến đấu (Combat Log).

---

## Giai Đoạn 2: Tiến Trình & Kho Trang Bị Hangar (Phase 2 — Progression & Loadout)
- **Trạng thái**: **HOÀN THÀNH (DONE)**.
- **Kết quả bàn giao**:
  - Hệ thống tăng trưởng cấp độ (Level 1+), Kinh nghiệm (EXP), Ngân sách Tín dụng (Credits).
  - Xưởng Hangar 3 vị trí trang bị: Vũ khí chính (Weapon), Khiên chắn (Shield), Động cơ đẩy (Engine).
  - Công thức tính chỉ số chiến đấu tổng hợp từ khung cơ giáp và trang bị.
  - Lưu trữ LocalStorage Schema v1 với cơ chế phục hồi và reset an toàn.

---

## Giai Đoạn 3: Bản Đồ Khu Vực, 3 Lớp Gear & Chợ Quân Sự (Phase 3 — Missions, Gears & Shop)
- **Trạng thái**: **HOÀN THÀNH (DONE)**.
- **Kết quả bàn giao**:
  - Bản đồ chiến dịch 3 Sector (Asteroid Belt, Plasma Nebula, Bastion Core) với 9 tuyến ải mở khóa tuần tự.
  - 3 Lớp Cơ Giáp hoàn chỉnh: Vanguard (Cân bằng), Falcon (Siêu tốc & Né tránh), Aegis (Pháo đài hạng nặng).
  - Chợ quân sự Armory Shop mua bán trang bị bằng Credits, chống bán đồ đang trang bị.
  - Bộ âm thanh Web Audio đa tần số (`audio.ts`) không dùng file ngoài, có nút bật/tắt (Mute).
  - Nâng cấp lưu trữ lên Schema v2 với khả năng migration an toàn.

---

## Giai Đoạn 4: Độ Sâu Chiến Thuật & AI Kẻ Địch (Phase 4 — Combat Depth & Enemy AI)
- **Trạng thái**: **HOÀN THÀNH (DONE) — Milestones 4.1 đến 4.4**.
- **Kết quả bàn giao**:
  - **M4.1**: Chuẩn hóa hệ thống hiệu ứng trạng thái mở rộng (Burn DoT, Acid Corrosion, Stun, EMP Slow, ECM Jamming, Shield) với 3 quy tắc xếp chồng (Refresh, Intensity, Override).
  - **M4.2**: Hệ thống hành vi AI đối thủ theo 4 Archetype (Disruptor, Aggressive, Defensive, Adaptive-Boss).
  - **M4.3**: Cơ chế Boss đa pha (Enrage khi HP < 50%) và đòn đánh tối thượng có cảnh báo trước (Telegraphed Attacks).
  - **M4.4**: Hàng đợi lượt động (Dynamic Turn Queue) cập nhật tức thời khi SPD biến đổi; bổ sung Xuyên Giáp, Bạo Kích, Né Tránh.

---

## Giai Đoạn 5: Tiến Trình Cơ Giáp, Cường Hóa & Nhiệm Vụ Phân Tầng (Phase 5)
- **Trạng thái**: **HOÀN THÀNH (DONE) — Milestones 5.1 đến 5.6** (60/60 automated tests PASS).
- **Kết quả bàn giao**:
  - **M5.1**: Hệ thống cường hóa trang bị (+1 đến +10) bằng Credits và Hợp Kim (Alloy).
  - **M5.2**: Kỹ năng nội tại phân hóa bản sắc 3 lớp Gear (Vanguard hồi SP, Falcon bạo kích/né/bắn bồi, Aegis phản đòn/kháng debuff).
  - **M5.3**: Vòng lặp kinh tế chợ & Tái chế rã đồ thừa thu hồi Hợp Kim; phân tầng hàng hóa theo Sector.
  - **M5.4**: Lưu trữ Schema v3 với khả năng tự động chuẩn hóa cấp cường hóa [0..10] và đồng bộ Hangar <-> Arena.
  - **M5.5**: Phân tầng nhiệm vụ (Quest Level 1–15), 5 phẩm chất, 9 biến thể quái, rơi đúng 1 trang bị ngẫu nhiên kèm xem trước phần thưởng.
  - **M5.6**: Sửa lỗi mở khóa vũ khí Ải 3-3, nút Làm Mới Chợ Quân Sự (lượt free/100 Cr), khóa cấu hình địch trong Đấu Trường, mở rộng Sector 4 Event Horizon, cơ chế Reset ải & Nhiệm vụ phụ tuyến.
  - **M5.7 (Xác minh thực tế)**: Đã hoàn thành bộ khung giao diện Hangar 5 Slot Kỹ Năng, modal xem quy tắc tương thích, và hàm tính điểm SP phi thuyền `getAircraftSkillPoints` (+2 SP/cấp). Phần lưu trữ mô-đun và backend slot levels được chuyển tiếp an toàn vào lộ trình tương lai.
