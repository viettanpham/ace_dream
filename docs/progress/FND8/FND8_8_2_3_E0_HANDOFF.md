# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# BIÊN BẢN BÀN GIAO (HANDOFF INSTRUCTIONS — E.0-IMPLEMENT-1 COMPLETED)

**Thời điểm:** 2026-10-22  
**Đối tượng bàn giao:** Bất kỳ phiên làm việc tiếp theo / tài khoản AI Studio tiếp theo  
**Trạng thái bàn giao:** `Phase E.0-IMPLEMENT-1` ĐÃ HOÀN TẤT. Giao diện Character Category / Pilot Profile V2 đã chạy thực tế trên cả Desktop và Mobile.  

---

## 1. Hướng Dẫn Nhanh Cách Kiểm Thử Giao Diện V2 (How To Test)

1. **Mở Trình Duyệt / Dev Server:**
   - Ứng dụng chạy tại port 3000 hoặc URL Web App.
2. **Truy Cập Vào Giao Diện V2:**
   - Trên thanh menu bên trái (Left Sidebar) của Starfront, tìm mục thuộc nhóm Tác Chiến:
     `★ HỒ SƠ PHI CÔNG V2 // FND-8` (có huy hiệu `V2 NEW`).
   - Click vào mục này để mở giao diện Category / Profile V2 độc lập.
3. **Kiểm Thử Trên Màn Hình Desktop (>= 1280px / 1440px):**
   - **Cột Trái (Roster):** Click chọn giữa các nhân vật (Valentine, Kaelen, Alviss, Victor...). Xem hiệu ứng sáng viền Cyan.
   - **Vùng Giữa (Showcase):**
     - Click vào hai mũi tên `<` và `>` ở hai bên sườn tranh để chuyển đổi giữa 2 chế độ hiển thị:
       1. *Chế Độ Tiêu Chuẩn (Standard Showcase)*: Ánh sáng tự nhiên.
       2. *Chế Độ Tác Chiến & HUD (Tactical HUD Showcase)*: Lưới tọa độ quét, viền trường lực khiên quang học và thông số y sinh vi tính.
     - Click nút **"Soi Tranh 4K"** hoặc nút Play Trailer: Mở trình phóng to Lightbox. Thử lăn chuột/bấm nút Zoom In để phóng to từ 1x đến 4x, kéo chuột để rê ảnh (pan), bấm phím **Esc** để đóng.
   - **Cột Phải (Hồ Sơ):**
     - Đảm bảo trích dẫn `characterQuote` và mô tả ngắn `shortDescription` hiển thị thành 2 khối tách biệt rõ ràng.
     - Chuyển qua 4 tab:
       - **OVERVIEW:** Xem 6 thanh chỉ số (tổng = 20), click vào thẻ Trait để mở modal giải thích chi tiết.
       - **STORY:** Xem lộ trình 10 chương, đọc toàn văn Chương 01 với cỡ chữ 17px dễ đọc.
       - **GEAR COMPAT:** Xem thông tin minh bạch về trạng thái chuẩn hóa FND-8.3 (không có điểm số bịa đặt).
       - **GALLERY:** Xem 2 ảnh WebP thật và các thẻ archive "Chờ Đồng Bộ WebP".
4. **Kiểm Thử Trên Màn Hình Mobile (Device Mode 375px–430px — Trọng Tâm Nghiệm Thu):**
   - Mở DevTools (F12) chuyển sang kích thước 390px (iPhone) hoặc 412px (Pixel).
   - **Horizontal Roster:** Danh sách avatar ngang cuộn mượt, chiều rộng mỗi ô 76px, tên nhân vật ("Valentine", "Kaelen", "Alviss"...) hiển thị đầy đủ, không bị cắt cụt.
   - **Mobile Art View (Mặc định khi mở):**
     - Tranh Valentine hiển thị dạng gần full-screen, bám sát concept `FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_APPROVED.png` (Right Screen).
     - Toàn bộ cơ thể (đầu, cánh/hào quang, tay cầm gậy y tế, trang phục) hiển thị trọn vẹn, không bị crop mất phần quan trọng.
     - Hai nút mũi tên điều khiển chuyển nhân vật/bối cảnh `<` và `>` đối xứng hai bên sườn màn hình (touch target >= 44px).
     - Nút nổi `2D` và `Zoom In` (+) bên phải trên nền tranh.
     - Bảng thông tin nổi ở đáy màn hình: Insignia UME Medical Corps, Tên `+ Valentine`, Danh hiệu `Ánh Sáng Cuối Cùng`, Vai trò, 3-thumbnail carousel (Fullbody / Chân dung / Buồng lái), Trích dẫn lời thề, và nút `[ 📄 Xem Hồ Sơ ]`.
   - **Mobile Info View:**
     - Chạm nút `[ Xem Hồ Sơ & Story ]` hoặc nút trên bảng nổi đáy màn hình:
     - Chuyển sang Info View bám sát concept (Left Screen), loại bỏ card-nesting rườm rà.
     - Cỡ chữ chuẩn Design System V2: Body 16px, Story 17px, Text phụ 14px, đọc rất thoải mái và rõ nét.
     - 4 Tab: OVERVIEW (Stats 20 điểm + Trait popover), STORY (Lộ trình 10 chương), GEAR (Tương thích cơ giáp), GALLERY (2 ảnh WebP nổi bật, 28 ảnh archive thu gọn dạng bảng trạng thái đóng/mở).
   - **Loại Bỏ Hoàn Toàn Nút Wizard:** Không còn nút "CHỌN NHÂN VẬT" cố định ở đáy màn hình hay step breadcrumb.
   - **Loại Bỏ Shell Margin:** Shell áp dụng `p-0` khi vào V2 giúp giao diện tràn viền chuẩn mobile native.

---

## 2. Quy Tắc Tuyệt Đối Cho Phiên Tiếp Theo

- **KHÔNG TỰ Ý CHUYỂN SANG IMPLEMENT-2:** Chỉ tiếp tục làm việc khi người dùng đã trải nghiệm thực tế và cung cấp danh sách phản hồi/hiệu chỉnh (feedback).
- **KHÔNG ĐỤNG VÀO CODE V1:** Giữ nguyên vẹn `components/game/pilot-gallery.tsx`, `character-gear-select.tsx` và `lib/game/data.ts`.
- **KHÔNG MỞ RỘNG SCOPE NGOÀI CATEGORY/PROFILE:** Tuyệt đối không làm Character Selection Wizard, gameplay balancing hay FND-8.3.2.x.
