# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.15 — EVENT STRATEGY POLICY & SYSTEM AUTO STRATEGY (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 27/27 Test Suites PASS, 13/13 Phase 6.15 Tests PASS, Build Thành Công)**.
- **Mục tiêu cốt lõi**:
  - Triển khai cơ chế lựa chọn chiến lược 3 cấp độ ưu tiên cho STARFRONT WORLD:
    1. **System Auto Strategy**: Đánh giá tất định, minh bạch dựa trên tỷ lệ thành công, biến động ổn định/đe dọa, ngữ cảnh Sector, tiêu hao tài nguyên & quân lực, và tổn thất. Phá vỡ thế hòa ổn định (score DESC -> chance DESC -> duration ASC -> id ASC).
    2. **Default Strategy Fallback**: Phương án dự phòng an toàn khi System Auto không đủ điều kiện hoặc bị tắt bởi cấu hình.
    3. **Player Choice Fallback**: Chuyển quyền quyết định cho Chỉ Huy khi cả 2 cấp trên không thể xử lý, không làm crash hoặc dừng simulator.
  - Tích hợp trọn vẹn vào **Events & Missions Board**, **Dual Results Hub**, **Operations Center ADMIN CP**, và **Động cơ Tick Engine**.
  - Bảo vệ tuyệt đối tính lũy đẳng (idempotent), bảo toàn lưu trữ `STARFRONT_WORLD_SAVE_V1` và bảo vệ phân hệ RPG Save V4.
- **Mục tiêu cốt lõi**:
  - **Bản Đồ Thiên Hà Toàn Màn Hình (`components/game/world/world-map.tsx`)**:
    * Hiển thị chuẩn xác mạng lưới 8 Sector thiên hà và 12 Tuyến Siêu Không Gian lấy trực tiếp từ `WorldState` và đồ thị `initial-state.ts`.
    * Phân cấp thẩm mỹ Sci-Fi: Chủ quyền lãnh thổ (VSS, The Void, Tranh Chấp, Trung Lập), 5 giai đoạn vòng đời (`stable`, `threatened`, `under_siege`, `lost`, `recovery`), và chỉ số Threat.
    * 4 Trạng thái tuyến đường: `open`, `hazardous`, `blocked`, `offline`.
    * Trực quan hóa đạo quân đang hành quân `in_transit` và vành đai khóa tác chiến `isLockedForCombat`.
    * Công cụ điều khiển Pan, Zoom (+/-), Căn giữa (Reset View) và Lưới tọa độ chiến thuật HUD.
    * Inspector chi tiết cho từng Sector: Lệnh chiến lược (`normal`, `defend`, `reinforce`, `attack`, `recover`), Nâng cấp công sự (0..5), xem tài nguyên/dân số/quân sự, liên kết sang Sector Operations, Quick Dispatch và buồng lái Đấu Trường.
  - **Khung Trực Quan Hóa Toàn Màn Hình (`components/game/world/world-fullscreen-overlay.tsx`)**:
    * Chế độ 100vw/100vh không viền với thanh tiêu đề HUD quân sự, chỉ số vĩ mô tóm tắt.
    * Phím tắt `ESC` đóng nhanh chế độ toàn màn hình mượt mà, tích hợp modal điều quân nhanh `QuickDispatchDock`.
  - **Đồng Bộ Điều Hướng Trong Operations Center & Starfront Shell**:
    * Tab `map` trong Operations Center và submenu `map` trong `starfront-shell.tsx`.
    * Chuyển đổi hai chiều giữa Bản Đồ và Sector Operations mà không mất trạng thái.
  - **Bộ Kiểm Thử E2E Toàn Diện (`tests/world/e2e-world-integration.test.ts`)**:
    * 9/9 Subtests E2E PASS kiểm chứng đầy đủ: Load map, Inspector tương tác, Routing hợp lệ & chặn Blocked, Khóa combat chống xuất quân, Tiến 1 ngày Tick Engine, Vòng đời sự kiện Idempotency, Combat Adapter kết quả kép, Lưu & Nạp bền vững `STARFRONT_WORLD_SAVE_V1`, và Zero-Regression Schema v4 RPG.

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.9

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Vector Map Rendering (8 Sectors, 12 Routes) | **Đã hoàn thành (Done)** | `components/game/world/world-map.tsx` |
| Route Status Styling (Open, Hazardous, Blocked, Offline) | **Đã hoàn thành (Done)** | `components/game/world/world-map.tsx` |
| In-Transit Fleets Visualization | **Đã hoàn thành (Done)** | `components/game/world/world-map.tsx` |
| Combat Lock Ring Indicator | **Đã hoàn thành (Done)** | `components/game/world/world-map.tsx` |
| Sector Detail Inspector & Strategic Orders | **Đã hoàn thành (Done)** | `components/game/world/world-map.tsx` |
| Pan & Zoom Controls + Reset View | **Đã hoàn thành (Done)** | `components/game/world/world-map.tsx` |
| 100vw/100vh Fullscreen Overlay & ESC Keydown | **Đã hoàn thành (Done)** | `components/game/world/world-fullscreen-overlay.tsx` |
| Tích hợp Tab Map & Fullscreen Toggle trong Operations Center | **Đã hoàn thành (Done)** | `components/game/world/operations-center.tsx` |
| Tích hợp Submenu Map trong Starfront Shell | **Đã hoàn thành (Done)** | `components/game/starfront-shell.tsx` |
| Bộ Kiểm Thử Hồi Quy Tích Hợp E2E (9/9 Subtests) | **Đã hoàn thành (Done)** | `tests/world/e2e-world-integration.test.ts` |
| Zero-Regression Toàn Diện 20 Test Suites | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
