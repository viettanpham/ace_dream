# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# CHARACTER CATEGORY / PILOT PROFILE UI FEATURE & UI REFERENCE (REVISED)

**Ngày cập nhật:** 2026-10-22  
**Chế độ:** DEFINE / PLAN ONLY (Rà soát & cập nhật theo kết quả audit mã nguồn thực tế)  
**Tài liệu tham chiếu gốc:**
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_CHARACTER_CATEGORY_PROFILE_UI_CONCEPT.md`
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_UI_REBUILD_CHECKPOINT_2026-10-22.md`
- `docs/progress/FND8/STARFRONT_HANDOFF_FND8_2026-10-22_UI_POLICY_DELTA.md`
- `docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`
- `docs/art-direction/PILOT/VALENTINE/valentine_assets_manifest.json`
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md`
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md`
- `lib/game/world/catalog/registry.ts` & `lib/game/world/bootstrap.ts` (FND-1 Master Catalog Architecture)

---

## 1. Mục Tiêu & Ranh Giới Tính Năng (Scope & Boundaries)

### 1.1 Mục Tiêu
Thiết lập nền tảng giao diện V2 hoàn toàn mới cho **Hồ Sơ Nhân Vật / Danh Mục Phi Công (Character Category / Pilot Profile UI Foundation)**:
- Dựng UI mới, sạch, không chắp vá hoặc kế thừa layout/CSS cũ bị rối.
- Hỗ trợ đồng thời cả **Desktop (1440px wide layout)** và **Mobile (375px–430px smartphone layout)** ngay trong Phase 1.
- Tích hợp nhân vật phi công chuẩn đầu tiên: **Valentine** bằng dữ liệu lore, chỉ số 20 điểm canonical, Trait V2 và artwork đã kiểm chứng trên đĩa.
- Giữ nguyên toàn bộ UI V1 và routes cũ; tuyệt đối không xóa code dùng chung khi chưa có kế hoạch cutover chính thức.

### 1.2 Ranh Giới Nghiêm Ngặt (Exclusions)
- **KHÔNG** triển khai Character Selection Wizard / tạo phi công người chơi (đây là scope riêng biệt sau này).
- **KHÔNG** xóa hay sửa các file UI cũ: `components/game/pilot-gallery.tsx`, `components/game/character-gear-select.tsx`, `components/game/starfront-home.tsx`.
- **KHÔNG** thay đổi cân bằng gameplay, công thức chiến đấu, hay tiến trình FND-8.3.2.x (vẫn giữ trạng thái HOLD).
- **KHÔNG** tự bịa lore, chỉ số, Traits, tương thích GEAR hoặc đường dẫn ảnh không có thật trên đĩa.
- **KHÔNG** tạo thêm ảnh mới (no image generation trong phase này).

---

## 2. Nguồn Dữ Liệu Canonical & Kiến Trúc FND-1 / FND-8 (Data Integration Clarity)

### 2.1 Phân Biệt Giữa Dựng UI Mới & Nguồn Dữ Liệu
- Dựng UI mới **không đồng nghĩa** với việc tự tạo ra một bộ chỉ số hay công thức gameplay mới.
- Kết quả audit thực tế mã nguồn:
  - `lib/game/world/catalog/registry.ts` và `lib/game/world/bootstrap.ts` là hệ thống **FND-1 Catalog Registry** quản lý các master catalog (FND-2 Progression, FND-3 Decision, FND-4 Population, FND-5 Building, FND-6 Base, FND-7 Fleet).
  - Phân hệ nhân vật FND-8 hiện chưa có registry runtime trong `lib/game/world/`, mà được lưu giữ quy chuẩn tại:
    - `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md` (Bảng 12 Class 20 điểm thuộc tính chuẩn).
    - `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md` (Danh mục Trait chuẩn).
    - `docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` (Tiểu sử, trích dẫn, mô tả và chương truyện Valentine).
- **Nguyên tắc không nhân đôi dữ liệu (No Duplication):**
  - Không sao chép hay tự định nghĩa lại các bộ chỉ số xung đột với legacy hay bịa ra công thức mới.
  - Xây dựng tầng cung ứng dữ liệu giao diện (Data Access Provider) bám sát tuyệt đối các tài liệu FND-8 chuẩn nêu trên. Khi FND-8 được tích hợp chính thức vào FND-1 `CatalogRegistry` trong tương lai, giao diện UI V2 sẽ kết nối trực tiếp với FND-1 mà không cần thay đổi cấu trúc component.

### 2.2 Rà Soát Tham Chiếu `valentine_assets_manifest.json`, `sourceFilename`, `path`
- **Kết quả kiểm tra trong toàn bộ mã nguồn (`app/`, `components/`, `lib/`):**
  - `valentine_assets_manifest.json`: **Hoàn toàn KHÔNG được import hay sử dụng** trong bất kỳ file runtime code nào. Nó chỉ tồn tại trong `docs/art-direction/PILOT/VALENTINE/` như một tài liệu danh mục thiết kế.
  - `sourceFilename`: **Hoàn toàn KHÔNG xuất hiện** trong runtime code. Trường này chỉ là tên file ảnh gốc (tiếng Việt, ví dụ: `dạ_tiệc_vũ_trụ_xa_hoa_sắc_đỏ.png`) phục vụ việc truy vết nguồn gốc artwork (provenance record).
  - **Quy tắc tuyệt đối cho UI Gallery V2:**
    - **CẤM** sử dụng `sourceFilename` để tạo URL tải ảnh (sẽ gây 404/vỡ ảnh).
    - Giữ nguyên `sourceFilename` trong `valentine_assets_manifest.json` như hồ sơ lưu trữ truy vết; không tự ý xóa sửa tài liệu gốc đã duyệt.
    - Trong runtime UI, trường tải ảnh chỉ sử dụng `path` đã xác minh trên đĩa.

---

## 3. Chính Sách Định Dạng WebP & Kiểm Tra 3 Bước (WebP Runtime Policy)

1. **Ưu Tiên WebP Tuyệt Đối:**
   - Tất cả ảnh trong runtime Category/Profile UI đều ưu tiên định dạng `.webp` để đảm bảo hiệu năng tải, kích thước nhỏ và hiển thị mượt mà.
2. **Quy Trình Kiểm Tra 3 Bước Trước Khi Tích Hợp (3-Way Verification):**
   - **Bước 1 (Disk Check):** File vật lý có thực sự tồn tại trong `public/images/` không?
   - **Bước 2 (Manifest Check):** File có ID và Category hợp lệ trong hồ sơ artwork không?
   - **Bước 3 (URL Check):** Đường dẫn `/images/<file>.webp` có phản hồi mã HTTP 200 không?
3. **Hiện Trạng Thực Tế Đã Xác Minh:**
   - **2 Ảnh Đạt Chuẩn (Verified & Renderable):**
     - `/images/valentine-fullbody.webp` (228 KB) — Tranh toàn thân chính thức.
     - `/images/valentine-portrait.webp` (59 KB) — Chân dung đại diện.
   - **28 Ảnh Còn Lại Trong Manifest:** Hiện chưa có file vật lý trong `public/images/`.
   - **Xử Lý Giao Diện:** Không tạo thẻ `<img>` trỏ vào 28 file chưa có. Thay vào đó, trong Tab Gallery, hiển thị dưới dạng **Thẻ Hồ Sơ Lưu Trữ (Archive Pending Card)**: hiển thị tên trang phục, phân loại (Dạ tiệc, Học viện, Thường phục...), và nhãn "Chờ Đồng Bộ WebP", đảm bảo 100% không vỡ ảnh (Zero-Broken-Image).

---

## 4. Tình Trạng Ảnh Concept (Concept Images Status)

- **Audit thư mục:** Thư mục `docs/art-direction/UI_CONCEPTS/` hiện không có trong container filesystem.
- **Nguồn gốc tham chiếu:** Ba concept được phê duyệt trong thảo luận gốc:
  - Desktop: `Giao diện chọn nhân vật Valentine tương lai.png` (ID: `file_00000000c5448211822fe20d85b18282`).
  - Mobile Paired: `hồ_sơ_valentine_ánh_sáng_cuối_cùng.png` (ID: `file_00000000149c8211841a4d5c37b01dd4`).
  - Mobile Info: `giao_diện_chọn_nhân_vật_valentine_tương_lai.png` (ID: `file_00000000b928821191fb2c5005032393`).
- **Xử lý:**
  - Không tự ý vẽ lại hay thay thế bằng concept khác.
  - Giữ nguyên hợp đồng bố cục, phân cấp thông tin và tương tác theo đúng văn bản đặc tả đã duyệt.
  - Sẵn sàng đường dẫn chuẩn `docs/art-direction/UI_CONCEPTS/` để đặt 3 file ảnh vào khi người dùng cung cấp tệp từ gói dữ liệu.

---

## 5. Kiến Trúc Giao Diện Desktop vs Mobile (Co-Equal Deliverables)

### 5.1 Bố Cục Desktop (1440px Baseline)
1. **Cột Trái (Character Roster & Category Index):**
   - Danh sách 12 archetype V2 (4 Nam, 8 Nữ) với thumbnail và trạng thái khả dụng.
   - Valentine hiển thị nổi bật là hồ sơ hoàn chỉnh; các nhân vật khác hiển thị thẻ tóm tắt chuẩn hoặc nhãn "Đang cập nhật hồ sơ V2".
   - Bộ lọc phân loại: Tất cả / Nam / Nữ / Vai trò (Cứu hộ, Tiên phong, Cơ động, Phòng thủ...).
2. **Khu Vực Trung Tâm (Showcase Nhân Vật & 2 Toggles Nền):**
   - Tranh toàn thân (`/images/valentine-fullbody.webp`) hiển thị trang trọng, sắc nét.
   - **Hai điều khiển chuyển đổi bối cảnh (Background / Showcase Controls):**
     - Đặt đối xứng ở hai bên khung tranh trung tâm.
     - Cho phép người chơi chuyển đổi giữa 2 môi trường:
       - **Bối Cảnh A (Trạm Y Tế Quỹ Đạo Elysia / Hangar):** Ánh sáng xanh ngọc dịu, trạm cứu hộ không gian.
       - **Bối Cảnh B (Buồng Lái Tác Chiến / Hologram HUD):** Hiển thị màn hình dữ liệu y sinh và trường lực khiên.
     - Nút bấm phóng to / mở Modal Art Inspector độc lập (hỗ trợ zoom 1x-4x, pan, xem chi tiết).
3. **Cột Phải (Hồ Sơ Chi Tiết 4 Tab):**
   - **Header Nhận Diện:**
     - Tên Class / Lore: `Valentine Aurelia Vance`
     - Mật danh (Callsign): `Mercy Wing` · Danh hiệu: `Ánh Sáng Cuối Cùng`
     - Vai trò: `Quân Y Chiến Trường (Combat Medic) · Cứu Hộ (Rescue)`
     - **Hai khối văn bản độc lập:**
       - `characterQuote`: “Chừng nào còn một tín hiệu cầu cứu, tôi sẽ không bỏ lại ai phía sau.”
       - `shortDescription`: “Một nữ phi công cứu hộ luôn nở nụ cười dịu dàng, ngay cả khi bản thân cô vẫn chưa tha thứ cho một quyết định trong quá khứ.”
   - **Hệ Thống 4 Tab:**
     - **Tab 1: OVERVIEW (Tổng Quan)**
       - Bảng 6 thuộc tính gốc V2 (chuẩn 20 điểm): ATK: 2, DEF: 2, AGI: 2, ENE: 6, SHD: 6, LUK: 2.
       - Thẻ hiển thị Traits chính thức: `Bàn Tay Cứu Hộ` (`pilot_trait_field_medic`) và `Mái Khiên Nhân Ái` (`pilot_trait_safeguard`). Kèm Tooltip giải thích chi tiết khi hover/click.
       - Thông tin nhân thân vắn tắt: Tuổi: 24, Xuất thân: Elysia, Đào tạo: Học viện Quân y Không gian, Tính cách: Ấm áp, kiên trì, ân cần.
     - **Tab 2: STORY (Tiểu Sử & Biên Niên)**
       - Tóm tắt tiểu sử (Biography Summary): Quá khứ tại Elysia và quyết định định mệnh.
       - Danh sách chương theo lộ trình 10 chương:
         - Chương 01: "Ánh sáng cuối cùng tại Elysia" (APPROVED — Hiển thị toàn văn tiếng Việt).
         - Chương 02–04: APPROVED (Hiển thị tiêu đề & tóm tắt, nhãn "Đang biên tập nội dung chi tiết").
         - Chương 05–06: PROVISIONAL (Nhãn "Bản thảo sơ bộ — Chưa phát hành chính thức").
         - Chương 07–10: HOLD (Nhãn "Hồ sơ niêm phong / Chưa mở khóa").
     - **Tab 3: GEAR COMPAT (Tương Thích Cơ Giáp)**
       - Hiển thị mức độ tương thích với 3 khung cơ giáp: Aegis (S-Rank, tối ưu), Vanguard (B-Rank), Falcon (C-Rank).
     - **Tab 4: GALLERY (Bộ Sưu Tập Artwork)**
       - Hiển thị 2 ảnh WebP thật đã kiểm chứng trên đĩa.
       - 28 mục còn lại hiển thị qua thẻ "Hồ Sơ Lưu Trữ Chờ Đồng Bộ WebP", click xem thông tin chi tiết.

---

### 5.2 Bố Cục Mobile (Smartphone 375px–430px Dedicated Architecture)
Tổ chức thành **2 trạng thái linh hoạt (Paired States)**:
1. **Trạng Thái 1: Mobile Info View (Xem Thông Tin Hồ Sơ):**
   - Top Bar tinh gọn (<=56px): Nút Quay lại / Đổi nhân vật, Tiêu đề hồ sơ, nút chuyển nhanh sang "Chế Độ Ngắm Tranh".
   - Header nhỏ gọn: Avatar WebP 64px, Tên, Callsign, Danh hiệu và Role tag.
   - Hai khối văn bản riêng biệt: `characterQuote` và `shortDescription`.
   - Segmented Tab Bar 4 Tab (OVERVIEW / STORY / GEAR COMPAT / GALLERY) với touch target >= 44px.
   - Tab OVERVIEW: 6 thanh chỉ số với số liệu tabular-nums; Trait cards có thể tap để xem chi tiết.
2. **Trạng Thái 2: Mobile Art View (Xem Tranh & Bối Cảnh):**
   - Màn hình tràn viền tập trung vào tranh nhân vật chất lượng cao.
   - **Hai điều khiển bối cảnh (Background Toggles) dạng nút cảm ứng nổi (Floating Bar) ở góc dưới**, cho phép chuyển nhanh Bối Cảnh A (Elysia Hangar) và Bối Cảnh B (Buồng Lái HUD).
   - Thanh công cụ đáy chứa nút: Zoom in / Zoom out, Reset góc nhìn, và nút chuyển về Info View.
   - Hỗ trợ cử chỉ cảm ứng: Double-tap để zoom, kéo rê (pan), chạm nút đóng để quay lại Info View.

---

## 6. Bản Đồ Dữ Liệu Valentine Chuẩn (Data Mapping)

| Trường Giao Diện (UI Field) | Giá Trị Thực Tế Được Phê Duyệt | Nguồn Canonical Trong Repo | Trạng Thái Kiểm Chứng |
|---|---|---|---|
| `classId` | `"valentine"` | `docs/.../valentine_assets_manifest.json` | Đã xác minh |
| `classCharacterName` | Valentine Aurelia Vance | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `callsign` | Mercy Wing | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `title` | Ánh Sáng Cuối Cùng (The Last Light) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `role` | Quân Y Chiến Trường (Combat Medic) · Cứu Hộ (Rescue) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `gender` / `age` | Nữ · 24 tuổi | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `origin` | Khu dân cư y tế quỹ đạo Elysia | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `training` | Học viện Quân y Không gian | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `personality` | Ấm áp, kiên trì, ân cần, giàu lòng trắc ẩn | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `characterQuote` | “Chừng nào còn một tín hiệu cầu cứu, tôi sẽ không bỏ lại ai phía sau.” | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt (Khối riêng 1) |
| `shortDescription` | Một nữ phi công cứu hộ luôn nở nụ cười dịu dàng, ngay cả khi bản thân cô vẫn chưa tha thứ cho một quyết định trong quá khứ. | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt (Khối riêng 2) |
| `baseStats` (Total: 20) | ATK: 2, DEF: 2, AGI: 2, ENE: 6, SHD: 6, LUK: 2 | `FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md` | Đã duyệt canonical |
| `traits` | 1. Bàn Tay Cứu Hộ (`pilot_trait_field_medic`)<br>2. Mái Khiên Nhân Ái (`pilot_trait_safeguard`) | `FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md` | Đã duyệt canonical |
| `story.chapter01` | "Ánh sáng cuối cùng tại Elysia" (Toàn văn) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt nội dung |
| `story.chapters02_04`| Tiêu đề & Tóm tắt | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | APPROVED (Chờ văn xuôi) |
| `story.chapters05_06`| Tiêu đề & Trạng thái | `valentine_assets_manifest.json` | PROVISIONAL |
| `story.chapters07_10`| Niêm phong / Bảo mật | `valentine_assets_manifest.json` | HOLD (Không hiện đã mở) |
| `artwork.fullbody` | `/images/valentine-fullbody.webp` | `public/images/valentine-fullbody.webp` | **TỒN TẠI THẬT TRÊN ĐĨA (228 KB)** |
| `artwork.portrait` | `/images/valentine-portrait.webp` | `public/images/valentine-portrait.webp` | **TỒN TẠI THẬT TRÊN ĐĨA (59 KB)** |
| `artwork.gallery` | 28 ảnh khác trong manifest | `valentine_assets_manifest.json` | **CHƯA CÓ TRÊN ĐĨA** (Thẻ Archive Fallback) |
