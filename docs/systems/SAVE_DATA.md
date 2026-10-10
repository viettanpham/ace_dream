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

## 3. Cấu Trúc Dữ Liệu Dự Kiến (Schema v4 Specification) `[PLANNED]`

Dành cho việc mở rộng Milestone 5.7 (Unified Equipment & Skill Module System):

```typescript
export type StarfrontProgressionV4 = StarfrontProgression & {
  version: 4 // Nâng cấp lên Schema version 4
  skillPoints: number // Điểm kỹ năng phi thuyền khả dụng (chưa dùng)
  slotLevels: Record<1 | 2 | 3 | 4 | 5, number> // Cấp nâng của 5 ô kỹ năng (1..20)
  equippedSkills: Record<1 | 2 | 3 | 4 | 5, string | null> // Mã Module kỹ năng đang lắp vào ô 1..5
  skillInventory: SkillModuleItem[] // Kho mô-đun kỹ năng người chơi đang sở hữu
}
```

### Quy Tắc Chuyển Đổi An Toàn (Migration v3 ➔ v4)
Khi người chơi tải phiên bản mới có Schema v4:
1. **Kiểm tra phiên bản**: Nếu `parsed.version < 4` hoặc chưa có trường `skillPoints`:
2. **Khởi tạo Skill Points**: Tự động tính bù:
   $$\text{skillPoints} = \max\left(0, (\text{level} - 1) \times 2\right)$$
3. **Khởi tạo Cấp Ô (Slot Levels)**: Gán mặc định cấp 1 cho toàn bộ 5 ô:
   $$\text{slotLevels} = \{1: 1, 2: 1, 3: 1, 4: 1, 5: 1\}$$
4. **Cấp Bộ Kỹ Năng Mặc Định**:
   Tự động đưa 4 kỹ năng cơ bản hiện tại của Gear đang chọn vào ô 1–4, tạo 1 Ultimate tương ứng vào ô 5.
5. **Bảo toàn kho đồ**: Giữ nguyên 100% mảng `inventory` trang bị cũ, cấp cường hóa và tiền tệ.
6. **Ghi đè khóa v4**: Lưu dữ liệu đã migrate vào `STARFRONT_SAVE_DATA_V4`.

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
