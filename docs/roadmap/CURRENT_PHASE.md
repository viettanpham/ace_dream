# STARFRONT — Kế Hoạch Triển Khai Giai Đoạn Hiện Tại (Current Phase Scope)

## GIAI ĐOẠN HIỆN TẠI: PHASE 5.8 — HỆ THỐNG GHÉP ĐÔI NHÂN VẬT & CƠ GIÁP (CHARACTER & GEAR SELECTION SYSTEM)

---

## 1. Mục Tiêu & Trạng Thái Giai Đoạn (Phase Status)
- **Trạng thái**: **Đang Lập Kế Hoạch & Thiết Kế Kiến Trúc (Planning & Architectural Design)**.
- **Quy tắc thực hiện**: Đây là giai đoạn tài liệu hóa và chuẩn bị kiến trúc. Chưa can thiệp sửa đổi mã nguồn gameplay hoặc logic buồng lái trước khi được phê duyệt.
- **Mục tiêu cốt lõi**:
  - Tạo menu điều hướng độc lập: **"Nhân Vật & Cơ Giáp" (Character & Gear)**.
  - Tách chức năng chọn Cơ Giáp ra khỏi Hangar (Hangar tập trung 100% vào Trang Bị, Kho Đồ, Cường Hóa, Tái Chế).
  - Triển khai luồng liên kết 3 bước: Chọn Phi Công ➔ Chọn Cơ Giáp ➔ Đánh Giá & Xác Nhận Cặp Đôi.
  - Triển khai cơ chế Khóa cặp đôi trong 5 Nhiệm vụ hoặc 5 Trận thắng trước khi cho phép đổi cặp mới.
  - Xây dựng hệ thống tiến trình tăng trưởng độc lập cho từng Phi công (Level, EXP, 5 điểm thuộc tính/cấp, nội tại độc nhất).

---

## 2. Phân Định Rõ Ràng Trạng Thái Triển Khai

| Hạng mục tính năng | Trạng thái kỹ thuật | Đối chiếu mã nguồn thực tế |
|---|---|---|
| Menu độc lập "Nhân Vật & Cơ Giáp" | **Chưa triển khai (Planned)** | Sẽ thêm vào `SECTIONS` trong `starfront-shell.tsx`. |
| Luồng chọn 3 bước liên kết | **Chưa triển khai (Planned)** | Xây dựng component `character-gear-select.tsx`. |
| Cơ chế Khóa 5 Nhiệm vụ / 5 Trận thắng | **Chưa triển khai (Planned)** | Cần trường `activePairing` và bộ đếm trong `StarfrontProgression`. |
| Tiến trình độc lập từng Phi Công (Level, EXP) | **Chưa triển khai (Planned)** | Cần dictionary `pilots` trong `StarfrontProgression` (Schema v4). |
| Gán điểm thuộc tính Phi Công (+5 điểm/cấp) | **Chưa triển khai (Planned)** | Giao diện phân bổ điểm và công thức cộng chỉ số vào Gear. |
| Nội tại độc nhất của 4 Phi Công | **Chưa triển khai (Planned)** | Đã có hồ sơ mẫu `PILOT_PROFILES` trong `data.ts`; cần hook vào `engine.ts`. |
| Tách chọn Gear ra khỏi Hangar | **Chưa triển khai (Planned)** | Gỡ grid chọn 3 Gear trên đầu `starfront-hangar.tsx`, thay bằng nút chuyển hướng sang menu mới. |
| Giao diện hiển thị 5 Slot Kỹ Năng trong Hangar | **Đã hoàn thành (Done)** | Tab "Mô-Đun Kỹ Năng (5 Ô)" và `fiveSkillSlots` trong `starfront-hangar.tsx`. |
| Modal Xem Chi Tiết Mô-Đun Kỹ Năng | **Đã hoàn thành (Done)** | `SkillModuleSelectModal` trong `starfront-hangar.tsx` (hiển thị quy tắc tương thích). |
| Hệ thống lưu trữ cấp Ô & Mô-đun rời (Backend 5.7) | **Chưa triển khai (Planned)** | Slot-bound levels và module inventory chưa lưu vào LocalStorage. |
| Tăng trưởng 2 SP / cấp cơ giáp | **Đã triển khai mã nguồn (Done)** | Hàm `getAircraftSkillPoints(level)` trong `lib/game/progression.ts`. |
| Nâng cấp Lưu trữ lên Schema v4 | **Chưa triển khai (Planned)** | `storage.ts` hiện tại đang ở Schema v3 (`STARFRONT_SAVE_DATA_V3`). |

---

## 3. Trình Tự Triển Khai Chi Tiết (Implementation Order)

Khi được phê duyệt chuyển từ Lập Kế Hoạch sang Triển Khai, Phase 5.8 sẽ thực hiện theo 5 bước tuần tự:

```
[Bước 1: Mở rộng Kiểu Dữ Liệu & Schema v4 Migration]
                         │
                         ▼
[Bước 2: Nâng cấp Logic Tiến Trình & Cộng Chỉ Số Phi Công]
                         │
                         ▼
[Bước 3: Xây dựng Giao Diện "Character & Gear" 3 Bước]
                         │
                         ▼
[Bước 4: Tinh Chỉnh Hangar & Kết Nối Điều Hướng Shell]
                         │
                         ▼
[Bước 5: Kiểm Thử Tự Động & Kiểm Định An Toàn]
```

### Bước 1: Mở rộng Kiểu Dữ Liệu & Schema v4 Migration (`types.ts`, `storage.ts`)
- Định nghĩa interface `PilotProgressionData`:
  ```ts
  export interface PilotProgressionData {
    id: string
    level: number
    exp: number
    allocatedStats: {
      attack: number
      defense: number
      agility: number
      shield: number
      tactical: number
    }
    availablePoints: number
  }
  ```
- Định nghĩa interface `ActivePairingState`:
  ```ts
  export interface ActivePairingState {
    pilotId: string
    gearId: StarfrontGearId
    isLocked: boolean
    unlockProgress: {
      completedMissions: number
      wonBattles: number
      targetCount: 5
    }
  }
  ```
- Bổ sung vào `StarfrontProgression`:
  - `activePairing: ActivePairingState`
  - `pilots: Record<string, PilotProgressionData>`
  - `gearSlotLevels?: Record<StarfrontGearId, Record<1|2|3|4|5, number>>`
- Viết hàm `migrateProgressionToV4` trong `storage.ts` với khả năng tương thích ngược hoàn hảo từ v1, v2, v3:
  - Tự động gán Phi công mặc định `marcus` đi cùng `activeGearId` hiện tại.
  - Khởi tạo đầy đủ danh sách 4 phi công (Marcus, Valentine, Alviss, Eric) ở Level 1, 0 EXP.
  - Đặt `isLocked: false` để người chơi mới không bị kẹt.

### Bước 2: Nâng cấp Logic Tiến Trình & Cộng Chỉ Số Phi Công (`progression.ts`, `engine.ts`)
- Cập nhật hàm `calculateTotalGearStats`:
  - Tiếp nhận thêm tham số hoặc trường `pilotData?: PilotProgressionData`.
  - Cộng điểm thuộc tính phi công vào `bonuses`:
    - `attack += allocated.attack * 2.0`
    - `defense += allocated.defense * 1.5`
    - `speed += allocated.agility * 1.0`
    - `shield += allocated.shield * 30`
    - `critRate += allocated.tactical * 0.004`
- Cập nhật hàm `applyVictoryReward` & `applyMissionClearReward`:
  - Chỉ trao EXP cho phi công đang được ghép đôi trong `activePairing.pilotId`.
  - Tự động kiểm tra tăng cấp phi công và cộng +5 Điểm Thuộc Tính khi lên cấp.
  - Tăng bộ đếm mở khóa: Nếu `activePairing.isLocked === true`, tăng `wonBattles += 1` (trong trận đấu) hoặc `completedMissions += 1` (trong nhiệm vụ).
  - Tự động mở khóa `isLocked = false` ngay khi `wonBattles >= 5` hoặc `completedMissions >= 5`.

### Bước 3: Xây dựng Giao Diện "Character & Gear" 3 Bước (`components/game/character-gear-select.tsx`)
- Thanh chuyển bước tương tác:
  - Bước 1: Lưới thẻ phi công (chân dung, cấp độ, EXP, nội tại).
  - Bước 2: Lưới thẻ cơ giáp (hình minh họa SVG, vai trò, nội tại, rating).
  - Bước 3: Màn hình so sánh và xác nhận cặp đôi (Pilot bên trái, Gear bên phải, tổng hợp chỉ số ở giữa).
- Cửa sổ popup "Xem Chi Tiết" (Details Modal):
  - Cột trái: Danh sách chuyển nhanh giữa các Phi Công và Cơ Giáp.
  - Cột phải: Toàn bộ thông tin chi tiết, tiểu sử, phân bổ điểm thuộc tính, và bộ kỹ năng.
- Bảng điều khiển Khóa Xuất Kích:
  - Hiển thị huy hiệu ổ khóa `Lock` màu hổ phách khi đang khóa.
  - Thanh tiến trình: `X/5 Nhiệm Vụ` và `Y/5 Trận Thắng`.

### Bước 4: Tinh Chỉnh Hangar & Kết Nối Điều Hướng Shell (`starfront-shell.tsx`, `starfront-hangar.tsx`)
- Cập nhật `starfront-shell.tsx`:
  - Bổ sung mục điều hướng `character-gear` vào danh sách `SECTIONS`.
  - Đặt nhãn: `"Nhân Vật & Cơ Giáp"`.
  - Badge: Hiển thị tên cặp đôi đang ghép (ví dụ: `Marcus / Vanguard`).
- Cập nhật `starfront-hangar.tsx`:
  - Thay thế thanh chọn cơ giáp cũ trên đầu Hangar bằng khối tóm tắt cơ giáp hiện tại kèm nút:
    `"Thay Đổi Cặp Đôi Phi Công & Cơ Giáp ➔"` (nhấn vào sẽ chuyển sang tab Character & Gear).
  - Giữ nguyên toàn bộ 3 tab con của Hangar: Trang bị buồng lái, Mô-đun kỹ năng, Kho đồ & Tái chế.

### Bước 5: Kiểm Thử Tự Động & Kiểm Định An Toàn (`tests/phase5-8-character-gear.test.ts`)
- Viết bộ kiểm thử bao phủ toàn diện:
  - Khởi tạo và migration an toàn Save Schema v3 ➔ v4.
  - Xác nhận cặp đôi khóa đúng điều kiện.
  - Hoàn thành đủ 5 trận thắng hoặc 5 nhiệm vụ mở khóa cặp đôi thành công.
  - Thoát trận hoặc thất bại không làm tăng bộ đếm mở khóa.
  - Chỉ phi công tham chiến mới nhận EXP.
  - Phân bổ điểm thuộc tính tác động đúng tỉ lệ vào chỉ số cơ giáp.

---

## 4. Các Hệ Thống Tái Sử Dụng (Existing Systems to Reuse)
1. **Dữ liệu Phi công mẫu (`PILOT_PROFILES` trong `lib/game/data.ts`)**:
   - Sử dụng lại 4 phi công: Marcus, Valentine, Alviss, Eric kèm avatar và thuộc tính gốc.
2. **Hình ảnh & Minh họa Cơ Giáp (`public/images/`)**:
   - Tái sử dụng `vanguard.svg`, `falcon.svg`, `aegis.svg`, cùng ảnh chân dung nhân vật.
3. **Bộ âm thanh Web Audio (`lib/game/audio.ts`)**:
   - Tái sử dụng `playClickSound`, `playLevelUpSound`, `playShieldSound`, `playVictorySound`.
4. **Công thức tính chỉ số chuẩn (`lib/game/progression.ts`)**:
   - Mở rộng trực tiếp từ `calculateTotalGearStats`, không viết lại công thức tính chỉ số mới.
5. **Hệ thống Nhiệm vụ & Đấu trường (`campaign-map.tsx`, `combat-arena.tsx`)**:
   - Giữ nguyên luồng chiến đấu, chỉ bổ sung hook cập nhật tiến độ cặp đôi vào `applyVictoryReward` và `applyMissionClearReward`.

---

## 5. Tiêu Chí Chấp Nhận (Acceptance Criteria)
1. [ ] Menu "Nhân Vật & Cơ Giáp" xuất hiện rõ ràng trên thanh điều hướng chính của STARFRONT.
2. [ ] Người chơi có thể duyệt danh sách Phi công, Cơ giáp và chuyển đổi qua lại giữa 3 bước mà không bị mất lựa chọn trước khi bấm Xác Nhận.
3. [ ] Sau khi bấm Xác Nhận, cặp đôi được khóa lại và hiển thị thanh tiến độ `X/5` trên giao diện.
4. [ ] Người chơi không thể đổi sang phi công hoặc cơ giáp khác trong trận đấu khi đang bị khóa.
5. [ ] Hoàn thành đủ 5 nhiệm vụ hoặc thắng 5 trận đấu tự động mở khóa cặp đôi, phát âm thanh thông báo.
6. [ ] EXP từ trận thắng/nhiệm vụ chỉ cộng vào phi công đang tham chiến.
7. [ ] Phân bổ điểm thuộc tính cho phi công làm tăng chỉ số chiến đấu của cơ giáp tương ứng một cách chính xác.
8. [ ] Dữ liệu lưu trữ LocalStorage tự động nâng cấp lên Schema v4 mà không làm mất bất kỳ trang bị, cấp độ, hay tài nguyên nào của người chơi.
9. [ ] Toàn bộ 60 tests cũ tiếp tục PASS và 100% tests mới của Phase 5.8 PASS.

---

## 6. Rủi Ro Kỹ Thuật & Quyết Định Thiết Kế Cần Lưu Ý
- **Rủi ro kẹt khóa (Soft-lock Risk)**: Nếu người chơi khóa cặp đôi nhưng không thể thắng trận nào hoặc hết nhiệm vụ để chơi.
  - *Giải pháp*: Cho phép lặp lại các ải đã hoàn thành (Repeat Clear) trong Campaign Map hoặc đấu trường tự do (Scout Drone) để luôn có cơ hội tích lũy trận thắng giải phóng cặp đôi.
- **Rủi ro lệch nhịp giữa Ace Manager và STARFRONT**:
  - Ace Manager có hệ thống `state.pilot` riêng cho mini-game quản lý căn cứ.
  - *Quyết định*: Schema v4 lưu `pilots` trực tiếp trong `StarfrontProgression`, bảo đảm STARFRONT hoàn toàn độc lập và không phụ thuộc vào trạng thái runtime của Ace Manager.
