import {
  cloneUnit,
  applyStatusEffect,
  cleanseStatusEffects,
  processTurnStartEffects,
  processTurnEndEffects,
  tickUnitTurn,
  executePlayerAction,
  executeEnemyAIAction,
  skipStunnedTurn,
  createInitialCombatState,
} from "./lib/game/engine"
import { VANGUARD_INITIAL_UNIT, ENEMIES_DATA } from "./lib/game/data"
import type { CombatUnit, StatusEffect, CombatState } from "./lib/game/types"

console.log("=== BẮT ĐẦU KIỂM THỬ TÍNH NĂNG STARFRONT MILESTONE 4.1 ===")

let passedTests = 0
let failedTests = 0

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`[PASS] ${desc}`)
    passedTests++
  } else {
    console.error(`[FAIL] ${desc}`)
    failedTests++
  }
}

// =========================================================================
// TEST SUITE 1: Áp dụng hiệu ứng & Quy tắc Stacking / Refresh / Override (TC-4.1.4)
// =========================================================================
console.log("\n--- TEST SUITE 1: Quy tắc Áp dụng, Stacking, Refresh & Override ---")

const unitA: CombatUnit = cloneUnit(VANGUARD_INITIAL_UNIT)
unitA.statusEffects = []

// 1.1 Áp dụng buff Shield lần đầu
const shield1: StatusEffect = {
  id: "shield-1",
  type: "emergency-guard",
  name: "Lá Chắn Khẩn Cấp",
  desc: "Giảm 50% sát thương",
  duration: 2,
  value: 0.5,
  isDebuff: false,
}
const resShield1 = applyStatusEffect(unitA, shield1, "refresh")
assert(resShield1.applied === true, "Áp dụng Lá Chắn lần đầu thành công")
assert(unitA.statusEffects.length === 1, "Số lượng hiệu ứng trên đơn vị là 1")
assert(unitA.statusEffects[0].duration === 2, "Thời hạn Lá Chắn là 2 lượt")

// 1.2 Áp dụng lại Lá Chắn với duration mới (Quy tắc Refresh)
const shield2: StatusEffect = {
  id: "shield-2",
  type: "emergency-guard",
  name: "Lá Chắn Khẩn Cấp",
  desc: "Giảm 50% sát thương",
  duration: 3,
  value: 0.5,
  isDebuff: false,
}
const resShield2 = applyStatusEffect(unitA, shield2, "refresh")
assert(resShield2.applied === true, "Làm mới (Refresh) Lá Chắn thành công")
assert(unitA.statusEffects.length === 1, "Không tạo hiệu ứng trùng lặp (vẫn là 1)")
assert(unitA.statusEffects[0].duration === 3, "Thời hạn được làm mới lên 3 lượt")

// 1.3 Áp dụng hiệu ứng DoT cộng dồn (Quy tắc Stacking)
const acid1: StatusEffect = {
  id: "acid-1",
  type: "acid-corrosion",
  name: "Ăn Mòn Axit",
  desc: "DoT ăn mòn vỏ giáp",
  duration: 3,
  value: 0.2,
  dotDamage: 30,
  stacks: 1,
  maxStacks: 3,
  isDebuff: true,
}
applyStatusEffect(unitA, acid1, "stack")
assert(unitA.statusEffects.length === 2, "Đơn vị có 2 hiệu ứng (1 Shield, 1 Acid)")
const acidEffect = unitA.statusEffects.find((e) => e.type === "acid-corrosion")
assert(acidEffect?.stacks === 1, "Hiệu ứng Acid bắt đầu ở Tầng 1")

// Áp dụng thêm tầng 2 và tầng 3
applyStatusEffect(unitA, acid1, "stack")
assert(acidEffect?.stacks === 2, "Cộng dồn lên Tầng 2")

applyStatusEffect(unitA, acid1, "stack")
assert(acidEffect?.stacks === 3, "Cộng dồn lên Tầng 3 (Max Stacks)")

// Cố tình cộng dồn tầng 4 -> Phải bị chặn ở maxStacks = 3
applyStatusEffect(unitA, acid1, "stack")
assert(acidEffect?.stacks === 3, "Không vượt quá maxStacks (vẫn giữ Tầng 3)")

// =========================================================================
// TEST SUITE 2: Vòng đời kích hoạt DoT đầu lượt & Giảm duration cuối lượt (TC-4.1.1)
// =========================================================================
console.log("\n--- TEST SUITE 2: Vòng đời kích hoạt DoT & Giảm thời hạn ---")

const unitB: CombatUnit = cloneUnit(VANGUARD_INITIAL_UNIT)
unitB.hp = 1000
unitB.statusEffects = [
  {
    id: "burn-1",
    type: "burn",
    name: "Đốt Cháy Plasma",
    desc: "Gây sát thương mỗi lượt",
    duration: 2,
    value: 0,
    dotDamage: 40,
    stacks: 1,
    maxStacks: 3,
    isDebuff: true,
  },
]

// Vòng 1: Kích hoạt Turn-Start
const turn1Start = processTurnStartEffects(unitB, 1)
assert(turn1Start.totalDotDamage === 40, "Đầu lượt 1: Gây chính xác 40 sát thương DoT")
assert(unitB.hp === 960, "HP giảm từ 1000 xuống 960 ở đầu lượt")
assert(turn1Start.logs.length > 0, "Có ghi log sát thương duy trì vào nhật ký")
assert(unitB.statusEffects[0].duration === 2, "Thời hạn DoT chưa giảm ở đầu lượt (vẫn là 2)")

// Vòng 1: Kết thúc lượt (Turn-End)
const expired1 = processTurnEndEffects(unitB)
assert(expired1.length === 0, "Cuối lượt 1: Chưa có hiệu ứng nào hết hạn")
assert(unitB.statusEffects[0].duration === 1, "Cuối lượt 1: Thời hạn giảm từ 2 xuống 1")

// Vòng 2: Kích hoạt Turn-Start
const turn2Start = processTurnStartEffects(unitB, 2)
assert(turn2Start.totalDotDamage === 40, "Đầu lượt 2: Tiếp tục gây 40 sát thương DoT")
assert(unitB.hp === 920, "HP giảm xuống 920")

// Vòng 2: Kết thúc lượt (Turn-End) -> Hết hạn
const expired2 = processTurnEndEffects(unitB)
assert(expired2.length === 1, "Cuối lượt 2: Hiệu ứng DoT đã hết hạn")
assert(unitB.statusEffects.length === 0, "Hiệu ứng tự động được dọn dẹp sạch khỏi mảng")

// =========================================================================
// TEST SUITE 3: Khống chế Stun / Overheat (TC-4.1.2)
// =========================================================================
console.log("\n--- TEST SUITE 3: Khống chế Stun / Overheat làm mất lượt ---")

const unitC: CombatUnit = cloneUnit(VANGUARD_INITIAL_UNIT)
unitC.statusEffects = [
  {
    id: "stun-1",
    type: "stun",
    name: "Tê Liệt Năng Lượng",
    desc: "Mất lượt",
    duration: 1,
    value: 1,
    isDebuff: true,
  },
]

const stunCheck = processTurnStartEffects(unitC, 1)
assert(stunCheck.isStunned === true, "Phát hiện chính xác trạng thái Stun ở đầu lượt")
assert(stunCheck.stunReason === "Tê Liệt Năng Lượng", "Ghi nhận đúng tên hiệu ứng gây tê liệt")

// Kiểm tra hàm skipStunnedTurn
const testState: CombatState = {
  encounterId: "scout-drone",
  turnNumber: 1,
  currentTurnActorId: unitC.id,
  turnQueue: [unitC.id, "drone"],
  player: unitC,
  enemy: cloneUnit(ENEMIES_DATA["scout-drone"]),
  status: "player-turn",
  logs: [],
}

const skippedState = skipStunnedTurn(testState)
assert(skippedState.status === "enemy-turn", "Bỏ qua lượt thành công: chuyển quyền hành động sang Kẻ địch")
assert(skippedState.logs.some((l) => l.text.includes("làm tê liệt")), "Nhật ký ghi nhận sự kiện mất lượt")
assert(skippedState.player.statusEffects.length === 0, "Hiệu ứng Stun 1 lượt đã hết hạn sau khi bỏ qua lượt")

// =========================================================================
// TEST SUITE 4: Bị tiêu diệt bởi DoT trước khi kịp ra đòn (TC-4.1.3)
// =========================================================================
console.log("\n--- TEST SUITE 4: Hạ gục bởi DoT đầu lượt trước khi hành động ---")

const dyingUnit: CombatUnit = cloneUnit(VANGUARD_INITIAL_UNIT)
dyingUnit.hp = 20 // Máu rất thấp
dyingUnit.statusEffects = [
  {
    id: "fatal-burn",
    type: "burn",
    name: "Cháy Nổ Quá Tải",
    desc: "50 DoT",
    duration: 2,
    value: 0,
    dotDamage: 50,
    stacks: 1,
    isDebuff: true,
  },
]

const fatalCheck = processTurnStartEffects(dyingUnit, 3)
assert(dyingUnit.hp === 0, "HP giảm về 0 do sát thương DoT đầu lượt")
assert(fatalCheck.unitDefeated === true, "Đánh dấu đơn vị đã bị hạ gục trước khi ra chiêu")

// =========================================================================
// TEST SUITE 5: Thanh lọc Cleanse & Xóa Buff / Debuff (TC-4.1.5)
// =========================================================================
console.log("\n--- TEST SUITE 5: Thanh lọc Cleanse ---")

const unitD: CombatUnit = cloneUnit(VANGUARD_INITIAL_UNIT)
unitD.statusEffects = [
  {
    id: "buff-guard",
    type: "emergency-guard",
    name: "Lá Chắn Khẩn Cấp",
    desc: "Buff phòng hộ",
    duration: 2,
    value: 0.5,
    isDebuff: false,
  },
  {
    id: "debuff-ab",
    type: "armor-break",
    name: "Vỡ Vỏ Giáp",
    desc: "Debuff trừ giáp",
    duration: 2,
    value: 0.35,
    isDebuff: true,
  },
  {
    id: "debuff-burn",
    type: "burn",
    name: "Đốt Cháy Plasma",
    desc: "Debuff DoT",
    duration: 2,
    value: 0,
    dotDamage: 30,
    isDebuff: true,
  },
]

// Thanh lọc chỉ xóa debuff
const removedDebuffs = cleanseStatusEffects(unitD, "debuff")
assert(removedDebuffs.length === 2, "Gỡ bỏ chính xác 2 debuff (Armor Break và Burn)")
assert(unitD.statusEffects.length === 1, "Chỉ còn lại 1 hiệu ứng trên đơn vị")
assert(unitD.statusEffects[0].type === "emergency-guard", "Buff phòng hộ Lá Chắn được bảo toàn nguyên vẹn")

// =========================================================================
// TEST SUITE 6: Tương thích vòng lặp chiến đấu executePlayerAction & Enemy AI
// =========================================================================
console.log("\n--- TEST SUITE 6: Vòng lặp chiến đấu tích hợp ---")

const arenaState = createInitialCombatState("scout-drone", cloneUnit(VANGUARD_INITIAL_UNIT))

// Gán hiệu ứng DoT nặng lên Kẻ địch đang còn 30 HP
arenaState.enemy.hp = 30
arenaState.enemy.statusEffects = [
  {
    id: "lethal-dot",
    type: "burn",
    name: "Đốt Cháy Tức Thời",
    desc: "DoT",
    duration: 2,
    value: 0,
    dotDamage: 50,
    stacks: 1,
    isDebuff: true,
  },
]
arenaState.status = "enemy-turn"

// Khi Kẻ địch tới lượt -> executeEnemyAIAction phải kích hoạt DoT đầu lượt và phát hiện địch chết -> Kết thúc bằng Victory
const afterEnemyTurn = executeEnemyAIAction(arenaState)
assert(afterEnemyTurn.status === "victory", "Kẻ địch bị hạ gục bởi DoT đầu lượt -> Người chơi chiến thắng ngay lập tức")
assert(afterEnemyTurn.enemy.hp === 0, "HP của kẻ địch đã về 0")

// =========================================================================
// TEST SUITE 7: Kiểm thử Hồi quy F-3.1 (Override) & F-3.2 (Refresh)
// =========================================================================
console.log("\n--- TEST SUITE 7: Kiểm thử Hồi quy F-3.1 (Override) & F-3.2 (Refresh) ---")

const unitReg: CombatUnit = cloneUnit(VANGUARD_INITIAL_UNIT)
unitReg.statusEffects = []

// 7.1 Ban đầu áp dụng Lá Chắn mạnh 80% trong 1 lượt
const strongShield: StatusEffect = {
  id: "strong-shield",
  type: "emergency-guard",
  name: "Khiên Lực Trường Cực Đại",
  desc: "Giảm 80% sát thương",
  duration: 1,
  value: 0.8,
  isDebuff: false,
}
applyStatusEffect(unitReg, strongShield, "refresh")
assert(unitReg.statusEffects[0].value === 0.8, "Khởi tạo lá chắn mạnh 80%")

// 7.2 F-3.1 Case 1: Hiệu ứng mới yếu hơn (10%) nhưng duration dài hơn (3 lượt) -> Override PHẢI BỊ TỪ CHỐI
const weakShieldLong: StatusEffect = {
  id: "weak-shield",
  type: "emergency-guard",
  name: "Khiên Mỏng Dài Hạn",
  desc: "Giảm 10% sát thương",
  duration: 3,
  value: 0.1,
  isDebuff: false,
}
const overrideRes1 = applyStatusEffect(unitReg, weakShieldLong, "override")
assert(overrideRes1.applied === false, "[F-3.1] Từ chối override khi hiệu ứng mới yếu hơn (kể cả khi duration dài hơn)")
assert(unitReg.statusEffects[0].value === 0.8, "[F-3.1] Bảo toàn giá trị khiên 80% mạnh hơn")
assert(unitReg.statusEffects[0].duration === 1, "[F-3.1] Bảo toàn duration của khiên mạnh")

// 7.3 F-3.1 Case 2: Hiệu ứng mới mạnh hơn hẳn (90%) nhưng duration ngắn hơn -> Override THÀNH CÔNG
const superShieldShort: StatusEffect = {
  id: "super-shield",
  type: "emergency-guard",
  name: "Khiên Siêu Cấp",
  desc: "Giảm 90% sát thương",
  duration: 1,
  value: 0.9,
  isDebuff: false,
}
const overrideRes2 = applyStatusEffect(unitReg, superShieldShort, "override")
assert(overrideRes2.applied === true, "[F-3.1] Override thành công khi hiệu ứng mới có cường độ vượt trội (90% > 80%)")
assert(unitReg.statusEffects[0].value === 0.9, "[F-3.1] Cập nhật giá trị khiên lên 90%")

// 7.4 F-3.1 Case 3: Cùng cường độ (90%), duration mới dài hơn -> Override THÀNH CÔNG
const superShieldLong: StatusEffect = {
  id: "super-shield-2",
  type: "emergency-guard",
  name: "Khiên Siêu Cấp Kéo Dài",
  desc: "Giảm 90% sát thương",
  duration: 4,
  value: 0.9,
  isDebuff: false,
}
const overrideRes3 = applyStatusEffect(unitReg, superShieldLong, "override")
assert(overrideRes3.applied === true, "[F-3.1] Cùng cường độ (90%): Override thành công khi duration mới dài hơn")
assert(unitReg.statusEffects[0].duration === 4, "[F-3.1] Thời hạn được cập nhật lên 4 lượt")

// 7.5 F-3.1 Case 4: Cùng cường độ (90%), duration mới ngắn hơn -> Override BỊ TỪ CHỐI
const superShieldShorter: StatusEffect = {
  id: "super-shield-3",
  type: "emergency-guard",
  name: "Khiên Siêu Cấp Ngắn",
  desc: "Giảm 90% sát thương",
  duration: 2,
  value: 0.9,
  isDebuff: false,
}
const overrideRes4 = applyStatusEffect(unitReg, superShieldShorter, "override")
assert(overrideRes4.applied === false, "[F-3.1] Cùng cường độ (90%): Từ chối override khi duration mới ngắn hơn")
assert(unitReg.statusEffects[0].duration === 4, "[F-3.1] Giữ nguyên duration 4 lượt")

// 7.6 F-3.2: Refresh với hiệu ứng yếu hơn KHÔNG ĐƯỢC làm giảm value của hiệu ứng hiện tại
const refreshWeaker: StatusEffect = {
  id: "refresh-weak",
  type: "emergency-guard",
  name: "Khiên Khẩn Cấp Tiêu Chuẩn",
  desc: "Giảm 50% sát thương",
  duration: 5,
  value: 0.5,
  isDebuff: false,
}
applyStatusEffect(unitReg, refreshWeaker, "refresh")
assert(unitReg.statusEffects[0].value === 0.9, "[F-3.2] Refresh bảo toàn giá trị cường độ cao nhất (vẫn giữ 90%, không bị tụt về 50%)")
assert(unitReg.statusEffects[0].duration === 5, "[F-3.2] Thời hạn được làm mới lên 5 lượt")

// =========================================================================
// TEST SUITE 8: Kiểm thử Hồi quy F-1.1 (Duration của hiệu ứng vừa áp dụng)
// =========================================================================
console.log("\n--- TEST SUITE 8: Kiểm thử Hồi quy F-1.1 (Duration bảo lưu ở lượt vừa tạo) ---")

const combat11 = createInitialCombatState("scout-drone", cloneUnit(VANGUARD_INITIAL_UNIT))
combat11.status = "player-turn"
combat11.player.sp = 50

// Người chơi dùng Emergency Guard (duration ban đầu = 2)
const stateAfterGuard = executePlayerAction(combat11, "emergency-guard")
assert(stateAfterGuard.status === "enemy-turn", "Sau khi dùng khiên chuyển sang lượt kẻ địch")
const pGuard = stateAfterGuard.player.statusEffects.find((e) => e.type === "emergency-guard")
assert(Boolean(pGuard), "Lá chắn tồn tại trên người chơi")
assert(pGuard?.duration === 2, "[F-1.1] Lá chắn vừa dùng KHÔNG bị trừ duration ngay trong chính lượt của nó (vẫn là 2 lượt)")

// Cho Kẻ địch đánh 1 lượt (Vòng 1 của địch)
const stateAfterE1 = executeEnemyAIAction(stateAfterGuard)
assert(stateAfterE1.status === "player-turn", "Kẻ địch đánh xong chuyển về lượt người chơi")
const pGuardRound2 = stateAfterE1.player.statusEffects.find((e) => e.type === "emergency-guard")
assert(Boolean(pGuardRound2), "Lá chắn vẫn còn tồn tại khi bắt đầu lượt 2 của người chơi")
assert(pGuardRound2?.duration === 2, "Lá chắn vẫn còn nguyên 2 lượt để bảo vệ")

// Người chơi đánh thường ở lượt 2 -> Giờ mới kết thúc 1 lượt hành động đầy đủ sau khi đã có khiên
const stateAfterAtk2 = executePlayerAction(stateAfterE1, "basic-attack")
const pGuardRound3 = stateAfterAtk2.player.statusEffects.find((e) => e.type === "emergency-guard")
assert(Boolean(pGuardRound3), "Lá chắn vẫn còn bảo vệ trong lượt thứ 2 của kẻ địch")
assert(pGuardRound3?.duration === 1, "[F-1.1] Lá chắn giảm từ 2 xuống 1 sau hiệp hành động thứ hai")

// =========================================================================
// TEST SUITE 9: Kiểm thử Hồi quy F-1.2 (DoT của Người chơi khi Địch bị Stun)
// =========================================================================
console.log("\n--- TEST SUITE 9: Kiểm thử Hồi quy F-1.2 (DoT kích hoạt đúng khi địch bị Stun) ---")

const combat12 = createInitialCombatState("scout-drone", cloneUnit(VANGUARD_INITIAL_UNIT))
combat12.status = "enemy-turn"
combat12.player.hp = 1000

// Đặt DoT lên người chơi (40 DoT mỗi đầu lượt)
combat12.player.statusEffects = [
  {
    id: "p-burn",
    type: "burn",
    name: "Đốt Cháy Plasma",
    desc: "40 DoT",
    duration: 2,
    value: 0,
    dotDamage: 40,
    stacks: 1,
    isDebuff: true,
  },
]

// Đặt Stun lên kẻ địch (1 lượt)
combat12.enemy.statusEffects = [
  {
    id: "e-stun",
    type: "stun",
    name: "Tê Liệt Năng Lượng",
    desc: "Mất lượt",
    duration: 1,
    value: 1,
    isDebuff: true,
  },
]

// Cho Kẻ địch chạy lượt AI (kẻ địch bị stun)
const afterStunnedEnemyTurn = executeEnemyAIAction(combat12)
assert(afterStunnedEnemyTurn.status === "player-turn", "Địch bị Stun -> Chuyển quyền hành động sang Người chơi")
assert(afterStunnedEnemyTurn.player.hp === 960, "[F-1.2] Người chơi VẪN NHẬN 40 sát thương DoT ngay cả khi Kẻ địch bị Stun!")
assert(afterStunnedEnemyTurn.logs.some((l) => l.text.includes("SÁT THƯƠNG DUY TRÌ")), "Nhật ký ghi nhận DoT đầu lượt của người chơi")

// =========================================================================
// TEST SUITE 10: Kiểm thử Hồi quy F-2.1 (Người chơi bị Stun xử lý an toàn)
// =========================================================================
console.log("\n--- TEST SUITE 10: Kiểm thử Hồi quy F-2.1 (Người chơi bị Stun) ---")

const combat21 = createInitialCombatState("scout-drone", cloneUnit(VANGUARD_INITIAL_UNIT))
combat21.status = "player-turn"
combat21.player.sp = 50
combat21.player.statusEffects = [
  {
    id: "p-stun-21",
    type: "stun",
    name: "Tê Liệt Lõi Năng Lượng",
    desc: "Mất lượt",
    duration: 1,
    value: 1,
    isDebuff: true,
  },
]

// Thử gọi executePlayerAction với một kỹ năng bất kỳ khi đang bị stun (Pulse Strike tốn 30 SP)
const stateAfterStunAction = executePlayerAction(combat21, "pulse-strike")
assert(stateAfterStunAction.status === "enemy-turn", "[F-2.1] Tự động chuyển sang lượt địch khi Người chơi bị Stun")
assert(stateAfterStunAction.player.sp === 55, "[F-2.1] Không bị trừ 30 SP của Pulse Strike (chỉ nhận +5 SP hồi phục tự nhiên cuối lượt)")
assert(!stateAfterStunAction.player.skillCooldowns["pulse-strike"], "[F-2.1] Không đưa kỹ năng vào Cooldown khi bị mất lượt")
assert(stateAfterStunAction.player.statusEffects.length === 0, "[F-2.1] Hiệu ứng Stun 1 lượt được giải phóng sau khi bỏ qua lượt")

console.log(`\n=== TỔNG KẾT KIỂM THỬ MILESTONE 4.1: ${passedTests} ĐẠT / ${failedTests} THẤT BẠI ===`)
if (failedTests === 0) {
  console.log("TẤT CẢ CÁC BÀI KIỂM THỬ MILESTONE 4.1 ĐÃ ĐẠT 100% HOÀN HẢO!")
} else {
  console.error("CÓ BÀI KIỂM THỬ THẤT BẠI!")
  process.exit(1)
}
