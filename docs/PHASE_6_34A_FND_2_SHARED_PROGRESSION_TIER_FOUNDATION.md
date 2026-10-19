# STARFRONT WORLD — PHASE 6.34A-FND-2
# SHARED PROGRESSION & TIER BOUNDARY FOUNDATION

> **TÀI LIỆU BÀN GIAO KIẾN TRÚC & TRIỂN KHAI NỀN TẢNG (HANDOFF ARCHITECTURE)**  
> **Trạng thái:** HOÀN TẤT (DONE)  
> **Phạm vi:** Nền tảng Shared Progression & Tier Boundary dùng chung, độc lập miền (domain-agnostic), phục vụ SHIP, BUILDING, BASE, FLEET, PILOT, và các thực thể có tiến trình. Tích hợp trực tiếp trên nền tảng Shared Catalog FND-1. Không can thiệp balance kinh tế cụ thể.

---

## 1. CÁC TẬP TIN ĐÃ TẠO VÀ CẬP NHẬT (FILES CREATED / UPDATED)

### Thư mục triển khai mới: `lib/game/world/progression/`
1. `lib/game/world/progression/types.ts`: Hợp đồng kiểu domain-agnostic cho ProgressionState, AutoUpgradePolicy, LevelEffectDefinition, TierDefinition, TierEffectDefinition, ProgressionProfile, ProgressionEntity, ResolvedEntityEffects.
2. `lib/game/world/progression/seed-data.ts`: Dữ liệu mẫu chuẩn tắc SYSTEM (canonical seed data) cho 10 Tiers (TIER_I đến TIER_X), 3 Progression Profiles, 2 Level Effect Profiles và 3 Tier Effect Definitions.
3. `lib/game/world/progression/engine.ts`: Động cơ lõi quản lý tiến trình cấp độ, EXP, kích hoạt Cấp 0 $\rightarrow$ Cấp 1, ranh giới Tier cứng/mềm, nâng cấp Tier tính theo GAME_DAY, chính sách nâng cấp (AUTO/RECOMMEND/MANUAL), và giải quyết hiệu ứng không hồi tố (Non-retroactive).
4. `lib/game/world/progression/registry-integration.ts`: Tích hợp với FND-1 `CatalogRegistry` và `defaultCatalogRegistry`, nạp và giải quyết profiles từ Catalog.
5. `lib/game/world/progression/index.ts`: Barrel export toàn bộ public API của progression foundation.

### Tệp dữ liệu Master Catalog chuẩn tắc: `data/catalogs/`
- `data/catalogs/system_progression_progression_profile_data.json`
- `data/catalogs/system_progression_tier_profile_data.json`
- `data/catalogs/system_progression_level_effect_profile_data.json`
- `data/catalogs/system_progression_tier_effect_profile_data.json`

### Tích hợp và Kiểm thử:
- `lib/game/world/index.ts`: Re-export progression module vào WORLD API.
- `lib/game/world/catalog/registry.ts`: Bổ sung phương thức `getDataProvider()`.
- `tests/world/phase-6-34a-fnd-2-progression.test.ts`: Bộ kiểm thử 28/28 subtests **PASS 100%**.

---

## 2. KIẾN TRÚC & HỢP ĐỒNG LÕI (CORE ARCHITECTURE & CONTRACTS)

### 2.1. 4 Trạng thái tiến trình tối giản (Minimal ProgressionState):
- **`PROGRESSING`**: Thực thể nhận và tích lũy EXP bình thường.
- **`AWAITING_UPGRADE`**: Đã đạt trần cấp độ của Tier cứng (`needUpgrade = true`). EXP bị chặn cứng (Hard Cap), không tràn ngầm (no hidden overflow).
- **`UPGRADING`**: Đang trong tiến trình nâng cấp kéo dài (tính bằng `GAME_DAY`).
- **`MAXED`**: Đạt trần cấp độ tối đa toàn cục (`globalMaxLevel`) hoặc hết Tier có thể vươn tới.

### 2.2. Ngữ nghĩa Cấp 0 vs Cấp 1 (Commissioning Semantics):
- **Cấp 0**: Trạng thái chưa vận hành / đang xây dựng / đang lắp đặt. Không nhận EXP tiến cấp.
- **Cấp 1**: Kích hoạt vận hành (`activateEntity(entity, gameDay)`). Cấp 1 được tính là một cấp độ thật và hưởng đầy đủ `PerLevelEffect`.

### 2.3. Quy tắc tích lũy EXP & Chặn cứng (EXP Hard Cap / No Hidden Overflow):
- Công thức EXP lên cấp: $EXP_{req}(L) = \lfloor baseExp \times (growthFactor)^{L-1} \rfloor$.
- Khi đạt `maxLevel` của Tier cứng: EXP được khóa ở ngưỡng yêu cầu cấp hiện tại, trạng thái chuyển sang `AWAITING_UPGRADE`. Mọi EXP nhận thêm bị hủy bỏ tuyệt đối, không tích lũy ngầm, không chuyển sang Tier sau.

### 2.4. Ranh giới Tier mềm vs Tier cứng (Auto vs Hard Tier Boundary):
- **Tier mềm (`needUpgrade = false`, `upgradeDurationGameDays = 0`)**: Tự động chuyển Tier (ví dụ TIER_V $\rightarrow$ TIER_VI) ngay khi đạt cấp độ mà không cần dừng lại hay tạo tiến trình nâng cấp.
- **Tier cứng (`needUpgrade = true`, `upgradeDurationGameDays >= 1`)**:
  - Dừng tích lũy EXP, kích hoạt trạng thái `AWAITING_UPGRADE`.
  - Không tự trừ tài nguyên hay nhân lực bên trong lõi Shared Progression (được kiểm tra qua `UpgradeRequirementValidator` bên ngoài).
  - Khởi động nâng cấp qua `startTierUpgrade(...)`, trạng thái chuyển sang `UPGRADING` với thời hạn `upgradeCompleteDay = currentDay + duration`.
  - Khi `currentDay >= upgradeCompleteDay`, hàm `processDayTick(...)` hoặc `completeTierUpgrade(...)` thực hiện đột phá Tier.

### 2.5. Kỷ luật Không hồi tố (Non-Retroactive Multipliers):
- Mỗi cấp độ đạt được ở Tier nào sẽ vĩnh viễn giữ nguyên hệ số hiệu ứng (`levelEffectMultiplier`) của Tier đó:
  $$\text{Contribution} = \sum_{\text{tier } T} \left( \text{levelsInTier}_T \times M_T \times \text{BasePerLevelBonus} \right)$$
- Khi đột phá lên Tier mới có hệ số cao hơn (ví dụ TIER_I = 1.0x, TIER_II = 2.0x), **tuyệt đối không tính lại các cấp cũ theo hệ số mới**.

### 2.6. Khung hiệu ứng cấp độ (LevelEffect Framework):
- Hỗ trợ 2 kiểu kích hoạt:
  - **`EXACT_LEVEL`**: Kích hoạt đúng tại một mốc cấp độ (ví dụ Cấp 10 mở khóa năng lực đặc biệt).
  - **`INTERVAL`**: Kích hoạt định kỳ lặp lại (ví dụ bắt đầu từ Cấp 5, mỗi 5 cấp tăng thêm slot module hoặc chỉ số).

### 2.7. Đột phá Tier (Tier Breakthrough Effects):
- Khi lên Tier mới, thực thể nhận một lần các hiệu ứng:
  - `statModifiers`, `capacityModifiers`
  - Mở khóa thuộc tính (`attributeUnlocks`)
  - Mở khóa năng lực (`capabilityUnlocks`)
  - Mở khóa ô trang bị (`moduleSlotUnlocks`)

### 2.8. Chính sách nâng cấp (AutoUpgradePolicy):
- **`AUTO`**: Hệ thống/AI tự động bắt đầu nâng cấp nếu thỏa mãn điều kiện.
- **`RECOMMEND`**: Phát tín hiệu đề xuất (recommendation hook) để Chỉ huy ra quyết định qua Shared Decision Framework.
- **`MANUAL`**: Chờ lệnh thủ công từ người chơi.

### 2.9. Cắt tỉa cấp độ tối đa (Max-Level Tier Truncation):
- Nếu `globalMaxLevel = 50`, các Tier từ 51 trở lên trong Catalog vẫn được giữ nguyên vẹn nhưng không thể vươn tới (unreachable).

### 2.10. Kỷ luật dữ liệu tác giả vs suy dẫn (Derived Data Discipline):
- Master JSON chỉ lưu cấu hình tác giả (profile, tier, effect).
- Tổng hiệu ứng tích lũy (`ResolvedEntityEffects`) được tính toán động (on-the-fly) và có tính tiền định (deterministic), không lưu tổng suy dẫn vào tệp JSON.

---

## 3. KẾT QUẢ KIỂM THỬ (TEST SUITE VERIFICATION)

Đã thực thi thành công bộ test suite:
`tests/world/phase-6-34a-fnd-2-progression.test.ts` (28/28 subtests **PASS 100%**):

1. `Level 0 -> Level 1 activation commissioning semantics` — PASS
2. `Level 1 counts as a real level and earns PerLevelEffect` — PASS
3. `Normal EXP accumulation within level without leveling up` — PASS
4. `Multiple level-ups when EXP is sufficient and no hard boundary hit` — PASS
5. `EXACT_LEVEL effect triggers precisely when level reaches milestone` — PASS
6. `INTERVAL effect triggers at 5, 10, 15... with recurring accumulation` — PASS
7. `Soft/auto Tier transition automatically advances tier without pause` — PASS
8. `Hard Tier boundary stops progression and sets AWAITING_UPGRADE` — PASS
9. `Strict discipline: No hidden EXP overflow at hard boundary` — PASS
10. `AWAITING_UPGRADE strictly blocks new EXP accumulation` — PASS
11. `UPGRADING state correctly sets duration in GAME_DAY` — PASS
12. `Successful breakthrough transitions tier and sets minLevel` — PASS
13. `MAXED state reached when globalMaxLevel is attained` — PASS
14. `Max-level Tier truncation leaves higher tiers unreachable` — PASS
15. `Level effects are NON-RETROACTIVE: Levels in Tier I retain Tier I multiplier` — PASS
16. `New Tier multiplier only applies to levels earned in the new Tier` — PASS
17. `Tier breakthrough one-time bonus applied upon advancing tier` — PASS
18. `Tier breakthrough unlocks capabilities, attributes, and module slots` — PASS
19. `Requirement validator hook blocks upgrade when conditions unmet` — PASS
20. `AUTO upgrade policy auto-starts upgrade when requirements met` — PASS
21. `RECOMMEND upgrade policy emits recommendation for Commander decision` — PASS
22. `MANUAL upgrade policy remains in AWAITING_UPGRADE without auto-starting` — PASS
23. `System default progression profiles load seamlessly via FND-1 CatalogRegistry` — PASS
24. `USER override profile modifies field-level values cleanly without touching canonical` — PASS
25. `Derived data discipline: calculated effects are never persisted into master JSON` — PASS
26. `Deterministic recalculation produces identical outputs across multiple invocations` — PASS
27. `Non-regression check: existing Pilot Survival test and core engines intact` — PASS
28. `Full TypeScript contract adherence without compile errors` — PASS

---

## 4. TƯƠNG THÍCH V1 & ĐIỂM KẾT NỐI TIẾP THEO

- **Không hồi quy (Zero Regression):** Toàn bộ test suite FND-1 (`phase-6-34a-fnd-1-shared-catalog.test.ts`), Pilot Survival (`phase-6-34-pilot-survival.test.ts`), và `tsc --noEmit` đều sạch lỗi 100%.
- **Hạn chế đã biết (Known Limitations):** Chưa tích hợp Shared Decision Framework (sẽ tiếp tục khi hệ thống Decision được triển khai).
- **Điểm kết nối tiếp theo (Next Integration Points):**
  - Tích hợp Shared Progression vào Ship Progression, Building Upgrade và Base Expansion.
  - Kết nối với Decision Matrix để xử lý các yêu cầu nâng cấp ở chế độ `RECOMMEND`.
