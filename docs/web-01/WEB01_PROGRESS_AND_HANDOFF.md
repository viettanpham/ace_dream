# STARFRONT WORLD V2 — WEB-01
# TIẾN ĐỘ VÀ BÀN GIAO CHECKPOINT (PROGRESS & HANDOFF REPORT)

**Mã tài liệu:** WEB01-HANDOFF-08  
**Giai đoạn:** WEB-01.3.A ADMINCP ASSET VERSION MANAGER (TÍCH HỢP TOÀN DIỆN A.1 - A.5)  
**Ngày hoàn tất:** 2026-10-23  
**Trạng thái phiên làm việc:** ĐÃ HOÀN THÀNH 100% TOÀN BỘ PHÂN ĐOẠN WEB-01.3.A (A.1, A.2, A.3, A.4, A.5)

---

## 1. Trạng thái Thực hiện các Mục tiêu WEB-01 (Cập nhật Checkpoint WEB01-HANDOFF-08)

| Nhiệm vụ | Trạng thái | Ghi chú kỹ thuật |
| :--- | :---: | :--- |
| **WEB-01.1: Khảo sát & Kiểm kê** | **HOÀN THÀNH** | 26 tệp WebP, 5.94 MB, 100% mã băm SHA-256 duy nhất, 0 tệp trùng lặp. |
| **WEB-01.2: Chuẩn bị Asset Package** | **HOÀN THÀNH** | Đã tạo package staging `starfront-world-assets/`, manifest metadata, SHA256SUMS.txt. |
| **WEB-01.2: Bản sao lưu dự phòng ZIP** | **BACKUP_VERIFIED** | Chủ dự án xác nhận lưu `starfront-world-assets-v2.0-backup.zip` trên Google Drive (`dream_ACE/backup/`). |
| **WEB-01.2: GitHub Assets Repository** | **VERIFIED** | Repo public `https://github.com/viettanpham/starfront-assets`, commit `7a5a84d`, release tag `v2.0-assets-r1`. |
| **WEB-01.3: Cấu hình CDN & Next.js** | **HOÀN THÀNH** | `next.config.mjs` (remotePatterns `cdn.jsdelivr.net`), `.env.example`, `.env.local`. |
| **WEB-01.3: Module Image Resolver** | **HOÀN THÀNH** | `/lib/game/assets/image-resolver.ts` xử lý CDN/Local/R2, dynamic client sync `setClientActiveRuntimeConfig()`. |
| **WEB-01.3: Unit Test Suite** | **8/8 PASS** | `/tests/image-resolver.test.ts` kiểm thử 8 kịch bản nghiêm ngặt, chạy qua `npx tsx`. |
| **WEB-01.3: Tích hợp Resolver vào UI** | **HOÀN THÀNH** | Đã bọc `resolveImageUrl` trên toàn bộ component V1 và V2. |
| **WEB-01.4: Regression Suite Kiểm thử** | **PASS (26/26)** | 100% tệp WebP khớp mã băm SHA-256 byte-for-byte giữa Local và jsDelivr CDN qua HTTP 200. |
| **WEB-01.4: GEAR & Pilot Verification** | **PASS** | 3 GEAR V1 và 8 Pilot V1 hiển thị chính xác, bảo toàn tỷ lệ khung hình. |
| **WEB-01.4: V2 Archive Pending Protection** | **PASS** | 10 tác phẩm Archive Pending không tạo thẻ `<img>` lỗi hay bất kỳ request 404 nào. |
| **WEB-01.5: Safe Repository Cleanup** | **HOÀN THÀNH** | Đã xóa an toàn đúng 26 tệp WebP trong `public/images/`, giải phóng 5.94 MB binary. |
| **WEB-01.3.A.1: Runtime Config Foundation** | **HOÀN THÀNH 100%** | Schema typed/versioned, AssetConfigStore abstraction, FileStore, GET API, Provider/Hook, SSR sync. |
| **WEB-01.3.A.2: GitHub Discovery & Validation** | **HOÀN THÀNH 100%** | Proxy discovery repo `viettanpham/starfront-assets`, in-memory cache TTL 10m, Fast validation (HEAD), Full audit 26 core assets. |
| **WEB-01.3.A.3: AdminCP UI Tab 9 & Preview** | **HOÀN THÀNH 100%** | Tab 9: Phiên Bản Artwork (CDN), Sandboxed preview 3 tác phẩm đối chiếu, visual comparison. |
| **WEB-01.3.A.4: Two-Step Activation & Security** | **HOÀN THÀNH 100%** | Server auth (scrypt hash + HMAC session cookie, CSRF token, rate limit), Double confirmation dialog (exact tag input), CAS optimistic lock. |
| **WEB-01.3.A.5: Rollback & End-to-End Regression**| **HOÀN THÀNH 100%** | 1-click Rollback về previousVersion an toàn, audit log lưu vết, 15/15 unit/integrated tests PASS, Next.js build PASS. |
| **WEB-01.6: Web Hosting & Cloud Save** | **FUTURE ROADMAP** | Lộ trình Model A trong tương lai. |

---

## 2. Chi tiết Triển khai Toàn diện WEB-01.3.A (A.1 - A.5)

### 2.1. Subphase A.1 — Runtime Asset Configuration Foundation
- **Schema Typed:** `lib/game/assets/runtime-asset-config.ts` định nghĩa `RuntimeAssetConfig` kèm revision, schemaVersion, cdnBaseUrl, activeVersion.
- **Storage Abstraction:** `AssetConfigStore` và `FileAssetConfigStore` đọc tệp `.starfront-config/runtime-asset-config.json` chỉ đọc, an toàn, không side-effect.
- **API GET:** `app/api/runtime/asset-config/route.ts` phục vụ cấu hình công khai có Cache-Control, fallback r1 tức thì.
- **Provider & Hook:** `components/game/assets/asset-config-provider.tsx` cung cấp Context, giải quyết triệt để Hydration Mismatch bằng `initialConfig` từ server.

### 2.2. Subphase A.2 — GitHub Discovery Proxy & Validation Engine
- **Engine:** `lib/game/assets/github-release-validator.ts`
- **Discovery Cache:** TTL 10 phút lưu trữ danh sách releases từ `viettanpham/starfront-assets`, tự động fallback về release r1 canonical nếu GitHub API bị rate limit (403) hoặc mất mạng.
- **Fast Validation:** Gửi HTTP HEAD kiểm tra tệp canary `pilot_vanguard_norm.webp` trên CDN jsDelivr.
- **Full Validation:** Kiểm toán toàn diện 26/26 tài nguyên cốt lõi (11 pilot v1, 3 gear, 12 pilot v2 portraits) bảo đảm không thiếu bất kỳ tài nguyên bắt buộc nào trước khi kích hoạt.
- **API Routes:**
  - `GET /api/admin/asset-version/releases`: Lấy danh sách release.
  - `POST /api/admin/asset-version/validate`: Chạy kiểm định Fast hoặc Full.

### 2.3. Subphase A.4 — Admin Authentication & Security Hardening
- **Authentication:** `lib/game/auth/admin-auth.ts`
  - Băm mật khẩu chuẩn công nghiệp `crypto.scryptSync` kèm salt ngẫu nhiên 16 bytes.
  - Quản lý phiên bằng Session Cookie `starfront_admin_session` ký số HMAC-SHA256, cờ `HttpOnly`, `SameSite=Lax`, `Secure` khi dùng HTTPS.
  - Bảo vệ chống tấn công CSRF thông qua header `x-admin-csrf-token`.
  - Rate limiting theo IP: Tối đa 5 lần thử đăng nhập sai trong 15 phút.
  - Khởi tạo tài khoản an toàn lần đầu qua giao diện (Setup Mode) hoặc qua biến môi trường `ADMIN_USERNAME`/`ADMIN_PASSWORD`, lưu an toàn tại `.starfront-config/admin-auth.json`.
- **API Mutation:** `POST /api/admin/asset-version`
  - Bắt buộc kiểm tra phiên Admin đăng nhập và CSRF token.
  - Kiểm tra Double Confirmation: Bắt buộc `confirmedTagInput === targetVersion`.
  - Ghi tệp nguyên tử (Atomic write: ghi ra tệp tạm `.tmp` sau đó rename).
  - Khóa lạc quan chống ghi đè đồng thời (Optimistic Concurrency Control): So khớp `expectedRevision` trước khi áp dụng.
  - Tự động ghi nhật ký Audit Log (`.starfront-config/asset-version-audit.json`).
- **API Routes:**
  - `POST /api/admin/auth/login`: Đăng nhập cấp Session Cookie.
  - `POST /api/admin/auth/logout`: Đăng xuất và hủy Session Cookie.
  - `GET /api/admin/auth/me`: Kiểm tra trạng thái phiên và cấp CSRF Token.
  - `POST /api/admin/auth/setup`: Khởi tạo tài khoản Quản trị viên lần đầu.
  - `GET /api/admin/asset-version/audit`: Lấy danh sách nhật ký kiểm toán.

### 2.4. Subphase A.3 — AdminCP Tab 9 UI & Sandboxed Preview
- **Component:** `components/game/world/admin-tabs/asset-version-tab.tsx`
- **Khối Auth:** Nếu chưa đăng nhập, hiển thị form Sci-Fi Login hoặc form Khởi tạo lần đầu nếu chưa có tài khoản.
- **Khối 1 (Production Status Card):** Hiển thị phiên bản đang hoạt động, CDN Base URL, thời điểm cập nhật, revision, trạng thái kết nối.
- **Khối 2 (Discovery & Audit Table):** Danh sách GitHub Releases kèm trạng thái kiểm định (Pending / Validating / Validated / Incompatible), nút bấm Kiểm tra Nhanh, Kiểm tra Toàn diện, nút Xem Trước và nút Kích hoạt.
- **Khối 3 (Sandboxed Preview Canvas):** Đối chiếu 3 tác phẩm nghệ thuật then chốt (Marcus Thorne, Valentine Cross, Vanguard Mecha) giữa phiên bản Production và phiên bản Preview được chọn.
- **Khối 4 (Audit Trail):** Lịch sử các thao tác ACTIVATE / ROLLBACK kèm nhãn thời gian, người thực hiện, revision và ghi chú.
- **Quy trình 2 Bước Phê duyệt (Double Confirmation):**
  - **Dialog 1 (Tóm tắt thay đổi):** Hiển thị phiên bản cũ -> phiên bản mới, kết quả kiểm định 26 assets, cảnh báo rủi ro.
  - **Dialog 2 (Xác nhận an ninh đỏ):** Cảnh báo nguy cấp, bắt buộc Admin phải gõ chính xác 100% chuỗi ký tự của Release Tag (ví dụ: `v2.0-assets-r1`) mới mở khóa nút "XÁC NHẬN KÍCH HOẠT TOÀN GAME".
- **Tích hợp AdminCP:** Bổ sung Tab 9 vào `components/game/world/admin-settings-modal.tsx` (`AdminModalTab = 'asset_version'`).

### 2.5. Subphase A.5 — Rollback & Client Synchronization
- **Rollback 1-Click:** Modal xác nhận rollback tức thì về `previousVersion` chỉ định, khôi phục URL và trạng thái ngay lập tức.
- **Đồng bộ Client không gián đoạn:**
  - `setClientActiveRuntimeConfig()` cập nhật module client resolver tức thì.
  - `broadcastAssetConfigChange()` phát sự kiện `starfront-asset-config-changed` cho toàn bộ các Provider/Hooks đang active.
  - Toàn bộ các component đang dùng `resolveImageUrl` hoặc `useAssetConfig` đổi ảnh ngay lập tức mà không cần reload trang hay rebuild ứng dụng.

---

## 3. Kết quả Kiểm thử & Biên dịch

1. **Bộ Kiểm thử Unit & Integration Tests (100% PASS):**
   - `tests/image-resolver.test.ts`: **8/8 PASS** (Xử lý đường dẫn, trailing slash, r2, local, jsdelivr).
   - `tests/runtime-asset-config.test.ts`: **7/7 PASS** (Schema, regex path traversal, projection, read-only safety, isolation).
   - `tests/web01-3a-integrated.test.ts`: **5/5 Suites PASS**
     - Suite 1: Admin Auth & Session Security (Scrypt hash, HMAC session, CSRF, tampering, rate limit).
     - Suite 2: GitHub Release Discovery & 10m TTL Cache.
     - Suite 3: Fast & Full Release Validation.
     - Suite 4: Persistence, Atomic Write, CAS Concurrency & Audit Logging.
     - Suite 5: Runtime Image Resolver Client Synchronization.
2. **Kiểm tra Kiểu Dữ liệu (`tsc --noEmit`):**
   - Lệnh: `npm run lint`
   - Kết quả: **0 LỖI (PASS)**.
3. **Biên dịch Sản phẩm Next.js (`compile_applet`):**
   - Kết quả: **SUCCESS** (Build thành công toàn bộ App Router, Server Components và API Routes).

---

## 4. Danh mục Tệp Nguồn Đã Tạo & Cập nhật trong Toàn bộ WEB-01.3.A

1. **Backend & Architecture Foundation:**
   - `lib/game/assets/runtime-asset-config.ts` (Tạo mới: Schema, AssetConfigStore abstraction, FileAssetConfigStore).
   - `lib/game/assets/github-release-validator.ts` (Tạo mới: GitHub discovery, TTL cache, Fast/Full validator).
   - `lib/game/auth/admin-auth.ts` (Tạo mới: Scrypt hashing, HMAC session, CSRF protection, IP rate limiting).
   - `lib/game/assets/image-resolver.ts` (Cập nhật: Bổ sung client resolver synchronization `setClientActiveRuntimeConfig`).
   - `.starfront-config/runtime-asset-config.json` (Tạo mới: File cấu hình runtime gốc).

2. **API Routes:**
   - `app/api/runtime/asset-config/route.ts` (Tạo mới: GET public config).
   - `app/api/admin/auth/login/route.ts` (Tạo mới: POST login & set HttpOnly cookie).
   - `app/api/admin/auth/logout/route.ts` (Tạo mới: POST logout & clear cookie).
   - `app/api/admin/auth/me/route.ts` (Tạo mới: GET session status & CSRF token).
   - `app/api/admin/auth/setup/route.ts` (Tạo mới: POST initial admin setup).
   - `app/api/admin/asset-version/releases/route.ts` (Tạo mới: GET release list from GitHub).
   - `app/api/admin/asset-version/validate/route.ts` (Tạo mới: POST fast/full validation).
   - `app/api/admin/asset-version/route.ts` (Tạo mới: POST activate / rollback mutation kèm atomic CAS & double confirmation).
   - `app/api/admin/asset-version/audit/route.ts` (Tạo mới: GET audit trail history).

3. **Frontend UI Components:**
   - `components/game/assets/asset-config-provider.tsx` (Tạo mới: React Context Provider, `useAssetConfig`, `broadcastAssetConfigChange`).
   - `components/game/world/admin-tabs/asset-version-tab.tsx` (Tạo mới: Giao diện Tab 9 với 4 khối quản trị và 2 dialog xác thực).
   - `components/game/world/admin-settings-modal.tsx` (Cập nhật: Tích hợp Tab 9 vào danh sách điều hướng AdminCP).
   - `app/layout.tsx` (Cập nhật: Bọc AssetConfigProvider tại cấp cao nhất).

4. **Testing Suite:**
   - `tests/image-resolver.test.ts` (8 kịch bản unit test Image Resolver).
   - `tests/runtime-asset-config.test.ts` (7 kịch bản unit test Runtime Config).
   - `tests/web01-3a-integrated.test.ts` (5 suites integrated tests toàn diện cho A.2 - A.5).

---

## 5. Hướng dẫn Vận hành và Bàn giao

1. **Khởi động Ứng dụng & Mở AdminCP:**
   - Nhấn biểu tượng Bánh răng Admin (hoặc phím tắt) tại giao diện Game World để mở `AdminSettingsModal`.
   - Chọn mục **Tab 9: Phiên Bản Artwork (CDN)** tại thanh điều hướng bên trái.
2. **Đăng nhập Quản trị viên:**
   - Lần đầu tiên truy cập nếu chưa cấu hình mật khẩu: Hệ thống hiển thị giao diện **"Khởi Tạo Tài Khoản Quản Trị Viên"**. Nhập Username (tối thiểu 3 ký tự) và Mật khẩu (tối thiểu 8 ký tự).
   - Những lần truy cập tiếp theo: Nhập tài khoản và mật khẩu đã khởi tạo để nhận Session Cookie an toàn.
3. **Quy trình Phát hành & Cập nhật Phiên bản Artwork Mới (Khi có r2, r3,...):**
   - Tạo GitHub Release mới tại repository `viettanpham/starfront-assets` (ví dụ `v2.0-assets-r2`) chứa thư mục `starfront-world-assets`.
   - Vào AdminCP Tab 9, nhấn **"LÀM MỚI DANH SÁCH"**.
   - Nhấn **"SOÁT LỖI TOÀN DIỆN"** để hệ thống kiểm tra 26 assets bắt buộc.
   - Nhấn **"XEM TRƯỚC"** để đối chiếu trực quan 3 tác phẩm mẫu.
   - Nhấn **"KÍCH HOẠT"**:
     - Xem tóm tắt tại **Hộp thoại Bước 1**.
     - Nhấn **"TIẾP TỤC BƯỚC 2"**.
     - Tại **Hộp thoại Bước 2**, gõ chính xác tên tag (ví dụ: `v2.0-assets-r2`).
     - Nhấn **"XÁC NHẬN KÍCH HOẠT TOÀN GAME"**.
   - Toàn bộ game chuyển sang CDN release mới ngay lập tức mà không cần build lại server.
4. **Quy trình Khôi phục (Rollback):**
   - Nếu phát hiện CDN mới có vấn đề, nhấn nút **"ROLLBACK"** trên thẻ Active Production.
   - Hệ thống tự động chuyển ngược lại `previousVersion` đã lưu và ghi log audit.
