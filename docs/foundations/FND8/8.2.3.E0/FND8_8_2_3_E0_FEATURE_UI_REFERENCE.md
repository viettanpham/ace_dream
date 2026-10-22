# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# CHARACTER CATEGORY / PILOT PROFILE UI FEATURE & ARCHITECTURE REFERENCE (V2 FOUNDATION ALIGNED)

**Ngày cập nhật:** 2026-10-22  
**Chế độ:** DEFINE / PLAN ONLY — Đã hoàn tất audit thực địa và chuẩn hóa kiến trúc  
**Tài liệu tham chiếu cốt lõi:**
- `docs/art-direction/UI_CONCEPTS/` (3 ảnh concept PNG đã được người dùng phê duyệt)
- `docs/UI_v2/` (Bộ tài liệu kiến trúc UI V2 Foundation 01 đến 07)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_UI_V2_DESIGN_SYSTEM.md` (Design System Baseline V2)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_CHARACTER_CATEGORY_PROFILE_UI_CONCEPT.md` (Hợp đồng ý tưởng đã duyệt)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_E0_UI_REBUILD_CHECKPOINT_2026-10-22.md` (Quy định xây dựng UI V2)
- `docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` (Dữ liệu lore, chỉ số & cốt truyện)
- `docs/art-direction/PILOT/VALENTINE/valentine_assets_manifest.json` (Hồ sơ danh mục artwork 30 mục)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md` (12 Class Persona V2 chuẩn 20 điểm)
- `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md` (Danh mục Trait V2 chuẩn)

---

## 1. Trạng Thái Ảnh Concept Phê Duyệt (Concept Images Verification)

> [!NOTE]
> ### ✅ CỔNG CHẶN BLOCKER ĐÃ ĐƯỢC GIẢI PHÓNG TOÀN DIỆN
> Đã rà soát trực tiếp hệ thống tệp trong repository:
> - Thư mục `docs/art-direction/UI_CONCEPTS/` **hiện đã tồn tại đầy đủ**.
> - Cả 3 file PNG concept chính thức đã có mặt trên đĩa và được kiểm chứng:
>   1. `FND8_823_CHARACTER_CATEGORY_PROFILE_DESKTOP_APPROVED.png` (Desktop reference: bố cục 3 cột, 2 controls bối cảnh đối xứng, 4 tabs).
>   2. `FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_APPROVED.png` (Mobile paired reference: Mobile Art View và Mobile Info View).
>   3. `FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_INFO_VIEW_REFERENCE.png` (Mobile info reference chi tiết).
> - **Kết luận:** Đạt điều kiện tiên quyết về mặt thiết kế thị giác; không còn tình trạng thiếu concept ảnh vật lý.

---

## 2. Vị Trí Kiến Trúc & Ranh Giới Giữa E.0 Với UI Foundation V2

### 2.1 Định Danh Bản Code Thử Nghiệm Trước (Legacy V2 Experiment)
- Đoạn code đã tạo trước đây trong `components/game/v2/character-profile/`:
  - Trạng thái kỹ thuật: **`IMPLEMENTED_BUT_NOT_ACCEPTED / LEGACY_V2_EXPERIMENT`**.
  - **Quy tắc bắt buộc:** Giữ nguyên code này làm tài liệu tham khảo kỹ thuật và cô lập hoàn toàn; **TUYỆT ĐỐI KHÔNG** dùng làm nền để chắp vá, vá đắp hoặc kế thừa CSS cho giao diện mới.
  - Khi triển khai chính thức, giao diện Category/Profile sẽ được xây dựng mới hoàn toàn (Clean Slate Rebuild) dựa trên bộ **UI V2 Foundation Primitives** (`components/game/v2/ui/`).

### 2.2 Tương Quan Với Lộ Trình UI V2 Foundation (`docs/UI_v2/05_UI_V2_IMPLEMENTATION_ROADMAP.md`)
1. **Phase 1 — Core UI Primitives + Preview (`components/game/v2/ui/`):** **ĐÃ HOÀN TẤT & VERIFIED** (5/5 responsive defects đã FIXED).
2. **Phase 2 — Shared Art Viewer:** Đang ở trạng thái `PROPOSED_NEXT` của Foundation. Component `components/game/v2/ui/art-viewer.tsx` phục vụ xem ảnh phóng to/thu nhỏ toàn màn hình, cử chỉ pan/touch và chống broken image.
3. **Phase 3 — Official V2 Shell & Navigation:** Shell 4 tầng, Settings switch V1/V2, bảo toàn state.
4. **Phase 4 — Pilot Category / Profile V2 Rebuild:** Dựng lại toàn diện trang Pilot dựa trên Shared Art Viewer và V2 Shell.
- **Phân Tích Khóa Phụ Thuộc (Dependency Analysis):**
  - Category/Profile V2 cần trình xem tranh (Art Viewer/Lightbox). Thay vì viết riêng một modal lightbox tạm bợ trong E.0 gây trùng lặp mã nguồn, E.0 nên tái sử dụng chuẩn hóa từ **Phase 2 Shared Art Viewer**.
  - Nếu người dùng yêu cầu triển khai E.0 độc lập trước, E.0 Phase 1 sẽ tích hợp một module xem tranh tuân thủ 100% hợp đồng kỹ thuật của Phase 2 để sẵn sàng tích hợp khi Phase 2 hoàn tất.

---

## 3. Bản Hợp Đồng UI Desktop & Mobile (UI Contract)

### 3.1 Cấu Trúc Desktop (1440px Baseline) — 4 Tầng Logic
1. **Tầng 1 — Global Left Navigation (Menu Toàn Cục):**
   - Hỗ trợ 2 chế độ độc lập: Full (240px) hoặc Mini (64px). Khi thu gọn Mini, toàn bộ không gian còn lại tự động mở rộng cho Main Content.
2. **Tầng 2 — Pilot Roster (Danh Sách Phi Công):**
   - Cột chọn 12 Archetype V2 (4 Nam, 8 Nữ) độc lập với Menu Toàn Cục: Full (260px) hoặc Mini (72px).
   - Hiển thị avatar tròn/bo góc có viền trạng thái (active Cyan glow), tên nhân vật, role badge.
3. **Tầng 3 — Khu Vực Trưng Bày Trung Tâm (Central Artwork & Showcase Controls):**
   - Tranh toàn thân hiển thị với tỷ lệ gốc sắc nét, không bị kéo dãn.
   - **Hai điều khiển bối cảnh (Background / Showcase Controls):**
     - Nút bên trái: Bối cảnh A (Standard Showcase — Ánh sáng tự nhiên trạm không gian Elysia).
     - Nút bên phải: Bối cảnh B (Tactical HUD Showcase — Lưới quét ma trận radar & HUD vi tính).
   - Nút kích hoạt Trình Soi Tranh Toàn Màn Hình (Art Viewer Trigger): Phóng to 1x–4x, rê kéo chuột (pan), phím Escape đóng modal.
4. **Tầng 4 — Cột Thông Tin Bên Phải (Right Info Column 420px–460px):**
   - Header: Insignia hạm đội, Tên nhân vật (`Valentine`), Callsign (`Mercy Wing`), Danh hiệu (`Ánh Sáng Cuối Cùng`), Vai trò (`Combat Medic`).
   - **Phân tách độc lập 2 khối văn bản riêng biệt (KHÔNG gộp làm một):**
     - `characterQuote`: Đoạn văn triết lý sống nghiêng, border-l-2 Cyan, hiển thị rõ ràng.
     - `shortDescription`: Khối mô tả ngắn về bối cảnh nhân vật, cỡ chữ 14–15px Slate-300.
   - **4 Tabs Chuyển Đổi:**
     - **`OVERVIEW`**: Bảng 6 thuộc tính chuẩn (tổng = 20 điểm), thẻ Trait V2 kèm tooltip tương tác, thông tin nhân thân (chiều cao, nhóm máu, đơn vị).
     - **`STORY`**: Toàn văn Chương 01 tiếng Việt (`APPROVED`), tóm tắt Chương 02–04 (`APPROVED`), Chương 05–06 (`PROVISIONAL`), Chương 07–10 (`HOLD` — niêm phong, không hiển thị như nội dung đã mở). Typography: cỡ chữ 16–17px, line-height 1.65, max-w-prose.
     - **`GEAR COMPAT`**: Khung tương thích 3 lớp cơ giáp (Aegis, Vanguard, Falcon) hiển thị chỉ số đánh giá tương thích mà không tạo công thức gameplay mới.
     - **`GALLERY`**: Lưới hiển thị 2 ảnh WebP thật + Thẻ lưu trữ Archive Card cho 28 ảnh chưa có file vật lý (tránh 404).

### 3.2 Cấu Trúc Mobile (375px–430px) — Kiến Trúc Paired States
Giao diện mobile được thiết kế chuyên biệt, **KHÔNG PHẢI LÀ BẢN THU NHỎ CỦA DESKTOP**. Bao gồm 2 trạng thái chuyển đổi linh hoạt:

1. **Trạng Thái 1: Mobile Info View (Xem Thông Số & Cốt Truyện):**
   - Top Bar 56px: Nút Drawer mở Global Menu, Tiêu đề hồ sơ, nút chuyển nhanh sang `Art View`.
   - Horizontal Avatar Rail: Danh sách avatar phi công cuộn ngang ở đỉnh, min-w 76px/ô, không cắt cụt tên nhân vật.
   - Header thu gọn, hiển thị rõ ràng `characterQuote` và `shortDescription` tách biệt.
   - Segmented Tab Bar 4 tab: Chiều cao tối thiểu 48px, touch target $\ge 44 \times 44\text{px}$.
   - Nội dung tab cuộn dọc tự nhiên, cỡ chữ thân bài 16px, cốt truyện 17px dễ đọc.
   - **Không chứa artifact wizard:** Không có nút "CHỌN NHÂN VẬT" hay step breadcrumb.
2. **Trạng Thái 2: Mobile Art View (Ngắm Tranh Toàn Màn Hình):**
   - Tranh toàn thân hiển thị tràn viền, bám sát concept `FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_APPROVED.png`.
   - **Thanh điều khiển nổi (Floating Controls):**
     - 2 nút điều khiển chuyển bối cảnh (Background A / B) dạng nút bấm cảm ứng $\ge 44 \times 44\text{px}$.
     - Nút Zoom In (+), Reset và nút đóng hoặc chuyển về Info View `[ 📄 Xem Hồ Sơ ]`.
     - Hỗ trợ cảm ứng vuốt nhẹ và double-tap.

---

## 4. Kiểm Toán Dữ Liệu & Ranh Giới Canon FND-8

### 4.1 Phân Biệt Rõ Ràng Danh Tính Lore vs Phi Công Người Chơi
- `classCharacterName`: Danh tính nhân vật đại diện truyền thuyết của Class (ví dụ: `"Valentine Aurelia Vance"`).
- `characterName`: Tên định danh của thể hiện phi công thực tế (Instance) do người chơi tạo hoặc NPC.
- **Quy tắc canon:** Không được lấy tiểu sử truyền thuyết của Class ghi đè lên thông tin Instance của người chơi.

### 4.2 Bảng Đối Chiếu Dữ Liệu Valentine Với Repository
| Trường Giao Diện | Giá Trị Thực Tế | Nguồn Canonical Trong Repo | Trạng Thái Kiểm Chứng |
|---|---|---|---|
| `classId` | `"valentine"` | `docs/.../valentine_assets_manifest.json` | Đã xác minh |
| `classCharacterName` | Valentine Aurelia Vance | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt canon |
| `callsign` | Mercy Wing | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt canon |
| `title` | Ánh Sáng Cuối Cùng (The Last Light) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt canon |
| `role` | Quân Y Chiến Trường (Combat Medic) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | Đã duyệt canon |
| `characterQuote` | “Chừng nào còn một tín hiệu cầu cứu, tôi sẽ không bỏ lại ai phía sau.” | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | **Khối độc lập 1** |
| `shortDescription` | Một nữ phi công cứu hộ luôn nở nụ cười dịu dàng, ngay cả khi bản thân cô vẫn chưa tha thứ cho một quyết định trong quá khứ. | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | **Khối độc lập 2** |
| `baseStats` (Tổng: 20) | ATK: 2, DEF: 2, AGI: 2, ENE: 6, SHD: 6, LUK: 2 | `FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md` | Đã duyệt canon |
| `traits` | 1. Bàn Tay Cứu Hộ (`pilot_trait_field_medic`)<br>2. Mái Khiên Nhân Ái (`pilot_trait_safeguard`) | `FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md` | Đã duyệt canon |
| `story.chapter01` | "Ánh sáng cuối cùng tại Elysia" (Toàn văn văn xuôi) | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | `APPROVED` |
| `story.chapters02_04`| Tiêu đề & Tóm tắt nội dung | `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md` | `APPROVED` |
| `story.chapters05_06`| Tiêu đề & Đề cương | `valentine_assets_manifest.json` | `PROVISIONAL` |
| `story.chapters07_10`| Lộ trình biên niên (Niêm phong) | `valentine_assets_manifest.json` | `HOLD` (Niêm phong) |

---

## 5. Chính Sách Tài Nguyên Hình Ảnh & Kiểm Toán Đĩa Thực Tế

### 5.1 Hiện Trạng Tệp WebP Trên Đĩa Vật Lý
Qua lệnh rà soát toàn bộ cây thư mục container:
- **Tệp WebP thực tế tồn tại trong `/public/images/`:**
  1. `/images/valentine-fullbody.webp` (228 KB) — Artwork chính thức toàn thân.
  2. `/images/valentine-portrait.webp` (59 KB) — Ảnh đại diện avatar chân dung.
- **28 Artwork còn lại trong `valentine_assets_manifest.json`:**
  - Chưa có file nhị phân `.webp` vật lý trong `public/images/`.
  - Chúng chứa thông tin siêu dữ liệu (`description`, `category`, `sourceFilename`).

### 5.2 Quy Tắc Bất Di Bất Dịch Về Tài Nguyên (Zero Broken Images)
1. **Cấm Dùng `sourceFilename`:** Tuyệt đối không dùng tên file nguồn tiếng Việt (ví dụ: `dạ_tiệc_vũ_trụ_xa_hoa_sắc_đỏ.png`) làm đường dẫn URL web.
2. **Không Gọi Thẻ Image Tới File Thiếu:** Không tạo thẻ `<Image>` hoặc `<img>` trỏ tới các đường dẫn chưa có file thật trên đĩa để tránh lỗi HTTP 404 trên tab Network.
3. **Thẻ Lưu Trữ Archive Card Fallback:** Với 28 artwork chưa có file WebP, hiển thị dưới dạng Thẻ Lưu Trữ Danh Mục có huy hiệu `[ Chờ Đồng Bộ WebP ]`, hiển thị đầy đủ thông tin phân loại trang phục và siêu dữ liệu mà không gây lỗi trình duyệt.
