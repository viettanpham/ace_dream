import test from "node:test"
import assert from "node:assert/strict"
import {
  createCombatV2EncounterSnapshot,
  recalculateForceAggregate,
  advanceCombatV2Round,
  deriveBattlefieldViewModel,
  queueCommanderStrategy,
  orderGearRetreat,
  COMBAT_V2_STRATEGIES,
  DEFAULT_COMBAT_V2_CONFIG,
} from "@/lib/game/world/combat-v2-engine"
import {
  CANONICAL_SUPPORT_SKILLS,
  createDefaultSupportEntities,
} from "@/lib/game/world/combat-v2-support"
import {
  convertWorldBattleContextToCombatV2Snapshot,
} from "@/lib/game/world/combat-v2-adapter-bridge"
import type { CombatV2Gear } from "@/lib/game/world/combat-v2-types"
import type { WorldBattleContext } from "@/lib/game/world/types"
import { WorldPRNG } from "@/lib/game/world/random"

test("STARFRONT Phase 6.33 — Combat Command, Retreat, Support & Battle UI Integration Tests", async (t) => {
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

  await t.test("1. Commander Strategy Queue & Round Boundary Confirmation", () => {
    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc-ui-1",
      transactionId: "tx-ui-1",
      sectorId: "sector-a",
      alliedGears: [createTestGear("allied_1", "Allied One", "allied", true)],
      enemyGears: [createTestGear("enemy_1", "Enemy One", "enemy")],
      alliedStrategyId: "balanced",
    })

    // Ban đầu: Balanced, chưa xếp hàng
    assert.equal(snapshot.alliedCommander.currentStrategyId, "balanced")
    assert.equal(snapshot.alliedCommander.queuedStrategyId, null)

    // Người chơi phát lệnh xếp hàng Focus Fire
    const qRes = queueCommanderStrategy(snapshot, "allied", "focus_fire")
    assert.ok(qRes.success)
    assert.equal(snapshot.alliedCommander.queuedStrategyId, "focus_fire")
    // Chiến thuật hiện tại vẫn là Balanced trước khi tiến hiệp
    assert.equal(snapshot.alliedCommander.currentStrategyId, "balanced")

    // View-model phản ánh chính xác cấu trúc cho UI
    const vm = deriveBattlefieldViewModel(snapshot, 1, false)
    assert.equal(vm.commanderStrategy.currentStrategyId, "balanced")
    assert.equal(vm.commanderStrategy.queuedStrategyId, "focus_fire")
    assert.ok(vm.commanderStrategy.availableStrategies.length >= 4)

    // Tiến sang hiệp 2: Chiến thuật xếp hàng được kích hoạt tại biên hiệp
    const round2 = advanceCombatV2Round(snapshot, 2, new WorldPRNG(42))
    assert.equal(snapshot.alliedCommander.currentStrategyId, "focus_fire")
    assert.equal(snapshot.alliedCommander.queuedStrategyId, null)
    assert.ok(round2.roundLog.strategyChanges.some((sc) => sc.newStrategyId === "focus_fire"))
  })

  await t.test("2. Player & Allied Machine Retreat Flow and Aggregate Recalculation", () => {
    const gAllied1 = createTestGear("allied_1", "VSS Vanguard", "allied", true)
    const gAllied2 = createTestGear("allied_2", "VSS Falcon", "allied", false)
    const gEnemy1 = createTestGear("enemy_1", "Void Scout", "enemy")

    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc-ui-2",
      transactionId: "tx-ui-2",
      sectorId: "sector-b",
      alliedGears: [gAllied1, gAllied2],
      enemyGears: [gEnemy1],
    })

    // Phát lệnh rút lui cho Falcon (Allied 2)
    const retRes = orderGearRetreat(gAllied2, DEFAULT_COMBAT_V2_CONFIG.defaultRetreatDurationRounds)
    assert.ok(retRes.success)
    assert.equal(gAllied2.state, "RETREATING")
    assert.equal(gAllied2.retreatTurnsRemaining, 1)

    // Trước khi kết thúc hiệp, Falcon vẫn bảo lưu defense nhưng không gây sát thương nếu 1.0 suppression
    const aggBefore = recalculateForceAggregate(snapshot.alliedGears, "allied", 100)
    assert.equal(aggBefore.retreatingCount, 1)
    assert.equal(aggBefore.activeCount, 1)

    // Tiến hiệp 1: Falcon hoàn tất thoát ly -> RETREATED
    const step1 = advanceCombatV2Round(snapshot, 1, new WorldPRNG(123))
    assert.equal(gAllied2.state, "RETREATED")
    assert.equal(step1.alliedAggregate.retreatedCount, 1)
    assert.equal(step1.alliedAggregate.retreatingCount, 0)
    // Đơn vị RETREATED hoàn toàn bị loại khỏi sức mạnh công thủ hữu hiệu
    assert.equal(gAllied2.isContributingOffense, false)
    assert.equal(gAllied2.isContributingDefense, false)
  })

  await t.test("3. Support Fleet Low-Orbit Capabilities and Queue Definitions", () => {
    const supports = createDefaultSupportEntities("allied")
    assert.ok(supports.length >= 2)
    assert.equal(supports[0].controlMode, "auto")

    // Đổi sang manual mode
    supports[0].controlMode = "manual"
    assert.equal(supports[0].controlMode, "manual")

    // Kiểm tra kỹ năng hỗ trợ chuẩn hóa
    const orbitalStrike = CANONICAL_SUPPORT_SKILLS["orbital_strike"]
    assert.ok(orbitalStrike)
    assert.equal(orbitalStrike.targetSide, "enemy")
    assert.equal(orbitalStrike.cooldownRounds, 3)

    const shieldMatrix = CANONICAL_SUPPORT_SKILLS["shield_matrix"]
    assert.ok(shieldMatrix)
    assert.equal(shieldMatrix.targetSide, "allied")
  })

  await t.test("4. WorldBattleContext to Combat V2 Adapter Bridge", () => {
    const mockContext: WorldBattleContext = {
      source: "WORLD",
      transactionId: "tx-cbt-v2-bridge-test",
      encounterId: "enc-v2-bridge-test",
      sectorId: "sol_command_hq",
      sectorName: "Sol Command HQ",
      snapshot: {
        transactionId: "tx-cbt-v2-bridge-test",
        encounterId: "enc-v2-bridge-test",
        combatVersion: "v2",
        sectorId: "sol_command_hq",
        sectorName: "Sol Command HQ",
        enemyEncounterType: "void-vanguard",
        enemyUnit: {
          name: "Void Vanguard Fleet",
          hp: 400,
          maxHp: 400,
          attack: 50,
          defense: 30,
          speed: 45,
        },
        friendlyModifiers: {
          fortificationLevel: 2,
          defenseMultiplier: 1.3,
          moraleMultiplier: 1.1,
          strategicOrder: "defend",
        },
        lockedGarrison: 1500,
        winConditions: {
          objective: "eliminate_enemy",
          maxRounds: 25,
        },
        lockedAtTimestamp: Date.now(),
        status: "locked",
      },
    }

    const v2Snap = convertWorldBattleContextToCombatV2Snapshot(mockContext, {
      gearName: "Custom Vanguard",
      pilotName: "Captain Jack",
    })

    assert.equal(v2Snap.encounterId, "enc-v2-bridge-test")
    assert.equal(v2Snap.transactionId, "tx-cbt-v2-bridge-test")
    assert.equal(v2Snap.alliedGears.length, 3)
    assert.equal(v2Snap.enemyGears.length, 3)
    assert.equal(v2Snap.alliedGears[0].name, "Custom Vanguard")
    assert.equal(v2Snap.alliedGears[0].pilotName, "Captain Jack")
    assert.ok(v2Snap.alliedSupport && v2Snap.alliedSupport.length >= 2)
  })

  await t.test("5. Battlefield View-Model Extraction and Log Generation", () => {
    const snapshot = createCombatV2EncounterSnapshot({
      encounterId: "enc-ui-logs",
      transactionId: "tx-ui-logs",
      sectorId: "sector-c",
      alliedGears: [createTestGear("allied_lead", "VSS Alpha", "allied", true)],
      enemyGears: [createTestGear("enemy_lead", "Void Drone", "enemy")],
    })

    const step1 = advanceCombatV2Round(snapshot, 1, new WorldPRNG(999))
    const vm = deriveBattlefieldViewModel(snapshot, 1, step1.isConcluded, step1.outcome, false, [step1.roundLog])

    assert.equal(vm.round, 1)
    assert.equal(vm.recentLogs.length, 1)
    assert.ok(vm.recentLogs[0].actions.length > 0)
    assert.equal(vm.alliedGears.length, 1)
    assert.equal(vm.enemyGears.length, 1)
    assert.equal(typeof vm.alliedGears[0].hpPercent, "number")
    assert.equal(vm.alliedGears[0].isPlayerCommander, true)
  })
})
