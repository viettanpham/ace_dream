import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  STARFRONT_GEAR_DEFS,
  VANGUARD_INITIAL_UNIT,
  STARFRONT_ENCOUNTERS,
} from "../lib/game/data"
import {
  calculateCombatDamage,
  tickUnitTurn,
  applyStatusEffect,
  executePlayerAction,
  executeEnemyAIAction,
  getEffectiveEvasion,
  cloneUnit,
  createInitialCombatState,
} from "../lib/game/engine"
import {
  buildPlayerCombatUnit,
  INITIAL_STARFRONT_PROGRESSION,
} from "../lib/game/progression"
import type { CombatUnit, CombatState } from "../lib/game/types"

function getFreshProgression() {
  return JSON.parse(JSON.stringify(INITIAL_STARFRONT_PROGRESSION))
}

describe("Milestone 5.2 — Gear Class Identity & Passives", () => {
  describe("1. Vanguard Passive: Lõi Năng Lượng Ổn Định (Stable Core)", () => {
    it("Vanguard hồi thêm +5 SP mỗi lượt (tổng +10 SP/lượt bao gồm +5 tự nhiên)", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "vanguard"
      const unit = buildPlayerCombatUnit(prog)
      unit.sp = 50
      const initialSp = unit.sp

      const tickRes = tickUnitTurn(unit, 1)

      // SP tự nhiên (+5) + Lõi năng lượng (+5) = +10 SP
      assert.equal(unit.sp, initialSp + 10, "Vanguard phải hồi đúng +10 SP mỗi lượt")
      assert.ok(
        tickRes.passiveLogs.some((l) => l.text.includes("Lõi Năng Lượng Ổn Định hồi thêm +5 SP")),
        "Phải có log thông báo kích hoạt Lõi Năng Lượng Ổn Định",
      )
    })

    it("Vanguard không hồi quá maxSp", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "vanguard"
      const unit = buildPlayerCombatUnit(prog)
      unit.sp = unit.maxSp - 2

      tickUnitTurn(unit, 1)
      assert.equal(unit.sp, unit.maxSp, "SP không được vượt quá maxSp")
    })

    it("Vanguard giảm thêm 1 lượt hồi chiêu (CD) ở chu kỳ mỗi 3 lượt (Lượt 3, 6, 9...)", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "vanguard"
      const unit = buildPlayerCombatUnit(prog)
      unit.skillCooldowns = { "pulse-strike": 3 }

      // Khi đến lượt 3 (turnNumber % 3 === 0)
      const tickResTurn3 = tickUnitTurn(unit, 3)

      // Giảm tự nhiên 1 + Giảm chu kỳ 3 lượt 1 = Giảm tổng cộng 2 CD
      assert.equal(
        unit.skillCooldowns["pulse-strike"],
        1,
        "Ở lượt 3, CD phải giảm 2 (1 tự nhiên + 1 từ nội tại Vanguard)",
      )
      assert.ok(
        tickResTurn3.passiveLogs.some((l) => l.text.includes("chu kỳ 3 lượt")),
        "Phải có log kích hoạt chu kỳ 3 lượt",
      )
    })

    it("Vanguard KHÔNG giảm thêm CD ở lượt không phải bội số của 3 (Lượt 1, 2, 4...)", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "vanguard"
      const unit = buildPlayerCombatUnit(prog)
      unit.skillCooldowns = { "pulse-strike": 3 }

      // Khi ở lượt 2 (không chia hết cho 3)
      const tickResTurn2 = tickUnitTurn(unit, 2)

      // Chỉ giảm 1 CD tự nhiên
      assert.equal(
        unit.skillCooldowns["pulse-strike"],
        2,
        "Ở lượt 2, CD chỉ giảm 1 tự nhiên, không kích hoạt giảm thêm",
      )
      assert.ok(
        !tickResTurn2.passiveLogs.some((l) => l.text.includes("chu kỳ 3 lượt")),
        "Không được có log giảm CD chu kỳ 3 lượt",
      )
    })
  })

  describe("2. Falcon Passive: Khí Động Học Mach (Mach Aerodynamics)", () => {
    it("Falcon sở hữu né tránh bẩm sinh +15% và bạo kích cơ bản cao hơn", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "falcon"
      const unit = buildPlayerCombatUnit(prog)

      assert.equal(unit.gearType, "falcon")
      assert.ok(unit.evasion >= 15, "Falcon phải có né tránh cơ bản >= 15%")
      assert.equal(unit.critRate, 0.25, "Falcon có tỉ lệ bạo kích cơ sở là 25%")
      assert.equal(unit.critDamage, 1.75, "Falcon có sát thương bạo kích là 175%")

      const effectiveEva = getEffectiveEvasion(unit)
      assert.ok(effectiveEva >= 15, "Né tránh hiệu dụng phải tính cả nội tại Falcon")
    })

    it("Falcon kích hoạt đòn bắn phụ không tốn SP khi bạo kích thành công", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "falcon"
      const playerUnit = buildPlayerCombatUnit(prog)

      const state = createInitialCombatState("scout-drone", playerUnit)
      state.status = "player-turn"
      const initialEnemyHp = state.enemy.hp
      const primarySkillId = playerUnit.skills[0].id

      // Ép bạo kích và ép kích hoạt bắn bồi của Falcon
      const nextState = executePlayerAction(state, primarySkillId, {
        forceCrit: true,
        forceFalconFollowUp: true,
        forceNoEvade: true,
      })

      assert.ok(nextState.enemy.hp < initialEnemyHp, "Kẻ địch phải mất máu")
      assert.ok(
        nextState.logs.some((l) => l.text.includes("[NỘI TẠI FALCON ⚡] Khí Động Học Mach")),
        "Phải có log kích hoạt đòn bắn bồi của Falcon",
      )
      assert.ok(
        nextState.logs.some((l) => l.text.includes("gây thêm")),
        "Log bắn bồi phải ghi nhận sát thương bổ sung",
      )
    })

    it("Falcon khi KHÔNG bạo kích sẽ KHÔNG kích hoạt đòn bắn bồi", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "falcon"
      const playerUnit = buildPlayerCombatUnit(prog)

      const state = createInitialCombatState("scout-drone", playerUnit)
      const primarySkillId = playerUnit.skills[0].id

      // Ép không né, đòn đánh thường (không crit)
      const nextState = executePlayerAction(state, primarySkillId, {
        forceCrit: false,
        forceFalconFollowUp: false,
        forceNoEvade: true,
      })

      assert.ok(
        !nextState.logs.some((l) => l.text.includes("[NỘI TẠI FALCON ⚡]")),
        "Không được kích hoạt bắn bồi nếu không có bạo kích",
      )
    })
  })

  describe("3. Aegis Passive: Giáp Phản Lực Titan (Titan Reactive Armor)", () => {
    it("Aegis phản lại 20% sát thương nhận vào thẳng vào kẻ tấn công", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "aegis"
      const playerUnit = buildPlayerCombatUnit(prog)
      playerUnit.hp = 2000
      playerUnit.maxHp = 2000

      const state = createInitialCombatState("scout-drone", playerUnit)
      state.status = "enemy-turn"
      const initialEnemyHp = state.enemy.hp

      // Địch tấn công trúng Aegis
      const nextState = executeEnemyAIAction(state, {
        forceNoEvade: true,
      })

      const lastDamage = nextState.lastAction?.damage || 0
      assert.ok(lastDamage > 0, "Địch phải gây ra sát thương lên Aegis")

      const expectedReflect = Math.max(1, Math.round(lastDamage * 0.20))
      assert.equal(
        nextState.enemy.hp,
        initialEnemyHp - expectedReflect,
        `Máu địch phải giảm đúng bằng 20% sát thương phản đòn (${expectedReflect})`,
      )

      assert.ok(
        nextState.logs.some((l) => l.text.includes("[NỘI TẠI AEGIS 🛡️] Giáp Phản Lực Titan kích hoạt")),
        "Phải có log phản đòn Giáp Phản Lực Titan",
      )
    })

    it("Aegis kháng 50% hiệu ứng khống chế tốc độ (EMP-slow)", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "aegis"
      const aegisUnit = buildPlayerCombatUnit(prog)

      // Áp dụng debuff làm chậm 30 SPD
      const res = applyStatusEffect(aegisUnit, {
        type: "emp-slow",
        name: "Làm Chậm Điện Từ",
        desc: "Giảm 30 Tốc độ",
        duration: 2,
        value: 30,
        isDebuff: true,
      })

      // Với Aegis: giá trị giảm 50% => 15 SPD
      assert.equal(res.effect.value, 15, "Giá trị làm chậm phải bị cắt giảm 50% còn 15 SPD")
      assert.ok(
        res.logText.includes("Giáp Phản Lực Titan triệt tiêu 50% hiệu lực"),
        "Phải có log ghi chú triệt tiêu 50% hiệu ứng",
      )
    })

    it("Aegis kháng 50% hiệu ứng Phá Giáp (Armor Break)", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "aegis"
      const aegisUnit = buildPlayerCombatUnit(prog)

      // Áp dụng debuff phá giáp 40% (0.4)
      const res = applyStatusEffect(aegisUnit, {
        type: "armor-break",
        name: "Phá Vỡ Giáp",
        desc: "Giảm 40% Phòng ngự",
        duration: 2,
        value: 0.40,
        isDebuff: true,
      })

      // Với Aegis: 0.40 * 0.50 = 0.20 (20%)
      assert.equal(res.effect.value, 0.2, "Giá trị phá giáp phải giảm còn 20%")
      assert.ok(
        res.logText.includes("Giáp Phản Lực Titan triệt tiêu 50% hiệu lực"),
        "Phải thông báo Aegis kháng phá giáp",
      )
    })

    it("Các class khác (Vanguard, Falcon) KHÔNG được hưởng phản đòn của Aegis", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "vanguard"
      const vanguardUnit = buildPlayerCombatUnit(prog)

      const state = createInitialCombatState("scout-drone", vanguardUnit)
      state.status = "enemy-turn"
      const initialEnemyHp = state.enemy.hp

      const nextState = executeEnemyAIAction(state, {
        forceNoEvade: true,
      })

      assert.equal(
        nextState.enemy.hp,
        initialEnemyHp,
        "Địch không bị mất máu khi đánh trúng Vanguard (không có phản đòn)",
      )
      assert.ok(
        !nextState.logs.some((l) => l.text.includes("[NỘI TẠI AEGIS 🛡️]")),
        "Không được có log phản sát thương của Aegis",
      )
    })
  })

  describe("4. Non-trigger Control Cases & Boundary Conditions", () => {
    it("Đòn đánh bị né tránh (Evaded) KHÔNG kích hoạt phản sát thương hay bạo kích", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "aegis"
      const aegisUnit = buildPlayerCombatUnit(prog)

      const state = createInitialCombatState("scout-drone", aegisUnit)
      state.status = "enemy-turn"
      const initialEnemyHp = state.enemy.hp

      // Địch tấn công nhưng bị né tránh
      const nextState = executeEnemyAIAction(state, {
        forceEvade: true,
      })

      assert.equal(
        nextState.enemy.hp,
        initialEnemyHp,
        "Khi né tránh thành công, không có sát thương nhận vào nên không phản đòn",
      )
      assert.ok(
        nextState.logs.some((l) => l.type === "evade"),
        "Phải có log né tránh",
      )
    })

    it("Khi kẻ địch chết do sát thương phản đòn của Aegis, trạng thái trận đấu phải chuyển sang 'victory'", () => {
      const prog = getFreshProgression()
      prog.activeGearId = "aegis"
      const aegisUnit = buildPlayerCombatUnit(prog)
      aegisUnit.hp = 3000
      aegisUnit.maxHp = 3000

      const state = createInitialCombatState("scout-drone", aegisUnit)
      state.status = "enemy-turn"
      // Cho địch còn rất ít HP (5 HP)
      state.enemy.hp = 5

      const nextState = executeEnemyAIAction(state, {
        forceNoEvade: true,
      })

      assert.equal(nextState.enemy.hp, 0, "Máu địch phải về 0 do phản đòn")
      assert.equal(nextState.status, "victory", "Trận đấu phải kết thúc với trạng thái victory")
      assert.ok(
        nextState.logs.some((l) => l.text.includes("tiêu diệt hoàn toàn bởi sát thương phản đòn")),
        "Phải ghi nhận chiến thắng từ phản sát thương",
      )
    })
  })
})
