# STARFRONT WORLD — BASE & FACILITY BUILDING CATALOG
# DANH MỤC CÔNG TRÌNH CĂN CỨ VÀ CƠ SỞ CHIẾN LƯỢC THIÊN HÀ

> **TÀI LIỆU QUẢN TRỊ KIẾN TRÚC CÔNG TRÌNH (ARCHITECTURAL SOURCE OF TRUTH)**  
> **Trạng thái:** APPROVED FOR ARCHITECTURAL PLANNING (KHÔNG DUPLICATE SYSTEM)  
> **Nguyên tắc:** Dựa trên kết quả đối chiếu 13 Core Buildings hiện có, phân định rõ ràng giữa Player Core Base và Generic WORLD Facilities, không tự ý suy diễn (invent) các chỉ số chi phí, HP, hay sản lượng chưa được phê duyệt.

---

## 1. PHÂN ĐỊNH TỔNG QUAN KIẾN TRÚC (ARCHITECTURAL SEGREGATION)

Hệ thống công trình trong STARFRONT được phân thành hai nhóm thực thể rõ rệt nhằm tránh trùng lặp dữ liệu:

1. **EXISTING CORE BUILDINGS (Công trình Căn Cứ Chỉ Huy Cá Nhân):**
   - Nằm trong `state.buildings` (`lib/game/types.ts`, `lib/game/data.ts`).
   - Đại diện cho Tổng hành dinh cá nhân của Chỉ huy người chơi (Player Base).
   - Nâng cấp tức thời từ Cấp 1 đến 30 bằng Credits, Hợp kim (Alloy), Tinh thể (Crystal).
   - Cung cấp buff kinh tế cá nhân, hồi phục hạm đội cá nhân và mở rộng trần chứa GEAR/quân số cá nhân.

2. **PLANNED WORLD BUILDINGS & FACILITIES (Cơ Sở Vật Chất Chiến Lược Thiên Hà):**
   - Nằm trong các Sector không gian thuộc `WorldSector` (`lib/game/world/types.ts`).
   - Đại diện cho cơ sở hạ tầng vĩ mô của toàn liên minh VSS hoặc các phe phái (Void, Factions).
   - Có thể bị vây hãm, hư hại, bỏ hoang, phục hồi, hoặc chuyển giao chủ quyền (Sovereignty).
   - Vận hành theo năng lực sửa chữa chuẩn hóa (`BaseInstallationRepairHpDay`), sản xuất tài nguyên vĩ mô (`WorldResourceLedger`), và liên kết với các đội ngũ nhân lực (`ActiveTechnicalWorkers`).

---

## 2. HỆ THỐNG DANH MỤC MỤC TIÊU CỦA WORLD (TARGET CATEGORIES)

Toàn bộ công trình và cơ sở chiến lược thiên hà được chuẩn hóa theo 11 nhóm danh mục (Categories):

1. **`CIVIL`**: Cơ sở hành chính, quản trị dân sự, nhà ở và điều phối dân cư.
2. **`INFRASTRUCTURE`**: Cơ sở hạ tầng cốt lõi, lò phản ứng năng lượng, mạng lưới liên lạc và trạm tiếp vận.
3. **`INDUSTRIAL`**: Tổ hợp công nghiệp nặng, khai thác khoáng sản, tinh luyện vật liệu chế tạo.
4. **`MEDICAL`**: Bệnh viện chiến trường, trung tâm phục hồi tâm lý phi công, đơn vị cấp cứu sinh tồn.
5. **`LOGISTICS`**: Trạm bảo dưỡng cơ giáp, xưởng sửa chữa (Repair Bay), kho bãi tiếp tế vật tư.
6. **`MILITARY`**: Doanh trại quân đồn trú, sở chỉ huy chiến dịch, căn cứ hạm đội tiền phương.
7. **`DEFENSE`**: Tháp pháo cao xạ pháo đài, mạng lưới công sự, hệ thống khiên chắn bảo vệ Sector.
8. **`TRAINING`**: Học viện sĩ quan (như FREESKA Academy), trường đào tạo sơ cấp (như NEWHORIZON), trung tâm huấn luyện thợ máy.
9. **`ECONOMIC`**: Ngân khố quốc gia, cơ quan thu thuế theo chu kỳ, trung tâm điều phối ngân sách.
10. **`RESCUE`**: Trung tâm Tìm kiếm Cứu nạn (SAR Center), bến neo đậu tàu cứu hộ (Rescue Dock).
11. **`SPECIAL`**: Cơ sở nghiên cứu công nghệ đặc thù, trạm nghiên cứu di tích Tartarus, cổng bước nhảy cổ đại.

---

## 3. BẢNG DANH MỤC CHI TIẾT 13 EXISTING CORE BUILDINGS

Bảng phân tích toàn diện 13 công trình hiện có trong Core Game và định hướng tích hợp với WORLD:

| ID / Key | Tên Hiện Tại | Category | Status (Reuse / Extend / Separate) | Current Function (Core Game) | Future WORLD Role (Chiến Lược Thiên Hà) | Unresolved Balance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`command`** | Sở Chỉ Huy | `CIVIL` / `INFRASTRUCTURE` | **EXTEND** | Trung tâm căn cứ; mở khóa trần cấp các công trình khác (`level <= commandLevel + 2`); sinh Credits và Phòng thủ cơ bản. | Trở thành Trụ sở Điều hành Sector (Sector Administrative HQ), điều phối các trạm vệ tinh và chính sách vĩ mô tại Sector. | Chưa có quy định HP của tòa nhà, thời gian xây dựng/nâng cấp theo ngày chiến lược. |
| **`hangar`** | Nhà Chứa (Hangar) | `LOGISTICS` | **EXTEND** | Hồi phục tự động 8% base + 5%/cấp MaxHP mỗi ngày cho hạm đội cá nhân; tăng trần số Gear (+1/cấp). | Mở rộng thành Cơ sở Sửa chữa & Bảo dưỡng (Repair Bay / Hangar Complex) tại Sector, cung cấp `FacilityRepairCapacityPerDay`. | Chưa có định mức phân bổ năng lực cụ thể cho từng cấp Hangar trong WORLD. |
| **`factory`** | Nhà Máy Vũ Khí | `INDUSTRIAL` | **REUSE** | Mô tả giảm chi phí chế tạo trang bị (hiện chưa có logic runtime trong engine). | Tổ hợp chế tạo khí tài quân sự và trang thiết bị viễn chinh, tiêu thụ `industrialMaterials`. | Chưa có công thức sản xuất trang bị vĩ mô và tiêu hao vật tư. |
| **`reactor`** | Lò Phản Ứng | `INFRASTRUCTURE` | **REUSE** | Cung cấp 60 + reactor * 50 năng lượng (`energy`) mỗi ngày cho căn cứ người chơi. | Trạm phát điện phản ứng hạt nhân / plasma cung cấp năng lượng vận hành khiên phòng thủ và mạng lưới Hyperlane của Sector. | Chưa có định mức tiêu thụ năng lượng duy trì (Upkeep Energy) của Sector. |
| **`refinery`** | Xưởng Luyện Kim | `INDUSTRIAL` | **REUSE** | Cung cấp 60 + refinery * 55 hợp kim (`alloy`) và một phần tinh thể mỗi ngày. | Tổ hợp khai thác mỏ và luyện kim sản xuất tài nguyên `industrialMaterials` cho kho của Sector. | Chưa xác định tỷ lệ chuyển đổi từ cấp độ xưởng sang sản lượng nguyên vật liệu chuẩn. |
| **`barracks`** | Doanh Trại | `MILITARY` | **EXTEND** | Tăng trần quân số đồn trú `armyCap` (+60 quân số/cấp). | Doanh trại đồn trú quân sự địa phương, xác định mức trần quân số đồn trú tối đa (`maxGarrisonPower`) tại Sector. | Chưa có chỉ số hao tổn quân sự và chi phí duy trì đồn trú theo ngày. |
| **`turret`** | Tháp Phòng Thủ | `DEFENSE` | **EXTEND** | Tăng 260 điểm phòng thủ căn cứ (`baseDefense`) mỗi cấp. | Hệ thống pháo đài phòng thủ Sector, đóng góp vào `fortificationLevel` và khả năng kháng cự giảm nhẹ thiệt hại khi bị bao vây (`under_siege`). | Chưa có công thức quy đổi từ điểm phòng thủ sang hệ số giảm đe dọa (Threat Mitigation). |
| **`shipyard`** | Xưởng Đóng Tàu | `MILITARY` / `INDUSTRIAL` | **KEEP SEPARATE** | Giảm chi phí đóng Gear (-5%/cấp, tối đa -40%), tăng sức chứa Gear (+1/cấp). | Giữ riêng ở Core Base cho phi đội người chơi; WORLD sử dụng cơ chế mua sắm khung thân thay thế (Procurement Queue) qua Ngân khố Quốc gia. | Chưa chốt thời gian đóng tàu chiến lược theo chu kỳ ngày. |
| **`finance`** | Trung Tâm Tài Chính | `ECONOMIC` | **KEEP SEPARATE** | Sinh 250 credits/ngày/cấp; tăng điểm phồn vinh (`prosperity`). | Giữ nguyên tại Player Base; WORLD thu thuế qua hệ thống Ngân khố Quốc gia (`National Treasury`) theo chu kỳ tài khóa. | Chưa có tỷ lệ điều tiết ngân sách từ trung ương về địa phương. |
| **`alliance`** | Khu Liên Hợp Liên Minh | `SPECIAL` | **KEEP SEPARATE** | Tăng sức chứa hạm đội (+1 Gear/cấp). | Giữ nguyên tại Player Base phục vụ hạm đội liên minh cá nhân. | Không áp dụng cho cấu trúc Sector. |
| **`residential`** | Khu Dân Cư | `CIVIL` | **EXTEND** | Tăng 0.5% tăng dân số, +60 quân số, +100 credits/ngày mỗi cấp. | Khu phức hợp dân sinh đô thị của Sector, xác định sức chứa dân cư tối đa và thu hút di dân tị nạn an toàn. | Tuyệt đối không dùng công thức tăng % dân số vô hạn; phải tuân thủ Invariant bảo toàn dân số Zero-Sum của `DemographicsState`. |
| **`trade`** | Khu Giao Dịch | `ECONOMIC` | **KEEP SEPARATE** | Tạo 400 credits, 40 hợp kim, 1 tinh thể mỗi ngày; tăng phồn vinh. | Giữ ở Core Base phục vụ buôn bán trang bị cá nhân của Chỉ huy. | Không can thiệp vào phân bổ 5 tài nguyên chiến lược của WORLD. |
| **`entertainment`** | Khu Vui Chơi | `SPECIAL` / `CIVIL` | **KEEP SEPARATE** | Sinh 500 credits/ngày/cấp; tăng phồn vinh. | Giữ ở Core Base phục vụ mức độ thỏa mãn cá nhân. | Chưa có cơ chế chỉ số ổn định (Stability) liên kết với công trình này tại Sector. |

---

## 4. DANH MỤC CÁC CƠ SỞ CHIẾN LƯỢC QUY HOẠCH CHO WORLD (PLANNED WORLD FACILITIES)

Các công trình được thiết kế mới hoặc chuẩn hóa cho bản đồ thiên hà (Sector Facilities) mà không làm duplicate Core Game:

### 1. Trung Tâm Tìm Kiếm & Cứu Nạn (`SAR_CENTER`)
- **Category:** `RESCUE`
- **Chức năng:** Tăng tỷ lệ giải cứu phi công thoát hiểm (`facilityRescuePowerBonusPerTier`), giảm thời gian trinh sát vị trí rơi (Crash Site Discovery).
- **Mối liên hệ:** Trực tiếp phục vụ Phase 6.34C–6.34G (Pilot Survival & Search-and-Rescue).

### 2. Xưởng Sửa Chữa & Bảo Dưỡng Cơ Giáp (`REPAIR_BAY`)
- **Category:** `LOGISTICS`
- **Chức năng:** Hiện thực hóa `FacilityRepairCapacityPerDay`, cung cấp thông lượng sửa chữa kỹ thuật và tiếp nhận thợ máy (`ActiveTechnicalWorkers`).
- **Mối liên hệ:** Phục vụ Phase 6.35 (GEAR Logistics & Retreated Airframe Repair).

### 3. Bến Neo Đậu Tàu Cứu Hộ (`RESCUE_DOCK`)
- **Category:** `RESCUE` / `LOGISTICS`
- **Chức năng:** Trạm tiếp liệu, nạp năng lượng và bảo trì chuyên biệt cho Tàu Cứu Hộ (Rescue Ships), đảm bảo đạt tiêu chuẩn xuất kích Condition = 1.00.

### 4. Học Viện Sĩ Quan & Đào Tạo Kỹ Thuật (`ACADEMY_COMPLEX`)
- **Category:** `TRAINING`
- **Chức năng:** Hiện thực hóa các chương trình đào tạo dài hạn (FREESKA: 5 năm) và ngắn hạn (NEWHORIZON: 53 ngày), cung cấp nguồn bổ sung cho Regular Forces và Logistics Workforce.
- **Mối liên hệ:** Phục vụ Phase 6.36–6.38.

### 5. Trung Tâm Y Tế & Phục Hồi Tâm Lý (`MEDICAL_CENTER`)
- **Category:** `MEDICAL`
- **Chức năng:** Thực hiện giai đoạn 1 của quy trình phục hồi phi công sống sót: Phục hồi tâm lý (Psychological Recovery: 3 ngày) trước khi chuyển sang tái cấp khí tài.

### 6. Pháo Đài Phòng Thủ Sector (`FORTIFICATION_BASTION`)
- **Category:** `DEFENSE`
- **Chức năng:** Đại diện cho `sector.fortificationLevel` (Cấp 1–10), làm chậm tốc độ tăng Threat của The Void và tăng khả năng trụ vững khi bị vây hãm.

---

## 5. CƠ CHẾ NĂNG LỰC SỬA CHỮA DÙNG CHUNG (SHARED REPAIR CAPACITY MECHANICS)

### 5.1. Năng lực sửa chữa căn cứ (Base Shared Repair Capacity)
Tại mọi căn cứ hoặc trạm không gian có cơ sở sửa chữa:

```text
BaseInstallationRepairHpDay =
    FacilityRepairCapacityPerDay
    + WorkerRepairCapacityPerDay

WorkerRepairCapacityPerDay =
    ActiveTechnicalWorkers
    * TechnicalWorkerRepairHPPerDay
```

- **Quy tắc phân bổ:** Năng lực này dùng chung cho cả **Combat HP Repair** (sửa chữa thiệt hại vật lý sau chiến đấu) và **Maintenance Condition HP Restore** (phục hồi hao mòn kỹ thuật).
- **Thứ tự ưu tiên:**
  - **Priority 1 (Ưu tiên tuyệt đối):** Combat HP Repair. Khí tài hư hỏng chiến đấu luôn được sửa trước.
  - **Priority 2 (Ưu tiên thứ cấp):** Scheduled Maintenance. Chỉ được hấp thụ phần thông lượng dư thừa sau khi đã hoàn tất Combat Repair.
  - Cấu hình tỷ lệ phân bổ linh hoạt qua AdminCP (ví dụ: 70% Combat / 30% Maintenance).

### 5.2. Năng lực sửa chữa trên Tàu Mẹ / Soái Hạm (Ship Repair Capacity)
Các tàu chiến cỡ lớn (Mother Ship, Command Ship, Rescue Ship) có phân xưởng cơ khí và đội ngũ kỹ thuật viên riêng:

```text
ShipRepairCapacityPerDay =
    ShipFacilityRepairCapacityPerDay
    + ShipWorkerRepairCapacityPerDay

ShipWorkerRepairCapacityPerDay =
    ActiveShipTechnicalWorkers
    * TechnicalWorkerRepairHPPerDay
```

- **Tính kế thừa:** Không xây dựng một engine sửa chữa thứ hai; tái sử dụng toàn bộ semantics và logic tính toán của Base.
- **Hệ số hiệu suất bảo trì trên tàu (Ship Maintenance Efficiency):**
  - Cấu hình độc lập: `ShipMaintenanceEfficiencyRatio = 1.5` (Approved Default).
  - Không tự động dẫn xuất từ Base ratio.
  - Công thức bảo trì kỹ thuật trên tàu:
    ```text
    ShipConditionRepairPerDay =
        AllocatedShipMaintenanceRepairCapacity
        * ShipMaintenanceEfficiencyRatio
    ```

---

## 6. DANH MỤC THÔNG SỐ CHƯA GIẢI QUYẾT (UNRESOLVED BALANCE)

Tuyệt đối không tự bịa đặt số liệu cân bằng cho các tham số sau trong quá trình triển khai:
1. `FacilityRepairCapacityPerDay` định mức cho từng cấp độ công trình.
2. `TechnicalWorkerRepairHPPerDay` (đơn vị HP/người/ngày chính thức của WORLD).
3. Chi phí xây dựng và thời gian thi công tính bằng ngày chiến lược cho từng Facility trong Sector.
4. Mức trần dung lượng lưu trữ tối đa (`storageCapacity`) của từng loại kho bãi vĩ mô.
5. Tỷ lệ điều tiết thuế cụ thể từ Ngân khố Quốc gia chuyển về ngân sách xây dựng địa phương.

---
*Tài liệu Catalog được đóng băng an toàn làm chuẩn đối chiếu kiến trúc cho các Phase tiếp theo.*
