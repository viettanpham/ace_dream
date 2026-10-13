# STARFRONT WORLD — Tài Liệu Đánh Giá & Thiết Kế Kiến Trúc Combat V2
## (Combat V2 Architectural Review & Design Specification)

> **Trạng thái tài liệu**: **REVIEW & THIẾT KẾ (DRAFT / CHƯA TRIỂN KHAI)**  
> **Phạm vi**: Đánh giá kiến trúc, xác lập các bài toán kỹ thuật, đề xuất mô hình tích hợp và liệt kê các quyết định mở trước khi viết mã. Tuyệt đối chưa can thiệp vào engine chiến đấu hoặc mã nguồn gameplay hiện hành.

---

## 1. Bối Cảnh & Phân Tích Hiện Trạng (Current Architecture State)

### 1.1. Phân hệ Combat V1 hiện hành
- **Kiến trúc cốt lõi**: Mô hình đấu tay đôi 1v1 kinh điển (`player: CombatUnit` đối đầu với `enemy: CombatUnit`) được định nghĩa trong `lib/game/types.ts` và vận hành bởi `combat-arena.tsx`.
- **Cơ chế lượt**: Dựa trên sáng kiến tốc độ (Speed Initiative), hàng đợi lượt động (`turnQueue`), hệ thống hiệu ứng trạng thái mở rộng (DoT, Stun, ECM Jamming, Armor Break...), kỹ năng Pilot Synergy và boss đa pha có cảnh báo trước (Telegraphed Attacks).
- **Giới hạn cấu trúc**: 
  - Trạng thái `CombatState` bị bó hẹp trong 2 thực thể duy nhất. Không có khái niệm đội hình, nhiều đơn vị cùng tham chiến, hay quân số phụ trợ.
  - Mọi công thức sát thương, phòng thủ và kết quả trận đấu đều tính toán trên HP đơn lẻ của một chiếc GEAR, chưa phản ánh được mức độ hao tổn quân lực vĩ mô của một chiến dịch.

### 1.2. Phân hệ Chiến Lược STARFRONT WORLD hiện hành
- **Cơ chế quân sự vĩ mô**: Quản lý quân số hàng ngàn qua Authoritative Military Ledger (`lib/game/world/forces-ledger.ts`) với 5 trạng thái bảo toàn quân số: `deployed`, `reserves`, `woundedOrRepair`, `retreating`, `casualties`.
- **Tự động giải quyết (Auto-Resolve)**: Dựa trên Định luật Lanchester cải tiến (`lib/game/world/auto-resolve.ts`) để tính toán giao tranh giữa đồn trú và các đợt càn quét của The Void.
- **Tầng cầu nối tích hợp (Combat Adapter - Phase 6.6)**:
  - Đã chuẩn bị sẵn trường `combatVersion: "v1" | "v2"` trong `lib/game/world/combat-adapter.ts`.
  - Cung cấp cơ chế đóng băng quân đồn trú (`lockEncounterAndCreateSnapshot`), khóa Encounter Snapshot bất biến, cấp mã giao dịch `transactionId` lũy đẳng, và luồng hủy an toàn (`safeAbort`).
- **Khoảng cách cần thu hẹp**: Khi chuyển từ bản đồ chiến lược WORLD vào trận chiến thực tế, người chơi hiện chỉ điều khiển 1 GEAR đánh với 1 boss đại diện; kết quả chỉ số % HP còn lại được quy đổi ước lượng về thương vong đồn trú. Cần một cơ chế Combat V2 có chiều sâu tương xứng với quy mô chiến trường.

---

## 2. Các Bài Toán Thiết Kế Trọng Tâm Cần Bàn Thảo (Core Design Topics)

### 2.1. Quy mô chiến đấu (Combat Scale)
Cần phân định rạch ròi 4 cấp độ quy mô:
1. **Cấp Đơn Vị (Unit Level)**: Từng cỗ máy GEAR cụ thể (Vanguard, Falcon, Aegis, Specter...) do người chơi hoặc NPC phi công điều khiển, có HP, SP, trang bị và kỹ năng riêng.
2. **Cấp Tiểu Đội (Squad Level)**: Một nhóm chiến thuật gồm 3–4 GEAR phối hợp tác chiến (ví dụ: 1 Tiên phong, 1 Đột kích, 1 Phòng thủ, 1 Hỗ trợ).
3. **Cấp Hạm Đội / Cụm Tác Chiến (Fleet / Strike Group)**: Lực lượng tàu mẹ, tuần dương hạm hoặc pháo hạm yểm trợ tầm xa, không trực tiếp đứng trên sàn đấu theo lượt nhưng cung cấp hỏa lực chi viện theo chu kỳ hiệp đấu.
4. **Cấp Lực Lượng Chiến Lược (Strategic Garrison / Army)**: Toàn bộ quân số đồn trú của sector (hàng trăm đến hàng nghìn binh sĩ/drone), là nguồn bù đắp tiêu hao và quyết định quyền kiểm soát lãnh thổ sau trận đánh.

### 2.2. Quan hệ giữa Quân Số, Lực Chiến (Combat Power), HP và Chỉ Số
- **Bài toán**: Làm thế nào để gắn kết giữa HP của từng GEAR và tổng quân số/lực chiến của đạo quân?
- **Hướng đề xuất để thảo luận**:
  - Mỗi GEAR trong trận có thể đại diện cho chính phi công chủ lực hoặc là chỉ huy của một phi đội nhỏ (squadron / detachment).
  - Lực chiến tổng hợp (Power Rating) được cấu thành từ: $(Chỉ\ số\ trang\ bị + Cấp\ phi\ công) \times Hệ\ số\ quân\ số\ đồn\ trú\ đi\ kèm$.
  - Tránh gộp cơ học theo kiểu lấy 1 GEAR = 1.000 lính; cần tách biệt rõ giữa:
    - **Thanh sinh lực cá nhân (GEAR Hull/Shield HP)**: Xác định sự sống còn của đơn vị trên chiến trường.
    - **Chỉ số quân lực phụ trợ (Support Troops Pool)**: Cung cấp năng lực hỏa lực nền và giảm dần theo từng hiệp đấu dựa trên mức độ ác liệt.

### 2.3. Động lực học khi một GEAR bị loại khỏi trận (Unit Elimination Dynamics)
Khi một GEAR cạn kiệt HP và bị phá hủy/vô hiệu hóa:
- **Cập nhật phe phái tức thời**:
  - Tổng hỏa lực (ATK) của phe bị sụt giảm tương ứng với chỉ số của GEAR đó.
  - Mất đi các hào quang nội tại (Passive Auras) và kỹ năng hỗ trợ mà GEAR đó mang lại.
  - Tái phân bổ mục tiêu: Đối phương dồn hỏa lực vào các mục tiêu còn lại (Focus Fire Penalty).
- **Tác động lên quân số chiến lược**:
  - Ghi nhận tổn thất nhân sự ngay lập tức vào sổ cái chiến dịch.
  - Kiểm tra điều kiện gãy đổ tinh thần (Morale Break Threshold): Nếu chỉ huy hoặc quá 50% tiểu đội bị loại, các đơn vị còn lại có thể chịu debuff hoảng loạn hoặc kích hoạt tùy chọn rút lui chiến thuật.

### 2.4. Quản lý Thương Vong, Rút Lui & Tiếp Viện (Casualty & Force Management)
Phân loại chính xác 5 trạng thái nhân lực sau từng đợt giao tranh:
1. **Tử trận vĩnh viễn (Casualties)**: Quân số mất đi hoàn toàn, giảm trừ trực tiếp khỏi tổng dân số/quân lực quốc gia.
2. **Thương binh / Hư hại cần sửa chữa (Wounded / Under Repair)**: GEAR bị hỏng nặng hoặc phi công chấn thương; cần tài nguyên (Vật liệu, Lương thực) và thời gian (số tick/ngày) để phục hồi.
3. **Rút lui chiến thuật (Tactical Retreat)**: Đơn vị chủ động rút lui an toàn trước khi bị tiêu diệt hoàn toàn, giữ lại được 70–80% trang bị và quân số còn sống.
4. **Đào tẩu / Thất lạc (MIA / Desertion)**: Xảy ra khi tinh thần hoặc mức ổn định (Stability) của sector quá thấp trong lúc vây hãm.
5. **Tiếp viện (Reinforcements)**: Các đợt quân đồn trú hoặc hạm đội đang hành quân đến đích có thể gia nhập chiến trường từ Hiệp $N$ nếu trận đấu kéo dài.

### 2.5. Hệ thống Bổ Trợ Chiến Trường (Battlefield Modifiers & Call-ins)
- **Địa hình & Dị thường sector**:
  - Vùng bão điện từ (EMP Field): Giảm tốc độ sạc SP và độ chính xác của vũ khí tầm xa.
  - Vành đai tiểu hành tinh: Tăng chỉ số né tránh tự nhiên nhưng giảm hiệu quả di chuyển của cơ giáp hạng nặng.
- **Công sự phòng thủ căn cứ (Base Fortifications)**:
  - Cấp độ công sự sector (1–5) cung cấp khiên chắn thụ động (Fortification Barrier) hấp thụ một lượng sát thương nhất định cho toàn đội hình phòng thủ ở đầu trận.
- **Pháo hạm chi viện (Orbital / Capital Broadside)**:
  - Người chơi hoặc AI có thể tích lũy điểm Chỉ Huy (Command Points - CP) để gọi đòn bắn pháo hạm quét diện rộng sau mỗi $X$ hiệp.

### 2.6. Mô Phỏng Tự Động khi Vắng Mặt (Simulation & NPC Proxy Execution)
- Khi người chơi bận tham gia nhiệm vụ khác hoặc ủy quyền cho NPC cấp phó:
  - Trận chiến được mô phỏng tự động theo thuật toán phân giải từng vòng (Round-by-Round Fast Simulation) thay vì chỉ tung xúc xắc một lần.
  - Mô phỏng tính đến đầy đủ thuộc tính khắc chế, cấp độ trang bị và AI Archetype của cả 2 bên.
  - Xuất ra đầy đủ `CombatResultReceipt` chuẩn mực để commit vào Transaction Journal của WORLD.

### 2.7. Khế Ước Tích Hợp với WORLD (Integration Contract)
- **Save Isolation**: Kết quả chiến đấu không ghi đè trực tiếp lên file save ngoài; mọi biến động phải đi qua `lib/game/world/combat-adapter.ts` và được bảo vệ bởi Checksum CRC32.
- **Encounter Snapshot**: Giữ nguyên cơ chế đóng băng đồn trú hiện có, bảo đảm không xảy ra race condition khi đồng thời có tick thời gian chạy ngầm.
- **Safe Abort**: Người chơi thoát trận giữa chừng được ghi nhận trạng thái rút lui hoặc treo (`isSuspendedCombat = true`) cho phép quay lại giải quyết mà không bị phạt oan hoặc làm hỏng dữ liệu.

### 2.8. Kế Thừa Hợp Lý từ Combat V1
- **Những phần cần tái sử dụng**:
  - Bảng hiệu ứng trạng thái `StatusEffect` và cơ chế stack (Refresh, Intensity, Override).
  - Thuật toán sáng kiến tốc độ và hàng đợi lượt động (`DynamicTurnQueue`).
  - Hệ thống Pilot Synergy Skills (kỹ năng đặc trưng theo cặp phi công).
  - Trực quan hóa hiệu suất sau trận đấu (D3 Radar Spider Chart, D3 Radial Gauge, Turn Damage Timeline) từ Phase 5.12.
- **Những phần phải nâng cấp**:
  - Chuyển cấu trúc `player vs enemy` thành mảng `alliedUnits: CombatUnit[]` vs `enemyUnits: CombatUnit[]`.
  - Bổ sung cơ chế chọn mục tiêu (Target Selection) và kỹ năng đa mục tiêu (AoE / Cleave / Team Buff).

---

## 3. Các Quyết Định Mở Cần Thảo Luận Trước Khi Triển Khai (Open Decisions)

| STT | Vấn đề cần thống nhất | Phương án A | Phương án B | Ghi chú & Đánh giá |
|---|---|---|---|---|
| 1 | **Quy mô đội hình trực tiếp** | 3v3 (Tiểu đội 3 GEAR) | 4v4 (Đầy đủ 4 phân lớp A/B/I/M) | Cần cân nhắc diện tích hiển thị trên giao diện di động và tốc độ mỗi hiệp đấu. |
| 2 | **Cơ chế ra lệnh theo lượt** | Turn-based cá nhân (từng unit đi theo SPD) | Lượt theo đội (Team Phases: Toàn phe ta rồi đến phe địch) | Turn-based cá nhân giữ được bản sắc V1 nhưng phức tạp hơn khi có 6–8 đơn vị trên sân. |
| 3 | **Mối liên hệ Quân số - Sát thương** | Quân số tăng % sát thương trực tiếp | Quân số đóng vai trò khiên chắn phụ hấp thụ hao tổn | Cần thử nghiệm cân bằng số học để tránh hiện tượng snowball quá nhanh. |
| 4 | **Vai trò của phi công NPC** | NPC có bộ chỉ số và AI độc lập như phi công thật | NPC chỉ là chỉ số phụ làm tròn lực chiến | Phương án A tăng tính chân thực nhưng đòi hỏi tạo pool dữ liệu phi công NPC. |
| 5 | **Không gian hiển thị (UI Layout)** | Chia đôi màn hình dạng Isometric / 2.5D | Dạng Tactical Split Deck (2 hàng thẻ bài đối mặt) | Giao diện dạng Tactical Cards quen thuộc hơn với phong cách Sci-Fi Command của WORLD. |

> **Nguyên tắc cốt lõi**: Không tự ý ấn định công thức cứng nhắc, không tự suy diễn mô hình "1 người chơi + 29 NPC", và không viết mã thực thi cho đến khi tài liệu thiết kế này được thảo luận và phê duyệt chính thức.
