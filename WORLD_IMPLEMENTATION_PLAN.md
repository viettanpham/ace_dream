# STARFRONT WORLD — Kế Hoạch Triển Khai Chiến Lược (Implementation Roadmap)
*Document Version: 1.0 — Trạng Thái: Đã Phê Duyệt Kế Hoạch — Chuẩn Bị Triển Khai Tuần Tự*  
*Mã Lộ Trình: STARFRONT-WORLD-ROADMAP-PHASE6*

---

## 1. Nguyên Tắc Quản Trị & Tiêu Chuẩn Thực Thi (Governance Principles)

Kế hoạch này phân rã toàn bộ quá trình phát triển phân hệ **STARFRONT WORLD** thành **9 giai đoạn nhỏ (Sub-Phases 6.1 đến 6.9)**, được sắp xếp theo đúng trình tự phụ thuộc kỹ thuật từ tầng lõi dữ liệu đến tầng giao diện người dùng và kiểm thử tích hợp.

### 1.1. Quy Tắc "Zero-Regression & Zero-Interference"
1. **Không Chạm Mã Nguồn Gameplay Hiện Tại**: Tuyệt đối không làm thay đổi các quy tắc chiến đấu, logic cường hóa, chợ quân sự hay tiến trình của `StarfrontProgression` (Schema v4).
2. **Khế Ước Giao Dịch Rõ Ràng**: Tầng chiến đấu chỉ tương tác với WORLD thông qua Adapter trung gian có mã định danh giao dịch (Transaction ID) độc lập.
3. **Bảo Toàn Bộ Kiểm Thử Hiện Có**: Mọi phase của WORLD khi triển khai code trong tương lai đều phải đảm bảo toàn bộ 102/102 automated unit tests hiện tại tiếp tục PASS 100%.
4. **Kiểm Thử Trước Khi Chuyển Phase**: Mỗi sub-phase chỉ được coi là hoàn tất khi đáp ứng 100% Tiêu Chí Nghiệm Thu (Exit Criteria) và có test suite tự động chuyên biệt đi kèm.

---

## 2. Lộ Trình Phân Kỳ Chi Tiết (Detailed Phased Breakdown)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        STARFRONT WORLD IMPLEMENTATION ROADMAP                          │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
   ┌────────────────────────────────────────┴────────────────────────────────────────┐
   ▼                                        ▼                                        ▼
[PHASE 6.1]                              [PHASE 6.2]                              [PHASE 6.3]
Nền Tảng Dữ Liệu & Save Cách Ly         Đồ Thị Bản Đồ & Trạng Thái Sector       Tick Engine & Mô Phỏng Offline
- Schema WORLD_SAVE_V1                  - Tuyến đường siêu không gian            - Chuỗi 6-phase tick
- Backup luân phiên A/B                 - Vòng đời 5 giai đoạn Sector            - Seeded PRNG tái lập
- Kiểm tra checksum & migration         - Lan truyền Threat mạng lưới            - Time Travel Dev Controls
   │                                        │                                        │
   └────────────────────────────────────────┼────────────────────────────────────────┘
                                            │
   ┌────────────────────────────────────────┴────────────────────────────────────────┐
   ▼                                        ▼                                        ▼
[PHASE 6.4]                              [PHASE 6.5]                              [PHASE 6.6]
Kinh Tế Chiến Lược & Dân Số             Lực Lượng Quân Sự VSS & The Void         Combat Adapter & Khế Ước Giao Dịch
- 4 Tài nguyên + Lương thực riêng        - Sổ cái quân sự bảo toàn quân           - Transaction ID lũy đẳng
- Industry, Logistics, Stability         - Auto-resolve & Hậu quả thất bại        - Snapshot khóa trận
- Di cư bảo toàn zero-sum                - Phân bổ đồn trú & dự bị                - Phục hồi an toàn khi crash
   │                                        │                                        │
   └────────────────────────────────────────┼────────────────────────────────────────┘
                                            │
   ┌────────────────────────────────────────┴────────────────────────────────────────┐
   ▼                                        ▼                                        ▼
[PHASE 6.7]                              [PHASE 6.8]                              [PHASE 6.9]
Vòng Đời Sự Kiện & Chuỗi Nhiệm Vụ       Operations Center & Dual Results Hub     Bản Đồ Fullscreen & Tích Hợp E2E
- INIT -> PROCESSING -> RESULT           - Báo cáo Mission & Event riêng biệt     - Chế độ toàn màn hình 100vw/vh
- Khóa chiến lược mặc định               - Bộ lọc unread & dọn dẹp an toàn        - Polish hiệu ứng & âm thanh
- 6 Hình thái chuỗi nhiệm vụ             - Bảng điều phối nhanh Quick Dispatch    - E2E Regression 100% Pass
```

---

### Giai Đoạn 6.1: Nền Tảng Kiến Trúc Dữ Liệu, Interfaces & Cơ Chế Lưu Trữ Cách Ly (Foundation, Contracts & Isolated Storage)

- **Mục tiêu**: Thiết lập cấu trúc kiểu dữ liệu toàn diện (TypeScript interfaces), xây dựng hệ thống lưu trữ độc lập `STARFRONT_WORLD_SAVE_V1` với cơ chế sao lưu luân phiên (Rotating Backups A/B) và xác thực tính toàn vẹn dữ liệu.
- **Phụ thuộc (Prerequisites)**:
  - Khung dữ liệu `lib/game/types.ts` hiện tại (Schema v4).
- **Tập tin dự kiến tạo mới / mở rộng**:
  - `lib/game/world/types.ts`: Toàn bộ interfaces của WORLD (Sector, Route, Faction, ResourceLedger, MilitaryForce, WorldSaveData).
  - `lib/game/world/storage.ts`: Các hàm `loadWorldState`, `saveWorldState`, `rotateBackups`, `validateChecksum`, `recoverFromBackup`.
  - `tests/world/storage-resilience.test.ts`: Bộ kiểm thử khả năng chịu lỗi và tự phục hồi lưu trữ.
- **Các bước triển khai (Implementation Tasks)**:
  1. Định nghĩa chuẩn interfaces cho World State, đảm bảo tách biệt hoàn toàn với `StarfrontProgression`.
  2. Xây dựng logic tính mã băm xác thực (Checksum SHA-256 hoặc CRC32 nhẹ) cho mỗi lần ghi state.
  3. Hiện thực thuật toán lưu trữ nguyên tử: Ghi vào Staging $\rightarrow$ Đẩy bản cũ sang Backup A/B $\rightarrow$ Xác nhận commit khóa chính `STARFRONT_WORLD_SAVE_V1`.
  4. Viết hàm tự động cứu nạn (Auto-Rescue): Nếu save chính bị hỏng khi parse JSON hoặc sai checksum, tự động đọc `BACKUP_A` hoặc `BACKUP_B`.
- **Tiêu chí hoàn thành (Exit Criteria)**:
  - Lưu và nạp dữ liệu World State trơn tru mà không tác động đến khóa `STARFRONT_SAVE_DATA_V4`.
  - Giả lập cố tình làm hỏng save chính (corrupt payload): Hệ thống tự động phục hồi thành công từ backup hợp lệ gần nhất.
  - 100% Unit tests trong `storage-resilience.test.ts` đạt kết quả PASS.
- **Rủi ro kỹ thuật & Giải pháp phòng ngừa**:
  - *Rủi ro*: Giới hạn dung lượng LocalStorage (thường là 5MB) bị tràn khi lưu nhiều backup.
  - *Giải pháp*: Cắt tỉa (prune) lịch sử sự kiện cũ, chỉ lưu trạng thái hiện tại và 2 bản backup gọn nhẹ.

---

### Giai Đoạn 6.2: Mạng Lưới Đồ Thị World Map & Máy Trạng Thái Sector (World Map Graph Network & Sector State Machine)

- **Mục tiêu**: Xây dựng cấu trúc đồ thị mạng lưới kết nối giữa các sector, quản lý trạng thái các tuyến đường, hiện thực máy trạng thái 5 giai đoạn của sector và cơ chế lan truyền mức độ đe dọa (Threat Propagation).
- **Phụ thuộc (Prerequisites)**:
  - Hoàn thành Phase 6.1 (Kiểu dữ liệu và lưu trữ nền tảng).
- **Tập tin dự kiến tạo mới / mở rộng**:
  - `lib/game/world/graph.ts`: Thuật toán đồ thị (Dijkstra tìm đường ngắn nhất, kiểm tra tính liên thông, định tuyến an toàn).
  - `lib/game/world/sector-lifecycle.ts`: Máy trạng thái chuyển đổi giữa `Normal`, `Threatened`, `Under Siege`, `Lost`, `Recovery`.
  - `lib/game/world/initial-map.ts`: Dữ liệu cấu hình 8 sector khởi đầu và 12 tuyến đường siêu không gian.
  - `tests/world/sector-lifecycle.test.ts`: Kiểm thử máy trạng thái và lan truyền Threat.
- **Các bước triển khai (Implementation Tasks)**:
  1. Khởi tạo danh sách 8 sector mẫu với tọa độ chuẩn, tài nguyên, phân bổ công nghiệp và chỉ số Threat ban đầu.
  2. Thiết lập 12 tuyến kết nối (edges) với các thuộc tính: khoảng cách (distance), trạng thái tuyến (`open`, `hazardous`, `blocked`, `offline`).
  3. Viết hàm cập nhật giai đoạn sector: Tự động chuyển cấp khi Threat vượt các ngưỡng 300, 700 hoặc khi trận chiến phòng thủ thất bại.
  4. Hiện thực thuật toán lan truyền Threat: Sector có Threat cao sẽ rò rỉ 10–15% áp lực sang các sector lân cận nếu tuyến đường thông suốt.
- **Tiêu chí hoàn thành (Exit Criteria)**:
  - Máy trạng thái sector chuyển đổi chính xác theo mọi điều kiện biên (ngưỡng Threat, thất thủ, giải phóng).
  - Thuật toán định tuyến từ chối tìm đường qua các cạnh đang bị `Blocked` hoặc `Offline`.
  - 100% Unit tests chuyển đổi trạng thái PASS.
- **Rủi ro kỹ thuật & Giải pháp phòng ngừa**:
  - *Rủi ro*: Vòng lặp lan truyền Threat gây hiệu ứng tuyết lở (Snowball Effect) làm toàn bộ bản đồ rơi vào khủng hoảng quá nhanh.
  - *Giải pháp*: Áp dụng hệ số suy giảm khoảng cách (Damping factor) và trần tăng trưởng đe dọa tối đa mỗi tick (+50 Threat/ngày).

---

### Giai Đoạn 6.3: Động Cơ Mô Phỏng Chuỗi Tick Chiến Lược & Bắt Kịp Thời Gian Thực (Strategic Simulation & Tick Engine)

- **Mục tiêu**: Xây dựng bộ máy tick tất định (Deterministic Phased Tick Engine) gồm 6 phase cố định, cơ chế bắt kịp thời gian ngoại tuyến theo từng batch an toàn (Bounded Batch Catch-up) và bảng điều khiển kiểm thử thời gian (Time Travel Dev Controls).
- **Phụ thuộc (Prerequisites)**:
  - Hoàn thành Phase 6.1 và Phase 6.2.
- **Tập tin dự kiến tạo mới / mở rộng**:
  - `lib/game/world/tick-engine.ts`: Hàm điều phối `executeWorldTick` chạy tuần tự qua 6 phase.
  - `lib/game/world/catchup-engine.ts`: Hàm `processOfflineCatchup` chia nhỏ chu kỳ xử lý theo đợt chống đơ trình duyệt.
  - `lib/game/world/random.ts`: Seeded PRNG thuật toán SplitMix32/Mulberry32.
  - `tests/world/tick-engine.test.ts`: Kiểm thử tính tất định và bắt kịp thời gian.
- **Các bước triển khai (Implementation Tasks)**:
  1. Hiện thực chuỗi 6 phase: Phase 1 (Giao dịch) $\rightarrow$ Phase 2 (Vận chuyển) $\rightarrow$ Phase 3 (Kinh tế) $\rightarrow$ Phase 4 (Quân sự) $\rightarrow$ Phase 5 (Hạn chót) $\rightarrow$ Phase 6 (Nội dung mới).
  2. Tích hợp Seeded PRNG vào World State; mỗi tick tiến hóa seed một bước xác định.
  3. Viết thuật toán bắt kịp ngoại tuyến: Đo khoảng cách thời gian thực, kẹp chặn ở tối đa 360 ticks, chia thành các batch 50 ticks kèm yielding.
  4. Xây dựng logic cho Time Travel Controls: Hàm tính trước dự báo (Forecast Impact) và thực thi tua an toàn mà không động tới Combat.
- **Tiêu chí hoàn thành (Exit Criteria)**:
  - Cùng một seed và trạng thái ban đầu, chạy 100 ticks luôn cho ra kết quả cuối cùng giống hệt nhau (Deterministic Verification).
  - Giả lập thời gian offline 7 ngày: Hệ thống hoàn tất bắt kịp trong dưới 500ms mà không làm đơ giao diện.
  - Kiểm thử Time Travel không làm sai lệch hay kích hoạt ngoài ý muốn các trận đấu trong Đấu Trường.
- **Rủi ro kỹ thuật & Giải pháp phòng ngừa**:
  - *Rủi ro*: Người chơi chỉnh đồng hồ hệ điều hành (Clock Tampering) để gian lận thời gian.
  - *Giải pháp*: So sánh với dấu thời gian đã lưu gần nhất; nếu phát hiện thời gian hệ thống bị lùi lại, bỏ qua tick và giữ nguyên state hiện tại.

---

### Giai Đoạn 6.4: Kinh Tế Chiến Lược, Mạng Lưới Hậu Cần & Nhân Khẩu Học (Strategic Economy, Logistics & Demographics)

- **Mục tiêu**: Hiện thực hóa hệ thống 4 nhóm tài nguyên chiến lược kết hợp Lương thực thiết yếu riêng biệt, 3 năng lực Industry/Logistics/Stability, cơ chế hậu cần tự động và quản lý dân sự tuân thủ quy tắc bảo toàn (Zero-Sum Migration).
- **Phụ thuộc (Prerequisites)**:
  - Hoàn thành Phase 6.2 và Phase 6.3.
- **Tập tin dự kiến tạo mới / mở rộng**:
  - `lib/game/world/economy.ts`: Tính toán sản xuất, tiêu thụ lương thực, biến động Stability và suy thoái do thiếu hụt.
  - `lib/game/world/logistics.ts`: Điều phối chuỗi cung ứng tự động, bảo toàn mức tồn kho an toàn (Safety Stock Buffer), quản lý hàng đang trên đường (`In-Transit`).
  - `lib/game/world/demographics.ts`: Quản lý dân số quốc gia vs dân số vùng kiểm soát, lòng trung thành và di cư tị nạn.
  - `tests/world/economy-demographics.test.ts`: Kiểm thử bảo toàn dân số và điều phối chuỗi cung ứng.
- **Các bước triển khai (Implementation Tasks)**:
  1. Hiện thực công thức tính sản lượng theo năng lực công nghiệp sector, điều chỉnh bởi Stability và mức độ Threat.
  2. Bổ sung logic tiêu thụ lương thực theo quy mô dân số (1 dân = $X$ lương thực/ngày); kích hoạt cơ chế suy thoái từng bước khi kho lương thực cạn kiệt.
  3. Hiện thực hệ thống phân bổ hậu cần tự động: Tìm các sector có kho hàng vượt mức an toàn 3 ngày để chuyển sang sector thiếu hụt.
  4. Đảm bảo quy tắc bảo toàn di cư dân số: Dân số di cư được trừ khỏi sector đi và cộng vào sector đến khi chuyến đi hoàn tất an toàn.
- **Tiêu chí hoàn thành (Exit Criteria)**:
  - Tổng dân số toàn ngân hà luôn bằng đúng: $\text{Dân Số Tại Các Sector} + \text{Dân Số Đang Di Cư} + \text{Thương Vong Tích Lũy}$.
  - Hàng hóa đang di chuyển không thể bị tiêu thụ trước khi đến đích.
  - 100% Tests kinh tế và dân cư PASS.
- **Rủi ro kỹ thuật & Giải pháp phòng ngừa**:
  - *Rủi ro*: Mạng lưới logistics bị nghẽn vô hạn khi nhiều sector đồng thời thiếu hàng.
  - *Giải pháp*: Thiết lập trật tự ưu tiên: Cứu đói (Lương thực) $\rightarrow$ Phòng thủ (Năng lượng khiên) $\rightarrow$ Quân sự (Vật tư đạn dược) $\rightarrow$ Công nghiệp (Vật liệu).

---

### Giai Đoạn 6.5: Phe Phái VSS & The Void, Lực Lượng & Quân Sự (Factions, Authoritative Military Ledger & Auto-Resolve)

- **Mục tiêu**: Xây dựng sổ cái quân sự có thẩm quyền (Authoritative Forces Ledger), phân biệt rõ các trạng thái quân đội (Deployed, Reserves, Wounded, Retreating, Casualties), thuật toán tự động giải quyết trận phụ (Auto-Resolve) và tính toán hậu quả thất bại theo ngữ cảnh.
- **Phụ thuộc (Prerequisites)**:
  - Hoàn thành Phase 6.2, 6.3 và 6.4.
- **Tập tin dự kiến tạo mới / mở rộng**:
  - `lib/game/world/forces-ledger.ts`: Quản lý điều động quân lực, chuyển trạng thái và bảo toàn quân số quốc gia.
  - `lib/game/world/auto-resolve.ts`: Thuật toán cán cân sức mạnh Lanchester cải tiến để tự động giải quyết trận đánh nhỏ.
  - `lib/game/world/threat-ai.ts`: Hành vi chiến lược của phe The Void (tập hợp quân, chọn mục tiêu tấn công, tổ chức vây hãm).
  - `tests/world/forces-auto-resolve.test.ts`: Kiểm thử bảo toàn lực lượng và logic auto-resolve.
- **Các bước triển khai (Implementation Tasks)**:
  1. Xây dựng cấu trúc quản lý quân đội theo sổ cái bất biến: Điều chuyển quân chỉ thay đổi trạng thái sang `In-Transit`, không làm đổi tổng quân số.
  2. Cài đặt thuật toán Lanchester cho các trận chạm trán phụ: Tính toán thương vong dựa trên tỷ lệ quân số, cấp công sự và ưu thế công nghệ.
  3. Xây dựng AI chiến lược The Void: Đánh giá điểm yếu của phòng tuyến VSS để điều quân tấn công các sector có Threat cao và phòng thủ mỏng.
  4. Hiện thực hóa các mức độ hậu quả thất bại theo ngữ cảnh: Rút lui chiến thuật, mất công sự vòng ngoài, hoặc thất thủ toàn diện.
- **Tiêu chí hoàn thành (Exit Criteria)**:
  - Tổng lực lượng quân sự bảo toàn 100% qua mọi thao tác chuyển quân và giao tranh.
  - Kết quả auto-resolve phản ánh công bằng sức mạnh lực lượng hai bên mà không có biến số ngẫu nhiên cực đoan.
  - 100% Tests quân sự PASS.
- **Rủi ro kỹ thuật & Giải pháp phòng ngừa**:
  - *Rủi ro*: The Void dồn toàn lực tấn công căn cứ chính VSS ở những ngày đầu tiên.
  - *Giải pháp*: Thiết lập quy tắc phòng ngự căn cứ chính bất khả xâm phạm và giới hạn tốc độ mở rộng của The Void theo cấp độ người chơi.

---

### Giai Đoạn 6.6: Khế Ước Tích Hợp Chiến Đấu & Nhật Ký Giao Dịch Lũy Đẳng (Combat Integration Adapter & Idempotent Journal) — [ĐÃ HOÀN THÀNH 100%]

- **Mục tiêu**: Xây dựng tầng Adapter trung gian kết nối giữa WORLD và buồng lái Đấu Trường (`CombatArena`), tạo Encounter Snapshot khi khóa trận, cấp phát Transaction ID, ghi nhận nhật ký giao dịch lũy đẳng (chống áp dụng kết quả 2 lần) và luồng xử lý an toàn khi combat bị treo/lỗi.
- **Trạng thái**: **ĐÃ HOÀN THÀNH (DONE — 100% Exit Criteria Passed, 8/8 Subtests PASS)**.
- **Phụ thuộc (Prerequisites)**:
  - Hoàn thành Phase 6.1 đến 6.5.
  - Mã nguồn buồng lái `components/game/combat-arena.tsx` hiện có.
- **Tập tin đã triển khai**:
  - `lib/game/world/combat-adapter.ts`: Khế ước `EncounterSnapshot`, `lockEncounterAndCreateSnapshot`, `commitCombatResultReceipt`, `abortSuspendedCombat`, `resumeSuspendedCombat`, `convertBattleResultToReceipt`.
  - `lib/game/world/transaction-journal.ts`: Quản lý danh sách giao dịch, lọc lũy đẳng `isTransactionCommitted`, đối soát `reconcileCombatTransactionsInTick`, dọn dẹp an toàn `pruneJournal`.
  - `tests/world/combat-adapter-idempotency.test.ts`: Bộ 8 bài test chuyên sâu kiểm chứng khóa trận, chống double-application 10 lần liên tiếp, phục hồi treo và safe abort.
- **Các bước triển khai (Implementation Tasks)**:
  1. [x] Thiết kế khế ước dữ liệu `EncounterSnapshot` và `CombatResultReceipt` tương thích với cấu hình `combatVersion: "v1"`.
  2. [x] Viết hàm khóa trận: Đóng băng tạm thời lực lượng đồn trú tại sector liên quan để tránh bị sửa đổi trong lúc trận đấu diễn ra.
  3. [x] Xây dựng bộ lọc giao dịch (Transaction Filter): Tra cứu `transactionId` trong journal; chặn ngay lập tức nếu biên lai kết quả đã từng được áp dụng.
  4. [x] Thiết lập luồng khôi phục treo (Suspended Recovery): Cho phép người chơi phục hồi lại trận đấu hoặc hủy bỏ mà không bị xử thua oan.
- **Tiêu chí hoàn thành (Exit Criteria - Đạt 100%)**:
  - [x] Gửi liên tục 10 lần cùng 1 biên lai chiến thắng: World State chỉ ghi nhận tăng tài nguyên và giảm Threat đúng 1 lần duy nhất (Idempotency Filter).
  - [x] Giả lập ngắt kết nối giữa chừng: Trạng thái trận đấu được giữ nguyên ở chế độ `NEEDS_RECOVERY` và phục hồi chuẩn xác sau khi mở lại.
  - [x] 100% Tests Adapter đạt PASS (8/8 subtests trong `combat-adapter-idempotency.test.ts` PASS tuyệt đối).
- **Rủi ro kỹ thuật & Giải pháp phòng ngừa**:
  - *Rủi ro*: Thay đổi nhỏ trong định dạng log chiến đấu của Đấu trường làm hỏng adapter.
  - *Giải pháp*: Chỉ truyền các chỉ số kết quả tổng hợp trong `CombatResultReceipt` (HP còn lại, thắng/thua, số hiệp đấu, ID đối thủ), không phụ thuộc vào chi tiết log chuỗi hành động.

---

### Giai Đoạn 6.7: Động Cơ Vòng Đời Sự Kiện & Chuỗi Nhiệm Vụ Chiến Lược (Event Lifecycle Engine & Strategic Mission Chains)

- **Mục tiêu**: Hiện thực hóa vòng đời sự kiện 3 pha (`INIT` $\rightarrow$ `PROCESSING` $\rightarrow$ `RESULT`), tự động kích hoạt chiến lược mặc định khi hết hạn countdown, hỗ trợ 6 dạng chuỗi nhiệm vụ và khống chế trần số lượng nhiệm vụ đồng thời.
- **Phụ thuộc (Prerequisites)**:
  - Hoàn thành Phase 6.2, 6.3 và 6.6.
- **Tập tin dự kiến tạo mới / mở rộng**:
  - `lib/game/world/event-engine.ts`: Khởi tạo sự kiện, đếm ngược hạn chót, chuyển trạng thái và tự động chọn chiến lược mặc định.
  - `lib/game/world/mission-chains.ts`: Đồ thị chuỗi nhiệm vụ (Linear, Branching, Threshold, Reactive, Periodic, Standalone) và giới hạn `MAX_ACTIVE_MISSION_CHAINS = 8`.
  - `lib/game/world/event-templates.ts`: Bộ cấu hình 20 sự kiện mẫu và chiến lược phản ứng.
  - `tests/world/event-lifecycle.test.ts`: Kiểm thử đếm ngược, khóa mặc định và phân nhánh nhiệm vụ.
- **Các bước triển khai (Implementation Tasks)**:
  1. Xây dựng logic đếm ngược cho sự kiện `INIT`: Khi đồng hồ về 0 mà người chơi chưa chọn, tự động khóa phương án `defaultStrategy`.
  2. Lưu trữ bền vững trạng thái `PROCESSING`: Sự kiện tiếp tục tiến trình qua các lần reload trang web.
  3. Hiện thực hóa các mẫu chuỗi nhiệm vụ: Hỗ trợ rẽ nhánh kết quả dựa trên quyết định hoặc thành tích chiến đấu của người chơi.
  4. Quản lý trần chuỗi nhiệm vụ: Khi đạt giới hạn 8 chuỗi, tạm hoãn sinh nhiệm vụ mới cho đến khi hoàn thành hoặc hủy bớt các chuỗi cũ.
- **Tiêu chí hoàn thành (Exit Criteria)**:
  - [x] Sự kiện hết hạn tự động chuyển sang `PROCESSING` với đúng chiến lược mặc định mà không gây lỗi null/undefined.
  - [x] Reload ứng dụng khi sự kiện đang xử lý không làm thời gian đếm ngược bị đặt lại từ đầu.
  - [x] Hậu quả chiến lược của sự kiện chỉ được áp dụng lũy đẳng đúng 1 lần (`consequencesApplied` guard).
  - [x] Đồ thị chuỗi nhiệm vụ hỗ trợ đầy đủ 6 hình thái (Linear, Branching, Threshold, Reactive, Periodic, Standalone).
  - [x] Khống chế trần toàn cục `MAX_ACTIVE_MISSION_CHAINS = 8` và trần sự kiện `MAX_ACTIVE_EVENTS = 12`.
  - [x] 100% Tests sự kiện đạt PASS (8/8 subtests trong `tests/world/event-lifecycle.test.ts` PASS tuyệt đối).
- **Rủi ro kỹ thuật & Giải pháp phòng ngừa**:
  - *Rủi ro*: Các sự kiện phản ứng (Reactive) kích hoạt dây chuyền không kiểm soát gây tràn danh sách.
  - *Giải pháp*: Thiết lập thời gian giãn cách tối thiểu (Cooldown Period) giữa các sự kiện cùng loại tại một sector, cùng bộ lọc trùng lặp chuỗi đang active.

---

### Giai Đoạn 6.8: Giao Diện Operations Center & Trung Tâm Kết Quả Kép (Operations Center UI & Dual Results Hub)

- **Mục tiêu**: Xây dựng giao diện tổng hành dinh Operations Center hoàn chỉnh trong Shell, tích hợp Trung Tâm Kết Quả Kép (Mission Results vs Event Results), bộ lọc theo mức độ khẩn cấp, huy hiệu chưa đọc và cơ chế xóa lịch sử an toàn.
- **Phụ thuộc (Prerequisites)**:
  - Hoàn thành Phase 6.1 đến 6.7.
- **Tập tin dự kiến tạo mới / mở rộng**:
  - `components/game/world/operations-center.tsx`: Component tổng hợp hiển thị Situation Deck, Active Operations và Quick Dispatch.
  - `components/game/world/dual-results-hub.tsx`: Component phân tách 2 tab Mission Results và Event Results kèm bộ lọc và xóa an toàn.
  - `components/game/world/quick-dispatch-dock.tsx`: Bến điều động nhanh chi viện quân sự.
  - `tests/world/operations-center-ui.test.ts`: Kiểm thử render UI, lọc thông báo và thao tác xóa lịch sử.
- **Các bước triển khai (Implementation Tasks)**:
  1. Xây dựng Bảng Tình Hình Chiến Lược (Situation Deck) với biểu đồ thanh trực quan thể hiện tỷ lệ kiểm soát thiên hà, Threat trung bình và sản lượng.
  2. Tạo component `DualResultsHub` phân tách rạch ròi kết quả chiến đấu và kết quả sự kiện; hỗ trợ đánh dấu đã đọc và đếm số lượng chưa đọc.
  3. Cài đặt tính năng Xóa Lịch Sử An Toàn (Safe Pruning): Người chơi có thể xóa các báo cáo đã đọc mà không làm suy giảm bất kỳ chỉ số nào trong World State.
  4. Xây dựng Dock Điều Động Nhanh (Quick Dispatch): Người chơi có thể điều quân chi viện cho sector nguy cấp ngay từ Operations Center.
- **Tiêu chí hoàn thành (Exit Criteria)**:
  - Giao diện hiển thị trực quan, mạch lạc, đúng chuẩn Sci-Fi Aerospace HUD của STARFRONT.
  - Thao tác xóa lịch sử log báo cáo không gây ảnh hưởng đến quân số, tài nguyên hay mức Threat của các sector.
  - 100% Tests giao diện PASS.
- **Rủi ro kỹ thuật & Giải pháp phòng ngừa**:
  - *Rủi ro*: Quá nhiều thông báo cũ làm chậm giao diện danh sách.
  - *Giải pháp*: Phân trang (Pagination) hoặc cuộn ảo (Virtual Scrolling) hiển thị tối đa 20 bản ghi gần nhất.

---

### Giai Đoạn 6.9: Bản Đồ Toàn Màn Hình, Tinh Chỉnh Thị Giác & Kiểm Thử Tích Hợp Toàn Diện (Fullscreen Map, Polish & E2E Verification)

- **Mục tiêu**: Hoàn thiện component Bản Đồ Chiến Lược Thiên Hà (`WorldMap`) với chế độ toàn màn hình (Fullscreen Viewport), hiệu ứng âm thanh Sci-Fi Web Audio, tích hợp hoàn chỉnh vào thanh điều hướng của Shell và chạy kiểm thử hồi quy toàn diện (End-to-End Regression).
- **Phụ thuộc (Prerequisites)**:
  - Hoàn thành toàn bộ Phase 6.1 đến 6.8.
- **Tập tin dự kiến tạo mới / mở rộng**:
  - `components/game/world/world-map.tsx`: Giao diện bản đồ mạng lưới sector, hiển thị tuyến đường, hạm đội di chuyển và lớp phủ chiến thuật.
  - `components/game/world/world-fullscreen-overlay.tsx`: Khung hiển thị toàn màn hình 100vw/100vh với HUD điều khiển tối giản.
  - Cập nhật `components/game/starfront-shell.tsx`: Bổ sung section `world` vào `SECTIONS`.
  - `tests/world/e2e-world-integration.test.ts`: Bộ kiểm thử hồi quy E2E toàn diện.
- **Các bước triển khai (Implementation Tasks)**:
  1. Hiện thực hóa World Map trực quan: Vẽ các đỉnh sector với huy hiệu phe phái, đường nối hiển thị trạng thái an toàn/nguy hiểm/phong tỏa bằng màu sắc Sci-Fi tương ứng.
  2. Tạo nút chuyển đổi toàn màn hình (Fullscreen Toggle): Hỗ trợ phóng to bản đồ chiếm trọn khung hình, kèm phím tắt thoát nhanh (`ESC`).
  3. Tích hợp hiệu ứng âm thanh Web Audio (`audio.ts`): Tiếng quét radar chiến lược, tiếng cảnh báo sector bị tấn công, âm báo tin tức tình báo mới.
  4. Gắn phân hệ WORLD vào thanh điều hướng cấp cao nhất của `starfront-shell.tsx`.
  5. Chạy bộ kiểm thử E2E: Kiểm chứng toàn bộ luồng từ điều quân $\rightarrow$ vào trận đấu $\rightarrow$ cập nhật kết quả $\rightarrow$ lưu trữ và phục hồi sau reload.
- **Tiêu chí hoàn thành (Exit Criteria)**:
  - Toàn bộ trải nghiệm chuyển đổi mượt mà giữa WORLD, Đấu Trường và Hangar.
  - Toàn bộ bộ kiểm thử mới của WORLD và 102/102 kiểm thử cũ đều PASS 100%.
  - Lệnh `npm run build` biên dịch thành công tuyệt đối, không có cảnh báo TypeScript hay lỗi lint.
- **Rủi ro kỹ thuật & Giải pháp phòng ngừa**:
  - *Rủi ro*: Xung đột CSS z-index giữa Fullscreen Overlay và các modal cũ.
  - *Giải pháp*: Chuẩn hóa lớp z-index cho fullscreen viewport ở mức `z-40` và các modal khẩn cấp ở mức `z-50`.

---

## 3. Bảng Ma Trận Phụ Thuộc Kỹ Thuật (Dependency Matrix)

| Sub-Phase | Tên Phân Hệ | Phụ Thuộc Trực Tiếp | Sản Phẩm Đầu Ra Cốt Lõi |
|---|---|---|---|
| **Phase 6.1** | Nền Tảng Dữ Liệu & Save Cách Ly | Schema v4 hiện có | `world/types.ts`, `world/storage.ts` (Rotating Backups) |
| **Phase 6.2** | Đồ Thị Bản Đồ & Vòng Đời Sector | Phase 6.1 | `world/graph.ts`, `world/sector-lifecycle.ts` (5 Stages) |
| **Phase 6.3** | Tick Engine & Mô Phỏng Offline | Phase 6.1, 6.2 | `world/tick-engine.ts`, Time Travel Dev Controls |
| **Phase 6.4** | Kinh Tế & Dân Cư Bảo Toàn | Phase 6.2, 6.3 | `world/economy.ts` (Food separate), Zero-Sum Migration |
| **Phase 6.5** | Lực Lượng Quân Sự & Auto-Resolve | Phase 6.2, 6.3, 6.4 | `world/forces-ledger.ts`, Lanchester Auto-Resolve |
| **Phase 6.6** | Combat Adapter & Khế Ước Giao Dịch | Phase 6.1 -> 6.5, Combat Arena | `world/combat-adapter.ts`, Idempotent Journal |
| **Phase 6.7** | Vòng Đời Sự Kiện & Chuỗi Nhiệm Vụ | Phase 6.2, 6.3, 6.6 | `world/event-engine.ts` (INIT->PROC->RES), 6 Topologies |
| **Phase 6.8** | Operations Center & Dual Results | Phase 6.1 -> 6.7 | `operations-center.tsx`, `dual-results-hub.tsx` |
| **Phase 6.9** | Bản Đồ Fullscreen & Tích Hợp E2E | Phase 6.1 -> 6.8, Shell | `world-map.tsx`, Fullscreen HUD, Shell Navigation |

---

*Kế hoạch này là bản đồ hành động chính thức, định hướng cho các lượt thực thi mã nguồn tiếp theo của dự án STARFRONT.*
