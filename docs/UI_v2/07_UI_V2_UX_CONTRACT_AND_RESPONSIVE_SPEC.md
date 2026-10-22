# STARFRONT WORLD V2 — UX CONTRACT & RESPONSIVE SPECIFICATION
Tài liệu Canonical: `docs/UI_v2/07_UI_V2_UX_CONTRACT_AND_RESPONSIVE_SPEC.md`  
Ngày cập nhật: 2026-10-22  
Chế độ: `PLAN / DEFINE ONLY — RESPONSIVE STATUS RECONCILIATION & UX LOCK`

---

## 1. Đối Chiếu Thực Tế & Trạng Thái 5 Responsive Defect (Reconciliation Audit)

Đối chiếu trực tiếp mã nguồn thực tế tại `components/game/v2/ui/` và `app/ui-v2-preview/page.tsx` với 5 lỗi đã ghi nhận:

| Mã Defect | Mô Tả Defect | Trạng Thái Thực Tế | Bằng Chứng Từ Mã Nguồn & Kiểm Thử |
|---|---|---|---|
| **DEFECT-01** | **Grid bị ép nhiều cột trên mobile giả lập** | **`FIXED`** | **Mã nguồn**: `app/ui-v2-preview/page.tsx` (dòng 59–76, 222, 315, 369).<br>- `isSimulatedMobile = viewportMode === 'mobile'`<br>- `gridTwoCols = isSimulatedMobile ? 'grid grid-cols-1 gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6'`<br>- `gridThreeCols = isSimulatedMobile \|\| isSimulatedTablet ? 'grid grid-cols-1 gap-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'`<br>**Kiểm thử**: Khi bấm `Mobile (390px)` trên desktop, container 390px ép 100% về 1 cột duy nhất, không bị chia đôi hay chia ba, độ rộng thẻ đạt 100% diện tích khả dụng. |
| **DEFECT-02** | **Nút bấm vượt ra ngoài viền Card (Button Overflow)** | **`FIXED`** | **Mã nguồn**: `components/game/v2/ui/button.tsx` (dòng 14, 43, 63, 73–82).<br>- Thuộc tính `max-w-full` và `fullWidth?: boolean`.<br>- Bọc nhãn trong `<span className="truncate min-w-0" title={titleText}>{children}</span>`.<br>- Duy trì touch target `min-h-[44px]`.<br>- Trong `page.tsx`: Khối nút có `flex flex-wrap gap-2.5`, nút dài trong footer dùng `fullWidth`.<br>**Kiểm thử**: Nút bấm luôn nằm trọn trong viền Card trên mọi kích thước màn hình ($320\text{px}$–$1440\text{px}$), nhãn dài có native tooltip hỗ trợ đọc. |
| **DEFECT-03** | **Thanh Tabs tràn ngang làm bung trang** | **`FIXED`** | **Mã nguồn**: `components/game/v2/ui/tabs.tsx` (dòng 116–124, 83–108, 144–150).<br>- `TabsList` có `max-w-full overflow-x-auto overflow-y-hidden scrollbar-none flex-nowrap scroll-smooth`.<br>- `TabsTrigger` giữ `shrink-0` và `min-h-[44px]`.<br>- Tự động cuộn tab đang chọn vào vùng nhìn (`scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })`) khi chuyển bằng click/touch hoặc phím mũi tên Left/Right.<br>**Kiểm thử**: Tabs trên màn hình 320px–390px cho phép vuốt ngang mượt mà, không xuất hiện thanh cuộn ngang toàn trang. |
| **DEFECT-04** | **Header Preview quá tải & lặp nút quay về** | **`FIXED`** | **Mã nguồn**: `app/ui-v2-preview/page.tsx` (dòng 83–161, 166–187).<br>- Header rút gọn còn 1 hàng duy nhất ($\le 56\text{px}$ trên mobile).<br>- Giữ 1 nút `QUAY LẠI V1` nổi bật duy nhất trên Top Bar (`min-h-[44px]`).<br>- Trên mobile: Ẩn cụm nút giả lập kích thước (`hidden sm:flex`) và thanh switcher cồng kềnh, thay bằng badge `V2 PREVIEW`.<br>- Loại bỏ hoàn toàn nút quay lại trùng lặp ở banner bên dưới.<br>**Kiểm thử**: Header không bị vỡ 3–4 hàng trên mobile; quay về V1 bằng 1 chạm dễ dàng. |
| **DEFECT-05** | **Tooltip trên thiết bị cảm ứng** | **`FIXED`** | **Mã nguồn**: `components/game/v2/ui/tooltip.tsx` (dòng 46–56, 58–86, 88–94, 114–131).<br>- Lắng nghe `onTouchStart` kích hoạt cờ `isTouchRef.current = true` và `setIsTouchDevice(true)`.<br>- Chạm vào trigger mở/đóng tooltip (tap-to-toggle) mà không bị xung đột với sự kiện chuột.<br>- Lắng nghe chạm ngoài (`pointerdown`) và phím `Escape` để đóng.<br>- Chế độ touch hiển thị nút đóng $X$ nhanh.<br>- Tự động căn chỉnh vị trí an toàn (`bottom-full left-1/2 -translate-x-1/2 mb-2` trên màn hình nhỏ) thay vì bị đẩy lệch sang phải với `side="right"`.<br>**Kiểm thử**: Chạm mở/đóng trơn tru trên màn hình cảm ứng; không tràn mép màn hình. |

---

## 2. Hợp Đồng UX Toàn Diện Cho Shared UI Shell V2

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TẦNG 1: GLOBAL TOP BAR (Logo, Chỉ số vũ trụ, Quick Stats, Settings, Mobile Hamburger)          │
├───────────────────┬───────────────────────────┬────────────────────────────────────────────────┤
│ TẦNG 2:           │ TẦNG 3:                   │ TẦNG 4:                                        │
│ GLOBAL LEFT MENU  │ SYSTEM SELECTOR PANE      │ MAIN CONTENT STAGE                             │
│ (Desktop: Full    │ (Ví dụ: Pilot Roster)     │ (Độc lập, co giãn chiếm toàn bộ không gian     │
│  240px / Mini     │ (Desktop: Full            │  còn lại; ưu tiên tối thượng cho trải nghiệm   │
│  64px)            │  260px / Mini 72px)       │  đọc, artwork và thao tác chính)               │
│ [Toggle riêng]    │ [Toggle riêng]            │                                                │
└───────────────────┴───────────────────────────┴────────────────────────────────────────────────┘
```

### A. Quy Tắc Desktop ($\ge 1280\text{px}$)
1. **Global Left Menu**:
   - Trạng thái **Full (~240px)**: Icon + Nhãn hệ thống + Badge đếm + Nút thu gọn ở chân menu.
   - Trạng thái **Mini (~64px)**: Cột hẹp căn giữa icon; hover/focus hiển thị Tooltip nhãn hệ thống.
   - Toggle độc lập bằng nút bấm riêng (`PanelLeftClose` / `PanelLeftOpen`).
2. **System-Specific Selector Pane (Ví dụ: Pilot Roster)**:
   - Trạng thái **Full (~260px)**: Hiển thị danh sách thẻ phi công gồm avatar, callsign, class/gear badge, cấp độ và trạng thái sẵn sàng.
   - Trạng thái **Mini (~72px)**: Cột avatar hẹp, hiển thị rõ viền active (`border-[#06B6D4]`).
   - Toggle độc lập với Global Left Menu bằng nút bấm riêng trên header của selector pane.
3. **Cơ Chế Tự Động Hoàn Trả Diện Tích (Auto Flex Expansion)**:
   - Khi một trong hai sidebar (hoặc cả hai) chuyển sang Mini, toàn bộ phần chiều rộng dôi ra (~176px từ Global Menu, ~188px từ Pilot Roster) phải được **hoàn trả ngay lập tức cho Main Content Stage**.
   - Main Content luôn là container `flex-1 min-w-0` để bung rộng tối đa.
4. **Ưu Tiên Mặc Định Theo Screen**:
   - Đối với phân hệ **Pilot Category / Profile V2 (Valentine)**: Mặc định trên Desktop là **Global Menu Mini (64px)** và **Pilot Roster Mini (72px)** nhằm tối ưu hóa diện tích trình chiếu Artwork và Bio theo đúng concept đã duyệt.

---

### B. Quy Tắc Mobile ($< 768\text{px}$)
1. **Không Ép Sidebar Desktop Xuống Mobile**:
   - Tuyệt đối không giữ hai sidebar cố định trên màn hình điện thoại (gây nghẽn diện tích).
2. **Global Menu Chuyển Sang Hamburger Drawer**:
   - Nút Hamburger ($\ge 44\text{px}$) đặt ở góc trái Global Top Bar.
   - Nhấn mở **Slide Drawer** từ bên trái với backdrop mờ và nút đóng $X$ ($44\times 44\text{px}$). Đóng tự động khi chọn mục hoặc bấm Escape.
3. **Pilot Roster Chuyển Sang Dải Avatar Rail + Bottom Sheet**:
   - Thay thế sidebar cồng kềnh bằng **Dải thẻ Avatar cuộn ngang (Horizontal Avatar Rail)** ở đầu trang, hỗ trợ vuốt chạm mượt mà.
   - Nút "Danh Sách Đầy Đủ" mở danh sách phi công chi tiết qua **Bottom Sheet / Drawer** từ cạnh dưới màn hình.
4. **Hai Chế Độ Trình Bày Cốt Lõi Trên Mobile (Artwork View & Info View)**:
   - Bám sát concept đã duyệt (`FND8_823_CHARACTER_CATEGORY_PROFILE_MOBILE_APPROVED.png` và `MOBILE_INFO_VIEW_REFERENCE.png`).
   - **Artwork View**: Trình bày tranh nhân vật tập trung, bố cục gần full-screen, tối giản các panel đè lên tranh để tôn vinh artwork.
   - **Info View**: Trình bày thông số, tiểu sử (Story), tương thích GEAR và kỹ năng dưới dạng các tab cảm ứng dễ đọc.
   - Người dùng chuyển đổi giữa hai chế độ xem thông qua thanh điều hướng / toggle tiện lợi.
5. **Tabs Cảm Ứng Không Phụ Thuộc Hover**:
   - Toàn bộ tab và trigger sử dụng touch target $\ge 44\text{px}$, vuốt ngang mượt mà không làm bung màn hình.

---

### C. Quản Lý Trạng Thái Giao Diện (Smart UI State Matrix)

| Loại Trạng Thái | Thành Phần Quản Lý | Phạm Vi Lưu Trữ | Hành Vi Sau F5 / Chuyển Trang |
|---|---|---|---|
| **Persistent UI State** | `globalMenuState` (`full` \| `mini`) | `localStorage ('sf_v2_ui_prefs')` | **Ghi nhớ**: Giữ nguyên trạng thái Full hoặc Mini người dùng đã chọn qua lần tải lại trang. |
| **Persistent UI State** | `pilotRosterState` (`full` \| `mini`) | `localStorage ('sf_v2_ui_prefs')` | **Ghi nhớ**: Độc lập với menu toàn cục; không bao giờ làm mất nhân vật đang chọn khi toggle Full/Mini. |
| **Persistent UI State** | `activeTabByPage` (ví dụ `pilot_tab: 'story'`) | `localStorage ('sf_v2_ui_prefs')` | **Ghi nhớ**: Giữ đúng tab đang đọc khi chuyển trang hoặc sau khi tải lại. |
| **Ephemeral State** | `modalState` (Dialog mở/đóng) | Bộ nhớ tạm (React State) | **Không lưu**: Luôn đóng sau khi F5. |
| **Ephemeral State** | `drawerState` (Bottom/Side Sheet) | Bộ nhớ tạm (React State) | **Không lưu**: Luôn đóng sau khi F5. |
| **Ephemeral State** | `tooltipState` (Chú thích nổi) | Bộ nhớ tạm (React State) | **Không lưu**: Luôn đóng sau khi F5. |
| **Ephemeral State** | `artViewerState` (Fullscreen Lightbox) | Bộ nhớ tạm (React State) | **Không lưu**: Luôn đóng sau khi F5. |
| **Ephemeral State** | Tọa độ cuộn, mức Zoom/Pan chi tiết | Bộ nhớ tạm (React State) | **Không lưu**: Không lưu vào localStorage để tránh giật lag hiệu năng. |
| **NGHIÊM CẤM** | Bất kỳ trạng thái UI nào | `StarfrontProgression` (Save Game) | **TUYỆT ĐỐI KHÔNG GHI VÀO GAMEPLAY SAVE**. UI preference là dữ liệu presentation của client, độc lập 100% với gameplay data. |

---

## 3. Tổng Hợp Các Nội Dung UX Đã Chốt vs Còn Mở

### A. Nội Dung Đã Chốt Chặt Chẽ (Locked Decisions)
1. **Palette & Tokens V2**: Modern Aerospace Sci-Fi (`#070A12`, `#0F172A`, `#142338`, `#26384D`, `#06B6D4`, `#14B8A6`). Không CRT scanlines, không retro green V1.
2. **Cấu trúc 4 tầng logic**: Top Bar + Left Menu (Full/Mini) + System Selector (Full/Mini độc lập) + Main Content Stage.
3. **Ergonomics & Typography**: Body $16\text{px}$, Story $17$–$18\text{px}$ (line-height $1.65$), nhãn phụ $\ge 14\text{px}$, tuyệt đối cấm $< 12\text{px}$. Touch target $\ge 44 \times 44\text{px}$.
4. **Mobile UX Flow**: Không sidebar cố định; Left Menu dùng Hamburger Drawer; Selector dùng Horizontal Rail + Bottom Sheet; Main content chia rõ Artwork View vs Info View theo concept đã duyệt.
5. **Zero Hover-Dependency**: Mọi thông tin quan trọng đều mở được bằng cảm ứng hoặc nút bấm rõ ràng.
6. **Smart UI State Persistence**: Tách riêng trạng thái hiển thị vào `sf_v2_ui_prefs`, không đụng chạm đến save gameplay.

### B. Nội Dung Còn Mở Cho Các Phase Tiếp Theo (Open Items)
1. **Trải nghiệm tương tác của Fullscreen Art Viewer**: Mức độ giới hạn zoom (ví dụ $1\times$ đến $3\times$), độ nhạy thao tác pan kéo chuột/ngón tay, và hiệu ứng transition khi bung ra toàn màn hình sẽ được hiện thực hóa trong **Phase 2**.
2. **Danh mục các System sẽ đăng ký vào V2 Shell**: Thứ tự chuyển đổi các phân hệ ngoài Pilot Category (như Shop, Fleet, Base) sẽ được quyết định ở **Phase 3**.
3. **Cấu trúc dữ liệu chi tiết của UI Preference Adapter**: Định nghĩa TypeScript interface chuẩn cho `UIPreferenceStore` sẽ được triển khai cùng với V2 Shell trong **Phase 3**.

---

## 4. Danh Sách Tài Liệu Đã Cập Nhật

1. **`docs/UI_v2/07_UI_V2_UX_CONTRACT_AND_RESPONSIVE_SPEC.md`**: Cập nhật toàn diện bảng kiểm toán 5 defect (FIXED với bằng chứng cụ thể), hợp đồng UX Desktop & Mobile, ma trận Smart UI State, và danh sách chốt/mở.
2. **`docs/UI_v2/06_UI_V2_PROGRESS_CHECKPOINT_HANDOFF.md`**: Đồng bộ trạng thái kiểm toán, ghi nhận kết quả xác minh 5 defect đã đóng hoàn toàn, và khóa mục tiêu cho task tiếp theo.

---

## 5. Đề Xuất Task IMPLEMENT Tiếp Theo Duy Nhất

Căn cứ theo lộ trình chính thức tại `docs/UI_v2/05_UI_V2_IMPLEMENTATION_ROADMAP.md`:
- Phase 0: Scope & Canonical Docs (`APPROVED`)
- Phase 1: Core UI Primitives & Responsive Preview (`COMPLETE & VERIFIED`)
- **Bước kế tiếp trên lộ trình**: **Phase 2 — Shared Art Viewer**

### Tên Task Đề Xuất:
`STARFRONT WORLD V2 — IMPLEMENT PHASE 2: SHARED ART VIEWER`

### Phạm Vi Bounded & Tiêu Chí Nghiệm Thu:
1. **Vị trí component**: `components/game/v2/ui/art-viewer.tsx` (hoặc modal viewer độc lập tương đương).
2. **Chức năng bắt buộc**:
   - Xem artwork ở chế độ Fullscreen với backdrop tối sâu `#070A12`.
   - Nút Zoom In, Zoom Out, Reset tỷ lệ gốc ($1\times$), và thanh hiển thị mức zoom hiện tại.
   - Thao tác kéo rê (Pan/Drag) mượt mà khi ảnh ở trạng thái phóng to.
   - Hỗ trợ thao tác cảm ứng chạm/pinch trên thiết bị di động.
   - Nút Đóng ($X$) luôn luôn hiển thị ở góc trên (vùng chạm $\ge 44\times 44\text{px}$).
   - Hỗ trợ phím tắt `Escape` trên Desktop để đóng tức thì.
   - Xử lý tải ảnh an toàn: chỉ tải đường dẫn WebP/PNG đã xác minh, có container fallback chống broken image, không gây lỗi 404.
3. **Trang thử nghiệm cô lập**:
   - Bổ sung một mục xem thử Art Viewer vào `/ui-v2-preview` để kiểm tra trực quan.
4. **Ranh giới an toàn**:
   - Chưa làm Pilot Category/Profile page (thuộc Phase 4).
   - Không can thiệp vào giao diện V1 hoặc gameplay.
