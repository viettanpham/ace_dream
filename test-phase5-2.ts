import assert from "node:assert"
import { STARFRONT_GEAR_DEFS, ENEMIES_DATA } from "./lib/game/data"
import {
  createInitialCombatState,
  executePlayerAction,
  executeEnemyAIAction,
  applyStatusEffect,
  tickUnitTurn,
  getEffectiveEvasion,
  getEffectiveSpeed,
  getEffectiveDefense,
  cloneUnit,
} from "./lib/game/engine"
import { buildPlayerCombatUnit, INITIAL_STARFRONT_PROGRESSION } from "./lib/game/progression"
import type { CombatUnit, StarfrontProgression } from "./lib/game/types"

console.log("=== BẮT ĐẦU KIỂM THỬ STARFRONT PHASE 5 (MILESTONE 5.2: GEAR CLASS IDENTITY & PASSIVES) ===")

let passedTests = 0
let failedTests = 0

function test(condition: boolean, desc: string) {
  if (condition) {
    console.log(`[PASS] ${desc}`)
    passedTests++
  } else {
    console.error(`[FAIL] ${desc}`)
    failedTests++
  }
}

// -------------------------------------------------------------
// 1. KIỂM THỬ KHỞI TẠO BẢN SẮC & NỘI TẠI (PASSIVE REGISTRY)
// -------------------------------------------------------------
console.log("\n--- 1. Kiểm thử Cấu hình Nội tại trong STARFRONT_GEAR_DEFS ---")

const vanguardDef = STARFRONT_GEAR_DEFS.vanguard
const falconDef = STARFRONT_GEAR_DEFS.falcon
const aegisDef = STARFRONT_GEAR_DEFS.aegis

test(vanguardDef.passive !== undefined && vanguardDef.passive.id === "stable-core", "Vanguard có nội tại 'Lõi Năng Lượng Ổn Định' (stable-core)")
test(falconDef.passive !== undefined && falconDef.passive.id === "mach-aero", "Falcon có nội tại 'Khí Động Học Mach' (mach-aero)")
test(aegisDef.passive !== undefined && aegisDef.passive.id === "titan-reactive", "Aegis có nội tại 'Giáp Phản Lực Titan' (titan-reactive)")
test(vanguardDef.passive.details.length >= 2, "Vanguard passive có đầy đủ chi tiết chỉ số")
test(falconDef.passive.details.length >= 2, "Falcon passive có đầy đủ chi tiết chỉ số")
test(aegisDef.passive.details.length >= 2, "Aegis passive có đầy đủ chi tiết chỉ số")

// -------------------------------------------------------------
// 2. KIỂM THỬ NỘI TẠI VANGUARD: LÕI NĂNG LƯỢNG ỔN ĐỊNH
// -------------------------------------------------------------
console.log("\n--- 2. Kiểm thử Vanguard: Hồi thêm SP & Giảm Cooldown mỗi 3 lượt ---")

const vgProg: StarfrontProgression = {
  ...INITIAL_STARFRONT_PROGRESSION,
  activeGearId: "vanguard",
}
const vanguardUnit = buildPlayerCombatUnit(vgProg)
test(vanguardUnit.gearType === "vanguard", "CombatUnit của Vanguard có gearType = vanguard")

// 2.1 Hồi thêm SP (+5 SP tự nhiên + 5 SP nội tại = +10 SP mỗi lượt)
vanguardUnit.sp = 50
const tickTurn1 = tickUnitTurn(vanguardUnit, 1)
test(vanguardUnit.sp === 60, `Vanguard hồi đúng +10 SP mỗi lượt (50 -> ${vanguardUnit.sp})`)
test(
  tickTurn1.passiveLogs.some((l) => l.text.includes("[NỘI TẠI VANGUARD ⚡]")),
  "Có ghi nhận log nội tại Vanguard hồi thêm +5 SP",
)

// 2.2 Kiểm thử Lượt 1 & Lượt 2: KHÔNG kích hoạt giảm cooldown thêm (Non-trigger case)
vanguardUnit.skillCooldowns = { "pulse-strike": 3 }
const tickTurn2 = tickUnitTurn(vanguardUnit, 2)
// Giảm 1 lượt tự nhiên: 3 -> 2. Không giảm thêm lượt thứ 2 vì lượt 2 không chia hết cho 3
test(vanguardUnit.skillCooldowns["pulse-strike"] === 2, "Lượt 2 không phải chu kỳ: Chỉ giảm 1 CD tự nhiên (3 -> 2), không giảm thêm")
test(
  !tickTurn2.passiveLogs.some((l) => l.text.includes("chu kỳ 3 lượt")),
  "Lượt 2 không kích hoạt log chu kỳ giảm cooldown của Vanguard",
)

// 2.3 Kiểm thử Lượt 3: KÍCH HOẠT giảm thêm 1 lượt cooldown
const tickTurn3 = tickUnitTurn(vanguardUnit, 3)
// Ở lượt 3: Giảm 1 lượt tự nhiên (2 -> 1) VÀ giảm thêm 1 lượt nội tại (1 -> 0)!
test(vanguardUnit.skillCooldowns["pulse-strike"] === 0, `Lượt 3 chu kỳ: Kích hoạt giảm thêm 1 CD (2 -> 0), chiêu đã sẵn sàng`)
test(
  tickTurn3.passiveLogs.some((l) => l.text.includes("chu kỳ 3 lượt")),
  "Lượt 3 có ghi nhận log chu kỳ giảm cooldown của Vanguard",
)

// -------------------------------------------------------------
// 3. KIỂM THỬ NỘI TẠI FALCON: KHÍ ĐỘNG HỌC MACH
// -------------------------------------------------------------
console.log("\n--- 3. Kiểm thử Falcon: +15% Né Tránh bẩm sinh & Đòn Bắn Bồi khi Bạo Kích ---")

const flProg: StarfrontProgression = {
  ...INITIAL_STARFRONT_PROGRESSION,
  activeGearId: "falcon",
}
const falconUnit = buildPlayerCombatUnit(flProg)
test(falconUnit.gearType === "falcon", "CombatUnit của Falcon có gearType = falcon")

// 3.1 Né tránh bẩm sinh +15%
const falconEvasion = getEffectiveEvasion(falconUnit)
const vanguardEvasion = getEffectiveEvasion(vanguardUnit)
test(falconEvasion >= 15, `Falcon có tỉ lệ né tránh bẩm sinh ít nhất 15% (thực tế: ${falconEvasion}%)`)
test(falconEvasion === vanguardEvasion + 15, `Falcon né tránh cao hơn Vanguard đúng +15% (${falconEvasion}% vs ${vanguardEvasion}%)`)

// 3.2 Bạo Kích kích hoạt thêm Đòn Bắn Bồi (0 SP)
let falconCombat = createInitialCombatState("scout-drone", falconUnit)
falconCombat.status = "player-turn"
const enemyHpBefore = falconCombat.enemy.hp

// Thực hiện tấn công với tùy chọn ép bạo kích và ép bắn bồi
const afterFalconCrit = executePlayerAction(falconCombat, falconUnit.skills[0].id, {
  forceCrit: true,
  forceFalconFollowUp: true,
})
test(afterFalconCrit.lastAction?.isCrit === true, "Đòn đánh của Falcon là Bạo Kích")
test(
  afterFalconCrit.logs.some((l) => l.text.includes("[NỘI TẠI FALCON ⚡] Khí Động Học Mach kích hoạt! Đòn bạo kích khai hỏa tiếp một đòn bắn bồi")),
  "Có ghi nhận log đòn bắn bồi không tốn SP của Falcon",
)
const totalDamageDealt = enemyHpBefore - afterFalconCrit.enemy.hp
const primaryDmg = afterFalconCrit.lastAction?.damage || 0
test(totalDamageDealt > primaryDmg, `Tổng sát thương (${totalDamageDealt}) lớn hơn sát thương đòn chính (${primaryDmg}) do có đòn bắn bồi`)

// 3.3 Đòn đánh thường (KHÔNG bạo kích) -> KHÔNG kích hoạt bắn bồi (Non-trigger case)
let falconNormalCombat = createInitialCombatState("scout-drone", falconUnit)
falconNormalCombat.status = "player-turn"
const afterFalconNormal = executePlayerAction(falconNormalCombat, falconUnit.skills[0].id, {
  forceCrit: false,
})
test(afterFalconNormal.lastAction?.isCrit === false, "Đòn đánh thường không bạo kích")
test(
  !afterFalconNormal.logs.some((l) => l.text.includes("Khí Động Học Mach kích hoạt")),
  "Đòn đánh thường KHÔNG kích hoạt đòn bắn bồi",
)

// -------------------------------------------------------------
// 4. KIỂM THỬ NỘI TẠI AEGIS: GIÁP PHẢN LỰC TITAN
// -------------------------------------------------------------
console.log("\n--- 4. Kiểm thử Aegis: Phản 20% Sát Thương & Kháng 50% Làm Chậm / Phá Giáp ---")

const agProg: StarfrontProgression = {
  ...INITIAL_STARFRONT_PROGRESSION,
  activeGearId: "aegis",
}
const aegisUnit = buildPlayerCombatUnit(agProg)
test(aegisUnit.gearType === "aegis", "CombatUnit của Aegis có gearType = aegis")

// 4.1 Phản lại 20% sát thương nhận vào cho kẻ tấn công
let aegisCombat = createInitialCombatState("raider-mech", aegisUnit)
aegisCombat.status = "enemy-turn"
const enemyHpBeforeReflect = aegisCombat.enemy.hp

// Địch tấn công trúng Aegis
const afterEnemyHitsAegis = executeEnemyAIAction(aegisCombat, { forceNoEvade: true })
const dmgReceivedByAegis = afterEnemyHitsAegis.lastAction?.damage || 0
test(dmgReceivedByAegis > 0, `Aegis nhận ${dmgReceivedByAegis} sát thương từ địch`)

const expectedReflectDmg = Math.max(1, Math.round(dmgReceivedByAegis * 0.20))
const actualEnemyHpLost = enemyHpBeforeReflect - afterEnemyHitsAegis.enemy.hp
test(
  actualEnemyHpLost === expectedReflectDmg,
  `Kẻ địch bị mất đúng 20% sát thương phản đòn (${expectedReflectDmg} HP phản hồi)`,
)
test(
  afterEnemyHitsAegis.logs.some((l) => l.text.includes("[NỘI TẠI AEGIS 🛡️] Giáp Phản Lực Titan kích hoạt")),
  "Có ghi nhận log phản sát thương 20% của Aegis",
)

// 4.2 Kiểm thử Non-Aegis (Vanguard) bị đánh -> KHÔNG CÓ phản đòn (Non-trigger case)
let vanguardHurtCombat = createInitialCombatState("raider-mech", vanguardUnit)
vanguardHurtCombat.status = "enemy-turn"
const enemyHpBeforeVg = vanguardHurtCombat.enemy.hp
const afterEnemyHitsVg = executeEnemyAIAction(vanguardHurtCombat, { forceNoEvade: true })
test(
  afterEnemyHitsVg.enemy.hp === enemyHpBeforeVg,
  "Vanguard bị đánh: Kẻ địch KHÔNG nhận bất kỳ sát thương phản đòn nào",
)
test(
  !afterEnemyHitsVg.logs.some((l) => l.text.includes("phản đòn")),
  "Vanguard không có log phản đòn gai",
)

// 4.3 Kháng 50% hiệu ứng làm chậm (EMP Slow)
const testAegisUnit = cloneUnit(aegisUnit)
const empResult = applyStatusEffect(testAegisUnit, {
  type: "emp-slow",
  name: "EMP Phóng Thử",
  desc: "Giảm 30 Tốc độ (SPD)",
  duration: 2,
  value: 30, // Gốc giảm 30 SPD
  isDebuff: true,
})
test(empResult.applied === true, "Áp dụng EMP lên Aegis thành công")
test(
  empResult.effect.value === 15,
  `Mức giảm tốc độ bị triệt tiêu 50%: từ 30 SPD xuống còn ${empResult.effect.value} SPD`,
)
test(
  empResult.logText.includes("[NỘI TẠI AEGIS 🛡️]"),
  "Log ghi nhận Aegis kháng 50% hiệu lực làm chậm",
)

// 4.4 Kháng 50% hiệu ứng phá giáp (Armor Break)
const abResult = applyStatusEffect(testAegisUnit, {
  type: "armor-break",
  name: "Phá Giáp Phóng Thử",
  desc: "Giảm 35% Phòng ngự",
  duration: 2,
  value: 0.35, // Gốc giảm 35% DEF
  isDebuff: true,
})
test(
  Math.abs(abResult.effect.value - 0.175) < 0.001,
  `Mức phá giáp bị triệt tiêu 50%: từ 35% xuống còn ${Math.round(abResult.effect.value * 1000) / 10}%`,
)
test(
  abResult.logText.includes("[NỘI TẠI AEGIS 🛡️]"),
  "Log ghi nhận Aegis kháng 50% hiệu lực phá giáp",
)

// 4.5 Kiểm thử Đơn vị KHÔNG PHẢI Aegis (Falcon) bị dính EMP và Phá Giáp -> Nhận 100% hiệu ứng (Không kháng)
const testFalconUnit = cloneUnit(falconUnit)
const falconEmpRes = applyStatusEffect(testFalconUnit, {
  type: "emp-slow",
  name: "EMP Thường",
  desc: "Giảm 30 SPD",
  duration: 2,
  value: 30,
  isDebuff: true,
})
test(falconEmpRes.effect.value === 30, "Falcon nhận nguyên 100% mức giảm tốc độ (30 SPD)")
test(!falconEmpRes.logText.includes("[NỘI TẠI AEGIS 🛡️]"), "Falcon không có log kháng hiệu ứng")

// -------------------------------------------------------------
// 5. KIỂM THỬ KẾT LIỄU BẰNG PHẢN SÁT THƯƠNG (VICTORY BY REFLECTION)
// -------------------------------------------------------------
console.log("\n--- 5. Kiểm thử Tiêu diệt kẻ địch bằng Phản Sát Thương Aegis ---")

let lowHpEnemyState = createInitialCombatState("scout-drone", aegisUnit)
lowHpEnemyState.enemy.hp = 10 // Kẻ địch chỉ còn 10 HP
lowHpEnemyState.status = "enemy-turn"

const afterKillByReflect = executeEnemyAIAction(lowHpEnemyState, { forceNoEvade: true })
test(afterKillByReflect.enemy.hp <= 0, "Kẻ địch bị tiêu diệt bởi sát thương phản đòn")
test(afterKillByReflect.status === "victory", "Trận đấu kết thúc CHIẾN THẮNG khi kẻ địch chết vì phản sát thương")
test(
  afterKillByReflect.logs.some((l) => l.text.includes("[CHIẾN THẮNG 🏆] Mục tiêu") && l.text.includes("phản đòn")),
  "Log ghi nhận chiến thắng xuất sắc bằng sát thương phản đòn từ Giáp Phản Lực Titan",
)

console.log(`\n=== TỔNG KẾT KIỂM THỬ MILESTONE 5.2: ${passedTests} ĐẠT / ${failedTests} THẤT BẠI ===`)
if (failedTests === 0) {
  console.log("🎉 TẤT CẢ CÁC BÀI TEST GEAR CLASS IDENTITY & PASSIVES ĐỀU ĐẠT CHUẨN XUẤT SẮC!")
} else {
  process.exit(1)
}
