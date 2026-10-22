# STARFRONT WORLD — FND-UI-V2.0
# KẾ HOẠCH TRIỂN KHAI NỀN TẢNG GIAO DIỆN V2 (IMPLEMENTATION PLAN)

**Ngày ban hành:** 2026-10-22  
**Phiên bản:** 2.0.0-PROVISIONAL  
**Trạng thái:** DEFINE / PLAN ONLY  
**Mục tiêu:** Thiết lập lộ trình chia nhỏ các giai đoạn kỹ thuật (Phases), danh mục tệp tác động chính xác (File-Change Plan) và tiêu chí nghiệm thu cho STARFRONT UI V2 Foundation & Versioned Shell.

---

## 1. Phân Chia Các Giai Đoạn Triển Khai (Phased Breakdown)

Lộ trình được chia làm 4 giai đoạn độc lập có ranh giới kiểm soát nghiêm ngặt. Tuyệt đối không nhảy cóc hoặc thực hiện đồng thời các giai đoạn làm xáo trộn kiến trúc:

```
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 0: Audit & Architecture Definition (DEFINE / PLAN ONLY)         │
│  - Hoàn tất tài liệu kiến trúc, Design System và kế hoạch tệp          │
│  - Khóa mã nguồn, không sửa code trong giai đoạn này                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: Core Primitives & Shared UI Components (`components/v2/ui`)  │
│  - Triển khai Button, Tabs, Card, Tooltip, Dialog, Drawer, Feedback    │
│  - Kiểm thử trực quan và khả năng trợ năng độc lập                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: Shared Art Viewer (`components/v2/art-viewer`)               │
│  - Triển khai Trình soi tranh Fullscreen 4K dùng chung                 │
│  - Zoom 1x-4x, Pan drag, Touch gestures, Nút đóng luôn thấy            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: Dual Shell Architecture & Settings Switcher                  │
│  - AppShellDispatcher tại `app/page.tsx`                                │
│  - V2 Master Shell (`StarfrontShellV2`) & V2 Navigation Registry       │
│  - Settings Modal tích hợp Interface Version V1/V2 (Zero State Loss)   │
│  - Gỡ bỏ tab thử nghiệm V2 khỏi V1 Shell để bảo toàn 100% V1           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: Pilot Category V2 Clean Rebuild (`components/v2/pilots`)     │
│  - Xây dựng lại UI Danh Mục / Hồ Sơ Phi Công trên nền Foundation V2    │
│  - Tích hợp 12 Class Stats 20 điểm, Hồ sơ Valentine, 10 Chương Story  │
│  - Khớp 100% Concept Desktop và Mobile đã được duyệt                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Kế Hoạch Thay Đổi Tệp Chi Tiết (File-Change Plan)

### Phase 1: V2 Core UI Primitives (Thành Phần Dùng Chung)
- **Tệp tạo mới:**
  - `components/game/v2/ui/button.tsx`: Nút bấm đa năng hỗ trợ touch target $\ge 44\text{px}$.
  - `components/game/v2/ui/tabs.tsx`: Segmented Pill & Underline Tabs.
  - `components/game/v2/ui/card.tsx`: Khung thẻ bề mặt mờ kính `backdrop-blur-md`.
  - `components/game/v2/ui/tooltip.tsx`: Chú giải nổi giải thích thuộc tính.
  - `components/game/v2/ui/dialog.tsx`: Hộp thoại modal đạt chuẩn focus-trap và phím `Esc`.
  - `components/game/v2/ui/drawer.tsx`: Ngăn kéo di động vuốt chạm.
  - `components/game/v2/ui/feedback.tsx`: Khung phản hồi rỗng, nạp dữ liệu và lỗi.
- **Tệp sửa đổi:** Không sửa bất kỳ tệp hiện hữu nào.

### Phase 2: Shared Art Viewer (Trình Soi Tranh Dùng Chung)
- **Tệp tạo mới:**
  - `components/game/v2/art-viewer/shared-art-viewer.tsx`: Bộ điều khiển soi tranh toàn màn hình.
  - `components/game/v2/art-viewer/art-viewer-controls.tsx`: Cụm nút phóng to, kéo rê, thu nhỏ, đóng cố định.
- **Tệp sửa đổi:** Không sửa bất kỳ tệp hiện hữu nào.

### Phase 3: Dual Versioned Shells & Interface Version Switcher
- **Tệp tạo mới:**
  - `components/game/v2/shell/starfront-shell-v2.tsx`: Master Shell cho V2.
  - `components/game/v2/shell/v2-topbar.tsx`: Thanh điều hướng đỉnh V2.
  - `components/game/v2/shell/v2-sidebar.tsx`: Thanh điều hướng cạnh bên V2.
  - `components/game/v2/shell/v2-mobile-nav.tsx`: Điều hướng di động V2.
  - `components/game/v2/shell/v2-nav-registry.ts`: Đăng ký danh mục màn hình V2.
  - `components/game/v2/settings/v2-settings-modal.tsx`: Bảng cài đặt V2 có công tắc chuyển Interface Version.
- **Tệp sửa đổi:**
  - `lib/game/ui-settings.ts`: Thêm các hàm quản lý `getSavedInterfaceVersion()`, `saveInterfaceVersion()`.
  - `app/page.tsx`: Triển khai `AppShellDispatcher` để điều phối V1/V2 mượt mà không reload.
  - `components/game/starfront-shell.tsx` (V1 Shell): Gỡ bỏ tab thử nghiệm `"character-profile-v2"` khỏi `V1_NAV_ITEMS` để khôi phục V1 nguyên bản thuần khiết; cập nhật modal cài đặt V1 để bổ sung tùy chọn chuyển sang V2.

### Phase 4: Pilot Category V2 Clean Rebuild (Xây Lại Phân Hệ Phi Công)
- **Tệp tạo mới:**
  - `components/game/v2/pilots/pilot-category-v2.tsx`: Master container phân hệ phi công V2.
  - `components/game/v2/pilots/desktop-pilot-view.tsx`: Giao diện Desktop 3 cột xây dựng lại từ đầu.
  - `components/game/v2/pilots/mobile-pilot-view.tsx`: Giao diện Mobile Paired States (Art/Info) chuẩn concept.
- **Tệp tái sử dụng:**
  - `lib/game/v2/character-profile-data.ts`: Dữ liệu canonical đã xác minh (12 Class, Valentine lore, 10 chương Story, WebP verified paths).

---

## 3. Ranh Giới Hoạt Động Song Song (Parallel Workstreams)

Nhằm đảm bảo các luồng phát triển không xung đột:

1. **Luồng UI Foundation (Core Engineering):**
   - Tập trung duy nhất vào thư mục `components/game/v2/ui/`, `components/game/v2/art-viewer/`, `components/game/v2/shell/` và `app/page.tsx`.
   - Tuyệt đối không can thiệp vào logic cân bằng nhân vật hoặc gameplay data.
2. **Luồng Dữ Liệu FND-8 / 8.2.3.x (Lore & Feature Team):**
   - Tiếp tục bổ sung dữ liệu văn xuôi cho các chương Story tiếp theo (Chương 02–10) và danh mục Trait trong `docs/foundations/FND8/` và `lib/game/v2/character-profile-data.ts`.
   - Tuyệt đối không sửa đổi các tệp Shell, Layout, Dispatcher hay Navigation Registry.

---

## 4. Tiêu Chí Nghiệm Thu Từng Giai Đoạn (Acceptance Checklist)

### Tiêu Chí Nghiệm Thu Phase 1 (UI Primitives):
- [ ] Tất cả thành phần Button, Tabs, Card, Dialog, Drawer hiển thị chuẩn token V2.
- [ ] 100% nút bấm di động đạt vùng chạm $\ge 44 \times 44\text{px}$.
- [ ] Tuân thủ luật Zero-Pill: Không có metadata tĩnh bị đóng hộp pill.
- [ ] `compile_applet` thành công với 0 lỗi TypeScript.

### Tiêu Chí Nghiệm Thu Phase 2 (Shared Art Viewer):
- [ ] Mở ảnh toàn màn hình mượt mà, nút Đóng `X` luôn cố định ở góc trên bên phải.
- [ ] Zoom từ 1x đến 4x không giật, hỗ trợ kéo rê ảnh (pan) khi phóng to.
- [ ] Phím `Esc` đóng tức thì; cử chỉ vuốt chạm trên mobile hoạt động tự nhiên.
- [ ] Chỉ nạp ảnh WebP đã xác minh, chống vỡ layout.

### Tiêu Chí Nghiệm Thu Phase 3 (Dual Shells & Dispatcher):
- [ ] Mặc định khởi tạo mở ra V2 Shell hiện đại.
- [ ] Trong Cài Đặt, người dùng chuyển giữa V1 và V2 trong nháy mắt (zero reload).
- [ ] Toàn bộ Credits, Alloy, cấp độ, trang bị và cặp đôi nhân vật được giữ nguyên 100% khi chuyển shell.
- [ ] V1 Shell thuần khiết 100%, không còn tab thử nghiệm rác. V2 Shell chỉ hiển thị các màn hình đã hoàn thiện.

### Tiêu Chí Nghiệm Thu Phase 4 (Pilot Category V2 Rebuild):
- [ ] Giao diện Desktop (1440px) và Mobile (375px–430px) bám sát 100% concept PNG đã duyệt.
- [ ] Tranh Art View hiển thị toàn thân trọn vẹn, không bị crop mất đầu, cánh hay phụ kiện y tế.
- [ ] Cỡ chữ văn bản Story đạt $17$–$18\text{px}$ với chiều cao dòng $1.7$ thoáng đạt.
- [ ] Gallery hiển thị nổi bật 2 tác phẩm WebP thật, 28 tác phẩm archive được thu gọn khoa học.
