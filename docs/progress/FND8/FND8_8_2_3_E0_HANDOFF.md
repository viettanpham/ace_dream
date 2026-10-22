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
4. **Kiểm Thử Trên Màn Hình Mobile (Device Mode 375px–430px):**
   - Mở DevTools (F12) chuyển sang kích thước 390px (iPhone) hoặc 412px (Pixel).
   - Kiểm tra **Thanh Chuyển Đổi Trạng Thái:**
     - Chạm vào `[ Xem Thông Tin ]`: Hiển thị Info View với avatar, 4 tabs cuộn mượt, touch targets >= 44px.
     - Chạm vào `[ Xem Tranh Nhân Vật ]`: Hiển thị Art View toàn màn hình, thanh công cụ nổi, 2 nút chuyển bối cảnh chạm nhạy.

---

## 2. Quy Tắc Tuyệt Đối Cho Phiên Tiếp Theo

- **KHÔNG TỰ Ý CHUYỂN SANG IMPLEMENT-2:** Chỉ tiếp tục làm việc khi người dùng đã trải nghiệm thực tế và cung cấp danh sách phản hồi/hiệu chỉnh (feedback).
- **KHÔNG ĐỤNG VÀO CODE V1:** Giữ nguyên vẹn `components/game/pilot-gallery.tsx`, `character-gear-select.tsx` và `lib/game/data.ts`.
- **KHÔNG MỞ RỘNG SCOPE NGOÀI CATEGORY/PROFILE:** Tuyệt đối không làm Character Selection Wizard, gameplay balancing hay FND-8.3.2.x.
