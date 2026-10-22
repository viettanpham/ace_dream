# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BIÊN BẢN BÀN GIAO (HANDOFF INSTRUCTIONS — E.0-REBUILD-1 COMPLETED)

**Thời điểm:** 2026-10-22  
**Đối tượng bàn giao:** Phiên làm việc / tài khoản tiếp theo  
**Trạng thái bàn giao:** `Phase E.0-REBUILD-1` ĐÃ HOÀN TẤT. Module Character Category / Pilot Profile V2 mới đã dựng sạch tại `components/game/v2/pilot-profile/` và tích hợp Shared Art Viewer.  

---

## 1. Hướng Dẫn Thử Nghiệm

1. **Xem trực tiếp trên `/ui-v2-preview`:**
   - Truy cập `/ui-v2-preview`.
   - Chọn tab `HỒ SƠ PHI CÔNG V2 (E.0-REBUILD-1)` trên thanh phụ.
2. **Kiểm tra trên Desktop (1440px):**
   - Roster bên trái cuộn mượt, chọn Valentine hoặc các nhân vật khác.
   - Khu vực trung tâm: Bấm thử 2 nút bối cảnh `Tiêu Chuẩn` (Standard) và `Radar HUD` (Tactical).
   - Nút `Soi Tranh 4K`: Mở Art Viewer, thử Zoom In/Out, kéo pan chuột và bấm phím `Escape` để đóng.
   - Cột phải: Đảm bảo `characterQuote` và `shortDescription` tách biệt rõ ràng; duyệt qua 4 tab: `OVERVIEW` (6 chỉ số sạch, không có tổng 20 điểm), `STORY` (toàn văn chương 1, chương 7-10 niêm phong), `GEAR COMPAT` (3 cơ giáp), `GALLERY` (2 ảnh WebP thật + 28 thẻ archive, không có lỗi 404).
3. **Kiểm tra trên Mobile (375px–430px):**
   - Mặc định mở ở `Mobile Art View` (ngắm tranh tràn màn hình, 2 controls bối cảnh nổi $\ge 44\text{px}$).
   - Bấm nút `XEM HỒ SƠ` chuyển sang `Mobile Info View`: Horizontal roster 76px hiển thị đủ tên, 4 tabs cuộn dọc mượt mà.

---

## 2. Quy Tắc Nghiêm Ngặt

- **KHÔNG TỰ Ý CHUYỂN SANG REBUILD-2 HOẶC TỰ BỊA FEEDBACK:** Chờ người dùng trực tiếp nghiệm thu và phản hồi.
- **KHÔNG SỬA CODE V1:** Giữ nguyên các tệp V1 hiện có.
- **KHÔNG LÀM CHARACTER SELECTION WIZARD:** Scope chỉ gói gọn trong Profile / Category.
