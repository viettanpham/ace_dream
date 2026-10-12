# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.24 — STRATEGIC OVERVIEW REDESIGN & ACTIONABLE TRIAGE (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 34/34 Test Suites PASS, 7/7 Phase 6.24 Tests PASS, Build Succeeded)**.
- **Mục tiêu cốt lõi**:
  - Tái thiết kế toàn diện tab **Tình hình toàn cảnh / Strategic Overview** trong Operations Center theo `WORLD_STRATEGIC_UX_AUDIT.md`.
  - Giúp người chơi nắm bắt tình hình thiên hà, phát hiện khủng hoảng và biết việc cần xử lý tiếp theo trong vài giây:
    1. **Tầng 1 — Strategic Status (Thẻ Chỉ Số Chiến Lược Phân Cấp Rõ Ràng)**:
       * **Chủ quyền & tình trạng thiên hà**: Tỷ lệ kiểm soát VSS (`vssRatio%`), số lượng sector VSS / The Void / Contested / Neutral; số sector Ổn định, Đang bị đe dọa (`threatened`), Đang bị vây hãm (`under_siege`); đếm số tuyến đường Hyperlane Bị phong tỏa (`blocked`) và Nguy hiểm (`hazardous`).
       * **Threat & điểm nóng**: Mức Threat trung bình toàn cầu; Sector nguy cấp nhất với mức Threat cao nhất kèm nút điều hướng trực tiếp sang War Room; biểu đồ/xu hướng Threat chỉ hiển thị khi có $\ge 2$ điểm dữ liệu lịch sử thực tế (`threatHistory`), hiển thị trung thực *"Chưa có dữ liệu xu hướng"* nếu không đủ lịch sử.
       * **Quân sự & hậu cần**: Quân số dự bị sẵn sàng (`military.reserves`) và lực lượng đang hành quân (`military.deployments` + `activeDeployments.inTransit`); cảnh báo thiếu hụt Lương thực dân sự (Civilian Food) và Quân nhu hậu cần (Supplies) theo đúng ngưỡng quy định của nền kinh tế (`SHORTAGE_THRESHOLD` 50 và `CRITICAL_FOOD_THRESHOLD` 100); cảnh báo rõ ràng khi tài nguyên ở mức nguy cấp.
    2. **Tầng 2 — Actionable Situation Triage (Điểm Nóng & Việc Cần Xử Lý)**:
       * Bảng danh sách điểm nóng sắp xếp theo mức độ ưu tiên (`P0` Khẩn cấp, `P1` Cảnh báo, `P2` Lưu ý).
       * Bao gồm: Sector bị vây hãm / đe dọa, Sự kiện `INIT` sắp hết hạn countdown, Trận chiến đang dở dang (`isSuspendedCombat`), và Khủng hoảng hậu cần / lương thực.
       * Mỗi mục cung cấp đầy đủ: Tên sự vụ, Sector/Sự kiện liên quan, mức độ khẩn cấp, hạn chót deadline (ngày game), và nút hành động trực tiếp.
       * Tích hợp điều hướng an toàn:
         + Mở War Room tại Sector: chuyển sang tab War Room (`map`) và chọn đúng sector (`setSelectedSectorId`).
         + Xuất Kích nhanh: mở `QuickDispatchDock` với sector được chọn sẵn.
         + Xem Sự Kiện: chuyển sang Events & Missions (`events`) và chọn đúng sự kiện (`selectedEventIdForBoard`).
         + Xử lý trận chiến dở: mở đúng luồng khôi phục / rút lui hiện có (`handleDeployCombat`).
    3. **Tầng 3 — Operational Pulse (Nhịp Điệu Vận Hành & Khay Báo Cáo)**:
       * Thu nhỏ niên lịch thành dải trạng thái gọn gàng: ngày game, chu kỳ mùa/buổi, trạng thái mô phỏng (Đang chạy / Tạm dừng), đếm ngược giây đến tick tiếp theo.
       * Nhật ký biến động gần nhất: hiển thị log từ tick gần nhất hoặc tóm tắt vòng đời sự kiện; nút mở nhanh **Khay Báo Cáo Tình Báo** (`isDebriefingDrawerOpen = true`) khi có kết quả mới chưa đọc.
    4. **Phê Chuẩn Nhanh Sự Kiện (Quick Review Modal)**:
       * Hỗ trợ xem xét quyết định cho sự kiện `INIT` sắp hết hạn trực tiếp từ Overview.
       * Sử dụng `selectBestStrategyForEvent` và `validateStrategyExecution` từ `event-strategy-policy.ts` để hiển thị phương án tối ưu, điểm số, lý do và chi phí tài nguyên/quân sự.
       * Yêu cầu người chơi chủ động bấm xác nhận phê chuẩn; tuyệt đối không tự động phê chuẩn chỉ vì deadline sắp hết hạn.
       * Nút liên kết chuyển sang Bảng Quyết Định đầy đủ trong Events & Missions nếu người chơi muốn tùy chỉnh sâu.
    5. **Khắc Phục Đồng Bộ Tactical Retreat Trong Combat Arena**:
       * Đảm bảo `worldCommittedRef.current = true` được cập nhật ngay sau khi commit kết quả rút lui thành công trong `handleConfirmTacticalRetreat`, ngăn chặn việc gọi commit lần thứ hai khi combat state chuyển sang `defeat`.

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.24

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Tầng 1: Thẻ chỉ số Chủ quyền VSS & Tuyến đường | **Đã hoàn thành (Done)** | `operations-center.tsx` (Strategic Status deck) |
| Tầng 1: Threat trung bình & Sector nguy cấp nhất | **Đã hoàn thành (Done)** | `operations-center.tsx` (`avgThreat`, `criticalSector`) |
| Tầng 1: Xu hướng Threat dựa trên dữ liệu thực $\ge 2$ điểm | **Đã hoàn thành (Done)** | `operations-center.tsx` (`threatHistory` delta check) |
| Tầng 1: Quân số dự bị & Lực lượng đang hành quân | **Đã hoàn thành (Done)** | `operations-center.tsx` (`military.reserves`, in-transit) |
| Tầng 1: Cảnh báo Food & Logistics Supplies theo ngưỡng chuẩn | **Đã hoàn thành (Done)** | `operations-center.tsx` (`economy.ts` thresholds) |
| Tầng 2: Danh sách Actionable Situation Triage P0/P1/P2 | **Đã hoàn thành (Done)** | `operations-center.tsx` (`triageHotspots`) |
| Tầng 2: Điều hướng War Room tại Sector liên quan | **Đã hoàn thành (Done)** | `operations-center.tsx` (`handleNavigateToSector`) |
| Tầng 2: Mở Quick Dispatch với Sector được chọn | **Đã hoàn thành (Done)** | `operations-center.tsx` (`handleOpenQuickDispatchForSector`) |
| Tầng 2: Chuyển sang Events & Missions chọn đúng Event | **Đã hoàn thành (Done)** | `operations-center.tsx`, `events-missions-board.tsx` |
| Tầng 2: Xử lý trận chiến dở dang (Suspended Combat) | **Đã hoàn thành (Done)** | `operations-center.tsx` (`handleDeployCombat`) |
| Tầng 2: Modal Xem Đề Xuất & Phê Chuẩn An Toàn | **Đã hoàn thành (Done)** | `operations-center.tsx` (`reviewingEvent` modal) |
| Tầng 3: Niên lịch thu gọn & Đếm ngược thời gian thực | **Đã hoàn thành (Done)** | `operations-center.tsx` (Operational Pulse) |
| Tầng 3: Nút mở Khay Báo Cáo Tình Báo Debriefing Drawer | **Đã hoàn thành (Done)** | `operations-center.tsx` (`setIsDebriefingDrawerOpen`) |
| Sửa lỗi đồng bộ cờ `worldCommittedRef` khi Tactical Retreat | **Đã hoàn thành (Done)** | `components/game/combat-arena.tsx` |
| Bộ kiểm thử tự động Phase 6.24 (7/7 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-24-strategic-overview-redesign.test.ts` |
| Toàn bộ 34 Test Suites vượt qua thành công (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
