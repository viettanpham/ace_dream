# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.25 — EVENTS & MISSIONS COMMAND DESK REDESIGN (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 35/35 Test Suites PASS, 7/7 Phase 6.25 Tests PASS, Build Succeeded)**.
- **Mục tiêu cốt lõi**:
  - Tái thiết kế toàn diện tab **Sự Kiện & Nhiệm Vụ (Events & Missions)** thành Bàn Chỉ Huy Chiến Lược (Command Desk) theo `WORLD_STRATEGIC_UX_AUDIT.md`.
  - Tách bạch giao diện thành ba chế độ tác chiến cấp 1 chuyên biệt, dễ quét thông tin và ra quyết định:
    1. **Chế độ A: Cần Quyết Định [INIT] (Mặc định khi có việc cần xử lý)**:
       * Hàng đợi sự kiện khẩn cấp (Urgency Queue) thu gọn hợp lý (4 cột), phân cấp thị giác theo Deadline, Mức độ nghiêm trọng (`critical` > `warning` > `info`) và Sector địa bàn.
       * Bảng Quyết Định (Decision Panel - 8 cột) tập trung vào mục tiêu, bối cảnh địa bàn và hậu quả chiến lược.
       * So sánh 2–3 phương án bằng các thẻ trực quan: tên phương án, tác động ổn định/đe dọa thực tế, chi phí tài nguyên, điều kiện quân dự bị (`military.reserves`), và nút phê chuẩn rõ ràng.
       * Ẩn công thức và điểm số chi tiết khỏi giao diện chính nhưng vẫn xem được khi bấm *"Chi tiết"* (Explainable Scoring toggle).
       * Chỉ hiển thị xác suất thành công khi template thực tế định nghĩa xác suất có ý nghĩa (`strat.successChance`); không đổi điểm chiến lược thành phần trăm thành công giả.
       * Bảo toàn nguyên vẹn `selectBestStrategyForEvent`, `validateStrategyExecution`, concurrency guard, reserve validation và cơ chế commit hiện có.
    2. **Chế độ B: Đang Triển Khai [PROCESSING] (Theo Dõi Tiến Trình Thực Tế)**:
       * Thay thế hoàn toàn Decision Panel bằng Trạm Giám Sát Tiến Trình Chiến Lược (Execution Monitor).
       * Hiển thị phương án đã chọn, sector liên quan, tiến độ hoàn tất thực tế (% và thanh tiến trình), ngày bắt đầu và ngày dự kiến kết thúc (`processingCompletesTick`).
       * Hiển thị nguồn phê chuẩn (`System Auto`, `Tự Động Khóa Mặc Định`, `Chỉ Huy Phê Chuẩn`) và lý do lựa chọn (`selectionReason`).
       * Tuyệt đối không cung cấp nút phê chuẩn hay hành động tạo giao dịch trùng (Idempotent Guard).
       * Cho phép người chơi tự do chuyển đổi giữa các sự kiện khác mà không ảnh hưởng đến sự kiện đang chạy.
    3. **Chế độ C: Chuỗi Nhiệm Vụ [CHAINS] (Mission Pipeline & Stepper Toàn Màn Hình)**:
       * Nâng Mission Chains thành chế độ xem chính độc lập, không bị đẩy xuống đáy Decision Matrix.
       * Trình bày tuyến nhiệm vụ trực quan dạng Pipeline Timeline / Stepper đa cột.
       * Phân biệt rõ ràng 4 trạng thái nút nhiệm vụ: Đã Hoàn Tất (`completed`), Đang Hoạt Động (`active`), Đang Chờ Điều Kiện Sector (`isPendingDispatch` + số ngày hoãn), và Chưa Mở Khóa (`locked`).
       * Hiển thị sector liên kết và hỗ trợ điều hướng trực tiếp sang War Room qua nút *"Bản đồ &rarr;"*.
       * Không suy diễn điều kiện không có trong dữ liệu hiện tại.
    4. **Loại Bỏ Nội Dung Trùng Lặp**:
       * Loại bỏ khối *Recent Results Feed* ở cuối trang do đã trùng lặp với **Khay Báo Cáo Tình Báo** (`DebriefingDrawer`).
       * Bảo toàn 100% kho lưu trữ `eventResultsArchive`, cơ chế Safe Pruning và khả năng truy cập kết quả qua nút mở nhanh *Khay Báo Cáo Tình Báo* tại header.
    5. **Bảo Toàn Tuyệt Đối Gameplay & Hệ Thống Lưu Trữ**:
       * Không thay đổi schema lưu trữ World Save V1 hay RPG Save V4.
       * Bộ test tự động Phase 6.25 đạt 7/7 test cases PASS; toàn bộ 35 test suites dự án đạt 100% PASS.

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.25

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Điều hướng cấp 1: 3 chế độ [INIT] / [PROCESSING] / [CHAINS] | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (`commandMode`) |
| Chế độ INIT: Hàng đợi thu gọn 4 cột & Decision Panel 8 cột | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (Chế độ A) |
| Chế độ INIT: Thẻ phương án đối chiếu tác động thực & chi phí | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (Strategy Cards) |
| Chế độ INIT: Ẩn điểm chi tiết, hỗ trợ bật xem công thức | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (`expandedReasonKeys`) |
| Chế độ INIT: Không hiển thị tỷ lệ thành công giả | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (Kiểm tra `strat.successChance`) |
| Chế độ INIT: Bảo toàn validation, concurrency guard, System Auto | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (`validateStrategyExecution`) |
| Chế độ PROCESSING: Giao diện Execution Monitor theo dõi tiến độ | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (Chế độ B) |
| Chế độ PROCESSING: Ẩn 100% nút phê chuẩn, chống giao dịch trùng | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (Idempotent Guard) |
| Chế độ CHAINS: Tuyến nhiệm vụ Pipeline Timeline toàn diện | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (Chế độ C) |
| Chế độ CHAINS: Phân loại 4 trạng thái nút (Completed, Active, Pending, Locked) | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (Node Stepper) |
| Chế độ CHAINS: Điều hướng nhanh sang Sector trên Galaxy Map | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (`onNavigateToSector`) |
| Loại bỏ Recent Results Feed trùng lặp, bảo toàn Archive & Drawer | **Đã hoàn thành (Done)** | `events-missions-board.tsx` (Header Drawer link) |
| Bộ kiểm thử tự động Phase 6.25 (7/7 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-25-events-missions-command-desk.test.ts` |
| Toàn bộ 35 Test Suites vượt qua thành công (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
