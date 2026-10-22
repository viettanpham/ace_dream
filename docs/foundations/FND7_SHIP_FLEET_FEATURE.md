# STARFRONT WORLD — FND-7 FEATURE SPECIFICATION & ARCHITECTURE
## HỆ THỐNG NỀN TẢNG TÀU CHIẾN & HẠM ĐỘI (SHIP / FLEET FOUNDATION)

> **Mã thiết kế:** FND-7  
> **Trạng thái:** APPROVED & SPECIFIED (15/15 Hạng mục phê duyệt bởi Designer)  
> **Chế độ thực thi:** PLAN ONLY — SPECIFICATION & ARCHITECTURAL CONTRACTS  
> **Ngôn ngữ đặc tả:** Tiếng Việt (Vietnamese) | Mã định danh code: Tiếng Anh (English)  
> **Đơn vị phụ thuộc:** Tương thích và tích hợp kế thừa trực tiếp từ FND-1, FND-2, FND-3, FND-4, FND-5, FND-6, COMBAT V2, PILOT SURVIVAL  

---

### MỤC LỤC TỔNG QUAN

1. [Khảo sát Hiện trạng & Bối cảnh Tích hợp Kiến trúc](#1-khảo-sát-hiện-trạng--bối-cảnh-tích-hợp-kiến-trúc)
2. [Hệ Thống 15 Hạng Mục Chi Tiết Của FND-7 (7.1 – 7.15)](#2-hệ-thống-15-hạng-mục-chi-tiết-của-fnd-7)
   - [7.1 Kiến trúc Thực thể Hạm đội (Fleet Entity Architecture)](#71-kiến-trúc-thực-thể-hạm-đội-fleet-entity-architecture)
   - [7.2 Phân loại & Phân cấp Hạm đội (Fleet Types & Classes)](#72-phân-loại--phân-cấp-hạm-đội-fleet-types--classes)
   - [7.3 Kiến trúc Thực thể Tàu chiến (Ship Entity Architecture)](#73-kiến-trúc-thực-thể-tàu-chiến-ship-entity-architecture)
   - [7.4 Tiến trình Nâng cấp Tàu chiến & Chu kỳ Thế giới (Ship Progression, Tier MK I–X & Cycles)](#74-tiến-trình-nâng-cấp-tàu-chiến--chu-kỳ-thế-giới-ship-progression-tier-mk-ix--cycles)
   - [7.5 Phân loại Nhân sự Lai & Phi công Tinh anh (Hybrid Personnel & Pilot)](#75-phân-loại-nhân-sự-lai--phi-công-tinh-anh-hybrid-personnel--pilot)
   - [7.6 Lực lượng Lao động, Học viện & Trung tâm Việc làm Quốc gia (Workforce, Academy & National Employment Center)](#76-lực-lượng-lao-động-học-viện--trung-tâm-việc-làm-quốc-gia)
   - [7.7 Lưu chuyển Nhân sự & Biệt phái Tạm thời (Personnel Mobility & Temporary Assignments)](#77-lưu-chuyển-nhân-sự--biệt-phái-tạm-thời)
   - [7.8 Trí tuệ Chỉ huy Hạm đội & Thẩm quyền Chỉ đạo (Fleet Command AI & Command Authority)](#78-trí-tuệ-chỉ-huy-hạm-đội--thẩm-quyền-chỉ-đạo)
   - [7.9 Phát triển Hạm đội Tự chủ (Autonomous Fleet Development)](#79-phát-triển-hạm-đội-tự-chủ-autonomous-fleet-development)
   - [7.10 Ngân khố Hạm đội & Độc lập Tài chính (Fleet Treasury & Financial Independence)](#710-ngân-khố-hạm-đội--độc-lập-tài-chính-fleet-treasury--financial-independence)
   - [7.11 Hậu cần Hạm đội, Khoang hàng & Tiếp tế (Fleet Logistics, Inventory & Supply)](#711-hậu-cần-hạm-đội-khoang-hàng--tiếp-tế-fleet-logistics-inventory--supply)
   - [7.12 Sổ vàng Thành tích Hạm đội (Fleet Service Record)](#712-sổ-vàng-thành-tích-hạm-đội-fleet-service-record)
   - [7.13 Vòng đời Hạm đội, FRAME & Trợ cấp Quốc gia (Fleet Lifecycle, FRAME & National Support)](#713-vòng-đời-hạm-đội-frame--trợ-cấp-quốc-gia)
   - [7.14 Phi công NPC Lập nghiệp & Gói Bảo hộ Tân binh (NPC Pilot Founders & NEW_GUILD_PROTECTION)](#714-phi-công-npc-lập-nghiệp--gói-bảo-hộ-tân-binh)
   - [7.15 Sổ bộ Hạm đội Quốc gia, Tích hợp Thế giới & Hiệu năng (National Fleet Registry & Performance)](#715-sổ-bộ-hạm-đội-quốc-gia-tích-hợp-thế-giới--hiệu-năng)
3. [Chính Sách Tài Chính FRAME & Trợ Cấp Toàn Diện](#3-chính-sách-tài-chính-frame--trợ-cấp-toàn-diện)
4. [Các Bất Biến Cốt Lõi Hệ Thống (System Invariants)](#4-các-bất-biến-cốt-lõi-hệ-thống-system-invariants)

---

### 1. KHẢO SÁT HIỆN TRẠNG & BỐI CẢNH TÍCH HỢP KIẾN TRÚC

Qua khảo sát toàn bộ codebase STARFRONT WORLD tại thời điểm hiện tại:

1. **FND-1 (Catalog Registry / Master Data)**:
   - Đã có cơ chế loader, registry, schema inheritance `Type -> Class -> Definition -> Instance`.
   - File naming chuẩn hóa theo quy ước `system_<domain>_<catalog>_data.json` tại `/data/catalogs`.
   - *Đánh giá FND-7*: `EXISTS_AND_REUSABLE`. FND-7 sẽ bổ sung 7 danh mục mới thuộc domain `fleet`.

2. **FND-2 (Shared Progression & Tier MK I–X)**:
   - Module `lib/game/world/progression/` hỗ trợ đầy đủ `ProgressionEntity`, `TierDefinition`, các mốc level, `AWAITING_UPGRADE`, và `MAX TIER BONUS`.
   - Trong `lib/game/world/progression/types.ts` dòng 6 đã ghi nhận rõ: *"Applicable to SHIP, BUILDING, BASE, FLEET, PILOT"*.
   - *Đánh giá FND-7*: `EXISTS_AND_REUSABLE`. Hạm đội và tàu chiến sẽ trực tiếp kế thừa `ProgressionEntity`.

3. **FND-3 (Decision / Event Engine)**:
   - Module `lib/game/world/decision/` hỗ trợ `DecisionEngineState`, cơ chế xử lý Concurrency Guard, 3 pha Event Lifecycle, và quy tắc ưu tiên Source.
   - *Đánh giá FND-7*: `EXISTS_AND_REUSABLE`. Các quyết định khẩn cấp quốc gia (National Emergency Command) và đề xuất nâng cấp của hạm đội sẽ vận hành thông qua hệ thống Decision này.

4. **FND-4 (Population & Workforce)**:
   - Module `lib/game/world/population/` đã định nghĩa sẵn `WorkforceCategory = "FLEET_CREW"`, `FleetCrewPool`, và `WorkforceDemand` cho tuyển dụng hạm đội (`FLEET_RECRUITMENT`).
   - Bất biến được ghi rõ: *"Crew transferred to Fleet is owned and managed by Fleet/Guild"*.
   - *Đánh giá FND-7*: `EXISTS_AND_REUSABLE`. Sẽ sử dụng `FleetCrewPool` làm hạt nhân nhân sự vận hành.

5. **FND-5 (Buildings & Production)**:
   - Module `lib/game/world/building/` hỗ trợ công trình, slot profile, và xưởng sản xuất.
   - Các công trình chuyên trách như `BASE_COMMAND_CENTER`, `SPACEPORT`, `DOCKYARD_COMPLEX`, `NAVAL_ACADEMY` đã có trong định nghĩa FND-5/FND-6.
   - *Đánh giá FND-7*: `EXISTS_AND_REUSABLE`.

6. **FND-6 (Base, Hub, Capital & Orbital Sub-Base)**:
   - Đã phân tách rạch ròi `FleetCapacities` gồm: `fleetCommandCapacity`, `fleetStationingCapacity`, `fleetDockingCapacity`, `baseDockingPorts`, `expansionDockingPorts`, `subBaseDockingPorts`.
   - Báo cáo kinh tế cơ sở 7 ngày, quy trình sao lưu 3 slot độc lập, bảo toàn thực thể căn cứ.
   - *Đánh giá FND-7*: `EXISTS_AND_REUSABLE`. FND-7 sẽ cắm trực tiếp vào các cổng docking và chỉ số năng lực này mà không làm phá vỡ bất biến của Base.

7. **WORLD Combat V2 & Pilot Survival**:
   - `lib/game/world/combat-v2-types.ts` đã hỗ trợ `CombatSupportEntity` kiểu `"carrier"`, `"fleet_support"` và phi cơ Pilot.
   - `lib/game/world/pilot-survival-types.ts` hỗ trợ hồ sơ sinh tồn, bắt giữ tù binh, và cứu hộ SAR.
   - *Đánh giá FND-7*: `EXISTS_NEEDS_ADAPTER`. Cần adapter để biến một `FleetEntityState` thành danh sách các đơn vị và thực thể hỗ trợ trên chiến trường Combat V2.

8. **Logistics & Di chuyển Hyperlane**:
   - `lib/game/world/logistics.ts` và `graph.ts` hỗ trợ tìm đường, tính khoảng cách ngày hành quân, điều động quân số bảo toàn.
   - *Đánh giá FND-7*: `EXISTS_AND_REUSABLE`. Hạm đội sẽ di chuyển thực thể theo các tuyến đường hyperlane dựa trên tốc độ chuẩn (Speed) của tàu chậm nhất trong hạm đội.

---

### 2. HỆ THỐNG 15 HẠNG MỤC CHI TIẾT CỦA FND-7

#### 7.1 Kiến trúc Thực thể Hạm đội (Fleet Entity Architecture)
- **Quyền sở hữu 3 bên độc lập (Tri-Party Sovereign Entity Separation)**:
  - `Nation` (Quốc gia), `Base` (Căn cứ), và `Fleet` (Hạm đội) là ba thực thể có chủ quyền tài sản và tư cách pháp nhân riêng biệt.
  - Hạm đội không phải là "tập con sở hữu" của Căn cứ nơi nó đang neo đậu.
  - Mỗi Hạm đội có ba thuộc tính không gian và pháp lý tách rời:
    1. `ownerRef`: Chủ sở hữu (Quốc gia, Bang hội/Công ty Quân sự Tư nhân, Phi công NPC Sáng lập, hoặc Người chơi).
    2. `registeredHomeBaseId`: Căn cứ đăng ký thường trú (HQ Đóng quân / Đăng ký hành chính).
    3. `currentLocation`: Vị trí hiện tại (Sector ID, Base ID, hoặc Tọa độ Tuyến hành quân Hyperlane nếu đang In-Transit).
- **Quyền sở hữu tài sản nội tại**:
  - Hạm đội có Ngân khố riêng (`treasury: FleetTreasuryState`), sở hữu danh sách Tàu chiến (`ships: Record<string, ShipInstance>`), phi đội cỗ máy GEAR (`gears: Record<string, GearInstance>`), và Kho hàng tiếp tế riêng (`cargo: WorldResourceLedger`).
  - **Bất biến bất khả xâm phạm**: Ban chỉ huy Căn cứ (`Base Command`) hoặc Chính quyền địa phương (`Local Government AI`) **TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý TỊCH THU**, trưng dụng tài sản, đạn dược, trang bị, hoặc cưỡng bức thuyên chuyển phi hành đoàn của Hạm đội nếu không có sự đồng thuận hoặc lệnh khẩn cấp hợp pháp.
- **Trạng thái Hoạt động của Hạm đội (`FleetOperationalStatus`)**:
  - `DOCKED`: Đang neo đậu tại cảng căn cứ, sử dụng Docking Port.
  - `STATIONED`: Đang đồn trú trong quỹ đạo/vùng bảo vệ của căn cứ.
  - `IN_TRANSIT`: Đang hành quân trên tuyến Hyperlane giữa các Sector.
  - `PATROL`: Đang tuần tra giám sát an ninh trong Sector.
  - `ENGAGED`: Đang tham gia giao tranh chiến thuật hoặc phong tỏa.
  - `MAINTENANCE`: Đang trong xưởng cạn để đại tu kỹ thuật.
  - `REORGANIZING`: Đang tái cơ cấu, sáp nhập, hoặc tiếp nhận bổ sung tàu.
  - `DISBANDED`: Đã giải thể, toàn bộ tài sản được thanh lý hoặc chuyển giao.

#### 7.2 Phân loại & Phân cấp Hạm đội (Fleet Types & Classes)
- **Phân loại Hạm đội theo Mục đích Tác chiến (`FleetType`)**:
  1. `MILITARY_EXPEDITIONARY`: Hạm đội viễn chinh tác chiến tầm xa, chuyên đột kích và giải phóng khu vực bị địch chiếm.
  2. `HOME_DEFENSE`: Hạm đội vệ binh quốc nội, chuyên bảo vệ Thủ phủ (Capital) và các khu vực trọng yếu nội địa.
  3. `BORDER_PATROL`: Hạm đội tuần tra biên cương, cơ động nhanh, chuyên ngăn chặn thâm nhập và càn quét cướp biển.
  4. `LOGISTICS_TRANSPORT`: Hạm đội hộ tống và vận tải chiến lược, chuyên chở khối lượng lớn tài nguyên và dân sự.
  5. `DEEP_RECON`: Hạm đội trinh sát viễn thám, trang bị thiết bị che giấu bức xạ và cảm biến tầm siêu xa.
  6. `SEARCH_AND_RESCUE`: Hạm đội cứu hộ sinh tồn chiến trường, tìm kiếm và trục vớt phi công gặp nạn (SAR).
  7. `STRIKE_CARRIER`: Hạm đội tàu sân bay tấn công, làm bệ phóng triển khai các phi đội GEAR trong chiến dịch lớn.
- **Phân cấp Quy mô Hạm đội (`FleetClass` / MK I – MK X)**:
  - Phân cấp quy mô từ `SQUAD` (Tiểu đội 2-4 tàu), `FLOTILLA` (Chi hạm đội 5-8 tàu), `TASK_FORCE` (Phân hạm đội đặc nhiệm 9-16 tàu), `BATTLE_GROUP` (Liên đội tác chiến 17-32 tàu), đến `ARMADA` (Đại hạm đội 33-64 tàu).
  - Tương thích 100% với FND-2 Progression MK I – MK X. Mỗi bậc Class quy định:
    * Giới hạn số lượng tàu tối đa (`maxShipCount`).
    * Điểm Command Cap tiêu tốn khi đồn trú tại Căn cứ (`commandCapRequirement`).
    * Yêu cầu cấp bậc tối thiểu của Sĩ quan Chỉ huy (`minimumCommanderRank`).

#### 7.3 Kiến trúc Thực thể Tàu chiến (Ship Entity Architecture)
- **Chuẩn tắc 4 tầng: `Type -> Class -> Definition -> Instance`**:
  - `ShipType`: Phân nhóm công năng (Chiến hạm, Tàu sân bay, Tàu hộ tống, Tàu hậu cần, v.v.).
  - `ShipClass`: Phân cấp tải trọng và độ phức tạp kỹ thuật (Corvette, Frigate, Destroyer, Cruiser, Battleship, Dreadnought, Carrier, Fleet Tender).
  - `ShipDefinition`: Định nghĩa bản thiết kế chuẩn trong Master Catalog (Chỉ số cơ bản: Armor, Shield, Hull, Speed, Slot Layout, Base Crew Required).
  - `ShipInstance`: Thực thể tàu cụ thể trong runtime thế giới, mang ID độc nhất, định danh riêng, tình trạng vật lý và tiến trình riêng.
- **Tối ưu hóa Bộ nhớ & Hiệu năng**:
  - Thực thể tàu chỉ lưu giữ các dữ liệu biến động (`instanceId`, `definitionId`, `customName`, `currentHp`, `currentShield`, `condition`, `assignedPilotId`, `assignedCrewCount`, `slotModules`, `mileage`, `serviceHistory`).
  - Toàn bộ chỉ số gốc được tra cứu bất biến từ `ShipDefinition` trong Master Catalog.
- **Hệ thống Slot & Module Trang bị**:
  - Mỗi lớp tàu có layout slot trang bị theo FND-5 Module Standards:
    * `WEAPON_PRIMARY` & `WEAPON_SECONDARY`: Vũ khí động năng, laser, phóng ngư lôi.
    * `DEFENSE_SHIELD` & `DEFENSE_ARMOR`: Bộ tạo lá chắn, giáp phức hợp hấp thụ nhiệt.
    * `PROPULSION_ENGINE`: Động cơ siêu không gian, bộ đẩy hành trình.
    * `HANGAR_BAY`: Khoang chứa máy bay chiến đấu / cỗ máy GEAR (đối với tàu sân bay).
    * `CARGO_HOLD`: Khoang mở rộng thể tích chuyên chở hàng hóa và tiếp tế.
    * `UTILITY_ELECTRONICS`: Bộ tác chiến điện tử, radar quét sâu, trạm y tế dã chiến.

#### 7.4 Tiến trình Nâng cấp Tàu chiến & Chu kỳ Thế giới (Ship Progression, Tier MK I–X & Cycles)
- **Tích hợp FND-2 Progression Engine**:
  - Mỗi Ship Instance tích hợp một `ProgressionEntity`. Tàu nhận EXP thông qua:
    * Dặm bay tuần tra an toàn (`mileageExp`).
    * Tham gia các trận chiến thắng lợi trong Combat V2 (`combatExp`).
    * Hoàn thành các nhiệm vụ hộ tống / giải cứu (`missionExp`).
- **Ranh giới Bậc cứng (Hard Tier Boundary - `AWAITING_UPGRADE`)**:
  - Khi tàu đạt cấp tối đa của Tier hiện tại (ví dụ: Level 10 của MK I), EXP bị khóa tạm thời.
  - Tàu cần tiến hành nâng cấp đột phá (`Tier Breakthrough Upgrade`) tại Căn cứ có Cơ sở Đóng tàu (`DOCKYARD_COMPLEX` hoặc `SHIPYARD_ANNEX`) đạt cấp độ tương ứng.
  - Quá trình nâng cấp tiêu tốn chi phí Industrial Materials, Energy, Credits và mất thời gian thực thi tính theo `GAME_DAYS`.
- **MAX TIER BONUS (MK X Capstone)**:
  - Khi một chiến hạm đạt mốc tối thượng MK X Level 50, tàu nhận vĩnh viễn danh hiệu Độc bản và một phần thưởng thuộc tính tối đa (ví dụ: +25% Hull Integrity, mở thêm 1 Cổng Hangar Tinh anh).
- **Hao mòn & Tình trạng Khí tài (Condition & Wear Cycles)**:
  - `condition` của tàu dao động từ `0.00` đến `100.00%`.
  - Mỗi 1000 dặm bay hoặc sau mỗi lượt giao tranh ác liệt, `condition` suy giảm dựa trên mức độ vận hành.
  - `condition < 75%`: Tốc độ di chuyển giảm 10%, tiêu hao nhiên liệu tăng 15%.
  - `condition < 50%`: Nguy cơ hỏng hóc hệ thống phụ trợ (Subsystems Malfunction).
  - `condition < 25%`: Khóa khả năng nhảy Hyperlane; bắt buộc phải cập cảng sửa chữa khẩn cấp.
  - Sửa chữa và đại tu đòi hỏi Docking Port và vật tư hậu cần `logisticsSupplies`.

#### 7.5 Phân loại Nhân sự Lai & Phi công Tinh anh (Hybrid Personnel & Pilot)
- **Tách bạch 2 Nhóm Nhân sự (Dual-Track Personnel Separation)**:
  1. **Phi công Tinh anh / Chỉ huy Cơ giới (Elite Pilot / Mech Commander)**:
     - Kế thừa từ Character V1, Pilot Skill Engine, và GEAR V1.
     - Có danh tính riêng (Callsign, Bio, Avatar, Persona), chỉ số kỹ năng chiến thuật, và được bảo hiểm trong Sổ bộ Sinh tồn Quốc gia (`PilotSurvivalRecord`).
     - Đảm nhiệm vị trí: Thuyền trưởng Hạm đội (Fleet Captain), Sĩ quan Thuyền phó (XO), hoặc Phi đội trưởng GEAR (Air Group Wing Commander).
  2. **Thủy thủ đoàn / Nhân lực Vận hành Tiêu chuẩn (Operational Crew Pool)**:
     - Thuộc danh mục `FLEET_CREW` của FND-4 Workforce Foundation.
     - Là nhóm nhân khẩu số lượng lớn (Kỹ sư động lực học, nhân viên nạp đạn, kỹ thuật viên điện tử, bác sĩ quân y).
     - Không có danh tính cá nhân hóa từng người, mà được quản lý qua `FleetCrewPool`.
- **Định mức Thủy thủ đoàn (Crew Staffing Tiers)**:
  - `minimumCrew`: Quân số tối thiểu để tàu có thể khởi động và vận hành cơ bản (Hiệu suất 60%).
  - `targetCrew`: Quân số tiêu chuẩn để tàu đạt 100% hiệu năng chiến đấu và tác chiến.
  - `maximumCrew`: Quân số dự bị tăng cường, giúp tăng 50% tốc độ khắc phục sự cố hỏng hóc và duy trì ca trực liên tục trong chiến dịch dài ngày.

#### 7.6 Lực lượng Lao động, Học viện & Trung tâm Việc làm Quốc gia
- **Trung tâm Việc làm Quốc gia (National Employment Center)**:
  - Là cơ quan đầu mối cấp trung ương thu thập nhu cầu tuyển quân của tất cả các Hạm đội và nhu cầu nhân sự của các Căn cứ.
  - Phân tích và dự báo cung-cầu nhân lực theo chu kỳ 7 ngày và 30 ngày game.
- **Học viện Hải quân Căn cứ (`NAVAL_ACADEMY`)**:
  - Tiếp nhận cư dân từ quỹ dân số thường trú (`RESIDENT`) của Căn cứ để tổ chức các khóa huấn luyện chuyên môn hải quân.
  - Thời gian đào tạo tiêu chuẩn: 14 – 30 GAME_DAYS tùy theo yêu cầu chuyên ngành.
  - Sau khi tốt nghiệp, nhân lực được chuyển trạng thái thành `Trained Fleet Crew` sẵn sàng biên chế vào Hạm đội.
- **Bộ Phân Bổ Nhân Lực 3 Vòng (3-Pass Workforce Allocator)**:
  - Khi Hạm đội cập cảng và yêu cầu bổ sung quân số thiếu hụt (`WorkforceDeficit`), bộ điều phối sẽ thực thi:
    * *Pass 1 (Minimum Staffing)*: Đảm bảo toàn bộ các chiến hạm đạt mức tối thiểu `minimumCrew`.
    * *Pass 2 (Target Staffing)*: Cân đối và bổ sung đến mức tiêu chuẩn `targetCrew` theo thứ tự ưu tiên chiến lược của Hạm đội.
    * *Pass 3 (Maximum Buff Staffing)*: Phân bổ nhân lực dôi dư vào các hạm đội tiền tuyến chủ lực.

#### 7.7 Lưu chuyển Nhân sự & Biệt phái Tạm thời (Personnel Mobility & Temporary Assignments)
- **Bất biến Không Dịch Chuyển Tức Thời (No Teleportation Invariant)**:
  - Mọi sự điều động nhân sự (dù là Thủy thủ đoàn số lượng lớn hay Sĩ quan Phi công cá nhân) đều phải được thực hiện thông qua mạng lưới Logistics thực tế bằng các chuyến tàu chở khách hoặc vận tải siêu không gian (`inTransitTransfers`).
  - Ghi nhận đầy đủ: `fromBaseId`, `toFleetId`, `departureTick`, `arrivalTick`, `routePath`.
  - Nếu tuyến đường di chuyển bị phong tỏa hoặc gặp sự cố bất trắc, đoàn điều chuyển có thể bị trễ hạn hoặc phải tạm dừng tại căn cứ trung chuyển trung gian.
- **Cơ chế Biệt phái Tạm thời (Temporary Detached Duty)**:
  - Cho phép một Hạm đội biệt phái một Sĩ quan Phi công sang làm cố vấn chiến thuật hoặc tăng cường hỏa lực cho một Hạm đội đồng minh trong thời hạn xác định (ví dụ: 15 GAME_DAYS).
  - Khi hết thời hạn biệt phái, Sĩ quan tự động được tạo lệnh hồi hương về lại Hạm đội gốc.

#### 7.8 Trí tuệ Chỉ huy Hạm đội & Thẩm quyền Chỉ đạo (Fleet Command AI & Command Authority)
- **Ban Chỉ Huy Hạm Đội (Fleet Command Hierarchy)**:
  - Đứng đầu là **Thuyền trưởng (Fleet Captain)** và **Thuyền phó (Executive Officer - XO)**, cùng sự tham vấn của **Hội đồng Sĩ quan (Officers Council)**.
  - Đưa ra quyết định tác chiến thường nhật độc lập: Lập kế hoạch lộ trình tuần tra, tự động giao chiến với các mối đe dọa trong tầm kiểm soát, và chủ động ra lệnh rút lui chiến thuật (`Tactical Retreat`) khi tổn thất cấu trúc vượt ngưỡng an toàn quy định.
- **Mối Quan Hệ Thẩm Quyền Giữa Căn Cứ và Hạm Đội (Base-Fleet Relations)**:
  - Căn cứ nơi hạm đội ghé thăm có quyền gửi các **Yêu cầu Hỗ trợ / Đơn Đặt Hàng Nhiệm Vụ (Mission Request)** cho Hạm đội (như yêu cầu hộ tống tàu buôn, tuần tra bảo vệ giàn khoan ngoài quỹ đạo).
  - Ban chỉ huy Hạm đội có toàn quyền xem xét thù lao, mức độ rủi ro, và tình trạng nhiên liệu để **CHẤP THUẬN** hoặc **TỪ CHỐI** yêu cầu của Căn cứ.
  - Ban quản trị Căn cứ không có thẩm quyền đơn phương cưỡng chế Hạm đội độc lập thi hành nhiệm vụ thông thường.
- **Lệnh Khẩn Cấp Quốc Gia (National Emergency Command)**:
  - Chỉ được kích hoạt bởi Bộ Chỉ Huy Tối Cao Quốc Gia (Supreme National Authority / CC0) trong các trường hợp cực kỳ cấp bách: Thủ phủ bị bao vây (`Capital Under Siege`), Tuyến hành lang sinh mệnh bị cắt đứt, hoặc Xâm lăng quy mô lớn.
  - Khi Lệnh Khẩn Cấp hợp pháp được ban bố, nó có quyền ưu tiên cao nhất, vượt qua mọi quyết định thường nhật của Hạm đội.
  - **Giới hạn năng lực thực tế**: Lệnh khẩn cấp chỉ có hiệu lực thi hành nếu Hạm đội có đủ phạm vi hành trình thực tế (nhiên liệu, tình trạng tàu sẵn sàng, và không đang bị cầm chân trong giao tranh sống còn).
- **100% Hệ Thống Tự Quản (Zero-Micromanagement Invariant)**:
  - Toàn bộ cơ chế điều phối, tác chiến, bảo trì, tiếp tế của hạm đội được vận hành tự động bởi hệ thống AI/Simulation. Người chơi đóng vai trò Tư lệnh hoạch định chiến lược vĩ mô, không phải vi quản (micromanage) thủ công từng con tàu.

#### 7.9 Phát triển Hạm đội Tự chủ (Autonomous Fleet Development)
- **Trí tuệ Nhân tạo Định hình Tính cách Hạm đội (`FleetAIPersona`)**:
  - `AGGRESSIVE_VANGUARD`: Ưu tiên trang bị vũ khí hỏa lực mạnh, chủ động tìm kiếm và tiêu diệt các ổ đe dọa của đối phương.
  - `STEADFAST_DEFENDER`: Ưu tiên nâng cấp giáp và lá chắn, chuyên tâm bảo vệ các công trình kinh tế và tuyến giao thông.
  - `RESOURCE_EXPEDITION`: Ưu tiên khoang hàng và năng lực khai thác, thường xuyên tháp tùng các đội khai khoáng viễn thám.
  - `TACTICAL_RECON`: Ưu tiên động cơ cơ động, hệ thống cảm biến và ngụy trang, thu thập tin tức tình báo chiến lược.
- **Chu trình Tự Đầu Tư & Hiện Đại Hóa**:
  - Hạm đội tự trích lũy quỹ từ Ngân khố (`FleetTreasuryState`) để tự đặt hàng nâng cấp vũ khí tại các Xưởng đóng tàu của Căn cứ.
  - Khi quỹ thặng dư vượt mốc an toàn, Hạm đội có thể tự ký hợp đồng đóng mới thêm tàu chiến để bổ sung biên chế nhằm thăng hạng phân cấp Hạm đội (`FleetClass MK Upgrade`).

#### 7.10 Ngân khố Hạm đội & Độc lập Tài chính (Fleet Treasury & Financial Independence)
- **Cấu trúc Ngân Khố Độc Lập (`FleetTreasuryState`)**:
  - `credits`: Tiền tệ tiêu chuẩn dùng để thanh toán các giao dịch thông thường và mua sắm linh kiện.
  - `supplyCredits`: Hạn mức tín dụng quốc gia dành riêng cho việc bù đắp vật tư chiến lược.
  - `ledgerHistory`: Sổ cái ghi chép đầy đủ các bút toán thu chi (Audit Trail) có mã giao dịch và dấu thời gian.
- **Nguồn Thu Nhập Của Hạm Đội**:
  - Tiền thưởng hoàn thành nhiệm vụ ủy thác (`Mission Bounties`).
  - Tiền chia sẻ chiến lợi phẩm và trục vớt xác tàu đối phương (`Salvage & Prize Money`).
  - Phí hợp đồng bảo an tuyến đường thương mại từ các Căn cứ thương mại.
  - Trợ cấp duy trì hòa bình và trợ cấp thường niên từ Ngân sách Quốc gia.
- **Khoản Chi Phí Định Kỳ**:
  - Lương và phụ cấp sinh hoạt cho Thủy thủ đoàn (`Crew Payroll`).
  - Phí tiêu thụ nhiên liệu và đạn dược tiêu hao.
  - Phí bến bãi cập cảng và chi phí bảo dưỡng kỹ thuật tại các Căn cứ.
- **Quy Trình Xử Lý Thâm Hụt Ngân Sách**:
  - Nếu ngân quỹ bị âm hoặc không đủ thanh toán lương trong 3 chu kỳ liên tiếp:
    * Chỉ số tinh thần (`morale`) của Hạm đội sụt giảm mạnh.
    * Thủy thủ đoàn có hiện tượng xin thôi việc hoặc chuyển công tác.
    * Hạm đội tự động chuyển sang chế độ "Ngủ đông / Neo đậu tiết kiệm" (`AUSTERE_MODE`) để cắt giảm tối đa chi phí.

#### 7.11 Hậu cần Hạm đội, Khoang hàng & Tiếp tế (Fleet Logistics, Inventory & Supply)
- **Hệ Thống Kho Tiếp Tế Thực Thể (`FleetInventory`)**:
  - Chứa đựng 5 nhóm tài nguyên chiến lược theo quy chuẩn `WorldResourceLedger`:
    1. `food`: Lương thực thiết yếu cho thủy thủ đoàn (tuyệt đối không gộp chung với đạn dược).
    2. `energy`: Tinh thể năng lượng/plasma dùng cho động cơ hành trình và lá chắn.
    3. `logisticsSupplies`: Phụ tùng thay thế, đạn dược, và vật tư kỹ thuật.
    4. `industrialMaterials`: Vật liệu sửa chữa thân vỏ hợp kim.
    5. `tacticalData`: Bản đồ dữ liệu không gian và mã khóa truyền tin an toàn.
- **Cơ Chế Tiêu Hao Thực Tế Theo Ngày Game (`Daily Consumption Tick`)**:
  - Lương thực tiêu hao tỷ lệ thuận với tổng số lượng Thủy thủ đoàn đang phục vụ trên Hạm đội.
  - Năng lượng tiêu hao dựa trên tổng công suất động cơ khi hành quân và trạng thái duy trì lò phản ứng.
  - Nếu hết Lương thực: Thủy thủ đoàn rơi vào trạng thái đói khát (`Starvation`), sĩ khí suy sụp, hiệu suất giảm 80%.
  - Nếu hết Năng lượng giữa đường: Hạm đội bị chết máy trôi dạt trên tuyến siêu không gian (`Stranded In Space`), phát tín hiệu cầu cứu khẩn cấp.
- **Quy Trình Tiếp Tế Hai Chiều (Replenishment at Sea / Station)**:
  - Tiếp tế tại cảng: Tự động bơm nạp tài nguyên thông qua Cổng Neo Đậu Docking Port của Căn cứ.
  - Tiếp tế trên không phận (Fleet-to-Fleet): Tàu hậu cần chuyên dụng (`Fleet Tender / Replenishment Ship`) chuyển hàng sang chiến hạm chiến đấu.

#### 7.12 Sổ vàng Thành tích Hạm đội (Fleet Service Record)
- **Hồ Sơ Danh Dự Lịch Sử Vĩnh Viễn (`FleetServiceLog`)**:
  - Ghi nhận bất biến từ thời điểm hạ thủy đầu tiên cho đến khi kết thúc vòng đời.
  - Gồm các chỉ số kiểm toán:
    * `commissionDate`: Ngày thành lập hạm đội.
    * `totalBattlesEngaged`: Tổng số trận chiến đã tham gia.
    * `victoriesCount`: Số trận thắng vẻ vang.
    * `enemiesDestroyed`: Số lượng tàu địch đã tiêu diệt.
    * `threatSuppressed`: Tổng điểm đe dọa (Threat Points) đã càn quét giải phóng cho các Sector.
    * `pilotsRescued`: Số lượng phi công đồng minh đã cứu hộ thành công khỏi hiểm nguy.
    * `totalCasualtiesSustained`: Tổng số thương vong thủy thủ đoàn đã hy sinh vì nghĩa vụ.
    * `honorsAndCitations`: Danh mục huân huy chương, bằng khen chiến công được phong tặng từ Bộ Tư lệnh Tối cao.

#### 7.13 Vòng đời Hạm đội, FRAME & Trợ cấp Quốc gia (Fleet Lifecycle, FRAME & National Support)
- **4 Giai Đoạn Vòng Đời Chính Danh (`FleetLifecycleState`)**:
  1. `FORMATION`: Giai đoạn chuẩn bị, thành lập khung biên chế, tiếp nhận kỳ hạm và thủy thủ đoàn hạt nhân tại Căn cứ đăng ký.
  2. `ACTIVE`: Giai đoạn phục vụ tích cực, tham gia thực hiện các nhiệm vụ an ninh, viễn chinh, phòng thủ.
  3. `REORGANIZATION`: Giai đoạn cải tổ toàn diện, nâng cấp quy mô lên lớp hạm đội mới, hoặc thực hiện thủ tục Sáp nhập (`Fleet Merger`).
  4. `DISBANDMENT`: Giai đoạn giải thể. Các tàu chiến được tháo dỡ hoặc trả về kho dự bị quốc gia; thủy thủ đoàn được giải ngũ hoặc điều chuyển về Trung tâm Việc làm Quốc gia; hồ sơ chiến công được niêm phong vào Bảo tàng Danh dự Lịch sử.
- **Cơ Chế Sáp Nhập Hợp Pháp (Mutual Consent Fleet Merger)**:
  - Hai hạm đội chỉ được sáp nhập khi có sự đồng thuận từ chủ sở hữu và ban chỉ huy của cả hai bên.
  - Toàn bộ tàu chiến, số dư ngân khố, đạn dược và phi hành đoàn được kiểm kê minh bạch và sáp nhập vào hạm đội tiếp nhận.
  - Điểm tích lũy FRAME và bảng thành tích lịch sử được kết hợp và lưu vết kiểm toán đầy đủ.

#### 7.14 Phi công NPC Lập nghiệp & Gói Bảo hộ Tân binh (NPC Pilot Founders & NEW_GUILD_PROTECTION)
- **Phi Công Huyền Thoại Lập Hạm Đội / Quân Đoàn Độc Lập**:
  - Các phi công kỳ cựu đạt đến cấp độ uy tín cao có thể xin giấy phép thành lập Hạm đội Tư nhân hoặc Công ty Quân sự Độc lập (Private Military Fleet / Free Mercenary Guild).
  - Có bản sắc riêng, phương châm hành động và tự tuyển chọn nhân sự trung thành.
- **Gói Bảo Hộ Tân Binh (`NEW_GUILD_PROTECTION`)**:
  - Nhằm tránh tình trạng các hạm đội mới thành lập bị phá sản do chi phí ban đầu quá lớn và cơ chế trừ điểm thường niên:
    * **Miễn trừ hoàn toàn Annual FRAME Decay** trong chu kỳ năm đầu tiên (360 GAME_DAYS tính từ ngày thành lập).
    * Hưởng mức trợ cấp bảo dưỡng cố định 100% trong 10 lượt đầu tiên mà không bị giảm trừ tỷ lệ.
    * Được ưu tiên bảo lãnh vay vốn tín dụng quốc gia với lãi suất 0% từ Ngân hàng Trung ương.

#### 7.15 Sổ bộ Hạm đội Quốc gia, Tích hợp Thế giới & Hiệu năng (National Fleet Registry & Performance)
- **Cơ Chế Sổ Bộ Thống Nhất (National Fleet Registry Facade)**:
  - `NationalFleetRegistry` đóng vai trò là lớp tra cứu chỉ mục tập trung (Index & Query Facade), tuyệt đối **KHÔNG SAO CHÉP TRÙNG LẶP DỮ LIỆU GỐC**.
  - Cho phép tra cứu tức thời $O(1)$ thông tin hạm đội qua `fleetId`, tra cứu danh sách hạm đội đang có mặt tại một `sectorId` hoặc `baseId`.
- **Chu Kỳ Báo Cáo & Quyết Toán Chuẩn**:
  - `CYCLE_REPORT_INTERVAL`: Mặc định **7 GAME_DAYS** (Đồng bộ với chu kỳ dự báo kinh tế của Căn cứ FND-6).
  - `MACRO_SETTLEMENT_INTERVAL`: Mặc định **30 GAME_DAYS** (Kỳ hạch toán tài chính vĩ mô toàn liên minh).
- **Điểm Kiểm Tra Tự Động Lưu (Autosave Report Checkpoint)**:
  - Ngay sau khi một báo cáo chu kỳ 7 ngày hoặc 30 ngày được chốt sổ thành công, hệ thống tự động kích hoạt một điểm lưu trữ sao lưu độc lập (`Autosave Report Checkpoint`), bảo vệ dữ liệu khỏi mọi rủi ro mất mát ngoài ý muốn.
- **Tối Ưu Hóa Bộ Nhớ & Tốc Độ Mô Phỏng**:
  - Mô phỏng tác chiến và tiêu hao của các hạm đội xa ngoài tầm nhìn (Off-screen / Out-of-focus Fleets) được tính toán theo thuật toán nội suy tất định dựa trên số tick, tiết kiệm tối đa CPU/RAM của trình duyệt.

---

### 3. CHÍNH SÁCH TÀI CHÍNH FRAME & TRỢ CẤP TOÀN DIỆN

Hệ thống Điểm Uy Tín & Đóng Góp Hạm Đội Quốc Gia (Fleet Recognition & Merit Engine - **FRAME**) được thiết kế với độ chính xác kế toán cao nhất:

#### 3.1 Ba Số Dư FRAME Độc Lập
Mỗi Hạm đội duy trì ba số dư điểm FRAME song song:
1. **Cycle FRAME (`cycleFrame`)**:
   - Thước đo hiệu suất ngắn hạn, ghi nhận toàn bộ số điểm kiếm được trong chu kỳ hiện hành.
   - Được dùng làm căn cứ tính toán xếp hạng phong độ và xác định mức suy giảm thường niên (Decay).
   - Được kết chuyển (Snapshot & Reset về 0) sau mỗi kỳ quyết toán năm hoặc kỳ tổng hợp lớn.
2. **Available FRAME (`availableFrame`)**:
   - Số điểm khả dụng thực tế để Hạm đội sử dụng.
   - Dùng để chi tiêu tại **Cửa Hàng Trao Đổi Công Nghệ & Khí Tài Quốc Gia (FRAME Exchange Store)** nhằm đổi lấy bản thiết kế tàu hiếm, module tối tân, hoặc giấy phép đặc quyền.
   - Việc chi tiêu sẽ làm giảm `availableFrame` nhưng **KHÔNG ĐƯỢC PHÉP LÀM GIẢM `totalFrame`**.
3. **Total FRAME (`totalFrame`)**:
   - Điểm tích lũy lịch sử dài hạn (Lifetime Recognition Score).
   - Thể hiện vị thế vinh quang, cấp bậc uy tín quân sự quốc gia, và là thước đo trên Bảng xếp hạng TOP 100 Hạm đội Huyền thoại Toàn cầu.
   - Chỉ được điều chỉnh tăng khi có đóng góp thực tế, hoặc điều chỉnh giảm khi phải chịu các chế tài xử phạt kỷ luật nghiêm trọng đã được Ủy ban Quốc gia phê duyệt.

#### 3.2 Quy Tắc Ghi Nhận & Bút Toán Sổ Cái
- **Ghi nhận Đóng góp Hợp lệ**:
  - Khi hạm đội hoàn thành một chiến công (diệt Boss đe dọa, giải cứu căn cứ, hộ tống tuyến vận tải), một bút toán `FRAME_AWARD` được phát hành.
  - Hệ thống tự động cộng đồng thời vào cả 3 số dư:
    $$\Delta cycleFrame = +X, \quad \Delta availableFrame = +X, \quad \Delta totalFrame = +X$$
- **Sử dụng Điểm Đổi Thưởng**:
  - Khi mua sắm tại FRAME Store:
    $$\Delta availableFrame = -Cost, \quad \Delta cycleFrame = 0, \quad \Delta totalFrame = 0$$
- **Hệ Số Thưởng / Phạt Đặc Biệt (-1000% đến +1000% Cycle)**:
  - Các sự kiện biến động chiến lược hoặc án kỷ luật quân đội có thể áp dụng hệ số từ **-1000%** đến **+1000%** giá trị đóng góp của kỳ hiện tại.
  - Ví dụ: Hành vi đào ngũ hoặc làm mất chiến hạm tối mật có thể bị phạt mức -500% Cycle FRAME của kỳ đó.
- **Xử Lý Khi Mức Phạt Vượt Quá Số Dư Khả Dụng (Penalty Overflow Rule)**:
  - Nếu mức phạt $P$ lớn hơn $availableFrame$ hiện có:
    1. Trừ toàn bộ $availableFrame$ về mức sàn **0** (Tuyệt đối không để số dư âm).
    2. Phần phạt thâm hụt còn lại ($P - availableFrame$) sẽ được khấu trừ trực tiếp vào $totalFrame$ sau khi thông qua biên bản kỷ luật có thẩm quyền.
    3. Nếu mức phạt vẫn vượt quá $totalFrame$, $totalFrame$ được hạ về mức sàn **0**.
    4. Sổ cái kiểm toán (`Audit Ledger`) lưu vết đầy đủ toàn bộ diễn biến để phục vụ thanh tra.
- **Giải Thưởng Vượt Trần (Overflow Ceiling & Redemption Policy)**:
  - Nếu Hạm đội đạt trần tối đa tích lũy FRAME, phần điểm dôi dư có thể được chuyển đổi thành Credits theo tỷ lệ quy đổi chính thức (`FRAME to Credits Conversion`), **CHỈ KHI VÀ CHỈ KHI** Ngân khố Quốc gia có nguồn ngân sách thực tế bảo đảm chi trả.

#### 3.3 Cơ Chế Suy Giảm Thường Niên (Annual FRAME Decay)
Nhằm chống hiện tượng tích tụ điểm ảo, lười vận hành và bảo đảm tính cạnh tranh công bằng của thế giới:
- **Chu kỳ thực thi**: Mặc định **360 GAME_DAYS** (Cấu hình được trong Simulator Config).
- **Công thức tính toán chuẩn**:
  1. Tính mức đóng góp trung bình quốc gia trong chu kỳ vừa qua:
     $$NationalAverageCycle = \frac{1}{N} \sum_{i=1}^{N} cycleFrame_i \quad (\text{với các Hạm đội đủ điều kiện xét duyệt})$$
  2. Xác định mức suy giảm cơ sở:
     $$BaseDecay = \frac{NationalAverageCycle}{2} \quad (\text{Mẫu số cấu hình được, mặc định = 2})$$
  3. Xác định mức suy giảm thực tế của từng hạm đội:
     $$ActualDecay = \min\left(BaseDecay, \; FleetTotalBeforeDecay \times 50\%\right)$$
     *(Mức trần 50% cấu hình được, đảm bảo hạm đội không bị mất quá nửa số điểm trong một kỳ).*
- **Bất biến Khấu trừ Duy nhất (Idempotent Ledger Invariant)**:
  - Mỗi chu kỳ 360 ngày chỉ được khấu trừ đúng một lần duy nhất cho mỗi Hạm đội.
  - Lưu snapshot trạng thái `cycleFrame` trước khi thực hiện reset sang năm mới.
  - **Miễn trừ Đặc biệt**: Các hạm đội mang trạng thái `NEW_GUILD_PROTECTION` hoặc các hạm đội đang thực hiện chiến dịch phong tỏa đặc biệt theo sắc lệnh quốc gia được miễn trừ 100% mức Decay này.

#### 3.4 Chính Sách Trợ Cấp Hạm Đội Thường Nhật (Fleet Maintenance Subsidies)
- **Hạn mức Lượt Trợ cấp Mỗi Chu kỳ**:
  $$MaxSubsidiesPerCycle = configurableMultiplier \times MK\_Tier$$
  *(Hệ số mặc định $configurableMultiplier = 10$. Ví dụ: Hạm đội MK I được tối đa 10 lượt trợ cấp/kỳ, MK V được 50 lượt/kỳ).*
- **Đường Cong Trợ Cấp Giảm Dần (Degressive Subsidy Curve)**:
  - Lượt sử dụng 1 đến 3: Hỗ trợ 100% chi phí bảo dưỡng.
  - Lượt sử dụng tiếp theo: Tỷ lệ hỗ trợ giảm dần đều theo số lượt đã sử dụng.
  - **Mức sàn bảo trợ**: Tối thiểu duy trì ở mức **30%** (Cấu hình được), không bao giờ tụt về 0 đối với các hạm đội chính quy.
  - **Ngoại lệ Vùng Chiến sự (Frontline War Exception)**: Các Hạm đội đóng quân tại các Sector Biên giới (`BORDER`) hoặc các Sector đang bị uy hiếp nặng nề (`threatLevel > 70%`) được hưởng cố định **100% tỷ lệ trợ cấp** cho đến khi giải tỏa chiến sự, tuy nhiên vẫn bị trừ vào tổng số lượt quy định.
- **Cơ Chế Phân Bổ Nguồn Vốn Base / National**:
  - Không ấn định cứng tỷ lệ 20/80 hay 0/100.
  - Việc phân bổ nguồn chi trả dựa trên Hiệp ước Đóng quân (`Stationing Accord`) giữa Căn cứ sở tại và Bộ Tư lệnh Quốc gia: Căn cứ kinh tế lớn có thể gánh vác 60% chi phí, trong khi Căn cứ tiền đồn nghèo tài nguyên chỉ gánh 10%, phần còn lại do Ngân sách Trung ương cấp bù.
- **Phân Biệt Rõ 3 Hình Thức Hỗ Trợ Tài Chính**:
  1. `Trợ cấp Không Hoàn Lại (Direct Subsidies)`: Dành cho bảo dưỡng và nhiên liệu cơ bản.
  2. `Khoản Vay Ưu Đãi (Concessional Loans)`: Cung cấp vốn tái trang thiết bị, có lộ trình hoàn trả kèm lãi suất danh nghĩa.
  3. `Cứu Trợ Chiến Lược Khẩn Cấp (Strategic Bailout)`: Kích hoạt khi hạm đội chủ lực đối mặt nguy cơ tan rã trong thời chiến.

---

### 4. CÁC BẤT BIẾN CỐT LÕI HỆ THỐNG (SYSTEM INVARIANTS)

1. **Bất biến Chủ quyền Tài sản (Asset Sovereignty Invariant)**: Căn cứ không thể can thiệp hoặc tịch thu tàu chiến, trang bị, hàng hóa, hoặc phi hành đoàn của Hạm đội nếu không có giao dịch thương mại hoặc hiệp ước pháp lý hợp lệ.
2. **Bất biến Bảo toàn Nhân lực (Personnel Conservation Invariant)**: Tổng nhân lực điều động từ căn cứ sang hạm đội phải luôn cân bằng: Dân số căn cứ giảm đúng bằng số lượng biên chế vào hạm đội cộng số lượng đang di chuyển In-Transit.
3. **Bất biến Không Dịch Chuyển Tức Thời (No Teleportation Invariant)**: Hạm đội và nhân sự bắt buộc phải di chuyển vật lý qua các chặng liên kết đồ thị Hyperlane với thời gian tính bằng tick/ngày thực tế.
4. **Bất biến Giới hạn Docking Căn cứ (Physical Port Conservation Invariant)**: Số lượng hạm đội cập cảng đồng thời tại một Căn cứ không được vượt quá tổng số `fleetDockingCapacity` (tổng hòa của `baseDockingPorts`, `expansionDockingPorts`, và `subBaseDockingPorts`).
5. **Bất biến Không Âm Quỹ FRAME (Non-Negative FRAME Ledger Invariant)**: Mọi thao tác phạt hoặc khấu trừ không bao giờ được đẩy `availableFrame` hoặc `totalFrame` xuống dưới 0.
6. **Bất biến Khấu trừ Duy nhất (Idempotent Yearly Decay Invariant)**: Cơ chế suy giảm điểm thường niên tuyệt đối không chạy lặp lại hai lần trên cùng một năm tài chính của Hạm đội.
7. **Bất biến Kiểm toán Sổ cái (Authoritative Audit Trace Invariant)**: Mọi biến động về ngân khố, biên chế tàu, và điểm FRAME đều phải phát sinh một bản ghi lịch sử không thể tẩy xóa (`Immutable Journal Entry`).

---
*(Hết tài liệu Đặc tả FND-7 Feature Specification)*
