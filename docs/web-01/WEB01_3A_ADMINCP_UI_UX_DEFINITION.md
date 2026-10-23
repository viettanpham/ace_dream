# STARFRONT WORLD V2 — WEB-01.3.A
# ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG ADMINCP
## ADMINCP ASSET VERSION MANAGER — UI/UX SPECIFICATION

**Mã tài liệu:** WEB01-3A-UI-01  
**Chế độ:** PLAN/DEFINE ONLY  
**Ngày lập:** 2026-10-22  
**Ngôn ngữ:** 100% Tiếng Việt  

---

## 1. Vị trí Tích hợp & Phong cách Thiết kế (Integration & Visual Style)

### 1.1. Điểm Tích hợp trong AdminCP
- **Vị trí đề xuất:** Bổ sung **Tab thứ 9** trong modal quản trị toàn cầu hiện có:  
  `components/game/world/admin-settings-modal.tsx`
- **Tên Tab:** `9. Phiên Bản Artwork (CDN)`
- **Icon:** `Layers` hoặc `ImageIcon` (từ thư viện `lucide-react`).

### 1.2. Ngôn ngữ Thiết kế (Sci-Fi Military Terminal Style)
- Giữ nguyên vẹn 100% ngôn ngữ thiết kế đặc trưng của STARFRONT AdminCP:
  - Nền tối sâu `bg-black/80` hoặc `bg-slate-950/90` kết hợp đường viền kim loại `border-cyan-500/40`.
  - Phông chữ tiêu đề kỹ thuật `font-display`, nhãn tham số dạng `font-mono text-xs`.
  - Hiệu ứng quét dòng Hologram (Scanline overlay) và âm thanh phản hồi xúc giác (`playClickSound()`, `playShieldSound()`, `playLevelUpSound()`).
  - Hệ thống huy hiệu trạng thái rõ ràng (Xanh ngọc: Đang dùng, Lục: Đã xác minh, Hổ phách: Chờ xử lý, Đỏ: Lỗi/Không tương thích).

---

## 2. Bố cục 5 Khối Giao diện Chính (Main UI Layout Blocks)

```
+-----------------------------------------------------------------------------------+
|  [TAB 9: QUẢN LÝ PHIÊN BẢN ARTWORK & CDN RUNTIME]                                  |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +-- [KHỐI 1: PHIÊN BẢN ĐANG HOẠT ĐỘNG (CURRENT ACTIVE VERSION)] ---------------+ |
|  |  Tag: v2.0-assets-r1 [ACTIVE]  |  Kho: viettanpham/starfront-assets           | |
|  |  CDN: jsDelivr Edge Network   |  Cập nhật: 2026-10-22 20:25 (Bản gốc)        | |
|  |  Tổng tài nguyên: 26 WebP      |  Trạng thái: 🟢 KẾT NỐI HOÀN HẢO             | |
|  +------------------------------------------------------------------------------+ |
|                                                                                   |
|  +-- [KHỐI 2: DANH SÁCH BẢN PHÁT HÀNH GITHUB (RELEASE DISCOVERY)] --------------+ |
|  |  [Nút: 🔄 Quét Lại GitHub]  |  Bộ đệm: Còn 7 phút  |  [Ô nhập tag thủ công]  | |
|  |  --------------------------------------------------------------------------  | |
|  |  Tag: v2.0-assets-r2 | 2026-10-23 | 38 WebP | 🔵 ĐÃ KIỂM ĐỊNH | [Xem] [Chọn] | |
|  |  Tag: v2.0-assets-r1 | 2026-10-22 | 26 WebP | 🟢 ĐANG DÙNG   | (Hiện tại)   | |
|  |  Tag: v1.9-beta-01   | 2026-10-20 | 12 WebP | 🟠 THIẾU ẢNH   | [Xem Lỗi]    | |
|  +------------------------------------------------------------------------------+ |
|                                                                                   |
|  +-- [KHỐI 3: HỘP CÁT XEM TRƯỚC (SANDBOXED PREVIEW)] ---------------------------+ |
|  |  Đang xem trước phiên bản: v2.0-assets-r2 (Chưa áp dụng cho game)             | |
|  |  [Ảnh 1: Marcus]       [Ảnh 2: Valentine]     [Ảnh 3: Aegis Mecha]           | |
|  |  +----------------+    +----------------+    +----------------+              | |
|  |  |    Preview     |    |    Preview     |    |    Preview     |              | |
|  |  +----------------+    +----------------+    +----------------+              | |
|  +------------------------------------------------------------------------------+ |
|                                                                                   |
|  +-- [KHỐI 4: THAO TÁC KÍCH HOẠT & HOÀN TÁC] -----------------------------------+ |
|  |  [ Nút Kích Hoạt v2.0-assets-r2 ]   |   [ Nút Hoàn Tác về v2.0-assets-r1 ]   | |
|  +------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 3. Đặc tả Chi tiết Các Khối Giao diện

### 3.1. Khối 1: Phiên Bản Đang Hoạt Động (Active Version Card)
- **Mục đích:** Cung cấp bức tranh toàn cảnh về nguồn cung cấp ảnh hiện tại của trò chơi.
- **Dữ liệu hiển thị:**
  - Tên phiên bản lớn nổi bật kèm nhãn xanh ngọc `ACTIVE // PRODUCTION`.
  - CDN Base URL có nút sao chép nhanh (Copy to clipboard).
  - Trạng thái kiểm tra kết nối thời gian thực (Ping CDN HTTP status).
  - Tên phiên bản trước đó (`previousVersion`), nếu có sẵn sẽ kích hoạt nút Rollback nhanh.

### 3.2. Khối 2: Danh Sách Phiên Bản (Release Discovery Table)
- **Mục đích:** Hiển thị toàn bộ các phiên bản đã phát hành trên GitHub.
- **Thành phần:**
  - Thanh công cụ: Nút `Làm mới danh sách` (kèm thời gian đếm ngược của cache) và ô nhập mã Tag thủ công khi cần kiểm tra tag ẩn/nội bộ.
  - Bảng danh sách phiên bản:
    - Cột 1: Tên Release Tag (kèm biểu tượng commit).
    - Cột 2: Thời gian phát hành trên GitHub.
    - Cột 3: Số lượng tệp tài nguyên ghi nhận trong manifest.
    - Cột 4: Trạng thái kiểm định (`ACTIVE`, `VERIFIED`, `INCOMPATIBLE`, `INVALID`).
    - Cột 5: Nút hành động: `Xem Trước` (Mở khối preview) và `Chọn Kích Hoạt`.

### 3.3. Khối 3: Hộp Cát Xem Trước (Sandboxed Preview Sandbox)
- **Nguyên lý quan trọng:** Xem trước ảnh của release mới **hoàn toàn độc lập trong bộ nhớ của AdminCP**, sử dụng tham số `overrideConfig: { cdnBaseUrl: targetReleaseUrl }`. Người chơi bên ngoài hoàn toàn không bị ảnh hưởng.
- **Bộ tác phẩm đối chiếu:**
  - 1 ảnh đại diện chỉ huy: Marcus Portrait.
  - 1 ảnh nhân vật nữ V2: Valentine Combat / Fullbody.
  - 1 ảnh phi cơ cơ giáp: Vanguard hoặc Aegis Gear.
  - Tab mở rộng hiển thị các tác phẩm mới xuất hiện trong manifest của release này.

---

## 4. Quy trình Xác nhận 2 Bước An toàn (Two-Step Confirmation Dialogs)

Để triệt tiêu hoàn toàn rủi ro bấm nhầm làm gián đoạn trò chơi, việc chuyển đổi phiên bản bắt buộc phải đi qua 2 bước xác nhận:

### 4.1. Bước 1 — Dialog Tóm Tắt & Kiểm Định (Summary Dialog)
- **Tiêu đề:** `XÁC NHẬN CHUYỂN ĐỔI PHIÊN BẢN ARTWORK`
- **Nội dung:**
  - Bảng so sánh 2 cột: Phiên bản Hiện tại (`v2.0-assets-r1`) ➔ Phiên bản Mục tiêu (`v2.0-assets-r2`).
  - Số lượng tệp tài nguyên: `26 tệp ➔ 38 tệp (+12 tệp mới)`.
  - Kết quả kiểm định: `100% ảnh cốt lõi đạt HTTP 200`.
  - Cảnh báo: *“Hành động này sẽ cập nhật URL nạp hình ảnh cho toàn bộ người chơi khi họ làm mới hoặc chuyển màn hình.”*
- **Hành động:** Nút `Hủy Thao Tác` và Nút `Tiếp Tục Xác Nhận ➔`.

### 4.2. Bước 2 — Dialog Cảnh Báo Cuối Cùng (Final Safety Confirmation - FINAL APPROVED)
- **Tiêu đề:** `CẢNH BÁO CUỐI CÙNG — KÍCH HOẠT HỆ THỐNG RUNTIME`
- **Màu sắc:** Tông màu đỏ cảnh báo nguy cấp (`border-rose-500/80 bg-rose-950/40 text-rose-200`).
- **Cơ chế an toàn (Chủ dự án đã phê duyệt):** 
  - Yêu cầu Quản trị viên gõ lại **CHÍNH XÁC 100% TÊN RELEASE TAG** (ví dụ: `v2.0-assets-r2`) vào ô xác nhận. Nút kích hoạt chỉ sáng lên khi chuỗi ký tự khớp hoàn toàn.
  - **Không sử dụng cơ chế Hold-to-Confirm 3 giây.**
- **Hành động:** Nút `QUAY LẠI` và Nút `XÁC NHẬN KÍCH HOẠT NGAY`.

---

## 5. Thích ứng Đa Nền tảng (Responsive Desktop & Mobile)

- **Trên Desktop (Màn hình rộng >= 1024px):** Bố cục 2 cột song song (Cột trái: Danh sách phiên bản & cấu hình; Cột phải: Khối xem trước Sandbox và bảng chi tiết manifest).
- **Trên Mobile / Tablet (< 1024px):** Tự động chuyển đổi thành bố cục ngăn xếp dọc (Stacked Layout). Có thanh trượt ngang cho bảng danh sách và nút chuyển đổi tab con giữa `Danh Sách Tag` và `Xem Trước Hình Ảnh` để không gây tràn màn hình (zero horizontal overflow).
