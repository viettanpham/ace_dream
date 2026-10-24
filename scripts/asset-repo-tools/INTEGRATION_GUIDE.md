# HƯỚNG DẪN TÍCH HỢP BỘ CÔNG CỤ CDN R3 SANG ASSET REPOSITORY
## Repository: `https://github.com/viettanpham/starfront-assets`

Tài liệu này hướng dẫn Chủ dự án các bước chuyển giao và triển khai bộ staging CDN R3 từ game repo `ace_dream` sang asset repo `starfront-assets` trước khi tạo release tag `v3.0-assets-r3`.

---

### BƯỚC 1: Sao chép Script Generator
1. Sao chép tệp `scripts/asset-repo-tools/generate-asset-index.mjs` vào thư mục `scripts/generate-asset-index.mjs` trên nhánh làm việc (ví dụ `version2-r1` hoặc `main`) của repository `starfront-assets`.
2. Kiểm tra quyền thực thi (nếu cần): `chmod +x scripts/generate-asset-index.mjs`.

### BƯỚC 2: Cập nhật Workflow CI/CD
1. Sao chép tệp `scripts/asset-repo-tools/workflows/main.yml` vào `.github/workflows/main.yml` trên `starfront-assets`.
2. Workflow này sẽ tự động chạy mỗi khi có commit ảnh mới hoặc cập nhật metadata Story, tự động sinh lại:
   - `starfront-world-assets/content-manifest.json`
   - `starfront-world-assets/images/manifest.json`
   - `starfront-world-assets/images/pilots/manifest.json`
   - `starfront-world-assets/images/pilots/<pilotId>/files.json`
   - `starfront-world-assets/images/pilots/<pilotId>/gallery.json`
   - `starfront-world-assets/stories/manifest.json`
   - `starfront-world-assets/stories/pilots/valentine/manifest.json`
   - `starfront-world-assets/stories/pilots/valentine/chapter-01.json`

### BƯỚC 3: Đồng bộ Bộ Dữ Liệu Staging
1. Toàn bộ thư mục `staging/starfront-world-assets/` đã được sinh sẵn với đầy đủ 200 tác phẩm WebP của 9 Pilot và Story Valentine Chương 01.
2. Có thể copy đè các tệp JSON vào `starfront-world-assets/` của repository asset.

### BƯỚC 4: Kiểm tra Cục bộ (Dry Run) trên Asset Repo
Chạy lệnh kiểm tra tính toàn vẹn:
```bash
node scripts/generate-asset-index.mjs --validate-only
```
Xác nhận console báo: `✅ PIPELINE RUN COMPLETED SUCCESSFULLY!` với 0 Errors.

### BƯỚC 5: Tạo Release Tag Bất Biến (Khi đã sẵn sàng)
Sau khi commit và push dữ liệu đã duyệt lên `main`:
1. Vào tab **Releases** trên GitHub `viettanpham/starfront-assets`.
2. Nhấn **Draft a new release**.
3. Đặt Tag: `v3.0-assets-r3`.
4. Nhấn **Publish release**.
5. Đợi 30–60 giây để CDN jsDelivr đồng bộ cache tag mới:
   `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v3.0-assets-r3/starfront-world-assets/content-manifest.json`
