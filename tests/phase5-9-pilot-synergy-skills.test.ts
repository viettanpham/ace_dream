import test from "node:test"
import assert from "node:assert/strict"

import {
  advancePilotSynergySkill,
  calculateSkillPower,
  createInitialPilotSynergySkill,
  DEFAULT_GLOBAL_ADMIN_CONFIG,
  normalizePilotSynergySkill,
  rerollPilotSecondaryLine,
} from "../lib/game/pilot-skill-engine"
import {
  getSynergyTemplateForPilot,
  PILOT_SYNERGY_TEMPLATES,
} from "../lib/game/pilot-skill-templates"
import {
  applyMissionClearReward,
  applyVictoryReward,
  buildPlayerCombatUnit,
  calculateTotalGearStats,
} from "../lib/game/progression"
import {
  calculateCombatDamage,
  createInitialCombatState,
  executeEnemyAIAction,
  executePlayerAction,
} from "../lib/game/engine"
import {
  migrateProgressionToV4,
} from "../lib/game/storage"
import type {
  GlobalAdminConfig,
  PilotSynergySkillInstance,
  RerollOptions,
} from "../lib/game/pilot-skill-types"
import type { StarfrontProgression } from "../lib/game/types"

test("Milestone 5.9 — Pilot Skill Liên Hoàn, Progression, Reroll & Combat Synergy", async (t) => {
  await t.test("1. Cấu hình Template & Khởi tạo Kỹ năng Liên Hoàn", async (t) => {
    await t.test("Có đủ 4 template chuẩn cho Marcus, Valentine, Alviss (Levi) và Eric", () => {
      const pIds = ["marcus", "valentine", "alviss", "eric"]
      for (const pId of pIds) {
        const tpl = getSynergyTemplateForPilot(pId)
        assert.ok(tpl, `Template cho ${pId} phải tồn tại`)
        assert.strictEqual(tpl.pilotId, pId)
        assert.ok(tpl.mainLineDef.baseValue > 0)
        assert.ok(tpl.candidatePool.length >= 3)
      }
    })

    await t.test("Khởi tạo kỹ năng ban đầu ở cấp 1 không có dòng phụ khi pilot cấp 1", () => {
      const skill = createInitialPilotSynergySkill("marcus", 1)
      assert.strictEqual(skill.skillLevel, 1)
      assert.strictEqual(skill.pilotId, "marcus")
      assert.strictEqual(skill.signatureGearId, "vanguard")
      assert.strictEqual(skill.isPassive, false) // Marcus là Active
      assert.strictEqual(skill.secondaryLines.length, 0)
      assert.ok(skill.skillPower > 0)
    })

    await t.test("Pilot cấp cao khởi tạo tự động mở khóa các mốc milestone tương ứng", () => {
      // Pilot cấp 12 phải mở khóa ít nhất 2 mốc milestone (cấp 5 và 10)
      const skill = createInitialPilotSynergySkill("valentine", 12)
      assert.strictEqual(skill.skillLevel, 12)
      assert.strictEqual(skill.isPassive, true) // Valentine là Passive
      assert.strictEqual(skill.secondaryLines.length, 2)
      assert.ok(skill.skillPower > 0)
    })
  })

  await t.test("2. Tăng cấp tuần tự, Mở Milestone & Giới hạn Ngân sách", async (t) => {
    await t.test("Tăng cấp đơn lẻ tuần tự tăng chỉ số dòng chính và thêm dòng phụ tại mốc milestone", () => {
      let skill = createInitialPilotSynergySkill("eric", 1)
      assert.strictEqual(skill.skillLevel, 1)
      assert.strictEqual(skill.secondaryLines.length, 0)

      // Tăng từ cấp 1 lên cấp 5 (chạm mốc milestone đầu tiên)
      for (let l = 2; l <= 5; l++) {
        skill = advancePilotSynergySkill(skill, l)
      }

      assert.strictEqual(skill.skillLevel, 5)
      assert.strictEqual(skill.secondaryLines.length, 1)
      assert.ok(skill.mainLine.currentValue > skill.mainLine.baseValue)
      assert.ok(skill.secondaryLines.some((l) => l.unlockedAtSkillLevel === 5))
    })

    await t.test("Tăng nhảy cấp (multi-level) duyệt tuần tự và không bỏ sót các mốc milestone", () => {
      const initial = createInitialPilotSynergySkill("marcus", 1)
      // Nhảy thẳng lên cấp 15 (vượt qua mốc 5, 10, 15)
      const advanced = advancePilotSynergySkill(initial, 15)

      assert.strictEqual(advanced.skillLevel, 15)
      assert.strictEqual(advanced.secondaryLines.length, 3)
      assert.ok(advanced.secondaryLines.some((l) => l.unlockedAtSkillLevel === 5))
      assert.ok(advanced.secondaryLines.some((l) => l.unlockedAtSkillLevel === 10))
      assert.ok(advanced.secondaryLines.some((l) => l.unlockedAtSkillLevel === 15))
    })

    await t.test("Skill Power tôn trọng trần ngân sách maxSkillPowerBudget", () => {
      const skill = createInitialPilotSynergySkill("alviss", 30)
      const tpl = getSynergyTemplateForPilot("alviss")
      assert.ok(skill.skillPower <= tpl.maxSkillPowerBudget)
    })

    await t.test("Cấu hình Admin CP: Chế độ GLOBAL_PRIORITY giới hạn trần cấp kỹ năng toàn cục", () => {
      const adminConfig: GlobalAdminConfig = {
        ...DEFAULT_GLOBAL_ADMIN_CONFIG,
        globalMaxSkillLevel: 10,
        priorityMode: "GLOBAL_PRIORITY",
      }

      const initial = createInitialPilotSynergySkill("marcus", 1, adminConfig)
      // Cố tình tăng lên cấp 20
      const advanced = advancePilotSynergySkill(initial, 20, adminConfig)
      assert.strictEqual(advanced.skillLevel, 10, "Cấp kỹ năng phải bị khống chế ở mức 10 theo Global Admin")
    })
  })

  await t.test("3. Cơ chế Reroll Dòng Phụ (Ngẫu nhiên & Chọn mục tiêu)", async (t) => {
    await t.test("Reroll ngẫu nhiên thay đổi thành công dòng phụ", () => {
      // Tạo skill có 2 dòng phụ ở cấp 10
      const skill = createInitialPilotSynergySkill("marcus", 10)
      assert.strictEqual(skill.secondaryLines.length, 2)

      const res = rerollPilotSecondaryLine(skill, { type: "random" })
      assert.strictEqual(res.success, true)
      assert.strictEqual(res.updatedSkill.secondaryLines.length, 2)
      assert.ok(res.message.includes("thành công"))
    })

    await t.test("Reroll có chọn mục tiêu (targeted) thay thế chính xác dòng đã chọn", () => {
      const skill = createInitialPilotSynergySkill("valentine", 10)
      const targetIndex = 1
      assert.ok(skill.secondaryLines[targetIndex])

      const res = rerollPilotSecondaryLine(skill, {
        type: "targeted",
        targetLineIndex: targetIndex,
      })

      assert.strictEqual(res.success, true)
      assert.strictEqual(res.updatedSkill.secondaryLines.length, 2)
    })

    await t.test("Không cho phép Reroll khi kỹ năng chưa có dòng phụ nào", () => {
      const skill = createInitialPilotSynergySkill("marcus", 1)
      assert.strictEqual(skill.secondaryLines.length, 0)

      const res = rerollPilotSecondaryLine(skill, { type: "random" })
      assert.strictEqual(res.success, false)
      assert.ok(res.message.includes("chưa mở dòng phụ"))
    })
  })

  await t.test("4. Tích hợp Thực Chiến: Sát thương, Hiệp Đồng Cơ Giáp & Phản Kích", async (t) => {
    await t.test("Kỹ năng chủ động pilot-synergy của Marcus xuất kích gây sát thương áp đảo", () => {
      const mockProg: StarfrontProgression = {
        version: 4,
        level: 5,
        exp: 0,
        credits: 5000,
        activeGearId: "vanguard",
        unlockedGears: ["vanguard", "falcon", "aegis"],
        activePairing: {
          pilotId: "marcus",
          gearId: "vanguard",
          isLocked: false,
          unlockProgress: { completedMissions: 0, wonBattles: 0, targetCount: 5 },
        },
        inventory: [],
        equipped: { weapon: null, shield: null, engine: null },
        completedMissions: [],
        battlesWon: 0,
        battlesLost: 0,
        pilots: {
          marcus: {
            id: "marcus",
            level: 5,
            exp: 0,
            allocatedStats: { attack: 10, defense: 5, agility: 5, shield: 5, tactical: 5 },
            availablePoints: 0,
          },
        },
        pilotSkills: {
          marcus: createInitialPilotSynergySkill("marcus", 5),
        },
      }

      const playerUnit = buildPlayerCombatUnit(mockProg)
      assert.strictEqual(playerUnit.signatureSynergyActive, true, "Marcus lái Vanguard phải kích hoạt Signature Synergy")
      assert.ok(playerUnit.pilotSynergySkill)

      const combatState = createInitialCombatState("scout-drone", playerUnit)
      combatState.status = "player-turn"
      combatState.turnNumber = 1

      const afterAction = executePlayerAction(combatState, "pilot-synergy")
      assert.strictEqual(afterAction.status, "enemy-turn")
      assert.ok(afterAction.enemy.hp < combatState.enemy.hp, "Máu kẻ địch phải giảm sau đòn pilot-synergy")
      assert.ok(afterAction.logs.some((l) => l.text.includes("[LIÊN HOÀN PHI CÔNG ⚡]")))
      assert.ok(afterAction.logs.some((l) => l.text.includes("[HIỆP ĐỒNG ĐỒNG BỘ 100% ✨]")))
    })

    await t.test("Alviss kích hoạt phản kích chớp nhoáng khi né tránh thành công", () => {
      const mockProg: StarfrontProgression = {
        version: 4,
        level: 5,
        exp: 0,
        credits: 5000,
        activeGearId: "falcon",
        unlockedGears: ["vanguard", "falcon", "aegis"],
        activePairing: {
          pilotId: "alviss",
          gearId: "falcon",
          isLocked: false,
          unlockProgress: { completedMissions: 0, wonBattles: 0, targetCount: 5 },
        },
        inventory: [],
        equipped: { weapon: null, shield: null, engine: null },
        completedMissions: [],
        battlesWon: 0,
        battlesLost: 0,
        pilots: {
          alviss: {
            id: "alviss",
            level: 5,
            exp: 0,
            allocatedStats: { attack: 5, defense: 5, agility: 20, shield: 5, tactical: 5 },
            availablePoints: 0,
          },
        },
        pilotSkills: {
          alviss: createInitialPilotSynergySkill("alviss", 5),
        },
      }

      const playerUnit = buildPlayerCombatUnit(mockProg)
      assert.strictEqual(playerUnit.signatureSynergyActive, true)

      const combatState = createInitialCombatState("scout-drone", playerUnit)
      combatState.status = "enemy-turn"
      const initEnemyHp = combatState.enemy.hp

      // Kẻ địch tấn công và người chơi né tránh (forceEvade: true)
      const afterEnemy = executeEnemyAIAction(combatState, { forceEvade: true })
      assert.ok(afterEnemy.logs.some((l) => l.text.includes("[NÉ TRÁNH 💨]")))
      assert.ok(afterEnemy.logs.some((l) => l.text.includes("[LIÊN HOÀN ALVISS ⚡]")))
      assert.ok(afterEnemy.enemy.hp < initEnemyHp, "Kẻ địch phải chịu sát thương phản kích từ Alviss")
    })
  })

  await t.test("5. Lưu Trữ & Di Chuyển Schema v4 với Pilot Synergy Skills", () => {
    const rawLegacyData = {
      version: 3,
      level: 4,
      exp: 120,
      credits: 2500,
      activeGearId: "vanguard",
      unlockedGears: ["vanguard", "falcon", "aegis"],
      inventory: [],
      equipped: { weapon: null, shield: null, engine: null },
      completedMissions: ["mission_01"],
      battlesWon: 3,
      battlesLost: 1,
    }

    const migrated = migrateProgressionToV4(rawLegacyData)
    assert.strictEqual(migrated.version, 4)
    assert.ok(migrated.pilots)
    assert.ok(migrated.pilotSkills)
    assert.ok(migrated.pilotSkills.marcus, "Marcus skill phải được tự động sinh")
    assert.ok(migrated.pilotSkills.valentine, "Valentine skill phải được tự động sinh")
    assert.ok(migrated.pilotSkills.alviss, "Alviss skill phải được tự động sinh")
    assert.ok(migrated.pilotSkills.eric, "Eric skill phải được tự động sinh")
    assert.strictEqual(migrated.rerollTokens, 5, "Khởi tạo mặc định 5 Vé Reroll cho người chơi")
    assert.ok(migrated.globalAdminConfig, "Global Admin Config phải có mặt")
  })
})
