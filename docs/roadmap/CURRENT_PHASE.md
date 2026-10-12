# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.26 — STRATEGIC THREAT & RESOURCE TREND VISUALIZATION (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 36/36 Test Suites PASS, 7/7 Phase 6.26 Tests PASS, Build Succeeded)**.
- **Mục tiêu cốt lõi**:
  - Nâng cấp tab **Tình Hình Toàn Cảnh (Overview)** với hệ thống biểu đồ xu hướng Đe dọa chiến lược (Threat Visualizer) và mức dự trữ tài nguyên thiết yếu (Resource Sparklines).
  - Giúp người chỉ huy nhanh chóng nhận biết các nguy cơ leo thang đe dọa hoặc các dấu hiệu cạn kiệt tài nguyên sống còn trước khi rơi vào khủng hoảng.
  - Tận dụng triệt để nguồn dữ liệu thực tế sẵn có, tuyệt đối không dựng xu hướng giả, không sinh số liệu thay thế hay làm sai lệch hệ thống lưu trữ.
  - Thành phần triển khai chi tiết:
    1. **Threat Visualizer (Biểu Đồ Đường Xu Hướng Đe Dọa)**:
       * Component `ThreatVisualizer` kết xuất đồ họa SVG responsive siêu nhẹ, mượt mà và trực quan.
       * Dựng đường biểu diễn xu hướng Threat theo các mốc ngày chiến lược thực tế dựa trên `SectorThreatHistoryPoint` sẵn có.
       * Cung cấp 2 chế độ hiển thị linh hoạt: **Điểm Nóng Tác Chiến** (Critical Sector mặc định) và **Trung Bình Toàn Thiên Hà** (Galaxy Average Threat qua các chu kỳ).
       * Tự động tính toán hướng biến động: Tăng (`up` - đỏ), Giảm (`down` - lục), Ổn định (`flat` - xám) kèm chỉ số Delta cụ thể (+Delta / -Delta Threat).
       * Tương tác mượt mà: Tooltip khi hover hiển thị chi tiết mốc ngày và mức Threat tại từng điểm nút; hiệu ứng sóng lan tỏa tại điểm dữ liệu mới nhất.
       * Trạng thái Fallback trung thực: Khi dữ liệu lịch sử `< 2` điểm, hiển thị thông báo *"Chưa đủ dữ liệu lịch sử"* (Cần ít nhất 2 chu kỳ ngày chiến lược thực tế), không tự tạo điểm dữ liệu giả định.
       * Tích hợp nút điều hướng nhanh: Cho phép nhảy trực tiếp tới Sector trong War Room từ thẻ Điểm Nóng.
    2. **Resource Sparklines (Lương Thực Dân Sự & Vật Tư Hậu Cần)**:
       * Component `ResourceSparkline` tích hợp micro-sparkline SVG (84x24px) gọn gàng bên cạnh thông tin dự trữ tài nguyên.
       * Áp dụng cho 2 tài nguyên thiết yếu: **Lương thực dân sự (Civilian Food)** và **Vật tư tiếp tế (Logistics Supplies)**.
       * Cơ chế ghi nhận lịch sử theo phiên (Session Resource History) ghi nhận tối đa 10 chu kỳ ngày thực tế khi người chơi tiến hành tick trong phiên.
       * Khi chưa có đủ 2 mốc lịch sử (phiên mới nạp hoặc ngày 1), hiển thị chính xác trạng thái *"Chưa đủ dữ liệu lịch sử"*, không giả lập dữ liệu.
       * Khi có từ 2 mốc trở lên, hiển thị đường xu hướng thu nhỏ kèm biến động Delta (+/- trên ngày) và tooltip khi hover.
       * Bảo toàn 100% ngưỡng cảnh báo thiết yếu đang sử dụng:
         - Food: Cạn kiệt (`<= 0`), Thiếu hụt cảnh báo (`< 100`), An toàn (`>= 100`).
         - Logistics Supplies: Cạn kiệt (`<= 0`), Thiếu hụt cảnh báo (`< 50`), An toàn (`>= 50`).
    3. **Bảo Toàn Kiến Trúc 3 Tầng Của Strategic Overview**:
       * Giữ nguyên cấu trúc 3 tầng chuẩn mực từ Phase 6.24: Strategic Status, Actionable Situation Triage, và Operational Pulse.
       * Không làm mất hay che khuất các cảnh báo P0/P1/P2, cơ chế nhảy sector, Quick Review Modal, hay Debriefing Drawer.
       * Đảm bảo mật độ thông tin desktop tối ưu, giao diện chỉ huy sci-fi sắc sảo, chống "AI slop", không dùng thư viện biểu đồ nặng.
    4. **Bảo Toàn Tuyệt Đối Save Schema & Động Cơ Gameplay**:
       * Giữ nguyên `STARFRONT_WORLD_SAVE_V1` và `STARFRONT_SAVE_DATA_V4`.
       * Không thay đổi schema lưu trữ World Save V1; không chèn trường dữ liệu lưu trữ lớn chỉ để phục vụ sparkline.
       * Tick Engine, Catch-up Engine, Economy, Event Engine, Mission Chains, Galaxy Map và Arena Integration vận hành ổn định 100%.

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.26

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Component `ThreatVisualizer` SVG Responsive | **Đã hoàn thành (Done)** | `components/game/world/threat-visualizer.tsx` |
| Biểu đồ đường xu hướng Threat theo chu kỳ ngày thực tế | **Đã hoàn thành (Done)** | `threat-visualizer.tsx` (`chartGeometry`, `points`, `lineString`) |
| 2 Chế độ xem: Điểm Nóng (Critical) & TB Thiên Hà (Galaxy Avg) | **Đã hoàn thành (Done)** | `threat-visualizer.tsx` (`viewMode`, `onToggleViewMode`) |
| Hiển thị Delta, hướng xu hướng (Tăng / Giảm / Ổn định) | **Đã hoàn thành (Done)** | `threat-visualizer.tsx` (`trendMetrics`) |
| Tooltip tương tác và mốc thời gian N#1..N#10 | **Đã hoàn thành (Done)** | `threat-visualizer.tsx` (`activePoint`, hover markers) |
| Trạng thái Fallback trung thực khi < 2 điểm lịch sử | **Đã hoàn thành (Done)** | `threat-visualizer.tsx` (*"Chưa đủ dữ liệu lịch sử"*) |
| Component `ResourceSparkline` cho Food & Supplies | **Đã hoàn thành (Done)** | `components/game/world/resource-sparkline.tsx` |
| Micro-sparkline SVG cho Civilian Food & Logistics Supplies | **Đã hoàn thành (Done)** | `resource-sparkline.tsx` (`sparklineGeometry`) |
| Bảo toàn ngưỡng cảnh báo Food (<100, <=0) & Supplies (<50, <=0) | **Đã hoàn thành (Done)** | `resource-sparkline.tsx` (`warningThreshold`, `criticalThreshold`) |
| Fallback trung thực khi chưa đủ lịch sử tài nguyên | **Đã hoàn thành (Done)** | `resource-sparkline.tsx` (*"Chưa đủ dữ liệu lịch sử"*) |
| Ghi nhận lịch sử tài nguyên theo phiên (Session Resource Tracker) | **Đã hoàn thành (Done)** | `operations-center.tsx` (`sessionResourceHistory`) |
| Tích hợp ThreatVisualizer vào Thẻ 1.2 & Sparklines vào Thẻ 1.3 | **Đã hoàn thành (Done)** | `operations-center.tsx` (Card 1.2 & Card 1.3) |
| Bảo toàn cấu trúc 3 tầng Strategic Overview | **Đã hoàn thành (Done)** | `operations-center.tsx` (Tầng 1, 2, 3) |
| Bộ kiểm thử tự động Phase 6.26 (7/7 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-26-threat-resource-trend-visualization.test.ts` |
| Toàn bộ 36 Test Suites của dự án vượt qua thành công (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
