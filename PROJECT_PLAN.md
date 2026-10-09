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

#### 🎯 Milestone 5.1: Hệ Thống Cường Hóa Trang Bị (Equipment Enhancement +1 to +10)
- **Mục tiêu**: Cho phép người chơi nâng cấp trang bị trong kho để gia tăng chỉ số vượt bậc.
- **Phạm vi**:
  - Cấp độ cường hóa từ +1 đến +10 cho cả 3 vị trí (Vũ khí, Khiên chắn, Động cơ).
  - Chi phí cường hóa: Tiêu tốn Credits và nguyên liệu Hợp Kim (Alloy) thu được từ chiến dịch.
  - Cơ chế an toàn (Anti-Frustration):
    - Cấp +1 đến +4: Tỉ lệ thành công 100%.
    - Cấp +5 đến +7: Tỉ lệ thành công giảm dần (80% -> 60%). Thất bại giữ nguyên cấp, không bao giờ bị phá hủy trang bị.
    - Cấp +8 đến +10: Cần đá bảo vệ hoặc tiêu tốn lượng Credits lớn để thăng hạng tối thượng.
  - Hiển thị nhãn cấp độ trực quan: `[+5] Pháo Xung Điện Plasma (Hiếm)`.
- **Phụ thuộc**: Phase 2 Hangar, `lib/game/progression.ts`.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Chỉ số trang bị cộng thêm được tính toán chính xác vào tổng chỉ số trong buồng lái.
  - Giao diện cường hóa trong Hangar hiển thị tỉ lệ thành công và tài nguyên cần thiết minh bạch.
- **Phương pháp kiểm thử**:
  - Unit test tính toán chỉ số trang bị ở từng mốc từ +0 đến +10.

#### 🎯 Milestone 5.2: Định Hình Bản Sắc Gameplay Của Từng Lớp Gear (Gear Class Identity & Passives)
- **Mục tiêu**: Tạo ra 3 phong cách chơi hoàn toàn khác biệt, khuyến khích người chơi đổi Gear theo từng loại nhiệm vụ.
- **Phạm vi**:
  - **Vanguard Gear (Tiên Phong Cân Bằng)**:
    - *Nội tại (Passive)*: *Lõi Năng Lượng Ổn Định* — Hồi thêm 5 SP mỗi lượt, giảm 1 lượt hồi chiêu cho kỹ năng bất kỳ sau mỗi 3 lượt.
    - *Bản sắc*: Vững vàng trong mọi tình huống, thích hợp với các trận chiến kéo dài.
  - **Falcon Gear (Tiêm Kích Sát Thủ)**:
    - *Nội tại (Passive)*: *Khí Động Học Mach* — Tỉ lệ né tránh bẩm sinh +15%, đòn đánh bạo kích có 50% tỉ lệ kích hoạt thêm 1 đòn bắn phụ không tốn SP.
    - *Bản sắc*: Đánh nhanh diệt gọn, mạo hiểm với chỉ số giáp mỏng nhưng sát thương bùng nổ.
  - **Aegis Gear (Pháo Đài Bọc Thép)**:
    - *Nội tại (Passive)*: *Giáp Phản Lực Titan* — Khiên gai phản lại 20% sát thương nhận vào cho kẻ tấn công, kháng 50% hiệu ứng làm chậm và phá giáp.
    - *Bản sắc*: Trâu bò lì lợm, càng bị đánh càng tích tụ nộ năng lượng để xả Đại Bác Hạt Nhân.
- **Phụ thuộc**: Milestone 5.1, Milestone 4.4.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Các kỹ năng nội tại được kích hoạt tự động và có ghi chú rõ ràng trong nhật ký trận đấu.
  - Bảng thông tin Gear trong Hangar làm nổi bật bản sắc và nội tại của từng lớp.
- **Phương pháp kiểm thử**:
  - Unit test kiểm tra kích hoạt nội tại phản đòn của Aegis và hồi SP của Vanguard.

#### 🎯 Milestone 5.3: Hoàn Thiện Cân Bằng Kinh Tế Chợ Quân Sự & Tái Chế (Armory Economy & Recycling)
- **Mục tiêu**: Xây dựng vòng lặp kinh tế khép kín (Credits Sink & Source Balance), giải quyết tình trạng tồn đọng trang bị rác trong kho.
- **Phạm vi**:
  - Tính năng Tái Chế / Rã Đồ (Salvage): Rã trang bị không dùng để thu lại Hợp Kim Cường Hóa (Alloy) và một phần Credits.
  - Cập nhật kho hàng Chợ Quân Sự:
    - Bổ sung vật phẩm theo tiến trình: Hoàn thành Sector 1 mở hàng Rare, Sector 2 mở hàng Epic, Sector 3 mở hàng Legendary.
    - Hệ thống làm mới gian hàng (Shop Refresh) có giới hạn theo lượt chiến thắng.
- **Phụ thuộc**: Milestone 5.1.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Người chơi luôn có động lực tiêu Credits và tích lũy nguyên liệu để nâng cấp trang bị.
  - Ngăn chặn hoàn toàn việc rã hoặc bán nhầm trang bị đang được gắn trên buồng lái.
- **Phương pháp kiểm thử**:
  - Test case: Rã trang bị nhận đủ nguyên liệu; cố tình rã đồ đang trang bị bị hệ thống từ chối an toàn.

#### 🎯 Milestone 5.4: Bảo Đảm An Toàn Dữ Liệu & Đồng Bộ Lựa Chọn Gear (Storage Schema v3 & State Sync)
- **Mục tiêu**: Nâng cấp cấu trúc lưu trữ LocalStorage lên Schema v3 để hỗ trợ cấp cường hóa, và giải quyết triệt để vấn đề đồng bộ khi đổi Gear.
- **Phạm vi**:
  - Di chuyển dữ liệu tự động (Migration v2 -> v3): Giữ nguyên 100% cấp độ, EXP, Credits, vật phẩm hiện có; tự động gán `enhancementLevel: 0` cho các trang bị cũ.
  - Đồng bộ hóa trạng thái tức thời (Hardened State Synchronization):
    - Đảm bảo khi người chơi đổi sang Falcon hoặc Aegis trong tab Hangar, buồng lái Đấu trường lập tức cập nhật đầy đủ tên, màu sắc theme, bộ 4 kỹ năng và chỉ số SPD tương ứng mà không bị gián đoạn hay lưu giữ trạng thái cũ.
- **Phụ thuộc**: Milestone 5.1, Milestone 5.2.
- **Tiêu chí hoàn thành (Definition of Done)**:
  - Dữ liệu người chơi từ các phiên bản trước tải lên mượt mà không lỗi.
  - Chuyển đổi giữa Hangar và Đấu trường hoạt động trơn tru 100%.
- **Phương pháp kiểm thử**:
  - Unit test kiểm tra hàm migration v2 -> v3 với các mẫu save data cũ.

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
| **Chuẩn hóa hệ thống hiệu ứng trạng thái mở rộng** | **Chưa triển khai (Planned)** | Phase 4 (M4.1) | Dự kiến bổ sung DoT, Stun, Slow, ECM, Shield Stacking. |
| **Hành vi AI đối thủ theo 4 Archetype** | **Chưa triển khai (Planned)** | Phase 4 (M4.2) | Cây quyết định theo ngữ cảnh và phong cách quái. |
| **Cơ chế Boss đa pha & Cảnh báo đòn tối thượng** | **Chưa triển khai (Planned)** | Phase 4 (M4.3) | Boss Enrage < 50% HP, cảnh báo tụ chiêu trước 1 lượt. |
| **Dynamic Turn Queue & Cân bằng công thức sát thương** | **Chưa triển khai (Planned)** | Phase 4 (M4.4) | Tính toán lại lượt động khi SPD thay đổi. |
| **Phản hồi trực quan rung chấn màn hình & FX** | **Chưa triển khai (Planned)** | Phase 4 (M4.5) | Screen shake, floating numbers phân biệt màu. |
| **Hệ thống cường hóa trang bị (+1 đến +10)** | **Chưa triển khai (Planned)** | Phase 5 (M5.1) | Nâng cấp bằng Credits + Alloy, chống vỡ trang bị. |
| **Kỹ năng nội tại phân hóa bản sắc 3 lớp Gear** | **Chưa triển khai (Planned)** | Phase 5 (M5.2) | Vanguard hồi SP, Falcon né/crit, Aegis phản đòn. |
| **Vòng lặp kinh tế chợ & Tái chế rã đồ** | **Chưa triển khai (Planned)** | Phase 5 (M5.3) | Rã đồ thừa lấy Hợp kim, cân bằng chi tiêu Credits. |
| **Lưu trữ Schema v3 & Đồng bộ trạng thái tức thời** | **Chưa triển khai (Planned)** | Phase 5 (M5.4) | Nâng cấp an toàn schema, đồng bộ mượt Hangar <-> Arena. |
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
