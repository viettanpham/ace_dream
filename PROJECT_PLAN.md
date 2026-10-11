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
| **Trạng thái hiện tại của dự án?** | Phase 5 hoàn thành 100% (bao gồm Phase 5.12 D3 Post-Mission Results Screen & Combat Efficiency Rating, 102/102 automated tests PASS, build thành công). Phase 6 WORLD đã hoàn tất 100% Tài Liệu Thiết Kế Tổng Thể (`WORLD_DESIGN.md`) và Kế Hoạch Triển Khai (`WORLD_IMPLEMENTATION_PLAN.md`). Mã nguồn gameplay được giữ nguyên vẹn an toàn tuyệt đối. |
| **Vai trò & vị trí của WORLD trong sản phẩm?** | **STARFRONT WORLD** là trung tâm chỉ huy chiến lược vĩ mô của toàn bộ sản phẩm, tích hợp vào thanh điều hướng cao nhất của Shell. WORLD kết nối đồ thị các sector thiên hà, quản lý cuộc chiến giữa Chính phủ VSS và Đế Chế The Void, điều phối lực lượng quân sự, vận tải kinh tế/dân số, và tích hợp với Đấu Trường thông qua khế ước Adapter lũy đẳng. |
| **Phase tiếp theo cần thực hiện?** | Chuẩn bị triển khai mã nguồn tuần tự theo kế hoạch: **Sub-Phase 6.1: Nền Tảng Dữ Liệu, Interfaces & Save Cách Ly (`STARFRONT_WORLD_SAVE_V1`)**. |
| **Tài liệu BẮT BUỘC đọc trước khi thao tác?** | 1. [`WORLD_DESIGN.md`](./WORLD_DESIGN.md) — Đặc tả toàn diện 9 trụ cột A–I của WORLD.<br>2. [`WORLD_IMPLEMENTATION_PLAN.md`](./WORLD_IMPLEMENTATION_PLAN.md) — Kế hoạch phân kỳ 9 sub-phase (6.1–6.9) kèm tiêu chí nghiệm thu.<br>3. [`docs/roadmap/CURRENT_PHASE.md`](./docs/roadmap/CURRENT_PHASE.md) — Tổng kết hiện trạng kỹ thuật. |
| **Phụ thuộc chính giữa WORLD và hệ thống hiện tại?** | - **Combat Integration**: Giao tiếp qua `WorldCombatAdapter`, sử dụng snapshot tại thời điểm khóa trận và Transaction ID chống double-apply.<br>- **Lưu trữ cách ly**: `STARFRONT_WORLD_SAVE_V1` độc lập hoàn toàn với `STARFRONT_SAVE_DATA_V4`, có sao lưu luân phiên A/B.<br>- **Navigation**: Tích hợp tab `world` vào thanh điều hướng cấp cao nhất của `starfront-shell.tsx`. |

*Lưu ý: Không đọc tài liệu lịch sử cũ trừ khi cần đối chiếu tương thích ngược (Backward Compatibility).*

---

## 3. Bản Đồ Tài Liệu Kiến Trúc & Lộ Trình (Documentation Index)

Toàn bộ tài liệu chi tiết được tổ chức module hóa:

### 🌍 Đặc Tả & Kế Hoạch Triển Khai Chiến Lược WORLD (Phase 6 Core Docs)
- **Đặc Tả Thiết Kế WORLD Toàn Diện**: [`WORLD_DESIGN.md`](./WORLD_DESIGN.md) — Tổng quan UI, World Map 5 giai đoạn, Phe VSS vs The Void, Khế ước Combat Adapter lũy đẳng, Save cách ly & Rotating Backup, Mô phỏng Offline & Tick 6-phase, Kinh tế 4 tài nguyên + Lương thực riêng, Vòng đời sự kiện INIT->PROC->RES, Operations Center.
- **Kế Hoạch Triển Khai Tuần Tự WORLD**: [`WORLD_IMPLEMENTATION_PLAN.md`](./WORLD_IMPLEMENTATION_PLAN.md) — 9 Sub-phases chi tiết (6.1 đến 6.9) kèm tiền đề, danh mục file, tiêu chí nghiệm thu (Exit Criteria) và kịch bản test.

### 📍 Lộ Trình Phát Triển (`docs/roadmap/`)
- **Phase Hiện Tại**: [`docs/roadmap/CURRENT_PHASE.md`](./docs/roadmap/CURRENT_PHASE.md) — Hiện trạng Phase 5.12 (Màn hình kết quả sau nhiệm vụ & D3 Combat Efficiency) và bước chuyển tiếp Phase 6.
- **Lịch Sử Đã Hoàn Thành**: [`docs/roadmap/COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) — Tóm tắt gọn Phase 1 đến Phase 5.
- **Lộ Trình Tương Lai**: [`docs/roadmap/FUTURE_PHASES.md`](./docs/roadmap/FUTURE_PHASES.md) — Định hướng mở rộng dài hạn.

### ⚙️ Đặc Tả Hệ Thống Chuyên Sâu (`docs/systems/`)
- **Nhân Vật & Cơ Giáp**: [`docs/systems/CHARACTER_GEAR_SYSTEM.md`](./docs/systems/CHARACTER_GEAR_SYSTEM.md) — Ghép đôi 3 bước, khóa nhiệm vụ, tiến trình 8 phi công.
- **Kỹ Năng & 5 Slot Mô-đun**: [`docs/systems/SKILL_SYSTEM.md`](./docs/systems/SKILL_SYSTEM.md) — 5 Ô kỹ năng, tương thích All-Gear vs Gear-specific.
- **Trang Bị & Kho Đồ**: [`docs/systems/EQUIPMENT_SYSTEM.md`](./docs/systems/EQUIPMENT_SYSTEM.md) — 3 Vị trí trang bị, cường hóa +1..+10, rã đồ Salvage.
- **Cân Bằng & Power Budget**: [`docs/systems/ITEM_BALANCE.md`](./docs/systems/ITEM_BALANCE.md) — Quy đổi Power Tokens (PT), Item Rating.
- **Chiến Đấu & Hiệu Ứng**: [`docs/systems/COMBAT_SYSTEM.md`](./docs/systems/COMBAT_SYSTEM.md) — Sáng kiến tốc độ, công thức sát thương, AI 4 Archetype.
- **Lưu Trữ & Di Chuyển Schema**: [`docs/systems/SAVE_DATA.md`](./docs/systems/SAVE_DATA.md) — Lưu trữ v1 -> v2 -> v3 -> v4.
- **Danh Mục Tổng Thể Hệ Thống**: [`docs/systems/GAME_SYSTEMS.md`](./docs/systems/GAME_SYSTEMS.md) — Phân loại trách nhiệm phân hệ.

### 🎨 Quy Chuẩn Mỹ Thuật & Hình Ảnh (`docs/art-direction/`)
- **Quy Chuẩn Art Direction Toàn Cầu**: [`docs/art-direction/ART_DIRECTION.md`](./docs/art-direction/ART_DIRECTION.md) — Thẩm mỹ Hard Sci-Fi Aerospace, Concept Art Mecha 3D, Chân dung & Toàn thân Pilot anime-realistic.

---

## 4. Ma Trận Trạng Thái Tổng Quát (High-Level Phase Matrix)

| Giai Đoạn | Tên Phân Hệ | Trạng Thái | Tài Liệu Tham Chiếu |
|---|---|---|---|
| **Phase 1** | Nguyên mẫu chiến đấu theo lượt (Vanguard, 3 quái) | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 2** | Tiến trình Cấp độ, EXP, Credits, Hangar 3 slots | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 3** | Bản đồ 3 Sector, 3 Lớp Gear, Chợ quân sự, Âm thanh | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 4** | Hiệu ứng DoT/Stun/Slow, AI 4 Archetype, Boss Enrage | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 5 (5.1–5.6)** | Cường hóa +10, Nội tại Gear, Rã đồ, Nhiệm vụ 1–15 & Biến thể quái | **Đã hoàn thành (Done)** | [`COMPLETED_PHASES.md`](./docs/roadmap/COMPLETED_PHASES.md) |
| **Phase 5.7–5.9** | Khung Kỹ Năng, Ghép Đôi Nhân Vật/Gear, Tuyệt Kỹ Liên Hoàn & Admin CP | **Đã hoàn thành (Done)** | [`CHARACTER_GEAR_SYSTEM.md`](./docs/systems/CHARACTER_GEAR_SYSTEM.md) |
| **Phase 5.11–5.12** | Luồng Mở Khóa Ghép Đôi Linh Hoạt & Màn Hình Kết Quả Tác Chiến D3 | **Đã hoàn thành (Done)** | [`docs/roadmap/CURRENT_PHASE.md`](./docs/roadmap/CURRENT_PHASE.md) |
| **Phase 6.0 (Hiện tại)** | **STARFRONT WORLD — Thiết Kế Tổng Thể & Kế Hoạch Triển Khai Chiến Lược** | **HOÀN TẤT THIẾT KẾ & KẾ HOẠCH (DESIGN DONE)** | [`WORLD_DESIGN.md`](./WORLD_DESIGN.md), [`WORLD_IMPLEMENTATION_PLAN.md`](./WORLD_IMPLEMENTATION_PLAN.md) |
| **Phase 6.1–6.9** | Triển khai mã nguồn WORLD tuần tự (Save cách ly $\rightarrow$ Map $\rightarrow$ Tick $\rightarrow$ Economy $\rightarrow$ Military $\rightarrow$ Combat Adapter $\rightarrow$ Events $\rightarrow$ UI) | **Sẵn sàng triển khai (Planned)** | [`WORLD_IMPLEMENTATION_PLAN.md`](./WORLD_IMPLEMENTATION_PLAN.md) |

---

## 5. Hành Động Tiếp Theo (Next Steps)

Khi có hiệu lệnh chuyển từ giai đoạn Lập Kế Hoạch sang Triển Khai Mã Nguồn Phase 6.1:
1. Đọc kỹ [`WORLD_DESIGN.md`](./WORLD_DESIGN.md) (Mục E) và [`WORLD_IMPLEMENTATION_PLAN.md`](./WORLD_IMPLEMENTATION_PLAN.md) (Phase 6.1).
2. Xây dựng thư mục mới `lib/game/world/` và khai báo các interfaces cốt lõi tại `lib/game/world/types.ts`.
3. Cài đặt hệ thống lưu trữ độc lập `STARFRONT_WORLD_SAVE_V1` với cơ chế sao lưu luân phiên A/B và checksum tại `lib/game/world/storage.ts`.
4. Viết bộ kiểm thử tự động `tests/world/storage-resilience.test.ts` và đảm bảo toàn bộ kiểm thử của dự án tiếp tục PASS 100%.
