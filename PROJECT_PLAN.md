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
| Thiết kế Model & Type hệ thống (`types.ts`) | Hoàn thành (Done) | Đã bổ sung CombatUnit, Skill, StatusEffect, CombatState, CombatLogItem |
| Logic tính toán chiến đấu (`engine.ts`) | Hoàn thành (Done) | Đã xây dựng engine: lượt theo Speed, sát thương Công/Thủ, giảm giáp, lá chắn từ trường, AI kẻ địch |
| Dữ liệu Vanguard & 3 kẻ địch (`data.ts`) | Hoàn thành (Done) | Vanguard Gear + 3 kỹ năng (Pulse Strike, Armor Break, Emergency Guard) + Scout Drone, Raider Mech, Siege Walker Boss |
| Giao diện Đấu trường Sci-Fi Combat Arena (`combat-arena.tsx`) | Hoàn thành (Done) | Đấu trường chiến thuật theo lượt chơi được 100%, thanh HP/SP, timeline tốc độ, radar feed, 100% tiếng Việt |
| Hệ thống trang bị, cấp độ, tiến trình | Dự kiến (Phase 2) | Kế hoạch triển khai ở giai đoạn tiếp theo |

---

## 5. Danh Mục File Quan Trọng & Phân Công Nhiệm Vụ (Important Files)
- `PROJECT_PLAN.md`: Kế hoạch tổng thể và nhật ký tiến độ dự án (tài liệu này).
- `README.md`: Giới thiệu dự án, hướng dẫn vận hành và kiểm thử.
- `lib/game/types.ts`: Cấu trúc dữ liệu về Gear, Chỉ số, Kỹ năng, Kẻ địch, Status Effect, Lượt đi.
- `lib/game/data.ts`: Thông số Vanguard Gear, 3 kỹ năng khởi đầu và 3 chủng loại quái vật.
- `lib/game/engine.ts`: Bộ máy quy tắc chiến thuật theo lượt (Speed Initiative, sát thương, AI kẻ địch).
- `components/game/combat-arena.tsx`: Giao diện đấu trường chiến thuật Phase 1 tương tác trực tiếp.
- `components/game/console.tsx`: Màn hình điều khiển tích hợp tab Đấu trường (P1) làm trung tâm trải nghiệm.
- `app/layout.tsx`: Giao diện nền tảng sci-fi với font Orbitron, Rajdhani và metadata STARFRONT.

---

## 6. Vấn Đề Đã Biết & Trạng Thái Kiểm Thử (Known Issues & Verification)
- **Kiểm thử biên dịch**: Đã chạy `compile_applet` thành công 100% (`Build succeeded - the applet is compiled`).
- **Sửa lỗi tương tác click (Đã giải quyết triệt để)**:
  - *Nguyên nhân cốt lõi*: Next.js 16 ở chế độ dev mặc định chặn tài nguyên dev (`403 Forbidden`) đối với các domain cross-origin từ preview runner Cloud Run của AI Studio (`ais-dev-*.run.app` / `ais-pre-*.run.app`). Điều này khiến trình duyệt tải được HTML tĩnh từ SSR nhưng bị chặn toàn bộ các file JavaScript chunks (`/_next/static/chunks/*.js`), dẫn đến việc React không thể hydrate và toàn bộ event listeners (`onClick`) trên nút bấm không được gán vào DOM.
  - *Giải pháp triển khai*:
    1. Cấu hình `allowedDevOrigins: ['**.run.app', 'ais-dev-*.run.app', 'ais-pre-*.run.app', 'localhost:3000']` trong `next.config.mjs`.
    2. Chuẩn hóa `components/ui/button.tsx` sang Client Component chuẩn React 19 với native `<button>` để loại bỏ phụ thuộc phức tạp của Base UI.
    3. Chuẩn hóa timestamp nhật ký chiến trận thành dạng thời gian tương đối (`00:01`, `00:04`) để triệt tiêu hoàn toàn lỗi chênh lệch múi giờ gây Hydration Mismatch.
  - *Kết quả kiểm chứng*: Các JavaScript bundle đã trả về `200 OK` (thay vì `403 Forbidden`). Nút "Kết thúc ngày" cũng như các nút kỹ năng, đổi mục tiêu, tái đấu đã nhận click và thay đổi state trực tiếp trên preview.
- **Môi trường Git**: Không có Git repository khởi tạo cục bộ trong container AI Studio (`fatal: not a git repository`). Mọi thay đổi tập tin được lưu trực tiếp vào workspace và được quản lý đồng bộ qua giao diện AI Studio. Cần đồng bộ thủ công trên giao diện nếu kết nối với repo GitHub bên ngoài.

---

## 7. Tác Vụ Khả Thi Tiếp Theo (Next Recommended Task)
- **Chuẩn bị sang Giai đoạn 2 (Phase 2)**:
  - Hệ thống Cấp độ (Level) và Điểm kinh nghiệm (EXP) sau mỗi trận thắng.
  - Phần thưởng Điểm tín dụng (Credits) và Kho trang bị nâng cấp (Vũ khí, Động cơ, Khiên chắn).
  - Tích hợp lưu trữ dữ liệu chiến đấu vào LocalStorage để giữ lại tiến trình chơi.

---

## 8. Hướng Dẫn Bàn Giao (Handoff Instructions for AI Assistants)
- Luôn đọc `PROJECT_PLAN.md` trước khi thực hiện bất kỳ chỉnh sửa nào.
- Phase 1 đã hoàn thành đầy đủ: Đấu trường chiến thuật theo lượt với Vanguard Gear, 3 kỹ năng, 3 kẻ địch, AI tự động, và giao diện Sci-Fi tiếng Việt.
- Giữ nguyên cấu trúc code sạch, không thêm thư viện thừa, duy trì sự tương thích của runtime AI Studio.

