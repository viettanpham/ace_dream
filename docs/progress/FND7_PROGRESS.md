# STARFRONT WORLD — FND-7 IMPLEMENTATION PROGRESS TRACKER
## BẢNG THEO DÕI TIẾN ĐỘ TRIỂN KHAI NỀN TẢNG HẠM ĐỘI & TÀU CHIẾN (FND-7)

> **Cập nhật lúc:** 20/10/2026  
> **Chế độ thực thi:** IMPLEMENT ONE PHASE ONLY  
> **Giai đoạn vừa hoàn thành:** Phase 7.3: Hybrid Workforce, Academy & Crew Pool (**DONE**)  
> **Giai đoạn tiếp theo:** Phase 7.4: Fleet Entity, Treasury & Supply (**READY**)  

---

### 1. BẢNG TIẾN ĐỘ 7 GIAI ĐOẠN FND-7

| Mã Phase | Tên Giai Đoạn TriỂn Khai | Phạm Vi & Trọng Tâm Kỹ Thuật | Trạng Thái | Test Suite Đạt Chuẩn |
| :---: | :--- | :--- | :---: | :---: |
| **Phase 7.1** | **Master Data Catalogs & Schemas** | 7 canonical JSON catalogs, TypeScript contracts, Registry bootstrap, in-memory seed & disk sync. | **DONE** | `phase-7-1-fleet-catalogs.test.ts` (12/12 PASS) |
| **Phase 7.2** | **Ship Entity & Progression Engine** | `ShipInstance`, tích hợp FND-2 MK I–X, slot modules, crew ratios/efficiency, hao mòn `condition`, đại tu docking port, MAX TIER BONUS, bảo trì policy, soft migration. | **DONE** | `phase-7-2-ship-progression.test.ts` (15/15 PASS) |
| **Phase 7.3** | **Hybrid Workforce & Crew Pool** | `FleetCrewPool`, phi công tinh anh vs thủy thủ đoàn `FLEET_CREW`, Học viện `NAVAL_ACADEMY`, 3-Pass Allocator, In-Transit transfers, thương vong & giải ngũ. | **DONE** | `phase-7-3-fleet-workforce.test.ts` (15/15 PASS) |
| **Phase 7.4** | **Fleet Entity, Treasury & Supply** | `FleetEntityState`, độc lập tài chính, AI Persona tự chủ, tiêu hao lương thực/nhiên liệu theo tick ngày. | `READY` | Sẵn sàng triển khai ở phiên tiếp theo |
| **Phase 7.5** | **FRAME Engine & Annual Decay** | 3 số dư FRAME, suy giảm thường niên 360 ngày ($BaseDecay = Avg/2$, trần 50%), miễn trừ `NEW_GUILD_PROTECTION`, trợ cấp. | `PENDING` | Chờ Phase 7.4 |
| **Phase 7.6** | **World Integration & Combat V2** | Mở rộng `WorldState.fleets`, `NationalFleetRegistry` facade $O(1)$, adapter Combat V2, báo cáo 7/30 ngày & Autosave Checkpoint. | `PENDING` | Chờ Phase 7.5 |
| **Phase 7.7** | **UI Fleet Command & AdminCP** | Modal chỉ huy hạm đội, Sector Intel docking tab, danh thiếp chiến hạm, điều phối hành quân, Admin CP audit view. | `PENDING` | Chờ Phase 7.6 |

---

### 2. CHI TIẾT CÔNG VIỆC ĐÃ HOÀN THÀNH TRONG PHASE 7.3

1. **Kiến Trúc Nhân Sự Lai Hai Luồng (Hybrid Workforce Dual-Track)**:
   - **Luồng A (Named Pilots & Commanders)**: Thực thể cá nhân hóa độc lập từ Character V1 / Pilot Survival. Có ID, Callsign, cấp bậc (`PilotMilitaryRank`), vai trò (`PilotFleetRole`). Tuyệt đối không bị gộp thành số đếm workforce (Never a counter).
   - **Luồng B (Operational Fleet Crew Pool)**: Quản lý tập thể theo `FleetCrewPool` từ FND-4 (`crewIdle`, `crewAssigned`, `crewReserve`, `totalCrew`).
2. **Quản Lý Bổ Nhiệm & Miễn Nhiệm Lãnh Đạo Hạm Đội / Chiến Hạm**:
   - `appointFleetCaptain` & `relieveFleetCaptain`: Bổ nhiệm / Miễn nhiệm Thuyền trưởng Hạm đội.
   - `appointFleetExecutiveOfficer` & `relieveFleetExecutiveOfficer`: Bổ nhiệm / Miễn nhiệm Sĩ quan Thuyền phó (XO).
   - `appointShipCaptain` & `relieveShipCaptain`: Bổ nhiệm / Miễn nhiệm Thuyền trưởng cho từng con tàu (`ship.assignedPilotId`).
3. **Cơ Chế Biệt Phái Tạm Thời (Temporary Detached Duty)**:
   - Hàm `assignPilotDetachedDuty`: Biệt phái Sĩ quan Pilot sang làm cố vấn chiến thuật hoặc tăng viện cho hạm đội/căn cứ khác trong thời hạn $X$ ngày game.
   - Hàm `processDetachedDutyReturns`: Tự động nhận diện khi hết hạn và đưa Sĩ quan trở lại trạng thái thường trực `ACTIVE_DUTY`.
4. **Bộ Phân Bổ Nhân Lực 3 Vòng (3-Pass Ship Crew Allocator - `allocateFleetCrewToShips`)**:
   - Nhận vào `FleetCrewPool` và danh sách tàu `ShipInstance[]`.
   - **Pass 1 (Minimum Staffing)**: Ưu tiên cấp đủ `minimumCrew` cho mọi tàu hoạt động (`canOperate = true`), sắp xếp ưu tiên theo Soái hạm > Tàu chiến hạng nặng > Tàu trinh sát > Tàu hậu cần. Tàu không nhận đủ bị đánh dấu `canOperate = false` (understaffed, efficiency = 0.4).
   - **Pass 2 (Target Staffing)**: Cân đối và bổ sung delta lên đến `targetCrew` (100% operational efficiency = 1.0).
   - **Pass 3 (Maximum Buff Staffing)**: Phân bổ nhân lực dôi dư lên đến `maximumCrew` cho các tàu được ưu tiên để nhận buff `efficiency = 1.25` (+25% tốc độ sửa chữa & phục hồi).
   - Tự động đồng bộ `ship.assignedCrewCount` và kích hoạt hàm đánh giá `evaluateShipCrewStatus(ship)`.
5. **Học Viện Hải Quân Căn Cứ (`NAVAL_ACADEMY`)**:
   - Hàm `startNavalAcademyTraining`: Tuyển sinh từ quỹ dân số `RESIDENT` của Căn cứ.
   - Bất biến bảo toàn quân số: Dân số Base khả dụng giảm đúng bằng số lượng học viên (`populationAvailable -= traineeCount`, `breakdown.FLEET_CREW += traineeCount`).
   - Hàm `processNavalAcademyGraduation`: Xử lý tốt nghiệp sau thời gian đào tạo qua Game Days và bàn giao trực tiếp vào `FleetCrewPool.crewIdle`.
   - Bổ sung catalog chuẩn `system_fleet_academy_training_profile_data.json` với 4 khóa đào tạo chính quy.
6. **Lưu Chuyển Nhân Sự Không Dịch Chuyển Tức Thời (No-Teleport Invariant)**:
   - Hàm `dispatchPersonnelTransfer`: Tính toán thời gian hành trình dựa trên số bước nhảy mạng Hyperlane (`hyperlaneHops`), tạo bản ghi `PopulationTransferRecord` dạng `IN_TRANSIT`.
   - Hàm `processPersonnelArrival`: Khi đến hạn ngày cập bến (`currentGameDay >= estimatedArrivalGameDay`), bàn giao quân số an toàn vào Hạm đội đích.
7. **Hao Hụt & Thương Vong Chiến Trận (Battle Casualties)**:
   - Hàm `applyFleetBattleCasualties`: Khấu trừ thương vong từ `crewAssigned`, phân bổ pro-rata theo tỷ lệ hư hại thân vỏ của từng tàu, trừ điểm sĩ khí hạm đội (`morale`) và ghi sổ nhật ký chiến thương.
8. **Bàn Giao & Giải Ngũ Về Base (`dischargeCrewToBase`)**:
   - Thủy thủ đoàn thuộc quyền sở hữu của Hạm đội, Base không được tự ý trưng thu.
   - Cho phép giải ngũ hợp thức từ `FleetCrewPool.crewIdle` trả lại vào `BasePopulationState.populationAvailable`.

---

### 3. KẾT QUẢ KIỂM THỬ TỔNG HỢP
* `tests/world/phase-7-3-fleet-workforce.test.ts`: **15/15 PASS** (~38ms).
* `tests/world/phase-7-2-ship-progression.test.ts`: **15/15 PASS** (~71ms).
* `tests/world/phase-7-1-fleet-catalogs.test.ts`: **12/12 PASS** (~23ms).
* `tsc --noEmit`: **0 errors**.
* Production Build `npm run build`: **Compiled successfully**.

---

### 4. CHỈ DẪN CHO GIAI ĐOẠN TIẾP THEO (NEXT ACTION)

Tài khoản AI Studio tiếp theo chỉ cần mở `docs/foundations/FND7_MULTI_PHASE_ROADMAP.md` và thực hiện **Phase 7.4: Fleet Entity, Treasury & Logistics Supply**:
- Xây dựng `lib/game/world/fleet/fleet-entity.ts`: Quản lý thực thể Hạm đội, biên chế tàu, neo đậu cảng.
- Xây dựng `lib/game/world/fleet/fleet-treasury.ts`: Sổ cái tín dụng, thu chi lương bổng, xử lý thâm hụt tài chính.
- Xây dựng `lib/game/world/fleet/fleet-logistics.ts`: Khoang hàng chứa Food, Energy, Supplies, tính tiêu hao theo tick ngày (Daily Consumption).
- Xây dựng `lib/game/world/fleet/fleet-ai-command.ts`: AI Persona tự chủ, thẩm quyền chỉ huy tự vệ, Lệnh khẩn cấp quốc gia.
- Viết `tests/world/phase-7-4-fleet-entity-treasury.test.ts` và kiểm thử.
