# STARFRONT WORLD — Tài Liệu Thiết Kế Toàn Diện (Master World Design Specification)
*Document Version: 1.0 — Trạng Thái: Đã Phê Duyệt Thiết Kế (Design Confirmed) — Chưa Triển Khai Code*  
*Mã Phân Hệ: STARFRONT-WORLD-CORE-SPEC*

---

## 1. Mục Đích & Nguyên Tắc Thiết Kế (Purpose & Design Principles)

Tài liệu này xác lập đặc tả thiết kế hoàn chỉnh cho phân hệ **STARFRONT WORLD** — trung tâm chỉ huy chiến lược vĩ mô của toàn bộ trải nghiệm STARFRONT. 

### 1.1. Bốn Cột Mốc Hiện Trạng & Phân Định Trách Nhiệm (Current State Classification)
Theo nguyên tắc kiểm toán và lập kế hoạch kỹ thuật, toàn bộ các thành phần trong tài liệu này được phân định rõ ràng thành 4 nhóm trạng thái:
1. **[ĐÃ TỒN TẠI TRONG CODE]**: Các hệ thống đang hoạt động trong mã nguồn hiện tại (ví dụ: Combat Arena, Turn Engine, Progression Schema v4, Armory Shop, Hangar).
2. **[ĐÃ XÁC NHẬN THIẾT KẾ]**: Các quyết định thiết kế WORLD chính thức được đặc tả và phê duyệt trong tài liệu này.
3. **[ĐỀ XUẤT CẦN XÁC MINH]**: Các giải pháp kỹ thuật cần được kiểm chứng thông qua prototype hoặc benchmark trước khi khóa mã nguồn.
4. **[CHƯA XÁC ĐỊNH / TBD]**: Các tham số mở rộng để cân bằng trong các phase sau.

### 1.2. Nguyên Tắc Cốt Lõi Của WORLD
- **Trung Tâm Chiến Lược (Strategic Command Hub)**: WORLD không phải là một danh sách nhiệm vụ tĩnh đơn thuần; WORLD là một mô phỏng chiến lược sống động nơi người chơi quản lý bản đồ thiên hà, điều phối lực lượng quân sự, phân bổ chuỗi cung ứng và phản ứng trước các chiến dịch xâm lược.
- **Tách Biệt Thẩm Quyền (Separation of Concerns)**: WORLD hoạt động như một lớp chiến lược độc lập. Dữ liệu WORLD State có save riêng, không ghi đè trực tiếp hay làm ô nhiễm tiến trình phi công/trang bị (`StarfrontProgression`).
- **Giao Dịch Đảm Bảo Tính Nhất Quán (Transactional Integrity)**: Tích hợp giữa WORLD và Đấu Trường Chiến Đấu thông qua khế ước Adapter có chữ ký giao dịch (Transaction Receipt), đảm bảo tính lũy đẳng (Idempotent) và chống áp dụng hai lần.
- **Tiến Trình Chân Thực & Bảo Toàn Dữ Liệu**: Mọi di chuyển tài nguyên, thương vong quân đội và di cư dân số đều tuân thủ nguyên tắc bảo toàn (Zero-Sum Conservation). Không sinh số ảo; không rò rỉ trạng thái.

---

## A. Tổng Quan & Giao Diện Người Dùng (Overview & UI Architecture)

### A.1. Vị Trí Trong Cấu Trúc Điều Hướng (Top-Level Navigation Integration)
- **Tích Hợp Shell**: WORLD được tích hợp vào thanh điều hướng cấp cao nhất (`StarfrontSection`) trong `starfront-shell.tsx`:
  - `id: "world"`
  - `label: "STARFRONT / Chiến Trường Thiên Hà (WORLD)"`
  - `shortLabel: "Chiến Lược WORLD"`
  - `icon: Globe2 / Compass`
  - `submenus`:
    * `overview`: "Trung Tâm Tác Chiến (Operations Center)"
    * `map`: "Bản Đồ Chiến Lược Thiên Hà (World Map)"
    * `forces`: "Điều Phối Lực Lượng Quân Sự (Forces & Garrisons)"
    * `logistics`: "Hậu Cần & Kinh Tế Ngân Hà (Supply & Economy)"
    * `intel`: "Trung Tâm Tình Báo & Sự Kiện (Intel & Event Log)"
- **Quan Hệ Với Phân Hệ Hiện Tại**:
  - `battlefield` (Đấu trường chiến đấu): Vẫn duy trì vai trò buồng lái chiến thuật trực tiếp. Khi xuất trận từ WORLD, buồng lái nhận nhiệm vụ thông qua adapter và hoàn trả kết quả về WORLD.
  - `missions` (Chiến dịch Sector hiện tại): Đóng vai trò chuỗi nhiệm vụ hướng dẫn cốt truyện tuyến tính khởi đầu; WORLD mở rộng trải nghiệm thành chiến tranh động toàn diện.

### A.2. Bản Đồ Toàn Màn Hình (Optional Fullscreen World Map Mode)
- **Cơ chế**: Giao diện World Map cung cấp nút chuyển đổi chế độ toàn màn hình (`Fullscreen Toggle`):
  - Khi kích hoạt: Bản đồ mở rộng 100vw x 100vh, ẩn tạm thời các thanh điều hướng lề và header ngoài của Shell, tập trung tối đa không gian thị giác cho người chơi quan sát các sector, hạm đội di chuyển và các tuyến cung ứng.
  - Tích hợp lớp phủ điều khiển tối giản (HUD Overlay): Mini-radar, thanh tài nguyên thu gọn, đồng hồ thời gian chiến lược và nút thoát toàn màn hình (phím tắt `ESC` hoặc nút góc trên bên phải).
  - Tương thích tỷ lệ khung hình màn hình từ 16:9 đến siêu rộng (ultrawide 21:9), hỗ trợ kéo rê (pan) và phóng to/thu nhỏ (zoom từ 0.5x đến 2.0x).

### A.3. Trung Tâm Tác Chiến (Operations Center)
Operations Center là màn hình tổng hành dinh của WORLD, phân chia thành 4 phân khu chức năng mạch lạc:
1. **Strategic Situation Deck (Bảng Tình Hình Chiến Lược)**:
   - Tổng quan quyền kiểm soát thiên hà (% VSS vs % The Void vs % Tranh Chấp).
   - Chỉ số năng lực tổng thể: Stability trung bình, Logistics throughput, Sản lượng công nghiệp mỗi ngày.
   - Mức độ cảnh báo toàn thiên hà (Galaxy Threat Level).
2. **Active Operations Board (Bảng Chiến Dịch & Sự Kiện Đang Chạy)**:
   - Danh sách các chuỗi nhiệm vụ chiến lược (Mission Chains) đang hoạt động.
   - Các sự kiện thời gian thực kèm đồng hồ đếm ngược (Event Countdowns).
3. **Dual Results Hub (Khu Vực Kết Quả Hai Phân Hệ)**:
   - Phân khu kết quả riêng biệt: **Mission Results** (Kết quả chiến dịch quân sự) và **Event Results** (Kết quả sự kiện/khủng hoảng).
   - Bộ lọc theo trạng thái: Đã đọc / Chưa đọc, Mức độ khẩn cấp, Loại sự kiện.
4. **Quick Dispatch Dock (Bến Điều Động Nhanh)**:
   - Truy cập nhanh lực lượng dự bị, điều động hạm đội chi viện cho các sector nguy cấp chỉ với 1 click.

---

## B. Bản Đồ Thế Giới & Mạng Lưới Tuyến Đường (World Map & Sector Network)

### B.1. Cấu Trúc Đồ Thị Tuyến Đường (Graph-Based Network)
Bản đồ thiên hà được mô hình hóa dưới dạng một đồ thị có trọng số $G = (V, E)$:
- **Tập Đỉnh $V$ (Sectors)**: Đại diện cho các hệ sao, tiền đồn không gian, trạm khai khoáng hoặc pháo đài mẹ hạm.
- **Tập Cạnh $E$ (Hyperspace Lanes / Tuyến Đường Kết Nối)**: Tuyến siêu không gian nối liền các sector lân cận.
  - *Ý nghĩa gameplay cốt lõi*: Tuyến đường KHÔNG chỉ là đường vẽ trang trí; tuyến đường là xương sống của mọi luồng vật chất trong game:
    * Điều động lực lượng quân sự (Troop & Fleet transit).
    * Vận chuyển tài nguyên & phân phối lương thực (Resource convoys).
    * Dòng người tị nạn & sơ tán dân sự (Civilian evacuation / migration).
    * Sự lan truyền áp lực xâm lăng và mức đe dọa (Threat spillover & Incursion spread).

### B.2. Trạng Thái Tuyến Đường (Route States)
Mỗi cạnh $e \in E$ có một trạng thái hoạt động riêng biệt:
1. **Open / Secure (An Toàn)**: Lưu thông thông suốt 100% tốc độ, không có nguy cơ bị phục kích.
2. **Hazardous / Contested (Nguy Hiểm / Bị Tranh Chấp)**: Xuất hiện cướp bóc hoặc hạm đội Void quấy phá. Tốc độ di chuyển giảm 30%, đoàn xe vận tải có 15–25% nguy cơ bị hao hụt tài nguyên (Attrition).
3. **Blocked / Under Siege (Bị Phong Tỏa)**: Tuyến đường bị địch chốt chặn hoàn toàn. Mọi hoạt động vận chuyển quân sự và dân sự bị đình chỉ cho đến khi phong tỏa được giải phóng.
4. **Severed / Offline (Bị Cắt Đứt / Vô Hiệu)**: Trạm tiếp vận hoặc cổng nhảy siêu không gian tại 1 trong 2 đầu cầu bị phá hủy; tuyến đường tạm thời biến mất khỏi mạng lưới định tuyến.

### B.3. Phân Tách Tuyệt Đối: Quyền Kiểm Soát (Control) vs Mức Độ Đe Dọa (Threat)
Thiết kế khẳng định hai khái niệm này hoàn toàn độc lập và không được gộp làm một:
- **Quyền Kiểm Soát Phe Phái (Sector Sovereignty / Control)**:
  - Cho biết chính quyền nào đang nắm quyền điều hành hợp pháp tại sector: `VSS`, `The Void`, hoặc `Contested / Neutral`.
  - Quyết định quyền thu thuế tài nguyên, quyền tuyển quân và điều động dân sự.
- **Mức Độ Đe Dọa (Threat Level [0..1000])**:
  - Phản ánh mật độ hoạt động quân sự thù địch, hoạt động quấy rối ngầm hoặc tàn quân du kích tại sector đó.
  - *Ví dụ thực tế*: Một sector có thể 100% thuộc quyền kiểm soát của VSS nhưng lại có Threat Level cực cao (900/1000) do đang bị lực lượng The Void vây hãm hoặc có tế bào nội gián hoạt động. Ngược lại, một sector trung lập có thể có Threat = 0.

### B.4. Vòng Đời 5 Giai Đoạn Của Sector (Sector Lifecycle Stages)
Mỗi sector vận hành theo một máy trạng thái hữu hạn 5 giai đoạn:
```
┌──────────┐     Threat Tăng     ┌──────────────┐     Địch Tấn Công     ┌──────────────┐
│  NORMAL  │ ──────────────────> │  THREATENED  │ ────────────────────> │ UNDER SIEGE  │
└──────────┘                     └──────────────┘                       └──────────────┘
     ▲                                                                          │
     │                                                                          │ Phòng Thủ
     │ Phục Hồi Xong                                                            │ Thất Bại
     │                                                                          ▼
┌──────────┐                     Giải Phóng                      ┌──────────────┐
│ RECOVERY │ <────────────────────────────────────────────────── │     LOST     │
└──────────┘                                                     └──────────────┘
```
1. **Normal (Bình Thường)**:
   - Threat thấp (< 300). Sản xuất công nghiệp 100%, dân số ổn định, tuyến đường an toàn.
2. **Threatened (Bị Uy Hiếp)**:
   - Threat trung bình (300–699). Xuất hiện các đội do thám địch; năng suất giảm nhẹ (-15%), Stability bắt đầu suy giảm.
3. **Under Siege (Bị Bao Vây / Bị Tấn Công)**:
   - Threat cao ($\ge 700$). Lực lượng địch xuất hiện dày đặc, tuyến đường bị tranh chấp hoặc phong tỏa. Kích hoạt đếm ngược trận chiến quyết định (Decisive Battle Countdown).
4. **Lost (Thất Thủ / Bị Chiếm)**:
   - Lực lượng đồn trú bị tiêu diệt, quyền kiểm soát chuyển sang tay The Void. Ngưng trệ sản xuất, cơ sở hạ tầng bị phá hoại, dân chúng hoảng loạn bỏ chạy.
5. **Recovery (Tái Thiết / Hồi Phục)**:
   - Vừa được giải phóng khỏi The Void. Quyền kiểm soát thuộc về VSS nhưng năng lực công nghiệp bị tổn thương (-50%), cần thời gian và tài nguyên để ổn định lại dân số và phục hồi Stability.

### B.5. Quy Mô Bản Đồ Khởi Đầu (Initial Map Scale)
- **Định hướng tham khảo**: 6 đến 10 sector kết nối mạng lưới là quy mô chuẩn ban đầu, bao gồm:
  - 1 Căn Cứ Trung Tâm VSS (Sol Command HQ — An toàn tuyệt đối, điểm xuất phát).
  - 3 Tiền Đồn Công Nghiệp & Khai Mỏ Vành Đai (Helios, Mining K-7, Asteroid Delta).
  - 2 Trạm Tiếp Vận Chiến Lược Tuyến Giữa (Nebula Bastion, Waypoint Orion).
  - 2 Vùng Tranh Chấp Tiền Duyên (Tartarus Breach, Shadow Reach).
- Bản đồ thiết kế mở, hỗ trợ mở rộng thêm các sector mới mà không làm vỡ thuật toán tìm đường (Dijkstra / A* routing).

---

## C. Phe Phái, Lực Lượng & Quân Sự (Factions, Military & Force Allocation)

### C.1. Hai Phe Phái Khởi Đầu & Khả Năng Mở Rộng
- **Hai Phe Khởi Đầu Bắt Buộc**:
  1. **Chính Phủ VSS (Vanguard Solar Syndicate)**: Liên minh loài người và các hệ sao tự do. Định hướng công nghệ cơ giáp chính quy, công nghiệp bền vững và bảo vệ dân sự.
  2. **Đế Chế The Void (The Void Incursion / Void Empire)**: Thực thể xâm lăng bí ẩn từ ngoài rìa ngân hà với hạm đội sinh cơ (biomechanical fleets), vũ khí năng lượng tối và chiến thuật vây ráp bầy đàn.
- **Nguyên Tắc Phạm Vi**: Tuyệt đối KHÔNG thêm phe mới vào phạm vi ban đầu của Phase 6. Kiến trúc dữ liệu sử dụng định danh `FactionId = "vss" | "void" | string` để mở rộng an toàn cho các phe tương lai (BCU, ANI, Space Pirates) mà không cần refactor cấu trúc.

### C.2. Lực Lượng Chiến Lược Là Dữ Liệu Có Thẩm Quyền (Authoritative Force Ledger)
- Mọi đơn vị quân sự (chiến hạm, tiểu đoàn cơ giáp, phi đội tiêm kích) đều được quản lý theo sổ cái bảo toàn quân số:
  $$\text{Total Military Force} = \text{Deployed} + \text{Reserves} + \text{Wounded/Repair} + \text{Retreating}$$
- **Nguyên tắc bảo toàn**: Lệnh chuyển quân từ Sector A sang Sector B không bao giờ tự sinh thêm quân hoặc làm mất quân giữa chừng. Trong thời gian hành quân, quân số mang trạng thái `In-Transit` và gắn với một tuyến đường cụ thể.
- **Phân loại trạng thái lực lượng**:
  * **Deployed (Đang triển khai / Đồn trú)**: Trực chiến bảo vệ sector, sẵn sàng nghênh địch.
  * **Reserves (Dự bị chiến lược)**: Đóng tại căn cứ hậu phương, sẵn sàng điều động chi viện.
  * **Wounded / In-Repair (Bị thương / Đang sửa chữa)**: Rút khỏi tiền tuyến, phục hồi dần theo từng tick dựa trên năng lực y tế/xưởng sửa chữa.
  * **Retreating (Đang rút lui)**: Rút chạy khỏi trận địa thất thủ, di chuyển về sector thân thiện gần nhất.
  * **Casualties / Destroyed (Tổn thất vĩnh viễn)**: Quân số bị tiêu diệt trong trận đánh; trừ vĩnh viễn khỏi tổng lực lượng quốc gia.

### C.3. Hệ Thống Phân Bổ Lực Lượng & Tự Động Hóa Trận Đấu (Auto-Resolve Engine)
- **Tự Động Hóa Trận Phụ (Skirmish Auto-Resolve)**: Các cuộc đụng độ quy mô nhỏ, tuần tra biên giới hoặc quấy rối tuyến đường được giải quyết tự động bằng thuật toán cán cân lực lượng Lanchester cải tiến:
  - Đầu vào: Quân số đồn trú, trang bị phòng thủ, chỉ số tướng lĩnh, cấp độ công sự.
  - Đầu ra xác định (Deterministic Output): Thương vong hai bên, mức thay đổi Threat, biến động Stability.
- **Trận Chiến Quyết Định (Decisive Battles)**: Khi một sector quan trọng bị `Under Siege` hoặc có Mẹ Hạm địch xuất hiện, hệ thống đánh dấu là trận chiến cốt lõi (Player Intervention Required).
  - Người chơi được cảnh báo trước qua Operations Center.
  - Người chơi có quyền chọn: Tự mình điều khiển buồng lái xuất kích (Manual Combat qua Đấu Trường) HOẶC giao toàn quyền cho phó tư lệnh tự động giải quyết với nguy cơ thương vong cao hơn.

### C.4. Hậu Quả Thất Bại Theo Ngữ Cảnh (Contextual Defeat Penalties)
Thất bại trong trận đánh KHÔNG mặc định là mất trắng sector ngay lập tức:
- Nếu đồn trú bị đánh bại nhưng công sự phòng thủ còn nguyên: Quân đồn trú rút lui về boong-ke, sector rơi vào trạng thái `Under Siege`, cơ sở hạ tầng bị hư hại 30%.
- Nếu lực lượng chi viện đến kịp: Sector giữ được quyền kiểm soát nhưng Stability sụt giảm nghiêm trọng (-25) và tổn thất một phần vật tư kho dự trữ.
- Chỉ khi toàn bộ phòng tuyến sụp đổ và không còn đường rút: Sector mới chuyển sang trạng thái `Lost`.

---

## D. Tích Hợp Chiến Đấu & Khế Ước Giao Dịch (Combat Integration & Contract Adapter)

### D.1. Hợp Đồng Adapter Ổn Định (Combat Adapter Contract)
Để bảo vệ mã nguồn Đấu Trường hiện tại (`combat-arena.tsx`, `engine.ts`) khỏi bị xáo trộn, phân hệ WORLD giao tiếp với combat thông qua một tầng trung gian duy nhất: `WorldCombatAdapter`.

```
┌─────────────────────────┐                           ┌─────────────────────────┐
│       WORLD STATE       │                           │      COMBAT ARENA       │
│  (Authoritative Hub)    │                           │    (Tactical Session)   │
└───────────┬─────────────┘                           └───────────▲─────────────┘
            │                                                     │
            │ 1. Khóa trận & Tạo Snapshot                         │
            ▼                                                     │
┌─────────────────────────────────────────────────────────────────┴─────────────┐
│                            WORLD COMBAT ADAPTER                               │
│  - Tạo Encounter Snapshot (Chỉ số, Phe, Mục tiêu, Điều kiện thắng)             │
│  - Cấp phát Transaction ID duy nhất (UUID v4)                                  │
│  - Đóng băng trạng thái World liên quan (In-flight Lock)                      │
│  - Nhận CombatResultReceipt & Xác thực chữ ký giao dịch                        │
│  - Áp dụng kết quả vào World State duy nhất 1 lần (Idempotent Apply)           │
└───────────────────────────────────────────────────────────────────────────────┘
```

### D.2. Phiên Bản Cấu Hình Combat (Combat Version Explicit Configuration)
- Hệ thống quy định rõ ràng thuộc tính `combatVersion`:
  - `combatVersion: "v1"`: Sử dụng cấu hình đấu trường 1v1 hiện tại (Người chơi vs Boss / Đơn vị tinh anh đại diện).
  - `combatVersion: "v2"`: Hỗ trợ đấu trường mở rộng (Đội hình hạm đội / Nhiều làn tác chiến).
- **Quy tắc bất biến**: Chỉ chuyển từ V1 sang V2 sau khi phiên bản V2 đã vượt qua 100% bộ kiểm thử tự động và xác nhận tương thích hoàn toàn với luồng adapter.

### D.3. Encounter Snapshot Tại Thời Điểm Khóa Trận
Khi người chơi bấm nút "Vào Trận Chiến Lược", Adapter tạo ra một bản chụp độc lập `EncounterSnapshot`:
- `transactionId`: Mã định danh giao dịch duy nhất.
- `sectorId`: Sector diễn ra trận đánh.
- `enemyUnit`: Bản sao chỉ số kẻ địch (HP, ATK, DEF, SPD, kỹ năng) được tính toán từ cấp độ đe dọa của sector.
- `friendlyModifiers`: Các buff chiến lược từ công sự, viện quân và tinh thần dân số.
- `winConditions`: Điều kiện thắng (Tiêu diệt mục tiêu, sống sót qua N lượt, hoặc bảo vệ mục tiêu).
- `lockedAtTimestamp`: Dấu thời gian khóa trận.

### D.4. Tính Lũy Đẳng & Bảo Vệ Chống Áp Dụng Hai Lần (Idempotent Transaction Journal)
- Sau khi trận đấu kết thúc, buồng lái xuất ra biên lai kết quả: `CombatResultReceipt`.
- WORLD lưu giữ một nhật ký giao dịch (`worldTransactionJournal`):
  - Trước khi áp dụng kết quả vào World State, hệ thống tra cứu `transactionId`.
  - Nếu `transactionId` đã tồn tại trong danh sách đã hoàn tất (`committed`): Từ chối áp dụng tiếp (Bảo vệ chống double-application khi người chơi spam nút hoặc tải lại trang).
  - Nếu chưa có: Thực hiện cập nhật World State, ghi nhận vào journal và đánh dấu `committed`.

### D.5. Xử Lý Khi Combat Bị Lỗi (Suspended Recovery Flow)
- Tuyệt đối KHÔNG tự ý giả định kết quả Thắng hoặc Thua khi combat bị crash, đứt mạng hoặc gặp ngoại lệ JavaScript:
  - Giữ nguyên trạng thái trận đánh ở chế độ `SUSPENDED / PENDING_RECOVERY`.
  - Khi người chơi mở lại game: Operations Center hiển thị thông báo phát hiện trận đánh đang dở dang kèm 2 lựa chọn an toàn:
    1. **Tiếp tục chiến đấu (Resume Combat)**: Tái tạo lại buồng lái từ `EncounterSnapshot`.
    2. **Hủy bỏ an toàn (Safe Abort)**: Hủy trận đánh, hoàn trả quân lực về trạng thái trước khi khóa trận, không áp dụng bất kỳ hình phạt giả nào.

---

## E. Lưu Trữ, Checkpoint & Phục Hồi An Toàn (Save, Checkpoint & Disaster Recovery)

### E.1. Tách Rời Khóa Lưu Trữ (Isolated Storage Keys)
Phân hệ WORLD sở hữu hệ thống lưu trữ độc lập, không trộn lẫn vào dữ liệu tiến trình phi công:
- Khóa lưu trữ chính: `STARFRONT_WORLD_SAVE_V1`
- Khóa lưu trữ dự phòng Slot A: `STARFRONT_WORLD_BACKUP_A`
- Khóa lưu trữ dự phòng Slot B: `STARFRONT_WORLD_BACKUP_B`
- Khóa tiến trình RPG hiện có: `STARFRONT_SAVE_DATA_V4` (Giữ nguyên vẹn, không chỉnh sửa).

### E.2. Cơ Chế Sao Lưu Luân Phiên (Rotating Backups with Atomic Verification)
Quy trình ghi dữ liệu World tuân thủ quy tắc ghi nguyên tử (Atomic Write Protocol):
```
[Dữ Liệu Mới Cần Lưu]
         │
         ▼
[1. Kiểm Tra Tính Toàn Vẹn] ──(Lỗi Checksum/Schema)──> [Hủy Bỏ & Ghi Log Lỗi]
         │ (Hợp lệ)
         ▼
[2. Ghi Vào Slot Tạm (Staging)]
         │ (Thành công)
         ▼
[3. Đẩy Save Cũ Hiện Tại Sang Backup Slot Luân Phiên (A -> B)]
         │
         ▼
[4. Xác Nhận Khóa Chính (Commit to STARFRONT_WORLD_SAVE_V1)]
```
- **Quy tắc vàng**: Chỉ ghi đè lên slot backup sau khi bản lưu mới đã được kiểm tra tính hợp lệ về cấu trúc JSON và checksum. Không bao giờ xóa backup trước khi ghi save mới thành công.

### E.3. Tự Động Phục Hồi Khi Save Hỏng (Auto-Recovery from Valid Backup)
- Nếu khóa lưu trữ chính bị hỏng (parse error, thiếu trường bắt buộc, hoặc checksum sai lệch):
  - Hệ thống tự động kích hoạt quy trình cứu hộ: Quét tìm `BACKUP_A` và `BACKUP_B`.
  - Phục hồi bản sao lưu hợp lệ có dấu thời gian gần nhất.
  - Hiển thị thông báo minh bạch trong UI: *"Phát hiện lỗi dữ liệu chiến lược; hệ thống đã tự động phục hồi về điểm kiểm tra an toàn lúc [Thời Gian]"*.

### E.4. Điểm Kiểm Tra (Checkpoints) & Khôi Phục Giao Dịch Dang Dở
- **Thời điểm kích hoạt Checkpoint**:
  * Ngay trước khi khóa trận chiến lược (`Battle Lock`).
  * Ngay sau khi commit kết quả trận đánh (`Battle Commit`).
  * Sau khi hoàn tất chu kỳ mô phỏng tick thời gian.
  * Khi người chơi thực hiện điều chuyển quân quy mô lớn.
- **Khôi phục giao dịch dang dở (In-flight Recovery)**:
  - Mọi thao tác chiến lược (vận chuyển, chuyển quân, chế tạo) đều có trạng thái rõ ràng (`PENDING`, `IN_TRANSIT`, `COMMITTED`).
  - Khi reload ứng dụng: Hệ thống chỉ giữ lại các thay đổi đã `COMMITTED`; các thao tác `PENDING` chưa hoàn tất sẽ được hủy an toàn hoặc thử lại từ trạng thái nhất quán của checkpoint trước đó.

---

## F. Thời Gian & Mô Phỏng Khi Ngoại Tuyến (Time & Offline Simulation)

### F.1. Thời Gian Thực Làm Chuẩn (Unix Timestamp Anchor)
- Thế giới chiến lược WORLD sử dụng mốc thời gian thực tế (`Date.now()` / Unix Epoch milliseconds) kết hợp với chu kỳ tick chiến lược:
  - Chu kỳ tick chuẩn: $1 \text{ Strategic Day} = 300 \text{ giây thực}$ (hoặc cấu hình tùy chỉnh).
  - Khoảng thời gian người chơi đóng ứng dụng (offline window) được tính bằng:
    $$\Delta t = \text{CurrentTimestamp} - \text{LastSavedTimestamp}$$

### F.2. Cơ Chế Bắt Kịp Có Giới Hạn Theo Từng Batch (Bounded Batch Catch-up)
Khi người chơi đăng nhập lại sau một khoảng thời gian dài vắng mặt:
- **Chống Đơ Trình Duyệt (Prevent UI Freeze)**: Không bao giờ chạy một vòng lặp tick liên tục hàng nghìn bước trong một khung hình duy nhất (frame blocking).
- **Quy trình Batch Catch-up**:
  - Giới hạn xử lý tối đa mỗi đợt: `MAX_TICKS_PER_BATCH = 50 ticks` (tương đương 50 ngày chiến lược).
  - Nếu thời gian ngoại tuyến vượt quá giới hạn tối đa (ví dụ 30 ngày thực tế): Áp dụng trần bảo vệ ngoại tuyến (`OFFLINE_CATCHUP_CAP = 360 ticks`), phần thời gian vượt trần được chuyển thành trạng thái đình trệ hòa hoãn (Stalemate Drift), không dồn dập tàn phá thế giới của người chơi.
  - Sau mỗi batch 50 ticks: Ghi checkpoint tạm thời và nhường luồng thực thi (yield control qua `requestAnimationFrame` / `setTimeout`) để UI hiển thị thanh tiến trình bắt kịp cho người chơi.
- **Tính Tất Định (Deterministic Queue)**: Các sự kiện đến hạn được xử lý tuần tự theo đúng thời điểm kích hoạt, không bỏ qua sự kiện và không kích hoạt lại các sự kiện đã xong.

### F.3. Công Cụ Kiểm Thử Thời Gian Dành Cho Nhà Phát Triển (Time Travel Dev Controls)
- **Ranh Giới An Toàn Tuyệt Đối**: Công cụ tua thời gian CHỈ tác động lên phân hệ WORLD State; tuyệt đối KHÔNG can thiệp hoặc làm tua nhanh trận chiến đang diễn ra trong Đấu Trường buồng lái (`CombatArena`).
- **Giao Diện Điều Khiển (Dev Time Panel)**:
  - Cung cấp các nút bấm định sẵn: `+1 Ngày`, `+7 Ngày`, `+30 Ngày`, và ô nhập số ngày tùy chỉnh.
  - **Cơ Chế Xem Trước Tác Động (Impact Forecast Preview)**: Trước khi áp dụng, bảng điều khiển hiển thị bản tóm tắt ước tính:
    * Tài nguyên sản xuất dự kiến: $+X \text{ Credits}, +Y \text{ Alloy}, +Z \text{ Food}$.
    * Biến động Threat trung bình: $+/-\Delta \text{ Threat}$.
    * Các sự kiện dự kiến đến hạn kết quả.
  - Hộp thoại yêu cầu người chơi/tester bấm "Xác Nhận Tua Thời Gian" trước khi thực thi.
- **Tính Đồng Nhất Logic**: Công cụ test thời gian sử dụng CHÍNH XÁC hàm `simulateWorldTick` của hệ thống thật, đảm bảo không sinh ra các hành vi sai lệch giữa môi trường test và thực tế.

---

## G. Chu Kỳ Tick, Các Phase & Thứ Tự Sự Kiện (Tick Architecture & Event Ordering)

### G.1. Thứ Tự 6 Phase Bất Biến Trong Mỗi Tick Chiến Lược
Mỗi tick thời gian của WORLD thực thi tuần tự qua 6 phase có thứ tự cố định nghiêm ngặt:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   DETERMINISTIC STRATEGIC TICK (1 DAY)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
[PHASE 1]                       [PHASE 2]                       [PHASE 3]
Phục Hồi & Giao Dịch            Vận Chuyển & Di Cư              Kinh Tế & Dân Số
- Giải quyết giao dịch treo     - Di chuyển đoàn xe hàng        - Sản xuất tài nguyên
- Phục hồi quân bị thương       - Di cư dân sự an toàn          - Tiêu thụ lương thực
- Sửa chữa cơ sở hạ tầng        - Cập nhật luồng hàng đến       - Tính toán Stability
    │                               │                               │
    └───────────────────────────────┼───────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
[PHASE 4]                       [PHASE 5]                       [PHASE 6]
Quân Sự & Mức Đe Dọa            Hạn Chót & Kết Quả              Kích Hoạt Mới
- Di chuyển hạm đội hành quân   - Kiểm tra countdown event      - Sinh sự kiện động mới
- Lan truyền Threat lan tỏa     - Tự động giải quyết skirmish   - Mở khóa nhiệm vụ mới
- Tính toán hao hụt đồn trú     - Chuyển giai đoạn sector       - Thông báo tình báo
```

### G.2. Phân Tích Phụ Thuộc Dữ Liệu Của Thứ Tự Phase
- *Tại sao Phục hồi/Giao dịch ở Phase 1?* Để bảo đảm mọi biên lai từ combat và các thao tác người chơi vừa thực hiện được commit vào state trước khi bắt đầu tính toán chu kỳ mới.
- *Tại sao Vận chuyển ở Phase 2 trước Kinh tế Phase 3?* Hàng hóa và nguyên liệu phải đến đích thì nhà máy tại sector đích mới có đủ nguyên liệu để đưa vào sản xuất trong Phase 3.
- *Tại sao Quân sự ở Phase 4 trước Hạn chót Phase 5?* Lực lượng chi viện đến nơi kịp thời sẽ làm thay đổi cán cân sức mạnh khi hệ thống đánh giá kết quả trận đấu và hết hạn sự kiện ở Phase 5.

### G.3. Phá Vỡ Thế Hòa Đồng Thời Ổn Định (Deterministic Stable Tie-Breaking)
- Khi có nhiều sự kiện hoặc hạm đội đến hạn cùng một mili-giây:
  - Tiêu chí sắp xếp: Sắp xếp ưu tiên theo `(priorityLevel DESC, scheduledTimestamp ASC, entityId ASC)`.
  - Đảm bảo trật tự thực thi hoàn toàn bất biến và tái lập được trên mọi máy khách.

### G.4. Máy Sinh Số Giả Ngẫu Nhiên Có Seed (Seeded PRNG)
- Mọi biến số ngẫu nhiên trong mô phỏng (tỉ lệ thành công sự kiện, độ biến động của đe dọa, rơi đồ tự động) đều sử dụng thuật toán PRNG có seed (ví dụ SplitMix32 hoặc Mulberry32).
- Seed được lưu trong World State và tiến hóa theo từng tick. Khi cần tua lại hoặc replay một chuỗi tick, kết quả luôn đồng nhất 100%.

---

## H. Kinh Tế Chiến Lược, Tài Nguyên & Động Thái Dân Cư (Economy & Demographics)

### H.1. Bốn Nhóm Tài Nguyên Chiến Lược & Lương Thực Thiết Yếu
Kinh tế WORLD hoạt động ở tầm vĩ mô (Macro Strategy), không đi vào tiểu tiết mô phỏng vi mô từng cá thể:
1. **Vật Liệu Công Nghiệp (Industrial Materials / Composites)**: Dùng để xây dựng công sự, nâng cấp cơ sở hạ tầng và sửa chữa mecha.
2. **Năng Lượng (Energy / Plasma Cells)**: Cung cấp năng lượng cho khiên phòng thủ sector, duy trì cổng nhảy siêu không gian và vận hành nhà máy.
3. **Vật Tư Hậu Cần (Logistics Supplies / Munitions)**: Đạn dược, phụ tùng thay thế và thiết bị tiêu hao phục vụ quân sự.
4. **Dữ Liệu / Tình Báo Chiến Thuật (Data / Tactical Intelligence)**: Dùng để giải mã ý đồ địch, mở khóa chuỗi nhiệm vụ và kích hoạt chiến thuật đặc biệt.
- **LƯƠNG THỰC (Food / Hydroponic Rations) LÀ TÀI NGUYÊN THIẾT YẾU RIÊNG BIỆT**:
  - *Quyết định thiết kế dứt khoát*: Lương thực KHÔNG được gộp chung vào vật tư hậu cần.
  - Lương thực là huyết mạch sinh tồn của dân số. Thiếu lương thực sẽ trực tiếp làm sụp đổ Stability và gây chết đói/bạo loạn dân sự.

### H.2. Ba Năng Lực Chiến Lược Cốt Lõi (Three Strategic Capacities)
1. **Industry (Năng Lực Công Nghiệp)**:
   - Được theo dõi và giới hạn theo từng sector (`sectorIndustryCap`).
   - Phản ánh số lượng xưởng đóng tàu, nhà máy chế tạo đang hoạt động.
2. **Logistics (Năng Lực Hậu Cần & Lưu Thông)**:
   - Xác định tổng thông lượng hàng hóa có thể vận chuyển đồng thời qua mạng lưới tuyến đường.
   - Khi nhu cầu vận chuyển vượt quá Logistics Capacity: Các chuyến hàng bị nghẽn (Backlog) và thời gian giao hàng bị kéo dài.
3. **Stability (Chỉ Số Ổn Định Xã Hội [0..100])**:
   - Phản ánh lòng tin của dân chúng và trật tự công cộng tại sector.
   - Thang điểm:
     * $\ge 80$: Thịnh vượng (+15% sản lượng, tăng trưởng dân số).
     * $50 - 79$: Bình thường.
     * $25 - 49$: Bất ổn (-25% sản lượng, nguy cơ tội phạm/nội gián).
     * $< 25$: Khủng hoảng bạo loạn (Đình công toàn diện, nguy cơ sector tự ly khai hoặc đầu hàng địch).

### H.3. Cơ Chế Thiếu Hụt Tài Nguyên Suy Giảm Dần (Gradual Attrition)
- Khi một sector cạn kiệt tài nguyên (ví dụ hết Năng lượng hoặc hết Lương thực):
  - Hệ thống KHÔNG khóa cứng toàn bộ chức năng ngay lập tức.
  - Thay vào đó áp dụng cơ chế suy thoái theo bậc (Gradual Degradation):
    * Ngày 1–2 thiếu hụt: Cảnh báo đỏ; Stability giảm -5/ngày.
    * Ngày 3–5 thiếu hụt: Năng lực phòng thủ giảm 25%, sản lượng công nghiệp giảm 50%.
    * Sau 5 ngày: Bắt đầu phát sinh thương vong dân số do nạn đói, đồn trú chịu hao mòn sĩ khí.

### H.4. Hỗ Trợ Hậu Cần Tự Động Với Ngưỡng Dự Trữ An Toàn (Automated Logistics)
- Người chơi có thể kích hoạt chính sách "Tự Động Điều Tiết Hậu Cần" (Auto Supply Line):
  - Tuyến vận tải tự động chuyển tài nguyên từ các sector dư thừa sang sector đang thiếu hụt.
  - **Bảo toàn mức dự trữ an toàn (Safety Stock Reserves)**: Sector nguồn luôn giữ lại tối thiểu một lượng tài nguyên đủ dùng cho 3 ngày (`SafetyBuffer = 3 * DailyConsumption`), ngăn chặn việc sector trung tâm bị vắt kiệt do chi viện cho tiền tuyến.
  - **Hàng đang trên đường (In-Transit)**: Hàng hóa được trừ khỏi kho xuất ngay khi đoàn xe khởi hành, nhưng KHÔNG được cộng vào kho đích cho đến khi giao thành công. Nếu đoàn xe bị chặn đánh, lượng hàng này có thể bị mất.

### H.5. Động Thái Dân Cư & Quy Tắc Di Cư Bảo Toàn (Demographics & Zero-Sum Migration)
- **Hai Chỉ Số Dân Số Riêng Biệt**:
  - `National Total Population`: Tổng dân số toàn bộ liên minh VSS.
  - `Controlled Territory Population`: Dân số hiện đang sinh sống trong các sector mà VSS đang kiểm soát thực tế.
- **Lòng Trung Thành Dân Sự (Civilian Reluctance)**: Dân số KHÔNG tự động biến thành lính Void khi sector bị chiếm đóng. Cư dân mang tư cách thường dân bị chiếm đóng (Suppressed Population), liên tục tìm cơ hội tị nạn hoặc hỗ trợ phong trào kháng chiến ngầm.
- **Quy Tắc Di Cư Bảo Toàn (Zero-Sum Conservation)**:
  - Khi dân số di cư từ Sector A sang Sector B:
    $$\text{Pop}_A(t+1) = \text{Pop}_A(t) - M, \quad \text{Pop}_B(t+1) = \text{Pop}_B(t) + M - \text{Casualties}$$
  - Tuyệt đối không sinh thêm dân ảo.
  - Không cho phép di cư qua các tuyến đường đang bị `Blocked` hoặc có Threat quá cao mà không có hộ tống quân sự.

---

## I. Sự Kiện, Chuỗi Nhiệm Vụ & Trung Tâm Tác Chiến (Events, Missions & Operations)

### I.1. Vòng Đời 3 Pha Của Sự Kiện (Event Lifecycle)
Mọi biến cố trong WORLD (Ví dụ: "Hạm Đội Đột Kích", "Bão Plasma Không Gian", "Bạo Động Dân Sự", "Yêu Cầu Tiếp Tế Khẩn Cấp") đều vận hành qua 3 pha khép kín:
```
┌──────────────────┐          Hết Hạn Countdown          ┌──────────────────────┐
│       INIT       │ ─────────────────────────────────>  │      PROCESSING      │
│ (Đang Chờ Lệnh)  │      Người Chơi Chọn Chiến Lược     │ (Đang Giải Quyết)    │
└──────────────────┘                                     └──────────────────────┘
                                                                    │
                                                                    │ Đạt Thời Gian Xử Lý
                                                                    ▼
                                                         ┌──────────────────────┐
                                                         │        RESULT        │
                                                         │ (Lưu Trữ Bền Vững)   │
                                                         └──────────────────────┘
```
1. **INIT (Khởi Tạo & Chờ Quyết Định)**:
   - Sự kiện xuất hiện kèm đồng hồ đếm ngược (`decisionDeadline`).
   - Mỗi event template đi kèm một **Chiến Lược Mặc Định (Default Strategy)** (Ví dụ: "Phòng thủ thụ động" hoặc "Sơ tán khẩn cấp").
   - Nếu người chơi không đưa ra quyết định khi đồng hồ về 0: Hệ thống tự động khóa và kích hoạt chiến lược mặc định đã được gán sẵn từ đầu. Không bao giờ để sự kiện bị treo lơ lửng.
2. **PROCESSING (Đang Thực Thi)**:
   - Sự kiện chuyển sang trạng thái xử lý có thời lượng cụ thể.
   - Trạng thái `PROCESSING` được lưu cố định vào save; khi người chơi reload trang web, sự kiện tiếp tục đếm tiến trình mà không bị khởi động lại từ đầu.
3. **RESULT (Kết Quả & Báo Cáo)**:
   - Khi hoàn tất, kết quả (thắng/thua, biến động tài nguyên, thương vong) được sinh ra và ghi vào kho lưu trữ bền vững `worldEventResultsArchive`.
   - Việc người chơi chưa xem kết quả KHÔNG chặn các sự kiện mới phát sinh.

### I.2. Hỗ Trợ Đa Dạng Các Mô Hình Chuỗi Nhiệm Vụ (Mission Chain Topologies)
Hệ thống nhiệm vụ chiến lược hỗ trợ 6 hình thái cấu trúc:
1. **Linear (Tuyến Tính)**: Bước 1 $\rightarrow$ Bước 2 $\rightarrow$ Bước 3.
2. **Branching (Phân Nhánh)**: Quyết định tại Bước 1 mở ra Nhánh A hoặc Nhánh B với phần thưởng và hậu quả khác nhau.
3. **Threshold-Based (Theo Ngưỡng)**: Tự động kích hoạt khi một chỉ số đạt điều kiện (Ví dụ: Sector Threat vượt 800 $\rightarrow$ Nhiệm Vụ Khẩn Nguy).
4. **Reactive (Phản Ứng)**: Kích hoạt đáp trả một hành động của địch (Ví dụ: The Void tấn công Mining K-7 $\rightarrow$ Nhiệm Vụ Giải Cứu K-7).
5. **Periodic / Patrol (Tuần Hoàn)**: Nhiệm vụ tuần tra định kỳ lặp lại để giữ ổn định Stability.
6. **Standalone (Độc Lập)**: Các chiến dịch tình báo hoặc khảo sát dị thường một lần.
- **Giới Hạn Trần Toàn Cục (Global Active Chains Cap)**:
  - Giới hạn tối đa đồng thời: `MAX_ACTIVE_MISSION_CHAINS = 8`.
  - Ngăn ngừa tình trạng người chơi bị quá tải thông tin (cognitive overload) và tránh phình to dữ liệu lưu trữ.

### I.3. Phân Khu Kết Quả Kép Trong Operations Center (Dual Results Hub)
Operations Center phân tách minh bạch 2 luồng báo cáo:
- **Tab 1: Mission Results (Kết Quả Tác Chiến)**: Báo cáo kết quả các chiến dịch quân sự, đụng độ hạm đội, số liệu tổn thất địch/ta, và trang bị thu hồi.
- **Tab 2: Event Results (Kết Quả Sự Kiện Chiến Lược)**: Báo cáo kết quả xử lý khủng hoảng, ngoại giao, di cư và viện trợ nhân đạo.
- **Tính Năng Bổ Trợ**:
  * Huy hiệu đếm số thông báo chưa đọc (`Unread Count Badge`).
  * Nút "Đánh dấu tất cả là đã đọc".
  * Bộ lọc theo mức độ nghiêm trọng: *Khẩn cấp (Critical)*, *Cảnh báo (Warning)*, *Thông tin (Info)*.
  * **Cơ Chế Xóa Lịch Sử An Toàn (Safe Pruning)**: Cho phép người chơi xóa các báo cáo kết quả cũ đã đọc. Thao tác dọn dẹp này chỉ xóa bản ghi log lưu trữ hiển thị, tuyệt đối không làm biến đổi bất kỳ giá trị nào trong World State hiện tại.

---

## 2. Ma Trận Đối Chiếu Trạng Thái Kỹ Thuật (Technical Reality Matrix)

| Thành phần WORLD | Phân loại trạng thái | Ghi chú kỹ thuật đối chiếu |
|---|---|---|
| Đấu trường chiến đấu (`CombatArena`) | **[ĐÃ TỒN TẠI TRONG CODE]** | Đang chạy tại `components/game/combat-arena.tsx` (102 tests pass). |
| Dữ liệu phi công & trang bị v4 | **[ĐÃ TỒN TẠI TRONG CODE]** | Đang chạy tại `lib/game/storage.ts` và `types.ts`. |
| Top-level Tab WORLD trên Shell | **[ĐÃ XÁC NHẬN THIẾT KẾ]** | Cần thêm vào mảng `SECTIONS` trong `starfront-shell.tsx`. |
| Khế ước Adapter & Transaction Receipt | **[ĐÃ XÁC NHẬN THIẾT KẾ]** | Cần tạo module `lib/game/world/combat-adapter.ts`. |
| Lưu trữ độc lập & Backup luân phiên | **[ĐÃ XÁC NHẬN THIẾT KẾ]** | Cần tạo `lib/game/world/world-storage.ts` với khóa `STARFRONT_WORLD_SAVE_V1`. |
| Chu kỳ 6-phase Tick & Bounded Catch-up | **[ĐÃ XÁC NHẬN THIẾT KẾ]** | Cần tạo `lib/game/world/tick-engine.ts`. |
| Đồ thị Sector & Vòng đời 5 giai đoạn | **[ĐÃ XÁC NHẬN THIẾT KẾ]** | Cần tạo `lib/game/world/sector-graph.ts`. |
| Lương thực & 4 Nhóm tài nguyên | **[ĐÃ XÁC NHẬN THIẾT KẾ]** | Cần tạo `lib/game/world/economy-engine.ts`. |
| Sổ cái quân sự bảo toàn quân số | **[ĐÃ XÁC NHẬN THIẾT KẾ]** | Cần tạo `lib/game/world/forces-ledger.ts`. |
| Mô hình sự kiện INIT $\rightarrow$ PROC $\rightarrow$ RESULT | **[ĐÃ XÁC NHẬN THIẾT KẾ]** | Cần tạo `lib/game/world/event-engine.ts`. |
| Fullscreen Map Canvas/SVG Viewport | **[ĐỀ XUẤT CẦN XÁC MINH]** | Cần đo lường hiệu năng render SVG vs HTML5 Canvas khi có nhiều hạt hiệu ứng. |
| Ngưỡng suy thoái Stability theo ngày | **[ĐỀ XUẤT CẦN XÁC MINH]** | Cần cân bằng thông qua playtest nội bộ để tránh vòng xoáy sụp đổ quá nhanh. |
| Số lượng sector mở rộng tương lai | **[CHƯA XÁC ĐỊNH / TBD]** | Bắt đầu với 6–10 sector; mở rộng sang Sector 11+ tùy thuộc vào cốt truyện mở rộng. |
| Thông số phe thứ 3 (BCU/ANI/Pirates) | **[CHƯA XÁC ĐỊNH / TBD]** | Dành riêng cho các bản mở rộng sau; schema hiện tại đã để ngỏ khả năng tiếp nhận. |

---

*Tài liệu này là căn cứ tối cao duy nhất cho mọi công việc phát triển mã nguồn thuộc phân hệ STARFRONT WORLD trong các phase tiếp theo.*
