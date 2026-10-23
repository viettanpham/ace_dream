# STARFRONT WORLD V2 — FND-8.2.3 STORY-01-PLAN-02
## IMMERSIVE STORY READER + FILE-DRIVEN STORY MANAGEMENT
### BẢN THIẾT KẾ KIẾN TRÚC & QUY TRÌNH PHÁT HÀNH CỐT TRUYỆN BỀN VỮNG (PLAN / DEFINE REVISION 02)

- **Dự án:** `viettanpham/ace_dream`
- **Mã hệ thống:** FND-8.2.3 / STORY-01
- **Phiên bản Plan:** `STORY01-PLAN-02` (Hiệu chỉnh toàn diện từ `STORY01-PLAN-01`)
- **Tình trạng:** **PLAN / DEFINE ONLY — KHÔNG IMPLEMENT MÃ NGUỒN TRONG LƯỢT NÀY**
- **Ngôn ngữ:** 100% Tiếng Việt
- **Tác giả:** STARFRONT Architecture Team & Chủ dự án

---

## 1. TỔNG QUAN & BỐI CẢNH HIỆU CHỈNH KIẾN TRÚC

### 1.1. Chỉ đạo từ Chủ dự án
Chủ dự án thống nhất và phê chuẩn 4 định hướng trải nghiệm nền tảng đã đề xuất trong `STORY01-PLAN-01`:
1. **Character Category Story Preview:** Giữ vai trò thẻ tóm tắt nhân vật, mục lục chương và nút dẫn vào chế độ đọc chuyên biệt.
2. **Immersive Story Reader chuyên dụng:** Trải nghiệm đọc toàn màn hình bên trong V2 Main Viewport, tối ưu thẩm mỹ điện ảnh khoa học viễn tưởng.
3. **AdminCP Story Publication Manager:** Giao diện quản trị xuất bản cho 12 Pilot.
4. **Scroll-Driven Anchor Artwork:** Tranh minh họa xuất hiện và chuyển động đồng bộ theo nhịp cuộn đọc văn bản.

Tuy nhiên, bản kế hoạch `STORY01-PLAN-01` có hai thiếu sót kiến trúc nghiêm trọng:
- **Thiếu cơ chế File-driven Story Discovery & Management:** Cần cho phép tác giả/biên kịch bổ sung và cập nhật chương truyện bằng các tệp độc lập (`.md` và `.meta.json`), tuyệt đối không sửa đổi hay hardcode mã nguồn React component cho từng chương.
- **Đề xuất Persistence không an toàn cho Cloud Run:** Đề xuất ghi file cục bộ `.starfront-config/story-publication.json` bằng `fs.renameSync` là **vi phạm nguyên lý phi trạng thái (stateless) của Google Cloud Run**, dẫn đến mất dữ liệu khi container xoay vòng và xung đột dữ liệu đa instance (split-brain).

Bản tài liệu `STORY01-PLAN-02` này hiệu chỉnh triệt để các vấn đề trên trước khi bước vào triển khai (IMPLEMENT).

---

## 2. PHÂN TÍCH VÀ HIỆU CHỈNH HẠ TẦNG PERSISTENCE CHO CLOUD RUN

### 2.1. Vì sao Filesystem cục bộ không thể dùng làm Production Storage trên Cloud Run
Google Cloud Run là nền tảng điện toán Serverless Container với các đặc tính vận hành cốt lõi:
1. **Container Ephemeral & Stateless:** Hệ thống tệp (filesystem) của container Cloud Run là lớp bộ nhớ tạm (in-memory tmpfs / writable overlay). Khi một container instance bị tắt (scale to 0), dừng do nhàn rỗi, hoặc được thay thế bởi phiên bản triển khai mới (revision update), toàn bộ tệp ghi trên đĩa cục bộ sẽ **bị xóa vĩnh viễn**.
2. **Đa Instance đồng thời (Multi-Instance Concurrency & Scale-out):** Khi lưu lượng người dùng tăng, Cloud Run tự động nhân bản thành nhiều instance (ví dụ: Instance A, Instance B, Instance C). Nếu AdminCP gửi yêu cầu Publish tới Instance A và ghi file nội bộ trên Instance A, thì Instance B và C hoàn toàn không nhận được thay đổi. Người dùng truy cập qua Cloud Run Load Balancer sẽ gặp hiện tượng trạng thái chập chờn (lúc thấy chương xuất bản, lúc không — Split-Brain State).
3. **Bài học từ WEB-01:** Mặc dù WEB-01 xây dựng cơ chế bảo mật xác thực (Session Cookie HMAC, CSRF token, Sanitization) rất chuẩn mực và có thể tái sử dụng cho API Admin, nhưng giải pháp ghi tệp `.starfront-config/` của WEB-01 vốn chỉ là cơ chế cấu hình khởi đầu/cục bộ, **không phải bằng chứng chứng minh nó phù hợp cho Production Content Storage trên Cloud Run**.

### 2.2. Phương án Persistence được phê chuẩn: Google Cloud Storage (GCS)
Hệ thống Story V2 lựa chọn **Google Cloud Storage (GCS)** làm tầng lưu trữ bền vững (Durable Persistence Layer) cho môi trường Production:
- **File Story Markdown (`.md`) và Metadata JSON (`.meta.json`):** Được lưu trữ tập trung trên GCS Bucket chuyên dụng.
- **Publication State (`story-publication.json`):** Trạng thái ON/OFF, phiên bản, audit trail được lưu thành object tập trung trên GCS.
- **Tính bất biến và không cần Rebuild:** Việc thêm file, sửa nội dung, hoặc chuyển trạng thái xuất bản **không yêu cầu rebuild hoặc redeploy ứng dụng Next.js**.
- **Không dùng localStorage cho trạng thái hệ thống:** `localStorage` chỉ được dùng cho tùy chọn đọc cá nhân của người dùng (cỡ chữ, theme đọc, vị trí cuộn chương hiện tại của trình duyệt), tuyệt đối không lưu trạng thái xuất bản toàn cục.

### 2.3. Thiết kế Kiến trúc Durable Storage Adapter
Hệ thống sử dụng mẫu thiết kế Provider Adapter (`StoryStorageProvider`) độc lập môi trường:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        RUNTIME / ADMINCP API                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                        ┌───────────▼───────────┐
                        │ StoryStorageProvider  │ (Interface Trừu Tượng)
                        └─────┬───────────┬─────┘
                              │           │
     ┌────────────────────────┘           └────────────────────────┐
     │ (Production: GCS_BUCKET set)                                │ (Dev Local Fallback)
     ▼                                                             ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     GcsStoryStorageProvider   │               │   DevFallbackStorageProvider  │
│ - Lưu trữ GCS Bucket chuẩn    │               │ - In-memory / Mock Read-Only  │
│ - Generation Concurrency Lock │               │ - storageStatus.durable=false │
│ - Bucket Object Versioning    │               │ - Báo mã:                     │
│ - Tương thích 100% Cloud Run  │               │   PERSISTENCE_NOT_CONFIGURED  │
└───────────────────────────────┘               └───────────────────────────────┘
```

#### Chi tiết thông số kỹ thuật Adapter:
1. **Kiểm soát đồng thời (Optimistic Concurrency Control):**
   - Sử dụng GCS Precondition header `if-generation-match` kết hợp với số nguyên `revision` trong manifest.
   - Khi hai Admin cùng sửa đổi trạng thái xuất bản đồng thời, transaction nào có generation không khớp sẽ bị từ chối với mã lỗi `409 Conflict`, ngăn chặn hoàn toàn việc ghi đè mất dữ liệu (Lost Update).
2. **Lịch sử phiên bản (Version History) & Khôi phục (Rollback):**
   - Kích hoạt tính năng **Object Versioning** trên GCS Bucket. Mọi lần thay thế file Markdown hoặc Metadata đều tạo ra một generation ID mới.
   - AdminCP có thể truy vấn danh sách generation của tệp và kích hoạt khôi phục (Rollback) về phiên bản trước đó ngay lập tức.
3. **Phân quyền truy cập tối thiểu (Least-Privilege IAM):**
   - Gán quyền cho Service Account mà Cloud Run đang chạy (Runtime Service Account):
     - API đọc công khai của độc giả: Quyền `roles/storage.objectViewer` đối với các object trong thư mục đã xuất bản.
     - API quản trị AdminCP: Quyền `roles/storage.objectUser` (chỉ giới hạn trên Story Bucket, không cấp quyền toàn cục trên Cloud Project).
4. **Nhật ký kiểm toán (Audit Trail):**
   - Mọi thao tác xuất bản, ẩn, thay thế nội dung, rollback đều ghi lại bản ghi nhật ký:
     ```typescript
     export interface StoryAuditEntry {
       id: string;
       timestamp: string;
       action: "PUBLISH" | "HIDE" | "UPLOAD_CONTENT" | "UPDATE_META" | "ROLLBACK";
       characterId: string;
       chapterId: string;
       authorId: string;
       ipAddress?: string;
       previousRevision: number;
       newRevision: number;
       comment?: string;
     }
     ```
5. **Bộ đệm & Vô hiệu hóa Cache (Cache Invalidation):**
   - API công khai `/api/runtime/story` trả về HTTP headers:
     `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600` cùng `ETag: W/"<generation>"`.
   - Khi AdminCP thực hiện chuyển trạng thái xuất bản, generation của manifest thay đổi, làm vô hiệu hóa ETag ngay lập tức trên CDN và Edge caches.
6. **Xử lý sự cố (Failure Handling & Degradation):**
   - Khi GCS gặp lỗi quá tải tạm thời hoặc gián đoạn mạng, adapter sử dụng cơ chế retry với exponential backoff (tối đa 3 lần).
   - Nếu lỗi kéo dài, API trả về mã lỗi 503 có cấu trúc, thông báo rõ ràng cho AdminCP mà không làm sập tiến trình Node.js.
7. **Prerequisites rõ ràng — Không tự tạo tài nguyên Cloud trong Plan:**
   - Để kích hoạt chế độ sản xuất, hạ tầng GCP cần được cấu hình trước bởi DevOps/Chủ dự án:
     - Tạo GCS Bucket: `gs://starfront-production-stories` (bật Object Versioning).
     - Biến môi trường: `GCS_STORY_BUCKET_NAME=starfront-production-stories`.
     - Cấp quyền IAM cho Cloud Run Service Account.
   - Khi chưa có các biến môi trường trên, hệ thống tự động chạy ở chế độ fallback an toàn và công bố rõ cờ trạng thái: `PERSISTENCE_NOT_CONFIGURED`.

---

## 3. FILE-DRIVEN STORY DISCOVERY & MANAGEMENT

### 3.1. Cấu trúc thư mục dữ liệu File-driven chuẩn
Hệ thống tổ chức cấu trúc lưu trữ dựa trên file, ánh xạ chính xác theo 12 Canonical Pilot Class IDs:

```text
stories/
  ├── valentine/                          # C08 - Valentine Aurelia Vance
  │   ├── chapter-01.md                   # Toàn văn văn xuôi chương 1
  │   ├── chapter-01.meta.json            # Metadata, quote, scene anchors chương 1
  │   ├── chapter-02.md
  │   ├── chapter-02.meta.json
  │   └── ...
  ├── alviss/                             # C01 - Alviss
  ├── eric/                               # C02 - Eric
  ├── marcus/                             # C03 - Marcus
  ├── victor/                             # C04 - Victor (KHÔNG dùng placeholder Sean)
  ├── kaelen/                             # C05 - Kaelen
  ├── lyra/                               # C06 - Lyra
  ├── selena/                             # C07 - Selena (KHÔNG dùng placeholder Selene)
  ├── fortuna/                            # C09 - Fortuna
  ├── aria/                               # C10 - Aria
  ├── rhea/                               # C11 - Rhea
  └── nova/                               # C12 - Nova
```

### 3.2. Quy ước đặt tên file và Schema Metadata
- **Tên tệp Markdown:** Bắt buộc tuân thủ định dạng chuẩn `chapter-{NN}.md`, trong đó `{NN}` là số thứ tự chương gồm đúng 2 chữ số (ví dụ: `chapter-01.md`, `chapter-02.md` ... `chapter-10.md`).
- **Tên tệp Metadata:** Bắt buộc tương ứng `chapter-{NN}.meta.json`.

#### Lược đồ Metadata JSON (`chapter-{NN}.meta.json`):
```json
{
  "$schema": "https://starfront.game/schemas/story-chapter-meta-v2.json",
  "chapterId": "chap-01",
  "chapterNumber": 1,
  "classId": "valentine",
  "characterName": "Valentine",
  "title": "Ánh sáng cuối cùng tại Elysia",
  "version": "1.0.0",
  "summary": "Quyết định định mệnh giữa đoàn tàu hàng trăm bệnh nhân và đội ngũ đồng đội bị cô lập.",
  "quote": "“Tôi không hứa rằng mọi người sẽ không bị thương. Nhưng tôi hứa sẽ làm tất cả những gì có thể để đưa họ trở về.”",
  "estimatedReadTimeMinutes": 4,
  "editorialStatus": "APPROVED",
  "provenance": {
    "sourceDocument": "docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md",
    "authoredDate": "2026-10-21",
    "verifiedBy": "Chủ dự án & Lead Editor"
  },
  "anchors": [
    {
      "anchorId": "val-ch01-scene-01",
      "placementTag": "scene-evac-elysia",
      "fallbackParagraphIndex": 4,
      "assetId": "valentine-story-001",
      "assetPath": "/images/valentine-story-001.webp",
      "caption": "Valentine điều phối phi đội sơ tán trong bão bức xạ Elysia",
      "aspectRatio": "16:9",
      "status": "PLANNED"
    }
  ]
}
```

### 3.3. Cơ chế Khám phá Động (Story Discovery Engine) trong AdminCP
1. **Quét dữ liệu (Storage Scanning):**
   - Khi Admin truy cập mục `AdminCP → Nội dung → Character Stories` hoặc bấm nút **`[LÀM MỚI / QUÉT LẠI]`**, hệ thống thực hiện quét danh mục các file trong `stories/`.
   - Không thực hiện quét định kỳ từng giây (zero constant polling) để tiết kiệm băng thông và tài nguyên CPU.
2. **Tự động nhận biết chương mới (New Chapter Auto-Detection):**
   - So sánh danh sách tệp `.md` / `.meta.json` tìm thấy trong bucket với danh sách chương đã đăng ký trong `story-publication.json`.
   - Nếu phát hiện tệp mới hợp lệ chưa có trong cấu hình xuất bản:
     - Tự động gán trạng thái khởi tạo: **`DRAFT` (Mặc định TẮT / Publication OFF)**.
     - Hiển thị nhãn nổi bật `MỚI PHÁT HIỆN // CHƯA XUẤT BẢN` trên bảng điều khiển AdminCP.
3. **Bộ thẩm định nội dung tải lên (Upload & Ingestion Validator):**
   - AdminCP cung cấp form upload file `.md` và `.meta.json`.
   - Trước khi lưu vào persistent store, bộ thẩm định kiểm tra nghiêm ngặt:
     - Quy chuẩn đặt tên: Đúng định dạng `chapter-{NN}.md`.
     - Tính hợp lệ của Schema JSON.
     - Trùng lặp Chapter ID: Phát hiện và cảnh báo nếu ghi đè chương đã có.
     - Kiểm tra kích thước và tính toàn vẹn (Checksum SHA-256).
     - Rà soát các thẻ neo Artwork (Anchor Tag Linting).
4. **Xem trước (Preview Sandbox):**
   - Admin có thể nhấn nút `[XEM TRƯỚC // PREVIEW]` để đọc toàn bộ chương với giao diện Immersive Reader chính xác như người chơi sẽ thấy, trước khi đưa ra quyết định bật xuất bản công khai.

---

## 4. TÁCH BẠCH BA NHÓM TRẠNG THÁI ĐỘC LẬP (THREE INDEPENDENT STATUS DIMENSIONS)

Để loại bỏ hoàn toàn các giả định sai lầm và ngăn chặn việc vô tình xuất bản nội dung chưa hoàn thiện, hệ thống phân tách dứt khoát 3 nhóm trạng thái:

```text
┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
│    EDITORIAL STATUS     │    │    CONTENT READINESS    │    │   PUBLICATION STATUS    │
│  (Quyết định Biên tập)   │    │  (Độ khả dụng Văn bản)  │    │  (Trạng thái Kỹ thuật)  │
├─────────────────────────┤    ├─────────────────────────┤    ├─────────────────────────┤
│ • APPROVED              │    │ • MISSING               │    │ • DRAFT                 │
│ • PROVISIONAL           │    │ • SUMMARY_ONLY          │    │ • HIDDEN                │
│ • HOLD                  │    │ • FULL_BODY_IMPORTED    │    │ • PUBLISHED             │
│                         │    │ • VERIFIED              │    │                         │
└─────────────────────────┘    └─────────────────────────┘    └─────────────────────────┘
```

### 4.1. Định nghĩa chi tiết từng chiều trạng thái

#### Chiều 1: Editorial Status (Trạng thái Phê duyệt Biên kịch / Canon)
- **`APPROVED`**: Cốt truyện đã được chủ dự án phê duyệt về mặt thế giới quan (canon), nhân vật và hướng phát triển.
- **`PROVISIONAL`**: Bản thảo tạm thời, nội dung có thể điều chỉnh trong các đợt rà soát sau.
- **`HOLD`**: Cốt truyện niêm phong cấp cao, tuyệt mật, cấm phát hành ra bên ngoài.

#### Chiều 2: Content Readiness (Mức độ Khả dụng của Văn bản Thực tế)
- **`MISSING`**: Chưa có bất kỳ văn bản nào trong hệ thống lưu trữ.
- **`SUMMARY_ONLY`**: Mới chỉ có bản tóm tắt ý chính 1–2 câu, chưa có văn bản toàn văn.
- **`FULL_BODY_IMPORTED`**: Toàn văn văn xuôi đã được đưa vào hệ thống tệp nhưng chưa qua khâu kiểm chứng đối chiếu phiên bản gốc.
- **`VERIFIED`**: Toàn văn đã được kiểm chứng đối chiếu provenance, chuẩn chính tả, độ dài đoạn văn và thẻ neo artwork hợp lệ.

#### Chiều 3: Publication Status (Trạng thái Công bố Kỹ thuật)
- **`DRAFT`**: Chương đang ở chế độ nội bộ, chỉ hiển thị trong AdminCP / Preview nội bộ. Mọi chương mới đều ở trạng thái này theo mặc định.
- **`HIDDEN`**: Chương đã từng được lưu/xuất bản nhưng hiện bị tạm ẩn khỏi Public Reader (vẫn bảo toàn nguyên vẹn nội dung và trạng thái biên tập).
- **`PUBLISHED`**: Chương đang được phát hành công khai cho toàn bộ người chơi đọc trong Immersive Reader.

### 4.2. Các Ràng Buộc Bất Biến (System Invariants)
1. **Độc lập tuyệt đối:**
   - Một chương mang trạng thái `APPROVED` **KHÔNG TỰ ĐỘNG** có toàn văn văn xuôi trong repository (`APPROVED` != `VERIFIED`).
   - Một chương có file Markdown (`FULL_BODY_IMPORTED`) **KHÔNG TỰ ĐỘNG** được xuất bản (`FULL_BODY_IMPORTED` != `PUBLISHED`).
   - Một chương chuyển sang `HIDDEN` vẫn giữ nguyên vẹn trạng thái `APPROVED` và tệp văn bản đã lưu.
2. **Khởi tạo An toàn (Safe Default):**
   - Mọi chương mới tải lên luôn có Publication Status là **`DRAFT` (Công tắc TẮT mặc định)**.
3. **Cấm xuất bản PROVISIONAL / HOLD:**
   - Hệ thống chặn cứng ở tầng API: Tuyệt đối không cho phép chuyển trạng thái sang `PUBLISHED` đối với các chương mang nhãn `PROVISIONAL` hoặc `HOLD` nếu chưa có văn bản phê duyệt mới của chủ dự án.
4. **Loại bỏ kiểm tra 200 từ đơn thuần:**
   - Kiểm tra độ dài >= 200 từ chỉ là điều kiện lọc rác tối thiểu, **không được coi là bằng chứng chứng minh toàn văn chính thức**.
   - Điều kiện đủ để xuất bản đòi hỏi bộ tiêu chí:
     `Editorial Status === 'APPROVED'` **VÀ** `Content Readiness === 'VERIFIED'` **VÀ** `Provenance Verified === true`.

---

## 5. RÀ SOÁT & HIỆU CHỈNH CANON CỐT TRUYỆN 12 PILOT

### 5.1. Hiệu chỉnh cốt truyện Pilot Valentine Aurelia Vance
Đối chiếu chặt chẽ giữa `VALENTINE_V2_STORY_APPROVAL_AND_ASSET_STATUS.md`, `FND8_8_2_3_E2_PROFILE_STORY_DATA_CONTRACT_AND_HANDOFF.md`, và mã nguồn thực tế:
- **Nguyên tắc xác thực:** Các chương 01–06 của Valentine **đã từng được biên soạn trước đó** trong quá trình xây dựng thế giới quan. Việc repository hiện tại chưa chứa đầy đủ toàn văn Chương 02–04 chỉ phản ánh vấn đề đồng bộ tệp mã nguồn, **tuyệt đối không được kết luận sai lầm rằng các chương này chưa từng được sáng tác**.
- **Chính sách nội dung:**
  - Tuyệt đối không tự ý "viết lại" (hallucinate) các chương từ bản tóm tắt ngắn.
  - Tuyệt đối không sử dụng các bản nháp cũ đã bị bác bỏ làm tài liệu canonical.
  - Đối với các chương đã duyệt nhưng chưa đồng bộ tệp toàn văn, gán nhãn trạng thái chính xác: **`PENDING_EXACT_TEXT_RECOVERY`** (Chờ khôi phục nguyên văn bản quyền).

#### Bảng xác minh chi tiết 10 Chương truyện của Valentine Vance:

| Chương số & Tiêu đề | Editorial Status | Nguồn phê duyệt (Approved Source) | Khả dụng nguyên văn (Exact Full Text) | Tình trạng Runtime (Import Status) | Điều kiện xuất bản (Publication Eligibility) | Tình trạng Artwork (Story Art) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Chương 01: Ánh sáng cuối cùng tại Elysia** | `APPROVED` | Vance Arc Canon (`character-profile-data.ts`) | **ĐÃ CÓ TOÀN VĂN** (6 đoạn văn xuôi hoàn chỉnh) | `VERIFIED` | **ĐỦ ĐIỀU KIỆN (ELIGIBLE)** | Sẵn sàng (Tranh toàn thân + Chân dung CDN; Scene Art Planned) |
| **Chương 02: Ca trực đầu tiên tại Trạm Cứu hộ Quỹ đạo** | `APPROVED` | Vance Arc Canon (Elysia Station Logs) | `PENDING_EXACT_TEXT_RECOVERY` | `SUMMARY_ONLY` | **CHƯA ĐỦ ĐIỀU KIỆN** (Chờ khôi phục nguyên văn) | 0 ảnh (Text-only) |
| **Chương 03: Tín hiệu bị cô lập ở Vành đai Asteroid** | `APPROVED` | Vance Arc Canon (Asteroid Rescue Incident) | `PENDING_EXACT_TEXT_RECOVERY` | `SUMMARY_ONLY` | **CHƯA ĐỦ ĐIỀU KIỆN** (Chờ khôi phục nguyên văn) | 0 ảnh (Text-only) |
| **Chương 04: Lằn ranh đỏ giữa hai mệnh lệnh** | `APPROVED` | Vance Arc Canon (Mercy Wing Ethics) | `PENDING_EXACT_TEXT_RECOVERY` | `SUMMARY_ONLY` | **CHƯA ĐỦ ĐIỀU KIỆN** (Chờ khôi phục nguyên văn) | 0 ảnh (Text-only) |
| **Chương 05: Học viện Y sinh Không gian và Lời thề** | `PROVISIONAL` | Vance Early Years (Draft Outline) | `PENDING_EXACT_TEXT_RECOVERY` | `SUMMARY_ONLY` | **BỊ KHÓA BIÊN TẬP** (Chờ chủ dự án duyệt bản chính thức) | 0 ảnh (Text-only) |
| **Chương 06: Chuyến bay thử nghiệm của Mercy Wing** | `PROVISIONAL` | Prototype Shield Flight Tests | `PENDING_EXACT_TEXT_RECOVERY` | `SUMMARY_ONLY` | **BỊ KHÓA BIÊN TẬP** (Chờ chủ dự án duyệt bản chính thức) | 0 ảnh (Text-only) |
| **Chương 07: Bí mật bên dưới tầng ngầm Elysia** | `HOLD` | Starfront Classified Level II | `CLASSIFIED_SEALED` | `MISSING` | **NIÊM PHONG (CANON_HOLD)** | Không khả dụng |
| **Chương 08: Bức màn che phủ cuộc sơ tán** | `HOLD` | Starfront Classified Level II | `CLASSIFIED_SEALED` | `MISSING` | **NIÊM PHONG (CANON_HOLD)** | Không khả dụng |
| **Chương 09: Đối đầu trong giông bão** | `HOLD` | Starfront Classified Level III | `CLASSIFIED_SEALED` | `MISSING` | **NIÊM PHONG (CANON_HOLD)** | Không khả dụng |
| **Chương 10: Nguyện ước không bao giờ lãng quên** | `HOLD` | Starfront Classified Level Supreme | `CLASSIFIED_SEALED` | `MISSING` | **NIÊM PHONG (CANON_HOLD)** | Không khả dụng |

### 5.2. Chuẩn hóa Danh mục 12 Canonical Pilot Persona
Bảo đảm tính chính xác của 12 Class ID và tên nhân vật theo chuẩn `FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md`, loại bỏ các tên gọi placeholder nháp:
1. `alviss` / **Alviss** (C01, Nam) — Tốc độ, cận chiến linh hoạt trên không.
2. `eric` / **Eric** (C02, Nam) — Hỏa lực tấn công hạng nặng.
3. `marcus` / **Marcus** (C03, Nam) — Sĩ quan chiến thuật công thủ toàn diện.
4. `victor` / **Victor** (C04, Nam) — Phòng thủ giáp hạng nặng, che chắn đồng đội. *(Chuẩn hóa: Victor — Tuyệt đối KHÔNG dùng tên placeholder nháp "Sean")*.
5. `kaelen` / **Kaelen** (C05, Nữ) — Tình báo, né tránh cơ động.
6. `lyra` / **Lyra** (C06, Nữ) — Thần tốc, xạ thủ né tránh tầm xa.
7. `selena` / **Selena** (C07, Nữ) — Pháo kích năng lượng tầm xa. *(Chuẩn hóa: Selena — Tuyệt đối KHÔNG dùng tên placeholder nháp "Selene")*.
8. `valentine` / **Valentine** (C08, Nữ) — Quân y chiến trường, cứu hộ, khiên bảo vệ.
9. `fortuna` / **Fortuna** (C09, Nữ) — Chiến lược gia cơ hội, may mắn.
10. `aria` / **Aria** (C10, Nữ) — Sĩ quan điều phối bay và hỗ trợ năng lượng.
11. `rhea` / **Rhea** (C11, Nữ) — Chỉ huy phòng thủ cơ động, hộ tống.
12. `nova` / **Nova** (C12, Nữ) — Phi công thử nghiệm đột phá, tấn công bất ngờ.

---

## 6. ĐẶC TẢ STORY ARTWORK (0–3 ẢNH / CHƯƠNG) & SCROLL-DRIVEN ENGINE

### 6.1. Quy tắc hiển thị Artwork theo từng chương
- **Định lượng:** Mỗi chương có từ **0 đến 3 ảnh minh họa** (Artwork). Phần lớn các chương là thuần văn xuôi (Text-only, 0 ảnh).
- **Rào cản CDN Runtime:** Chỉ nạp và hiển thị các tranh đã được phát hành chính thức trên CDN runtime (`isAvailableOnDisk === true` hoặc mã HTTP 200). Tuyệt đối không render khung đen rỗng (empty dark box) hay đường dẫn ảnh lỗi (broken image placeholder).

### 6.2. Cơ chế Thẻ Neo Bền Vững (Stable Anchor Identifiers)
Để ngăn ngừa tình trạng trượt vị trí ảnh khi văn bản được biên tập thêm bớt dòng, hệ thống không phụ thuộc đơn thuần vào chỉ số đoạn văn (`paragraphIndex`). Thay vào đó, áp dụng cơ chế thẻ neo bền vững:
1. **Trong tệp Markdown:** Đặt thẻ neo dưới dạng HTML comment hoặc data tag:
   ```markdown
   Không còn đủ thời gian và nhiên liệu cho cả hai chuyến bay, cô phải đưa ra lựa chọn cứu đoàn vận tải.
   <!-- story-anchor: val-ch01-scene-evac -->
   Hàng trăm người đã sống sót trở về đất liền. Nhưng nhóm đồng đội kia không bao giờ trở về nữa.
   ```
2. **Trong Metadata JSON:** Ánh xạ qua `placementTag`:
   ```json
   {
     "anchorId": "val-ch01-scene-01",
     "placementTag": "val-ch01-scene-evac",
     "fallbackParagraphIndex": 4,
     "assetPath": "/images/valentine-story-001.webp",
     "caption": "Valentine điều phối phi đội cứu hộ trong bão Elysia",
     "aspectRatio": "16:9"
   }
   ```

### 6.3. Trải nghiệm tương tác đa thiết bị (Desktop vs Mobile)
- **Trên Desktop:**
  - Tranh minh họa nằm tại Cột Phải chuyên dụng, cố định vị trí (`sticky top-6`).
  - Khi người dùng cuộn tới đoạn văn mang thẻ neo, bộ theo dõi `IntersectionObserver` tự động kích hoạt hiệu ứng chuyển tranh nhẹ nhàng (**Crossfade 300ms**).
  - Không làm giật khung (layout shift) của cột văn bản đang đọc.
  - Khi chương không có tranh (0 ảnh): Cột phải **tự động ẩn hoàn toàn**, cột giữa tự động mở rộng và căn giữa màn hình thanh thoát.
- **Trên Mobile:**
  - Không sử dụng khung tranh sticky chiếm dụng diện tích màn hình điện thoại.
  - Tranh minh họa xuất hiện **Inline (xen kẽ tự nhiên)** ngay bên dưới đoạn văn tương ứng.
  - Chạm vào ảnh để kích hoạt **Fullscreen Lightbox Viewer**, cho phép phóng to, xem chi tiết và đóng lại mà không làm mất vị trí đang đọc.

---

## 7. THIẾT KẾ RESPONSIVE IMMERSIVE STORY READER

### 7.1. Bố cục Breakpoint linh hoạt bên trong V2 Main Viewport
Không áp đặt cứng kích thước cố định (240px + 760px + 420px) cho mọi màn hình. Thay vào đó, thiết kế hệ thống breakpoint linh hoạt:

1. **Màn hình Desktop rộng (>= 1440px):**
   - Bố cục 3 cột hoàn chỉnh:
     - Cột Trái (260px): Mục lục 10 chương, tiến độ đọc (% Scroll), nút đổi cỡ chữ, nút quay lại Profile.
     - Cột Giữa (Tối đa 760px, Căn giữa): Dòng văn bản văn xuôi chính, trích dẫn mở đầu, nút lật chương.
     - Cột Phải (360px - 400px): Khung tranh cố định Sticky Artwork Stage đồng bộ cuộn chuột.
2. **Màn hình Desktop tiêu chuẩn / Laptop (1024px - 1439px):**
   - Bố cục 2.5 cột tối ưu:
     - Cột Trái thu gọn thành Dock biểu tượng hoặc Drawer trượt khi cần mở mục lục.
     - Cột Giữa (680px - 720px) và Cột Phải (300px - 340px) nhận diện tích ưu tiên.
3. **Màn hình Máy tính bảng (Tablet, 768px - 1023px):**
   - Bố cục đọc rộng rãi:
     - Mục lục hiển thị dạng Drawer mở từ cạnh bên khi chạm vào biểu tượng Menu.
     - Văn bản chiếm trung tâm; Artwork xuất hiện dạng Banner trang nhã trên đầu phân cảnh hoặc inline.
4. **Màn hình Điện thoại (Mobile, < 768px):**
   - Bố cục 1 cột tối ưu cho cuộn dọc bằng ngón cái:
     - Top Navigation mỏng (48px) hiển thị tên chương và nút mở Mục Lục Drawer (Bottom Sheet).
     - Văn bản toàn màn hình với lề 16px.
     - Artwork xuất hiện Inline với nút chạm mở phóng to.

### 7.2. Chuẩn mực Typography Chống Mỏi Mắt
- Phông chữ văn xuôi: Sans-serif hiện đại, độ tương phản cao nhưng êm dịu (`#F1F5F9` trên nền vũ trụ sâu `#070A12`).
- Kích thước chữ cơ bản: 17px (Mobile) / 18px (Desktop), hỗ trợ nút tăng giảm nhanh (`A-` / `A+`).
- Khoảng cách dòng chuẩn: `leading-[1.85]` đến `leading-[1.9]`, tạo nhịp điệu thị giác thoải mái cho trải nghiệm đọc dài kỳ.
- Khoảng cách đoạn văn: `margin-bottom: 1.5rem`, thụt đầu dòng nhẹ theo quy chuẩn xuất bản sách.

---

## 8. ĐẶC TẢ ADMINCP STORY PUBLICATION MANAGER

### 8.1. Vị trí Menu và Bố cục Tổng thể
- **Đường dẫn Admin:** `AdminCP → Quản lý Nội dung → Character Stories` (`/admin/stories` hoặc Sub-tab trong AdminCP).
- **Khám phá Động:** Danh sách 12 Pilot và các chương hồi được nạp động từ Persistent Storage Adapter, không hardcode bất kỳ phần tử nào trên giao diện.

### 8.2. Ma trận Thông tin Chương truyện
Bảng điều khiển hiển thị đầy đủ các trường thông tin cho từng chương:
1. **Pilot Persona:** Chân dung đại diện thu nhỏ và tên chính thức (`classCharacterName`).
2. **Chapter Index & ID:** Số thứ tự chương (Chương 01..10) và mã định danh (`chap-01`).
3. **Tiêu đề chương (Title):** Tên chương truyện.
4. **Editorial Status:** Huy hiệu màu sắc (Xanh: `APPROVED`, Vàng: `PROVISIONAL`, Xám đỏ: `HOLD`).
5. **Content Readiness:** Huy hiệu trạng thái dữ liệu (`MISSING`, `SUMMARY_ONLY`, `FULL_BODY_IMPORTED`, `VERIFIED`).
6. **Số lượng Artwork:** Số lượng tranh minh họa hợp lệ (0–3 ảnh).
7. **Trạng thái Xuất bản (Publication):** Công tắc gạt **ON (PUBLISHED) / OFF (HIDDEN / DRAFT)**.
8. **Phiên bản (Version):** Mã phiên bản ngữ nghĩa (Semantic Versioning, ví dụ `1.0.0`).
9. **Thời gian & Người cập nhật:** `lastUpdated` và `updatedBy`.

### 8.3. Bộ Thao tác Quản trị (Admin Actions)
- **Upload / Replace Markdown:** Nạp tệp `.md` mới hoặc tải bản cập nhật có kiểm tra SHA-256 diff.
- **Upload / Update Metadata:** Cập nhật tệp `.meta.json` (sửa trích dẫn, tiêu đề, thẻ neo).
- **Làm mới / Quét lại (`[REFRESH / RESCAN]`):** Quét lại kho tệp để nhận diện các chương mới bổ sung.
- **Xem trước (`[PREVIEW]`):** Mở cửa sổ đọc thử nghiệm để duyệt nội dung thực tế trước khi phát hành.
- **Bật Xuất bản (`PUBLISH ON`):** Kiểm tra các Rào cản (Gates), kích hoạt chương hiển thị công khai.
- **Tạm ẩn (`HIDE OFF`):** Ẩn chương khỏi Public Reader nhưng bảo toàn 100% nội dung và trạng thái biên tập.
- **Lịch sử Phiên bản (`REVISION HISTORY`):** Xem các phiên bản GCS generation trước đó kèm diff tóm tắt.
- **Khôi phục (`ROLLBACK`):** Khôi phục nội dung về một generation cụ thể chỉ bằng một thao tác nhấn.

### 8.4. An ninh và Ngăn chặn Rò rỉ Dữ liệu
- Mọi API thay đổi trạng thái đều được bảo vệ bởi:
  - Xác thực phiên làm việc AdminCP (Session Cookie HMAC).
  - Khóa chống giả mạo yêu cầu (CSRF Token Protection).
  - Kiểm soát đồng thời bằng Optimistic Revision Lock.
- **Chặn tuyệt đối truy cập trái phép:**
  - API công khai `/api/runtime/story` tự động lọc bỏ mọi chương có trạng thái `DRAFT`, `HIDDEN`, hoặc `HOLD`.
  - Nếu người dùng cố ý gọi trực tiếp ID của một chương chưa xuất bản, API trả về `404 Not Found`, bảo vệ tuyệt đối bí mật cốt truyện chưa công bố.

---

## 9. QUY TRÌNH VẬN HÀNH RUNTIME STORY CONFIG

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          1. TÁC GIẢ / BIÊN TẬP                         │
│  - Soạn thảo: stories/valentine/chapter-02.md                          │
│  - Định nghĩa thẻ neo: stories/valentine/chapter-02.meta.json          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Upload qua AdminCP hoặc DevOps Sync
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        2. PERSISTENT STORAGE (GCS)                     │
│  - Lưu tệp Markdown & Metadata vào Bucket bền vững                     │
│  - Cập nhật generation và kích hoạt Object Versioning                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ AdminCP duyệt & Bật [PUBLISH ON]
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    3. ADMINCP PUBLICATION CONTROLLER                   │
│  - Kiểm tra điều kiện: APPROVED + VERIFIED + Provenance                │
│  - Cập nhật story-publication.json bằng generation-match precondition  │
│  - Ghi nhận Audit Trail Log                                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Tự động vô hiệu hóa ETag Cache
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     4. RUNTIME PUBLIC API & READER                     │
│  - Route: GET /api/runtime/story?pilotId=valentine                     │
│  - Trả về danh sách chương đã PUBLISHED                                │
│  - Immersive Story Reader nạp dữ liệu mới tức thì                     │
│  - ZERO REBUILD / ZERO REDEPLOY NEXT.JS                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 10. KẾ HOẠCH PHÂN KỲ TRIỂN KHAI HIỆU CHỈNH (4 BOUNDED PHASES)

Kế hoạch triển khai được điều chỉnh thành 4 giai đoạn độc lập, có ranh giới rõ ràng:

### Phase STORY-01.A — Persistent Story Store + File Discovery + API Contract
- **Mục tiêu:** Xây dựng tầng lưu trữ bền vững (GCS Adapter + Dev Fallback), bộ khám phá file động (`StoryDiscoveryService`), các hàm thẩm định schema tệp, và bộ API Runtime/AdminCP.
- **Phạm vi kỹ thuật:**
  - Định nghĩa TypeScript Schemas chuẩn (`StoryChapterMeta`, `StorySceneAnchor`, `StoryPublicationManifest`).
  - Cài đặt `StoryStorageProvider` interface và `GcsStoryStorageProvider` / `DevFallbackStorageProvider`.
  - Xây dựng `GET /api/runtime/story` (Public API) và `GET/POST /api/admin/story-publication` (Admin API).
- **Tiêu chí nghiệm thu:**
  - Đọc/ghi cấu hình xuất bản atomic thành công; xử lý đúng lỗi xung đột generation; quét và nhận biết file chương mới chuẩn xác; unit test pass 100%.

### Phase STORY-01.B — Immersive Story Reader Desktop & Mobile
- **Mục tiêu:** Xây dựng component đọc truyện chuyên biệt thích ứng toàn màn hình bên trong V2 Main Viewport.
- **Phạm vi kỹ thuật:**
  - Component `ImmersiveStoryReader` với breakpoint đa màn hình (Desktop 3 cột / Tablet 2 cột / Mobile 1 cột).
  - Bộ điều khiển `IntersectionObserver` cho Scroll-Driven Anchor Artwork với crossfade transition 300ms.
  - Component Inline Artwork cho Mobile kèm Fullscreen Lightbox Viewer.
  - Bộ điều chỉnh kích cỡ chữ (A- / A+) và nút điều hướng chuyển chương mượt mà.
- **Tiêu chí nghiệm thu:**
  - Hiển thị Chương 01 của Valentine hoàn hảo trên cả Desktop (1440px), Laptop (1024px) và Mobile (390px); cuộn tranh mượt mà, không giật layout; chế độ 0 ảnh tự ẩn panel phải hoàn hảo.

### Phase STORY-01.C — AdminCP Story Management UI + Publish/Hide + Upload
- **Mục tiêu:** Xây dựng giao diện quản trị xuất bản cốt truyện trong AdminCP.
- **Phạm vi kỹ thuật:**
  - Bảng điều khiển ma trận 12 Pilot × Chapters khám phá từ dữ liệu thực tế.
  - Nút `[LÀM MỚI / QUÉT LẠI]` để cập nhật danh mục tệp.
  - Modal upload file `.md` và `.meta.json` kèm bộ validator chống lỗi schema.
  - Công tắc bật/tắt xuất bản kiểm tra nghiêm ngặt 3 rào cản (Approval Gate, Verification Gate, HOLD Seal Gate).
  - Modal xem trước (Preview Sandbox) và bảng xem lịch sử phiên bản (Revision History).
- **Tiêu chí nghiệm thu:**
  - Upload file mới được nhận diện ngay lập tức; bật/tắt chương thay đổi tức thì ở Public Reader mà không cần rebuild ứng dụng; chặn xuất bản đối với các chương PROVISIONAL/HOLD thành công.

### Phase STORY-01.D — Verified Valentine Story Import + E2E Integration
- **Mục tiêu:** Nhập liệu chính thức Chương 01 Valentine, thiết lập kết nối hoàn chỉnh từ Dossier Tab tới Immersive Reader và AdminCP, chạy kiểm thử tích hợp toàn diện.
- **Phạm vi kỹ thuật:**
  - Lưu trữ tệp chuẩn `stories/valentine/chapter-01.md` và `chapter-01.meta.json`.
  - Tích hợp nút `[ĐỌC TOÀN VĂN // IMMERSIVE READER]` tại Character Category Dossier Story Tab (`/v2/pilots`).
  - Kiểm thử E2E: Quy trình Xuất bản → Đọc truyện → Tạm ẩn → Chặn truy cập → Mở lại.
  - Rà soát an ninh, audit log, và bàn giao tài liệu nghiệm thu.
- **Tiêu chí nghiệm thu:**
  - 100% test luồng đọc và quản trị pass; không phát sinh lỗi console; ứng dụng Next.js ổn định tuyệt đối.

---

## 11. BÁO CÁO PHẢN HỒI 10 MỤC BẮT BUỘC THEO YÊU CẦU

1. **Vì sao local filesystem không phù hợp Cloud Run:**
   - Container Cloud Run là môi trường phi trạng thái (stateless) và tạm thời (ephemeral). Dữ liệu ghi trên đĩa cục bộ bị xóa sạch khi instance khởi động lại hoặc có bản cập nhật mới. Khi mở rộng đa instance, việc ghi đĩa cục bộ trên một instance sẽ không được các instance khác nhìn thấy, gây phân mảnh dữ liệu (Split-Brain).
2. **Chọn persistent storage nào và lý do:**
   - Chọn **Google Cloud Storage (GCS)** vì tính bền vững cao (11 số 9), tương thích hoàn hảo với kiến trúc Cloud Run, hỗ trợ Object Versioning để khôi phục (rollback), và hỗ trợ Precondition Header (`if-generation-match`) cho atomic optimistic locking ngăn chặn xung đột đa tiến trình.
3. **Story Markdown/JSON được lưu ở đâu:**
   - Được tổ chức theo cấu trúc thư mục logic `stories/{classId}/chapter-{NN}.md` và `stories/{classId}/chapter-{NN}.meta.json` trên GCS Bucket (với fallback in-memory/local read-only cho môi trường dev).
4. **AdminCP phát hiện file mới bằng cách nào:**
   - Thông qua dịch vụ `StoryDiscoveryService`, AdminCP quét danh mục object trong storage khi Admin mở trang quản trị hoặc bấm nút `[LÀM MỚI / QUÉT LẠI]`. Các file mới chưa có trong manifest sẽ tự động được nhận diện ở trạng thái `DRAFT` (Publication OFF).
5. **AdminCP upload file ra sao:**
   - AdminCP cung cấp form upload chuyên dụng tiếp nhận `.md` và `.meta.json`, chạy qua bộ validator kiểm tra tính hợp lệ của cú pháp, schema, độ an toàn và tên tệp, sau đó ghi trực tiếp vào persistent storage thông qua authenticated API.
6. **ON/OFF được lưu thế nào mà không rebuild:**
   - Trạng thái công bố được lưu trong tệp cấu hình runtime tập trung (`story-publication.json`) trên GCS. API Runtime đọc trực tiếp cấu hình này và trả về cho Story Reader ở client-side; mọi thay đổi trạng thái có hiệu lực tức thì mà không cần build lại mã nguồn React hay deploy lại container.
7. **Editorial, Readiness và Publication được tách ra sao:**
   - Tách thành 3 chiều độc lập: (1) **Editorial** (`APPROVED`, `PROVISIONAL`, `HOLD`) xác lập tính hợp lệ về mặt cốt truyện; (2) **Readiness** (`MISSING`, `SUMMARY_ONLY`, `FULL_BODY_IMPORTED`, `VERIFIED`) xác lập tính toàn vẹn của văn bản thực tế; (3) **Publication** (`DRAFT`, `HIDDEN`, `PUBLISHED`) kiểm soát hiển thị kỹ thuật tới người chơi.
8. **Cách khôi phục nguyên văn Valentine 01–06:**
   - Ghi nhận trạng thái chính thức: Chương 01–04 đã `APPROVED`, Chương 05–06 là `PROVISIONAL`. Các chương này đã từng được biên soạn trước đó. Thiết lập trạng thái `PENDING_EXACT_TEXT_RECOVERY` cho các chương chưa có tệp trong repo, đồng thời trích xuất nguyên văn từ các hồ sơ lưu trữ chính thức mà không tự ý viết lại hay dùng bản nháp cũ.
9. **Story artwork thay đổi theo cuộn ra sao:**
   - Sử dụng cơ chế thẻ neo bền vững (`anchorId` và `placementTag` trong văn bản) kết hợp bộ theo dõi `IntersectionObserver`. Khi đoạn văn chứa thẻ neo đi vào viewport, tranh ở cột phải (Desktop) kích hoạt hiệu ứng crossfade mượt mà (300ms) mà không giật layout. Với Mobile, ảnh xuất hiện inline kèm tính năng phóng to toàn màn hình.
10. **Phân phase và prerequisites triển khai:**
    - Lộ trình 4 giai đoạn tuần tự: `STORY-01.A` (Persistent Store & API) → `STORY-01.B` (Reader Component) → `STORY-01.C` (AdminCP UI) → `STORY-01.D` (Verified Valentine Import & E2E).
    - **Prerequisites:** Cần cấu hình GCS Bucket `GCS_STORY_BUCKET_NAME` và cấp quyền Service Account trước khi chạy production. Ở môi trường local/chưa cấu hình, hệ thống hoạt động ở chế độ fallback `PERSISTENCE_NOT_CONFIGURED` an toàn.

---

## 12. KẾT LUẬN & DỪNG BƯỚC ĐÚNG ĐIỂM HẸN (CHECKPOINT STORY01-PLAN-02)

Bản thiết kế `STORY01-PLAN-02` đã giải quyết triệt để các rủi ro kiến trúc về hạ tầng Cloud Run, thiết lập cơ chế quản lý cốt truyện hướng tệp (File-driven) chuyên nghiệp, bảo đảm tính toàn vẹn của thế giới quan và sẵn sàng cho việc triển khai từng phân kỳ độc lập khi được chủ dự án phê duyệt.

**Toàn bộ mã nguồn và dữ liệu của ứng dụng trong lượt này được giữ nguyên vẹn 100%. Không có bất kỳ thay đổi runtime code hay deploy nào được thực hiện.**
