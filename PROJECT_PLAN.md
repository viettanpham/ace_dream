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
| Tài liệu kiến trúc `PROJECT_PLAN.md` & `README.md` | Hoàn thành (Done) | Tạo tại gốc dự án bằng tiếng Việt |
| Kiểm tra đồng bộ GitHub | Hoàn thành (Verified) | Đã xác thực giới hạn môi trường Git cục bộ |
| Thiết kế Model & Type hệ thống (`types.ts`) | Đang chờ duyệt Phase 1 | Sẽ triển khai sau khi người dùng phê duyệt |
| Logic tính toán chiến đấu (`engine.ts`) | Đang chờ duyệt Phase 1 | Logic thuần, độc lập với UI |
| Dữ liệu Gear Vanguard & 3 quái vật (`data.ts`) | Đang chờ duyệt Phase 1 | Cân bằng chỉ số bước đầu |
| Giao diện Sci-Fi HUD & Combat Log | Đang chờ duyệt Phase 1 | Giao diện tiếng Việt 100% |
| Hệ thống trang bị, cấp độ, nhiệm vụ | Dự kiến (Phase 2+) | Chưa thực hiện |

---

## 5. Danh Mục File Quan Trọng & Phân Công Nhiệm Vụ (Important Files)
- `PROJECT_PLAN.md`: Kế hoạch tổng thể và nhật ký tiến độ dự án (tài liệu này).
- `README.md`: Giới thiệu dự án, hướng dẫn vận hành và kiểm thử.
- `app/page.tsx` hoặc `src/App.tsx`: Điểm vào ứng dụng hiển thị buồng lái chiến đấu STARFRONT.
- `lib/game/types.ts`: Cấu trúc dữ liệu về Gear, Chỉ số, Kỹ năng, Kẻ địch, Lượt đi.
- `lib/game/data.ts`: Thông số Gear Vanguard, 3 kỹ năng khởi đầu và 3 chủng loại quái.
- `lib/game/engine.ts`: Bộ máy quy tắc chiến thuật theo lượt (Combat Loop).
- `components/game/hud-bar.tsx`: Thanh trạng thái buồng lái (HP/SP, thanh lượt).
- `components/game/battle-modal.tsx` / `components/game/war-room.tsx`: Khu vực chiến trường và thao tác kỹ năng.
- `components/game/console.tsx`: Màn hình hiển thị nhật ký radar & chiến thuật.

---

## 6. Vấn Đề Đã Biết & Trạng Thái Kiểm Thử (Known Issues & Verification)
- **Môi trường Git**: Không có Git repository khởi tạo cục bộ trong container AI Studio Build (`fatal: not a git repository`), do đó việc push lệnh git trực tiếp từ terminal bị giới hạn; các thay đổi tập tin được lưu trực tiếp vào workspace và được quản lý qua giao diện AI Studio.
- **Kiểm thử biên dịch**: Sẽ tiến hành chạy quy trình build và lint ngay khi hoàn tất mã nguồn Phase 1.

---

## 7. Tác Vụ Khả Thi Tiếp Theo (Next Single Actionable Task)
- **Chờ người dùng xác nhận và phê duyệt kế hoạch**.
- Ngay sau khi được phê duyệt: Bắt đầu triển khai **Giai đoạn 1 (Phase 1)** gồm cấu trúc types, engine chiến thuật, dữ liệu Vanguard + 3 quái vật, cùng giao diện buồng lái chiến đấu tiếng Việt hoàn chỉnh.

---

## 8. Hướng Dẫn Bàn Giao (Handoff Instructions for AI Assistants)
- Luôn đọc `PROJECT_PLAN.md` trước khi thực hiện bất kỳ chỉnh sửa nào.
- Tuân thủ nguyên tắc: Giao tiếp với người dùng và văn bản in-game bằng tiếng Việt; code, tên biến và comment kỹ thuật bằng tiếng Anh.
- Thực hiện từng giai đoạn nhỏ, kiểm tra build trước khi bàn giao.
- Cập nhật tài liệu này sau khi hoàn thành mỗi giai đoạn.
