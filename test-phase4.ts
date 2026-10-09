import { STARFRONT_GEAR_DEFS, ENEMIES_DATA } from "./lib/game/data"
import {
  calculateCombatDamage,
  calculateTurnQueue,
  getEffectiveSpeed,
  getEffectiveDefense,
  getEffectiveAttack,
  getEffectiveEvasion,
  applyStatusEffect,
  tickUnitTurn,
  createInitialCombatState,
  executePlayerAction,
  executeEnemyAIAction,
  cloneUnit,
} from "./lib/game/engine"
import { buildPlayerCombatUnit, INITIAL_STARFRONT_PROGRESSION } from "./lib/game/progression"
import type { CombatUnit, CombatSkill, StatusEffect } from "./lib/game/types"

console.log("=== BẮT ĐẦU KIỂM THỬ TÍNH NĂNG STARFRONT PHASE 4 (M4.1 - M4.4) ===")

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

// -------------------------------------------------------------
// 1. KIỂM THỬ MILESTONE 4.1: HỆ THỐNG HIỆU ỨNG TRẠNG THÁI & QUY TẮC XẾP CHỒNG
// -------------------------------------------------------------
console.log("\n--- Kiểm thử Milestone 4.1: Status Effects & Stacking ---")

const dummyUnit: CombatUnit = {
  id: "test-unit",
  name: "Cơ Giáp Thử Nghiệm",
  title: "Đơn Vị Test",
  gearType: "vanguard",
  isPlayer: true,
  hp: 1000,
  maxHp: 1000,
  sp: 50,
  maxSp: 100,
  attack: 100,
  defense: 100,
  speed: 80,
  statusEffects: [],
  skills: [],
  skillCooldowns: {},
}

// 1.1 Thêm hiệu ứng mới
const testUnit1 = cloneUnit(dummyUnit)
const addBurnRes = applyStatusEffect(testUnit1, {
  type: "plasma-burn",
  name: "Cháy Plasma",
  desc: "DoT lửa plasma",
  duration: 3,
  value: 0.15,
  dotPercent: 0.15,
  isDebuff: true,
})
assert(addBurnRes.applied === true, "Áp dụng hiệu ứng Cháy Plasma thành công")
assert(testUnit1.statusEffects.length === 1, "statusEffects có 1 phần tử")
assert(testUnit1.statusEffects[0].duration === 3, "Thời hạn ban đầu là 3 lượt")

// 1.2 Làm mới thời hạn (Refresh rule)
applyStatusEffect(testUnit1, {
  type: "plasma-burn",
  name: "Cháy Plasma",
  desc: "DoT lửa plasma",
  duration: 4,
  value: 0.15,
  dotPercent: 0.15,
  stackType: "refresh",
  isDebuff: true,
})
assert(testUnit1.statusEffects[0].duration === 4, "Refresh thời hạn thành công lên 4 lượt")

// 1.3 Cộng dồn tầng (Intensity stacking: Acid Corrosion tối đa 3 tầng)
const testUnit2 = cloneUnit(dummyUnit)
applyStatusEffect(testUnit2, {
  type: "acid-corrosion",
  name: "Ăn Mòn Acid",
  desc: "Giảm DEF và DoT",
  duration: 3,
  value: 0.15,
  dotPercent: 0.08,
  stacks: 1,
  maxStacks: 3,
  stackType: "intensity",
  isDebuff: true,
})
assert(testUnit2.statusEffects[0].stacks === 1, "Tầng 1 Acid Corrosion khởi tạo chuẩn")

// Stack lần 2
applyStatusEffect(testUnit2, {
  type: "acid-corrosion",
  name: "Ăn Mòn Acid",
  desc: "Giảm DEF và DoT",
  duration: 3,
  value: 0.15,
  dotPercent: 0.08,
  stacks: 1,
  maxStacks: 3,
  stackType: "intensity",
  isDebuff: true,
})
assert(testUnit2.statusEffects[0].stacks === 2, "Cộng dồn thành công lên tầng 2")

// Stack lần 3
applyStatusEffect(testUnit2, {
  type: "acid-corrosion",
  name: "Ăn Mòn Acid",
  desc: "Giảm DEF và DoT",
  duration: 3,
  value: 0.15,
  dotPercent: 0.08,
  stacks: 1,
  maxStacks: 3,
  stackType: "intensity",
  isDebuff: true,
})
assert(testUnit2.statusEffects[0].stacks === 3, "Cộng dồn thành công lên tầng 3")

// Stack lần 4 (vượt ngưỡng maxStacks = 3)
applyStatusEffect(testUnit2, {
  type: "acid-corrosion",
  name: "Ăn Mòn Acid",
  desc: "Giảm DEF và DoT",
  duration: 3,
  value: 0.15,
  dotPercent: 0.08,
  stacks: 1,
  maxStacks: 3,
  stackType: "intensity",
  isDebuff: true,
})
assert(testUnit2.statusEffects[0].stacks === 3, "Không vượt quá maxStacks (vẫn giữ tầng 3)")

// 1.4 Kiểm tra trừ phòng ngự theo số tầng acid (3 tầng * 15% = 45% giảm DEF)
const effDef = getEffectiveDefense(testUnit2)
assert(effDef === 55, `Phòng thủ hiệu dụng giảm đúng 45% (100 -> ${effDef})`)

// 1.5 Kiểm tra DoT kích hoạt & dọn dẹp hiệu ứng hết hạn khi tickUnitTurn
const preHp = testUnit2.hp
const tickRes = tickUnitTurn(testUnit2)
assert(testUnit2.hp < preHp, "DoT Acid rút máu unit thành công")
assert(tickRes.dotLogs.length > 0, "Có sinh ra nhật ký DoT rút máu")
assert(testUnit2.statusEffects[0].duration === 2, "Thời hạn giảm từ 3 xuống 2 lượt")

// Giảm tiếp cho tới khi hết hạn
tickUnitTurn(testUnit2)
tickUnitTurn(testUnit2)
assert(testUnit2.statusEffects.length === 0, "Dọn dẹp hiệu ứng thành công khi duration về 0")

// -------------------------------------------------------------
// 2. KIỂM THỬ MILESTONE 4.2: CHIẾN THUẬT AI KẺ ĐỊCH THEO 4 ARCHETYPE
// -------------------------------------------------------------
console.log("\n--- Kiểm thử Milestone 4.2: Enemy AI Archetypes ---")

// 2.1 Kiểm tra archetype được gán đúng
assert(ENEMIES_DATA["scout-drone"].archetype === "disruptor", "Scout Drone có archetype = disruptor")
assert(ENEMIES_DATA["raider-mech"].archetype === "aggressive", "Raider Mech có archetype = aggressive")
assert(ENEMIES_DATA["siege-walker"].archetype === "adaptive-boss", "Siege Walker có archetype = adaptive-boss")

// 2.2 Disruptor AI: Scout Drone ưu tiên EMP khi người chơi chưa bị làm chậm
const testPlayer = buildPlayerCombatUnit({
  ...INITIAL_STARFRONT_PROGRESSION,
  activeGearId: "vanguard",
})
let simState = createInitialCombatState("scout-drone", testPlayer)
// Đặt lượt thành enemy-turn
simState.status = "enemy-turn"
simState.currentTurnActorId = simState.enemy.id
simState.enemy.sp = 50
const afterDroneAct = executeEnemyAIAction(simState)
assert(
  afterDroneAct.player.statusEffects.some((e) => e.type === "emp-slow"),
  "Scout Drone (Disruptor) dùng kỹ năng EMP gây hiệu ứng emp-slow lên người chơi",
)

// 2.3 Aggressive AI: Raider Mech dùng Tên Lửa dồn dame kết liễu khi người chơi HP < 45%
let simRaiderState = createInitialCombatState("raider-mech", testPlayer)
simRaiderState.player.hp = Math.round(simRaiderState.player.maxHp * 0.3) // 30% HP
simRaiderState.status = "enemy-turn"
simRaiderState.currentTurnActorId = simRaiderState.enemy.id
simRaiderState.enemy.sp = 60
const afterRaiderAct = executeEnemyAIAction(simRaiderState)
assert(
  afterRaiderAct.lastAction?.skillName === "Loạt Tên Lửa Định Hướng",
  "Raider Mech (Aggressive) chọn Loạt Tên Lửa dồn sát thương khi mục tiêu thấp máu",
)

// 2.4 AI không dùng kỹ năng trái luật khi thiếu SP hoặc đang hồi chiêu
let illegalCheckState = createInitialCombatState("raider-mech", testPlayer)
illegalCheckState.enemy.sp = 0 // Hết sạch SP
illegalCheckState.status = "enemy-turn"
const afterIllegalAct = executeEnemyAIAction(illegalCheckState)
assert(
  afterIllegalAct.lastAction?.skillName === "Pháo Tự Động Siêu Tốc",
  "Khi cạn SP, Raider Mech chuyển về đòn cơ bản tiêu tốn 0 SP",
)

// -------------------------------------------------------------
// 3. KIỂM THỬ MILESTONE 4.3: CƠ CHẾ BOSS ĐA PHA & TUYỆT KỸ BÁO TRƯỚC
// -------------------------------------------------------------
console.log("\n--- Kiểm thử Milestone 4.3: Multi-Phase Boss & Telegraphed Ultimate ---")

// 3.1 Boss Enrage / Phase 2 khi HP < 50%
let bossState = createInitialCombatState("siege-walker", testPlayer)
bossState.enemy.hp = Math.round(bossState.enemy.maxHp * 0.45) // Dưới 50% HP
bossState.status = "enemy-turn"
bossState.currentTurnActorId = bossState.enemy.id
const afterBossPhase2 = executeEnemyAIAction(bossState)

assert(afterBossPhase2.enemy.bossPhase === 2, "Boss Siege Walker chuyển sang Pha 2 khi HP < 50%")
assert(
  afterBossPhase2.enemy.statusEffects.some((e) => e.type === "boss-overdrive"),
  "Boss nhận buff Quá Tải Lõi Phản Ứng (Overdrive)",
)
const baseAtk = ENEMIES_DATA["siege-walker"].attack
const overdriveAtk = getEffectiveAttack(afterBossPhase2.enemy)
assert(overdriveAtk > baseAtk, `Sức tấn công tăng vượt bậc (+30%): ${baseAtk} -> ${overdriveAtk}`)

// 3.2 Telegraphed Ultimate Charge (Sạc Pháo Hạt Nhân)
let bossChargeState = createInitialCombatState("siege-walker", testPlayer)
bossChargeState.turnNumber = 3 // Vòng 3 thỏa mãn điều kiện nạp pháo
bossChargeState.status = "enemy-turn"
bossChargeState.currentTurnActorId = bossChargeState.enemy.id
bossChargeState.enemy.sp = 100
// Kích hoạt skill charge
const chargeSkill = bossChargeState.enemy.skills.find((s) => s.id === "siege-charge")!
bossChargeState.enemy.skillCooldowns["siege-charge"] = 0
const afterCharge = executeEnemyAIAction(bossChargeState)

assert(afterCharge.enemy.isChargingUltimate === true, "Boss bật trạng thái isChargingUltimate = true")
assert(afterCharge.telegraphedAttack?.isCharging === true, "State ghi nhận telegraphedAttack đang nạp")

// 3.3 Lượt tiếp theo: Xả đòn hạt nhân hủy diệt
afterCharge.status = "enemy-turn"
afterCharge.currentTurnActorId = afterCharge.enemy.id
const playerHpBeforeBlast = afterCharge.player.hp
const afterBlast = executeEnemyAIAction(afterCharge)
assert(
  afterBlast.lastAction?.skillName === "Pháo Hạt Nhân Tận Diệt",
  "Lượt sau Boss xả tuyệt kỹ 'Pháo Hạt Nhân Tận Diệt'",
)
assert(afterBlast.enemy.isChargingUltimate === false, "Sau khi xả chiêu, Boss tắt trạng thái nạp")
assert(afterBlast.player.hp < playerHpBeforeBlast, "Người chơi nhận sát thương cực lớn từ đòn tối thượng")

// 3.4 Ngắt đòn nạp khi Boss bị Choáng (Stun)
let bossInterruptState = createInitialCombatState("siege-walker", testPlayer)
bossInterruptState.enemy.isChargingUltimate = true
bossInterruptState.telegraphedAttack = {
  isCharging: true,
  skillName: "Pháo Hạt Nhân Tận Diệt",
  turnsLeft: 1,
  description: "Cảnh báo",
}
// Gán hiệu ứng Stun lên Boss
bossInterruptState.enemy.statusEffects.push({
  id: "test-stun",
  type: "stun",
  name: "Quá Nhiệt Tê Liệt",
  desc: "Mất lượt",
  duration: 1,
  value: 0,
})
bossInterruptState.status = "enemy-turn"
const afterStunInterrupted = executeEnemyAIAction(bossInterruptState)
assert(afterStunInterrupted.enemy.isChargingUltimate === false, "Stun ngắt thành công đòn nạp của Boss")
assert(afterStunInterrupted.telegraphedAttack === null, "telegraphedAttack bị xóa bỏ")

// -------------------------------------------------------------
// 4. KIỂM THỬ MILESTONE 4.4: DYNAMIC TURN QUEUE & CÂN BẰNG SÁT THƯƠNG
// -------------------------------------------------------------
console.log("\n--- Kiểm thử Milestone 4.4: Dynamic Turn Queue, Evasion & Damage ---")

// 4.1 Dynamic Turn Queue tính lại ngay khi SPD bị thay đổi
const playerVanguard = buildPlayerCombatUnit({
  ...INITIAL_STARFRONT_PROGRESSION,
  activeGearId: "vanguard", // SPD 85
})
const enemyDrone = cloneUnit(ENEMIES_DATA["scout-drone"]) // SPD 110
const queue1 = calculateTurnQueue(playerVanguard, enemyDrone)
assert(queue1[0] === enemyDrone.id, "Ban đầu Drone (110) đi trước Vanguard (85)")

// Áp dụng EMP Slow lên Drone (-25 SPD -> còn 85 SPD)
enemyDrone.statusEffects.push({
  id: "slow-test",
  type: "emp-slow",
  name: "Slow",
  desc: "Giảm 30 SPD",
  duration: 2,
  value: 30, // 110 - 30 = 80 SPD
})
const queue2 = calculateTurnQueue(playerVanguard, enemyDrone)
assert(queue2[0] === playerVanguard.id, "Sau khi Drone bị chậm (SPD 80 < 85), Vanguard vượt lên đi trước!")

// 4.2 Xuyên giáp (Armor Penetration) gia tăng sát thương
const heavyDefender = cloneUnit(dummyUnit)
heavyDefender.defense = 200
const normalSkill: CombatSkill = {
  id: "norm",
  name: "Bắn Thường",
  nameEn: "Normal",
  desc: "",
  spCost: 0,
  cooldown: 0,
  targetType: "single-enemy",
  damageMultiplier: 1.0,
}
const penSkill: CombatSkill = {
  id: "pen",
  name: "Bắn Xuyên Giáp",
  nameEn: "Penetration",
  desc: "",
  spCost: 0,
  cooldown: 0,
  targetType: "single-enemy",
  damageMultiplier: 1.0,
  armorPenetration: 0.5, // Xuyên 50% giáp
}

// Chạy 30 lần tính trung bình sát thương để bù trừ random variance
let normalDmgTotal = 0
let penDmgTotal = 0
for (let i = 0; i < 30; i++) {
  const attacker = cloneUnit(dummyUnit)
  attacker.attack = 200
  attacker.critRate = 0 // bỏ crit để so sánh chuẩn
  normalDmgTotal += calculateCombatDamage(attacker, heavyDefender, normalSkill).damage
  penDmgTotal += calculateCombatDamage(attacker, heavyDefender, penSkill).damage
}
assert(penDmgTotal > normalDmgTotal, `Đòn xuyên giáp gây sát thương cao hơn đòn thường (${Math.round(penDmgTotal / 30)} > ${Math.round(normalDmgTotal / 30)})`)

// 4.3 Kiểm tra né tránh (Evasion)
const evasiveUnit = cloneUnit(dummyUnit)
evasiveUnit.evasion = 60 // 60% né
let evadedCount = 0
for (let i = 0; i < 20; i++) {
  const evaAtk = calculateCombatDamage(dummyUnit, evasiveUnit, normalSkill)
  if (evaAtk.isEvaded && evaAtk.damage === 0) {
    evadedCount++
  }
}
assert(evadedCount > 0, `Đơn vị có chỉ số né tránh kích hoạt thành công né đòn (${evadedCount}/20 lần né đòn, sát thương = 0)`)

// 4.4 Kiểm tra chuỗi log không còn từ khóa 'Vanguard' cố định
const aegisPlayer = buildPlayerCombatUnit({
  ...INITIAL_STARFRONT_PROGRESSION,
  activeGearId: "aegis",
})
const aegisCombat = createInitialCombatState("scout-drone", aegisPlayer)
const initSpeedLog = aegisCombat.logs.find((l) => l.text.includes("[TỐC ĐỘ]"))
assert(Boolean(initSpeedLog), "Có log thông báo tốc độ khởi tạo")
assert(!initSpeedLog?.text.includes("Vanguard"), `Log khởi tạo của Aegis Gear không chứa từ 'Vanguard': "${initSpeedLog?.text}"`)
assert(initSpeedLog?.text.includes("Aegis Gear") || initSpeedLog?.text.includes("Aegis"), "Log khởi tạo ghi nhận đúng tên Aegis Gear")

console.log(`\n=== TỔNG KẾT KIỂM THỬ PHASE 4: ${passedTests} ĐẠT / ${failedTests} THẤT BẠI ===`)
if (failedTests > 0) {
  process.exit(1)
} else {
  console.log("TẤT CẢ CÁC BÀI KIỂM THỬ PHASE 4 ĐỀU ĐẠT CHUẨN XUẤT SẮC!")
}
