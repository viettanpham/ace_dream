# STARFRONT WORLD V2 — FND8 CHARACTER DATA INTEGRATION CHECKPOINT (PHASE 1)

**Trạng thái:** PHASE 1 IMPLEMENTED & TESTED (Dừng đúng ranh giới Phase 1; chưa triển khai Phase 2)  
**Phạm vi:** FND-1 SYSTEM Catalog Bootstrap cho Pilot Class, Pilot Trait và GEAR Compatibility placeholder  
**Tài liệu nguồn đối chiếu:** `docs/foundations/FND8/8.2.3.E0/FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md`, `lib/game/world/catalog/*`, `lib/game/v2/content-config.ts`, `lib/game/v2/content-release-resolver.ts`

---

## 1. HIỆU CHÍNH KIỂM TOÁN TRAIT (AUDIT CORRECTION — TRƯỚC TRIỂN KHAI)

Tổng số **26 Trait** thuộc 12 Class `C01–C12` được phân loại lại chính xác theo trạng thái giá trị số hiện hành (không còn nhầm lẫn `UNSET = 16` hay xếp Victor vào D1):

| Trạng thái giá trị số (`valueApprovalStatus`) | Số lượng | Danh sách Trait (`pilotId.traitId`) | Ghi chú kỷ luật dữ liệu |
|---|---:|---|---|
| **D1 Prototype (`D1_PROTOTYPE`)** | **2** | `lyra.pilot_trait_freeflight` (+3 pp), `selena.pilot_trait_energy_focus` (+6% rel) | Chỉ là `candidateValue` nguyên mẫu; `value` runtime bắt buộc `null`. |
| **D2 Test Default (`D2_TEST_DEFAULT`)** | **4** | `marcus.pilot_trait_defensive_read` (+50% rel), `kaelen.pilot_trait_shadow_approach` (+30 pp), `rhea.pilot_trait_escort_guard` (+50% rel), `nova.pilot_trait_testflight_strike` (+100% rel) | Chỉ là `candidateValue` mặc định thử nghiệm; bị chặn thực thi tại Combat V2. |
| **D3 Proposed / Under Review (`D3_PROPOSED_UNDER_REVIEW`)** | **10** | `victor.pilot_trait_shield_anchor` (+10% rel, thay thế D1 +8%), `kaelen.pilot_trait_operational_instinct` (+20% rel), `selena.pilot_trait_resonant_cast` (-30% cost), `valentine.pilot_trait_field_medic` (+50% rel), `valentine.pilot_trait_safeguard` (+30% rel), `fortuna.pilot_trait_calculated_chance` (+30% rel), `fortuna.pilot_trait_fortunate_timing` (+15 pp), `aria.pilot_trait_power_economy` (-15% cost), `aria.pilot_trait_tactical_recovery` (+30% rel), `nova.pilot_trait_highrisk_instinct` (+25% rel) | Không xếp `victor.pilot_trait_shield_anchor` vào D1 vì bảng D3 (+10%) đã thay thế giá trị D1 (+8%). |
| **UNSET (`UNSET`)** | **10** | `alviss.pilot_trait_aerial_precision`, `alviss.pilot_trait_evasive_entry`, `eric.pilot_trait_siege_pressure`, `eric.pilot_trait_armor_piercer`, `marcus.pilot_trait_fire_discipline`, `marcus.pilot_trait_command_focus`, `victor.pilot_trait_armor_resilience`, `kaelen.pilot_trait_intelligence_edge`, `lyra.pilot_trait_recovery_maneuver`, `rhea.pilot_trait_reactive_dodge` | `candidateValue: null`, `value: null`. |
| **CANON_LOCKED** | **0** | *(chưa có)* | Chưa có Trait nào được khóa Canon để đưa vào `value` thực thi. |
| **Tổng cộng** | **26** | **2 + 4 + 10 + 10 = 26** | **100% `isExecutableModifier: false` và `value: null`.** |

### Phân tách 3 tầng phê duyệt bắt buộc
1. **Identity / Name / Classification (`identityApprovalStatus: "APPROVED"`):** ID chuẩn (`pilot_trait_*`), tên hiển thị tiếng Việt, `ownerClassId`, `loreClassification` (`PASSIVE | CONDITIONAL | SIGNATURE`) và `executionMode` (`PASSIVE | CONDITIONAL`). Tuyệt đối không dùng `"Active"` làm category hoặc execution mode.
2. **Candidate Numerical Values (`candidateValue`):** Giá trị đề xuất D1 / D2 / D3 lưu tách biệt ở metadata không thực thi (`candidateValue`, `candidateValueUnit`, `candidateValueSource`), không bao giờ tự động nâng cấp thành Canon.
3. **Canon-Locked Executable Values (`value`):** Luôn giữ `null` khi `valueApprovalStatus !== "CANON_LOCKED"` hoặc `combatV2SupportStatus !== "SUPPORTED"`.

---

## 2. TÀI SẢN PHASE 1 ĐÃ TẠO

### A. 3 FND-1 SYSTEM Catalog JSON (`/data/catalogs/`)
1. `data/catalogs/system_pilot_class_data.json` (`configFileId: "system_pilot_class"`, `domain: "pilot"`, `catalogName: "class"`)
   - **12 bản ghi** `PILOT_CLASS_C01` .. `PILOT_CLASS_C12`, ánh xạ 1-1 với CDN `pilotId` (`alviss` .. `nova`).
   - Toàn bộ ma trận 20 điểm được giữ nguyên tại `proposedBaseAttributes` với `baseAttributesApproval: "PROPOSED_UNLOCKED"` và `baseAttributes: null`.
   - Không chứa/tự bịa `fullName`, `age`, `callsign`, `origin`, `training`, hoặc `biography`.
2. `data/catalogs/system_pilot_trait_data.json` (`configFileId: "system_pilot_trait"`, `domain: "pilot"`, `catalogName: "trait"`)
   - **26 bản ghi** `pilot_trait_*` chuẩn từ proposal doc.
   - Đủ `requiredPredicate` và đánh dấu `combatV2SupportStatus: "DEFERRED_MISSING_COMBAT_CONTRACT"`.
   - 100% `value: null`, `isExecutableModifier: false`.
3. `data/catalogs/system_gear_compatibility_data.json` (`configFileId: "system_gear_compatibility"`, `domain: "gear"`, `catalogName: "compatibility"`)
   - `items: []`, `metadata.status: "PENDING_FND8_6_GEAR_CATALOG"`.
   - Không chứa bất kỳ GEAR V1, xếp hạng tương thích, hoặc artwork V1 nào.

### B. FND-1 Schema, Contracts & Registry Integration (`/lib/game/world/pilot/`)
1. `lib/game/world/pilot/catalog-types.ts`
   - Định nghĩa `PilotClassDefinition`, `PilotTraitDefinition`, `GearCompatibilityDefinition`, và `PilotInstanceIdentityContract` (tách biệt rõ `characterClassId` Class Persona, `pilotInstanceId` UUID của Pilot Instance, và `cdnPilotKey` / `pilotId` CDN không đổi ngữ nghĩa).
2. `lib/game/world/pilot/registry-integration.ts`
   - Nạp trực tiếp 3 file JSON trong `data/catalogs/` làm nguồn sự thật duy nhất (Single Source of Truth), đăng ký vào `defaultCatalogRegistry` cho `pilot/class`, `pilot/trait`, và `gear/compatibility`.
   - Cung cấp 2 cổng an toàn runtime:
     - `getCanonicalCombatBaseAttributes()`: trả `null` trừ khi `baseAttributesApproval === "CANON_LOCKED"`.
     - `getExecutableTraitModifierValue()`: trả `null` trừ khi `valueApprovalStatus === "CANON_LOCKED" && isExecutableModifier && combatV2SupportStatus === "SUPPORTED"`.

### C. Kiểm thử Phase 1 (`/tests/world/`)
- `tests/world/phase-8-fnd1-pilot-catalogs.test.ts` (10/10 test PASS).

---

## 3. KẾT QUẢ KIỂM THỬ & XÁC MINH THỰC TẾ

| Hạng mục kiểm tra | Lệnh / Công cụ | Kết quả | Chi tiết xác minh |
|---|---|---|---|
| Phase 1 Catalog Suite | `npx tsx tests/world/phase-8-fnd1-pilot-catalogs.test.ts` | **PASS (10/10)** | 12 Class, 26 Trait (D1=2, D2=4, D3=10, UNSET=10, Victor ở D3), 0 orphan ref, ma trận 20đ `PROPOSED_UNLOCKED`, `baseAttributes=null`, `value=null`, `DEFERRED_MISSING_COMBAT_CONTRACT`, GEAR empty `PENDING_FND8_6_GEAR_CATALOG`, V1 & R4 intact. |
| V1 Compatibility Tests | `npx tsx tests/phase5-8-character-gear.test.ts && tests/character-lock-gating.test.ts && tests/phase5-9-pilot-synergy-skills.test.ts && tests/phase5-11-pilot-gear-flow.test.ts` | **PASS (100%)** | 15 + 5 + 18 + pass toàn bộ, exit code 0. |
| FND-1 / FND-5 / FND-7 | `npx tsx tests/world/phase-6-34a-fnd-1-shared-catalog.test.ts && tests/world/phase-7-1-fleet-catalogs.test.ts && tests/world/phase-6-34a-fnd-5-world-init.test.ts` | **PASS (100%)** | 24/24 + 12/12 + 7/7 (`bootstrapWorldCatalogs` giữ nguyên `20` WORLD catalogs, không bị side-effect). |
| V2 Dynamic CDN R4 | `npx tsx tests/v2-r4-dynamic-cdn.test.ts` | **PASS (100%)** | 12 Pilots, 297/297 Verified WebP, Valentine 42/42, giả lập R5 & Atomic Rollback PASS. |
| Build & Typecheck | `compile_applet` + `lint_applet` (`tsc --noEmit`) | **PASS** | `next build` thành công, `tsc --noEmit` 0 lỗi. |

### Bằng chứng bảo toàn V1 & CDN R4
- Không sửa đổi bất kỳ file nào thuộc V1 (`lib/game/data.ts`, `lib/game/progression.ts`), R4 (`lib/game/v2/content-config.ts`, `lib/game/v2/content-release-resolver.ts`, `lib/game/v2/character-profile-data.ts`), Combat V2 (`lib/game/world/combat-v2-engine.ts`, `lib/game/world/combat-v2-types.ts`), hay giao diện UI V2.
- Kiểm tra timestamp (`ls -la --time-style=full-iso`) xác nhận toàn bộ nhóm file trên giữ nguyên mốc thời gian trước Phase 1 (`2026-11-13 03:07–03:59 +0000`).

---

## 4. RANH GIỚI BLOCKERS & BƯỚC TIẾP THEO (CHỈ ĐỀ XUẤT PHASE 2)

### Blockers còn mở (thuộc các phase sau, không chặn Phase 1)
- Khóa Canon 20 điểm base attributes (`PROPOSED_UNLOCKED` → `CANON_LOCKED`) và khóa Canon giá trị số Trait (`D1/D2/D3/UNSET` → `CANON_LOCKED`).
- Bổ sung hợp đồng Combat V2 cho các predicate chưa tồn tại (`stealth/exposed/marked/escort/overcharge`, SP Energy, Pilot AGI evasion, Shield pool, Armor stage, action LUK buff).
- Bổ sung FND8.6 GEAR Catalog thay thế placeholder rỗng hiện tại.
- Quyết định Canon cho `fullName`, `age`, `callsign`, `origin`, `training`, `biography` của các Pilot (ngoài luồng R3 Valentine Story).

### Bước tiếp theo đề xuất (Phase 2 — Chờ chỉ thị IMPLEMENT riêng)
- Thiết kế & triển khai **`CharacterDataBridge` (Phase 2)** nối đọc từ `pilot/class`, `pilot/trait`, `gear/compatibility` trong FND-1 `CatalogRegistry` sang UI Profile V2 (`CharacterProfileV2`), thay dần dữ liệu Trait hardcoded cũ (`trait_supersonic_dash`, v.v.) và hiển thị minh bạch badge trạng thái `PROPOSED_UNLOCKED` / `DEFERRED_MISSING_COMBAT_CONTRACT` / `PENDING_FND8_6_GEAR_CATALOG` mà không thay đổi bất biến CDN R4 hay Combat V2.
