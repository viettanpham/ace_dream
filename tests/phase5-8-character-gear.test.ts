import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  CAMPAIGN_SECTORS,
  STARFRONT_GEAR_DEFS,
  STARFRONT_PILOTS,
  STARFRONT_PILOT_MAP,
} from "../lib/game/data"
import {
  allocatePilotPoint,
  applyMissionClearReward,
  applyVictoryReward,
  buildPlayerCombatUnit,
  calculateGearCombatRating,
  calculateTotalGearStats,
  confirmPairing,
  getPilotExpRequiredForLevel,
  INITIAL_STARFRONT_PROGRESSION,
  resetPilotPoints,
} from "../lib/game/progression"
import {
  migrateProgressionToV4,
  STORAGE_KEY_V4,
} from "../lib/game/storage"
import type { StarfrontProgression } from "../lib/game/types"

function getFreshProgression(): StarfrontProgression {
  return JSON.parse(JSON.stringify(INITIAL_STARFRONT_PROGRESSION))
}

describe("Milestone 5.8 — Character & Gear Selection System", () => {
  describe("1. Danh Mục Phi Công & Cơ Giáp (Pilot & Gear Catalog)", () => {
    it("Đủ 4 hồ sơ phi công chuẩn với chỉ số cơ bản và kỹ năng nội tại riêng biệt", () => {
      assert.equal(STARFRONT_PILOTS.length, 4)
      const ids = STARFRONT_PILOTS.map((p) => p.id)
      assert.deepEqual(ids, ["marcus", "valentine", "alviss", "eric"])

      for (const pilot of STARFRONT_PILOTS) {
        assert.ok(pilot.name.length > 0)
        assert.ok(pilot.passive.name.length > 0)
        assert.ok(pilot.passive.desc.length > 0)
        assert.ok(pilot.avatar.length > 0)
        assert.ok(pilot.recommendedGear)
      }
    })

    it("Có đủ 3 cơ giáp chuẩn Vanguard, Falcon, Aegis", () => {
      assert.ok(STARFRONT_GEAR_DEFS.vanguard)
      assert.ok(STARFRONT_GEAR_DEFS.falcon)
      assert.ok(STARFRONT_GEAR_DEFS.aegis)
    })
  })

  describe("2. Cơ Chế Xác Nhận & Khóa Cặp Đôi (Confirmation & Lock Rules)", () => {
    it("Xác nhận ghép đôi lưu trữ cặp đôi, chuyển isLocked = true và khởi tạo bộ đếm 0/5", () => {
      const prog = getFreshProgression()
      const res = confirmPairing(prog, "valentine", "aegis")

      assert.equal(res.success, true)
      assert.equal(res.updated.activePairing?.pilotId, "valentine")
      assert.equal(res.updated.activePairing?.gearId, "aegis")
      assert.equal(res.updated.activeGearId, "aegis")
      assert.equal(res.updated.activePairing?.isLocked, true)
      assert.equal(res.updated.activePairing?.unlockProgress.completedMissions, 0)
      assert.equal(res.updated.activePairing?.unlockProgress.wonBattles, 0)
      assert.equal(res.updated.activePairing?.unlockProgress.targetCount, 5)
    })

    it("Không cho phép đổi cặp đôi mới khi đang bị khóa và chưa đạt 5 trận thắng hoặc 5 nhiệm vụ", () => {
      const prog = getFreshProgression()
      const lockedProg = confirmPairing(prog, "valentine", "aegis").updated

      // Thử đổi sang Alviss + Falcon khi mới 2 trận thắng, 1 nhiệm vụ
      lockedProg.activePairing!.unlockProgress.wonBattles = 2
      lockedProg.activePairing!.unlockProgress.completedMissions = 1

      const tryChange = confirmPairing(lockedProg, "alviss", "falcon")
      assert.equal(tryChange.success, false)
      assert.ok(tryChange.message.includes("đang bị khóa"))
      assert.equal(tryChange.updated.activePairing?.pilotId, "valentine")
      assert.equal(tryChange.updated.activePairing?.gearId, "aegis")
    })

    it("Tự động cho phép đổi cặp đôi khi đạt đủ 5 trận thắng đấu trường (wonBattles >= 5)", () => {
      const prog = getFreshProgression()
      const lockedProg = confirmPairing(prog, "valentine", "aegis").updated
      lockedProg.activePairing!.unlockProgress.wonBattles = 5

      const tryChange = confirmPairing(lockedProg, "alviss", "falcon")
      assert.equal(tryChange.success, true)
      assert.equal(tryChange.updated.activePairing?.pilotId, "alviss")
      assert.equal(tryChange.updated.activePairing?.gearId, "falcon")
    })

    it("Tự động cho phép đổi cặp đôi khi đạt đủ 5 nhiệm vụ chiến dịch (completedMissions >= 5)", () => {
      const prog = getFreshProgression()
      const lockedProg = confirmPairing(prog, "valentine", "aegis").updated
      lockedProg.activePairing!.unlockProgress.completedMissions = 5

      const tryChange = confirmPairing(lockedProg, "eric", "vanguard")
      assert.equal(tryChange.success, true)
      assert.equal(tryChange.updated.activePairing?.pilotId, "eric")
      assert.equal(tryChange.updated.activePairing?.gearId, "vanguard")
    })
  })

  describe("3. Phân Bổ Điểm Thuộc Tính & Tẩy Điểm Phi Công", () => {
    it("Cộng điểm thuộc tính chính xác và trừ điểm khả dụng", () => {
      const prog = getFreshProgression()
      // Giả lập phi công Marcus lên cấp 2 và có 5 điểm khả dụng
      prog.pilots.marcus.level = 2
      prog.pilots.marcus.availablePoints = 5

      const resAtk = allocatePilotPoint(prog, "marcus", "attack")
      assert.equal(resAtk.success, true)
      assert.equal(resAtk.updated.pilots.marcus.allocatedStats.attack, 1)
      assert.equal(resAtk.updated.pilots.marcus.availablePoints, 4)

      const resShield = allocatePilotPoint(resAtk.updated, "marcus", "shield")
      assert.equal(resShield.success, true)
      assert.equal(resShield.updated.pilots.marcus.allocatedStats.shield, 1)
      assert.equal(resShield.updated.pilots.marcus.availablePoints, 3)
    })

    it("Không cho phép cộng điểm khi đã hết availablePoints", () => {
      const prog = getFreshProgression()
      prog.pilots.marcus.availablePoints = 0

      const res = allocatePilotPoint(prog, "marcus", "defense")
      assert.equal(res.success, false)
      assert.equal(res.updated.pilots.marcus.allocatedStats.defense, 0)
    })

    it("Tẩy điểm hoàn trả 100% điểm thuộc tính về availablePoints và trừ Credits", () => {
      const prog = getFreshProgression()
      prog.credits = 1000
      prog.pilots.marcus.level = 3 // Tổng (3 - 1) * 5 = 10 điểm
      prog.pilots.marcus.allocatedStats = {
        attack: 4,
        defense: 3,
        agility: 1,
        shield: 1,
        tactical: 1,
      }
      prog.pilots.marcus.availablePoints = 0

      const res = resetPilotPoints(prog, "marcus", 200)
      assert.equal(res.success, true)
      assert.equal(res.updated.credits, 800)
      assert.equal(res.updated.pilots.marcus.availablePoints, 10)
      assert.equal(res.updated.pilots.marcus.allocatedStats.attack, 0)
      assert.equal(res.updated.pilots.marcus.allocatedStats.defense, 0)
      assert.equal(res.updated.pilots.marcus.allocatedStats.agility, 0)
      assert.equal(res.updated.pilots.marcus.allocatedStats.shield, 0)
      assert.equal(res.updated.pilots.marcus.allocatedStats.tactical, 0)
    })
  })

  describe("4. Tích Lũy EXP Cho Phi Công & Mở Khóa Tiến Trình Qua Chiến Thắng", () => {
    it("applyVictoryReward chỉ cộng EXP cho phi công đang được ghép đôi xuất kích", () => {
      const prog = getFreshProgression()
      prog.activePairing = {
        pilotId: "valentine",
        gearId: "aegis",
        isLocked: true,
        unlockProgress: { completedMissions: 0, wonBattles: 0, targetCount: 5 },
      }

      const prevMarcusExp = prog.pilots.marcus.exp
      const prevValExp = prog.pilots.valentine.exp

      const res = applyVictoryReward(prog, "scout-drone")
      // Valentine phải nhận EXP từ chiến thắng
      assert.ok(res.updated.pilots.valentine.exp > prevValExp)
      // Marcus KHÔNG tham chiến nên EXP không đổi
      assert.equal(res.updated.pilots.marcus.exp, prevMarcusExp)
      // Bộ đếm wonBattles của activePairing phải tăng lên 1
      assert.equal(res.updated.activePairing?.unlockProgress.wonBattles, 1)
    })

    it("Khi wonBattles đạt 5, activePairing tự động mở khóa (isLocked = false)", () => {
      const prog = getFreshProgression()
      prog.activePairing = {
        pilotId: "valentine",
        gearId: "aegis",
        isLocked: true,
        unlockProgress: { completedMissions: 0, wonBattles: 4, targetCount: 5 },
      }

      const res = applyVictoryReward(prog, "scout-drone")
      assert.equal(res.updated.activePairing?.unlockProgress.wonBattles, 5)
      assert.equal(res.updated.activePairing?.isLocked, false)
    })

    it("applyMissionClearReward tăng completedMissions và mở khóa khi đạt 5 nhiệm vụ", () => {
      const prog = getFreshProgression()
      prog.activePairing = {
        pilotId: "alviss",
        gearId: "falcon",
        isLocked: true,
        unlockProgress: { completedMissions: 4, wonBattles: 1, targetCount: 5 },
      }

      const res = applyMissionClearReward(prog, CAMPAIGN_SECTORS[0].missions[0])
      assert.equal(res.updated.activePairing?.unlockProgress.completedMissions, 5)
      assert.equal(res.updated.activePairing?.isLocked, false)
    })
  })

  describe("5. Tính Toán Chỉ Số Chiến Đấu & Hiệu Ứng Ghép Đôi", () => {
    it("calculateTotalGearStats cộng chính xác chỉ số phân bổ của phi công", () => {
      const pilotData = {
        id: "marcus",
        level: 2,
        exp: 100,
        allocatedStats: {
          attack: 5, // +10 ATK
          defense: 4, // +6 DEF
          agility: 3, // +3 SPD
          shield: 2, // +60 Shield
          tactical: 2,
        },
        availablePoints: 0,
      }

      const withoutPilot = calculateTotalGearStats("vanguard", 1, [], { weapon: null, shield: null, engine: null })
      const withPilot = calculateTotalGearStats("vanguard", 1, [], { weapon: null, shield: null, engine: null }, pilotData)

      assert.equal(withPilot.total.attack, withoutPilot.total.attack + 10)
      assert.equal(withPilot.total.defense, withoutPilot.total.defense + 6)
      assert.equal(withPilot.total.speed, withoutPilot.total.speed + 3)
      assert.equal(withPilot.breakdown.pilot.attack, 10)
      assert.equal(withPilot.breakdown.pilot.defense, 6)
      assert.equal(withPilot.breakdown.pilot.speed, 3)
    })

    it("buildPlayerCombatUnit phản ánh chuẩn xác chỉ số Khiên, Né Tránh, Bạo Kích của Phi Công", () => {
      const prog = getFreshProgression()
      prog.activePairing = {
        pilotId: "alviss",
        gearId: "falcon",
        isLocked: true,
        unlockProgress: { completedMissions: 0, wonBattles: 0, targetCount: 5 },
      }
      prog.pilots.alviss = {
        id: "alviss",
        level: 2,
        exp: 0,
        allocatedStats: {
          attack: 0,
          defense: 0,
          agility: 10, // +2% né tránh từ agility
          shield: 2,
          tactical: 5,
        },
        availablePoints: 0,
      }

      const unit = buildPlayerCombatUnit(prog)
      assert.equal(unit.gearType, "falcon")
      assert.equal(unit.pilotId, "alviss")
      assert.equal(unit.pilotName, "Alviss Reed")
      // Né tránh: Falcon (15%) + Alviss nội tại (8%) + Agility 10 (2%) = 25%
      assert.equal(unit.evasion, 25)
    })
  })

  describe("6. Migration Schema v4 & Lưu Trữ Bền Vững", () => {
    it("migrateProgressionToV4 di chuyển mượt mà từ save cũ không có phi công", () => {
      const legacySave = {
        version: 3,
        level: 5,
        exp: 1200,
        credits: 8000,
        alloy: 50,
        activeGearId: "aegis",
      }

      const migrated = migrateProgressionToV4(legacySave)
      assert.equal(migrated.version, 4)
      assert.equal(migrated.activeGearId, "aegis")
      assert.ok(migrated.pilots.marcus)
      assert.ok(migrated.pilots.valentine)
      assert.ok(migrated.pilots.alviss)
      assert.ok(migrated.pilots.eric)
      assert.equal(migrated.activePairing.gearId, "aegis")
      assert.equal(migrated.activePairing.isLocked, false)
      assert.equal(migrated.activePairing.unlockProgress.targetCount, 5)
    })
  })
})
