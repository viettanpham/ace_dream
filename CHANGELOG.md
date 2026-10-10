# STARFRONT — Nhật Ký Thay Đổi (Changelog)

Toàn bộ các mốc phát triển và cập nhật kế hoạch của dự án **STARFRONT** được ghi lại tại đây theo trình tự thời gian đảo ngược (mới nhất lên đầu).

---

## [Phase 5] — Tiến Trình Cơ Giáp, Cường Hóa & Nhiệm Vụ Phân Tầng

*Đã hoàn thành toàn bộ Phase 5: Milestones 5.1, 5.2, 5.3, 5.4, 5.5 & 5.6 (60/60 automated tests passed, build thành công)*

### Tính năng đã hoàn thành:
- **Milestone 5.6: Sửa Lỗi Tiến Trình Nhiệm Vụ, Mở Khóa Vũ Khí, Làm Mới Chợ Quân Sự & Mở Rộng Chiến Dịch (Mission Progression, Shop Refresh & Unlock Fixes)**:
  - **Sửa Lỗi Mở Khóa Vũ Khí Ải 3-3 & Đồng Bộ Dữ Liệu**:
    - Khắc phục lỗi vũ khí Sector 3 (`shop_wpn_stellar_annihilator`) bị khóa sau khi qua ải 3-3: Đồng bộ điều kiện mở khóa `isShopItemUnlocked` hỗ trợ cả 2 định danh `m3-3` và `mis-3-3`.
    - Đồng bộ tuyệt đối giữa dữ liệu tiến trình (`completedMissions`), logic giao dịch (`buyShopItem`) và giao diện Chợ Quân Sự (`starfront-shop.tsx`).
    - Chặn hoàn toàn việc tự động mở khóa vũ khí khi chưa hoàn thành đúng ải yêu cầu.
  - **Làm Mới Gian Hàng Chợ Quân Sự (Shop Refresh)**:
    - Bổ sung nút "Làm Mới Gian Hàng" trên giao diện Chợ tab Mua Trang Bị với hiệu ứng xoay và nhãn chi phí minh bạch.
    - Cơ chế chi phí kinh tế: Tự động trừ lượt miễn phí (`freeShopRefreshes`) trước; khi hết lượt miễn phí tốn 100 Credits; chặn và báo lỗi nếu không đủ Credits.
    - Cập nhật đầy đủ 6 món đồ ngẫu nhiên theo pool Sector, cập nhật tên, độ hiếm, chỉ số, giá bán, điều kiện mở khóa và lưu trạng thái `isPurchased`.
  - **Khóa Cấu Hình Địch Khi Vào Trận Chính Tuyến**:
    - Khi nhận ải từ Campaign Map, hệ thống chốt sẵn `activeCampaignMission` và khóa thanh chọn đối thủ trong buồng lái Đấu Trường (`combat-arena.tsx`) kèm nhãn `ĐÃ KHÓA THEO NHIỆM VỤ: [Tên Địch]`.
    - Người chơi không thể đổi sang các mức Dễ/Trung bình/Khó ngoài cấu hình ải; cung cấp nút `Hủy Ải (Chọn Tự Do)` để trở về chế độ đấu tự do.
    - Chỉ số kẻ địch (HP, ATK, DEF, SPD) được đồng bộ chính xác theo cấp độ và biến thể nhiệm vụ.
  - **Mở Rộng Chiến Dịch & Cơ Chế Reset Ải**:
    - Mở rộng Sector 4: *Vành Đai Sự Kiện Chân Trời (Event Horizon Outpost)* với 3 ải mở rộng (`m4-1`, `m4-2`, `m4-3`).
    - Hỗ trợ reset cấu hình và phần thưởng của từng ải đã hoàn thành (`resetCampaignMissionConfig`) hoặc reset toàn bộ ải trong Sector, tạo mới ngẫu nhiên phẩm chất, biến thể và trang bị rơi dự kiến.
    - Bảo toàn 100% tiến trình đã hoàn thành, kho đồ, cấp cường hóa và Credits/Alloy của người chơi.
  - **Hệ Thống Nhiệm Vụ Phụ Tuyến (Side Quests)**:
    - Bổ sung giao diện danh sách nhiệm vụ phụ riêng biệt trên Bản Đồ Chiến Dịch (`campaign-map.tsx`).
    - Nhiệm vụ phụ bám sát cấp độ người chơi, phần thưởng Credits/Alloy và trang bị cân đối thấp hơn nhiệm vụ chính; hỗ trợ nút reset chuỗi nhiệm vụ phụ bất kỳ lúc nào.
    - Phần thưởng xem trước khớp 100% với phần thưởng thực nhận sau chiến thắng.
  - **Lưu Trữ Bền Vững (State Persistence)**:
    - Lưu cố định `currentShopItems`, `sideQuests`, `missionOverrides` vào tiến trình `StarfrontProgression` và đồng bộ qua LocalStorage Schema v3; không bị reset ngẫu nhiên khi tải lại trang web.
  - **Bộ Kiểm Thử Tự Động (Automated Tests)**:
    - 12/12 automated test cases (`TC-P56-01` đến `TC-P56-12`) tại `tests/phase5-6-mission-progression-shop.test.ts` pass 100%.
    - Tổng cộng toàn bộ 60/60 automated tests pass 100%.
- **Milestone 5.5: Hệ Thống Nhiệm Vụ Phân Tầng, Kẻ Địch Biến Thể & Rơi Đồ Trang Bị Ngẫu Nhiên (Mission Scaling, Enemy Variants & Equipment Loot System)**:
  - **Phân Tầng Nhiệm Vụ & Cân Bằng Toán Học (Quest Level 1–15 & 5 Bậc Phẩm Chất)**:
    - Bảng cấu hình cân bằng tập trung tại `lib/game/scaling.ts` (`QUEST_LEVEL_SCALING`, `QUEST_QUALITY_CONFIG`, `ENEMY_VARIANTS_CONFIG`).
    - Quest Level: Điều chỉnh cấp độ (1–15), độ khó và chỉ số quái (HP 18%/lvl, ATK 12%/lvl, DEF 10%/lvl, SPD tối đa +30).
    - Quest Quality: 5 bậc phẩm chất (`standard`, `veteran`, `elite`, `heroic`, `legendary`) với hệ số độ khó, hệ số Credits/Alloy và bảng xác suất rơi đồ phân tầng (Common -> Legendary).
  - **9 Biến Thể Kẻ Địch Chuyên Biệt (Enemy Variants)**:
    - *Scout Drone*: `recon` (Trinh sát tiêu chuẩn), `interceptor` (Tốc độ cực hạn, né tránh 25%), `jammer` (Nhiễu radar ECM, kích hoạt trường nhiễu né đòn).
    - *Raider Mech*: `assault` (Đột kích quy ước), `berserker` (Cuồng nộ bạo kích +25% ATK, 30% Crit), `heavy` (Thiết giáp titan +30% HP, +30% DEF).
    - *Siege Walker*: `fortress` (Pháo đài tiêu chuẩn), `annihilator` (Kẻ hủy diệt hạt nhân +30% ATK, 35% Xuyên giáp), `colossus` (Khổng lồ bất hoại +35% HP, +35% DEF, khởi đầu có khiên gia cố).
  - **Hệ Thống Rơi Đồ Trang Bị & Thuộc Tính Ngẫu Nhiên (Equipment Loot System)**:
    - Mỗi lần hoàn thành hợp lệ trao ĐÚNG 1 trang bị ngẫu nhiên có cấp độ và độ hiếm.
    - Sinh thuộc tính (stat affixes) ngẫu nhiên theo ô đồ (Vũ khí: ATK chính, Khiên: DEF chính, Động cơ: SPD chính) và cấp độ (itemLevel).
    - Số lượng thuộc tính cộng thêm tăng theo độ hiếm (Common: 1, Rare: 2, Epic: 3, Legendary: 4).
    - Thuộc tính sinh 1 lần duy nhất cho mỗi item instance và lưu cố định, tương thích hoàn toàn với buồng lái chiến đấu, Xưởng Cường Hóa (+1..+10) và Tái Chế (Salvage).
  - **Xem Trước Phần Thưởng Minh Bạch (Reward Preview) & Tính Toàn Vẹn**:
    - Danh sách nhiệm vụ công bố rõ trước khi xuất kích: Cấp độ quest, Huy hiệu phẩm chất, Biến thể kẻ địch, Credits, Alloy và đúng 1 trang bị dự kiến (kèm huy hiệu độ hiếm, tên và thuộc tính xem trước).
    - Dữ liệu nhiệm vụ và phần thưởng ổn định 100% sau khi xuất kích, không bị thay đổi khi tải lại trang web (reload).
    - Chống nhận trùng lặp khi hoàn thành nhiều lần hoặc reload.
  - **Bộ Kiểm Thử Tự Động (Automated Tests)**:
    - Bộ test tự động `tests/phase5-5-mission-scaling.test.ts` gồm 13 test case (`TC-MIS-01` đến `TC-REG-01`) pass 100%.
    - Tổng cộng 48/48 automated tests pass 100%.
- **Milestone 5.4: Bảo Đảm An Toàn Dữ Liệu & Đồng Bộ Lựa Chọn Gear (Storage Schema v3 & State Sync)**:
  - **Nâng Cấp Storage Schema v3 (`STARFRONT_SAVE_DATA_V3`)**:
    - Xây dựng hàm di chuyển dữ liệu thuần `migrateProgressionToV3`:
      * Hỗ trợ tự động nâng cấp từ các phiên bản lưu trữ cũ v1 (`STARFRONT_SAVE_DATA_V1`) và v2 (`STARFRONT_SAVE_DATA_V2`) lên v3.
      * Bảo toàn 100% Cấp độ, EXP, Credits, Alloy, Số trận thắng/thua, Nhiệm vụ chiến dịch đã hoàn thành.
      * Chuẩn hóa toàn bộ trang bị trong kho đồ: Tự động gán `enhancementLevel = 0` cho các món cũ nếu thiếu, bảo toàn nguyên vẹn cấp cường hóa (+1 đến +10) đã có.
      * Tự động khởi tạo an toàn tài nguyên `alloy = 25` và `freeShopRefreshes = 1` cho người chơi từ v1.
      * Bổ sung trang bị khởi đầu cơ bản nếu kho đồ thiếu hụt; kẹp giá trị an toàn trong khoảng `[0..10]` cho cấp cường hóa.
  - **Đồng Bộ Hóa Trạng Thái Tức Thời (Hardened State Synchronization)**:
    - Giải quyết triệt để vấn đề mất đồng bộ hoặc trễ nhịp khi đổi giữa các lớp Gear (Vanguard, Falcon, Aegis):
      * Khi đổi Gear trong tab Hangar hoặc qua Dev Controls, buồng lái Đấu Trường lập tức cập nhật: Tên cơ giáp, bảng màu sắc theme, bộ 4 kỹ năng trong Action Deck, chỉ số Tốc Độ (SPD) và Né Tránh bẩm sinh (Falcon +15% né, 25% crit, Aegis 20% phản đòn).
      * Khi chuyển tab từ Hangar quay lại Đấu trường sau khi thay đổi trang bị hoặc cường hóa đồ, hàm `handleSwitchTab` tự động phát hiện độ lệch chỉ số và đồng bộ hóa lại `combatState` với `buildPlayerCombatUnit(progression)`.
  - **Bổ Sung Test Controls Milestone 5.4**:
    - `TC-SYNC-01: Chu Kỳ Đổi & Đồng Bộ Gear (5.4)`: Chuyển đổi nhanh theo chu kỳ VG ➔ FL ➔ AG và xác thực đồng bộ buồng lái.
    - `TC-MIG-01: Xác Thực Schema v3 & Migration (5.4)`: Kiểm tra tính toàn vẹn và hợp lệ của dữ liệu lưu trữ Schema v3.
  - **Kết Quả Kiểm Thử Tự Động (Automated Tests)**:
    - Bộ test tự động `tests/storage-sync.test.ts` (8/8 tests PASS).
    - Bộ test hồi quy `tests/passives.test.ts` (13/13 tests PASS).
    - Bộ test hồi quy `tests/economy-recycling.test.ts` (14/14 tests PASS).
    - Tổng cộng 35/35 automated tests pass 100%. TypeScript check (`npx tsc --noEmit`) và compile (`compile_applet`) sạch lỗi.
- **Milestone 5.3: Hoàn Thiện Cân Bằng Kinh Tế Chợ Quân Sự & Tái Chế (Armory Economy & Recycling)**:
  - **Tính năng Tái Chế / Rã Đồ (Salvage System)**:
    - Rã các trang bị không dùng để thu hồi nguyên liệu Hợp Kim Cường Hóa (Alloy) và Credits.
    - Công thức thu hồi tài nguyên chặt chẽ và nhất quán:
      * Base Alloy theo Rarity: Common = 2, Rare = 5, Epic = 12, Legendary = 25 Alloy.
      * Enhancement Alloy Refund: Hoàn trả 60% lượng Alloy đã đầu tư qua cường hóa (+1 đến +10), đảm bảo tối thiểu +2 Alloy mỗi cấp.
      * Credits Refund: 35% giá trị cơ sở của trang bị + 30% Credits đã đầu tư qua cường hóa.
  - **Khóa An Toàn & Bảo Vệ Dữ Liệu Tuyệt Đối (Data Safety & Security Guarantees)**:
    - *Khóa trang bị đang dùng (Equipped Protection)*: Không cho phép rã trang bị đang được lắp trên cơ giáp. Nút rã đồ ẩn trên trang bị đang dùng, và logic backend từ chối thao tác nếu ID đang được trang bị.
    - *Chống nhận tài nguyên trùng lặp (Duplicate / Double-click Protection)*: Sau khi rã, trang bị lập tức được loại bỏ khỏi kho; lần gọi thứ hai trên cùng ID sẽ bị từ chối và không cộng dồn tài nguyên.
    - *Bảo toàn số dư*: Số dư Alloy và Credits luôn tăng trưởng không âm, phản ánh chính xác giữa UI và LocalStorage save data.
    - *Không reset hay phá hủy save file*: Giữ nguyên 100% dữ liệu người chơi hiện có.
  - **Cập nhật Phân Tầng Chợ Quân Sự (Tiered Armory Shop)**:
    - Mở khóa vật phẩm theo tiến trình Sector: Hàng Cơ Bản (mở sẵn), Sector 1 (hoàn thành Ải 1-3), Sector 2 (hoàn thành Ải 2-3), Sector 3 Legendary (hoàn thành Ải 3-3).
    - Hiển thị trực quan trạng thái khóa kèm lý do yêu cầu.
    - Cơ chế Làm Mới Gian Hàng (Shop Refresh): Ưu tiên sử dụng lượt miễn phí tích lũy từ chiến thắng (`freeShopRefreshes`), hoặc tốn 100 Credits nếu hết lượt miễn phí. Chiến thắng Arena hoặc Campaign cộng +1 lượt miễn phí.
  - **Giao Diện Người Dùng (UI/UX)**:
    - Hộp thoại `SalvageModal` xác nhận rã đồ với bảng phân tích chi tiết lượng Alloy và Credits hoàn trả (phân tách rõ gốc độ hiếm vs phần thưởng cấp cường hóa).
    - Tích hợp nút `Rã Đồ ♻️` trực tiếp trên kho đồ Hangar (`starfront-hangar.tsx`) và tab `Tái Chế` trong Chợ Quân Sự (`starfront-shop.tsx`).
    - Nút `TC-SLV-01` trong Dev Combat Test Controls trên buồng lái Đấu Trường để thêm trang bị thử nghiệm phục vụ kiểm thử thủ công tức thì.
  - **Kết quả Kiểm thử Tự động (Automated Tests)**:
    - Bộ test tự động `tests/economy-recycling.test.ts` (14/14 tests PASS).
    - Bộ test hồi quy `tests/passives.test.ts` (13/13 tests PASS).
    - Tổng cộng 27/27 automated tests pass 100%. TypeScript check (`npx tsc --noEmit`) và build Next.js (`npm run build`) hoàn toàn sạch lỗi.
- **Milestone 5.2: Định Hình Bản Sắc Gameplay Của Từng Lớp Gear & Kỹ Năng Nội Tại (Gear Class Identity & Passives)**:
  - **Vanguard Gear (Tiên Phong Cân Bằng)**:
    - *Nội tại (Passive)*: *Lõi Năng Lượng Ổn Định (Stable Core)*:
      - Tự động hồi thêm +5 SP mỗi lượt trong `tickUnitTurn` (tổng hồi +10 SP/lượt bao gồm +5 SP cơ bản).
      - Tại chu kỳ mỗi 3 lượt chiến đấu (lượt 3, 6, 9...), tự động giảm thêm 1 lượt hồi chiêu (CD) cho kỹ năng có thời gian chờ dài nhất.
      - Log chi tiết: `[NỘI TẠI VANGUARD ⚡] Lõi Năng Lượng Ổn Định hồi thêm +5 SP...` và `...đạt chu kỳ 3 lượt! Giảm thêm 1 lượt hồi chiêu...`.
  - **Falcon Gear (Tiêm Kích Sát Thủ)**:
    - *Nội tại (Passive)*: *Khí Động Học Mach (Mach Aerodynamics)*:
      - Tỉ lệ né tránh bẩm sinh +15% (Evasion cơ sở = 15%, tối đa lên tới 85%).
      - Tỉ lệ bạo kích cơ sở nâng lên 25% (Crit DMG 1.75x).
      - Khi đòn đánh gây bạo kích, có 50% tỉ lệ kích hoạt đòn bắn phụ không tốn SP gây thêm sát thương (50% lượng sát thương bạo kích gốc, tối thiểu 25 DMG).
      - Log chi tiết: `[NỘI TẠI FALCON ⚡] Khí Động Học Mach kích hoạt! Đòn bạo kích khai hỏa tiếp một đòn bắn bồi không tốn SP, gây thêm X sát thương!`.
  - **Aegis Gear (Pháo Đài Bọc Thép)**:
    - *Nội tại (Passive)*: *Giáp Phản Lực Titan (Titan Reactive Armor)*:
      - Khiên gai hấp thụ và phản lại 20% sát thương nhận vào (tối thiểu 1 DMG) thẳng vào kẻ địch trong `executeEnemyAIAction`.
      - Kháng 50% hiệu ứng làm chậm tốc độ (EMP-slow) và phá giáp (Armor Break), giảm giá trị phạt còn một nửa.
      - Nếu đòn phản sát thương hạ gục kẻ địch, lập tức kết thúc trận đấu với trạng thái `victory` kèm thông báo khải hoàn.
      - Log chi tiết: `[NỘI TẠI AEGIS 🛡️] Giáp Phản Lực Titan kích hoạt! Khiên gai hấp thụ và phản lại 20% sát thương...` và `...triệt tiêu 50% hiệu lực...`.
  - **Giao Diện & Trải Nghiệm Người Chơi (UI & Player Experience)**:
    - Thẻ nội tại trong Hangar (`starfront-hangar.tsx`) hiển thị tên, công thức và mô tả chi tiết của từng lớp Gear.
    - Buồng lái Đấu trường (`combat-arena.tsx`) hiển thị huy hiệu `NỘI TẠI: [Tên Nội Tại]` kèm mô tả cơ chế.
    - Tích hợp **Bảng Điều Khiển Kiểm Thử Nội Tại (Dev Combat Test Controls)** trực tiếp tại Đấu trường:
      - Bộ chọn chuyển đổi nhanh giữa 3 Gear (Vanguard, Falcon, Aegis).
      - 6 Kịch bản test 1-click tức thì: `TC-VG-01` (Vanguard SP & CD), `TC-FL-01` (Falcon Crit & Bắn bồi), `TC-FL-02` (Falcon Né đòn), `TC-AG-01` (Aegis Phản đòn 20%), `TC-AG-02` (Aegis Kháng 50% khống chế), `TC-NON-01` (Kiểm thử không kích hoạt khi không thỏa mãn điều kiện).
      - Đảm bảo an toàn 100% cho save file và tiến trình chiến dịch của người chơi.
  - **Kết quả Kiểm thử (Automated Tests)**:
    - Bộ test tự động `tests/passives.test.ts` gồm 13 test case bao phủ toàn bộ điều kiện kích hoạt, công thức sát thương, giảm CD, kháng hiệu ứng, và các ca biên (non-trigger, evade, phản đòn kết liễu). Kết quả: **13/13 PASS**.
- **Milestone 5.1: Hệ Thống Cường Hóa Trang Bị (+1 đến +10) (Equipment Enhancement System)**:
  - Bảng cấu hình tỉ lệ và chi phí `ENHANCEMENT_TABLE` từ +1 đến +10 cho cả 3 vị trí (Vũ khí, Khiên chắn, Động cơ).
  - Tỉ lệ thành công theo cơ chế chống ức chế (Anti-Frustration):
    - Cấp +1 đến +4: Thành công 100% (An toàn tuyệt đối).
    - Cấp +5 đến +7: Tỉ lệ 80% -> 70% -> 60%, thất bại giữ nguyên cấp, không bao giờ bị phá hủy hay tụt cấp trang bị.
    - Cấp +8 đến +10: Thử thách tối thượng (45% -> 35% -> 25%), thất bại bảo toàn nguyên vẹn trang bị.
  - Hàm `getEnhancedItemStats(item)`: Tính toán chỉ số tăng trưởng đơn điệu, tăng từ +12% đến +155% chỉ số gốc, đảm bảo mỗi cấp luôn tăng ít nhất +level điểm thuộc tính.
  - Hàm `getItemDisplayName(item)`: Định dạng nhãn cấp độ trực quan `[+5] Pháo Cắt Plasma Cao Áp` cùng huy hiệu màu sắc tương ứng (+1..+4 Cyan, +5..+7 Purple, +8..+9 Orange, +10 Gold Tối Thượng).
  - Hàm `enhanceItem(progression, itemId)`: Kiểm tra tài nguyên Credits và Hợp Kim (Alloy), khấu trừ và thực hiện nâng cấp an toàn.
  - Thêm tài nguyên nguyên liệu **Hợp Kim (Alloy)**: Khởi tạo 25 Alloy mặc định, nhận thêm Alloy khi chiến thắng Đấu Trường và ải Chiến Dịch.
  - Giao diện **Xưởng Cường Hóa (Enhancement Lab Modal)** trong Hangar (`starfront-hangar.tsx`):
    - Thanh cuộn chọn nhanh trang bị trong kho đồ.
    - Bảng so sánh chỉ số hiện tại vs chỉ số dự kiến sau cường hóa kèm biến động `(+Δ)` xanh lá.
    - Thanh đo tỉ lệ thành công minh bạch (Success Rate Gauge) và chỉ báo đủ/thiếu tài nguyên Credits & Alloy.
    - Nút bấm trực tiếp `Cường Hóa ⚡` trên từng thẻ trang bị trong kho và trên 3 ô slot đang trang bị.
    - Cam kết bảo toàn trang bị hiển thị rõ ràng trên giao diện.
  - Đồng bộ tức thời: Khi cường hóa trang bị đang lắp, `calculateTotalGearStats` và `buildPlayerCombatUnit` cập nhật chỉ số ngay lập tức vào buồng lái Đấu trường.

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
