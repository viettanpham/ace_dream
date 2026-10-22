# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# CHARACTER CATEGORY / PILOT PROFILE UI FEATURE & UI REFERENCE (V2 DESIGN SYSTEM ALIGNED)

**Ngày cập nhật:** 2026-10-22  
**Chế độ:** DEFINE / PLAN ONLY (Cập nhật chuẩn hóa theo Design System V2 & Báo Cáo Blocker Concept)  
**Tài liệu tham chiếu cốt lõi:**
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_UI_V2_DESIGN_SYSTEM.md` (Design System Baseline V2)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_CHARACTER_CATEGORY_PROFILE_UI_CONCEPT.md` (Hợp đồng ý tưởng đã duyệt)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_UI_REBUILD_CHECKPOINT_2026-10-22.md` (Quy định xây dựng UI V2)
- `docs/progress/FND8/STARFRONT_HANDOFF_FND8_2026-10-22_UI_POLICY_DELTA.md` (Chính sách preview-first)
- `docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` (Dữ liệu lore, chỉ số & cốt truyện)
- `docs/art-direction/PILOT/VALENTINE/valentine_assets_manifest.json` (Hồ sơ danh mục artwork)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md` (12 Class Persona V2)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md` (Danh mục Trait V2 chuẩn)

---

## 1. Tình Trạng Ảnh Concept & Cảnh Báo BLOCKER (Concept Images Status)

> [!CAUTION]
> ### ⚠️ BLOCKER QUAN TRỌNG: THIẾU 3 ẢNH CONCEPT PNG THỰC TẾ TRÊN ĐĨA
> Theo quy tắc kiểm toán thực địa số 5: *"Đối chiếu ba ảnh concept PNG thực tế tại `docs/art-direction/UI_CONCEPTS/`. Nếu thiếu hoặc không mở được, đánh dấu BLOCKER; không tự suy diễn concept từ mô tả chữ."*
> 
> **Kết Quả Rà Soát Thực Tế:**
> - Thư mục `docs/art-direction/UI_CONCEPTS/` **chưa tồn tại** trong container.
> - Cả 3 file PNG concept được phê duyệt:
>   1. `FND8_823_CHARACTER_CATEGORY_PROFILE_DESKTOP_APPROVED.png` (Desktop reference)
>   2. `FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_APPROVED.png` (Mobile paired reference)
>   3. `FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_INFO_VIEW_REFERENCE.png` (Mobile info reference)
>   hiện **KHÔNG có trên hệ thống tệp** (chúng chỉ tồn tại dưới dạng mã định danh `file_00000000...` trong thư viện đính kèm bên ngoài).
> - **Quyết Định Kỹ Thuật:**
>   - Đánh dấu **BLOCKER** cho giai đoạn chuyển sang `IMPLEMENT`.
>   - Tuyệt đối không tự suy diễn hay tự vẽ lại layout từ mô tả chữ.
>   - Đã chuẩn bị sẵn thư mục `docs/art-direction/UI_CONCEPTS/` để tiếp nhận 3 file ảnh vật lý từ người dùng trước khi tiến hành viết mã UI.

---

## 2. Chuẩn Hóa Design System V2 (Design System Alignment)

Giao diện Category/Profile V2 là giao diện mới hoàn toàn, được thiết kế theo các tiêu chuẩn kỹ thuật sau:

### 2.1 Cô Lập Hoàn Toàn Khỏi Legacy V1 (Clean Slate)
- **Không kế thừa:** Tuyệt đối không import, kế thừa hay bọc lại CSS, class, hoặc font monospace xanh lá CRT scanline của V1 cũ (`components/game/pilot-gallery.tsx`).
- **Phong cách thị giác:** Sci-Fi Aerospace hiện đại: tông nền sẫm sâu thẳm (`bg-slate-950`), bề mặt bán trong suốt (`bg-slate-900/80 backdrop-blur-md`), đường viền công nghệ tinh tế (`border-slate-800`).

### 2.2 Quy Chuẩn Đọc & Kiểu Chữ (Legibility & Typography)
- **Ưu tiên khả năng đọc tuyệt đối:** Không dùng font quá nhỏ để nhồi nhét dữ liệu; không dùng cỡ chữ dưới 12px.
- **Story Reader:**
  - Cỡ chữ thân bài: **15px - 16px**, khoảng cách dòng (line-height) rộng rãi **1.65** (`leading-relaxed`).
  - Độ dài dòng tối ưu: **65 - 75 ký tự (ch)** (`max-w-prose`) giúp người đọc theo dõi truyện dài của phi công dễ dàng mà không bị mỏi mắt.
  - Tương phản màu chữ: Văn bản chính đạt màu `#CBD5E1` (Slate-300) đến `#F8FAFC` (Slate-50) trên nền sẫm `#070A12`, tỷ lệ tương phản vượt chuẩn WCAG AA (> 10:1).
- **Phân tách Quote và Short Description:**
  - `characterQuote`: Đoạn văn bản nghiêng 15px, có border-l-2 màu Cyan/Teal nổi bật, hiển thị danh xưng triết lý sống của nhân vật.
  - `shortDescription`: Khối mô tả độc lập 14px Slate-300, giải thích bối cảnh và mâu thuẫn nội tâm của phi công.
- **Chỉ số 6 thuộc tính (Stats Grid):**
  - Hiển thị cỡ chữ 14px - 15px với tính năng `tabular-nums` để số liệu thẳng hàng, rõ ràng.

### 2.3 Tiêu Chuẩn Kích Thước Vùng Chạm Cảm Ứng Mobile (Touch Targets)
- Mọi nút bấm, Tab, Toggle chuyển bối cảnh, icon điều khiển trên giao diện Mobile đều phải có diện tích chạm tối thiểu **44 × 44px**.
- Thanh Tab mobile dạng Segmented có chiều cao tối thiểu 48px, các nút chuyển đổi bối cảnh dạng Floating Bar có kích thước tối thiểu 48 × 48px với khoảng cách an toàn tránh bấm nhầm.

### 2.4 Ranh Giới Phạm Vi & Điều Hướng (Scope Boundary)
- Không can thiệp vào thanh điều hướng toàn cầu (Global Navigation) hay menu game tổng thể (sẽ được làm ở phase riêng).
- Chỉ bổ sung một điểm vào (entry point) an toàn và tối thiểu trong `components/game/starfront-shell.tsx` để người dùng thử nghiệm UI V2.

---

## 3. Kiến Trúc Cung Ứng Dữ Liệu: Data Adapter & Không Tự Tạo Dữ Liệu Gameplay

### 3.1 Data Adapter Pattern (`lib/game/v2/character-profile-data.ts`)
- Dựng UI mới **không đồng nghĩa** với việc tạo ra hệ thống tính toán thuộc tính mới.
- UI V2 sử dụng tầng **Data Access Adapter** thuần túy để trích xuất dữ liệu từ các tài liệu FND-8 chuẩn đã duyệt trong repository:
  - `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md` (12 Class Persona, phân bổ chuẩn 20 điểm thuộc tính).
  - `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md` (Danh mục Trait chuẩn).
  - `docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` (Thông tin nhân thân, câu trích dẫn, mô tả ngắn, chương truyện).
- **Không tự bịa gameplay:** Không sáng tác công thức tính sát thương, tỷ lệ né, hay stats cân bằng chiến đấu mới.
- **Tương thích GEAR:** Tab `GEAR COMPAT` hiển thị đánh giá tương thích theo hồ sơ xếp hạng (S/B/C rank) kèm ghi chú giao diện placeholder mà không tạo động cơ tính toán trang bị mới.
- **Sẵn sàng tích hợp FND-1:** Adapter được cấu trúc theo dạng Provider để khi FND-8 được đăng ký chính thức vào `CatalogRegistry` (`lib/game/world/catalog/registry.ts`), UI V2 sẽ kết nối trực tiếp mà không cần sửa đổi layout.

---

## 4. Chính Sách Tài Nguyên Hình Ảnh & Thư Viện WebP

### 4.1 Quy Tắc Không Sử Dụng `sourceFilename`
- `sourceFilename` (ví dụ: `dạ_tiệc_vũ_trụ_xa_hoa_sắc_đỏ.png`) chỉ là tên file ảnh gốc bằng tiếng Việt trong `valentine_assets_manifest.json` nhằm phục vụ truy vết nguồn gốc artwork (provenance record).
- **CẤM TUYỆT ĐỐI:** Không dùng `sourceFilename` để tạo đường dẫn URL tải ảnh trên web (`/images/...`).
- Giữ nguyên `valentine_assets_manifest.json` nguyên vẹn; chỉ sử dụng `assetId` và `path` hợp lệ.

### 4.2 Chính Sách WebP & Quy Trình Kiểm Tra 3 Bước (Zero Broken Images)
- **Ưu tiên WebP:** Mọi artwork hiển thị trong runtime UI đều ưu tiên định dạng `.webp`.
- **Hiện trạng vật lý trên đĩa:**
  - 2 file WebP thật đã xác minh:
    1. `/images/valentine-fullbody.webp` (228 KB) — Tranh toàn thân chính thức.
    2. `/images/valentine-portrait.webp` (59 KB) — Chân dung đại diện.
  - 28 artwork còn lại trong manifest: Chưa có file vật lý trong `public/images/`.
- **Xử lý giao diện Gallery V2:**
  - Không tạo thẻ `<img>` trỏ tới 28 ảnh thiếu.
  - Hiển thị 28 mục này dưới dạng **Thẻ Hồ Sơ Lưu Trữ (Archive Pending Card)**: hiển thị tên phân loại trang phục, metadata danh mục và nhãn `Chờ Đồng Bộ WebP`. Khi người dùng click, hiển thị bảng thông tin chi tiết mà không gây lỗi HTTP 404 trên Network.

---

## 5. Kiến Trúc Bố Cục Desktop & Mobile

### 5.1 Desktop Layout (1440px Baseline)
1. **Cột Trái (280px - 300px):**
   - Danh sách 12 Archetype V2 (4 Nam, 8 Nữ) kèm thumbnail WebP và bộ lọc vai trò.
2. **Khu Vực Trung Tâm (Showcase & 2 Controls Bối Cảnh):**
   - Tranh toàn thân sắc nét.
   - **Hai điều khiển bối cảnh (Background / Showcase Controls):**
     - Nút bên trái: Bối Cảnh A (Trạm Y Tế Elysia Hangar).
     - Nút bên phải: Bối Cảnh B (Buồng Lái Hologram HUD).
   - Nút mở Trình Soi Tranh (Artwork Lightbox Inspector) hỗ trợ Zoom 1x-4x, Pan chuột, phím Esc.
3. **Cột Phải (420px - 460px):**
   - Header nhận diện: Tên, Callsign, Danh hiệu, Vai trò.
   - Hai khối văn bản riêng biệt: `characterQuote` và `shortDescription`.
   - 4 Tabs chuyển đổi:
     - **OVERVIEW:** Bảng 6 thuộc tính chuẩn (tổng = 20), thẻ Trait V2 kèm tooltip, thông tin nhân thân.
     - **STORY:** Tóm tắt tiểu sử, Chương 01 toàn văn tiếng Việt (APPROVED), Chương 02–04 (APPROVED tóm tắt), Chương 05–06 (PROVISIONAL), Chương 07–10 (HOLD / Niêm phong).
     - **GEAR COMPAT:** Khung tương thích 3 lớp Aegis, Vanguard, Falcon.
     - **GALLERY:** Lưới 2 ảnh WebP thật + Thẻ lưu trữ Archive cho 28 ảnh chưa đồng bộ WebP.

### 5.2 Mobile Layout (375px–430px Dedicated Paired Architecture)
1. **Trạng Thái 1: Mobile Info View:**
   - Top Bar 56px với nút đổi nhân vật, tiêu đề và nút chuyển nhanh sang Art View.
   - Header nhân vật thu gọn, quote và short description tách biệt.
   - Segmented Tab Bar 4 tab, touch target >= 44px.
   - Nội dung tab cuộn dọc tự nhiên, cỡ chữ 15px dễ đọc.
2. **Trạng Thái 2: Mobile Art View:**
   - Hiển thị tranh toàn thân tràn màn hình.
   - **Floating Bar đáy:** Chứa 2 nút chuyển đổi bối cảnh (Background A / B) kích thước chạm chuẩn >= 44px.
   - Nút Zoom in, Zoom out, Reset và nút quay lại Info View.
   - Hỗ trợ cảm ứng double-tap và pinch-to-zoom.

---

## 6. Bản Đồ Dữ Liệu Valentine Chuẩn (Data Mapping)

| Trường Giao Diện (UI Field) | Giá Trị Thực Tế Được Phê Duyệt | Nguồn Canonical Trong Repo | Trạng Thái Kiểm Chứng |
|---|---|---|---|
| `classId` | `"valentine"` | `docs/.../valentine_assets_manifest.json` | Đã xác minh |
| `classCharacterName` | Valentine Aurelia Vance | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `callsign` | Mercy Wing | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `title` | Ánh Sáng Cuối Cùng (The Last Light) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `role` | Quân Y Chiến Trường (Combat Medic) · Cứu Hộ (Rescue) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `characterQuote` | “Chừng nào còn một tín hiệu cầu cứu, tôi sẽ không bỏ lại ai phía sau.” | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | **Khối riêng biệt 1** |
| `shortDescription` | Một nữ phi công cứu hộ luôn nở nụ cười dịu dàng, ngay cả khi bản thân cô vẫn chưa tha thứ cho một quyết định trong quá khứ. | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | **Khối riêng biệt 2** |
| `baseStats` (Total: 20) | ATK: 2, DEF: 2, AGI: 2, ENE: 6, SHD: 6, LUK: 2 | `FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md` | Đã duyệt canonical |
| `traits` | 1. Bàn Tay Cứu Hộ (`pilot_trait_field_medic`)<br>2. Mái Khiên Nhân Ái (`pilot_trait_safeguard`) | `FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md` | Đã duyệt canonical |
| `story.chapter01` | "Ánh sáng cuối cùng tại Elysia" (Toàn văn) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt nội dung |
| `story.chapters02_04`| Tiêu đề & Tóm tắt | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | APPROVED (Chờ văn xuôi) |
| `story.chapters05_06`| Tiêu đề & Trạng thái | `valentine_assets_manifest.json` | PROVISIONAL |
| `story.chapters07_10`| Niêm phong / Bảo mật | `valentine_assets_manifest.json` | HOLD (Không hiện đã mở) |
| `artwork.fullbody` | `/images/valentine-fullbody.webp` | `public/images/valentine-fullbody.webp` | **TỒN TẠI THẬT TRÊN ĐĨA (228 KB)** |
| `artwork.portrait` | `/images/valentine-portrait.webp` | `public/images/valentine-portrait.webp` | **TỒN TẠI THẬT TRÊN ĐĨA (59 KB)** |
| `artwork.gallery` | 28 ảnh khác trong manifest | `valentine_assets_manifest.json` | **CHƯA CÓ TRÊN ĐĨA** (Thẻ Archive Fallback) |
