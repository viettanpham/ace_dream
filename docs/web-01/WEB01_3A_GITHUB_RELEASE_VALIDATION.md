# STARFRONT WORLD V2 — WEB-01.3.A
# KHÁM PHÁ VÀ KIỂM ĐỊNH PHIÊN BẢN GITHUB RELEASE (GITHUB RELEASE DISCOVERY & VALIDATION)

**Mã tài liệu:** WEB01-3A-VALIDATION-01  
**Chế độ:** PLAN/DEFINE ONLY  
**Ngày lập:** 2026-10-22  
**Ngôn ngữ:** 100% Tiếng Việt  

---

## 1. Cơ chế Khám phá Phiên bản từ GitHub (Release Discovery)

### 1.1. Nguồn dữ liệu & Bảo vệ Giới hạn Truy vấn (Rate Limit Protection)
- **Repository nguồn:** `https://github.com/viettanpham/starfront-assets`
- **Giao thức:** Truy vấn qua REST API công khai của GitHub:
  `GET https://api.github.com/repos/viettanpham/starfront-assets/releases`
- **Thách thức:** GitHub API giới hạn **60 yêu cầu/giờ** đối với IP không chứng thực (Unauthenticated Rate Limit). Nếu người dùng mở AdminCP hoặc nhiều tab truy vấn đồng thời, hệ thống sẽ gặp lỗi HTTP 403 Forbidden.
- **Biện pháp Phòng ngừa Kỹ thuật:**
  1. **Tuyệt đối không gọi GitHub API trực tiếp từ Trình duyệt (No Frontend Calls):** Client không bao giờ gửi request thẳng đến `api.github.com`.
  2. **Máy chủ Đại diện có Bộ đệm (Server Proxy with TTL Cache):**
     - Xây dựng API Route: `GET /api/admin/asset-version/releases`.
     - Lưu trữ kết quả trong bộ nhớ máy chủ (In-Memory Cache) với thời gian sống **TTL = 10 phút (600 giây)**.
     - Trong vòng 10 phút, mọi yêu cầu mở AdminCP đều lấy từ bộ đệm máy chủ (tiêu tốn 0 request tới GitHub).
  3. **Nút "Làm Mới Danh Sách" có Kiểm soát (Force Refresh Throttling):**
     - Trên giao diện AdminCP, nút làm mới bị giới hạn (debounce tối thiểu 30 giây giữa 2 lần bấm).
     - Hỗ trợ biến môi trường tùy chọn trên máy chủ: `GITHUB_API_TOKEN` (Personal Access Token với quyền `public_repo` read-only) giúp nâng trần giới hạn lên **5,000 yêu cầu/giờ** nếu cần triển khai quy mô lớn.

---

## 2. Phân loại Trạng thái Phiên bản (Release Classification Status)

Mỗi Release Tag sau khi được khám phá sẽ được gán một trong 6 trạng thái kỹ thuật rõ ràng:

| Trạng thái | Biểu tượng | Định nghĩa Kỹ thuật | Hành động được phép trong AdminCP |
| :--- | :---: | :--- | :--- |
| **ACTIVE** | 🟢 | Phiên bản đang được toàn bộ trò chơi sử dụng để nạp hình ảnh. | Không thể chọn kích hoạt lại; hiển thị huy hiệu `ĐANG SỬ DỤNG`. |
| **PREVIOUS** | 🟡 | Phiên bản hoạt động ngay trước đó, sẵn sàng cho Rollback khẩn cấp. | Có nút `ROLLBACK NHANH` (1-click). |
| **VERIFIED** | 🔵 | Phiên bản mới đã vượt qua 100% kiểm định (Manifest chuẩn, đủ ảnh trọng yếu). | Cho phép chọn và kích hoạt sang phiên bản này. |
| **PUBLISHED** | ⚪ | Phiên bản mới được phát hiện trên GitHub, chưa chạy kiểm định. | Cho phép bấm nút `KIỂM ĐỊNH` (Validate). |
| **INCOMPATIBLE**| 🟠 | Phiên bản tồn tại nhưng thiếu các ảnh bắt buộc đang dùng trong game. | **KHÓA KÍCH HOẠT**; hiển thị danh sách ảnh thiếu hụt. |
| **INVALID** | 🔴 | Tag không có thư mục `starfront-world-assets` hoặc thiếu manifest JSON. | **TỪ CHỐI TUYỆT ĐỐI**; không cho phép kích hoạt. |

---

## 3. Quy trình Kiểm định 2 Cấp độ (Two-Tier Validation Framework)

Trước khi Admin có thể kích hoạt bất kỳ phiên bản nào, hệ thống bắt buộc phải thực thi kiểm định tự động:

```
+-----------------------------------------------------------------------------------+
|                        QUY TRÌNH KIỂM ĐỊNH PHIÊN BẢN (VALIDATION)                 |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [BƯỚC 1: FAST VALIDATION] (~1 - 2 GIÂY)                                          |
|  - Kiểm tra sự tồn tại của tệp: manifests/assets-manifest.json qua CDN           |
|  - Parse và kiểm tra schema JSON, version, totalFiles, totalSizeBytes             |
|  - Kiểm tra 3 ảnh cốt lõi: marcus-portrait, valentine-portrait, vanguard-gear    |
|                                                                                   |
|                         | (ĐẠT)                                                   |
|                         v                                                         |
|                                                                                   |
|  [BƯỚC 2: FULL CANONICAL AUDIT] (~3 - 5 GIÂY)                                     |
|  - Đối chiếu danh mục trong manifest với 26 ảnh bắt buộc trong Catalog V1/V2      |
|  - Kiểm tra tính sẵn sàng của 3 GEAR V1 (Vanguard, Falcon, Aegis)                |
|  - Kiểm tra tính sẵn sàng của 8 Pilot V1 (Marcus, Valentine, Alviss...)           |
|  - Xác nhận không có sự thay đổi tên tệp canonical ngoài quy tắc được duyệt       |
|  - Bảo đảm các tệp DRAFT trong manifest không bị tự động nạp vào FND-8 Gallery   |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### 3.1. Cấp độ 1: Kiểm định Nhanh (Fast Validation)
- **Mục tiêu:** Phản hồi ngay lập tức cho Admin khi vừa chọn phiên bản trong danh sách.
- **Các bước thực thi:**
  1. Gửi request HTTP HEAD đến URL manifest của tag mục tiêu:
     `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@<TAG>/starfront-world-assets/manifests/assets-manifest.json`
  2. Xác nhận phản hồi HTTP 200 và Content-Type `application/json`.
  3. Gửi HTTP HEAD tới 3 ảnh tiêu biểu của hệ thống:
     - `.../images/marcus-portrait.webp`
     - `.../images/valentine-portrait.webp`
     - `.../images/vanguard-gear.webp`
  4. Nếu cả 4 request đều đạt HTTP 200 -> Hoàn thành Fast Validation.

### 3.2. Cấp độ 2: Kiểm định Toàn diện (Full Canonical Audit)
- **Mục tiêu:** Bảo đảm không làm gãy (broken UI) bất kỳ màn hình nào khi chuyển đổi.
- **Tiêu chí kiểm định:**
  1. **Quy tắc Bảo toàn 26 Ảnh Cốt lõi (Core Preservation Rule):** Phiên bản mới bắt buộc phải chứa đầy đủ 26 tệp ảnh mà V1 và V2 đang tham chiếu. Nếu phiên bản mới xóa hoặc đổi tên bất kỳ ảnh nào trong số này -> Gán nhãn `INCOMPATIBLE` và từ chối kích hoạt.
  2. **Quy tắc Toàn vẹn Checksum:** Tải manifest của phiên bản mới và kiểm tra mã SHA-256 của từng tệp tài nguyên.
  3. **Nguyên tắc Phân định FND-8 (Registry Isolation Rule):** Nếu phiên bản mới có thêm 10 ảnh mới của các Pilot khác (ví dụ Alviss combat, Lyra story...), các ảnh này chỉ được xem là *sẵn sàng trên CDN*. Chúng **tuyệt đối không tự ý hiển thị vào Profile Gallery của nhân vật** trừ khi tệp canonical data (`character-profile-data.ts`) đã được lập trình viên cập nhật và duyệt theo quy trình FND-8.

---

## 4. Xử lý Trường hợp Ngoại lệ (Edge Cases & Fallback)

1. **GitHub bị gián đoạn hoặc sập mạng:**
   - AdminCP hiển thị thông báo: `Không thể kết nối tới GitHub API (Sử dụng dữ liệu bộ đệm)`.
   - Nếu bộ đệm vẫn còn: Cho phép Admin xem danh sách tag đã cache trước đó.
   - Nếu không có bộ đệm: Cho phép Admin nhập thủ công tên Tag (ví dụ `v2.0-assets-r2`), hệ thống sẽ trực tiếp chạy Fast Validation qua CDN jsDelivr mà không cần GitHub API.
2. **CDN jsDelivr chưa kịp đồng bộ (Cold Start Lag):**
   - Đôi khi sau khi tạo Tag trên GitHub, jsDelivr cần từ 30–60 giây để clone bản phát hành.
   - Nếu Fast Validation trả về HTTP 404 cho Tag mới tạo: Hệ thống hiển thị cảnh báo `Đang chờ CDN khởi tạo bộ đệm, vui lòng thử lại sau 60 giây`.
