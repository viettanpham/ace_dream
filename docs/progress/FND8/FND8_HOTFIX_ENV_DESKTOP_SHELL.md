# STARFRONT WORLD V2 — HOTFIX REPORT & HANDOFF
## HOTFIX: PUBLIC ASSET ENVIRONMENT VARIABLES & DESKTOP SHELL BOTTOM GAP
### CHECKPOINT: FND8-HOTFIX-ENV-DESKTOP-01 (Nối tiếp STORY01-PLAN-02)

- **Mã Hotfix:** `FND8-HOTFIX-ENV-DESKTOP-01`
- **Dự án:** `viettanpham/ace_dream`
- **Thời điểm:** 2026-10-23
- **Chế độ:** **IMPLEMENT — ONE BOUNDED PHASE ONLY**
- **Trạng thái:** **HOÀN THÀNH 100% — TYPECHECK PASS, BUILD PASS, UNIT TESTS 100% PASS**
- **Ngôn ngữ:** 100% Tiếng Việt

---

### 1. NGUYÊN NHÂN GỐC RỄ & GIẢI PHÁP ĐÃ THỰC HIỆN

#### 1.1. Vấn đề 1: Popup Modal yêu cầu nhập biến môi trường trên Google AI Studio
- **Tên chính xác 2 biến môi trường:**
  1. `NEXT_PUBLIC_ASSET_CDN_URL`
  2. `NEXT_PUBLIC_ASSET_STORAGE_MODE`
- **Nguyên nhân gốc rễ (Root Cause):**
  - Trong tệp `.env.example`, trước đây khai báo hai dòng rỗng dạng `KEY=` không có giá trị:
    ```
    NEXT_PUBLIC_ASSET_CDN_URL=
    NEXT_PUBLIC_ASSET_STORAGE_MODE=
    ```
  - Cơ chế onboarding của Google AI Studio quét tệp `.env.example`. Khi thấy các dòng gán giá trị rỗng, nền tảng nhận diện đây là các biến môi trường bắt buộc chưa được cấu hình và lập tức bật modal pop-up chặn màn hình yêu cầu người dùng nhập giá trị.
- **Giải pháp xử lý:**
  - Cập nhật `.env.example`: Chuyển hai biến trên thành dạng chú thích hướng dẫn tùy chọn (optional comments), giải thích rõ ràng rằng hệ thống đã nhúng sẵn fallback URL công khai (`v2.0-assets-r1`).
  - Nền tảng AI Studio khi quét `.env.example` sẽ thấy không còn biến rỗng bắt buộc nào, từ đó **loại bỏ hoàn toàn modal popup yêu cầu cấu hình** khi clone hoặc mở bằng tài khoản Google AI Studio mới.
  - Vị trí source mặc định:
    - `DEFAULT_JSDELIVR_CDN_BASE` tại `lib/game/assets/image-resolver.ts:20` trỏ tới:
      `https://cdn.jsdelivr.net/gh/viettanpham/starfront-assets@v2.0-assets-r1/starfront-world-assets`
    - `DEFAULT_PUBLIC_ASSET_CONFIG` tại `lib/game/assets/runtime-asset-config.ts:81`.
  - Thứ tự ưu tiên (Priority Order):
    1. **Runtime Active Release** (từ AdminCP hoặc tệp cấu hình runtime): Ưu tiên cao nhất khi quản trị viên chuyển đổi phiên bản (r1 -> r2) mà không cần rebuild.
    2. **Environment Variable Override** (nếu người dùng cố ý đặt `NEXT_PUBLIC_ASSET_CDN_URL` hoặc `NEXT_PUBLIC_ASSET_STORAGE_MODE`): ghi đè lên giá trị mặc định.
    3. **Source Default Fallback** (Baseline jsDelivr v2.0-assets-r1): Chạy 100% trơn tru khi không có biến môi trường nào.

#### 1.2. Vấn đề 2: Dải trống ngang (Bottom Gap) dưới Desktop Character Category
- **Nguyên nhân gốc rễ (Root Cause):**
  - Container ngoài cùng `sf-v2-shell` tại `v2-shell.tsx` dùng `min-h-screen`, trong khi header cố định 56px (`h-14`).
  - Wrapper `sf-v2-pilot-profile` tại `pilot-profile-v2.tsx` lại sử dụng thêm một lớp `min-h-screen` (tương đương `100vh`), làm chiều cao tổng của nội dung bị đội thêm 56px so với viewport khả dụng bên dưới header.
  - Tại `desktop-view.tsx`, container dùng giá trị cứng `h-[calc(100vh-56px)] min-h-[720px]`, trong khi các cột con (`aside` Roster, `section` Center Stage, `section` Dossier) không có thuộc tính `h-full`.
  - Khung ảnh đại diện Hero trong Center Stage lại bị giới hạn bởi `h-[76vh] max-h-[780px]`.
  - Kết quả: Khi viewport trình duyệt mở rộng (1440x900 hoặc 1920x1080), Global Left Navigation kéo thẳng xuống đáy viewport theo container cha, nhưng 3 khối Roster, Stage và Dossier lại dừng sớm phía trên, để lộ dải trống ngang màu đen `#070A12`.
- **Giải pháp xử lý:**
  - `v2-shell.tsx`:
    - Đặt `sf-v2-shell` thành `md:h-screen md:max-h-screen md:overflow-hidden` trên desktop.
    - Thêm `min-h-0` vào `div.flex-1.flex.overflow-hidden`.
    - Thêm `h-full` vào Global Left Menu `<aside>`.
    - Thêm `h-full min-h-0` vào `<main>`.
  - `pilot-profile-v2.tsx`:
    - Thay thế `min-h-screen` bằng `w-full h-full min-h-0 flex-1 flex flex-col`.
  - `desktop-view.tsx`:
    - Thay thế `h-[calc(100vh-56px)] min-h-[720px]` bằng `w-full h-full min-h-[640px] flex gap-3 p-3 lg:p-3.5`.
    - Thêm `h-full` vào Cột 1 (Roster `aside`), Cột 2 (Stage `section`) và Cột 3 (Dossier `section`).
    - Chuyển khung ảnh nhân vật tại Center Stage thành `relative w-full h-full flex items-end justify-center`, kết hợp `Image fill` và `object-contain object-bottom` giúp nhân vật tự động co giãn tối đa theo sân khấu mà không bị méo ảnh hay đè chân trang.
    - Thêm `min-h-0` vào khối nội dung cuộn của Dossier để scrollbar hoạt động mượt mà bên trong card.
  - Kết quả: Cả 3 cột Roster, Stage, Dossier tự động lấp đầy 100% không gian khả dụng, thẳng hàng với nhau cả ở đỉnh và đáy, loại bỏ hoàn toàn dải trống ngang vô ích.

#### 1.3. Vấn đề 3: Vòng tròn chữ "N" Next.js Development Indicator
- **Xác nhận:** Đây là tính năng Next.js Development Indicator (Static / Build Indicator) được Next.js 15/16 tự động hiển thị ở góc trái dưới màn hình trong môi trường development.
- **Giải pháp xử lý:**
  - Bổ sung cấu hình `devIndicators: false` vào `next.config.mjs`.
  - Tắt hoàn toàn chỉ báo chữ "N" mà không can thiệp hay ảnh hưởng đến nút thu gọn thật (PanelLeftOpen/PanelLeftClose) của Global Left Menu.

---

### 2. DANH SÁCH FILE THAY ĐỔI

1. `next.config.mjs`: Thêm `devIndicators: false`.
2. `.env.example`: Chuyển hai biến `NEXT_PUBLIC_ASSET_*` thành ghi chú tùy chọn có tài liệu giải thích.
3. `components/game/v2/shell/v2-shell.tsx`: Cập nhật `sf-v2-shell` thành `md:h-screen md:max-h-screen md:overflow-hidden`, thêm `h-full min-h-0` cho main và aside.
4. `components/game/v2/pilot-profile/pilot-profile-v2.tsx`: Sửa wrapper thành `w-full h-full min-h-0 flex-1 flex flex-col`.
5. `components/game/v2/pilot-profile/desktop-view.tsx`: Cập nhật layout `h-full min-h-[640px]`, `h-full` cho 3 cột và responsive hero stage.
6. `tests/env-and-desktop-shell-hotfix.test.ts`: Tạo bộ 6 unit tests kiểm chứng fallback env, dev indicator và cấu trúc layout.

---

### 3. KẾT QUẢ KIỂM THỬ (TEST RESULTS)

- **Unit Tests:**
  - `npx tsx tests/env-and-desktop-shell-hotfix.test.ts`: **6/6 PASS (100%)**
    1. Baseline Public Asset Fallback hoạt động hoàn hảo khi không có biến môi trường.
    2. Biến môi trường Override hoạt động đúng thứ tự ưu tiên khi được khai báo.
    3. Runtime Active Release chuyển đổi (AdminCP) có quyền ưu tiên cao hơn và không bị khóa bởi fallback.
    4. Tệp .env.example không chứa các biến rỗng kích hoạt popup modal trên AI Studio.
    5. Cấu hình Next.js (next.config.mjs) đã tắt Next.js Dev Indicator.
    6. Component DesktopView & V2Shell cấu hình chiều cao tràn màn hình không tạo dải trống đáy.
  - `npx tsx tests/image-resolver.test.ts`: **8/8 PASS (100%)**
  - `npx tsx tests/runtime-asset-config.test.ts`: **7/7 PASS (100%)**
  - `npx tsx tests/web01-3a-integrated.test.ts`: **6/6 SUITES PASS (100%)**
  - `npx tsx tests/fnd8-character-category.test.ts`: **8/8 PASS (100%)**
- **Typecheck & Lint:**
  - `npm run lint` (`tsc --noEmit`): **0 errors, hoàn toàn sạch sẽ**.
- **Compilation:**
  - `compile_applet`: **Build succeeded**.

---

### 4. BẢO TOÀN PHẠM VI (SCOPE GUARD)
- Không chạm vào V1.
- Không sửa Story data hoặc trạng thái các chương (STORY01-PLAN-02 giữ nguyên).
- Không chạm vào AdminCP Story, Artwork Registry hay Gameplay traits/stats.
- Mobile layout được bảo toàn nguyên vẹn với cuộn trang tự nhiên.

**DỪNG SAU HOTFIX. KHÔNG CHUYỂN SANG STORY-01.A.**
