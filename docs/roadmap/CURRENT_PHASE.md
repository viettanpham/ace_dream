# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.20 — DEBRIEFING DRAWER & RESULTS ACCESS (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 31/31 Test Suites PASS, 10/10 Phase 6.20 Tests PASS, Build Succeeded)**.
- **Mục tiêu cốt lõi**:
  - Triển khai hạng mục P1 từ `WORLD_UI_UX_AUDIT.md`:
    1. **Khay Báo Cáo Tình Báo Trượt Cạnh Phải (`components/game/world/debriefing-drawer.tsx`)**:
       * Mở nhanh trực tiếp từ nút "Báo Cáo" trên Slim Tactical HUD của War Room.
       * Không làm gián đoạn hay mất trạng thái War Room: giữ nguyên vẹn 100% `activeTab` và `selectedSectorId` khi đóng Drawer.
       * Hỗ trợ phím tắt `Escape` toàn cục, nút đóng rõ ràng `[ESC]`, nhấp vào backdrop mờ hoặc liên kết "Quay lại War Room &rarr;".
       * Thiết kế đáp ứng linh hoạt: rộng cố định trên desktop (`560px` - `720px`) và tự động chuyển sang chế độ Overlay toàn màn hình (`w-screen`) trên thiết bị di động/màn hình hẹp.
       * Cho phép cuộn nội bộ độc lập (`overflow-y-auto`) với thanh cuộn tối ưu, không ảnh hưởng đến bản đồ nền.
    2. **Huy Hiệu Kết Quả Chưa Đọc (Unread Badge)**:
       * Tính toán chính xác số lượng báo cáo chưa đọc (`unreadResultsCount`) từ `eventResultsArchive`.
       * Tự động cập nhật badge khi sự kiện hoàn tất chu trình `PROCESSING`, không tạo thông báo lặp hay tăng số ảo qua các tick mô phỏng.
    3. **Tích Hợp & Nâng Cấp Dual Results Hub (`components/game/world/dual-results-hub.tsx`)**:
       * Phân tách rõ ràng 2 luồng báo cáo có thẩm quyền: Báo Cáo Sự Kiện & Khủng Hoảng (Event Results) và Nhật Ký Trận Đánh Buồng Lái (Battle Results).
       * Liên kết nhảy trực tiếp sang Sector (`onNavigateToSector`): Tên Sector trên thẻ kết quả trở thành nút liên kết có thể nhấp, tự động chuyển camera Galaxy Map đến Sector đó, mở Sector Inspector và đóng Drawer mượt mà.
       * Xem chi tiết mở rộng: Nút bật/tắt "Chi Tiết" / "Biên Lai" cho từng kết quả, mở rộng ID sự kiện, tick hoàn tất, lý do lựa chọn chiến lược và mã giao dịch TxID.
       * Bộ lọc 4 chế độ: `Tất Cả`, `Chưa Đọc`, `Thắng / Tốt`, `Thua / Xấu`.
       * Đánh dấu một kết quả đã đọc, đánh dấu tất cả đã đọc, và dọn dẹp an toàn (`pruneReadEventResultsSafe`) bảo toàn 100% World State.
    4. **Bảo Toàn Hệ Thống & Lưu Trữ Độc Lập**:
       * Tái sử dụng 100% dữ liệu gốc từ `eventResultsArchive` và `transactionJournal`, tuyệt đối không tạo thêm cơ chế lưu trữ thứ hai.
       * Giữ nguyên tab 5 "Trung Tâm Kết Quả" để bảo đảm tính tương thích ngược hoàn toàn.
       * Không can thiệp đến Event Engine, simulator, tick engine, hay save schemas (`STARFRONT_WORLD_SAVE_V1`, `STARFRONT_SAVE_DATA_V4`).

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.20

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Khay Báo Cáo Debriefing Drawer trượt từ cạnh phải | **Đã hoàn thành (Done)** | `components/game/world/debriefing-drawer.tsx` |
| Kết nối nút Báo Cáo trên Slim Tactical HUD | **Đã hoàn thành (Done)** | `components/game/world/operations-center.tsx` |
| Bảo toàn tab và sector đang chọn khi đóng/mở Drawer | **Đã hoàn thành (Done)** | `operations-center.tsx`, `debriefing-drawer.tsx` |
| Nút đóng [ESC], phím tắt Escape toàn cục và backdrop | **Đã hoàn thành (Done)** | `debriefing-drawer.tsx` |
| Cuộn nội bộ độc lập và hỗ trợ viewport hẹp (w-screen) | **Đã hoàn thành (Done)** | `debriefing-drawer.tsx` |
| Badge số lượng chưa đọc không tăng lặp do tick | **Đã hoàn thành (Done)** | `operations-center.tsx`, `debriefing-drawer.tsx` |
| Phân biệt Event Results và Combat Results | **Đã hoàn thành (Done)** | `components/game/world/dual-results-hub.tsx` |
| Liên kết điều hướng Sector trực tiếp sang Galaxy Map | **Đã hoàn thành (Done)** | `dual-results-hub.tsx`, `operations-center.tsx` |
| Bảng xem chi tiết kết quả mở rộng (Expandable Details) | **Đã hoàn thành (Done)** | `dual-results-hub.tsx` |
| Đánh dấu đã đọc, đánh dấu tất cả và bộ lọc 4 chế độ | **Đã hoàn thành (Done)** | `dual-results-hub.tsx` |
| Safe Pruning bảo toàn 100% World State và tài nguyên | **Đã hoàn thành (Done)** | `dual-results-hub.tsx`, `event-engine.ts` |
| Dữ liệu lấy trực tiếp từ archive/journal, không tạo store thứ 2 | **Đã hoàn thành (Done)** | `dual-results-hub.tsx`, `storage.ts` |
| Bộ kiểm thử Phase 6.20 Debriefing Drawer (10/10 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-20-debriefing-drawer.test.ts` |
| Toàn bộ 31 Test Suites vượt qua thành công (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
| Next.js Build & Typecheck thành công hoàn toàn | **Đã hoàn thành (Done)** | `compile_applet`, `lint_applet` |
