# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## LỘ TRÌNH CHIẾN LƯỢC TIẾP THEO SAU PHASE 6.30

---

## 1. Trạng Thái Giai Đoạn Vừa Hoàn Thành

### Phase 6.30 — Strategic Galaxy Map & Command UX Enhancement
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (DONE)**.
- **Kết quả thực tế đã nghiệm thu**:
  - Giao diện Galaxy Map node-only chuẩn Sci-Fi Tactical Command với chiều sâu tinh vân mờ ảo và lưới tọa độ chiến thuật.
  - Map Legend chuẩn hóa mặc định **OFF**, có nút bật/tắt và lưu preference `localStorage`.
  - Node Details & Inspector chuẩn hóa mặc định **OFF** (chế độ Tổng Thể), nút chuyển đổi `Chế Độ: [Tổng Thể / Chi Tiết]` trên HUD và nút nổi `[Mở Bảng: <Sector>]`.
  - Bổ sung Mouse-Wheel Zoom và Double-Click Zoom trong giới hạn `[0.7x, 2.2x]`; loại trừ Drag-to-zoom để tránh xung đột cử chỉ.
  - Bổ sung War Room Strategic Situation Deck và dải cảnh báo P0/P1 có hành động thực tế (tiếp tục trận đấu suspended combat, duyệt sự kiện INIT, focus sector).
  - Bảo toàn 100% tọa độ hiển thị, hitbox, Save Schema V1 và RPG Save V4 (100% automated tests PASS, build & lint thành công).

---

## 2. Kế Hoạch Các Giai Đoạn Tiếp Theo (Roadmap Execution Order)

```
[Phase 6.30 (Hoàn thành)]
        │
        ▼
[Phase 6.31 — Mission Dispatch & Operations Archive]  ◄── (Kế hoạch sắp triển khai)
        │
        ▼
[Combat V2 Review — Đánh giá & Thiết kế kiến trúc]   ◄── (Phase review riêng, chưa viết mã)
        │
        ▼
[Phase 6.32 — Route Intelligence & Action Logs]       ◄── (Kế hoạch tương lai)
```

---

## 3. Chi Tiết Kế Hoạch Cho Từng Giai Đoạn

### 3.1. Phase 6.31 — Mission Dispatch & Operations Archive
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (DONE)**.
- **Kết quả thực tế đã nghiệm thu**:
  - **Giới hạn tham gia duy nhất**: Người chơi chỉ được trực tiếp chỉ huy tối đa **1** nhiệm vụ tại một thời điểm (`canPlayerJoinMission`, `playerJoinMission`, `playerWithdrawMission`, `getActivePlayerMission`). Ngăn chặn duplicate và xung đột vai trò.
  - **Cơ chế PREPARE & NPC Takeover**: Nhiệm vụ ở giai đoạn PREPARE tiếp tục nhận lực lượng đồn trú (`assignGarrisonForcesToMission`). Khi hết hạn PREPARE mà người chơi chưa tham gia, sĩ quan NPC cấp phó/đồn trú (`getEligibleNPCCommander`) tự động tiếp quản (`processPrepareExpirationsAndTakeovers`), chuyển sang PROCESSING để nhiệm vụ không bị đóng băng.
  - **Mô phỏng nhiệm vụ NPC-only với kết quả thực tế**: Động cơ `simulateAndResolveMission` mô phỏng tác chiến có kiểm soát dựa trên độ ổn định, Threat, quân đồn trú và tư cách chỉ huy; áp dụng biến động thực tế vào Threat, Stability, Casualties và Tài nguyên, đồng thời giải phóng quyền chỉ huy của người chơi.
  - **Hệ thống Objective chuẩn hóa tái sử dụng**: Hỗ trợ 6 hình thái nhiệm vụ: Patrol, Escort, Defend, Raid, Eliminate, Threat Containment (`createStandardObjective`), tích hợp tiêu chí thành công rõ ràng.
  - **Operations Archive có giới hạn (Bounded Retention)**: Lưu trữ 2 luồng kết quả độc lập (`eventResultsArchive` và committed combat trong `transactionJournal`), hỗ trợ cấu hình hạn ngạch quota động (`eventArchiveQuota`, `battleArchiveQuota`), cắt tỉa FIFO an toàn (`archiveEventResult`, `enforceOperationsArchiveQuotas`).
  - **Nhật ký dòng thời gian xác thực (Action Timeline)**: Ghi nhận đúng các bước chuyển đổi trạng thái thực (`created`, `participant_joined`, `participant_withdrawn`, `prepare_completed`, `npc_takeover`, `processing_started`, `objective_resolved`, `completed`, `failed`, `aborted`), không sinh timestamp giả hay spam per-tick.
  - **Giao diện Command Desk & Admin CP**: Tab "ĐIỀU PHỐI [DISPATCH]" trực quan trong `events-missions-board.tsx`, quản lý chỉ huy, tiếp quản, bổ sung quân, xem timeline và tạo lệnh điều phối mới; hiển thị quota badge trong `dual-results-hub.tsx`; thanh điều chỉnh quota trong Admin CP `admin-settings-modal.tsx`.
  - **Khế ước WORLD an toàn**: Bảo toàn 100% `STARFRONT_WORLD_SAVE_V1`, CRC32 checksum, cách ly Save V4, Transaction Journal, Safe Abort (`abortMissionDispatch`), và tính lũy đẳng (Idempotent Resolution).

---

### 3.2. Combat V2 Review — Đánh Giá & Thiết Kế Kiến Trúc (Phase Riêng / Chưa Triển Khai)
- **Mục tiêu cốt lõi**:
  - Đây là một phase **nghiên cứu & thiết kế độc lập**, tuyệt đối chưa can thiệp vào engine chiến đấu hay viết mã gameplay.
  - Toàn bộ nội dung phân tích chi tiết được quy định tại tài liệu: `docs/roadmap/COMBAT_V2_REVIEW.md`.
- **8 Trọng tâm thiết kế cần bàn thảo**:
  1. *Quy mô chiến đấu*: Phân cấp rạch ròi Unit, Squad (3-4 GEARs), Fleet chi viện và Strategic Garrison.
  2. *Quan hệ Quân số - Lực chiến - HP*: Ranh giới giữa sinh lực cá nhân của cỗ máy GEAR và lực lượng phụ trợ chiến lược.
  3. *Động lực học khi một GEAR bị loại*: Cập nhật hỏa lực, mất aura, tái phân bổ sát thương và điểm gãy đổ tinh thần.
  4. *Quản lý tổn thất*: 5 trạng thái nhân lực (Tử trận, Thương binh, Rút lui, Đào tẩu, Viện binh).
  5. *Bổ trợ chiến trường*: Hiệu ứng địa hình sector, công sự căn cứ (Fortification Barrier), pháo hạm chi viện (Orbital Broadside).
  6. *Mô phỏng tự động*: Thuật toán giải quyết từng vòng khi vắng người chơi hoặc NPC thay thế.
  7. *Khế ước tích hợp WORLD*: Save isolation (`STARFRONT_WORLD_SAVE_V1`), Transaction Journal idempotency, Encounter Snapshot freezing, và Safe Abort.
  8. *Kế thừa từ Combat V1*: Tái sử dụng Status Effects, Speed Initiative, Pilot Synergy và biểu đồ D3 Combat Efficiency mà không bị bó hẹp trong kiến trúc 1v1.
- **Nguyên tắc**: Giữ các quyết định mở cho thảo luận nhóm; không áp đặt công thức giả định hay quy mô cố định (ví dụ 1 người chơi + 29 NPC).

---

### 3.3. Phase 6.32 — Route Intelligence & Action Logs (Kế hoạch / Chưa Triển Khai)
- **Mục tiêu cốt lõi**:
  - **Route Cards trực quan**: Thẻ tuyến hiển thị rõ cấu trúc: `Điểm Đi` $\rightarrow$ `Hyperlane` $\rightarrow$ `Điểm Đến`, kèm trạng thái vận hành.
  - **Route Detail Modal chuyên sâu**: Hiển thị định danh tuyến, 2 đầu sector, trạng thái (`open`, `hazardous`, `blocked`, `offline`), thời gian di chuyển dự kiến, mức độ rủi ro và lưu lượng quân sự/hậu cần thực tế.
  - **Điều hướng Focus Route**: Nút định vị tự động đưa camera bản đồ căn giữa và làm nổi bật tuyến siêu không gian được chọn.
  - **Nhật ký hành động theo từng tuyến (Per-Route Action Logs)**:
    - Mặc định lưu trữ tối đa 100 bản ghi thay đổi trạng thái thực tế cho mỗi tuyến.
    - Cho phép cấu hình trần số lượng bản ghi trong ADMIN CP.
    - Áp dụng chính sách vòng lặp FIFO khi vượt ngưỡng giới hạn; tuyệt đối không xóa trạng thái tuyến hiện hành hay làm gián đoạn các đoàn quân đang hành quân.
- **Phạm vi phase hiện tại**: Không triển khai bất kỳ mã nguồn Route Intelligence nào trong lượt cập nhật tài liệu này.

---

## 4. Bảng Tổng Hợp Trạng Thái Các Phase Kế Tiếp

| Phase | Tên Phân Hệ | Trạng Thái Kỹ Thuật | Nhiệm Vụ Trọng Tâm |
|---|---|---|---|
| **Phase 6.30** | Strategic Galaxy Map & Command UX Enhancement | **HOÀN THÀNH (DONE)** | Chiều sâu không gian node-only, Legend/Details mặc định OFF, Wheel/Double-click zoom, War Room Situation Deck |
| **Phase 6.31** | Mission Dispatch & Operations Archive | **HOÀN THÀNH (DONE)** | 1 mission trực tiếp, PREPARE timeout NPC takeover, 6 objectives chuẩn hóa, Bounded Operations Archive & Action Timeline |
| **Combat V2 Review** | Architectural Review & Design Specification | **THIẾT KẾ (DESIGN ONLY / CHƯA TRIỂN KHAI)** | Đánh giá kiến trúc quy mô squad/fleet, quan hệ quân số - HP, mô phỏng NPC, khế ước WORLD (`COMBAT_V2_REVIEW.md`) |
| **Phase 6.32** | Route Intelligence & Action Logs | **KẾ HOẠCH (PLANNED / CHƯA TRIỂN KHAI)** | Route cards điểm đi - đến, Route Detail modal, focus tuyến, Action logs FIFO 100 bản ghi cấu hình AdminCP |
