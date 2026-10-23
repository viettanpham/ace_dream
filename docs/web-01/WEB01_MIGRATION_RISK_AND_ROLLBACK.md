# STARFRONT WORLD V2 — WEB-01
# QUẢN TRỊ RỦI RO VÀ QUY TRÌNH ROLLBACK (MIGRATION RISK & ROLLBACK SPECIFICATION)

**Mã tài liệu:** WEB01-RISK-01  
**Trạng thái:** PROPOSED RISK MITIGATION FRAMEWORK  
**Ngày lập:** 2026-10-22  
**Mục tiêu:** Nhận diện toàn diện các rủi ro kỹ thuật, thiết lập kịch bản ứng phó sự cố và bảo vệ tuyệt đối mã nguồn cũng như dữ liệu người chơi.

---

## 1. Ma trận phân tích rủi ro kỹ thuật (Risk Assessment Matrix)

| Mã rủi ro | Mô tả rủi ro | Xác suất | Mức độ ảnh hưởng | Biện pháp phòng ngừa kỹ thuật |
| :---: | :--- | :---: | :---: | :--- |
| **R-01** | jsDelivr CDN gặp sự cố kết nối, bị chặn mạng cục bộ hoặc timeout | Thấp | Nghiêm trọng | Cơ chế Fallback sang Local Placeholder SVG (`/icon.svg`) và switch biến môi trường về `local` trong 5 giây. |
| **R-02** | Xóa nhầm tệp trên GitHub Release hoặc sai cấu trúc đường dẫn | Trung bình | Nghiêm trọng | Xác minh 100% URL mẫu bằng HTTP GET (kiểm tra Status 200 và MIME `image/webp`) trước khi xóa bản sao cục bộ. |
| **R-03** | Bộ đệm CDN (Cache) giữ bản cũ khi cập nhật artwork cùng tên | Cao | Trung bình | **Bắt buộc dùng Immutable Git Tags** (ví dụ `@v2.0-assets-r1`, `@v2.0-assets-r2`), tuyệt đối không dùng nhánh `@main` hoặc `@latest`. |
| **R-04** | Giới hạn dung lượng của jsDelivr và GitHub | Rất thấp | Cao | jsDelivr giới hạn tối đa 20 MB/tệp và khuyến nghị release < 50 MB. Toàn bộ 26 tệp hiện tại chỉ 5.44 MB, tệp lớn nhất 527 KB -> Nằm trong vùng an toàn tuyệt đối. |
| **R-05** | Save game cũ chứa đường dẫn cục bộ bị lỗi | Thấp | Cực lớn | Không đổi schema dữ liệu trong `data.ts` và save JSON; chỉ phân giải qua `resolveImageUrl()` tại tầng hiển thị React. |
| **R-06** | Xung đột làm gián đoạn tiến độ FND-8 Character Category V2 | Trung bình | Lớn | Tách biệt phase: Chỉ thực hiện migration tài nguyên sau khi các checkpoint của FND-8 đạt trạng thái ổn định. |

---

## 2. Kế hoạch Phục hồi & Rollback 3 cấp độ (3-Tier Rollback Plan)

```
+-----------------------------------------------------------------------------------+
|                           KỊCH BẢN ROLLBACK 3 CẤP ĐỘ                              |
|                                                                                   |
|  [CẤP ĐỘ 1: TỨC THỜI (5 GIÂY)]                                                    |
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

### 2.1. Cấp độ 1: Switch biến môi trường Runtime (Khôi phục tức thì trong 5 giây)
- **Áp dụng khi:** Mạng CDN gián đoạn hoặc phản hồi chậm.
- **Thực hiện:** Sửa cấu hình `.env.local` hoặc trên Dashboard Hosting:
  ```bash
  NEXT_PUBLIC_ASSET_STORAGE_MODE=local
  ```
- **Kết quả:** Trình duyệt quay trở lại tải ảnh trực tiếp từ `public/images/`.

### 2.2. Cấp độ 2: Revert Git Tag trên CDN (Khôi phục trong 1 phút)
- **Áp dụng khi:** Một tệp artwork mới bị lỗi đồ họa hoặc nhầm phiên bản.
- **Thực hiện:** Thay đổi Tag trong biến môi trường:
  ```bash
  NEXT_PUBLIC_ASSET_CDN_URL=https://cdn.jsdelivr.net/gh/viettanpham/starfront-world-assets@v2.0-assets-r1
  ```
- **Kết quả:** Tránh được thời gian chờ xóa cache của CDN.

### 2.3. Cấp độ 3: Disaster Recovery từ Backup Manifest (Khôi phục toàn diện trong 5 phút)
- **Áp dụng khi:** Tệp trong `public/images/` đã bị dọn dẹp nhưng cần nạp lại toàn bộ.
- **Thực hiện:**
  1. Tải bản sao lưu từ Google Drive hoặc kho lưu trữ độc lập.
  2. Giải nén vào `public/images/`.
  3. Chạy lệnh tự động đối chiếu mã băm SHA-256 với bảng kiểm kê trong `WEB01_PUBLIC_IMAGES_INVENTORY.md`.
  4. Đạt 26/26 tệp khớp 100% hash -> Hoàn tất phục hồi.

---

## 3. Quy tắc "Bản nháp — Thử nghiệm — Nghiệm thu" (Pilot-First Rule)

Tuyệt đối không xóa bất kỳ tệp nào trong `public/images/` trong các bước đầu:
1. **Giai đoạn thử nghiệm (Pilot Phase):** Chỉ chuyển 3 tệp phi cơ GEAR (`vanguard-gear.webp`, `falcon-gear.webp`, `aegis-gear.webp`).
2. **Kiểm tra song song (Side-by-side verification):** Cả tệp trên đĩa và URL trên CDN đều tồn tại đồng thời.
3. **Chỉ dọn dẹp khi:**
   - 100% URL kiểm tra đạt HTTP 200.
   - Header `Content-Type: image/webp` chính xác.
   - Trực tiếp quan sát hiển thị hình ảnh trên giao diện desktop và mobile không có lỗi console.
   - Được chủ dự án phê duyệt nghiệm thu bằng văn bản/checkpoint.
