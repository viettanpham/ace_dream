# STARFRONT WORLD — Báo Cáo Kiểm Toán UI/UX Tình Hình Toàn Cảnh & Sự Kiện (Phase 6.24A Audit)

> **Mã văn bản**: `STARFRONT-WORLD-6.24A-UX-AUDIT`  
> **Giai đoạn**: Phase 6.24A — Strategic Overview & Events UX Audit (Review Only)  
> **Trạng thái**: Đã hoàn thành kiểm toán chuyên sâu mã nguồn thực tế (Audit Complete)  
> **Nguyên tắc kỹ thuật**: **Chỉ kiểm toán & lập kế hoạch. Không sửa code, không thay đổi layout, không thêm component trong phase này.**

---

## 1. Hiện Trạng Thực Tế (Current State & Data Lineage)

### 1.1. Tab Tình Hình Toàn Cảnh (Strategic Overview)
Hiện đang nằm tại `components/game/world/operations-center.tsx` (dòng 1193–1546), gồm 5 khối hiển thị chính:

1. **Khối Niên Lịch & Chu Kỳ Nhật Dạ Thiên Hà (Chiếm 2/3 hàng trên cùng)**:
   - *Nguồn dữ liệu*: `getGameCalendarInfo(worldState.currentDay, dayFraction)`.
   - *Hiển thị*: Năm 00, Mùa thiên hà, Ngày trong tháng (X/30), Tên tháng, Tổng ngày (`currentDay`), Giờ trong ngày giả lập (HH:MM), Buổi (Sáng/Chiều/Tối/Đêm + mô tả), Trạng thái mô phỏng (Tạm dừng/Đang chạy), Đếm ngược giây còn lại đến tick kế tiếp, Thanh tiến trình chu kỳ ngày.
2. **Khối Giám Sát Trực Tiếp Sự Kiện & Nhiệm Vụ (Chiếm 1/3 hàng trên cùng)**:
   - *Nguồn dữ liệu*: `countActiveEventsByTier(worldState)` và `simulatorConfig.generator`.
   - *Hiển thị*: Tổng số sự kiện đang chạy / `maxGlobalActive`, phân bổ theo 3 tier kỹ thuật (`small`, `medium`, `large`), hạn chót gần nhất (`nearestDeadlineEvent`), nút xem sự kiện khẩn cấp (`urgentAttentionEvent`).
3. **Hàng Thẻ Đo Lường Vĩ Mô (Macro Gauges - 3 cột)**:
   - *Nguồn dữ liệu*:
     - Cột 1 (Mức Đe Dọa Thiên Hà): Trung bình cộng `threatLevel` của 8 sector (`avgThreat / 1000`) kèm thanh tiến trình 3 vùng (An toàn / Báo động / Nguy cấp).
     - Cột 2 (Chủ Quyền Lãnh Thổ): Đếm số sector theo chủ quyền (`vssCount`, `contestedCount`, `voidCount`) và thanh phân đoạn % kiểm soát.
     - Cột 3 (Nhân Khẩu Học VSS): `worldState.demographics.controlledTerritoryPopulation`, `nationalTotalPopulation`, `refugeesInTransit`, `civilianCasualties`, `avgStability`.
4. **Bảng Cảnh Báo Khẩn Cấp Thời Gian Thực (Active Situation Alerts - 2 cột)**:
   - *Nguồn dữ liệu*:
     - Cột trái: `sectorsList.filter(s => s.stage === "under_siege" || s.stage === "threatened")`.
     - Cột phải: `activeEventsList.filter(e => e.status === "INIT")` kèm nút "Xử Lý &rarr;".
5. **Nhật Ký Biến Động Chu Kỳ Gần Nhất (Tick Feedback Log)**:
   - *Nguồn dữ liệu*: Mảng chuỗi `lastTickLogs` sinh ra từ `executeWorldTick`.

### 1.2. Tab Sự Kiện & Nhiệm Vụ (Events & Missions Board)
Hiện đang nằm tại `components/game/world/events-missions-board.tsx` (1439 dòng mã), tổ chức theo kiến trúc:

1. **Thanh Lọc Chế Độ (BoardFilterMode)**: 5 tab con (`all`, `init`, `processing`, `chains`, `results`) kèm ô tìm kiếm theo từ khóa.
2. **Banner Tổng Hợp Biến Động Chu Kỳ (Tick Lifecycle Summary)**:
   - *Nguồn dữ liệu*: `lastEventsSummary` từ `executeWorldTick`, thông báo số lượng sự kiện tự động khóa (`autoLockedCount`) và số lượng hoàn tất (`resolvedCount`).
3. **Ma Trận Ra Quyết Định 2 Cột (Decision Matrix)**:
   - *Cột trái (5/12 cột) — Hàng Đợi Khẩn Cấp (Urgency Queue)*: Cuộn độc lập (cao 520–680px), sắp xếp ưu tiên theo `Deadline` &rarr; `Severity` &rarr; `ID`. Mỗi thẻ hiển thị: Icon trạng thái, Tên, Sector, Urgency Badge, Phương án mặc định/đã chọn, Thanh tiến trình % nếu đang `PROCESSING`, Cảnh báo nếu `autoSelectionFailureReason`.
   - *Cột phải (7/12 cột) — Bảng Phân Tích & Phê Chuẩn (Decision Panel)*:
     - Header briefing: Severity, Category, Tier, Deadline, Sector (kèm chủ quyền, ổn định, threat).
     - Khối Nguồn phê chuẩn (`player_choice`, `system_auto`, `default_fallback`).
     - Bàn so sánh phương án: Nút "System Auto Phê Chuẩn Ngay", danh sách các phương án (`availableStrategies`). Mỗi phương án có: Tên, Badge đề xuất/mặc định, Điểm số chiến lược (`scoreInfo.score`), Mô tả, Lưới 4 chỉ số (Thành công %, Thời gian, $\Delta$Stability, $\Delta$Threat), Chi phí tài nguyên & quân lực, Toggle giải thích điểm số, Nút phê chuẩn.
4. **Đồ Thị Chuỗi Nhiệm Vụ (Mission Chains Tree Flow)**:
   - Hiển thị các chuỗi nhiệm vụ nhiều bước (`nodesList`), trạng thái từng bước (`completed`, `active`, `pending_dispatch`, `locked`), cảnh báo hoãn dispatch do kẹt sector.
5. **Luồng Kết Quả Gần Đây (Recent Event Results Feed)**:
   - Trích xuất từ `worldState.eventResultsArchive`.

---

## 2. Các Vấn Đề UI/UX Phát Hiện (UX Problems Ranked P0 / P1 / P2)

### 2.1. Khu Vực Strategic Overview

| Vấn đề | Chi tiết kỹ thuật từ mã nguồn | Tác động thực tế | Xếp hạng |
|---|---|---|---|
| **Chiếm dụng không gian bởi thông tin trang trí** | Khối Niên lịch chiếm 2/3 hàng trên cùng (dòng 1203–1290). Trong khi đó, `currentDay`, mùa và đếm ngược đã có trên Tactical HUD. Hiển thị giờ giả lập (HH:MM) và chu kỳ nhật dạ chi tiết ở đây gây nhiễu thị giác nghiêm trọng. | Người chơi vào WORLD bị "ngợp" bởi đồng hồ cơ học thay vì nhìn thấy ngay bức tranh toàn cảnh chiến trường. | **P0** |
| **Thiếu hoàn toàn bức tranh Quân sự & Điểm nghẽn Hậu cần** | Overview không hiển thị Quân dự bị (`military.reserves`), Đạo quân đang di chuyển (`in-transit`), Thương binh (`woundedOrRepair`) hay các tài nguyên cạn kiệt (Food âm, Tiếp tế = 0). | Chỉ huy không phát hiện được khủng hoảng hậu cần hay thiếu quân cho đến khi vào từng tab con. | **P0** |
| **Không có vùng "Việc Cần Làm Tiếp Theo" (Actionable Triage)** | Không có danh sách ưu tiên hành động (Next Action Items) giúp người chơi biết ngay 3 việc khẩn cấp nhất cần giải quyết hôm nay. | Người chơi bị động, phải tự đọc và tổng hợp thông tin từ nhiều thẻ cảnh báo rời rạc. | **P1** |
| **Số liệu phân loại generator mang tính kỹ thuật nội bộ** | Khối 1/3 bên phải hiển thị số lượng sự kiện Small/Medium/Large theo cấu hình generator (dòng 1306–1325). | Người chơi không quan tâm phân loại engine nội bộ; họ chỉ quan tâm sự kiện nào đe dọa sector nào và bao nhiêu ngày nữa hết hạn. | **P1** |
| **Tương tác một chiều (Read-Only / Dead End)** | Thẻ cảnh báo sector bị vây hãm (dòng 1474–1489) chỉ hiển thị text thụ động, không có nút bấm nhảy sang War Room hay mở nhanh Quick Dispatch. | Buộc người chơi phải tự nhớ tên sector rồi click chuyển tab thủ công. | **P1** |
| **Số liệu nhân khẩu học thiếu tính chiến lược** | Cột Dân số (dòng 1429–1454) hiển thị 4 con số tĩnh lớn (hàng triệu người) nhưng không gắn với cảnh báo biến động hay nguy cơ mất điểm ổn định. | Trở thành widget lấp đầy khoảng trống hơn là công cụ ra quyết định. | **P2** |

### 2.2. Khu Vực Events & Missions

| Vấn đề | Chi tiết kỹ thuật từ mã nguồn | Tác động thực tế | Xếp hạng |
|---|---|---|---|
| **Mật độ thông tin quá dày, lạm dụng số liệu chấm điểm** | Cột Decision Panel nhồi nhét quá nhiều số liệu: Điểm chiến lược `+45đ`, lưới 4 chỉ số, chi phí 5 loại, toggle phân rã công thức... (dòng 926–1100). | Giao diện giống một công cụ kiểm toán dữ liệu quản trị (Data Audit Tool) hơn là bàn giao nhiệm vụ quân sự Sci-Fi. | **P1** |
| **Sự kiện PROCESSING chiếm dụng không gian của Decision Panel** | Khi bấm vào sự kiện `PROCESSING`, Decision Panel hiển thị lại toàn bộ thông tin cũ kèm thanh tiến trình (dòng 820–888) nhưng vô hiệu hóa toàn bộ nút hành động. | Chiếm dụng toàn bộ không gian của bảng ra quyết định; người chơi bấm vào không thể thao tác gì. | **P1** |
| **Chuỗi Nhiệm Vụ (Mission Chains) bị giấu dưới đáy trang** | Phân khu Chuỗi Nhiệm Vụ (dòng 1200–1353) bị đẩy xuống dưới cùng sau cả 2 cột Decision Matrix. | Người chơi hầu như không cuộn tới, bỏ lỡ các tuyến nhiệm vụ cốt truyện quan trọng của thiên hà. | **P1** |
| **Trùng lặp với Debriefing Drawer & War Room** | Luồng kết quả gần đây (`Recent Results Feed`) ở cuối trang trùng lặp 100% với `Debriefing Drawer` (Phase 6.20); thông tin Sector trong Briefing lặp lại Sector Inspector. | Phân mảnh luồng thông tin, làm phình to chiều cao trang không cần thiết. | **P2** |

---

## 3. Đề Xuất Bố Cục Mới Cho Strategic Overview (Proposed Overview Layout)

Mục tiêu: **Người chơi nắm trọn tình hình thiên hà và biết ngay việc cần làm trong vòng 5 giây.**

### 3.1. Sơ Đồ Bố Cục Văn Bản (3 Tầng Chiến Lược)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ STRATEGIC OVERVIEW // TRUNG TÂM TÌNH HÌNH TOÀN CẢNH                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [TẦNG 1: TÌNH TRẠNG THIÊN HÀ & RỦI RO CỐT LÕI (MACRO SITUATION DECK)]                  │
│ ┌──────────────────────────┬──────────────────────────┬──────────────────────────────┐ │
│ │ 1.1. CHỦ QUYỀN LÃNH THỔ  │ 1.2. MỨC ĐE DỌA VOID     │ 1.3. NĂNG LỰC QUÂN SỰ & HẬU CẦN│ │
│ │ • % Kiểm soát VSS        │ • Điểm Threat TB toàn cầu│ • Quân dự bị sẵn sàng chiến đấu│ │
│ │ • Sector bị vây hãm/mất  │ • Xu hướng biến động     │ • Đạo quân đang hành quân     │ │
│ │ • Tuyến đường bị cô lập  │ • Sector nguy cấp nhất   │ • Cảnh báo thiếu hụt (Food/..) │ │
│ └──────────────────────────┴──────────────────────────┴──────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [TẦNG 2: HÀNH ĐỘNG KHẨN CẤP TIẾP THEO (ACTIONABLE SITUATION TRIAGE)]                   │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 2.1. ĐIỂM NÓNG CHIẾN SỰ (HOTSPOTS)        │ 2.2. SỰ KIỆN SẮP QUÁ HẠN (DEADLINES)    │ │
│ │ • Sector đang bị vây hãm/tranh chấp       │ • Sự kiện INIT còn 0–1 ngày            │ │
│ │ • [Nút: Điều Quân Ngay] [Nút: War Room]   │ • [Nút: Phê Chuẩn Nhanh] [Nút: Xem CT] │ │
│ └───────────────────────────────────────────┴────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [TẦNG 3: NHỊP ĐIỆU CHIẾN LƯỢC & BIẾN ĐỘNG GẦN NHẤT (OPERATIONAL PULSE)]                │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 3.1. TIẾN TRÌNH THỜI GIAN THỰC            │ 3.2. TÓM TẮT TICK GẦN NHẤT             │ │
│ │ • Ngày game & Buổi trong ngày (gọn gàng)   │ • 3–4 dòng tóm tắt biến động vừa qua   │ │
│ │ • Đếm ngược tick kế tiếp                   │ • Số báo cáo mới trong Debriefing      │ │
│ └───────────────────────────────────────────┴────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Nguồn Dữ Liệu & Hành Động Chi Tiết Cho Từng Khối

1. **Khối 1.1 — Chủ Quyền & Tuyến Đường**:
   - *Dữ liệu*: `sectorsList` (`vssCount`, `contestedCount`, `voidCount`), `worldState.routes` (đếm số tuyến `blocked` hoặc `hazardous`).
   - *Lợi ích*: Thấy ngay tỷ lệ kiểm soát và liệu có tuyến tiếp tế nào bị The Void cắt đứt không.
2. **Khối 1.2 — Mức Đe Dọa & Điểm Nóng**:
   - *Dữ liệu*: `avgThreat`, sector có threat cao nhất (`maxThreatSector`).
   - *Lợi ích*: Xác định ngay khu vực tiền tuyến nóng bỏng nhất.
3. **Khối 1.3 — Năng Lực Quân Sự & Hậu Cần (MỚI)**:
   - *Dữ liệu*: `worldState.military` (`reserves`, `deployed`, `inTransit`), `worldState.resources` (kiểm tra `food <= 0` hoặc `logisticsSupplies < 50`).
   - *Lợi ích*: Ngăn chặn tình trạng cạn kiệt lương thực hoặc thiếu quân dự bị mà không hề hay biết.
4. **Khối 2.1 — Điểm Nóng Cần Xử Lý Ngay (Triage Hotspots)**:
   - *Dữ liệu*: `sectorsList.filter(s => s.stage === "under_siege" || s.stage === "threatened" || s.isLockedForCombat)`.
   - *Hành động trực tiếp*: Bấm vào thẻ sector &rarr; nhảy thẳng sang War Room và chọn đúng sector đó; nút "Điều Quân" mở trực tiếp Quick Dispatch Dock.
5. **Khối 2.2 — Sự Kiện Sắp Quá Hạn (Urgent Deadlines)**:
   - *Dữ liệu*: `activeEventsList.filter(e => e.status === "INIT")`, xếp theo deadline gần nhất.
   - *Hành động trực tiếp*: Nút "⚡ Phê chuẩn System Auto" ngay tại chỗ (không cần chuyển tab); nút "Xem & Chi tiết" mở tab Events.

---

## 4. Đề Xuất Bố Cục Mới Cho Events & Missions (Proposed Events Layout)

Mục tiêu: **Biến Bảng Sự Kiện thành Bàn Tác Tác Chiến Tinh Gọn (Tactical Command Desk), phân tách rõ giữa Ra Quyết Định và Theo Dõi Tiến Độ.**

### 4.1. Sơ Đồ Bố Cục Văn Bản (Streamlined Command Desk)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ EVENTS & MISSIONS COMMAND DESK                                                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [THANH BỘ LỌC CHIẾN LƯỢC // QUICK FILTER TABS]                                         │
│ [★ Cần Quyết Định (INIT: 3)]  [⏳ Đang Xử Lý (PROC: 2)]  [☵ Chuỗi Nhiệm Vụ (Chains: 1)]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ BỐ CỤC 2 CỘT TÁC CHIẾN (CHỈ DÀNH CHO TAB INIT & PROCESSING):                           │
│ ┌──────────────────────────────────────┬─────────────────────────────────────────────┐ │
│ │ CỘT TRÁI (40%): DANH SÁCH KHẨN CẤP   │ CỘT PHẢI (60%): BÀN PHÊ CHUẨN CHIẾN LƯỢC    │ │
│ │ • Nhóm theo Deadline (Hôm nay / Còn) │ • Briefing súc tích: Mục tiêu & Rủi ro      │ │
│ │ • Thẻ gọn: Tiêu đề + Sector + Hạn chót│ • Sector liên quan & Tình trạng đồn trú     │ │
│ │ • Huy hiệu rõ ràng: Tối Nguy / Cảnh Báo│ • SO SÁNH 2–3 PHƯƠNG ÁN (Dạng Thẻ Nén):      │ │
│ │ • Indicator: Đang chờ / Đang chạy    │   - Tên & Tỷ lệ thành công (%)              │ │
│ │                                      │   - Chi phí tài nguyên (Icon gọn)           │ │
│ │                                      │   - Tác động: ΔThủ, ΔThreat                │ │
│ │                                      │   - [Nút: Phê Chuẩn Phương Án Này]          │ │
│ │                                      │ • Nút tắt: "⚡ Phê Chuẩn Đề Xuất System Auto"│ │
│ └──────────────────────────────────────┴─────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ KHI CHỌN TAB "CHUỖI NHIỆM VỤ" (CHAINS):                                                │
│ └─ Hiển thị dạng Toàn Màn Hình (Full Width Pipeline) thay vì nhồi nhét dưới đáy:      │
│    • Mỗi chuỗi là 1 Banner chiến dịch lớn                                              │
│    • Lộ trình ngang (Horizontal Stepper): Bước 1 (Xong) → Bước 2 (Đang chạy) → Bước 3  │
│    • Rõ ràng trạng thái: Đang tác chiến / Chờ giải vây Sector                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Các Tinh Chỉnh Trọng Tâm
1. **Lược bỏ số liệu chấm điểm phức tạp**: Ẩn các con số điểm trừu tượng (`+45đ`, `+12đ`) vào tooltip giải thích; giao diện chính chỉ hiển thị huy hiệu: `★ Đề Xuất Tối Ưu`, `Tỷ lệ thành công: 85%`, `Chi phí: 50 Vật Liệu`.
2. **Xử lý riêng sự kiện PROCESSING**: Khi chọn sự kiện đang chạy, Cột phải hiển thị dưới dạng "Bản Tin Trực Tiếp (Live Status Monitor)" tinh gọn: Thời gian còn lại, tỷ lệ hoàn tất, và nút mở nhật ký hoặc huỷ (nếu có hỗ trợ), không lặp lại form so sánh phương án.
3. **Đưa Chuỗi Nhiệm Vụ thành Chế Độ Xem Cấp 1 (First-Class Tab View)**: Khi người chơi chọn tab "Chuỗi Nhiệm Vụ", ẩn 2 cột Decision Matrix và hiển thị toàn màn hình sơ đồ tiến trình chiến dịch (Horizontal Stepper), giúp theo dõi cốt truyện liền mạch.
4. **Loại bỏ Feed Kết Quả Trùng Lặp**: Xóa khối Recent Results Feed ở đáy trang; toàn bộ lịch sử hoàn tất được chuyển quyền truy cập duy nhất vào `Debriefing Drawer` (Phase 6.20).

---

## 5. Kiểm Tra Tính Toàn Vẹn WORLD Combat (Combat Integrity Findings)

Kiểm tra đối chiếu các đường đi thực tế từ `components/game/combat-arena.tsx`, `components/game/world/operations-center.tsx`, `components/game/starfront-shell.tsx` và `lib/game/world/combat-adapter.ts`:

| Đường đi tương tác | Trạng thái kỹ thuật | Bằng chứng từ mã nguồn thực tế | Đánh giá an toàn |
|---|---|---|---|
| **1. Khóa Sector & Xuất Kích** | **ĐÃ XÁC MINH (Verified)** | `operations-center.tsx` (dòng 652–675): Gọi `lockEncounterAndCreateSnapshot`, khóa đồn trú, lưu `isSuspendedCombat = true`, snapshot vào Save V1 trước khi chuyển scene. | Tuyệt đối an toàn. Ngăn chặn mở trận thứ 2 khi sector đã khóa. |
| **2. Chiến Thắng (Victory)** | **ĐÃ XÁC MINH (Verified)** | `combat-arena.tsx` (dòng 1007–1024): `worldCommittedRef.current` chặn lặp; gọi `commitCombatResultReceipt` cập nhật Threat, Stability, Thưởng tài nguyên, mở khóa sector, xóa `isSuspendedCombat`. | Tuyệt đối an toàn. Idempotent và không ghi đè vào RPG Save V4. |
| **3. Thất Bại (Defeat)** | **ĐÃ XÁC MINH (Verified)** | `combat-arena.tsx` (dòng 1061–1078): Commit thất bại, giảm ổn định, tăng threat, thương vong đồn trú rút lui, mở khóa sector an toàn. | Tuyệt đối an toàn. Không phạt trừ vào RPG Save V4. |
| **4. Hủy Bỏ An Toàn (Safe Abort)** | **ĐÃ XÁC MINH (Verified)** | `combat-arena.tsx` (dòng 729–746) & `combat-adapter.ts` (dòng 400–461): Gọi `abortSuspendedCombat`, hoàn trả 100% đồn trú, mở khóa sector, chuyển status journal thành `aborted`, xóa `isSuspendedCombat`. | Tuyệt đối an toàn. Hoàn trả nguyên vẹn đồn trú, zero phạt. |
| **5. Rút Lui Thất Bại (Tactical Retreat)** | **CÓ DẤU HIỆU RỦI RO NHẸ (Idempotency-Mitigated)** | `combat-arena.tsx` (dòng 749–764): Gọi `commitCombatResultReceipt` lần 1 trong click handler, sau đó set `status: "defeat"`. Khi status đổi, `useEffect` dòng 1058 tiếp tục kích hoạt lần 2 vì `worldCommittedRef.current` chưa được set thành `true` trong handler rút lui. Mặc dù bộ lọc `isTransactionCommitted` (dòng 210 `combat-adapter.ts`) đã ngăn chặn thành công việc trừ phạt 2 lần (`alreadyCommitted: true`), nhưng đây là một "double-invocation" về mặt logic component cần được dọn dẹp triệt để. | Rủi ro thấp (đã có chốt chặn ở Adapter), nhưng nên đồng bộ `worldCommittedRef.current = true` ngay trong handler. |
| **6. Khôi Phục Sau Reload (Resume)** | **ĐÃ XÁC MINH (Verified)** | `operations-center.tsx` (dòng 1089–1131): Banner phát hiện trận dở dang xuất hiện ngay khi mount nếu `isSuspendedCombat === true`. Cung cấp 2 nút: "Tiếp Tục Tác Chiến &rarr;" và "Hủy Bỏ An Toàn". Đã có test case automated PASS (test #7). | Hoạt động chính xác và bảo toàn trạng thái qua reload. |
| **7. Hoàn Tất & Trở Về War Room** | **ĐÃ XÁC MINH (Verified)** | `combat-arena.tsx` (dòng 2501–2505, 2577–2581): Nút gọi `onWorldCombatComplete` &rarr; Shell xóa `activeWorldBattle = null` &rarr; chuyển section về `world` &rarr; `OperationsCenter` remount và nạp state mới nhất từ `loadWorldState()`. | Dòng điều hướng chuẩn xác, không mất dữ liệu. |

---

## 6. Lộ Trình Triển Khai Đề Xuất (Implementation Roadmap)

Để đảm bảo an toàn tuyệt đối và không gây xáo trộn hệ thống, khuyến nghị chia thành 2 phase nhỏ:

### Phase 6.24: Tái Cấu Trúc Strategic Overview (Situation Deck Redesign)
- **Phạm vi**: Chỉ tái cấu trúc tab `overview` trong `components/game/world/operations-center.tsx`.
- **Nội dung thực hiện**:
  1. Thu gọn khối Niên lịch cồng kềnh thành thẻ tóm tắt nhỏ gọn (tránh lặp lại với Tactical HUD).
  2. Bổ sung Widget Năng Lực Quân Sự & Hậu Cần (Quân dự bị, Hành quân, Cảnh báo Lương thực/Tiếp tế).
  3. Xây dựng Bảng Điểm Nóng & Hành Động Tiếp Theo (Actionable Triage) với các nút tương tác trực tiếp (Nhảy sang War Room, Mở Quick Dispatch, Phê chuẩn nhanh sự kiện).
  4. Đồng bộ hóa cờ `worldCommittedRef.current = true` trong handler Tactical Retreat của `CombatArena` để xóa triệt để cảnh báo double-invocation.
- **Tiêu chí hoàn thành**:
  - Người chơi nắm được toàn bộ tình hình quân sự, kinh tế và điểm nóng trong 5 giây.
  - 100% các nút điều hướng chuyển đúng tab và mở đúng modal/sector.
  - Giữ nguyên 100% save schema và logic engine. Toàn bộ 33 test suites PASS.

### Phase 6.25: Tinh Gọn Events & Missions Board (Streamlined Command Desk)
- **Phạm vi**: Tối ưu hóa `components/game/world/events-missions-board.tsx`.
- **Nội dung thực hiện**:
  1. Tách biệt giao diện: Tab INIT (Ra quyết định), Tab PROCESSING (Theo dõi tiến độ), Tab CHAINS (Toàn màn hình Stepper).
  2. Tinh giản mật độ thông tin ở Decision Panel: Ẩn số điểm trừu tượng, làm nổi bật tỷ lệ thành công và tác động thực tế.
  3. Loại bỏ khối Recent Results Feed ở đáy trang (hợp nhất với Debriefing Drawer).
- **Tiêu chí hoàn thành**:
  - Giao diện trực quan, rõ ràng, giảm 40% chiều cao cuộn trang.
  - Chuỗi nhiệm vụ hiển thị toàn diện dạng pipeline. Toàn bộ 33 test suites PASS.

---

## 7. Đánh Giá Các Hạng Mục Hoãn Lại (Deferred Items Assessment)

1. **Map Zoom Controls & Map Search Bar**:
   - *Đánh giá*: **HOÃN LẠI (Deferred)**.
   - *Lý do*: Phase 6.22 đã giải quyết triệt để hitbox to ($140 \times 88\text{px}$) và pointer drag threshold. Người chơi đã có thể zoom/pan bằng chuột và click chính xác ngay cả ở mức zoom nhỏ nhất ($0.7\times$). Bản đồ hiện chỉ có 8 sector canonical, việc bổ sung thanh tìm kiếm (Search Bar) là chưa cần thiết ở quy mô này.
2. **Tactical Alerts (Thanh thông báo trượt riêng)**:
   - *Đánh giá*: **TÍCH HỢP TRỰC TIẾP VÀO OVERVIEW (Merged into Overview Triage)**.
   - *Lý do*: Thay vì tạo thêm một component thanh trượt thông báo độc lập làm rối giao diện, các cảnh báo khẩn cấp nên nằm gọn trong tầng Triage của Strategic Overview mới.
3. **Mission Log (Nhật ký nhiệm vụ độc lập thứ ba)**:
   - *Đánh giá*: **HOÃN LẠI / KHÔNG TRIỂN KHAI (Deferred/Canceled)**.
   - *Lý do*: Hiện tại hệ thống đã có `Debriefing Drawer` (Phase 6.20) và `Dual Results Hub` (Phase 6.12) truy xuất trực tiếp từ `eventResultsArchive` và `transactionJournal`. Việc tạo thêm một phân hệ Mission Log thứ ba sẽ gây dư thừa và nhầm lẫn cho người chơi.

---

## 8. Khuyến Nghị Cuối Cùng (Final Recommendation)

> **KHUYẾN NGHỊ: NÊN TRIỂN KHAI CẢI TIẾN STRATEGIC OVERVIEW (PHASE 6.24) TRƯỚC.**
> 
> **Lý do**:
> 1. **Giá trị tiếp cận đầu tiên (First Impression)**: Overview là tab mặc định đập vào mắt người chơi khi mở Trung tâm Chỉ huy WORLD. Một Overview trực quan, tập trung vào điểm nóng và hành động tiếp theo sẽ giải quyết ngay cảm giác "mất phương hướng" của người chơi.
> 2. **Định hướng luồng hành động**: Khi Overview chỉ rõ điểm nóng quân sự và sự kiện khẩn cấp kèm nút bấm tương tác, nó sẽ dẫn dắt người chơi sang đúng War Room hoặc Events một cách tự nhiên.
> 3. **Events & Missions đã tương đối ổn định**: Sau Phase 6.19, bảng sự kiện đã có kiến trúc 2 cột chạy an toàn và đủ chức năng; việc tinh gọn mật độ hiển thị ở Events nên là bước hoàn thiện tiếp theo (Phase 6.25) sau khi "Bộ mặt toàn cảnh" Overview đã đạt chuẩn.
> 
> **Phạm vi gói gọn cho phase triển khai đầu tiên (Phase 6.24)**:
> - Tái cấu trúc tab `overview` trong `operations-center.tsx`: Thu nhỏ Niên lịch &rarr; Bổ sung Thẻ Quân sự/Hậu cần &rarr; Thiết lập Bảng Điểm nóng & Hành động tiếp theo (Actionable Triage) tương tác trực tiếp.
> - Khắc phục cảnh báo double-commit nhẹ trong `handleConfirmTacticalRetreat` tại `combat-arena.tsx`.
