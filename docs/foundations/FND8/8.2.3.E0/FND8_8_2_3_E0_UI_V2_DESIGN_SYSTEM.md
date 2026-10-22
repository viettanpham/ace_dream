# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# CHARACTER CATEGORY / PILOT PROFILE UI V2 DESIGN SYSTEM BASELINE

**Ngày ban hành:** 2026-10-22  
**Phiên bản:** 2.0.0-PROVISIONAL  
**Mục đích:** Thiết lập quy chuẩn thiết kế độc lập hoàn toàn cho giao diện Hồ Sơ Nhân Vật / Danh Mục Phi Công V2 (FND-8 / 8.2.3.E.0).  
**Nguyên tắc tối thượng:** Concept Desktop và Mobile đã được phê duyệt là chuẩn cao nhất. Design System này đóng vai trò cung cấp các thông số kỹ thuật (Tokens, Typography, Spacing, Touch Target, Contrast) để hiện thực hóa chính xác concept đã duyệt.

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)

1. **Tuyệt Đối Không Kế Thừa Legacy V1:**
   - Không sử dụng lại CSS cũ, theme CRT scanline xanh lá cũ, hoặc cấu trúc DOM chắp vá của V1.
   - UI V2 mang phong cách không gian khoa học viễn tưởng hiện đại (Modern Sci-Fi / Aerospace High-Tech): sắc nét, tối giản, sang trọng và tập trung tối đa vào nhân vật và nội dung.
2. **Ưu Tiên Khả Năng Đọc (Readability First):**
   - Tuyệt đối không dùng cỡ chữ quá nhỏ để cố nhồi nhét dữ liệu vào một màn hình.
   - Phân hệ Story (Tiểu sử/Truyện dài) phải đạt tiêu chuẩn đọc văn xuôi thoải mái như sách điện tử chất lượng cao.
3. **Ergonomics & Touch Target Chuẩn Mobile:**
   - Mọi nút bấm, tab, toggle, thẻ tương tác trên mobile phải có vùng bấm tối thiểu **44 × 44px**.
4. **Cô Lập Tuyệt Đối (Zero Scope Creep):**
   - Chỉ xây dựng module Category/Profile V2. Không thiết kế lại thanh điều hướng toàn cầu hay menu game; chỉ tạo điểm vào (entry point) tối thiểu để kiểm thử UI V2.

---

## 2. Hệ Thống Màu Sắc & Tương Phản (Color & Contrast Tokens)

Tuân thủ nguyên tắc phối màu 60-30-10 và chuẩn tiếp cận WCAG AA (tương phản văn bản >= 4.5:1):

| Nhóm Màu | Tỷ Lệ | Mã Màu / Tailwind | Mục Đích Sử Dụng |
|---|---|---|---|
| **Canvas Neutral** | 60% | `#070A12` / `bg-slate-950` | Nền tảng tổng thể, không gian sâu thẳm, dịu mắt. |
| **Surface & Glass** | 30% | `#0F172A` / `bg-slate-900/80` (border: `border-slate-800`) | Bề mặt thẻ, panel thông tin, modal; hỗ trợ hiệu ứng mờ kính `backdrop-blur-md`. |
| **Primary Accent** | 10% | `#06B6D4` (Cyan-500) & `#14B8A6` (Teal-500) | Điểm nhấn thương hiệu của Valentine (Medic/Rescue), thanh chỉ số năng lượng/khiên, trạng thái Active. |
| **Warning / Hold** | Phụ trợ | `#F59E0B` (Amber-500) & `#64748B` (Slate-500) | Nhãn "Provisional" (Amber) và nhãn "Niêm Phong / HOLD" (Muted Slate). |
| **Text Primary** | — | `#F8FAFC` (Slate-50) | Tiêu đề, tên nhân vật, số liệu chính (Tương phản ~15:1 trên nền tối). |
| **Text Secondary**| — | `#CBD5E1` (Slate-300) | Văn bản đọc Story, mô tả, nội dung tiểu sử (Tương phản ~10:1). |
| **Text Muted** | — | `#94A3B8` (Slate-400) | Nhãn phụ, metadata, callsign (Tương phản ~6:1). |

---

## 3. Quy Chuẩn Kiểu Chữ (Typography Scale)

| Cấp Bậc (Role) | Cỡ Chữ / Line-height | Độ Dày (Weight) | Tracking | Áp Dụng |
|---|---|---|---|---|
| **Hero Title** | 28px - 32px (line: 1.2) | Bold / Black (700/800) | Tracking-wider | Tên nhân vật (Valentine Aurelia Vance) |
| **Section Header**| 18px - 20px (line: 1.3) | SemiBold (600) | Tracking-wide | Tiêu đề Tab, Tiêu đề Roster, Tiêu đề Chương |
| **Body / Story** | **15px - 16px (line: 1.65)** | Normal (400) | Normal | **Toàn văn Story, Biography. Độ rộng dòng tối ưu 65–75 ký tự (max-w-prose)** |
| **Quote Text** | 15px - 16px (line: 1.5) | Medium Italic (500) | Normal | Khối `characterQuote` riêng biệt, viền bên nổi bật |
| **Data / Numbers**| 14px - 15px (line: 1.2) | Medium (500) / Monospace| Tabular-nums | Bảng 6 thuộc tính (ATK/DEF/AGI/ENE/SHD/LUK) |
| **Badge / Label** | 12px - 13px (line: 1.0) | Medium (500) | Tracking-wider / Uppercase | Nhãn APPROVED, PROVISIONAL, HOLD, Category tag |

*Cấm tuyệt đối: Cỡ chữ nhỏ hơn 12px trong toàn bộ giao diện.*

---

## 4. Bố Cục & Không Gian (Layout & Spacing)

### 4.1 Bố Cục Desktop (1440px Baseline)
- **Container:** `max-w-7xl` (1440px) căn giữa màn hình với padding hai bên `px-6` (24px).
- **Cấu Trúc 3 Cột:**
  - **Cột Trái (280px - 300px):** Roster nhân vật & Bộ lọc phân loại, cuộn độc lập.
  - **Cột Giữa (Trung Tâm - Linh Hoạt 450px - 550px):**
    - Tranh nhân vật chất lượng cao toàn thân.
    - **Hai điều khiển Background (Showcase Controls)** đặt đối xứng ở hai bên cánh tranh:
      - Nút Bên Trái: Bối Cảnh A (Trạm Y Tế Elysia Hangar).
      - Nút Bên Phải: Bối Cảnh B (Buồng Lái Hologram HUD).
    - Nút phóng to / xem chi tiết tranh (Artwork Lightbox Trigger).
  - **Cột Phải (420px - 460px):**
    - Header nhân thân (Tên, Callsign, Danh hiệu).
    - Khối trích dẫn (`characterQuote`) riêng.
    - Khối mô tả ngắn (`shortDescription`) riêng.
    - Thanh chuyển 4 Tab (`OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`).
    - Khung nội dung Tab có cuộn mượt riêng biệt.

### 4.2 Bố Cục Mobile (375px - 430px Smartphone Dedicated)
- Phân tách làm 2 trạng thái riêng biệt (Paired States):
  1. **Mobile Info View:**
     - Top Navigation Bar (56px) với nút back, title và nút switch sang Art View.
     - Header thu gọn với Avatar WebP 64px.
     - Quote và Short Description hiển thị tách biệt rõ ràng.
     - Tab Bar Segmented với chiều cao 48px, touch target mỗi tab >= 44px.
     - Nội dung Tab cuộn dọc tự nhiên, font chữ Story 15px dễ đọc.
  2. **Mobile Art View:**
     - Tranh nhân vật hiển thị tràn viền (Full-bleed immersion).
     - **Floating Bottom Bar:** Chứa 2 nút chuyển bối cảnh (Background A / B) kích thước chạm tối thiểu 44 × 44px.
     - Nút Zoom in, Zoom out, Reset góc nhìn và nút Thoát về Info View.
     - Hỗ trợ cử chỉ chạm đa điểm (pinch-to-zoom) và chạm đúp (double-tap).

---

## 5. Quy Chuẩn Dữ Liệu & Tài Nguyên Hình Ảnh

1. **Chính Sách WebP:**
   - Chỉ nạp các tệp ảnh `.webp` đã xác minh tồn tại thực tế trên đĩa (`/images/valentine-fullbody.webp`, `/images/valentine-portrait.webp`).
   - 28 ảnh còn lại trong manifest hiển thị dạng "Thẻ Hồ Sơ Lưu Trữ Chờ Đồng Bộ WebP" để đảm bảo 100% không có yêu cầu tải ảnh bị lỗi 404 (Zero Broken Images).
2. **Manifest & Tên Tệp Nguồn:**
   - Trường `sourceFilename` trong manifest gốc chỉ là hồ sơ lưu trữ nguồn gốc (provenance record); tuyệt đối không dùng để tạo URL tải ảnh.
   - Giao diện V2 chỉ sử dụng `assetId` và `path` hợp lệ.
3. **Data Adapter Phân Tách:**
   - Sử dụng Data Adapter `lib/game/v2/character-profile-data.ts` làm cầu nối giữa tài liệu canonical FND-8 với UI.
   - Không tự ý tạo thêm dữ liệu gameplay hay tính toán thuộc tính mới.
