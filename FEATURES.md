# STARFRONT — Danh Mục Tính Năng (Feature Registry & Matrix)

Tài liệu này tổng hợp toàn bộ tính năng của dự án **STARFRONT**, phân loại rõ ràng giữa các tính năng **Đã Triển Khai (Done)**, **Chưa Triển Khai (Planned)**, và **Cần Xác Minh / Điểm Lưu Ý (Needs Verification)** dựa trên đối chiếu thực tế giữa tài liệu và mã nguồn hiện tại.

---

## 1. Trạng Thái Tổng Thể Các Phân Hệ (Overview Matrix)

| Giai đoạn | Tên phân hệ | Trạng thái | Ghi chú & Đối chiếu mã nguồn thực tế |
|---|---|---|---|
| **Phase 1** | Nguyên Mẫu Đấu Trường Theo Lượt (Turn-based Arena) | **Đã triển khai** | Đã có trong `engine.ts`, `data.ts`, `combat-arena.tsx`. Đã kiểm chứng lượt theo tốc độ, SP, HP, sát thương. |
| **Phase 2** | Tiến Trình Nhân Vật & Kho Trang Bị (Progression & Loadout) | **Đã triển khai** | Đã có trong `progression.ts`, `storage.ts`, `starfront-hangar.tsx`. Level, EXP, Credits, 3 ô trang bị. |
| **Phase 3** | Bản Đồ Chiến Dịch, 3 Lớp Gear & Chợ (Missions, Gears & Shop) | **Đã triển khai** | Đã có trong `campaign-map.tsx`, `starfront-shop.tsx`, `audio.ts`. 3 Sector (9 ải), Vanguard / Falcon / Aegis, Chợ vũ khí, Web Audio. |
| **Phase 4** | Độ Sâu Chiến Thuật & AI Kẻ Địch (Combat Depth & Enemy AI) | **Đã triển khai** | Hoàn thành Milestones 4.1 -> 4.4: Status Effects (DoT/Stun/Slow/ECM), 4 Archetype AI, Boss 2 Pha Overdrive, Telegraphed Attack, Dynamic Turn Queue & Evasion. Đã kiểm chứng 36/36 tests. |
| **Phase 5** | Tiến Trình Cơ Giáp, Cường Hóa & Nhiệm Vụ Phân Tầng (Progression, Gear & Quests) | **Đã triển khai** | Hoàn thành Milestones 5.1 -> 5.5: Cường Hóa +1..+10, Nội Tại 3 Lớp Gear, Tái Chế & Chợ Phân Tầng, Schema v3 & Đồng Bộ State, Mission Scaling (1–15), 9 Biến Thể Quái, Rơi Đúng 1 Trang Bị Ngẫu Nhiên và Preview Thưởng Minh Bạch. |
| **Phase 6** | Mở Rộng Thế Giới & Chiến Tranh Thiên Hà (World & War Expansion) | **Dự kiến (Planned)** | **Chưa triển khai**. Đã phân rã 4 Milestone chi tiết trong roadmap. |

---

## 2. Chi Tiết Tính Năng Đã Triển Khai (Implemented Features)

### 2.7. Nhiệm Vụ Phân Tầng, Kẻ Địch Biến Thể & Rơi Đồ Trang Bị (Phase 5 — Milestone 5.5)
- **Hệ Thống Phân Tầng Nhiệm Vụ (Quest Level 1–15 & 5 Bậc Phẩm Chất)**:
  - *Quest Level*: Điều chỉnh nền tảng sức mạnh quái theo cấp độ, quyết định power của trang bị rơi và tỷ lệ kinh tế Credits/Alloy.
  - *Quest Quality*: 5 bậc phẩm chất chuẩn hóa (`standard` Tiêu Chuẩn 1.0x, `veteran` Tinh Nhuệ 1.25x, `elite` Tinh Anh 1.5x, `heroic` Anh Hùng 1.8x, `legendary` Truyền Thuyết 2.2x).
- **Hệ Thống Biến Thể Kẻ Địch (9 Enemy Variants)**:
  - *Scout Drone*: Recon (Cơ bản), Interceptor (+15 SPD, 25% Né), Jammer (+DEF, khởi đầu buff ECM Jamming).
  - *Raider Mech*: Assault (Cơ bản), Berserker (+25% ATK, 30% Crit, -20% DEF), Heavy (+30% HP, +30% DEF).
  - *Siege Walker*: Fortress (Cơ bản), Annihilator (+30% ATK, +15% Xuyên Giáp), Colossus (+35% HP, +35% DEF, khởi đầu có khiên gia cố Titan).
  - Công thức tính chỉ số chặt chẽ: `FinalStat = Math.round(Base * Variant * LevelScale * QualityMult)`, kẹp chặn biên chống tràn số hoặc âm.
- **Hệ Thống Rơi Đồ Trang Bị & Thuộc Tính Ngẫu Nhiên (Equipment Loot & Random Stats)**:
  - Mỗi lần hoàn thành hợp lệ trao ĐÚNG 1 trang bị ngẫu nhiên có cấp độ và độ hiếm.
  - Bể thuộc tính riêng theo 3 vị trí trang bị:
    * Weapon: ATK (chính), SPD, SP, HP.
    * Shield: DEF (chính), HP, SP, SPD.
    * Engine: SPD (chính), ATK, SP, HP.
  - Số lượng thuộc tính cộng thêm theo độ hiếm: Common (1 affix), Rare (2 affixes), Epic (3 affixes), Legendary (4 affixes).
  - Chỉ số sinh 1 lần duy nhất cho mỗi item instance, lưu cố định trong kho và tương thích hoàn toàn với Xưởng Cường Hóa (+1..+10) và Tái Chế (Salvage).
- **Công Bố Phần Thưởng Trước Khi Xuất Kích (Reward Preview)**:
  - Danh sách nhiệm vụ thể hiện rõ ràng: Tên/ID, Cấp độ nhiệm vụ, Huy hiệu phẩm chất, Biến thể kẻ địch, Credits dự kiến, Alloy dự kiến, và đúng 1 trang bị rơi (kèm huy hiệu độ hiếm, tên và thuộc tính xem trước).
  - Dữ liệu preview đọc từ cấu hình thực tế của quest, không bị đổi khi accept hoặc reload trang.
  - Cơ chế chống nhận thưởng trùng lặp khi hoàn thành nhiều lần hoặc reload kết quả.

---

## 3. Các Điểm Chưa Xác Minh & Cần Lưu Ý Kỹ Thuật (Needs Verification / Code Observations)

Qua đối chiếu trực tiếp giữa mã nguồn hiện tại và tài liệu, ghi nhận các điểm kỹ thuật đã xử lý và cần lưu ý:

1. **Hiển thị định danh buồng lái khi đổi lớp Gear**:
   - *Đã giải quyết*: Dòng nhật ký khởi tạo trận đấu và Action Deck sử dụng chuỗi động `${player.name}` tương ứng lớp Gear đang chọn (`lib/game/engine.ts`).
2. **Đồng bộ hóa tức thời giữa Hangar và Đấu trường**:
   - *Đã giải quyết trong Phase 5.4*: Khi người chơi bấm đổi Gear hoặc thay đổi trang bị trong Hangar rồi chuyển tab quay lại Đấu trường, hàm `handleSwitchTab` và `handleSelectGear` tự động đồng bộ hóa `combatState` với `StarfrontProgression` mới nhất.
3. **Môi trường kho lưu trữ Git**:
   - Container triển khai không có thư mục `.git` cục bộ. Mọi thao tác lưu mã nguồn được thực hiện trên hệ thống file workspace của AI Studio.
4. **Cấu hình TypeScript Path Alias (`tsconfig.json`)**:
   - Tệp `tsconfig.json` đã được bổ sung `baseUrl: "."` và `"paths": { "@/*": ["./*"] }` để đảm bảo lệnh build Next.js / Turbopack luôn biên dịch thành công.

---

## 4. Danh Mục Tính Năng Dự Kiến (Planned Features — Phase 6)

### 4.1. Giai Đoạn 6: Mở Rộng Thế Giới & Chiến Tranh Thiên Hà (Phase 6 — Planned)
- **Mở rộng Sector 4 & 5 và Phe Phái Thiên Hà**:
  - Sector 4 (Hạm Đội Bị Bỏ Rơi) và Sector 5 (Vành Đai Lỗ Đen).
  - 2 Phe phái đối lập (BCU vs ANI) với điểm danh vọng (Reputation).
- **Đại chiến Mẹ Hạm Không Gian (Mothership Raids)**:
  - Trận chiến công thành nhiều bộ phận: Tháp pháo -> Động cơ -> Lõi trung tâm.
- **Liên kết chiều sâu với Ace Manager**:
  - Căn cứ Ace Manager sản xuất nguyên liệu cho xưởng STARFRONT Hangar.
  - Phi công trong Ace Manager trực tiếp lái Gear trong STARFRONT để nhận thêm buff thuộc tính.
- **Nghiên cứu đề xuất tính năng mạng (Multiplayer Proposal Only)**:
  - Đánh giá kiến trúc bảng xếp hạng (Leaderboards) và PvP bất đồng bộ. Chỉ đưa ra bản đề xuất phân tích, không tự ý xây dựng máy chủ khi chưa phê duyệt.

### 2.5. Hệ Thống Cường Hóa Trang Bị +1 Đến +10 (Phase 5 — Milestone 5.1)
- **Cường hóa trang bị từ +1 đến +10**:
  - Hỗ trợ cả 3 ô trang bị: *Vũ khí (Weapon)*, *Khiên chắn (Shield)*, *Động cơ đẩy (Engine)*.
  - Tăng trưởng chỉ số lũy tiến theo từng cấp: +12% đến +155% chỉ số gốc, đảm bảo mỗi cấp luôn tăng ít nhất +level điểm thuộc tính.
  - Hiển thị nhãn cấp độ trực quan: `[+5] Pháo Cắt Plasma Cao Áp` cùng huy hiệu màu tương ứng theo rank (+1..+4 Cyan, +5..+7 Purple, +8..+9 Orange, +10 Gold Tối Thượng).
- **Cơ chế an toàn tuyệt đối (Anti-Frustration Guarantee)**:
  - Cấp +1 đến +4: Tỉ lệ thành công 100%.
  - Cấp +5 đến +7: Tỉ lệ thành công 80% -> 70% -> 60%. Thất bại giữ nguyên cấp, KHÔNG BAO GIỜ bị vỡ, rớt cấp hay phá hủy trang bị.
  - Cấp +8 đến +10: Tỉ lệ 45% -> 35% -> 25%, thất bại vẫn bảo toàn nguyên vẹn cấp độ trang bị.
- **Tài nguyên nâng cấp & Vòng lặp kinh tế tuần hoàn**:
  - Tiêu tốn Credits và nguyên liệu Hợp Kim (Alloy).
  - Thu thập Hợp Kim (Alloy) qua chiến thắng Đấu Trường và ải Chiến Dịch (3 đến 20 Alloy tùy độ khó).
- **Xưởng Cường Hóa Trực Quan trong Hangar (`starfront-hangar.tsx`)**:
  - Modal chuyên dụng với thanh cuộn chọn nhanh trang bị trong kho.
  - Bảng so sánh chỉ số trước và sau nâng cấp kèm chênh lệch xanh lá `(+Δ)`.
  - Thanh đo tỉ lệ thành công (Success Rate Gauge) và chỉ báo đủ/thiếu tài nguyên minh bạch.
  - Phản hồi âm thanh tương tác Sci-Fi Web Audio và banner kết quả trực quan.
- **Tích hợp đồng bộ vào buồng lái & Đấu trường**:
  - `calculateTotalGearStats` và `buildPlayerCombatUnit` tự động cập nhật sức mạnh ngay khi người chơi cường hóa trang bị.

### 2.1. Đấu Trường Cơ Giáp Theo Lượt (Phase 1)
- **Cơ chế sáng kiến tốc độ (Speed Initiative)**:
  - So sánh tốc độ giữa Đơn vị Người chơi và Kẻ địch (`player.speed >= enemy.speed`). Đơn vị nhanh hơn đi trước.
  - Vòng lặp lượt đi: `player-turn` -> `enemy-turn` -> kiểm tra điều kiện kết thúc (`victory` hoặc `defeat`).
- **Hệ thống chỉ số chiến đấu cốt lõi**:
  - `HP` (Độ bền vỏ giáp), `SP` (Năng lượng kích hoạt kỹ năng).
  - `Attack` (Sức tấn công), `Defense` (Khả năng giảm trừ sát thương).
  - `Speed` (Tốc độ quyết định thứ tự hành động).
- **Bộ 4 kỹ năng cơ bản của Vanguard Gear**:
  1. *Đạn Xung Điện (Pulse Strike)*: Sát thương năng lượng đơn mục tiêu.
  2. *Phá Vỡ Giáp (Armor Break)*: Sát thương kèm debuff giảm 35% phòng thủ trong 2 lượt.
  3. *Lá Chắn Khẩn Cấp (Emergency Guard)*: Kích hoạt khiên giảm 50% sát thương nhận vào trong 2 lượt.
  4. *Đòn Bắn Thường (Basic Shot)*: Không tốn SP, hồi lại +15 SP cho buồng lái.
- **Kẻ địch khởi đầu (3 chủng loại)**:
  - *Scout Drone*: Tốc độ cao (110 SPD), máu mỏng (750 HP).
  - *Raider Mech*: Chỉ số cân bằng (1150 HP, 95 SPD).
  - *Siege Walker (Boss)*: Máu dày (2200 HP), giáp cao (85 DEF), hỏa lực mạnh.
- **AI kẻ địch cơ bản**:
  - Tự động kiểm tra thời gian hồi chiêu và năng lượng SP để ưu tiên kỹ năng mạnh nhất, hoặc bắn thường hồi SP.
- **Giao diện HUD buồng lái Sci-Fi**:
  - Thanh máu HP, năng lượng SP trực quan với hiệu ứng gradient.
  - Bảng mục tiêu radar hiển thị kẻ địch đang khóa.
  - Nhật ký chiến đấu (Combat Log) chi tiết từng hành động bằng tiếng Việt.
  - Nút hỗ trợ "BẤM ĐỂ ĐI NGAY ⚡" cho phép bỏ qua thời gian chờ của AI nếu muốn thao tác nhanh.

### 2.2. Tiến Trình Nhân Vật & Kho Đồ Hangar (Phase 2)
- **Hệ thống tăng trưởng**:
  - Cấp độ (Level 1+), Điểm kinh nghiệm (EXP), Ngân sách Tín dụng (Credits).
  - Công thức thăng cấp: `expRequired = level * 100`. Mỗi cấp cộng vĩnh viễn chỉ số (+60 HP, +10 SP, +8 ATK, +5 DEF, +2 SPD).
- **Kho trang bị (Hangar)**:
  - 3 vị trí trang bị: *Vũ khí (Weapon)*, *Khiên chắn (Shield)*, *Động cơ đẩy (Engine)*.
  - Cơ chế xem trước so sánh chỉ số (Hover preview stats) trước khi thay thế trang bị.
  - Tính toán chỉ số tổng hợp: Chỉ số tổng = Chỉ số gốc lớp Gear + Tăng trưởng cấp độ + Tổng chỉ số 3 món đồ đang trang bị.
- **Hệ thống lưu trữ trình duyệt (LocalStorage)**:
  - Lưu trữ tự động tiến trình của người chơi qua `STARFRONT_SAVE_DATA_V2`.
  - Phục hồi an toàn khi tải lại trang web.
  - Hộp thoại xác nhận an toàn trước khi bấm nút Cài Lại (Reset Save).

### 2.3. Bản Đồ Chiến Dịch, 3 Lớp Gear & Chợ Quân Sự (Phase 3)
- **Bản đồ chiến dịch vũ trụ (Sector Campaign Map)**:
  - **3 Khu vực chiến lược (Sectors)**:
    - *Sector 1: Vành Đai Tiểu Hành Tinh Asteroid* (Ải 1-1, 1-2, 1-3).
    - *Sector 2: Vùng Tinh Vân Plasma Tối* (Ải 2-1, 2-2, 2-3).
    - *Sector 3: Pháo Đài Không Gian Bastion Core* (Ải 3-1, 3-2, 3-3).
  - Tổng cộng 9 ải chiến đấu được mở khóa tuần tự (hoàn thành ải trước mới mở ải sau).
  - Cơ chế phân tách phần thưởng rõ ràng: Thưởng Lần Đầu (First Clear - giá trị cao kèm trang bị thưởng) và Thưởng Lặp Lại (Repeat Clear - hỗ trợ cày cuốc tài nguyên).
- **3 Lớp Cơ Giáp (Gear Classes)**:
  - *Vanguard Gear (Cân Bằng)*: 1250 HP, 85 SPD, 140 ATK, 60 DEF.
  - *Falcon Gear (Tiêm Kích Siêu Tốc)*: 980 HP, 125 SPD (ưu thế ra đòn trước), 165 ATK, 45 DEF. 4 kỹ năng riêng: Đạn Pháo Mach, Tên Lửa Chùm, Tăng Tốc Né Tránh, Bắn Laser Cơ Bản.
  - *Aegis Gear (Pháo Đài Bọc Thép)*: 1800 HP, 65 SPD, 125 ATK, 120 DEF (siêu trâu). 4 kỹ năng riêng: Đại Bác Hạt Nhân, Tường Hào Quang Titan, Quá Tải Hộ Thể, Đòn Bắn Nén.
- **Chợ quân sự không gian (Armory Shop)**:
  - Mua sắm trang bị hiếm/sử thi bằng Credits. Kiểm tra tài chính trước khi mua.
  - Bán vật phẩm không dùng để thu hồi 60% Credits. Ngăn chặn bán trang bị đang gắn trên người.
- **Hiệu ứng âm thanh Sci-Fi Web Audio (`audio.ts`)**:
  - Âm thanh được tổng hợp qua trình duyệt không phụ thuộc asset ngoài: Laser, Va chạm xung chấn, Kích hoạt lá chắn, Khải hoàn chiến thắng, Thăng cấp.
  - Nút bật/tắt âm thanh (Mute/Unmute) lưu trạng thái tức thì.
- **Bảo toàn phân hệ Ace Manager**:
  - Toàn bộ các tab Ace Manager cũ (Dashboard, Pilot, Fleet, Equipment, Base, Map, War Room) giữ nguyên vẹn 100% trong `console.tsx`.

### 2.4. Cường Hóa Trang Bị & Bản Sắc Lớp Cơ Giáp (Phase 5.1 & Phase 5.2 — Đã Hoàn Thành)
- **Hệ thống Cường Hóa Trang Bị (+1 đến +10) (Milestone 5.1)**:
  - Nâng cấp vũ khí, khiên chắn, động cơ với mức chỉ số tăng lũy tiến (+10% đến +150%).
  - Cơ chế bảo vệ: Không bao giờ tụt cấp hay phá hủy trang bị khi thất bại.
  - Xưởng Cường Hóa (Enhancement Lab) minh bạch tỉ lệ thành công và tài nguyên.
- **Bản sắc & Kỹ năng Nội tại 3 Lớp Cơ Giáp (Milestone 5.2)**:
  - **Vanguard Gear (Tiên Phong Cân Bằng)**:
    - *Lõi Năng Lượng Ổn Định (Stable Core)*: Hồi thêm +5 SP mỗi lượt (tổng +10 SP/lượt). Mỗi chu kỳ 3 lượt (lượt 3, 6, 9...), tự động giảm thêm 1 lượt hồi chiêu (CD) cho kỹ năng đang hồi có thời gian chờ lâu nhất.
  - **Falcon Gear (Tiêm Kích Sát Thủ)**:
    - *Khí Động Học Mach (Mach Aerodynamics)*: Tỉ lệ né tránh bẩm sinh +15%, bạo kích cơ sở 25% (Crit DMG 1.75x). Đòn đánh bạo kích có 50% tỉ lệ khai hỏa đòn bắn phụ không tốn SP gây thêm sát thương (50% lượng sát thương bạo kích gốc, tối thiểu 25 DMG).
  - **Aegis Gear (Pháo Đài Bọc Thép)**:
    - *Giáp Phản Lực Titan (Titan Reactive Armor)*: Khiên gai phản lại 20% sát thương nhận vào thẳng vào kẻ tấn công (tối thiểu 1 DMG, hạ gục địch thì thắng trận ngay). Kháng 50% hiệu ứng làm chậm tốc độ (EMP-slow) và phá giáp (Armor Break).
  - **Công Cụ Kiểm Thử Tức Thì Trên UI (Dev Combat Test Controls)**:
    - Bảng điều khiển kiểm thử nội tại tích hợp trực tiếp tại Đấu trường chiến đấu.
    - 6 Kịch bản test 1-click (TC-VG-01, TC-FL-01, TC-FL-02, TC-AG-01, TC-AG-02, TC-NON-01).
    - Thao tác test độc lập, không làm biến đổi hay sai lệch dữ liệu tiến trình lưu trữ của người chơi.

### 2.5. Kinh Tế Chợ Quân Sự & Tái Chế Trang Bị (Phase 5.3 — Đã Hoàn Thành)
- **Hệ thống Tái Chế / Phân Rã Trang Bị (Salvage System)**:
  - Rã các trang bị không dùng trong kho đồ để thu hồi nguyên liệu quý **Hợp Kim (Alloy)** và **Credits**.
  - **Công thức hoàn trả tài nguyên**:
    - *Base Alloy theo Rarity*: Common = 2, Rare = 5, Epic = 12, Legendary = 25 Alloy.
    - *Enhancement Alloy Refund*: Hoàn trả 60% tổng lượng Alloy đã đầu tư qua cường hóa (+1 đến +10), tối thiểu +2 Alloy mỗi cấp.
    - *Credits Refund*: 35% giá trị cơ sở của trang bị + 30% tổng lượng Credits đã đầu tư qua cường hóa.
  - **Cơ chế An toàn Dữ liệu Tuyệt đối (Data Safety & Protection)**:
    - *Khóa trang bị đang lắp*: Ngăn chặn tuyệt đối việc rã trang bị đang được trang bị trên buồng lái (Equipped Protection). Nút Rã đồ tự động ẩn, và backend từ chối thao tác nếu ID đang được trang bị.
    - *Chống trùng lặp / Double-click*: ID vật phẩm bị xóa lập tức khỏi kho ngay khi xác nhận rã; không bao giờ nhận Alloy hoặc Credits lặp lại.
    - *Tài nguyên không âm*: Giá trị Alloy và Credits luôn tăng trưởng dương, đồng bộ thời gian thực giữa UI và LocalStorage.
    - *Xử lý an toàn khi hủy hoặc kho rỗng*: Không thay đổi dữ liệu khi người chơi bấm Hủy hoặc thoát modal.
- **Phân Tầng Chợ Quân Sự Theo Sector (Tiered Armory Shop)**:
  - Khóa/mở khóa vật phẩm tự động theo tiến trình Chiến Dịch: Tầng Cơ Bản (Mở ngay), Sector 1 (Ải 1-3), Sector 2 (Ải 2-3), Sector 3 Legendary Tối Cực (Ải 3-3).
  - Hiển thị trực quan thông báo lý do khóa: `🔒 Yêu cầu hoàn thành Sector X...`.
  - Cơ chế Làm Mới Gian Hàng (Shop Refresh): Ưu tiên dùng lượt miễn phí tích lũy từ chiến thắng (`freeShopRefreshes`), hoặc tốn 100 Credits nếu hết lượt.
- **Giao Diện Người Dùng & Test Controls**:
  - Hộp thoại `SalvageModal` hiển thị bảng ước tính chi tiết lượng Alloy và Credits thu hồi trước khi người chơi nhấn xác nhận.
  - Nút `Rã Đồ ♻️` được tích hợp ở cả tab Hangar (`starfront-hangar.tsx`) và tab Tái Chế trong Chợ Quân Sự (`starfront-shop.tsx`).
  - Nút kiểm thử tức thì `TC-SLV-01` trong Dev Combat Test Controls trên buồng lái để thêm trang bị Epic (+3) vào kho thử nghiệm.

### 2.6. Bảo Đảm An Toàn Dữ Liệu & Đồng Bộ Lựa Chọn Gear (Phase 5.4 — Đã Hoàn Thành)
- **Nâng cấp Storage Schema v3 (`STARFRONT_SAVE_DATA_V3`)**:
  - Hỗ trợ di chuyển tự động (Auto-Migration) từ phiên bản cũ v1 hoặc v2 lên v3 mà không làm mất mát bất kỳ tài nguyên, cấp độ, hay trang bị nào.
  - Chuẩn hóa toàn bộ trang bị: Mọi món đồ đều có `enhancementLevel` nằm trong khoảng an toàn `[0..10]`.
  - Khởi tạo mặc định an toàn cho các trường tài nguyên mới (`alloy = 25`, `freeShopRefreshes = 1`) đối với người chơi cũ.
- **Đồng Bộ Hóa Trạng Thái Tức Thời (Hardened State Synchronization)**:
  - Đổi Gear trong Hangar (hoặc qua Dev Controls) lập tức cập nhật buồng lái Đấu trường:
    * Tên cơ giáp và cấp độ hiển thị.
    * Theme màu sắc (Cyan Tiên Phong / Tím Tiêm Kích / Hổ Phách Pháo Đài).
    * Bộ 4 kỹ năng trong Action Deck cập nhật theo đúng lớp Gear đã chọn.
    * Tốc độ SPD và các chỉ số thụ động (Falcon 15% né, 25% crit, Aegis phản đòn 20%).
  - Khi quay lại Đấu trường từ Hangar sau khi cường hóa hoặc thay đổi trang bị, buồng lái tự động kiểm tra và đồng bộ hóa lại chỉ số thực tế.
- **Bổ Sung Test Controls Milestone 5.4**:
  - `TC-SYNC-01`: Thử nghiệm chu kỳ chuyển đổi và đồng bộ tức thì Vanguard ➔ Falcon ➔ Aegis.
  - `TC-MIG-01`: Xác thực tính toàn vẹn của Storage Schema v3 trong LocalStorage.

---

## 3. Các Điểm Chưa Xác Minh & Cần Lưu Ý Kỹ Thuật (Needs Verification / Code Observations)

Qua đối chiếu trực tiếp giữa mã nguồn hiện tại và tài liệu, ghi nhận các điểm kỹ thuật đã xử lý và cần lưu ý:

1. **Hiển thị định danh buồng lái khi đổi lớp Gear**:
   - *Đã giải quyết*: Dòng nhật ký khởi tạo trận đấu và Action Deck sử dụng chuỗi động `${player.name}` tương ứng lớp Gear đang chọn (`lib/game/engine.ts`).
2. **Đồng bộ hóa tức thời giữa Hangar và Đấu trường**:
   - *Đã giải quyết trong Phase 5.4*: Khi người chơi bấm đổi Gear hoặc thay đổi trang bị trong Hangar rồi chuyển tab quay lại Đấu trường, hàm `handleSwitchTab` và `handleSelectGear` tự động đồng bộ hóa `combatState` với `StarfrontProgression` mới nhất.
3. **Môi trường kho lưu trữ Git**:
   - Container triển khai không có thư mục `.git` cục bộ. Mọi thao tác lưu mã nguồn được thực hiện trên hệ thống file workspace của AI Studio.
4. **Cấu hình TypeScript Path Alias (`tsconfig.json`)**:
   - Tệp `tsconfig.json` đã được bổ sung `baseUrl: "."` và `"paths": { "@/*": ["./*"] }` để đảm bảo lệnh build Next.js / Turbopack luôn biên dịch thành công.

---

## 4. Danh Mục Tính Năng Dự Kiến (Planned Features — Phase 6)

### 4.1. Giai Đoạn 6: Mở Rộng Thế Giới & Chiến Tranh Thiên Hà (Phase 6 — Planned)
- **Mở rộng Sector 4 & 5 và Phe Phái Thiên Hà**:
  - Sector 4 (Hạm Đội Bị Bỏ Rơi) và Sector 5 (Vành Đai Lỗ Đen).
  - 2 Phe phái đối lập (BCU vs ANI) với điểm danh vọng (Reputation).
- **Đại chiến Mẹ Hạm Không Gian (Mothership Raids)**:
  - Trận chiến công thành nhiều bộ phận: Tháp pháo -> Động cơ -> Lõi trung tâm.
- **Liên kết chiều sâu với Ace Manager**:
  - Căn cứ Ace Manager sản xuất nguyên liệu cho xưởng STARFRONT Hangar.
  - Phi công trong Ace Manager trực tiếp lái Gear trong STARFRONT để nhận thêm buff thuộc tính.
- **Nghiên cứu đề xuất tính năng mạng (Multiplayer Proposal Only)**:
  - Đánh giá kiến trúc bảng xếp hạng (Leaderboards) và PvP bất đồng bộ. Chỉ đưa ra bản đề xuất phân tích, không tự ý xây dựng máy chủ khi chưa phê duyệt.
