import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  migrateProgressionToV3,
  STORAGE_KEY_V3,
  STORAGE_KEY_V2,
  STORAGE_KEY_V1,
} from "../lib/game/storage"
import {
  buildPlayerCombatUnit,
  calculateTotalGearStats,
  INITIAL_STARFRONT_PROGRESSION,
} from "../lib/game/progression"
import { STARFRONT_GEAR_DEFS } from "../lib/game/data"
import type { StarfrontProgression } from "../lib/game/types"

describe("Milestone 5.4 — Storage Schema v3 & Hardened State Synchronization", () => {
  describe("1. Di Chuyển Schema v1 -> v3 (Migration from v1)", () => {
    it("Di chuyển an toàn save file v1: nâng cấp lên version 3, khởi tạo Alloy = 25, freeShopRefreshes = 1 và gán enhancementLevel = 0 cho mọi trang bị", () => {
      const v1SaveData = {
        version: 1,
        level: 3,
        exp: 180,
        credits: 1250,
        battlesWon: 6,
        battlesLost: 1,
        inventory: [
          {
            id: "wpn_pulse_carbine",
            name: "Súng Xung Điện Pulse Carbine",
            slot: "weapon",
            rarity: "common",
            desc: "Súng cơ bản",
            attackBonus: 15,
          },
          {
            id: "shd_composite_plate",
            name: "Giáp Hợp Kim Composite",
            slot: "shield",
            rarity: "common",
            desc: "Giáp cơ bản",
            defenseBonus: 12,
            hpBonus: 120,
          },
        ],
        equipped: {
          weapon: "wpn_pulse_carbine",
          shield: "shd_composite_plate",
          engine: "eng_ion_booster",
        },
      }

      const migrated = migrateProgressionToV3(v1SaveData)

      assert.equal(migrated.version, 3, "Phiên bản phải là 3")
      assert.equal(migrated.level, 3, "Bảo toàn cấp độ người chơi")
      assert.equal(migrated.exp, 180, "Bảo toàn EXP")
      assert.equal(migrated.credits, 1250, "Bảo toàn Credits")
      assert.equal(migrated.alloy, 25, "Tự động cấp 25 Alloy cho save v1")
      assert.equal(migrated.freeShopRefreshes, 1, "Tự động cấp 1 lượt làm mới shop miễn phí")
      assert.equal(migrated.activeGearId, "vanguard", "Mặc định activeGearId là vanguard")
      assert.deepEqual(migrated.unlockedGears, ["vanguard", "falcon", "aegis"])

      // Kiểm tra tất cả trang bị đều có enhancementLevel = 0
      for (const item of migrated.inventory) {
        assert.equal(
          item.enhancementLevel,
          0,
          `Món ${item.name} trong save v1 phải được gán enhancementLevel = 0`,
        )
      }
    })
  })

  describe("2. Di Chuyển Schema v2 -> v3 (Migration from v2)", () => {
    it("Di chuyển an toàn save file v2: bảo toàn activeGearId, cấp cường hóa hiện có và các nhiệm vụ đã hoàn thành", () => {
      const v2SaveData = {
        version: 2,
        level: 6,
        exp: 450,
        credits: 5200,
        alloy: 65,
        freeShopRefreshes: 3,
        activeGearId: "falcon",
        unlockedGears: ["vanguard", "falcon", "aegis"],
        completedMissions: ["mis-1-1", "mis-1-2", "mis-1-3", "mis-2-1"],
        battlesWon: 15,
        battlesLost: 3,
        inventory: [
          {
            id: "wpn_plasma_cutter",
            name: "Pháo Cắt Plasma Cao Áp",
            slot: "weapon",
            rarity: "rare",
            desc: "Vũ khí cắt plasma",
            attackBonus: 32,
            enhancementLevel: 4, // Đã cường hóa lên +4
          },
          {
            id: "shd_nano_barrier",
            name: "Khiên Nano Tự Phục Hồi",
            slot: "shield",
            rarity: "epic",
            desc: "Khiên nano",
            defenseBonus: 25,
            enhancementLevel: 2, // Đã cường hóa lên +2
          },
          {
            id: "eng_warp_drive",
            name: "Động Cơ Gia Tốc Không-Thời Gian",
            slot: "engine",
            rarity: "legendary",
            desc: "Động cơ warp",
            speedBonus: 16,
            // Chưa có trường enhancementLevel
          },
        ],
        equipped: {
          weapon: "wpn_plasma_cutter",
          shield: "shd_nano_barrier",
          engine: "eng_warp_drive",
        },
      }

      const migrated = migrateProgressionToV3(v2SaveData)

      assert.equal(migrated.version, 3, "Version phải nâng lên 3")
      assert.equal(migrated.activeGearId, "falcon", "Bảo toàn activeGearId = falcon")
      assert.equal(migrated.level, 6, "Bảo toàn cấp độ 6")
      assert.equal(migrated.credits, 5200, "Bảo toàn 5200 Credits")
      assert.equal(migrated.alloy, 65, "Bảo toàn 65 Alloy")
      assert.equal(migrated.freeShopRefreshes, 3, "Bảo toàn 3 lượt refresh shop")
      assert.deepEqual(
        migrated.completedMissions,
        ["mis-1-1", "mis-1-2", "mis-1-3", "mis-2-1"],
        "Bảo toàn 4 nhiệm vụ đã clear",
      )

      // Kiểm tra món đã có cấp cường hóa giữ nguyên cấp độ
      const weapon = migrated.inventory.find((i) => i.id === "wpn_plasma_cutter")!
      assert.equal(weapon.enhancementLevel, 4, "Vũ khí +4 phải giữ nguyên cấp +4")

      const shield = migrated.inventory.find((i) => i.id === "shd_nano_barrier")!
      assert.equal(shield.enhancementLevel, 2, "Khiên +2 phải giữ nguyên cấp +2")

      // Món chưa có enhancementLevel tự động gán về 0
      const engine = migrated.inventory.find((i) => i.id === "eng_warp_drive")!
      assert.equal(engine.enhancementLevel, 0, "Động cơ thiếu cấp phải được gán về 0")
    })
  })

  describe("3. Khả Năng Chống Chịu Dữ Liệu Bất Thường (Edge Cases & Resilience)", () => {
    it("Xử lý an toàn khi đầu vào là null, undefined, chuỗi rỗng hoặc đối tượng hỏng", () => {
      const fromNull = migrateProgressionToV3(null)
      assert.equal(fromNull.version, 3)
      assert.equal(fromNull.level, 1)
      assert.equal(fromNull.activeGearId, "vanguard")

      const fromUndefined = migrateProgressionToV3(undefined)
      assert.equal(fromUndefined.version, 3)

      const fromEmpty = migrateProgressionToV3({})
      assert.equal(fromEmpty.version, 3)
      assert.equal(fromEmpty.credits, 0)
      assert.equal(fromEmpty.alloy, 25)
    })

    it("Chuẩn hóa các giá trị chỉ số âm, NaN và kẹp enhancementLevel trong [0..10]", () => {
      const corrupted = {
        version: 2,
        level: -10,
        exp: -50,
        credits: -999,
        alloy: -10,
        activeGearId: "invalid_mech_id_xyz",
        inventory: [
          {
            id: "item_over",
            name: "Đồ Quá Cấp",
            slot: "weapon",
            rarity: "common",
            desc: "",
            enhancementLevel: 99, // Quá 10
          },
          {
            id: "item_under",
            name: "Đồ Âm Cấp",
            slot: "shield",
            rarity: "common",
            desc: "",
            enhancementLevel: -5, // Âm
          },
        ],
      }

      const migrated = migrateProgressionToV3(corrupted)
      assert.equal(migrated.level, 1, "Level âm phải được đẩy lên 1")
      assert.equal(migrated.exp, 0, "EXP âm phải đưa về 0")
      assert.equal(migrated.credits, 0, "Credits âm phải đưa về 0")
      assert.equal(migrated.alloy, 0, "Alloy âm đưa về 0")
      assert.equal(migrated.activeGearId, "vanguard", "Gear không hợp lệ phải fallback về vanguard")

      const itemOver = migrated.inventory.find((i) => i.id === "item_over")!
      assert.equal(itemOver.enhancementLevel, 10, "Cấp > 10 phải được kẹp về 10")

      const itemUnder = migrated.inventory.find((i) => i.id === "item_under")!
      assert.equal(itemUnder.enhancementLevel, 0, "Cấp < 0 phải được kẹp về 0")
    })
  })

  describe("4. Đồng Bộ Hóa Trạng Thái Gear (Hardened State Synchronization)", () => {
    it("Đổi sang Falcon lập tức cập nhật đúng bộ 4 kỹ năng, Tốc độ SPD cao hơn và Tỉ lệ Né Tránh 15%", () => {
      const prog: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        activeGearId: "falcon",
      }

      const playerUnit = buildPlayerCombatUnit(prog)

      assert.equal(playerUnit.gearType, "falcon")
      assert.equal(playerUnit.name, `${STARFRONT_GEAR_DEFS.falcon.name} (Cấp ${prog.level})`)
      assert.equal(playerUnit.title, STARFRONT_GEAR_DEFS.falcon.role)
      assert.equal(playerUnit.evasion, 15, "Falcon phải có 15% né tránh bẩm sinh")
      assert.equal(playerUnit.critRate, 0.25, "Falcon phải có 25% crit rate")
      assert.equal(playerUnit.critDamage, 1.75, "Falcon phải có 1.75x crit damage")

      // Bộ 4 kỹ năng của Falcon
      const falconSkillIds = playerUnit.skills.map((s) => s.id)
      assert.deepEqual(falconSkillIds, STARFRONT_GEAR_DEFS.falcon.skills.map((s) => s.id))
      assert.equal(falconSkillIds.length, 4, "Phải có đủ 4 kỹ năng")
    })

    it("Đổi sang Aegis lập tức cập nhật đúng bộ 4 kỹ năng phòng ngự và chỉ số Thủ vượt trội", () => {
      const prog: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        activeGearId: "aegis",
      }

      const playerUnit = buildPlayerCombatUnit(prog)

      assert.equal(playerUnit.gearType, "aegis")
      assert.equal(playerUnit.name, `${STARFRONT_GEAR_DEFS.aegis.name} (Cấp ${prog.level})`)
      assert.equal(playerUnit.title, STARFRONT_GEAR_DEFS.aegis.role)
      assert.equal(playerUnit.evasion, 0, "Aegis không có né tránh bẩm sinh")

      // Bộ 4 kỹ năng của Aegis
      const aegisSkillIds = playerUnit.skills.map((s) => s.id)
      assert.deepEqual(aegisSkillIds, STARFRONT_GEAR_DEFS.aegis.skills.map((s) => s.id))
      assert.equal(aegisSkillIds.length, 4, "Phải có đủ 4 kỹ năng")

      // So sánh chỉ số cơ sở: Aegis DEF (32) > Vanguard DEF (20)
      const vgUnit = buildPlayerCombatUnit({
        ...INITIAL_STARFRONT_PROGRESSION,
        activeGearId: "vanguard",
      })
      assert.ok(
        playerUnit.defense > vgUnit.defense,
        "Aegis phải có điểm phòng thủ cao hơn Vanguard với cùng trang bị",
      )
    })

    it("Cường hóa trang bị lập tức đồng bộ hóa và tăng chỉ số của CombatUnit", () => {
      const progBefore: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        activeGearId: "vanguard",
      }
      const unitBefore = buildPlayerCombatUnit(progBefore)

      // Cường hóa vũ khí đang trang bị lên +5
      const weaponId = progBefore.equipped.weapon!
      const progAfter: StarfrontProgression = {
        ...progBefore,
        inventory: progBefore.inventory.map((it) =>
          it.id === weaponId ? { ...it, enhancementLevel: 5 } : it,
        ),
      }
      const unitAfter = buildPlayerCombatUnit(progAfter)

      assert.ok(
        unitAfter.attack > unitBefore.attack,
        `ATK sau khi cường hóa vũ khí +5 (${unitAfter.attack}) phải lớn hơn trước (${unitBefore.attack})`,
      )
    })
  })

  describe("5. Khóa Lưu Trữ & Hằng Số Schema v3", () => {
    it("Đảm bảo các khóa lưu trữ phân tách rõ ràng và hằng số version mặc định = 3", () => {
      assert.equal(STORAGE_KEY_V3, "STARFRONT_SAVE_DATA_V3")
      assert.equal(STORAGE_KEY_V2, "STARFRONT_SAVE_DATA_V2")
      assert.equal(STORAGE_KEY_V1, "STARFRONT_SAVE_DATA_V1")
      assert.ok(INITIAL_STARFRONT_PROGRESSION.version >= 3, "Schema version phải từ v3 trở lên (hiện tại v4)")
    })
  })
})
