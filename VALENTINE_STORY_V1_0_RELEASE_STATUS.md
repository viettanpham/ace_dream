# STARFRONT WORLD V2 — VALENTINE STORY v1.0 RELEASE STATUS
## BÁO CÁO HIỆN TRẠNG XUẤT BẢN & ĐỐI CHIẾU NGUYÊN VĂN CỐT TRUYỆN VALENTINE

**Thời điểm kiểm kê:** 2026-10-26 (Bản chuẩn hóa v1.0)  
**Phạm vi:** Cốt truyện Phi công Valentine Aurelia Vance (Callsign: Mercy Wing) — Chương 01 đến 07.  
**Tài liệu đối chiếu Canon:** `docs/systems/STORY01_IMMERSIVE_READER_PUBLICATION_PLAN.md`, `docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`, `stories/valentine/manifest.json`.

---

### 1. BẢNG KIỂM KÊ TOÀN VĂN & HIỆN TRẠNG TỪNG CHƯƠNG (CHƯƠNG 01–07)

| Chương | Tiêu đề Canonical | Nguồn văn bản nội bộ | Số từ thực tế | Hiện diện Toàn văn? | Trạng thái phê duyệt (Editorial) | Trạng thái phát hành (Publication) | Tình trạng CDN Staging |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **01** | **Ánh sáng cuối cùng tại Elysia** | `stories/valentine/chapter-01.json`<br>`stories/valentine/chapter-01.md` | **780** | **ĐÃ CÓ (FULL_PROSE)** | `APPROVED` | **PUBLISHED** | **ĐÃ CÓ TRÊN CDN STAGING**<br>`stories/pilots/valentine/chapter-01.json` |
| **02** | **Ca trực đầu tiên tại Trạm Cứu hộ Quỹ đạo** | `stories/valentine/chapter-02.json` | 180 | CHƯA (SUMMARY_ONLY) | `APPROVED` | `REVIEW_ONLY` | Chờ khôi phục nguyên văn (`PENDING_EXACT_TEXT_RECOVERY`) |
| **03** | **Tín hiệu bị cô lập ở Vành đai Asteroid** | `stories/valentine/chapter-03.json` | 190 | CHƯA (SUMMARY_ONLY) | `APPROVED` | `REVIEW_ONLY` | Chờ khôi phục nguyên văn (`PENDING_EXACT_TEXT_RECOVERY`) |
| **04** | **Lằn ranh đỏ giữa hai mệnh lệnh** | `stories/valentine/chapter-04.json` | 210 | CHƯA (SUMMARY_ONLY) | `APPROVED` | `REVIEW_ONLY` | Chờ khôi phục nguyên văn (`PENDING_EXACT_TEXT_RECOVERY`) |
| **05** | **Học viện Y sinh Không gian và Lời thề** | `stories/valentine/chapter-05.json` | 160 | CHƯA (SUMMARY_ONLY) | `PROVISIONAL` | `REVIEW_ONLY` | Bị khóa biên tập (`PROVISIONAL_HOLD`) |
| **06** | **Chuyến bay thử nghiệm của Mercy Wing** | `stories/valentine/chapter-06.json` | 170 | CHƯA (SUMMARY_ONLY) | `PROVISIONAL` | `REVIEW_ONLY` | Bị khóa biên tập (`PROVISIONAL_HOLD`) |
| **07** | **Bí mật bên dưới tầng ngầm Elysia** | *Không có tệp* (Đề cương tóm tắt) | 95 | CHƯA (MISSING) | `HOLD` | `REVIEW_ONLY` | Niêm phong cấp độ II (`CANON_HOLD`) |

---

### 2. KẾT QUẢ ĐỐI CHIẾU NGUYÊN VĂN & NGUYÊN TẮC BẢO TOÀN

1. **Chương 01 (Ánh sáng cuối cùng tại Elysia):**
   - Đã xác thực nguyên văn đầy đủ: 780 từ, 12 khối đoạn văn (`blocks`), 3 thẻ neo phân cảnh minh họa (`val-ch01-scene-academy`, `val-ch01-scene-evac`, `val-ch01-scene-resolve`).
   - Khớp 100% với bản thảo gốc trong `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`.
   - Đã được đóng gói vào thư mục `staging/starfront-world-assets/stories/pilots/valentine/chapter-01.json` và `manifest.json` sẵn sàng cho phát hành CDN.

2. **Chương 02–04 (Ca trực đầu tiên, Vành đai Asteroid, Lằn ranh đỏ):**
   - Trạng thái biên tập: **`APPROVED`** theo đúng checkpoint canonical.
   - Hiện trạng văn bản: Hiện chỉ có bản tóm tắt đề cương cốt truyện chính thức (180–210 từ) do đội ngũ biên kịch lập để giữ khung sự kiện.
   - Nguyên tắc: **Tuyệt đối không biến tóm tắt thành toàn văn, không tự dùng AI viết bù văn xuôi**. Trạng thái được giữ chuẩn xác là `PENDING_EXACT_TEXT_RECOVERY` (Chờ khôi phục nguyên văn tác giả).

3. **Chương 05–06 (Học viện Y sinh, Chuyến bay thử nghiệm):**
   - Trạng thái biên tập: **`PROVISIONAL`** (Tạm thời) theo đúng quy định FND-8.
   - Chưa được phép phát hành công khai trên web dưới dạng toàn văn khi chưa có văn bản phê duyệt nâng cấp chính thức từ chủ dự án.

4. **Chương 07 (Bí mật bên dưới tầng ngầm Elysia):**
   - Trạng thái biên tập: **`HOLD`** (Niêm phong hồ sơ cấp độ II).
   - Chưa mở khóa nội dung cho công chúng.

---

### 3. TÌNH TRẠNG ARTWORK & MINH HỌA

- **Bảo toàn nguyên vẹn tài nguyên hình ảnh hiện có:** Giữ nguyên các artwork đã được phê duyệt và ánh xạ trong thư viện (`valentine-fullbody.webp`, `valentine-portrait.webp`, `valentine-activity-001.webp`, `valentine-casual.webp`, `valentine-uniform-001.webp`).
- **Không chèn placeholder lỗi:** Không tạo đường dẫn rác hay khung đen rỗng. Chương nào chưa có tranh minh họa phân cảnh thì Story Reader tự động hoạt động ở chế độ văn bản thuần (`Text-only`).

---

### 4. TƯƠNG THÍCH RUNTIME & STORY READER

- Đã xác minh hoạt động của API `/api/runtime/story?pilotId=valentine`:
  - Trả về danh mục 10 chương với đầy đủ tiêu đề, tóm tắt và lời thề.
  - Phân tách rõ ràng giữa chương có toàn văn (`contentAvailable: true` cho Chương 01) và các chương chờ nội dung (`isComingSoon: true` cho Chương 02–10).
- Story Reader (3 cột Immersive Reader) đọc trọn vẹn văn bản Chương 01 mượt mà, đồng bộ ảnh thẻ neo khi cuộn, không phát sinh lỗi layout.
