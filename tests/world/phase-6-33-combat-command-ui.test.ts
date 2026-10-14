/**
 * STARFRONT WORLD — Phase 6.33 Combat Command, Retreat, Support & Battle UI Integration Tests
 *
 * Verifies all 11 required architectural and UI invariants for Phase 6.33:
 * 1. Commander controls survive Player GEAR destruction
 * 2. Strategy queue UI (Select + Confirm queues strategy, current round unchanged)
 * 3. Personal Retreat (Valid retreat request enters RETREATING)
 * 4. Retreat display (RETREATING and RETREATED represented distinctly)
 * 5. Support Auto (Manual trigger disabled, no duplicate execution)
 * 6. Support Manual (Skill command queues correctly for next round)
 * 7. Cooldown safety (Manual/Auto switching does not duplicate or reset cooldown)
 * 8. Combat Log (Events grouped from canonical Combat V2 round logs, no shadow state)
 * 9. Observer/Commander mode (Player GEAR unavailable but commander role continues)
 * 10. NPC-only compatibility (UI layer does not break headless simulation)
 * 11. NPC retreat decision integration (Tactical withdrawal and panic thresholds)
 */

import test from "node:test"
import assert from "node:assert/strict"
import {
  createCombatV2EncounterSnapshot,
  recalculateForceAggregate,
  advanceCombatV2Round,
  deriveBattlefieldViewModel,
  queueCommanderStrategy,
  orderGearRetreat,
  orderForceRetreat,
  evaluateNpcRetreat,
  executeCombatV2Simulation,
  COMBAT_V2_STRATEGIES,
  DEFAULT_COMBAT_V2_CONFIG,
} from "@/lib/game/world/combat-v2-engine"
import {
  CANONICAL_SUPPORT_SKILLS,
  createDefaultSupportEntities,
  toggleSupportControlMode,
  queueManualSupportSkill,
  executeSupportRound,
} from "@/lib/game/world/combat-v2-support"
import {
  convertWorldBattleContextToCombatV2Snapshot,
} from "@/lib/game/world/combat-v2-adapter-bridge"
import type { CombatV2Gear } from "@/lib/game/world/combat-v2-types"
import type { WorldBattleContext } from "@/lib/game/world/types"
import { WorldPRNG } from "@/lib/game/world/random"

function createTestGear(id: string, name: string, side: "allied" | "enemy", isPlayer = false): CombatV2Gear {
  return {
    gearId: id,
    name,
    side,
    currentHp: 100,
    maxHp: 100,
    state: "ACTIVE",
    attack: 30,
    defense: 20,
    speed: 50,
    isPlayer,
    pilotId: `pilot_${id}`,
    pilotName: `Pilot ${name}`,
  }
}

test("STARFRONT Phase 6.33 — Combat Command, Retreat, Support & Battle UI Integration Tests", async (t) => {
  // Test 1: Commander controls survive Player GEAR destruction
  await t.test("Test 1 — Commander controls survive Player GEAR destruction", () => {
    const playerGear = createTestGear("player_gear", "VSS Vanguard Prime", "allied", true)
    const alliedEscort = createTestGear("allied_escort", "VSS Falcon Escort", "allied", false)
    const enemyGear = createTestGear("enemy_gear", "Void Interceptor", "enemy", false)

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc-t1",
      transactionId: "tx-t1",
      sectorId: "sector-alpha",
      alliedGears: [playerGear, alliedEscort],
      enemyGears: [enemyGear],
      alliedStrategyId: "balanced",
      isPlayerCommander: true,
    })

    // Phá hủy cỗ máy của người chơi
    playerGear.currentHp = 0
    playerGear.state = "DESTROYED"

    // INVARIANT: Thẩm quyền chỉ huy không bị mất khi GEAR cá nhân bị tiêu diệt
    assert.equal(snapshot.alliedCommander.hasActiveAuthority, true)
    assert.equal(snapshot.alliedCommander.isPlayerCommander, true)

    // View-Model phản ánh: Quyền chỉ huy vẫn active, nhưng cỗ máy cá nhân đã DESTROYED
    const vm = deriveBattlefieldViewModel(snapshot, 1, false)
    assert.equal(vm.commanderStrategy.hasAuthority, true)
    assert.equal(vm.alliedGears[0].state, "DESTROYED")
    assert.equal(vm.alliedGears[0].hpPercent, 0)

    // Thao tác chỉ huy (Queue Strategy) vẫn thực hiện thành công
    const queueRes = queueCommanderStrategy(snapshot, "allied", "focus_fire")
    assert.ok(queueRes.success)
    assert.equal(snapshot.alliedCommander.queuedStrategyId, "focus_fire")
  })

  // Test 2: Strategy queue UI (Select + Confirm queues strategy, current round unchanged)
  await t.test("Test 2 — Strategy queue UI: Select + Confirm queues strategy, current round unchanged", () => {
    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc-t2",
      transactionId: "tx-t2",
      sectorId: "sector-beta",
      alliedGears: [createTestGear("allied_1", "Allied One", "allied", true)],
      enemyGears: [createTestGear("enemy_1", "Enemy One", "enemy")],
      alliedStrategyId: "balanced",
    })

    // Hiệp 1: Hiện tại là Balanced, hàng đợi trống
    assert.equal(snapshot.alliedCommander.currentStrategyId, "balanced")
    assert.equal(snapshot.alliedCommander.queuedStrategyId, null)

    // Người chơi chọn ứng viên và xác nhận xếp hàng Focus Fire
    const qRes = queueCommanderStrategy(snapshot, "allied", "focus_fire")
    assert.ok(qRes.success)
    assert.equal(snapshot.alliedCommander.queuedStrategyId, "focus_fire")
    // Hiện tại vẫn là Balanced (KHÔNG ĐƯỢC thay đổi ngay giữa hiệp)
    assert.equal(snapshot.alliedCommander.currentStrategyId, "balanced")

    // View-model phản ánh trung thực
    const vm = deriveBattlefieldViewModel(snapshot, 1, false)
    assert.equal(vm.commanderStrategy.currentStrategyId, "balanced")
    assert.equal(vm.commanderStrategy.queuedStrategyId, "focus_fire")

    // Tiến sang hiệp 2: Chiến thuật xếp hàng được kích hoạt tại biên hiệp
    const round2 = advanceCombatV2Round(snapshot, 2, new WorldPRNG(42))
    assert.equal(snapshot.alliedCommander.currentStrategyId, "focus_fire")
    assert.equal(snapshot.alliedCommander.queuedStrategyId, null)
    assert.ok(round2.roundLog.strategyChanges.some((sc) => sc.newStrategyId === "focus_fire"))
  })

  // Test 3: Personal Retreat (Valid player retreat request enters RETREATING)
  await t.test("Test 3 — Personal Retreat: Valid player retreat request enters RETREATING", () => {
    const playerGear = createTestGear("player_1", "VSS Vanguard", "allied", true)
    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc-t3",
      transactionId: "tx-t3",
      sectorId: "sector-gamma",
      alliedGears: [playerGear],
      enemyGears: [createTestGear("enemy_1", "Void Scout", "enemy")],
    })

    // Phát lệnh rút lui cá nhân
    const retRes = orderGearRetreat(playerGear, DEFAULT_COMBAT_V2_CONFIG.defaultRetreatDurationRounds)
    assert.ok(retRes.success)
    assert.equal(playerGear.state, "RETREATING")
    assert.equal(playerGear.retreatTurnsRemaining, 1)

    // Thử phát lệnh rút lui lần nữa khi đang RETREATING -> Phải từ chối an toàn
    const duplicateRet = orderGearRetreat(playerGear)
    assert.equal(duplicateRet.success, false)
  })

  // Test 4: Retreat display (RETREATING and RETREATED represented distinctly)
  await t.test("Test 4 — Retreat display: RETREATING and RETREATED represented distinctly", () => {
    const allied1 = createTestGear("allied_1", "VSS Vanguard", "allied", true)
    const allied2 = createTestGear("allied_2", "VSS Falcon", "allied", false)
    const enemy1 = createTestGear("enemy_1", "Void Cruiser", "enemy")

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc-t4",
      transactionId: "tx-t4",
      sectorId: "sector-delta",
      alliedGears: [allied1, allied2],
      enemyGears: [enemy1],
    })

    // Falcon vào trạng thái RETREATING
    orderGearRetreat(allied2, 1)
    assert.equal(allied2.state, "RETREATING")

    // Trong khi RETREATING: Vẫn được tính vào lực lượng tổng hợp (defense retention) nhưng mất offense
    const aggRetreating = recalculateForceAggregate(snapshot.alliedGears, "allied", 100)
    assert.equal(aggRetreating.retreatingCount, 1)
    assert.equal(aggRetreating.retreatedCount, 0)
    assert.equal(aggRetreating.activeCount, 1)

    // Tiến hiệp: Falcon chuyển sang RETREATED
    const step1 = advanceCombatV2Round(snapshot, 1, new WorldPRNG(123))
    assert.equal(allied2.state, "RETREATED")
    assert.equal(step1.alliedAggregate.retreatingCount, 0)
    assert.equal(step1.alliedAggregate.retreatedCount, 1)
    assert.equal(allied2.isContributingOffense, false)
    assert.equal(allied2.isContributingDefense, false)
  })

  // Test 5: Support Auto (Manual trigger disabled, no duplicate execution)
  await t.test("Test 5 — Support Auto: Manual trigger disabled, no duplicate support execution", () => {
    const supports = createDefaultSupportEntities("allied")
    const station = supports[0] // Mặc định là auto
    assert.equal(station.controlMode, "auto")

    // Khi ở chế độ Auto: queueManualSupportSkill phải từ chối kích hoạt thủ công
    const queueAttempt = queueManualSupportSkill(supports, station.activeSkillName || "orbital_strike")
    assert.equal(queueAttempt.success, false)
    assert.ok(queueAttempt.message.includes("THỦ CÔNG"))

    // Chạy chu kỳ hỗ trợ: Auto kích hoạt đúng 1 lần và vào cooldown
    const res = executeSupportRound(supports, null, 1)
    assert.equal(res.executedSkills.length, 2) // cả 2 thực thể auto đều kích hoạt
    assert.equal(station.activeCooldownRemaining, station.activeCooldownMax)

    // Chạy tiếp ở hiệp 2: Không thể kích hoạt trùng lặp do đang cooldown
    const res2 = executeSupportRound(supports, null, 2)
    assert.equal(res2.executedSkills.length, 0)
    assert.equal(station.activeCooldownRemaining, station.activeCooldownMax - 1)
  })

  // Test 6: Support Manual (Skill command queues correctly for next round)
  await t.test("Test 6 — Support Manual: Skill command queues correctly for next round", () => {
    const supports = createDefaultSupportEntities("allied")
    const tender = supports[1]
    tender.controlMode = "manual"
    tender.activeCooldownRemaining = 0

    // Xếp hàng thủ công shield_matrix
    const qRes = queueManualSupportSkill(supports, "shield_matrix")
    assert.ok(qRes.success)

    // Thực thi hiệp đấu với kỹ năng đã xếp hàng
    const execRes = executeSupportRound(supports, "shield_matrix", 1)
    const manualExec = execRes.executedSkills.find((s) => s.skillId === "shield_matrix")
    assert.ok(manualExec)
    assert.equal(manualExec.mode, "manual")
    assert.equal(tender.activeCooldownRemaining, tender.activeCooldownMax)
  })

  // Test 7: Cooldown safety (Manual/Auto switching does not duplicate or reset cooldown)
  await t.test("Test 7 — Cooldown safety: Manual/Auto switching does not duplicate or reset cooldown", () => {
    const supports = createDefaultSupportEntities("allied")
    const platform = supports[0]
    platform.activeCooldownRemaining = 2 // Đang có cooldown

    // Chuyển sang Manual
    toggleSupportControlMode(platform)
    assert.equal(platform.controlMode, "manual")
    assert.equal(platform.activeCooldownRemaining, 2) // Cooldown bảo toàn

    // Chuyển lại sang Auto
    toggleSupportControlMode(platform)
    assert.equal(platform.controlMode, "auto")
    assert.equal(platform.activeCooldownRemaining, 2) // Cooldown vẫn bảo toàn tuyệt đối
  })

  // Test 8: Combat Log (Events grouped from canonical Combat V2 round logs, no shadow state)
  await t.test("Test 8 — Combat Log: Round events rendered/grouped from canonical Combat V2 logs", () => {
    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc-t8",
      transactionId: "tx-t8",
      sectorId: "sector-epsilon",
      alliedGears: [createTestGear("allied_lead", "VSS Alpha", "allied", true)],
      enemyGears: [createTestGear("enemy_lead", "Void Drone", "enemy")],
    })

    const step1 = advanceCombatV2Round(snapshot, 1, new WorldPRNG(777))
    assert.ok(step1.roundLog)
    assert.equal(step1.roundLog.round, 1)
    assert.ok(step1.roundLog.actions.length > 0)
    assert.ok(Array.isArray(step1.roundLog.destructionEvents))
    assert.ok(Array.isArray(step1.roundLog.retreatEvents))
    assert.ok(Array.isArray(step1.roundLog.strategyChanges))

    const vm = deriveBattlefieldViewModel(snapshot, 1, step1.isConcluded, step1.outcome, false, [step1.roundLog])
    assert.equal(vm.recentLogs.length, 1)
    assert.equal(vm.recentLogs[0].round, 1)
  })

  // Test 9: Observer/Commander mode (Player GEAR unavailable but commander UI remains functional)
  await t.test("Test 9 — Observer/Commander mode: Player GEAR unavailable but battle/commander UI functional", () => {
    const playerGear = createTestGear("player_obs", "VSS Command Core", "allied", true)
    const ally2 = createTestGear("ally_2", "VSS Defender", "allied", false)
    const enemy = createTestGear("enemy_obs", "Void Vanguard", "enemy", false)

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc-t9",
      transactionId: "tx-t9",
      sectorId: "sector-zeta",
      alliedGears: [playerGear, ally2],
      enemyGears: [enemy],
      isPlayerCommander: true,
    })

    // Player GEAR rút lui thành công (RETREATED)
    playerGear.state = "RETREATED"
    playerGear.currentHp = 100

    // Vẫn duy trì vai trò chỉ huy
    const vm = deriveBattlefieldViewModel(snapshot, 2, false)
    assert.equal(vm.commanderStrategy.hasAuthority, true)
    assert.equal(vm.alliedGears.find((g) => g.isPlayer)?.state, "RETREATED")
    // Đồng minh khác vẫn chiến đấu được
    assert.equal(vm.alliedForce.activeCount, 1)

    // Chiến thuật vẫn xếp hàng được
    const qRes = queueCommanderStrategy(snapshot, "allied", "defensive_screen")
    assert.ok(qRes.success)
  })

  // Test 10: NPC-only compatibility (Headless simulation runs deterministically without UI)
  await t.test("Test 10 — NPC-only compatibility: UI work does not break headless simulation", () => {
    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc-t10",
      transactionId: "tx-t10",
      sectorId: "sector-eta",
      alliedGears: [createTestGear("npc_allied_1", "NPC Escort A", "allied", false)],
      enemyGears: [createTestGear("npc_enemy_1", "NPC Drone A", "enemy", false)],
      seed: 8888,
    })

    const simResult = executeCombatV2Simulation(snapshot, { maxRounds: 15 })
    assert.ok(simResult)
    assert.ok(simResult.completedRounds > 0)
    assert.ok(["allied_victory", "enemy_victory", "stalemate", "allied_retreated", "enemy_retreated"].includes(simResult.outcome))
    assert.ok(simResult.roundLogs.length > 0)
  })

  // Test 11: NPC retreat integration & Force-wide retreat
  await t.test("Test 11 — NPC retreat integration & Force-wide retreat", () => {
    const npcAllied = createTestGear("npc_retreat_1", "NPC Vanguard", "allied", false)
    npcAllied.currentHp = 20
    npcAllied.maxHp = 100 // 20% HP (dưới ngưỡng 25%)

    // Khi tinh thần bình thường (100) -> Không rút lui
    assert.equal(evaluateNpcRetreat(npcAllied, 100, "balanced", DEFAULT_COMBAT_V2_CONFIG), false)

    // Khi tinh thần khủng hoảng (25 <= panic 30) VÀ HP <= 25% -> Rút lui tự động
    assert.equal(evaluateNpcRetreat(npcAllied, 25, "balanced", DEFAULT_COMBAT_V2_CONFIG), true)

    // Khi phe phát lệnh "tactical_withdrawal" -> Toàn bộ NPC tuân lệnh rút lui
    const freshNpc = createTestGear("fresh_npc", "Fresh Escort", "allied", false)
    assert.equal(evaluateNpcRetreat(freshNpc, 100, "tactical_withdrawal", DEFAULT_COMBAT_V2_CONFIG), true)

    // Thử nghiệm Force-wide retreat
    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc-force-ret",
      transactionId: "tx-force-ret",
      sectorId: "sector-theta",
      alliedGears: [npcAllied, freshNpc],
      enemyGears: [createTestGear("enemy_1", "Void Raider", "enemy")],
    })

    const forceRetRes = orderForceRetreat(snapshot, "allied")
    assert.ok(forceRetRes.success)
    assert.equal(forceRetRes.affectedCount, 2)
    assert.equal(npcAllied.state, "RETREATING")
    assert.equal(freshNpc.state, "RETREATING")
    assert.equal(snapshot.alliedCommander.queuedStrategyId, "tactical_withdrawal")
  })
})
