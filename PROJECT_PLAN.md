# STARFRONT — Kế Hoạch Dự Án & Bản Đồ Lộ Trình (Project Roadmap Hub)

---

## 1. Tổng Quan Dự Án & Phạm Vi Cốt Lõi (Project Overview)

**STARFRONT** là tựa game nhập vai chiến thuật theo lượt 2D (Turn-based RPG) đề tài khoa học viễn tưởng không gian, lấy cảm hứng từ bầu không khí cơ giáp chiến đấu của *ACE Online*.
- **Bản quyền & Phong cách**: 100% nội dung sáng tạo độc lập (Original IP).
- **Nền tảng**: Single-player Web SPA trên nền Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Ngôn ngữ hiển thị**: Toàn bộ giao diện tương tác, cốt truyện và kỹ năng sử dụng **Tiếng Việt**. Tên mã nguồn, biến, comment kỹ thuật sử dụng **Tiếng Anh chuẩn**.
- **Kế thừa an toàn**: Bảo tồn nguyên vẹn các phân hệ Ace Manager cũ (Fleet, Base, War Room, Pilot) song hành cùng STARFRONT.

---

## 2. Bản Đồ Tài Liệu Kiến Trúc & Lộ Trình (Documentation Index)

Nhằm tối ưu hóa hiệu năng ngữ cảnh và tổ chức mã nguồn tinh gọn, tài liệu dự án được phân tách theo cấu trúc chuẩn:

### 📍 Lộ Trình Phát Triển (Roadmap)
- **Giai đoạn hiện tại (Current Phase)**: [`docs/roadmap/CURRENT_PHASE.md`](./docs/roadmap/CURRENT_PHASE.md)
  *Phạm vi, luồng giao diện 3 bước, tiêu chí chấp nhận và rủi ro của **Phase 5.8: Hệ Thống Ghép Đôi Nhân Vật & Cơ Giáp**.*
- **Các giai đoạn đã hoàn thành (Completed Phases)**: [`docs/roadmap/COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md)
  *Tóm tắt kết quả Phase 1 (Chiến đấu nguyên mẫu), Phase 2 (Tiến trình & Hangar), Phase 3 (Chiến dịch & Chợ), Phase 4 (Độ sâu chiến thuật M4.1–M4.4), Phase 5 (Cường hóa, Nội tại, Rã đồ, Nhiệm vụ M5.1–M5.6).*
- **Các giai đoạn tương lai (Future Phases)**: [`docs/roadmap/FUTURE_PHASES.md`](./docs/roadmap/FUTURE_PHASES.md)
  *Hoàn thiện Mô-đun kỹ năng rời Phase 5.7, Specter Gear, và Phase 6 (Phe phái thiên hà BCU vs ANI, Trận chiến Mẹ Hạm, Đề xuất Multiplayer).*

### ⚙️ Tài Liệu Thiết Kế Hệ Thống Chi Tiết (System Architecture)
- **Hệ thống Nhân vật & Cơ giáp**: [`docs/systems/CHARACTER_GEAR_SYSTEM.md`](./docs/systems/CHARACTER_GEAR_SYSTEM.md)
  *Quy trình ghép đôi 3 bước, cơ chế khóa 5 trận/nhiệm vụ, tiến trình độc lập phi công (+5 điểm/cấp), và phân rã chỉ số.*
- **Hệ thống Kỹ năng & Mô-đun (5 Slots)**: [`docs/SKILL_SYSTEM.md`](./docs/SKILL_SYSTEM.md)
  *5 Ô kỹ năng, quy tắc tương thích All-Gear vs Gear-specific, và nâng cấp Slot phi cơ (+2 SP/cấp).*
- **Hệ thống Trang bị & Cường hóa**: [`docs/EQUIPMENT_SYSTEM.md`](./docs/EQUIPMENT_SYSTEM.md)
  *3 Vị trí trang bị, cấp cường hóa +1..+10, và cơ chế Tái chế rã đồ (Salvage).*
- **Cân bằng Trang bị & Power Budget**: [`docs/ITEM_BALANCE.md`](./docs/ITEM_BALANCE.md)
  *Hệ thống quy đổi Power Tokens (PT), công thức Rating và định giá thương mại.*
- **Hệ thống Chiến đấu & Hiệu ứng**: [`docs/COMBAT_SYSTEM.md`](./docs/COMBAT_SYSTEM.md)
  *Vòng lặp sáng kiến tốc độ, công thức sát thương, 3 cơ chế cộng dồn hiệu ứng, và 4 Archetype AI.*
- **Lưu trữ & Di chuyển Dữ liệu**: [`docs/SAVE_DATA.md`](./docs/SAVE_DATA.md)
  *Quy tắc di chuyển an toàn LocalStorage Schema v1 -> v2 -> v3 -> v4.*
- **Danh mục Phân hệ Toàn Dự Án**: [`docs/GAME_SYSTEMS.md`](./docs/GAME_SYSTEMS.md)
  *Phân loại trách nhiệm giữa buồng lái STARFRONT và phân hệ Ace Manager.*

---

## 3. Trạng Thái Tổng Quát Các Giai Đoạn (High-Level Phase Matrix)

| Giai Đoạn | Tên Phân Hệ | Trạng Thái | Tài Liệu Tham Chiếu |
|---|---|---|---|
| **Phase 1** | Nguyên mẫu chiến đấu theo lượt (Vanguard, 3 quái) | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 2** | Tiến trình Cấp độ, EXP, Credits, Hangar 3 slots | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 3** | Bản đồ 3 Sector, 3 Lớp Gear, Chợ quân sự, Âm thanh | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 4** | Hiệu ứng trạng thái DoT/Stun/Slow, AI 4 Archetype, Boss Enrage | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 5 (5.1–5.6)** | Cường hóa +10, Nội tại Gear, Rã đồ, Nhiệm vụ 1–15 & Biến thể quái | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 5.7** | Khung giao diện 5 Slot Kỹ Năng & Điểm SP Phi Thuyền | **Khung UI Đã Xong (UI Shell Done)** | [`SKILL_SYSTEM.md`](./docs/SKILL_SYSTEM.md) |
| **Phase 5.8** | **Ghép Đôi Nhân Vật & Cơ Giáp (3 Bước, Khóa 5 Trận, +5 Điểm)** | **ĐANG LẬP KẾ HOẠCH (PLANNING)** | [`CURRENT_PHASE.md`](./docs/roadmap/CURRENT_PHASE.md) |
| **Phase 6.1–6.4** | Mở rộng Thế giới, Phe phái BCU/ANI, Đại chiến Mẹ Hạm | **Lộ trình tương lai (Planned)** | [`FUTURE_PHASES.md`](./docs/roadmap/FUTURE_PHASES.md) |

---

## 4. Hành Động Tiếp Theo (Next Steps)

Sau khi phê duyệt kế hoạch kiến trúc Phase 5.8 trong [`CURRENT_PHASE.md`](./docs/roadmap/CURRENT_PHASE.md) và [`CHARACTER_GEAR_SYSTEM.md`](./docs/systems/CHARACTER_GEAR_SYSTEM.md):
1. Tiến hành triển khai Step 1 (Mở rộng kiểu dữ liệu & Save Schema v4 trong `types.ts` và `storage.ts`).
2. Tích hợp điểm thuộc tính phi công vào công thức tính chỉ số chiến đấu (`calculateTotalGearStats`).
3. Triển khai component giao diện `character-gear-select.tsx` với luồng liên kết 3 bước và cơ chế khóa 5 nhiệm vụ / trận thắng.
