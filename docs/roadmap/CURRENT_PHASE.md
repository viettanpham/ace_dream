# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 6.23 — WORLD COMBAT CONTEXT & ARENA INTEGRATION (HOÀN THÀNH TOÀN DIỆN)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (Done — 100% Tests PASS, 33/33 Test Suites PASS, 8/8 Phase 6.23 Tests PASS, Build Succeeded)**.
- **Mục tiêu cốt lõi**:
  - Kết nối luồng tác chiến từ STARFRONT WORLD sang Combat Arena dựa trên kiến trúc hiện có (`combat-adapter.ts`, `transaction-journal.ts`, `types.ts`).
  - Khi người chơi chọn một sector nguy cấp trong WORLD và bấm **Xuất Kích Tác Chiến**:
    1. **Khóa Sector & Tạo Encounter Snapshot Bất Biến**:
       * Sử dụng `lockEncounterAndCreateSnapshot(worldState, { sectorId })`.
       * Đóng băng chính xác lực lượng đồn trú (`lockedGarrisonPower`), ngăn chặn can thiệp đa luồng.
       * Lưu ngay lập tức trạng thái khóa và cờ `isSuspendedCombat = true`, `suspendedSnapshot` vào WORLD save (`STARFRONT_WORLD_SAVE_V1`) trước khi điều hướng sang buồng lái Arena.
    2. **Đóng Gói WorldBattleContext**:
       * Truyền đầy đủ: `source: "WORLD"`, `transactionId`, `encounterId`, `sectorId`, `sectorName`, `snapshot`, `resumedFromSuspended`.
       * Ánh xạ thông số địch từ snapshot sang `CombatUnit` đối thủ thực thụ (`buildCombatUnitFromSnapshot`) thay vì mở mặc định `scout-drone`.
       * Áp dụng chính xác chỉ số bổ trợ thân thiện (`defenseMultiplier`, `moraleMultiplier`) từ cấp công sự và sĩ khí sector lên phi thuyền người chơi (`applyWorldSnapshotPlayerModifiers`).
    3. **Hỗ Trợ 2 Chế Độ Chiến Đấu Độc Lập Trong Combat Arena**:
       * Chế độ RPG/Chiến dịch thông thường giữ nguyên 100% logic và phần thưởng.
       * Chế độ WORLD: Hiển thị banner chiến sự thực địa (tên Sector, ID giao dịch, quân đồn trú đóng băng, cấp công sự, mục tiêu tiêu diệt).
       * Nút **RÚT LUI CHIẾN LƯỢC** hỗ trợ 2 phương án minh bạch:
         + **Hủy Bỏ An Toàn (Safe Abort)**: Mở khóa sector ngay lập tức, hoàn trả 100% đồn trú nguyên vẹn, hủy transaction mà không áp dụng hình phạt.
         + **Rút Lui Thất Bại (Tactical Retreat)**: Áp dụng biên lai thất bại, chịu trừ ổn định/đồn trú theo quy tắc và mở khóa an toàn.
    4. **Commit Biên Lai & Bảo Vệ Tuyệt Đối RPG Save**:
       * Khi trận WORLD kết thúc (thắng hoặc thua), trích xuất `CombatResultReceipt` bằng `buildCombatReceiptFromCombatState` và commit qua `commitCombatResultReceipt(worldState, receipt)`.
       * Xóa cờ `isSuspendedCombat`, cập nhật Threat/Ổn định/Tài nguyên/Thương vong trong WORLD save.
       * Hiển thị bảng tổng kết thực địa `WorldCombatPostMissionResults` với đầy đủ số liệu chiến lược.
       * Tuyệt đối không ghi đè, không cộng EXP/Credits vào `STARFRONT_SAVE_DATA_V4` (RPG Save).

---

## 2. Bảng Đối Chiếu Tính Năng Triển Khai Phase 6.23

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Interface `WorldBattleContext` chuẩn | **Đã hoàn thành (Done)** | `lib/game/world/types.ts` |
| Khóa Sector & tạo snapshot trước khi chuyển cảnh | **Đã hoàn thành (Done)** | `operations-center.tsx` (`handleDeployCombat`) |
| Lưu `isSuspendedCombat` vào Save V1 trước điều hướng | **Đã hoàn thành (Done)** | `operations-center.tsx`, `storage.ts` |
| Truyền `worldBattleContext` vào `CombatArena` | **Đã hoàn thành (Done)** | `starfront-shell.tsx` |
| Chuyển snapshot thành CombatUnit đối thủ thực thụ | **Đã hoàn thành (Done)** | `combat-adapter.ts` (`buildCombatUnitFromSnapshot`) |
| Áp dụng chỉ số công sự & sĩ khí lên người chơi | **Đã hoàn thành (Done)** | `combat-adapter.ts` (`applyWorldSnapshotPlayerModifiers`) |
| Không mở `scout-drone` mặc định khi có context WORLD | **Đã hoàn thành (Done)** | `combat-arena.tsx` (`handleStartWorldEncounter`) |
| Banner thông tin chiến sự thực địa STARFRONT WORLD | **Đã hoàn thành (Done)** | `combat-arena.tsx` |
| Modal Rút lui: Hủy bỏ an toàn (Safe Abort) | **Đã hoàn thành (Done)** | `combat-arena.tsx` (`handleConfirmSafeAbort`) |
| Modal Rút lui: Chấp nhận thất bại (Tactical Retreat) | **Đã hoàn thành (Done)** | `combat-arena.tsx` (`handleConfirmTacticalRetreat`) |
| Commit kết quả chiến đấu vào World State qua Adapter | **Đã hoàn thành (Done)** | `combat-arena.tsx`, `combat-adapter.ts` |
| Màn hình kết quả thực địa `WorldCombatPostMissionResults` | **Đã hoàn thành (Done)** | `components/game/world-combat-results.tsx` |
| Nút hoàn tất trở về War Room / Sở Chỉ Huy | **Đã hoàn thành (Done)** | `combat-arena.tsx`, `starfront-shell.tsx` |
| Cách ly 100% dữ liệu: không ghi đè vào RPG Save V4 | **Đã hoàn thành (Done)** | `combat-arena.tsx` (kiểm tra `worldBattleContext`) |
| Khôi phục trận chiến dở dang sau khi tải lại trang | **Đã hoàn thành (Done)** | `combat-adapter.ts` (`resumeSuspendedCombat`) |
| Bộ kiểm thử chuyên sâu Phase 6.23 (8/8 tests PASS) | **Đã hoàn thành (Done)** | `tests/world/phase6-23-world-combat-arena-integration.test.ts` |
| Toàn bộ 33 Test Suites vượt qua thành công (100% PASS) | **Đã hoàn thành (Done)** | `package.json` (`npm test`) |
