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
- Lựa chọn bản đồ nhiệm vụ (Sector Map) và chuỗi ải chiến đấu.
- Thêm các lớp Gear mới (ví dụ: Infiltrator chuyên tốc độ/né đòn, Siege Gear chuyên pháo tầm xa).
- Bổ sung hiệu ứng âm thanh web audio sci-fi và hiệu ứng chuyển động tương tác.

---

## 4. Trạng Thái Tính Năng Thực Tế (Feature Status Matrix)
| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Tài liệu kiến trúc `PROJECT_PLAN.md` & `README.md` | Hoàn thành (Done) | Đã tạo và lưu tại thư mục gốc bằng tiếng Việt |
| Kiểm tra đồng bộ GitHub | Đã xác nhận (Verified) | Báo cáo chi tiết giới hạn môi trường Git container |
| Thiết kế Model & Type hệ thống (`types.ts`) | Hoàn thành (Done) | Đầy đủ types CombatUnit, Skill, StarfrontItem, StarfrontProgression |
| Logic tính toán chiến đấu (`engine.ts`) | Hoàn thành (Done) | Lượt theo Speed, sát thương Công/Thủ, giảm giáp, lá chắn, AI kẻ địch |
| Dữ liệu Vanguard & 3 kẻ địch (`data.ts`) | Hoàn thành (Done) | Vanguard Gear + 3 kỹ năng + Scout Drone, Raider Mech, Siege Walker Boss |
| Giao diện Đấu trường Combat Arena (`combat-arena.tsx`) | Hoàn thành (Done) | Đấu trường chiến thuật tương tác, radar feed, 100% tiếng Việt |
| Tiến trình nhân vật & Cấp độ (`progression.ts`) | Hoàn thành (Done) | Level 1+, EXP scaling (level * 100), Credits, công thức tăng chỉ số khi lên cấp |
| Kho đồ & Hệ thống trang bị (`starfront-hangar.tsx`) | Hoàn thành (Done) | 3 Slots (Vũ khí, Khiên, Động cơ), 10 món mẫu 4 độ hiếm, xem trước so sánh chỉ số, trang bị/tháo đồ ảnh hưởng trực tiếp đến combat |
| Lưu và tải game (`storage.ts`) | Hoàn thành (Done) | Tự động lưu LocalStorage (`STARFRONT_SAVE_DATA_V1`), nạp lại an toàn khi reload, nút Reset Save có hộp thoại xác nhận |
| Chuỗi nhiệm vụ chiến dịch & Gear mới | Dự kiến (Phase 3) | Kế hoạch triển khai ở giai đoạn tiếp theo |

---

## 5. Danh Mục File Quan Trọng & Phân Công Nhiệm Vụ (Important Files)
- `PROJECT_PLAN.md`: Kế hoạch tổng thể và nhật ký tiến độ dự án (tài liệu này).
- `README.md`: Giới thiệu dự án, hướng dẫn vận hành và kiểm thử.
- `lib/game/types.ts`: Cấu trúc dữ liệu về Gear, Chỉ số, Kỹ năng, Kẻ địch, Vật phẩm, Tiến trình nhân vật.
- `lib/game/data.ts`: Thông số Vanguard Gear, 3 kỹ năng khởi đầu và 3 chủng loại quái vật.
- `lib/game/engine.ts`: Bộ máy quy tắc chiến thuật theo lượt (Speed Initiative, sát thương, AI kẻ địch).
- `lib/game/progression.ts`: Logic tiến trình Level, công thức EXP, phần thưởng thắng trận, danh mục vật phẩm mẫu.
- `lib/game/storage.ts`: Hệ thống lưu và nạp LocalStorage chuẩn hóa an toàn chống crash.
- `components/game/combat-arena.tsx`: Đấu trường chiến thuật Phase 1 tích hợp tiến trình Phase 2 (nạp chỉ số thực tế, trao thưởng và modal thăng cấp).
- `components/game/starfront-hangar.tsx`: Xưởng trang bị và kho đồ Vanguard với so sánh chỉ số trực quan.
- `components/game/console.tsx`: Màn hình điều khiển tích hợp tab STARFRONT (P1-2) làm trung tâm trải nghiệm.
- `next.config.mjs`: Cấu hình dev origins cho phép preview cross-origin của AI Studio hoạt động trơn tru.

---

## 6. Vấn Đề Đã Biết & Trạng Thái Kiểm Thử (Known Issues & Verification)
- **Kiểm thử biên dịch**: Đã chạy `compile_applet` thành công 100% (`Build succeeded - the applet is compiled`).
- **Kiểm thử đơn vị logic Phase 2**: Đã chạy script kiểm tra tự động:
  1. Thắng trận: EXP và Credits tăng đúng một lần (Scout Drone: +60 EXP, +150 Credits).
  2. Thua trận: Không nhận thưởng chiến thắng.
  3. Lên cấp: Đủ 100 EXP lên Cấp 2, chỉ số gốc tăng chính xác (HP +80, SP +10, ATK +12, DEF +6, SPD +2).
  4. Trang bị vũ khí: Chỉ số ATK thay đổi ngay lập tức (ví dụ: gắn Pháo Ray Điện Từ Hyper tăng +58 ATK), nạp vào Combat Unit chính xác.
  5. Tháo trang bị: Chỉ số phục hồi về giá trị gốc.
  6. Lưu & khôi phục LocalStorage: Dữ liệu được lưu tự động và khôi phục nguyên vẹn khi tải lại trang; xử lý an toàn fallback nếu dữ liệu lỗi.
  7. Nút Reset Save: Có dialog xác nhận trước khi xóa dữ liệu.
- **Môi trường Git**: Không có Git repository khởi tạo cục bộ trong container AI Studio (`fatal: not a git repository`). Mọi thay đổi tập tin được lưu trực tiếp vào workspace và được quản lý đồng bộ qua giao diện AI Studio. Cần đồng bộ thủ công trên giao diện nếu kết nối với repo GitHub bên ngoài.

---

## 7. Tác Vụ Khả Thi Tiếp Theo (Next Recommended Task)
- **Chuẩn bị sang Giai đoạn 3 (Phase 3)**:
  - Bản đồ chiến dịch (Mission / Sector Campaign Map) với các tuyến ải độ khó tăng dần.
  - Lớp Gear mới: Infiltrator (chuyên cơ động/né tránh) hoặc Siege Gear (chuyên hỏa lực diện rộng).
  - Cửa hàng trang bị vũ trụ và hiệu ứng âm thanh web audio sci-fi.

---

## 8. Hướng Dẫn Bàn Giao (Handoff Instructions for AI Assistants)
- Luôn đọc `PROJECT_PLAN.md` trước khi thực hiện bất kỳ chỉnh sửa nào.
- Phase 1 và Phase 2 đã hoàn thành trọn vẹn: Đấu trường chiến thuật theo lượt Vanguard, 3 kỹ năng, 3 kẻ địch, tiến trình Level/EXP/Credits, kho đồ trang bị 3 slots, và hệ thống lưu LocalStorage.
- Giữ nguyên cấu trúc code sạch, không thêm thư viện thừa, duy trì sự tương thích của runtime AI Studio.

