import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  calculateCombatEfficiency,
  CombatEfficiencyReport,
} from "../lib/game/combat-efficiency"
import { CombatState, CombatUnit } from "../lib/game/types"

function createMockCombatUnit(overrides: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id: "player",
    name: "Marcus Thorne",
    title: "Chỉ Huy Tiên Phong",
    gearType: "vanguard",
    isPlayer: true,
    hp: 450,
    maxHp: 500,
    sp: 80,
    maxSp: 100,
    attack: 75,
    defense: 40,
    speed: 35,
    skills: [],
    skillCooldowns: {},
    statusEffects: [],
    ...overrides,
  }
}

function createMockEnemyUnit(overrides: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id: "scout-drone",
    name: "Flyer Drone",
    title: "Drone Trinh Sát Tự Hành",
    gearType: "scout-drone",
    isPlayer: false,
    hp: 0,
    maxHp: 300,
    sp: 20,
    maxSp: 50,
    attack: 30,
    defense: 15,
    speed: 25,
    skills: [],
    skillCooldowns: {},
    statusEffects: [],
    ...overrides,
  }
}

describe("Post-Mission Results Screen & D3 Combat Efficiency Rating Engine", () => {
  it("TC-EFF-01: Calculates S+ / S Apex Ace rating for high-performance battle", () => {
    const player = createMockCombatUnit({ hp: 490, maxHp: 500 }) // 98% HP preserved
    const enemy = createMockEnemyUnit({ hp: 0, maxHp: 320 })

    const combatState: CombatState = {
      encounterId: "scout-drone",
      turnNumber: 2, // Very fast 2 turns
      currentTurnActorId: "player",
      turnQueue: ["player", "scout-drone"],
      player,
      enemy,
      status: "victory",
      logs: [
        {
          id: "log-1",
          turn: 1,
          text: "Marcus Thorne khai hỏa Đạn Pháo Hạng Nặng [CRIT]!",
          type: "crit",
          actorName: "Marcus Thorne",
          value: 180,
          timestamp: "12:00:01",
        },
        {
          id: "log-2",
          turn: 1,
          text: "Flyer Drone bắn phản hồi",
          type: "enemy-action",
          actorName: "Flyer Drone",
          targetName: "Marcus Thorne",
          value: 10,
          timestamp: "12:00:02",
        },
        {
          id: "log-3",
          turn: 2,
          text: "Marcus Thorne tung Tuyệt Kỹ Bão Lửa Titan [CRIT]!",
          type: "crit",
          actorName: "Marcus Thorne",
          value: 190,
          timestamp: "12:00:03",
        },
      ],
    }

    const report: CombatEfficiencyReport = calculateCombatEfficiency(combatState)

    // Verify Composite Score and Grade
    assert.ok(report.overallScore >= 85, `Expected score >= 85 for apex battle, got ${report.overallScore}`)
    assert.ok(report.grade === "S" || report.grade === "S+", `Expected S or S+ grade, got ${report.grade}`)
    assert.ok(report.gradeTitle.length > 0)
    assert.ok(report.gradeDescription.length > 0)

    // Verify 5 Radar axes are within valid range [0, 100]
    assert.strictEqual(report.axes.length, 5)
    for (const axis of report.axes) {
      assert.ok(axis.score >= 0 && axis.score <= 100, `Axis ${axis.key} score ${axis.score} out of bounds`)
      assert.ok(axis.label.length > 0)
      assert.ok(axis.detail.length > 0)
    }

    // Verify stats
    assert.strictEqual(report.stats.turns, 2)
    assert.ok(report.stats.totalDamageDealt >= 320)
    assert.strictEqual(report.stats.critsLanded, 2)
    assert.strictEqual(report.stats.hpRatio, 98)
  })

  it("TC-EFF-02: Calculates lower grade (B or C) when battle takes many turns with high damage sustained", () => {
    const player = createMockCombatUnit({ hp: 60, maxHp: 500 }) // Only 12% HP left
    const enemy = createMockEnemyUnit({ hp: 0, maxHp: 350 })

    const combatState: CombatState = {
      encounterId: "scout-drone",
      turnNumber: 10, // 10 turns (long battle)
      currentTurnActorId: "player",
      turnQueue: ["player", "scout-drone"],
      player,
      enemy,
      status: "victory",
      logs: [
        {
          id: "log-1",
          turn: 1,
          text: "Player attack",
          type: "player-action",
          actorName: "Marcus Thorne",
          value: 40,
          timestamp: "12:00:01",
        },
        {
          id: "log-2",
          turn: 1,
          text: "Enemy attack hits hard",
          type: "enemy-action",
          actorName: "Flyer Drone",
          targetName: "Marcus Thorne",
          value: 90,
          timestamp: "12:00:02",
        },
        {
          id: "log-3",
          turn: 5,
          text: "Enemy heavy attack hits",
          type: "enemy-action",
          actorName: "Flyer Drone",
          targetName: "Marcus Thorne",
          value: 120,
          timestamp: "12:00:05",
        },
        {
          id: "log-4",
          turn: 10,
          text: "Player finishes enemy",
          type: "player-action",
          actorName: "Marcus Thorne",
          value: 50,
          timestamp: "12:00:10",
        },
      ],
    }

    const report: CombatEfficiencyReport = calculateCombatEfficiency(combatState)

    // Grade should reflect hard-fought / survivor rating
    assert.ok(report.overallScore < 85, `Expected score < 85, got ${report.overallScore}`)
    assert.ok(report.grade === "B" || report.grade === "C", `Expected B or C grade, got ${report.grade}`)
    assert.ok(report.stats.hpRatio <= 20)
    assert.strictEqual(report.stats.turns, 10)
  })

  it("TC-EFF-03: Turn-by-Turn damage breakdown integrity for D3 timeline charts", () => {
    const player = createMockCombatUnit({ hp: 350, maxHp: 400 })
    const enemy = createMockEnemyUnit({ hp: 0, maxHp: 200 })

    const combatState: CombatState = {
      encounterId: "scout-drone",
      turnNumber: 3,
      currentTurnActorId: "player",
      turnQueue: ["player", "scout-drone"],
      player,
      enemy,
      status: "victory",
      logs: [
        {
          id: "log-1",
          turn: 1,
          text: "Turn 1 attack",
          type: "player-action",
          actorName: "Marcus Thorne",
          value: 70,
          timestamp: "12:00:01",
        },
        {
          id: "log-2",
          turn: 1,
          text: "Enemy counter",
          type: "enemy-action",
          actorName: "Flyer Drone",
          targetName: "Marcus Thorne",
          value: 20,
          timestamp: "12:00:02",
        },
        {
          id: "log-3",
          turn: 2,
          text: "Turn 2 attack",
          type: "player-action",
          actorName: "Marcus Thorne",
          value: 80,
          timestamp: "12:00:03",
        },
        {
          id: "log-4",
          turn: 2,
          text: "Enemy hits",
          type: "enemy-action",
          actorName: "Flyer Drone",
          targetName: "Marcus Thorne",
          value: 30,
          timestamp: "12:00:04",
        },
        {
          id: "log-5",
          turn: 3,
          text: "Turn 3 finisher",
          type: "player-action",
          actorName: "Marcus Thorne",
          value: 60,
          timestamp: "12:00:05",
        },
      ],
    }

    const report: CombatEfficiencyReport = calculateCombatEfficiency(combatState)

    assert.strictEqual(report.turnBreakdown.length, 3)
    assert.strictEqual(report.turnBreakdown[0].turn, 1)
    assert.strictEqual(report.turnBreakdown[0].damageDealt, 70)
    assert.strictEqual(report.turnBreakdown[0].damageTaken, 20)

    assert.strictEqual(report.turnBreakdown[1].turn, 2)
    assert.strictEqual(report.turnBreakdown[1].damageDealt, 80)
    assert.strictEqual(report.turnBreakdown[1].damageTaken, 30)

    assert.strictEqual(report.turnBreakdown[2].turn, 3)
    assert.strictEqual(report.turnBreakdown[2].damageDealt, 60)
    assert.strictEqual(report.turnBreakdown[2].damageTaken, 0)
  })

  it("TC-EFF-04: Gracefully handles empty logs or missing turn data without throwing errors", () => {
    const player = createMockCombatUnit()
    const enemy = createMockEnemyUnit()

    const combatState: CombatState = {
      encounterId: "scout-drone",
      turnNumber: 1,
      currentTurnActorId: "player",
      turnQueue: ["player", "scout-drone"],
      player,
      enemy,
      status: "victory",
      logs: [],
    }

    const report = calculateCombatEfficiency(combatState)
    assert.ok(report !== null)
    assert.ok(report.overallScore >= 0 && report.overallScore <= 100)
    assert.strictEqual(report.axes.length, 5)
    assert.strictEqual(report.turnBreakdown.length, 1)
  })
})
