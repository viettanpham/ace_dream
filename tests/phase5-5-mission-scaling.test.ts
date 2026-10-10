import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  ENEMY_BASE_STATS,
  ENEMY_VARIANTS_CONFIG,
  QUEST_QUALITY_CONFIG,
  STANDARD_CAMPAIGN_QUESTS,
  MIN_QUEST_LEVEL,
  MAX_QUEST_LEVEL,
  getEnemyStatScale,
  getBaseQuestCredits,
  getBaseQuestAlloy,
  calculateQuestCurrencyRewards,
  createScaledEnemyUnit,
  rollRarityForQuality,
  generateRandomEquipmentStats,
  generateEquipmentReward,
  buildQuestRewardPreview,
  AFFIX_POOLS_BY_SLOT,
} from "../lib/game/scaling"
import {
  applyMissionClearReward,
  buildPlayerCombatUnit,
  enhanceItem,
  salvageInventoryItem,
  INITIAL_STARFRONT_PROGRESSION,
} from "../lib/game/progression"
import type { CampaignMission, StarfrontProgression } from "../lib/game/types"

describe("Milestone 5.5 — Mission Scaling, Enemy Variants & Equipment Loot System", () => {
  describe("1. TC-MIS-01: Hệ số Cấp Độ Nhiệm Vụ (Level 1–15 Scaling)", () => {
    it("Hệ số chỉ số quái (HP, ATK, DEF, SPD, SP) tăng đơn điệu theo Level trong phạm vi [1..15]", () => {
      let prevHp = 0
      let prevAtk = 0
      let prevDef = 0
      let prevSpd = 0

      for (let lvl = MIN_QUEST_LEVEL; lvl <= MAX_QUEST_LEVEL; lvl++) {
        const scale = getEnemyStatScale(lvl)
        assert.ok(scale.hpScale >= prevHp, `HP Scale ở lvl ${lvl} phải lớn hơn hoặc bằng lvl trước`)
        assert.ok(scale.atkScale >= prevAtk, `ATK Scale ở lvl ${lvl} phải lớn hơn hoặc bằng lvl trước`)
        assert.ok(scale.defScale >= prevDef, `DEF Scale ở lvl ${lvl} phải lớn hơn hoặc bằng lvl trước`)
        assert.ok(scale.spdScale >= prevSpd, `SPD Scale ở lvl ${lvl} phải lớn hơn hoặc bằng lvl trước`)

        prevHp = scale.hpScale
        prevAtk = scale.atkScale
        prevDef = scale.defScale
        prevSpd = scale.spdScale
      }

      // Kiểm tra tại Level 1: delta = 0, scale = 1.0
      const lvl1 = getEnemyStatScale(1)
      assert.equal(lvl1.hpScale, 1.0)
      assert.equal(lvl1.atkScale, 1.0)
      assert.equal(lvl1.defScale, 1.0)

      // Kiểm tra tại Level 10: delta = 9, HP scale = 1 + 9 * 0.18 = 2.62
      const lvl10 = getEnemyStatScale(10)
      assert.equal(Math.round(lvl10.hpScale * 100) / 100, 2.62)
    })
  })

  describe("2. TC-MIS-02: Bảng Cấu Hình Phẩm Chất Nhiệm Vụ (Quality Multipliers)", () => {
    it("5 bậc phẩm chất có hệ số tiền tệ (Credits, Alloy) và độ khó tăng dần theo thứ tự", () => {
      const qualities = ["standard", "veteran", "elite", "heroic", "legendary"] as const
      let prevDiff = 0
      let prevCr = 0
      let prevAlloy = 0

      for (const q of qualities) {
        const cfg = QUEST_QUALITY_CONFIG[q]
        assert.ok(cfg, `Phẩm chất ${q} phải tồn tại trong QUEST_QUALITY_CONFIG`)
        assert.ok(cfg.difficultyMultiplier >= prevDiff, `Độ khó của ${q} phải tăng dần`)
        assert.ok(cfg.creditsMultiplier >= prevCr, `Credits mult của ${q} phải tăng dần`)
        assert.ok(cfg.alloyMultiplier >= prevAlloy, `Alloy mult của ${q} phải tăng dần`)

        prevDiff = cfg.difficultyMultiplier
        prevCr = cfg.creditsMultiplier
        prevAlloy = cfg.alloyMultiplier
      }

      // Kiểm tra tính toán currency tại Level 5
      const stdReward = calculateQuestCurrencyRewards(5, "standard")
      const legReward = calculateQuestCurrencyRewards(5, "legendary")
      assert.ok(legReward.credits > stdReward.credits * 2, "Legendary phải cho hơn 2x Credits so với Standard")
      assert.ok(legReward.alloy > stdReward.alloy * 2, "Legendary phải cho hơn 2x Alloy so với Standard")
    })
  })

  describe("3. TC-MIS-03: 9 Biến Thể Kẻ Địch (Enemy Variants)", () => {
    it("Tất cả 9 biến thể kẻ địch đều có cấu hình hợp lệ và liên kết chính xác với encounterType", () => {
      const expectedVariants = [
        { id: "recon", type: "scout-drone" },
        { id: "interceptor", type: "scout-drone" },
        { id: "jammer", type: "scout-drone" },
        { id: "assault", type: "raider-mech" },
        { id: "berserker", type: "raider-mech" },
        { id: "heavy", type: "raider-mech" },
        { id: "fortress", type: "siege-walker" },
        { id: "annihilator", type: "siege-walker" },
        { id: "colossus", type: "siege-walker" },
      ] as const

      for (const item of expectedVariants) {
        const cfg = ENEMY_VARIANTS_CONFIG[item.id]
        assert.ok(cfg, `Biến thể ${item.id} phải tồn tại`)
        assert.equal(cfg.encounterType, item.type, `Biến thể ${item.id} phải thuộc nhóm ${item.type}`)
        assert.ok(cfg.hpMultiplier > 0, `Hệ số HP phải > 0`)
        assert.ok(cfg.atkMultiplier > 0, `Hệ số ATK phải > 0`)
        assert.ok(cfg.defMultiplier > 0, `Hệ số DEF phải > 0`)
      }
    })
  })

  describe("4. TC-MIS-04: Thứ Tự Áp Dụng Chỉ Số Kẻ Địch (Order of Modifiers)", () => {
    it("Chỉ số được tính toán chính xác theo thứ tự: Base * Variant * LevelScale * Quality", () => {
      // Raider Mech: Base HP = 1150
      // Variant Berserker: hpMultiplier = 0.9
      // Level 1: hpScale = 1.0
      // Quality Veteran: difficultyMultiplier = 1.15
      // Raw HP = 1150 * 0.9 * 1.0 * 1.15 = 1189.75 -> Round = 1190
      const enemy = createScaledEnemyUnit("raider-mech", "berserker", 1, "veteran")
      assert.equal(enemy.maxHp, 1190)
      assert.equal(enemy.hp, 1190)

      // Kiểm tra tên hiển thị có chứa cấp độ và phẩm chất
      assert.ok(enemy.name.includes("Lv.1"), "Tên kẻ địch phải phản ánh Lv.1")
      assert.ok(enemy.title.includes("Tinh Nhuệ"), "Danh hiệu phải phản ánh Tinh Nhuệ")
    })
  })

  describe("5. TC-MIS-05: Giới Hạn An Toàn Chỉ Số (Clamping & Valid Boundaries)", () => {
    it("Chỉ số kẻ địch không bao giờ sinh NaN, Infinity hoặc giá trị âm/vô lý", () => {
      for (const enc of ["scout-drone", "raider-mech", "siege-walker"] as const) {
        for (const q of ["standard", "legendary"] as const) {
          const unitMin = createScaledEnemyUnit(enc, "recon", -5, q)
          const unitMax = createScaledEnemyUnit(enc, "colossus", 99, q)

          for (const unit of [unitMin, unitMax]) {
            assert.ok(!isNaN(unit.hp) && unit.hp >= 100, `HP phải hợp lệ và >= 100`)
            assert.ok(!isNaN(unit.attack) && unit.attack >= 10, `Attack phải hợp lệ và >= 10`)
            assert.ok(!isNaN(unit.defense) && unit.defense >= 0, `Defense phải hợp lệ và >= 0`)
            assert.ok(
              !isNaN(unit.speed) && unit.speed >= 20 && unit.speed <= 160,
              `Speed phải kẹp trong [20..160]`,
            )
            assert.ok(
              !isNaN(unit.evasion) && unit.evasion >= 0 && unit.evasion <= 85,
              `Evasion phải kẹp trong [0..85]`,
            )
            assert.ok(
              unit.critRate !== undefined && unit.critRate >= 0.05 && unit.critRate <= 0.7,
              `CritRate phải kẹp trong [0.05..0.7]`,
            )
          }
        }
      }
    })
  })

  describe("6. TC-MIS-06: Hiệu Ứng Ban Đầu Cho Biến Thể Đặc Biệt", () => {
    it("Jammer khởi đầu có ecm-jamming; Colossus khởi đầu có emergency-guard", () => {
      const jammerUnit = createScaledEnemyUnit("scout-drone", "jammer", 3, "standard")
      assert.ok(
        jammerUnit.statusEffects.some((eff) => eff.type === "ecm-jamming"),
        "Jammer phải có trạng thái ecm-jamming khi vào trận",
      )

      const colossusUnit = createScaledEnemyUnit("siege-walker", "colossus", 9, "legendary")
      assert.ok(
        colossusUnit.statusEffects.some((eff) => eff.type === "emergency-guard"),
        "Colossus phải có trạng thái emergency-guard khi vào trận",
      )

      const reconUnit = createScaledEnemyUnit("scout-drone", "recon", 1, "standard")
      assert.equal(reconUnit.statusEffects.length, 0, "Recon không có hiệu ứng ban đầu")
    })
  })

  describe("7. TC-MIS-07: Rơi ĐÚNG 1 Trang Bị Khi Hoàn Thành Nhiệm Vụ", () => {
    it("applyMissionClearReward luôn thêm đúng 1 trang bị vào kho đồ của người chơi", () => {
      const mission: CampaignMission = {
        id: "m1-1",
        sectorId: "sector-1",
        sectorName: "Vành Đai Asteroid",
        order: 1,
        title: "Nhiệm Vụ 1-1",
        desc: "Tuần tra biên giới",
        recommendedLevel: 1,
        encounterId: "scout-drone",
        level: 1,
        quality: "standard",
        previewReward: buildQuestRewardPreview(1, "standard", "weapon", 123),
        firstClearReward: { credits: 300, exp: 100 },
        repeatReward: { credits: 160, exp: 60 },
      }

      const initialCount = INITIAL_STARFRONT_PROGRESSION.inventory.length
      const { updated, dropItem } = applyMissionClearReward(INITIAL_STARFRONT_PROGRESSION, mission)

      assert.ok(dropItem, "Phải trả về 1 vật phẩm rơi")
      assert.equal(updated.inventory.length, initialCount + 1, "Kho đồ phải tăng đúng 1 món")
      assert.ok(
        updated.inventory.some((it) => it.name === dropItem.name),
        "Trang bị rơi phải có trong kho đồ mới",
      )
    })
  })

  describe("8. TC-MIS-08: Xác Suất Rơi Đồ Theo Phẩm Chất (Rarity Roll Distribution)", () => {
    it("Phẩm chất standard không bao giờ rơi epic/legendary; Phẩm chất legendary không rơi common", () => {
      for (let i = 0; i < 100; i++) {
        const rarityStd = rollRarityForQuality("standard", i)
        assert.ok(
          rarityStd === "common" || rarityStd === "rare",
          "Standard chỉ được rơi Common hoặc Rare",
        )

        const rarityLeg = rollRarityForQuality("legendary", i)
        assert.notEqual(rarityLeg, "common", "Legendary không được rơi Common")
      }
    })
  })

  describe("9. TC-MIS-09: Thuộc Tính Ngẫu Nhiên Của Trang Bị (Stat Affixes)", () => {
    it("Số lượng dòng thuộc tính tuân thủ nghiêm ngặt: Common: 1, Rare: 2, Epic: 3, Legendary: 4", () => {
      const countNonZeroStats = (item: ReturnType<typeof generateRandomEquipmentStats>) => {
        let count = 0
        if (item.attackBonus) count++
        if (item.defenseBonus) count++
        if (item.speedBonus) count++
        if (item.hpBonus) count++
        if (item.spBonus) count++
        return count
      }

      const commonWpn = generateRandomEquipmentStats("weapon", "common", 1, 10)
      assert.equal(countNonZeroStats(commonWpn), 1, "Common có đúng 1 dòng thuộc tính")
      assert.ok(commonWpn.attackBonus !== undefined && commonWpn.attackBonus > 0, "Vũ khí có ATK chính")

      const rareShd = generateRandomEquipmentStats("shield", "rare", 3, 20)
      assert.equal(countNonZeroStats(rareShd), 2, "Rare có đúng 2 dòng thuộc tính")
      assert.ok(rareShd.defenseBonus !== undefined && rareShd.defenseBonus > 0, "Khiên có DEF chính")

      const epicEng = generateRandomEquipmentStats("engine", "epic", 5, 30)
      assert.equal(countNonZeroStats(epicEng), 3, "Epic có đúng 3 dòng thuộc tính")
      assert.ok(epicEng.speedBonus !== undefined && epicEng.speedBonus > 0, "Động cơ có SPD chính")

      const legWpn = generateRandomEquipmentStats("weapon", "legendary", 8, 40)
      assert.equal(countNonZeroStats(legWpn), 4, "Legendary có đúng 4 dòng thuộc tính")
    })
  })

  describe("10. TC-MIS-10: Tính Toàn Vẹn & Lưu Trữ Cố Định Thuộc Tính Trang Bị", () => {
    it("Trang bị sinh ra có id, name, stats cố định và đánh dấu statsRandomized = true", () => {
      const reward = generateEquipmentReward(4, "veteran", "weapon", 999)
      assert.ok(reward.id.startsWith("loot_weapon_l4_veteran"), "ID trang bị phải theo định dạng loot")
      assert.equal(reward.statsRandomized, true, "Phải đánh dấu statsRandomized = true")
      assert.equal(reward.enhancementLevel, 0, "Món mới rơi có cấp cường hóa = 0")
      assert.ok(reward.price > 0, "Giá bán của trang bị phải > 0")
    })
  })

  describe("11. TC-MIS-11: Khớp Giữa Xem Trước & Phần Thưởng Thực Tế (Reward Preview Consistency)", () => {
    it("Toàn bộ Credits, Alloy và Trang Bị người chơi nhận khớp 100% với Xem Trước (Preview)", () => {
      const preview = buildQuestRewardPreview(6, "elite", "shield", 777)
      const mission: CampaignMission = {
        id: "m2-3",
        sectorId: "sector-2",
        sectorName: "Tinh Vân Plasma",
        order: 3,
        title: "Nhiệm Vụ 2-3",
        desc: "Boss Quái vật thép",
        recommendedLevel: 6,
        encounterId: "siege-walker",
        level: 6,
        quality: "elite",
        previewReward: preview,
        firstClearReward: { credits: 1800, exp: 500 },
        repeatReward: { credits: 900, exp: 320 },
      }

      const initialCredits = INITIAL_STARFRONT_PROGRESSION.credits
      const initialAlloy = INITIAL_STARFRONT_PROGRESSION.alloy ?? 25

      const { updated, dropItem } = applyMissionClearReward(INITIAL_STARFRONT_PROGRESSION, mission)

      assert.equal(updated.credits, initialCredits + preview.credits, "Credits nhận được phải bằng đúng preview")
      assert.equal(updated.alloy, initialAlloy + preview.alloy, "Alloy nhận được phải bằng đúng preview")
      assert.equal(dropItem.name, preview.item.name, "Tên trang bị nhận được phải khớp 100% preview")
      assert.equal(dropItem.rarity, preview.item.rarity, "Độ hiếm trang bị nhận được phải khớp 100% preview")
      assert.equal(dropItem.defenseBonus, preview.item.defenseBonus, "Chỉ số DEF phải khớp 100% preview")
    })
  })

  describe("12. TC-MIS-12: Danh Mục 9 Tuyến Ải Chiến Dịch Chuẩn", () => {
    it("STANDARD_CAMPAIGN_QUESTS có đủ 9 nhiệm vụ phân bổ trên 3 Sector với đầy đủ cấu hình", () => {
      assert.equal(STANDARD_CAMPAIGN_QUESTS.length, 9, "Phải có đúng 9 nhiệm vụ chiến dịch")

      const sectorCounts: Record<string, number> = {}
      for (const q of STANDARD_CAMPAIGN_QUESTS) {
        sectorCounts[q.sectorId] = (sectorCounts[q.sectorId] || 0) + 1
        assert.ok(q.level >= 1 && q.level <= 15, `Level của ${q.id} phải trong [1..15]`)
        assert.ok(q.previewReward, `Ải ${q.id} phải có thông tin previewReward`)
        assert.ok(q.previewReward.credits > 0, `Ải ${q.id} preview credits > 0`)
        assert.ok(q.previewReward.alloy > 0, `Ải ${q.id} preview alloy > 0`)
        assert.ok(q.previewReward.item, `Ải ${q.id} preview item tồn tại`)
      }

      assert.equal(sectorCounts["sector-1"], 3, "Sector 1 có 3 nhiệm vụ")
      assert.equal(sectorCounts["sector-2"], 3, "Sector 2 có 3 nhiệm vụ")
      assert.equal(sectorCounts["sector-3"], 3, "Sector 3 có 3 nhiệm vụ")
    })
  })

  describe("13. TC-REG-01: Kiểm Thử Tương Thích & Hồi Quy (Progression, Passives & Economy)", () => {
    it("Trang bị loot ngẫu nhiên tương thích hoàn toàn với Cường Hóa (+1), Tái Chế (Salvage) và Buồng Lái", () => {
      // 1. Tạo 1 trang bị vũ khí ngẫu nhiên
      const lootWeapon = generateEquipmentReward(3, "rare", "weapon", 555)

      let prog: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        credits: 5000,
        alloy: 50,
        inventory: [...INITIAL_STARFRONT_PROGRESSION.inventory, lootWeapon],
      }

      // 2. Kiểm tra Cường Hóa +1
      const enhanceResult = enhanceItem(prog, lootWeapon.id, true)
      assert.equal(enhanceResult.result.success, true, "Cường hóa trang bị loot phải thành công")
      const enhancedItem = enhanceResult.updated.inventory.find((i) => i.id === lootWeapon.id)!
      assert.equal(enhancedItem.enhancementLevel, 1, "Cấp cường hóa phải là +1")

      // 3. Kiểm tra Lắp Đồ & Đồng Bộ Chỉ Số Chiến Đấu
      const equippedProg: StarfrontProgression = {
        ...enhanceResult.updated,
        equipped: {
          ...enhanceResult.updated.equipped,
          weapon: lootWeapon.id,
        },
      }
      const combatUnit = buildPlayerCombatUnit(equippedProg)
      assert.ok(combatUnit.attack > 145, "Chỉ số tấn công phải được cộng dồn chính xác từ trang bị loot +1")

      // 4. Kiểm tra Tái Chế (Salvage) khi tháo ra
      const unequippedProg: StarfrontProgression = {
        ...equippedProg,
        equipped: {
          ...equippedProg.equipped,
          weapon: null,
        },
      }
      const salvageResult = salvageInventoryItem(unequippedProg, lootWeapon.id)
      assert.equal(salvageResult.success, true, "Rã trang bị loot đã tháo phải thành công")
      assert.ok(salvageResult.estimate.alloyGained > 0, "Thu hồi được Alloy khi rã đồ")
      assert.ok(salvageResult.estimate.creditsGained > 0, "Thu hồi được Credits khi rã đồ")
    })
  })
})
