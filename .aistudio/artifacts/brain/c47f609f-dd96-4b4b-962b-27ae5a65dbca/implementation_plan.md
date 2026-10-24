# STARFRONT WORLD V2 — UNIVERSAL CDN CONTENT FOUNDATION R3
## BẢN HIỆU CHỈNH KIẾN TRÚC VÀ KẾ HOẠCH TRIỂN KHAI TOÀN DIỆN (REVISED PLAN)

> **CHẾ ĐỘ THỰC HIỆN:** REVISE EXISTING PLAN ONLY — NO RUNTIME CODE MODIFICATION  
> **PHIÊN BẢN MỤC TIÊU:** R3 RELEASE ARCHITECTURE (Kế thừa và tương thích tuyệt đối với CDN `v2.0-assets-r2`)  
> **NGÔN NGỮ CHỦ ĐẠO:** TIẾNG VIỆT (Giữ nguyên thuật ngữ kỹ thuật, type, schema, API contracts)

---

## TỔNG HỢP CÁC QUYẾT ĐỊNH HIỆU CHỈNH THEO YÊU CẦU CHỦ DỰ ÁN

| Mục | Nội dung hiệu chỉnh | Tình trạng |
|---|---|---|
| **1. 12 Pilot Canonical** | Khôi phục chính xác 12 Pilot theo FND-8: **4 Nam** (`alviss`, `eric`, `marcus`, `victor`) và **8 Nữ** (`kaelen`, `lyra`, `selena`, `valentine`, `fortuna`, `aria`, `rhea`, `nova`). Loại bỏ các tên không thuộc FND-8 (`charlotte`, `boreas`, `orion`). | ĐÃ ĐỐI CHIẾU SOURCE |
| **2. Dữ liệu mẫu vs Thật** | Đánh dấu toàn bộ JSON schema trong kế hoạch là `[MẪU SCHEMA MINH HỌA]`. Khi IMPLEMENT, 100% SHA-256, byteSize, kích thước và ID phải đo đạc từ file thật. | ĐÃ ĐỒNG BỘ |
| **3. Workflow CDN** | Báo cáo `UNVERIFIED` trực tiếp từ container đối với nhánh `version2-r1` và `generate-asset-index.mjs` trên repo asset; cung cấp checklist kiểm tra thủ công; cam kết mở rộng pipeline hiện hữu, không tạo workflow trùng lặp. | ĐÃ XÁC LẬP |
| **4. Bảo mật Story** | Định nghĩa rành mạch `PUBLIC_PUBLISHED_CONTENT` vs `PRIVATE_EDITORIAL_SOURCE`. Xác nhận repo public không lưu trữ cốt truyện nháp bí mật. Valentine: chỉ xuất bản Chương 01; Chương 02–10 không công bố. | ĐÃ KHOANH VÙNG |
| **5. Chuyển Release R2 → R3** | Quy trình tạo release tag bất biến, cơ chế nạp CDN jsDelivr, lưu trữ bền vững tại `.starfront-config/runtime-asset-config.json` và quy trình 1-click Rollback. | ĐÃ THIẾT KẾ |
| **6. Kiểm kê Docs & Legacy Test** | Audit toàn bộ Markdown ở root, `docs/` và 6 file `test-*.ts` ở root; xuất bảng phân loại 7 nhóm; thiết kế cấu trúc `STARFRONT_PROJECT_GUIDE.md` và `docs/INDEX.md`. | ĐÃ KIỂM KÊ |
| **7. Lộ trình 5 Checkpoint** | Chia thành 5 Checkpoint độc lập, có điều kiện nghiệm thu và chốt chặn phân quyền rõ ràng giữa Game repo và Asset repo. | ĐÃ PHÂN GIAI ĐOẠN |

---

## 1. XÁC MINH VÀ KHÔI PHỤC DANH MỤC 12 PILOT CANONICAL CHUẨN FND-8

### 1.1. Đối chiếu Nguồn Sự Thật Canonical
Dựa trên tài liệu gốc `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_CHARACTER_ROSTER_V2_DRAFT.md` và runtime registry tại `lib/game/v2/character-profile-data.ts`, 12 nhân vật chính thức của STARFRONT V2 được xác định là:

- **Nhóm 4 Nhân vật Nam (4 Male Archetypes):**
  1. `alviss` (Alviss Sterling) — Offensive Aerial Agility (6/2/6/2/2/2)
  2. `eric` (Eric Vance) — Heavy Frontal Firepower (7/3/3/3/2/2)
  3. `marcus` (Marcus Ray) — Offensive/Defensive Tactics (6/6/2/2/2/2)
  4. `victor` (Victor Cross) — Armored Defense / Shield Anchor (2/6/2/2/6/2)

- **Nhóm 8 Nhân vật Nữ (8 Female Archetypes):**
  5. `kaelen` (Kaelen Cross) — Intelligence / Stealth Evasion (2/2/6/3/2/5)
  6. `lyra` (Lyra Song) — Pure Agility / Aerial Striker (3/2/7/3/2/3)
  7. `selena` (Selena Vega) — Energy Artillery / Combat Caster (6/2/2/6/2/2)
  8. `valentine` (Valentine Vance) — Primary Medic / Rescue / Shield Support (2/2/2/6/6/2)
  9. `fortuna` (Fortuna) — Strategic Luck & Intel (3/2/4/3/2/6)
  10. `aria` (Aria Sterling) — Flight Coordination / Tactical Operations (2/2/5/6/3/2)
  11. `rhea` (Rhea Silva) — Dynamic Escort / Defense Command (2/6/5/2/3/2)
  12. `nova` (Nova Ray) — Experimental Assault / Test Pilot (6/2/3/2/2/5)

### 1.2. Đính chính sai lệch từ bản PLAN trước
- Bản PLAN ban đầu đã liệt kê nhầm `charlotte`, `boreas`, `orion` thay cho `eric`, `marcus`, `victor`. **Đã hủy bỏ hoàn toàn các ID không thuộc FND-8**.
- **Hiện trạng tài nguyên trên CDN R2:** 
  - 9 Pilot đã có thư mục ảnh phân cấp (`images/pilots/<pilotId>/`): `valentine`, `fortuna`, `aria`, `rhea`, `nova`, `kaelen`, `lyra`, `selena`, `alviss`.
  - 3 Pilot nam (`eric`, `marcus`, `victor`) hiện có cặp ảnh Core canonical V1 tại `images/` gốc (`marcus-portrait.webp`, `eric-portrait.webp`, `victor-portrait.webp`). Khi chuyển đổi R3, hệ thống sẽ mở rộng thư mục phân cấp cho cả 3 Pilot này.

---

## 2. PHÂN BIỆT RẠNH MẠCH DỮ LIỆU VÍ DỤ VÀ DỮ LIỆU THỰC TẾ

> [!WARNING]
> Mọi khối JSON bên dưới chỉ mang tính chất minh họa cấu trúc Schema (**Contract Structure Only**). Khi bước vào giai đoạn IMPLEMENT, **tuyệt đối không sao chép các giá trị hash giả định, dung lượng byte hay số lượng tác phẩm giả định vào mã nguồn**. Tất cả phải được tính toán động từ file nhị phân WebP và file JSON nội dung thực tế thông qua CI Tool.

### 2.1. [MẪU SCHEMA MINH HỌA] — Universal Content Root (`content-manifest.json`)
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
      "totalAssets": 200
    },
    "stories": {
      "status": "active",
      "rootPath": "stories",
      "indexManifest": "stories/manifest.json",
      "totalPilots": 1,
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
    }
  }
}
```

### 2.2. [MẪU SCHEMA MINH HỌA] — Gallery Consolidated Contract (`gallery.json`)
*(Lưu ý: SHA-256 bên dưới là chuỗi ví dụ format, sẽ được tính toán bằng `crypto.createHash('sha256')` khi chạy script)*.

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
      "title": "Chân Dung Đại Diện (Portrait)",
      "description": "Chân dung tỉ lệ 1:1 góc nhìn cận cảnh khuôn mặt dịu dàng và ánh mắt kiên định.",
      "width": 1024,
      "height": 1024,
      "aspectRatio": "1:1",
      "byteSize": 142850,
      "sha256": "REAL_HASH_CALCULATED_BY_CI_TOOL",
      "status": "approved"
    }
  ]
}
```

### 2.3. [MẪU SCHEMA MINH HỌA] — Story Chapter Content (`chapter-01.json`)
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
  "readingTimeMinutes": 6,
  "wordCount": 780,
  "blocks": [
    {
      "blockId": "val-ch01-b01",
      "type": "paragraph",
      "text": "Elysia từng là một khu dân cư quỹ đạo nổi tiếng bởi những trung tâm y tế và hành lang vận tải nhân đạo..."
    },
    {
      "blockId": "val-ch01-b02",
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
  "sha256": "REAL_PROSE_HASH_CALCULATED_BY_TOOL"
}
```

---

## 3. ĐỐI CHIẾU WORKFLOW CDN ĐANG HOẠT ĐỘNG VÀ GIỚI HẠN CONTAINER

### 3.1. Báo cáo tình trạng truy cập Asset Repository: UNVERIFIED
- Container AI Studio chạy trong môi trường độc lập, **không sở hữu Git metadata của repository `viettanpham/starfront-assets`**, không có quyền truy cập trực tiếp các nhánh làm việc như `version2-r1`.
- Tình trạng nhánh `version2-r1`, tệp `.github/workflows/main.yml` và script `generate-asset-index.mjs` trên repo asset được phân loại: **`UNVERIFIED_BY_CONTAINER`**.

### 3.2. Phương án kiểm tra thủ công cho Chủ dự án (Manual Checklist)
Chủ dự án thực hiện kiểm tra 4 bước trên `viettanpham/starfront-assets`:
1. Mở GitHub Web UI nhánh `version2-r1` hoặc `main`.
2. Kiểm tra tệp `.github/workflows/main.yml`: Xem xét trigger sự kiện (`on: push` trên nhánh nào, các bước sinh file).
3. Kiểm tra tệp `generate-asset-index.mjs`: Xem cấu trúc output hiện hành (đang sinh `manifests/pilot-v2-artworks.json` hay đã sinh `images/manifest.json`).
4. Đối chiếu release tag hiện hành `v2.0-assets-r2` trên tab Releases.

### 3.3. Nguyên tắc mở rộng Pipeline hiện hữu (Zero Duplicate Workflows)
- AI Studio sẽ **không tạo thêm một workflow song song** (ví dụ `r3-generator.yml`) gây tranh chấp file tạo tự động hoặc race condition khi commit.
- AI Studio sẽ cung cấp bản cập nhật logic nâng cấp tích hợp trực tiếp vào script `generate-asset-index.mjs` có sẵn của asset repo, để runner chỉ chạy duy nhất một pipeline thống nhất.

---

## 4. CHÍNH SÁCH BẢO MẬT VÀ PHÂN QUYỀN NỘI DUNG STORY

### 4.1. Nhận định bảo mật kho mã nguồn công khai (Public Git Reality)
Cả hai repository `ace_dream` và `starfront-assets` đều là kho lưu trữ mở/bán mở trên GitHub. Do đó:
- **Không coi thư mục local `stories/` trong Git là vùng lưu trữ dữ liệu tuyệt mật.**
- Mọi văn bản đưa vào Git repository đều có thể bị đọc qua lịch sử commit hoặc raw URL.

### 4.2. Phân định ranh giới PUBLIC vs PRIVATE
Để bảo vệ trải nghiệm của người chơi và tránh spoil cốt truyện:

1. **`PUBLIC_PUBLISHED_CONTENT` (Phân phối qua CDN jsDelivr / R2):**
   - **ĐIỀU KIỆN KÍCH HOẠT DUY NHẤT:** Phải thỏa mãn đồng thời cả hai cờ:
     `editorialStatus === "APPROVED"` VÀ `publicationStatus === "PUBLISHED"`.
   - **Đối với Valentine:** **CHỈ CÓ DUY NHẤT CHƯƠNG 01** được phép xuất hiện dưới dạng tệp `chapter-01.json` trên CDN public.
   - **Chương 02–10 của Valentine:** Tuyệt đối không xuất bản tệp `chapter-02.json` -> `chapter-10.json` lên CDN public.

2. **`PRIVATE_EDITORIAL_SOURCE` (Quản trị biên tập nội bộ):**
   - Các chương ở trạng thái `SUMMARY_ONLY`, `PROVISIONAL`, `REVIEW_ONLY`, hoặc `HOLD` (như Chương 02–06 của Valentine):
     - Chỉ được xuất hiện dưới dạng khung metadata tóm tắt trong `manifest.json` nội bộ để phục vụ biên tập và đối chiếu xung đột tiêu đề trên AdminCP.
     - `blocks: []` bắt buộc để rỗng; không đưa văn xuôi nháp hay nội dung chưa xác nhận vào bundle.

---

## 5. QUY TRÌNH CHUYỂN RELEASE BỀN VỮNG VÀ ROLLBACK

### 5.1. Quy trình Immutable Release (R2 → R3)
1. **Bất biến (Immutability):** Không bao giờ ghi đè hoặc force-push lên tag `v2.0-assets-r2`. Mọi bổ sung đều được đóng gói thành tag mới `v3.0-assets-r3`.
2. **Kích hoạt CDN:** Sau khi tag `v3.0-assets-r3` được tạo, CDN jsDelivr sẵn sàng phân phối qua đường dẫn:
   `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v3.0-assets-r3/starfront-world-assets/...`
3. **Lưu trữ cấu hình bền vững (Persistence Verification):**
   - Cấu hình phiên bản được lưu bền vững qua `FileAssetConfigStore` tại `.starfront-config/runtime-asset-config.json`.
   - Sử dụng cơ chế ghi nguyên tử (**Atomic Write**): Ghi ra file `.tmp.[timestamp]` sau đó thực hiện rename để chống hỏng file nếu ứng dụng khởi động lại giữa chừng.
   - Kiểm tra **Optimistic Concurrency** thông qua trường `revision`.
4. **Xóa bộ nhớ đệm (Cache Invalidation):**
   - Khi phiên bản thay đổi, `universalContentResolver.clearCache()` và `invalidateHierarchicalManifestCache()` được kích hoạt ngay lập tức để giải phóng cache in-memory.
5. **Cơ chế 1-Click Rollback:**
   - Trường `previousVersion` luôn lưu giữ `v2.0-assets-r2`.
   - Nếu tag mới gặp sự cố (thiếu ảnh, đứt mạng), AdminCP cho phép chuyển ngược về `v2.0-assets-r2` trong 1 giây mà không cần deploy lại ứng dụng.

---

## 6. KIỂM KÊ TOÀN DIỆN DOCS & LEGACY TEST SCRIPTS (AUDIT INVENTORY)

### 6.1. Bảng phân loại Markdown Files (Root & Subdirectories)

| File / Đường dẫn | Phân loại | Lý do kỹ thuật / Hướng xử lý |
|---|---|---|
| `/README.md` | `KEEP_ROOT` | Điểm vào chính của repository GitHub. |
| `/CHANGELOG.md` | `KEEP_ROOT` | Nhật ký thay đổi phiên bản tiêu chuẩn. |
| `/FEATURES.md` | `MOVE_TO_DOCS` | Di chuyển về `docs/progress/FEATURES.md`. |
| `/PROJECT_PLAN.md` | `MOVE_TO_DOCS` | Di chuyển về `docs/roadmap/PROJECT_PLAN.md`. |
| `/ART_DIRECTION.md` | `MOVE_TO_DOCS` | Di chuyển về `docs/art-direction/ART_DIRECTION.md`. |
| `/PIXAI_CHARACTER_PROMPTS.md` | `MOVE_TO_DOCS` | Di chuyển về `docs/art-direction/PIXAI_CHARACTER_PROMPTS.md`. |
| `/FND7_HANDOFF.md` | `MOVE_TO_DOCS` | Tài liệu bàn giao FND-7, đưa vào `docs/foundations/FND7/`. |
| `/FND7_PROGRESS.md` | `MOVE_TO_DOCS` | Tiến độ FND-7, đưa vào `docs/foundations/FND7/`. |
| `/PHASE_5_9_ASSET_MANIFEST.md` | `ARCHIVE_CANDIDATE` | Báo cáo giai đoạn V1 cũ, đưa vào `docs/archive/phase5/`. |
| `/PHASE_5_9_IMPLEMENTATION_REPORT.md` | `ARCHIVE_CANDIDATE` | Báo cáo giai đoạn V1 cũ, đưa vào `docs/archive/phase5/`. |
| `/WORLD_DESIGN.md` | `KEEP_TECHNICAL` | Bản thiết kế thế giới World V2, giữ tại `docs/systems/`. |
| `/WORLD_IMPLEMENTATION_PLAN.md` | `MOVE_TO_DOCS` | Đưa vào `docs/roadmap/`. |
| `/WORLD_ROADMAP_6_32_6_45.md` | `MOVE_TO_DOCS` | Đưa vào `docs/roadmap/`. |
| `/WORLD_UI_REVIEW.md` | `MOVE_TO_DOCS` | Đưa vào `docs/UI_v2/`. |
| `/WORLD_UI_UX_AUDIT.md` | `MOVE_TO_DOCS` | Đưa vào `docs/UI_v2/`. |
| `docs/web-01/*.md` (13 files) | `KEEP_TECHNICAL` | Toàn bộ đặc tả CDN và Image Resolver hiện đang hoạt động. |
| `docs/foundations/FND8/*.md` | `KEEP_TECHNICAL` | Tài liệu nền tảng FND-8, Roster V2 và Trait Catalog. |

### 6.2. Bảng phân loại Legacy Test Scripts ở Root

| File tại Root | Phân loại | Tình trạng trong package.json & Imports |
|---|---|---|
| `/test-combat-log.ts` | `LEGACY_TEST_UNUSED` | Không có trong `npm run test`, script kiểm tra console V1 cũ. |
| `/test-phase3.ts` | `LEGACY_TEST_UNUSED` | Không có trong `npm run test`, script kiểm tra Phase 3 cũ. |
| `/test-phase4.ts` | `LEGACY_TEST_UNUSED` | Không có trong `npm run test`, script kiểm tra Phase 4 cũ. |
| `/test-phase4-1.ts` | `LEGACY_TEST_UNUSED` | Không có trong `npm run test`, script kiểm tra Phase 4.1 cũ. |
| `/test-phase5.ts` | `LEGACY_TEST_UNUSED` | Không có trong `npm run test`, script kiểm tra Phase 5 cũ. |
| `/test-phase5-2.ts` | `LEGACY_TEST_UNUSED` | Không có trong `npm run test`, script kiểm tra Phase 5.2 cũ. |
| `tests/*.test.ts` (43 files) | `LEGACY_TEST_ACTIVE` | Đang chạy chính thức trong lệnh `npm run test`. Phải bảo toàn 100%. |

### 6.3. Thiết kế cấu trúc Document Navigation
- **`STARFRONT_PROJECT_GUIDE.md` (Tạo mới tại Root):** Là cẩm nang duy nhất cho lập trình viên mới, tóm lược FND-1 -> FND-8, hướng dẫn chạy dev, test, cấu hình CDN và các quy tắc kiến trúc tối cao.
- **`docs/INDEX.md` (Tạo mới trong `docs/`):** Bản đồ chỉ dẫn phân loại toàn bộ 40+ tài liệu theo từng phân hệ: Architecture, Foundations, Systems, Web-01 (CDN), UI/UX và Archive.
- *(Lưu ý: Không di chuyển hay xóa file trong phiên PLAN hiện tại).*

---

## 7. CẬP NHẬT LỘ TRÌNH TRIỂN KHAI 5 CHECKPOINTS CÓ ĐIỀU KIỆN KIỂM SOÁT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   STARFRONT V2 — 5-CHECKPOINT ROADMAP                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  CHECKPOINT 1: Foundation Contracts & Tooling (Game Repo)                   │
│  [Chỉ thêm types, CLI script kiểm định; ZERO runtime impact]                │
│                                  │                                          │
│                                  ▼                                          │
│  CHECKPOINT 2: Asset CDN Repo Pipeline (viettanpham/starfront-assets)       │
│  [Bàn giao script mở rộng, kiểm định WebP, phát hành tag v3.0-assets-r3]     │
│  * Chặn: Phải do chủ dự án / Asset CI thực thi và xác nhận *                │
│                                  │                                          │
│                                  ▼                                          │
│  CHECKPOINT 3: Universal Content Resolver & Client Integration (Game Repo)  │
│  [Hiện thực Resolver service, tích hợp Story Reader, Showcase, Fallback]    │
│                                  │                                          │
│                                  ▼                                          │
│  CHECKPOINT 4: Fullscreen Auto Slideshow & Verification (Game Repo)         │
│  [Nâng cấp Slideshow 6s độc lập, chạy lại toàn bộ 43 test suite]            │
│                                  │                                          │
│                                  ▼                                          │
│  CHECKPOINT 5: Docs & Test Cleanup (Game Repo)                              │
│  [Tạo STARFRONT_PROJECT_GUIDE.md, docs/INDEX.md; dọn dẹp có kiểm soát]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết tiêu chí nghiệm thu từng Checkpoint:

- **CHECKPOINT 1: Foundation Contracts & Tooling Scripts (Tại `ace_dream`)**
  - Tạo `lib/game/v2/universal-content-types.ts` chứa đầy đủ Schemas chuẩn.
  - Tạo `scripts/generate-universal-manifests.mjs` kiểm tra và sinh manifest mẫu.
  - Viết unit test xác thực Schema validation.
  - *Nghiệm thu:* `npm run lint` PASS, `npm run test` PASS, không ảnh hưởng bất kỳ trang nào.

- **CHECKPOINT 2: Asset CDN Repository Integration (Tại `starfront-assets`)**
  - Chuyển giao logic nâng cấp cho script `generate-asset-index.mjs` của asset repo.
  - Kiểm tra thực tế: 100% SHA-256 và kích thước byte được quét từ file thật.
  - Tạo Git release tag `v3.0-assets-r3` trên repo asset.
  - *Chặn kiểm soát:* AI Studio không tự tuyên bố PASS Checkpoint 2 nếu chủ dự án chưa xác nhận tag `v3.0-assets-r3` đã hoạt động trên CDN jsDelivr.

- **CHECKPOINT 3: Universal Content Resolver & Integration (Tại `ace_dream`)**
  - Xây dựng `lib/game/v2/universal-content-resolver.ts` với cache in-memory, request deduplication, timeout 5s, và 4 tầng fallback.
  - Cập nhật `character-content-store.ts` nạp Story qua Resolver (Valentine Chapter 01 từ CDN; fallback local an toàn).
  - *Nghiệm thu:* Story Reader và Showcase hiển thị mượt mà trên cả R2 và R3.

- **CHECKPOINT 4: Fullscreen Auto Slideshow & Regression (Tại `ace_dream`)**
  - Hiện thực Auto Slideshow độc lập trong `fullscreen-viewer.tsx` (6 giây/ảnh, tự tạm dừng khi tương tác, vòng lặp vô tận, cleanup timer khi unmount, hỗ trợ reduced-motion).
  - Chạy toàn bộ 43 unit tests hiện hữu + tests mới.
  - *Nghiệm thu:* Slideshow chạy mượt mà trên cả desktop và mobile; 100% tests PASS.

- **CHECKPOINT 5: Documentation & Test Cleanup có kiểm soát (Tại `ace_dream`)**
  - Soạn thảo `STARFRONT_PROJECT_GUIDE.md` tại root và `docs/INDEX.md`.
  - Di chuyển các Markdown báo cáo cũ về `docs/` theo bảng phân loại.
  - Lưu trữ 6 file `test-*.ts` cũ vào thư mục `tests/archive/` (giữ nguyên khả năng chạy độc lập khi cần).
  - *Nghiệm thu:* Root repository sạch sẽ, cấu trúc rõ ràng, không gãy import.

---

## CÁC QUYẾT ĐỊNH CẦN CHỦ DỰ ÁN PHÊ DUYỆT TRƯỚC KHI IMPLEMENT

1. **Phê duyệt Roster 12 Pilot chuẩn FND-8:** Xác nhận danh sách chính thức gồm 4 Nam (`alviss`, `eric`, `marcus`, `victor`) và 8 Nữ (`kaelen`, `lyra`, `selena`, `valentine`, `fortuna`, `aria`, `rhea`, `nova`).
2. **Quy trình triển khai Checkpoint 1:** Đồng ý cho phép AI Studio bắt đầu thực hiện **CHECKPOINT 1** (chỉ tạo file type contract và tool script, hoàn toàn không đụng vào code runtime hiện tại).
3. **Kế hoạch phối hợp Checkpoint 2:** Chủ dự án sẽ nhận script mở rộng từ AI Studio để tích hợp vào asset repository `viettanpham/starfront-assets` khi tạo tag release `v3.0-assets-r3`.
