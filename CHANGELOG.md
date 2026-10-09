# STARFRONT — Nhật Ký Thay Đổi (Changelog)

Toàn bộ các mốc phát triển và cập nhật kế hoạch của dự án **STARFRONT** được ghi lại tại đây theo trình tự thời gian đảo ngược (mới nhất lên đầu).

---

## [Phase 4] — Độ Sâu Chiến Thuật, Hệ Thống Hiệu Ứng & AI Kẻ Địch

*Đã hoàn thành & Đã kiểm chứng (36/36 automated tests passed, build thành công)*

### Tính năng đã hoàn thành:
- **Milestone 4.1: Chuẩn hóa Hệ Thống Hiệu Ứng Trạng Thái & Quy Tắc Xếp Chồng (Status Effects & Stacking)**:
  - Mở rộng kiểu dữ liệu `CombatStatusType` và `StatusEffect`: DoT Plasma Burn, Acid Corrosion, EMP Slow, ECM Jamming, Stun/Overheat, Emergency Guard, Boss Overdrive, Charge Ultimate.
  - Quy tắc xếp chồng chuẩn hóa: `refresh` (làm mới thời hạn), `intensity` (cộng dồn tầng tối đa N tầng, ví dụ Acid tối đa 3 tầng), `override` (ghi đè khi hiệu ứng mới mạnh hơn).
  - Hàm `tickUnitTurn` tự động kích hoạt DoT rút máu ở đầu lượt, trừ thời hạn và dọn dẹp hiệu ứng khi hết hạn; Stun khiến mục tiêu mất lượt hành động.
- **Milestone 4.2: Hành Vi AI Đối Thủ Theo 4 Archetype (Tactical Enemy AI)**:
  - Phân loại 4 Archetype chiến thuật:
    - *Disruptor (Drone Trinh Sát)*: Ưu tiên EMP Slow làm chậm, kích hoạt ECM Jamming khi thấp máu.
    - *Aggressive (Cơ Giáp Đột Kích)*: Dồn sát thương tên lửa bùng nổ khi người chơi dưới 45% HP, thiêu đốt Plasma Burn.
    - *Adaptive-Boss (Pháo Đài Công Thành)*: Bật khiên Fortify khi HP < 55%, phun Acid ăn mòn, nạp đại pháo tối thượng.
  - Cây quyết định theo ngữ cảnh, AI không bao giờ thực hiện hành động trái luật (thiếu SP hoặc đang cooldown).
- **Milestone 4.3: Cơ Chế Boss Đa Pha & Cảnh Báo Tuyệt Kỹ (Multi-Phase Boss & Telegraphed Attacks)**:
  - Cơ chế Boss 2 pha: Khi Boss dưới 50% HP, tự động kích hoạt PHA 2 - QUÁ TẢI NĂNG LƯỢNG (Overdrive): +30% ATK, +20 SPD kèm huy hiệu đỏ trên HUD.
  - Cơ chế cảnh báo đòn đánh tối thượng (Telegraphed Attack): Lượt N sạc pháo hiển thị banner cảnh báo đỏ khẩn cấp trên buồng lái; lượt N+1 xả đòn "Pháo Hạt Nhân Tận Diệt" 240% sát thương xuyên giáp. Nếu boss bị Stun ở lượt nạp sẽ bị ngắt chiêu hoàn toàn.
- **Milestone 4.4: Hàng Đợi Lượt Động, Né Tránh & Công Thức Sát Thương (Dynamic Turn Queue & Combat Formulas)**:
  - Dynamic Turn Queue: Tốc độ hiệu dụng (`getEffectiveSpeed`) cập nhật liên tục thứ tự ra đòn trên buồng lái khi có hiệu ứng làm chậm hoặc tăng tốc.
  - Công thức sát thương tích hợp chỉ số Xuyên Giáp (Armor Penetration) và Bạo Kích (Critical Hit).
  - Cơ chế Né Tránh (Evasion): Tỉ lệ né tránh theo chênh lệch tốc độ và buff ECM, né đòn nhận 0 sát thương kèm phản hồi "NÉ TRÁNH 💨".
  - Loại bỏ hoàn toàn chuỗi text cố định "Vanguard" trong `engine.ts`, thay bằng tên động `${player.name}`.
- **Nâng cấp giao diện buồng lái Đấu Trường (`combat-arena.tsx`)**:
  - Huy hiệu trạng thái trực quan phân biệt màu và icon (Lửa Plasma, Acid x tầng, Khiên, EMP, ECM, Stun).
  - Banner cảnh báo Boss nạp đại pháo tối thượng nhấp nháy đỏ trên màn hình.
  - Huy hiệu "PHA 2: OVERDRIVE 🔥" cạnh tên Boss khi vào pha 2.
  - Hiển thị chỉ số hiệu dụng thực tế (Tấn Công, Phòng Thủ, Tốc Độ) trên cả hai bên.

---

## [Phase 3] — Bản Đồ Chiến Dịch, 3 Lớp Cơ Giáp & Chợ Quân Sự

*Đã hoàn thành & Đã kiểm chứng (37/37 automated tests passed)*

### Tính năng đã hoàn thành:
- **Bản đồ chiến dịch vũ trụ (Sector Campaign Map)**:
  - 3 Sector chiến lược: Vành Đai Asteroid, Tinh Vân Plasma, Pháo Đài Bastion Core.
  - 9 ải chiến đấu tuyến tính, phân tách thưởng Lần Đầu (First Clear) và thưởng Lặp Lại (Repeat Clear).
- **3 Lớp Cơ Giáp hoàn chỉnh (Gear Classes)**:
  - *Vanguard Gear*: Lớp cơ giáp đa năng cân bằng công thủ.
  - *Falcon Gear*: Tiêm kích siêu tốc (125 SPD), luôn giành quyền ra đòn trước kẻ địch. 4 kỹ năng độc quyền.
  - *Aegis Gear*: Pháo đài hạng nặng (1800 HP, 120 DEF), giáp titan siêu bền và hỏa lực hạt nhân. 4 kỹ năng độc quyền.
- **Chợ quân sự không gian (Armory Shop)**:
  - Mua sắm trang bị hiếm/sử thi bằng Credits.
  - Bán vật phẩm thừa lấy lại 60% Credits, khóa bán đối với trang bị đang gắn trên người.
- **Hiệu ứng âm thanh Sci-Fi Web Audio (`audio.ts`)**:
  - Tổng hợp âm thanh laser, xung chấn va chạm, lá chắn, chiến thắng và lên cấp không cần tệp ngoài.
  - Tích hợp nút bật/tắt âm thanh (Mute/Unmute) trên giao diện.
- **Nâng cấp lưu trữ Schema v2 (`storage.ts`)**:
  - Hỗ trợ migration tự động và an toàn từ dữ liệu v1 sang v2.

---

## [Phase 2] — Tiến Trình Nhân Vật, Cấp Độ & Kho Đồ Hangar

*Đã hoàn thành*

### Tính năng đã hoàn thành:
- **Hệ thống cấp độ & Kinh nghiệm**:
  - Cơ chế tính EXP thăng cấp và tăng chỉ số vĩnh viễn (HP, SP, ATK, DEF, SPD).
  - Tích lũy ngân sách Credits từ chiến thắng trận đấu.
- **Kho trang bị (Hangar)**:
  - 3 ô trang bị: Vũ khí chính, Khiên phòng hộ, Động cơ đẩy.
  - So sánh chỉ số trực quan khi rê chuột vào vật phẩm.
  - Tính toán chỉ số tổng hợp có tác động thực tế đến chỉ số trong trận đánh.
- **Lưu trữ dữ liệu LocalStorage**:
  - Tự động lưu tiến trình và nạp lại khi tải lại trang web.
  - Hộp thoại cảnh báo xác nhận khi thực hiện Cài lại tiến trình.

---

## [Phase 1] — Nguyên Mẫu Đấu Trường Theo Lượt (Turn-based Arena)

*Đã hoàn thành*

### Tính năng đã hoàn thành:
- **Đấu trường chiến đấu theo lượt tốc độ (Speed Initiative)**:
  - So sánh tốc độ xác định bên ra đòn trước tiên.
  - Quản lý HP (Độ bền vỏ), SP (Năng lượng lõi).
  - 3 Kỹ năng khởi đầu của Vanguard (Pulse Strike, Armor Break, Emergency Guard) và đòn đánh thường hồi SP.
- **3 Chủng loại kẻ thù với AI độc lập**:
  - Drone Trinh Sát (Scout Drone), Cơ Giáp Đột Kích (Raider Mech), Pháo Đài Công Thành (Siege Walker Boss).
- **Giao diện Sci-Fi HUD buồng lái**:
  - Bảng trạng thái máu/năng lượng, radar mục tiêu, bảng nút kỹ năng và nhật ký chiến đấu thời gian thực.
  - Tích hợp mượt mà vào bảng điều khiển Ace Manager thông qua `components/game/console.tsx`.
