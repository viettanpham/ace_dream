# STARFRONT WORLD V2 — WEB-01
# QUẢN TRỊ RỦI RO VÀ QUY TRÌNH ROLLBACK (MIGRATION RISK & ROLLBACK SPECIFICATION)

**Mã tài liệu:** WEB01-RISK-01  
**Trạng thái:** VERIFIED RUNTIME ROLLBACK & ROADMAP SPECIFICATION  
**Ngày cập nhật:** 2026-10-22 (WEB-01.4 Completed)  
**Mục tiêu:** Nhận diện toàn diện các rủi ro kỹ thuật, thiết lập kịch bản ứng phó sự cố và bảo vệ tuyệt đối mã nguồn cũng như dữ liệu người chơi.

---

## 1. Ma trận phân tích rủi ro kỹ thuật (Risk Assessment Matrix)

| Mã rủi ro | Mô tả rủi ro | Xác suất | Mức độ ảnh hưởng | Biện pháp phòng ngừa kỹ thuật | Trạng thái nghiệm thu |
| :---: | :--- | :---: | :---: | :--- | :---: |
| **R-01** | jsDelivr CDN gặp sự cố kết nối, bị chặn mạng cục bộ hoặc timeout | Thấp | Nghiêm trọng | Cơ chế Fallback sang Local Placeholder SVG (`/icon.svg`) và switch biến môi trường về `local` trong 5 giây. | **ĐÃ XÁC MINH (VERIFIED)** |
| **R-02** | Xóa nhầm tệp trên GitHub Release hoặc sai cấu trúc đường dẫn | Rất thấp | Nghiêm trọng | Xác minh 100% URL mẫu bằng HTTP GET (kiểm tra Status 200 và MIME `image/webp`) trước khi xóa bản sao cục bộ. | **ĐÃ XÁC MINH (26/26 MATCH)** |
| **R-03** | Bộ đệm CDN (Cache) giữ bản cũ khi cập nhật artwork cùng tên | Cao | Trung bình | **Bắt buộc dùng Immutable Git Tags** (ví dụ `@v2.0-assets-r1`, `@v2.0-assets-r2`), tuyệt đối không dùng nhánh `@main` hoặc `@latest`. | **TUÂN THỦ 100%** |
| **R-04** | Giới hạn dung lượng của jsDelivr và GitHub | Rất thấp | Cao | jsDelivr giới hạn tối đa 20 MB/tệp và khuyến nghị release < 50 MB. Toàn bộ 26 tệp hiện tại chỉ 5.94 MB, tệp lớn nhất 527 KB -> Nằm trong vùng an toàn tuyệt đối. | **AN TOÀN TUYỆT ĐỐI** |
| **R-05** | Save game cũ chứa đường dẫn cục bộ bị lỗi | Thấp | Cực lớn | Không đổi schema dữ liệu trong `data.ts` và save JSON; chỉ phân giải qua `resolveImageUrl()` tại tầng hiển thị React. | **BẢO TOÀN 100%** |
| **R-06** | Xung đột làm gián đoạn tiến độ FND-8 Character Category V2 | Rất thấp | Lớn | Tách biệt phase: Character Category E.0 đã kiểm thử hồi quy 100% không sinh request lỗi cho Archive Pending. | **VERIFIED PASS** |

---

## 2. Kế hoạch Phục hồi & Rollback 3 cấp độ (3-Tier Rollback Plan)

```
+-----------------------------------------------------------------------------------+
|                           KỊCH BẢN ROLLBACK 3 CẤP ĐỘ                              |
|                                                                                   |
|  [CẤP ĐỘ 1: TỨC THỜI (5 GIÂY)] — ĐÃ KIỂM THỬ THỰC TẾ (PASS)                       |
|  - Chuyển NEXT_PUBLIC_ASSET_STORAGE_MODE=local                                    |
|  - Không cần sửa mã nguồn, không cần build lại server. Ứng dụng nạp lại từ disk.  |
|                                                                                   |
|  [CẤP ĐỘ 2: ĐỔI PHIÊN BẢN RELEASE TAG (1 PHÚT)]                                   |
|  - Cập nhật NEXT_PUBLIC_ASSET_CDN_URL trỏ về Git Tag ổn định trước đó             |
|  - Ví dụ: từ @v2.0-assets-r2 quay về @v2.0-assets-r1                             |
|                                                                                   |
|  [CẤP ĐỘ 3: PHỤC HỒI THẢM HỌA DISASTER RECOVERY (5 PHÚT)]                         |
|  - Khôi phục thư mục public/images/ từ bản sao lưu Google Drive / Backup Zip      |
|  - Đối chiếu danh mục bằng mã băm SHA-256 từ WEB01_PUBLIC_IMAGES_INVENTORY.md   |
+-----------------------------------------------------------------------------------+
```

### 2.1. Cấp độ 1: Switch biến môi trường Runtime (Yêu cầu khôi phục tệp cục bộ trước)
- **Lưu ý sau WEB-01.5:** Do 26 tệp WebP đã được loại bỏ khỏi `public/images/` để giải phóng dung lượng, trước khi chuyển sang `mode=local`, người vận hành cần giải nén tệp từ backup ZIP:
  ```bash
  unzip -j -o starfront-world-assets-v2.0-backup.zip "images/*.webp" -d public/images/
  ```
- **Thực hiện chuyển mode:** Sửa cấu hình `.env.local` hoặc Dashboard:
  ```bash
  NEXT_PUBLIC_ASSET_STORAGE_MODE=local
  ```
- **Kết quả:** Trình duyệt quay trở lại tải ảnh trực tiếp từ `public/images/`.

### 2.2. Cấp độ 2: Revert Git Tag trên CDN (Khôi phục trong 1 phút)
- **Áp dụng khi:** Một tệp artwork mới bị lỗi đồ họa hoặc nhầm phiên bản.
- **Thực hiện:** Thay đổi Tag trong biến môi trường:
  ```bash
  NEXT_PUBLIC_ASSET_CDN_URL=https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets
  ```
- **Kết quả:** Tránh được thời gian chờ xóa cache của CDN.

### 2.3. Cấp độ 3: Disaster Recovery từ Backup Manifest (Khôi phục toàn diện trong 5 phút)
- **Áp dụng khi:** Tệp trong `public/images/` đã bị dọn dẹp nhưng cần nạp lại toàn bộ.
- **Thực hiện:**
  1. Tải bản sao lưu `starfront-world-assets-v2.0-backup.zip` từ Google Drive (`dream_ACE/backup/`).
  2. Giải nén vào `public/images/`.
  3. Chạy lệnh tự động đối chiếu mã băm SHA-256 với bảng kiểm kê trong `WEB01_PUBLIC_IMAGES_INVENTORY.md`.
  4. Đạt 26/26 tệp khớp 100% hash -> Hoàn tất phục hồi.

---

## 3. Quy tắc "Bản nháp — Thử nghiệm — Nghiệm thu" (Pilot-First Rule)

Tuyệt đối không xóa bất kỳ tệp nào trong `public/images/` khi chưa hoàn thành WEB-01.4:
1. **Giai đoạn thử nghiệm (Pilot Phase - WEB-01.4):** Đã kiểm thử đầy đủ 3 tệp phi cơ GEAR (`vanguard-gear.webp`, `falcon-gear.webp`, `aegis-gear.webp`) và 8 phi công V1.
2. **Kiểm tra song song (Side-by-side verification):** Cả tệp trên đĩa và URL trên CDN đều tồn tại đồng thời, kiểm tra hash SHA-256 khớp 100%.
3. **Tiêu chí an toàn chuyển sang WEB-01.5:**
   - 100% URL kiểm tra đạt HTTP 200 (26/26 đã xác minh).
   - Header `Content-Type: image/webp` chính xác.
   - Trực tiếp kiểm thử không có lỗi console hay bogus request 404 từ Archive Pending.
   - Có phê duyệt chính thức từ chủ dự án trước khi dọn dẹp.

---

## 4. Ghi nhận Định hướng Roadmap: WEB-01.3.A — AdminCP Runtime Asset Version Manager

Chủ dự án đã phê duyệt định hướng concept cho công cụ quản lý phiên bản tài nguyên trong AdminCP:

- **Tính năng cốt lõi:**
  1. **Liệt kê GitHub release/tag:** Tự động hoặc thủ công nạp danh sách các tag hợp lệ từ `viettanpham/starfront-assets`.
  2. **Hiển thị Active Version:** Cho biết phiên bản CDN đang được phục vụ tại thời điểm thực thi.
  3. **Xem trước (Preview Artwork):** Cho phép Admin xem trước artwork ở version được chọn trước khi áp dụng cho toàn hệ thống.
  4. **Validate Manifest & Asset Availability:** Tự động kiểm tra tính sẵn sàng của các file ảnh trên CDN của phiên bản mục tiêu trước khi chuyển.
  5. **Xác nhận 2 bước an toàn (Two-step confirmation):** Yêu cầu xác nhận rõ ràng trước khi kích hoạt chuyển đổi version.
  6. **Runtime Version Activation không cần rebuild:** Thay đổi phiên bản CDN trực tiếp tại runtime mà không cần build lại toàn bộ Next.js.
  7. **Khôi phục nhanh (Rollback):** Một nút bấm để quay lại ngay lập tức tag trước đó nếu phát hiện sự cố.
  8. **Phân quyền Admin & Nhật ký kiểm toán (Audit Log):** Chỉ tài khoản Admin mới có quyền thao tác và mọi lần đổi phiên bản đều được ghi log.
  9. **Bảo toàn FND-8 Gallery:** Không tự ý nạp các artwork chưa đăng ký vào Gallery của phi công.

*(Lưu ý: Đây là định hướng roadmap tương lai, không triển khai mã nguồn trong giai đoạn WEB-01.4).*
