# STARFRONT WORLD — FND-7 HANDOVER & ARCHITECTURAL DISCOVERY REPORT
## BÁO CÁO KHẢO SÁT KIẾN TRÚC & BÀN GIAO TIẾN ĐỘ NỀN TẢNG HẠM ĐỘI (FND-7)

> **Mã báo cáo:** FND-7-HANDOVER  
> **Ngày lập:** 20/10/2026  
> **Chế độ thực thi:** PLAN ONLY — KHÔNG TRIỂN KHAI GAMEPLAY ENGINE TẠI LƯỢT NÀY  
> **Trạng thái phê duyệt:** ĐÃ THIẾT KẾ & ĐẶC TẢ HOÀN TOÀN 15/15 HẠNG MỤC  
> **Người tiếp nhận:** Kỹ sư / AI Studio đảm nhiệm lượt tiếp theo (Phase 7.1 Implementation)  

---

### 1. TỔNG QUAN KHẢO SÁT HIỆN TRẠNG MÃ NGUỒN (CODEBASE AUDIT)

Dự án **STARFRONT WORLD** vừa hoàn thành và nghiệm thu thành công giai đoạn **FND-6 (Base, Hub, Capital & Orbital Sub-Base Foundation)** với 19/19 test suites PASS, 142/142 FND tests PASS và hoàn toàn sạch lỗi biên dịch TypeScript.

Nhiệm vụ của lượt làm việc này là thực hiện khảo sát kỹ thuật, xác định hạ tầng tái sử dụng, lập tài liệu đặc tả kiến trúc (Feature Specification), từ điển dữ liệu (Data Dictionary), và kế hoạch triển khai phân kỳ (Multi-Phase Roadmap) cho **FND-7: Ship & Fleet Foundation** — hạng mục đã được Nhà Thiết Kế phê duyệt 15/15 mục.

Tất cả các tài liệu đã được soạn thảo chi tiết, đầy đủ bằng tiếng Việt, giữ nguyên mã định danh code bằng tiếng Anh, và lưu trữ tại các đường dẫn chuẩn tắc trong repository:
- `docs/foundations/FND7_SHIP_FLEET_FEATURE.md`: Đặc tả chi tiết 15/15 mục FND-7 và chính sách tài chính FRAME.
- `docs/foundations/FND7_DATA_DICTIONARY_AND_CATALOGS.md`: Từ điển dữ liệu Type -> Class -> Definition -> Instance và lược đồ 7 Canonical Catalogs.
- `docs/foundations/FND7_MULTI_PHASE_ROADMAP.md`: Lộ trình 7 giai đoạn triển khai tuần tự độc lập kèm tiêu chí nghiệm thu.
- `docs/progress/FND7_HANDOVER_REPORT.md`: Báo cáo bàn giao hiện tại.

---

### 2. BẢNG PHÂN LOẠI CHI TIẾT CÁC THÀNH PHẦN PHỤ THUỘC (DEPENDENCY MATRIX)

| Thành Phần Hệ Thống / Module | Trạng Thái Hiện Tại | Đánh Giá Phân Loại | Khả Năng Tái Sử Dụng & Ghi Chú Kiến Trúc Cho FND-7 |
| :--- | :---: | :---: | :--- |
| **FND-1: Catalog Registry & Master Data** | Hoàn thành | `EXISTS_AND_REUSABLE` | Có sẵn loader, storage provider, file naming validator. Sẵn sàng nạp 7 JSON catalogs của domain `fleet`. |
| **FND-2: Progression MK I–X & Capstone** | Hoàn thành | `EXISTS_AND_REUSABLE` | Hỗ trợ `ProgressionEntity`, `TierDefinition`, các mốc cấp độ và `MAX TIER BONUS`. Áp dụng trực tiếp cho Ship và Fleet. |
| **FND-3: Decision & Event Concurrency** | Hoàn thành | `EXISTS_AND_REUSABLE` | Quản lý vòng đời Event 3 pha, Concurrency Guard. Dùng cho Lệnh Khẩn Cấp Quốc Gia (Emergency Command) và đề xuất của Hạm đội. |
| **FND-4: Population & Workforce Pool** | Hoàn thành | `EXISTS_AND_REUSABLE` | Đã định nghĩa sẵn `WorkforceCategory = "FLEET_CREW"`, `FleetCrewPool`, và `WorkforceDemand` cho tuyển dụng hạm đội. |
| **FND-5: Buildings, Slots & Production** | Hoàn thành | `EXISTS_AND_REUSABLE` | Đã có các công trình `DOCKYARD_COMPLEX`, `SPACEPORT`, `NAVAL_ACADEMY` và module chuẩn để lắp ráp lên chiến hạm. |
| **FND-6: Base Entity & Fleet Capacities** | Hoàn thành | `EXISTS_AND_REUSABLE` | Đã tách bạch `FleetCapacities` (Command Cap, Stationing Cap, Docking Ports: Base + Expansion + Sub-Base). |
| **Logistics & Hyperlane Graph** | Hoàn thành | `EXISTS_AND_REUSABLE` | Đã có thuật toán tìm đường ngắn nhất, tính số ngày hành quân, điều động quân số bảo toàn. Tái sử dụng cho lộ trình Hạm đội. |
| **WORLD Combat V2 Engine** | Hoàn thành | `EXISTS_NEEDS_ADAPTER` | Engine hỗ trợ `CombatSupportEntity` (carrier, fleet support) nhưng cần Adapter chuyển đổi từ `FleetEntityState` sang thực thể giao tranh. |
| **Pilot Survival & SAR Registry** | Hoàn thành | `EXISTS_AND_REUSABLE` | Sổ bộ sinh tồn phi công, tù binh POW, và nhiệm vụ cứu hộ SAR. Hạm đội SAR sẽ trực tiếp tương tác với sổ bộ này. |
| **Character V1 & Pilot Skills** | Hoàn thành | `EXISTS_AND_REUSABLE` | Danh bạ phi công tinh anh (Marcus, Nyx, v.v.). Sẽ được bổ nhiệm làm Thuyền trưởng / Thuyền phó của Hạm đội. |
| **WorldState Persistence & Save System** | Hoàn thành | `EXISTS_AND_REUSABLE` | Ring Buffer 3 slot Auto-Save có Checksum CRC32. Chỉ cần mở rộng schema để lưu trường `fleets`. |
| **Fleet Entity & Treasury Engine** | Chưa có | `MISSING` | Cần triển khai trong Phase 7.2 và Phase 7.4. |
| **FRAME 3 Balances & Annual Decay** | Chưa có | `MISSING` | Cần triển khai trong Phase 7.5. |
| **National Fleet Registry Facade** | Chưa có | `MISSING` | Cần triển khai trong Phase 7.6. |
| **Fleet UI / Command Dashboard** | Chưa có | `MISSING` | Cần triển khai trong Phase 7.7. |

---

### 3. PHÂN TÍCH KHOẢNG TRỐNG KỸ THUẬT (GAP ANALYSIS)

1. **GAP 1: Tách rời quyền sở hữu tài sản 3 bên (Tri-Party Sovereign Entity Separation)**:
   - *Hiện trạng*: Trong các bản phác thảo ban đầu, một số cơ chế hậu cần ngầm coi hạm đội là "tài sản của Căn cứ sở tại".
   - *Giải pháp thiết kế FND-7*: Đã xác lập bất biến độc lập hoàn toàn giữa `Nation`, `Base` và `Fleet`. Fleet sở hữu Ngân khố riêng, Tàu chiến riêng, và Kho hàng riêng; Base không được tự ý can thiệp.

2. **GAP 2: Nhân sự Thủy thủ đoàn vs Phi công Tinh anh (Dual-Track Crew Distinction)**:
   - *Hiện trạng*: Mã nguồn cũ chỉ có khái niệm phi công cá nhân (Pilot) hoặc lực lượng quân sự đồn trú chung chung (`garrisonPower`).
   - *Giải pháp thiết kế FND-7*: Phân tách dứt khoát 2 nhóm nhân sự: Phi công tinh anh (có bio, stats, bảo hiểm sinh tồn) và Thủy thủ đoàn số lượng lớn (`FLEET_CREW` quản lý qua `FleetCrewPool` của FND-4).

3. **GAP 3: Bất biến Không Dịch Chuyển Tức Thời (No Teleportation Invariant)**:
   - *Hiện trạng*: Điều chuyển quân sự trong các phiên bản cũ có lúc được gán trực tiếp giữa các sector mà không có hành trình trung gian.
   - *Giải pháp thiết kế FND-7*: Tất cả mọi sự di chuyển của Hạm đội và chuyển quân đều phải thông qua mạng lưới Hyperlane thực tế bằng các chuyến bay có thời gian di chuyển (`inTransitTransfers`).

4. **GAP 4: Quy tắc kiểm toán 3 số dư FRAME & Chống âm điểm**:
   - *Hiện trạng*: Chưa có hệ thống ghi nhận điểm cống hiến phân tách giữa điểm chu kỳ ngắn hạn, điểm khả dụng chi tiêu, và điểm tích lũy danh dự dài hạn.
   - *Giải pháp thiết kế FND-7*: Đã đặc tả chi tiết 3 số dư (`cycleFrame`, `availableFrame`, `totalFrame`), công thức suy giảm thường niên 360 ngày ($BaseDecay = NationalAverageCycle / 2$), trần khấu trừ 50%, và quy tắc sàn không âm (Floor = 0).

---

### 4. CÁC QUYẾT ĐỊNH KIẾN TRÚC QUAN TRỌNG (KEY ARCHITECTURAL DECISIONS)

- **ADR-01: Mô hình Dữ liệu 4 Tầng (Type -> Class -> Definition -> Instance)**:
  - Bảo đảm tính kinh tế bộ nhớ tuyệt đối. Hàng ngàn tàu chiến cùng loại chia sẻ chung một định nghĩa tĩnh từ Master Catalog, chỉ lưu trữ trạng thái biến thiên tại Instance.
- **ADR-02: Kế Thừa 100% Nền Tảng Sẵn Có (Zero Re-inventing the Wheel)**:
  - Tái sử dụng triệt để: FND-1 cho Master Data, FND-2 cho Progression MK I–X, FND-3 cho Emergency Decision, FND-4 cho Workforce/Crew, FND-5 cho Modules, FND-6 cho Docking Ports.
- **ADR-03: Zero-Micromanagement Invariant**:
  - Hạm đội được vận hành tự động bởi AI Persona: Tự tuần tra, tự bảo dưỡng, tự tiếp tế, tự rút lui khi nguy cấp. Người chơi chỉ ra quyết định chiến lược vĩ mô.
- **ADR-04: Idempotent Yearly Decay Ledger**:
  - Cơ chế trừ điểm thường niên ghi nhận dấu vết giao dịch kiểm toán không thể xóa bỏ, tuyệt đối không bị trừ trùng lặp hai lần trong cùng một chu kỳ 360 ngày.

---

### 5. HƯỚNG DẪN THỰC THI CHO PHIÊN LÀM VIỆC TIẾP THEO (NEXT SESSION ACTIONS)

Kỹ sư hoặc tài khoản AI Studio đảm nhiệm lượt tiếp theo sẽ bắt đầu trực tiếp từ **Phase 7.1** theo lộ trình trong `docs/foundations/FND7_MULTI_PHASE_ROADMAP.md`:

1. **Bước 1 (Khởi tạo 7 JSON Catalogs)**:
   - Tạo 7 tệp JSON tại `/data/catalogs/` theo đúng mẫu đã định nghĩa trong `docs/foundations/FND7_DATA_DICTIONARY_AND_CATALOGS.md`.
2. **Bước 2 (Đăng ký vào Registry)**:
   - Cập nhật hàm `bootstrapWorldCatalogs()` trong `lib/game/world/catalog/registry.ts` để nạp 7 danh mục mới này song song với 20 danh mục hiện có.
3. **Bước 3 (Kiểm thử Phase 7.1)**:
   - Viết bài kiểm thử `tests/world/phase-7-1-fleet-catalogs.test.ts` để kiểm tra nạp thành công, cấu trúc khóa chính/khóa ngoại, và độ toàn vẹn tham chiếu.
   - Chạy `tsc --noEmit` và `compile_applet` xác nhận không có bất kỳ lỗi nào.
4. **Bước 4**: Tiếp tục chuyển sang Phase 7.2 (Ship Entities & Progression) theo thứ tự quy định.

---
*(Báo cáo bàn giao kết thúc — Mã nguồn và tài liệu ở trạng thái hoàn hảo sẵn sàng triển khai)*
