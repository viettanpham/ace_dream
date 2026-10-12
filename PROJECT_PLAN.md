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
| **Trạng thái hiện tại của dự án?** | **Phase 6.19: Events & Missions Decision Matrix đã hoàn thành 100%** (100% tests PASS, build thành công, 30/30 test suites PASS tuyệt đối). `events-missions-board.tsx` đã được tái cấu trúc thành Ma trận Ra quyết định 2 Cột (Decision Matrix): Cột trái là Hàng đợi khẩn cấp (Urgency Queue) sắp xếp theo deadline và mức độ nghiêm trọng với cuộn độc lập; Cột phải là Bảng phân tích & phê chuẩn chiến lược (Decision Panel) đối chiếu phương án, tỷ lệ thành công, chi phí thực, score minh bạch, làm rõ nguồn phê chuẩn và ngăn chặn double-commit. |
| **Vai trò & vị trí của WORLD trong sản phẩm?** | **STARFRONT WORLD** là trung tâm chỉ huy chiến lược vĩ mô tối cao của toàn bộ sản phẩm, tích hợp ở vị trí nổi bật nhất tại Khối 1 Shell. WORLD kết nối đồ thị các sector thiên hà, quản lý cuộc chiến giữa Chính phủ VSS và Đế Chế The Void, điều phối lực lượng quân sự, vận tải kinh tế/dân số, và tích hợp với Đấu Trường thông qua khế ước Adapter lũy đẳng. |
| **Phase tiếp theo cần thực hiện?** | Sẵn sàng bước sang Phase 6.20 theo lộ trình kiểm toán giao diện `WORLD_UI_UX_AUDIT.md` khi có yêu cầu. |
| **Tài liệu BẮT BUỘC đọc trước khi thao tác?** | 1. [`WORLD_IMPLEMENTATION_PLAN.md`](./WORLD_IMPLEMENTATION_PLAN.md) — Kế hoạch phân kỳ 9 sub-phase (6.1–6.9) kèm tiêu chí nghiệm thu.<br>2. [`WORLD_DESIGN.md`](./WORLD_DESIGN.md) — Đặc tả toàn diện 9 trụ cột A–I của WORLD.<br>3. [`docs/roadmap/CURRENT_PHASE.md`](./docs/roadmap/CURRENT_PHASE.md) — Tổng kết hiện trạng kỹ thuật. |
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
| **Phase 6.0** | STARFRONT WORLD — Thiết Kế Tổng Thể & Kế Hoạch Triển Khai Chiến Lược | **Hoàn thành (Done)** | [`WORLD_DESIGN.md`](./WORLD_DESIGN.md), [`WORLD_IMPLEMENTATION_PLAN.md`](./WORLD_IMPLEMENTATION_PLAN.md) |
| **Phase 6.1** | WORLD Data Foundation & Isolated Save Resilience (`STARFRONT_WORLD_SAVE_V1`) | **Đã hoàn thành (Done)** | `lib/game/world/types.ts`, `lib/game/world/storage.ts` |
| **Phase 6.2** | Mạng Lưới Đồ Thị World Map & Máy Trạng Thái Sector | **Đã hoàn thành (Done)** | `lib/game/world/graph.ts`, `lib/game/world/sector-lifecycle.ts` |
| **Phase 6.3** | Động Cơ Tick Chiến Lược & Mô Phỏng Bắt Kịp Ngoại Tuyến | **Đã hoàn thành (Done)** | `lib/game/world/tick-engine.ts`, `lib/game/world/catchup-engine.ts`, `lib/game/world/random.ts` |
| **Phase 6.4** | Kinh Tế Chiến Lược, Mạng Lưới Hậu Cần & Nhân Khẩu Học | **Đã hoàn thành (Done)** | `lib/game/world/economy.ts`, `lib/game/world/logistics.ts`, `lib/game/world/demographics.ts` |
| **Phase 6.5** | Phe Phái VSS & The Void, Lực Lượng Quân Sự & Auto-Resolve | **Đã hoàn thành (Done)** | `lib/game/world/forces-ledger.ts`, `lib/game/world/auto-resolve.ts`, `lib/game/world/threat-ai.ts` |
| **Phase 6.6** | Khế Ước Tích Hợp Chiến Đấu & Nhật Ký Giao Dịch Lũy Đẳng | **Đã hoàn thành (Done)** | `lib/game/world/combat-adapter.ts`, `lib/game/world/transaction-journal.ts` |
| **Phase 6.7** | Vòng Đời Sự Kiện & Chuỗi Nhiệm Vụ Chiến Lược (6 Hình Thái) | **Đã hoàn thành (Done)** | `lib/game/world/event-engine.ts`, `lib/game/world/mission-chains.ts`, `lib/game/world/event-templates.ts` |
| **Phase 6.8** | Operations Center UI & Trung Tâm Kết Quả Kép (Dual Results Hub) | **Đã hoàn thành (Done)** | `components/game/world/operations-center.tsx`, `components/game/world/dual-results-hub.tsx`, `components/game/world/quick-dispatch-dock.tsx` |
| **Phase 6.9** | **Bản Đồ Toàn Màn Hình, Tinh Chỉnh Thị Giác & Kiểm Thử E2E Toàn Diện** | **Đã hoàn thành (Done)** | `components/game/world/world-map.tsx`, `components/game/world/world-fullscreen-overlay.tsx`, `tests/world/e2e-world-integration.test.ts` |
| **Phase 6.10** | **Tái Thiết Kế Trực Quan Sự Kiện & Cây Chuỗi Nhiệm Vụ (Events & Missions UI Redesign)** | **ĐÃ HOÀN THÀNH (DONE — 100% TESTS PASS)** | `components/game/world/events-missions-board.tsx`, `components/game/world/operations-center.tsx`, `tests/world/events-missions-ui.test.ts` |
| **Phase 6.11** | **Tinh Chỉnh Bản Đồ Thiên Hà & Hệ Thống HUD (Galaxy Map & HUD Refinement)** | **ĐÃ HOÀN THÀNH (DONE — 100% TESTS PASS)** | `components/game/world/world-map.tsx`, `components/game/world/world-fullscreen-overlay.tsx`, `tests/world/galaxy-map-hud-ui.test.ts` |
| **Phase 6.12** | **Biểu Đồ Xu Hướng Đe Dọa (Galaxy Map Threat Trendline)** | **ĐÃ HOÀN THÀNH (DONE — 100% TESTS PASS)** | `lib/game/world/types.ts`, `lib/game/world/tick-engine.ts`, `components/game/world/world-map.tsx`, `tests/world/threat-trendline.test.ts` |
| **Phase 6.13** | **Động Cơ Thời Gian Thực, Tự Động Sinh Sự Kiện/Nhiệm Vụ & ADMIN CP** | **ĐÃ HOÀN THÀNH (DONE — 100% TESTS PASS)** | `lib/game/world/simulator-config.ts`, `lib/game/world/calendar.ts`, `lib/game/world/event-generator.ts`, `components/game/world/operations-center.tsx`, `tests/world/realtime-simulator-admin.test.ts` |
| **Phase 6.14** | **Kiểm Chứng Động Cơ Thời Gian Thực & Độ Tin Cậy Sự Kiện (Simulator Validation & Reliability)** | **ĐÃ HOÀN THÀNH (DONE — 100% TESTS PASS)** | `lib/game/world/simulator-config.ts`, `lib/game/world/event-generator.ts`, `components/game/world/operations-center.tsx`, `tests/world/phase6-14-validation.test.ts` |
| **Phase 6.15** | **Chính Sách Chiến Lược Sự Kiện & Tự Động Hóa Hệ Thống (Event Strategy Policy & System Auto)** | **ĐÃ HOÀN THÀNH (DONE — 100% TESTS PASS)** | `lib/game/world/event-strategy-policy.ts`, `lib/game/world/event-engine.ts`, `tests/world/event-strategy-policy.test.ts` |
| **Phase 6.16** | **Đánh Giá Toàn Diện UI/UX & Bản Thiết Kế Tái Cấu Trúc (UI/UX Audit & Redesign Blueprint)** | **ĐÃ HOÀN THÀNH (DONE — BLUEPRINT APPROVED)** | `WORLD_UI_UX_AUDIT.md` |
| **Phase 6.17** | **Tái Cấu Trúc Điều Hướng Chính & Nền Tảng War Room (P0 UI/UX Foundation)** | **ĐÃ HOÀN THÀNH (DONE — 100% TESTS PASS)** | `components/game/starfront-shell.tsx`, `components/game/world/operations-center.tsx`, `components/game/world/world-map.tsx` |
| **Phase 6.18** | **Slim Tactical HUD & ADMIN CP Isolation (P1 UI/UX Refinement)** | **ĐÃ HOÀN THÀNH (DONE — 100% TESTS PASS)** | `components/game/world/operations-center.tsx`, `components/game/world/admin-settings-modal.tsx`, `tests/world/phase6-18-slim-hud-admin-isolation.test.ts` |
| **Phase 6.19** | **Ma Trận Ra Quyết Định Sự Kiện & Nhiệm Vụ (Events & Missions Decision Matrix)** | **ĐÃ HOÀN THÀNH (DONE — 100% TESTS PASS)** | `components/game/world/events-missions-board.tsx`, `tests/world/phase6-19-decision-matrix.test.ts` |

---

## 5. Hành Động Tiếp Theo (Next Steps)

1. **Events & Missions Decision Matrix**: Bố cục hai cột (Urgency Queue cuộn độc lập bên trái + Decision Panel đối chiếu chiến lược bên phải), hiển thị nguồn phê chuẩn, điểm số và chi phí minh bạch.
2. **Bảo tồn toàn vẹn**: Giữ nguyên toàn bộ logic mô phỏng, save schema (`STARFRONT_WORLD_SAVE_V1`, `STARFRONT_SAVE_DATA_V4`), 30/30 test suites PASS 100%.
3. Sẵn sàng cho Phase 6.20 theo lộ trình thiết kế.
