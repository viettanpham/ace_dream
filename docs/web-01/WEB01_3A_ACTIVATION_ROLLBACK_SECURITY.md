# STARFRONT WORLD V2 — WEB-01.3.A
# CƠ CHẾ KÍCH HOẠT, HOÀN TÁC VÀ AN TOÀN BẢO MẬT
## ATOMIC ACTIVATION, ONE-CLICK ROLLBACK & SECURITY ARCHITECTURE

**Mã tài liệu:** WEB01-3A-SECURITY-01  
**Chế độ:** PLAN/DEFINE ONLY  
**Ngày lập:** 2026-10-22  
**Ngôn ngữ:** 100% Tiếng Việt  

---

## 1. Quy trình Kích hoạt Nguyên tử (Atomic Activation Flow)

Để bảo đảm không bao giờ xảy ra trạng thái nửa vời (inconsistent / corrupted state), quá trình kích hoạt phiên bản mới tuân theo quy trình nguyên tử 9 bước nghiêm ngặt:

```
[Admin Chọn Tag v2.0-assets-r2]
               |
               v
[Bước 1: Server xác thực phiên đăng nhập Quản trị viên (Admin Account Session & CSRF)]
               |
               v
[Bước 2: Server thực hiện Fast Validation qua jsDelivr CDN]
               |
               v
[Bước 3: Hiển thị Dialog Xác nhận Bước 1 (So sánh chi tiết thay đổi)]
               |
               v
[Bước 4: Hiển thị Dialog Cảnh báo Bước 2 (Gõ chính xác tên Release Tag)]
               |
               v
[Bước 5: Server kiểm tra Revision Concurrency (Optimistic Locking)]
               |
               v
[Bước 6: Ghi bền vững atomic qua AssetConfigStore (File hoặc DB)]
               | (Chuyển activeVersion -> v2.0-assets-r2, previousVersion -> v2.0-assets-r1)
               v
[Bước 7: Ghi Audit Log vào hệ thống với timestamp và IP/User]
               |
               v
[Bước 8: Server trả về HTTP 200 kèm cấu hình mới]
               |
               v
[Bước 9: Client React Context cập nhật cấu hình -> Toàn bộ ảnh tự chuyển đổi URL]
```

### 1.1. Nguyên tắc Không Khẳng định Sớm
Máy chủ chỉ thông báo thành công khi tệp cấu hình mới đã được ghi hoàn tất xuống hệ thống lưu trữ bền vững (fsync hoàn thành). Nếu xảy ra lỗi tại bất kỳ bước nào, toàn bộ giao dịch bị hủy bỏ (Abort) và trạng thái phiên bản cũ được giữ nguyên 100%.

---

## 2. Kiểm soát Tương tranh Lạc quan (Optimistic Concurrency Control)

### 2.1. Nguy cơ Xung đột khi Nhiều Admin Cùng Thao tác
Nếu Admin A và Admin B cùng mở AdminCP:
- Admin A muốn chuyển sang `v2.0-assets-r2`.
- Admin B muốn chuyển sang `v2.0-assets-r3`.
- Nếu không có cơ chế kiểm soát, người bấm sau sẽ vô tình ghi đè và làm mất dữ liệu của người bấm trước mà không hề hay biết (Lost Update Problem).

### 2.2. Giải pháp Số Hiệu Bản Sửa Đổi (Revision Counter)
- Mỗi tệp cấu hình chứa một trường số nguyên `revision` tăng dần (ví dụ hiện tại là `revision: 3`).
- Khi Admin mở màn hình, client lưu lại `expectedRevision = 3`.
- Khi gửi yêu cầu kích hoạt, client truyền kèm `expectedRevision: 3`.
- Máy chủ kiểm tra:
  ```typescript
  if (currentConfig.revision !== payload.expectedRevision) {
    return NextResponse.json({
      success: false,
      code: "CONCURRENCY_CONFLICT",
      message: "Cấu hình đã bị thay đổi bởi quản trị viên khác. Vui lòng tải lại trang."
    }, { status: 409 });
  }
  ```
- Nếu khớp: Máy chủ tăng `revision: 4` và ghi lưu. Thao tác hoàn toàn an toàn và tránh xung đột.

---

## 3. Cơ chế Hoàn tác Tức thời 1 Chạm (One-Click Rollback)

### 3.1. Nguyên lý Hoạt động
- Trong tệp cấu hình luôn lưu trữ cặp đôi:
  - `activeVersion`: Phiên bản đang chạy.
  - `previousVersion`: Phiên bản hoạt động ổn định trước đó.
- Khi phiên bản mới kích hoạt xong nhưng phát hiện sự cố đồ họa hoặc lỗi phát sinh trong trò chơi, Admin chỉ cần bấm duy nhất một nút:
  **`[ ⏪ HOÀN TÁC VỀ PHIÊN BẢN TRƯỚC ]`**
- Máy chủ sẽ thực hiện hoán đổi nguyên tử:
  - `activeVersion` nhận lại giá trị của `previousVersion`.
  - `previousVersion` nhận giá trị của phiên bản vừa bị lỗi.
  - Cập nhật `revision` mới và ghi log `ACTION: ROLLBACK`.
- Thời gian phục hồi: **Dưới 1 giây**. Không cần khởi động lại server.

---

## 4. Xử lý Các Kịch bản Sự cố Phức tạp (Failure Scenarios)

| Kịch bản sự cố | Hành vi Hệ thống | Biện pháp Khắc phục |
| :--- | :--- | :--- |
| **Mất kết nối Internet khi đang kích hoạt** | Request POST không đến được server. Server không ghi tệp. | Client báo lỗi timeout; phiên bản cũ vẫn tiếp tục phục vụ bình thường. |
| **jsDelivr CDN gặp lỗi 500 hoặc nghẽn mạng** | Ảnh trên CDN tạm thời không tải được. | Admin bấm Rollback về phiên bản trước hoặc chuyển sang chế độ `local` nếu đã khôi phục ảnh. |
| **Server bị khởi động lại (Restart / Crash)** | Next.js nạp lại tệp cấu hình từ `.starfront-config/runtime-asset-config.json`. | Phiên bản đang kích hoạt được bảo toàn nguyên vẹn; không bị mất cấu hình. |
| **Người chơi đang mở màn hình Gallery khi đổi version** | React Context phát tín hiệu cập nhật `cdnBaseUrl`. | Các thẻ `<img>` tự động render lại với URL mới mà không gây trắng trang hay tải lại toàn bộ app. |

---

## 5. Kiến trúc An toàn & Bảo mật (Security Blueprint - FINAL APPROVED)

### 5.1. Hiện trạng & Lỗ hổng Cần Khắc phục (Vulnerability Audit)
- Hiện tại, ứng dụng game chưa có hệ thống đăng nhập tài khoản người dùng (No Auth / No Sessions).
- **Quyết định phê duyệt chính thức:** Bắt buộc xây dựng **HỆ THỐNG TÀI KHOẢN ADMIN CÓ ĐĂNG NHẬP** phía máy chủ (Server-side Authentication & Session Lifecycle) trước khi triển khai Subphase A.4.
- **Tuyệt đối không sử dụng mã PIN 6 số** làm cơ chế xác thực Admin.
- Không tin tưởng vào việc chỉ ẩn/hiện giao diện AdminCP trên client.

### 5.2. Lớp Bảo vệ Quản trị Bắt buộc (Baseline Security Architecture)
Để bảo đảm an toàn tuyệt đối khi triển khai tính năng mutation tại Subphase A.4:
1. **Xác thực và Phân quyền Phía Máy chủ (Server Authentication & Authorization):**
   - Tài khoản Admin phải được xác minh danh tính trước khi có quyền thay đổi cấu hình runtime.
   - Có cơ chế quản lý vòng đời phiên (session lifecycle, secure HttpOnly cookie) và chức năng đăng xuất (logout).
   - Bảo vệ chống tấn công CSRF (Cross-Site Request Forgery) trên toàn bộ API mutation.
   - Không lưu mật khẩu hoặc secret/private keys trong mã nguồn client.
   - Tuyệt đối không tạo tài khoản Admin mặc định với mật khẩu hardcode sẵn trong repository.
2. **Chống Nhập Liệu Bừa bãi (Whitelisted Inputs Only):**
   - Tuyệt đối không cho phép client truyền domain CDN tùy ý hoặc tên repository ngoài danh mục.
   - Repository được cố định nghiêm ngặt: `viettanpham/starfront-assets`.
   - Provider được kiểm soát danh mục an toàn (`jsdelivr`, `cloudflare_r2`, `local`).
   - Tham số `targetVersion` được lọc chặt chẽ qua biểu thức chính quy (Regex):
     `^v[0-9]+(\.[0-9]+)*(-[a-zA-Z0-9_.-]+)?$` (ngăn chặn hoàn toàn tấn công Path Traversal).
3. **Bảo đảm Tính Nhất quán và Tương tranh Đa Instance:**
   - Kế hoạch ghi nguyên tử (Atomic write), so sánh số hiệu phiên bản (Revision Compare-And-Swap).
   - Khi chạy trên nhiều container/instance hoặc serverless, hệ thống ghi nhận trạng thái `PERSISTENCE_NOT_CONFIGURED` nếu chưa cấu hình database tập trung, không giả định đĩa cục bộ chia sẻ xuyên instance.
4. **Nhật ký Kiểm toán (Audit Logging):**
   - Mọi thao tác kích hoạt và rollback đều được ghi nhận vào nhật ký kiểm toán với:
     - Thời điểm thao tác (ISO 8601).
     - Hành động (`ACTIVATE` / `ROLLBACK`).
     - Phiên bản nguồn và phiên bản đích.
     - Danh tính Admin đã xác thực (`updatedBy`).
     - Kết quả thực hiện.
