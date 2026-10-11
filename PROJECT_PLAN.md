# STARFRONT — Kế Hoạch Dự Án & Bản Đồ Lộ Trình (Project Roadmap Hub)

---

## 1. Tổng Quan Dự Án & Mục Tiêu Cốt Lõi (Project Overview)

**STARFRONT** là tựa game nhập vai chiến thuật theo lượt 2D (Turn-based RPG) đề tài khoa học viễn tưởng không gian, lấy cảm hứng từ bầu không khí cơ giáp chiến đấu của *ACE Online*.
- **Bản quyền & Phong cách**: 100% nội dung sáng tạo độc lập (Original IP).
- **Nền tảng**: Single-player Web SPA trên nền Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Ngôn ngữ hiển thị**: Toàn bộ giao diện tương tác, cốt truyện và kỹ năng sử dụng **Tiếng Việt**. Tên mã nguồn, biến, comment kỹ thuật sử dụng **Tiếng Anh chuẩn**.
- **Kế thừa an toàn**: Bảo tồn nguyên vẹn các phân hệ Ace Manager cũ (Fleet, Base, War Room, Pilot) song hành cùng STARFRONT.

---

## 2. Hướng Dẫn Nhanh Dành Cho Kỹ Sư AI (AI Agent Quick Context)

Khi nhận tác vụ mới, AI **chỉ cần đọc bảng tóm tắt này** mà không cần đọc lại chi tiết toàn bộ các phase cũ:

| Câu hỏi xác định | Câu trả lời & Chỉ dẫn thao tác |
|---|---|
| **Trạng thái hiện tại của dự án?** | Phase 5.9: Hoàn thành 100% logic gameplay, Tuyệt Kỹ Liên Hoàn Phi Công, Reroll, Admin CP và Lưu trữ Schema v4 (93/93 tests PASS). Asset ảnh Mecha và Fullbody chất lượng cao ở trạng thái PENDING do quota AI Studio 429 (đang dùng fallback SVG). |
| **Phase tiếp theo cần thực hiện?** | Bổ sung asset ảnh Mecha/Fullbody khi có quota; chuyển tiếp sang **Phase 6.0**: Specter Gear & Phân hệ Chiến tranh Mẹ hạm. |
| **Tài liệu BẮT BUỘC đọc trước khi sửa code?** | 1. [`docs/roadmap/CURRENT_PHASE.md`](./docs/roadmap/CURRENT_PHASE.md)<br>2. [`docs/systems/CHARACTER_GEAR_SYSTEM.md`](./docs/systems/CHARACTER_GEAR_SYSTEM.md)<br>3. [`docs/systems/SKILL_SYSTEM.md`](./docs/systems/SKILL_SYSTEM.md) |
| **Các hệ thống liên quan trực tiếp?** | - `lib/game/pilot-skill-types.ts` & `pilot-skill-engine.ts`: Tuyệt kỹ liên hoàn, template, progression, reroll.<br>- `lib/game/types.ts` & `lib/game/storage.ts`: Save Schema v4 & migration.<br>- `lib/game/progression.ts` & `engine.ts`: Tính toán chỉ số, thực chiến, phản đòn, sát thương.<br>- `components/game/character-gear-select.tsx` & `pilot-skill-view.tsx`: Giao diện buồng lái, sub-tab kỹ năng phi công.<br>- `components/game/admin-cp-modal.tsx`: Bảng điều khiển quản trị toàn cục. |

*Lưu ý: Không đọc tài liệu lịch sử cũ trừ khi cần đối chiếu tương thích ngược (Backward Compatibility).*

---

## 3. Bản Đồ Tài Liệu Kiến Trúc & Lộ Trình (Documentation Index)

Toàn bộ tài liệu chi tiết được tổ chức module hóa trong thư mục `docs/`:

### 📍 Lộ Trình Phát Triển (`docs/roadmap/`)
- **Phase Hiện Tại**: [`docs/roadmap/CURRENT_PHASE.md`](./docs/roadmap/CURRENT_PHASE.md) — Kế hoạch Phase 5.8 (Luồng 3 bước, Khóa 5 trận/nhiệm vụ, Điểm thuộc tính phi công).
- **Lịch Sử Đã Hoàn Thành**: [`docs/roadmap/COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) — Tóm tắt gọn Phase 1, Phase 2, Phase 3, Phase 4 (M4.1–M4.4), Phase 5 (M5.1–M5.6) và kiểm định Phase 5.7.
- **Lộ Trình Tương Lai**: [`docs/roadmap/FUTURE_PHASES.md`](./docs/roadmap/FUTURE_PHASES.md) — Kế hoạch hoàn thiện Mô-đun kỹ năng rời Phase 5.7, Specter Gear, và Phase 6 (Phe phái thiên hà, Trận chiến Mẹ Hạm, Nghiên cứu Multiplayer).

### ⚙️ Đặc Tả Hệ Thống Chuyên Sâu (`docs/systems/`)
- **Nhân Vật & Cơ Giáp**: [`docs/systems/CHARACTER_GEAR_SYSTEM.md`](./docs/systems/CHARACTER_GEAR_SYSTEM.md) — Quy trình ghép đôi 3 bước, cơ chế khóa 5 trận, tiến trình độc lập phi công (+5 điểm/cấp), và phân rã chỉ số.
- **Kỹ Năng & 5 Slot Mô-đun**: [`docs/systems/SKILL_SYSTEM.md`](./docs/systems/SKILL_SYSTEM.md) — 5 Ô kỹ năng, tương thích All-Gear vs Gear-specific, và nâng cấp Slot phi cơ (+2 SP/cấp).
- **Trang Bị & Kho Đồ**: [`docs/systems/EQUIPMENT_SYSTEM.md`](./docs/systems/EQUIPMENT_SYSTEM.md) — 3 Vị trí trang bị, cấp cường hóa +1..+10, và cơ chế Tái chế rã đồ (Salvage).
- **Cân Bằng & Power Budget**: [`docs/systems/ITEM_BALANCE.md`](./docs/systems/ITEM_BALANCE.md) — Quy đổi Power Tokens (PT), công thức Item Rating và định giá thương mại.
- **Chiến Đấu & Hiệu Ứng**: [`docs/systems/COMBAT_SYSTEM.md`](./docs/systems/COMBAT_SYSTEM.md) — Sáng kiến tốc độ, công thức sát thương, 11 hiệu ứng trạng thái, và 4 Archetype AI.
- **Lưu Trữ & Di Chuyển Schema**: [`docs/systems/SAVE_DATA.md`](./docs/systems/SAVE_DATA.md) — Quy tắc bảo toàn dữ liệu và di chuyển an toàn Schema v1 ➔ v2 ➔ v3 ➔ v4.
- **Danh Mục Tổng Thể Hệ Thống**: [`docs/systems/GAME_SYSTEMS.md`](./docs/systems/GAME_SYSTEMS.md) — Phân loại trách nhiệm giữa buồng lái STARFRONT và phân hệ Ace Manager.

---

## 4. Ma Trận Trạng Thái Tổng Quát (High-Level Phase Matrix)

| Giai Đoạn | Tên Phân Hệ | Trạng Thái | Tài Liệu Tham Chiếu |
|---|---|---|---|
| **Phase 1** | Nguyên mẫu chiến đấu theo lượt (Vanguard, 3 quái) | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 2** | Tiến trình Cấp độ, EXP, Credits, Hangar 3 slots | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 3** | Bản đồ 3 Sector, 3 Lớp Gear, Chợ quân sự, Âm thanh | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 4** | Hiệu ứng trạng thái DoT/Stun/Slow, AI 4 Archetype, Boss Enrage | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 5 (5.1–5.6)** | Cường hóa +10, Nội tại Gear, Rã đồ, Nhiệm vụ 1–15 & Biến thể quái | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 5.7** | Khung giao diện 5 Slot Kỹ Năng & Điểm SP Phi Thuyền | **Khung UI Đã Xong (UI Shell Done)** | [`SKILL_SYSTEM.md`](./docs/systems/SKILL_SYSTEM.md) |
| **Phase 5.8** | **Ghép Đôi Nhân Vật & Cơ Giáp (3 Bước, Khóa 5 Trận, +5 Điểm)** | **ĐÃ HOÀN THÀNH (DONE)** | [`CHARACTER_GEAR_SYSTEM.md`](./docs/systems/CHARACTER_GEAR_SYSTEM.md) |
| **Phase 6.1–6.4** | Mở rộng Thế giới, Phe phái BCU/ANI, Đại chiến Mẹ Hạm | **Lộ trình tương lai (Planned)** | [`FUTURE_PHASES.md`](./docs/roadmap/FUTURE_PHASES.md) |

---

## 5. Hành Động Tiếp Theo (Next Steps)

Khi có hiệu lệnh chuyển từ Lập Kế Hoạch sang Triển Khai mã nguồn Phase 5.8:
1. Đọc kỹ [`docs/roadmap/CURRENT_PHASE.md`](./docs/roadmap/CURRENT_PHASE.md) và [`docs/systems/CHARACTER_GEAR_SYSTEM.md`](./docs/systems/CHARACTER_GEAR_SYSTEM.md).
2. Mở rộng TypeScript interfaces và viết hàm `migrateProgressionToV4` trong `lib/game/types.ts` và `lib/game/storage.ts`.
3. Mở rộng hàm `calculateTotalGearStats` trong `lib/game/progression.ts` tích hợp chỉ số phi công.
4. Xây dựng component giao diện `components/game/character-gear-select.tsx` và gắn vào `starfront-shell.tsx`.
