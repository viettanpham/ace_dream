# STARFRONT WORLD V2 — UNIVERSAL CDN CONTENT FOUNDATION FOR ALL PILOTS
## KIẾN TRÚC PHÂN PHỐI NỘI DUNG VÀ TỰ ĐỘNG HÓA CDN (GALLERY & STORY CHRONICLES)

> **CHẾ ĐỘ THỰC HIỆN:** PLAN / DEFINE ONLY — AUDIT TWO REPOSITORIES — NO RUNTIME CODE MODIFICATION  
> **PHIÊN BẢN MỤC TIÊU:** R3 RELEASE ARCHITECTURE (Kế thừa và tương thích tuyệt đối với CDN `v2.0-assets-r2`)  
> **NGÔN NGỮ CHỦ ĐẠO:** TIẾNG VIỆT (Giữ nguyên thuật ngữ kỹ thuật, type, schema, API contracts)

---

## TỔNG QUAN VÀ MỤC TIÊU HỆ THỐNG

Dự án **STARFRONT WORLD V2** đang bước vào giai đoạn mở rộng từ cấu hình nội dung cục bộ sang hệ sinh thái quản lý và phân phối nội dung toàn cầu (**Universal Content Foundation**) qua mạng lưới CDN (jsDelivr / Cloudflare R2). 

Hệ thống này được thiết kế để:
1. **Dùng chung cho toàn bộ 12 Pilot canonical** (FND-1/FND-8) và hỗ trợ vô hạn số lượng Pilot mở rộng sau này mà không phải sao chép mã nguồn (Zero Code Duplication).
2. **Tách biệt rành mạch và độc lập** giữa hai phân hệ nội dung: **Visual Art Gallery** và **Story Chronicles (Biên niên sử văn xuôi)**. Mỗi Pilot có thể có Gallery mà chưa có Story, hoặc ngược lại.
3. **Phân quyền và bảo mật biên tập tuyệt đối**: Không đưa văn bản chưa duyệt (`PROVISIONAL`, `REVIEW_ONLY`, `HOLD`) hoặc full prose chưa công bố lên CDN public.
4. **Cơ chế phân giải vạn năng (Universal Content Resolver)**: Cung cấp một Single Source of Truth cho toàn bộ ứng dụng (Showcase, Gallery, Fullscreen Viewer, Story Reader, AdminCP).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STARFRONT V2 CONTENT ECOSYSTEM                        │
├─────────────────────────────────────┬───────────────────────────────────────┤
│    GAME SOURCE REPOSITORY           │        ASSET / CDN REPOSITORY         │
│   (viettanpham/ace_dream)           │    (viettanpham/starfront-assets)     │
│                                     │                                       │
│  ┌───────────────────────────────┐  │  starfront-world-assets/              │
│  │ Character Showcase / Gallery  │  │   ├── content-manifest.json (Universal)│
│  │ Fullscreen Viewer (Slideshow) │  │   ├── images/                         │
│  │ Immersive Story Reader        │  │   │    ├── manifest.json              │
│  │ AdminCP Asset / Story Hub     │  │   │    └── pilots/<pilotId>/          │
│  └──────────────┬────────────────┘  │   │         ├── <pilotId>.json (Meta) │
│                 │                   │   │         ├── files.json (WebP CI)  │
│                 ▼                   │   │         └── gallery.json (UI)     │
│  ┌───────────────────────────────┐  │   └── stories/                        │
│  │ Universal Content Resolver    │◄─┼─────── ├── manifest.json              │
│  │ (Memory Cache, Fallback,      │  │        └── pilots/<pilotId>/          │
│  │  Version Switch, Sanitizer)   │  │             ├── manifest.json         │
│  └───────────────────────────────┘  │             └── chapter-NN.json       │
└─────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 1. AUDIT HIỆN TRẠNG HAI REPOSITORY VÀ QUYỀN HẠN THỰC TẾ

### 1.1. Hiện trạng Game Source Repository (`viettanpham/ace_dream`)
- **Môi trường runtime hiện tại:** Container AI Studio chạy Next.js 15+ App Router, TypeScript, Tailwind CSS v4.
- **Tình trạng Git:** Môi trường workspace `/app/applet` là export runtime container, **không có thư mục `.git` local**, không có Git remote và không có GitHub personal access token (PAT) có quyền ghi.
- **Quyền hạn thực tế:** 
  - **READ / WRITE cục bộ** trong Game Source (`ace_dream`).
  - **KHÔNG THỂ trực tiếp commit, push hay trigger GitHub Actions sang Asset Repository (`starfront-assets`)**.
- **Cơ chế CDN hiện hành trong Game Source:**
  - `lib/game/assets/runtime-asset-config.ts`: Quản lý cấu hình CDN `v2.0-assets-r2`, provider `jsdelivr` / `cloudflare_r2`, atomic save vào `.starfront-config/runtime-asset-config.json`.
  - `lib/game/assets/image-resolver.ts`: Phân giải URL ảnh phân cấp (`images/pilots/<pilotId>/<filename>`).
  - `lib/game/assets/hierarchical-manifest.ts`: Đã có cache in-memory và phân tích manifest phân cấp cấp Pilot.
  - `lib/game/v2/character-content-store.ts`: Story store hiện đang đọc từ thư mục local `stories/valentine/`. Đã hỗ trợ `chapter-01.json` (Full Prose) và `chapter-02.json` -> `chapter-06.json` (Summary Only).

### 1.2. Hiện trạng Asset Repository (`viettanpham/starfront-assets`)
- **Asset Root Canonical:** `starfront-world-assets/`
- **Release tag đang hoạt động:** `v2.0-assets-r2` (200 WebP assets của 9 Pilot: `valentine`, `fortuna`, `aria`, `rhea`, `nova`, `kaelen`, `lyra`, `selena`, `alviss`).
- **3 Pilot còn lại trong 12 Pilot canonical:** `charlotte`, `boreas`, `orion` hiện đang dùng asset fallback V1 từ local hoặc placeholder.
- **Tổ chức thư mục hiện hành:**
  ```text
  starfront-world-assets/
  ├── images/
  │    ├── manifest.json (Discovery Index v2)
  │    └── pilots/
  │         ├── manifest.json (Pilots index)
  │         └── <pilotId>/
  │              ├── manifest.json
  │              ├── files.json
  │              ├── gallery.json
  │              └── *.webp
  ```
- **Hạn chế hiện tại:** Chưa có phân hệ `stories/` trên CDN; Story Valentine hiện chỉ tồn tại trong Game repo.

### 1.3. Phân định quyền hạn và cơ chế phối hợp (Delegation Principle)
Do AI Studio không thể can thiệp trực tiếp vào Git của `starfront-assets`, kiến trúc chia sẻ trách nhiệm rõ ràng:
- **Game Repository (AI Studio xây dựng):** Định nghĩa Schema Contract, viết công cụ tạo & kiểm định dữ liệu (Node CLI scripts), xây dựng Universal Content Resolver trong Game Client để nạp dữ liệu từ CDN, chuẩn bị sẵn GitHub Actions YAML template.
- **Asset Repository (Chủ dự án hoặc CI/CD GitHub):** Đặt các script CLI và Workflow YAML vào repository `starfront-assets`. Khi chủ dự án thêm ảnh/story và tạo release tag `v3.0-assets-r3`, CDN jsDelivr/Cloudflare sẽ tự động cập nhật và phân phối.

---

## 2. SƠ ĐỒ PHÂN CẤP UNIVERSAL CONTENT MANIFEST

Hệ thống manifest mới tổ chức theo dạng cây phân cấp (Hierarchical Tree), bảo đảm tính module hóa, cho phép lazy-loading từng phần nhỏ mà không phải tải toàn bộ dữ liệu 12 Pilot cùng một lúc.

```text
starfront-world-assets/
│
├── content-manifest.json                    [TẦNG 1: Universal Discovery Index Root]
│
├── images/                                  [TẦNG 2A: Phân hệ Visual Art Gallery]
│    ├── manifest.json                       (Giữ nguyên tương thích R2 Index)
│    └── pilots/
│         ├── manifest.json                  (Giữ nguyên tương thích R2 Pilots Index)
│         └── <pilotId>/                     [TẦNG 3A: Thư mục độc lập từng Pilot]
│              ├── <pilotId>.json            (Source Metadata đã duyệt)
│              ├── files.json                (Kiểm kê nhị phân WebP từ CI)
│              ├── gallery.json              (Metadata UI cho Client)
│              └── *.webp                    (Tệp hình ảnh thực tế)
│
└── stories/                                 [TẦNG 2B: Phân hệ Story Chronicles mới]
     ├── manifest.json                       (Story Discovery Index toàn vũ trụ)
     └── pilots/
          └── <pilotId>/                     [TẦNG 3B: Thư mục Story từng Pilot]
               ├── manifest.json             (Mục lục chương & Editorial Status)
               ├── chapter-01.json           (Full Prose + Scene Anchors)
               ├── chapter-02.json           (Summary Only hoặc Prose đã duyệt)
               └── ...
```

### Nguyên tắc kiến trúc cốt lõi:
1. **Pilot Independence:** Pilot A có thể có 35 tranh nhưng 0 chương truyện; Pilot B có 10 chương truyện nhưng chỉ có 2 tranh Core. Resolver xử lý mềm dẻo, không báo lỗi HTTP crash.
2. **Zero Display Name Coupling:** Định danh thư mục và truy vấn hoàn toàn bằng `pilotId` chuẩn hóa (chữ thường, ký tự `[a-z0-9_-]`). Tên hiển thị (`pilotName`, `callsign`) được đọc từ payload manifest.
3. **No Gameplay Logic on CDN:** Tuyệt đối không đưa chỉ số combat, bảng Skill Point, Level Progression (FND-1) lên CDN. CDN chỉ chứa media và nội dung tường thuật (Lore/Narrative).

---

## 3. THIẾT KẾ CHI TIẾT CÁC JSON SCHEMAS

### 3.1. Schema: Universal Content Root (`content-manifest.json`)
Đặt tại root của `starfront-world-assets/`. Cung cấp tổng quan toàn bộ hệ thống nội dung.

```json
{
  "$schema": "https://starfrontworld.com/schemas/v3/content-manifest.json",
  "schemaVersion": "starfront-content-manifest-v3",
  "releaseTag": "v3.0-assets-r3",
  "generatedAt": "2026-10-24T00:00:00.000Z",
  "sourceRepository": "viettanpham/starfront-assets",
  "subsystems": {
    "images": {
      "status": "active",
      "rootPath": "images",
      "indexManifest": "images/manifest.json",
      "totalPilots": 12,
      "totalAssets": 250
    },
    "stories": {
      "status": "active",
      "rootPath": "stories",
      "indexManifest": "stories/manifest.json",
      "totalPilots": 12,
      "totalPublishedChapters": 1
    }
  },
  "pilots": {
    "valentine": {
      "name": "Valentine Aurelia Vance",
      "callsign": "Mercy Wing",
      "hasGallery": true,
      "galleryManifest": "images/pilots/valentine/gallery.json",
      "hasStories": true,
      "storyManifest": "stories/pilots/valentine/manifest.json"
    },
    "fortuna": {
      "name": "Fortuna",
      "callsign": "Lady Luck",
      "hasGallery": true,
      "galleryManifest": "images/pilots/fortuna/gallery.json",
      "hasStories": false,
      "storyManifest": null
    }
  }
}
```

### 3.2. Schema: Gallery Metadata R3 (`gallery.json` & `files.json`)
Trong thư mục `images/pilots/<pilotId>/`:

- **`<pilotId>.json` (Curated Metadata):** Chứa thông tin ngữ cảnh, tiêu đề tác phẩm do biên kịch và art director nhập thủ công.
- **`files.json` (Binary Inventory):** Do script CI/CD quét tự động từ thư mục, tạo SHA-256, kích thước byte, độ phân giải ảnh.
- **`gallery.json` (Consolidated Client Contract):** Sản phẩm hợp nhất giữa metadata và file nhị phân để Client render trực tiếp:

```json
{
  "schemaVersion": "starfront-gallery-v3",
  "pilotId": "valentine",
  "pilotName": "Valentine Aurelia Vance",
  "totalAssets": 35,
  "approvedAssets": 35,
  "coreMapping": {
    "portrait": "valentine-portrait",
    "fullbody": "valentine-fullbody",
    "closeup": "valentine-closeup"
  },
  "artworks": [
    {
      "assetId": "valentine-portrait",
      "filename": "valentine-portrait.webp",
      "path": "images/pilots/valentine/valentine-portrait.webp",
      "role": "core_portrait",
      "category": "core",
      "title": "Chân Dung Chỉ Huy Sĩ Quan Y Tế",
      "description": "Trang phục chỉ huy chính thức của Valentine Vance thuộc Sư đoàn Cứu hộ Không gian Elysia.",
      "width": 1024,
      "height": 1024,
      "aspectRatio": "1:1",
      "byteSize": 142850,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "status": "approved"
    }
  ]
}
```

### 3.3. Schema: Universal Story Discovery Index (`stories/manifest.json`)
```json
{
  "schemaVersion": "starfront-story-index-v1",
  "releaseTag": "v3.0-assets-r3",
  "generatedAt": "2026-10-24T00:00:00.000Z",
  "totalPilotsWithStories": 1,
  "pilots": {
    "valentine": {
      "pilotName": "Valentine Aurelia Vance",
      "manifest": "stories/pilots/valentine/manifest.json",
      "totalChapters": 10,
      "publishedChaptersCount": 1
    }
  }
}
```

### 3.4. Schema: Pilot Story Manifest (`stories/pilots/<pilotId>/manifest.json`)
Chỉ chứa metadata của từng chương để render mục lục / danh sách chương trên Story Reader:

```json
{
  "schemaVersion": "starfront-pilot-story-v1",
  "pilotId": "valentine",
  "pilotName": "Valentine Aurelia Vance",
  "callsign": "Mercy Wing",
  "totalChapters": 10,
  "chapters": [
    {
      "chapterId": "chap-01",
      "chapterNumber": 1,
      "title": "Ánh Sáng Cuối Cùng Tại Elysia",
      "canonicalLibraryTitle": "Ánh Sáng Cuối Cùng Tại Elysia",
      "editorialStatus": "APPROVED",
      "contentStatus": "FULL_PROSE",
      "publicationStatus": "PUBLISHED",
      "file": "chapter-01.json",
      "summary": "Quyết định định mệnh giữa đoàn tàu hàng trăm bệnh nhân và đội ngũ đồng đội bị cô lập.",
      "quote": "“Tôi không hứa rằng mọi người sẽ không bị thương. Nhưng tôi hứa sẽ làm tất cả những gì có thể để đưa họ trở về.”",
      "readingTimeMinutes": 6,
      "wordCount": 780,
      "sha256": "a1b2c3d4..."
    },
    {
      "chapterId": "chap-02",
      "chapterNumber": 2,
      "title": "Ca trực đầu tiên tại Trạm Cứu hộ Quỹ đạo",
      "canonicalLibraryTitle": "Lời Thề Dưới Những Vì Sao",
      "sourceConflict": true,
      "editorialStatus": "APPROVED",
      "contentStatus": "SUMMARY_ONLY",
      "publicationStatus": "REVIEW_ONLY",
      "file": "chapter-02.json",
      "summary": "Thử thách đầu tiên khi tiếp quản buồng lái tàu cứu thương bọc thép trong cơn bão điện từ.",
      "quote": "“Mỗi nhịp tim được giữ lại giữa bão từ đều là một kỳ tích đáng để đánh đổi.”",
      "readingTimeMinutes": 4,
      "wordCount": 180
    }
  ]
}
```

### 3.5. Schema: Story Chapter Content (`stories/pilots/<pilotId>/chapter-NN.json`)
Chứa toàn văn và các điểm neo phân cảnh (Scene Anchors) liên kết với tranh WebP:

```json
{
  "schemaVersion": "starfront-story-chapter-v1",
  "pilotId": "valentine",
  "chapterId": "chap-01",
  "chapterNumber": 1,
  "title": "Ánh Sáng Cuối Cùng Tại Elysia",
  "subtitle": "Kỷ nguyên Starfront — Năm 342 Sau Đại Di Cư",
  "quote": "“Tôi không hứa rằng mọi người sẽ không bị thương. Nhưng tôi hứa sẽ làm tất cả những gì có thể để đưa họ trở về.”",
  "editorialStatus": "APPROVED",
  "contentStatus": "FULL_PROSE",
  "publicationStatus": "PUBLISHED",
  "blocks": [
    {
      "blockId": "b1",
      "type": "paragraph",
      "text": "Tiếng còi báo động xé toạc bầu không khí vốn đã căng thẳng tại Trạm Y tế Tiền phương Elysia..."
    },
    {
      "blockId": "b2",
      "type": "scene",
      "sceneId": "val-ch01-scene-academy",
      "sceneTitle": "Học viện Quân y Không gian",
      "caption": "Valentine trong những ngày đầu tốt nghiệp Học viện Quân y Không gian",
      "artworks": [
        {
          "assetId": "valentine-portrait",
          "placement": "hero",
          "caption": "Chân dung thiếu úy y tế Valentine Vance khi vừa nhận nhiệm sở."
        }
      ]
    }
  ],
  "sha256": "4b9f2c..."
}
```

---

## 4. CHIẾN LƯỢC HỖ TRỢ 12 PILOT CANONICAL VÀ MỞ RỘNG TƯƠNG LAI

### 4.1. Danh mục 12 Pilot Canonical (FND-1 / FND-8)
Hệ thống chuẩn hóa 12 định danh cố định:
1. `valentine` (Valentine Vance — Mercy Wing)
2. `fortuna` (Fortuna — Lady Luck)
3. `aria` (Aria Sterling)
4. `rhea` (Rhea Silva)
5. `nova` (Nova Ray)
6. `kaelen` (Kaelen Cross)
7. `lyra` (Lyra Song)
8. `selena` (Selena Vega)
9. `alviss` (Alviss Sterling)
10. `charlotte` (Charlotte Bronte)
11. `boreas` (Boreas Frost)
12. `orion` (Orion Pax)

### 4.2. Nguyên tắc Data-Driven (Zero Hardcoding)
- **Không hardcode danh sách trong Resolver:** Resolver chấp nhận bất kỳ `pilotId: string` hợp lệ. Khi một Pilot mới (ví dụ `solaria`, `vanguard_pilot_13`) được thêm vào CDN:
  - Chỉ cần thư mục `images/pilots/solaria/` hoặc `stories/pilots/solaria/` xuất hiện trên CDN.
  - Client gọi `universalContentResolver.getPilotGallery('solaria')` sẽ tự động tải `gallery.json` mà không cần viết lại mã nguồn TypeScript.
- **Tiêu chuẩn kiểm định (Validation Rules):**
  - `pilotId` bắt buộc khớp regex: `/^[a-z0-9_-]+$/`.
  - Kháng path traversal (`..`, `/`, `\`).
  - Lọc trạng thái nghiêm ngặt: Phía client chỉ render tác phẩm có `status: "approved"` và chương có `publicationStatus: "PUBLISHED"`.

### 4.3. Cơ chế Fallback tự động đa tầng (Tiered Fallback Matrix)
Khi truy vấn artwork hoặc story của một Pilot:

| Mức độ ưu tiên | Tầng dữ liệu | Điều kiện kích hoạt | Hành vi xử lý |
|---|---|---|---|
| **Mức 1 (Tối ưu)** | CDN R3 Remote | Release tag `v3.0-assets-r3` hoạt động | Tải `gallery.json` hoặc WebP trực tiếp từ CDN jsDelivr/R2 |
| **Mức 2 (Kế thừa)** | CDN R2 Remote | Đang chạy release `v2.0-assets-r2` | Tự động hạ cấp sang schema R2 đã có trong `hierarchical-manifest.ts` |
| **Mức 3 (Cục bộ)** | Local Repository | Mất kết nối CDN hoặc Pilot mới chưa có trên CDN | Đọc asset local trong `public/images/` hoặc `stories/` |
| **Mức 4 (Dự phòng)** | Core Placeholder | Không tìm thấy bất kỳ asset nào của Pilot | Render khung đại diện Vector SVG với tên Pilot & nhãn "Archive Pending" (Không 404) |

---

## 5. KẾ HOẠCH DI CHUYỂN (MIGRATION) VALENTINE LÀM CHUẨN

Valentine là Pilot đầu tiên có đầy đủ dữ liệu cả 2 phân hệ (35 tác phẩm WebP và 10 chương truyện). Đây sẽ là hình mẫu tham chiếu (Reference Implementation) cho toàn bộ 11 Pilot còn lại.

### 5.1. Kế hoạch di chuyển Story Valentine 01–10:
- **Chương 01 (FULL_PROSE_VERIFIED):**
  - Bảo toàn 100% nguyên văn 12 blocks văn xuôi, dấu câu và 3 scene anchors (`val-ch01-scene-academy`, `val-ch01-scene-evac`, `val-ch01-scene-resolve`).
  - Đăng ký công bố: `contentStatus: "FULL_PROSE"`, `editorialStatus: "APPROVED"`, `publicationStatus: "PUBLISHED"`.
  - Tệp xuất bản lên CDN: `stories/pilots/valentine/chapter-01.json`.
- **Chương 02–04 (SUMMARY_ONLY, SOURCE_CONFLICT):**
  - Không có toàn văn đã xác minh. Giữ nguyên tóm tắt, quote, `blocks: []` (rỗng, không bịa văn xuôi giả).
  - Trạng thái biên tập: `editorialStatus: "APPROVED"`, `publicationStatus: "REVIEW_ONLY"`.
  - **Chỉ xuất bản metadata lên manifest, KHÔNG đưa file chương rỗng lên CDN public nếu chưa phát hành**.
- **Chương 05–06 (PROVISIONAL, SOURCE_CONFLICT):**
  - Trạng thái: `editorialStatus: "PROVISIONAL"`, `publicationStatus: "REVIEW_ONLY"`. Giữ trong kho lưu trữ nội bộ Game repo, không xuất bản CDN public.
- **Chương 07–10 (HOLD, MISSING):**
  - Giữ trạng thái niêm phong `editorialStatus: "HOLD"`.

### 5.2. Chuyển dịch Gallery Valentine:
- Đã có 35 file WebP và metadata tại `images/pilots/valentine/`.
- CI script sẽ kiểm kê và tạo `files.json` và `gallery.json` với SHA-256 tương ứng.

---

## 6. BẢO ĐẢM TÍNH TƯƠNG THÍCH NGƯỢC (BACKWARD COMPATIBILITY)

1. **Khả năng tương thích CDN Base URL:**
   - Client tiếp tục hỗ trợ release tag `v2.0-assets-r2` mà không phát sinh lỗi.
   - Khi cấu hình được cập nhật sang `v3.0-assets-r3`, Universal Resolver tự động nhận diện schema mới.
2. **Không phá vỡ `images/manifest.json` và `images/pilots/manifest.json`:**
   - Các API và components hiện hữu phụ thuộc vào cấu trúc R2 vẫn có thể đọc bình thường nhờ lớp Adapter trong Universal Resolver.
3. **Bảo toàn Immersive Story Reader & AdminCP:**
   - Store nội dung (`character-content-store.ts`) ưu tiên đọc từ Remote CDN; nếu CDN không khả dụng hoặc lỗi mạng, tự động fallback về thư mục `stories/<pilotId>/` cục bộ.

---

## 7. THIẾT KẾ UNIVERSAL CONTENT RESOLVER TRONG GAME SOURCE

Tạo một service singleton mới: `lib/game/v2/universal-content-resolver.ts` làm đầu mối tập trung giải quyết toàn bộ nội dung.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   UNIVERSAL CONTENT RESOLVER SERVICE                   │
├────────────────────────────────────────────────────────────────────────┤
│  + getPilotGallery(pilotId): Promise<UniversalGalleryPayload>          │
│  + getPilotStoryIndex(pilotId): Promise<UniversalStoryIndexPayload>    │
│  + getStoryChapter(pilotId, chapterId): Promise<StoryChapterPayload>   │
│  + resolveAssetUrl(pilotId, filename): string                          │
│                                                                        │
│  TÍNH NĂNG BÊN TRONG:                                                  │
│  ├── Multi-Tier Cache (In-Memory Map, TTL 10 phút, Key theo Tag)       │
│  ├── In-Flight Request Deduplication (Chống spam fetch đồng thời)      │
│  ├── Strict Schema Sanitization (Lọc XSS, kiểm tra Type an toàn)       │
│  ├── Automatic Retry & Timeout (Timeout 5s, tối đa 2 lần thử lại)      │
│  └── Offline / Local Fallback Bridge (Đảm bảo app luôn chạy được)      │
└────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết hành vi:
- **Request Deduplication:** Nếu 3 components cùng gọi nạp Gallery của Valentine tại một thời điểm, Resolver chỉ gửi 1 request HTTP duy nhất qua mạng và chia sẻ kết quả Promise.
- **Cache Invalidation:** Khi AdminCP kích hoạt thay đổi phiên bản CDN (ví dụ từ R2 sang R3), gọi `universalContentResolver.clearCache()` để giải phóng toàn bộ cache in-memory ngay lập tức.

---

## 8. THIẾT KẾ AUTO SLIDESHOW CHO FULLSCREEN ART VIEWER (JOB 6)

Dựa trên hotfix thành công ở Character Category Showcase, Fullscreen Art Viewer sẽ được nâng cấp tính năng Trình chiếu tự động độc lập:

### 8.1. Quy tắc hoạt động (UX Contract):
1. **Độc lập trạng thái:** Nút Play/Pause trong Fullscreen hoàn toàn độc lập với Showcase bên ngoài.
2. **Mặc định khi mở:** Khi người dùng click mở Fullscreen Viewer, slideshow **MẶC ĐỊNH Ở TRẠNG THÁI TẠM DỪNG (PAUSED)** để người dùng chiêm ngưỡng bức tranh vừa chọn.
3. **Chu kỳ chuyển ảnh:** Khi người dùng bấm **Play**, hình ảnh tự động chuyển sang ảnh kế tiếp mỗi **6.0 giây**.
4. **Tự động ngắt khi tương tác thủ công:** 
   - Bấm nút **Next / Previous**, click chọn thumbnail ở thanh cuộn đáy, hoặc vuốt (swipe) trên màn hình cảm ứng sẽ **TỰ ĐỘNG TẠM DỪNG (PAUSE)** slideshow để không gây khó chịu cho người dùng.
5. **Vòng lặp vô tận (Infinite Loop):** Khi chiếu đến tác phẩm cuối cùng trong album (ví dụ ảnh 35/35), chu kỳ tiếp theo sẽ chuyển mượt mà về ảnh đầu tiên (ảnh 1/35).
6. **Đồng bộ toàn diện:** Khi ảnh tự chuyển, số thứ tự (index badge), tiêu đề, mô tả tác phẩm và vị trí active trên thanh thumbnail đáy phải đồng bộ tức thì. Thanh thumbnail tự động cuộn (`scrollIntoView({ behavior: 'smooth', inline: 'center' })`).
7. **Dọn dẹp bộ nhớ (Cleanup):** Khi đóng modal Fullscreen, hook `useEffect` phải lập tức `clearInterval` và hủy mọi event listener để chống rò rỉ bộ nhớ (Memory Leak).
8. **Khả năng tiếp cận (Accessibility):** Tự động tắt slideshow nếu hệ điều hành của người dùng bật tùy chọn `prefers-reduced-motion`.

---

## 9. QUY TRÌNH CI/CD VÀ GITHUB ACTIONS RELEASE R3 (JOB 7)

Quy trình phát hành Asset R3 được tự động hóa bằng Workflow GitHub Actions tại Asset Repository:

```
[BƯỚC 1: CONTRIBUTOR]
Thêm ảnh WebP vào starfront-world-assets/images/pilots/<pilotId>/
Thêm/sửa metadata <pilotId>.json và chapter-NN.json
Commit & Push vào nhánh `main` của `viettanpham/starfront-assets`
                      │
                      ▼
[BƯỚC 2: GITHUB ACTIONS CI RUNNER]
Kích hoạt workflow `.github/workflows/validate-and-generate-manifests.yml`
                      │
                      ├─► Kiểm tra định dạng WebP, kích thước, quy chuẩn đặt tên
                      ├─► Tính toán mã SHA-256 cho từng file
                      ├─► Chạy script `generate-r3-manifests.mjs`
                      │     ├── Tạo images/pilots/<pilotId>/files.json
                      │     ├── Hợp nhất tạo images/pilots/<pilotId>/gallery.json
                      │     ├── Validate Story Chapters & Scene Anchors
                      │     ├── Tạo stories/manifest.json và pilot story manifest
                      │     └── Cập nhật content-manifest.json tại root
                      ├─► Đối chiếu tính toàn vẹn (Zero Broken Image Links)
                      │
                      ▼
[BƯỚC 3: DRY-RUN & SMOKE TEST]
Chạy automated test suite xác minh cấu trúc JSON schemas
Nếu phát hiện ảnh thiếu metadata hoặc story anchor trỏ sai ID: HUỶ BỎ & BÁO LỖI
                      │
                      ▼
[BƯỚC 4: RELEASE TAG CREATION]
Chủ dự án kích hoạt workflow phát hành hoặc tạo Git Tag `v3.0-assets-r3`
GitHub Release được đóng gói tự động
                      │
                      ▼
[BƯỚC 5: CDN PROPAGATION & GAME CLIENT ACTIVATION]
jsDelivr tự động purge và cache release tag `v3.0-assets-r3`
Chủ dự án vào AdminCP trong Game: bấm "Chuyển sang v3.0-assets-r3"
Toàn bộ người chơi trải nghiệm nội dung R3 lập tức mà không cần deploy lại web
```

---

## 10. LỘ TRÌNH TRIỂN KHAI VÀ MA TRẬN RỦI RO / NGHIỆM THU

### 10.1. Lộ trình 4 giai đoạn triển khai (Phased Implementation Roadmap):

- **Giai đoạn 1: Chuẩn bị Contracts & Tooling Scripts (Tại Game Source)**
  - Xây dựng types `lib/game/v2/universal-content-types.ts`.
  - Viết CLI Tool `scripts/generate-universal-manifests.mjs` để kiểm thử sinh manifest mẫu.
  - Chuẩn bị file `.github/workflows/release-r3.yml` để bàn giao cho Asset repo.
- **Giai đoạn 2: Xây dựng Universal Content Resolver & Nâng cấp Viewer**
  - Hiện thực `lib/game/v2/universal-content-resolver.ts` với cache in-memory và fallback đa tầng.
  - Nâng cấp Auto Slideshow trong `FullscreenArtViewer` (JOB 6) với timer 6s độc lập.
- **Giai đoạn 3: Di chuyển mẫu hình Valentine (Reference Pilot Migration)**
  - Ánh xạ Story Valentine 01–06 và 35 tác phẩm WebP sang Universal Resolver.
  - Kiểm thử tương thích 100% với Story Reader và Gallery Showcase hiện hữu.
- **Giai đoạn 4: Mở rộng 11 Pilot còn lại và Chuyển giao CDN R3**
  - Bàn giao bộ script và workflow sang `viettanpham/starfront-assets`.
  - Phối hợp tạo Git Tag `v3.0-assets-r3`.
  - Kiểm thử nghiệm thu chéo trên toàn bộ 12 Pilot.

### 10.2. Ma trận rủi ro và Biện pháp phòng ngừa (Risk Mitigation Matrix):

| Rủi ro kỹ thuật | Mức độ | Hậu quả tiềm ẩn | Biện pháp kiểm soát & Phòng ngừa |
|---|---|---|---|
| **Rò rỉ Story nháp chưa duyệt** | Cực kỳ nghiêm trọng | Tiết lộ cốt truyện bí mật chưa hoàn thiện | CI script chỉ cho phép xuất bản chapter có `editorialStatus: "APPROVED"` và `publicationStatus: "PUBLISHED"`. Các chương còn lại giữ ở kho nội bộ. |
| **Đứt gãy liên kết ảnh khi đổi version** | Cao | Giao diện hiện khung ảnh hỏng (404) | Fallback đa tầng trong Universal Resolver: R3 -> R2 -> Local -> Vector Placeholder. Không bao giờ xuất hiện icon 404 vỡ hạt. |
| **Lỗi đồng bộ nhị phân giữa 2 repo** | Trung bình | File WebP có trên CDN nhưng Game không đọc được | Hệ thống dùng SHA-256 checksum kiểm kê và discovery manifest động, không gán cứng tên file cục bộ. |
| **Xung đột hiệu năng do tải dữ liệu lớn** | Thấp | Trình duyệt bị lag khi mở trang | Lazy-loading manifest theo từng Pilot và In-Memory Caching (TTL 10 phút, request deduplication). |

---

## KẾT LUẬN & ĐỀ XUẤT HÀNH ĐỘNG

Bản thiết kế trên giải quyết triệt để bài toán phân phối nội dung lâu dài cho **STARFRONT WORLD V2**, bảo đảm tính module hóa tuyệt đối, tôn trọng nguồn sự thật đã xác nhận của dự án và không làm xáo trộn các tính năng đang hoạt động ổn định.

**Đề xuất bước tiếp theo:**  
Chờ chủ dự án phê duyệt bản thiết kế kiến trúc này trước khi tiến hành viết mã cho Giai đoạn 1 & Giai đoạn 2.
