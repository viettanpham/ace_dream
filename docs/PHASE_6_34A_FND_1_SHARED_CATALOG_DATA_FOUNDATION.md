# STARFRONT WORLD — PHASE 6.34A-FND-1
# SHARED CATALOG / MASTER DATA FOUNDATION

> **TÀI LIỆU BÀN GIAO KIẾN TRÚC & TRIỂN KHAI NỀN TẢNG (HANDOFF ARCHITECTURE)**  
> **Trạng thái:** HOÀN TẤT (DONE)  
> **Phạm vi:** Nền tảng Master Data & Shared Catalog chung cho SHIP, BUILDING, MODULE, ITEM, TACTIC, PROGRESSION, AWARD, PERSONNEL, LOGISTICS. Không can thiệp gameplay cụ thể.

---

## 1. CÁC TẬP TIN ĐÃ TẠO VÀ CẬP NHẬT (FILES CHANGED)

### Thư mục triển khai mới: `lib/game/world/catalog/`
1. `lib/game/world/catalog/types.ts`: Định nghĩa types, contracts, schema versions, lifecycle states (`ACTIVE`, `DEPRECATED`, `RETIRED`), provenance, override structures, node modes (`INLINE`, `SPLIT`), diagnostic error codes.
2. `lib/game/world/catalog/file-naming.ts`: Quy chuẩn đặt tên `system_<domain>_<catalog>_data.json` & `user_<domain>_<catalog>_data.json`; kiểm tra tiền tố cây phân cấp (child prefix extension), cấm tham chiếu chéo domain.
3. `lib/game/world/catalog/storage-provider.ts`: Giao diện `ICatalogDataProvider` và 2 provider thực thi: `InMemoryCatalogDataProvider` (cho test/mock) và `LocalStorageCatalogDataProvider` (cho trình duyệt).
4. `lib/game/world/catalog/loader.ts`: Bộ tải đệ quy hỗ trợ `INLINE` & `SPLIT`, kiểm tra chu trình (`cycleDetection`), giới hạn độ sâu (`maxDepth`), và cơ chế chịu lỗi bằng cách bỏ sót (Fail-soft by omission).
5. `lib/game/world/catalog/resolver.ts`: Động cơ hòa giải và hợp nhất: thực thi luật Global Unique ID (từ chối trùng ID, không ghi đè âm thầm), áp dụng field-level USER override, phát hiện `ORPHAN_OVERRIDE`, hỗ trợ hàm `resetUserOverride` và `addUserCustomItem`.
6. `lib/game/world/catalog/lifecycle.ts`: Quản lý vòng đời phần tử (`ACTIVE`, `DEPRECATED`, `RETIRED`), lọc phần tử cho UI selector và kiểm tra tính hợp lệ tham chiếu.
7. `lib/game/world/catalog/derived-data.ts`: Kỷ luật tách biệt dữ liệu nhập tác giả (Authored) và dữ liệu suy dẫn (Derived), lọc bỏ trường suy dẫn trước khi lưu trữ master JSON.
8. `lib/game/world/catalog/registry.ts`: Quản lý tập trung các Catalog (`CatalogRegistry`), bộ nhớ đệm, tích hợp lưu trữ User file, và nhật ký chẩn đoán lỗi cho AdminCP.
9. `lib/game/world/catalog/index.ts`: Barrel export toàn bộ public API của catalog foundation.

### Tích hợp và Kiểm thử:
- `lib/game/world/index.ts`: Re-export catalog module.
- `tests/world/phase-6-34a-fnd-1-shared-catalog.test.ts`: Bộ kiểm thử 21 test cases tự động bao quát toàn bộ 20 trường hợp yêu cầu.

---

## 2. KIẾN TRÚC TRIỂN KHAI (ARCHITECTURE IMPLEMENTED)

### 2.1. Thứ tự nạp và phân giải chuẩn tắc:
```text
SYSTEM canonical data
  ↓
USER custom & overrides (user_<domain>_<catalog>_data.json)
  ↓
Validation & Prefix hierarchy checks
  ↓
Field-level override application (targetId matching)
  ↓
Resolved Catalog (with full provenance & canonical baseline)
  ↓
Runtime / AdminCP UI
```

### 2.2. Hợp đồng tệp gốc (Root File Contract):
Mỗi catalog có một tệp gốc ổn định. Hỗ trợ 2 chế độ:
- **`INLINE`**: Tệp chứa trực tiếp danh sách `items: []`.
- **`SPLIT`**: Tệp chứa danh sách tham chiếu phân vùng `partitions: [{ ref: "..." }]`. Phân vùng con có thể tiếp tục là `INLINE` hoặc `SPLIT` tạo thành cây đệ quy đa tầng.

### 2.3. Quy tắc kiểm tra phân cấp tệp (File Tree Validation):
- Tên nút (`configFileId`) của tệp con bắt buộc phải mở rộng tiền tố của tệp cha (ví dụ: `system_fleet_ship_definition` $\rightarrow$ `system_fleet_ship_definition_rescue`).
- Không cho phép tham chiếu chéo miền (`fleet` $\rightarrow$ `building`).
- Bảo vệ chống lặp vô tận bằng `visitedAncestors` (cycle detection) và bộ đếm `maxDepth` (mặc định 16).

### 2.4. Giao diện tiêu thụ thống nhất (Unified Resolved Consumer API):
Để đảm bảo các hệ thống runtime, UI và logic nghiệp vụ không phải tự nạp JSON, tự ghép USER/SYSTEM, hay quan tâm đến cấu trúc phân vùng tệp:
- `getCatalog(domain, catalogName, options)`: Lấy toàn bộ Resolved Catalog đã giải quyết đầy đủ.
- `getItem(domain, catalogName, id)`: Lấy trực tiếp một resolved item theo ID duy nhất.
- `resolveById(domain, catalogName, id)`: Alias chuẩn hóa cho `getItem`.
- `getResolvedItems(domain, catalogName, options)`: Lấy mảng resolved items có hỗ trợ lọc theo trạng thái vòng đời (`ACTIVE`, `DEPRECATED`, `RETIRED`).
- Các hàm trên được cung cấp qua cả đối tượng `CatalogRegistry` (hỗ trợ dependency injection) và các hàm standalone toàn cục (`defaultCatalogRegistry`).

---

## 3. CƠ CHẾ GHI ĐÈ & QUẢN TRỊ DỮ LIỆU (OVERRIDE & DATA MERGE RULES)

### 3.1. Quy tắc ID duy nhất toàn cục (Global Unique ID Rule):
- Trong cùng phạm vi một catalog, `id` là khóa duy nhất tuyệt đối.
- Nếu xuất hiện trùng ID trong SYSTEM: từ chối phần tử thứ hai, ghi nhận lỗi `DUPLICATE_SYSTEM_ID`. Tuyệt đối không ghi đè âm thầm (silent overwrite) hoặc gộp tự động.
- Nếu USER thêm item có ID trùng với SYSTEM: từ chối và ghi nhận `USER_ID_COLLIDES_WITH_SYSTEM_ID` (yêu cầu người dùng dùng cơ chế field-level override).
- Nếu USER thêm item có ID trùng với USER item khác: từ chối và ghi nhận `DUPLICATE_USER_ID`.

### 3.2. Ghi đè cấp trường của người dùng (Field-Level User Override):
- SYSTEM data là bất biến đối với AdminCP chỉnh sửa thông thường.
- Dữ liệu chỉnh sửa được lưu vào `user_<domain>_<catalog>_data.json` dưới dạng:
  ```json
  {
    "targetId": "SHIP_A",
    "modifiedData": { "baseCrew": 220 },
    "modifiedAt": "2026-10-16T12:00:00Z"
  }
  ```
- Chỉ lưu những trường thực sự bị thay đổi, không lưu snapshot toàn bộ.
- Phân giải: Lấy canonical SYSTEM làm gốc $\rightarrow$ đắp các trường trong `modifiedData` $\rightarrow$ tạo ra bản Resolved.
- Hỗ trợ hàm `resetUserOverride(userFile, targetId)` để xóa override và tự động trở về giá trị gốc của SYSTEM.
- **Orphan Override:** Nếu override nhắm vào một SYSTEM item đã bị xóa hoặc không tìm thấy, hệ thống ghi nhận `ORPHAN_OVERRIDE` vào diagnostics, không tự ý hồi sinh phần tử.

### 3.3. Vòng đời phần tử SYSTEM (Lifecycle):
- `ACTIVE`: Hoạt động bình thường, xuất hiện trong các bộ chọn để tạo instance mới.
- `DEPRECATED`: Vẫn hoạt động nhưng có cảnh báo, không khuyến khích tạo mới.
- `RETIRED`: Ẩn khỏi các bộ chọn tạo mới; các tham chiếu cũ trong save game hoặc runtime vẫn phân giải được bình thường.

---

## 4. NGUYÊN TẮC CHỊU LỖI BẰNG BỎ SÓT (FAIL-SOFT BY OMISSION)

- **Không bao giờ làm sập (crash) WORLD:**
  - Nếu tệp gốc thiếu hoặc hỏng cú pháp: Trả về catalog rỗng (`items = []`), ghi nhận lỗi chẩn đoán `ROOT_FILE_MISSING` / `ROOT_FILE_MALFORMED`, WORLD tiếp tục chạy.
  - Nếu một phân vùng (`partition`) thiếu hoặc hỏng cú pháp: Bỏ qua riêng phân vùng đó, các phân vùng hợp lệ khác vẫn được nạp đầy đủ.
  - Nếu một phần tử thiếu trường cấu trúc bắt buộc (`id`): Bỏ qua phần tử đó, ghi nhận `ITEM_MISSING_ID`, các phần tử còn lại nạp bình thường.
  - Nếu một custom item của USER bị lỗi: Bỏ qua riêng item đó, toàn bộ SYSTEM catalog vẫn hoạt động nguyên vẹn.

---

## 5. NGUỒN GỐC & DỮ LIỆU TÁC GIẢ VS SUY DẪN (PROVENANCE & AUTHORED DATA)

- Mỗi phần tử resolved đều mang siêu dữ liệu `provenance`:
  - `sourceType`: `"SYSTEM" | "USER"`
  - `sourceFile`: Tên tệp nguồn
  - `sourceCatalogId`: ID cấu hình nguồn
  - `sourceDataVersion`: Phiên bản dữ liệu
  - `isOverridden`: Đánh dấu có bị user override hay không
  - `overrideSource`: Tệp nguồn override
  - `modifiedAt`: Thời điểm chỉnh sửa
  - `_canonical`: Bản sao lưu snapshot ban đầu phục vụ chức năng so sánh Default vs Resolved và nút RESET trong AdminCP.
- Dữ liệu suy dẫn (Derived values như `currentCrew`, `requiredCrewMin`, các trường có tiền tố `$` hoặc `__`) được tự động loại bỏ (`stripDerivedFields`) trước khi lưu trữ vào master JSON.

---

## 6. KẾT QUẢ KIỂM THỬ (TEST SUITE VERIFICATION)

Đã triển khai và thực thi thành công bộ test suite:
`tests/world/phase-6-34a-fnd-1-shared-catalog.test.ts` (23/23 subtests **PASS 100%**):

1. `INLINE root load` — PASS
2. `SPLIT root load` — PASS
3. `Recursive SPLIT` — PASS
4. `Invalid child prefix` — PASS
5. `Cycle reference detected & skipped` — PASS
6. `Missing partition skipped` — PASS
7. `Malformed partition skipped` — PASS
8. `Duplicate SYSTEM ID rejected` — PASS
9. `Duplicate USER ID rejected` — PASS
10. `USER ID collides with SYSTEM ID rejected` — PASS
11. `Field-level USER override` — PASS
12. `RESET override to default` — PASS
13. `User item invalid skips only that item` — PASS
14. `System item invalid omitted while rest loads` — PASS
15. `Root missing returns empty catalog without crash` — PASS
16. `Provenance correctness` — PASS
17. `ACTIVE / DEPRECATED / RETIRED behavior` — PASS
18. `Additive schema compatibility` — PASS
19. `Derived fields stripped before persisting` — PASS
20. `Deterministic resolve result` — PASS
21. `CatalogRegistry full roundtrip with overrides and custom items` — PASS
22. `Unified Resolved API: getItem, resolveById, getResolvedItems with lifecycle filtering` — PASS
23. `Fail-soft error handling: root/partition/item corruption never crashes WORLD` — PASS

---

## 7. ĐÁNH GIÁ TƯƠNG THÍCH V1 & ĐIỂM KẾT NỐI TIẾP THEO

- **Tương thích V1:** Hoàn toàn không gây xung đột (zero regression) với mã nguồn V1 hiện hành. Tất cả các test suite cũ (`phase-6-34-pilot-survival.test.ts`, v.v.) và toàn bộ Next.js Applet đều build thành công 100%.
- **Hạn chế đã biết (Known Limitations):** Chưa tích hợp UI AdminCP visual editor cho master catalogs (nằm ngoài phạm vi của Phase Foundation).
- **Điểm kết nối tiếp theo được khuyến nghị (Next Integration Points):**
  - Khai báo catalog root files chuẩn cho `fleet_ship_definition` và `base_building_definition`.
  - Tích hợp tab Master Data Catalog Viewer vào `AdminSettingsModal` cho AdminCP.
