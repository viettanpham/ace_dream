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
| **Phase 5** | Tiến Trình Cơ Giáp, Cường Hóa, Ghép Đôi Pilot, Tuyệt Kỹ & Màn Hình Kết Quả D3 | **Đã triển khai (Done)** | Hoàn thành Milestones 5.1 -> 5.12 (102/102 automated tests PASS). Bao gồm Ghép đôi 3 bước, Khóa 5 trận linh hoạt, 8 Phi công, Tuyệt Kỹ Liên Hoàn, Buồng lái, Admin CP, và Màn hình kết quả sau nhiệm vụ D3. |
| **Phase 6.1** | STARFRONT WORLD — Nền Tảng Dữ Liệu & Hệ Thống Lưu Trữ Cách Ly | **Đã triển khai (Done)** | Hoàn thành Milestone 6.1 (`lib/game/world/types.ts`, `storage.ts`, `initial-state.ts`). Đã kiểm chứng cách ly 100% khỏi RPG save v4, sao lưu luân phiên Slot A/B, CRC32 checksum, tự phục hồi khi crash (114/114 automated tests PASS). |
| **Phase 6.2** | STARFRONT WORLD — Mạng Lưới Đồ Thị World Map & Máy Trạng Thái Sector | **Đã triển khai (Done)** | Hoàn thành Milestone 6.2 (`lib/game/world/graph.ts`, `sector-lifecycle.ts`, `initial-map.ts`). Đồ thị Dijkstra shortest/safest path, 4 trạng thái tuyến (`open`, `hazardous`, `blocked`, `offline`), máy trạng thái 5 giai đoạn (`Normal` $\rightarrow$ `Threatened` $\rightarrow$ `Under Siege` $\rightarrow$ `Lost` $\rightarrow$ `Recovery`), giải phóng/thất thủ, và kiểm thử toàn diện (133/133 automated tests PASS). |
| **Phase 6.3** | STARFRONT WORLD — Động Cơ Tick Chiến Lược & Mô Phỏng Bắt Kịp Ngoại Tuyến | **Đã triển khai (Done)** | Hoàn thành Milestone 6.3 (`lib/game/world/tick-engine.ts`, `catchup-engine.ts`, `random.ts`). Chuỗi 6 phase bất biến tất định, thuật toán SplitMix32/Mulberry32 PRNG, phá vỡ thế hòa ổn định, Bounded Batch Catch-up trần 360 ticks chống lùi giờ hệ thống, Time Travel Preview & Checkpoint Storage (149/149 automated tests PASS). |
| **Phase 6.4–6.9** | STARFRONT WORLD — Các Phân Hệ Gameplay Chiến Lược Tiếp Theo | **Đã khóa thiết kế & kế hoạch (Planned)** | Chưa triển khai code. Bao gồm Kinh tế/Hậu cần, Quân sự, Combat adapter, Event engine, Operations Center UI. |

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

### 2.8. Sửa Lỗi Tiến Trình Nhiệm Vụ, Mở Khóa Vũ Khí, Làm Mới Chợ & Mở Rộng Chiến Dịch (Phase 5 — Milestone 5.6)
- **Sửa Lỗi Mở Khóa Vũ Khí & Đồng Bộ Điều Kiện Ải 3-3**:
  - Khắc phục triệt để lỗi vũ khí Sector 3 (`shop_wpn_stellar_annihilator`) bị khóa dù người chơi đã hoàn thành ải 3-3.
  - Đồng bộ logic mở khóa `isShopItemUnlocked` đa tương thích giữa cả hai định dạng ID (`m3-3` và `mis-3-3`), giữa dữ liệu tiến trình `completedMissions`, logic mua `buyShopItem` và UI hiển thị tại `starfront-shop.tsx`.
  - Khóa chặt việc mua vũ khí khi chưa đủ điều kiện mở khóa, ngăn chặn gian lận hoặc lỗi tự mở khóa sai.
- **Làm Mới Gian Hàng Chợ Quân Sự (Armory Shop Refresh)**:
  - Bổ sung nút **Làm Mới Gian Hàng (Refresh)** trực quan tại giao diện Chợ Quân Sự Vũ Trụ (`starfront-shop.tsx`).
  - Quy tắc kinh tế rõ ràng: Ưu tiên tiêu hao lượt làm mới miễn phí (`freeShopRefreshes`), khi hết lượt miễn phí sẽ tốn 100 Credits. Chặn và thông báo rõ ràng khi không đủ Credits.
  - Random lại 6 món trang bị theo pool vật phẩm và quy tắc phân tầng Sector, cập nhật đầy đủ tên, độ hiếm, chỉ số, giá bán, điều kiện mở khóa và trạng thái đã mua (`isPurchased`).
- **Khóa Cấu Hình Địch & Chuẩn Hóa Chỉ Số Khi Vào Trận Chính Tuyến**:
  - Khi người chơi chọn ải chiến dịch, hệ thống tự động chốt cấu hình kẻ địch (`activeCampaignMission`).
  - Trong buồng lái Đấu Trường (`combat-arena.tsx`), thanh lựa chọn đối thủ bị khóa kèm huy hiệu cảnh báo `ĐÃ KHÓA THEO NHIỆM VỤ`, ngăn người chơi đổi sang địch Dễ/Trung bình/Khó ngoài cấu hình ải. Cung cấp nút `Hủy Ải (Chọn Tự Do)` khi muốn thoát ra chế độ tự do.
  - Chỉ số chiến đấu (HP, ATK, DEF, SPD) được tính toán đồng bộ theo công thức chuẩn của `scaling.ts`, đảm bảo thông số hiển thị trước trận khớp 100% với địch thực tế trong buồng lái.
- **Mở Rộng Nhiệm Vụ Chiến Dịch & Cơ Chế Reset Ải**:
  - Bổ sung Sector 4: *Vành Đai Sự Kiện Chân Trời (Event Horizon Outpost)* gồm 3 ải mở rộng (`m4-1`, `m4-2`, `m4-3`) tiếp nối câu chuyện và cấp độ chiến dịch (Cấp 10–12).
  - Cho phép reset cấu hình và phần thưởng của từng ải đã hoàn thành (`resetCampaignMissionConfig`) hoặc reset toàn bộ ải đã hoàn thành trong Sector hiện tại, tạo lại ngẫu nhiên phẩm chất (`quality`), biến thể kẻ địch (`variantId`) và trang bị rơi dự kiến (`previewReward`).
  - Reset an toàn tuyệt đối: Không làm mất tiến trình đã lưu, kho đồ, cấp cường hóa hay tài nguyên đã nhận.
- **Hệ Thống Nhiệm Vụ Tiền Thưởng Phụ Tuyến (Side Quests)**:
  - Khu vực hiển thị danh sách nhiệm vụ phụ tuyến chuyên biệt trên giao diện Bản Đồ Chiến Dịch (`campaign-map.tsx`).
  - Nhiệm vụ phụ có quy mô cấp độ bám sát cấp người chơi, biến thể địch ngẫu nhiên, phần thưởng Credits/Alloy và trang bị được cân đối thấp hơn nhiệm vụ chính tuyến tương đương.
  - Cho phép làm mới (reset) chuỗi nhiệm vụ phụ bất kỳ lúc nào; phần thưởng hiển thị trước trận khớp 100% với phần thưởng thực nhận sau chiến thắng.
- **Lưu Trữ Bền Vững & Chống Rò Rỉ Trạng Thái**:
  - Dữ liệu gian hàng hiện tại (`currentShopItems`), danh sách nhiệm vụ phụ (`sideQuests`) và cấu hình ải sau reset (`missionOverrides`) được lưu cố định vào `StarfrontProgression` và đồng bộ qua LocalStorage Schema v3.
  - Sau khi tải lại trang web (reload), danh sách shop, nhiệm vụ và điều kiện mở khóa hoàn toàn nguyên vẹn, không bị tự động random lại ngoài ý muốn.

### 2.9. Hệ Thống Mô-đun Kỹ Năng & Trang Bị Thống Nhất (Phase 5 — Milestone 5.7) `[KẾ HOẠCH CHI TIẾT / PLANNED — CHƯA TRIỂN KHAI CODE]`
- **Mục tiêu**: Chuẩn hóa hệ thống Shared Item Balance System dùng chung cho Trang bị (Weapon, Shield, Engine) và Mô-đun Kỹ Năng (Slot 1–5), thiết lập ngân sách sức mạnh (Power Budget), cơ chế random có giới hạn, xếp hạng Item/Skill Rating, định giá thương mại, và hệ thống 5 Slot kỹ năng kèm cơ chế nâng cấp slot bằng Aircraft Skill Points.
- **Trạng thái**: **Đang lập kế hoạch (Planning)** — Chưa triển khai mã nguồn gameplay.
- **Tài liệu đặc tả kiến trúc chi tiết (`docs/systems/`)**:
  - Danh mục hệ thống & nguyên tắc: [`docs/systems/GAME_SYSTEMS.md`](./docs/systems/GAME_SYSTEMS.md)
  - Hệ thống nhân vật & cơ giáp: [`docs/systems/CHARACTER_GEAR_SYSTEM.md`](./docs/systems/CHARACTER_GEAR_SYSTEM.md)
  - Cân bằng vật phẩm & Power Budget: [`docs/systems/ITEM_BALANCE.md`](./docs/systems/ITEM_BALANCE.md)
  - Hệ thống trang bị & tương thích: [`docs/systems/EQUIPMENT_SYSTEM.md`](./docs/systems/EQUIPMENT_SYSTEM.md)
  - 5 Slot kỹ năng, nâng cấp ô & Specter: [`docs/systems/SKILL_SYSTEM.md`](./docs/systems/SKILL_SYSTEM.md)
  - Cơ chế chiến đấu theo lượt: [`docs/systems/COMBAT_SYSTEM.md`](./docs/systems/COMBAT_SYSTEM.md)
  - Cấu trúc dữ liệu lưu & Migration v4: [`docs/systems/SAVE_DATA.md`](./docs/systems/SAVE_DATA.md)
- **Tóm tắt thiết kế kiến trúc**:
  - *Shared Item Balance System*: Khung đánh giá và ngân sách sức mạnh chung dựa trên hệ số quy đổi Power Tokens (1 ATK = 1.0 PT, 1 DEF = 1.2 PT, 1 SPD = 1.5 PT, 1 HP = 0.08 PT, 1% Crit = 3.0 PT, 1% Evasion = 3.5 PT, v.v.).
  - *Phân cấp tương thích*: All-Gear (75% drop pool, linh hoạt cho mọi Gear) vs Gear-specific (25% drop pool, chuyên biệt theo Gear với +10% ngân sách sức mạnh).
  - *Hệ thống 5 Slot Kỹ Năng*: Slot 1 (Basic Attack tạo SP), Slot 2–4 (Active Skills, tối đa 2/3 slot All-Gear), Slot 5 (Bắt buộc Ultimate của đúng Gear).
  - *Nâng cấp ô kỹ năng (Slot Upgrade)*: Tăng 1 Aircraft Level nhận +2 Skill Points; nâng cấp gắn cố định theo Slot (không mất cấp khi đổi module), tăng +2.5% hiệu quả/cấp (Max Lv.20).
  - *Cấp độ Module theo Rarity*: All-Gear (Common Lv.10, Rare Lv.15, Epic Lv.20, Legendary Lv.25); Gear-specific (+10 cấp tương ứng: Lv.20/25/30/35).
  - *Lớp Cơ Giáp Thứ Tư — Specter (Tactical Support)*: Định hướng tác chiến điện tử & kiểm soát nhịp độ với nội tại tích tầng Tactical Charge và chiêu cuối Orbital Strike Protocol.
  - *Schema Migration v4*: Mở rộng lưu trữ `skillPoints`, `slotLevels`, `equippedSkills`, `skillInventory` bảo toàn dữ liệu cũ v1/v2/v3.

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

## 4. Danh Mục Tính Năng Dự Kiến (Planned Features — Phase 6: STARFRONT WORLD)

> **LƯU Ý QUAN TRỌNG VỀ PHÂN ĐỊNH TRẠNG THÁI KỸ THUẬT**:  
> Toàn bộ các tính năng thuộc phân hệ **STARFRONT WORLD** dưới đây đang ở trạng thái **ĐÃ XÁC NHẬN THIẾT KẾ (Design Confirmed) & ĐÃ LẬP KẾ HOẠCH (Planned)**.  
> **CHƯA ĐƯỢC TRIỂN KHAI TRONG MÃ NGUỒN GAMEPLAY**. Tuyệt đối không đánh dấu là đã hoàn thành khi chưa có code và test kiểm chứng thực tế.  
> Tài liệu đặc tả chi tiết tối cao: [`WORLD_DESIGN.md`](./WORLD_DESIGN.md). Kế hoạch phân kỳ kỹ thuật: [`WORLD_IMPLEMENTATION_PLAN.md`](./WORLD_IMPLEMENTATION_PLAN.md).

### 4.1. Tổng Quan Kiến Trúc & Giao Diện Người Dùng (Overview & UI Architecture)
- **Vị Trí Tích Hợp Shell Cao Nhất (Top-Level Navigation Tab)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - WORLD là trung tâm chỉ huy chiến lược vĩ mô của sản phẩm, không chỉ là danh sách nhiệm vụ tĩnh.
  - Tích hợp vào thanh điều hướng cấp cao nhất (`StarfrontSection`) trong `starfront-shell.tsx` (`id: "world"`), hiển thị các phân khu tác chiến: Tổng quan chiến dịch, Bản đồ chiến lược, Lực lượng quân sự, Hậu cần & Kinh tế, Tình báo & Sự kiện.
- **Bản Đồ Toàn Màn Hình Tùy Chọn (Optional Fullscreen World Map)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Nút chuyển đổi chế độ xem bản đồ 100vw x 100vh với HUD điều khiển tối giản, hỗ trợ pan/zoom và phím tắt `ESC`.
- **Tổng Hành Dinh Operations Center** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Phân khu Situation Deck (Tình hình chiến lược thiên hà), Active Operations Board (Chiến dịch đang chạy), Dual Results Hub (Kết quả nhiệm vụ và sự kiện riêng biệt), và Quick Dispatch Dock (Bến điều động nhanh chi viện).

### 4.2. Bản Đồ Thế Giới & Mạng Lưới Tuyến Đường (World Map & Sector Network)
- **Cấu Trúc Đồ Thị Tuyến Siêu Không Gian (Hyperspace Lane Graph)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Mạng lưới đồ thị có trọng số: Tuyến đường là cạnh kết nối có ý nghĩa gameplay thực sự phục vụ điều quân, vận tải hàng hóa, di cư dân sự và lan truyền Threat.
  - 4 Trạng thái tuyến: `Open` (An toàn), `Hazardous` (Nguy hiểm / Bị quấy rối), `Blocked` (Bị phong tỏa), `Offline` (Cắt đứt).
- **Phân Biệt Rạch Ròi Giữa Quyền Kiểm Soát (Control) & Mức Độ Đe Dọa (Threat)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - *Sovereignty Control*: VSS, The Void, hoặc Tranh chấp/Trung lập (Quyết định quyền thu thuế và tuyển quân).
  - *Threat Level [0..1000]*: Mật độ hoạt động của địch (Một sector do VSS kiểm soát vẫn có thể có Threat tối đa nếu bị vây hãm).
- **Máy Trạng Thái 5 Giai Đoạn Của Sector (5-Stage Sector Lifecycle)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - `Normal` $\rightarrow$ `Threatened` $\rightarrow$ `Under Siege` $\rightarrow$ `Lost` $\rightarrow$ `Recovery`.
- **Quy Mô Bản Đồ Khởi Đầu** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - 6 đến 10 sector kết nối mạng lưới (Căn cứ Sol Command, trạm khai mỏ, vành đai và tiền đồn biên giới). Thiết kế đồ thị mở sẵn sàng tiếp nhận thêm sector.

### 4.3. Phe Phái, Sổ Cái Quân Sự & Tự Động Hóa Trận Đấu (Factions, Military & Auto-Resolve)
- **Hai Phe Phái Khởi Đầu Bắt Buộc** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Chính phủ VSS (Vanguard Solar Syndicate) và Đế Chế The Void (The Void Incursion). Cho phép mở rộng thêm phe (BCU, ANI, Cướp biển) trong tương lai nhưng KHÔNG thêm phe mới vào phạm vi ban đầu.
- **Sổ Cái Lực Lượng Có Thẩm Quyền (Authoritative Forces Ledger)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Lực lượng chiến lược được bảo toàn quân số: $\text{Total} = \text{Deployed} + \text{Reserves} + \text{Wounded/Repair} + \text{Retreating}$. Điều chuyển quân không bao giờ tự sinh thêm quân.
  - Phân loại rõ ràng các trạng thái: Đang triển khai, Dự bị, Đang sửa chữa/viện binh, Rút lui, và Tổn thất vĩnh viễn (Casualties).
- **Tự Động Hóa Trận Đấu & Can Thiệp Buồng Lái** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Trận phụ (Skirmishes/Patrols) tự giải quyết qua thuật toán Lanchester (Auto-Resolve).
  - Trận chiến quyết định (Decisive Battles) yêu cầu người chơi trực tiếp can thiệp hoặc ủy quyền phó tư lệnh.
  - Hậu quả thất bại theo ngữ cảnh (Contextual Defeat): Không mặc định mất sector ngay; tính toán thiệt hại công sự, sụt giảm Stability và tổn thất kho trước khi thất thủ hoàn toàn.

### 4.4. Tích Hợp Chiến Đấu & Khế Ước Giao Dịch Lũy Đẳng (Combat Integration & Idempotency)
- **Khế Ước Adapter Ổn Định (`WorldCombatAdapter`)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Tách rời hoàn toàn World State khỏi buồng lái `CombatArena`.
  - Cấu hình phiên bản rõ ràng: `combatVersion: "v1" | "v2"`. Chỉ chuyển V1 sang V2 khi xác nhận tương thích hoàn toàn.
  - Tạo `EncounterSnapshot` độc lập tại thời điểm khóa trận kèm `transactionId` duy nhất (UUID v4).
- **Nhật Ký Giao Dịch Chống Áp Dụng Hai Lần (Idempotent Journal)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Mọi biên lai `CombatResultReceipt` được đối chiếu qua journal; từ chối thực thi nếu transactionId đã commit.
- **Luồng Xử Lý Khi Combat Bị Lỗi (Suspended Recovery Flow)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Không tự ý tạo kết quả Thắng/Thua giả khi combat bị crash hoặc lỗi. Giữ trạng thái `PENDING_RECOVERY`, cho phép người chơi tiếp tục trận đấu hoặc hủy an toàn không bị phạt.

### 4.5. Lưu Trữ Độc Lập & Cơ Chế Sao Lưu Luân Phiên (Storage & Disaster Recovery)
- **Tách Rời Khóa Lưu Trữ** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Khóa riêng biệt: `STARFRONT_WORLD_SAVE_V1`, không đồng nhất với `STARFRONT_SAVE_DATA_V4`.
- **Sao Lưu Luân Phiên Nguyên Tử (Rotating Backups A/B with Atomic Checksum)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Ghi vào staging $\rightarrow$ Đẩy save cũ sang Backup Slot A/B $\rightarrow$ Xác nhận commit khóa chính sau khi kiểm tra checksum hợp lệ.
  - Tự động phục hồi từ backup gần nhất khi phát hiện file save chính bị lỗi cấu trúc hoặc sai mã băm.
- **Điểm Kiểm Tra Checkpoint & Khôi Phục Thao Tác Dang Dở** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Checkpoint tự động sau các mốc sự kiện quan trọng; các tác vụ `PENDING` chưa hoàn tất khi reload sẽ được hoàn trả an toàn.

### 4.6. Thời Gian Thực & Mô Phỏng Bắt Kịp Ngoại Tuyến (Time & Offline Simulation)
- **Mốc Thời Gian Thực Tế (Unix Timestamp Anchor)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - WORLD tiếp tục vận hành ngầm khi người chơi đóng game dựa trên khoảng chênh lệch thời gian thực tế.
- **Bắt Kịp Theo Từng Đợt Có Giới Hạn (Bounded Batch Catch-up)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Chia nhỏ quá trình mô phỏng thành các batch tối đa 50 ticks, kẹp chặn ở tối đa 360 ticks; nhường luồng UI hiển thị tiến trình, chống treo trình duyệt.
- **Công Cụ Kiểm Thử Thời Gian (Time Travel Dev Controls)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Nút tua +1, +7, +30 ngày và tùy chỉnh. CHỈ tác động WORLD, không tua trận đấu đang mở trong buồng lái.
  - Có bản xem trước tác động (Forecast Impact Preview) và hộp thoại xác nhận trước khi tua. Dùng chung 100% logic với engine thật.

### 4.7. Chu Kỳ Tick 6 Phase & Thứ Tự Sự Kiện Tất Định (Deterministic Phased Tick)
- **Thứ Tự 6 Phase Bất Biến Trong Mỗi Tick** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  1. *Phase 1: Phục hồi & Giao dịch* (Xử lý giao dịch treo, hồi phục lính thương vong, sửa chữa).
  2. *Phase 2: Vận chuyển & Di cư* (Đoàn xe hàng di chuyển, dân sự sơ tán an toàn).
  3. *Phase 3: Kinh tế & Dân số* (Sản xuất công nghiệp, tiêu thụ lương thực, tính Stability).
  4. *Phase 4: Quân sự & Mức đe dọa* (Hạm đội hành quân, lan truyền Threat mạng lưới).
  5. *Phase 5: Hạn chót & Kết quả* (Countdown sự kiện hết hạn, auto-resolve trận phụ).
  6. *Phase 6: Kích hoạt mới* (Sinh sự kiện động, nhiệm vụ và tình báo mới).
- **Phá Thế Hòa Ổn Định & Seeded PRNG** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Sắp xếp sự kiện đồng thời theo `(Priority DESC, ScheduledTime ASC, EntityId ASC)`.
  - Mọi biến số ngẫu nhiên sử dụng thuật toán Seeded PRNG tái lập được 100%.

### 4.8. Kinh Tế Chiến Lược, Hậu Cần Tự Động & Dân Cư Bảo Toàn (Economy, Logistics & Population)
- **Bốn Nhóm Tài Nguyên & Lương Thực Thiết Yếu Riêng Biệt** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Vật liệu công nghiệp, Năng lượng, Vật tư hậu cần, và Dữ liệu tình báo.
  - **LƯƠNG THỰC LÀ TÀI NGUYÊN THIẾT YẾU RIÊNG**, không gộp vào vật tư hậu cần.
- **Ba Năng Lực Chiến Lược** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - *Industry*: Giới hạn sản xuất theo từng sector (`sectorIndustryCap`).
  - *Logistics*: Tổng thông lượng vận tải toàn mạng lưới.
  - *Stability [0..100]*: Mức độ ổn định xã hội, tác động trực tiếp đến năng suất và nguy cơ bạo loạn.
- **Hỗ Trợ Hậu Cần Tự Động & Hàng Đang Vận Chuyển** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Tự động điều tiết tài nguyên với ngưỡng tồn kho an toàn 3 ngày (Safety Stock Reserves).
  - Hàng hóa đang di chuyển (`In-Transit`) chưa được tính vào kho đích cho đến khi giao thành công.
- **Dân Số & Quy Tắc Di Cư Bảo Toàn (Zero-Sum Conservation)** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Tách bạch `National Total Population` và `Controlled Territory Population`. Dân số không đổi phe tự động khi mất sector.
  - Di cư bảo toàn tuyệt đối quân số, không sinh dân ảo, không cho phép di cư qua tuyến đường bị phong tỏa.

### 4.9. Vòng Đời Sự Kiện 3 Pha & Trung Tâm Tác Chiến (Events & Operations Center)
- **Vòng Đời Sự Kiện: INIT $\rightarrow$ PROCESSING $\rightarrow$ RESULT** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - `INIT`: Đếm ngược thời gian; khi hết hạn countdown tự động khóa phương án mặc định của template.
  - `PROCESSING`: Lưu bền vững, không bị đặt lại khi reload.
  - `RESULT`: Lưu vào kho lưu trữ bền vững; việc chưa đọc kết quả không chặn sự kiện mới.
- **Sáu Hình Thái Chuỗi Nhiệm Vụ** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Tuyến tính, Phân nhánh, Theo ngưỡng, Phản ứng, Tuần hoàn, và Độc lập. Giới hạn trần toàn cục `MAX_ACTIVE_MISSION_CHAINS = 8`.
- **Trung Tâm Kết Quả Kép Trong Operations Center** `[ĐÃ XÁC NHẬN THIẾT KẾ]`:
  - Hai tab chuyên biệt: **Mission Results** và **Event Results**.
  - Phân loại đã đọc / chưa đọc kèm bộ lọc mức độ nghiêm trọng.
  - Cơ chế Xóa Lịch Sử An Toàn (Safe Pruning): Xóa log hiển thị mà không ảnh hưởng đến bất kỳ dữ liệu nào của World State.

---

### 4.10. Các Đề Xuất Kỹ Thuật Cần Xác Minh & Hạng Mục Tương Lai (Proposals & TBD)
- **Viewport Bản Đồ Toàn Màn Hình Canvas vs SVG** `[ĐỀ XUẤT CẦN XÁC MINH]`: Cần benchmark hiệu năng render 60fps khi có nhiều hạt plasma và tuyến đường hoạt họa.
- **Tốc Độ Suy Thoái Stability** `[ĐỀ XUẤT CẦN XÁC MINH]`: Cần cân bằng thông qua prototype để tránh hiệu ứng trừng phạt người chơi quá khắc nghiệt.
- **Mở Rộng Sector 11+ & Phe Phái Thứ 3 (BCU/ANI)** `[CHƯA XÁC ĐỊNH / TBD]`: Dành riêng cho các bản mở rộng tiếp theo sau khi Phase 6 hoàn thành trọn vẹn.
