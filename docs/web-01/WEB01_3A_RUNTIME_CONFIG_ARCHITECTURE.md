# STARFRONT WORLD V2 — WEB-01.3.A
# KIẾN TRÚC CẤU HÌNH TÀI NGUYÊN TẠI RUNTIME (RUNTIME CONFIGURATION ARCHITECTURE)

**Mã tài liệu:** WEB01-3A-ARCH-01  
**Chế độ:** PLAN/DEFINE ONLY  
**Ngày lập:** 2026-10-22  
**Ngôn ngữ:** 100% Tiếng Việt  

---

## 1. Schema Cấu hình Runtime (`runtime-asset-config.json`)

Tệp cấu hình phiên bản tài nguyên được quản lý tập trung trên máy chủ tại đường dẫn nội bộ:
`.starfront-config/runtime-asset-config.json`

### 1.1. Định dạng JSON Chuẩn hóa (Schema Definition)
```json
{
  "$schema": "https://starfront.internal/schemas/asset-config-v1.json",
  "schemaVersion": 1,
  "revision": 3,
  "provider": "jsdelivr",
  "repository": "viettanpham/starfront-assets",
  "assetRoot": "starfront-world-assets",
  "activeVersion": "v2.0-assets-r1",
  "cdnBaseUrl": "https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets",
  "previousVersion": null,
  "previousCdnBaseUrl": null,
  "updatedAt": "2026-10-22T20:25:00.000Z",
  "updatedBy": "admin_master",
  "comment": "Initial verified release of 26 pilot and gear assets",
  "manifestMetadata": {
    "totalAssets": 26,
    "manifestSha256": "3cb49a...",
    "validatedAt": "2026-10-22T20:24:50.000Z"
  }
}
```

### 1.2. Ý nghĩa các trường dữ liệu
- `schemaVersion`: Phiên bản cấu trúc schema (bắt đầu bằng `1`).
- `revision`: Số thứ tự tăng dần mỗi khi có thay đổi (dùng cho Optimistic Concurrency Control, ngăn chặn lỗi ghi đè dữ liệu khi 2 admin thao tác cùng lúc).
- `provider`: Nhà cung cấp CDN (mặc định `jsdelivr`, sẵn sàng mở rộng sang `cloudflare_r2` hoặc `custom`).
- `repository`: Tên kho lưu trữ GitHub chứa tài nguyên (`viettanpham/starfront-assets`).
- `assetRoot`: Thư mục gốc chứa ảnh trong kho (`starfront-world-assets`).
- `activeVersion`: Git Tag phiên bản phát hành đang hoạt động phục vụ game (`v2.0-assets-r1`).
- `cdnBaseUrl`: URL gốc hoàn chỉnh được tính toán tự động dựa trên `provider`, `repository`, `activeVersion` và `assetRoot`.
- `previousVersion`: Phiên bản hoạt động trước đó (lưu trữ phục vụ cơ chế Rollback tức thì).
- `updatedAt` / `updatedBy`: Dấu thời gian và danh tính người thực hiện thao tác (phục vụ Audit Log).

---

## 2. Cơ chế Lưu trữ Bền vững trên Máy chủ (Server Persistence Engine)

### 2.1. Lớp Trừu tượng Lưu trữ (AssetConfigStore Abstraction)
Kiến trúc **không bị khóa cứng vào duy nhất một tệp JSON**. Hệ thống định nghĩa interface `AssetConfigStore` có khả năng tích hợp linh hoạt:
- **`FileAssetConfigStore`**: Áp dụng cho môi trường máy chủ Local / Standalone / Node.js có persistent disk. Ghi tệp tại `.starfront-config/runtime-asset-config.json`.
- **`DatabaseAssetConfigStore`**: Dành cho môi trường Web Hosting / Serverless (Cloud Run, Cloudflare Pages/Workers, Supabase, Neon) trong tương lai khi có cơ sở dữ liệu.

### 2.2. Xử lý Môi trường Không Hỗ trợ Ghi Bền vững
- Không giả định serverless/edge có writable persistent filesystem.
- Khi đĩa ở chế độ chỉ đọc hoặc không có quyền ghi: Hệ thống trả về cấu hình mặc định kèm trạng thái `code: "PERSISTENCE_NOT_CONFIGURED"`, tuyệt đối không giả vờ đã lưu thành công.
- Không phát sinh side effect ghi tệp trong SSR render hoặc module import.
- Không thay đổi filesystem trong bất kỳ request GET nào.

---

## 3. Giao ước API Máy chủ (API Route Contracts)

Cần xây dựng API Route nội bộ phục vụ việc truy xuất và cập nhật cấu hình tài nguyên:
- **`app/api/runtime/asset-config/route.ts`** (Được hiện thực hóa trong Subphase A.1): API GET công khai phục vụ cấp phát cấu hình cho client game và kiểm tra trạng thái.
- **`app/api/admin/asset-version/route.ts`** (Dự kiến triển khai tại Subphase A.4): API mutation POST yêu cầu phiên đăng nhập Quản trị viên (Admin Account Login) và bảo vệ chống CSRF.

### 3.1. Truy vấn Cấu hình Hiện hành: `GET /api/runtime/asset-config` (Đã có trong A.1)
- **Mục đích:** Cho phép Client Game, Provider và AdminCP nạp phiên bản CDN đang hoạt động mà không bị đóng băng tĩnh khi build.
- **Quyền hạn:** Công khai cho Client (chỉ trả về `PublicRuntimeAssetConfig`, không để lộ bất kỳ server secrets hay audit internal nào).
- **Header phản hồi:** `Cache-Control: public, max-age=30, s-maxage=60, stale-while-revalidate=120`.
- **Tuyệt đối không thay đổi filesystem** khi xử lý request GET.
- **Payload phản hồi (200 OK):**
```json
{
  "success": true,
  "config": {
    "schemaVersion": 1,
    "revision": 1,
    "provider": "jsdelivr",
    "repository": "viettanpham/starfront-assets",
    "assetRoot": "starfront-world-assets",
    "activeVersion": "v2.0-assets-r1",
    "cdnBaseUrl": "https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets",
    "previousVersion": null,
    "updatedAt": "2026-10-22T20:25:00.000Z"
  }
}
```

### 3.2. Cập nhật Kích hoạt Phiên bản: `POST /api/admin/asset-version` (Phạm vi Subphase A.4)
- **Mục đích:** Kích hoạt phiên bản mới hoặc Rollback về phiên bản trước.
- **Quyền hạn:** **BẮT BUỘC YÊU CẦU PHIÊN ĐĂNG NHẬP TÀI KHOẢN ADMIN ĐÃ ĐƯỢC XÁC THỰC PHÍA SERVER**. Không dùng PIN 6 số.
- **Yêu cầu bảo mật:** Kiểm tra CSRF token, session cookie hợp lệ, và đối chiếu `expectedRevision` để chống xung đột tương tranh.
- **Payload yêu cầu (Dự kiến A.4):**
```json
{
  "action": "ACTIVATE",
  "targetVersion": "v2.0-assets-r2",
  "expectedRevision": 1,
  "confirmedTagInput": "v2.0-assets-r2"
}
```
- **Payload phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Đã kích hoạt thành công phiên bản v2.0-assets-r2",
  "newConfig": {
    "revision": 4,
    "activeVersion": "v2.0-assets-r2",
    "previousVersion": "v2.0-assets-r1",
    "cdnBaseUrl": "https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r2/starfront-world-assets"
  }
}
```

---

## 4. Cơ chế Đồng bộ Client Runtime (Client-Side Synchronization)

Để người chơi nhận được ảnh mới mà không cần F5/tải lại toàn trang web, kiến trúc sử dụng luồng dữ liệu phản ứng (Reactive Flow):

```
+-----------------------------------------------------------------------------------+
|                        LUỒNG ĐỒNG BỘ CLIENT RUNTIME                               |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Server Runtime Config] ----(GET /api/admin/asset-version)----> [AssetConfigProvider]
|                                                                        |          |
|                                                                        v          |
|  [React Components: Avatar/Gear/Gallery] <--- useAssetConfig() --------+          |
|                                                                                   |
|  [Admin Action: Activate v2.0-assets-r2] ---> POST API ---> Broadcast Event       |
|                                                                        |          |
|  [Client Image Resolver Cache Invalidation] <--------------------------+          |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### 4.1. React Context `AssetConfigProvider`
- Nạp cấu hình phiên bản ban đầu từ API máy chủ khi ứng dụng khởi chạy.
- Cung cấp hook `useAssetConfig()` trả về:
  - `activeVersion`: Tag phiên bản hiện hành.
  - `cdnBaseUrl`: URL CDN hiện hành.
  - `resolveUrl(rawPath)`: Hàm phân giải URL tự động gắn liền với phiên bản động.
  - `refreshConfig()`: Hàm làm mới cấu hình theo yêu cầu.

### 4.2. Tránh Hiện tượng Hydration Mismatch
- **Vấn đề:** Khi SSR render trên server với một phiên bản, nhưng client hydrate lại lấy một phiên bản khác dẫn đến lỗi lệch cấu trúc HTML của Next.js.
- **Giải pháp:**
  - Trong Root Layout (`app/layout.tsx`), Server Component nạp cấu hình trực tiếp từ tệp JSON tĩnh trên đĩa thông qua hàm nội bộ `getStaticServerAssetConfig()`.
  - Cấu hình này được truyền làm `initialConfig` cho `AssetConfigProvider` trên client.
  - Quá trình hydrate diễn ra đồng nhất 100% giữa Server và Client, hoàn toàn triệt tiêu cảnh báo Hydration Mismatch.

---

## 5. Chiến lược Xử lý Bộ đệm (Cache Management Strategy)

1. **Immutable Git Tags:** Mọi phiên bản phát hành trên GitHub bắt buộc phải gắn Tag cố định (`v2.0-assets-r1`, `v2.0-assets-r2`...). Trình duyệt và jsDelivr edge server có thể cache vĩnh viễn mà không bao giờ bị xung đột nội dung cũ/mới.
2. **Không Dùng Tag `@latest` hoặc `@main`:** Việc gọi `@main` trên jsDelivr có thể mất tới 24–48 giờ để xóa sạch cache toàn cầu, gây ra hiện tượng người chơi thấy ảnh cũ, người chơi thấy ảnh mới.
3. **Phân giải URL Động:** Khi Admin đổi phiên bản từ `r1` sang `r2`, toàn bộ URL sinh ra đổi từ `...@v2.0-assets-r1/...` sang `...@v2.0-assets-r2/...`. Trình duyệt sẽ nhận diện đây là URL hoàn toàn mới và tải ngay lập tức hình ảnh của phiên bản mới, không bị ảnh hưởng bởi cache cũ.
