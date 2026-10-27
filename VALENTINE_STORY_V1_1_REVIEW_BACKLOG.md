# STARFRONT WORLD V2 — VALENTINE STORY v1.1 REVIEW BACKLOG
## KẾ HOẠCH BÀN GIAO & DANH MỤC CÔNG VIỆC CẦN THIẾT ĐỂ XUẤT BẢN ĐỦ 7 CHƯƠNG VALENTINE

**Tài liệu tham chiếu:** `VALENTINE_STORY_V1_0_RELEASE_STATUS.md`  
**Mục tiêu:** Xác định chính xác các điều kiện tiên quyết, rào cản (blockers) và lộ trình tiếp nhận văn bản để nâng cấp từ v1.0 (1/7 toàn văn) lên v1.1 (7/7 toàn văn xuất bản đầy đủ).

---

### 1. CHI TIẾT BLOCKER & ĐIỀU KIỆN TIÊN QUYẾT TỪNG CHƯƠNG (CHƯƠNG 02–07)

#### 1.1. Chương 02: Ca trực đầu tiên tại Trạm Cứu hộ Quỹ đạo
- **Trạng thái duyệt:** `APPROVED` (Đã duyệt đề cương & nội dung canon).
- **Blocker hiện tại:** `PENDING_EXACT_TEXT_RECOVERY` — Thiếu tệp văn xuôi toàn văn gốc của tác giả (hiện mới có bản tóm tắt 180 từ).
- **Yêu cầu để xuất bản:**
  1. Tác giả/Biên tập viên cung cấp bản thảo văn xuôi hoàn chỉnh (Dự kiến: 800 – 1.200 từ).
  2. Gắn thẻ neo phân cảnh `<!-- story-anchor: val-ch02-scene-uniform -->` tương ứng với tranh đã có sẵn trên CDN: `valentine-uniform-001.webp`.
  3. Đóng gói tệp `stories/valentine/chapter-02.json` với `"contentStatus": "FULL_PROSE"`, `"publicationStatus": "PUBLISHED"`.

#### 1.2. Chương 03: Tín hiệu bị cô lập ở Vành đai Asteroid
- **Trạng thái duyệt:** `APPROVED` (Đã duyệt đề cương & nội dung canon).
- **Blocker hiện tại:** `PENDING_EXACT_TEXT_RECOVERY` — Thiếu tệp văn xuôi toàn văn gốc của tác giả (hiện mới có bản tóm tắt 190 từ).
- **Yêu cầu để xuất bản:**
  1. Tác giả/Biên tập viên cung cấp bản thảo văn xuôi hoàn chỉnh (Dự kiến: 800 – 1.200 từ).
  2. Gắn thẻ neo phân cảnh `<!-- story-anchor: val-ch03-scene-activity -->` tương ứng với tranh đã có sẵn trên CDN: `valentine-activity-001.webp`.
  3. Cập nhật `stories/valentine/chapter-03.json` và đồng bộ vào CDN staging.

#### 1.3. Chương 04: Lằn ranh đỏ giữa hai mệnh lệnh
- **Trạng thái duyệt:** `APPROVED` (Đã duyệt đề cương & nội dung canon).
- **Blocker hiện tại:** `PENDING_EXACT_TEXT_RECOVERY` — Thiếu tệp văn xuôi toàn văn gốc của tác giả (hiện mới có bản tóm tắt 210 từ).
- **Yêu cầu để xuất bản:**
  1. Tác giả/Biên tập viên cung cấp bản thảo văn xuôi hoàn chỉnh (Dự kiến: 800 – 1.200 từ).
  2. Gắn thẻ neo phân cảnh `<!-- story-anchor: val-ch04-scene-casual -->` tương ứng với tranh đã có sẵn trên CDN: `valentine-casual.webp`.
  3. Đóng gói tệp `stories/valentine/chapter-04.json` với `"contentStatus": "FULL_PROSE"`, `"publicationStatus": "PUBLISHED"`.

#### 1.4. Chương 05: Học viện Y sinh Không gian và Lời thề
- **Trạng thái duyệt:** `PROVISIONAL` (Tạm thời).
- **Blocker hiện tại:**
  1. **Khóa biên tập (Editorial Lock):** Cần chủ dự án chính thức ký duyệt chuyển trạng thái từ `PROVISIONAL` sang `APPROVED`.
  2. **Thiếu văn bản gốc:** Cần bản thảo văn xuôi hoàn chỉnh (hiện chỉ có tóm tắt 160 từ).
- **Yêu cầu để xuất bản:**
  1. Văn bản phê duyệt từ chủ dự án chuyển `editorialStatus` thành `APPROVED`.
  2. Tiếp nhận văn xuôi chi tiết về thời kỳ đào tạo của Valentine tại Elysia (800 – 1.200 từ).
  3. Xác định tranh minh họa bổ sung nếu có (mặc định văn bản thuần).

#### 1.5. Chương 06: Chuyến bay thử nghiệm của Mercy Wing
- **Trạng thái duyệt:** `PROVISIONAL` (Tạm thời).
- **Blocker hiện tại:**
  1. **Khóa biên tập (Editorial Lock):** Cần chủ dự án chính thức ký duyệt chuyển trạng thái từ `PROVISIONAL` sang `APPROVED`.
  2. **Thiếu văn bản gốc:** Cần bản thảo văn xuôi hoàn chỉnh về quá trình thử nghiệm khiên kép (hiện chỉ có tóm tắt 170 từ).
- **Yêu cầu để xuất bản:**
  1. Văn bản phê duyệt từ chủ dự án chuyển `editorialStatus` thành `APPROVED`.
  2. Tiếp nhận văn xuôi toàn văn (800 – 1.200 từ).
  3. Đóng gói tệp `chapter-06.json`.

#### 1.6. Chương 07: Bí mật bên dưới tầng ngầm Elysia
- **Trạng thái duyệt:** `HOLD` (Niêm phong hồ sơ cấp độ II).
- **Blocker hiện tại:**
  1. **Niêm phong thế giới quan (Canon Hold):** Toàn bộ tình tiết bí mật tầng ngầm Elysia bị khóa trong giai đoạn MVP V2.0.
  2. **Chưa có bản thảo:** Chưa có văn bản chi tiết trong hệ thống repository.
- **Yêu cầu để xuất bản:**
  1. Lệnh giải mật (Unseal) từ người phụ trách Canon Thế giới quan.
  2. Chuyển trạng thái từ `HOLD` sang `APPROVED`.
  3. Soạn thảo hoặc đồng bộ tệp `chapter-07.md` / `chapter-07.json` từ kho lưu trữ tác giả.

---

### 2. DANH MỤC CÔNG VIỆC CHUẨN BỊ KỸ THUẬT (ENGINEERING CHECKLIST CHO v1.1)

| Bước | Nhiệm vụ kỹ thuật | Người phụ trách | Trạng thái kỹ thuật |
| :---: | :--- | :---: | :---: |
| 1 | Cấu trúc thư mục CDN Staging `staging/starfront-world-assets/stories/pilots/valentine/` | Technical Maintainer | **ĐÃ HOÀN TẤT** |
| 2 | Bộ giải mã Universal Content Resolver tự động nhận diện `FULL_PROSE` theo file | Technical Maintainer | **ĐÃ HOÀN TẤT** |
| 3 | Tiếp nhận 6 bản thảo văn xuôi Chương 02–07 từ tác giả | Biên kịch / Chủ dự án | **CHỜ BÀN GIAO** |
| 4 | Chuyển đổi Markdown sang định dạng chuẩn JSON `blocks[]` kèm thẻ neo | Technical Maintainer | **SẴN SÀNG THỰC HIỆN** |
| 5 | Đẩy bản phát hành CDN `v3.0-assets-r4` hoặc `r5` lên kho lưu trữ GitHub CDN | Release Manager | **SẴN SÀNG THỰC HIỆN** |
| 6 | Cập nhật runtime pointer qua API `/api/runtime/asset-config` (Zero-downtime) | Technical Maintainer | **SẴN SÀNG THỰC HIỆN** |

---

### 3. KẾT LUẬN & CAM KẾT VẬN HÀNH

- Phiên bản hiện hành v1.0 hoạt động an toàn tuyệt đối, không hiển thị lỗi 404, không hiển thị trang trắng và không bịa đặt nội dung.
- Ngay khi nhận được các file văn xuôi gốc của Chương 02–07, đội ngũ kỹ thuật có thể tích hợp và phát hành toàn bộ 7 chương trong vòng **1 lượt cập nhật dữ liệu duy nhất** mà không cần can thiệp lại giao diện frontend.
