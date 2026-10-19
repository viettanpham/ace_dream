# BÁO CÁO KIỂM ĐỊNH GIAO DIỆN STARFRONT WORLD
## Toàn Diện 5 Phân Hệ Chiến Lược, Bản Đồ Thiên Hà & Hệ Thống HUD
*Tài liệu kiểm định dành cho người đánh giá không thể xem ảnh chụp màn hình (Headless / Text-Based UI Audit)*  
*Mã đối chiếu: STARFRONT-WORLD-UI-REVIEW-2026*  
*Trạng thái: Đã kiểm định trực tiếp mã nguồn thực tế (Code-Verified)*

---

## MỤC LỤC
1. [Phương Pháp Kiểm Định & Phạm Vi Khảo Sát](#1-phương-pháp-kiểm-định--phạm-vi-khảo-sát)
2. [Cấu Trúc Điều Hướng Chung & Thanh Chỉ Huy Toàn Cục](#2-cấu-trúc-điều-hướng-chung--thanh-chỉ-huy-toàn-cục)
3. [Kiểm Định Chi Tiết 5 Tab Chiến Lược](#3-kiểm-định-chi-tiết-5-tab-chiến-lược)
   - [Tab 1: Tình Hình Chiến Lược (overview)](#tab-1-tình-hình-chiến-lược-overview)
   - [Tab 2: Bản Đồ Thiên Hà (map)](#tab-2-bản-đồ-thiên-hà-map)
   - [Tab 3: Mạng Lưới Sector (sectors)](#tab-3-mạng-lưới-sector-sectors)
   - [Tab 4: Sự Kiện & Nhiệm Vụ (events)](#tab-4-sự-kiện--nhiệm-vụ-events)
   - [Tab 5: Quân Sự & Hậu Cần (military)](#tab-5-quân-sự--hậu-cần-military)
   - [Tab Phụ: Trung Tâm Kết Quả Kép (results)](#tab-phụ-trung-tâm-kết-quả-kép-results)
4. [Đánh Giá Chuyên Sâu Bản Đồ Thiên Hà, HUD & Inspector](#4-đánh-giá-chuyên-sâu-bản-đồ-thiên-hà-hud--inspector)
5. [Cửa Sổ Nổi & Chế Độ Toàn Màn Hình](#5-cửa-sổ-nổi--chế-độ-toàn-màn-hình)
6. [Ma Trận Đối Chiếu Mã Nguồn UI Với WORLD_DESIGN.md](#6-ma-trận-đối-chiếu-mã-nguồn-ui-với-world_designmd)
7. [Tổng Hợp Điểm Mạnh, Hạn Chế & Đề Xuất Cải Tiến Trực Quan](#7-tổng-hợp-điểm-mạnh-hạn-chế--đề-xuất-cải-tiến-trực-quan)

---

## 1. Phương Pháp Kiểm Định & Phạm Vi Khảo Sát

Báo cáo này được lập dựa trên việc rà soát trực tiếp cấu trúc cây phần tử JSX/TSX, CSS classes (Tailwind CSS v4), hệ thống hooks, state reactivity và các luồng xử lý tương tác thực tế từ các module:
- `components/game/starfront-shell.tsx`: Vỏ bọc ứng dụng và định tuyến phân hệ `world`.
- `components/game/world/operations-center.tsx`: Trung tâm điều phối tác chiến vĩ mô và 5 tab chức năng.
- `components/game/world/world-map.tsx`: Khung nhìn SVG bản đồ đồ thị 8 sector, 12 tuyến đường, điều hướng pan/zoom, HUD và inspector.
- `components/game/world/world-fullscreen-overlay.tsx`: Chế độ hiển thị toàn màn hình 100vw x 100vh độc lập.
- `components/game/world/events-missions-board.tsx`: Bảng điều hành vòng đời sự kiện (INIT/PROCESSING) và cây nhiệm vụ đồ thị.
- `components/game/world/quick-dispatch-dock.tsx`: Bến điều động quân số và hạm đội chi viện nhanh.
- `components/game/world/dual-results-hub.tsx`: Trung tâm kết quả kép (sự kiện chiến lược & trận đánh buồng lái).
- `lib/game/world/types.ts`, `storage.ts`, `initial-state.ts`, `tick-engine.ts`, `event-engine.ts`, `mission-chains.ts`: Dữ liệu có thẩm quyền của thế giới.

**Nguyên tắc cam kết**: Mọi mô tả trong văn bản này phản ánh trung thực mã nguồn đang chạy trong dự án. Các tính năng chỉ có trong tài liệu thiết kế hoặc chưa được biểu diễn ra giao diện người dùng đều được ghi nhận rõ là *"chưa triển khai trong UI"*.

---

## 2. Cấu Trúc Điều Hướng Chung & Thanh Chỉ Huy Toàn Cục

### 2.1. Điểm Truy Cập Trong Hệ Thống Shell (`starfront-shell.tsx`)
- Phân hệ WORLD được tích hợp tại menu chính của ứng dụng với mã `id: "world"`, nhãn hiển thị `"Chỉ Huy Chiến Lược // WORLD"`, biểu tượng `Orbit`, có huy hiệu `Live`.
- Khi người chơi chọn `world`, Shell sẽ render `<OperationsCenter />` vào vùng nội dung chính (`<main className="min-w-0 flex-1 p-3 sm:p-5">`).
- Shell cung cấp thanh điều hướng phụ (submenu) gồm 6 mục: `overview`, `map`, `sectors`, `events`, `military`, `results`.

---

### 2.2. Thanh Chỉ Huy Chung Của Operations Center (`operations-center.tsx`)
Mọi tab của Operations Center đều được bao bọc bởi một Header toàn cục và Thanh tài nguyên vĩ mô nằm ở trên cùng, không bị ẩn khi chuyển tab:

#### Sơ Đồ Bố Cục Header & Resource Bar:
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [●] TỔNG HÀNH DINH TÁC CHIẾN // OPERATIONS CENTER [PHASE 6.8 LIVE]                    │
│     Trung tâm điều phối chiến lược thiên hà STARFRONT WORLD · Bộ Chỉ Huy Liên Minh VSS │
│                                                                                        │
│ [Status Pill: NGÀY #1 · KIỂM SOÁT: 5/8 VSS · THREAT TB: 449/1000]                      │
│ [Nút: Bản Đồ Fullscreen]  [Nút: Tiến 1 Ngày]  [Nút: Điều Quân Nhanh]  [Nút: Lưu]       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Vật Liệu: 2500] | [Năng Lượng: 2200] | [Vật Tư: 1480] | [Dữ Liệu: 880] | [Lương Thực: 3400] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Toast Thông Báo Hệ Thống - Tự động ẩn sau 4s] (Chỉ hiện khi có tác vụ)               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Dữ Liệu Chi Tiết:
1. **Tiêu đề & Trạng thái**:
   - Chấm tròn xanh phát xung nhịp (`animate-ping`).
   - Tiêu đề: `TỔNG HÀNH DINH TÁC CHIẾN // OPERATIONS CENTER`.
   - Huy hiệu `PHASE 6.8 LIVE`.
2. **Khối Quick Metrics (Pill Badge)**:
   - `NGÀY`: Lấy từ `worldState.currentDay` (font-bold text-cyan-400 text-sm).
   - `KIỂM SOÁT`: Đếm số sector có `sovereignty === "vss"` trên tổng số sector (`vssCount / sectorsList.length`).
   - `THREAT TB`: Trung bình cộng `threatLevel` của 8 sector (`avgThreat / 1000`). Màu sắc tự động đổi: `< 400` màu cyan, `400..699` màu hổ phách (amber), `>= 700` màu đỏ (red).
3. **Thanh 4 nút tác vụ nhanh (Quick Action Buttons)**:
   - **Bản Đồ Fullscreen**: Nút viền cyan, mở modal `WorldFullscreenOverlay` phủ trọn màn hình.
   - **Tiến 1 Ngày**: Nút nền cyan nổi bật, gọi hàm `handleAdvanceTick()`. Khi đang tính toán, hiển thị nhãn `"Đang Tính Toán..."` và khóa click (`opacity-50 cursor-wait`).
   - **Điều Quân Nhanh**: Nút viền vàng hổ phách, mở dock modal `QuickDispatchDock`.
   - **Lưu**: Gọi `handleManualSave()`, tính checksum CRC32 và lưu an toàn vào `STARFRONT_WORLD_SAVE_V1`.
4. **Thanh Tài Nguyên Toàn Cục (Global Resource Bar)**:
   - Bố cục lưới responsive: 2 cột trên di động, 5 cột trên màn hình desktop (`grid-cols-2 sm:grid-cols-5 gap-2`).
   - Gồm 5 ô thông số:
     * *Vật Liệu Công Nghiệp*: Biểu tượng `Boxes`, màu cyan, lấy từ `worldState.resources.industrialMaterials`.
     * *Năng Lượng Plasma*: Biểu tượng `Zap`, màu vàng amber, lấy từ `worldState.resources.energy`.
     * *Vật Tư Hậu Cần*: Biểu tượng `Truck`, màu chàm indigo, lấy từ `worldState.resources.logisticsSupplies`.
     * *Dữ Liệu Tác Chiến*: Biểu tượng `Database`, màu tím purple, lấy từ `worldState.resources.tacticalData`.
     * *Lương Thực Dân Sinh*: Biểu tượng `Wheat`, màu ngọc lục bảo emerald, lấy từ `worldState.resources.food`. Ô này nổi bật với viền xanh và chiếm 2 cột trên di động để nhấn mạnh vai trò thiết yếu.
5. **Thanh Toast Thông Báo (Notification Bar)**:
   - Xuất hiện có hiệu ứng mờ dần (`animate-fadeIn`), viền và nền thay đổi theo loại: `success` (xanh lá), `error` (đỏ), `info` (xanh lơ). Kèm nút đóng hình chữ `X`.

---

### 2.3. Thanh Điều Hướng 5 Tab Chức Năng
Nằm ngay dưới thanh tài nguyên, sử dụng thẻ `<nav>` chứa 6 nút tab:
- **Tab 1**: `overview` — **Tình Hình Chiến Lược** (`Activity`)
- **Tab 2**: `map` — **Bản Đồ Thiên Hà** (`Compass`)
- **Tab 3**: `sectors` — **Mạng Lưới Sector** (`Globe2`)
- **Tab 4**: `events` — **Sự Kiện & Nhiệm Vụ** (`Flame`), có badge số đếm sự kiện đang chờ nếu `> 0`.
- **Tab 5**: `military` — **Quân Sự & Hậu Cần** (`Swords`)
- **Tab Phụ**: `results` — **Trung Tâm Kết Quả Kép** (`Layers`), có badge `"Mới"` nếu có kết quả chưa đọc.

Trạng thái tab đang chọn được viền sáng cyan (`border-cyan-500/60 bg-cyan-950/80 text-cyan-300`), tab không chọn mang màu xám tối (`bg-zinc-900/60 text-zinc-400`).

---

## 3. Kiểm Định Chi Tiết 5 Tab Chiến Lược

---

### Tab 1: Tình Hình Chiến Lược (`overview`)

#### A. Cấu Trúc Và Bố Cục Thực Tế
Nằm trong container thẻ `div` dạng `space-y-4`. Gồm 3 khối dọc xếp tầng từ trên xuống:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [HÀNG 1: 3 THẺ KPI VĨ MÔ DẠNG THẺ (GRID 3 CỘT DESKTOP / 1 CỘT MOBILE)]                 │
│ ┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐ │
│ │ Cột 1: Mức Đe Dọa Thiên Hà│ │ Cột 2: Chủ Quyền Lãnh Thổ│ │ Cột 3: Dân Số VSS        │ │
│ │ - Điểm: 449 / 1000       │ │ - Tỷ lệ: 63% VSS         │ │ - Dân số VSS: 585,000     │ │
│ │ - Thanh Progress Gauge   │ │ - Segmented Bar:         │ │ - Lưới 4 chỉ số:          │ │
│ │   [=== An Toàn/Nguy Cấp] │ │   [VSS | Tranh Chấp |Void│ │   Tổng dân, Tị nạn,       │ │
│ │                          │ │ - Nhãn 3 phe             │ │   Thương vong, Ổn định TB │ │
│ └──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [HÀNG 2: BẢNG CẢNH BÁO CHIẾN LƯỢC KHẨN CẤP (GRID 2 CỘT)]                                │
│ ┌──────────────────────────────────────────┐ ┌──────────────────────────────────────┐ │
│ │ Cột Trái: Sector Bị Vây Hãm / Đe Dọa     │ │ Cột Phải: Sự Kiện Sắp Hết Hạn        │ │
│ │ - Mining K-7 (Threatened, Threat 360)    │ │ - Tên sự kiện, đếm ngược ngày        │ │
│ │ - Shadow Reach (Under Siege, Threat 760) │ │ - Nút bấm chuyển tab "Xử Lý ->"      │ │
│ └──────────────────────────────────────────┘ └──────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [HÀNG 3: NHẬT KÝ BIẾN ĐỘNG CHU KỲ GẦN NHẤT (Chỉ xuất hiện sau khi bấm "Tiến 1 Ngày")]   │
│ - Danh sách gạch đầu dòng các biến động Phase trong ngày vừa kết thúc                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### B. Nội Dung Nhìn Thấy Được & Nguồn Dữ Liệu
1. **Thẻ KPI 1: Mức Đe Dọa Thiên Hà**:
   - Dữ liệu: `avgThreat` / 1000.
   - Trực quan: Thanh tiến trình ngang (Progress Bar), nền xám `bg-zinc-900`, thanh lấp đầy đổi màu theo ngưỡng: xanh lơ cyan (`< 500`), vàng hổ phách amber (`500..749`), đỏ red (`>= 750`). Phía dưới có nhãn mốc `[0..250] An Toàn`, `[500] Báo Động`, `[750+] Nguy Cấp`.
2. **Thẻ KPI 2: Chủ Quyền Lãnh Thổ**:
   - Dữ liệu: Tỷ lệ % số sector thuộc VSS (`(vssCount / sectorsList.length) * 100`).
   - Trực quan: Thanh phân đoạn đa sắc (Segmented Bar) gồm 3 dải màu liên tiếp: Xanh lá (`bg-emerald-500` cho VSS), Vàng (`bg-amber-500` cho Tranh chấp), Đỏ (`bg-red-500` cho The Void). Phía dưới ghi rõ số lượng sector: `"5 VSS · 2 Tranh Chấp · 1 The Void"`.
3. **Thẻ KPI 3: Tình Trạng Nhân Khẩu Học**:
   - Dữ liệu chính: Dân số vùng kiểm soát (`worldState.demographics.controlledTerritoryPopulation.toLocaleString()`).
   - Trực quan: Lưới 2x2 hiển thị text có highlight màu:
     * Tổng dân số quốc gia: `worldState.demographics.nationalTotalPopulation`.
     * Đang sơ tán: `worldState.demographics.refugeesInTransit` (màu cyan).
     * Thương vong dân sự: `worldState.demographics.civilianCasualties` (màu đỏ).
     * Điểm ổn định xã hội trung bình: `avgStability / 100` (màu xanh lá).
4. **Bảng Cảnh Báo Khẩn Cấp (Active Situation Alerts)**:
   - Viền vàng hổ phách nổi bật (`border-amber-500/40 bg-zinc-950/80`).
   - Chia 2 cột:
     * *Cột trái*: Liệt kê các sector có `stage === "under_siege"` (viền đỏ `border-red-500/50`) hoặc `stage === "threatened"` (viền vàng `border-amber-500/40`). Hiển thị tên sector, giai đoạn và chỉ số Threat. Nếu không có sector nào bị đe dọa, hiển thị dòng xám: *"Phòng tuyến vững vàng: Không có sector nào đang bị vây hãm"*.
     * *Cột phải*: Liệt kê các sự kiện `INIT` đang đếm ngược ngày ra quyết định. Tính `daysLeft = decisionDeadlineTick - currentDay`. Nếu `daysLeft === 0`, hiển thị nhãn đỏ: *"Hạn chót hôm nay! Sẽ tự khóa mặc định."*. Kèm nút bấm `"Xử Lý →"` dẫn thẳng sang tab `events`.
5. **Nhật Ký Chu Kỳ (Tick Feedback Log)**:
   - Mặc định ẩn khi vừa vào game; chỉ xuất hiện sau khi người chơi bấm nút "Tiến 1 Ngày" ít nhất một lần.
   - Hiển thị tối đa 8 dòng log biến động thực tế từ `lastTickLogs` (thay đổi dân số, tài nguyên sản xuất, threat tăng giảm).

#### C. Trạng Thái & Trường Hợp Đặc Biệt
- **Trạng thái an toàn tuyệt đối**: Nếu tất cả sector đều ở mức `normal`, cột cảnh báo hiển thị hộp text xám thông báo không có nguy cơ.
- **Trạng thái nguy cấp**: Khi nhiều sector cùng bị bao vây, các thẻ cảnh báo đỏ xếp chồng lên nhau giúp người chơi nhận diện ngay mối đe dọa lớn nhất.

#### D. Điểm Mạnh & Hạn Chế
- **Điểm mạnh**: 3 thẻ KPI trên cùng rất dễ nắm bắt nhờ thanh bar trực quan; bảng cảnh báo phân loại rõ rệt giữa nguy cơ lãnh thổ (sector) và áp lực thời gian (sự kiện).
- **Hạn chế**: Khối nhân khẩu học vẫn là 4 dòng text đơn thuần trong bảng 2x2, chưa có biểu đồ tròn hoặc biểu đồ dòng người di tản; chưa có đồ thị đường (Line chart) biểu diễn xu hướng Threat qua các ngày.

---

### Tab 2: Bản Đồ Thiên Hà (`map`)

#### A. Cấu Trúc Và Bố Cục Thực Tế
Tab này render component `<WorldMap />` gói trọn trong một khung hình kích thước cố định `h-[640px]` với viền sáng `border-cyan-500/40 bg-zinc-950 shadow-2xl relative`.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [TOP STRATEGIC HUD BAR: NGÀY #1 | 8 Sectors · 12 Tuyến | VSS:63% Contested:25% Void:13%]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [MAP VIEWPORT CANVAS (SVG)]                                                            │
│                                                                                        │
│  [Top-Left Legend:                (Sector Node: Sol) ─── (Helios) ── (Mining K-7)      │
│   Chú giải bản đồ]                          \           /                 /            │
│                                           (Asteroid Delta) ── (Nebula Bastion)         │
│                                                     \        /       /                 │
│                                                 (Waypoint Orion) ── (Shadow Reach)     │
│                                                            \       /                   │
│                                                           (Tartarus Breach)            │
│                                                                                        │
│  [Bottom-Left Controls:                                [Right Drawer:                  │
│   (+) Zoom In                                           SECTOR INSPECTOR:              │
│   (-) Zoom Out                                          Thông số, Lệnh chiến lược,    │
│   (R) Reset View                                        Công sự, Điều quân, Combat]    │
│   (O) Căn giữa]                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

Chi tiết đánh giá chuyên sâu về cơ chế SVG, nodes, routes, inspector của Bản đồ xem tại [Mục 4: Đánh Giá Chuyên Sâu Bản Đồ Thiên Hà, HUD & Inspector](#4-đánh-giá-chuyên-sâu-bản-đồ-thiên-hà-hud--inspector).

---

### Tab 3: Mạng Lưới Sector (`sectors`)

#### A. Cấu Trúc Và Bố Cục Thực Tế
Được tổ chức theo cấu trúc lưới 2 phân vùng bất đối xứng: Cột trái chiếm 2/3 không gian màn hình, Cột phải chiếm 1/3 không gian màn hình (`grid grid-cols-1 lg:grid-cols-3 gap-4`).

```
┌─────────────────────────────────────────────────────────────┬──────────────────────────┐
│ CỘT TRÁI (2/3): DANH SÁCH 8 SECTOR THIÊN HÀ                  │ CỘT PHẢI (1/3):          │
│ Tiêu đề: "DANH SÁCH SECTOR THIÊN HÀ (8)"                    │ SECTOR INSPECTOR         │
│ Gợi ý: "Bấm vào sector để mở bảng điều khiển chi tiết"      │                          │
│                                                             │ [Tên Sector & ID]        │
│ Lưới 2 cột (sm:grid-cols-2 gap-2.5):                        │ [Mô tả bối cảnh]         │
│ ┌─────────────────────────┐ ┌─────────────────────────┐     │                          │
│ │ Thẻ Sol Command HQ      │ │ Thẻ Vành Đai Helios     │     │ [Banner Combat Lock]     │
│ │ - VSS (xanh lá)         │ │ - VSS (xanh lá)         │     │ (Nếu có)                 │
│ │ - Threat bar: 40/1000   │ │ - Threat bar: 150/1000  │     │                          │
│ │ - Stability: 95/100     │ │ - Stability: 88/100     │     │ [Bảng 6 chỉ số chi tiết: │
│ │ - Đồn trú: 550 quân     │ │ - Đồn trú: 380 quân     │     │  Chủ quyền, Giai đoạn,   │
│ │ - Giai đoạn: NORMAL     │ │ - Giai đoạn: NORMAL     │     │  Đồn trú, Công sự cấp N, │
│ └─────────────────────────┘ └─────────────────────────┘     │  Dân số, Lương thực]     │
│ ┌─────────────────────────┐ ┌─────────────────────────┐     │                          │
│ │ Thẻ Mining K-7          │ │ Thẻ Asteroid Delta      │     │ [Lệnh Chiến Lược Đồn Trú:│
│ │ - VSS · THREATENED      │ │ - VSS · NORMAL          │     │  5 nút chọn 1]           │
│ └─────────────────────────┘ └─────────────────────────┘     │                          │
│ ┌─────────────────────────┐ ┌─────────────────────────┐     │ [Gia Cố Công Sự (+1)]   │
│ │ Thẻ Nebula Bastion      │ │ Thẻ Waypoint Orion      │     │                          │
│ └─────────────────────────┘ └─────────────────────────┘     │ [Điều Quân Chi Viện]     │
│ ┌─────────────────────────┐ ┌─────────────────────────┐     │                          │
│ │ Thẻ Shadow Reach (Siege)│ │ Thẻ Tartarus (Lost/Void)│     │ [Xem Vị Trí Trên Bản Đồ] │
│ └─────────────────────────┘ └─────────────────────────┘     │                          │
│                                                             │ [Xuất Kích Buồng Lái]    │
│                                                             │ (Chỉ hiện khi bị đe dọa) │
└─────────────────────────────────────────────────────────────┴──────────────────────────┘
```

#### B. Nội Dung Nhìn Thấy Được & Nguồn Dữ Liệu
1. **Thẻ Sector ở Cột Trái**:
   - Header thẻ: Tên sector và huy hiệu chủ quyền (`VSS` màu xanh ngọc, `VOID` màu đỏ, `CONTESTED` màu vàng hổ phách).
   - Thanh Threat Level: Thanh tiến trình màu vàng cam hiển thị giá trị `threatLevel/1000`.
   - Thanh Stability: Thanh tiến trình màu xanh lục hiển thị giá trị `stability/100`.
   - Footer thẻ: Quân số đồn trú (`garrisonPower`), giai đoạn vòng đời (`stage`), và nhãn đỏ `Khóa Combat` kèm biểu tượng ổ khóa nếu `isLockedForCombat === true`.
   - Sector đang được chọn có viền sáng cyan và bóng mờ (`border-cyan-400 bg-cyan-950/30 shadow-md`).
2. **Inspector Sector ở Cột Phải**:
   - Bảng thông số: Gồm 6 ô hiển thị: Chủ quyền, Giai đoạn vòng đời, Quân đồn trú, Cấp công sự (`fortificationLevel` từ 1 đến 5), Dân số, Lương thực tồn kho tại chỗ (`resources.food`).
   - Cảnh báo Khóa Trận: Hộp thông báo viền đỏ cảnh báo sector đang giao tranh trực tiếp với buồng lái, quân số bị đóng băng.
   - **Tác vụ 1 — Lệnh Chiến Lược Đồn Trú (Strategic Order)**: Lưới 3 cột gồm 5 nút bấm: `Bình Thường (normal)`, `Cố Thủ (defend)`, `Tập Kết (reinforce)`, `Phản Công (attack)`, `Hồi Phục (recover)`. Bấm nút sẽ gọi `setSectorStrategicOrder()`, phát âm thanh click và cập nhật lưu trữ ngay lập tức.
   - **Tác vụ 2 — Nâng Cấp Công Sự (Fortification Upgrade)**: Nút bấm hiển thị chi phí `50 Materials`. Khi bấm sẽ tăng cấp công sự thêm 1 (tối đa cấp 5). Nút tự động vô hiệu hóa (`disabled`) nếu đã đạt cấp 5 hoặc người chơi không đủ 50 vật liệu.
   - **Tác vụ 3 — Điều Quân Chi Viện Cho Sector Này**: Mở dock `QuickDispatchDock` với sector đích được chọn sẵn. Nút bị khóa nếu sector đang bị combat lock.
   - **Tác vụ 4 — Xem Vị Trí Trên Bản Đồ Thiên Hà**: Chuyển ngay sang tab `map` với sector hiện tại đang được nhắm mục tiêu.
   - **Tác vụ 5 — Xuất Kích Can Thiệp Buồng Lái (Đấu Trường)**: Chỉ xuất hiện khi sector đang ở giai đoạn `under_siege`, `threatened` hoặc có `isLockedForCombat`. Nút có màu đỏ thẫm, icon `Swords` phát xung (`animate-pulse`), khi bấm sẽ gọi callback chuyển thẳng vào buồng lái chiến thuật (`CombatArena`).

#### C. Trạng Thái & Trường Hợp Đặc Biệt
- **Khi chưa chọn sector**: Inspector hiển thị dòng chữ căn giữa: *"Chọn một sector để xem chi tiết."* (mặc định khởi tạo luôn chọn `sol_command_hq`).
- **Khi sector bị khóa Combat**: Mọi nút điều quân và đổi lệnh chiến lược đều bị khóa xám (`disabled cursor-not-allowed`) để bảo toàn tính toàn vẹn dữ liệu.

#### D. Điểm Mạnh & Hạn Chế
- **Điểm mạnh**: Bố cục 2/3 và 1/3 phân định rất rõ ràng giữa duyệt danh sách và thao tác chi tiết; thanh tiến trình Threat và Stability trên từng thẻ giúp so sánh trực quan độ an nguy giữa 8 sector mà không cần đọc từng con số.
- **Hạn chế**: Không có bộ lọc danh sách (ví dụ: lọc riêng sector của VSS, lọc sector đang bị vây hãm); chưa có hiển thị các tuyến nối trực tiếp của sector ngay trên thẻ danh sách.

---

### Tab 4: Sự Kiện & Nhiệm Vụ (`events`)

Tab này được render thông qua component chuyên biệt `<EventsMissionsBoard />` (Phase 6.10 Redesign), thay thế toàn bộ cấu trúc danh sách phẳng trước đây.

#### A. Cấu Trúc Và Bố Cục Thực Tế
Gồm 4 phân mục lớn xếp tuần tự từ trên xuống, điều hướng thông qua thanh lọc trạng thái phía trên:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [HEADER BẢNG ĐIỀU HÀNH & THANH ĐẾM NHANH]                                              │
│ Tiêu đề: BẢNG ĐIỀU HÀNH SỰ KIỆN & CHUỖI NHIỆM VỤ CHIẾN LƯỢC                           │
│ Bộ đếm: [Cần Quyết Định: N] [Đang Xử Lý: M] [Chuỗi Nhiệm Vụ: K/8] [Nút: Dual Results]   │
│                                                                                        │
│ [Thanh Bộ Lọc: Tất Cả | Cần Phê Chuẩn [INIT] | Đang Triển Khai [PROCESSING] | Cây Nhiệm Vụ | Báo Cáo]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [BANNER TỔNG HỢP BIẾN ĐỘNG CHU KỲ (Chỉ xuất hiện sau khi tick có sự kiện kết thúc)]    │
│ - Cột 1: Sự kiện Tự Động Khóa Phương Án Mặc Định (hết hạn countdown)                   │
│ - Cột 2: Sự kiện Đã Giải Quyết Xong (kết quả thành công/thất bại)                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [PHÂN MỤC A: SỰ KIỆN CẦN PHÊ CHUẨN // INIT (Actionable Events)]                         │
│ - Sắp xếp: Ưu tiên hạn chót gần nhất -> Mức nghiêm trọng (critical > warning > info)  │
│ - Từng thẻ sự kiện gồm:                                                               │
│   * Huy hiệu khẩn cấp đa tín hiệu (Icon + Chữ + Viền đỏ nhấp nháy nếu hết hạn hôm nay) │
│   * Phân loại (Threat/Military/Economic/Anomaly), Tên sự kiện, Sector liên quan       │
│   * Nội dung diễn biến cốt truyện                                                     │
│   * Cảnh báo phương án mặc định sẽ tự động kích hoạt nếu bỏ lỡ deadline               │
│   * Lưới 3 cột các phương án đối ứng (Tên, Chi phí tài nguyên, Thời gian, Tỷ lệ %,    │
│     Nút "Phê Chuẩn Phương Án" - tự khóa nếu không đủ tài nguyên)                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [PHÂN MỤC B: SỰ KIỆN ĐANG TRIỂN KHAI // PROCESSING (In-Progress Events)]               │
│ - Lưới 2 cột các phương án đang chạy:                                                  │
│   * Tên sự kiện, Sector, Phương án đã chọn                                            │
│   * Thanh tiến độ trực quan % kèm ngày dự kiến hoàn tất                               │
│   * Huy hiệu chờ kết quả buồng lái nếu có trận đánh liên kết                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [PHÂN MỤC C: CÂY CHUỖI NHIỆM VỤ CHIẾN LƯỢC TOÀN DIỆN (Mission Chains Graph)]           │
│ - Hiển thị từng chuỗi nhiệm vụ đang hoạt động:                                         │
│   * Header: Topology (linear/branching/reactive), Tên chuỗi, Tiến trình bước N/M       │
│   * Đồ thị nút (Node Pipeline):                                                       │
│     [Bước 1: Hoàn tất (xanh lá)] -> [Bước 2: Đang tác chiến (cyan nhấp nháy)]          │
│     [Bước đặc biệt: Huy hiệu vàng "Đang chờ điều kiện sector" kèm số ngày hoãn]       │
│     [Bước 3: Bị khóa (xám, icon Lock, điều kiện tiên quyết)]                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [PHÂN MỤC D: BÁO CÁO KẾT QUẢ GẦN ĐÂY // RECENT RESULTS FEED]                           │
│ - Tối đa 5 bản ghi kết quả mới nhất từ Archive                                         │
│ - Huy hiệu Thành Công / Tự Động Khóa / Thất Bại, tóm tắt hậu quả, nút "Đánh dấu đã đọc"│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### B. Nội Dung Nhìn Thấy Được & Nguồn Dữ Liệu
1. **Thanh lọc và đếm nhanh**:
   - Nút `Cần Quyết Định: N`: Đổi màu vàng hổ phách nhấp nháy nếu `N > 0`.
   - Nút `Đang Xử Lý: M`: Màu xanh lơ cyan.
   - Nút `Chuỗi Nhiệm Vụ: K/8`: Hiển thị trần tối đa 8 chuỗi theo quy chuẩn Phase 6.7.
   - 5 nút lọc: `Tất Cả Tổng Hợp`, `Cần Phê Chuẩn [INIT]`, `Đang Triển Khai [PROCESSING]`, `Cây Chuỗi Nhiệm Vụ`, `Báo Cáo Gần Đây`.
2. **Phân cấp khẩn cấp Đa Tín Hiệu (Multi-Signal Urgency)**:
   - Hệ thống không dùng màu sắc làm tín hiệu duy nhất mà phối hợp 4 yếu tố:
     * *Biểu tượng*: `AlertOctagon` cho nguy cấp, `AlertTriangle` cho cảnh báo, `Clock` cho thông tin.
     * *Nhãn chữ rõ ràng*: `"HẾT HẠN HÔM NAY // TỰ ĐỘNG KHÓA"` hoặc `"CẤP BÁCH: TỐI NGUY (CRITICAL)"`.
     * *Hiệu ứng*: Viền đỏ nhấp nháy (`animate-pulse shadow-red-950`).
     * *Vị trí ưu tiên*: Sự kiện cấp bách nhất luôn nổi lên trên cùng danh sách.
3. **Lựa chọn Chiến Lược Đối Ứng**:
   - Hiển thị danh sách thẻ chiến lược từ `event.availableStrategies`.
   - Kiểm tra tài nguyên thời gian thực (`strat.cost` so với `worldState.resources`): Nếu thiếu tài nguyên, giá trị thiếu sẽ hiển thị chữ đỏ, nút chuyển thành `"Thiếu Tài Nguyên"` và bị khóa click.
   - Ghi rõ thời gian thực hiện (`strat.processingTicks` ngày) và tỷ lệ thành công (`strat.successChance%`).
4. **Cây Chuỗi Nhiệm Vụ (Mission Pipeline Nodes)**:
   - Mỗi chuỗi được bóc tách thành các bước tuần tự hoặc phân nhánh.
   - Trạng thái từng node được phân biệt bằng 4 kiểu hiển thị:
     * `completed`: Viền xanh lục `border-emerald-500/40`, icon `CheckCircle2`, huy hiệu `"Hoàn Tất"`.
     * `active` (đang tác chiến): Viền cyan sáng `border-cyan-500/70`, chấm tròn cyan nhấp nháy.
     * `active` nhưng bị xung đột sector (`isPendingDispatch === true`): Viền vàng hổ phách, icon `AlertTriangle`, mang huy hiệu **“Đang chờ điều kiện sector”** kèm thông tin cụ thể: *"Đã chờ X/5 ngày trước khi tự động giải tỏa an toàn"*.
     * `locked`: Khung mờ xám, icon `Lock`, hiển thị điều kiện mở khóa.

#### C. Trạng Thái & Trường Hợp Đặc Biệt
- **Khi không có sự kiện INIT**: Hiển thị hộp thông báo dịu mắt với icon `CheckCircle2`: *"Không có sự kiện khẩn cấp nào đang chờ quyết định. Mọi mặt trận đều ổn định."*
- **Khi không có chuỗi nhiệm vụ nào**: Hiển thị trạng thái rỗng tương ứng.
- **Khi có sự kiện vừa hết hạn qua đêm**: Banner tổng hợp chu kỳ màu chàm tím xuất hiện ngay đầu bảng, thông báo cụ thể sự kiện nào vừa tự động khóa và sự kiện nào vừa hoàn tất, ngăn chặn tình trạng hiện nhiều pop-up/toast gây nghẽn màn hình.

#### D. Điểm Mạnh & Hạn Chế
- **Điểm mạnh**: Cực kỳ mạch lạc; phân tách triệt để 3 pha vòng đời `INIT` -> `PROCESSING` -> `RESULT`; cây nhiệm vụ trực quan từng bước với huy hiệu giải thích rõ ràng khi bị hoãn dispatch do xung đột sector.
- **Hạn chế**: Cây phân nhánh (branching) hiện tại được biểu diễn dưới dạng lưới thẻ tuần tự có số thứ tự bước, chưa phải đồ thị dạng cây vẽ bằng SVG nối dây trực tiếp.

---

### Tab 5: Quân Sự & Hậu Cần (`military`)

#### A. Cấu Trúc Và Bố Cục Thực Tế
Nằm trong container `space-y-4`, gồm 3 khối nội dung xếp dọc:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [KHỐI 1: SỔ CÁI LỰC LƯỢNG QUÂN SỰ BẢO TOÀN (AUTHORITATIVE FORCE LEDGER)]                │
│ Tiêu đề: SỔ CÁI LỰC LƯỢNG QUÂN SỰ BẢO TOÀN · Tổng lực lượng: 2,750 quân                │
│ Lưới 5 cột phân loại quân lực:                                                         │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐ │
│ │Đang TriểnKhai│ │Dự Bị ChiếnLược││Thương Binh   │ │Đang Rút Lui  │ │Tổn Thất VĩnhViễn│ │
│ │ 1,950 quân   │ │ 600 quân     │ │ 150 quân     │ │ 50 quân      │ │ 0 quân         │ │
│ │ (Xám tối)    │ │ (Cyan viền)  │ │ (Vàng hổ phách││ (Xám)        │ │ (Đỏ viền)      │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [KHỐI 2: ĐẠO QUÂN ĐANG HÀNH QUÂN (IN-TRANSIT DEPLOYMENTS: N)]                          │
│ - Nếu không có đạo quân nào: Hộp text xám báo không có quân di chuyển                 │
│ - Nếu có: Danh sách thẻ hiển thị:                                                      │
│   * Số quân: "100 quân (sol_command_hq -> helios_perimeter)"                          │
│   * Lệnh chiến lược: [reinforce]                                                       │
│   * Thời gian: "Còn 1 ngày"                                                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [KHỐI 3: MẠNG LƯỚI TUYẾN SIÊU KHÔNG GIAN (12)]                                         │
│ Lưới 3 cột desktop / 1 cột mobile gồm 12 thẻ tuyến đường:                              │
│ ┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐   │
│ │ Tuyến r_sol_helios      │ │ Tuyến r_sol_delta       │ │ Tuyến r_helios_k7       │   │
│ │ [OPEN - xanh lá]        │ │ [OPEN - xanh lá]        │ │ [OPEN - xanh lá]        │   │
│ │ sol -> helios (1 ngày)  │ │ sol -> delta (2 ngày)   │ │ helios -> k7 (1 ngày)   │   │
│ │ Nguy hiểm: 5%           │ │ Nguy hiểm: 8%           │ │ Nguy hiểm: 14%          │   │
│ └─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘   │
│ ... (tổng cộng 12 thẻ tuyến)                                                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### B. Nội Dung Nhìn Thấy Được & Nguồn Dữ Liệu
1. **Sổ Cái Lực Lượng Quân Sự Bảo Toàn (Authoritative Force Ledger)**:
   - Dữ liệu lấy từ `worldState.military`.
   - Tính tổng quân số bằng hàm `calculateTotalMilitaryForce(worldState.military) = deployed + reserves + woundedOrRepair + retreating`.
   - Lưới 5 ô trạng thái:
     * `deployed`: Quân đang đồn trú tại các sector.
     * `reserves`: Quân dự bị tại hậu phương (ô có viền sáng cyan).
     * `woundedOrRepair`: Quân bị thương hoặc mecha đang sửa chữa (chữ vàng amber).
     * `retreating`: Quân đang rút chạy khỏi mặt trận thất thủ.
     * `casualties`: Tổn thất vĩnh viễn (viền đỏ `border-red-500/30 text-red-300`).
2. **Đạo Quân Đang Hành Quân (In-Transit Deployments)**:
   - Đếm số lượng từ `worldState.activeDeployments`.
   - Nếu rỗng: Hiển thị bảng xám: *"Hiện không có đạo quân nào đang di chuyển trên các tuyến siêu không gian."*
   - Nếu có: Từng dòng hiển thị rõ số lượng quân, sector xuất phát, sector đích đến, lệnh tác chiến (`reinforce`, `defend`...) và đếm ngược số ngày còn lại (`remainingDays`).
3. **Mạng Lưới Tuyến Siêu Không Gian (Hyperlane Routes)**:
   - Lấy danh sách từ `worldState.routes` (12 tuyến).
   - Mỗi thẻ tuyến hiển thị:
     * Mã định danh tuyến (`route.id`).
     * Huy hiệu trạng thái: `open` (viền xanh lá), `hazardous` (viền vàng amber), `blocked` (viền đỏ).
     * Chi tiết hành trình: Tên 2 đầu cầu, thời gian di chuyển (`distance` ngày), và mức rủi ro (`dangerLevel%`).

#### C. Trạng Thái & Trường Hợp Đặc Biệt
- **Khi quân số thay đổi sau trận đánh**: Các con số trong sổ cái cập nhật theo nguyên tắc bảo toàn, người chơi thấy rõ số quân bị thương chuyển sang ô `woundedOrRepair` thay vì biến mất bí ẩn.
- **Khi tuyến đường bị phong tỏa (`blocked`)**: Thẻ tuyến chuyển viền đỏ và hiển thị trạng thái phong tỏa.

#### D. Điểm Mạnh & Hạn Chế
- **Điểm mạnh**: Thể hiện triệt để nguyên tắc thiết kế C.2 của `WORLD_DESIGN.md` (bảo toàn quân số, minh bạch 5 trạng thái lực lượng); danh sách tuyến đường ghi rõ khoảng cách và tỷ lệ nguy hiểm.
- **Hạn chế**:
  * Các tuyến đường được hiển thị dưới dạng thẻ danh sách text, chưa có sơ đồ mạng lưới đồ thị trực quan (phần đồ thị nằm bên tab `map`).
  * Chưa có bảng thống kê thông lượng vận chuyển tài nguyên (Logistics throughput) và đoàn xe lương thực riêng biệt ngoài đoàn quân.

---

### Tab Phụ: Trung Tâm Kết Quả Kép (`results`)

Tab này được render thông qua component `<DualResultsHub />`.

#### A. Cấu Trúc Và Bố Cục Thực Tế
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [HEADER: TRUNG TÂM KẾT QUẢ KÉP // DUAL RESULTS HUB]                                    │
│ [Nút: Đọc Tất Cả]  [Nút: Xóa Lịch Sử An Toàn (Safe Pruning)]                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [THANH CHUYỂN PHÂN HỆ: Báo Cáo Sự Kiện (N) | Nhật Ký Trận Đánh Buồng Lái (M)]         │
│ [BỘ LỌC KẾT QUẢ: Tất Cả | Chưa Đọc | Thành Công | Thất Bại]                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [DANH SÁCH BÁO CÁO KẾT QUẢ CHI TIẾT (Archive Cards)]                                    │
│ - Từng thẻ kết quả:                                                                    │
│   * Huy hiệu trạng thái (Thành Công / Tự Động Khóa / Thất Bại)                         │
│   * Tiêu đề sự kiện, Sector, Ngày kết thúc                                            │
│   * Tóm tắt diễn biến & Thay đổi chỉ số (+/- Tài nguyên, +/- Threat, +/- Stability)     │
│   * Nút "Đánh dấu đã đọc"                                                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### B. Nội Dung Nhìn Thấy Được & Thao Tác
- Tách bạch 2 luồng dữ liệu độc lập:
  * **Luồng 1 (Báo Cáo Sự Kiện)**: Đọc từ `worldState.eventResultsArchive`.
  * **Luồng 2 (Nhật Ký Trận Đánh Buồng Lái)**: Đọc từ `worldState.transactionJournal` (chỉ lọc các giao dịch `type === "combat"` có status `committed`).
- **Thao tác Xóa Lịch Sử An Toàn (Safe Pruning)**: Gọi hàm `pruneReadEventResultsSafe()`. Nút này dọn dẹp sạch sẽ các bản ghi log đã đọc mà vẫn giữ nguyên vẹn 100% các giá trị chỉ số trong `WorldState`, giải tỏa dung lượng lưu trữ an toàn.

---

## 4. Đánh Giá Chuyên Sâu Bản Đồ Thiên Hà, HUD & Inspector

Bản đồ thiên hà trong `world-map.tsx` là phân hệ trực quan trung tâm của STARFRONT WORLD. Dưới đây là phân tích chi tiết từng tầng đồ họa và tương tác:

### 4.1. Khung Nhìn Toàn Cảnh & Bố Cục SVG Canvas
Bản đồ được vẽ trên một canvas SVG với không gian tọa độ chuẩn `viewBox="0 0 1000 650"`.
- **Hệ tọa độ & Nền chiến thuật**:
  * Lớp nền Gradient elip tối màu (`from-zinc-900/40 via-zinc-950 to-black`).
  * Lưới tọa độ chiến thuật mờ 20% (Tactical Grid) dạng ô vuông $60 \times 60 \text{px}$.
  * 3 vòng tròn radar chiến thuật đồng tâm (Tactical Radar Circles) kích thước 250px, 450px, 650px tạo cảm giác màn hình quét radar không gian sâu.
- **Bộ lọc phát sáng SVG Defs**:
  * `glow-cyan`: Bộ lọc làm mờ Gaussian mờ viền cho phe VSS.
  * `glow-red`: Bộ lọc phát sáng đỏ cho phe The Void.
  * `glow-amber`: Bộ lọc phát sáng vàng cho khu vực Tranh Chấp.

---

### 4.2. Biểu Diễn 8 Sector Thiên Hà (Sector Nodes)
8 Sector được định vị chính xác theo tọa độ phần trăm $(X\%, Y\%)$ quy đổi sang không gian $1000 \times 650$:

| ID Sector | Tên Hiển Thị | Tọa Độ $(X, Y)$ | Quyền Kiểm Soát (Sovereignty) | Threat | Giai Đoạn (Stage) |
|---|---|---|---|---|---|
| `sol_command_hq` | Tổng Hành Dinh Sol Command | $(16\%, 78\%)$ | `vss` (Xanh lơ) | 40 | `normal` |
| `helios_perimeter` | Vành Đai Helios | $(30\%, 66\%)$ | `vss` (Xanh lơ) | 150 | `normal` |
| `mining_outpost_k7` | Trạm Khai Mỏ K-7 | $(44\%, 82\%)$ | `vss` (Xanh lơ) | 360 | `threatened` |
| `asteroid_delta` | Vành Đai Tiểu Hành Tinh Delta | $(46\%, 52\%)$ | `vss` (Xanh lơ) | 240 | `normal` |
| `nebula_bastion` | Pháo Đài Nebula Bastion | $(62\%, 68\%)$ | `vss` (Xanh lơ) | 480 | `threatened` |
| `waypoint_orion` | Trạm Tiếp Vận Waypoint Orion | $(66\%, 44\%)$ | `contested` (Vàng) | 580 | `threatened` |
| `shadow_reach` | Tiền Duyên Shadow Reach | $(80\%, 76\%)$ | `contested` (Vàng) | 760 | `under_siege` |
| `tartarus_breach` | Khe Nứt Tartarus Breach | $(90\%, 48\%)$ | `void` (Đỏ) | 980 | `lost` |

#### Chi Tiết Đồ Họa Của Từng Node Sector:
1. **Vòng nền Sector**: Bán kính $R = 19\text{px}$ (khi được chọn mở rộng thành $R = 22\text{px}$ kèm viền đậm $2.5\text{px}$ và hiệu ứng đổ bóng phát sáng theo phe).
2. **Lõi trung tâm**: Chấm tròn bán kính $R = 8\text{px}$ mang màu phe phái.
3. **Hiệu ứng Stage Vòng Ngoài**:
   - Nếu `under_siege`: Xuất hiện vòng tròn nét đứt màu đỏ bán kính $R = 28\text{px}$ nhấp nháy (`animate-pulse`).
   - Nếu `threatened`: Xuất hiện vòng tròn nét đứt màu vàng hổ phách bán kính $R = 26\text{px}$.
4. **Tâm ngắm định vị chiến thuật (Tactical Targeting Reticle)**:
   - Khi một sector được chọn, xuất hiện một tâm ngắm quay tròn chậm (`animate-spin-slow`) bán kính $34\text{px}$ với 4 vạch ngắm góc chữ thập định vị chuẩn xác tọa độ mục tiêu.
5. **Huy hiệu Khóa Combat**:
   - Nếu `isLockedForCombat === true`, xuất hiện một hộp đỏ góc trên của sector mang biểu tượng ổ khóa `🔒` để người chơi nhận diện ngay sector đang bận giao tranh.
6. **Thẻ tên và Gauge Threat bên dưới Node**:
   - Thẻ hình chữ nhật nền đen mờ $130 \times 20\text{px}$ hiển thị tên sector.
   - Ngay dưới thẻ tên là một thanh đo Threat mini rộng $80\text{px}$, cao $3\text{px}$ với 3 dải màu: Xanh lá (`< 300`), Vàng (`300..699`), Đỏ (`>= 700`).

---

### 4.3. Biểu Diễn 12 Tuyến Siêu Không Gian (Hyperlane Routes Layer)
12 tuyến đường nối các đỉnh sector với nhau được vẽ bằng thẻ SVG `<line>`:
- **Tuyến Bình Thường (`open`)**: Nét liền màu xanh lơ (`#06b6d4`), độ mờ 85%, dày 1.8px.
- **Tuyến Nguy Hiểm (`hazardous`)**: Nét đứt (`strokeDasharray="6 4"`) màu vàng hổ phách (`#f59e0b`). Tại trung điểm tuyến có một vòng tròn vàng nhỏ chứa dấu chấm than `!`.
- **Tuyến Bị Phong Tỏa (`blocked`)**: Nét đứt dày màu đỏ (`#ef4444`). Tại trung điểm tuyến có vòng tròn đỏ chứa dấu nhân `×`.
- **Tuyến Ngoại Tuyến (`offline`)**: Nét đứt mờ màu xám tối (`#52525b`).
- **Hiệu ứng Tuyến Tiếp Giáp Đang Chọn**: Khi người chơi chọn một sector, tất cả các tuyến đường nối trực tiếp với sector đó sẽ sáng rực lên với viền ngoài phát sáng 5px và đường chính tăng độ dày lên 2.5px, giúp nhận diện ngay các hướng cơ động khả dụng.

---

### 4.4. Đạo Quân Đang Di Chuyển Trên Tuyến (In-Transit Deployment Fleets Layer)
Bản đồ hỗ trợ hiển thị vị trí thực của các hạm đội hành quân:
- Lấy dữ liệu từ `worldState.activeDeployments` có trạng thái `in_transit`.
- **Thuật toán tính tọa độ nội suy**:
  $$\text{progressRatio} = 1 - \frac{\text{remainingDays}}{\text{totalDistance}}$$
  $$\text{curX} = X_1 + (X_2 - X_1) \times \text{progressRatio}, \quad \text{curY} = Y_1 + (Y_2 - Y_1) \times \text{progressRatio}$$
- **Hiển thị đồ họa**:
  * Một điểm sáng xanh cyan phát xung kèm vòng tròn radar $10\text{px}$.
  * Thẻ gắn kèm hiển thị quân số: Ví dụ `[50 Q]` màu cyan trên nền đen.
  * Di chuyển tịnh tiến dần về phía sector đích sau mỗi lần bấm "Tiến 1 Ngày".

---

### 4.5. HUD Tổng Quan Trên Bản Đồ (Top HUD Bar)
Thanh công cụ cố định nằm ở mép trên cùng của viewport bản đồ:
- Bên trái: Biểu tượng `Orbit` quay chậm, tiêu đề `STARFRONT GALAXY NETWORK`, nhãn Ngày chiến lược hiện tại (`NGÀY #N`), số lượng sector và tuyến (`8 Sectors · 12 Tuyến Hyperlane`).
- Ở giữa / phải:
  * Tỷ lệ kiểm soát 3 phe dạng số liệu: `VSS: 63% · Tranh Chấp: 25% · Void: 13%`.
  * Huy hiệu Threat trung bình thiên hà: `Threat TB: 449/1000`.
  * Nút chuyển đổi Toàn màn hình (`Fullscreen Toggle`) kèm icon `Maximize2` / `Minimize2`.

---

### 4.6. Chú Giải Bản Đồ (Map Legend Floating Panel)
Nằm ở góc trên bên trái của viewport bản đồ:
- Có nút thu gọn / mở rộng (`Thu gọn` / `Mở rộng`).
- Hiển thị bảng mã màu:
  * 4 Phe phái: VSS Coalition (chấm xanh), The Void (chấm đỏ), Tranh Chấp (chấm vàng), Trung Lập (chấm xám).
  * 4 Kiểu đường: Thông suốt (nét liền cyan), Nguy hiểm (nét đứt vàng), Phong tỏa (nét chấm đỏ), Ngoại tuyến (nét mờ xám).

---

### 4.7. Bộ Điều Khiển Viewport (Map Controls)
Nằm ở góc dưới bên trái của viewport bản đồ gồm 4 nút vuông tiện ích:
1. **Nút Phóng To (`+`)**: Tăng zoom level thêm 0.2 (tối đa 2.2x).
2. **Nút Thu Nhỏ (`-`)**: Giảm zoom level bớt 0.2 (tối thiểu 0.7x).
3. **Nút Đặt Lại (`RotateCcw`)**: Đưa zoom về chuẩn 1.0x và pan offset về `(0, 0)`.
4. **Nút Căn Giữa Sector Đang Chọn (`Crosshair`)**: Tự động tính toán pan offset để đưa tọa độ sector đang chọn về chính giữa màn hình và thiết lập zoom 1.2x.

---

### 4.8. Khung Chi Tiết Sector (Sector Inspector Drawer)
Nằm áp sát mép phải bản đồ (`absolute top-3 right-3 bottom-3 w-80 sm:w-96`):
- Là bảng trượt dọc có thanh cuộn riêng, chứa toàn bộ chức năng quản trị sector:
  * Tên sector, phụ đề, huy hiệu giai đoạn vòng đời (`NORMAL`, `THREATENED`, `UNDER SIEGE`, `LOST`).
  * Đoạn văn bối cảnh cốt truyện.
  * Banner cảnh báo đỏ nếu sector đang bị khóa Combat.
  * Bảng 6 chỉ số: Chủ quyền, Công sự phòng thủ, Threat, Stability, Đồn trú, Dân số.
  * Kho lương thực, năng lượng, vật liệu dự trữ tại chỗ.
  * Lưới 5 nút thay đổi Lệnh Chiến Lược Đồn Trú (`defend`, `reinforce`, `attack`, `recover`, `normal`).
  * Danh sách sự kiện đang diễn ra tại sector này kèm hạn chót.
  * 4 nút hành động:
    1. `Chi Tiết Tại Sector Operations`: Chuyển sang Tab 3.
    2. `Điều Quân Chi Viện (Quick Dispatch)`: Mở modal điều động quân.
    3. `Nâng Cấp Công Sự (+100 Vật Liệu)`: Tăng cấp công sự.
    4. `Xuất Kích Tác Chiến Tại Sector`: Chuyển sang buồng lái chiến thuật nếu sector bị đe dọa.

---

## 5. Cửa Sổ Nổi & Chế Độ Toàn Màn Hình

### 5.1. Chế Độ Bản Đồ Toàn Màn Hình (`world-fullscreen-overlay.tsx`)
- Khi kích hoạt từ Header hoặc Map HUD:
  * Một lớp phủ `fixed inset-0 z-40 w-screen h-screen bg-zinc-950` mở ra, chiếm trọn 100% diện tích màn hình.
  * Ẩn toàn bộ thanh điều hướng ngoài của `starfront-shell.tsx` và Header của Operations Center, biến màn hình thành một trung tâm tác chiến không gian chuyên dụng.
  * Giữ nguyên toàn bộ tương tác zoom, kéo rê (pan), chọn sector và Inspector của `WorldMap`.
  * Có nút nổi góc trên bên phải: `Thoát (ESC)` kèm phím tắt bàn phím `Escape` được lắng nghe thông qua `window.addEventListener("keydown")`.
  * Hỗ trợ mở tiếp `QuickDispatchDock` lồng bên trong chế độ toàn màn hình mà không làm mất trạng thái.

---

### 5.2. Bến Điều Động Chi Viện Nhanh (`quick-dispatch-dock.tsx`)
- Là cửa sổ modal nổi (`fixed inset-0 z-50 bg-black/80 backdrop-blur-xs`):
- **Chức năng**: Cho phép người chơi điều chuyển quân số giữa các cứ điểm hoặc từ nguồn dự bị chiến lược.
- **Các thành phần giao diện**:
  * Lựa chọn nguồn quân: Nguồn từ `Quân Dự Bị Quốc Gia (Reserves)` HOẶC từ `Đồn Trú Sector Khác`.
  * Lựa chọn Sector đích đến (mặc định điền sector người chơi vừa chọn trên bản đồ).
  * Điều chỉnh quân số: Các nút `-10`, `+10`, và nút `Tối Đa (MAX)`.
  * Lựa chọn Lệnh Chiến Lược cho đạo quân: `reinforce` (Tăng viện), `defend` (Cố thủ), `attack` (Tấn công).
  * Dự báo lộ trình: Tính toán tuyến đường ngắn nhất (Dijkstra algorithm thông qua `findShortestPath`), hiển thị số ngày hành quân dự kiến và danh sách các sector trung chuyển.
  * Nút hành động: `Xác Nhận Xuất Quân`. Kiểm tra hợp lệ (không điều quân quá mức sẵn có, không xuất quân từ sector đang bị khóa combat, không gửi quân đến cùng một sector). Khi thành công, lưu World State ngay và đóng modal.

---

## 6. Ma Trận Đối Chiếu Mã Nguồn UI Với WORLD_DESIGN.md

Dưới đây là bảng đối chiếu chi tiết giữa tài liệu thiết kế gốc (`WORLD_DESIGN.md`) và trạng thái giao diện đã triển khai thực tế trong mã nguồn:

| Hạng mục thiết kế trong WORLD_DESIGN.md | Tình trạng trong UI hiện tại | Chi tiết đối chiếu mã nguồn thực tế |
|---|---|---|
| **A.1. Điều hướng Shell** | **ĐÃ TRIỂN KHAI** | Menu `world` có đầy đủ trong `SECTIONS` của `starfront-shell.tsx` với 6 submenu. |
| **A.2. Bản đồ toàn màn hình (100vw/100vh)** | **ĐÃ TRIỂN KHAI** | `world-fullscreen-overlay.tsx` hỗ trợ ESC, full viewport, inspector nổi. |
| **A.3. 4 Phân khu Operations Center** | **ĐÃ TRIỂN KHAI** | Situation Deck (Tab 1), Active Operations (Tab 4), Dual Results (Tab 6), Quick Dispatch (Modal). |
| **B.1. Đồ thị 8 Sector & 12 Tuyến đường** | **ĐÃ TRIỂN KHAI** | `world-map.tsx` vẽ đầy đủ 8 node và 12 tuyến đường SVG theo đúng tọa độ. |
| **B.2. 4 Trạng thái tuyến đường** | **ĐÃ TRIỂN KHAI** | Tuyến `open`, `hazardous`, `blocked`, `offline` hiển thị rõ màu sắc và nét đứt. |
| **B.3. Phân tách Sovereignty vs Threat** | **ĐÃ TRIỂN KHAI** | Hiển thị độc lập: Chủ quyền bằng màu phe/nhãn; Threat bằng thanh gauge 0..1000. |
| **B.4. Vòng đời 5 giai đoạn Sector** | **ĐÃ TRIỂN KHAI** | `STAGE_CONFIG` hỗ trợ đủ `normal`, `threatened`, `under_siege`, `lost`, `recovery`. |
| **C.2. Sổ cái lực lượng bảo toàn 5 trạng thái** | **ĐÃ TRIỂN KHAI** | Tab `military` hiển thị đủ 5 ô: Deployed, Reserves, Wounded, Retreating, Casualties. |
| **C.3. Hạm đội đang hành quân trên bản đồ** | **ĐÃ TRIỂN KHAI** | Layer `deployments-layer` trên SVG hiển thị vị trí nội suy và số quân của convoy. |
| **D.1. Khóa trận giao tranh (Combat Lock)** | **ĐÃ TRIỂN KHAI** | Sector bị combat lock có huy hiệu ổ khóa đỏ 🔒 trên map, thẻ sector và inspector. |
| **D.5. Phục hồi trận treo (Suspended Recovery)** | **CHƯA CÓ TRONG UI** | Logic backend có trong `combat-adapter.ts`, nhưng chưa có hộp thoại UI riêng để bấm Resume/Abort. |
| **E.2. Checksum CRC32 & Lưu an toàn** | **ĐÃ TRIỂN KHAI** | Header có nút Lưu hiển thị mã CRC32 Checksum sau khi ghi thành công. |
| **F.3. Dev Time Travel Controls** | **CHƯA CÓ TRONG UI** | UI hiện tại chỉ có nút "Tiến 1 Ngày"; chưa có thanh công cụ tua +7 ngày, +30 ngày cho tester. |
| **G.1. Thứ tự 6 Phase Tick** | **ĐÃ TRIỂN KHAI** | Động cơ chạy đủ 6 phase; log tick hiển thị tại Tab 1 sau khi bấm tiến ngày. |
| **H.1. Lương thực (Food) là tài nguyên riêng** | **ĐÃ TRIỂN KHAI** | Thanh tài nguyên hiển thị riêng Lương Thực màu xanh lục với icon `Wheat`. |
| **H.4. Đoàn xe tiếp tế lương thực tự động** | **CHƯA CÓ TRONG UI** | Logic có trong `logistics-engine.ts`, nhưng trên map hiện chỉ vẽ convoy quân sự, chưa vẽ icon xe chở lương thực riêng. |
| **H.5. Dòng di cư dân số trên bản đồ** | **CHƯA CÓ TRONG UI** | Dân số hiển thị dạng chỉ số text ở Tab 1; chưa có đường mũi tên di cư vẽ trên bản đồ. |
| **I.1. Vòng đời sự kiện 3 pha (INIT/PROCESSING/RESULT)** | **ĐÃ TRIỂN KHAI** | `events-missions-board.tsx` phân loại rạch ròi 3 pha với bộ lọc và giao diện riêng biệt. |
| **I.2. Đồ thị chuỗi nhiệm vụ 8 chuỗi tối đa** | **ĐÃ TRIỂN KHAI** | Cây nhiệm vụ hiển thị tiến trình từng bước, trạng thái lock và huy hiệu chờ sector. |
| **I.3. Dual Results Hub & Safe Pruning** | **ĐÃ TRIỂN KHAI** | `dual-results-hub.tsx` phân tách 2 luồng báo cáo và có nút "Xóa an toàn" không đổi state. |

---

## 7. Tổng Hợp Điểm Mạnh, Hạn Chế & Đề Xuất Cải Tiến Trực Quan

### 7.1. Điểm Mạnh Nổi Bật Của Giao Diện Hiện Tại
1. **Tính Nhất Quán Về Ngôn Ngữ Thị Giác (Design System)**:
   - Toàn bộ giao diện sử dụng phong cách chỉ huy tương lai (Sci-Fi Military Command) với phông chữ monospace kỹ thuật, viền sắc nét, hiệu ứng phát sáng neon (glow) và phân cấp màu sắc chặt chẽ: Xanh lơ (VSS / Kiểm soát), Đỏ (The Void / Nguy cấp / Khóa trận), Vàng hổ phách (Cảnh báo / Tranh chấp / Chờ xử lý), Xanh lục (Lương thực / Hoàn tất / An toàn).
2. **Khả Năng Phân Biệt Đa Tín Hiệu (Multi-Signal Accessibility)**:
   - Các cảnh báo khẩn cấp không phụ thuộc vào màu sắc đơn thuần mà luôn kết hợp biểu tượng hình học đặc thù (`AlertOctagon`, `Lock`, `Flame`, `Zap`), nhãn văn bản viết hoa rõ ràng và hiệu ứng chuyển động có chủ đích (`animate-pulse`).
3. **Bản Đồ SVG Tương Tác Sâu**:
   - Khung nhìn bản đồ trong `world-map.tsx` hoạt động mượt mà với đầy đủ tính năng kéo rê chuột (pan), cuộn phóng to/thu nhỏ (zoom), căn giữa mục tiêu, làm sáng tuyến tiếp giáp, và drawer inspector mở rộng không làm che khuất hoàn toàn chiến trường.
4. **Vòng Đời Sự Kiện Minh Bạch & Chống Mất Dữ Liệu**:
   - Tab Sự kiện & Nhiệm vụ sau đợt nâng cấp Phase 6.10 đã giải quyết triệt để sự nhập nhằng giữa sự kiện cần quyết định (`INIT`) và sự kiện đang chạy (`PROCESSING`). Huy hiệu *“Đang chờ điều kiện sector”* giải thích rõ ràng lý do một nhiệm vụ chưa được kích hoạt thay vì để người chơi hoang mang.

---

### 7.2. Những Điểm Hạn Chế & Dữ Liệu Còn Nặng Về Dạng Text
1. **Thiếu Biểu Đồ Xu Hướng Theo Thời Gian (Historical Trend Graphs)**:
   - Điểm đe dọa (Threat) và Ổn định (Stability) hiện chỉ là những con số tức thời của ngày hiện tại. Người chơi không nhìn thấy được đường cong biến động (Line chart) qua 10 hay 30 ngày gần nhất để đánh giá chiến dịch đang tốt lên hay xấu đi.
2. **Khối Nhân Khẩu Học Ở Tab 1 Đang Dùng Bảng Text 2x2**:
   - Dân số quốc gia, dân số kiểm soát, số người tị nạn và thương vong đang hiển thị dưới dạng văn bản và con số. Phần này phù hợp hơn nếu được trình bày bằng biểu đồ phân bổ hình quạt hoặc thanh so sánh tương quan (Proportion bar).
3. **Thiếu Trực Quan Hóa Mạng Lưới Tuyến Đường Ở Tab 5**:
   - Trong tab "Quân Sự & Hậu Cần", 12 tuyến siêu không gian đang được liệt kê thành 12 thẻ hình chữ nhật dạng text. Người chơi phải tự đọc tên 2 đầu cầu để hình dung tuyến đường nối đi đâu thay vì có một sơ đồ mini-network trực quan.
4. **Đoàn Xe Hàng Hóa & Luồng Di Cư Chưa Xuất Hiện Trên Bản Đồ**:
   - Mặc dù hệ thống logic có tính toán vận chuyển hàng hóa và di cư dân số, bản đồ SVG hiện mới chỉ vẽ hạm đội quân sự (`activeDeployments`). Chưa có biểu tượng xe vận tải lương thực hoặc đoàn người tị nạn di chuyển trên các tuyến siêu không gian.

---

### 7.3. Kế Hoạch & Đề Xuất Cải Tiến Trực Quan Cho Các Phase Kế Tiếp
*(Đề xuất tham khảo cho lộ trình phát triển tiếp theo, không áp dụng sửa đổi code trong đợt này)*

1. **Nâng cấp Tab 1 (Tình Hình Chiến Lược)**:
   - Thay bảng text Nhân khẩu học bằng biểu đồ thanh xếp chồng (Stacked Bar) biểu diễn tỷ lệ: *Dân số an toàn* vs *Dân số vùng tranh chấp* vs *Dân tị nạn* vs *Thương vong*.
   - Bổ sung một sparkline đồ thị đường mini (Sparkline SVG) thể hiện chỉ số Threat trung bình qua 10 ngày gần nhất ngay bên cạnh thanh Gauge.
2. **Nâng cấp Tab 2 & Bản Đồ Thiên Hà**:
   - Thêm layer đồ họa biểu diễn các chuyến hàng lương thực/vật tư (Resource Convoys) dạng icon hạt photon chạy dọc theo tuyến hyperlane.
   - Bổ sung đường mũi tên chỉ hướng di cư của dân tị nạn rời khỏi các sector `under_siege`.
3. **Nâng cấp Tab 4 (Cây Chuỗi Nhiệm Vụ)**:
   - Nâng cấp phần biểu diễn các bước trong Mission Chain từ dạng lưới thẻ (Grid Cards) thành đồ thị nối dây SVG (Node Graph with Connecting Lines), hiển thị rõ rệt các ngã rẽ nhánh A / nhánh B của chuỗi nhiệm vụ dạng `branching`.
4. **Nâng cấp Tab 5 (Quân Sự & Hậu Cần)**:
   - Bổ sung biểu đồ cột so sánh tương quan quân lực giữa VSS và The Void.
   - Thêm biểu đồ tròn phân bổ quân số giữa các khu vực (Đồn trú tiền tuyến vs Dự bị hậu phương vs Bị thương).
5. **Bổ sung UI Phục Hồi Trận Treo (Suspended Recovery Dialog)**:
   - Thiết kế hộp thoại Modal xuất hiện tại Operations Center khi phát hiện có giao dịch combat chưa hoàn tất (`in-flight transaction`), cho phép người chơi chọn *"Tiếp tục buồng lái"* hoặc *"Hủy an toàn"*.

---
*Báo cáo kết thúc tại đây. Toàn bộ nội dung đã được xác thực 100% khớp với cấu trúc mã nguồn hiện tại của dự án STARFRONT WORLD.*
