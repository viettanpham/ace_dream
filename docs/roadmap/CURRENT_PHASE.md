# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 5.9 — PILOT SKILL LIÊN HOÀN, TEMPLATE CONFIGURATION & COMBAT SYNERGY

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH PHẦN CODE & TÍNH NĂNG (Gameplay Done — 93/93 Tests PASS) · ASSET ẢNH MECHA & TOÀN THÂN: PENDING DO QUOTA AI STUDIO (429)**.
- **Mục tiêu cốt lõi**:
  - Xây dựng hệ thống **Tuyệt Kỹ Liên Hoàn Phi Công (Pilot Skill Liên Hoàn)** độc lập với 5 Slot Mô-đun Cơ Giáp trong Hangar.
  - Cung cấp 4 Template cấu hình chi tiết cho Marcus, Valentine, Alviss (Levi Reed), và Eric.
  - Tăng cấp tuần tự, mở khóa dòng phụ tại các mốc Milestone (chia hết cho 5: cấp 5, 10, 15, 20...).
  - Cơ chế **Reroll Dòng Phụ** (Ngẫu nhiên hoặc Chọn mục tiêu có định hướng) bằng Vé Reroll (Reroll Tokens) hoặc Credits.
  - Tính toán và khống chế Điểm Sức Mạnh Kỹ Năng (Skill Power) theo trần ngân sách (`maxSkillPowerBudget`).
  - Giao diện người dùng buồng lái trực quan: Component `PilotSkillView`, Tab "Tuyệt Kỹ Liên Hoàn Phi Công" trong `CharacterGearSelect`.
  - Bảng điều khiển quản trị toàn cục **Admin CP** (`AdminCpModal`) với quyền cấu hình giới hạn cấp độ, thứ tự ưu tiên (`GLOBAL_PRIORITY` vs `TEMPLATE_OVERRIDE`), và chuẩn hóa dữ liệu.
  - Tích hợp thực chiến: Marcus Active phóng loạt pháo Ion bồi sát thương và nạp SP; Alviss phản kích né tránh chớp nhoáng; Valentine kích hoạt khiên cấp cứu; Eric phá vỡ giáp đối phương.
  - Bảo toàn 100% dữ liệu Schema v4, an toàn nâng cấp từ v1, v2, v3.

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Hệ thống Types & Interfaces | **Đã hoàn thành (Done)** | `lib/game/pilot-skill-types.ts` |
| 4 Template Kỹ năng Chuẩn | **Đã hoàn thành (Done)** | `lib/game/pilot-skill-templates.ts` |
| Engine Tăng Cấp, Milestone, Reroll, Normalization | **Đã hoàn thành (Done)** | `lib/game/pilot-skill-engine.ts` |
| Tích hợp CombatUnit & Sát thương Thực Chiến | **Đã hoàn thành (Done)** | `lib/game/progression.ts`, `lib/game/engine.ts` |
| Nút Tuyệt Kỹ Action Deck trong Đấu Trường | **Đã hoàn thành (Done)** | `components/game/combat-arena.tsx` (Slot 5) |
| Giao diện Buồng Lái Pilot Skill View | **Đã hoàn thành (Done)** | `components/game/pilot-skill-view.tsx` |
| Modal Quản Trị Toàn Cục Admin CP | **Đã hoàn thành (Done)** | `components/game/admin-cp-modal.tsx` |
| Tab Kỹ Năng Phi Công trong Character & Gear | **Đã hoàn thành (Done)** | `components/game/character-gear-select.tsx` |
| Lưu Trữ Schema v4 & Migration Tự Động | **Đã hoàn thành (Done)** | `lib/game/storage.ts` |
| Bộ Kiểm Thử Tự Động Toàn Diện Phase 5.9 | **Đã hoàn thành (Done)** | `tests/phase5-9-pilot-synergy-skills.test.ts` (18/18 PASS) |
| Tái Tạo Ảnh Mecha & Ảnh Phi Công Toàn Thân | **Đang chờ (Pending Quota)** | 4/4 Portrait raster hoàn tất; 4 Fullbody và 3 Mecha dùng SVG fallback an toàn. |
| Báo Cáo Triển Khai & Asset Manifest | **Đã hoàn thành (Done)** | `PHASE_5_9_IMPLEMENTATION_REPORT.md`, `PHASE_5_9_ASSET_MANIFEST.md` |

---

## 3. Kiến Trúc Tuyệt Kỹ Liên Hoàn 4 Phi Công

1. **Marcus Thorne (Assault / Weapons Specialist)**:
   - **Template**: `tpl_marcus_artillery_storm` (Bão Pháo Ion Càn Quét).
   - **Loại**: ACTIVE (Chủ động xuất kích).
   - **Signature Gear**: `vanguard`.
   - **Hiệu ứng Hiệp Đồng**: +25% Sát thương tổng thể, bắn bồi thêm 35% sát thương và nạp lại +15 SP.

2. **Valentine Reyes (Support / Defense Specialist)**:
   - **Template**: `tpl_valentine_nano_sanctuary` (Thánh Vực Nano Hộ Vệ).
   - **Loại**: PASSIVE (Tự động kích hoạt khi khiên vỡ).
   - **Signature Gear**: `aegis`.
   - **Hiệu ứng Hiệp Đồng**: Tái tạo ngay khiên cấp cứu kèm khiên thưởng từ Tuyệt Kỹ Liên Hoàn.

3. **Levi Reed / Alviss (Interceptor / Speed Specialist)**:
   - **Template**: `tpl_alviss_quantum_surge` (Gia Tốc Lượng Tử & Phản Kích Né Tránh).
   - **Loại**: PASSIVE (Tự động phản công chớp nhoáng khi né tránh thành công).
   - **Signature Gear**: `falcon`.
   - **Hiệu ứng Hiệp Đồng**: +12% Evasion, +25% Armor Penetration, phóng đạn xung kích phản đòn x1.4 sát thương khi né đòn.

4. **Eric Vance (Siege / Heavy Demolition Specialist)**:
   - **Template**: `tpl_eric_titan_breaker` (Đạn Hạt Nhân Xuyên Giáp Tận Diệt).
   - **Loại**: ACTIVE (Chủ động xuất kích).
   - **Signature Gear**: `aegis`.
   - **Hiệu ứng Hiệp Đồng**: Xuyên giáp tuyệt đối +30%, phá vỡ giáp đối thủ (-45% DEF trong 2 lượt).
