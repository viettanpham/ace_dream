# STARFRONT — Danh Mục Quản Lý & Đối Chiếu Tài Nguyên Hình Ảnh (Phase 5.9 Asset Manifest)

*Ngày cập nhật: 11/10/2026*  
*Chế độ kiểm định:* **Đối chiếu thực tế Source Code & Trạng thái Quota Sinh Ảnh**

---

## 1. Trạng Thái Tổng Quát Tài Nguyên Hình Ảnh (General Asset Status)

- **Chỉ tiêu Phase 5.9**:
  - Regenerate hình ảnh mecha sci-fi anime chất lượng cao, đủ chi tiết cho toàn bộ Gear Models (`Vanguard`, `Falcon`, `Aegis`).
  - Regenerate hình ảnh nhân vật full-body kích thước lớn, chi tiết trang phục quân sự sci-fi cao cấp cho 4 phi công (`Marcus`, `Valentine`, `Levi Reed / Alviss`, `Eric`).
- **Trạng thái thực tế từ AI Studio Image Generation Tool (`generate_image`)**:
  - **Lỗi kỹ thuật**: `generic::resource_exhausted: You exceeded your current quota, please check your plan and billing details (HTTP 429)`.
  - **Chính sách xử lý nghiêm ngặt**:
    - **TUYỆT ĐỐI KHÔNG** đánh dấu các asset ảnh chất lượng cao là "Đã hoàn thành" khi chúng chỉ đang dùng SVG vector fallback hoặc wrapper nhúng portrait.
    - **ĐÁNH DẤU CHÍNH THỨC**: Toàn bộ các ảnh mecha chất lượng cao và ảnh full-body nhân vật chất lượng cao ở trạng thái **`PENDING`** (Chờ hồi phục quota mô hình / Nạp ảnh từ bên ngoài).
    - **Cơ chế Fallback bảo đảm Runtime**: Giữ nguyên bộ file SVG vector và wrapper nhúng portrait hiện hữu trong `/public/images/` để đảm bảo Next.js build không lỗi và giao diện người dùng không bị vỡ giao diện hay broken images.

---

## 2. Bảng Đối Chiếu Chi Tiết Từng Asset (Asset Registry & Verification Table)

### 2.1. Cơ Giáp (Gear Models)

| Gear ID | Tên Cơ Giáp | Asset Target Yêu Cầu | Đường Dẫn Thực Tế | Định Dạng Thực Tế | Dung Lượng File | Trạng Thái Fallback UI | Trạng Thái Regeneration Target |
|---|---|---|---|---|---|---|---|
| `vanguard` | Vanguard Mk-I | Ảnh Mecha Assault 16:9 Chất Lượng Cao | `/public/images/vanguard.svg` | SVG Vector | 4.4 KB | `INTEGRATED & VERIFIED` (Hiển thị mượt mà trên UI) | **`PENDING`** *(Chờ Quota AI Studio)* |
| `falcon` | Falcon Interceptor | Ảnh Mecha Speed Infiltrator 16:9 Cao Cấp | `/public/images/falcon.svg` | SVG Vector | 4.3 KB | `INTEGRATED & VERIFIED` (Hiển thị mượt mà trên UI) | **`PENDING`** *(Chờ Quota AI Studio)* |
| `aegis` | Aegis Bastion | Ảnh Mecha Siege Walker 16:9 Cao Cấp | `/public/images/aegis.svg` | SVG Vector | 5.1 KB | `INTEGRATED & VERIFIED` (Hiển thị mượt mà trên UI) | **`PENDING`** *(Chờ Quota AI Studio)* |

### 2.2. Phi Công (Pilots & Characters)

| Pilot ID | Tên Phi Công | Hạng Mục Asset | Đường Dẫn File Thực Tế | Định Dạng & Kích Thước | Dung Lượng File | Trạng Thái Tích Hợp UI | Trạng Thái Regeneration Target |
|---|---|---|---|---|---|---|---|
| `marcus` | Marcus Thorne | Chân Dung (Portrait) | `/public/images/marcus-portrait.png` (`.jpg`) | Raster (1024x1024) | 769 KB | `INTEGRATED & VERIFIED` | `GENERATED & SAVED` (Đạt chuẩn) |
| `marcus` | Marcus Thorne | Toàn Thân (Full-Body) | `/public/images/marcus-fullbody.svg` | SVG nhúng Portrait | 208 Bytes | `INTEGRATED & VERIFIED` (Fallback) | **`PENDING`** *(Chờ Quota AI Studio)* |
| `valentine` | Valentine Reyes | Chân Dung (Portrait) | `/public/images/valentine-portrait.png` (`.jpg`) | Raster (1024x1024) | 648 KB | `INTEGRATED & VERIFIED` | `GENERATED & SAVED` (Đạt chuẩn) |
| `valentine` | Valentine Reyes | Toàn Thân (Full-Body) | `/public/images/valentine-fullbody.svg` | SVG nhúng Portrait | 211 Bytes | `INTEGRATED & VERIFIED` (Fallback) | **`PENDING`** *(Chờ Quota AI Studio)* |
| `alviss` | Levi Reed (Alviss) | Chân Dung (Portrait) | `/public/images/alviss-portrait.png` (`.jpg`) | Raster (1024x1024) | 936 KB | `INTEGRATED & VERIFIED` | `GENERATED & SAVED` (Đạt chuẩn) |
| `alviss` | Levi Reed (Alviss) | Toàn Thân (Full-Body) | `/public/images/levi-fullbody.svg` | SVG nhúng Portrait | 208 Bytes | `INTEGRATED & VERIFIED` (Fallback) | **`PENDING`** *(Chờ Quota AI Studio)* |
| `eric` | Eric Vance | Chân Dung (Portrait) | `/public/images/eric-portrait.png` (`.jpg`) | Raster (1024x1024) | 776 KB | `INTEGRATED & VERIFIED` | `GENERATED & SAVED` (Đạt chuẩn) |
| `eric` | Eric Vance | Toàn Thân (Full-Body) | `/public/images/eric-fullbody.svg` | SVG nhúng Portrait | 206 Bytes | `INTEGRATED & VERIFIED` (Fallback) | **`PENDING`** *(Chờ Quota AI Studio)* |

---

## 3. Tổng Hợp Số Lượng & Phân Loại Trạng Thái

- **Tổng số Asset Mục Tiêu**: 11 items (3 Gear Models, 4 Pilot Portraits, 4 Pilot Full-Body Artworks).
- **Trạng thái chi tiết**:
  - `GENERATED / SAVED / VERIFIED` (Đạt chuẩn chất lượng cao): **4/11 items** (4 ảnh Portrait phi công chất lượng cao dạng raster 1024x1024: Marcus 769KB, Valentine 648KB, Levi/Alviss 936KB, Eric 776KB).
  - `INTEGRATED AS FALLBACK` (Đang tích hợp trong UI dưới dạng vector SVG an toàn): **7/11 items** (3 Gear SVGs, 4 Full-body wrapper SVGs).
  - `PENDING` (Đang chờ công cụ sinh ảnh hồi phục quota để sinh ảnh độ phân giải cao thay thế hoàn toàn fallback): **7/11 items** (3 Gear Mecha Artworks, 4 Full-Body Pilot Artworks).

---

## 4. Kế Hoạch Thay Thế Khi Hồi Phục Quota

Ngay khi quota của công cụ `generate_image` được cấp lại:
1. Sinh 3 ảnh Gear 16:9: `vanguard_gear.png`, `falcon_gear.png`, `aegis_gear.png` lưu vào `/public/images/`.
2. Sinh 4 ảnh Full-Body 9:16: `marcus_fullbody.png`, `valentine_fullbody.png`, `levi_fullbody.png`, `eric_fullbody.png` lưu vào `/public/images/`.
3. Cập nhật trường `illustration` trong `lib/game/data.ts: STARFRONT_GEAR_DEFS` và trường `fullBodyAvatar` trong `STARFRONT_PILOTS`.
4. Chạy kiểm tra hiển thị trên `CharacterGearSelect` và `CombatArena`.
