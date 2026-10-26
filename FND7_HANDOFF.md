# STARFRONT WORLD — FND-7 HANDOFF DOCUMENTATION
## TÀI LIỆU BÀN GIAO TIẾN ĐỘ & CHECKPOINT FND-7 (SHIP / FLEET FOUNDATION)

> **Mã bàn giao:** FND7-HANDOFF-PHASE-7.1  
> **Thời điểm lập:** 20/10/2026  
> **Chế độ thực thi:** IMPLEMENT ONE PHASE ONLY  
> **Trạng thái:** PHASE 7.1 HOÀN TẤT XÁC MINH (VERIFIED & TESTED)  
> **Độ sẵn sàng:** 100% Sẵn sàng để triển khai Phase 7.2  

---

### 1. CHECKPOINT HIỆN TẠI

- **Phase cuối đã hoàn thành:** **Phase 7.1: Master Data Catalogs & Schemas Foundation** (12/12 Unit tests PASS, Regression tests PASS, Build thành công).
- **Phase đang chờ triển khai:** **Phase 7.2: Ship Entity & Progression MK I–X Engine**.
- **Công việc đã code & verify:**
  * 7 danh mục Master Catalog canonical JSON tại `/data/catalogs/system_fleet_*_data.json`.
  * Hợp đồng TypeScript tại `lib/game/world/fleet/catalog-types.ts`.
  * Bộ tích hợp Catalog Registry & Seed Data tại `lib/game/world/fleet/registry-integration.ts`.
  * Điểm nạp tập trung `lib/game/world/bootstrap.ts` đã kết nối 7 danh mục fleet.
  * Test suite `tests/world/phase-7-1-fleet-catalogs.test.ts`.
- **Lỗi mở (Open Issues / Bugs):** `0` (Không có lỗi).
- **Trạng thái Môi trường (Cross-Account ENV Readiness):**
  * Đạt chuẩn **Zero-Config**: Không yêu cầu bất kỳ biến môi trường nào để chạy Public Preview (`/`, `/v1`, `/v2/pilots`, Gallery, Story Reader).
  * `.env.example` đã được làm sạch, chuyển toàn bộ biến nâng cao sang dạng chú thích, loại bỏ popup bắt buộc khi import tài khoản mới.
- **Trạng thái Typecheck & Build:**
  * `tsc --noEmit`: 0 lỗi.
  * Production Next.js build: Succeeded.

---

### 2. DANH SÁCH FILE ĐÃ THAY ĐỔI TRONG CHECKPOINT NÀY

| Đường Dẫn Tệp | Loại Thao Tác | Nội Dung & Mục Đích Nghiệp Vụ |
| :--- | :---: | :--- |
| `lib/game/world/fleet/catalog-types.ts` | **Tạo mới** | Định nghĩa interfaces và types cho 7 catalog của domain fleet. |
| `lib/game/world/fleet/registry-integration.ts` | **Tạo mới** | Dữ liệu canonical seed, hàm đăng ký registry và các query helpers. |
| `data/catalogs/system_fleet_fleet_type_data.json` | **Tạo mới** | 4 loại hạm đội tác chiến chuẩn tắc. |
| `data/catalogs/system_fleet_fleet_class_data.json` | **Tạo mới** | 5 bậc quy mô hạm đội MK I..MK V (4 đến 64 tàu). |
| `data/catalogs/system_fleet_ship_type_data.json` | **Tạo mới** | 7 phân lớp thân tàu chiến và vai trò chiến thuật. |
| `data/catalogs/system_fleet_ship_class_data.json` | **Tạo mới** | 5 bậc phẩm cấp công nghệ đóng tàu MK I..MK V. |
| `data/catalogs/system_fleet_ship_definition_data.json` | **Tạo mới** | 5 bản thiết kế tàu chuẩn (HP, Shield, Speed, Crew, Slots, Cost). |
| `data/catalogs/system_fleet_policy_profile_data.json` | **Tạo mới** | Chính sách quốc gia VSS (Decay 360 ngày, trần 50%, trợ cấp $10 \times Tier$). |
| `data/catalogs/system_fleet_frame_award_catalog_data.json` | **Tạo mới** | 4 biểu mẫu khen thưởng chiến công và cứu nạn SAR. |
| `lib/game/world/bootstrap.ts` | **Cập nhật** | Tích hợp `registerFleetCatalogs` vào `bootstrapWorldCatalogs()`. |
| `tests/world/phase-7-1-fleet-catalogs.test.ts` | **Tạo mới** | Bộ kiểm thử 12/12 mục cho Phase 7.1. |
| `docs/progress/FND7_PROGRESS.md` | **Tạo mới** | Bảng theo dõi tiến độ chi tiết từng giai đoạn. |
| `docs/progress/FND7_HANDOFF.md` | **Tạo mới** | Tài liệu bàn giao này. |

---

### 3. CÁC FILE CẦN THỰC HIỆN Ở PHASE TIẾP THEO (PHASE 7.2)

Khi bắt đầu lượt tiếp theo, kỹ sư / AI Studio sẽ triển khai **Phase 7.2: Ship Entity & Progression Engine**:

1. **`lib/game/world/ship/ship-entity.ts`**:
   - Hàm khởi tạo `createShipInstance(definitionId: string, customName?: string, fleetId?: string): ShipInstance`.
   - Quản lý HP, Shield, Slot layout, Module gắn vào và độ bền `condition`.
2. **`lib/game/world/ship/ship-progression.ts`**:
   - Tích hợp `ProgressionEntity` từ FND-2 Progression Engine.
   - Hàm tính toán EXP từ dặm bay tuần tra (`mileageExp`) và giao tranh (`combatExp`).
   - Xử lý khóa thăng cấp (`AWAITING_UPGRADE`) khi chạm giới hạn Tier và kiểm tra điều kiện thăng cấp Tier Breakthrough.
   - Kích hoạt Capstone `MAX TIER BONUS` khi tàu đạt mốc MK X Level 50.
3. **`lib/game/world/ship/ship-maintenance.ts`**:
   - Hao mòn `condition` theo dặm bay và hư hại chiến trận.
   - Cơ chế sửa chữa đại tu tại Căn cứ sử dụng Docking Ports và vật tư `logisticsSupplies`.
4. **`tests/world/phase-7-2-ship-progression.test.ts`**:
   - Kiểm thử độc lập vòng đời tàu chiến, thăng cấp, khóa tier và sửa chữa.

---

### 4. NGUYÊN TẮC BẢO VỆ TOÀN VẸN HỆ THỐNG
- **Không Reset WORLD**: Giữ nguyên toàn bộ save game và tiến trình đang chơi.
- **Không tạo Engine song song**: Tái sử dụng triệt để `ProgressionEntity` của FND-2 và `CatalogRegistry` của FND-1.
- **Tiếp tục theo đúng hợp đồng**: Mọi logic đã được đặc tả trong `docs/foundations/FND7_SHIP_FLEET_FEATURE.md`.

---

### 5. TRẠNG THÁI GIAO DIỆN V2 ĐỒNG HÀNH (FND8.2.3.x CHARACTER PROFILE BASIC)
- **Đã hoàn thiện:** Character Profile Basic cho 12 phi công canonical (`alviss`, `eric`, `marcus`, `victor`, `kaelen`, `lyra`, `selena`, `valentine`, `fortuna`, `aria`, `rhea`, `nova`).
- **Khắc phục lỗi dữ liệu:** Loại bỏ hoàn toàn các trường dữ liệu hardcode riêng của Valentine khỏi giao diện của các phi công khác; Faction/Division, Badges, Traits, Base Attributes, Dossier và Ma trận tương thích cơ giáp (Gear Compatibility) đều hoạt động theo cơ chế động 100%.
- **CDN R3 Gallery & Story:** Tích hợp trơn tru, hiển thị đầy đủ bộ ảnh và danh mục 7 chương canonical kèm trạng thái Đang Phát Triển / Coming Soon minh bạch.

---

### 6. BẢO TRÌ NGUỒN CUỐI CÙNG (SOURCE MAINTENANCE FINAL)
- **Xử lý triệt để Popup ENV AI Studio:** Chuyển 2 biến `NEXT_PUBLIC_ASSET_STORAGE_MODE` và `NEXT_PUBLIC_ASSET_CDN_URL` trong `.env.example` sang dạng hướng dẫn có chú thích (`#`). Nền tảng AI Studio không còn phát hiện biến bắt buộc un-commented để kích hoạt modal.
- **Giá trị mặc định an toàn tuyệt đối:** Source code có sẵn hardcoded fallback chuẩn jsDelivr R3 (`v3.0-assets-r3`). Ứng dụng chạy trơn tru 100% khi `process.env` hoàn toàn không có biến nào.
- **Tối ưu tài liệu Markdown:** Tạo bản lưu trữ danh mục `docs/DOCUMENTATION_ARCHIVE_MANIFEST.md` phân loại chi tiết 62 tệp Markdown (4 tệp runtime/tests giữ nguyên, 24 tệp quy chuẩn canonical giữ nguyên, 3 tệp bàn giao giữ nguyên, 31 tệp báo cáo lịch sử sẵn sàng chuyển giao khi có kho ngoài). Không tự xóa tài liệu trong repo.
- **Kiểm chứng hoàn tất:** Test clean-env PASS, test 12 phi công PASS, `tsc --noEmit` PASS, `compile_applet` PASS.

---

### 7. HOÀN THIỆN STORY READER POLISH & ADMINCP V1 / V2 VERSION SWITCH
- **Story Reader & Navigation**:
  * Đã xác minh toàn bộ Chapter 01–07 của 12 Pilot (và 10 Chapter của Valentine) đều nhấn mở được vào Story Reader từ cả Profile Desktop và Mobile.
  * Chương chưa có văn xuôi hiển thị trang **ĐANG PHÁT TRIỂN // COMING SOON** sạch sẽ với icon đồng hồ `Clock`, tiêu đề, tóm tắt bối cảnh đã kiểm chứng; không có biểu tượng khóa `Lock` gây hiểu nhầm.
  * Chỉ chương có `isHidden=true` mới bị lọc khỏi public catalog.
  * Điều hướng từ Character Profile sang Story Reader giữ đúng `pilotId` và `chapterId` được chọn. Không tạo văn xuôi giả và không làm thay đổi trạng thái biên tập.
- **AdminCP V1 / V2 Version Switcher**:
  * Tích hợp bộ chuyển đổi phiên bản `[ V1: SYSTEM & WORLD ] | [ V2: CHARACTERS (12) ]` rõ ràng trên header của AdminCP (`/v2/admin`).
  * Chọn `V1: SYSTEM & WORLD`: Mở `V1AdminWorkspace` quản trị hệ thống V1 thực tế (World Engine 30-Node Simulator, Tick Advancement, Speed Controls, Event Strategy Policy, Pilot Survival, Fleet Registry, Progression & Synergy Skills Level Cap, Reroll Tokens, Asset Version Releases & Audit).
  * Chọn `V2: CHARACTERS (12)`: Mở `CharacterContentManager` quản lý nội dung 12 Pilot canonical.
  * Giữ nguyên auth, session, permissions và dữ liệu độc lập của từng phiên bản; không làm lẫn lộn dữ liệu giữa V1 và V2.
- **Kết quả kiểm thử**:
  * Bộ test `tests/verify-story-ui-and-admin-switch.ts`: 19/19 tests PASS.
  * Endpoints Valentine Ch01, Ch02, Ch03, Ch07, Ch10 và Fortuna Ch01, Ch07: PASS (HTTP 200, `isComingSoon: true`).
  * `tsc --noEmit` PASS (0 errors), `compile_applet` PASS (Build succeeded).



