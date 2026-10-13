import test from "node:test"
import assert from "node:assert/strict"
import { createInitialWorldState } from "@/lib/game/world/initial-state"
import { WorldPRNG } from "@/lib/game/world/random"
import {
  createCombatV2EncounterSnapshot,
  recalculateForceAggregate,
  advanceCombatV2Round,
  executeCombatV2Simulation,
  queueCommanderStrategy,
  orderGearRetreat,
  deriveBattlefieldViewModel,
  combatV2ResultToReceipt,
  commitCombatV2Result,
  COMBAT_V2_STRATEGIES,
  DEFAULT_COMBAT_V2_CONFIG,
} from "@/lib/game/world/combat-v2-engine"
import type { CombatV2Gear } from "@/lib/game/world/combat-v2-types"
import { lockEncounterAndCreateSnapshot } from "@/lib/game/world/combat-adapter"

test("STARFRONT Phase 6.32 — Combat V2 Core Engine Verification", async (t) => {
  // Helper to build mock GEAR units
  function createMockGear(params: {
    id: string
    name: string
    side: "allied" | "enemy"
    hp?: number
    maxHp?: number
    attack?: number
    defense?: number
    speed?: number
    isPlayer?: boolean
    pilotName?: string
  }): CombatV2Gear {
    const hp = params.hp ?? 100
    const maxHp = params.maxHp ?? 100
    return {
      gearId: params.id,
      name: params.name,
      side: params.side,
      currentHp: hp,
      maxHp,
      state: "ACTIVE",
      attack: params.attack ?? 25,
      defense: params.defense ?? 15,
      speed: params.speed ?? 50,
      isPlayer: params.isPlayer ?? false,
      pilotId: `pilot_${params.id}`,
      pilotName: params.pilotName || `Pilot ${params.name}`,
    }
  }

  await t.test("1. Dynamic Unequal Roster: Hỗ trợ lực lượng bất đối xứng không gò bó kích thước cố định", () => {
    // 2 cỗ máy đồng minh đối đầu với 5 cỗ máy The Void (tương quan 2v5)
    const alliedGears: CombatV2Gear[] = [
      createMockGear({ id: "vss_vanguard", name: "Vanguard Alpha", side: "allied", isPlayer: true }),
      createMockGear({ id: "vss_falcon", name: "Falcon Recon", side: "allied", isPlayer: false }),
    ]

    const enemyGears: CombatV2Gear[] = [
      createMockGear({ id: "void_drone_1", name: "Void Swarm #1", side: "enemy" }),
      createMockGear({ id: "void_drone_2", name: "Void Swarm #2", side: "enemy" }),
      createMockGear({ id: "void_drone_3", name: "Void Swarm #3", side: "enemy" }),
      createMockGear({ id: "void_drone_4", name: "Void Swarm #4", side: "enemy" }),
      createMockGear({ id: "void_cruiser", name: "Void Ravager", side: "enemy", hp: 200, maxHp: 200 }),
    ]

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc_asymm_test",
      transactionId: "tx_asymm_test",
      sectorId: "helios_perimeter",
      alliedGears,
      enemyGears,
    })

    assert.equal(snapshot.alliedGears.length, 2)
    assert.equal(snapshot.enemyGears.length, 5)

    const initialAlliedAgg = recalculateForceAggregate(snapshot.alliedGears, "allied", 100)
    const initialEnemyAgg = recalculateForceAggregate(snapshot.enemyGears, "enemy", 100)

    assert.equal(initialAlliedAgg.totalCount, 2)
    assert.equal(initialAlliedAgg.activeCount, 2)
    assert.equal(initialEnemyAgg.totalCount, 5)
    assert.equal(initialEnemyAgg.activeCount, 5)

    // Tiến hành mô phỏng 1 hiệp mà không gặp lỗi kích thước cố định
    const prng = new WorldPRNG(42)
    const roundResult = advanceCombatV2Round(snapshot, 1, prng)
    assert.ok(roundResult.roundLog.actions.length > 0)
    assert.equal(roundResult.roundLog.round, 1)
  })

  await t.test("2. Individual GEAR: Từng cỗ máy được định danh và theo dõi độc lập", () => {
    const g1 = createMockGear({ id: "g_alpha", name: "Alpha", side: "allied", hp: 120, maxHp: 120, attack: 30 })
    const g2 = createMockGear({ id: "g_beta", name: "Beta", side: "allied", hp: 80, maxHp: 80, attack: 20 })
    const e1 = createMockGear({ id: "e_omega", name: "Omega", side: "enemy", hp: 100, maxHp: 100 })

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc_indiv_test",
      transactionId: "tx_indiv_test",
      sectorId: "sol_command_hq",
      alliedGears: [g1, g2],
      enemyGears: [e1],
    })

    // Từng đơn vị có thuộc tính và ID riêng biệt
    assert.equal(snapshot.alliedGears[0].gearId, "g_alpha")
    assert.equal(snapshot.alliedGears[1].gearId, "g_beta")
    assert.notEqual(snapshot.alliedGears[0].currentHp, snapshot.alliedGears[1].currentHp)

    // Trừ máu đơn vị 1, đơn vị 2 giữ nguyên
    g1.currentHp -= 40
    assert.equal(g1.currentHp, 80)
    assert.equal(g2.currentHp, 80)

    const agg = recalculateForceAggregate(snapshot.alliedGears, "allied", 100)
    assert.equal(agg.totalCurrentHp, 160)
    assert.equal(agg.totalMaxHp, 200)
  })

  await t.test("3. DESTROYED: HP về 0 chuyển trạng thái DESTROYED và loại bỏ đóng góp", () => {
    const g1 = createMockGear({ id: "g_fragile", name: "Fragile Unit", side: "allied", hp: 10, maxHp: 100, attack: 50 })
    const e1 = createMockGear({ id: "e_heavy", name: "Heavy Gunner", side: "enemy", attack: 100, speed: 100 })

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc_destroyed_test",
      transactionId: "tx_destroyed_test",
      sectorId: "nebula_bastion",
      alliedGears: [g1],
      enemyGears: [e1],
    })

    assert.equal(g1.state, "ACTIVE")

    // Thực thi hiệp 1: Địch tốc độ cao tấn công trước và tiêu diệt g1
    const prng = new WorldPRNG(11)
    const step = advanceCombatV2Round(snapshot, 1, prng)

    assert.equal(g1.currentHp, 0)
    assert.equal(g1.state, "DESTROYED")
    assert.equal(g1.isContributingOffense, false)
    assert.equal(g1.isContributingDefense, false)

    // Đóng góp của g1 trong aggregate sau khi bị tiêu diệt phải bằng 0
    assert.equal(step.alliedAggregate.activeCount, 0)
    assert.equal(step.alliedAggregate.destroyedCount, 1)
    assert.equal(step.alliedAggregate.effectiveOffensivePower, 0)
    assert.equal(step.alliedAggregate.hasViableCombatants, false)
  })

  await t.test("4. Aggregate Recalculation: Đơn vị DESTROYED và RETREATED không đóng góp vào chỉ số", () => {
    const gActive = createMockGear({ id: "g_act", name: "Active", side: "allied", hp: 100, maxHp: 100, attack: 40, defense: 20 })
    const gDestroyed = createMockGear({ id: "g_des", name: "Destroyed", side: "allied", hp: 0, maxHp: 100, attack: 40, defense: 20 })
    gDestroyed.state = "DESTROYED"
    const gRetreated = createMockGear({ id: "g_ret", name: "Retreated", side: "allied", hp: 50, maxHp: 100, attack: 40, defense: 20 })
    gRetreated.state = "RETREATED"

    const gears = [gActive, gDestroyed, gRetreated]
    const agg = recalculateForceAggregate(gears, "allied", 100)

    assert.equal(agg.totalCount, 3)
    assert.equal(agg.activeCount, 1)
    assert.equal(agg.destroyedCount, 1)
    assert.equal(agg.retreatedCount, 1)

    // Chỉ có gActive đóng góp: attack = 40, defense = 20
    assert.equal(agg.effectiveOffensivePower, 40)
    assert.equal(agg.effectiveDefensivePower, 20)
    assert.equal(agg.totalCurrentHp, 100) // Chỉ tính máu của đơn vị còn sống/hoạt động
  })

  await t.test("5. Retreat Foundation: Chu kỳ ACTIVE -> RETREATING -> RETREATED vận hành chính xác", () => {
    const gRetreating = createMockGear({ id: "g_runner", name: "Runner", side: "allied", hp: 100, maxHp: 100, attack: 30, defense: 20 })
    const eOpponent = createMockGear({ id: "e_dummy", name: "Dummy", side: "enemy", hp: 500, maxHp: 500, attack: 1, defense: 1 })

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc_retreat_test",
      transactionId: "tx_retreat_test",
      sectorId: "mining_outpost_k7",
      alliedGears: [gRetreating],
      enemyGears: [eOpponent],
    })

    // 1. Phát lệnh rút lui (1 hiệp)
    const retOrder = orderGearRetreat(gRetreating, 1)
    assert.ok(retOrder.success)
    assert.equal(gRetreating.state, "RETREATING")
    assert.equal(gRetreating.retreatTurnsRemaining, 1)

    // Khi ở RETREATING: Vẫn có thể bị nhắm bắn, giữ nguyên phòng thủ, công kích bị tiết giảm
    const aggMid = recalculateForceAggregate([gRetreating], "allied", 100)
    assert.equal(aggMid.retreatingCount, 1)
    assert.equal(aggMid.activeCount, 0)
    assert.equal(aggMid.effectiveDefensivePower, 20) // Giữ nguyên phòng thủ
    assert.equal(aggMid.effectiveOffensivePower, 0) // Tiết giảm công kích hoàn toàn theo config

    // 2. Tiến hành hiệp đấu -> retreatTurnsRemaining giảm về 0 và chuyển sang RETREATED
    const prng = new WorldPRNG(99)
    advanceCombatV2Round(snapshot, 1, prng)

    assert.equal(gRetreating.state, "RETREATED")
    assert.equal(gRetreating.retreatTurnsRemaining, 0)

    // Khi ở RETREATED: Không còn là mục tiêu hợp lệ, không đóng góp
    const aggFinal = recalculateForceAggregate([gRetreating], "allied", 100)
    assert.equal(aggFinal.retreatedCount, 1)
    assert.equal(aggFinal.retreatingCount, 0)
    assert.equal(aggFinal.effectiveDefensivePower, 0)
  })

  await t.test("6. Strategy Queue: Chiến thuật xếp hàng không đổi hiệp hiện tại, áp dụng ở đầu hiệp sau", () => {
    const g1 = createMockGear({ id: "g1", name: "G1", side: "allied" })
    const e1 = createMockGear({ id: "e1", name: "E1", side: "enemy" })

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc_strat_test",
      transactionId: "tx_strat_test",
      sectorId: "sol_command_hq",
      alliedGears: [g1],
      enemyGears: [e1],
      alliedStrategyId: "balanced",
    })

    assert.equal(snapshot.alliedCommander.currentStrategyId, "balanced")
    assert.equal(snapshot.alliedCommander.queuedStrategyId, null)

    // Xếp hàng chiến thuật "focus_fire"
    const queueRes = queueCommanderStrategy(snapshot, "allied", "focus_fire")
    assert.ok(queueRes.success)
    // Chiến thuật hiện tại vẫn là "balanced"
    assert.equal(snapshot.alliedCommander.currentStrategyId, "balanced")
    assert.equal(snapshot.alliedCommander.queuedStrategyId, "focus_fire")

    // Bước vào hiệp 1 -> Tại biên hiệp, focus_fire được kích hoạt
    const prng = new WorldPRNG(7)
    const step = advanceCombatV2Round(snapshot, 1, prng)

    assert.equal(snapshot.alliedCommander.currentStrategyId, "focus_fire")
    assert.equal(snapshot.alliedCommander.queuedStrategyId, null)
    assert.equal(step.roundLog.strategyChanges.length, 1)
    assert.equal(step.roundLog.strategyChanges[0].newStrategyId, "focus_fire")
  })

  await t.test("7. Command Authority: Phá hủy GEAR của người chơi KHÔNG làm mất thẩm quyền chỉ huy", () => {
    const playerGear = createMockGear({
      id: "player_mech",
      name: "Marcus Vanguard",
      side: "allied",
      hp: 1, // Máu thấp để bị tiêu diệt
      maxHp: 100,
      isPlayer: true,
      speed: 10,
    })
    const alliedWingman = createMockGear({
      id: "allied_npc",
      name: "Wingman NPC",
      side: "allied",
      hp: 150,
      maxHp: 150,
      speed: 10,
    })
    const enemyKiller = createMockGear({
      id: "enemy_sniper",
      name: "Void Sniper",
      side: "enemy",
      attack: 80,
      speed: 100, // Tấn công trước
    })

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc_authority_test",
      transactionId: "tx_authority_test",
      sectorId: "helios_perimeter",
      alliedGears: [playerGear, alliedWingman],
      enemyGears: [enemyKiller],
      isPlayerCommander: true,
    })

    assert.equal(snapshot.alliedCommander.isPlayerCommander, true)
    assert.equal(snapshot.alliedCommander.hasActiveAuthority, true)

    // Hiệp 1: enemyKiller tiêu diệt playerGear
    const prng = new WorldPRNG(5)
    advanceCombatV2Round(snapshot, 1, prng)

    assert.equal(playerGear.state, "DESTROYED")

    // Bất biến: Thẩm quyền chỉ huy của Người chơi KHÔNG bị mất
    assert.equal(snapshot.alliedCommander.hasActiveAuthority, true)

    // Người chơi vẫn có thể ra lệnh đổi chiến thuật cho đội hình còn lại
    const queueOrder = queueCommanderStrategy(snapshot, "allied", "defensive_screen")
    assert.ok(queueOrder.success)
    assert.equal(snapshot.alliedCommander.queuedStrategyId, "defensive_screen")
  })

  await t.test("8. NPC-only: Trận chiến tự động giải quyết độc lập không cần giao diện UI", () => {
    // 2 cỗ máy NPC VSS đối đầu 2 cỗ máy The Void (không có người chơi tham gia)
    const alliedGears: CombatV2Gear[] = [
      createMockGear({ id: "npc_vss_1", name: "Garrison Vanguard", side: "allied", isPlayer: false, hp: 120, maxHp: 120 }),
      createMockGear({ id: "npc_vss_2", name: "Garrison Falcon", side: "allied", isPlayer: false, hp: 100, maxHp: 100 }),
    ]
    const enemyGears: CombatV2Gear[] = [
      createMockGear({ id: "npc_void_1", name: "Void Raider #1", side: "enemy", hp: 80, maxHp: 80, attack: 20 }),
      createMockGear({ id: "npc_void_2", name: "Void Raider #2", side: "enemy", hp: 80, maxHp: 80, attack: 20 }),
    ]

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc_npc_auto_test",
      transactionId: "tx_npc_auto_test",
      sectorId: "nebula_bastion",
      alliedGears,
      enemyGears,
      isPlayerCommander: false,
      alliedCommanderName: "Trung Tá Đồn Trú VSS",
    })

    const prng = new WorldPRNG(123)
    const result = executeCombatV2Simulation(snapshot, { maxRounds: 15, prng })

    assert.ok(result.completedRounds > 0)
    assert.ok(result.completedRounds <= 15)
    assert.ok(result.outcome !== undefined)
    assert.ok(result.roundLogs.length === result.completedRounds)
  })

  await t.test("9. Combat Result: Báo cáo đầy đủ cỗ máy sống sót, rút lui, tiêu diệt và ứng viên phi công", () => {
    const a1 = createMockGear({ id: "a_alive", name: "Ace Alpha", side: "allied", hp: 150, maxHp: 150, attack: 60, speed: 80 })
    const a2 = createMockGear({ id: "a_dead", name: "Ace Beta", side: "allied", hp: 10, maxHp: 100, attack: 10, speed: 10, pilotName: "Lt. Chen" })
    const e1 = createMockGear({ id: "e_boss", name: "Void Colossus", side: "enemy", hp: 60, maxHp: 100, attack: 50, speed: 50 })

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc_result_test",
      transactionId: "tx_result_test",
      sectorId: "mining_outpost_k7",
      alliedGears: [a1, a2],
      enemyGears: [e1],
    })

    const prng = new WorldPRNG(999)
    const result = executeCombatV2Simulation(snapshot, { maxRounds: 10, prng })

    // Kiểm tra cấu trúc CombatV2Result
    assert.equal(result.encounterId, "enc_result_test")
    assert.equal(result.combatVersion, "v2")
    assert.ok(typeof result.victory === "boolean")
    assert.ok(result.survivingActiveGears.length >= 0)
    assert.ok(result.destroyedGears.length >= 0)

    // Nếu có cỗ máy bị tiêu diệt, danh sách downedPilotCandidates phải ghi nhận đầy đủ
    if (result.destroyedGears.length > 0) {
      assert.ok(result.downedPilotCandidates.length > 0)
      const cand = result.downedPilotCandidates[0]
      assert.ok(cand.gearId.length > 0)
      assert.ok(cand.destructionRound > 0)
    }

    // Chuyển đổi sang biên lai CombatResultReceipt chuẩn
    const receipt = combatV2ResultToReceipt(result)
    assert.equal(receipt.combatVersion, "v2")
    assert.equal(receipt.encounterId, "enc_result_test")
    assert.ok(receipt.rounds >= 1)
  })

  await t.test("10. Idempotent Commit: Tái áp dụng cùng biên lai V2 không nhân bản hậu quả", () => {
    const worldState = createInitialWorldState()
    const sector = worldState.sectors["helios_perimeter"]
    sector.threatLevel = 500
    sector.stability = 60

    // Khóa trận đấu chiến lược Combat V2 bằng lockEncounterAndCreateSnapshot
    const snapshot = lockEncounterAndCreateSnapshot(worldState, {
      sectorId: "helios_perimeter",
      combatVersion: "v2",
      overrideTransactionId: "tx_cbt_v2_idempotency_10",
      overrideEncounterId: "enc_cbt_v2_idempotency_10",
    })

    const initialDeployed = worldState.military.deployed

    // Tạo kết quả giả định thắng trận Combat V2
    const mockResult = {
      encounterId: snapshot.encounterId,
      transactionId: snapshot.transactionId,
      sectorId: "helios_perimeter",
      combatVersion: "v2" as const,
      completedAtTimestamp: Date.now(),
      completedRounds: 3,
      outcome: "allied_victory" as const,
      victory: true,
      alliedAggregate: {
        side: "allied" as const,
        totalCount: 2,
        activeCount: 2,
        retreatingCount: 0,
        retreatedCount: 0,
        destroyedCount: 0,
        totalCurrentHp: 180,
        totalMaxHp: 200,
        hpPercent: 90,
        effectiveOffensivePower: 60,
        effectiveDefensivePower: 40,
        morale: 100,
        hasViableCombatants: true,
      },
      enemyAggregate: {
        side: "enemy" as const,
        totalCount: 2,
        activeCount: 0,
        retreatingCount: 0,
        retreatedCount: 0,
        destroyedCount: 2,
        totalCurrentHp: 0,
        totalMaxHp: 160,
        hpPercent: 0,
        effectiveOffensivePower: 0,
        effectiveDefensivePower: 0,
        morale: 0,
        hasViableCombatants: false,
      },
      survivingActiveGears: [],
      retreatedGears: [],
      destroyedGears: [],
      alliedCommander: {
        factionId: "vss",
        commanderName: "Chỉ Huy VSS",
        isPlayerCommander: true,
        hasActiveAuthority: true,
        currentStrategyId: "balanced",
        queuedStrategyId: null,
      },
      enemyCommander: {
        factionId: "void",
        commanderName: "Chỉ Huy The Void",
        isPlayerCommander: false,
        hasActiveAuthority: false,
        currentStrategyId: "balanced",
        queuedStrategyId: null,
      },
      roundLogs: [],
      downedPilotCandidates: [],
    }

    // Lần commit 1: Thành công áp dụng hậu quả vào World State
    const commit1 = commitCombatV2Result(worldState, mockResult)
    assert.equal(commit1.applied, true)
    assert.equal(commit1.transactionId, "tx_cbt_v2_idempotency_10")
    assert.ok(sector.threatLevel < 500)
    assert.ok(sector.stability > 60)
    const threatAfter1 = sector.threatLevel
    const stabilityAfter1 = sector.stability

    // Lần commit 2: Bị chặn bởi bộ lọc lũy đẳng (Idempotency Filter)
    const commit2 = commitCombatV2Result(worldState, mockResult)
    assert.equal(commit2.applied, false)
    assert.equal(commit2.alreadyCommitted, true)
    assert.match(commit2.message, /Idempotency Filter|đã được commit trước đó/i)

    // Chỉ số Threat, Stability và quân sự không bị trừ hai lần
    assert.equal(sector.threatLevel, threatAfter1)
    assert.equal(sector.stability, stabilityAfter1)
  })

  await t.test("11. UI View-Model: deriveBattlefieldViewModel cung cấp dữ liệu sạch cho tương lai Phase 6.33", () => {
    const a1 = createMockGear({ id: "g_ui_1", name: "Vanguard", side: "allied", hp: 80, maxHp: 100, isPlayer: true })
    const e1 = createMockGear({ id: "e_ui_1", name: "Drone", side: "enemy", hp: 50, maxHp: 50 })

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc_vm_test",
      transactionId: "tx_vm_test",
      sectorId: "sol_command_hq",
      alliedGears: [a1],
      enemyGears: [e1],
    })

    const vm = deriveBattlefieldViewModel(snapshot, 2, false)

    assert.equal(vm.round, 2)
    assert.equal(vm.isConcluded, false)
    assert.equal(vm.alliedForce.activeCount, 1)
    assert.equal(vm.enemyForce.activeCount, 1)
    assert.equal(vm.alliedGears[0].hpPercent, 80)
    assert.equal(vm.alliedGears[0].isPlayerCommander, true)
    assert.ok(vm.commanderStrategy.availableStrategies.length >= 3)
  })
})
