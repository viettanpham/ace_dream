import assert from "node:assert"
import {
  createInitialCombatState,
  executePlayerAction,
  executeEnemyAIAction,
  applyStatusEffect,
  tickUnitTurn,
} from "./lib/game/engine"
import { INITIAL_STARFRONT_PROGRESSION, buildPlayerCombatUnit } from "./lib/game/progression"
import type { CombatLogItem } from "./lib/game/types"

console.log("=== BẮT ĐẦU KIỂM THỬ HỆ THỐNG COMBAT LOG & STATUS UPDATES ===")

// 1. Kiểm tra khởi tạo trận chiến sinh nhật ký hệ thống
const player = buildPlayerCombatUnit(INITIAL_STARFRONT_PROGRESSION)
const state = createInitialCombatState("scout-drone", player)

assert(state.logs.length >= 2, "Có ít nhất 2 nhật ký khởi tạo trận đấu")
assert(state.logs[0].type === "system", "Log đầu tiên thuộc loại system")
console.log("[PASS] Nhật ký khởi tạo trận đấu chuẩn xác")

// 2. Kiểm tra nhật ký hành động người chơi và ghi nhận đòn tấn công / sát thương
// Đặt lượt thành player-turn để kích hoạt hành động người chơi
state.status = "player-turn"
state.currentTurnActorId = state.player.id
const stateAfterAttack = executePlayerAction(state, "basic-attack")
const attackLog = stateAfterAttack.logs.find(
  (l) => l.type === "player-action" || l.type === "crit" || l.type === "evade",
)
assert(attackLog !== undefined, "Có ghi nhận nhật ký tấn công của người chơi")
console.log(`[PASS] Ghi nhận tấn công thành công: ${attackLog?.text}`)

// 3. Kiểm tra nhật ký cập nhật trạng thái đơn vị (Status Update: Áp dụng hiệu ứng)
const testUnit = buildPlayerCombatUnit(INITIAL_STARFRONT_PROGRESSION)
const statusRes = applyStatusEffect(testUnit, {
  type: "plasma-burn",
  name: "Cháy Plasma",
  desc: "Gây sát thương thiêu đốt",
  duration: 2,
  value: 0.15,
  stackType: "refresh",
  isDebuff: true,
})
assert(statusRes.applied === true, "Áp dụng status effect thành công")
assert(statusRes.logText.includes("Cháy Plasma"), "Có văn bản nhật ký trạng thái")
console.log(`[PASS] Ghi nhận cập nhật áp dụng hiệu ứng: ${statusRes.logText}`)

// 4. Kiểm tra nhật ký sát thương DoT và nhật ký hết hạn trạng thái (Status Expiration)
const tickRes1 = tickUnitTurn(testUnit)
assert(tickRes1.dotLogs.length > 0, "Ghi nhận sát thương DoT do trạng thái gây ra")
console.log(`[PASS] Ghi nhận DoT damage update: ${tickRes1.dotLogs[0].text}`)

const tickRes2 = tickUnitTurn(testUnit)
assert(tickRes2.expiredLogs.length > 0, "Ghi nhận cập nhật trạng thái HẾT HẠN (Status Expired)")
assert(tickRes2.expiredLogs[0].text.includes("HẾT HIỆU LỰC"), "Thông báo hết hiệu lực đúng chuẩn")
console.log(`[PASS] Ghi nhận cập nhật trạng thái hết hạn: ${tickRes2.expiredLogs[0].text}`)

// 5. Kiểm tra AI Kẻ địch sinh nhật ký hành động và trạng thái
let enemyTurnState = {
  ...stateAfterAttack,
  status: "enemy-turn" as const,
  currentTurnActorId: stateAfterAttack.enemy.id,
}
const stateAfterEnemy = executeEnemyAIAction(enemyTurnState)
const enemyLogs = stateAfterEnemy.logs.filter((l) => l.turn === stateAfterAttack.turnNumber)
assert(enemyLogs.length > stateAfterAttack.logs.length, "Có thêm nhật ký từ hành động của kẻ địch")
console.log("[PASS] Ghi nhận hành động kẻ địch trong nhật ký thời gian thực")

console.log("\n=== TỔNG KẾT: TẤT CẢ TEST COMBAT LOG ĐỀU ĐẠT CHUẨN XUẤT SẮC! ===")
