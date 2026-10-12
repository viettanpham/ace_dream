# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.18 — SLIM TACTICAL HUD & ADMIN CP ISOLATION (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 29/29 Test Suites PASS, 14/14 Phase 6.18 Tests PASS, Build Succeeded)**.
- **Mục tiêu cốt lõi**:
  - Triển khai P1 & P0 từ `WORLD_UI_UX_AUDIT.md`:
    1. **Slim Tactical HUD (`components/game/world/operations-center.tsx`)**:
       * Tổ chức lại toàn bộ Header của Operations Center thành thanh chỉ huy tinh gọn (Slim Tactical HUD) với 3 nhóm chức năng mạch lạc:
         - **Nhóm 1: Thời gian chiến lược**: Ngày trong game (#N), Niên lịch thiên hà, chu kỳ nhật dạ (Sáng/Chiều/Tối/Đêm), trạng thái RUNNING/PAUSED, đếm ngược giây tick.
         - **Nhóm 2: 5 Tài nguyên thiên hà cốt lõi**: Vật Liệu, Năng Lượng Plasma, Hậu Cần, Dữ Liệu Tác Chiến, Lương Thực Dân Sinh; hiển thị trực quan, cảnh báo thiếu hụt (pulse đỏ khi <= 20 hoặc lương thực <= 50).
         - **Nhóm 3: Thao tác nhanh**: Thực thi ngày mới (+1 Ngày), Phóng to toàn màn hình (Fullscreen Map), Mở Trung tâm Báo cáo, Điều động quân sự nhanh, Nút Bánh Răng (Cài Đặt / Settings Overlay), Nút Lưu thủ công (Safe Save V1).
       * Giảm triệt để chiều cao và độ chiếm dụng không gian so với header cũ, ưu tiên bố cục một hàng trên desktop, tự động thích ứng trên màn hình nhỏ.
       * Tối đa hóa diện tích viewport cho War Room và Galaxy Map.
    2. **Chuyển ADMIN CP Thành Settings Overlay Độc Lập (`components/game/world/admin-settings-modal.tsx`)**:
       * Tách bỏ hoàn toàn tab `admin` ra khỏi thanh điều hướng tác chiến thường ngày (thanh nav giữ đúng 5 tab: War Room Map, Tình Hình Toàn Cảnh, Sự Kiện & Nhiệm Vụ, Quân Sự & Hậu Cần, Trung Tâm Kết Quả).
       * Chuyển toàn bộ công cụ quản trị vào Modal/Overlay chuyên dụng mở qua nút bánh răng Cài Đặt trên HUD.
       * Hỗ trợ đóng mở rõ ràng: nút X, backdrop click, phím Escape (không xung đột sub-dialog).
       * Bảo toàn toàn vẹn tất cả các nhóm chức năng quản trị hiện có:
         - **Tốc độ Simulator**: Preset 15s/30s/60s/300s, Tùy chỉnh, Tạm dừng/Tiếp tục.
         - **Quy tắc an toàn Đổi Tốc Độ**: Chỉ reset WORLD khi người dùng chủ động đồng ý; Cancel giữ nguyên tốc độ và 100% dữ liệu thế giới.
         - **Cấu hình Bộ Sinh Sự Kiện (Event Generator)**: 3 Tier (Small/Medium/Large), chu kỳ sinh, thời gian tồn tại, giới hạn trần, lưu cấu hình và khôi phục mặc định.
         - **Chính sách Chiến Lược (Event Strategy Policy)**: System Auto / Default Fallback / Player Choice, lưu chính sách, khôi phục mặc định, áp dụng hàng loạt (Batch Apply) cho sự kiện chờ.
         - **Thao tác Nâng Cao & Dev Triggers**: Force spawn theo 3 Tier, tua nhanh thời gian (+1, +5, +10, +30 ngày), thực thi tick đơn lẻ, lưu trữ Staging A/B với CRC32 Checksum.
         - **Khu Vực Nguy Hiểm (Danger Zone)**: Phân tách viền đỏ cảnh báo, hộp thoại xác nhận độc lập (Reset World Confirmation Dialog), khôi phục World về Ngày 1 nhưng GIỮ NGUYÊN cấu hình tốc độ và generator.
    3. **Bảo toàn toàn vẹn hệ thống & Không ảnh hưởng RPG Save V4**:
       * Zero-regression: Không thay đổi logic Galaxy Map, Sector Command Ribbon, Sector Inspector, Tick engine hay Event Strategy Policy.
       * Lưu trữ `STARFRONT_WORLD_SAVE_V1` và cấu hình `STARFRONT_WORLD_SIMULATOR_CONFIG` được bảo vệ độc lập, phân hệ RPG Save `STARFRONT_SAVE_DATA_V4` cách ly hoàn toàn.

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.18

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Slim Tactical HUD (Thời gian chiến lược + 5 Tài nguyên + Quick Actions) | **Đã hoàn thành (Done)** | `components/game/world/operations-center.tsx` |
| Tách tab Admin khỏi thanh điều hướng chính (5 Tabs chuẩn) | **Đã hoàn thành (Done)** | `components/game/world/operations-center.tsx` |
| Settings Overlay Modal chuyên dụng (`AdminSettingsModal`) | **Đã hoàn thành (Done)** | `components/game/world/admin-settings-modal.tsx` |
| Kích hoạt Settings qua nút bánh răng HUD & đóng bằng ESC | **Đã hoàn thành (Done)** | `operations-center.tsx`, `admin-settings-modal.tsx` |
| Quy tắc xác nhận Đổi tốc độ (Cancel không đổi dữ liệu, Confirm an toàn) | **Đã hoàn thành (Done)** | `admin-settings-modal.tsx`, `operations-center.tsx` |
| Cấu hình Event Generator 3 Tier & Khôi phục mặc định | **Đã hoàn thành (Done)** | `admin-settings-modal.tsx`, `operations-center.tsx` |
| Cấu hình Event Strategy Policy & Áp dụng hàng loạt | **Đã hoàn thành (Done)** | `admin-settings-modal.tsx`, `operations-center.tsx` |
| Force Spawn 3 Tier, Advance Time (+1/+5/+10/+30d) | **Đã hoàn thành (Done)** | `admin-settings-modal.tsx`, `operations-center.tsx` |
| Giám sát Slot Lưu Trữ Staging A/B & CRC32 Checksum | **Đã hoàn thành (Done)** | `admin-settings-modal.tsx`, `lib/game/world/storage.ts` |
| Danger Zone & Hộp thoại xác nhận Reset World độc lập | **Đã hoàn thành (Done)** | `admin-settings-modal.tsx`, `operations-center.tsx` |
| Bộ kiểm thử Phase 6.18 Slim HUD & Admin Isolation (14/14 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-18-slim-hud-admin-isolation.test.ts` |
| Toàn bộ 29 Test Suites vượt qua thành công (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
| Next.js Build & Typecheck thành công hoàn toàn | **Đã hoàn thành (Done)** | `compile_applet` |
