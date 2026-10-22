# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# CHARACTER CATEGORY / PILOT PROFILE UI FEATURE & UI REFERENCE

**Ngày lập:** 2026-10-22  
**Chế độ:** DEFINE / PLAN ONLY (Đã kiểm chứng kho dữ liệu & mã nguồn thực tế)  
**Tài liệu tham chiếu gốc:**
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_CHARACTER_CATEGORY_PROFILE_UI_CONCEPT.md`
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_UI_REBUILD_CHECKPOINT_2026-10-22.md`
- `docs/progress/FND8/STARFRONT_HANDOFF_FND8_2026-10-22_UI_POLICY_DELTA.md`
- `docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`
- `docs/art-direction/PILOT/VALENTINE/valentine_assets_manifest.json`
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md`

---

## 1. Mục Tiêu & Ranh Giới Tính Năng (Scope & Boundaries)

### 1.1 Mục Tiêu
Thiết lập nền tảng giao diện V2 độc lập cho **Hồ Sơ Nhân Vật / Danh Mục Phi Công (Character Category / Pilot Profile UI Foundation)**:
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

## 2. Kiến Trúc Giao Diện Desktop vs Mobile (Co-Equal Deliverables)

### 2.1 Bố Cục Desktop (1440px Baseline)
Tuân thủ concept desktop đã duyệt (`Giao diện chọn nhân vật Valentine tương lai`):
1. **Cột Trái (Character Roster & Category Index):**
   - Danh sách 12 archetype V2 (4 Nam, 8 Nữ) với thumbnail và trạng thái khả dụng.
   - Valentine hiển thị nổi bật là hồ sơ hoàn chỉnh; các nhân vật khác hiển thị thẻ tóm tắt chuẩn hoặc nhãn "Đang cập nhật hồ sơ V2".
   - Bộ lọc phân loại: Tất cả / Nam / Nữ / Vai trò (Cứu hộ, Tiên phong, Cơ động, Phòng thủ...).
2. **Khu Vực Trung Tâm (Showcase Nhân Vật & 2 Toggles Nền):**
   - Tranh toàn thân (Fullbody Artwork) của Valentine hiển thị trang trọng, sắc nét, có chiều sâu thị giác.
   - **Hai điều khiển chuyển đổi bối cảnh (Background / Showcase Controls):**
     - Đặt đối xứng ở hai bên khung tranh trung tâm (Trái/Phải hoặc Toggle kép).
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
       - Thẻ hiển thị Traits chính thức: `Bàn Tay Cứu Hộ` (+Hiệu quả kỹ năng hồi phục) và `Mái Khiên Nhân Ái` (+Hồi phục khiên hỗ trợ đồng đội). Kèm Tooltip giải thích chi tiết khi hover/click.
       - Thông tin nhân thân vắn tắt: Tuổi: 24, Xuất thân: Elysia, Đào tạo: Học viện Quân y Không gian, Tính cách: Ấm áp, kiên trì, ân cần.
     - **Tab 2: STORY (Tiểu Sử & Biên Niên)**
       - Tóm tắt tiểu sử (Biography Summary): Quá khứ tại Elysia và quyết định định mệnh.
       - Danh sách chương theo lộ trình 10 chương:
         - Chương 01: "Ánh sáng cuối cùng tại Elysia" (APPROVED — Hiển thị toàn văn tiếng Việt).
         - Chương 02–04: APPROVED (Hiển thị tiêu đề & tóm tắt, nhãn "Đang biên tập nội dung chi tiết").
         - Chương 05–06: PROVISIONAL (Nhãn "Bản thảo sơ bộ — Chưa phát hành chính thức").
         - Chương 07–10: HOLD (Nhãn "Hồ sơ niêm phong / Chưa mở khóa").
     - **Tab 3: GEAR COMPAT (Tương Thích Cơ Giáp)**
       - Hiển thị mức độ tương thích với 3 khung cơ giáp:
         - **Aegis Gear:** Đề xuất tối ưu (Tương thích S-Rank, cộng hưởng lá chắn và phòng ngự).
         - **Vanguard Gear:** Tương thích B-Rank (Hỗ trợ tiền tuyến).
         - **Falcon Gear:** Tương thích C-Rank (Yêu cầu kỹ năng cơ động cao).
       - Ghi chú: Không chế thêm hệ thống gameplay GEAR mới ở phase UI này; chỉ hiển thị dữ liệu phân tích tương thích lore.
     - **Tab 4: GALLERY (Bộ Sưu Tập Artwork)**
       - Hiển thị các artwork đã xác minh trên đĩa:
         - `valentine-fullbody.webp` (Tranh toàn thân lễ phục y tế)
         - `valentine-portrait.webp` (Chân dung chỉ huy cứu hộ)
         - Ảnh chân dung bổ sung trong assets: `valentine_portrait_1791631686158.jpg`
       - Các mục còn lại trong manifest 30 ảnh (trang phục dạ tiệc, học viện, thường phục, buồng lái...) hiển thị dưới dạng "Hồ Sơ Lưu Trữ Chưa Đồng Bộ" với khung fallback tao nhã, không để vỡ ảnh.
       - Click vào ảnh để mở Trình Soi Chi Tiết (Artwork Inspector).

---

### 2.2 Bố Cục Mobile (Smartphone 375px–430px Dedicated Architecture)
Tuân thủ concept mobile đã duyệt (`hồ_sơ_valentine_ánh_sáng_cuối_cùng` & `giao_diện_chọn_nhân_vật_valentine_tương_lai`):
- **Không phải là desktop co nhỏ**, mà là cấu trúc 2 trạng thái chuyển đổi trực quan (Paired States):
  1. **Trạng Thái 1: Mobile Info View (Xem Thông Tin Hồ Sơ):**
     - Top Bar tinh gọn (<=56px): Nút Quay lại / Đổi nhân vật, Tiêu đề hồ sơ `Valentine`, nút chuyển sang chế độ "Xem Tranh Toàn Màn Hình".
     - Header nhỏ gọn: Avatar tròn / vuông 64px, Tên, Callsign, Danh hiệu và Role tag.
     - Hai khối văn bản riêng biệt: `characterQuote` (chữ nghiêng trang nhã) và `shortDescription`.
     - Segmented Tab Bar 4 Tab (OVERVIEW / STORY / GEAR COMPAT / GALLERY) với touch target >= 44px.
     - Khu vực nội dung cuộn mượt mà:
       - 6 thuộc tính hiển thị dạng thanh tiến trình nhỏ gọn với số liệu tabular-nums.
       - Trait cards có thể tap để bật Bottom Sheet / Modal giải thích chi tiết.
       - Bảng tương thích GEAR dạng danh sách vuốt dọc.
       - Lưới Gallery thu nhỏ với thumbnail rõ nét.
  2. **Trạng Thái 2: Mobile Art View (Xem Tranh & Bối Cảnh):**
     - Màn hình tràn viền tập trung vào tranh nhân vật chất lượng cao.
     - **Hai điều khiển bối cảnh (Background Toggles) dạng nút cảm ứng nổi (Floating Pill/Bar) ở góc dưới hoặc thanh công cụ đáy**, cho phép chuyển nhanh Bối Cảnh A (Elysia Hangar) và Bối Cảnh B (Buồng Lái HUD).
     - Thanh công cụ đáy chứa nút:
       - Zoom in / Zoom out.
       - Reset góc nhìn.
       - Nút "Thông Tin Hồ Sơ" để quay lại Trạng Thái 1 tức thì.
     - Hỗ trợ cử chỉ cảm ứng: Double-tap để zoom 2x, kéo rê (pan) khi đang phóng to, vuốt xuống hoặc tap nút đóng để trở về Info View.

---

## 3. Bản Đồ Dữ Liệu Valentine (Valentine Data-to-UI Mapping)

| Trường Giao Diện (UI Field) | Giá Trị Thực Tế Được Phê Duyệt | Nguồn Trong Repository | Trạng Thái Kiểm Chứng |
|---|---|---|---|
| `classId` | `"valentine"` | `valentine_assets_manifest.json` | Đã xác minh |
| `classCharacterName` | Valentine Aurelia Vance | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `callsign` | Mercy Wing | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `title` | Ánh Sáng Cuối Cùng (The Last Light) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `role` | Quân Y Chiến Trường (Combat Medic) · Cứu Hộ (Rescue) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `gender` / `age` | Nữ · 24 tuổi | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `origin` | Khu dân cư y tế quỹ đạo Elysia | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `training` | Học viện Quân y Không gian | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `personality` | Ấm áp, kiên trì, ân cần, giàu lòng trắc ẩn | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft |
| `characterQuote` | “Chừng nào còn một tín hiệu cầu cứu, tôi sẽ không bỏ lại ai phía sau.” | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft (Khối riêng) |
| `shortDescription` | Một nữ phi công cứu hộ luôn nở nụ cười dịu dàng, ngay cả khi bản thân cô vẫn chưa tha thứ cho một quyết định trong quá khứ. | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt draft (Khối riêng) |
| `baseStats` (Total: 20) | ATK: 2, DEF: 2, AGI: 2, ENE: 6, SHD: 6, LUK: 2 | `FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md` | Đã duyệt đề xuất |
| `traits` | 1. Bàn Tay Cứu Hộ (`pilot_trait_field_medic`)<br>2. Mái Khiên Nhân Ái (`pilot_trait_safeguard`) | `FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md` | Đã duyệt danh mục |
| `story.chapter01` | "Ánh sáng cuối cùng tại Elysia" (Toàn văn) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt nội dung |
| `story.chapters02_04`| Tiêu đề & Tóm tắt | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | APPROVED (Chờ văn xuôi) |
| `story.chapters05_06`| Tiêu đề & Trạng thái | `valentine_assets_manifest.json` | PROVISIONAL |
| `story.chapters07_10`| Niêm phong / Bảo mật | `valentine_assets_manifest.json` | HOLD (Không hiện đã mở) |
| `artwork.fullbody` | `/images/valentine-fullbody.webp` | `public/images/valentine-fullbody.webp` | **TỒN TẠI THẬT (228 KB)** |
| `artwork.portrait` | `/images/valentine-portrait.webp` | `public/images/valentine-portrait.webp` | **TỒN TẠI THẬT (59 KB)** |
| `artwork.gallery` | 28 ảnh khác trong manifest | `valentine_assets_manifest.json` | **CHƯA CÓ TRÊN ĐĨA** (Dùng thẻ Archive Fallback) |

---

## 4. Xử Lý Trạng Thái & Quy Tắc An Toàn (Resilience & Polish)

1. **Zero-Broken-Image Policy:**
   - Tuyệt đối không trỏ thẻ `<img>` vào các file chưa tồn tại trên đĩa (`valentine-activity-001.webp`, `valentine-outfit-001.webp`...).
   - Hiển thị danh mục ảnh manifest thông qua thẻ "Dữ Liệu Kho Lưu Trữ (Archive Card)" với tên bộ trang phục, danh mục (Dạ tiệc / Quân y / Học viện), và biểu tượng trạng thái "Chờ Đồng Bộ File".
   - Tất cả thẻ hình ảnh thật đều có `referrerPolicy="no-referrer"` và khối khung nền gradient tối ưu phòng ngừa lỗi mạng.
2. **Quy Tắc Chống "AI-Slop":**
   - Không dùng gradient tím lòe loẹt, không dùng các viền dày vô lý (`border-l-4`).
   - Không dùng số liệu giả định (fake ping, fake compiler version).
   - Metadata hiển thị dưới dạng chữ thanh mảnh với dấu phân tách tinh tế (`·` hoặc `/`), không bọc các pill badge lòe loẹt.
3. **Typography & Màu Sắc Chuẩn Sci-Fi Quân Sự:**
   - Nền: Slate-950 (`#020617`) và Dark Zinc (`#09090b`).
   - Bề mặt panel: Slate-900/80 với viền hairline mờ (`border-slate-800`).
   - Điểm nhấn (Accent 10%): Cyan/Teal năng lượng (`#06b6d4` / `#14b8a6`) và Ngọc bích cứu hộ (`#10b981`).
   - Con số hiển thị: `font-mono tabular-nums`.
