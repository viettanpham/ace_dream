# STARFRONT WORLD — FND-UI-V2.0
# ĐẶC TẢ TÍNH NĂNG NỀN TẢNG GIAO DIỆN V2 (FOUNDATION FEATURE SPECIFICATION)

**Ngày ban hành:** 2026-10-22  
**Phiên bản:** 2.0.0-PROVISIONAL  
**Trạng thái:** DEFINE / PLAN ONLY  
**Mục tiêu:** Định nghĩa toàn diện tính năng, phạm vi và ranh giới cho Hệ Thống Giao Diện Người Dùng Thế Hệ Mới (STARFRONT UI V2 Foundation & Versioned Shell).

---

## 1. Bối Cảnh & Quyết Định Chính Thức (Official Decisions)

1. **Dừng Mọi Hiệu Chỉnh Trên Thử Nghiệm E.0 Cũ:**
   - Phiên bản triển khai Pilot Category E.0 trước đó được phân loại chính thức là `IMPLEMENTED_BUT_NOT_ACCEPTED / LEGACY_V2_EXPERIMENT`.
   - Giữ nguyên toàn bộ mã nguồn và tệp dữ liệu đã xác minh (`lib/game/v2/character-profile-data.ts`, các component tab thử nghiệm). Không xóa mã để bảo lưu lịch sử nghiên cứu.
2. **Kiến Trúc Hai App Shell Độc Lập (Dual Versioned Shells):**
   - Cùng nằm trong một dự án Next.js App Router duy nhất.
   - Tách biệt hoàn toàn hai lớp vỏ ứng dụng:
     - **V1 Shell (`StarfrontShell`):** Giữ nguyên vẹn 100% trải nghiệm ACE Online 2D retro sci-fi truyền thống.
     - **V2 Shell (`StarfrontShellV2`):** Giao diện Modern Aerospace Sci-Fi tối tân, sắc nét, sang trọng, tương phản cao, tối ưu tuyệt đối cho cả Desktop (1440px) và Mobile (375px–430px).
3. **Cơ Chế Chuyển Đổi Phiên Bản Giao Diện (Interface Version Switcher):**
   - Tích hợp tùy chọn `Interface Version` trong Bảng Cài Đặt (Settings Modal) của cả hai shell:
     - Tùy chọn: `V1 (Legacy Sci-Fi)` | `V2 (Modern Aerospace - Khuyến Nghị)`.
     - Mục tiêu mặc định trong tương lai: V2 là phiên bản chuẩn.
   - **Yêu cầu bất biến:** Chuyển đổi giao diện diễn ra tức thì, **tuyệt đối không làm mới trang (zero reload), không reset game state, không làm mất điểm tiến trình (credits, alloy, trang bị, cặp đôi nhân vật/gear)**.
4. **Cô Lập Tuyệt Đối Mã Nguồn & Phong Cách Trình Bày (Anti-Leakage):**
   - V2 không kế thừa CSS, theme scanline CRT xanh lá, font hay cấu trúc layout cũ của V1.
   - V1 chỉ hiển thị các màn hình thuộc V1. V2 chỉ hiển thị các màn hình đã được xây dựng hoàn thiện theo chuẩn V2.
5. **Tách Biệt UI Foundation Khỏi Nghiệp Vụ Pilot Category:**
   - Xây dựng hoàn chỉnh hạ tầng UI V2 Foundation (Tokens, Shared Components, Shell, Art Viewer) trước khi dựng lại giao diện Pilot Category.
   - Các nhóm nghiên cứu FND-8 / 8.2.3.x có thể tiếp tục hoàn thiện dữ liệu nhân vật song song mà không xung đột mã nguồn.

---

## 2. Các Trụ Cột Tính Năng Của UI V2 Foundation

### 2.1. Versioned App Shell V2 (Vỏ Ứng Dụng Đa Màn Hình)
- **Desktop (1440px Baseline):**
  - **Top Navigation Bar:** Nhận diện thương hiệu STARFRONT V2, chỉ số tài nguyên thời gian thực (Credits, Alloy, Cấp độ), lối vào Cài Đặt và World Admin CP.
  - **Sidebar Điều Hướng V2:** Phân nhóm trực quan, hỗ trợ chế độ thu gọn (collapsed/icon-only) và mở rộng (expanded).
  - **Main Viewport Canvas:** Vùng hiển thị nội dung cuộn mượt độc lập, hỗ trợ bố cục tràn viền (full-bleed) hoặc container có giới hạn (`max-w-7xl`).
  - **Breadcrumbs Hệ Thống:** Điều hướng cây thư mục rõ ràng, không lẫn lộn với wizard tạo nhân vật.
- **Mobile (375px–430px Smartphone Dedicated):**
  - **Mobile Topbar:** Nút điều hướng nhanh, nhận diện phân hệ hiện tại, lối vào cài đặt.
  - **Mobile Drawer / Bottom Navigation:** Thanh điều hướng cạnh đáy hoặc ngăn kéo trượt mượt mà, chiều cao chạm tối thiểu 44px.

### 2.2. Navigation Registry V2 (Đăng Ký Điều Hướng Độc Lập)
- Chỉ đăng ký các module **thực sự đã được xây dựng theo chuẩn V2**:
  - `home`: Bảng Tổng Quan Chỉ Huy V2 (V2 Operations & Fleet Command Overview).
  - `pilots`: Hồ Sơ Phi Công & Danh Mục Nhân Vật V2 (Pilot Category / Profile — sau khi Foundation hoàn tất).
  - `settings`: Cài Đặt Hệ Thống V2 (Âm thanh, Tỷ lệ hiển thị, Interface Version V1/V2).
- Các module V1 chưa chuyển đổi sẽ không hiển thị trên menu V2 nhằm đảm bảo tính toàn vẹn mỹ cảm. Nếu người chơi muốn dùng các phân hệ V1 (Đấu trường cũ, Hangar cũ), họ có thể chuyển về V1 Shell trong Cài đặt một cách an toàn.

### 2.3. Thư Viện Thành Phần Dùng Chung V2 (Shared UI Components)
Tất cả các thành phần được xây dựng độc lập trong thư mục `components/game/v2/ui/`:
1. **Button:** Biến thể Primary (Cyan Glow), Secondary (Slate Muted), Ghost, Outline, Destructive. Chiều cao tối thiểu 44px trên mobile, 40px trên desktop.
2. **Tabs:** Biến thể Segmented Pill (cho các chế độ xem luân chuyển) và Underline Sci-Fi (cho phân mục nội dung dài).
3. **Card & Surface:** Bề mặt kính `backdrop-blur-md`, nền `bg-slate-900/80`, viền `border-slate-800`, tuân thủ công thức bo góc toán học $r_{\text{inner}} = r_{\text{outer}} - \text{padding}$.
4. **Tooltip:** Hiển thị thông số và giải thích thuật ngữ, tuân thủ tương phản WCAG AA, không che khuất vùng chạm.
5. **Dialog & Modal:** Hộp thoại thông báo và xác nhận, tích hợp focus-trap, phím `Esc`, lớp nền mờ kính `bg-black/80`.
6. **Drawer & Sheet:** Ngăn kéo di động trượt từ đáy hoặc cạnh bên, hỗ trợ cử chỉ vuốt đóng.
7. **EmptyState & Feedback:** Bảng thông báo trạng thái rỗng, chờ đồng bộ hoặc lỗi kết nối mang đậm phong cách hàng không vũ trụ.

### 2.4. Trình Soi Tranh Dùng Chung V2 (Shared Art Viewer)
Module độc lập tại `components/game/v2/art-viewer/` dùng chung cho toàn bộ nhân vật, cơ giáp, chiến hạm và sự kiện:
- **True Fullscreen:** Chế độ toàn màn hình thực sự (tương thích HTML5 Fullscreen API).
- **Nút Đóng Luôn Thấy (Fixed Exit Control):** Nút `X` / `Đóng` luôn ghim cố định ở góc trên bên phải, có lớp nền bảo vệ, tuyệt đối không bị che khuất hoặc cuộn mất khỏi màn hình.
- **Khả Năng Phóng To & Kéo Rê (Zoom & Pan):** Phóng to mượt từ 1x đến 4x, kéo rê chuột/chạm mượt mà khi ảnh vượt quá khung hình.
- **Nút Đặt Lại Tỷ Lệ (Reset Zoom):** Nút 1x đưa ảnh về vị trí trung tâm tức thì.
- **Cử Chỉ Chạm & Phím Tắt:** Hỗ trợ chụm phóng to (pinch-to-zoom), chạm đúp (double-tap), phím `Esc` đóng, phím `+`/`-` và phím mũi tên chuyển tranh.
- **Chính Sách Ảnh Lớn & WebP:** Tối ưu hóa tải ảnh độ phân giải cao, chỉ tải ảnh WebP đã xác minh, chống vỡ layout.

### 2.5. Hợp Đồng Màn Hình V2 (V2 Page Contract)
Mọi trang hoặc phân hệ nằm trong V2 Shell phải tuân thủ hợp đồng giao diện:
- Nhận dữ liệu tiến trình dùng chung: `progression: StarfrontProgression`.
- Nhận hàm cập nhật dữ liệu: `onUpdateProgression: (updater) => void`.
- Nhận hàm điều hướng: `onNavigate: (routeId) => void`.
- Tuân thủ 100% token Design System V2 (không sử dụng class CRT, không chắp vá inline styles).
- Đạt chuẩn dễ đọc: Body text $16\text{px}$, Story text $17$–$18\text{px}$, text phụ $\ge 14\text{px}$, touch target $\ge 44\times 44\text{px}$.
