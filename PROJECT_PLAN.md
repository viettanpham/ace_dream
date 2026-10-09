# STARFRONT — Kế Hoạch Dự Án (Project Plan)

## 1. Tổng Quan Dự Án & Phạm Vi Thống Nhất (Project Overview & Agreed Scope)
**STARFRONT** là tựa game nhập vai chiến thuật theo lượt 2D (Turn-based RPG) đề tài khoa học viễn tưởng không gian chạy trên trình duyệt web, lấy cảm hứng từ bầu không khí chiến đấu cơ giáp (Gear) kinh điển của *ACE Online*.
- **Phong cách & Nội dung**: 100% tài sản sáng tạo độc lập (Original IP) — thiết kế Gear, quái vật, kỹ năng, nhiệm vụ và giao diện không sao chép asset gốc của ACE Online.
- **Đối tượng & Nền tảng**: Trải nghiệm chơi đơn (single-player), ưu tiên trình duyệt desktop trước, tối ưu hóa giao diện di động (responsive) ở giai đoạn kế tiếp.
- **Ngôn ngữ hiển thị**: Toàn bộ văn bản giao diện người chơi (in-game UI/text) bằng tiếng Việt. Mã nguồn, tên biến, comment kỹ thuật sử dụng tiếng Anh chuẩn.

---

## 2. Công Nghệ & Kiến Trúc Kỹ Thuật (Tech Stack & Architecture)
- **Nền tảng chính**: React 19, TypeScript, Next.js (App Router) hoặc Vite React SPA, Tailwind CSS, Lucide Icons.
- **Phân tách module kiến trúc**:
  - `components/ui/` & `components/game/`: Component giao diện, HUD buồng lái sci-fi, hiệu ứng chiến trận.
  - `lib/game/engine.ts`: Bộ luật chiến đấu thuần (Pure logic engine) — tính toán lượt đi theo tốc độ, sát thương theo chỉ số Công/Thủ, giảm trừ sát thương, hiệu ứng trạng thái (buff/debuff), AI kẻ địch.
  - `lib/game/data.ts`: Dữ liệu tĩnh về Gear (Vanguard), kỹ năng (Skills), chủng loại kẻ địch (Scout Drone, Raider Mech, Siege Walker), trạng thái hiệu ứng.
  - `lib/game/types.ts`: Định nghĩa TypeScript types/interfaces chặt chẽ cho GameState, Combatant, Action, Turn, LogEvent.
  - `lib/game/store.tsx`: State management cho vòng lặp trận đấu (HP, SP, cooldown, nhật ký chiến trận, thắng/thua).
  - *Save/Progression system*: Sẽ tích hợp LocalStorage ở phase tiếp theo.

---

## 3. Các Giai Đoạn Phát Triển Theo Thứ Tự Ưu Tiên (Development Phases)

### Giai đoạn 1: Nguyên mẫu chiến đấu theo lượt (Phase 1 — Prototype Combat) *(Ưu tiên hiện tại)*
- **Cơ giáp người chơi**: 1 Gear khởi đầu — **Vanguard**.
- **Kỹ năng chiến đấu (3 skills)**:
  1. *Pulse Strike* (Xung Kích Quang): Gây sát thương năng lượng trực tiếp.
  2. *Armor Break* (Phá Giáp Cơ Khí): Gây sát thương và giảm giáp mục tiêu tạm thời.
  3. *Emergency Guard* (Lá Chắn Khẩn Cấp): Giảm sát thương nhận vào trong lượt tiếp theo.
- **Kẻ địch (3 chủng loại)**:
  1. *Scout Drone* (Drone Trinh Sát - Tốc độ cao, máu mỏng).
  2. *Raider Mech* (Cơ Giáp Đột Kích - Cân bằng, sát thương ổn định).
  3. *Siege Walker* (Pháo Đài Công Thành - Boss máu dày, giáp cao, hỏa lực mạnh).
- **Hệ thống chiến đấu cốt lõi**:
  - Thứ tự hành động tính toán dựa theo Tốc độ (Speed).
  - Quản lý chỉ số: HP (Độ bền vỏ), SP (Năng lượng lõi), Attack, Defense.
  - Tiêu hao SP và thời gian hồi chiêu (Cooldown) cho từng kỹ năng.
  - AI kẻ địch tự động đưa ra quyết định dựa theo tình huống.
  - Trạng thái thắng (Victory), thất bại (Defeat), khởi động lại trận đánh (Restart).
  - Giao diện Sci-Fi HUD hiện đại: Thanh trạng thái, bảng mục tiêu, bảng kỹ năng, nhật ký chiến đấu (Combat Log) chi tiết bằng tiếng Việt.

### Giai đoạn 2: Tiến trình & Trang bị (Phase 2 — Progression & Loadout)
- Hệ thống Cấp độ (Level), Điểm kinh nghiệm (EXP), Điểm tín dụng (Credits).
- Kho trang bị (Vũ khí chính, Tên lửa phụ, Giáp chắn, Động cơ đẩy).
- Hệ thống nâng cấp Gear và quản lý chỉ số.
- Lưu trữ trạng thái game tự động qua trình duyệt (LocalStorage).

### Giai đoạn 3: Bản đồ khu vực & Chiến dịch (Phase 3 — Missions & Galaxy Map)
- Lựa chọn bản đồ nhiệm vụ (Sector Map) và chuỗi ải chiến đấu: 3 Sector (Vành Đai Asteroid, Tinh Vân Plasma, Bastion Core), 9 ải với độ khó tăng dần, chuỗi mở khóa nhiệm vụ, phân tách thưởng Lần Đầu (First Clear) và thưởng Lặp Lại (Repeat Clear).
- Thêm các lớp Gear mới: 3 lớp Cơ Giáp hoàn chỉnh:
  - **Vanguard Gear**: Cân bằng hỏa lực, giáp và tốc độ (Balanced Striker).
  - **Falcon Gear**: Tiêm kích tốc độ cực cao (125 SPD, luôn ra đòn trước mục tiêu), né tránh và bão hòa hỏa lực (Speed Infiltrator).
  - **Aegis Gear**: Pháo đài bọc thép titan hạng nặng (1800 HP, 120 DEF), pháo hạt nhân hủy diệt và lá chắn tuyệt đối (Heavy Siege Fortress).
- Chợ quân sự không gian (Armory Shop): Mua và bán vật phẩm/trang bị bằng Credits, kiểm tra ràng buộc không bán đồ đang trang bị, ngăn mua đồ khi thiếu Credits.
- Bổ sung hiệu ứng âm thanh Web Audio Sci-Fi: Tia laser, xung chấn va chạm (Impact), khiên từ trường (Shield), chiến thắng oanh liệt (Victory), thăng cấp (Level Up), âm thanh bấm nút kèm chế độ Bật/Tắt âm thanh (Mute/Unmute).
- Nâng cấp lưu trữ dữ liệu sang Schema v2 (`STARFRONT_SAVE_DATA_V2`) với cơ chế di chuyển dữ liệu (Migration) tự động và an toàn 100% từ v1.

---

## 4. Trạng Thái Tính Năng Thực Tế (Feature Status Matrix)
| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Tài liệu kiến trúc `PROJECT_PLAN.md` & `README.md` | Hoàn thành (Done) | Đã cập nhật đầy đủ Phase 1, Phase 2 và Phase 3 bằng tiếng Việt |
| Kiểm tra đồng bộ GitHub | Đã xác nhận (Verified) | Báo cáo chi tiết giới hạn môi trường Git container |
| Thiết kế Model & Type hệ thống (`types.ts`) | Hoàn thành (Done) | Đầy đủ types CombatUnit, Skill, StarfrontItem, StarfrontProgression, CampaignSector, CampaignMission, ArmoryShopItem |
| Logic tính toán chiến đấu (`engine.ts`) | Hoàn thành (Done) | Lượt theo Speed, sát thương Công/Thủ, giảm giáp, lá chắn, AI kẻ địch |
| Dữ liệu Vanguard, Falcon, Aegis & 3 kẻ địch (`data.ts`) | Hoàn thành (Done) | 3 Lớp Gear với 4 kỹ năng riêng biệt mỗi lớp + Scout Drone, Raider Mech, Siege Walker Boss + 3 Sector 9 ải chiến dịch + Chợ quân sự |
| Giao diện Đấu trường Combat Arena (`combat-arena.tsx`) | Hoàn thành (Done) | Đấu trường chiến thuật tương tác, radar feed, thanh điều hướng 4 phân hệ con (Đấu trường, Chiến dịch, Hangar, Chợ), nút tắt/bật âm thanh |
| Tiến trình nhân vật & Cấp độ (`progression.ts`) | Hoàn thành (Done) | Level 1+, EXP scaling (level * 100), Credits, công thức tăng chỉ số khi lên cấp, trao thưởng ải chiến dịch, mua/bán đồ chợ quân sự |
| Kho đồ & Hệ thống trang bị (`starfront-hangar.tsx`) | Hoàn thành (Done) | 3 Slots (Vũ khí, Khiên, Động cơ), đổi lớp Gear (Vanguard, Falcon, Aegis), xem trước so sánh chỉ số, trang bị/tháo đồ ảnh hưởng trực tiếp đến combat |
| Bản đồ chiến dịch vũ trụ (`campaign-map.tsx`) | Hoàn thành (Done) | 3 Sector, 9 ải, theo dõi tiến độ hoàn thành, kiểm tra điều kiện mở khóa, xuất kích trực tiếp vào trận đấu |
| Chợ quân sự không gian (`starfront-shop.tsx`) | Hoàn thành (Done) | Mua sắm trang bị hiếm/sử thi, bán vật phẩm thừa trong kho, kiểm tra tài chính Credits tức thời |
| Hiệu ứng âm thanh Sci-Fi Web Audio (`audio.ts`) | Hoàn thành (Done) | Tạo âm thanh tổng hợp đa tần số qua Web Audio API, không phụ thuộc file ngoài, có toggle bật/tắt |
| Lưu và tải game (`storage.ts`) | Hoàn thành (Done) | Tự động lưu LocalStorage Schema v2, tự động di chuyển dữ liệu từ v1 không mất tiến trình, nút Reset Save có hộp thoại xác nhận |

---

## 5. Danh Mục File Quan Trọng & Phân Công Nhiệm Vụ (Important Files)
- `PROJECT_PLAN.md`: Kế hoạch tổng thể và nhật ký tiến độ dự án (tài liệu này).
- `README.md`: Giới thiệu dự án, hướng dẫn vận hành và kiểm thử.
- `lib/game/types.ts`: Cấu trúc dữ liệu về Gear, Chỉ số, Kỹ năng, Kẻ địch, Vật phẩm, Tiến trình nhân vật, Chiến dịch, Chợ.
- `lib/game/data.ts`: Thông số 3 Lớp Gear (Vanguard, Falcon, Aegis), 3 kẻ địch, 3 Sector (9 ải chiến dịch) và danh mục Chợ quân sự.
- `lib/game/engine.ts`: Bộ máy quy tắc chiến thuật theo lượt (Speed Initiative, sát thương, AI kẻ địch).
- `lib/game/audio.ts`: Hệ thống âm thanh tương tác Web Audio API (Laser, Impact, Shield, Victory, Level Up).
- `lib/game/progression.ts`: Logic tiến trình Level, công thức EXP, tính toán chỉ số theo lớp Gear, phần thưởng thắng trận và ải chiến dịch, mua/bán chợ.
- `lib/game/storage.ts`: Hệ thống lưu và nạp LocalStorage chuẩn hóa Schema v2 với migration v1 -> v2 an toàn chống crash.
- `components/game/combat-arena.tsx`: Đấu trường chiến thuật Phase 1-3 tích hợp tiến trình, nạp chỉ số thực tế, tích hợp chiến dịch, hangar và chợ.
- `components/game/campaign-map.tsx`: Giao diện bản đồ chiến dịch 3 Sector vũ trụ và 9 tuyến ải nhiệm vụ.
- `components/game/starfront-hangar.tsx`: Xưởng trang bị, chuyển đổi 3 lớp cơ giáp và kho đồ Vanguard/Falcon/Aegis.
- `components/game/starfront-shop.tsx`: Giao diện Chợ quân sự mua bán trang bị bằng Credits.
- `components/game/console.tsx`: Màn hình điều khiển tích hợp tab STARFRONT (P1-3) làm trung tâm trải nghiệm, bảo toàn các phân hệ Ace Manager.
- `test-phase3.ts`: Script kiểm thử tự động toàn diện 37 test cases cho toàn bộ logic Phase 3.
- `next.config.mjs`: Cấu hình dev origins cho phép preview cross-origin của AI Studio hoạt động trơn tru.

---

## 6. Vấn Đề Đã Biết & Trạng Thái Kiểm Thử (Known Issues & Verification)
- **Kiểm thử biên dịch**: Đã chạy `compile_applet` thành công 100% (`Build succeeded - the applet is compiled`).
- **Kiểm thử tự động logic Phase 3 (`test-phase3.ts`)**: Đã chạy qua `npx tsx test-phase3.ts` và đạt **37/37 bài kiểm thử (100% PASS)**:
  1. *3 Lớp Cơ Giáp*: Khởi tạo và tính toán chỉ số chuẩn xác cho Vanguard (HP 1250, SPD 85), Falcon (SPD 125, ATK 165), Aegis (HP 1800, DEF 120).
  2. *Quyền ưu tiên lượt đi (Initiative)*: Falcon (125 SPD) đi trước Scout Drone (110 SPD); Vanguard (85 SPD) đi sau Scout Drone.
  3. *Kỹ năng đặc trưng*: Falcon và Aegis mỗi lớp sở hữu 4 kỹ năng chiến đấu độc quyền.
  4. *Chiến dịch 3 Sector & 9 Ải*: Cơ chế mở khóa tuyến tính hoạt động đúng (ải 1-1 mở sẵn, ải 1-2 cần ải 1-1, ải 1-3 cần ải 1-2).
  5. *Phần thưởng chiến dịch*: Trao thưởng lần đầu (First Clear) và thưởng lặp lại (Repeat Clear) chính xác EXP, Credits và trang bị thưởng.
  6. *Chợ quân sự (Armory Shop)*: Mua hàng trừ tiền và thêm vào kho đồ, chặn mua khi thiếu Credits; bán đồ cộng Credits và xóa khỏi kho, chặn bán đồ đang trang bị.
  7. *Lưu trữ & Migration v1 -> v2*: Dữ liệu v1 cũ được nạp và chuyển đổi mượt mà sang Schema v2, bảo toàn toàn bộ Level, EXP, Credits, kho đồ và trang bị.
- **Sửa lỗi tương tác lượt chiến đấu (Turn Loop & AI Timer)**:
  - Đã khắc phục triệt để lỗi hủy timer của AI lượt địch, người chơi tự động nhận lượt khi kẻ địch đánh xong hoặc có thể bấm "BẤM ĐỂ ĐI NGAY ⚡".
- **Môi trường Git**: Không có Git repository khởi tạo cục bộ trong container AI Studio (`fatal: not a git repository`). Mọi thay đổi tập tin được lưu trực tiếp vào workspace và được quản lý đồng bộ qua giao diện AI Studio. Cần đồng bộ thủ công trên giao diện nếu kết nối với repo GitHub bên ngoài.

---

## 7. Tác Vụ Khả Thi Tiếp Theo (Next Recommended Task)
- **Chuẩn bị sang Giai đoạn 4 (Phase 4)**:
  - Hệ thống tinh chỉnh chỉ số trang bị (Enhancement / Crafting).
  - Chế độ Đấu trường Sinh tồn / Vô tận (Endless Survival Wave).
  - Tích hợp thêm các phi công đặc nhiệm và liên kết hạm đội Ace Manager.

---

## 8. Hướng Dẫn Bàn Giao (Handoff Instructions for AI Assistants)
- Luôn đọc `PROJECT_PLAN.md` trước khi thực hiện bất kỳ chỉnh sửa nào.
- Phase 1, Phase 2 và Phase 3 đã hoàn thành trọn vẹn: Đấu trường chiến thuật theo lượt, 3 lớp Gear (Vanguard, Falcon, Aegis), 3 kẻ địch, tiến trình Level/EXP/Credits, kho đồ trang bị 3 slots, bản đồ chiến dịch 3 Sector 9 ải, Chợ quân sự, âm thanh Sci-Fi Web Audio và hệ thống lưu LocalStorage Schema v2.
- Giữ nguyên cấu trúc code sạch, không thêm thư viện thừa, duy trì sự tương thích của runtime AI Studio.

