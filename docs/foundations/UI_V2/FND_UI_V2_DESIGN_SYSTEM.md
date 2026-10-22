# STARFRONT WORLD — FND-UI-V2.0
# HỆ THỐNG THIẾT KẾ GIAO DIỆN V2 (DESIGN SYSTEM V2 SPECIFICATION)

**Ngày ban hành:** 2026-10-22  
**Phiên bản:** 2.0.0-PROVISIONAL  
**Trạng thái:** DEFINE / PLAN ONLY  
**Mục tiêu:** Thiết lập bảng quy chuẩn thiết kế độc lập hoàn toàn (Design Tokens, Typography Scale, Spacing, Surface, Shared Components & Art Viewer) cho toàn bộ phân hệ thuộc STARFRONT UI V2.

---

## 1. Triết Lý Thiết Kế Cốt Lõi (Core Design Philosophy)

1. **Modern Aerospace High-Tech (Khoa Học Viễn Tưởng Hàng Không Vũ Trụ):**
   - Thay thế toàn bộ phong cách CRT xanh lá cũ kỹ bằng tông màu không gian sâu thẳm (`#05070D`), sắc lạnh, sang trọng với các điểm nhấn công nghệ cao: Cyan Hào Quang (`#06B6D4`), Teal Năng Lượng (`#14B8A6`), và Bạc Ánh Thép (`#E2E8F0`).
2. **Kỷ Luật Không Dùng Pill Tĩnh Cho Dữ Liệu (Zero-Pill Discipline):**
   - Tuân thủ nghiêm ngặt: Tuyệt đối không bao bọc metadata, nhãn phân loại, ngày tháng, trạng thái, thuộc tính tĩnh trong các khối bo tròn dạng viên thuốc (pill) hoặc chip viền màu sặc sỡ.
   - Metadata phải được hiển thị dưới dạng chữ thanh mảnh, sạch sẽ, phân tách bằng các ký tự tinh tế (`·`, `/`, `-`).
   - Dạng pill hoặc segmented controls **chỉ được phép sử dụng cho các nút bấm điều khiển tương tác luân chuyển trạng thái** (ví dụ: chuyển chế độ xem Info / Art).
3. **Ưu Tiên Khả Năng Đọc Thoải Mái (Readability & Typography First):**
   - Tuyệt đối cấm cỡ chữ quá nhỏ để cố dồn ép thông tin.
   - Văn bản đọc Story/Biography phải đạt độ chuẩn như tạp chí cao cấp hoặc sách điện tử hiện đại.
4. **Chuẩn Công Thái Học Di Động (Mobile Ergonomics):**
   - Mọi nút bấm, tab, item trong danh sách tương tác trên màn hình cảm ứng phải đạt vùng bấm tối thiểu **44 × 44px**.

---

## 2. Bảng Token Thiết Kế (Design Tokens)

### 2.1. Bảng Màu Không Gian & Tương Phản (Color & Contrast Tokens)
Áp dụng công thức phối màu 60-30-10 và chuẩn tiếp cận WCAG AA (tương phản văn bản $\ge 4.5:1$):

| Nhóm Token | Tên Mã / Hex | Tỷ Lệ | Ứng Dụng Trong Giao Diện |
|---|---|---|---|
| **Canvas Deep Space** | `#05070D` / `bg-[#05070D]` | 60% | Nền canvas toàn bộ ứng dụng, hố đen vũ trụ vô tận. |
| **Surface Raised** | `#0B1120` / `bg-slate-950/90` | 30% | Nền Sidebar, Topbar, thanh công cụ. |
| **Surface Overlay** | `#0F172A` / `bg-slate-900/80` | 30% | Thẻ nội dung (Cards), Modal, Drawer; mờ kính `backdrop-blur-md`. |
| **Border Subtle** | `rgba(51, 65, 85, 0.7)` | — | Đường viền mảnh ngăn cách panel (`border-slate-800`). |
| **Border Active** | `#06B6D4` / `border-cyan-500` | — | Viền trạng thái được chọn, focus ring. |
| **Accent Primary** | `#06B6D4` (Cyan-500) | 10% | Nút hành động chính, thanh năng lượng, aura viền. |
| **Accent Secondary**| `#14B8A6` (Teal-500) | — | Chỉ số cứu hộ, hồi phục, khiên trường lực. |
| **Accent Critical** | `#EF4444` (Red-500) | — | Cảnh báo hỏng hóc, trạng thái nguy cấp, nút hủy. |
| **Text Primary** | `#F8FAFC` (Slate-50) | — | Tiêu đề trang, tên nhân vật, số liệu trọng yếu (Tương phản 16:1). |
| **Text Secondary**| `#CBD5E1` (Slate-300) | — | Văn bản đọc Story, văn bản mô tả chính (Tương phản 11:1). |
| **Text Muted** | `#94A3B8` (Slate-400) | — | Metadata, callsign, ghi chú kỹ thuật (Tương phản 7:1). |

### 2.2. Thang Đo Kiểu Chữ (Typography Scale)
Đảm bảo tính phân cấp rõ rệt và độ dễ đọc vượt trội:

| Cấp Bậc (Role) | Cỡ Chữ (Size) | Chiều Cao Dòng (Leading) | Độ Dày (Weight) | Áp Dụng |
|---|---|---|---|---|
| **Display 1** | 32px - 36px | 1.15 | Black / 900 | Tiêu đề lớn màn hình chào, tên nhân vật chính |
| **Heading 1** | 24px - 26px | 1.25 | ExtraBold / 800 | Tiêu đề trang, tiêu đề Hero Banner |
| **Heading 2** | 18px - 20px | 1.30 | Bold / 700 | Tiêu đề phân nhóm danh mục, tên Tab lớn |
| **Story / Narrative** | **17px - 18px** | **1.70 (Thoáng)** | **Normal / 400** | **Toàn văn tiểu sử, chương biên niên ký, cốt truyện** |
| **Body Primary** | **16px** | **1.60** | **Normal / 400** | **Văn bản nội dung chính, mô tả thẻ, thông báo** |
| **Secondary / Meta**| **14px** | **1.45** | **Medium / 500** | **Nhãn mô tả phụ, thông số kỹ thuật, thuộc tính** |
| **Data / Numbers** | 13px - 14px | 1.20 | SemiBold / Monospace | Chỉ số tác chiến, số đếm trang bị, tọa độ |
| **Caption / Tag** | 12px - 13px | 1.10 | Bold / Uppercase | Mã hiệu phân hệ, phiên bản build (Tối thiểu 12px) |

*Cấm tuyệt đối: Không sử dụng cỡ chữ dưới 12px trong toàn bộ giao diện V2.*

### 2.3. Quy Chuẩn Không Gian & Bo Góc (Spacing & Radius Math)
- **Hệ lưới Spacing 4px/8px:** `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-5` (20px), `p-6` (24px).
- **Quy tắc toán học bo góc lồng nhau (Nested Radius):**
  $$r_{\text{inner}} = r_{\text{outer}} - \text{padding}$$
  - Container ngoài `rounded-2xl` (16px) với padding `p-3` (12px) $\rightarrow$ thành phần con bên trong bo `rounded-sm` (4px).
  - Container ngoài `rounded-xl` (12px) với padding `p-2` (8px) $\rightarrow$ thành phần con bo `rounded-xs` (4px).
- **Hệ thống Z-Index:**
  - `z-0`: Canvas nền vũ trụ / Ambient glow.
  - `z-10`: Nội dung trang và các thẻ Surface.
  - `z-20`: Header bar, Sidebar, Floating Action Buttons.
  - `z-30`: Mobile Bottom Navigation / Fixed Overlays.
  - `z-40`: Modal Dialogs, Drawers.
  - `z-50`: Fullscreen Shared Art Viewer, Lightbox, Toast Notifications.

---

## 3. Đặc Tả Thư Viện Thành Phần Dùng Chung (Shared UI Components)

### 3.1. Button (`components/game/v2/ui/button.tsx`)
- **Biến thể:**
  - `primary`: Nền gradient Cyan-500 sang Teal-400, chữ đen `font-black`, hiệu ứng tỏa sáng `shadow-[0_0_15px_rgba(6,182,212,0.4)]`.
  - `secondary`: Nền `bg-slate-900`, viền `border-slate-700`, chữ `text-slate-200`, hover sáng viền.
  - `ghost`: Trong suốt, hover nền `bg-slate-800/60`, chữ `text-slate-300`.
  - `destructive`: Viền đỏ `border-red-500/50`, nền `bg-red-950/40`, chữ `text-red-300`.
- **Kích thước Touch Target:**
  - Desktop: Tối thiểu $40\text{px}$ chiều cao.
  - Mobile: **Tối thiểu $44\text{px}$ chiều cao và chiều rộng**, `active:scale-95` phản hồi chạm tức thì.

### 3.2. Tabs (`components/game/v2/ui/tabs.tsx`)
- **Biến thể 1 (Segmented Controls):** Dành cho chuyển đổi trạng thái xem luân phiên (ví dụ: `[ 🖼️ Xem Tranh ]` và `[ 📄 Xem Hồ Sơ ]`). Nền rãnh trượt `bg-slate-900/90`, tab active nhận nền `bg-cyan-500 text-black font-black` với bóng đổ nổi.
- **Biến thể 2 (Underline Sci-Fi):** Dành cho các phân mục nội dung dài (`OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`). Chữ in hoa thanh thoát, vạch chân phát sáng cyan khi kích hoạt.

### 3.3. Card & Glass Surface (`components/game/v2/ui/card.tsx`)
- Lớp nền mờ kính `backdrop-blur-md bg-slate-900/75`.
- Viền mảnh `border border-slate-800/80` chống chói.
- Header thẻ có vạch điểm nhấn công nghệ (accent bar) thanh mảnh.

### 3.4. Dialog & Modal (`components/game/v2/ui/dialog.tsx`)
- Lớp phủ nền mờ sâu `bg-black/80 backdrop-blur-md`.
- Hộp thoại nổi có viền công nghệ `border-cyan-500/40`.
- Nút đóng `X` kích thước $\ge 44\text{px}$ ở góc trên bên phải, hỗ trợ phím `Esc` và tự động bẫy tiêu điểm (focus trap) để đạt chuẩn trợ năng.

### 3.5. Drawer & Sheet (`components/game/v2/ui/drawer.tsx`)
- Tối ưu riêng cho trải nghiệm vuốt chạm trên smartphone.
- Trượt từ cạnh dưới hoặc cạnh trái màn hình, hỗ trợ thanh kéo drag handle và cử chỉ vuốt để đóng.

---

## 4. Đặc Tả Trình Soi Tranh Dùng Chung (Shared Art Viewer)

Module độc lập tại `components/game/v2/art-viewer/shared-art-viewer.tsx`:

1. **Khả Năng Toàn Màn Hình Tuyệt Đối (True Fullscreen):**
   - Kích hoạt thông qua HTML5 Fullscreen API trên trình duyệt hỗ trợ, kèm lớp phủ toàn màn hình `fixed inset-0 z-50 bg-[#030508]`.
2. **Nút Đóng Luôn Thấy (Fixed Exit Button):**
   - Nút `X` cố định tại góc trên bên phải màn hình (`top-4 right-4`), có nền đen mờ kính `bg-slate-950/85 border border-slate-700`, không bao giờ bị cuộn mất hoặc che khuất bởi hình ảnh.
3. **Cơ Chế Phóng To & Kéo Rê (Pan & Zoom Engine):**
   - Tỷ lệ zoom mượt mà: `1.0x`, `1.5x`, `2.0x`, `3.0x`, `4.0x`.
   - Khi tỷ lệ zoom $> 1.0x$: Cho phép kéo rê chuột (drag-to-pan) hoặc trượt ngón tay để soi các chi tiết nét vẽ, trang phục và phụ kiện.
   - Nút **"1x Reset"** đưa tranh về trạng thái bao quát ban đầu ngay tức khắc.
4. **Cử Chỉ Chạm Đa Điểm & Bàn Phím:**
   - Hỗ trợ chụm phóng to (pinch-to-zoom) hai ngón tay trên điện thoại.
   - Chạm đúp (double-tap) để phóng to nhanh lên 2x tại vị trí chạm.
   - Phím tắt bàn phím: `Esc` (Đóng), `+`/`-` (Zoom), `Mũi tên trái/phải` (Chuyển tranh kế tiếp trong bộ sưu tập).
5. **Chính Sách WebP & Xử Lý Ảnh Lớn:**
   - Ưu tiên hiển thị ảnh `.webp` đã xác minh.
   - Trạng thái nạp ảnh có skeleton loader mờ kính, chống hiện tượng giật layout (layout shift).
