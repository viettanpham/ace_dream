# STARFRONT WORLD V2 — ADMINCP-AUTH-DEV-03
## KẾ HOẠCH THIẾT KẾ KIẾN TRÚC GOOGLE OAUTH SSO CHO ADMINCP (ĐÃ HIỆU CHỈNH AN TOÀN)
### REVISED ARCHITECTURE & IMPLEMENTATION PLAN (PRE-IMPLEMENT CORRECTION)

**Mã tài liệu:** `ADMINCP_AUTH_DEV03_GOOGLE_SSO_DEFINE_PLAN.md`  
**Chế độ thực thi:** `MODE: PLAN CORRECTION ONLY` (Chỉ hiệu chỉnh kế hoạch kiến trúc, KHÔNG sửa runtime, KHÔNG IMPLEMENT, KHÔNG DEPLOY)  
**Ngày hiệu chỉnh:** 2026-10-27  
**Tài liệu tiền đề:** `ADMINCP_AUTH_DEV02_DIAGNOSIS_AND_FIX_REPORT.md`  
**Chủ dự án (Target Identity):** `boyvipfreepy@gmail.com`  
**Development App URL:** `https://ais-dev-xrgotl42saoyikd7ywy2dt-8306156675.asia-southeast1.run.app`  
**Shared App URL:** `https://ais-pre-xrgotl42saoyikd7ywy2dt-8306156675.asia-southeast1.run.app`  

---

### 1. BỐI CẢNH VÀ CÁC ĐIỀU CHỈNH TRỌNG YẾU THEO Ý KIẾN CHỦ DỰ ÁN

Chủ dự án đã phê duyệt định hướng sử dụng Google Identity Services (GSI) Popup, đồng thời yêu cầu xử lý triệt để hai rủi ro kỹ thuật lớn trước khi bước vào giai đoạn IMPLEMENT:

1. **Rủi ro 1 — Authorized JavaScript Origins không hỗ trợ Wildcard:**  
   Google Cloud Console cấm hoàn toàn ký tự đại diện (`*`). Do đó, Popup **không tự động giải quyết triệt để** vấn đề Dynamic Origin nếu URL Cloud Run Preview thay đổi mà chưa được đăng ký trong GCP. Cần đánh giá độ ổn định thực tế của URL và thiết kế phương án dự phòng khi origin thay đổi.
2. **Rủi ro 2 — Không lưu Bearer Token trong `sessionStorage`:**  
   Loại bỏ cơ chế mặc định lưu Admin Token vào `sessionStorage` của client. Ưu tiên tuyệt đối cho `HttpOnly; Secure; SameSite` Session Cookie. Đối với rào cản iframe chặn third-party cookie, áp dụng phương án mở AdminCP trong **Tab Riêng Độc Lập (Standalone Top-Level Tab)** để cookie First-Party hoạt động nguyên bản.
3. **Định danh Bất biến (Immutable Identity) bằng Google `sub`:**  
   Bên cạnh việc kiểm tra email `boyvipfreepy@gmail.com` và `email_verified == true`, server phải hỗ trợ lưu và đối chiếu định danh vĩnh viễn Google Subject Identifier (`sub`) của tài khoản Google.
4. **Bảo tồn Tuyệt đối Fallback Password Login & Zero Bypass:**  
   Không tạo bất kỳ cửa sau hay bypass nào. Giữ nguyên 100% form đăng nhập mật khẩu với `scrypt` hashing và rate-limiting.

---

### 2. PHÂN TÍCH RỦI RO 1: ĐỘ ỔN ĐỊNH CỦA CLOUD RUN URL VÀ XỬ LÝ ORIGIN

#### 2.1. Đánh giá Độ Ổn Định của URL Preview Thực tế
- **Cấu trúc URL hiện tại:** `https://ais-dev-xrgotl42saoyikd7ywy2dt-8306156675.asia-southeast1.run.app`
  - Tiền tố `ais-dev-`: Xác định môi trường Development riêng tư của AI Studio workspace.
  - Chuỗi hash `xrgotl42saoyikd7ywy2dt`: Định danh duy nhất của service Cloud Run gắn liền với Workspace ID này.
  - Số hiệu dự án `8306156675` và khu vực `asia-southeast1`: Cố định theo tài khoản Google Cloud của AI Studio.
- **Tính ổn định:**
  - Trong cùng một phiên làm việc hoặc khi dev server restart/rebuild, chuỗi URL này **ổn định và không thay đổi**.
  - **TUY NHIÊN, URL sẽ thay đổi trong các trường hợp sau:**
    1. Khi dự án được clone / fork sang một workspace hoặc tài khoản AI Studio khác.
    2. Khi người dùng mở qua link chia sẻ Shared Preview (`https://ais-pre-...`).
    3. Khi dự án được deploy sang Cloud Run độc lập hoặc chạy local `http://localhost:3000`.

#### 2.2. Phương án Xử lý Triệt để khi Origin Thay Đổi (Origin Management Strategy)
Vì Google Cloud Console **nghiêm cấm wildcard** (`https://*.run.app` sẽ bị từ chối với lỗi `Invalid Origin`), giải pháp được thiết kế gồm 3 lớp:

1. **Lớp 1 — Khai báo Đa Origin (Multi-Origin Pre-Registration):**
   GCP Console cho phép khai báo tối đa **100 Authorized JavaScript Origins** trên một Client ID. Cấu hình sẵn ngay từ đầu:
   - `http://localhost:3000` (Localhost)
   - `https://ais-dev-xrgotl42saoyikd7ywy2dt-8306156675.asia-southeast1.run.app` (Dev Preview hiện tại)
   - `https://ais-pre-xrgotl42saoyikd7ywy2dt-8306156675.asia-southeast1.run.app` (Shared Preview)
2. **Lớp 2 — Cơ chế Chẩn đoán Origin tại Client (Client-Side Origin Guard):**
   Trước khi kích hoạt GSI Popup, component đọc `window.location.origin`:
   - Nếu Google SDK trả về lỗi khởi tạo (`idpiframe_initialization_failed` hoặc mã lỗi `origin_mismatch` do origin chưa được thêm vào GCP), UI **không bị treo hay crash**.
   - UI hiển thị một thông báo hướng dẫn kỹ thuật rõ ràng:
     > *"Cảnh báo Origin: Tên miền hiện tại `[origin]` chưa được thêm vào Google Cloud Console. Vui lòng thêm origin này vào Client ID hoặc sử dụng Đăng nhập Mật khẩu bên dưới."*
3. **Lớp 3 — Password Login Fallback Luôn Sẵn Sàng (Zero Lockout):**
   Nếu URL thay đổi đột xuất mà Chủ dự án chưa kịp cập nhật Console, form đăng nhập mật khẩu với tài khoản `admin321` (`superadmin`) luôn hiện diện ngay bên dưới để quản trị viên tiếp tục công việc ngay lập tức mà không bị gián đoạn.

---

### 3. PHÂN TÍCH RỦI RO 2: KIẾN TRÚC SESSION COOKIE VÀ GIẢI PHÁP TAB RIÊNG

#### 3.1. Loại bỏ Mặc định Lưu Bearer Token trong `sessionStorage`
- **Lý do bảo mật:** Token lưu trong `sessionStorage` có thể bị rò rỉ nếu có lỗ hổng Cross-Site Scripting (XSS) từ các thư viện phụ thuộc. Đồng thời, việc lưu Bearer Token trong client tạo ra hai luồng xác thực song song khó kiểm soát.
- **Quy chuẩn mới:**
  - Server chỉ cấp phiên làm việc thông qua **`HttpOnly; Secure; SameSite` Session Cookie** (`starfront_admin_session`).
  - Trình duyệt tự động gửi cookie này ở tầng network trong mọi request; JavaScript client hoàn toàn không thể đọc hoặc can thiệp (`document.cookie` không truy cập được).
  - Không tự động đẩy session token thô vào `sessionStorage` làm cơ chế xác thực mặc định.

#### 3.2. Giải pháp Ngữ cảnh Tab Riêng (Standalone Admin Tab UX)
Khi ứng dụng chạy trong `<iframe>` của AI Studio Preview (`aistudio.google.com` nhúng `ais-dev-*.run.app`), trình duyệt hiện đại (Chrome Privacy Sandbox/CHIPS, Safari ITP) có thể cô lập (partition) hoặc chặn cookie bên thứ ba.

Để giải quyết triệt để vấn đề này mà không cần hạ thấp tiêu chuẩn bảo mật:
1. **Ưu tiên Mở AdminCP trong Tab Độc Lập (Top-Level Window):**
   - URL AdminCP: `https://ais-dev-xrgotl42saoyikd7ywy2dt-8306156675.asia-southeast1.run.app/v2/admin`
   - Khi mở trực tiếp trong một tab trình duyệt riêng, ứng dụng chạy trong **First-Party Context** 100%.
   - Cookie `HttpOnly; Secure; SameSite=Lax` hoạt động hoàn hảo, bền vững tuyệt đối qua các lần F5/Refresh, không bao giờ bị chính sách chặn cookie của trình duyệt ảnh hưởng.
2. **Hỗ trợ Điều hướng Nhanh từ Iframe Preview:**
   - Trong giao diện game hoặc form đăng nhập AdminCP nhúng trong iframe: Bổ sung nút bấm trực quan:  
     `[ ↗ Mở AdminCP trong Tab Riêng (Bảo đảm Phiên Cookie)]` (mở bằng `target="_blank"`).
   - Nếu phát hiện cookie bị chặn trong iframe (`window.self !== window.top`), hệ thống khuyến cáo người dùng chuyển sang tab riêng chỉ bằng 1 cú nhấp chuột.
3. **Bảo toàn CSRF Protection:**
   - Khi đăng nhập thành công hoặc khi gọi `GET /api/admin/auth/me`, server trả về `csrfToken`.
   - Client lưu `csrfToken` thuần túy trong React memory state (không lưu session key).
   - Mọi request làm thay đổi dữ liệu (`POST`, `PUT`, `DELETE`) bắt buộc phải gửi header `x-csrf-token` khớp với token gắn trong session cookie của server.

---

### 4. QUY TRÌNH XÁC MINH SERVER-SIDE VÀ ĐỊNH DANH BẰNG GOOGLE `sub`

Khi client gửi Google ID Token lên `POST /api/admin/auth/google/verify`, server thực thi quy trình xác minh 6 bước nghiêm ngặt:

```
[Google ID Token (JWT)] ──> POST /api/admin/auth/google/verify
                                      │
 ┌────────────────────────────────────┴────────────────────────────────────┐
 │ BƯỚC 1: XÁC MINH CHỮ KÝ SỐ MẬT MÃ (RSA-SHA256)                          │
 │ - Sử dụng google-auth-library đối chiếu với Google JWKS Endpoint        │
 │ - Chặn đứng 100% token giả mạo hoặc token tự tạo                        │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ BƯỚC 2: KIỂM TRA ISSUER & AUDIENCE                                      │
 │ - iss bắt buộc là: accounts.google.com hoặc https://accounts.google.com │
 │ - aud bắt buộc khớp chính xác: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ BƯỚC 3: KIỂM TRA THỜI HẠN (EXPIRATION & NOT BEFORE)                     │
 │ - exp > Date.now() / 1000 và nbf <= Date.now() / 1000                   │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ BƯỚC 4: KIỂM TRA TRẠNG THÁI EMAIL                                       │
 │ - email_verified === true (bắt buộc)                                    │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ BƯỚC 5: KIỂM TRA DANH TÍNH EMAIL & WHITELIST                            │
 │ - payload.email.toLowerCase() === 'boyvipfreepy@gmail.com'              │
 │ - (Hoặc nằm trong STARFRONT_ADMIN_GOOGLE_EMAILS)                        │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ BƯỚC 6: ĐỐI CHIẾU ĐỊNH DANH BẤT BIẾN (GOOGLE sub IDENTIFIER)            │
 │ - Trích xuất payload.sub (Chuỗi số 21 ký tự duy nhất vĩnh viễn)         │
 │ - Nếu cấu hình STARFRONT_ADMIN_GOOGLE_SUB tồn tại:                      │
 │     Yêu cầu payload.sub === process.env.STARFRONT_ADMIN_GOOGLE_SUB      │
 │ - Nếu chưa có, tự động liên kết sub này với tài khoản quản trị trong    │
 │   admin-auth.json để khóa cứng định danh cho các phiên sau.             │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                  THÀNH CÔNG
                                      │
                                      ▼
             Cấp Cookie Session HttpOnly: starfront_admin_session
                     (Role: superadmin, Thời hạn: 12 giờ)
```

---

### 5. CẤU HÌNH GOOGLE CLOUD CONSOLE CHÍNH XÁC VÀ CÁC BƯỚC THỰC HIỆN

Chủ dự án thực hiện theo quy trình chuẩn sau trên Google Cloud Platform:

#### Bước 1: Mở Google Cloud Console
1. Đăng nhập bằng tài khoản `boyvipfreepy@gmail.com`.
2. Truy cập: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials).
3. Chọn đúng Google Cloud Project của ứng dụng (Project ID: `8306156675` hoặc Project hiện hành).

#### Bước 2: Thiết lập OAuth Consent Screen (Màn hình đồng ý OAuth)
1. Vào menu **APIs & Services** > **OAuth consent screen**.
2. Chọn loại **External** (hoặc Internal nếu dùng Google Workspace). Bấm **Create**.
3. Điền thông tin cơ bản:
   - **App name:** `STARFRONT WORLD V2 ADMINCP`
   - **User support email:** `boyvipfreepy@gmail.com`
   - **Developer contact information:** `boyvipfreepy@gmail.com`
4. Tại bước **Scopes**, chọn 3 scope cơ bản:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Tại bước **Test users** (nếu đang ở trạng thái Testing):
   - Thêm email: `boyvipfreepy@gmail.com`.
6. Bấm **Save and Continue** để hoàn tất.

#### Bước 3: Tạo OAuth 2.0 Client ID
1. Vào menu **Credentials** > Bấm **+ CREATE CREDENTIALS** > Chọn **OAuth client ID**.
2. **Application type:** Chọn **Web application**.
3. **Name:** `Starfront AdminCP Web Client`.
4. **Authorized JavaScript origins (BẮT BUỘC ĐIỀN CHÍNH XÁC):**
   Bấm **+ ADD URI** và nhập 3 origins:
   - `http://localhost:3000`
   - `https://ais-dev-xrgotl42saoyikd7ywy2dt-8306156675.asia-southeast1.run.app`
   - `https://ais-pre-xrgotl42saoyikd7ywy2dt-8306156675.asia-southeast1.run.app`
   *(Lưu ý: Không thêm dấu gạch chéo `/` ở cuối origin. Không điền vào mục Authorized redirect URIs vì GSI Popup không cần redirect URI).*
5. Bấm **CREATE**.
6. Sao chép chuỗi **Client ID** (có định dạng: `8306156675-xxxxxxxxxxxx.apps.googleusercontent.com`).
   *(Tuyệt đối KHÔNG cần gửi Client Secret)*.

#### Bước 4: Cấu hình Biến Môi trường trong Ứng dụng
Khai báo vào `.env.local`:
```bash
# Google OAuth Client ID cho GSI Popup
NEXT_PUBLIC_GOOGLE_CLIENT_ID="8306156675-xxxxxxxxxxxx.apps.googleusercontent.com"

# Danh sách email Google được cấp quyền Superadmin
STARFRONT_ADMIN_GOOGLE_EMAILS="boyvipfreepy@gmail.com"

# (Tùy chọn) Google Sub Identifier để khóa cứng định danh sau lần đăng nhập đầu tiên
# STARFRONT_ADMIN_GOOGLE_SUB="10xxxxxxxxxxxxxxxxxxx"
```

---

### 6. MA TRẬN FILE THAY ĐỔI VÀ BẢO TOÀN KIẾN TRÚC

| Tệp tin | Thao tác | Mô tả chi tiết kỹ thuật |
| :--- | :---: | :--- |
| `package.json` | Cập nhật | Cài đặt `google-auth-library` (thư viện chính thức từ Google để verify token an toàn). |
| `lib/game/auth/admin-auth.ts` | Cập nhật | Bổ sung hàm `verifyGoogleIdTokenServerSide()`, logic đối chiếu email/sub, và cấp session superadmin bằng session cookie HMAC-SHA256. |
| `app/api/admin/auth/google/verify/route.ts` | Tạo mới | Endpoint POST tiếp nhận `credential`, xác minh chữ ký Google, đính kèm cookie `starfront_admin_session` (`HttpOnly; Secure; SameSite=Lax`), trả về `csrfToken`. |
| `components/game/v2/admin/character-content-manager.tsx` | Cập nhật | Tích hợp GSI SDK, hiển thị nút "Sign in with Google", bổ sung nút "↗ Mở trong Tab Riêng", và cơ chế Origin Guard hiển thị chẩn đoán nếu origin chưa cấu hình. |
| `.env.example` / `.env.local` | Cập nhật | Mẫu biến môi trường `NEXT_PUBLIC_GOOGLE_CLIENT_ID` và `STARFRONT_ADMIN_GOOGLE_EMAILS`. |
| `tests/admincp-auth-google-sso.test.ts` | Tạo mới | Bộ kiểm thử tự động 7 kịch bản: Token chuẩn, sai aud, sai issuer, token hết hạn, sai email, đối chiếu Google sub, và kiểm tra không ảnh hưởng password login. |

---

### 7. KẾ HOẠCH KIỂM THỬ THỰC TẾ (DUAL-CONTEXT VERIFICATION)

Khi bước vào giai đoạn IMPLEMENT, việc kiểm thử sẽ được thực hiện trên cả 2 ngữ cảnh:
1. **Ngữ cảnh 1 — Tab Riêng Độc Lập (Top-Level Window - Khuyến nghị):**
   - Mở `https://ais-dev-.../v2/admin` trong tab mới.
   - Bấm nút Google Sign-In -> Popup hiển thị -> Đăng nhập tài khoản `boyvipfreepy@gmail.com`.
   - Xác nhận vào thẳng màn hình AdminCP với huy hiệu `[GOOGLE ADMIN: boyvipfreepy@gmail.com (superadmin)]`.
   - F5 nhiều lần: Phiên cookie HttpOnly giữ vững 100%.
   - Thử lưu hồ sơ / sửa chương truyện: Mutating API thực thi thành công với CSRF token.
2. **Ngữ cảnh 2 — Iframe Preview AI Studio (Embedded Window):**
   - Kiểm tra xem trình duyệt có chấp nhận cookie trong iframe không.
   - Nếu cookie bị trình duyệt cô lập: Nút **"↗ Mở trong Tab Riêng"** xuất hiện nổi bật, click mở tab mới và duy trì phiên trơn tru.
3. **Ngữ cảnh 3 — Fallback Password Login:**
   - Đăng nhập bằng tài khoản mật khẩu `admin321`: Hoạt động bình thường 100%.

---

### 8. KẾT LUẬN & TRẠNG THÁI HIỆN TẠI

**KẾT LUẬN: `READY_FOR_IMPLEMENT`**

**Lý do:**
1. Toàn bộ hai rủi ro kỹ thuật trọng yếu đã được giải quyết bằng các phương án kiến trúc vững chắc:
   - Vấn đề Wildcard Origin: Được xử lý bằng cơ chế Multi-Origin Pre-Registration + Client Origin Guard + Password Fallback.
   - Vấn đề sessionStorage: Đã loại bỏ hoàn toàn, chuyển sang 100% HttpOnly Secure Session Cookie kết hợp trải nghiệm Tab Riêng Độc Lập (Top-Level Window).
2. Quy trình xác minh server-side được thắt chặt tối đa với Google Public JWKS và định danh bất biến Google `sub`.
3. Không tạo bất kỳ lỗ hổng bảo mật nào cho hệ thống.
4. Kế hoạch đã sẵn sàng, các bước hướng dẫn GCP Console đã rõ ràng.

**Điều kiện sẵn sàng để chạy thử End-to-End thực tế:**  
Chủ dự án chỉ cần hoàn tất Bước 3 (Tạo OAuth Client ID trên GCP Console) và cung cấp chuỗi `NEXT_PUBLIC_GOOGLE_CLIENT_ID` khi bắt đầu pha IMPLEMENT.
