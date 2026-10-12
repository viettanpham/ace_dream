# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.19 — EVENTS & MISSIONS DECISION MATRIX (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 30/30 Test Suites PASS, 6/6 Phase 6.19 Tests PASS, Build Succeeded)**.
- **Mục tiêu cốt lõi**:
  - Triển khai hạng mục P1 từ `WORLD_UI_UX_AUDIT.md`:
    1. **Tái Cấu Trúc Bố Cục 2 Cột Ma Trận Quyết Định (`components/game/world/events-missions-board.tsx`)**:
       * **Cột Trái — Hàng Đợi Khẩn Cấp (Urgency Queue)**:
         - Sắp xếp sự kiện theo 3 tầng ưu tiên chặt chẽ: Hạn chót gần nhất (`decisionDeadlineTick - currentDay` ASC) -> Mức độ nghiêm trọng (`critical` > `warning` > `info`) -> ID tất định.
         - Chiều cao giới hạn có thanh cuộn nội bộ độc lập (`max-h-[680px] overflow-y-auto`), không kéo dài trang khi có nhiều sự kiện.
         - Thẻ sự kiện cô đọng (Compact Cards): Vạch màu trạng thái dọc cạnh trái, huy hiệu đếm ngược ngày, phân loại (Crisis, Military, Diplomacy, Civil, Anomaly, Logistics, Intel), vị trí sector/toàn thiên hà và nguồn quyết định.
         - Thanh tìm kiếm và bộ lọc nhanh 5 chế độ: `Tất Cả`, `Cần Phê Chuẩn [INIT]`, `Đang Triển Khai [PROCESSING]`, `Cây Chuỗi Nhiệm Vụ`, `Báo Cáo Gần Đây`.
       * **Cột Phải — Bảng Phân Tích & Phê Chuẩn Chiến Lược (Decision Panel)**:
         - Hiển thị chi tiết tình báo sự kiện đang được chọn, bối cảnh sector (ổn định %, đe dọa, chủ quyền, quân đồn trú).
         - So sánh trực quan các phương án chiến lược: Tỷ lệ thành công (`successChance%`), thời gian thực thi (`processingTicks`), biến động ổn định (`stabilityDelta`) và đe dọa (`threatDelta`).
         - Thẩm định chi phí thực tế (`validateStrategyExecution`): Kiểm tra từng tài nguyên trong 5 loại và quân dự bị, đổi màu cảnh báo đỏ/xanh tức thì, hiển thị lý do chi tiết khi thiếu hụt.
         - Hệ thống chấm điểm minh bạch (`scoreEventStrategy`): Điểm số chiến lược tổng hợp (+/- điểm) kèm nút bật/tắt giải thích chi tiết các hệ số đánh giá (Explainable Scoring).
         - Làm rõ phương án được đề xuất bởi System Auto (`★ ĐỀ XUẤT SYSTEM AUTO`) và phương án mặc định tự động khóa.
         - Nút Phê chuẩn thủ công có kiểm tra chi phí và nút Phê chuẩn nhanh 1-click theo System Auto (`⚡ System Auto Phê Chuẩn Ngay`).
       * **Empty State Trung Thực**:
         - Khi chưa có sự kiện nào được chọn, hiển thị màn hình hướng dẫn thao tác sạch sẽ với biểu tượng Crosshair quân sự, tuyệt đối không tạo dữ liệu giả.
       * **Bảo Vệ Tính Lũy Đẳng & Phân Định Nguồn Quyết Định**:
         - Phân biệt rõ các nguồn: `Chờ Chỉ Huy` (`player_choice`), `System Auto` (`system_auto`), `Default Fallback` (`default_fallback`), `Processing` (`PROCESSING`).
         - Hiển thị minh bạch nguyên nhân chuyển giao quyền quyết định (`autoSelectionFailureReason`).
         - Khóa không cho phép phê chuẩn lại hoặc ghi đè phương án khi sự kiện đã bước vào trạng thái `PROCESSING`.
    2. **Bảo Toàn Toàn Vẹn Cây Chuỗi Nhiệm Vụ (Mission Chains)**:
       * Giữ nguyên vẹn 100% đồ thị các bước nhiệm vụ phân nhánh: các trạng thái `completed`, `active`, `locked`.
       * Duy trì cơ chế hoãn điều động `isPendingDispatch` với huy hiệu "Đang chờ điều kiện sector" và đếm số ngày đã hoãn (`dispatchDeferredTicks` / `MAX_DISPATCH_DEFER_TICKS`).
    3. **Bảo Toàn Hệ Thống & Lưu Trữ**:
       * Zero-regression: Không thay đổi Event Engine, simulator, tick engine hay save schema.
       * Lưu trữ `STARFRONT_WORLD_SAVE_V1` và cấu hình `STARFRONT_WORLD_SIMULATOR_CONFIG` được bảo vệ độc lập, phân hệ RPG Save `STARFRONT_SAVE_DATA_V4` cách ly hoàn toàn.

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.19

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Bố cục 2 cột Decision Matrix (Urgency Queue + Decision Panel) | **Đã hoàn thành (Done)** | `components/game/world/events-missions-board.tsx` |
| Hàng đợi khẩn cấp sắp xếp theo Deadline -> Severity -> ID | **Đã hoàn thành (Done)** | `events-missions-board.tsx` |
| Cuộn độc lập & giới hạn chiều cao khung nhìn (`max-h-[680px]`) | **Đã hoàn thành (Done)** | `events-missions-board.tsx` |
| Bộ lọc 5 chế độ & Thanh tìm kiếm theo tên, sector, category | **Đã hoàn thành (Done)** | `events-missions-board.tsx` |
| Decision Panel hiển thị tình báo, sector và đối chiếu chiến lược | **Đã hoàn thành (Done)** | `events-missions-board.tsx` |
| Thẩm định chi phí thực tế (`validateStrategyExecution`) | **Đã hoàn thành (Done)** | `events-missions-board.tsx`, `event-strategy-policy.ts` |
| Chấm điểm minh bạch & Giải thích điểm số (`scoreEventStrategy`) | **Đã hoàn thành (Done)** | `events-missions-board.tsx`, `event-strategy-policy.ts` |
| Làm rõ đề xuất System Auto & Nút phê chuẩn nhanh 1-click | **Đã hoàn thành (Done)** | `events-missions-board.tsx` |
| Empty State trung thực khi chưa chọn sự kiện (không dữ liệu giả) | **Đã hoàn thành (Done)** | `events-missions-board.tsx` |
| Phân định nguồn quyết định & nguyên nhân auto thất bại | **Đã hoàn thành (Done)** | `events-missions-board.tsx` |
| Khóa lũy đẳng chống double-commit sự kiện PROCESSING | **Đã hoàn thành (Done)** | `events-missions-board.tsx`, `event-engine.ts` |
| Bảo toàn Mission Chains & cơ chế hoãn `isPendingDispatch` | **Đã hoàn thành (Done)** | `events-missions-board.tsx`, `mission-chains.ts` |
| Bộ kiểm thử Phase 6.19 Decision Matrix (6/6 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-19-decision-matrix.test.ts` |
| Toàn bộ 30 Test Suites vượt qua thành công (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
| Next.js Build & Typecheck thành công hoàn toàn | **Đã hoàn thành (Done)** | `compile_applet`, `lint_applet` |
