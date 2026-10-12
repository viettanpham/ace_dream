# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.27 — STRATEGIC OVERVIEW DATA INTEGRITY & SESSION CONTINUITY (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 37/37 Test Suites PASS, 7/7 Phase 6.27 Tests PASS, Build Succeeded)**.
- **Mục tiêu cốt lõi**:
  - Bảo đảm các chỉ số chiến lược, biểu đồ Threat Visualizer và Resource Sparklines phản ánh chuẩn xác 100% trạng thái WORLD sau mỗi tick, tua nhanh (fast-forward), bắt kịp ngoại tuyến (catch-up) và tải lại trang (reload).
  - Khắc phục triệt để các rủi ro sai lệch dữ liệu:
    1. **Tính Đúng Đắn Của Lịch Sử Threat (Threat Data Integrity)**:
       * Dữ liệu biểu đồ lấy từ Threat History thực tế, không tạo điểm giả định hoặc tính ngược lịch sử từ trạng thái hiện tại.
       * Chế độ Điểm Nóng (Critical Sector) gắn chuẩn xác với sector nguy cấp nhất; khi sector nguy cấp thay đổi, biểu đồ lập tức phản ánh đúng sector mới và lịch sử thực tế của nó.
       * Điểm mốc ngày hiện tại trên biểu đồ luôn đồng bộ 100% với `threatLevel` thực tế của sector hiển thị trên thẻ Strategic Status.
       * Chế độ Trung Bình Thiên Hà (Galaxy Average Threat) tính trung bình cộng chính xác từ các sector thực tế có dữ liệu báo cáo cho từng ngày, không coi dữ liệu thiếu là Threat = 0.
       * Điểm mốc ngày hiện tại của Galaxy Average Threat khớp tuyệt đối với chỉ số `avgThreat` trên thẻ Strategic Status.
    2. **Tính Toán Delta Chuẩn Xác & Nhận Biết Khoảng Cách Chu Kỳ (Gap-Aware Delta)**:
       * Delta tính toán đúng giữa hai mốc hợp lệ liên tiếp trong chuỗi thời gian đã làm sạch.
       * Tự động nhận biết khoảng cách chu kỳ (`dayGap`): nếu hai mốc là ngày liên tiếp (`dayGap === 1`), hiển thị `+X Threat` hoặc `+X /ngày`; nếu có khoảng cách do tua nhanh/nhảy chu kỳ (`dayGap > 1`), hiển thị rõ nhãn khoảng cách chu kỳ `(N#prev→N#latest)` và tooltip chi tiết, không đánh lừa người dùng rằng đó là biến động 1 ngày.
       * Cơ chế Deduplication theo ngày loại bỏ hoàn toàn khả năng sinh delta = 0 giả tạo từ các mẫu trùng cùng ngày.
       * Giới hạn tối đa 10 mốc thời gian gần nhất và trạng thái fallback *"Chưa đủ dữ liệu lịch sử"* khi `< 2` điểm.
    3. **Session Resource Tracker & Session Continuity**:
       * Mỗi ngày chiến lược chỉ ghi nhận 1 mốc cho mỗi tài nguyên theo đúng thời điểm cập nhật World State.
       * Chống duplicate triệt để: React re-renders, mở/đóng modal (`reviewingEvent`), chuyển tab không tự sinh thêm mốc lịch sử.
       * Hỗ trợ đầy đủ các phương thức tiến thời gian:
         - Tiến 1 ngày (`handleAdvanceTick`): ghi nhận chính xác 1 mốc mới.
         - Tua nhanh nhiều ngày (`handleFastForwardDays`): ghi nhận từng mốc tick thực tế theo đúng thứ tự thời gian.
         - Bắt kịp ngoại tuyến (`processOfflineCatchup`): ghi nhận các mốc tick thực tế khi nạp lại.
       * Tính trung thực khi Reload: lịch sử tài nguyên theo phiên được thiết kế thuần túy trong bộ nhớ phiên, khi reload sẽ reset và trở về trạng thái *"Chưa đủ dữ liệu lịch sử"* cho đến khi có đủ mốc mới. Tuyệt đối không tuyên bố lưu trữ bền vững khi chưa có backend schema tương ứng.
       * Bảo toàn 100% `STARFRONT_WORLD_SAVE_V1` schema và `STARFRONT_SAVE_DATA_V4`, không sửa đổi tùy tiện schema lưu trữ.

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.27

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Đồng bộ 100% mốc hiện tại với Strategic Status | **Đã hoàn thành (Done)** | `operations-center.tsx` (`criticalSectorThreatHistory`, `galaxyAverageThreatHistory`) |
| Gắn đúng Critical Sector và chuyển đổi độc lập | **Đã hoàn thành (Done)** | `operations-center.tsx` (`criticalSector`, `viewMode`) |
| Galaxy Average không coi dữ liệu thiếu là 0 | **Đã hoàn thành (Done)** | `operations-center.tsx` (`dayTotals[pt.day].count`) |
| Gap-Aware Delta cho Threat Visualizer | **Đã hoàn thành (Done)** | `threat-visualizer.tsx` (`trendMetrics.dayGap`, title & label) |
| Gap-Aware Delta cho Resource Sparklines | **Đã hoàn thành (Done)** | `resource-sparkline.tsx` (`trendMetrics.dayGap`, `/ngày` vs `(N#A→N#B)`) |
| Deduplication mốc ngày & giới hạn tối đa 10 mốc | **Đã hoàn thành (Done)** | `threat-visualizer.tsx`, `resource-sparkline.tsx` (`sanitizedHistory`) |
| Session Resource Tracker ghi nhận đúng sau World Tick | **Đã hoàn thành (Done)** | `operations-center.tsx` (`handleAdvanceTick`) |
| Ghi nhận từng tick thực tế khi Tua Nhanh (Fast-Forward) | **Đã hoàn thành (Done)** | `operations-center.tsx` (`handleFastForwardDays`) |
| Ghi nhận từng tick thực tế khi Bắt Kịp (Offline Catch-Up) | **Đã hoàn thành (Done)** | `operations-center.tsx` (onMount offline catch-up) |
| Chống duplicate mốc trên Re-render / Modal / Tab switch | **Đã hoàn thành (Done)** | `operations-center.tsx` (useEffect findIndex & deduplication) |
| Trung thực fallback khi Reload, bảo toàn Save V1 Schema | **Đã hoàn thành (Done)** | `operations-center.tsx` (`reloadState`, `handleConfirmResetWorld`) |
| Bộ kiểm thử tự động Phase 6.27 (7/7 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-27-data-integrity-session-continuity.test.ts` |
| Toàn bộ 37 Test Suites của dự án vượt qua thành công (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
| Trình biên dịch Next.js 16 và TypeScript Linting 100% thành công | **Đã hoàn thành (Done)** | `compile_applet`, `tsc --noEmit` |
