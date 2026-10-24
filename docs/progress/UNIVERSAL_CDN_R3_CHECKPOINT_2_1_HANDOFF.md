# STARFRONT WORLD V2 — UNIVERSAL CDN FOUNDATION R3
## BIÊN BẢN CHUYỂN GIAO CHECKPOINT 2.1 (HANDOFF DOCUMENT)
### ĐÓNG GÓI GÓI TÍCH HỢP CDN R3 — KHÔNG PHÁT HÀNH TRỰC TIẾP

**Mã tài liệu:** FND8-WEB01-R3-CP2.1-HANDOFF  
**Giai đoạn:** CHECKPOINT 2.1 — EXPORT CDN R3 INTEGRATION PACKAGE (PACKAGING ONLY)  
**Ngày thực hiện:** 2026-10-24  
**Trạng thái đóng gói:** HOÀN TẤT & ĐÃ XÁC THỰC TOÀN VẸN (2 Tệp ZIP Chuẩn)  
**Tài liệu liên quan:** `METADATA_COVERAGE_REPORT.md`, `INTEGRATION_GUIDE.md`

---

### 1. TỔNG QUAN HAI GÓI TÍCH HỢP ZIP ĐÃ XUẤT XƯỞNG

Hai gói nén đã được tạo độc lập tại thư mục `public/` của Game Repository, sẵn sàng để chủ dự án tải về và tích hợp an toàn:

#### Gói 1: Gói Dữ Liệu Nội Dung R3 (`starfront-r3-asset-data.zip`)
- **Đường dẫn tệp cục bộ:** `/app/applet/public/starfront-r3-asset-data.zip`
- **Đường dẫn tải trực tiếp qua Web Preview:** `https://[DEV_APP_URL]/starfront-r3-asset-data.zip`
- **Dung lượng:** `52,237 bytes` (~51 KB)
- **Mã kiểm tra toàn vẹn SHA-256:** `c6c119e8fa800e838e5e9fb72b0b9a3c71d303c7a8f5b4e8240683ced6db8642`
- **Số lượng tệp bên trong:** Đúng chính xác **42 tệp**, giữ nguyên cấu trúc thư mục từ asset root `starfront-world-assets/`.

#### Gói 2: Gói Công Cụ CI/CD & Hướng Dẫn (`starfront-r3-ci-tools.zip`)
- **Đường dẫn tệp cục bộ:** `/app/applet/public/starfront-r3-ci-tools.zip`
- **Đường dẫn tải trực tiếp qua Web Preview:** `https://[DEV_APP_URL]/starfront-r3-ci-tools.zip`
- **Dung lượng:** `6,676 bytes` (~6.5 KB)
- **Mã kiểm tra toàn vẹn SHA-256:** `32c9e96ee835c86bce234a238d6216ec90b77eab5f60ef112c455e6d1040355c`
- **Số lượng tệp bên trong:** 3 tệp (`generate-asset-index.mjs`, `workflows/main.yml`, `INTEGRATION_GUIDE.md`).

---

### 2. DANH MỤC CHI TIẾT 42 TỆP TRONG GÓI DỮ LIỆU R3

```text
starfront-world-assets/
├── content-manifest.json                             (Discovery Index V3 Root)
├── images/
│   ├── manifest.json                                 (Discovery Index R2 Tương thích)
│   └── pilots/
│       ├── manifest.json                             (Danh mục 12 Pilot canonical FND-8)
│       ├── alviss/    [alviss.json, files.json, gallery.json]       (10 artworks WebP R2)
│       ├── aria/      [aria.json, files.json, gallery.json]         (20 artworks WebP R2)
│       ├── eric/      [eric.json, files.json, gallery.json]         (2 artworks Core V1 Fallback)
│       ├── fortuna/   [fortuna.json, files.json, gallery.json]      (30 artworks WebP R2)
│       ├── kaelen/    [kaelen.json, files.json, gallery.json]       (20 artworks WebP R2)
│       ├── lyra/      [lyra.json, files.json, gallery.json]         (20 artworks WebP R2)
│       ├── marcus/    [marcus.json, files.json, gallery.json]       (2 artworks Core V1 Fallback)
│       ├── nova/      [nova.json, files.json, gallery.json]         (22 artworks WebP R2)
│       ├── rhea/      [rhea.json, files.json, gallery.json]         (23 artworks WebP R2)
│       ├── selena/    [selena.json, files.json, gallery.json]       (20 artworks WebP R2)
│       ├── valentine/ [valentine.json, files.json, gallery.json]   (35 artworks WebP R2)
│       └── victor/    [victor.json, files.json, gallery.json]       (2 artworks Core V1 Fallback)
└── stories/
    ├── manifest.json                                 (Story Index toàn hệ thống)
    └── pilots/
        └── valentine/
            ├── manifest.json                         (Mục lục 10 chương & editorial status)
            └── chapter-01.json                       (Toàn văn 12 blocks & 3 scene anchors)
```

---

### 3. KIỂM ĐỊNH BẢO MẬT VÀ CHỐT CHẶN STORY (GATEKEEPER VERIFIED)

- **Chương 01 Valentine:** Đạt chuẩn 100% (12 blocks văn xuôi, 3 scene anchors liên kết với tranh WebP `valentine-portrait`, `valentine-fullbody`, `valentine-activity-001`).
- **Chương 02–10 Valentine:**
  - Tuyệt đối **KHÔNG CÓ TỆP VĂN XUÔI NÀO** (`chapter-02.json` đến `chapter-10.json`) trong file ZIP xuất xưởng.
  - Trong `manifest.json`, các chương này chỉ xuất hiện dưới dạng mục lục với cờ `publicationStatus: "REVIEW_ONLY"` hoặc `"HOLD"`, không có trường `file` trỏ đến tệp public.
  - Ngăn ngừa 100% nguy cơ lộ cốt truyện nháp bí mật khi release tag được public trên CDN jsDelivr.

---

### 4. QUY TRÌNH CHỦ DỰ ÁN TÍCH HỢP TRÊN NHÁNH `version2-r1`

Chủ dự án thực hiện theo 6 bước an toàn sau tại repository `viettanpham/starfront-assets`:

1. **Tải 2 tệp ZIP:** Tải `starfront-r3-asset-data.zip` và `starfront-r3-ci-tools.zip` từ đường dẫn Web Preview của ứng dụng.
2. **Checkout nhánh làm việc:**
   ```bash
   git checkout version2-r1
   git pull origin version2-r1
   ```
3. **Giải nén Dữ liệu R3:**
   - Giải nén `starfront-r3-asset-data.zip` đè vào thư mục `starfront-world-assets/` của repository asset.
   - Thư mục này chỉ cập nhật/bổ sung các file JSON manifest; không làm ảnh hưởng đến các file `.webp` nhị phân đã có.
4. **Cập nhật Script CI/CD:**
   - Giải nén `starfront-r3-ci-tools.zip`.
   - Copy `generate-asset-index.mjs` vào thư mục `scripts/` (hoặc root của repo asset tùy theo cấu trúc hiện hành).
   - Tham khảo `workflows/main.yml` để cập nhật action kiểm tra tự động (không bắt buộc ghi đè nếu workflow hiện tại đang chạy ổn định).
5. **Chạy Thử Nghiệm Kiểm Tra Cục Bộ (Dry Run):**
   ```bash
   node scripts/generate-asset-index.mjs --validate-only
   ```
   Xác nhận kết quả hiển thị: `✅ PIPELINE RUN COMPLETED SUCCESSFULLY!` với 0 Errors và 0 Warnings.
6. **Commit & Tạo Release Tag Mới (Khi đã sẵn sàng):**
   - Commit các manifest R3:
     ```bash
     git add starfront-world-assets/
     git commit -m "feat(cdn): integrate R3 universal content manifests and story chapter 01"
     git push origin version2-r1
     ```
   - Khi sẵn sàng phát hành toàn cầu: Merge vào `main` và tạo GitHub Release Tag `v3.0-assets-r3`.

---

### 5. ĐIỀU KIỆN CHỐT CHẶN TRƯỚC KHI BẮT ĐẦU CHECKPOINT 3

- [x] Checkpoint 1: TypeScript Contracts & Tooling (PASS)
- [x] Checkpoint 2: Staging Bundle & CI Scripts (PASS)
- [x] Checkpoint 2.1: Đóng gói Export 2 tệp ZIP & Kiểm kê Metadata (PASS)
- [ ] Chủ dự án nghiệm thu Checkpoint 2.1.
- [ ] Chủ dự án tích hợp dữ liệu vào `viettanpham/starfront-assets` và tạo release tag `v3.0-assets-r3`.
- [ ] Xác nhận CDN jsDelivr trả về HTTP 200 cho file `content-manifest.json` của release tag mới.

**HỆ THỐNG ĐANG DỪNG HOÀN TOÀN ĐỂ CHỦ DỰ ÁN NGHIỆM THU.**
