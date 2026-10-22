# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BIÊN BẢN BÀN GIAO (HANDOFF INSTRUCTIONS — DEFINE / PLAN COMPLETED)

**Thời điểm:** 2026-10-22  
**Đối tượng bàn giao:** Bất kỳ phiên làm việc tiếp theo / tài khoản AI Studio tiếp theo  
**Trạng thái bàn giao:** `DEFINE / PLAN ONLY` ĐÃ HOÀN TẤT. Cổng chặn concept ảnh đã giải phóng, hợp đồng UI Desktop/Mobile đã khóa, dữ liệu Valentine và tài nguyên WebP đã đối chiếu chính xác.  

---

## 1. Tóm Tắt Nhanh Hiện Trạng Trước Khi Viết Mã

1. **Concept PNG:** 3 ảnh concept PNG trong `docs/art-direction/UI_CONCEPTS/` đã có mặt đầy đủ trên đĩa.
2. **Legacy V2 Experiment:** Thư mục `components/game/v2/character-profile/` đã được đánh dấu là `IMPLEMENTED_BUT_NOT_ACCEPTED / LEGACY_V2_EXPERIMENT`; không được dùng làm nền để vá đắp.
3. **Core Primitives V2:** Đã hoàn thiện và kiểm chứng tại `components/game/v2/ui/` (`Button`, `Card`, `Tabs`, `Tooltip`, `Dialog`, `Drawer`, `Feedback`).
4. **Tài nguyên ảnh WebP:**
   - Chỉ có 2 ảnh WebP thật trên đĩa: `/images/valentine-fullbody.webp` và `/images/valentine-portrait.webp`.
   - 28 ảnh manifest còn lại bắt buộc hiển thị dạng Thẻ Archive Card (tránh lỗi 404).
   - Tuyệt đối không dùng `sourceFilename` làm URL web.
5. **Dữ liệu Valentine canonical:**
   - 6 chỉ số tổng = 20 điểm.
   - 2 Trait V2 (`pilot_trait_field_medic`, `pilot_trait_safeguard`).
   - Phân tách riêng `characterQuote` và `shortDescription`.
   - Chương 01 toàn văn, 02–04 tóm tắt, 05–06 đề cương, 07–10 HOLD niêm phong.
   - 2 background controls (Standard vs Tactical HUD).

---

## 2. Các Bước Tiến Hành Tiếp Theo

Khi người dùng ra lệnh `IMPLEMENT`:
- Nếu người dùng chọn **Lộ trình chuẩn tắc Foundation**:
  - Triển khai **UI V2 Foundation Phase 2: Shared Art Viewer** tạo `components/game/v2/ui/art-viewer.tsx`.
- Nếu người dùng chọn **Triển khai E.0 Rebuild ngay**:
  - Thực hiện theo kế hoạch tại `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_IMPLEMENTATION_PLAN.md`.
  - Tạo mới module cách ly `components/game/v2/pilot-profile/` (hoặc cấu trúc mới sạch sẽ) sử dụng UI V2 Primitives.
  - Triển khai đồng thời cả Desktop View (3 cột) và Mobile View (Paired States: Art View & Info View).
  - Đảm bảo 100% không phát sinh lỗi 404 hình ảnh và đạt 0 lỗi build/lint.

---

## 3. Ranh Giới Nghiêm Ngặt Cần Ghi Nhớ

- **KHÔNG SỬA CODE V1:** Giữ nguyên `components/game/pilot-gallery.tsx`, `components/game/character-gear-select.tsx`, `lib/game/data.ts`.
- **KHÔNG LÀM CHARACTER SELECTION WIZARD:** Scope chỉ gói gọn trong Character Category / Pilot Profile.
- **KHÔNG TỰ TẠO LOGIC GAMEPLAY:** Tương thích GEAR chỉ hiển thị rating giao diện, không sáng tác công thức tính điểm chiến đấu.
