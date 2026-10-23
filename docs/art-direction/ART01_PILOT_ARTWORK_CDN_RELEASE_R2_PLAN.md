# STARFRONT WORLD V2 — ART-01
# KẾ HOẠCH PHÁT HÀNH CDN PILOT ARTWORK R2 (PLAN & DEFINE ONLY)

**Mã tài liệu:** ART01-PLAN-01  
**Checkpoint đồng bộ:** FND8-HANDOFF-13 + WEB01-HANDOFF-09  
**Giai đoạn:** PLAN / DEFINE ONLY (Không upload, không commit, không kích hoạt)  
**Ngôn ngữ:** 100% Tiếng Việt  

---

## 1. TỔNG QUAN HẠ TẦNG VÀ HIỆN TRẠNG TÀI NGUYÊN

### 1.1. Hiện trạng Release R1 (`v2.0-assets-r1`)
- **Kho lưu trữ:** Public repository `https://github.com/viettanpham/starfront-assets`
- **Release Tag hiện hành:** `v2.0-assets-r1` (Commit `7a5a84d`)
- **CDN Phân phối:** `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/`
- **Tổng số tệp WebP thực tế trên R1:** **26 tệp** (Dung lượng 5.94 MB, 100% SHA-256 duy nhất).
  - **03 Cơ giáp (GEAR):** `aegis-gear.webp`, `falcon-gear.webp`, `vanguard-gear.webp`.
  - **14 Tác phẩm Pilot V1 (7 phi công x 2):** 
    - Marcus Thorne: `marcus-portrait.webp`, `marcus-fullbody.webp`
    - Levi Reed (Alviss): `alviss-portrait.webp`, `alviss-fullbody.webp`
    - Eric Vance: `eric-portrait.webp`, `eric-fullbody.webp`
    - Victor Sterling: `victor-portrait.webp`, `victor-fullbody.webp`
    - Kaelen Cross: `kaelen-portrait.webp`, `kaelen-fullbody.webp`
    - Lyra Song: `lyra-portrait.webp`, `lyra-fullbody.webp`
    - Selena Vega: `selena-portrait.webp`, `selena-fullbody.webp`
  - **09 Tác phẩm Valentine V2 Approved:** `valentine-portrait.webp`, `valentine-fullbody.webp`, `valentine-activity-001.webp`, `valentine-casual.webp`, `valentine-closeup.webp`, `valentine-combat.webp`, `valentine-event-001.webp`, `valentine-story-001.webp`, `valentine-uniform-001.webp`.
- **4 Pilot nữ mới (C09 Fortuna, C10 Aria, C11 Rhea, C12 Nova):** **0 tệp trên CDN R1** (đang dùng Monogram Avatar và khung hồ sơ Concept Approved an toàn, 0 lỗi 404).

### 1.2. Schema Manifest Chuẩn Xác (`manifests/assets-manifest.json`)
Tệp manifest của Release được định dạng theo schema `1.0.0` tương thích hoàn toàn với AdminCP Asset Version Manager và Image Resolver:
```json
{
  "schemaVersion": "1.0.0",
  "packageName": "starfront-world-assets",
  "releaseTag": "v2.0-assets-r2",
  "generatedAt": "2026-10-23T...",
  "totalFiles": 0,
  "totalSizeBytes": 0,
  "totalSizeMB": 0,
  "baseCdnPattern": "https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@{TAG}/",
  "assets": [
    {
      "fileName": "tên_file.webp",
      "relativePath": "images/tên_file.webp",
      "sizeBytes": 123456,
      "format": "webp",
      "width": 1122,
      "height": 1402,
      "category": "portrait | fullbody | combat | closeup | activity | outfit | story | gear | other",
      "pilotId": "mã_pilot",
      "group": "pilots | mecha | items",
      "targetUsage": "character-selection | character-details | gallery | story",
      "sha256": "mã_băm_sha256_64_ký_tự"
    }
  ]
}
```

---

## 2. KIỂM KÊ DANH MỤC 12 PILOT CHO RELEASE R2

| Mã | Tên Phi Công | Tồn tại CDN R1 | File trong Workspace | Cần Transfer từ ChatGPT Library | CORE Slots Thiếu | Dự kiến R2 |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **C01** | **Alviss** | 2 | 0 | Bộ ảnh bổ sung (Combat, Closeup, Activity) | Combat, Closeup, Activity | 2 - 5+ |
| **C02** | **Eric** | 2 | 0 | Bộ ảnh bổ sung (Combat, Closeup, Activity) | Combat, Closeup, Activity | 2 - 5+ |
| **C03** | **Marcus** | 2 | 0 | Bộ ảnh bổ sung (Combat, Closeup, Activity) | Combat, Closeup, Activity | 2 - 5+ |
| **C04** | **Victor** | 2 | 0 | Bộ ảnh bổ sung (Combat, Closeup, Activity) | Combat, Closeup, Activity | 2 - 5+ |
| **C05** | **Kaelen** | 2 | 0 | Bộ ảnh bổ sung (Combat, Closeup, Activity) | Combat, Closeup, Activity | 2 - 5+ |
| **C06** | **Lyra** | 2 | 0 | Bộ ảnh bổ sung (Combat, Closeup, Activity) | Combat, Closeup, Activity | 2 - 5+ |
| **C07** | **Selena** | 2 | 0 | Bộ ảnh bổ sung (Combat, Closeup, Activity) | Combat, Closeup, Activity | 2 - 5+ |
| **C08** | **Valentine** | 9 | 0 | **21 ảnh WebP trang phục** (`outfit-001` đến `outfit-021`) | **ĐỦ 5/5 CORE SLOTS** | **30 ảnh** |
| **C09** | **Fortuna** | 0 | 0 | Bộ ảnh Portrait + Fullbody + Thêm | Cả 5 CORE slots | 2 - 5+ |
| **C10** | **Aria** | 0 | 0 | Bộ ảnh Portrait + Fullbody + Thêm | Cả 5 CORE slots | 2 - 5+ |
| **C11** | **Rhea** | 0 | 0 | Bộ ảnh Portrait + Fullbody + Thêm | Cả 5 CORE slots | 2 - 5+ |
| **C12** | **Nova** | 0 | 0 | Bộ ảnh Portrait + Fullbody + Thêm | Cả 5 CORE slots | 2 - 5+ |
| **GEAR**| **3 Cơ Giáp** | 3 | 0 | Không yêu cầu thêm | Đủ | 3 |

---

## 3. DANH SÁCH GÓI TỆP ZIP CẦN CHỦ DỰ ÁN CUNG CẤP

Vì AI Studio và ChatGPT Library không tự động đồng bộ file nhị phân, để triển khai giai đoạn ART-R2.1, chủ dự án cần upload các gói ZIP sau:

1. **Gói ZIP Valentine Vance Expanded:**
   - Tên khuyến nghị: `valentine-v2-outfits-21.zip`
   - Chứa: 21 tệp WebP từ `valentine-outfit-001.webp` đến `valentine-outfit-021.webp` theo đúng mô tả tại `docs/art-direction/PILOT/VALENTINE/valentine_assets_manifest.json`.

2. **Gói ZIP 4 Phi Công Nữ Mới (Fortuna, Aria, Rhea, Nova):**
   - Tên khuyến nghị: `pilots-new-females-approved.zip`
   - Chứa tối thiểu:
     - `fortuna-portrait.webp`, `fortuna-fullbody.webp`
     - `aria-portrait.webp`, `aria-fullbody.webp`
     - `rhea-portrait.webp`, `rhea-fullbody.webp`
     - `nova-portrait.webp`, `nova-fullbody.webp`
     - (Kèm các ảnh combat/casual/closeup nếu đã được phê duyệt trong Library).

3. **Gói ZIP Bổ Sung 7 Phi Công V1 (Nếu đã duyệt mở rộng):**
   - Tên khuyến nghị: `pilots-v1-expansions.zip` (Tùy chọn theo tiến độ phê duyệt của chủ dự án).

---

## 4. QUY TẮC THIẾT KẾ RELEASE R2 (`v2.0-assets-r2`)

1. **Tính kế thừa tuyệt đối (Cumulative Release):**
   - Giữ nguyên toàn bộ 26 tệp gốc của R1 (3 GEAR, 16 Pilot V1, 7 Valentine V2).
   - Tuyệt đối không thay đổi mã băm SHA-256 hoặc đường dẫn của 26 tệp bắt buộc để vượt qua bộ kiểm tra `CANONICAL_CORE_26_ASSETS` trong `github-release-validator.ts`.
2. **Quy tắc đặt tên và Asset ID:**
   - Dạng chuẩn: `{pilotId}-{category/slot}-{index}.webp`
   - Ví dụ: `valentine-outfit-001.webp`, `fortuna-portrait.webp`, `fortuna-fullbody.webp`.
3. **Độ trung thực hình ảnh:**
   - Sử dụng định dạng WebP nguyên gốc đã duyệt. Không nén lại nhiều lần gây suy giảm chi tiết.
4. **Khả năng hoàn tác (Rollback Safe):**
   - Mọi bản phát hành đều là Immutable Tag. Khi cần hoàn tác, Quản trị viên chỉ cần chuyển Active Release Tag về `v2.0-assets-r1` thông qua AdminCP hoặc CAS API; hệ thống cập nhật tức thì trong 5-10 giây.

---

## 5. TÍCH HỢP VỚI GIAO DIỆN V2 CHARACTER CATEGORY

Khi Release R2 được kích hoạt:
1. **Pilot Roster Avatar:** Tự động nạp ảnh thật của Fortuna, Aria, Rhea, Nova thay thế cho Monogram Badge tạm thời.
2. **Center Stage:** Hiển thị ảnh Fullbody chuẩn tỷ lệ của cả 12 phi công.
3. **Gallery & Thumbnail Carousel:**
   - Hiển thị danh mục ảnh verified tăng lên (Ví dụ: Valentine từ 9 ảnh lên 30 ảnh; các pilot mới từ 0 lên 2–5+ ảnh).
   - Bộ đếm ảnh tính động: `activeCharacter.artworks.filter(a => a.isAvailableOnDisk).length`.
4. **Fullscreen Artwork Viewer:**
   - Nhận danh sách tranh đồng bộ với Gallery. Mở từ ảnh nào hiển thị chính xác chỉ số `ẢNH 0X / YY` tương ứng.
   - Hiển thị đầy đủ thông số kích thước pixel gốc, danh mục và mô tả.

---

## 6. KẾ HOẠCH TRIỂN KHAI 3 BƯỚC (DEPENDENCY ROADMAP)

### ART-R2.1 — Transfer & Stage (Bước Tiếp Theo Cần Duyệt)
- **Hành động:** 
  1. Nhận các file ZIP do chủ dự án cung cấp.
  2. Giải nén vào thư mục staging tạm thời.
  3. Chạy tập lệnh kiểm tra toàn vẹn (Preflight Validator): Checksum SHA-256, kích thước tệp, định dạng WebP chuẩn, không tệp rỗng, không trùng lặp.
  4. Lập bảng đối chiếu `PREFLIGHT_IMPORT_REPORT_R2.md` và trình chủ dự án nghiệm thu danh sách.

### ART-R2.2 — Publish
- **Hành động:**
  1. Hợp nhất danh sách tệp mới vào bộ 26 tệp gốc.
  2. Sinh tệp `manifests/assets-manifest.json` theo đúng schema chuẩn 1.0.0.
  3. Tạo Commit, đẩy lên repository `viettanpham/starfront-assets` và gắn Tag bất biến `v2.0-assets-r2`.
  4. Xác minh sự hiện diện của release trên CDN qua HTTP 200.

### ART-R2.3 — Runtime Activate
- **Hành động:**
  1. Sử dụng tính năng Version Diff trong AdminCP để kiểm tra tính tương thích của `v2.0-assets-r2`.
  2. Kích hoạt phiên bản mới thông qua cơ chế CAS Revision Locking.
  3. Chạy bộ kiểm thử hồi quy `tests/image-resolver.test.ts` và kiểm tra giao diện `/v2/pilots`.
  4. Cập nhật checkpoint bàn giao chính thức.
