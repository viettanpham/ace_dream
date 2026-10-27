# STARFRONT WORLD V2 — ADMINCP-AUTH-DEV-01
## LOCAL DEVELOPMENT ADMIN ACCESS — DEFINE / PLAN ONLY

**Mã tài liệu:** `ADMINCP_AUTH_DEV01_DEFINE_PLAN.md`  
**Chế độ thực thi:** `DEFINE / PLAN ONLY` — Tuyệt đối không can thiệp mã nguồn, không triển khai (NO IMPLEMENT) và không deploy trong tác vụ này.  
**Ngày lập kế hoạch:** 2026-10-27  
**Phạm vi:** Cơ chế truy cập AdminCP trong môi trường phát triển cục bộ (Local Development) không cần mật khẩu, bảo toàn 100% tính an toàn trên Staging và Production.

---

### 1. HIỆN TRẠNG KIẾN TRÚC XÁC THỰC ADMINCP HIỆN TẠI

#### 1.1. Hạ tầng và Khung kỹ thuật
- **Framework:** Next.js 16.3.0 App Router, chạy full-stack trên cổng 3000 (`next dev -p 3000 -H 0.0.0.0`).
- **Giao diện AdminCP:** 
  - Route chính: `/v2/admin` (`app/v2/admin/page.tsx`).
  - Thành phần giao diện: `CharacterContentManager` (`components/game/v2/admin/character-content-manager.tsx`) và `V1AdminWorkspace` (`components/game/admin/v1-admin-workspace.tsx`).
- **Cơ chế Xác thực (Authentication Engine):** `lib/game/auth/admin-auth.ts`:
  - **Mô hình Session:** Cookie `starfront_admin_session` ký số HMAC-SHA256 (thời hạn 12 giờ) kết hợp lưu trữ salt/hash scrypt trong `.starfront-config/admin-auth.json`.
  - **Dự phòng Header:** `Authorization: Bearer <token>` và `x-admin-session-token: <token>` (phục vụ iframe nhúng và trình duyệt chặn 3rd-party cookie).
  - **Bảo vệ Biến đổi Trạng thái (Mutation Guard):** `x-csrf-token` bắt buộc đối với tất cả các thao tác `POST`, `PUT`, `DELETE`.

#### 1.2. Điểm nghẽn khi Phát triển Cục bộ (Pain Points in Local DEV)
1. **Bắt buộc nhập mật khẩu lặp đi lặp lại:** Khi khởi động lại dev server, xóa cookie trình duyệt hoặc chuyển đổi context, developer phải nhập tài khoản/mật khẩu hoặc trải qua bước setup nếu chưa có store cục bộ.
2. **Cơ chế Dev Preview cũ bị hạn chế:**
   - Trong `lib/game/auth/admin-auth.ts`, hàm `isDevAdminPreviewEnabled()` chỉ cho phép bypass ở yêu cầu đọc `GET` thuần túy (`requireCsrf === false`).
   - Mọi thao tác ghi dữ liệu (cập nhật nhân vật, đăng ký artwork, xuất bản cốt truyện, thay đổi cấu hình CDN) đều gọi `verifyAdminRequest(req, true)` -> hệ thống lập tức từ chối với mã lỗi `401 Unauthorized` nếu chưa có token session hợp lệ.
3. **Môi trường Cloud Run Dev Preview đặc thù:**
   - Dev server tại AI Studio chạy trên container có hostname công khai dạng `https://ais-dev-*.run.app`. Nếu chỉ kiểm tra `NODE_ENV === 'development'` mà không kiểm tra nguồn gốc truy cập (Client IP, Loopback, Host Header), bất kỳ ai có URL dev preview đều có thể nắm toàn quyền can thiệp hệ thống.

---

### 2. PHÂN TÍCH RỦI RO BẢO MẬT & MA TRẬN MÔI TRƯỜNG

#### 2.1. Phân tích Rủi ro Kỹ thuật
| Nguy cơ / Kịch bản Tấn công | Mức độ | Nguyên nhân Kỹ thuật | Cơ chế Phòng vệ Đề xuất |
| :--- | :---: | :--- | :--- |
| **Bypass rò rỉ lên Production / Staging** | **CRITICAL** | Sử dụng cờ lỏng lẻo hoặc quên gỡ code test trước khi build production bundle. | Khóa chết ở mức build-time: kiểm tra cứng `process.env.NODE_ENV !== 'production'` VÀ biến cờ explicit `STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS === 'true'`. |
| **Bypass qua Public Tunnel / Cloud Run Dev URL** | **HIGH** | `NODE_ENV=development` nhưng máy chủ dev được expose ra Internet qua Cloud Run hoặc ngrok. | Kiểm tra **Loopback IP** (`127.0.0.1`, `::1`) và **Host Header** (`localhost:3000`, `127.0.0.1:3000`). Bất kỳ truy cập nào qua tên miền ngoài (`*.run.app`, domain tùy chỉnh) đều bị từ chối bypass và buộc đăng nhập mật khẩu. |
| **Giả mạo Header IP (IP Spoofing)** | **HIGH** | Kẻ tấn công gửi header `X-Forwarded-For: 127.0.0.1` qua reverse proxy để đánh lừa server. | Server không chỉ tin cậy `X-Forwarded-For` đơn thuần. Phải kiểm tra socket remote address thực tế hoặc chỉ kích hoạt khi cờ cấu hình local-only được bật trong tệp `.env.local` (tệp không bao giờ commit lên git). |
| **Bỏ qua kiểm tra RBAC / Phân quyền API** | **MEDIUM** | Bỏ qua hàm `verifyAdminRequest` dẫn đến việc request không có đối tượng `user`, gây crash hoặc mất dấu vết audit log. | Cơ chế bypass **KHÔNG bỏ qua xác thực**, mà là **Tự động cấp phiên danh tính phát triển (Dev Identity Session)** có role `superadmin` và session token ký số hợp lệ. |
| **Mất kiểm soát chuyển đổi (No Kill-Switch)** | **LOW** | Developer muốn kiểm tra luồng đăng nhập thật nhưng hệ thống luôn tự động bypass. | Cung cấp công tắc Toggle trên UI và biến môi trường để bật/tắt chế độ bypass ngay tức thì mà không cần xóa dữ liệu. |

#### 2.2. Ma trận Môi trường & Quyền Hạn
| Môi trường | Nhận diện Môi trường | Điều kiện Kích hoạt Bypass | Hành vi Đăng nhập AdminCP |
| :--- | :--- | :--- | :--- |
| **Localhost Thật (Local Dev)** | `NODE_ENV === 'development'`<br>`host` là `localhost` hoặc `127.0.0.1`<br>Remote IP là loopback | `STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS === 'true'` (hoặc mặc định bật nếu chạy cục bộ máy cá nhân) | **TỰ ĐỘNG ĐĂNG NHẬP** với vai trò `dev_local_admin` (Superadmin). Không cần gõ mật khẩu. Có nút "Chuyển sang Đăng nhập Mật khẩu". |
| **Cloud Run Dev Preview (`ais-dev-*.run.app`)** | `NODE_ENV === 'development'`<br>`host` kết thúc bằng `.run.app` | Mặc định **TẮT** để bảo vệ preview công khai. Chỉ kích hoạt nếu có bí mật `STARFRONT_DEV_ACCESS_KEY` truyền qua query/header. | **BẮT BUỘC MẬT KHẨU** (Bảo vệ dự án trước người xem bên ngoài). |
| **Staging (`ais-pre-*.run.app`)** | `NODE_ENV === 'production'`<br>`APP_ENV === 'staging'` | **CẤM TUYỆT ĐỐI** (Mã nguồn chặn cứng, không có ngoại lệ). | **BẮT BUỘC MẬT KHẨU** chuẩn `scrypt`. |
| **Production** | `NODE_ENV === 'production'` | **CẤM TUYỆT ĐỐI** (Mã nguồn chặn cứng, không có ngoại lệ). | **BẮT BUỘC MẬT KHẨU** chuẩn `scrypt` + Rate Limiting. |

---

### 3. ĐỀ XUẤT PHƯƠNG ÁN KIẾN TRÚC: "DEV IDENTITY AUTO-PROVISIONING"

Thay vì đục lỗ thủng (bypass lỗ hổng) trên từng API, giải pháp chuẩn hóa sử dụng kiến trúc **"Dev Identity Auto-Provisioning"** (Cấp phát Danh tính Phát triển Tự động).

#### 3.1. Luồng Hoạt động Tổng thể (Workflow)
```text
┌────────────────────────────────────────────────────────────────────────┐
│                      1. TRÌNH DUYỆT TRUY CẬP /v2/admin                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ GET /api/admin/auth/me
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   2. SERVER-SIDE LOCAL DEV DETECTOR                    │
│  Kiểm tra 3 điều kiện đồng thời:                                       │
│  [1] process.env.NODE_ENV !== 'production'                             │
│  [2] process.env.STARFRONT_DISABLE_DEV_AUTH !== 'true'                 │
│  [3] Request Host là localhost:3000 / 127.0.0.1:3000                   │
│      HOẶC có cờ máy chủ cục bộ STARFRONT_LOCAL_DEV_AUTO_AUTH=true       │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │ KHÔNG ĐỦ ĐIỀU KIỆN             │ ĐỦ ĐIỀU KIỆN
                    ▼                                ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│ 3A. BẮT BUỘC ĐĂNG NHẬP THƯỜNG     │ │ 3B. AUTO-MINT DEV SESSION TOKEN  │
│ - Trả về: authenticated=false     │ │ - Sinh HMAC Session cho user:    │
│ - Hiển thị Form Mật khẩu Admin    │ │   username: "dev_local_admin"    │
│ - Rate limit nếu gõ sai           │ │   role: "superadmin"             │
└───────────────────────────────────┘ │ - Sinh CSRF Token gắn kèm       │
                                      │ - Tự động đính kèm HttpOnly      │
                                      │   Cookie trên response           │
                                      └──────────────────┬───────────────┘
                                                         │ Trả về authenticated=true
                                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   4. GIAO DIỆN ADMINCP TỰ ĐỘNG MỞ                      │
│  - Bỏ qua màn hình nhập mật khẩu hoàn toàn                             │
│  - Thanh trạng thái hiển thị huy hiệu: [DEV LOCAL // SUPERADMIN]       │
│  - Mọi thao tác POST/PUT/DELETE đều dùng CSRF token và Session hợp lệ  │
│  - Có nút "Đăng xuất / Thử nghiệm Đăng nhập thường"                    │
└────────────────────────────────────────────────────────────────────────┘
```

#### 3.2. Chi tiết Kỹ thuật Cốt lõi

1. **Hàm Nhận diện Cục bộ An toàn (`isEligibleLocalDevRequest`):**
   ```typescript
   export function isEligibleLocalDevRequest(req: NextRequest): boolean {
     // Rào chắn 1: Không bao giờ kích hoạt trong môi trường production
     if (process.env.NODE_ENV === 'production') return false;

     // Rào chắn 2: Công tắc khẩn cấp tắt bypass nếu muốn test mật khẩu
     if (process.env.STARFRONT_DISABLE_DEV_AUTH === 'true') return false;

     // Rào chắn 3: Cờ bật chủ động từ môi trường dev
     if (process.env.STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS !== 'true') return false;

     // Rào chắn 4: Kiểm tra Host header
     const host = req.headers.get('host') || '';
     const isLocalHost = 
       host.startsWith('localhost:') || 
       host === 'localhost' || 
       host.startsWith('127.0.0.1:') || 
       host === '127.0.0.1';

     return isLocalHost;
   }
   ```

2. **Cơ chế Cấp phát Danh tính Phát triển (Dev Identity Minting):**
   - Khi `isEligibleLocalDevRequest(req)` đạt điều kiện và request chưa có session:
     - Tạo tài khoản danh tính phát triển ảo:
       ```typescript
       const devAdminUser: AdminUser = {
         username: 'dev_local_superadmin',
         role: 'superadmin',
         createdAt: 'DEVELOPMENT_RUNTIME'
       };
       ```
     - Gọi trực tiếp `createSessionToken('dev_local_superadmin', 'superadmin')` để sinh token HMAC chuẩn và CSRF token đồng bộ.
     - Đính cookie `starfront_admin_session` vào phản hồi của `/api/admin/auth/me`.
   - **Lợi ích kiến trúc:**
     - Các API nghiệp vụ (`/api/admin/character-content`, `/api/admin/story`, v.v.) **hoàn toàn không cần sửa đổi logic bảo mật hay bỏ qua `verifyAdminRequest`**.
     - Token gửi lên là token HMAC thật, CSRF thật, bảo đảm tính toàn vẹn 100% của kiến trúc bảo mật.
     - Nhật ký thay đổi (Audit Log) ghi nhận chuẩn xác tên người thực hiện là `dev_local_superadmin` thay vì ẩn danh.

3. **Cơ chế Kill-Switch & Khôi phục Đăng nhập Thường:**
   - **Cách 1 (UI Toggle):** Thêm nút `[CHUYỂN SANG ĐĂNG NHẬP MẬT KHẨU]` tại góc trên AdminCP. Khi bấm, hệ thống xóa session cookie và đặt một cờ tạm thời trong cookie `starfront_dev_auth_override=manual`.
   - **Cách 2 (Môi trường):** Đặt `STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS=false` trong `.env.local` hoặc biến môi trường container để quay về chế độ bảo vệ mật khẩu nghiêm ngặt.

---

### 4. DANH SÁCH FILE DỰ KIẾN CẦN THAY ĐỔI (KHI ĐƯỢC DUYỆT IMPLEMENT)

| Tệp tin | Vị trí thay đổi dự kiến | Mục đích kỹ thuật |
| :--- | :--- | :--- |
| `lib/game/auth/admin-auth.ts` | Thêm hàm `isEligibleLocalDevRequest()`, cập nhật logic trong `verifyAdminRequest()` để hỗ trợ Dev Session tự động an toàn. | Nền tảng kiểm định điều kiện local dev phía server. |
| `app/api/admin/auth/me/route.ts` | Khi phát hiện request local dev hợp lệ chưa có session, tự động mint session token và đính kèm cookie trả về client. | Tự động hóa đăng nhập cho frontend mà không cần form. |
| `components/game/v2/admin/character-content-manager.tsx` | Cập nhật hook `checkAuth()` để nhận diện `isDevLocalMode`, tự động hiển thị workspace quản trị, bổ sung huy hiệu cảnh báo Dev Mode và nút chuyển đăng nhập thủ công. | Trải nghiệm UI mượt mà, không giật màn hình login. |
| `components/game/admin/v1-admin-workspace.tsx` | Đồng bộ trạng thái dev session cho V1 workspace để đảm bảo không bị văng đăng nhập khi chuyển tab V1/V2. | Bảo toàn tính đồng nhất giữa V1 và V2. |
| `.env.example` | Bổ sung tài liệu về biến cấu hình `STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS=true`. | Hướng dẫn developer mới thiết lập môi trường. |
| `tests/admin-auth-dev-access.test.ts` | Tạo bộ kiểm thử tự động mới cho tính năng local dev auth access. | Đảm bảo chất lượng và ngăn ngừa hồi quy. |

---

### 5. KẾ HOẠCH KIỂM THỬ (TEST PLAN — 7 TEST CASES)

| STT | Tên Test Case | Điều kiện Tiền đề (Preconditions) | Các bước Thực hiện (Action) | Kết quả Mong đợi (Expected Outcome) | Đánh giá |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | **Local DEV hợp lệ không cần mật khẩu** | `NODE_ENV=development`<br>`STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS=true`<br>Host: `localhost:3000` | Gửi request `GET /api/admin/auth/me` và truy cập `/v2/admin`. | Trả về `authenticated: true`, cấp token session và CSRF token hợp lệ; UI mở thẳng vào AdminCP với quyền superadmin, không hiện form mật khẩu. | `PASS_CRITERIA` |
| **TC-02** | **Local DEV tắt cờ bypass** | `NODE_ENV=development`<br>`STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS=false` | Truy cập `/v2/admin` từ `localhost:3000`. | Trả về `authenticated: false`; UI hiển thị form đăng nhập yêu cầu nhập mật khẩu bình thường. | `PASS_CRITERIA` |
| **TC-03** | **Production bắt buộc mật khẩu** | `NODE_ENV=production`<br>`STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS=true` *(cố ý đặt sai)* | Gửi request `GET /api/admin/auth/me` không kèm cookie session. | Server chặn đứng cờ bypass vì `NODE_ENV===production`; trả về `authenticated: false`, yêu cầu mật khẩu scrypt. | `PASS_CRITERIA` |
| **TC-04** | **Staging bắt buộc mật khẩu** | `APP_ENV=staging`<br>`NODE_ENV=production`<br>Host: `ais-pre-*.run.app` | Truy cập `/v2/admin` từ trình duyệt công khai. | Trả về `authenticated: false`; không thể tự động nhận quyền admin. | `PASS_CRITERIA` |
| **TC-05** | **Truy cập qua Public Tunnel / Remote URL trong Dev Mode** | `NODE_ENV=development`<br>`STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS=true`<br>Host: `ais-dev-*.run.app` *(không phải localhost)* | Truy cập URL dev preview từ mạng Internet bên ngoài. | Host không phải `localhost` hoặc `127.0.0.1` -> từ chối auto-provisioning; yêu cầu đăng nhập bằng mật khẩu Quản trị viên đã thiết lập. | `PASS_CRITERIA` |
| **TC-06** | **Thẩm định quyền hạn API Nghiệp vụ (POST/PUT/DELETE)** | Đang đăng nhập qua Local Dev Auto-Session | Gửi request `POST /api/admin/character-content` cập nhật thông tin Pilot kèm CSRF token được cấp. | API xử lý thành công với mã `200 OK`, ghi nhận audit log với actor `dev_local_superadmin`; nếu thiếu CSRF token, API vẫn từ chối `403 Forbidden` đúng quy tắc. | `PASS_CRITERIA` |
| **TC-07** | **Đóng gói Build Production (Build Artifact Validation)** | Chạy `npm run build` | Kiểm tra bundle output sau khi build production. | Quá trình tree-shaking và kiểm tra compile thành công 100%; không có bất kỳ backdoor bypass nào lọt vào mã nguồn chạy production. | `PASS_CRITERIA` |

---

### 6. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

Một lượt triển khai được coi là **ĐẠT (PASS)** khi thỏa mãn toàn bộ 6 tiêu chí:
1. **Tiện ích phát triển:** Truy cập `http://localhost:3000/v2/admin` mở trực tiếp bảng điều khiển AdminCP trong dưới 1 giây mà không phải gõ mật khẩu.
2. **Bảo toàn chức năng:** Tất cả các tính năng quản trị (đăng ký ảnh, duyệt cốt truyện, chỉnh sửa nhân vật, quản lý phiên bản) hoạt động trọn vẹn, không bị lỗi phân quyền 401/403.
3. **Cách ly tuyệt đối:** Khi chạy ở chế độ `NODE_ENV=production` hoặc truy cập qua tên miền Cloud Run bên ngoài, tính năng auto-login tự động vô hiệu hóa 100%.
4. **Không phụ thuộc dữ liệu tĩnh:** Không sinh ra bất kỳ tài khoản mật khẩu mặc định (hardcoded default credentials) nào trong git.
5. **Khả năng kiểm soát:** Developer có thể chuyển đổi qua lại giữa chế độ tự động và chế độ đăng nhập mật khẩu thật chỉ bằng 1 nút bấm hoặc 1 biến môi trường.
6. **Kiểm thử tự động:** 100% test cases trong bộ kiểm thử xác thực vượt qua thành công (`npm run test` pass).

---

### 7. KẾ HOẠCH KHÔI PHỤC (ROLLBACK PLAN)

Nếu sau khi triển khai phát sinh lỗi không mong muốn hoặc xung đột phiên làm việc:
1. **Khôi phục Tức thì (Zero Code Change):**
   - Đặt biến môi trường `STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS=false` trong file `.env.local` hoặc xóa tệp này. Dev server sẽ tự động quay trở về quy trình xác thực mật khẩu truyền thống 100%.
2. **Khôi phục Mã nguồn (Git Revert):**
   - Hoàn nguyên các thay đổi trong `lib/game/auth/admin-auth.ts` và `app/api/admin/auth/me/route.ts` về phiên bản canonical trước đó thông qua checkpoint git.
3. **Dọn dẹp Phiên Trình duyệt:**
   - Xóa cookie `starfront_admin_session` trên trình duyệt để loại bỏ phiên dev tạm thời.

---

### 8. NHỮNG QUYẾT ĐỊNH CẦN CHỦ DỰ ÁN PHÊ DUYỆT TRƯỚC KHI IMPLEMENT

Kính trình Chủ dự án xem xét và phê duyệt 3 quyết định kỹ thuật trước khi chuyển sang pha IMPLEMENT:

#### Quyết định 1: Phạm vi Định nghĩa "Local Development"
- **Phương án 1.A (Khuyến nghị — Nghiêm ngặt nhất):** Chỉ cho phép bypass khi chạy trực tiếp trên máy cục bộ của lập trình viên (`Host: localhost:3000` hoặc `127.0.0.1:3000`). Nếu mở app qua URL Google Cloud Run Dev Preview (`ais-dev-*.run.app`), người dùng vẫn phải nhập mật khẩu để tránh rò rỉ quyền quản trị cho người ngoài có link.
- **Phương án 1.B (Mở rộng cho Cloud Run Dev Preview):** Cho phép bypass trên cả URL `ais-dev-*.run.app` khi `NODE_ENV !== 'production'`. *(Lưu ý: Bất kỳ ai có đường link preview này đều sẽ tự động có quyền superadmin sửa đổi dữ liệu dev)*.

#### Quyết định 2: Tên & Vai trò của Danh tính Mặc định (Dev Identity Role)
- **Phương án 2.A (Khuyến nghị):** Cấp quyền `superadmin` với tên tài khoản hiển thị là `dev_local_admin` để nhà phát triển có đầy đủ mọi quyền hạn kiểm tra hệ thống.
- **Phương án 2.B:** Cấp quyền `admin` tiêu chuẩn, yêu cầu đăng nhập mật khẩu nâng cao nếu muốn thực hiện các thao tác phá hủy dữ liệu (reset store).

#### Quyết định 3: Trạng thái Khởi tạo Mặc định (Default Behavior)
- **Phương án 3.A (Khuyến nghị):** Mặc định TỰ ĐỘNG BẬT trong môi trường `localhost` mà không cần cấu hình thêm file `.env.local`, giúp tiết kiệm thời gian tối đa cho nhóm phát triển.
- **Phương án 3.B:** Mặc định TẮT, chỉ kích hoạt khi developer chủ động tạo tệp `.env.local` có dòng `STARFRONT_ALLOW_LOCAL_DEV_AUTH_BYPASS=true`.

---

**DỪNG BƯỚC (STOPPED AT DEFINE / PLAN CHECKPOINT):**
Tài liệu kế hoạch đã hoàn tất. Không có bất kỳ dòng mã nguồn nào bị thay đổi. Chờ phê duyệt của Chủ dự án để tiến hành pha IMPLEMENT.
