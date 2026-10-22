# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BIÊN BẢN BÀN GIAO (HANDOFF INSTRUCTIONS — E.0-REBUILD-1 COMPLETED)

**Thời điểm:** 2026-10-22  
**Đối tượng bàn giao:** Phiên làm việc / tài khoản tiếp theo  
**Trạng thái bàn giao:** `Phase E.0-REBUILD-1` ĐÃ HOÀN TẤT. Module Character Category / Pilot Profile V2 mới đã dựng sạch tại `components/game/v2/pilot-profile/` và tích hợp Shared Art Viewer.  

---

## 1. Hướng Dẫn Thử Nghiệm
1. **Truy cập trực tiếp Route V2 chính thức:**
   - Mở URL: **`/v2/pilots`** (hoặc `/v2`).
2. **Kiểm tra trên Desktop (1440px):**
   - V2 Top Bar: Hiển thị thanh trạng thái, nút chuyển đổi/quay lại V1.
   - Global Left Menu: Nút thu gọn/mở rộng Mini (64px) ↔ Full (240px), lưu vào `sf_v2_ui_prefs`.
   - Pilot Roster: Độc lập thu gọn Mini (72px) ↔ Full (256px), lưu vào `sf_v2_ui_prefs`.
   - Khu vực trung tâm: Nút chuyển đổi 2 bối cảnh `Tiêu Chuẩn` (Standard) và `Radar HUD` (Tactical).
   - Nút `Soi Tranh 4K`: Mở Shared Art Viewer (zoom 1x–3x, pan có kẹp biên, phím Escape, touch targets $\ge 44\text{px}$).
   - Cột phải: 4 tabs `OVERVIEW` (6 chỉ số sạch, không có tổng 20 điểm), `STORY` (toàn văn chương 1, chương 7–10 niêm phong HOLD), `GEAR COMPAT` (3 cơ giáp), `GALLERY` (WebP thật + Thẻ Archive cho 28 tranh manifest, 100% Zero 404).
3. **Kiểm tra trên Mobile (375px–430px):**
   - Hamburger Button mở V2 Drawer menu đầy đủ.
   - Mặc định mở ở `Mobile Art View` (ngắm tranh tràn màn hình, 2 controls bối cảnh nổi $\ge 44\text{px}$).
   - Bấm nút `XEM HỒ SƠ` chuyển sang `Mobile Info View`: Horizontal avatar rail $\ge 76\text{px}$ hiển thị đủ tên, 4 tabs cuộn dọc mượt mà.
4. **Harness phụ trợ:** `/ui-v2-preview` tiếp tục hoạt động độc lập để test primitives.

---

## 2. Quy Tắc Nghiêm Ngặt

- **KHÔNG TỰ Ý CHUYỂN SANG REBUILD-2 HOẶC TỰ BỊA FEEDBACK:** Chờ người dùng trực tiếp nghiệm thu và phản hồi.
- **KHÔNG SỬA CODE V1:** Giữ nguyên các tệp V1 hiện có.
- **KHÔNG LÀM CHARACTER SELECTION WIZARD:** Scope chỉ gói gọn trong Profile / Category.
