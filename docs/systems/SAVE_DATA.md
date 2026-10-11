# STARFRONT — Hệ Thống Lưu Trữ Dữ Liệu & Di Chuyển Schema (Save Data & Schema Migration)

Tài liệu này quy định cấu trúc dữ liệu lưu trữ (Save Schema), quy tắc tương thích ngược (Backward Compatibility), quy trình di chuyển phiên bản (Schema Migration) và các biện pháp bảo vệ tính toàn vẹn dữ liệu trong `lib/game/storage.ts`.

---

## 1. Trạng Thái Triển Khai (Implementation Status)

- `[IMPLEMENTED]` (Milestone 5.4 & 5.6):
  - Khóa lưu trữ LocalStorage: `STARFRONT_SAVE_DATA_V3`, có cơ chế tự động đọc và nâng cấp từ `STARFRONT_SAVE_DATA_V2` và `STARFRONT_SAVE_DATA_V1`.
  - Bộ đọc an toàn Server-Side Rendering (SSR Safe): Tránh lỗi crash `window is undefined` khi build Next.js.
  - Chuẩn hóa Schema v3 trong `storage.ts: migrateProgressionToV3`.
  - Bảo toàn 100% Cấp độ, EXP, Credits, Alloy, Nhiệm vụ đã vượt, Lựa chọn Gear, Cấp cường hóa `[0..10]`.
  - Lưu cố định trạng thái Chợ (`currentShopItems`), Nhiệm vụ phụ (`sideQuests`) và Cấu hình ải ghi đè (`missionOverrides`) sau khi reset.
- `[PLANNED]` (Milestone 5.7):
  - Khóa lưu trữ Schema v4: `STARFRONT_SAVE_DATA_V4`.
  - Bổ sung các trường quản lý kỹ năng: `skillPoints`, `slotLevels`, `equippedSkills`, `skillInventory`.
  - Hàm chuyển đổi an toàn từ Schema v1/v2/v3 lên Schema v4 với khả năng tự động tính toán bù đủ Skill Points tương ứng với cấp độ hiện tại của phi thuyền.

---

## 2. Cấu Trúc Dữ Liệu Hiện Tại (Schema v3 Specification) `[IMPLEMENTED]`

Dữ liệu tiến trình hiện tại được định nghĩa qua `StarfrontProgression` trong `lib/game/types.ts`:

```typescript
export type StarfrontProgression = {
  version: 3 // Schema version hiện tại
  level: number // Cấp độ người chơi (1 - 15+)
  exp: number // Điểm kinh nghiệm hiện tại
  credits: number // Tín dụng tiền tệ chính
  alloy?: number // Hợp kim cường hóa trang bị (mặc định 25 cho người mới)
  activeGearId: StarfrontGearId // Cơ giáp đang lái: "vanguard" | "falcon" | "aegis"
  unlockedGears: StarfrontGearId[] // Danh sách cơ giáp đã mở khóa
  inventory: StarfrontItem[] // Kho trang bị sở hữu
  equipped: Record<StarfrontItemSlot, string | null> // Trang bị đang gắn: weapon, shield, engine
  completedMissions: string[] // Mã các ải chính tuyến đã hoàn thành ("m1-1", "m3-3", ...)
  battlesWon: number // Tổng số trận thắng
  battlesLost: number // Tổng số trận thua
  freeShopRefreshes?: number // Lượt làm mới Chợ miễn phí tích lũy từ chiến thắng
  activeQuest?: StarfrontQuest | null // Nhiệm vụ đang nhận
  completedQuestIds?: string[] // Danh sách mã nhiệm vụ đã hoàn thành
  currentShopItems?: ArmoryShopItem[] // Danh mục hàng hóa hiện tại của Chợ Quân Sự
  sideQuests?: StarfrontQuest[] // Danh sách 3 nhiệm vụ phụ tuyến hiện hành
  missionOverrides?: Record<string, {
    quality?: QuestQuality
    variantId?: EnemyVariantId
    previewReward?: QuestRewardPreview
  }> // Cấu hình ải chiến dịch được random lại sau khi reset
}
```

---

## 3. Cấu Trúc Dữ Liệu Hiện Hành (Schema v4 Specification) `[IMPLEMENTED]`

Kể từ Phase 5.8 và Phase 5.9, hệ thống lưu trữ chính thức hoạt động trên **Schema v4** với khóa `STARFRONT_SAVE_DATA_V4`:

```typescript
export type StarfrontProgression = {
  version: 4 // Schema version 4
  level: number // Cấp độ cơ giáp người chơi
  exp: number // Điểm kinh nghiệm cơ giáp
  credits: number // Tín dụng tiền tệ chính
  alloy?: number // Hợp kim cường hóa trang bị
  activeGearId: StarfrontGearId // "vanguard" | "falcon" | "aegis"
  unlockedGears: StarfrontGearId[] // Danh sách cơ giáp đã mở khóa
  inventory: StarfrontItem[] // Kho đồ trang bị
  equipped: Record<StarfrontItemSlot, string | null> // weapon, shield, engine
  completedMissions: string[] // Mã các ải đã hoàn thành
  battlesWon: number // Tổng số trận thắng
  battlesLost: number // Tổng số trận thua
  freeShopRefreshes?: number // Lượt làm mới Chợ miễn phí
  activeQuest?: StarfrontQuest | null // Nhiệm vụ chính tuyến đang nhận
  completedQuestIds?: string[] // Danh sách nhiệm vụ đã hoàn thành
  currentShopItems?: ArmoryShopItem[] // Danh mục hàng chợ quân sự hiện tại
  sideQuests?: StarfrontQuest[] // Danh sách nhiệm vụ phụ tuyến
  missionOverrides?: Record<string, { quality?: QuestQuality; variantId?: EnemyVariantId; previewReward?: QuestRewardPreview }>

  // --- Mở Rộng Phase 5.8: Hệ Thống Ghép Đôi & Tiến Trình Phi Công ---
  activePairing?: ActivePairingState // Cặp đôi đang chọn, trạng thái isLocked và unlockProgress (5 trận / 5 Q)
  pilots?: Record<string, PilotProgressionData> // Tiến trình 4 phi công (Level, EXP, availablePoints, allocatedStats)

  // --- Mở Rộng Phase 5.9: Tuyệt Kỹ Liên Hoàn & Quản Trị Toàn Cục ---
  pilotSkills?: Record<string, PilotSynergySkillInstance> // Tuyệt kỹ liên hoàn riêng của từng phi công
  globalAdminConfig?: GlobalAdminConfig // Cấu hình Admin CP: trần cấp độ, chế độ ưu tiên priorityMode
  rerollTokens?: number // Số Vé / Token Reroll Dòng Phụ (khởi đầu cấp 5 vé)
}
```

### Quy Tắc Chuyển Đổi An Toàn (Migration v1..v3 ➔ v4)
Được triển khai trong `lib/game/storage.ts: migrateProgressionToV4`:
1. **Khởi tạo hồ sơ 4 Phi công**: Nếu save cũ chưa có trường `pilots`, tự động sinh 4 hồ sơ (`marcus`, `valentine`, `alviss`, `eric`) ở Cấp 1, 0 EXP, 0 điểm phân bổ.
2. **Khởi tạo cặp đôi `activePairing`**: Mặc định Marcus + `activeGearId`, trạng thái `isLocked = false` để người chơi không bị kẹt khi vừa cập nhật.
3. **Khởi tạo & Chuẩn hóa Pilot Skills**:
   - Nếu đã có dữ liệu kỹ năng: chạy qua `normalizePilotSynergySkill` để đối chiếu template.
   - Nếu chưa có: gọi `createInitialPilotSynergySkill(pilotId, pilotLevel, globalAdminConfig)` tự động mở khóa các mốc milestone tương ứng với cấp độ hiện tại của phi công.
4. **Cấp Vé Reroll Khởi Đầu**: Tự động tặng 5 Vé Reroll (`rerollTokens: 5`) cho người chơi cũ chuyển tiếp lên v4.
5. **Cấu hình Quản trị Mặc định**: Nạp `DEFAULT_GLOBAL_ADMIN_CONFIG` (Max pilot 120, max skill 30, chế độ `TEMPLATE_OVERRIDE`).
6. **Bảo toàn 100% tài nguyên**: Cấp độ, kinh nghiệm, Credits, Alloy, kho đồ và cấp cường hóa [0..10] được bảo toàn nguyên vẹn.
7. **Lưu trữ độc lập**: Ghi dữ liệu vào khóa `STARFRONT_SAVE_DATA_V4`, không ghi đè xóa bỏ khóa cũ `STARFRONT_SAVE_DATA_V3`.

---

## 4. Nguyên Tắc Bảo Vệ Tính Toàn Vẹn & Bất Biến (Data Integrity Rules)

1. **Bất biến thuộc tính đã roll (Roll Immutability)**:
   Mọi trang bị hoặc mô-đun kỹ năng khi rơi ra hoặc mua từ shop phải lưu cố định các chỉ số (`statsRandomized: true`). Bộ đọc `migrateProgression` bảo đảm giữ nguyên các trường chỉ số và không bao giờ gọi lại hàm roll ngẫu nhiên.
2. **Chống trùng lặp mã định danh (UUID & ID Collision Prevention)**:
   Mỗi item khi sinh ra trong kho đồ phải có mã định danh duy nhất (UID). Khi thêm starter items hoặc phần thưởng, hệ thống kiểm tra sự tồn tại trước khi push vào mảng `inventory`.
3. **Kẹp biên an toàn (Defensive Clamping)**:
   Khi nạp dữ liệu từ LocalStorage, mọi giá trị số đều phải đi qua `Math.max()` và kiểm tra `NaN`:
   - `level = Math.max(1, Number(parsed.level) || 1)`
   - `credits = Math.max(0, Number(parsed.credits) || 0)`
   - `alloy = Math.max(0, Number(parsed.alloy) || 0)`
   - `enhancementLevel = Math.max(0, Math.min(10, Number(it?.enhancementLevel) || 0))`

---

## 5. Quy Trình Cài Đặt Lại Tiến Trình (Reset Protocol)

Được triển khai an toàn tại `storage.ts: resetStarfrontProgression`:
1. Xóa sạch toàn bộ các key qua các thế hệ: `STARFRONT_SAVE_DATA_V3`, `STARFRONT_SAVE_DATA_V2`, `STARFRONT_SAVE_DATA_V1` (và tương lai là `V4`).
2. Trả về đối tượng khởi tạo chuẩn `INITIAL_STARFRONT_PROGRESSION`.
3. Giao diện người dùng tại Hangar có hộp thoại xác nhận cảnh báo đỏ trước khi kích hoạt reset nhằm tránh thao tác nhầm lẫn.

---

## 6. Các Điểm Chưa Quyết Định Cần Xác Nhận (Undecided Points)

1. **Khóa dữ liệu nhiều thiết bị (Multi-profile / Cloud Saves)**:
   - Hiện tại save chỉ nằm trên `localStorage` của trình duyệt người dùng.
   - Khi triển khai Phase 6.4 (Multiplayer & Cloud Proposal), save schema cần thiết kế thêm trường `playerId`, `lastSavedTimestamp`, `checksum/hash` để kiểm tra toàn vẹn khi đồng bộ đám mây.
2. **Lưu lịch sử giao dịch Chợ (Shop Purchase History)**:
   - Hiện tại Chợ lưu `isPurchased: true` trên từng món của đợt refresh hiện tại. Khi refresh Chợ, danh sách được tạo mới hoàn toàn. Cần xác nhận có cần lưu lịch sử giao dịch vĩnh viễn hay không.
   - *Khuyến nghị*: Không cần lưu lịch sử vĩnh viễn để tránh làm phình to dung lượng `localStorage`.
