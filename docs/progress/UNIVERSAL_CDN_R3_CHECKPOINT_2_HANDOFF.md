# STARFRONT WORLD V2 — UNIVERSAL CDN FOUNDATION R3
## BIÊN BẢN CHUYỂN GIAO CHECKPOINT 2 (HANDOFF DOCUMENT)

**Mã tài liệu:** FND8-WEB01-R3-CP2-HANDOFF  
**Giai đoạn:** CHECKPOINT 2 — ASSET METADATA, CI/CD & PUBLIC STORY FOUNDATION  
**Ngày thực hiện:** 2026-10-24  
**Trạng thái kiểm thử:** PASS 100% (Lint 0 errors, 6/6 Targeted Tests PASS, Generator Script PASS)  
**Phạm vi:** Hoàn thành trọn vẹn CHECKPOINT 2. Tuyệt đối không can thiệp code runtime hiện hành, không chuyển đổi phiên bản CDN R2, không xóa/di chuyển tài liệu Markdown hay legacy tests, không tự tạo GitHub release.

---

### 1. FILE ĐÃ SỬA / TẠO TẠI GAME REPOSITORY (`viettanpham/ace_dream`)

| Đường dẫn tệp | Thao tác | Mô tả chức năng |
|---|---|---|
| `scripts/build-r3-staging-package.mjs` | TẠO MỚI | Script kết nối CDN R2, tổng hợp 200 metadata WebP và xuất cấu trúc staging |
| `scripts/asset-repo-tools/generate-asset-index.mjs` | TẠO MỚI | Script CI/CD chuẩn hóa R3 dùng cho repo asset `starfront-assets` |
| `scripts/asset-repo-tools/workflows/main.yml` | TẠO MỚI | Template GitHub Actions Workflow tự động hóa manifest cho repo asset |
| `scripts/asset-repo-tools/INTEGRATION_GUIDE.md` | TẠO MỚI | Cẩm nang hướng dẫn chủ dự án tích hợp 5 bước vào repo asset |
| `tests/checkpoint-2-asset-cdn-r3.test.ts` | TẠO MỚI | Bộ kiểm thử targeted 6 kịch bản cho toàn bộ dữ liệu staging R3 |
| `docs/progress/UNIVERSAL_CDN_R3_CHECKPOINT_2_HANDOFF.md` | TẠO MỚI | Biên bản chuyển giao kỹ thuật Checkpoint 2 (tệp hiện tại) |

---

### 2. CẤU TRÚC FILE STAGING DỰ KIẾN ĐƯA SANG ASSET REPOSITORY (`viettanpham/starfront-assets`)

Toàn bộ gói staging đã được tạo tại thư mục `staging/starfront-world-assets/`:
```text
staging/starfront-world-assets/
├── content-manifest.json                           [Discovery Index V3 Root]
├── images/
│   ├── manifest.json                               [Discovery Index R2 Tương thích]
│   └── pilots/
│       ├── manifest.json                           [Danh mục 12 Pilot chuẩn FND-8]
│       ├── valentine/                              (35 WebP metadata)
│       │   ├── files.json                          (Kiểm kê SHA-256, kích thước, bytes)
│       │   ├── gallery.json                        (Universal Gallery Manifest V3)
│       │   └── valentine.json                      (Curated editorial metadata)
│       ├── fortuna/ (30 artworks: files.json, gallery.json, fortuna.json)
│       ├── rhea/    (23 artworks: files.json, gallery.json, rhea.json)
│       ├── nova/    (22 artworks: files.json, gallery.json, nova.json)
│       ├── kaelen/  (20 artworks: files.json, gallery.json, kaelen.json)
│       ├── lyra/    (20 artworks: files.json, gallery.json, lyra.json)
│       ├── selena/  (20 artworks: files.json, gallery.json, selena.json)
│       ├── aria/    (20 artworks: files.json, gallery.json, aria.json)
│       ├── alviss/  (10 artworks: files.json, gallery.json, alviss.json)
│       ├── eric/    (2 artworks: files.json, gallery.json, eric.json — V1 Fallback)
│       ├── marcus/  (2 artworks: files.json, gallery.json, marcus.json — V1 Fallback)
│       └── victor/  (2 artworks: files.json, gallery.json, victor.json — V1 Fallback)
└── stories/
    ├── manifest.json                               [Story Index toàn hệ thống]
    └── pilots/
        └── valentine/
            ├── manifest.json                       [Mục lục 10 chương & editorial status]
            └── chapter-01.json                     [Chương 01 TOÀN VĂN DUY NHẤT được phép xuất bản]
```

---

### 3. DANH SÁCH METADATA THỰC SỰ ĐỌC ĐƯỢC

Đã kết nối và đọc thành công 100% từ CDN release `v2.0-assets-r2`:
- **Valentine (35/35):** Đọc trọn vẹn 35 bản ghi từ `images/pilots/valentine/gallery.json` và `files.json`.
- **Fortuna (30/30):** Đọc trọn vẹn 30 bản ghi từ `images/pilots/fortuna/gallery.json` và `files.json`.
- **Rhea (23/23):** Đọc trọn vẹn 23 bản ghi từ `images/pilots/rhea/gallery.json` và `files.json`.
- **Nova (22/22):** Đọc trọn vẹn 22 bản ghi từ `images/pilots/nova/gallery.json` và `files.json`.
- **Kaelen (20/20):** Đọc trọn vẹn 20 bản ghi từ `images/pilots/kaelen/gallery.json` và `files.json`.
- **Lyra (20/20):** Đọc trọn vẹn 20 bản ghi từ `images/pilots/lyra/gallery.json` và `files.json`.
- **Selena (20/20):** Đọc trọn vẹn 20 bản ghi từ `images/pilots/selena/gallery.json` và `files.json`.
- **Aria (20/20):** Đọc trọn vẹn 20 bản ghi từ `images/pilots/aria/gallery.json` và `files.json`.
- **Alviss (10/10):** Đọc trọn vẹn 10 bản ghi từ `images/pilots/alviss/gallery.json` và `files.json`.

---

### 4. METADATA CÒN THIẾU CẦN NHẬP TỪ CHATGPT LIBRARY

- **3 Pilot Nam FND-8 (`eric`, `marcus`, `victor`):** Hiện mới có cặp ảnh Core V1 (`portrait` và `fullbody`). Khi các tác phẩm mở rộng (`combat`, `closeup`, `activity`, `costume`) được phê duyệt từ ChatGPT Library, chúng sẽ được thêm trực tiếp vào thư mục `images/pilots/<pilotId>/` qua script CI/CD.
- **Story của 11 Pilot còn lại:** Hiện tại mới chỉ có Valentine được cấu hình Story. 11 Pilot còn lại được đặt cờ `hasStories: false` và `storyManifest: null` trong `content-manifest.json`.

---

### 5. KẾT QUẢ KIỂM TRA 200 WEBP VÀ SHA-256

- **Tổng số lượng tranh:** Đúng chính xác **200/200 WebP assets**.
- **Mã SHA-256:** 100% các tệp đều có chuỗi SHA-256 xác thực từ CDN R2; không chứa giá trị giả lập hay chuỗi rỗng.
- **Tính duy nhất:** **0 duplicate assetId** trên toàn bộ 200 tác phẩm (đã kiểm chứng qua Set validation trong test suite).
- **An toàn đường dẫn:** 100% đường dẫn là đường dẫn chuẩn (`images/pilots/<pilotId>/<filename>`), không có ký tự path traversal (`..` hoặc `//`).

---

### 6. KẾT QUẢ SCRIPT `.MJS` VÀ VALIDATION

- **Script `scripts/build-r3-staging-package.mjs`:** Chạy thành công, kéo dữ liệu từ CDN R2 và tạo hoàn chỉnh gói staging 12 Pilot trong 4.2 giây.
- **Script `scripts/asset-repo-tools/generate-asset-index.mjs`:** Chạy thành công với cờ `--validate-only`, báo cáo 0 Errors và 0 Warnings.
- **Tính Idempotency:** Chạy lại script nhiều lần cho kết quả nhất quán tuyệt đối, không tạo ra diff ngẫu nhiên.

---

### 7. TÌNH TRẠNG STORY PUBLIC CHAPTER 01: READY

- **Trạng thái:** **`READY`** (Đủ điều kiện xuất bản).
- **Nội dung:** Bảo toàn 100% nguyên văn văn xuôi (12 blocks) và 3 scene anchors (`val-ch01-scene-academy`, `val-ch01-scene-evac`, `val-ch01-scene-resolve`).
- **Scene Anchors:** Đối chiếu thành công 3 ảnh liên kết (`valentine-portrait`, `valentine-fullbody`, `valentine-activity-001`) khớp chính xác với assetId trong 35 tác phẩm WebP của Valentine.
- **Bảo mật tuyệt đối (Gatekeeper PASS):** Tuyệt đối **KHÔNG CÓ** file văn xuôi của Chương 02–10 trong staging. Tránh hoàn toàn việc rò rỉ cốt truyện chưa được duyệt.

---

### 8. TÌNH TRẠNG GITHUB ACTIONS: PREPARED

- **Trạng thái:** **`PREPARED`** (Đã chuẩn bị sẵn file cấu hình và hướng dẫn).
- **Tệp sẵn sàng:** `scripts/asset-repo-tools/workflows/main.yml` đã được tối ưu hóa cho runner Ubuntu, tự động cài Node.js 20, chạy generator và tự commit nếu có thay đổi.
- **Quyền hạn:** Container AI Studio không có quyền truy cập Git của `viettanpham/starfront-assets`, do đó không thể tự kích hoạt hoặc deploy workflow này trực tiếp.

---

### 9. DANH SÁCH CÔNG VIỆC CHỦ DỰ ÁN CẦN THỰC HIỆN THỦ CÔNG

Chủ dự án thực hiện theo hướng dẫn tại `scripts/asset-repo-tools/INTEGRATION_GUIDE.md`:
1. Mở repository `https://github.com/viettanpham/starfront-assets`.
2. Sao chép `scripts/asset-repo-tools/generate-asset-index.mjs` vào thư mục `scripts/` của repo asset.
3. Sao chép `scripts/asset-repo-tools/workflows/main.yml` vào `.github/workflows/` của repo asset.
4. Copy các tệp JSON từ `staging/starfront-world-assets/` vào thư mục `starfront-world-assets/` của repo asset.
5. Chạy lệnh kiểm tra `node scripts/generate-asset-index.mjs --validate-only` trên máy cục bộ hoặc CI.

---

### 10. ĐIỀU KIỆN CẦN CÓ TRƯỚC KHI TẠO TAG R3 VÀ BẮT ĐẦU CHECKPOINT 3

1. **Điều kiện 1:** Chủ dự án commit và push các tệp staging sang nhánh `main` của `starfront-assets`.
2. **Điều kiện 2:** Chủ dự án tạo release tag `v3.0-assets-r3` trên GitHub Releases.
3. **Điều kiện 3:** CDN jsDelivr hoàn tất purge cache và trả về HTTP 200 cho:
   `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v3.0-assets-r3/starfront-world-assets/content-manifest.json`
4. **Nghiệm thu Checkpoint 2:** Chủ dự án duyệt kết quả bàn giao Checkpoint 2 để chuyển sang **CHECKPOINT 3: Universal Content Resolver trong Game Source**.
