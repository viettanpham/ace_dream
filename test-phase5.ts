import assert from "node:assert"
import {
  ENHANCEMENT_TABLE,
  getEnhancedItemStats,
  getItemDisplayName,
  enhanceItem,
  calculateTotalGearStats,
  buildPlayerCombatUnit,
  applyVictoryReward,
  INITIAL_STARFRONT_PROGRESSION,
  SAMPLE_STARFRONT_ITEMS,
} from "./lib/game/progression"
import type { StarfrontItem, StarfrontProgression } from "./lib/game/types"

console.log("=== BẮT ĐẦU KIỂM THỬ STARFRONT PHASE 5 (MILESTONE 5.1: CƯỜNG HÓA TRANG BỊ) ===")

// -------------------------------------------------------------
// 1. KIỂM THỬ BẢNG CẤU HÌNH CƯỜNG HÓA (ENHANCEMENT TABLE 1 - 10)
// -------------------------------------------------------------
console.log("\n--- 1. Kiểm thử Bảng cấu hình Cường Hóa (+1 đến +10) ---")

assert(Object.keys(ENHANCEMENT_TABLE).length === 10, "Bảng cấu hình có đúng 10 cấp độ (+1 đến +10)")

// 1.1 Cấp +1 đến +4 tỉ lệ thành công 100% (An toàn tuyệt đối)
for (let lvl = 1; lvl <= 4; lvl++) {
  const cfg = ENHANCEMENT_TABLE[lvl]
  assert(cfg.successRate === 1.0, `Cấp +${lvl} có tỉ lệ thành công 100%`)
  assert(cfg.creditsCost > 0, `Cấp +${lvl} có chi phí Credits hợp lệ`)
  assert(cfg.alloyCost > 0, `Cấp +${lvl} có chi phí Alloy hợp lệ`)
}
console.log("[PASS] Cấp +1 đến +4 có tỉ lệ thành công 100% (An toàn tuyệt đối)")

// 1.2 Cấp +5 đến +7 tỉ lệ giảm dần (80% -> 70% -> 60%)
assert(ENHANCEMENT_TABLE[5].successRate === 0.8, "Cấp +5 có tỉ lệ 80%")
assert(ENHANCEMENT_TABLE[6].successRate === 0.7, "Cấp +6 có tỉ lệ 70%")
assert(ENHANCEMENT_TABLE[7].successRate === 0.6, "Cấp +7 có tỉ lệ 60%")
console.log("[PASS] Cấp +5 đến +7 có tỉ lệ giảm dần đúng chuẩn (80% -> 70% -> 60%)")

// 1.3 Cấp +8 đến +10 thử thách cao (45% -> 35% -> 25%)
assert(ENHANCEMENT_TABLE[8].successRate === 0.45, "Cấp +8 có tỉ lệ 45%")
assert(ENHANCEMENT_TABLE[9].successRate === 0.35, "Cấp +9 có tỉ lệ 35%")
assert(ENHANCEMENT_TABLE[10].successRate === 0.25, "Cấp +10 có tỉ lệ 25%")
console.log("[PASS] Cấp +8 đến +10 có tỉ lệ đúng chuẩn (45% -> 35% -> 25%)")

// -------------------------------------------------------------
// 2. KIỂM THỬ CÔNG THỨC CHỈ SỐ CƯỜNG HÓA TĂNG TRƯỞNG LIÊN TỤC
// -------------------------------------------------------------
console.log("\n--- 2. Kiểm thử Công thức Chỉ số Cường Hóa (+0 đến +10) ---")

const testWeapon: StarfrontItem = {
  id: "test_weapon_carbine",
  name: "Súng Xung Điện Pulse Carbine",
  slot: "weapon",
  rarity: "common",
  desc: "Vũ khí thử nghiệm",
  attackBonus: 15,
}

// 2.1 Cấp +0 giữ nguyên chỉ số gốc
const stats0 = getEnhancedItemStats({ ...testWeapon, enhancementLevel: 0 })
assert(stats0.attackBonus === 15, "Cấp +0 giữ nguyên chỉ số 15 ATK")
assert(getItemDisplayName({ ...testWeapon, enhancementLevel: 0 }) === "Súng Xung Điện Pulse Carbine", "Tên hiển thị +0 không có nhãn")
console.log("[PASS] Cấp +0 giữ nguyên chỉ số và tên gốc")

// 2.2 Tăng trưởng đơn điệu nghiêm ngặt qua từng cấp từ +0 đến +10
let prevAtk = stats0.attackBonus
for (let lvl = 1; lvl <= 10; lvl++) {
  const itemLvl: StarfrontItem = { ...testWeapon, enhancementLevel: lvl }
  const stats = getEnhancedItemStats(itemLvl)
  const displayName = getItemDisplayName(itemLvl)

  assert(stats.attackBonus > prevAtk, `Cấp +${lvl} ATK (${stats.attackBonus}) cao hơn cấp +${lvl - 1} (${prevAtk})`)
  assert(displayName === `[+${lvl}] Súng Xung Điện Pulse Carbine`, `Tên hiển thị cấp +${lvl} chuẩn`)
  prevAtk = stats.attackBonus
}
console.log(`[PASS] Tăng trưởng ATK tăng liên tục từ 15 lên ${prevAtk} ở cấp +10`)

// 2.3 Kiểm thử tăng trưởng Khiên (DEF & HP) và Động cơ (SPD)
const testShield: StarfrontItem = {
  id: "test_shield",
  name: "Giáp Hợp Kim Composite",
  slot: "shield",
  rarity: "common",
  desc: "Khiên thử nghiệm",
  defenseBonus: 12,
  hpBonus: 120,
}
const shield10 = getEnhancedItemStats({ ...testShield, enhancementLevel: 10 })
assert(shield10.defenseBonus > 12, "DEF tăng trưởng ở cấp +10")
assert(shield10.hpBonus > 120, "HP tăng trưởng ở cấp +10")

const testEngine: StarfrontItem = {
  id: "test_engine",
  name: "Động Cơ Đẩy Ion Tiêu Chuẩn",
  slot: "engine",
  rarity: "common",
  desc: "Động cơ thử nghiệm",
  speedBonus: 8,
}
const engine10 = getEnhancedItemStats({ ...testEngine, enhancementLevel: 10 })
assert(engine10.speedBonus > 8, "SPD tăng trưởng ở cấp +10")
console.log("[PASS] Khiên (DEF/HP) và Động cơ (SPD) tăng trưởng vượt bậc ở cấp +10")

// -------------------------------------------------------------
// 3. KIỂM THỬ HÀM CƯỜNG HÓA VÀ CƠ CHẾ AN TOÀN (ANTI-FRUSTRATION)
// -------------------------------------------------------------
console.log("\n--- 3. Kiểm thử Hàm enhanceItem & Cơ chế An toàn ---")

let testProg: StarfrontProgression = {
  ...INITIAL_STARFRONT_PROGRESSION,
  credits: 10000,
  alloy: 100,
  inventory: [{ ...testWeapon, enhancementLevel: 0 }],
}

// 3.1 Cường hóa thành công từ +0 lên +1
const res1 = enhanceItem(testProg, testWeapon.id, true)
assert(res1.result.success === true, "Cường hóa thành công khi forceSuccess = true")
assert(res1.result.oldLevel === 0, "Cấp cũ là 0")
assert(res1.result.newLevel === 1, "Cấp mới là 1")
assert(res1.updated.credits === 10000 - 150, "Đã trừ đúng 150 Credits")
assert(res1.updated.alloy === 100 - 2, "Đã trừ đúng 2 Alloy")
assert(res1.updated.inventory[0].enhancementLevel === 1, "Trang bị trong kho đồ có cấp 1")
testProg = res1.updated
console.log("[PASS] Cường hóa +0 lên +1 thành công, trừ đúng tài nguyên")

// 3.2 Cơ chế an toàn (Anti-Frustration): Thất bại không bao giờ phá hủy hay tụt cấp
const resFail = enhanceItem(testProg, testWeapon.id, false) // Giả định thất bại
assert(resFail.result.success === false, "Kết quả ghi nhận thất bại")
assert(resFail.result.oldLevel === 1, "Cấp cũ là 1")
assert(resFail.result.newLevel === 1, "Cấp mới VẪN LÀ 1 (Không bị tụt cấp!)")
assert(resFail.updated.inventory[0].enhancementLevel === 1, "Trang bị trong kho giữ nguyên cấp 1 (Không bị vỡ!)")
assert(resFail.updated.credits < testProg.credits, "Tiêu hao Credits cho lần thử")
assert((resFail.updated.alloy ?? 0) < (testProg.alloy ?? 0), "Tiêu hao Alloy cho lần thử")
console.log("[PASS] Cơ chế an toàn hoạt động chuẩn xác: Thất bại giữ nguyên cấp, không bao giờ mất đồ!")

// 3.3 Chặn cường hóa khi thiếu Credits
const poorCreditsProg: StarfrontProgression = {
  ...testProg,
  credits: 50,
  alloy: 100,
}
const resPoorCredits = enhanceItem(poorCreditsProg, testWeapon.id)
assert(resPoorCredits.result.success === false, "Từ chối cường hóa khi thiếu Credits")
assert(resPoorCredits.result.message.includes("Không đủ Credits"), "Thông báo lỗi thiếu Credits chính xác")
console.log("[PASS] Chặn an toàn khi người chơi không đủ Credits")

// 3.4 Chặn cường hóa khi thiếu Alloy
const poorAlloyProg: StarfrontProgression = {
  ...testProg,
  credits: 10000,
  alloy: 0,
}
const resPoorAlloy = enhanceItem(poorAlloyProg, testWeapon.id)
assert(resPoorAlloy.result.success === false, "Từ chối cường hóa khi thiếu Alloy")
assert(resPoorAlloy.result.message.includes("Không đủ Hợp Kim"), "Thông báo lỗi thiếu Alloy chính xác")
console.log("[PASS] Chặn an toàn khi người chơi không đủ Alloy")

// 3.5 Chặn cường hóa khi trang bị đã đạt cấp tối đa +10
let maxProg: StarfrontProgression = {
  ...testProg,
  credits: 50000,
  alloy: 500,
  inventory: [{ ...testWeapon, enhancementLevel: 10 }],
}
const resMax = enhanceItem(maxProg, testWeapon.id)
assert(resMax.result.success === false, "Từ chối cường hóa khi trang bị đã đạt cấp +10")
assert(resMax.result.message.includes("tối thượng"), "Thông báo đã đạt cấp tối đa")
console.log("[PASS] Chặn an toàn khi trang bị đã đạt cấp tối thượng (+10)")

// -------------------------------------------------------------
// 4. KIỂM THỬ TÍCH HỢP CHỈ SỐ BUỒNG LÁI & COMBAT UNIT
// -------------------------------------------------------------
console.log("\n--- 4. Kiểm thử Tích hợp Chỉ số Buồng lái & Combat Unit ---")

const baseUnitProg: StarfrontProgression = {
  ...INITIAL_STARFRONT_PROGRESSION,
  inventory: [
    { ...SAMPLE_STARFRONT_ITEMS[0], enhancementLevel: 0 },
    { ...SAMPLE_STARFRONT_ITEMS[4], enhancementLevel: 0 },
    { ...SAMPLE_STARFRONT_ITEMS[7], enhancementLevel: 0 },
  ],
  equipped: {
    weapon: SAMPLE_STARFRONT_ITEMS[0].id,
    shield: SAMPLE_STARFRONT_ITEMS[4].id,
    engine: SAMPLE_STARFRONT_ITEMS[7].id,
  },
}

const baseStats = calculateTotalGearStats(
  "vanguard",
  1,
  baseUnitProg.inventory,
  baseUnitProg.equipped,
)

const enhancedUnitProg: StarfrontProgression = {
  ...INITIAL_STARFRONT_PROGRESSION,
  inventory: [
    { ...SAMPLE_STARFRONT_ITEMS[0], enhancementLevel: 5 }, // Vũ khí +5
    { ...SAMPLE_STARFRONT_ITEMS[4], enhancementLevel: 5 }, // Khiên +5
    { ...SAMPLE_STARFRONT_ITEMS[7], enhancementLevel: 5 }, // Động cơ +5
  ],
  equipped: {
    weapon: SAMPLE_STARFRONT_ITEMS[0].id,
    shield: SAMPLE_STARFRONT_ITEMS[4].id,
    engine: SAMPLE_STARFRONT_ITEMS[7].id,
  },
}

const enhancedStats = calculateTotalGearStats(
  "vanguard",
  1,
  enhancedUnitProg.inventory,
  enhancedUnitProg.equipped,
)

assert(enhancedStats.total.attack > baseStats.total.attack, "Tổng ATK tăng khi vũ khí +5")
assert(enhancedStats.total.defense > baseStats.total.defense, "Tổng DEF tăng khi khiên +5")
assert(enhancedStats.total.speed > baseStats.total.speed, "Tổng SPD tăng khi động cơ +5")
assert(enhancedStats.total.hp > baseStats.total.hp, "Tổng HP tăng khi khiên +5")
console.log(`[PASS] Buồng lái phản ánh chính xác: ATK ${baseStats.total.attack} -> ${enhancedStats.total.attack}, DEF ${baseStats.total.defense} -> ${enhancedStats.total.defense}, SPD ${baseStats.total.speed} -> ${enhancedStats.total.speed}`)

const combatUnit = buildPlayerCombatUnit(enhancedUnitProg)
assert(combatUnit.attack === enhancedStats.total.attack, "CombatUnit có ATK đúng bằng tổng chỉ số cường hóa")
assert(combatUnit.defense === enhancedStats.total.defense, "CombatUnit có DEF đúng bằng tổng chỉ số cường hóa")
assert(combatUnit.speed === enhancedStats.total.speed, "CombatUnit có SPD đúng bằng tổng chỉ số cường hóa")
console.log("[PASS] buildPlayerCombatUnit kế thừa trọn vẹn chỉ số cường hóa vào đấu trường")

// -------------------------------------------------------------
// 5. KIỂM THỬ THƯỞNG HỢP KIM (ALLOY) TỪ CHIẾN THẮNG
// -------------------------------------------------------------
console.log("\n--- 5. Kiểm thử Thưởng Hợp Kim (Alloy) từ Chiến thắng ---")

const vicProg: StarfrontProgression = {
  ...INITIAL_STARFRONT_PROGRESSION,
  alloy: 10,
}
const vicResult = applyVictoryReward(vicProg, "scout-drone")
assert(vicResult.reward.alloyGained !== undefined && vicResult.reward.alloyGained > 0, "Có ghi nhận alloyGained")
assert((vicResult.updated.alloy ?? 0) > 10, "Tiến trình người chơi nhận thêm Alloy từ chiến thắng")
console.log(`[PASS] Thắng Scout Drone nhận +${vicResult.reward.alloyGained} Alloy (10 -> ${vicResult.updated.alloy})`)

console.log("\n=== TỔNG KẾT: TẤT CẢ TEST PHASE 5 (MILESTONE 5.1) ĐỀU ĐẠT CHUẨN XUẤT SẮC! ===")
