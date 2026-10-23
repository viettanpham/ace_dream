# STARFRONT WORLD V2 — CHECKPOINT & HANDOFF
## STORY-01: IMMERSIVE STORY READER + FILE-DRIVEN STORY MANAGEMENT
### CHECKPOINT: STORY01-PLAN-02 (PLAN / DEFINE REVISION ONLY)

- **Mã Checkpoint:** `STORY01-PLAN-02` (Nâng cấp và hiệu chỉnh toàn diện từ `STORY01-PLAN-01`)
- **Dự án:** `viettanpham/ace_dream`
- **Thời điểm:** 2026-10-23
- **Chế độ:** **PLAN / DEFINE REVISION ONLY — KHÔNG IMPLEMENT MÃ NGUỒN TRONG LƯỢT NÀY**
- **Trạng thái:** **HOÀN TẤT HIỆU CHỈNH KIẾN TRÚC & HẠ TẦNG LƯU TRỮ — DỪNG ĐÚNG ĐIỂM HẸN CHỜ DUYỆT**
- **Ngôn ngữ:** 100% Tiếng Việt
- **Tài liệu quy chuẩn đã cập nhật:**
  - `/docs/systems/STORY01_IMMERSIVE_READER_PUBLICATION_PLAN.md`
  - `/docs/progress/FND8/STORY01_PLAN_HANDOFF.md`

---

### 1. NỘI DUNG HIỆU CHỈNH KIẾN TRÚC TRỌNG TÂM TRONG LƯỢT NÀY

1. **Hiệu chỉnh Tầng Lưu trữ Bền vững cho Môi trường Cloud Run:**
   - Đã loại bỏ hoàn toàn đề xuất ghi tệp trên đĩa cục bộ container (`.starfront-config/story-publication.json` với `fs.renameSync`) vì container Cloud Run là môi trường phi trạng thái (stateless), tạm thời (ephemeral) và chạy đa instance (multi-instance).
   - Thiết kế phương án lưu trữ sản xuất bền vững bằng **Google Cloud Storage (GCS)**:
     - Tệp Story Markdown (`.md`) và Metadata (`.meta.json`) được lưu trên GCS Bucket.
     - Trạng thái xuất bản `story-publication.json` được quản lý bằng GCS generation precondition (`if-generation-match`) cho atomic optimistic locking, chống xung đột ghi đè giữa nhiều admin hoặc nhiều instance.
     - Hỗ trợ **Object Versioning** và **Rollback** trực tiếp từ GCS generations.
     - Phân quyền tối thiểu (Least-Privilege IAM) cho Cloud Run Service Account (`roles/storage.objectViewer` cho Reader và `roles/storage.objectUser` cho AdminCP).
     - Định nghĩa adapter `StoryStorageProvider` với hai chế độ: `GcsStoryStorageProvider` cho Production và `DevFallbackStorageProvider` (báo rõ `PERSISTENCE_NOT_CONFIGURED` khi chưa cấu hình bucket).

2. **Xây dựng Cơ chế File-driven Story Discovery & Management:**
   - Cốt truyện được thêm và cập nhật hoàn toàn thông qua tệp độc lập, tuyệt đối không hardcode hay sửa đổi React component khi có chương mới.
   - Chuẩn hóa cấu trúc thư mục: `stories/{classId}/chapter-{NN}.md` và `chapter-{NN}.meta.json` theo 12 Canonical Pilot Class IDs.
   - AdminCP có khả năng:
     - Quét kho lưu trữ khi mở hoặc khi nhấn `[LÀM MỚI / QUÉT LẠI]` (không polling liên tục).
     - Tự động nhận biết tệp chương mới và gắn trạng thái mặc định an toàn: `DRAFT` (Publication OFF).
     - Hỗ trợ tải lên (Upload) qua giao diện với bộ thẩm định schema, checksum, và quy chuẩn đặt tên.
     - Hỗ trợ Xem trước (Preview Sandbox) và Lịch sử phiên bản (Revision History / Rollback).

3. **Phân tách Độc lập Ba Nhóm Trạng thái (Three Status Dimensions):**
   - **Editorial Status:** `APPROVED` | `PROVISIONAL` | `HOLD` (Đánh giá giá trị nghệ thuật và canon từ chủ dự án).
   - **Content Readiness:** `MISSING` | `SUMMARY_ONLY` | `FULL_BODY_IMPORTED` | `VERIFIED` (Tình trạng toàn vẹn của văn bản thực tế).
   - **Publication Status:** `DRAFT` | `HIDDEN` | `PUBLISHED` (Trạng thái công bố kỹ thuật tới người dùng).
   - Ràng buộc bất biến: `APPROVED` không tự động có văn bản trong repo; có văn bản không tự động `PUBLISHED`; `HIDDEN` không làm mất nội dung hay trạng thái duyệt; cấm xuất bản `PROVISIONAL` và `HOLD` ra public.

4. **Hiệu chỉnh Cốt truyện Canon Valentine & 12 Pilot Personas:**
   - Khẳng định tính chuẩn xác: Các chương 01–06 của Valentine **đã từng được biên soạn trước đó**. Việc repo hiện tại chỉ có toàn văn Chương 01 không đồng nghĩa các chương khác chưa từng được sáng tác.
   - Thiết lập bảng xác minh 10 chương với trạng thái `PENDING_EXACT_TEXT_RECOVERY` cho các chương chờ đồng bộ văn bản gốc, cấm viết lại từ tóm tắt hoặc dùng bản nháp bị bác bỏ.
   - Chuẩn hóa chính xác 12 Persona Class ID theo FND-8: Alviss (C01), Eric (C02), Marcus (C03), Victor (C04 - Không dùng Sean), Kaelen (C05), Lyra (C06), Selena (C07 - Không dùng Selene), Valentine (C08), Fortuna (C09), Aria (C10), Rhea (C11), Nova (C12).

5. **Đặc tả Scroll-Driven Anchor Artwork & Responsive Reader:**
   - Sử dụng thẻ neo bền vững (`anchorId` và `placementTag` trong văn bản) thay vì chỉ số đoạn văn dễ xê dịch.
   - Tranh minh họa (0–3 ảnh/chương) hiển thị dạng sticky ở Cột Phải (Desktop) với hiệu ứng crossfade 300ms, tự động ẩn cột khi 0 ảnh; hiển thị Inline kèm tap-to-zoom (Mobile).
   - Bố cục responsive linh hoạt: Desktop rộng (3 cột: Nav 260px, Prose 760px, Art 380px), Desktop vừa (Nav thu gọn thành Drawer/Dock, ưu tiên Prose và Art), Tablet (bố cục đọc thoáng đãng), Mobile (1 cột ngón cái, Bottom Sheet Drawer).

6. **Hiệu chỉnh Lộ trình 4 Phân kỳ Triển khai (4 Bounded Phases):**
   - `STORY-01.A`: Persistent Story Store + File Discovery + API Contract.
   - `STORY-01.B`: Immersive Story Reader Desktop & Mobile.
   - `STORY-01.C`: AdminCP Story Management UI + Publish/Hide + Upload.
   - `STORY-01.D`: Verified Valentine Story Import + E2E Integration.

---

### 2. HIỆN TRẠNG MÃ NGUỒN & HỆ THỐNG
- **Mã nguồn runtime:** Được bảo toàn 100%, không thay đổi mã TypeScript hay React component nào.
- **Hệ thống dữ liệu V1 & V2:** Hoàn toàn nguyên vẹn, không có sự cố hồi quy (zero regression).
- **Hạ tầng Cloud:** Không tự ý tạo hoặc cấu hình tài nguyên GCP; tất cả prerequisites (GCS bucket name, Service Account) được công bố rõ ràng dưới dạng điều kiện phụ thuộc.

---

### 3. BƯỚC ĐI TIẾP THEO
1. Chờ Chủ dự án xem xét và phê chuẩn bản kế hoạch `STORY01-PLAN-02`.
2. Khi có sự đồng thuận chính thức, khởi động **Phase STORY-01.A** để cài đặt persistent store adapter, schemas và các endpoint API theo đúng hợp đồng thiết kế.
