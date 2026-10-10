# STARFRONT — Kế Hoạch Dự Án & Lộ Trình Phát Triển (Project Plan & Development Roadmap)

---

## 1. Tổng Quan Dự Án & Phạm Vi Thống Nhất (Project Overview & Scope)

**STARFRONT** là tựa game nhập vai chiến thuật theo lượt 2D (Turn-based RPG) đề tài khoa học viễn tưởng không gian chạy trên trình duyệt web, lấy cảm hứng từ bầu không khí chiến đấu cơ giáp (Gear) kinh điển của *ACE Online*.
- **Bản quyền & Phong cách**: 100% nội dung sáng tạo độc lập (Original IP) — thiết kế cơ giáp, quái vật, kỹ năng, nhiệm vụ và giao diện không sao chép asset có bản quyền gốc.
- **Nền tảng & Trải nghiệm**: Single-player client-side Web SPA, ưu tiên giao diện buồng lái desktop và responsive cho máy tính bảng/di động.
- **Ngôn ngữ hiển thị**: Toàn bộ giao diện tương tác, tên kỹ năng, cốt truyện và thông điệp trong game sử dụng **Tiếng Việt**. Tên mã nguồn, biến, hàm và comment kỹ thuật sử dụng **Tiếng Anh chuẩn**.
- **Nguyên tắc kế thừa**: Bảo tồn nguyên vẹn các phân hệ Ace Manager cũ (Dashboard, Pilot, Fleet, Equipment, Base, Map, War Room) song hành cùng STARFRONT.

---

## 2. Kiến Trúc Kỹ Thuật & Module Hệ Thống (Technical Architecture)

- **Công nghệ nền tảng**: Next.js (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Phân tách trách nhiệm module**:
  - `components/game/combat-arena.tsx`: Buồng lái chiến đấu trung tâm, quản lý lượt, radar feed, thanh điều hướng phụ.
  - `components/game/campaign-map.tsx`: Bản đồ chiến dịch 3 Sector và 9 tuyến ải.
  - `components/game/starfront-hangar.tsx`: Xưởng trang bị, kho đồ 3 slots, chuyển đổi 3 lớp cơ giáp.
  - `components/game/starfront-shop.tsx`: Chợ quân sự mua bán trang bị bằng Credits.
  - `components/game/console.tsx`: Màn hình tích hợp toàn bộ phân hệ STARFRONT và Ace Manager.
  - `lib/game/engine.ts`: Bộ luật chiến đấu thuần (Pure logic engine) — tính toán sáng kiến tốc độ, sát thương, hiệu ứng trạng thái, AI đối thủ.
  - `lib/game/data.ts`: Dữ liệu tĩnh về Cơ Giáp, Kỹ Năng, Kẻ Địch, Sector Chiến Dịch, Danh mục Chợ.
  - `lib/game/types.ts`: Định nghĩa TypeScript interfaces/types chặt chẽ cho toàn hệ thống.
  - `lib/game/progression.ts`: Xử lý Level, EXP, Credits, công thức tăng chỉ số, trả thưởng ải.
  - `lib/game/audio.ts`: Hệ thống tổng hợp âm thanh Web Audio API (Laser, Impact, Shield, Victory, Level Up).
  - `lib/game/storage.ts`: Quản lý lưu trữ LocalStorage, schema migration an toàn.

---

## 3. Lịch Sử Các Giai Đoạn Đã Hoàn Thành (Completed Phases 1–3)

### Giai đoạn 1: Nguyên mẫu chiến đấu theo lượt (Phase 1 — Prototype Combat) [HOÀN THÀNH]
- **Cơ giáp khởi đầu**: Vanguard Gear (Balanced Striker).
- **Bộ kỹ năng chiến thuật cơ bản**:
  1. *Pulse Strike* (Đạn Xung Điện): Sát thương năng lượng đơn mục tiêu.
  2. *Armor Break* (Phá Vỡ Giáp): Sát thương kèm debuff giảm 35% phòng thủ trong 2 lượt.
  3. *Emergency Guard* (Lá Chắn Khẩn Cấp): Giảm 50% sát thương nhận vào trong 2 lượt tiếp theo.
  4. *Basic Shot* (Đòn Bắn Thường): Hồi phục +15 SP, không tiêu hao tài nguyên.
- **3 Chủng loại kẻ thù với AI độc lập**:
  - *Scout Drone*: Tốc độ cao (110 SPD), máu mỏng.
  - *Raider Mech*: Chỉ số đồng đều, cận chiến áp đảo.
  - *Siege Walker*: Trùm công thành hạng nặng (Boss), máu dày, hỏa lực diện rộng.
- **Cơ chế chiến đấu cốt lõi**:
  - Sáng kiến tốc độ (Speed Initiative): Bên có tốc độ cao hơn giành quyền ra đòn trước.
  - Vòng lặp lượt đi: `player-turn` ➔ `enemy-turn` ➔ kiểm tra thắng/bại.
  - Nhật ký chiến đấu (Combat Log) chi tiết bằng tiếng Việt.

### Giai đoạn 2: Tiến trình & Kho trang bị Hangar (Phase 2 — Progression & Loadout) [HOÀN THÀNH]
- **Hệ thống tăng trưởng**: Cấp độ (Level 1+), Điểm kinh nghiệm (EXP), Ngân sách Tín dụng (Credits).
- **Kho trang bị (Hangar)**: 3 vị trí trang bị (Vũ khí chính, Khiên phòng hộ, Động cơ đẩy). Xem trước so sánh chỉ số trước khi gắn đồ.
- **Tác động chỉ số thực tế**: Trang bị và cấp độ tác động trực tiếp đến HP, SP, ATK, DEF, SPD trong đấu trường.
- **Lưu trữ tự động**: Tích hợp LocalStorage lưu tiến trình, cơ chế phục hồi dữ liệu khi tải lại trang, nút Cài Lại có cảnh báo an toàn.

### Giai đoạn 3: Bản đồ khu vực & Chiến dịch (Phase 3 — Missions, Gears & Shop) [HOÀN THÀNH]
- **Bản đồ chiến dịch vũ trụ (Sector Campaign Map)**:
  - 3 Sector chiến lược: Vành Đai Tiểu Hành Tinh Asteroid, Tinh Vân Plasma, Pháo Đài Bastion Core.
  - 9 ải chiến đấu tuyến tính, phân tách thưởng Lần Đầu (First Clear) và thưởng Lặp Lại (Repeat Clear).
- **3 Lớp Cơ Giáp hoàn chỉnh**:
  - *Vanguard Gear*: Đa năng cân bằng công thủ (Balanced Striker).
  - *Falcon Gear*: Tiêm kích siêu tốc (125 SPD ra đòn trước tiên), né tránh cao (Speed Infiltrator).
  - *Aegis Gear*: Pháo đài bọc thép titan hạng nặng (1800 HP, 120 DEF), hỏa lực hạt nhân (Heavy Siege Fortress).
- **Chợ quân sự không gian (Armory Shop)**: Mua sắm trang bị hiếm/sử thi, bán vật phẩm thừa thu hồi Credits, khóa bán đồ đang trang bị.
- **Hiệu ứng âm thanh Sci-Fi Web Audio (`audio.ts`)**: Tổng hợp âm thanh đa tần số qua Web Audio API, có nút bật/tắt (Mute/Unmute).
- **Nâng cấp lưu trữ Schema v2**: Tự động di chuyển dữ liệu (Migration) từ Schema v1 sang v2 an toàn 100%.

---

## 4. Lộ Trình Chi Tiết Các Giai Đoạn Tiếp Theo (Phases 4–6 Roadmap)

---

### GIAI ĐOẠN 4: ĐỘ SÂU CHIẾN THUẬT & AI KẺ ĐỊCH (PHASE 4 — COMBAT DEPTH & ENEMY AI)
*Mục tiêu: Đưa trải nghiệm chiến đấu từ nguyên mẫu cơ bản lên tầm chiến thuật chuyên sâu. Kẻ địch có tính cách và chiến thuật riêng; hệ thống hiệu ứng trạng thái được chuẩn hóa chặt chẽ; cơ chế boss đa pha tạo sự kịch tính.*

#### 🎯 Milestone 4.1: Chuẩn hóa Hệ Thống Hiệu Ứng Trạng Thái (Combat Status Effect Architecture & Rules)
- **Mục tiêu**: Xây dựng kiến trúc quản lý hiệu ứng trạng thái (buff/debuff) toàn diện, thống nhất quy tắc thời hạn, xếp chồng và hóa giải.
- **Phạm vi**:
  - Mở rộng kiểu dữ liệu `StatusEffect`: bổ sung các loại hiệu ứng mới:
    - *Burn / Plasma DoT*: Gây sát thương theo % ATK ở đầu lượt.
    - *Acid Corrosion*: DoT sát thương kèm giảm giáp cộng dồn.
    - *Overheat / Stun*: Làm gián đoạn, khiến mục tiêu mất lượt hành động.
    - *Engine EMP / Slow*: Giảm tốc độ SPD của mục tiêu, ảnh hưởng thứ tự lượt đi.
    - *Target Jamming / ECM*: Giảm độ chính xác (tăng tỉ lệ né tránh của đối phương).
    - *Shield / Fortify*: Hấp thụ sát thương cố định hoặc giảm % sát thương nhận vào.
  - Quy tắc xếp chồng (Stacking Rules):
    - *Refresh*: Làm mới thời hạn (ví dụ: Emergency Guard).
    - *Intensity Stack*: Tăng cấp độ hiệu ứng lên tối đa N tầng (ví dụ: Acid Corrosion tối đa 3 tầng).
    - *Override*: Hiệu ứng mạnh hơn ghi đè hiệu ứng yếu hơn.
  - Quy tắc kết thúc: Tự động giảm thời hạn ở đầu hoặc cuối lượt (`tickUnitTurn`), hóa giải khi hết thời hạn hoặc khi bị thanh lọc.
- **Phụ thuộc**: `lib/game/types.ts`, `lib/game/engine.ts`.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - 100% hiệu ứng trạng thái mới có định nghĩa type, icon và mô tả tiếng Việt rõ ràng.
  - Hàm `tickUnitTurn` xử lý chính xác việc trừ duration, kích hoạt DoT và dọn dẹp hiệu ứng hết hạn.
  - Không gây ra lỗi bất đồng bộ trạng thái giữa người chơi và kẻ địch.
- **Phương pháp kiểm thử**:
  - Unit test kiểm tra thời hạn hiệu ứng qua 3 lượt liên tiếp.
  - Unit test kiểm tra việc cộng dồn và không vượt ngưỡng tối đa (max stacks).

#### 🎯 Milestone 4.2: Hành Vi AI Đối Thủ & Chiến Thuật Kẻ Địch theo Archetype (Enemy Tactical AI)
- **Mục tiêu**: Nâng cấp trí tuệ nhân tạo của kẻ địch từ chọn skill đơn giản sang cây quyết định chiến thuật theo từng chủng loại (Archetype).
- **Phạm vi**:
  - Phân loại 4 Archetype AI:
    1. *Aggressive Archetype (Áp Đảo)*: Luôn nhắm vào sát thương tối đa, kích hoạt bạo kích khi mục tiêu dưới 40% HP.
    2. *Defensive / Vanguard Archetype (Phòng Thủ & Phản Công)*: Bật khiên khi HP < 50%, hồi phục SP và phản kích khi có cơ hội.
    3. *Disruptor Archetype (Quấy Nhiễu & Khống Chế)*: Ưu tiên tung debuff (EMP làm chậm, Acid phá giáp), trì hoãn đòn mạnh của người chơi.
    4. *Adaptive Boss Archetype (Thích Ứng)*: Thay đổi hành vi theo từng ngưỡng HP, tính toán lượt hồi chiêu của người chơi để né tránh hoặc dồn dame.
  - Thuật toán ra quyết định: Đánh giá trọng số theo bối cảnh: `EvaluateAction(targetHP, selfHP, cooldowns, activeBuffs)`.
- **Phụ thuộc**: Milestone 4.1.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Mỗi chủng loại quái vật thực sự biểu hiện phong cách chiến đấu riêng biệt trong nhật ký chiến đấu.
  - AI không bao giờ thực hiện hành động bất hợp pháp (dùng skill khi đang hồi chiêu hoặc không đủ SP).
- **Phương pháp kiểm thử**:
  - Tự động hóa 50 trận mô phỏng AI kiểm tra tỉ lệ ra quyết định hợp lý theo các kịch bản HP khác nhau.

#### 🎯 Milestone 4.3: Cơ Chế Boss Đa Pha & Cảnh Báo Tuyệt Kỹ (Multi-Phase Boss & Telegraphed Attacks)
- **Mục tiêu**: Tạo cảm giác thách thức đỉnh cao cho các trận đánh trùm cuối các Sector (ví dụ: Pháo Đài Bastion Core, Đại Cơ Giáp Titan).
- **Phạm vi**:
  - Cơ chế Boss 2 pha (Phase 1 -> Phase 2 Enrage khi HP < 50%):
    - Pha 1: Phòng thủ vững chắc, triệu hồi drone quấy rối hoặc bắn cầm chừng.
    - Pha 2: Chuyển sang trạng thái Quá Tải Năng Lượng (Overdrive), tăng 30% ATK, tăng 20 SPD, mở khóa tuyệt kỹ tối thượng.
  - Cơ chế cảnh báo đòn đánh tối thượng (Telegraphed Ultimate Ability):
    - Lượt N: Boss kích hoạt trạng thái "Đang Nạp Năng Lượng Pháo Hạt Nhân..." (Hiển thị cảnh báo đỏ trên HUD).
    - Lượt N+1: Xả đòn sát thương hủy diệt nếu người chơi không kịp bật khiên (Emergency Guard / Titan Halo) hoặc khống chế (Stun/EMP).
- **Phụ thuộc**: Milestone 4.1, Milestone 4.2.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Boss chuyển pha mượt mà, cập nhật thông số và hình ảnh/chỉ báo trên HUD.
  - Chỉ báo cảnh báo trước hiển thị rõ ràng trên buồng lái, cho người chơi đúng 1 lượt chuẩn bị đối phó.
- **Phương pháp kiểm thử**:
  - Kiểm thử kịch bản: Boss tụ chiêu -> Người chơi bật khiên -> Sát thương nhận vào giảm đúng tỉ lệ thiết kế.

#### 🎯 Milestone 4.4: Hoàn Thiện Tương Tác Tốc Độ, Lượt Động & Cân Bằng Sát Thương (Dynamic Turn Queue & Combat Formulas)
- **Mục tiêu**: Hoàn thiện công thức tính toán và cập nhật hàng đợi lượt đi động theo thời gian thực khi tốc độ thay đổi.
- **Phạm vi**:
  - Dynamic Turn Queue: Khi có kỹ năng tăng tốc (Speed Buff) hoặc làm chậm (EMP Slow), hàng đợi thứ tự hành động được tính toán lại ngay trong vòng đấu hiện tại.
  - Tinh chỉnh công thức sát thương:
    - Bổ sung chỉ số Xuyên Giáp (Armor Penetration): giảm trừ một phần Defense của đối phương.
    - Cân bằng tỉ lệ Bạo Kích (Critical Chance) và Sát Thương Bạo Kích (Critical Multiplier x1.5 -> x2.0).
    - Chỉ số Né Tránh (Evasion): Tỉ lệ né tránh đòn đánh dựa trên chênh lệch tốc độ giữa hai bên.
  - Rà soát và loại bỏ toàn bộ chuỗi ký tự text cố định trong `engine.ts` (ví dụ: sửa dòng log cố định "Tốc độ Vanguard" thành tên động của Gear đang xuất kích).
- **Phụ thuộc**: Milestone 4.1, Milestone 4.2.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Thứ tự đi trên HUD phản ánh tức thời khi SPD bị biến đổi.
  - Công thức sát thương không bị lỗi chia cho 0, không tạo ra sát thương âm hoặc tràn số.
- **Phương pháp kiểm thử**:
  - Test case: Falcon Gear dùng kỹ năng tăng tốc -> Đẩy lùi lượt đi của kẻ địch trong hàng đợi.

#### 🎯 Milestone 4.5: Cải Thiện Phản Hồi Trực Quan & Buồng Lái Động (Combat Visual Feedback, FX & Cockpit Immersion)
- **Mục tiêu**: Tăng cường cảm giác hưng phấn trong từng đòn đánh thông qua hiệu ứng thị giác và phản hồi giao diện.
- **Phạm vi**:
  - Hiệu ứng rung chấn màn hình (Screen Shake) tinh tế khi nhận đòn nặng hoặc bạo kích.
  - Thanh HP phản ứng mượt (Delayed Trailing Ghost Bar) hiển thị lượng máu vừa mất trước khi tụt về mốc mới.
  - Phù hiệu trạng thái động (Animated Status Badges) hiển thị thời gian còn lại trực tiếp cạnh avatar đơn vị.
  - Màu sắc chữ sát thương nổi (Floating Combat Numbers):
    - Đỏ cam: Sát thương thường.
    - Vàng kim: Bạo kích (Critical Hit) kèm kích thước chữ lớn hơn.
    - Xanh lam: Khiên đỡ giảm thiểu sát thương (Shield Absorbed).
    - Tím: Sát thương DoT (Plasma/Acid).
- **Phụ thuộc**: Milestone 4.1, Milestone 4.4.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Hiệu ứng mượt mà ở 60fps trên trình duyệt, không gây giật lag hoặc rò rỉ bộ nhớ (memory leaks).
  - Có thể tắt hiệu ứng rung chấn trong phần cài đặt nếu người dùng nhạy cảm.
- **Phương pháp kiểm thử**:
  - Kiểm thử tương tác thực tế trên giao diện máy tính và thiết bị di động.

---

### GIAI ĐOẠN 5: TIẾN TRÌNH CƠ GIÁP & CƯỜNG HÓA TRANG BỊ (PHASE 5 — GEAR & EQUIPMENT PROGRESSION)
*Mục tiêu: Đào sâu hệ thống phát triển sức mạnh cá nhân của người chơi, phân hóa rõ rệt lối chơi giữa 3 lớp Cơ Giáp, và xây dựng vòng lặp kinh tế tuần hoàn hợp lý.*

#### 🎯 Milestone 5.1: Hệ Thống Cường Hóa Trang Bị (Equipment Enhancement +1 to +10) `[ĐÃ HOÀN THÀNH]`
- **Mục tiêu**: Cho phép người chơi nâng cấp trang bị trong kho để gia tăng chỉ số vượt bậc.
- **Trạng thái**: **Đã hoàn thành & Đã kiểm chứng (15/15 tests Milestone 5.1 passed, build thành công)**.
- **Phạm vi đã triển khai**:
  - Cấp độ cường hóa từ +1 đến +10 cho cả 3 vị trí (Vũ khí, Khiên chắn, Động cơ).
  - Chi phí cường hóa: Tiêu tốn Credits và nguyên liệu Hợp Kim (Alloy) thu được từ chiến dịch và đấu trường.
  - Cơ chế an toàn (Anti-Frustration):
    - Cấp +1 đến +4: Tỉ lệ thành công 100%.
    - Cấp +5 đến +7: Tỉ lệ thành công giảm dần (80% -> 70% -> 60%). Thất bại giữ nguyên cấp, không bao giờ bị phá hủy hay tụt cấp trang bị.
    - Cấp +8 đến +10: Tỉ lệ thử thách cao (45% -> 35% -> 25%), thất bại bảo toàn cấp độ và trang bị.
  - Hiển thị nhãn cấp độ trực quan: `[+5] Pháo Xung Điện Plasma (Hiếm)` cùng huy hiệu màu sắc tương ứng theo rank (+1..+4 Cyan, +5..+7 Purple, +8..+9 Orange, +10 Gold Tối Thượng).
  - Giao diện Xưởng Cường Hóa (Enhancement Lab Modal) trong Hangar với bảng đo tỉ lệ thành công, so sánh chỉ số trước/sau, kiểm tra tài nguyên và cam kết bảo vệ.
- **Phụ thuộc**: Phase 2 Hangar, `lib/game/progression.ts`.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Chỉ số trang bị cộng thêm được tính toán chính xác vào tổng chỉ số trong buồng lái và `buildPlayerCombatUnit`.
  - Giao diện cường hóa trong Hangar hiển thị tỉ lệ thành công và tài nguyên cần thiết minh bạch.
- **Phương pháp kiểm thử**:
  - Đã kiểm thử tự động toàn diện trong `test-phase5.ts` (15/15 test assertions passed).

#### 🎯 Milestone 5.2: Định Hình Bản Sắc Gameplay Của Từng Lớp Gear (Gear Class Identity & Passives) `[ĐÃ HOÀN THÀNH]`
- **Mục tiêu**: Tạo ra 3 phong cách chơi hoàn toàn khác biệt, khuyến khích người chơi đổi Gear theo từng loại nhiệm vụ.
- **Trạng thái**: **Đã hoàn thành & Đã kiểm chứng (13/13 tests Milestone 5.2 passed, build thành công)**.
- **Phạm vi đã triển khai**:
  - **Vanguard Gear (Tiên Phong Cân Bằng)**:
    - *Nội tại (Passive)*: *Lõi Năng Lượng Ổn Định (Stable Core)*: Hồi thêm +5 SP mỗi lượt (tổng +10 SP/lượt bao gồm +5 tự nhiên). Ở chu kỳ mỗi 3 lượt (lượt 3, 6, 9...), tự động giảm thêm 1 lượt hồi chiêu (CD) cho kỹ năng đang hồi có thời gian chờ dài nhất.
    - *Bản sắc*: Vững vàng trong mọi tình huống, tài nguyên SP dồi dào, chuỗi xoay tua kỹ năng nhanh và bền bỉ trong các trận chiến kéo dài.
  - **Falcon Gear (Tiêm Kích Sát Thủ)**:
    - *Nội tại (Passive)*: *Khí Động Học Mach (Mach Aerodynamics)*: Tỉ lệ né tránh bẩm sinh +15% (Evasion base = 15%), tỉ lệ bạo kích cơ sở nâng lên 25% (Crit DMG 1.75x). Khi đòn đánh gây bạo kích, có 50% tỉ lệ kích hoạt thêm 1 đòn bắn phụ không tốn SP gây thêm sát thương (50% lượng sát thương bạo kích gốc, tối thiểu 25 DMG).
    - *Bản sắc*: Đánh nhanh diệt gọn, mạo hiểm với vỏ giáp mỏng nhưng né đòn cơ động và sát thương bùng nổ liên hoàn.
  - **Aegis Gear (Pháo Đài Bọc Thép)**:
    - *Nội tại (Passive)*: *Giáp Phản Lực Titan (Titan Reactive Armor)*: Khiên gai phản lại 20% sát thương nhận vào thẳng vào kẻ tấn công (tối thiểu 1 DMG). Kháng 50% hiệu ứng làm chậm tốc độ (EMP-slow) và phá giáp (Armor Break). Nếu đòn phản sát thương hạ gục kẻ địch, lập tức phân định Chiến Thắng (Victory).
    - *Bản sắc*: Trâu bò lì lợm, giảm trừ hiệu ứng bất lợi và biến sát thương của kẻ địch thành vũ khí phản kích.
  - **Tương tác Pipeline Combat & Nhật ký Trận đấu**:
    - Nhật ký trận đấu (Combat Log) có nhãn riêng: `[NỘI TẠI VANGUARD ⚡]`, `[NỘI TẠI FALCON ⚡]`, `[NỘI TẠI AEGIS 🛡️]`.
    - Buồng lái Đấu trường và tab Hangar hiển thị thẻ Nội tại với icon, tên, công thức và mô tả chi tiết.
    - Tích hợp **Bảng Điều Khiển Kiểm Thử Nội Tại (Dev Combat Test Controls)** trực tiếp trên giao diện Đấu Trường để thử nghiệm 6 kịch bản (TC-VG-01, TC-FL-01, TC-FL-02, TC-AG-01, TC-AG-02, TC-NON-01) an toàn mà không ảnh hưởng save file.
- **Phụ thuộc**: Milestone 5.1, Milestone 4.4.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Các kỹ năng nội tại được kích hoạt tự động trong combat engine, hiển thị rõ ràng trong log và thông báo nổi.
  - Bảng thông tin Gear trong Hangar và buồng lái làm nổi bật bản sắc và nội tại của từng lớp.
  - Bộ automated test 13/13 trường hợp pass 100%.
- **Phương pháp kiểm thử**:
  - Automated tests tại `tests/passives.test.ts` (13/13 tests PASS).
  - Manual UI Test Harness trực tiếp tại giao diện Đấu trường.

#### 🎯 Milestone 5.3: Hoàn Thiện Cân Bằng Kinh Tế Chợ Quân Sự & Tái Chế (Armory Economy & Recycling) `[ĐÃ HOÀN THÀNH]`
- **Mục tiêu**: Xây dựng vòng lặp kinh tế khép kín (Credits Sink & Source Balance), giải quyết tình trạng tồn đọng trang bị rác trong kho.
- **Trạng thái**: **Đã hoàn thành & Đã kiểm chứng (14/14 tests Milestone 5.3 passed, 13/13 tests Milestone 5.2 regression passed, build thành công)**.
- **Phạm vi đã triển khai**:
  - **Tính năng Tái Chế / Rã Đồ (Salvage)**:
    - Rã trang bị không dùng để thu hồi nguyên liệu Hợp Kim Cường Hóa (Alloy) và Credits.
    - Công thức thu hồi toán học nhất quán:
      * Base Alloy theo Rarity: Common = 2, Rare = 5, Epic = 12, Legendary = 25.
      * Enhancement Alloy Refund: Hoàn trả 60% lượng Alloy đã đầu tư qua cường hóa (+1 đến +10), tối thiểu +2 Alloy mỗi cấp.
      * Credits Refund: 35% giá trị gốc của trang bị + 30% Credits đã đầu tư qua cường hóa.
  - **Khóa An Toàn & Bảo Vệ Dữ Liệu Tuyệt Đối**:
    - Ngăn chặn hoàn toàn việc rã trang bị đang được gắn trên buồng lái (Equipped Protection).
    - Chống nhận tài nguyên trùng lặp (Double-click / Duplicate Salvage Protection): Khi một món đã rã, ID lập tức bị loại bỏ khỏi kho.
    - Tài nguyên Alloy và Credits luôn tăng trưởng dương, không bao giờ bị âm hoặc sai lệch.
  - **Cập nhật kho hàng Chợ Quân Sự Phân Tầng**:
    - Mở khóa theo tiến trình Sector: Tầng Cơ Bản (Mở ngay), Tầng Sector 1 (Ải 1-3), Tầng Sector 2 (Ải 2-3), Tầng Sector 3 (Ải 3-3 Legendary Tối Cực).
    - Khóa các trang bị chưa đạt điều kiện hiển thị rõ lý do: `🔒 Yêu cầu hoàn thành Sector X...`.
    - Tính năng Làm Mới Gian Hàng (Shop Refresh): Ưu tiên sử dụng lượt miễn phí tích lũy từ chiến thắng (`freeShopRefreshes`), hoặc tốn 100 Credits.
  - **Giao diện Người Dùng**:
    - Hộp thoại `SalvageModal` xác nhận rã đồ hiển thị chi tiết số lượng Alloy & Credits thu hồi trước khi xác nhận.
    - Nút `Tái Chế ♻️` tích hợp đồng thời ở cả tab Chợ Quân Sự (`starfront-shop.tsx`) và kho đồ Hangar (`starfront-hangar.tsx`).
    - Nút kiểm thử tức thì `TC-SLV-01` trong Dev Test Controls trên buồng lái.
- **Phụ thuộc**: Milestone 5.1.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Người chơi luôn có động lực tiêu Credits và tích lũy nguyên liệu Alloy để nâng cấp trang bị.
  - Ngăn chặn hoàn toàn việc rã hoặc bán nhầm trang bị đang được gắn trên buồng lái.
  - Bộ automated test 14/14 trường hợp pass 100%.
- **Phương pháp kiểm thử**:
  - Automated tests tại `tests/economy-recycling.test.ts` (14/14 tests PASS).
  - Regression tests tại `tests/passives.test.ts` (13/13 tests PASS).
  - Manual UI Test Cases trực tiếp tại tab Chợ và tab Hangar.

#### 🎯 Milestone 5.4: Bảo Đảm An Toàn Dữ Liệu & Đồng Bộ Lựa Chọn Gear (Storage Schema v3 & State Sync) `[ĐÃ HOÀN THÀNH]`
- **Mục tiêu**: Nâng cấp cấu trúc lưu trữ LocalStorage lên Schema v3 để hỗ trợ cấp cường hóa, bảo toàn dữ liệu và giải quyết triệt để vấn đề đồng bộ khi đổi Gear.
- **Trạng thái**: **Đã hoàn thành & Đã kiểm chứng (8/8 tests Milestone 5.4 passed, 27/27 regression tests passed, build thành công)**.
- **Phạm vi đã triển khai**:
  - **Di chuyển dữ liệu tự động (Migration v1/v2 -> v3)**:
    - Lưu trữ Schema v3 qua khóa `STARFRONT_SAVE_DATA_V3`.
    - Hàm di chuyển thuần `migrateProgressionToV3`:
      * Giữ nguyên 100% cấp độ, EXP, Credits, Alloy, số trận thắng/thua, nhiệm vụ đã hoàn thành.
      * Tự động khởi tạo `alloy = 25`, `freeShopRefreshes = 1` nếu di chuyển từ save v1.
      * Chuẩn hóa toàn bộ trang bị trong kho đồ: Tự động gán `enhancementLevel = 0` cho các trang bị cũ chưa có cấp, bảo toàn cấp cường hóa (+1 đến +10) đã có.
      * Bổ sung đầy đủ trang bị starter nếu kho đồ bị thiếu; kẹp giới hạn an toàn [0..10] cho cấp cường hóa và [1..max] cho cấp độ người chơi.
  - **Đồng bộ hóa trạng thái tức thời (Hardened State Synchronization)**:
    - Khi người chơi đổi sang Vanguard, Falcon hoặc Aegis (trong Hangar hoặc qua Dev Test Controls), buồng lái Đấu trường lập tức cập nhật đầy đủ tên cơ giáp, bảng màu sắc theme, bộ 4 kỹ năng trong Action Deck, chỉ số SPD và né tránh bẩm sinh (Falcon +15% né, 25% crit, Aegis phản đòn 20%).
    - Khi chuyển tab quay lại Đấu trường sau khi trang bị hoặc cường hóa đồ trong Hangar, hàm `handleSwitchTab` tự động phát hiện độ lệch chỉ số và đồng bộ hóa lại `combatState` ngay lập tức.
  - **Công Cụ Kiểm Thử Tức Thì**:
    - Bổ sung `TC-SYNC-01: Chu Kỳ Đổi & Đồng Bộ Gear (5.4)` và `TC-MIG-01: Xác Thực Schema v3 & Migration (5.4)` trên Dev Combat Test Controls.
- **Tiêu chí chấp nhận (Acceptance Criteria)**:
  - `AC-5.4-1`: Tải save file v1 nâng cấp an toàn lên Schema v3, không mất Credits/EXP, bổ sung alloy = 25.
  - `AC-5.4-2`: Tải save file v2 bảo toàn nguyên vẹn cấp cường hóa và activeGearId.
  - `AC-5.4-3`: Đổi Gear giữa Vanguard, Falcon, Aegis cập nhật ngay lập tức buồng lái không cần F5.
  - `AC-5.4-4`: Migration an toàn khi gọi lặp nhiều lần (idempotent), không nhân đôi tài nguyên hay vật phẩm.
- **Test Cases Milestone 5.4**:
  - `TC-P54-01 (Storage Migration v1/v2 -> v3)`: Preconditions: Save v1 hoặc v2 có sẵn. Steps: Gọi `migrateProgressionToV3`. Expected: Schema version = 3, alloy >= 25, item enhancementLevel chuẩn hóa [0..10]. Status: PASS.
  - `TC-P54-02 (State Sync Hangar <-> Arena)`: Preconditions: Đổi activeGearId sang Falcon hoặc Aegis. Steps: Kiểm tra CombatUnit trong arena. Expected: Skills, theme màu, passive và SPD phản ánh chính xác. Status: PASS.
  - `TC-P54-03 (Data Resilience & Bounds)`: Preconditions: Dữ liệu save chứa thuộc tính âm/NaN. Steps: Gọi migration. Expected: Dữ liệu kẹp trong khoảng hợp lệ, không crash. Status: PASS.
- **Phương pháp kiểm thử**:
  - Automated tests tại `tests/storage-sync.test.ts` (8/8 tests PASS).
  - Regression tests tại `tests/passives.test.ts` (13/13 tests PASS) và `tests/economy-recycling.test.ts` (14/14 tests PASS).
  - Manual UI Test Cases trực tiếp tại buồng lái Đấu Trường.

#### 🎯 Milestone 5.5: Hệ Thống Nhiệm Vụ Phân Tầng, Kẻ Địch Biến Thể & Rơi Đồ Trang Bị Ngẫu Nhiên (Mission Scaling, Enemy Variants & Equipment Loot System) `[ĐÃ HOÀN THÀNH]`
- **Mục tiêu**: Xây dựng hệ thống nhiệm vụ có Cấp độ (Quest Level) và Phẩm chất (Quest Quality), tự điều chỉnh độ khó và chỉ số kẻ địch theo từng quest; đồng thời công bố trước toàn bộ phần thưởng (Credits, Alloy và đúng 1 trang bị rơi kèm độ hiếm/chỉ số), tạo ra vòng lặp săn đồ cày cuốc hấp dẫn.
- **Trạng thái**: **Đã hoàn thành & Đã kiểm chứng (13/13 automated tests passed, build thành công)**.
- **Phạm vi triển khai**:
  - **1. Phân Tầng Nhiệm Vụ: Quest Level (1–15) & Quest Quality (5 Bậc)**:
    - *Quest Level*: Quyết định nền tảng sức mạnh quái, level trang bị rơi và quy mô kinh tế (Credits & Alloy).
    - *Quest Quality*: 5 bậc phẩm chất:
      1. `standard` (Tiêu Chuẩn - Xám/Trắng): Hệ số độ khó 1.00x, Hệ số thưởng 1.0x.
      2. `veteran` (Tinh Nhuệ - Lục): Hệ số độ khó 1.15x, Hệ số thưởng 1.25x.
      3. `elite` (Tinh Anh - Lam): Hệ số độ khó 1.30x, Hệ số thưởng 1.55x (Credits) / 1.50x (Alloy).
      4. `heroic` (Anh Hùng - Tím): Hệ số độ khó 1.50x, Hệ số thưởng 1.90x (Credits) / 1.80x (Alloy).
      5. `legendary` (Truyền Thuyết - Cam Vàng): Hệ số độ khó 1.75x, Hệ số thưởng 2.40x (Credits) / 2.20x (Alloy).
  - **2. Bảng Cân Bằng Chi Tiết (Balance Tables & Formulas)**:
    - **A. Quest Level Scaling**:
      * HP Quái: `ScaleHP = 1 + (level - 1) * 0.18` (L1: 1.0x, L5: 1.72x, L10: 2.62x, L15: 3.52x)
      * ATK Quái: `ScaleATK = 1 + (level - 1) * 0.12` (L1: 1.0x, L5: 1.48x, L10: 2.08x, L15: 2.68x)
      * DEF Quái: `ScaleDEF = 1 + (level - 1) * 0.10` (L1: 1.0x, L5: 1.40x, L10: 1.90x, L15: 2.40x)
      * SPD Quái: `ScaleSPD = 1 + (level - 1) * 0.02` (Kẹp tối đa +30 SPD, giới hạn [20..160] để giữ nhịp độ chiến thuật)
      * Base Credits: `Credits(level) = Math.round(150 + level * 120)`
      * Base Alloy: `Alloy(level) = Math.max(1, Math.round(1 + level * 0.8))`
      * Equipment Level: `itemLevel = questLevel`
    - **B. Quest Quality Multipliers & Drop Probabilities**:
      * Bảng trọng số Rarity rơi đồ theo Quality:
        | Quality | Common | Rare | Epic | Legendary |
        |---|---|---|---|---|
        | Standard | 75% | 25% | 0% | 0% |
        | Veteran | 45% | 45% | 10% | 0% |
        | Elite | 20% | 55% | 22% | 3% |
        | Heroic | 5% | 40% | 45% | 10% |
        | Legendary | 0% | 15% | 55% | 30% |
      * Thưởng Credits thực nhận: `Math.round(BaseCredits(level) * qualityCreditsMult)`
      * Thưởng Alloy thực nhận: `Math.max(1, Math.round(BaseAlloy(level) * qualityAlloyMult))`
    - **C. Chủng Loại & Biến Thể Kẻ Địch (Enemy Classes & 9 Variants)**:
      * **Scout Drone (3 Biến thể)**:
        - `recon` (Trinh Sát Do Thám - Mặc định): 1.0x HP, 1.0x ATK, 1.0x DEF, 110 SPD, 15% Né.
        - `interceptor` (Đánh Chặn Siêu Tốc): 0.85x HP, 1.15x ATK, 0.85x DEF, 125 SPD, 25% Né.
        - `jammer` (Nhiễu Sóng Radar ECM): 1.10x HP, 0.90x ATK, 1.15x DEF, 110 SPD, 20% Né, khởi đầu có buff ECM Jamming.
      * **Raider Mech (3 Biến thể)**:
        - `assault` (Đột Kích Tiền Tuyến - Mặc định): 1.0x HP, 1.0x ATK, 1.0x DEF, 78 SPD, 20% Crit.
        - `berserker` (Cuồng Nộ Hỏa Lực): 0.90x HP, 1.25x ATK, 0.80x DEF, 83 SPD, 30% Crit, 1.85x Crit DMG.
        - `heavy` (Thiết Giáp Tiên Phong): 1.30x HP, 0.95x ATK, 1.30x DEF, 70 SPD, 10% Crit.
      * **Siege Walker (3 Biến thể)**:
        - `fortress` (Pháo Đài Công Thành - Mặc định): 1.0x HP, 1.0x ATK, 1.0x DEF, 52 SPD, 20% Xuyên Giáp.
        - `annihilator` (Kẻ Hủy Diệt Hạt Nhân): 0.95x HP, 1.30x ATK, 0.90x DEF, 52 SPD, 35% Xuyên Giáp.
        - `colossus` (Khổng Lồ Bất Hoại): 1.35x HP, 0.90x ATK, 1.35x DEF, 48 SPD, khởi đầu có khiên gia cố Titan.
      * Phối hợp chủng loại theo cấp độ: Cấp 1–3 chỉ xuất hiện Scout Drone và Raider Mech Assault; Tuyệt đối không sinh Siege Walker ở cấp thấp.
    - **D. Thứ Tự Tính Chỉ Số Kẻ Địch**:
      * `FinalStat = Math.round(BaseStat * VariantModifier * LevelStatScale * QualityModifier)`
      * Kẹp chặn biên: HP >= 100, SP >= 20, ATK >= 10, DEF >= 0, SPD [20..160], EVA [0%..85%]. Không xuất hiện NaN hoặc Infinity.
    - **E. Hệ Thống Rơi Đồ Trang Bị (Equipment Loot System)**:
      * Mỗi lần hoàn thành hợp lệ thưởng ĐÚNG 1 trang bị.
      * Rarity: Common (1 affix), Rare (2 affixes), Epic (3 affixes), Legendary (4 affixes).
      * Bể thuộc tính theo ô đồ (Slot Affix Pool):
        - `weapon`: ATK (chính), SPD, SP, HP
        - `shield`: DEF (chính), HP, SP, SPD
        - `engine`: SPD (chính), ATK, SP, HP
      * Giá trị chỉ số ngẫu nhiên theo công thức:
        `BasePower = 1 + (itemLevel - 1) * 0.15`
        `RarityMult = Common: 1.0x | Rare: 1.35x | Epic: 1.75x | Legendary: 2.25x`
      * Trang bị được sinh một lần duy nhất cho mỗi item instance, gắn `level`, `rarity` và stats cố định trong save data.
    - **F. Xem Trước Phần Thưởng (Reward Preview) & Tính Toàn Vẹn**:
      * Danh sách nhiệm vụ công bố trước: Tên/ID, Level quest, Quality badge, Enemy variant & Độ khó, Credits dự kiến, Alloy dự kiến, và đúng 1 trang bị dự kiến (kèm rarity badge, tên và chỉ số preview).
      * Khi accept quest, dữ liệu enemy và loot preview được chốt và lưu giữ ổn định. Reload không thay đổi reward đã công bố.
      * Chống nhận thưởng trùng lặp (Idempotent completion protection).
- **Phụ thuộc**: Milestone 5.1, 5.2, 5.3, 5.4, `lib/game/scaling.ts`, `lib/game/engine.ts`, `lib/game/progression.ts`, `lib/game/types.ts`.
- **Tiêu chí chấp nhận (Definition of Done)**:
  - 100% nhiệm vụ có level, quality và phần thưởng xem trước minh bạch.
  - Hoàn thành nhiệm vụ nhận đúng 1 trang bị, cùng lượng Credits và Alloy khớp 100% với preview.
  - Kẻ địch biến thể thể hiện đúng base stats, variant modifier và level/quality scaling.
  - Toàn bộ trang bị rơi có cấp độ và chỉ số ngẫu nhiên tương thích hoàn hảo với buồng lái, xưởng cường hóa, chợ và rã đồ.
  - Không xuất hiện NaN/Infinity, không rò rỉ dữ liệu, không cấp trùng thưởng khi reload.
- **Bộ Automated Tests Milestone 5.5**:
  - `TC-MIS-01 — Mission Scaling`: Kiểm tra scaling stats của kẻ địch theo nhiều mốc level (L1, L3, L5, L10, L15), kẹp chặn biên hợp lệ.
  - `TC-QUAL-01 — Quest Quality`: Kiểm tra 5 bậc chất lượng (Standard -> Legendary), hệ số thưởng và tỉ lệ rơi đồ.
  - `TC-ENEMY-01 — Enemy Variants`: Kiểm tra 9 biến thể kẻ địch (Recon, Interceptor, Jammer, Assault, Berserker, Heavy, Fortress, Annihilator, Colossus).
  - `TC-LOOT-01 — Equipment Loot`: Hoàn thành quest nhận đúng 1 trang bị mới vào kho đồ.
  - `TC-REWARD-01 — Reward Integrity`: Xác minh Credits/Alloy, chống nhận lặp lại khi gọi hàm hoặc reload kết quả.
  - `TC-PREVIEW-01 — Quest Reward Preview`: Đối chiếu thông tin xem trước trước khi xuất kích với phần thưởng thực nhận sau chiến thắng.
  - `TC-STAT-01 — Equipment Random Stats`: Kiểm tra bể thuộc tính (stat pool) theo Weapon, Shield, Engine và scale theo level.
  - `TC-RARITY-01 — Equipment Rarity`: Kiểm tra số lượng affix và multiplier theo 4 bậc Common/Rare/Epic/Legendary.
  - `TC-INV-01 — Inventory UI & Data`: Kiểm tra hiển thị cấp độ, huy hiệu phẩm chất và chỉ số trang bị trong kho đồ.
  - `TC-SAVE-01 — Save/Load`: Kiểm tra lưu trữ quest đang thực hiện và trang bị mới rơi vào LocalStorage Schema v3.
  - `TC-MIG-01 — Legacy Save`: Kiểm tra nạp save cũ Schema v1/v2/v3 không có quest, dữ liệu được bảo toàn nguyên vẹn.
  - `TC-INT-01 — System Integration`: Kiểm tra trang bị rơi được lắp vào cơ giáp, cường hóa (+1..+10) và rã đồ thu hồi Alloy an toàn.
  - `TC-REG-01 — Regression`: Chạy kiểm thử hồi quy toàn bộ Milestone 5.2, 5.3, 5.4.
- **Kịch bản kiểm thử thủ công (Manual UI Test Scenarios)**:
  - *Scenario 1*: Mở bản đồ chiến dịch, kiểm tra từng ải hiển thị rõ cấp độ, huy hiệu phẩm chất, kẻ địch biến thể và thẻ phần thưởng xem trước.
  - *Scenario 2*: Nhấn "Xuất Kích Ngay", kiểm tra buồng lái tải đúng tên và chỉ số kẻ địch đã scale.
  - *Scenario 3*: Đánh bại kẻ địch, kiểm tra màn hình chiến thắng trao đúng 1 trang bị rơi, Credits và Alloy khớp thẻ preview.
  - *Scenario 4*: Chuyển sang Hangar, kiểm tra trang bị vừa nhận xuất hiện trong kho với cấp độ và chỉ số chính xác, có thể cường hóa hoặc rã đồ.
  - *Scenario 5*: Tải lại trang web (F5), kiểm tra tiến trình, kho đồ và trang bị vẫn giữ nguyên 100%.

---

### GIAI ĐOẠN 6: MỞ RỘNG THẾ GIỚI & CHIẾN TRANH THIÊN HÀ (PHASE 6 — WORLD & WAR EXPANSION)
*Mục tiêu: Mở rộng không gian thế giới STARFRONT, đưa các yếu tố vũ trụ sâu sắc lấy cảm hứng từ ACE Online vào gameplay chơi đơn.*

#### 🎯 Milestone 6.1: Mở Rộng Bản Đồ Thiên Hà & Hệ Thống Phe Phái (Galaxy Sectors & Faction Alignment)
- **Mục tiêu**: Bổ sung các khu vực mới và đưa bối cảnh xung đột phe phái vào tiến trình chiến dịch.
- **Phạm vi**:
  - Mở rộng thêm 2 Sector mới:
    - *Sector 4: Căn Cứ Hạm Đội Bị Bỏ Rơi (Abandoned Fleet Graveyard)* (Cấp đề xuất 12–15).
    - *Sector 5: Vành Đai Sự Kiện Lỗ Đen (Singularity Event Horizon)* (Cấp đề xuất 16–20).
  - 2 Phe phái thiên hà đối lập (lấy cảm hứng từ bối cảnh ACE Online):
    - *Liên Minh Thiên Hà Bygeniou (BCU)*: Chuyên về công nghệ pháo tầm xa và giáp năng lượng.
    - *Quân Đội Độc Lập Arlington (ANI)*: Chuyên về động cơ phản lực siêu tốc và hỏa lực bão hòa.
  - Điểm danh vọng phe phái (Faction Reputation) mở khóa trang bị và danh hiệu riêng.
- **Phụ thuộc**: Toàn bộ Phase 4 & Phase 5.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Bản đồ hiển thị rõ các vùng kiểm soát phe phái và tuyến nhiệm vụ tương ứng.
- **Phương pháp kiểm thử**:
  - Kiểm tra mở khóa Sector 4 khi hoàn thành Sector 3.

#### 🎯 Milestone 6.2: Đại Chiến Mẹ Hạm Không Gian & Sự Kiện Môi Trường (Mothership Raids & Anomalies)
- **Mục tiêu**: Xây dựng trận chiến quy mô lớn với Mẹ Hạm Không Gian (Mothership) và các dị thường môi trường vũ trụ.
- **Phạm vi**:
  - Trận chiến Mẹ Hạm nhiều bộ phận: Người chơi phải lần lượt phá hủy: *Tháp Pháo Phòng Không* ➔ *Hệ Thống Động Cơ Đẩy* ➔ *Lõi Lò Phản Ứng Trung Tâm*.
  - Dị thường môi trường không gian (Environmental Anomalies):
    - *Bão Bức Xạ Mặt Trời (Solar Storm)*: Giảm 20% khả năng hồi SP của cả hai bên.
    - *Trường Điện Từ Tinh Vân (EMP Nebula)*: Giảm 15 SPD toàn chiến trường, tạo lợi thế cho Gear phòng thủ hạng nặng.
- **Phụ thuộc**: Milestone 6.1, Milestone 4.3.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Trận đánh mẹ hạm mang lại trải nghiệm chiến đấu hoành tráng, phân tách mục tiêu rõ rệt.
- **Phương pháp kiểm thử**:
  - Kịch bản test: Phá hủy động cơ làm giảm tốc độ của Mẹ Hạm; phá hủy tháp pháo làm giảm ATK.

#### 🎯 Milestone 6.3: Tích Hợp Chiều Sâu Với Phân Hệ Ace Manager (Base Logistics & Pilot-Gear Linkage)
- **Mục tiêu**: Kết nối mật thiết giữa phân hệ quản lý căn cứ/hạm đội của Ace Manager và buồng lái STARFRONT.
- **Phạm vi**:
  - Căn cứ Ace Manager (Base Panel) sản xuất Hợp Kim và Tinh Thể cung cấp trực tiếp cho Xưởng STARFRONT Hangar để cường hóa trang bị.
  - Phi công Ace Manager (Pilot Panel) được chỉ định lái từng chiếc Gear để mang lại bonus chỉ số cá nhân (ví dụ: Phi công nhanh nhẹn lái Falcon Gear tăng thêm 10% Evasion).
- **Phụ thuộc**: Milestone 6.1, Milestone 5.2.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Không phá vỡ dữ liệu độc lập của Ace Manager; việc liên kết diễn ra mượt mà và trực quan.
- **Phương pháp kiểm thử**:
  - Gán phi công vào Gear -> Kiểm tra chỉ số chiến đấu trong Đấu trường có nhận được bonus tương ứng.

#### 🎯 Milestone 6.4: Nghiên Cứu Đề Xuất Kiến Trúc Đấu Trường Mạng (Multiplayer & Cloud Proposal Only)
- **Mục tiêu**: Đánh giá tính khả thi và lập tài liệu đề xuất kiến trúc cho tính năng nhiều người chơi (Multiplayer).
- **Quy định bắt buộc**:
  - **CHỈ LẬP TÀI LIỆU ĐỀ XUẤT NGHIÊN CỨU (PROPOSAL ONLY) — TUYỆT ĐỐI KHÔNG TỰ TRIỂN KHAI MÃ NGUỒN BACKEND/SERVER**.
- **Nội dung đề xuất**:
  - Đánh giá kiến trúc: Bảng Xếp Hạng Vượt Ải Bất Đồng Bộ (Asynchronous Leaderboards) vs Đấu trường PvP đối kháng thời gian thực (Authoritative WebSocket Game Server).
  - Phân tích chi phí hạ tầng, yêu cầu bảo mật chống gian lận (Anti-Cheat), và giải pháp đồng bộ dữ liệu đám mây.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Tài liệu đề xuất hoàn chỉnh được đính kèm vào báo cáo để chờ quyết định phê duyệt chính thức từ ban quản trị dự án.

---

## 5. Bảng Trạng Thái Tính Năng Tổng Thể (Comprehensive Feature Matrix)

| Phân hệ / Tính năng | Trạng thái | Thuộc Phase | Ghi chú & Đối chiếu mã nguồn thực tế |
|---|---|---|---|
| Đấu trường chiến thuật theo lượt (Speed Initiative) | **Đã hoàn thành (Done)** | Phase 1 | Hoạt động tốt trong `engine.ts` và `combat-arena.tsx`. |
| Bộ 4 kỹ năng cơ bản Vanguard Gear | **Đã hoàn thành (Done)** | Phase 1 | Pulse Strike, Armor Break, Emergency Guard, Basic Shot. |
| 3 Kẻ địch khởi đầu (Scout, Raider, Siege Walker) | **Đã hoàn thành (Done)** | Phase 1 | Dữ liệu đầy đủ trong `data.ts`. |
| AI kẻ địch cơ bản | **Đã hoàn thành (Done)** | Phase 1 | Tự động chọn kỹ năng theo SP/cooldown. |
| Tiến trình Cấp độ, EXP và Credits | **Đã hoàn thành (Done)** | Phase 2 | Công thức tính toán trong `progression.ts`. |
| Xưởng Hangar 3 ô trang bị & So sánh chỉ số | **Đã hoàn thành (Done)** | Phase 2 | Giao diện và logic trong `starfront-hangar.tsx`. |
| Lưu trữ LocalStorage Schema v2 & Migration an toàn | **Đã hoàn thành (Done)** | Phase 2–3 | Xử lý trong `storage.ts`, có xác nhận xóa save. |
| Bản đồ chiến dịch 3 Sector & 9 ải chiến đấu | **Đã hoàn thành (Done)** | Phase 3 | Mở khóa tuần tự, phân tách First/Repeat Clear. |
| 3 Lớp Cơ Giáp (Vanguard, Falcon, Aegis) | **Đã hoàn thành (Done)** | Phase 3 | Mỗi lớp có 4 kỹ năng và chỉ số riêng biệt. |
| Chợ quân sự Armory Shop mua bán trang bị | **Đã hoàn thành (Done)** | Phase 3 | Kiểm tra ngân sách, chống bán đồ đang trang bị. |
| Âm thanh Sci-Fi Web Audio (`audio.ts`) | **Đã hoàn thành (Done)** | Phase 3 | Tổng hợp đa tần số không tệp ngoài, có nút Mute. |
| Bảo toàn các module Ace Manager cũ | **Đã hoàn thành (Done)** | Phase 1–3 | 7 tab Ace Manager giữ nguyên 100% trong `console.tsx`. |
| **Chuẩn hóa hệ thống hiệu ứng trạng thái mở rộng** | **Đã hoàn thành (Done)** | Phase 4 (M4.1) | DoT Plasma Burn/Acid, Stun, Slow, ECM Jamming, quy tắc Stacking (Refresh/Intensity/Override). |
| **Hành vi AI đối thủ theo 4 Archetype** | **Đã hoàn thành (Done)** | Phase 4 (M4.2) | 4 Archetype (Disruptor, Aggressive, Defensive, Adaptive-Boss) với cây quyết định thông minh. |
| **Cơ chế Boss đa pha & Cảnh báo đòn tối thượng** | **Đã hoàn thành (Done)** | Phase 4 (M4.3) | Boss Enrage < 50% HP (Overdrive +30% ATK, +20 SPD), Telegraphed Attack cảnh báo nạp đại pháo hạt nhân. |
| **Dynamic Turn Queue & Cân bằng công thức sát thương** | **Đã hoàn thành (Done)** | Phase 4 (M4.4) | Hàng đợi lượt động cập nhật tức thời khi SPD biến đổi, bổ sung Xuyên Giáp, Bạo Kích và Né Tránh. |
| **Phản hồi trực quan rung chấn màn hình & FX** | **Chưa triển khai (Planned)** | Phase 4 (M4.5) | Screen shake, floating numbers phân biệt màu. |
| **Hệ thống cường hóa trang bị (+1 đến +10)** | **Đã hoàn thành (Done)** | Phase 5 (M5.1) | Nâng cấp bằng Credits + Alloy, bảo toàn cấp trang bị. 15/15 tests PASS. |
| **Kỹ năng nội tại phân hóa bản sắc 3 lớp Gear** | **Đã hoàn thành (Done)** | Phase 5 (M5.2) | Vanguard hồi SP, Falcon né/crit/bắn bồi, Aegis phản đòn/kháng debuff. 13/13 tests PASS. |
| **Vòng lặp kinh tế chợ & Tái chế rã đồ** | **Đã hoàn thành (Done)** | Phase 5 (M5.3) | Rã đồ thừa lấy Hợp kim, chống rã đồ đang đeo, phân tầng chợ theo Sector. 14/14 tests PASS. |
| **Lưu trữ Schema v3 & Đồng bộ trạng thái tức thời** | **Đã hoàn thành (Done)** | Phase 5 (M5.4) | Tự động nâng cấp v1/v2 -> v3, chuẩn hóa [0..10], đồng bộ mượt Hangar <-> Arena. 8/8 tests PASS. |
| **Nhiệm vụ phân tầng, Biến thể quái & Rơi đồ trang bị** | **Đã hoàn thành (Done)** | Phase 5 (M5.5) | Quest Level (1–15), 5 phẩm chất, 9 biến thể quái, rơi đúng 1 trang bị ngẫu nhiên có cấp và thuộc tính, preview phần thưởng cố định. |
| **Mở rộng Sector 4, 5 & Hệ thống phe phái thiên hà** | **Chưa triển khai (Planned)** | Phase 6 (M6.1) | BCU vs ANI, điểm danh vọng phe phái. |
| **Đại chiến Mẹ Hạm không gian & Dị thường môi trường** | **Chưa triển khai (Planned)** | Phase 6 (M6.2) | Boss đa bộ phận, bão bức xạ mặt trời. |
| **Liên kết chiều sâu với phân hệ Ace Manager** | **Chưa triển khai (Planned)** | Phase 6 (M6.3) | Căn cứ cấp nguyên liệu, Phi công lái Gear tăng chỉ số. |
| **Nghiên cứu khả thi đấu trường mạng (Multiplayer)** | **Đề xuất nghiên cứu (Proposal)** | Phase 6 (M6.4) | Báo cáo kiến trúc đề xuất, không tự triển khai server. |

---

## 6. Các Điểm Chưa Xác Minh & Ghi Chú Kỹ Thuật (Needs Verification & Code Notes)

Dựa trên việc kiểm tra trực tiếp mã nguồn thực tế:
1. **Chuỗi văn bản nhật ký khởi tạo trận đấu (`lib/game/engine.ts`)**:
   - Dòng 527 hiện tại vẫn ghi: `[TỐC ĐỘ] Tốc độ Vanguard (${player.speed}) ...`. Khi bắt đầu Phase 4, cần thay thế từ khóa `Vanguard` bằng biến tên động `${player.name}` hoặc `${player.gearType}` để đảm bảo Falcon và Aegis hiển thị đúng tên trên nhật ký ngay từ lượt 1.
2. **Đồng bộ hóa tức thời khi đổi lớp Gear (`components/game/combat-arena.tsx`)**:
   - Khi người chơi chọn Gear mới trong Hangar, buồng lái cần đảm bảo luôn được khởi tạo lại với dữ liệu tiến trình mới nhất mà không bị phụ thuộc vào biến closure cũ khi chuyển tab.
3. **Môi trường kho lưu trữ Git**:
   - Hệ thống container phát triển không có thư mục `.git` cục bộ. Mọi thay đổi mã nguồn được lưu trực tiếp trên workspace của AI Studio và người dùng có thể đồng bộ ra ngoài thông qua giao diện điều khiển của AI Studio.

---

## 7. Khuyến Nghị Milestone Khởi Động Cho Giai Đoạn Tiếp Theo

Để khởi động **Phase 4** một cách an toàn, có kiểm soát và đúng kiến trúc, khuyến nghị thực hiện tuần tự bắt đầu từ:

👉 **Milestone Đề Xuất Đầu Tiên: `Milestone 4.1 — Chuẩn hóa Hệ Thống Hiệu Ứng Trạng Thái Chiến Đấu`**
- **Lý do**: Đây là nền tảng cốt lõi (Core Foundation). Mọi hành vi AI chiến thuật (M4.2), cơ chế Boss (M4.3) và sự thay đổi tốc độ lượt động (M4.4) đều phụ thuộc trực tiếp vào các hiệu ứng trạng thái chuẩn (DoT, Stun, EMP Slow, Acid, Shield Stacking). Triển khai M4.1 trước sẽ tạo nền tảng vững chắc cho toàn bộ Phase 4.
