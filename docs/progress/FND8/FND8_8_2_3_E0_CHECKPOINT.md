# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# ĐIỂM KIỂM SOÁT THỰC ĐỊA (CHECKPOINT REPORT — E.0-REBUILD-1 COMPLETED)

**Thời điểm ghi nhận:** 2026-10-22  
**Giai đoạn:** Phase E.0-REBUILD-1 ĐÃ HOÀN TẤT (Xây dựng mới Character Category / Pilot Profile V2)  
**Trạng thái phiên:** DỪNG CHỜ NGƯỜI DÙNG NGHIỆM THU TRỰC TIẾP TRÊN GIAO DIỆN  

---

## 1. Danh Sách Tệp Đã Tạo & Cập Nhật

| Đường Dẫn Tệp | Loại | Mô Tả Chức Năng |
|---|---|---|
| `components/game/v2/ui/art-viewer.tsx` | Tạo mới | Fast-Track Shared Art Viewer độc lập (Zoom 1x–3x, pan, Esc, 44px hit target, archive fallback) |
| `components/game/v2/ui/index.ts` | Cập nhật | Xuất ArtViewer vào bộ UI V2 Primitives dùng chung |
| `components/game/v2/pilot-profile/tabs/overview-tab.tsx` | Tạo mới | Tab 6 chỉ số Base Attributes (không hiển thị tổng 20 điểm), 2 Traits tooltip, Dossier |
| `components/game/v2/pilot-profile/tabs/story-tab.tsx` | Tạo mới | Tab Cốt truyện: toàn văn Chương 01 (`APPROVED`), tóm tắt 02–06, Chương 07–10 (`HOLD` niêm phong) |
| `components/game/v2/pilot-profile/tabs/gear-compat-tab.tsx` | Tạo mới | Tab tương thích cơ giáp Aegis, Vanguard, Falcon minh bạch |
| `components/game/v2/pilot-profile/tabs/gallery-tab.tsx` | Tạo mới | Lưới 2 ảnh WebP thật + Thẻ Archive cho 28 ảnh manifest chờ đồng bộ (100% Zero 404) |
| `components/game/v2/pilot-profile/desktop-view.tsx` | Tạo mới | Giao diện Desktop 1440px 3 cột bám sát concept: Roster, Center Showcase (2 controls bối cảnh), 4 Tabs |
| `components/game/v2/pilot-profile/mobile-art-view.tsx` | Tạo mới | Giao diện Mobile Art View gần full-screen, 2 controls bối cảnh nổi $\ge 44\text{px}$, nút xem hồ sơ |
| `components/game/v2/pilot-profile/mobile-info-view.tsx` | Tạo mới | Giao diện Mobile Info View: Horizontal Roster 76px, quote/short bio tách biệt, 4 tabs |
| `components/game/v2/pilot-profile/pilot-profile-v2.tsx` | Tạo mới | Master Coordinator quản lý state và chuyển đổi desktop/mobile |
| `components/game/v2/character-profile/pilot-profile-v2.tsx` | Cập nhật | Forwarder chuyển hướng sang module mới mà không sửa bất kỳ dòng mã nào của V1 shell |
| `app/ui-v2-preview/page.tsx` | Cập nhật | Tích hợp tab switcher xem trực tiếp Pilot Profile V2 trên môi trường preview cách ly |

---

## 2. Kết Quả Kiểm Thử Thực Tế

- **Biên Dịch Next.js (`compile_applet`):** `Build succeeded - the applet is compiled` (0 lỗi TypeScript, 0 lỗi JSX).
- **Kiểm Tra Cú Pháp (`lint_applet`):** `Linting completed successfully` (0 warnings, 0 errors).
- **Toàn Vẹn V1:** Các tệp V1 (`components/game/starfront-shell.tsx`, `pilot-gallery.tsx`, `character-gear-select.tsx`, `lib/game/data.ts`) **giữ nguyên 100% không bị thay đổi**.

---

## 3. Giới Hạn Của Art Viewer & Lộ Trình Chuyển Đổi Sang Shared Art Viewer

- **Khả năng hiện tại:**
  - Hỗ trợ đầy đủ phóng to thu nhỏ từ 1x đến 3x qua nút bấm hoặc phím tắt `+` / `-` / `0`.
  - Hỗ trợ kéo chuột (mouse drag) và cảm ứng vuốt (touch move) để pan khung ảnh khi phóng to $> 1x$.
  - Phím `Escape` đóng modal, phím mũi tên điều hướng.
  - Vùng chạm đóng và nút điều khiển tối thiểu $44 \times 44\text{px}$.
  - Chống vỡ ảnh: Tự động phát hiện ảnh chưa có file và hiển thị thẻ thông tin lưu trữ danh mục.
- **Giới hạn chưa triển khai:**
  - Cử chỉ 2 ngón tay chụm mở (native touch pinch-to-zoom) đang dùng chế độ chạm double-tap và thanh công cụ nổi thay vì gesture listener đa điểm phức tạp để đảm bảo độ ổn định cao trên mọi trình duyệt.
- **Điểm thay thế sang Shared Art Viewer:**
  - Component được xây dựng trực tiếp tại `components/game/v2/ui/art-viewer.tsx` với interface chuẩn. Khi dự án bước sang Phase 2 của UI Foundation, chỉ cần nâng cấp trực tiếp file này mà không phải sửa đổi bất kỳ component nào trong `pilot-profile/`.

---

## 4. Hướng Dẫn Kiểm Thử Cho Người Dùng

1. **Cách 1: Kiểm thử trên Preview Cách Ly (Khuyến nghị):**
   - Mở URL ứng dụng và truy cập route: `/ui-v2-preview`.
   - Bấm vào tab **`HỒ SƠ PHI CÔNG V2 (E.0-REBUILD-1)`** trên thanh phụ.
   - Thử nghiệm trên màn hình Desktop hoặc bật DevTools chuyển sang chế độ Mobile (390px).
2. **Cách 2: Kiểm thử qua V1 Shell:**
   - Tại trang chủ `/`, trên thanh menu bên trái tìm mục:
     `★ HỒ SƠ PHI CÔNG V2 // FND-8`.
   - Xem giao diện Desktop 3 cột và thử click chọn nhân vật, đổi 2 chế độ bối cảnh Standard vs Tactical HUD, duyệt 4 tabs, và mở Art Viewer.
