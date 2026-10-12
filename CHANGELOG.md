# STARFRONT — Nhật Ký Thay Đổi (Changelog)

Toàn bộ các mốc phát triển và cập nhật kế hoạch của dự án **STARFRONT** được ghi lại tại đây theo trình tự thời gian đảo ngược (mới nhất lên đầu).

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
