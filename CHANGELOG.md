# STARFRONT — Nhật Ký Thay Đổi (Changelog)

Toàn bộ các mốc phát triển và cập nhật kế hoạch của dự án **STARFRONT** được ghi lại tại đây theo trình tự thời gian đảo ngược (mới nhất lên đầu).

---

## [Phase 6.25] — STARFRONT WORLD: Tái Thiết Kế Bàn Chỉ Huy Sự Kiện & Nhiệm Vụ (Events & Missions Command Desk Redesign)

*Đã hoàn thành 100% Phase 6.25 — Tái thiết kế toàn diện tab Events & Missions thành Bàn Chỉ Huy Chiến Lược (Command Desk) 3 chế độ độc lập: Cần Quyết Định [INIT], Đang Triển Khai [PROCESSING] và Chuỗi Nhiệm Vụ [CHAINS]; loại bỏ khối Recent Results Feed trùng lặp khỏi chân trang mà bảo toàn nguyên vẹn kho dữ liệu Event Archive & Debriefing Drawer; chế độ INIT tập trung vào mục tiêu bối cảnh và so sánh 2-3 phương án trực quan, ẩn công thức chi tiết nhưng xem được khi cần, chỉ hiển thị xác suất thực tế; chế độ PROCESSING chuyển sang trạm giám sát tiến độ thực tế không có nút phê chuẩn trùng lặp; chế độ CHAINS nâng cấp thành pipeline stepper toàn diện với 4 trạng thái nút rõ ràng và điều hướng sector trực tiếp; bảo toàn 100% logic engine, validation, concurrency guard và cách ly lưu trữ (7/7 Phase 6.25 tests PASS, 35/35 Test Suites PASS, build & lint thành công).*

### Các cải tiến UI/UX & nâng cấp kỹ thuật đã hoàn thành:
- **1. Điều Hướng Cấp 1 Với 3 Chế Độ Tác Chiến Chuyên Biệt (`events-missions-board.tsx`)**:
  - Tách bạch giao diện thành 3 chế độ rõ ràng qua thanh điều phối trên cùng:
    * **CẦN QUYẾT ĐỊNH [INIT]**: Hàng đợi sự kiện khẩn cấp thu gọn (4 cột) đối chiếu trực tiếp với Decision Panel (8 cột) tập trung vào mục tiêu, bối cảnh và so sánh phương án.
    * **ĐANG TRIỂN KHAI [PROCESSING]**: Trạm giám sát tiến trình thực thi trực quan với thanh tiến độ % thời gian thực, đích đến ngày game, giải thích nguồn phê chuẩn và lý do lựa chọn.
    * **CHUỖI NHIỆM VỤ [CHAINS]**: Nâng cấp thành chế độ xem chính độc lập, hiển thị pipeline timeline/stepper toàn màn hình cho các tuyến nhiệm vụ.
  - Tích hợp thanh tìm kiếm tức thời theo từ khóa, tên sự kiện, sector và danh mục trên từng chế độ.
- **2. Chế Độ A [INIT] — Decision Panel Tập Trung Tác Động & Chi Phí Thực Tế**:
  - Trình bày 2–3 phương án đối ứng qua các thẻ so sánh trực quan: tên phương án, biến động Ổn định và Đe dọa thực tế, chi phí tài nguyên và điều kiện quân dự bị (`military.reserves`).
  - Nút phê chuẩn rõ ràng có kiểm tra thẩm định khả năng chi trả qua `validateStrategyExecution`.
  - Ẩn điểm số trừu tượng khỏi giao diện chính nhưng cho phép bật mở xem hệ số chi tiết (Explainable Scoring).
  - Chỉ hiển thị xác suất thành công khi cấu hình template thực sự quy định xác suất có ý nghĩa (`strat.successChance`); không đổi điểm chiến lược thành phần trăm thành công giả.
  - Bảo toàn nút *"⚡ System Auto Phê Chuẩn Ngay"* sử dụng `evaluateAndApplyEventStrategyPolicy`.
- **3. Chế Độ B [PROCESSING] — Trạm Giám Sát Tiến Trình Thực Tế**:
  - Không lặp lại Decision Panel như thể sự kiện đang chờ phê chuẩn.
  - Hiển thị phương án đang thực thi, sector liên quan, tiến độ hoàn tất thực tế (% và progress bar), ngày bắt đầu và ngày dự kiến kết thúc (`processingCompletesTick`).
  - Minh bạch nguồn phê chuẩn (`System Auto`, `Tự Động Khóa Mặc Định`, `Chỉ Huy Phê Chuẩn`) và lý do lựa chọn (`selectionReason`).
  - Cảnh báo trận chiến thực địa nếu sự kiện gắn với `encounterTransactionId`.
  - Tuyệt đối loại bỏ nút phê chuẩn (Idempotent Guard), ngăn ngừa tạo giao dịch trùng lặp.
- **4. Chế Độ C [CHAINS] — Pipeline Timeline & Stepper Chuỗi Nhiệm Vụ**:
  - Hiển thị tiến trình từng bước dạng pipeline stepper đa cột.
  - Phân biệt rõ 4 trạng thái nút nhiệm vụ: Đã Hoàn Tất (`completed`), Đang Hoạt Động (`active`), Đang Chờ Điều Kiện Sector (`isPendingDispatch` + số ngày hoãn), Chưa Mở Khóa (`locked`).
  - Hiển thị sector liên kết và hỗ trợ điều hướng trực tiếp sang Galaxy Map / War Room qua nút *"Bản đồ &rarr;"*.
- **5. Loại Bỏ Nội Dung Trùng Lặp & Bảo Toàn Lưu Trữ**:
  - Loại bỏ khối Recent Results Feed khỏi cuối trang để tránh trùng lặp với **Khay Báo Cáo Tình Báo** (`DebriefingDrawer`).
  - Bổ sung nút liên kết mở nhanh *Khay Báo Cáo Tình Báo* tại thanh tiêu đề board.
  - Bảo toàn 100% kho dữ liệu `eventResultsArchive`, Safe Pruning và tính cách ly tuyệt đối với RPG Save V4.
- **6. Bộ Kiểm Thử Chuyên Sâu & Độ Tin Cậy Toàn Cục**:
  - Bổ sung `tests/world/phase6-25-events-missions-command-desk.test.ts` gồm 7 test cases chuyên sâu (100% PASS).
  - Toàn bộ 35 test suites trong `package.json` (`npm test`) vượt qua thành công.
  - Next.js build và typecheck thành công tuyệt đối.

---

## [Phase 6.24] — STARFRONT WORLD: Tái Thiết Kế Tình Hình Toàn Cảnh & Điểm Nóng Tác Chiến (Strategic Overview Redesign & Actionable Triage)

*Đã hoàn thành 100% Phase 6.24 — Tái thiết kế toàn diện tab Tình hình toàn cảnh (Overview) trong Operations Center dựa trên kiểm toán UX; thay thế bố cục chiếm dụng diện tích bằng 3 tầng giao diện chuẩn mực: Strategic Status (Chủ quyền VSS, Threat trung bình/điểm nóng, Quân dự bị & Cảnh báo hậu cần), Actionable Situation Triage (Danh sách điểm nóng ưu tiên P0/P1/P2 kèm điều hướng trực tiếp War Room, Quick Dispatch, Events & Missions, Suspended Combat), Operational Pulse (Niên lịch thu gọn & Khay báo cáo tình báo Debriefing Drawer), Modal Xem Đề Xuất & Phê Chuẩn An Toàn có xác nhận từ người chơi; sửa dứt điểm lỗi đồng bộ cờ Tactical Retreat trong Combat Arena (7/7 Phase 6.24 tests PASS, 34/34 Test Suites PASS, build & lint thành công).*

### Các cải tiến UI/UX & nâng cấp kỹ thuật đã hoàn thành:
- **1. Tầng Đầu — Strategic Status (`operations-center.tsx`)**:
  - *Chủ quyền & tình trạng thiên hà*: Hiển thị tỷ lệ kiểm soát VSS (`vssRatio%`), phân nhóm chủ quyền (VSS, The Void, Contested, Neutral); số lượng sector Ổn định, Đang bị đe dọa (`threatened`), Đang bị vây hãm (`under_siege`); thống kê số tuyến Hyperlane Bị phong tỏa (`blocked`) và Nguy hiểm (`hazardous`).
  - *Threat & điểm nóng*: Hiển thị mức Threat trung bình toàn cầu; chỉ rõ Sector nguy cấp nhất (Threat cao nhất) kèm nút điều hướng nhanh sang War Room; tính toán xu hướng Threat tăng/giảm chỉ khi có $\ge 2$ điểm dữ liệu lịch sử thực tế (`threatHistory`), hiển thị trung thực *"Chưa có dữ liệu xu hướng"* nếu thiếu lịch sử.
  - *Quân sự & hậu cần*: Thống kê quân số dự bị sẵn sàng (`military.reserves`) và lực lượng đang hành quân (`military.deployments` + `activeDeployments.inTransit`); cảnh báo thiếu hụt Lương thực dân sự (Civilian Food) và Quân nhu hậu cần (Supplies) theo đúng ngưỡng quy định của nền kinh tế (`SHORTAGE_THRESHOLD` 50 và `CRITICAL_FOOD_THRESHOLD` 100); cảnh báo rõ ràng khi tài nguyên ở mức nguy cấp.
- **2. Tầng Hai — Actionable Situation Triage (`operations-center.tsx`)**:
  - Tổng hợp danh sách điểm nóng sắp xếp theo độ ưu tiên (`P0` Khẩn cấp, `P1` Cảnh báo, `P2` Lưu ý).
  - Phân loại rõ ràng: Sector bị đe dọa / vây hãm, Trận chiến dở dang (`isSuspendedCombat`), Sự kiện `INIT` sắp hết hạn countdown, Khủng hoảng hậu cần / lương thực.
  - Nối toàn bộ hành động điều hướng với state thực:
    * **Xem Tại War Room**: chuyển sang tab `map` và chọn đúng `selectedSectorId`.
    * **Xuất Kích Nhanh**: mở modal `QuickDispatchDock` với sector được chọn sẵn.
    * **Xem Sự Kiện / Chi Tiết & Phê Chuẩn**: chuyển sang tab `events` và chọn đúng `selectedEventIdForBoard`.
    * **Xử Lý Trận Chiến Dở**: kích hoạt `handleDeployCombat` đưa người chơi vào luồng tiếp tục tác chiến hoặc rút lui an toàn.
- **3. Phê Chuẩn Nhanh Sự Kiện (Quick Review Modal)**:
  - Cho phép người chơi bấm *"⚡ Xem Đề Xuất"* từ thẻ sự kiện sắp hết hạn trên Overview.
  - Sử dụng `selectBestStrategyForEvent` và `validateStrategyExecution` từ `event-strategy-policy.ts` để trình bày phương án tối ưu, điểm số, lý do và chi phí tài nguyên/quân sự.
  - Người chơi phải chủ động bấm *"Xác Nhận Phê Chuẩn"*; hệ thống tuyệt đối không tự động duyệt chỉ vì deadline sắp hết hạn.
  - Cung cấp liên kết *"Mở Bảng Quyết Định Đầy Đủ"* sang Events & Missions nếu người chơi muốn tùy chỉnh sâu.
- **4. Tầng Ba — Operational Pulse (`operations-center.tsx`)**:
  - Thu nhỏ niên lịch thành dải trạng thái gọn: ngày game, chu kỳ mùa/buổi, trạng thái mô phỏng (Đang chạy / Tạm dừng), đếm ngược giây đến tick tiếp theo.
  - Nhật ký biến động gần nhất: hiển thị log từ tick gần nhất hoặc tóm tắt vòng đời sự kiện; nút mở nhanh **Khay Báo Cáo Tình Báo** (`isDebriefingDrawerOpen = true`) khi có kết quả mới chưa đọc.
- **5. Khắc Phục Đồng Bộ Cờ Tactical Retreat Trong Combat Arena (`combat-arena.tsx`)**:
  - Gán `worldCommittedRef.current = true` ngay sau khi commit kết quả rút lui thành công trong `handleConfirmTacticalRetreat`, ngăn chặn việc gọi commit lần thứ hai khi combat state chuyển sang `defeat`.
- **6. Bộ Kiểm Thử Chuyên Sâu & Độ Tin Cậy Toàn Cục**:
  - Bổ sung `tests/world/phase6-24-strategic-overview-redesign.test.ts` gồm 7 test cases chuyên sâu (100% PASS).
  - Toàn bộ 34 test suites trong `package.json` (`npm test`) vượt qua thành công.
  - Next.js build và typecheck thành công tuyệt đối.

---

## [Phase 6.23] — STARFRONT WORLD: Tích Hợp Ngữ Cảnh Tác Chiến Thực Địa & Kết Nối Combat Arena (WORLD Combat Context & Arena Integration)

*Đã hoàn thành 100% Phase 6.23 — Kết nối toàn diện luồng xuất kích tác chiến từ STARFRONT WORLD sang Combat Arena dựa trên kiến trúc Encounter Snapshot và Transaction Journal hiện có; khóa sector và lưu trạng thái suspended combat trước khi chuyển cảnh; chuyển đổi chính xác thông số địch từ snapshot sang CombatUnit đối thủ thay vì mở scout-drone mặc định; áp dụng chỉ số công sự & sĩ khí lên người chơi; hỗ trợ 2 chế độ rút lui (Hủy Bỏ An Toàn & Rút Lui Thất Bại); commit biên lai kết quả vào World State qua Adapter; hiển thị bảng tổng kết thực địa WorldCombatPostMissionResults và bảo vệ cách ly tuyệt đối 100% RPG Save V4 (8/8 Phase 6.23 tests PASS, 33/33 Test Suites PASS, build & lint thành công).*

### Các cải tiến UI/UX & nâng cấp kỹ thuật đã hoàn thành:
- **1. Chuẩn Hóa Khóa Sector & Tạo Encounter Snapshot Bất Biến (`operations-center.tsx`, `combat-adapter.ts`)**:
  - Khi người chơi bấm **Xuất Kích Tác Chiến** tại sector đủ điều kiện:
    * Kiểm tra an toàn: ngăn chặn xuất kích trùng lặp nếu sector đã bị khóa hoặc đang có trận chiến chưa hoàn tất tại sector khác.
    * Gọi `lockEncounterAndCreateSnapshot(worldState, { sectorId })`: đóng băng toàn bộ quân đồn trú (`lockedGarrisonPower`), gán mã giao dịch duy nhất `tx-cbt-...` và lưu vào `transactionJournal` với trạng thái `pending`.
    * Thiết lập `state.isSuspendedCombat = true`, `suspendedEncounterId`, `suspendedSnapshot`.
    * Lưu nguyên tử vào WORLD save (`STARFRONT_WORLD_SAVE_V1`) qua `saveWorldState` trước khi kích hoạt chuyển đổi giao diện buồng lái.
- **2. Đóng Gói Ngữ Cảnh Tác Chiến WorldBattleContext (`lib/game/world/types.ts`)**:
  - Khai báo interface `WorldBattleContext`: `source: "WORLD"`, `transactionId`, `encounterId`, `sectorId`, `sectorName`, `snapshot`, `resumedFromSuspended`.
  - Truyền context đồng bộ qua `onDeployEncounter` trong `operations-center.tsx`, cập nhật `activeWorldBattle` trong `starfront-shell.tsx` và cấp phát vào `CombatArena`.
- **3. Chuyển Đổi Dữ Liệu Đối Thủ & Bổ Trợ Người Chơi Thực Thụ (`lib/game/world/combat-adapter.ts`)**:
  - `buildCombatUnitFromSnapshot(snapshot)`: Chuyển đổi chính xác kẻ thù từ snapshot thành `CombatUnit` đối thủ đầy đủ (HP, Attack, Defense, Speed, Skills, Boss flag) tương ứng với Sector và mức độ đe dọa Void, xóa bỏ hoàn toàn hiện tượng tự động mở `scout-drone` hoặc mission RPG mặc định.
  - `applyWorldSnapshotPlayerModifiers(playerUnit, snapshot)`: Áp dụng hệ số phòng thủ từ cấp công sự (`defenseMultiplier`) và hệ số tấn công từ sĩ khí (`moraleMultiplier`) lên phi thuyền người chơi.
  - `buildCombatReceiptFromCombatState(combatState, snapshot, isVictory)`: Trích xuất biên lai `CombatResultReceipt` chuẩn hóa với xếp hạng chiến thuật (S+, S, A, B, C) dựa trên tỷ lệ HP và số lượt giao tranh.
- **4. Đấu Trường Combat Arena Hỗ Trợ Hai Chế Độ Độc Lập (`components/game/combat-arena.tsx`)**:
  - **Banner Chiến Sự Thực Địa STARFRONT WORLD**: Hiển thị tên Sector, mã giao dịch, số quân đồn trú đóng băng, cấp công sự (Thủ +X%), sĩ khí (+Y%) và mục tiêu tác chiến.
  - **Chế Độ Rút Lui Chiến Lược Đa Lựa Chọn (Strategic Retreat Modal)**:
    * **Hủy Bỏ An Toàn (Safe Abort)**: Mở khóa Sector ngay lập tức, hoàn trả 100% quân đồn trú nguyên vẹn, hủy transaction mà không áp dụng hình phạt.
    * **Rút Lui Thất Bại (Tactical Retreat)**: Chấp nhận thất bại, trừ ổn định và đồn trú theo quy tắc, mở khóa an toàn và cập nhật kết quả vào World State.
  - **Màn Hình Kết Quả Thực Địa `WorldCombatPostMissionResults` (`components/game/world-combat-results.tsx`)**:
    * Hiển thị báo cáo kết quả thực địa với đầy đủ biến động chỉ số: Threat giảm/tăng, Stability phục hồi/suy giảm, tài nguyên thu hồi (Data, Materials, Energy) và tổn thất đồn trú.
    * Nút *"HOÀN TẤT & TRỞ VỀ SỞ CHỈ HUY"* gọi `onWorldCombatComplete`, xóa `activeWorldBattle` và đưa người chơi trở về War Room.
- **5. Cách Ly Dữ Liệu Tuyệt Đối & Khôi Phục Sau Reload**:
  - Khi `worldBattleContext` kích hoạt, toàn bộ logic cộng thưởng (EXP, Credits, Drop Item, Level Up) và trừ phạt của RPG Save V4 bị vô hiệu hóa hoàn toàn, đảm bảo độc lập tuyệt đối 100%.
  - Hỗ trợ `resumeSuspendedCombat`: Khi người chơi reload trang hoặc mở lại game khi có trận dở dang, hệ thống tự động nhận diện và cho phép tiếp tục trận chiến từ snapshot đã lưu.
- **6. Bộ Kiểm Thử Chuyên Sâu & Độ Tin Cậy Hệ Thống**:
  - Bổ sung `tests/world/phase6-23-world-combat-arena-integration.test.ts` gồm 8 test cases chuyên sâu (100% PASS).
  - Toàn bộ 33 test suites trong `package.json` (`npm test`) vượt qua thành công.
  - Next.js build và typecheck không phát sinh bất kỳ lỗi nào.

---

## [Phase 6.22] — STARFRONT WORLD: Khắc Phục Hitbox Galaxy Map & Tương Tác Viewport (Galaxy Map Hitbox & Viewport Interaction Fix)

*Đã hoàn thành 100% Phase 6.22 — Khắc phục việc chọn sector khó trên Galaxy Map khi zoom nhỏ hoặc click gần node; phân biệt chính xác click chọn sector với thao tác kéo bản đồ (Pan) bằng movement threshold; bảo đảm trải nghiệm mượt mà, zero micro-jitter và nhất quán hoàn toàn giữa Embedded War Room Map và Fullscreen Overlay (5/5 Phase 6.22 tests PASS, 32/32 Test Suites PASS, build & typecheck thành công).*

### Các cải tiến UI/UX & nâng cấp kỹ thuật đã hoàn thành:
- **1. Hit Area SVG Trong Suốt Chuyên Dụng Cho Từng Sector Node (`components/game/world/world-map.tsx`)**:
  - Bổ sung hit area hình chữ nhật bo góc trong suốt kích thước lớn ($140 \times 88\text{px}$) riêng biệt cho mỗi sector node: `<rect x={cx - 70} y={cy - 35} width="140" height="88" rx="16" fill="transparent" />`.
  - Bao trọn vẹn vòng tròn trung tâm node ($cx, cy$), nhãn tên sector ($cy + 30$) và thanh đo Threat ($cy + 42$), xóa bỏ hoàn toàn khoảng chết (deadzone) gây trôi click trước đây.
  - Phân bố không gian chuẩn xác: khoảng cách tối thiểu giữa các sector canonical $\ge 120\text{px}$, hitbox không bao trùm sang tâm sector lân cận, loại bỏ nguy cơ chọn nhầm.
  - Gắn `pointer-events-none select-none` cho các nhãn cự ly và rủi ro trên tuyến đường hyperlane, ngăn chặn hoàn toàn việc route label chiếm sự kiện của sector.
- **2. Phân Biệt Chính Xác Click Chọn Sector Và Pan Bản Đồ (Pointer Drag Threshold)**:
  - Thiết lập ngưỡng chuyển động `DRAG_THRESHOLD = 5px`:
    * Khi con trỏ dịch chuyển dưới $5\text{px}$ (click tĩnh hoặc micro-jitter rung tay), giữ nguyên `panOffset`, không làm giật camera và kích hoạt click chọn sector chính xác.
    * Khi con trỏ dịch chuyển $\ge 5\text{px}$, chuyển sang trạng thái Pan kéo bản đồ (`isDragging = true`).
  - Khi nhả chuột (`onPointerUp`): cờ `hasExceededDragThreshold` ngăn chặn kích hoạt click chọn sector ở cuối thao tác kéo.
  - Ứng dụng Pointer Events API (`setPointerCapture` / `releasePointerCapture`), xử lý an toàn ngay cả khi người chơi nhả chuột bên ngoài container bản đồ.
- **3. Trải Nghiệm Zoom Nhỏ Vượt Trội ($0.7\times$)**:
  - Nhờ hit area $140 \times 88\text{px}$, khi zoom nhỏ ở mức tối thiểu ($0.7\times$), diện tích bấm trên màn hình thực tế vẫn đạt $\approx 98 \times 61\text{px}$, giúp người chơi click trúng cực kỳ dễ dàng trên cả chuột, trackpad và màn hình cảm ứng mà không cần phóng to hình ảnh đồ họa.
- **4. Nhất Quán Giữa Embedded Map & Fullscreen Overlay**:
  - Cả chế độ nhúng trong War Room và chế độ Toàn màn hình (`world-fullscreen-overlay.tsx`) dùng chung 100% logic hitbox và drag threshold.
  - Thao tác chọn sector đồng bộ tức thì với thanh Sector Command Ribbon và bảng chi tiết Sector Inspector bên phải.
- **5. Minh Bạch Hóa Trạng Thái Nút Tác Chiến**:
  - Khi sector ở trạng thái bình thường/ổn định (`normal`, `recovery`), hiển thị thông báo trạng thái rõ ràng: *"Tác chiến: Chưa có giao tranh"* kèm nhãn *"Khu vực ổn định"* hoặc *"Cần giải vây tuyến ngoài"* thay vì biến mất đột ngột.
  - Giữ nguyên giới hạn an toàn: không tự khởi chạy combat WORLD khi chưa đủ điều kiện.
- **6. Kiểm Thử & Tương Thích Tuyệt Đối**:
  - Bổ sung bộ kiểm thử chuyên dụng `tests/world/phase6-22-galaxy-map-hitbox-viewport.test.ts` (5/5 tests PASS).
  - Toàn bộ 32 test suites của dự án vượt qua thành công (100% PASS).
  - Next.js build & TypeScript typecheck hoàn hảo.

---

## [Phase 6.20] — STARFRONT WORLD: Khay Báo Cáo Tình Báo & Truy Cập Kết Quả (Debriefing Drawer & Results Access)

*Đã hoàn thành 100% Phase 6.20 — Triển khai hạng mục P1 theo `WORLD_UI_UX_AUDIT.md`: Chuyển Dual Results Hub thành Khay Báo Cáo Debriefing Drawer mở nhanh từ Tactical HUD với huy hiệu đếm số lượng chưa đọc, trượt mượt mà từ cạnh phải màn hình mà không làm gián đoạn hoặc mất trạng thái War Room; tích hợp xem chi tiết kết quả, liên kết nhảy trực tiếp sang Sector trên Galaxy Map, dọn dẹp log an toàn (Safe Pruning) và bảo toàn 100% World Save V1 (10/10 Phase 6.20 tests PASS, 31/31 Test Suites PASS, build & lint thành công).*

### Các cải tiến UI/UX & nâng cấp kỹ thuật đã hoàn thành:
- **1. Khay Báo Cáo Debriefing Drawer (`components/game/world/debriefing-drawer.tsx`)**:
  - **Mở Nhanh Không Gián Đoạn War Room**:
    * Nút "Báo Cáo" trên Slim Tactical HUD kết nối trực tiếp với drawer state, mở flyout panel trượt từ cạnh phải mà không thay đổi `activeTab` hay `selectedSectorId`.
    * Phím tắt `Escape` toàn cục và nút "Đóng [ESC]" cho phép thoát nhanh, hỗ trợ đóng khi nhấp vào backdrop mờ hoặc nút "Quay lại War Room &rarr;".
    * Thiết kế đáp ứng (Responsive Layout): Rộng cố định trên desktop (`560px` - `720px`) và tự động mở rộng toàn màn hình (`w-screen`) trên thiết bị di động/màn hình hẹp.
    * Cuộn độc lập nội bộ (`overflow-y-auto`) với scrollbar tối ưu, không ảnh hưởng đến bản đồ nền.
  - **Huy Hiệu Kết Quả Chưa Đọc (Unread Badge)**:
    * Tính toán chính xác số lượng báo cáo chưa đọc (`unreadResultsCount`) từ `eventResultsArchive`.
    * Tự động cập nhật badge khi sự kiện hoàn tất chu trình `PROCESSING`, không tạo thông báo lặp hay tăng số ảo qua các tick mô phỏng.
- **2. Tích Hợp & Nâng Cấp Dual Results Hub (`components/game/world/dual-results-hub.tsx`)**:
  - **Phân Tách Rõ Ràng 2 Luồng Báo Cáo**:
    * **Báo Cáo Sự Kiện & Khủng Hoảng (Event Results)**: Trích xuất từ `eventResultsArchive`, phân định rõ trạng thái `THÀNH CÔNG`, `THẤT BẠI`, `HẾT HẠN (MẶC ĐỊNH)`, nguồn chiến lược (`SYSTEM AUTO`, `DEFAULT FALLBACK`, `CHỈ HUY PHÊ CHUẨN`), biến động Stability, Threat, thương vong và tài nguyên.
    * **Nhật Ký Trận Đánh Buồng Lái (Battle Results)**: Trích xuất có thẩm quyền từ `transactionJournal` (chỉ các giao dịch combat đã `committed`), hiển thị kết quả, hạng chiến thuật (S/A/B), số hiệp, tỷ lệ HP người chơi/kẻ địch và tóm tắt diễn biến.
  - **Liên Kết Nhảy Trực Tiếp Sang Sector (Interactive Sector Navigation)**:
    * Tên Sector trên cả 2 luồng báo cáo trở thành nút liên kết có thể nhấp (`onNavigateToSector`), khi bấm sẽ đưa camera Galaxy Map trực tiếp đến Sector đó, mở Sector Inspector và đóng Drawer mượt mà.
  - **Bảng Tình Báo Chi Tiết Mở Rộng (Expandable Details Panel)**:
    * Nút bật/tắt "Chi Tiết" / "Biên Lai" cho từng thẻ kết quả, mở rộng thông tin ID sự kiện, tick hoàn tất, giải trình lựa chọn chiến lược và mã giao dịch TxID.
  - **Bộ Lọc 4 Chế Độ & Thao Tác Hàng Loạt**:
    * Lọc theo `Tất Cả`, `Chưa Đọc`, `Thắng / Tốt`, `Thua / Xấu`.
    * Đánh dấu từng báo cáo đã đọc hoặc đánh dấu toàn bộ với 1 cú nhấp.
    * Dọn dẹp an toàn (`pruneReadEventResultsSafe`): Xóa các bản ghi đã đọc khỏi danh sách hiển thị, bảo toàn 100% các chỉ số World State và không ảnh hưởng tài nguyên thiên hà.
- **3. Tích Hợp Vào Operations Center (`components/game/world/operations-center.tsx`)**:
  - Kết nối nút "Báo Cáo" trên Tactical HUD với drawer toggle.
  - Cập nhật nút "Dual Results Hub" trong `EventsMissionsBoard` mở trực tiếp Drawer.
  - Giữ nguyên tab 5 "Trung Tâm Kết Quả" để tương thích ngược 100% với các test suite hiện có.
- **4. Kiểm Thử Toàn Diện & Tương Thích Tuyệt Đối**:
  - Viết bộ kiểm thử chuyên dụng `tests/world/phase6-20-debriefing-drawer.test.ts` (10/10 tests PASS).
  - Toàn bộ 31 test suites của dự án vượt qua thành công (100% PASS).
  - Next.js build & TypeScript typecheck không có lỗi.

---

## [Phase 6.19] — STARFRONT WORLD: Ma Trận Ra Quyết Định Sự Kiện & Nhiệm Vụ (Events & Missions Decision Matrix)

*Đã hoàn thành 100% Phase 6.19 — Triển khai hạng mục P1 theo `WORLD_UI_UX_AUDIT.md`: Tái cấu trúc `events-missions-board.tsx` thành Ma trận Ra quyết định 2 Cột (Decision Matrix) gồm Urgency Queue bên trái cuộn độc lập và Decision Panel bên phải đối chiếu chiến lược theo thời gian thực; hiển thị minh bạch nguồn phê chuẩn (`System Auto`, `Default Fallback`, `Chờ Chỉ Huy`), score giải thích được, chi phí xác thực và bảo vệ lũy đẳng (100% tests PASS, build thành công, 30/30 test suites PASS tuyệt đối).*

### Các cải tiến UI/UX & nâng cấp kỹ thuật đã hoàn thành:
- **1. Hàng Đợi Khẩn Cấp (Urgency Queue — Cột Trái `events-missions-board.tsx`)**:
  - **Sắp Xếp 3 Tầng Ưu Tiên Chặt Chẽ**: Ưu tiên 1 theo hạn chót gần nhất (`decisionDeadlineTick - currentDay` ASC), Ưu tiên 2 theo mức độ nghiêm trọng đa tín hiệu (`critical` > `warning` > `info`), Ưu tiên 3 theo độ ưu tiên priority và ID tất định.
  - **Giới Hạn Chiều Cao & Cuộn Độc Lập**: Khung danh sách có chiều cao giới hạn (`max-h-[680px]`) và thanh cuộn nội bộ độc lập (`overflow-y-auto`), khắc phục triệt để hiện tượng trang bị kéo dài hàng nghìn pixel khi có nhiều sự kiện.
  - **Thẻ Sự Kiện Cô Đọng (Compact Interactive Cards)**:
    * Vạch màu trạng thái dọc cạnh trái (đỏ/amber/xanh).
    * Huy hiệu đếm ngược ngày khẩn cấp (nhấp nháy đỏ khi còn <= 1 ngày hoặc tối nguy).
    * Phân loại sự kiện (Crisis, Military, Diplomacy, Civil, Anomaly, Logistics, Intel).
    * Sector / Toàn vũ trụ và nhãn nguồn phê chuẩn (`Chờ Chỉ Huy`, `System Auto`, `PROCESSING`).
    * Chỉ báo thẻ đang chọn trực quan với viền sáng cyan, ring phát sáng và nhãn "ĐANG XEM".
  - **Thanh Công Cụ Lọc & Tìm Kiếm Tức Thì**: Bộ lọc 5 chế độ (`Tất Cả`, `Cần Phê Chuẩn [INIT]`, `Đang Triển Khai [PROCESSING]`, `Cây Chuỗi Nhiệm Vụ`, `Báo Cáo Gần Đây`) kèm thanh tìm kiếm theo tên sự kiện và sector.
- **2. Bảng Phân Tích & Phê Chuẩn Chiến Lược (Decision Panel — Cột Phải `events-missions-board.tsx`)**:
  - **Tình Báo Tác Chiến & Bối Cảnh Sector**: Hiển thị mô tả đầy đủ, phân cấp quy mô Tier (Small, Medium, Large), hạn chót và thông tin sector (ổn định %, đe dọa, chủ quyền, quân đồn trú, nút tắt xem trên War Room Map).
  - **So Sánh Đối Chiếu Các Phương Án Đa Chiều**:
    * Hiển thị song song từng phương án với tỷ lệ thành công (`successChance%`), thời gian thực thi (`processingTicks`), biến động ổn định (`stabilityDelta`) và đe dọa (`threatDelta`).
    * Thẩm định chi phí thực tế (`validateStrategyExecution`): Kiểm tra từng tài nguyên trong 5 loại và quân dự bị, hiển thị nhãn màu xanh/đỏ tức thì và lý do chi tiết khi thiếu hụt.
    * Hệ thống chấm điểm minh bạch (`scoreEventStrategy`): Điểm số chiến lược tổng hợp (+/- điểm) kèm nút bật/tắt giải thích chi tiết các hệ số đánh giá (Explainable Scoring).
    * Nổi bật phương án được System Auto đề xuất (`★ ĐỀ XUẤT SYSTEM AUTO`) và phương án mặc định tự động khóa.
    * Nút Phê chuẩn thủ công có kiểm tra chi phí và nút Phê chuẩn nhanh 1-click theo System Auto (`⚡ System Auto Phê Chuẩn Ngay`).
  - **Empty State Trung Thực**: Khi chưa có sự kiện nào được chọn, hiển thị màn hình hướng dẫn thao tác sạch sẽ với biểu tượng Crosshair quân sự, tuyệt đối không tạo dữ liệu giả.
  - **Bảo Vệ Tính Lũy Đẳng & Phân Định Nguồn Quyết Định**:
    * Phân biệt rõ các nguồn: `player_choice`, `system_auto`, `default_fallback`, `processing`.
    * Hiển thị minh bạch nguyên nhân chuyển giao quyền quyết định (`autoSelectionFailureReason`).
    * Khóa không cho phép phê chuẩn lại hoặc ghi đè phương án khi sự kiện đã bước vào trạng thái `PROCESSING`.
- **3. Bảo Toàn Chuỗi Nhiệm Vụ & Phân Hệ Kết Quả**:
  - Giữ nguyên vẹn 100% cấu trúc cây đồ thị chuỗi nhiệm vụ chiến lược (`activeMissionChains`), các trạng thái nút `completed`, `active`, `locked`.
  - Duy trì cơ chế hoãn điều động `isPendingDispatch` với huy hiệu "Đang chờ điều kiện sector" và đếm số ngày đã hoãn (`dispatchDeferredTicks` / `MAX_DISPATCH_DEFER_TICKS`).
  - Duy trì bảng tin kết quả gần đây (Recent Results Feed) và liên kết nhanh đến Dual Results Hub.
- **4. Kiểm Thử Toàn Diện & Tương Thích Tuyệt Đối**:
  - Viết bộ kiểm thử chuyên dụng `tests/world/phase6-19-decision-matrix.test.ts` (6/6 tests PASS).
  - 30/30 test suites PASS 100% qua `npm test`.
  - Next.js build và typecheck thành công hoàn toàn (`compile_applet`, `lint_applet`).
  - Bảo toàn tuyệt đối `STARFRONT_WORLD_SAVE_V1`, `STARFRONT_WORLD_SIMULATOR_CONFIG` và `STARFRONT_SAVE_DATA_V4`.

---

## [Phase 6.18] — STARFRONT WORLD: Slim Tactical HUD & Cách Ly ADMIN CP (Slim Tactical HUD & ADMIN CP Isolation)

*Đã hoàn thành 100% Phase 6.18 — Triển khai P1 theo `WORLD_UI_UX_AUDIT.md`: Tinh giản header của Operations Center thành thanh Slim Tactical HUD tối ưu không gian cho War Room, cách ly hoàn toàn ADMIN CP khỏi 5 tab tác chiến thường ngày thành Modal Settings Overlay chuyên dụng (`components/game/world/admin-settings-modal.tsx`) mở qua nút bánh răng HUD, bảo toàn quy tắc an toàn đổi tốc độ và Danger Zone reset world (100% tests PASS, build thành công, 29/29 test suites PASS tuyệt đối).*

### Các cải tiến UI/UX & nâng cấp kỹ thuật đã hoàn thành:
- **1. Slim Tactical HUD (`components/game/world/operations-center.tsx`)**:
  - **Tổ chức 3 Nhóm Chức Năng Rõ Ràng**:
    * **Nhóm 1: Thời Gian Chiến Lược (Strategic Time)**: Ngày trong game (#N), Niên lịch thiên hà, chu kỳ nhật dạ (Sáng/Chiều/Tối/Đêm), trạng thái RUNNING/PAUSED, đếm ngược giây tick.
    * **Nhóm 2: 5 Tài Nguyên Cốt Lõi (Core Resources)**: Vật Liệu Công Nghiệp, Năng Lượng Plasma, Vật Tư Hậu Cần, Dữ Liệu Tác Chiến, Lương Thực Dân Sinh; hiển thị trực quan, cảnh báo thiếu hụt nhấp nháy đỏ khi <= 20 (hoặc <= 50 với lương thực), tooltip chú thích đầy đủ.
    * **Nhóm 3: Thao Tác Nhanh (Quick Actions)**: Thực thi ngày mới (+1 Ngày), Phóng to toàn màn hình (Fullscreen Map), Mở Báo cáo Kết quả (Results Hub), Bến điều quân nhanh (Quick Dispatch), Nút Bánh Răng (Cài Đặt / Settings Overlay), Nút Lưu thủ công an toàn (Storage V1).
  - **Tối Ưu Chiều Cao Khung Nhìn**: Thu hẹp triệt để chiều cao và độ chiếm dụng của header so với bản cũ, ưu tiên bố cục 1 hàng trên desktop và tự động co giãn thích ứng khi thiếu chiều rộng.
  - **Đồng Bộ Hoàn Hảo**: Giữ nguyên cơ chế tick và scheduler hiện có, không tạo timer trùng lặp hay làm trôi thời gian.
- **2. Cách Ly ADMIN CP Thành Modal Settings Overlay (`components/game/world/admin-settings-modal.tsx`)**:
  - **Khử bỏ Tab Admin Khỏi Thanh Điều Hướng**: Thanh nav Operations Center chỉ giữ đúng 5 tab tác chiến chuyên nghiệp (War Room Bản Đồ, Tình Hình Toàn Cảnh, Sự Kiện & Nhiệm Vụ, Quân Sự & Hậu Cần, Trung Tâm Kết Quả).
  - **Settings Modal Chuyên Biệt**: Mở thông qua nút bánh răng Cài Đặt trên HUD, hỗ trợ đóng nhanh bằng phím `Escape`, nút `X` hoặc click ra ngoài backdrop.
  - **Bảo Toàn Toàn Bộ Chức Năng Quản Trị**:
    * **Tốc Độ Simulator**: Preset 15s/30s/60s/300s, Tùy chỉnh, Tạm dừng/Tiếp tục.
    * **Quy Tắc Đổi Tốc Độ An Toàn**: Chỉ reset WORLD khi người dùng chủ động tích chọn; bấm Cancel không thay đổi tốc độ và giữ nguyên 100% dữ liệu thế giới.
    * **Cấu Hình Event Generator 3 Tier**: Tùy biến chu kỳ sinh, thời gian tồn tại và trần active từng tier; hỗ trợ khôi phục mặc định.
    * **Chính Sách Event Strategy Policy**: Thiết lập ưu tiên theo tier (System Auto / Default Fallback / Player Choice), lưu cấu hình và áp dụng hàng loạt (Batch Apply) cho sự kiện chờ.
    * **Dev Triggers**: Force spawn 3 tier sự kiện, tua nhanh thời gian (+1, +5, +10, +30 ngày), thực thi từng tick, hiển thị slot lưu trữ Staging A/B và mã kiểm tra CRC32.
    * **Danger Zone Phân Tách**: Đóng khung cảnh báo viền đỏ, thao tác Reset World độc lập yêu cầu xác nhận kép; reset dữ liệu thế giới về Ngày 1 nhưng bảo toàn 100% cấu hình tốc độ và generator.
- **3. Kiểm Thử & Độc Lập Dữ Liệu Tuyệt Đối**:
  - Viết bộ kiểm thử chuyên dụng `tests/world/phase6-18-slim-hud-admin-isolation.test.ts` (14/14 tests PASS).
  - 29/29 test suites PASS 100% qua `npm test`.
  - Next.js build và typecheck thành công hoàn toàn (`compile_applet`).
  - Phân hệ RPG Save `STARFRONT_SAVE_DATA_V4`, World State `STARFRONT_WORLD_SAVE_V1` và Simulator Config `STARFRONT_WORLD_SIMULATOR_CONFIG` cách ly an toàn tuyệt đối.

---

## [Phase 6.17] — STARFRONT WORLD: Tái Cấu Trúc Điều Hướng Chính & Nền Tảng War Room (Primary Navigation & War Room Foundation)

*Đã hoàn thành 100% Phase 6.17 — Triển khai giai đoạn P0 từ Blueprint Phase 6.16: Tái cấu trúc menu Shell đưa STARFRONT WORLD thành mục chỉ huy chiến lược vĩ mô tối cao theo mô hình 3 tầng chỉ huy, hợp nhất hoàn toàn Galaxy Map và Sector Inspector thành War Room trung tâm với Sector Command Ribbon 8 sector, loại bỏ màn hình chữ trùng lặp (100% tests PASS, build thành công, 27/27 test suites PASS tuyệt đối).*

### Các cải tiến UI/UX & nâng cấp kỹ thuật đã hoàn thành:
- **1. Tái Cấu Trúc Menu Shell & Mô Hình 3 Tầng Chỉ Huy (`components/game/starfront-shell.tsx`)**:
  - **Tôn vinh STARFRONT WORLD làm trung tâm**: Ghim ở vị trí đầu tiên của Khối 1 với huy hiệu `LIVE GALAXY`, chấm radar nhấp nháy, viền phát sáng cyan và phong cách thẻ chỉ huy quân sự chuyên biệt.
  - **3 Tầng Chỉ Huy Phân Định Minh Bạch**:
    * **Khối 1: Tổng Hành Dinh Chiến Lược (Strategic Hub)**: `world` (Chiến Trường Thiên Hà WORLD) và `home` (Tổng Quan Tác Chiến Console).
    * **Khối 2: Buồng Lái & Tác Chiến (Tactical Mecha)**: `battlefield` (Đấu Trường 2D), `character-gear` (Phi Công & Gear), `gallery` (Pilot Art Gallery).
    * **Khối 3: Hậu Phương & Khí Tài (Base & Armory)**: `hangar` (Hangar & Kho), `shop` (Chợ Quân Sự), `missions` (Chiến Dịch RPG 12 ải), `mission-logs` (Full Logs).
  - **Phân định rạch ròi ngữ cảnh**: Làm rõ ranh giới giữa Chiến Dịch Cốt Truyện RPG (12 ải tuần tự) và Sự Kiện Chiến Trường WORLD (Thiên hà động 8 sector).
  - **Bảo tồn toàn vẹn**: Giữ nguyên trạng thái active, luồng chọn nhân vật, khóa phi công/cơ giáp và các phân hệ mở rộng `OPERATION_SECTIONS` (`pilot`, `fleet`, `base`, `war`).
- **2. Nền Tảng War Room Trung Tâm & Sector Ribbon (`components/game/world/operations-center.tsx`, `components/game/world/world-map.tsx`)**:
  - **Galaxy Map là Trọng Tâm Tác Chiến**: Trở thành màn hình mặc định khi bước vào WORLD (`initialTab="map"`), nâng chiều cao khung nhìn lên `680px-780px` (min 580px).
  - **Thanh Điều Phối Sector Nhanh (Sector Command Ribbon)**: Đặt ngay trên bản đồ, hiển thị 8 sector đồng bộ thời gian thực kèm chấm chủ quyền (VSS/Void/Contested), Threat level, đồn trú và cảnh báo combat lock.
  - **Đồng bộ hai chiều tức thì**: Bấm chọn sector trên thanh ribbon hoặc trực tiếp trên SVG Map đều lập tức cập nhật `selectedSectorId`, kích hoạt Sector Inspector chi tiết.
  - **Tích hợp toàn diện thao tác Sector vào Inspector**:
    * Xem 6 chỉ số vĩ mô + Biểu đồ Threat Sparkline 5 ngày gần nhất kèm delta badge.
    * Đổi Lệnh Chiến Lược (Cố thủ, tập kết, phản công, hồi phục, bình thường).
    * Nâng cấp công sự (+50 vật liệu, sửa lỗi kiểm tra tài nguyên).
    * Mở Quick Dispatch Dock chi viện.
    * Xuất kích buồng lái can thiệp trực tiếp sang Đấu Trường.
    * Nút "Tập Trung Góc Nhìn Vào Sector Này" căn chỉnh camera thông minh có bù trừ vị trí Inspector.
  - **Khử bỏ Tab Sectors Trùng Lặp**: Hợp nhất vào War Room, tự động tương thích và hiển thị banner thông báo nếu truy cập qua liên kết cũ.
- **3. Kiểm Thử & Xác Thực Toàn Diện**:
  - `compile_applet` thành công 100%, không phát sinh lỗi biên dịch hay typecheck.
  - 27/27 test suites PASS 100% qua `npm test`.
  - Bảo vệ tuyệt đối phân hệ lưu trữ `STARFRONT_SAVE_DATA_V4`, `STARFRONT_WORLD_SAVE_V1` và `STARFRONT_WORLD_SIMULATOR_CONFIG`.

---

## [Phase 6.16] — STARFRONT WORLD: Đánh Giá Toàn Diện UI/UX & Bản Thiết Kế Tái Cấu Trúc (UI/UX Audit & Redesign Blueprint)

*Đã hoàn thành 100% Phase 6.16 — Khảo sát và lập hồ sơ đánh giá UI/UX toàn diện cho STARFRONT WORLD, phê duyệt tài liệu đặc tả `WORLD_UI_UX_AUDIT.md`, thiết lập mô hình 3 tầng chỉ huy và lộ trình P0/P1/P2 không can thiệp mã nguồn.*

---

## [Phase 6.15] — STARFRONT WORLD: Chính Sách Lựa Chọn Chiến Lược & Tự Động Phê Chuẩn (Event Strategy Policy & System Auto Strategy)

*Đã hoàn thành 100% Phase 6.15 — Triển khai cơ chế điều phối và lựa chọn chiến lược sự kiện 3 cấp độ tập trung, minh bạch và tất định cho STARFRONT WORLD: System Auto Strategy (Cấp 1) -> Default Strategy Fallback (Cấp 2) -> Player Choice Fallback (Cấp 3). Tích hợp toàn diện vào Events & Missions Board, Dual Results Hub, ADMIN CP và Tick Engine (100% tests PASS, 27/27 test suites, 0 regression)*

### Các tính năng & nâng cấp kỹ thuật đã hoàn thành:
- **1. Module Lựa Chọn Chiến Lược Tập Trung (`lib/game/world/event-strategy-policy.ts`, `lib/game/world/index.ts`)**:
  - **Thẩm định khả thi nghiêm ngặt (`validateStrategyExecution`)**: Kiểm tra đầy đủ tài nguyên (`credits`, `alloys`, `energy`, `minerals`, `food`, ...), quân lực dự bị (`military.reserves`) và ngữ cảnh chiến đấu của sector.
  - **Hệ thống chấm điểm minh bạch (`scoreEventStrategy`)**:
    * Tỷ lệ thành công (tối đa +50đ).
    * Biến động độ ổn định (+3đ/điểm tăng, -2đ/điểm giảm).
    * Biến động mức đe dọa (+2đ/điểm hạ, -2đ/điểm tăng).
    * Ngữ cảnh Sector khẩn cấp: Threat >= 500 (+25đ), Stability <= 50 (+20đ).
    * Chiết khấu tiêu hao tài nguyên (tối đa -30đ) và quân sự (tối đa -25đ).
    * Ưu tiên thời gian thực thi ngắn (tối đa -15đ).
    * Tổn thất nhân mạng dân sự/quân sự (tối đa -30đ/mỗi loại) và phần thưởng tài nguyên (+25đ).
  - **Phá vỡ thế hòa ổn định (`selectBestStrategyForEvent`)**: Tiêu chí tất định theo thứ tự `score DESC -> successChance DESC -> processingTicks ASC -> id ASC`.
  - **Áp dụng chiến lược an toàn (`applyStrategyToEvent`)**: Khấu trừ tài nguyên, điều động quân số dự bị sang triển khai, khóa Encounter Snapshot nếu yêu cầu combat, cập nhật trạng thái sự kiện sang `PROCESSING`.
  - **Điều phối 3 cấp độ (`evaluateAndApplyEventStrategyPolicy`)**:
    * **Cấp 1 — System Auto Strategy**: Tự động chấm điểm và áp dụng phương án tối ưu hợp lệ.
    * **Cấp 2 — Default Strategy Fallback**: Tự động kích hoạt phương án mặc định an toàn nếu System Auto không tìm được phương án thỏa điều kiện.
    * **Cấp 3 — Player Choice Fallback**: Chuyển quyền quyết định cho Chỉ Huy kèm lý do cụ thể khi cả 2 cấp trên không khả thi, không crash hay nghẽn simulator.
  - **Hỗ trợ thực thi hàng loạt (`batchApplyEventStrategyPolicy`)**: Quét và phê chuẩn tức thì cho toàn bộ sự kiện INIT đang chờ.
- **2. Đồng Bộ Giao Diện & Trải Nghiệm Người Chơi**:
  - **Events & Missions Board (`components/game/world/events-missions-board.tsx`)**:
    * Thẻ chiến lược hiển thị điểm số đánh giá, huy hiệu "★ Đề Xuất", "Mặc Định", và hộp phân tích lý do chấm điểm mở rộng.
    * Nút "System Auto Phê Chuẩn Ngay" cho phép người chơi kích hoạt đánh giá tự động tức thì.
    * Huy hiệu nguồn gốc chiến lược (`Chờ Chỉ Huy`, `System Auto`, `Default Fallback`) và thông báo nguyên nhân nếu tự động thất bại.
  - **Dual Results Hub (`components/game/world/dual-results-hub.tsx`)**:
    * Hiển thị rõ nguồn gốc phê chuẩn (`SYSTEM AUTO`, `DEFAULT FALLBACK`, `CHỈ HUY PHÊ CHUẨN`) và lý do lựa chọn trong lịch sử lưu trữ sự kiện.
  - **ADMIN CP (`components/game/world/operations-center.tsx`)**:
    * Bổ sung mục quản trị chính sách chiến lược: Bật/tắt 3 cấp độ toàn cục, cấu hình ưu tiên theo từng Tier (`Small`, `Medium`, `Large`), nút áp dụng cho tất cả sự kiện chờ, khôi phục mặc định và lưu trữ cấu hình.
- **3. Bộ Kiểm Thử Chuyên Sâu (`tests/world/event-strategy-policy.test.ts`)**:
  - 13 unit tests bao phủ đầy đủ validation, chấm điểm tất định, phá vỡ thế hòa, 3 cấp độ điều phối, thực thi hàng loạt, khấu trừ tài nguyên và lưu trữ bền vững (13/13 tests PASS).
  - Đảm bảo 100% không ảnh hưởng hoặc làm sai lệch phân hệ RPG Save V4.

---

## [Phase 6.14] — STARFRONT WORLD: Kiểm Chứng Động Cơ Thời Gian Thực & Độ Tin Cậy Sự Kiện (Real-time Simulator Validation & Event Reliability)

*Đã hoàn thành 100% Phase 6.14 — Kiểm chứng có mục tiêu toàn diện các hệ thống thời gian thực, tự động sinh Event/Quest, tính bền vững sau reload và reset thế giới (100% tests PASS, 26/26 test suites, 0 regression)*

### Các kết quả kiểm chứng & cải tiến kỹ thuật đã thực hiện:
- **A. Tốc Độ Mô Phỏng & Toàn Vẹn Chu Kỳ Tick (`lib/game/world/simulator-config.ts`, `components/game/world/operations-center.tsx`)**:
  - Kiểm chứng tự động cả hai tốc độ 15 giây/ngày và 300 giây/ngày; mỗi ngày game chỉ commit duy nhất một lần.
  - Bổ sung trường `pausedFraction` trong `WorldSimulatorConfig` để bảo toàn chính xác tiến độ phân đoạn trong ngày qua các lần Pause/Resume và Reload trang.
  - Chống hoàn toàn tick trùng và chạy bù ngoài ý muốn khi đổi tab, unmount/remount component hay tải lại giao diện.
- **B. Bộ Sinh Event/Quest & Concurrency Guard (`lib/game/world/event-generator.ts`, `components/game/world/operations-center.tsx`)**:
  - Mô phỏng xuyên suốt 40 ngày game: xác nhận Event/Quest thực sự tự động xuất hiện theo lịch game-time mà không cần thao tác thủ công Force Spawn.
  - Phát hiện và khắc phục lỗi thiếu kiểm tra giới hạn `maxActive` theo từng Tier trong hàm `forceSpawnEventByTier`.
  - Khắc phục việc thiếu gọi `checkAndSpawnWorldEvents` khi bấm nút "+1 Ngày Chiến Lược" thủ công trong Operations Center.
  - Xác nhận tính nhất quán 100% giữa thẻ chỉ số Overview (`countActiveEventsByTier().total`) và danh sách sự kiện trên Events & Missions Board (`getActiveEvents().length`).
  - Kiểm tra đầy đủ vòng đời: Lifetime, Countdown deadline, Auto-lock phương án mặc định, Resolve kết quả và lưu trữ vào `eventResultsArchive`.
- **C. Lưu Trữ Bền Vững, Reset & Bảo Vệ RPG Save V4 (`lib/game/world/storage.ts`, `components/game/world/operations-center.tsx`)**:
  - Xác nhận `nextEventSpawnDay` và `decisionDeadlineTick` được lưu trữ bền vững qua các lần reload mà không bị mất hoặc reset mốc đếm.
  - Xác nhận hủy đổi tốc độ giữ nguyên WorldState và cấu hình cũ.
  - Bổ sung tùy chọn checkbox cho phép người dùng chọn Reset World về Ngày 1 khi đổi tốc độ hoặc giữ nguyên tiến độ thế giới.
  - Xác nhận Reset WORLD độc lập giữ nguyên cấu hình tốc độ và bộ sinh generator, đồng thời hủy bỏ cờ `isTickingRef` để ngăn chặn bất kỳ scheduler cũ nào ghi đè dữ liệu.
  - Bảo đảm cách ly 100% an toàn cho phân hệ RPG Save V4 (`STARFRONT_SAVE_DATA_V4`) trong mọi kịch bản Reset.
- **D. Catch-Up Bounded & Niên Lịch Thiên Hà (`lib/game/world/catchup-engine.ts`, `lib/game/world/calendar.ts`)**:
  - Xác nhận Bounded Catch-up tuân thủ nghiêm ngặt trần an toàn `OFFLINE_CATCHUP_CAP = 360 ticks`.
  - Bảo đảm tính lũy đẳng: hậu quả của sự kiện không bao giờ bị áp dụng trùng lặp dù hàm được gọi nhiều lần.
  - Xác nhận niên lịch 4 buổi (Sáng/Chiều/Tối/Đêm), ngày/tháng/mùa/năm tính toán mượt mà và nhất quán qua các điểm chuyển giao ranh giới (Ngày 30->31, 90->91, 360->361).
  - Tích hợp bộ lọc chống lùi giờ hệ thống: khử giá trị âm bất thường và neo lại mốc thời gian an toàn mà không sinh tick hay event sai lệch.
- **E. Bộ Test Suite Chuyên Sâu (`tests/world/phase6-14-validation.test.ts`)**:
  - Bổ sung 15 unit tests chuyên biệt bao phủ toàn bộ 4 kịch bản A, B, C, D (15/15 tests PASS, toàn bộ 26 test suites của STARFRONT PASS 100%).

---

## [Phase 6.13] — STARFRONT WORLD: Động Cơ Thời Gian Thực, Tự Động Sinh Sự Kiện/Nhiệm Vụ & ADMIN CP (Real-time Simulator, Event/Quest Generator & ADMIN CP)

*Đã hoàn thành 100% Phase 6.13 — Khởi động hệ thống mô phỏng thời gian thực cho STARFRONT WORLD: ngày game tự vận hành trôi qua, niên lịch thiên hà 4 buổi (Sáng/Chiều/Tối/Đêm), bộ sinh Event/Quest 3 tier chuẩn hóa theo Ngày Game, trung tâm quản trị ADMIN CP toàn diện cho phép cấu hình tốc độ, tạm dừng/tiếp tục, dev triggers và reset thế giới an toàn (100% tests PASS, 25/25 test suites)*

### Các tính năng & nâng cấp kỹ thuật đã triển khai:
- **A. Động Cơ Mô Phỏng Thời Gian Thực Tự Vận Hành (`lib/game/world/simulator-config.ts`, `components/game/world/operations-center.tsx`)**:
  - Tích hợp một scheduler duy nhất cho STARFRONT WORLD, ngày game tự động tăng theo thời gian thực mà không bắt người chơi nhấn `+1 Ngày`.
  - **Cấu hình tốc độ chuẩn hóa**:
    * Mặc định: 1 Ngày Game = 300 giây thực (5 phút).
    * Hỗ trợ các preset: 15 giây (Chế độ test nhanh), 30 giây (Nhanh), 60 giây (1 phút), 300 giây (Chuẩn), cùng tùy chọn số giây bất kỳ hợp lệ (1 – 86,400 giây).
    * Tốc độ và trạng thái Pause được lưu trữ cách ly trong khóa `STARFRONT_WORLD_SIMULATOR_CONFIG` và tự động khôi phục sau reload.
  - **Quy tắc chạy an toàn & chống trùng tick**:
    * Tái sử dụng trọn vẹn `executeWorldTick` và thứ tự 6 phase chuẩn; mỗi ngày game chỉ commit đúng một lần.
    * Cơ chế Pause / Resume bảo toàn chính xác tiến độ phân đoạn trong ngày. Thay đổi tốc độ điều chỉnh mượt mà nhịp countdown, không gây chạy bù ngoài dự kiến và không làm mất dữ liệu.
    * Xử lý thời gian ngoại tuyến hoặc tab background bằng Bounded Batch Catch-up có trần an toàn (`OFFLINE_CATCHUP_CAP = 360 ticks`), tự động phát hiện và ngăn chặn gian lận lùi giờ hệ thống.
- **B. Niên Lịch Thiên Hà & Chu Kỳ Nhật Dạ Trong Ngày (`lib/game/world/calendar.ts`)**:
  - Xây dựng hệ thống niên lịch nhất quán, tất định 100%:
    * 1 Ngày Chiến Lược = 24 Giờ trong game (1440 phút).
    * Chu kỳ 4 buổi: Buổi Sáng (05:00–11:59), Buổi Chiều (12:00–17:59), Buổi Tối (18:00–21:59), Ban Đêm (22:00–04:59).
    * Niên lịch: 1 Tháng = 30 Ngày, 1 Mùa = 3 Tháng = 90 Ngày, 1 Năm = 4 Mùa = 360 Ngày.
    * 4 Mùa Thiên Hà: Mùa Khởi Nguyên (🌱), Mùa Bão Lửa (⚡), Mùa Thu Hoạch (🌾), Mùa Băng Tối (❄️).
  - Trực quan hóa sinh động trên Overview Deck: hiển thị giờ:phút, buổi, icon mùa, thanh tiến trình ngày và đếm ngược thời gian thực tới ngày tiếp theo.
- **C. Bộ Sinh Sự Kiện & Nhiệm Vụ Tự Động Theo Ngày Game (`lib/game/world/event-generator.ts`)**:
  - Toàn bộ chu kỳ sinh (interval) và thời gian tồn tại (lifetime) sử dụng **NGÀY GAME (Game Days)** làm đơn vị chuẩn, không dùng giây thực. Khi đổi tốc độ ngày game, nhịp độ gameplay trong vũ trụ vẫn giữ nguyên.
  - Phân loại chuẩn 20 templates vào 3 Tiers:
    * **Nhỏ (Small)**: Chu kỳ 0.1–3 ngày, thời gian tồn tại 0.5–15 ngày, max 30 active (8 templates).
    * **Trung bình (Medium)**: Chu kỳ 1–10 ngày, thời gian tồn tại 5–45 ngày, max 20 active (7 templates).
    * **Lớn (Large)**: Chu kỳ 10–60 ngày, thời gian tồn tại 15–180 ngày, max 10 active (5 templates).
    * Trần sự kiện toàn cầu: Mặc định `maxGlobalActive = 100`.
  - Tích hợp Concurrency Guard: kiểm tra chống trùng templateId trên cùng sector và toàn thiên hà; hỗ trợ hàm kích hoạt tức thời `forceSpawnEventByTier` phục vụ test và ADMIN CP.
- **D. Bảng Điều Khiển Quản Trị Viên — ADMIN CP (`components/game/world/operations-center.tsx`)**:
  - Tích hợp tab điều hướng thứ 7 chuyên biệt `ADMIN CP` trên thanh điều hướng Operations Center và Starfront Shell.
  - **Khối 1 — Tốc Độ & Mô Phỏng**: Lựa chọn 4 preset, nhập số giây tùy chỉnh, nút Pause/Resume, hiển thị đếm ngược kế tiếp.
  - **Khối 2 — Cấu Hình Generator**: Chỉnh sửa linh hoạt chu kỳ, lifetime, maxActive của từng tier, điều chỉnh trần toàn cầu, kèm tính năng kiểm tra validation (chống số âm, min > max, NaN) và nút khôi phục mặc định.
  - **Khối 3 — Kích Hoạt Nhanh & Lệnh Phát Triển**: Nút sinh ngay sự kiện Small / Medium / Large; nút điều khiển thời gian +1 ngày, tua nhanh +5 ngày, +10 ngày, +30 ngày (1 tháng).
  - **Khối 4 — Quản Trị Lưu Trữ & Reset Thế Giới**: Thông tin khóa lưu trữ cách ly Slot A/B, CRC32 Checksum, nút lưu ngay lập tức và Vùng Nguy Hiểm (Danger Zone) với nút Reset Toàn Bộ World về Ngày 1.
  - **Hộp thoại xác nhận an toàn**: Modal xác nhận đổi tốc độ và Danger Dialog cảnh báo nguy hiểm khi Reset World, khẳng định bảo toàn 100% dữ liệu RPG Save V4.
- **E. Bộ Kiểm Thử Chất Lượng Toàn Diện (`tests/world/realtime-simulator-admin.test.ts`)**:
  - 6/6 test cases chuyên sâu kiểm định đầy đủ: Cấu hình simulator & validation, Niên lịch 4 buổi & chu kỳ mùa, Bộ sinh 3 tier theo ngày game, Động cơ step & bounded catch-up 360 ticks, ADMIN CP speed switch & reset world, và Zero-Regression tuyệt đối cho RPG Save V4.

---

## [Phase 6.12] — STARFRONT WORLD: Biểu Đồ Xu Hướng Đe Dọa (Galaxy Map Threat Trendline)

*Đã hoàn thành 100% Phase 6.12 — Bổ sung Sparkline thể hiện lịch sử Threat 5 ngày gần nhất trên Galaxy Map, giúp người chỉ huy nhận diện xu hướng nguy hiểm theo từng sector trong cả chế độ nhúng lẫn toàn màn hình (100% tests PASS, 23/23 test suites)*

### Các tính năng & nâng cấp dữ liệu/giao diện đã triển khai:
- **A. Cấu Trúc Dữ Liệu & Bảo Toàn Lịch Sử Chiến Lược (`lib/game/world/types.ts`)**:
  - Bổ sung cấu trúc `SectorThreatHistoryPoint { day: number; threat: number }`.
  - Mở rộng trường tùy chọn `threatHistory?: SectorThreatHistoryPoint[]` trên thực thể `WorldSector`.
  - Khởi tạo mốc Ngày 1 trong `createInitialWorldState` với điểm thực tế ban đầu (`{ day: 1, threat: sector.threatLevel }`).
  - Thiết kế hoàn toàn tương thích ngược với schema `WorldState v1` và hệ thống Save/Load Atomic Envelope; không yêu cầu migration và cách ly 100% khỏi RPG Save V4.
- **B. Tự Động Thu Thập Qua Chu Kỳ Tick (`lib/game/world/tick-engine.ts`, `lib/game/world/sector-lifecycle.ts`)**:
  - Xây dựng hàm trợ năng `recordSectorThreatHistoryPoint(sector, day, threat)`.
  - Tích hợp tại bước kết thúc chu kỳ `executeWorldTick`: tự động ghi nhận mức Threat cuối ngày sau khi áp dụng toàn bộ 6 phase (kinh tế, di dân, tuần tra, ý đồ của Void, hạn chót sự kiện và nhiệm vụ).
  - Tự động duy trì cơ chế Rolling Window lưu tối đa 5 ngày gần nhất (ngày hiện tại và tối đa 4 ngày trước đó), đẩy các ngày cũ ra ngoài nhằm giữ kích thước lưu trữ siêu gọn nhẹ.
  - Bảo đảm tính tất định 100%: 2 mô phỏng cùng seed và trạng thái ban đầu sinh chuỗi lịch sử Threat trùng khớp hoàn toàn.
- **C. Giao Diện Sparkline Trực Quan Trong Sector Inspector (`components/game/world/world-map.tsx`)**:
  - Tích hợp card "Xu Hướng Threat (5 Ngày)" nằm gọn gàng ngay dưới lưới 6 chỉ số vĩ mô trong Sector Inspector.
  - **Mức Threat Hiện Tại & Phân Cấp Màu Sắc**: Nhất quán tuyệt đối với thang đo Threat 3 dải trên bản đồ (0-299 Thấp/Emerald, 300-699 Trung bình/Amber, 700+ Cao/Rose).
  - **Huy Hiệu Biến Động (Delta Badge)**:
    * Khi đủ từ 2 điểm trở lên: tính toán `delta = điểm_cuối - điểm_đầu`.
    * Tăng: `+X` màu đỏ/rose kèm icon `TrendingUp` và tag `TĂNG`.
    * Giảm: `-X` màu xanh/emerald kèm icon `TrendingDown` và tag `GIẢM`.
    * Giữ nguyên: `0` màu trung tính kèm icon `Minus` và tag `ỔN ĐỊNH`.
    * Hiển thị tooltip chi tiết lộ trình biến động ngày.
  - **Đồ Thị Vector SVG Sparkline**:
    * Đường đa tuyến polyline sắc nét cùng vùng phủ gradient màu bóng mờ (`opacity: 0.35 -> 0.0`).
    * Điểm nút tròn tại từng mốc ngày; điểm ngày hiện tại có hiệu ứng vòng sáng radar ping nổi bật.
    * Khi chỉ có 1 ngày: hiển thị node đơn nổi bật kèm nhãn "N.X (Khởi đầu)".
    * Khi chưa có dữ liệu lịch sử (0 ngày): hiển thị rãnh đứt đoạn sci-fi cùng thông báo "Chờ chu kỳ tick", không sinh dữ liệu giả mạo.
  - **Dòng Mốc Thời Gian (Timeline Axis)**: Thanh nhãn bên dưới hiển thị rõ từng mốc `N.day: threat_value`, làm nổi bật ngày hiện tại.
  - **Hoạt Động Toàn Diện**: Tương thích hoàn hảo trong cả giao diện nhúng (Operations Center Tab 2) và chế độ Bản Đồ Toàn Màn Hình (`world-fullscreen-overlay.tsx`), không che khuất HUD hay các nút lệnh tác chiến.
- **D. Bộ Kiểm Thử Chất Lượng Toàn Diện (`tests/world/threat-trendline.test.ts`)**:
  - 1. Sector chưa có lịch sử (0 ngày) an toàn, delta = null.
  - 2. Sector mới có 1–4 ngày lịch sử, không tạo dữ liệu giả.
  - 3. Sector có đủ 5 ngày lịch sử và cơ chế rolling window cắt tỉa chính xác.
  - 4. Xu hướng Threat: Tăng, Giảm, Giữ nguyên tính toán chính xác 100%.
  - 5. Bảo toàn qua Save/Load: phục hồi 100% dữ liệu lịch sử với Checksum CRC32 verified.
  - 6. Tích hợp Tick Engine xác định chuỗi tiến hóa tất định.
  - 7. Tính độc lập giữa các sector khi chuyển đổi mục tiêu trên bản đồ.

---

## [Phase 6.11] — STARFRONT WORLD: Tinh Chỉnh Bản Đồ Thiên Hà & Hệ Thống HUD (Galaxy Map & HUD Refinement)

*Đã hoàn thành 100% Phase 6.11 — Nâng cao khả năng quan sát và đọc hiểu Bản đồ Thiên hà, phân cấp thông tin trực quan đa tín hiệu, tinh chỉnh tuyến đường, tối ưu hóa Legend 5 nhóm, HUD toàn cảnh và Sector Inspector (100% tests PASS, 23/23 test suites)*

### Các tính năng & nâng cấp giao diện đã triển khai:
- **A. Phân Cấp Thông Tin 8 Sector Thiên Hà (`components/game/world/world-map.tsx`)**:
  - Bảo tồn nguyên vẹn 8 sector và tọa độ canonical chuẩn: Sol Command HQ, Helios Perimeter, Mining Outpost K-7, Asteroid Delta, Nebula Bastion, Waypoint Orion, Shadow Reach, Tartarus Breach.
  - Phân cấp đa tín hiệu (Multi-Signal Accessibility, không dùng màu sắc làm tín hiệu duy nhất):
    * **Chủ quyền (Sovereignty)**: Nhận diện rõ 4 phe: Liên Minh VSS (Cyan), Đế Chế The Void (Red), Tranh Chấp (Amber), Trung Lập (Slate) bằng màu sắc kết hợp viền và nhãn hiển thị.
    * **Thang đo Threat 3 Dải**: Phân loại theo 3 dải nguy cơ rõ rệt: 0–299 (Thấp / An Toàn - Xanh lục), 300–699 (Trung Bình / Cảnh Báo - Vàng), 700–1000 (Cao / Nguy Hiểm - Đỏ), hiển thị bằng thanh đo tỷ lệ trực quan dưới tên sector.
    * **Giai đoạn vòng đời (Stage Lifecycle)**: Thể hiện bằng các vòng orbital riêng biệt: Bình thường (Normal), Bị đe dọa (Threatened - Vòng đứt vàng), Vây hãm (Under Siege - Vòng đứt đỏ nhấp nháy pulse), Thất thủ (Lost - Vòng tím), Phục hồi (Recovery - Vòng cyan).
    * **Khóa Giao Tranh (Combat Lock)**: Huy hiệu ổ khóa đỏ nổi bật `🔒` góc trên sector, cảnh báo rõ đồn trú bị đóng băng và ngăn chặn xuất quân trái phép.
    * **Đích Đến Nhận Chi Viện (Deployment Target)**: Khi có đoàn quân đang hành quân tới sector, xuất hiện huy hiệu chỉ báo đích đến `+NQ` màu cyan góc trên bên trái sector.
    * **Tâm Ngắm Định Vị (Tactical Reticle)**: Sector được chọn hiển thị tâm ngắm quay chậm kèm 4 vạch ngắm góc chữ thập chính xác.
- **B. Tinh Chỉnh 12 Tuyến Siêu Không Gian (Hyperlane Routes)**:
  - Tái sử dụng trọn vẹn 12 tuyến canonical và trạng thái: Thông suốt (Open - Nét liền Cyan), Nguy hiểm (Hazardous - Nét đứt Vàng kèm icon !), Phong tỏa (Blocked - Nét đứt Đỏ kèm icon ✕), Ngoại tuyến (Offline - Nét đứt xám).
  - Làm sáng rực rỡ và phóng to nét vẽ các tuyến liên kết trực tiếp với sector đang chọn hoặc khi di chuột (hover).
  - Hiển thị tag thông số thời gian hành quân và mức độ rủi ro (`Xd · Rủi ro Y%`) với nền tối tương phản cao, tránh bị che khuất hoặc chồng lấn.
- **C. Chú Giải Bản Đồ Thống Nhất 5 Nhóm (Unified Map Legend)**:
  - Tinh chỉnh legend trực tiếp trong `world-map.tsx` thành bảng điều khiển sci-fi có thể đóng/mở linh hoạt:
    1. *Chủ Quyền (Sovereignty)*: VSS Coalition, The Void, Tranh Chấp, Trung Lập.
    2. *Mức Đe Dọa (Threat Level)*: 0–299 Thấp, 300–699 Vừa, 700+ Cao.
    3. *Tuyến Hyperlane*: Thông suốt, Nguy hiểm (!), Phong tỏa (×), Ngoại tuyến.
    4. *Giai Đoạn & Khóa Trận*: Bình thường, Bị đe dọa, Vây hãm (Pulse), Khóa combat (🔒).
    5. *Lực Lượng Hành Quân*: Hạm đội di chuyển (🚚) và Sector nhận chi viện (+NQ).
- **D. Nâng Cấp HUD & Bộ Điều Khiển Viewport (Map HUD & Controls)**:
  - Header HUD gọn gàng: Tiêu đề `STARFRONT GALAXY NETWORK`, Ngày chiến lược, số sector & tuyến, tỷ lệ kiểm soát 3 phe, Threat trung bình thiên hà kèm nhãn cấp độ, số lượng đạo quân đang hành quân.
  - Tích hợp nút bật/tắt hiển thị bảng chi tiết `Chi Tiết` để người chơi có thể quan sát toàn cảnh thiên hà không bị che khuất.
  - Bộ điều khiển 4 nút tiện ích: Phóng to (+), Thu nhỏ (-), Đặt lại góc nhìn chuẩn (RotateCcw), Căn giữa sector đang chọn (Crosshair).
- **E. Tinh Chỉnh Sector Inspector Drawer**:
  - Tích hợp nút đóng `[X]` và nút nổi mở lại thuận tiện khi cần quan sát toàn cảnh.
  - Hiển thị ngay ở đầu trang: Tên, Phụ đề, Huy hiệu giai đoạn, Banner khóa combat (nếu có), Banner thông báo đạo quân chi viện đang trên đường tới (nếu có).
  - Lưới 6 chỉ số: Chủ quyền, Công sự phòng thủ, Threat (kèm nhãn mức độ), Stability, Đồn trú, Dân số.
  - Phân nhóm nút hành động hợp lý theo thứ tự ưu tiên: Xuất Kích Chiến Đấu (nếu khẩn cấp) -> Điều Quân Chi Viện (Quick Dispatch) -> Nâng Cấp Công Sự -> Chi Tiết Tại Sector Operations.
- **F. Đồng Bộ Chế Độ Toàn Màn Hình (`world-fullscreen-overlay.tsx`)**:
  - Hoạt động mượt mà ở cả chế độ nhúng (640px) và toàn màn hình (100vw x 100vh).
  - Phím tắt `ESC` và nút đóng góc trên bên phải được căn chỉnh lề chống đè lấn với thanh HUD.
- **Bộ Kiểm Thử Mới (`tests/world/galaxy-map-hud-ui.test.ts`)**:
  - 7/7 test cases chuyên sâu kiểm định đầy đủ: 8 sector & 12 routes canonical, phân cấp Threat 3 dải, trạng thái 4 loại tuyến đường, giai đoạn vòng đời & combat lock, đạo quân hành quân & gán đích đến, tính toán đồng bộ chỉ số HUD, và tính toàn vẹn khi thao tác lệnh/công sự.


*Đã hoàn thành 100% Đợt 2 (Phase 6.10) — Nâng cấp toàn diện mục Sự kiện & Nhiệm vụ trong Operations Center, đạt khả năng đọc nhanh, phân biệt rõ các pha vòng đời, trực quan hóa cây nhiệm vụ và tổng hợp biến động chu kỳ tick (100% tests PASS, zero-regression toàn bộ 22 test suites)*

### Các tính năng & nâng cấp giao diện đã triển khai:
- **Thành Phần Giao Diện Chuyên Biệt (`components/game/world/events-missions-board.tsx`)**:
  - Tách và module hóa bảng điều phối Sự kiện & Nhiệm vụ thành component độc lập, kết nối mượt mà với `OperationsCenter` và bảo toàn 100% logic gameplay và lưu trữ của Phase 6.7/6.8/Đợt 1.
  - Tích hợp thanh công cụ Quick Counters: Cần Quyết Định (INIT), Đang Xử Lý (PROCESSING), Chuỗi Nhiệm Vụ Đang Chạy, kèm nút liên kết nhanh sang *Dual Results Hub*.
  - Bộ lọc danh mục 5 chế độ: `Tất Cả Tổng Hợp`, `Cần Phê Chuẩn [INIT]`, `Đang Triển Khai [PROCESSING]`, `Cây Chuỗi Nhiệm Vụ`, `Báo Cáo Gần Đây`.
- **A. Sự Kiện Cần Xử Lý (Actionable Events — INIT)**:
  - *Ưu tiên thị giác cao nhất*: Đặt ở vị trí đầu tiên kèm đếm ngược và phân cấp khẩn cấp đa tín hiệu (không phụ thuộc màu sắc đơn thuần):
    * Cấp bách (Hết hạn trong 1 ngày / hôm nay hoặc Severity `critical`): Viền nổi bật, hiệu ứng nhịp tim, icon `AlertOctagon`, nhãn "CẤP BÁCH: HẾT HẠN TRONG 1 NGÀY".
    * Nghiêm trọng (Severity `warning` hoặc còn 2 ngày): Icon `AlertTriangle`, nhãn cảnh báo.
    * Tiêu chuẩn (Severity `info`): Icon `Clock`.
  - Hiển thị đầy đủ: Tên sự kiện, Phân loại (`crisis`, `military`, `economic`, `diplomatic`, `anomaly`), Địa bàn Sector hoặc Toàn Cầu, Hạn chót, Diễn biến chi tiết.
  - Cảnh báo phương án mặc định: Nêu rõ chiến lược sẽ tự động kích hoạt nếu người chơi không can thiệp kịp trước hạn.
  - Lưới lựa chọn phương án đối ứng: Thẻ chi tiết từng phương án kèm chi phí tài nguyên, thời gian xử lý, tỷ lệ thành công, huy hiệu "Mặc Định", kiểm tra điều kiện chi trả và nút "Phê Chuẩn Phương Án".
- **B. Sự Kiện Đang Diễn Ra (In-Progress Events — PROCESSING)**:
  - Phân tách rõ ràng với sự kiện INIT; hiển thị chiến lược đang được thực thi và mô tả chi tiết.
  - Thanh tiến độ trực quan (Progress Bar): Thể hiện tỷ lệ hoàn thành theo thời gian thực (%), ngày đích đến và số ngày còn lại.
  - Huy hiệu liên kết Buồng Lái: Nhận diện và hiển thị nếu sự kiện đang chờ kết quả trận đấu can thiệp buồng lái (`encounterTransactionId`).
- **C. Đồ Thị Cây Chuỗi Nhiệm Vụ (Mission Chain Tree Flow)**:
  - Thay thế danh sách thẻ phẳng bằng cấu trúc lộ trình trực quan: Thể hiện hình thái nhiệm vụ (`linear`, `branching`, `threshold`, `reactive`, `periodic`, `standalone`), ngày bắt đầu và tỷ lệ bước hoàn thành.
  - Thẻ các bước (Nodes) phân cấp rõ 4 trạng thái:
    * **Hoàn Tất (Completed)**: Viền ngọc bích, icon `CheckCircle2`, tóm tắt phần thưởng nhận được.
    * **Đang Tác Chiến (Active)**: Viền lục lam rực rỡ, vòng quét radar, thông tin sector mục tiêu.
    * **Chưa Mở Khóa (Locked)**: Gam màu tối giản, icon `Lock`, nêu rõ bước tiên quyết cần hoàn thành.
    * **Đang Chờ Điều Kiện Sector (Pending Dispatch)**: Huy hiệu cảnh báo màu hổ phách dành riêng cho các node có `isPendingDispatch: true`, nêu rõ nguyên nhân sector đang bận/trùng sự kiện và số ngày đã hoãn/hạn tối đa trước khi tự động giải tỏa.
- **D. Tổng Hợp Kết Quả Chu Kỳ & Nhật Ký Gần Đây (Events Summary & Recent Feed)**:
  - Tận dụng `eventsSummary` từ `executeWorldTick`: Hiển thị banner tổng hợp biến động ngày gọn gàng ngay đầu trang, phân tách minh bạch:
    * *Sự kiện Tự Động Khóa Phương Án Mặc Định*: Danh sách các sự kiện quá hạn tự động chuyển sang PROCESSING theo phương án mặc định.
    * *Sự kiện Đã Hoàn Tất*: Danh sách sự kiện hoàn tất và áp dụng hậu quả thành công.
  - Hợp nhất thông báo Toast thành một thông điệp duy nhất có tính bao quát, loại bỏ hiện tượng spam nhiều toast độc lập.
  - Dải kết quả gần đây (Recent Results Feed): Hiển thị 5 kết quả mới nhất từ Archive kèm trạng thái Thành Công / Mặc Định / Thất Bại, biến động tài nguyên, nút đánh dấu đã đọc và liên kết chuyển đến *Dual Results Hub* để xem toàn bộ lịch sử chi tiết.
- **Bộ Kiểm Thử Toàn Diện (`tests/world/events-missions-ui.test.ts`)**:
  - 6/6 test cases kiểm thử tự động toàn diện:
    1. Phân loại và sắp xếp ưu tiên sự kiện INIT theo hạn chót và mức độ khẩn cấp.
    2. Chuyển đổi trạng thái sang PROCESSING và tính toán tỷ lệ tiến độ chính xác.
    3. Nhận diện cờ `isPendingDispatch` và thông số hoãn bước nhiệm vụ.
    4. Cây nhiệm vụ phân cấp đúng các trạng thái Completed, Active, Locked.
    5. `executeWorldTick` trả về `eventsSummary` phân tách minh bạch Auto-Locked vs Resolved.
    6. Lưu và nạp lại bảo toàn nguyên vẹn WorldState, Event Archive và đánh dấu đã đọc.

---

## [Phase 6.8+ / Đợt 1] — STARFRONT WORLD: Event Concurrency Guard & Deadline Resolution

*Đã hoàn thành 100% Đợt 1 — Xử lý xung đột sự kiện trên cùng sector và hoàn thiện cơ chế giải quyết deadline đồng thời (100% tests PASS, zero-regression toàn bộ 21 test suites)*

### Các cơ chế & quy tắc đã triển khai:
- **Event Concurrency Guard (`canRegisterWorldEvent` trong `lib/game/world/event-engine.ts`)**:
  - *Chống trùng lặp template trên cùng sector*: Ngăn chặn việc cùng một template sự kiện (ví dụ `evt_void_skirmish_raid`) bị kích hoạt lặp lại nhiều lần trên một sector khi sự kiện trước chưa kết thúc (`INIT` hoặc `PROCESSING`). Tránh hiện tượng dồn ép trừ Stability đột ngột.
  - *Cho phép sự kiện khác loại cùng tồn tại hợp lý*: Các sự kiện khác `templateId` (ví dụ: Bão Plasma thiên văn `anomaly` + Đình công công nhân `civil` + Đột kích Void `military`) hoàn toàn được phép diễn ra đồng thời trên cùng một sector, không áp đặt giới hạn cơ học cứng nhắc.
  - *Chống trùng lặp quy mô thiên hà*: Chỉ cho phép tối đa 1 sự kiện `scope: "galaxy"` cùng `templateId` hoạt động đồng thời.
  - *Chống trùng sự kiện từ cùng mission chain*: Mỗi chuỗi nhiệm vụ chỉ được mở tối đa 1 sự kiện active trên cùng một sector tại một thời điểm.
- **Cơ Chế Trì Hoãn Có Kiểm Soát & Chống Kẹt Chuỗi Nhiệm Vụ (`isPendingDispatch` & `MAX_DISPATCH_DEFER_TICKS`)**:
  - Khi một bước trong chuỗi nhiệm vụ (`MissionChainNode`) không thể kích hoạt sự kiện do sector đang bận hoặc đầy trần, node được đánh dấu `isPendingDispatch: true` kèm `pendingEvent` lưu trữ an toàn thay vì bị từ chối làm mồ côi bước.
  - Tích hợp hàm `retryPendingMissionChainDispatches` vào đầu Phase 6 của Tick Engine: tự động thử kích hoạt lại ngay khi Phase 5 đã giải phóng các sự kiện cũ trên sector.
  - Cơ chế giải tỏa có kiểm soát (Controlled Fallback): Nếu bước bị hoãn quá `MAX_DISPATCH_DEFER_TICKS = 4` ticks (4 ngày chiến lược), hệ thống tự động giải tỏa bước đó an toàn và chuyển tiếp chuỗi sang bước tiếp theo, bảo đảm chuỗi nhiệm vụ **tuyệt đối không bao giờ bị mắc kẹt vô hạn**.
- **Giải Quyết Nhiều Deadline Đồng Thời Tất Định (Deterministic Tie-Breaking & Rich Summary)**:
  - Tinh chỉnh trật tự tie-breaking trong `advanceEventLifecyclesAndDeadlines`: `(priority DESC -> deadline ASC -> createdAtTick ASC -> id ASC)`.
  - Bổ sung cấu trúc dữ liệu `EventLifecycleSummary` trả về từ Phase 5 chuyển tiếp vào `TickExecutionResult` (`eventsSummary`), cung cấp đầy đủ thông tin phân loại theo category, severity, danh sách sự kiện auto-locked và resolved để phục vụ UI tổng hợp biến động ngày.
- **Bảo Vệ Tính Lũy Đẳng Tuyệt Đối (Idempotency Guard)**:
  - Bảo đảm cờ `event.consequencesApplied = true` được kiểm tra chặt chẽ, ngăn chặn áp dụng hậu quả hai lần ngay cả sau khi reload `localStorage` hoặc gọi lặp lại.
- **Bộ Kiểm Thử Tập Trung (`tests/world/event-concurrency-guard.test.ts`)**:
  - 6/6 test cases chuyên sâu kiểm chứng đầy đủ các kịch bản:
    1. Hai sự kiện trùng loại trên cùng sector bị chặn an toàn.
    2. Hai sự kiện khác loại cùng tồn tại hợp lý đồng thời.
    3. Sự kiện bị chặn không làm kẹt mission chain (Retry & Controlled Fallback).
    4. Nhiều deadline trùng nhau xử lý tất định theo tie-breaking.
    5. Hậu quả không bị áp dụng 2 lần sau reload.
    6. Sự kiện mới sinh ra từ mission chain không bị resolve nhầm trong cùng tick.

---

## [Phase 6.9] — STARFRONT WORLD: Bản Đồ Toàn Màn Hình, Tinh Chỉnh Thị Giác & Kiểm Thử Tích Hợp Toàn Diện (Fullscreen Map, Polish & E2E Verification)

*Đã hoàn thành 100% Phase 6.9 — Phase cuối cùng trong lộ trình STARFRONT WORLD (100% automated tests PASS, build thành công, 9/9 tests E2E Phase 6.9 PASS, bảo toàn zero-regression toàn bộ hệ thống)*

### Tính năng & cơ chế đã hoàn thành trong Phase 6.9:
- **Bản Đồ Thiên Hà Toàn Màn Hình Chuẩn Sci-Fi Aerospace (`components/game/world/world-map.tsx`)**:
  - Tích hợp mạng lưới 8 Sector thiên hà và 12 Tuyến Siêu Không Gian (Hyperlanes) lấy trực tiếp từ `WorldState` và graph chuẩn (`INITIAL_WORLD_SECTORS`, `INITIAL_WORLD_ROUTES`), không hardcode.
  - Hiển thị trực quan chủ quyền lãnh thổ (VSS, The Void, Tranh Chấp, Trung Lập) và 5 giai đoạn vòng đời (`stable`, `threatened`, `under_siege`, `lost`, `recovery`).
  - Phân cấp trạng thái 12 tuyến đường bằng màu sắc và nét vẽ: Bình Thường (`open`), Nguy Cấp (`hazardous`), Bị Khóa (`blocked`), Mất Kết Nối (`offline`).
  - Trực quan hóa các cánh quân viễn chinh đang hành quân `in_transit` với điểm xuất phát, đích đến, số quân và số ngày còn lại.
  - Hiển thị vòng khóa tác chiến màu đỏ xung quanh các sector đang bị khóa combat (`isLockedForCombat`).
  - Hỗ trợ công cụ điều khiển bản đồ: Phóng to (+), Thu nhỏ (-), Căn giữa (Reset View), Lưới tọa độ chiến thuật Sci-Fi HUD và thông tin phụ trợ.
  - Bảng điều khiển kiểm tra chi tiết (Sector Inspector Panel):
    * Xem thông tin dân số, lương thực, tài nguyên, lực lượng đồn trú VSS vs The Void.
    * Thay đổi Lệnh Chiến Lược Đồn Trú (`normal`, `defend`, `reinforce`, `attack`, `recover`).
    * Nâng cấp Công Sự Phòng Thủ (0..5 cấp).
    * Các nút liên kết thao tác nhanh: "Chi Tiết Tại Sector Operations", "Điều Động Chi Viện" (mở Quick Dispatch), "Tham Chiến Khẩn Cấp" (khi có sự kiện combat).
- **Khung Trực Quan Hóa Toàn Màn Hình 100vw/100vh (`components/game/world/world-fullscreen-overlay.tsx`)**:
  - Chế độ toàn màn hình không viền chuyên dụng với thanh tiêu đề HUD quân sự, chỉ số vĩ mô tóm tắt (Ngày chiến lược, Threat trung bình, Tỷ lệ kiểm soát VSS).
  - Hỗ trợ phím tắt bàn phím `ESC` để đóng chế độ toàn màn hình mượt mà, cùng nút thoát trực tiếp trên thanh công cụ.
  - Tích hợp trực tiếp Bến Điều Động Nhanh (`QuickDispatchDock`) ngay trên bản đồ toàn màn hình.
- **Tích Hợp Điều Hướng Đa Chiều Trong Operations Center & Starfront Shell**:
  - Bổ sung tab "Bản Đồ Thiên Hà" (`map`) vào hệ thống Navigation của Operations Center.
  - Bổ sung nút chuyển đổi Toàn Màn Hình (`Maximize2`) tại tiêu đề Operations Center và thanh công cụ bản đồ.
  - Bổ sung nút "Xem Vị Trí Trên Bản Đồ" từ thẻ Sector của tab `sectors` chuyển mượt mà sang `map` với sector tương ứng được chọn sẵn.
  - Cập nhật cây submenu `map` trong mục WORLD của thanh điều hướng chính `starfront-shell.tsx`.
- **Bộ Kiểm Thử Tích Hợp E2E Toàn Diện (`tests/world/e2e-world-integration.test.ts`)**:
  - 9/9 subtests E2E kiểm chứng toàn bộ luồng nghiệp vụ thực tế của hệ thống:
    1. *Nạp bản đồ*: Chuẩn xác 8 sector và 12 tuyến đường từ WorldState.
    2. *Tương tác Inspector*: Chọn sector, cập nhật lệnh chiến lược và nâng cấp công sự.
    3. *Định tuyến quân sự*: Điều quân qua tuyến hợp lệ, chặn đứng tuyến Blocked/Offline, bảo toàn tuyệt đối quân số.
    4. *Cơ chế phòng thủ*: Chặn xuất quân khỏi sector đang bị khóa giao tranh (`isLockedForCombat`).
    5. *Tiến 1 Ngày (Tick Engine)*: Cập nhật Threat, di chuyển quân đoàn và phản ánh đúng đắn WorldState.
    6. *Vòng đời sự kiện*: Áp dụng hậu quả chỉ đúng 1 lần (Idempotency Guard).
    7. *Kết quả chiến đấu*: Commit qua Combat Adapter và chống áp dụng lần 2 qua Transaction Journal.
    8. *Lưu trữ bền vững*: Lưu và nạp bảo toàn nguyên vẹn WorldState qua `STARFRONT_WORLD_SAVE_V1`.
    9. *Zero-Regression*: Đảm bảo 100% tiến trình RPG Schema v4 (Phi công, Gear, Trang bị, Nhiệm vụ) độc lập và không suy suyển.
- **Hoàn Tất Lộ Trình STARFRONT WORLD**:
  - Toàn bộ 9 sub-phases (Phase 6.1 đến 6.9) của bản đồ chiến lược vĩ mô STARFRONT WORLD đã được triển khai hoàn chỉnh, liên kết chặt chẽ với buồng lái Đấu Trường và giao diện Shell.

---

## [Phase 6.8] — STARFRONT WORLD: Giao Diện Operations Center & Trung Tâm Kết Quả Kép (Operations Center UI & Dual Results Hub)

*Đã hoàn thành 100% Phase 6.8 (100% automated tests PASS, build thành công, 8/8 tests Phase 6.8 PASS, tích hợp trực tiếp vào thanh điều hướng của Shell)*

### Tính năng & cơ chế đã hoàn thành trong Phase 6.8:
- **Giao Diện Tổng Hành Dinh Tác Chiến (`components/game/world/operations-center.tsx`)**:
  - Tích hợp mục "Chỉ Huy Chiến Lược // WORLD" vào thanh điều hướng cấp cao nhất của `starfront-shell.tsx`, kết nối trực tiếp với tiến trình `WorldState` thực tế.
  - Hỗ trợ 5 phân khu chức năng:
    * **Tình Hình Chiến Lược (Situation Deck)**: Hiển thị ngày chiến lược, tỷ lệ kiểm soát thiên hà (VSS vs Contested vs The Void), Threat trung bình, tình trạng dân số, kho dự trữ 4 tài nguyên chiến lược và lương thực riêng. Bảng cảnh báo thời gian thực cảnh báo các sector nguy cấp (`under_siege`, `threatened`) và sự kiện sắp đến hạn chót.
    * **Mạng Lưới Sector (Sector Operations)**: Danh sách thẻ trực quan và Inspector chi tiết từng sector. Cho phép đổi Lệnh Chiến Lược Đồn Trú (`normal`, `defend`, `reinforce`, `attack`, `recover`), nâng cấp công sự phòng thủ (0..5) và mở can thiệp buồng lái (`CombatArena`) khi sector bị đe dọa.
    * **Sự Kiện & Nhiệm Vụ (Active Operations Board)**: Hiển thị các sự kiện thời gian thực đang diễn ra; hỗ trợ phê chuẩn các phương án phản ứng (Strategy) khi sự kiện ở trạng thái `INIT`; hiển thị tiến độ các chuỗi nhiệm vụ chiến lược.
    * **Quân Sự & Hậu Cần (Military & Logistics)**: Trực quan hóa Sổ Cái Lực Lượng Quân Sự Bảo Toàn (5 trạng thái), các đạo quân đang hành quân `in_transit` và mạng lưới tuyến đường siêu không gian (`open`, `hazardous`, `blocked`).
    * **Trung Tâm Kết Quả Kép (Dual Results Hub)**: Tích hợp phân khu báo cáo 2 luồng.
  - Các nút hành động chiến lược: Tiến 1 Ngày (`handleAdvanceTick`), Điều Quân Nhanh (`QuickDispatchDock`), Lưu Trạng Thái An Toàn (`saveWorldState`).
- **Trung Tâm Kết Quả Kép (`components/game/world/dual-results-hub.tsx`)**:
  - Phân tách rạch ròi 2 luồng báo cáo:
    * **Tab 1: Báo Cáo Sự Kiện (Event Results)**: Lấy từ `worldState.eventResultsArchive`, hiển thị danh mục, mức độ khẩn cấp, phương án đã chọn, biến động tài nguyên và tóm tắt kết quả.
    * **Tab 2: Nhật Ký Chiến Đấu (Battle Results)**: Lấy từ `worldState.transactionJournal` (các giao dịch `combat` đã `committed`), hiển thị số hiệp, HP còn lại, xếp hạng chiến thuật và tóm tắt giao tranh.
  - Huy hiệu thông báo chưa đọc (`Unread Count Badge`) và nút "Đọc Tất Cả".
  - Bộ lọc theo trạng thái: Tất Cả, Chưa Đọc, Thắng/Tốt, Thua/Xấu.
  - Cơ chế **Xóa Lịch Sử An Toàn (Safe Pruning)**: Cho phép dọn dẹp các log sự kiện đã đọc mà **tuyệt đối không làm thay đổi bất kỳ chỉ số tài nguyên, quân sự, dân số hay mức Threat nào của World State**.
- **Bến Điều Động Chi Viện Nhanh (`components/game/world/quick-dispatch-dock.tsx`)**:
  - Cho phép xuất quân chi viện tức thì từ Kho Dự Bị Trung Ương (Sol Command HQ) hoặc từ đồn trú một sector.
  - Cơ chế phòng thủ: Chặn tuyệt đối việc điều động quân rời khỏi sector đang bị khóa trong combat (`isLockedForCombat`).
  - Tự động tính toán lộ trình ngắn nhất qua mạng lưới tuyến đường siêu không gian.
- **Kiểm Thử Tự Động Toàn Diện (`tests/world/operations-center-ui.test.ts`)**:
  - 8/8 tests tự động PASS 100%: Situation Deck metrics, Quick Dispatch locking guard, Lệnh chiến lược & Nâng cấp công sự, Phân tách kết quả kép, Safe Pruning bảo toàn chỉ số 100%, Đánh dấu đã đọc/Đọc tất cả, Tiến ngày Tick Engine, Lưu & Nạp bền vững qua Storage V1.

---

## [Phase 6.7] — STARFRONT WORLD: Động Cơ Vòng Đời Sự Kiện & Chuỗi Nhiệm Vụ Chiến Lược (Event Lifecycle Engine & Strategic Mission Chains)

*Đã hoàn thành 100% Phase 6.7 (100% automated tests PASS, build thành công, 8/8 tests Phase 6.7 PASS)*

### Tính năng & cơ chế đã hoàn thành trong Phase 6.7:
- **Động Cơ Vòng Đời Sự Kiện 3 Pha (`lib/game/world/event-engine.ts`)**:
  - Triển khai vòng đời khép kín `INIT` $\rightarrow$ `PROCESSING` $\rightarrow$ `RESULT`:
    * `INIT`: Sự kiện xuất hiện kèm đồng hồ đếm ngược `decisionDeadlineTick`. Người chơi có thể lựa chọn các phương án phản ứng (Strategy) với chi phí tài nguyên và yêu cầu quân sự rõ ràng.
    * Tự động khóa phương án mặc định (`autoLockDefaultStrategy`): Khi countdown về 0 mà người chơi chưa chọn lệnh, hệ thống tự động khóa và kích hoạt `defaultStrategyId`, không để sự kiện bị treo lơ lửng.
    * `PROCESSING`: Đang thực thi theo thời lượng xác định (`processingTicks`); lưu trữ bền vững qua các lần reload trang web và tiếp tục tiến trình qua batch offline catch-up.
    * `RESULT`: Đánh giá kết quả (thắng/thua, biến động tài nguyên, thương vong), ghi nhận vào kho lưu trữ bền vững `worldEventResultsArchive`.
  - Bộ lọc chống áp dụng hậu quả 2 lần (`applyEventConsequencesOnce` với guard `consequencesApplied`): Tuyệt đối chỉ áp dụng biến động tài nguyên, quân số, Stability và Threat đúng 1 lần duy nhất.
  - Phân tách rạch ròi Event Result với Battle Result, hỗ trợ đánh dấu đã đọc (`isRead`) và dọn dẹp an toàn (`pruneReadEventResultsSafe`) không làm thay đổi World State.
  - Sắp xếp thứ tự thực thi theo quy tắc tie-break tất định: `(priority DESC, createdAtTick ASC, id ASC)`.
- **Đồ Thị Chuỗi Nhiệm Vụ Chiến Lược 6 Hình Thái (`lib/game/world/mission-chains.ts`)**:
  - Hỗ trợ đầy đủ 6 cấu trúc chuỗi nhiệm vụ:
    1. *Linear (Tuyến tính)*: Bước 1 $\rightarrow$ Bước 2 $\rightarrow$ Bước 3 (`chain_linear_void_inquiry`).
    2. *Branching (Phân nhánh)*: Quyết định/chiến lược mở ra Nhánh Dân Sự hoặc Nhánh Quân Sự (`chain_branching_mining_crisis`).
    3. *Threshold-based (Theo ngưỡng)*: Tự động kích hoạt khi Threat $\ge 600$ (`chain_threshold_high_threat`).
    4. *Reactive (Phản ứng)*: Kích hoạt đáp trả khi sector bị vây hãm `under_siege` (`chain_reactive_rescue`).
    5. *Periodic / Patrol (Tuần hoàn)*: Nhiệm vụ tuần tra lặp lại định kỳ mỗi chu kỳ (`chain_periodic_patrol`) với cơ chế cooldown chống sinh vô hạn trong cùng một tick.
    6. *Standalone (Độc lập)*: Chiến dịch đặc biệt một lần (`chain_standalone_ancient_cache`).
  - Khống chế trần toàn cục `MAX_ACTIVE_MISSION_CHAINS = 8` và trần sự kiện `MAX_ACTIVE_EVENTS = 12`.
- **Bộ Cấu Hình 20 Sự Kiện Mẫu Sci-Fi (`lib/game/world/event-templates.ts`)**:
  - 20 sự kiện mẫu trải rộng trên 7 danh mục: Khủng hoảng (Crisis), Ngoại giao (Diplomacy), Quân sự (Military), Dị thường (Anomaly), Hậu cần (Logistics), Dân sự (Civil), Tình báo (Intel).
  - Mỗi sự kiện đều có mô tả lore vũ trụ, mức độ nghiêm trọng, thời hạn đếm ngược, chiến lược mặc định và các phương án xử lý kèm chi phí/hậu quả.
- **Tích Hợp Tick Engine & Bộ Lưu Trữ Bền Vững**:
  - Tích hợp vào Phase 5 của Tick Engine: Kiểm tra countdown event, tự động chuyển `INIT` $\rightarrow$ `PROCESSING`, hoàn tất `PROCESSING` $\rightarrow$ `RESULT`, và chuyển tiếp các nút trong chuỗi nhiệm vụ.
  - Tích hợp vào Phase 6 của Tick Engine: Quét và kích hoạt các chuỗi nhiệm vụ theo ngưỡng (Threshold), phản ứng (Reactive) và tuần hoàn (Periodic).
  - Tương thích 100% với `STARFRONT_WORLD_SAVE_V1` và cơ chế di chuyển/default an toàn trong `storage.ts`.
- **Kiểm Thử Đơn Vị Đầy Đủ (`tests/world/event-lifecycle.test.ts`)**:
  - 8/8 bài kiểm thử chuyên sâu bao phủ trọn vẹn: Vòng đời 3 pha, Deadline online/offline catch-up, Idempotency guard, 6 cấu trúc Mission chain, Trần 8 chuỗi, Reload & Safe pruning, Combat adapter contract, và Deterministic PRNG.

---

## [Phase 6.6] — STARFRONT WORLD: Khế Ước Tích Hợp Chiến Đấu & Nhật Ký Giao Dịch Lũy Đẳng (Combat Integration Adapter & Idempotent Journal)

*Đã hoàn thành 100% Phase 6.6 (100% automated tests PASS, build thành công, 8/8 tests Phase 6.6 PASS)*

### Tính năng & cơ chế đã hoàn thành trong Phase 6.6:
- **Tầng Adapter Khế Ước Chiến Đấu (`lib/game/world/combat-adapter.ts`)**:
  - Tầng trung gian duy nhất kết nối giữa WORLD và buồng lái Đấu Trường (`CombatArena`, `engine.ts`).
  - Hàm `lockEncounterAndCreateSnapshot`: Khóa sector và đóng băng quân đồn trú (`isLockedForCombat = true`, `lockedGarrisonPower`), ngăn chặn mọi điều động quân và chỉnh sửa trong khi trận diễn ra; tạo bản chụp `EncounterSnapshot` bất biến với chỉ số kẻ địch tính toán theo Threat của sector và các hệ số chiến lược VSS (`friendlyModifiers`).
  - Cấp phát `transactionId` và `encounterId` duy nhất, ổn định.
  - Hàm `commitCombatResultReceipt`: Tiếp nhận biên lai `CombatResultReceipt`, chuyển đổi thành hậu quả chiến lược có thẩm quyền trên World State (giảm Threat, tăng Stability, thưởng tài nguyên, hạch toán thương vong bảo toàn quân số).
  - Hậu quả thất bại theo ngữ cảnh (Contextual Defeat Penalties): Thất bại không mất trắng sector ngay; trừ công sự phòng thủ, sector chuyển sang `under_siege`, bảo toàn quân số qua thương vong và thương binh. Chỉ chuyển giao quyền kiểm soát (`lost` -> `void`) khi phòng tuyến và đồn trú sụp đổ hoàn toàn.
  - Tự động mở khóa an toàn cho sector sau khi trận chiến hoàn tất (`isLockedForCombat = false`).
  - Hàm `convertBattleResultToReceipt`: Cầu nối chuyển đổi dữ liệu kết quả trực tiếp từ Combat Engine hiện có thành `CombatResultReceipt` chuẩn hóa.
- **Sổ Nhật Ký Giao Dịch Lũy Đẳng (`lib/game/world/transaction-journal.ts`)**:
  - Bộ lọc lũy đẳng (Idempotency Filter): Kiểm tra `isTransactionCommitted` trước khi xử lý biên lai. Gửi liên tục 10 lần cùng một biên lai chiến thắng chỉ áp dụng đúng 1 lần duy nhất, các lần sau từ chối an toàn và giữ nguyên trạng thái.
  - Quản lý vòng đời giao dịch với 5 trạng thái minh bạch: `pending` -> `awaiting_commit` -> `committed` / `needs_recovery` / `aborted`.
  - Hàm `reconcileCombatTransactionsInTick`: Tích hợp vào Phase 1 của Tick Engine để tự động đối soát, phát hiện và chuyển các trận chiến bị ngắt quãng/treo sang trạng thái `needs_recovery`.
  - Cơ chế dọn dẹp an toàn (`pruneJournal`): Cho phép cắt giảm các bản ghi giao dịch đã xong nhưng luôn bảo toàn danh sách `committedTransactionIds` để bộ lọc lũy đẳng hoạt động vĩnh viễn.
- **Luồng Phục Hồi Treo & Hủy Bỏ An Toàn (Suspended Recovery & Safe Abort)**:
  - Hàm `resumeSuspendedCombat`: Cho phép buồng lái khôi phục nguyên vẹn trận chiến từ bản chụp bất biến sau khi người chơi reload ứng dụng.
  - Hàm `abortSuspendedCombat`: Cho phép hủy bỏ trận đấu treo một cách an toàn mà không bị phạt thua oan; hoàn trả đồn trú về trạng thái trước khi khóa trận và mở khóa sector. Chặn hoàn toàn việc commit kết quả sau khi đã abort.
- **Bảo Vệ Tính Toàn Vẹn Lưu Trữ & Đồng Bộ Save V1**:
  - Lưu trữ và phục hồi hoàn hảo qua `STARFRONT_WORLD_SAVE_V1` với xác thực Checksum 100%.
- **Kiểm Thử Đơn Vị Đầy Đủ (`tests/world/combat-adapter-idempotency.test.ts`)**:
  - 8/8 bài kiểm thử chuyên sâu bao phủ trọn vẹn các kịch bản khóa trận, chống double-application 10 lần, kết quả không hợp lệ, contextual defeat, suspended recovery, safe abort và lưu trữ.

---

## [Phase 6.5] — STARFRONT WORLD: Phe Phái VSS & The Void, Lực Lượng Quân Sự & Auto-Resolve (Factions, Authoritative Military Ledger & Auto-Resolve)

*Đã hoàn thành 100% Phase 6.5 (100% automated tests PASS, 22/22 tests Phase 6.5 PASS)*

### Tính năng & cơ chế đã hoàn thành trong Phase 6.5:
- **Sổ Cái Quân Lực Có Thẩm Quyền (`lib/game/world/forces-ledger.ts`)**:
  - Quản lý 5 trạng thái quân đội theo định luật bảo toàn tuyệt đối: `Total Force = Deployed + Reserves + Wounded + Retreating + InTransit + Casualties`.
  - Kiểm soát điều động quân sự (`dispatchTroopDeployment`, `advanceTroopDeployments`) tôn trọng trạng thái tuyến đường (Dijkstra shortest path).
  - Chuyển giao quyền kiểm soát sector an toàn (`transferSectorControl`) bảo toàn dân số và tài sản.
- **Thuật Toán Lanchester Auto-Resolve Cải Tiến (`lib/game/world/auto-resolve.ts`)**:
  - Tự động hóa các trận chạm trán phụ với tính tất định 100% qua Seeded PRNG.
  - Phân bổ tổn thất minh bạch: 50% thương vong vĩnh viễn (Casualties) và 50% thương binh điều trị (WoundedOrRepair).
- **Hành Vi Chiến Lược The Void & Quy Tắc Sol HQ (`lib/game/world/threat-ai.ts`)**:
  - AI The Void đánh giá điểm yếu phòng tuyến VSS, tổ chức vây hãm và tập kích có thứ tự.
  - Quy tắc bảo vệ căn cứ Sol Command HQ bất khả xâm phạm khi các chốt chặn tiền tiêu còn đứng vững.

---

*Đã hoàn thành 100% Phase 6.4 (170/170 automated tests passed, build thành công, 21/21 tests Phase 6.4 PASS)*

### Tính năng & cơ chế đã hoàn thành trong Phase 6.4:
- **Kinh Tế Chiến Lược & Mô Hình 4+1 Tài Nguyên (`lib/game/world/economy.ts`)**:
  - Tách bạch dứt khoát 4 nhóm tài nguyên chiến lược vĩ mô (`industrialMaterials`, `energy`, `logisticsSupplies`, `tacticalData`) và Lương thực thiết yếu (`food`) độc lập, không bị gộp vào vật tư hậu cần.
  - Công thức sản xuất phản ánh năng lực công nghiệp của sector (`industryCapacity`), điều chỉnh theo hệ số giai đoạn vòng đời (`normal: 1.0`, `threatened: 0.85`, `under_siege: 0.3`, `recovery: 0.5`, `lost: 0.0`) và hệ số Stability (`>= 80`: +15% prosperity boost; `50-79`: 100%; `25-49`: -25% unrest penalty; `< 25`: -50% crisis penalty).
  - Tỷ lệ tiêu thụ lương thực dân sinh chuẩn hóa: $100,000 \text{ dân} = 150 \text{ đơn vị Food/ngày}$.
  - Tính toán ba năng lực chiến lược vĩ mô: Industry toàn cục, Logistics throughput mạng lưới, và Stability trung bình.
  - Cơ chế suy thoái do thiếu hụt lương thực theo từng bậc (Gradual Shortage Degradation):
    * Ngày 1–2: Cảnh báo đỏ, Stability giảm -5/ngày.
    * Ngày 3–5: Stability giảm -8/ngày, phạt 25% phòng thủ, sản lượng công nghiệp giảm 50%.
    * Sau 5 ngày: Phát sinh thương vong đói (1% dân số/ngày), Stability giảm -12/ngày.
  - Bảo vệ kho tài nguyên không bao giờ âm vô lý; đồng bộ hóa kho tổng quốc gia theo tổng tồn kho thực tế tại các sector VSS.
- **Mạng Lưới Hậu Cần & Mức Dự Trữ An Toàn (`lib/game/world/logistics.ts`)**:
  - Mức dự trữ an toàn 3 ngày (Safety Stock Buffer = $3 \times \text{DailyConsumption}$): Sector nguồn luôn bảo toàn tối thiểu 3 ngày lương thực và vật tư trước khi cho phép xuất khẩu.
  - Quản lý hàng hóa đang trên đường (In-Transit Convoys): Khấu trừ ngay tại kho sector xuất khi đoàn xe khởi hành; không thể bị tiêu thụ trước khi đến đích; ghi nhận vào `InFlightTransaction` với trạng thái `pending`.
  - Hàng hóa chỉ được cộng vào kho đích khi đến nơi an toàn (`status: "delivered"`).
  - Xử lý các trạng thái tuyến đường qua đồ thị:
    * `Open`: 100% thông lượng, 0% hao hụt.
    * `Hazardous`: Hao hụt tài nguyên 20% do cướp bóc/quấy rối (Attrition rate = 0.2), giảm tốc độ hành quân.
    * `Blocked` & `Offline`: Chặn tuyệt đối, không cho phép vận tải đi qua các tuyến bị phong tỏa hoặc cắt đứt.
  - Tự động điều phối hậu cần (Automated Logistics Balancing): Quét phát hiện sector thiếu hụt và tự động ghép cặp với sector có thặng dư theo đúng thứ tự ưu tiên: Cứu đói (Food) $\rightarrow$ Phòng thủ (Energy) $\rightarrow$ Quân sự (Supplies) $\rightarrow$ Công nghiệp (Materials) $\rightarrow$ Tình báo (Tactical Data).
- **Nhân Khẩu Học & Quy Tắc Di Cư Bảo Toàn Tuyệt Đối (`lib/game/world/demographics.ts`)**:
  - Phân tách rõ ràng giữa Dân số quốc gia (`nationalTotalPopulation`) và Dân số trong vùng kiểm soát thực tế (`controlledTerritoryPopulation`).
  - Dân sự bị chiếm đóng (Suppressed Population): Dân chúng tại sector bị Void chiếm hoặc tranh chấp vẫn là thường dân chịu áp bức, không bị biến thành lính Void.
  - Quy tắc bảo toàn di cư dân số (Zero-Sum Migration Conservation): Khi sơ tán, dân số trừ khỏi sector đi, cộng vào `refugeesInTransit`; khi cập bến, cộng người sống sót vào sector đến và cộng tổn thất (nếu qua tuyến Hazardous) vào `civilianCasualties`.
  - Tổng dân số toàn ngân hà luôn thỏa mãn đẳng thức bảo toàn 100%: $\sum \text{Dân số Sector} + \text{Dân số Đang Di Tản} + \text{Thương Vong Tích Lũy} = \text{Dân Số Quốc Gia}$.
  - Tăng trưởng dân số tự nhiên tại các sector VSS thịnh vượng (Stability $\ge 80$ và đủ lương thực) đồng bộ hóa tức thời trên toàn bộ các chỉ số nhân khẩu học.
- **Tích Hợp Vào Chu Kỳ Tick Engine 6 Phase (`lib/game/world/tick-engine.ts`)**:
  - Phase 2 kết nối hoàn chỉnh với `processLogisticsCycle` và `processDemographicsCycle`.
  - Phase 3 kết nối hoàn chỉnh với `processStrategicEconomyCycle`.
  - Bảo toàn tính tất định 100% qua Seeded PRNG.
- **Kiểm Thử Đơn Vị Đầy Đủ (`tests/world/economy-demographics.test.ts`)**:
  - 21 bài kiểm thử bao phủ toàn diện 5 nhóm yêu cầu A-E đạt 100% PASS.

---

## [Phase 6.3] — STARFRONT WORLD: Động Cơ Tick Chiến Lược & Mô Phỏng Bắt Kịp Ngoại Tuyến (Strategic Tick Engine, Seeded PRNG & Bounded Offline Catch-up)

*Đã hoàn thành 100% Phase 6.3 (149/149 automated tests passed, build thành công, 16/16 tests Phase 6.3 PASS)*

### Tính năng & cơ chế đã hoàn thành trong Phase 6.3:
- **Bộ Sinh Số Giả Ngẫu Nhiên Có Seed (`lib/game/world/random.ts`)**:
  - Triển khai thuật toán SplitMix32 và Mulberry32 chuẩn 32-bit cho mô phỏng tất định (Deterministic Simulation).
  - Lớp điều khiển `WorldPRNG` cung cấp các hàm `nextFloat()`, `nextInt(min, max)`, `chance(probability)`, `choice(items)`, và `stepSeed()`.
  - Kết quả có thể tái lập 100%: Cùng một seed ban đầu luôn sinh ra chuỗi số hoàn toàn trùng khớp trên mọi môi trường.
- **Quy Tắc Phá Vỡ Thế Hòa Ổn Định (`lib/game/world/tick-engine.ts`)**:
  - Hàm `stableTieBreakSort` triển khai quy tắc sắp xếp ưu tiên theo thiết kế G.3: `(priorityLevel DESC, scheduledTimestamp ASC, entityId ASC)`.
  - Đảm bảo trật tự thực thi giữa các hạm đội, đoàn xe vận tải và sự kiện đến hạn cùng lúc luôn đồng nhất và bất biến.
- **Động Cơ Chuỗi 6 Phase Tick Chiến Lược (`lib/game/world/tick-engine.ts`)**:
  - Hàm điều phối `executeWorldTick` thực thi tuần tự nghiêm ngặt qua 6 phase theo chuẩn thiết kế G.1:
    * **Phase 1 (Phục hồi & Giao dịch đang chờ)**: Tự động commit các giao dịch in-flight pending, phục hồi 5% thương binh/sửa chữa cơ giáp chuyển về reserves, phục hồi tự nhiên nhẹ tại các sector Recovery.
    * **Phase 2 (Vận chuyển & Di cư)**: Điều phối dòng dân tị nạn an toàn, điểm kết nối kiến trúc cho Phase 6.4.
    * **Phase 3 (Kinh tế & Dân số)**: Tính toán sản xuất tài nguyên dựa trên năng lực công nghiệp của sector, điều chỉnh bởi Stability và hệ số giai đoạn sector; tiêu thụ lương thực thiết yếu (Food); kích hoạt cơ chế suy thoái từng bước (Gradual Attrition) khi cạn kiệt lương thực.
    * **Phase 4 (Quân sự & Mức đe dọa)**: Tính toán biến động Threat tự nhiên có seed; giới hạn trần tăng trưởng đe dọa tối đa (+50 Threat/ngày) ngăn ngừa hiệu ứng tuyết lở (Snowball Effect); tự động đánh giá chuyển giai đoạn sector.
    * **Phase 5 (Hạn chót & Kết quả)**: Kiểm tra các chuỗi nhiệm vụ active và countdown sự kiện (điểm kết nối Phase 6.5 & 6.6).
    * **Phase 6 (Kích hoạt mới)**: Quét kích hoạt sự kiện mới, giữ chỗ mở rộng cho Phase 6.7.
  - Mỗi tick tiến hóa seed một bước xác định (`worldSeed = prng.stepSeed()`), tăng `currentDay += 1`, cập nhật dấu thời gian và trả về chi tiết log thay đổi.
  - Kiểm chứng tính tất định (Deterministic Verification): Chạy 100 ticks với cùng trạng thái và seed ban đầu cho ra kết quả trùng khớp 100%.
- **Mô Phỏng Bắt Kịp Ngoại Tuyến Theo Đợt (`lib/game/world/catchup-engine.ts`)**:
  - Đo khoảng thời gian vắng mặt thực tế (`calculatePendingTicks`): Chu kỳ chuẩn $1 \text{ Strategic Day} = 300 \text{ giây thực}$.
  - Cơ chế bắt kịp an toàn theo từng đợt (Bounded Batch Catch-up): `MAX_TICKS_PER_BATCH = 50 ticks` kèm cơ chế yield luồng không gây treo hay đơ trình duyệt.
  - Trần bảo vệ ngoại tuyến: Kẹp chặt ở tối đa `OFFLINE_CATCHUP_CAP = 360 ticks` (~30 ngày thực tế) chống tàn phá thế giới người chơi.
  - Chống gian lận đồng hồ (Clock Tampering): Nếu phát hiện thời gian hệ thống bị lùi lại, tự động bỏ qua tick và giữ nguyên World State hiện tại.
  - Giả lập offline 7 ngày thực tế (~2016 ticks $\rightarrow$ kẹp 360 ticks) hoàn tất xử lý trong ~10-15ms (dưới ngưỡng 500ms theo thiết kế).
  - Cung cấp cả 2 phiên bản `processOfflineCatchup` (bất đồng bộ có yield) và `processOfflineCatchupSync` (đồng bộ headless/test).
- **Bảng Điều Khiển Kiểm Thử Thời Gian Dành Cho Nhà Phát Triển (`lib/game/world/catchup-engine.ts`)**:
  - Hàm dự báo tác động `forecastTimeTravelImpact`: Ước tính biến động tài nguyên, Threat trung bình và các sector chuyển giai đoạn trước khi thực thi, hoàn toàn không gây tác dụng phụ lên World State gốc.
  - Hàm tua thời gian an toàn `executeTimeTravel`: Tái sử dụng chính xác `executeWorldTick` của hệ thống thật; ranh giới an toàn tuyệt đối chỉ tác động lên World State, không can thiệp combat hay kích hoạt đấu trường.
- **Tích Hợp Checkpoint & World Storage v1**:
  - Nạp/lưu trạng thái sau các chuỗi tick vào hệ thống lưu trữ cách ly `STARFRONT_WORLD_SAVE_V1` với xác thực CRC32 checksum toàn vẹn 100%.
- **Kiểm Thử Đơn Vị Đầy Đủ (`tests/world/tick-engine.test.ts`)**:
  - 16 bài kiểm thử bao phủ toàn diện: SplitMix32, Mulberry32, WorldPRNG, Tie-Breaking, chuỗi 6 phase, deterministic verification 100 ticks, trần threat +50, tính toán pending ticks, kẹp trần 360, chống lùi giờ hệ thống, benchmark hiệu năng offline 7 ngày, batch yielding, forecast preview, execute time travel, và storage persistence.

---

## [Phase 6.2] — STARFRONT WORLD: Mạng Lưới Đồ Thị World Map & Máy Trạng Thái Sector (World Map Graph Network & Sector State Machine)

*Đã hoàn thành 100% Phase 6.2 (133/133 automated tests passed, build thành công, 19/19 tests Phase 6.2 PASS)*

### Tính năng & cơ chế đã hoàn thành trong Phase 6.2:
- **World Map Graph Network (`lib/game/world/graph.ts`)**:
  - Xây dựng mô hình đồ thị vô hướng $G = (V, E)$ kết nối mạng lưới các sector thiên hà qua các tuyến siêu không gian.
  - Sử dụng trực tiếp dữ liệu khởi tạo chuẩn hóa (8 sectors và 12 routes từ `initial-state.ts`), đảm bảo nguyên tắc duy nhất một nguồn dữ liệu (Single Source of Truth).
  - Thuật toán Dijkstra tìm đường ngắn nhất (`findShortestPath`) với đo lường khoảng cách chính xác (`getPathMetrics`).
  - Chế độ định tuyến an toàn (`mode: "safest"` hoặc `avoidHazardous: true`) ưu tiên né tránh các tuyến nguy hiểm.
  - Xử lý đầy đủ 4 trạng thái tuyến đường: `open`, `hazardous`, `blocked`, `offline`.
  - Thuật toán từ chối lưu thông qua các tuyến đang bị `blocked` hoặc `offline`.
  - Phân tích tính liên thông mạng lưới (`isNetworkConnected`) và phân rã các thành phần liên thông (`getConnectedComponents`).
  - Hàm cập nhật trạng thái tuyến đường thuần túy không gây đột biến ngoài ý muốn (`updateRouteState`, `setRouteStateBetween`).
- **Cấu Hình Bản Đồ Mẫu & Helper (`lib/game/world/initial-map.ts`)**:
  - Tái sử dụng dữ liệu 8 sector và 12 routes từ `initial-state.ts`, cung cấp các hàm helper tra cứu nhanh không tạo bản đồ thứ hai trùng lặp.
- **Sector State Machine 5 Giai Đoạn (`lib/game/world/sector-lifecycle.ts`)**:
  - Hiện thực máy trạng thái hữu hạn 5 giai đoạn: `Normal` $\rightarrow$ `Threatened` $\rightarrow$ `Under Siege` $\rightarrow$ `Lost` $\rightarrow$ `Recovery`.
  - Bảng quy tắc chuyển đổi trực tiếp hợp lệ (`VALID_STAGE_TRANSITIONS`) và bộ kiểm tra điều kiện chuyển đổi (`canTransitionStage`).
  - Cơ chế từ chối các bước nhảy trạng thái bất hợp lệ (chặn nhảy từ Normal sang Lost, chặn nhảy từ Lost sang Normal không qua Recovery, v.v.).
  - Tự động đánh giá giai đoạn theo ngưỡng Threat Level (`evaluateSectorStage`):
    * Threat < 300: `Normal`
    * Threat 300–699: `Threatened`
    * Threat $\ge$ 700: `Under Siege`
  - Quy trình giải phóng sector thất thủ (`liberateLostSector`): chuyển `Lost` $\rightarrow$ `Recovery`, trao lại quyền kiểm soát cho VSS.
  - Quy trình thất thủ (`conquerSector`): chuyển `Under Siege` $\rightarrow$ `Lost`, trao quyền kiểm soát cho The Void.
  - Hoàn tất tái thiết (`completeRecovery`): chuyển `Recovery` $\rightarrow$ `Normal`.
  - Hệ số hiệu suất sản xuất theo từng giai đoạn (`getSectorStageEfficiency`): Normal 100%, Threatened 85%, Under Siege 40%, Recovery 50%, Lost 0%.
  - Tách biệt tuyệt đối giữa Vòng đời (Stage), Quyền kiểm soát phe phái (Sovereignty) và Mức độ đe dọa (Threat Level [0..1000]).
- **Kiểm Thử Toàn Diện & Tính Bền Vững (`tests/world/sector-lifecycle.test.ts`)**:
  - 19 bài kiểm thử đơn vị bao phủ toàn diện: cấu trúc đồ thị, Dijkstra shortest/safest path, lọc route state, tính liên thông, chuỗi chuyển đổi 5 giai đoạn, từ chối chuyển đổi bất hợp lệ, tự động đánh giá threat, giải phóng/thất thủ, hiệu suất sản xuất, giới hạn an toàn [0..1000], và lưu/nạp lại chính xác qua World Storage v1 cách ly an toàn khỏi RPG save v4.
- **Tập tin xuất khẩu module tập trung (`lib/game/world/index.ts`)**:
  - Cung cấp điểm nhập module sạch sẽ cho toàn bộ phân hệ World.

---

## [Phase 6.1] — STARFRONT WORLD: Nền Tảng Dữ Liệu & Hệ Thống Lưu Trữ Cách Ly (World Data Foundation & Isolated Save Resilience)

*Đã hoàn thành 100% Phase 6.1 (114/114 automated tests passed, build thành công, cách ly an toàn 100% khỏi RPG save v4)*

### Tính năng & cơ chế đã hoàn thành trong Phase 6.1:
- **Khởi Tạo Data Model & Interfaces Chuẩn Hóa (`lib/game/world/types.ts`)**:
  - Định nghĩa đầy đủ kiểu dữ liệu: `WorldSector`, `WorldRoute`, `WorldFaction`, `WorldResourceLedger`, `MilitaryForceLedger`, `StrategicCapacities`, `DemographicsState`, `WorldState`, và `WorldSaveEnvelope`.
  - Schema version chính thức: `version: 1` cho World State.
  - Phân tách rạch ròi 4 nhóm tài nguyên chiến lược kết hợp **Lương thực (Food) là tài nguyên riêng biệt** (không gộp vào vật tư hậu cần).
  - Sổ cái quân sự bảo toàn quân số: $\text{Total} = \text{Deployed} + \text{Reserves} + \text{Wounded} + \text{Retreating} + \text{Casualties}$.
- **Bộ Dữ Liệu Khởi Tạo Chuẩn Hóa (`lib/game/world/initial-state.ts`)**:
  - 8 Sector thiên hà khởi đầu: Sol Command HQ, Helios, Mining Outpost K-7, Asteroid Delta, Nebula Bastion, Waypoint Orion, Shadow Reach, Tartarus Breach.
  - 12 Tuyến siêu không gian kết nối mạng lưới với trạng thái `open`, `hazardous`, `blocked`.
  - 2 Phe phái ban đầu: Chính phủ VSS và Đế Chế The Void.
- **Hệ Thống Lưu Trữ Cách Ly Tuyệt Đối (`lib/game/world/storage.ts`)**:
  - Khóa lưu trữ độc lập: `STARFRONT_WORLD_SAVE_V1`, `STARFRONT_WORLD_BACKUP_A`, `STARFRONT_WORLD_BACKUP_B`, `STARFRONT_WORLD_BACKUP_META`, `STARFRONT_WORLD_STAGING`.
  - **Cách ly 100% khỏi RPG v4**: Tuyệt đối không đọc, ghi, sửa đổi hay làm rò rỉ dữ liệu `STARFRONT_SAVE_DATA_V4`.
- **Cơ Chế Ghi Nguyên Tử & Sao Lưu Luân Phiên Slot A/B (Rotating Backups)**:
  - Kiểm tra tính hợp lệ cấu trúc state $\rightarrow$ Đóng gói Envelope kèm timestamp đơn điệu $\rightarrow$ Tính mã băm CRC32 xác thực $\rightarrow$ Ghi thử nghiệm vào Staging $\rightarrow$ Xoay vòng bản lưu chính cũ sang Backup Slot A hoặc B $\rightarrow$ Commit khóa chính $\rightarrow$ Dọn dẹp Staging.
- **Khả Năng Tự Phục Hồi Khi Save Hỏng (Auto-Rescue)**:
  - Tự động phát hiện khi file chính bị hỏng cú pháp JSON, sai lệch cấu trúc hoặc không khớp checksum.
  - Quét tìm và tự động phục hồi từ bản sao lưu Slot A/B hợp lệ mới nhất có dấu thời gian gần nhất.
  - Trả về thông báo minh bạch trong `LoadWorldResult` và cờ `recoveredFromBackup: true`.
  - Tự động tái lập trạng thái mặc định an toàn nếu cả bản chính và toàn bộ backup đều bị phá hủy.
- **Bộ Kiểm Thử Tự Động Toàn Diện (`tests/world/storage-resilience.test.ts`)**:
  - 12 bài kiểm thử tự động chuyên sâu kiểm chứng: Tính toàn vẹn của Data Model, xác thực mã băm CRC32, tính bất biến của `STARFRONT_SAVE_DATA_V4`, chu kỳ luân phiên A $\rightarrow$ B $\rightarrow$ A, tự phục hồi khi crash/tamper, và chẩn đoán kho lưu trữ.
  - Toàn bộ 114/114 automated unit tests trong toàn bộ dự án PASS 100%.

---

## [Phase 6.0] — STARFRONT WORLD: Thiết Kế Tổng Thể & Kế Hoạch Triển Khai Chiến Lược (World Architecture Design & Implementation Planning)

*Đã hoàn thành 100% tài liệu thiết kế và kế hoạch hóa lộ trình triển khai kỹ thuật cho STARFRONT WORLD (Lập tài liệu và kế hoạch hóa 100% — KHÔNG thay đổi mã nguồn gameplay, không sửa đổi hành vi game, bảo toàn nguyên vẹn 102/102 automated tests PASS).*

### Công việc đã hoàn thành trong Phase 6.0:
- **Tạo Mới Tài Liệu Đặc Tả Thiết Kế Tổng Thể (`WORLD_DESIGN.md`)**:
  - Xác lập 9 trụ cột thiết kế chiến lược hoàn chỉnh (Mục A đến Mục I):
    * **A. Tổng quan & UI**: Định vị WORLD là trung tâm chỉ huy chiến lược vĩ mô của sản phẩm; tích hợp tab cấp cao nhất vào Shell; chế độ World Map toàn màn hình 100vw/vh; tổng hành dinh Operations Center.
    * **B. World Map & Mạng Lưới Tuyến Đường**: Đồ thị tuyến siêu không gian (open, hazardous, blocked, offline); phân tách rạch ròi giữa Quyền kiểm soát phe phái và Mức độ đe dọa (Threat); vòng đời 5 giai đoạn của sector (`Normal` $\rightarrow$ `Threatened` $\rightarrow$ `Under Siege` $\rightarrow$ `Lost` $\rightarrow$ `Recovery`); quy mô 6–10 sector ban đầu.
    * **C. Phe Phái, Lực Lượng & Quân Sự**: Hai phe ban đầu Chính phủ VSS vs Đế Chế The Void (không thêm phe mới vào phạm vi ban đầu); Sổ cái quân sự bảo toàn quân số (Deployed, Reserves, Wounded, Retreating, Casualties); thuật toán auto-resolve Lanchester cho trận phụ; can thiệp buồng lái trong trận quyết định; hậu quả thất bại theo ngữ cảnh (không mặc định mất sector ngay).
    * **D. Tích Hợp Chiến Đấu & Khế Ước Giao Dịch**: Khế ước `WorldCombatAdapter`; cấu hình `combatVersion: "v1" | "v2"`; Encounter Snapshot độc lập tại thời điểm khóa trận; nhật ký giao dịch lũy đẳng (`worldTransactionJournal`) chống áp dụng hai lần; luồng xử lý an toàn khi combat bị lỗi (`PENDING_RECOVERY`), không tạo kết quả thắng/thua giả.
    * **E. Lưu Trữ, Checkpoint & Phục Hồi Thảm Họa**: Lưu trữ cách ly `STARFRONT_WORLD_SAVE_V1` độc lập với tiến trình RPG v4; sao lưu luân phiên Slot A/B với kiểm tra checksum nguyên tử; tự động phục hồi từ backup khi save chính lỗi; checkpoint tự động và khôi phục giao dịch dang dở an toàn.
    * **F. Thời Gian & Mô Phỏng Ngoại Tuyến**: Mốc thời gian thực tế Unix timestamp; cơ chế bắt kịp bounded batch (tối đa 50 ticks/batch, trần 360 ticks) chống đơ trình duyệt; công cụ Time Travel Dev Controls (+1, +7, +30 ngày) có bản xem trước tác động và hộp thoại xác nhận, dùng chung 100% logic với engine thật.
    * **G. Chu Kỳ Tick & Thứ Tự Sự Kiện Tất Định**: Thứ tự 6 phase cố định trong từng tick (Phục hồi $\rightarrow$ Vận chuyển $\rightarrow$ Kinh tế $\rightarrow$ Quân sự $\rightarrow$ Hạn chót $\rightarrow$ Kích hoạt mới); phân tích phụ thuộc dữ liệu; phá thế hòa ổn định và Seeded PRNG.
    * **H. Kinh Tế Chiến Lược & Nhân Khẩu Học**: 4 Nhóm tài nguyên + Lương thực thiết yếu riêng biệt; 3 năng lực Industry/Logistics/Stability; cơ chế suy thoái theo bậc khi cạn kiệt; hậu cần tự động với mức tồn kho an toàn 3 ngày (Safety Stock Buffer); di cư bảo toàn dân số zero-sum (không sinh dân ảo).
    * **I. Vòng Đời Sự Kiện & Chuỗi Nhiệm Vụ**: Vòng đời 3 pha `INIT` $\rightarrow$ `PROCESSING` $\rightarrow$ `RESULT`; tự động khóa chiến lược mặc định khi hết hạn countdown; 6 hình thái chuỗi nhiệm vụ; giới hạn trần 8 chuỗi đồng thời; Trung tâm kết quả kép (Mission Results vs Event Results) kèm xóa log hiển thị an toàn.
  - Bổ sung Ma trận đối chiếu thực tế kỹ thuật (4 nhóm: Đã có trong code, Đã xác nhận thiết kế, Đề xuất cần xác minh, Chưa xác định/TBD).
- **Tạo Mới Kế Hoạch Triển Khai Kỹ Thuật Chi Tiết (`WORLD_IMPLEMENTATION_PLAN.md`)**:
  - Phân kỳ toàn diện thành 9 giai đoạn nhỏ tuần tự (Phase 6.1 đến 6.9):
    * **Phase 6.1**: Nền tảng dữ liệu, Interfaces & Save cách ly (`STARFRONT_WORLD_SAVE_V1`, Rotating Backups A/B).
    * **Phase 6.2**: Mạng lưới đồ thị World Map & Máy trạng thái 5 giai đoạn Sector.
    * **Phase 6.3**: Động cơ mô phỏng chuỗi Tick 6 phase & Bắt kịp ngoại tuyến theo batch.
    * **Phase 6.4**: Kinh tế chiến lược, Mạng lưới hậu cần & Nhân khẩu học bảo toàn.
    * **Phase 6.5**: Phe phái VSS vs The Void & Sổ cái điều phối quân sự có thẩm quyền.
    * **Phase 6.6**: Khế ước Adapter tích hợp chiến đấu & Nhật ký giao dịch lũy đẳng.
    * **Phase 6.7**: Động cơ vòng đời sự kiện & Chuỗi nhiệm vụ chiến lược.
    * **Phase 6.8**: Giao diện Operations Center & Trung tâm kết quả kép (Dual Results Hub).
    * **Phase 6.9**: Chế độ bản đồ toàn màn hình, Tinh chỉnh thị giác & Kiểm thử tích hợp E2E.
  - Mỗi giai đoạn quy định đầy đủ: Mục tiêu, Tiền đề, Danh mục file/interfaces, Các bước thực hiện, Tiêu chí nghiệm thu (Exit Criteria), và Rủi ro kỹ thuật/Giải pháp dự phòng.
- **Cập Nhật Đồng Bộ Kế Hoạch Tổng Thể (`PROJECT_PLAN.md`)**:
  - Cập nhật bảng chỉ dẫn AI Agent Context, mục tiêu chiến lược của WORLD trong sản phẩm.
  - Cập nhật Bản đồ tài liệu (Documentation Index) tham chiếu đến `WORLD_DESIGN.md` và `WORLD_IMPLEMENTATION_PLAN.md`.
  - Cập nhật Ma trận trạng thái tổng quát (High-Level Phase Matrix).
- **Cập Nhật Danh Mục Tính Năng (`FEATURES.md`)**:
  - Bổ sung mục 4 chi tiết hóa 9 nhóm tính năng chiến lược của WORLD.
  - Phân định minh bạch trạng thái kỹ thuật (Design Confirmed / Planned) và nhấn mạnh chưa triển khai code.
- **Bảo Toàn Chất Lượng & Mã Nguồn**:
  - Giữ nguyên vẹn 100% mã nguồn game hiện có.
  - 102/102 automated tests tiếp tục PASS 100%.

---

## [Phase 5.12] — Màn Hình Kết Quả Sau Nhiệm Vụ & Trực Quan Hóa Điểm Hiệu Suất Tác Chiến (D3 Post-Mission Debriefing)

*Đã hoàn thành toàn bộ màn hình kết quả sau nhiệm vụ (102/102 automated tests passed, build thành công)*

### Tính năng đã hoàn thành:
- **Màn Hình Kết Quả Sau Trận Đấu (Post-Mission Results Screen)**:
  - Thiết kế giao diện debriefing quân sự khoa học viễn tưởng với tiêu đề chiến dịch, huân chương chiến thắng và thông báo qua màn lần đầu.
  - Phân chia 3 tab chuyên sâu:
    1. **Tổng Quan & Phần Thưởng**: Điểm hiệu suất tổng hợp, EXP đạt được, chiến lợi phẩm và nút hành động xuất kích tiếp theo.
    2. **Biểu Đồ Hiệu Suất D3 (Radar 5 Trục)**: Mạng nhện D3 đa trục phân tích chi tiết từng khía cạnh tác chiến cùng thẻ dữ liệu thực chiến.
    3. **Dòng Thời Gian Lượt Đấu D3**: Biểu đồ cột ghép đôi D3 thể hiện sát thương gây ra và nhận vào theo từng hiệp đấu.
- **Tính Toán & Trình Diễn Kinh Nghiệm Đạt Được (Experience Gained)**:
  - Hiển thị lượng EXP nhận được từ nhiệm vụ/trận đấu.
  - Thanh tiến trình EXP Mech & Phi công với tỷ lệ hoàn thành phần trăm (%) và EXP cần cho cấp tiếp theo.
  - Banner chúc mừng thăng cấp (Level Up) tự động phát hiệu ứng và làm nổi bật các chỉ số tăng vĩnh viễn (HP, SP, ATK, DEF, SPD).
- **Chiến Lợi Phẩm Thu Được & Tương Tác Nhanh (Loot Acquired & Quick Equip)**:
  - Hiển thị số tiền Credits và Hợp kim (Alloy) nhận được.
  - Thẻ trang bị độc nhất rơi ra với viền phát sáng theo độ hiếm (Thường, Hiếm, Sử Thi, Huyền Thoại) cùng đầy đủ chỉ số cộng thêm.
  - Nút **"Trang Bị Ngay" (Quick Equip)** cho phép người chơi gắn ngay vật phẩm mới rơi vào cơ giáp mà không cần phải rời khỏi đấu trường.
- **Động Cơ Đánh Giá Điểm Hiệu Suất Tác Chiến (Combat Efficiency Rating Engine)**:
  - Tính toán điểm tổng hợp (0 - 100) dựa trên 5 trục trọng số:
    * **Sát Thương (25%)**: DPS trung bình và sát thương đỉnh điểm bùng nổ.
    * **Sinh Tồn (25%)**: Tỷ lệ HP còn lại và khả năng giảm thiểu sát thương.
    * **Tốc Độ (20%)**: Số vòng đấu hoàn thành so với mục tiêu chuẩn.
    * **Chuẩn Xác (15%)**: Số đòn chí mạng, tỷ lệ chí mạng và né tránh hỏa lực.
    * **Kỹ Năng (15%)**: Mức độ sử dụng kỹ năng và kích hoạt hiệp đồng pilot synergy.
  - Hệ thống xếp hạng 5 cấp: **S+ (Apex Ace)**, **S (Elite Ace)**, **A (Veteran)**, **B (Operative)**, **C (Survivor)**.
- **Bộ 3 Biểu Đồ Trực Quan Hóa Bằng D3 (D3 Performance Visualizations)**:
  - **D3 Radar / Spider Chart**: Mạng nhện 5 trục với các vòng tham chiếu (20%, 40%, 60%, 80%, 100%), vùng đa giác phát sáng gradient neon, điểm nút tương tác và tooltip hiển thị số liệu khi rê chuột.
  - **D3 Efficiency Radial Gauge**: Đồng hồ đo bán nguyệt với mút phát sáng, hiển thị điểm số và huy hiệu hạng tác chiến.
  - **D3 Turn Damage Timeline**: Biểu đồ cột kép so sánh sát thương gây ra (cyan) và gánh chịu (rose) qua từng lượt kèm tooltip chi tiết từng hiệp.
- **Bộ Kiểm Thử Tự Động Toàn Diện**:
  - Bổ sung `tests/post-mission-results-efficiency.test.ts` kiểm thử đầy đủ các kịch bản tính điểm S+, S, B, C, tính toàn vẹn dữ liệu từng lượt cho D3 và xử lý an toàn dữ liệu rỗng.
  - Toàn bộ 102/102 automated tests PASS 100%.

---

## [Phase 5.11] — Pilot & Gear Selection Flow Enhancement (Optional vs Mandatory Gating)

*Đã hoàn thành toàn bộ Phase 5.11 (98/98 automated tests passed, build thành công)*

### Tính năng đã hoàn thành:
- **Tùy Chọn Đổi Cặp Đôi Khi Hoàn Thành Đủ 5/5 Nhiệm Vụ (Optional Selection)**:
  - Khi hoàn thành đủ 5/5 nhiệm vụ hoặc 5 trận thắng, cặp đôi tự động mở khóa nhưng việc thay đổi cặp đôi là hoàn toàn tùy chọn (`isSelectionOptional = true`).
  - Người chơi không bị bắt buộc phải đổi phi công/cơ giáp; có thể bấm "Tiếp Tục (Giữ Nguyên)" để tiếp tục xuất kích với tổ hợp hiện tại.
  - Tổ hợp hiện tại được bảo toàn nguyên vẹn khi người chơi bỏ qua bước tùy chọn.
  - Không ép buộc người chơi phải trải qua quy trình chọn cặp đôi mỗi lần hoàn thành nhiệm vụ.
- **Bắt Buộc Chọn Khi Chưa Có Tổ Hợp Hợp Lệ (Mandatory Selection)**:
  - Khi game vừa reset (`resetStarfrontProgression()`) hoặc dữ liệu ban đầu chưa có tổ hợp hợp lệ (`isValidPilotGearSelection() === false`), hệ thống kích hoạt chế độ bắt buộc (`isSelectionMandatory = true`).
  - Hiển thị hộp thoại cảnh báo bắt buộc rõ ràng, chặn truy cập vào các phân hệ tác chiến phụ thuộc vào tổ hợp (Đấu trường, Bản đồ nhiệm vụ, Hangar, Chợ quân sự).
  - Cung cấp nút hành động rõ ràng điều hướng đến màn hình chọn Phi Công & Cơ Giáp; không cung cấp tùy chọn bỏ qua/tiếp tục khi chưa hợp lệ.
  - Sau khi hoàn tất xác nhận ở Bước 3, hệ thống tự động lưu trữ và mở khóa luồng tác chiến bình thường.
- **Xác Thực Dữ Liệu & Lưu Trữ An Toàn (Validation & Safe Persistence)**:
  - Tích hợp hàm kiểm tra `isValidPilotGearSelection(progression)` xác thực phi công hợp lệ, cơ giáp hợp lệ và đã được sở hữu trong `unlockedGears`.
  - Hàm `migrateProgressionToV4` xử lý an toàn dữ liệu lưu bị thiếu, lỗi thời hoặc hư hỏng (corrupted) mà không crash hệ thống.
- **Bộ Kiểm Thử Tự Động Toàn Diện**:
  - Bổ sung `tests/phase5-11-pilot-gear-flow.test.ts` kiểm thử đầy đủ 5 kịch bản trọng tâm theo yêu cầu kỹ thuật.
  - Toàn bộ 98/98 automated tests PASS 100%.

---

## [Phase 5.9] — Pilot Skill Liên Hoàn, Template Configuration & Combat Synergy

*Đã hoàn thành toàn bộ Phase 5.9 (93/93 automated tests passed, build thành công)*

### Tính năng đã hoàn thành:
- **Hệ Thống Tuyệt Kỹ Liên Hoàn Phi Công (Pilot Skill Liên Hoàn)**:
  - Tách rời hoàn toàn khỏi 5 slot kỹ năng của Cơ giáp; kỹ năng liên hoàn thuộc về phẩm chất và sự trưởng thành của từng phi công.
  - Xây dựng 4 Template cấu hình chi tiết (`lib/game/pilot-skill-templates.ts`) cho Marcus (Bão Pháo Ion Càn Quét - Active), Valentine (Thánh Vực Nano Hộ Vệ - Passive), Levi Reed / Alviss (Gia Tốc Lượng Tử & Phản Kích Né Tránh - Passive), và Eric (Đạn Hạt Nhân Xuyên Giáp Tận Diệt - Active).
- **Tăng Cấp Tuần Tự, Milestone & Khống Chế Ngân Sách**:
  - Tăng cấp tuần tự đảm bảo không bỏ sót bất kỳ mốc Milestone nào (chia hết cho 5).
  - Tự động mở khóa các dòng phụ tại các mốc Milestone từ kho ứng viên `candidatePool`, có cơ chế `fallbackCandidate` dự phòng khi cạn pool.
  - Tính toán và chuẩn hóa Điểm Sức Mạnh Kỹ Năng (`skillPower`), đảm bảo luôn nằm trong trần ngân sách `maxSkillPowerBudget`.
- **Cơ Chế Reroll Dòng Phụ (Reroll Sub-Stats)**:
  - Hỗ trợ cả 2 chế độ: Reroll ngẫu nhiên (random) và Reroll có chọn mục tiêu (targeted).
  - Chi phí: 1 Vé Reroll (Reroll Token) hoặc 150 Credits.
  - Bảo vệ an toàn chống duplicate theo cấu hình `allowDuplicate` và `maxStacks`.
- **Tích Hợp Thực Chiến & Hiệp Đồng Đồng Bộ 100%**:
  - Slot 5 trên Action Deck tại `CombatArena` hiển thị thẻ Tuyệt Kỹ Phi Công (Nút xuất kích nếu là Active, thẻ tự động nếu là Passive).
  - Marcus Active gây sát thương diện rộng và nạp +15 SP; Eric Active phá giáp -45% DEF đối phương.
  - Alviss Passive kích hoạt phản kích chớp nhoáng khi né đòn thành công.
  - Valentine Passive tái tạo khiên cấp cứu kèm khiên bonus của Thánh Vực Nano khi khiên bị vỡ.
- **Giao Diện Buồng Lái & Bảng Điều Khiển Quản Trị (Admin CP)**:
  - Component `PilotSkillView` tích hợp trực tiếp vào Sub-Tab thứ 3 của màn hình `CharacterGearSelect`.
  - Modal Quản Trị `AdminCpModal` cho phép tùy biến trần cấp phi công, trần cấp kỹ năng, chuyển đổi thứ tự ưu tiên `GLOBAL_PRIORITY` / `TEMPLATE_OVERRIDE`, và chuẩn hóa toàn bộ dữ liệu chỉ với 1 click.
- **Lưu Trữ Bền Vững & Bộ Kiểm Thử Tự Động**:
  - Bổ sung `tests/phase5-9-pilot-synergy-skills.test.ts` với 18/18 unit tests PASS 100%.
  - Toàn bộ 93/93 automated tests trong dự án PASS 100%.

## [Phase 5.8] — Hệ Thống Ghép Đôi Nhân Vật & Cơ Giáp (Character & Gear Selection System)

*Đã hoàn thành toàn bộ Phase 5.8 (75/75 automated tests passed, build thành công)*

### Tính năng đã hoàn thành:
- **Menu Độc Lập Nhân Vật & Cơ Giáp (Character & Gear)**:
  - Bổ sung menu cấp cao `Nhân Vật & Cơ Giáp` trên thanh điều hướng chính (`starfront-shell.tsx`) với icon `Users` và huy hiệu hiển thị cặp đôi hiện tại (vd: `Marcus/Vanguard`).
  - Chuyển toàn bộ chức năng chọn Cơ giáp ra khỏi Hangar sang menu này.
  - Hangar hiển thị banner tổ hợp xuất kích đang hoạt động kèm nút "Đổi Cặp Đôi & Phân Bổ Điểm ➔" liên kết trực tiếp sang menu Nhân Vật & Cơ Giáp, giữ nguyên 3 tab quản lý trang bị, cường hóa và kho đồ/tái chế.
- **Quy Trình Ghép Đôi Liên Kết 3 Bước (Linked 3-Step Selection Flow)**:
  - **Bước 1 — Chọn Phi Công**: Hiển thị danh mục 4 phi công (Marcus, Valentine, Alviss, Eric) kèm ảnh chân dung SVG vector chất lượng cao, cấp độ, EXP bar, điểm thuộc tính và kỹ năng nội tại. Thẻ chưa chọn hiển thị mờ hơn (subdued), không disable. Hỗ trợ xem chi tiết độc lập mà không tự động đổi cặp đôi đang khóa.
  - **Bước 2 — Chọn Cơ Giáp**: Hiển thị 3 lớp cơ giáp (Vanguard, Falcon, Aegis) với hình minh họa, vai trò, nội tại cơ giáp, lực chiến và 5 ô kỹ năng. Tương tác tương hỗ hai chiều (Cross-Highlight): chọn phi công sẽ làm nổi bật cơ giáp gợi ý (Synergy Match) và ngược lại.
  - **Bước 3 — Đánh Giá & Xác Nhận Cặp Đôi**: Cột trái hiển thị hồ sơ Phi công, cột giữa hiển thị tổng hợp chỉ số chiến đấu thực tế kèm phân rã nguồn gốc (Gốc cơ giáp + Trang bị Hangar + Điểm phi công), cột phải hiển thị hồ sơ Cơ giáp. Hỗ trợ Back/Forward đầy đủ giữa các bước.
- **Cơ Chế Khóa & Mở Khóa Xuất Kích (Lock & Unlock Rules)**:
  - Khi bấm Xác Nhận, lưu trữ cặp đôi và khóa lựa chọn (`isLocked = true`).
  - Khởi tạo bộ đếm mở khóa: `completedMissions: 0`, `wonBattles: 0`, `targetCount: 5`.
  - Tự động mở khóa khi đạt 5 nhiệm vụ chiến dịch HOẶC 5 trận thắng đấu trường (whichever occurs first).
  - Khi đang khóa, người chơi vẫn tự do xem hồ sơ và phân bổ điểm thuộc tính; nút xác nhận đổi cặp đôi mới hiển thị rõ tiến độ mở khóa.
  - Xử lý an toàn: Không đếm trận thoát giữa chừng/thất bại, chống cộng trùng sự kiện qua cờ xác nhận, bảo toàn 100% khi tải lại trang hoặc save/load.
- **Tiến Trình Độc Lập Của Phi Công (Pilot Progression)**:
  - 4 Phi công có cấp độ (1–30) và EXP riêng biệt.
  - Chỉ phi công đang ghép đôi xuất kích mới nhận EXP sau trận đấu trường hoặc nhiệm vụ chiến dịch.
  - Mỗi cấp nhận 5 điểm thuộc tính tự do phân bổ vào: Tấn công (+2 ATK/pt), Phòng ngự (+1.5 DEF/pt), Cơ động (+1 SPD/pt), Khiên (+30 Khiên/pt), Chiến thuật (+0.4% Crit/pt).
  - Hỗ trợ nút "Tẩy Điểm Thuộc Tính" hoàn trả 100% điểm với chi phí Credits.
- **Tích Hợp Chiến Đấu & Hiệu Ứng Ghép Đôi**:
  - `buildPlayerCombatUnit` và `calculateTotalGearStats` tích hợp toàn bộ điểm phân bổ thuộc tính của phi công vào chỉ số chiến đấu.
  - Kỹ năng nội tại phi công hoạt động chuẩn xác: Marcus (Hỏa lực dồn ép), Valentine (Lá chắn cấp cứu), Alviss (Tốc độ & né tránh), Eric (Xuyên giáp +20%).
- **Lưu Trữ Bền Vững & Migration Schema v4**:
  - Mở rộng kiểu dữ liệu `StarfrontProgression` và lưu trữ bền vững với `STORAGE_KEY_V4`.
  - Hàm `migrateProgressionToV4` di chuyển an toàn từ mọi phiên bản v1, v2, v3 sang v4.
- **Bộ Kiểm Thử Tự Động (Automated Tests)**:
  - Bổ sung `tests/phase5-8-character-gear.test.ts` với 15/15 unit tests pass 100%.
  - Toàn bộ 75/75 automated tests của dự án pass 100%.

## [Phase 5] — Tiến Trình Cơ Giáp, Cường Hóa & Nhiệm Vụ Phân Tầng

*Đã hoàn thành toàn bộ Phase 5: Milestones 5.1, 5.2, 5.3, 5.4, 5.5 & 5.6 (60/60 automated tests passed, build thành công)*

### Tính năng đã hoàn thành:
- **Milestone 5.6: Sửa Lỗi Tiến Trình Nhiệm Vụ, Mở Khóa Vũ Khí, Làm Mới Chợ Quân Sự & Mở Rộng Chiến Dịch (Mission Progression, Shop Refresh & Unlock Fixes)**:
  - **Sửa Lỗi Mở Khóa Vũ Khí Ải 3-3 & Đồng Bộ Dữ Liệu**:
    - Khắc phục lỗi vũ khí Sector 3 (`shop_wpn_stellar_annihilator`) bị khóa sau khi qua ải 3-3: Đồng bộ điều kiện mở khóa `isShopItemUnlocked` hỗ trợ cả 2 định danh `m3-3` và `mis-3-3`.
    - Đồng bộ tuyệt đối giữa dữ liệu tiến trình (`completedMissions`), logic giao dịch (`buyShopItem`) và giao diện Chợ Quân Sự (`starfront-shop.tsx`).
    - Chặn hoàn toàn việc tự động mở khóa vũ khí khi chưa hoàn thành đúng ải yêu cầu.
  - **Làm Mới Gian Hàng Chợ Quân Sự (Shop Refresh)**:
    - Bổ sung nút "Làm Mới Gian Hàng" trên giao diện Chợ tab Mua Trang Bị với hiệu ứng xoay và nhãn chi phí minh bạch.
    - Cơ chế chi phí kinh tế: Tự động trừ lượt miễn phí (`freeShopRefreshes`) trước; khi hết lượt miễn phí tốn 100 Credits; chặn và báo lỗi nếu không đủ Credits.
    - Cập nhật đầy đủ 6 món đồ ngẫu nhiên theo pool Sector, cập nhật tên, độ hiếm, chỉ số, giá bán, điều kiện mở khóa và lưu trạng thái `isPurchased`.
  - **Khóa Cấu Hình Địch Khi Vào Trận Chính Tuyến**:
    - Khi nhận ải từ Campaign Map, hệ thống chốt sẵn `activeCampaignMission` và khóa thanh chọn đối thủ trong buồng lái Đấu Trường (`combat-arena.tsx`) kèm nhãn `ĐÃ KHÓA THEO NHIỆM VỤ: [Tên Địch]`.
    - Người chơi không thể đổi sang các mức Dễ/Trung bình/Khó ngoài cấu hình ải; cung cấp nút `Hủy Ải (Chọn Tự Do)` để trở về chế độ đấu tự do.
    - Chỉ số kẻ địch (HP, ATK, DEF, SPD) được đồng bộ chính xác theo cấp độ và biến thể nhiệm vụ.
  - **Mở Rộng Chiến Dịch & Cơ Chế Reset Ải**:
    - Mở rộng Sector 4: *Vành Đai Sự Kiện Chân Trời (Event Horizon Outpost)* với 3 ải mở rộng (`m4-1`, `m4-2`, `m4-3`).
    - Hỗ trợ reset cấu hình và phần thưởng của từng ải đã hoàn thành (`resetCampaignMissionConfig`) hoặc reset toàn bộ ải trong Sector, tạo mới ngẫu nhiên phẩm chất, biến thể và trang bị rơi dự kiến.
    - Bảo toàn 100% tiến trình đã hoàn thành, kho đồ, cấp cường hóa và Credits/Alloy của người chơi.
  - **Hệ Thống Nhiệm Vụ Phụ Tuyến (Side Quests)**:
    - Bổ sung giao diện danh sách nhiệm vụ phụ riêng biệt trên Bản Đồ Chiến Dịch (`campaign-map.tsx`).
    - Nhiệm vụ phụ bám sát cấp độ người chơi, phần thưởng Credits/Alloy và trang bị cân đối thấp hơn nhiệm vụ chính; hỗ trợ nút reset chuỗi nhiệm vụ phụ bất kỳ lúc nào.
    - Phần thưởng xem trước khớp 100% với phần thưởng thực nhận sau chiến thắng.
  - **Lưu Trữ Bền Vững (State Persistence)**:
    - Lưu cố định `currentShopItems`, `sideQuests`, `missionOverrides` vào tiến trình `StarfrontProgression` và đồng bộ qua LocalStorage Schema v3; không bị reset ngẫu nhiên khi tải lại trang web.
  - **Bộ Kiểm Thử Tự Động (Automated Tests)**:
    - 12/12 automated test cases (`TC-P56-01` đến `TC-P56-12`) tại `tests/phase5-6-mission-progression-shop.test.ts` pass 100%.
    - Tổng cộng toàn bộ 60/60 automated tests pass 100%.
- **Milestone 5.5: Hệ Thống Nhiệm Vụ Phân Tầng, Kẻ Địch Biến Thể & Rơi Đồ Trang Bị Ngẫu Nhiên (Mission Scaling, Enemy Variants & Equipment Loot System)**:
  - **Phân Tầng Nhiệm Vụ & Cân Bằng Toán Học (Quest Level 1–15 & 5 Bậc Phẩm Chất)**:
    - Bảng cấu hình cân bằng tập trung tại `lib/game/scaling.ts` (`QUEST_LEVEL_SCALING`, `QUEST_QUALITY_CONFIG`, `ENEMY_VARIANTS_CONFIG`).
    - Quest Level: Điều chỉnh cấp độ (1–15), độ khó và chỉ số quái (HP 18%/lvl, ATK 12%/lvl, DEF 10%/lvl, SPD tối đa +30).
    - Quest Quality: 5 bậc phẩm chất (`standard`, `veteran`, `elite`, `heroic`, `legendary`) với hệ số độ khó, hệ số Credits/Alloy và bảng xác suất rơi đồ phân tầng (Common -> Legendary).
  - **9 Biến Thể Kẻ Địch Chuyên Biệt (Enemy Variants)**:
    - *Scout Drone*: `recon` (Trinh sát tiêu chuẩn), `interceptor` (Tốc độ cực hạn, né tránh 25%), `jammer` (Nhiễu radar ECM, kích hoạt trường nhiễu né đòn).
    - *Raider Mech*: `assault` (Đột kích quy ước), `berserker` (Cuồng nộ bạo kích +25% ATK, 30% Crit), `heavy` (Thiết giáp titan +30% HP, +30% DEF).
    - *Siege Walker*: `fortress` (Pháo đài tiêu chuẩn), `annihilator` (Kẻ hủy diệt hạt nhân +30% ATK, 35% Xuyên giáp), `colossus` (Khổng lồ bất hoại +35% HP, +35% DEF, khởi đầu có khiên gia cố).
  - **Hệ Thống Rơi Đồ Trang Bị & Thuộc Tính Ngẫu Nhiên (Equipment Loot System)**:
    - Mỗi lần hoàn thành hợp lệ trao ĐÚNG 1 trang bị ngẫu nhiên có cấp độ và độ hiếm.
    - Sinh thuộc tính (stat affixes) ngẫu nhiên theo ô đồ (Vũ khí: ATK chính, Khiên: DEF chính, Động cơ: SPD chính) và cấp độ (itemLevel).
    - Số lượng thuộc tính cộng thêm tăng theo độ hiếm (Common: 1, Rare: 2, Epic: 3, Legendary: 4).
    - Thuộc tính sinh 1 lần duy nhất cho mỗi item instance và lưu cố định, tương thích hoàn toàn với buồng lái chiến đấu, Xưởng Cường Hóa (+1..+10) và Tái Chế (Salvage).
  - **Xem Trước Phần Thưởng Minh Bạch (Reward Preview) & Tính Toàn Vẹn**:
    - Danh sách nhiệm vụ công bố rõ trước khi xuất kích: Cấp độ quest, Huy hiệu phẩm chất, Biến thể kẻ địch, Credits, Alloy và đúng 1 trang bị dự kiến (kèm huy hiệu độ hiếm, tên và thuộc tính xem trước).
    - Dữ liệu nhiệm vụ và phần thưởng ổn định 100% sau khi xuất kích, không bị thay đổi khi tải lại trang web (reload).
    - Chống nhận trùng lặp khi hoàn thành nhiều lần hoặc reload.
  - **Bộ Kiểm Thử Tự Động (Automated Tests)**:
    - Bộ test tự động `tests/phase5-5-mission-scaling.test.ts` gồm 13 test case (`TC-MIS-01` đến `TC-REG-01`) pass 100%.
    - Tổng cộng 48/48 automated tests pass 100%.
- **Milestone 5.4: Bảo Đảm An Toàn Dữ Liệu & Đồng Bộ Lựa Chọn Gear (Storage Schema v3 & State Sync)**:
  - **Nâng Cấp Storage Schema v3 (`STARFRONT_SAVE_DATA_V3`)**:
    - Xây dựng hàm di chuyển dữ liệu thuần `migrateProgressionToV3`:
      * Hỗ trợ tự động nâng cấp từ các phiên bản lưu trữ cũ v1 (`STARFRONT_SAVE_DATA_V1`) và v2 (`STARFRONT_SAVE_DATA_V2`) lên v3.
      * Bảo toàn 100% Cấp độ, EXP, Credits, Alloy, Số trận thắng/thua, Nhiệm vụ chiến dịch đã hoàn thành.
      * Chuẩn hóa toàn bộ trang bị trong kho đồ: Tự động gán `enhancementLevel = 0` cho các món cũ nếu thiếu, bảo toàn nguyên vẹn cấp cường hóa (+1 đến +10) đã có.
      * Tự động khởi tạo an toàn tài nguyên `alloy = 25` và `freeShopRefreshes = 1` cho người chơi từ v1.
      * Bổ sung trang bị khởi đầu cơ bản nếu kho đồ thiếu hụt; kẹp giá trị an toàn trong khoảng `[0..10]` cho cấp cường hóa.
  - **Đồng Bộ Hóa Trạng Thái Tức Thời (Hardened State Synchronization)**:
    - Giải quyết triệt để vấn đề mất đồng bộ hoặc trễ nhịp khi đổi giữa các lớp Gear (Vanguard, Falcon, Aegis):
      * Khi đổi Gear trong tab Hangar hoặc qua Dev Controls, buồng lái Đấu Trường lập tức cập nhật: Tên cơ giáp, bảng màu sắc theme, bộ 4 kỹ năng trong Action Deck, chỉ số Tốc Độ (SPD) và Né Tránh bẩm sinh (Falcon +15% né, 25% crit, Aegis 20% phản đòn).
      * Khi chuyển tab từ Hangar quay lại Đấu trường sau khi thay đổi trang bị hoặc cường hóa đồ, hàm `handleSwitchTab` tự động phát hiện độ lệch chỉ số và đồng bộ hóa lại `combatState` với `buildPlayerCombatUnit(progression)`.
  - **Bổ Sung Test Controls Milestone 5.4**:
    - `TC-SYNC-01: Chu Kỳ Đổi & Đồng Bộ Gear (5.4)`: Chuyển đổi nhanh theo chu kỳ VG ➔ FL ➔ AG và xác thực đồng bộ buồng lái.
    - `TC-MIG-01: Xác Thực Schema v3 & Migration (5.4)`: Kiểm tra tính toàn vẹn và hợp lệ của dữ liệu lưu trữ Schema v3.
  - **Kết Quả Kiểm Thử Tự Động (Automated Tests)**:
    - Bộ test tự động `tests/storage-sync.test.ts` (8/8 tests PASS).
    - Bộ test hồi quy `tests/passives.test.ts` (13/13 tests PASS).
    - Bộ test hồi quy `tests/economy-recycling.test.ts` (14/14 tests PASS).
    - Tổng cộng 35/35 automated tests pass 100%. TypeScript check (`npx tsc --noEmit`) và compile (`compile_applet`) sạch lỗi.
- **Milestone 5.3: Hoàn Thiện Cân Bằng Kinh Tế Chợ Quân Sự & Tái Chế (Armory Economy & Recycling)**:
  - **Tính năng Tái Chế / Rã Đồ (Salvage System)**:
    - Rã các trang bị không dùng để thu hồi nguyên liệu Hợp Kim Cường Hóa (Alloy) và Credits.
    - Công thức thu hồi tài nguyên chặt chẽ và nhất quán:
      * Base Alloy theo Rarity: Common = 2, Rare = 5, Epic = 12, Legendary = 25 Alloy.
      * Enhancement Alloy Refund: Hoàn trả 60% lượng Alloy đã đầu tư qua cường hóa (+1 đến +10), đảm bảo tối thiểu +2 Alloy mỗi cấp.
      * Credits Refund: 35% giá trị cơ sở của trang bị + 30% Credits đã đầu tư qua cường hóa.
  - **Khóa An Toàn & Bảo Vệ Dữ Liệu Tuyệt Đối (Data Safety & Security Guarantees)**:
    - *Khóa trang bị đang dùng (Equipped Protection)*: Không cho phép rã trang bị đang được lắp trên cơ giáp. Nút rã đồ ẩn trên trang bị đang dùng, và logic backend từ chối thao tác nếu ID đang được trang bị.
    - *Chống nhận tài nguyên trùng lặp (Duplicate / Double-click Protection)*: Sau khi rã, trang bị lập tức được loại bỏ khỏi kho; lần gọi thứ hai trên cùng ID sẽ bị từ chối và không cộng dồn tài nguyên.
    - *Bảo toàn số dư*: Số dư Alloy và Credits luôn tăng trưởng không âm, phản ánh chính xác giữa UI và LocalStorage save data.
    - *Không reset hay phá hủy save file*: Giữ nguyên 100% dữ liệu người chơi hiện có.
  - **Cập nhật Phân Tầng Chợ Quân Sự (Tiered Armory Shop)**:
    - Mở khóa vật phẩm theo tiến trình Sector: Hàng Cơ Bản (mở sẵn), Sector 1 (hoàn thành Ải 1-3), Sector 2 (hoàn thành Ải 2-3), Sector 3 Legendary (hoàn thành Ải 3-3).
    - Hiển thị trực quan trạng thái khóa kèm lý do yêu cầu.
    - Cơ chế Làm Mới Gian Hàng (Shop Refresh): Ưu tiên sử dụng lượt miễn phí tích lũy từ chiến thắng (`freeShopRefreshes`), hoặc tốn 100 Credits nếu hết lượt miễn phí. Chiến thắng Arena hoặc Campaign cộng +1 lượt miễn phí.
  - **Giao Diện Người Dùng (UI/UX)**:
    - Hộp thoại `SalvageModal` xác nhận rã đồ với bảng phân tích chi tiết lượng Alloy và Credits hoàn trả (phân tách rõ gốc độ hiếm vs phần thưởng cấp cường hóa).
    - Tích hợp nút `Rã Đồ ♻️` trực tiếp trên kho đồ Hangar (`starfront-hangar.tsx`) và tab `Tái Chế` trong Chợ Quân Sự (`starfront-shop.tsx`).
    - Nút `TC-SLV-01` trong Dev Combat Test Controls trên buồng lái Đấu Trường để thêm trang bị thử nghiệm phục vụ kiểm thử thủ công tức thì.
  - **Kết quả Kiểm thử Tự động (Automated Tests)**:
    - Bộ test tự động `tests/economy-recycling.test.ts` (14/14 tests PASS).
    - Bộ test hồi quy `tests/passives.test.ts` (13/13 tests PASS).
    - Tổng cộng 27/27 automated tests pass 100%. TypeScript check (`npx tsc --noEmit`) và build Next.js (`npm run build`) hoàn toàn sạch lỗi.
- **Milestone 5.2: Định Hình Bản Sắc Gameplay Của Từng Lớp Gear & Kỹ Năng Nội Tại (Gear Class Identity & Passives)**:
  - **Vanguard Gear (Tiên Phong Cân Bằng)**:
    - *Nội tại (Passive)*: *Lõi Năng Lượng Ổn Định (Stable Core)*:
      - Tự động hồi thêm +5 SP mỗi lượt trong `tickUnitTurn` (tổng hồi +10 SP/lượt bao gồm +5 SP cơ bản).
      - Tại chu kỳ mỗi 3 lượt chiến đấu (lượt 3, 6, 9...), tự động giảm thêm 1 lượt hồi chiêu (CD) cho kỹ năng có thời gian chờ dài nhất.
      - Log chi tiết: `[NỘI TẠI VANGUARD ⚡] Lõi Năng Lượng Ổn Định hồi thêm +5 SP...` và `...đạt chu kỳ 3 lượt! Giảm thêm 1 lượt hồi chiêu...`.
  - **Falcon Gear (Tiêm Kích Sát Thủ)**:
    - *Nội tại (Passive)*: *Khí Động Học Mach (Mach Aerodynamics)*:
      - Tỉ lệ né tránh bẩm sinh +15% (Evasion cơ sở = 15%, tối đa lên tới 85%).
      - Tỉ lệ bạo kích cơ sở nâng lên 25% (Crit DMG 1.75x).
      - Khi đòn đánh gây bạo kích, có 50% tỉ lệ kích hoạt đòn bắn phụ không tốn SP gây thêm sát thương (50% lượng sát thương bạo kích gốc, tối thiểu 25 DMG).
      - Log chi tiết: `[NỘI TẠI FALCON ⚡] Khí Động Học Mach kích hoạt! Đòn bạo kích khai hỏa tiếp một đòn bắn bồi không tốn SP, gây thêm X sát thương!`.
  - **Aegis Gear (Pháo Đài Bọc Thép)**:
    - *Nội tại (Passive)*: *Giáp Phản Lực Titan (Titan Reactive Armor)*:
      - Khiên gai hấp thụ và phản lại 20% sát thương nhận vào (tối thiểu 1 DMG) thẳng vào kẻ địch trong `executeEnemyAIAction`.
      - Kháng 50% hiệu ứng làm chậm tốc độ (EMP-slow) và phá giáp (Armor Break), giảm giá trị phạt còn một nửa.
      - Nếu đòn phản sát thương hạ gục kẻ địch, lập tức kết thúc trận đấu với trạng thái `victory` kèm thông báo khải hoàn.
      - Log chi tiết: `[NỘI TẠI AEGIS 🛡️] Giáp Phản Lực Titan kích hoạt! Khiên gai hấp thụ và phản lại 20% sát thương...` và `...triệt tiêu 50% hiệu lực...`.
  - **Giao Diện & Trải Nghiệm Người Chơi (UI & Player Experience)**:
    - Thẻ nội tại trong Hangar (`starfront-hangar.tsx`) hiển thị tên, công thức và mô tả chi tiết của từng lớp Gear.
    - Buồng lái Đấu trường (`combat-arena.tsx`) hiển thị huy hiệu `NỘI TẠI: [Tên Nội Tại]` kèm mô tả cơ chế.
    - Tích hợp **Bảng Điều Khiển Kiểm Thử Nội Tại (Dev Combat Test Controls)** trực tiếp tại Đấu trường:
      - Bộ chọn chuyển đổi nhanh giữa 3 Gear (Vanguard, Falcon, Aegis).
      - 6 Kịch bản test 1-click tức thì: `TC-VG-01` (Vanguard SP & CD), `TC-FL-01` (Falcon Crit & Bắn bồi), `TC-FL-02` (Falcon Né đòn), `TC-AG-01` (Aegis Phản đòn 20%), `TC-AG-02` (Aegis Kháng 50% khống chế), `TC-NON-01` (Kiểm thử không kích hoạt khi không thỏa mãn điều kiện).
      - Đảm bảo an toàn 100% cho save file và tiến trình chiến dịch của người chơi.
  - **Kết quả Kiểm thử (Automated Tests)**:
    - Bộ test tự động `tests/passives.test.ts` gồm 13 test case bao phủ toàn bộ điều kiện kích hoạt, công thức sát thương, giảm CD, kháng hiệu ứng, và các ca biên (non-trigger, evade, phản đòn kết liễu). Kết quả: **13/13 PASS**.
- **Milestone 5.1: Hệ Thống Cường Hóa Trang Bị (+1 đến +10) (Equipment Enhancement System)**:
  - Bảng cấu hình tỉ lệ và chi phí `ENHANCEMENT_TABLE` từ +1 đến +10 cho cả 3 vị trí (Vũ khí, Khiên chắn, Động cơ).
  - Tỉ lệ thành công theo cơ chế chống ức chế (Anti-Frustration):
    - Cấp +1 đến +4: Thành công 100% (An toàn tuyệt đối).
    - Cấp +5 đến +7: Tỉ lệ 80% -> 70% -> 60%, thất bại giữ nguyên cấp, không bao giờ bị phá hủy hay tụt cấp trang bị.
    - Cấp +8 đến +10: Thử thách tối thượng (45% -> 35% -> 25%), thất bại bảo toàn nguyên vẹn trang bị.
  - Hàm `getEnhancedItemStats(item)`: Tính toán chỉ số tăng trưởng đơn điệu, tăng từ +12% đến +155% chỉ số gốc, đảm bảo mỗi cấp luôn tăng ít nhất +level điểm thuộc tính.
  - Hàm `getItemDisplayName(item)`: Định dạng nhãn cấp độ trực quan `[+5] Pháo Cắt Plasma Cao Áp` cùng huy hiệu màu sắc tương ứng (+1..+4 Cyan, +5..+7 Purple, +8..+9 Orange, +10 Gold Tối Thượng).
  - Hàm `enhanceItem(progression, itemId)`: Kiểm tra tài nguyên Credits và Hợp Kim (Alloy), khấu trừ và thực hiện nâng cấp an toàn.
  - Thêm tài nguyên nguyên liệu **Hợp Kim (Alloy)**: Khởi tạo 25 Alloy mặc định, nhận thêm Alloy khi chiến thắng Đấu Trường và ải Chiến Dịch.
  - Giao diện **Xưởng Cường Hóa (Enhancement Lab Modal)** trong Hangar (`starfront-hangar.tsx`):
    - Thanh cuộn chọn nhanh trang bị trong kho đồ.
    - Bảng so sánh chỉ số hiện tại vs chỉ số dự kiến sau cường hóa kèm biến động `(+Δ)` xanh lá.
    - Thanh đo tỉ lệ thành công minh bạch (Success Rate Gauge) và chỉ báo đủ/thiếu tài nguyên Credits & Alloy.
    - Nút bấm trực tiếp `Cường Hóa ⚡` trên từng thẻ trang bị trong kho và trên 3 ô slot đang trang bị.
    - Cam kết bảo toàn trang bị hiển thị rõ ràng trên giao diện.
  - Đồng bộ tức thời: Khi cường hóa trang bị đang lắp, `calculateTotalGearStats` và `buildPlayerCombatUnit` cập nhật chỉ số ngay lập tức vào buồng lái Đấu trường.

---

## [Phase 4] — Độ Sâu Chiến Thuật, Hệ Thống Hiệu Ứng & AI Kẻ Địch

*Đã hoàn thành & Đã kiểm chứng (36/36 automated tests passed, build thành công)*

### Tính năng đã hoàn thành:
- **Milestone 4.1: Chuẩn hóa Hệ Thống Hiệu Ứng Trạng Thái & Quy Tắc Xếp Chồng (Status Effects & Stacking)**:
  - Mở rộng kiểu dữ liệu `CombatStatusType` và `StatusEffect`: DoT Plasma Burn, Acid Corrosion, EMP Slow, ECM Jamming, Stun/Overheat, Emergency Guard, Boss Overdrive, Charge Ultimate.
  - Quy tắc xếp chồng chuẩn hóa: `refresh` (làm mới thời hạn), `intensity` (cộng dồn tầng tối đa N tầng, ví dụ Acid tối đa 3 tầng), `override` (ghi đè khi hiệu ứng mới mạnh hơn).
  - Hàm `tickUnitTurn` tự động kích hoạt DoT rút máu ở đầu lượt, trừ thời hạn và dọn dẹp hiệu ứng khi hết hạn; Stun khiến mục tiêu mất lượt hành động.
- **Milestone 4.2: Hành Vi AI Đối Thủ Theo 4 Archetype (Tactical Enemy AI)**:
  - Phân loại 4 Archetype chiến thuật:
    - *Disruptor (Drone Trinh Sát)*: Ưu tiên EMP Slow làm chậm, kích hoạt ECM Jamming khi thấp máu.
    - *Aggressive (Cơ Giáp Đột Kích)*: Dồn sát thương tên lửa bùng nổ khi người chơi dưới 45% HP, thiêu đốt Plasma Burn.
    - *Adaptive-Boss (Pháo Đài Công Thành)*: Bật khiên Fortify khi HP < 55%, phun Acid ăn mòn, nạp đại pháo tối thượng.
  - Cây quyết định theo ngữ cảnh, AI không bao giờ thực hiện hành động trái luật (thiếu SP hoặc đang cooldown).
- **Milestone 4.3: Cơ Chế Boss Đa Pha & Cảnh Báo Tuyệt Kỹ (Multi-Phase Boss & Telegraphed Attacks)**:
  - Cơ chế Boss 2 pha: Khi Boss dưới 50% HP, tự động kích hoạt PHA 2 - QUÁ TẢI NĂNG LƯỢNG (Overdrive): +30% ATK, +20 SPD kèm huy hiệu đỏ trên HUD.
  - Cơ chế cảnh báo đòn đánh tối thượng (Telegraphed Attack): Lượt N sạc pháo hiển thị banner cảnh báo đỏ khẩn cấp trên buồng lái; lượt N+1 xả đòn "Pháo Hạt Nhân Tận Diệt" 240% sát thương xuyên giáp. Nếu boss bị Stun ở lượt nạp sẽ bị ngắt chiêu hoàn toàn.
- **Milestone 4.4: Hàng Đợi Lượt Động, Né Tránh & Công Thức Sát Thương (Dynamic Turn Queue & Combat Formulas)**:
  - Dynamic Turn Queue: Tốc độ hiệu dụng (`getEffectiveSpeed`) cập nhật liên tục thứ tự ra đòn trên buồng lái khi có hiệu ứng làm chậm hoặc tăng tốc.
  - Công thức sát thương tích hợp chỉ số Xuyên Giáp (Armor Penetration) và Bạo Kích (Critical Hit).
  - Cơ chế Né Tránh (Evasion): Tỉ lệ né tránh theo chênh lệch tốc độ và buff ECM, né đòn nhận 0 sát thương kèm phản hồi "NÉ TRÁNH 💨".
  - Loại bỏ hoàn toàn chuỗi text cố định "Vanguard" trong `engine.ts`, thay bằng tên động `${player.name}`.
- **Nâng cấp giao diện buồng lái Đấu Trường (`combat-arena.tsx`)**:
  - Huy hiệu trạng thái trực quan phân biệt màu và icon (Lửa Plasma, Acid x tầng, Khiên, EMP, ECM, Stun).
  - Banner cảnh báo Boss nạp đại pháo tối thượng nhấp nháy đỏ trên màn hình.
  - Huy hiệu "PHA 2: OVERDRIVE 🔥" cạnh tên Boss khi vào pha 2.
  - Hiển thị chỉ số hiệu dụng thực tế (Tấn Công, Phòng Thủ, Tốc Độ) trên cả hai bên.

---

## [Phase 3] — Bản Đồ Chiến Dịch, 3 Lớp Cơ Giáp & Chợ Quân Sự

*Đã hoàn thành & Đã kiểm chứng (37/37 automated tests passed)*

### Tính năng đã hoàn thành:
- **Bản đồ chiến dịch vũ trụ (Sector Campaign Map)**:
  - 3 Sector chiến lược: Vành Đai Asteroid, Tinh Vân Plasma, Pháo Đài Bastion Core.
  - 9 ải chiến đấu tuyến tính, phân tách thưởng Lần Đầu (First Clear) và thưởng Lặp Lại (Repeat Clear).
- **3 Lớp Cơ Giáp hoàn chỉnh (Gear Classes)**:
  - *Vanguard Gear*: Lớp cơ giáp đa năng cân bằng công thủ.
  - *Falcon Gear*: Tiêm kích siêu tốc (125 SPD), luôn giành quyền ra đòn trước kẻ địch. 4 kỹ năng độc quyền.
  - *Aegis Gear*: Pháo đài hạng nặng (1800 HP, 120 DEF), giáp titan siêu bền và hỏa lực hạt nhân. 4 kỹ năng độc quyền.
- **Chợ quân sự không gian (Armory Shop)**:
  - Mua sắm trang bị hiếm/sử thi bằng Credits.
  - Bán vật phẩm thừa lấy lại 60% Credits, khóa bán đối với trang bị đang gắn trên người.
- **Hiệu ứng âm thanh Sci-Fi Web Audio (`audio.ts`)**:
  - Tổng hợp âm thanh laser, xung chấn va chạm, lá chắn, chiến thắng và lên cấp không cần tệp ngoài.
  - Tích hợp nút bật/tắt âm thanh (Mute/Unmute) trên giao diện.
- **Nâng cấp lưu trữ Schema v2 (`storage.ts`)**:
  - Hỗ trợ migration tự động và an toàn từ dữ liệu v1 sang v2.

---

## [Phase 2] — Tiến Trình Nhân Vật, Cấp Độ & Kho Đồ Hangar

*Đã hoàn thành*

### Tính năng đã hoàn thành:
- **Hệ thống cấp độ & Kinh nghiệm**:
  - Cơ chế tính EXP thăng cấp và tăng chỉ số vĩnh viễn (HP, SP, ATK, DEF, SPD).
  - Tích lũy ngân sách Credits từ chiến thắng trận đấu.
- **Kho trang bị (Hangar)**:
  - 3 ô trang bị: Vũ khí chính, Khiên phòng hộ, Động cơ đẩy.
  - So sánh chỉ số trực quan khi rê chuột vào vật phẩm.
  - Tính toán chỉ số tổng hợp có tác động thực tế đến chỉ số trong trận đánh.
- **Lưu trữ dữ liệu LocalStorage**:
  - Tự động lưu tiến trình và nạp lại khi tải lại trang web.
  - Hộp thoại cảnh báo xác nhận khi thực hiện Cài lại tiến trình.

---

## [Phase 1] — Nguyên Mẫu Đấu Trường Theo Lượt (Turn-based Arena)

*Đã hoàn thành*

### Tính năng đã hoàn thành:
- **Đấu trường chiến đấu theo lượt tốc độ (Speed Initiative)**:
  - So sánh tốc độ xác định bên ra đòn trước tiên.
  - Quản lý HP (Độ bền vỏ), SP (Năng lượng lõi).
  - 3 Kỹ năng khởi đầu của Vanguard (Pulse Strike, Armor Break, Emergency Guard) và đòn đánh thường hồi SP.
- **3 Chủng loại kẻ thù với AI độc lập**:
  - Drone Trinh Sát (Scout Drone), Cơ Giáp Đột Kích (Raider Mech), Pháo Đài Công Thành (Siege Walker Boss).
- **Giao diện Sci-Fi HUD buồng lái**:
  - Bảng trạng thái máu/năng lượng, radar mục tiêu, bảng nút kỹ năng và nhật ký chiến đấu thời gian thực.
  - Tích hợp mượt mà vào bảng điều khiển Ace Manager thông qua `components/game/console.tsx`.
