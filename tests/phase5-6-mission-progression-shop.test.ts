import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  ARMORY_SHOP_ITEMS,
  CAMPAIGN_SECTORS,
} from "../lib/game/data"
import {
  buyShopItem,
  generateShopCatalog,
  generateSideQuests,
  isShopItemUnlocked,
  refreshArmoryShop,
  resetCampaignMissionConfig,
  resetSideQuests,
  applyMissionClearReward,
  INITIAL_STARFRONT_PROGRESSION,
} from "../lib/game/progression"
import {
  ALL_CAMPAIGN_QUESTS,
  createScaledEnemyUnit,
  findCampaignQuest,
  STANDARD_CAMPAIGN_QUESTS,
} from "../lib/game/scaling"
import {
  migrateProgressionToV3,
} from "../lib/game/storage"
import type { ArmoryShopItem, StarfrontProgression } from "../lib/game/types"

describe("Milestone 5.6 — Mission Progression, Shop Refresh & Unlock Fixes", () => {
  // 1. Kiểm tra sửa lỗi mở khóa vũ khí Ải 3-3
  describe("1. Sửa Lỗi Mở Khóa Vũ Khí & Đồng Bộ Điều Kiện", () => {
    it("TC-P56-01: Vũ khí Sector 3 (m3-3) mở khóa ngay khi hoàn thành ải 3-3", () => {
      const stellarWeapon = ARMORY_SHOP_ITEMS.find(
        (si) => si.item.id === "shop_wpn_stellar_annihilator" || si.requiredSectorId === "sector-3",
      )!
      assert.ok(stellarWeapon, "Phải tìm thấy vũ khí Sector 3 trong danh mục Chợ")

      // Khi chưa hoàn thành 3-3
      const progBefore: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        completedMissions: ["m1-1", "m1-2", "m1-3", "m2-1", "m2-2", "m2-3", "m3-1", "m3-2"],
      }
      const checkBefore = isShopItemUnlocked(stellarWeapon, progBefore)
      assert.equal(checkBefore.unlocked, false, "Vũ khí Sector 3 phải bị KHÓA khi chưa hoàn thành 3-3")

      // Khi đã hoàn thành 3-3 với id 'm3-3'
      const progAfter: StarfrontProgression = {
        ...progBefore,
        completedMissions: [...progBefore.completedMissions, "m3-3"],
      }
      const checkAfter = isShopItemUnlocked(stellarWeapon, progAfter)
      assert.equal(checkAfter.unlocked, true, "Vũ khí Sector 3 PHẢI MỞ KHÓA khi hoàn thành Ải 3-3 (m3-3)")

      // Cũng tương thích ngược nếu lưu 'mis-3-3'
      const progLegacy: StarfrontProgression = {
        ...progBefore,
        completedMissions: [...progBefore.completedMissions, "mis-3-3"],
      }
      assert.equal(isShopItemUnlocked(stellarWeapon, progLegacy).unlocked, true, "Tương thích với định danh legacy mis-3-3")
    })

    it("TC-P56-02: Không tự động mở khóa vũ khí khi chưa đủ điều kiện hoàn thành Sector", () => {
      const sector2Weapon = ARMORY_SHOP_ITEMS.find((si) => si.requiredSectorId === "sector-2")!
      const sector3Weapon = ARMORY_SHOP_ITEMS.find((si) => si.requiredSectorId === "sector-3")!

      const freshProg: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        completedMissions: ["m1-1"],
      }

      assert.equal(isShopItemUnlocked(sector2Weapon, freshProg).unlocked, false)
      assert.equal(isShopItemUnlocked(sector3Weapon, freshProg).unlocked, false)

      // buyShopItem phải từ chối mua nếu chưa mở khóa
      const buyAttempt = buyShopItem({ ...freshProg, credits: 99999 }, sector3Weapon)
      assert.equal(buyAttempt.success, false, "Không được cho phép mua vũ khí chưa mở khóa")
      assert.match(buyAttempt.message, /chưa mở khóa/i)
    })
  })

  // 2. Làm mới Chợ Quân Sự
  describe("2. Làm Mới Chợ Quân Sự (Shop Refresh)", () => {
    it("TC-P56-03: refreshArmoryShop ưu tiên sử dụng lượt miễn phí", () => {
      const prog: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        credits: 50,
        freeShopRefreshes: 2,
      }

      const res = refreshArmoryShop(prog)
      assert.equal(res.success, true)
      assert.equal(res.updated.freeShopRefreshes, 1)
      assert.equal(res.updated.credits, 50, "Credits không bị trừ khi có lượt miễn phí")
      assert.ok(Array.isArray(res.updated.currentShopItems), "Phải sinh ra danh mục hàng mới")
      assert.ok(res.updated.currentShopItems!.length >= 6, "Danh mục hàng phải có ít nhất 6 món")
    })

    it("TC-P56-04: refreshArmoryShop trừ 100 Credits khi hết lượt miễn phí và chặn khi thiếu tiền", () => {
      const progWithCr: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        credits: 250,
        freeShopRefreshes: 0,
      }

      const resSuccess = refreshArmoryShop(progWithCr)
      assert.equal(resSuccess.success, true)
      assert.equal(resSuccess.updated.credits, 150)

      const progPoor: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        credits: 80,
        freeShopRefreshes: 0,
      }
      const resFail = refreshArmoryShop(progPoor)
      assert.equal(resFail.success, false)
      assert.equal(resFail.updated.credits, 80)
      assert.match(resFail.message, /Không đủ Credits/i)
    })

    it("TC-P56-05: Mua hàng cập nhật trạng thái isPurchased và lưu trữ trang bị", () => {
      const catalog = generateShopCatalog(INITIAL_STARFRONT_PROGRESSION)
      const baseItem = catalog.find((i) => !i.requiredSectorId)!

      const prog: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        credits: 2000,
        currentShopItems: catalog,
      }

      const buyRes = buyShopItem(prog, baseItem)
      assert.equal(buyRes.success, true)
      assert.equal(buyRes.updated.credits, 2000 - baseItem.buyPrice)
      assert.ok(buyRes.updated.inventory.some((it) => it.name === baseItem.item.name))

      const boughtInShop = buyRes.updated.currentShopItems?.find((i) => i.item.id === baseItem.item.id)
      assert.equal(boughtInShop?.isPurchased, true, "Món đồ vừa mua phải được đánh dấu isPurchased: true")
    })
  })

  // 3. Mở rộng nhiệm vụ chính tuyến & Khóa cấu hình
  describe("3. Mở Rộng Chiến Dịch & Cấu Hình Địch Khóa", () => {
    it("TC-P56-06: CAMPAIGN_SECTORS có 4 Sector với Sector 4 Event Horizon đầy đủ", () => {
      assert.equal(CAMPAIGN_SECTORS.length, 4, "Phải có đúng 4 Sector chiến dịch")
      const sector4 = CAMPAIGN_SECTORS.find((s) => s.id === "sector-4")
      assert.ok(sector4, "Phải tồn tại sector-4")
      assert.equal(sector4!.missions.length, 3, "Sector 4 phải có đúng 3 ải (4-1, 4-2, 4-3)")
      assert.equal(sector4!.missions[0].id, "m4-1")
      assert.equal(sector4!.missions[0].reqMissionId, "m3-3", "Ải 4-1 yêu cầu hoàn thành Ải 3-3")
    })

    it("TC-P56-07: findCampaignQuest tìm thấy cả nhiệm vụ tiêu chuẩn và mở rộng", () => {
      const q33 = findCampaignQuest("m3-3")
      assert.ok(q33, "Phải tìm thấy Ải 3-3")
      assert.equal(q33!.level, 9)

      const q43 = findCampaignQuest("m4-3")
      assert.ok(q43, "Phải tìm thấy Ải 4-3")
      assert.equal(q43!.level, 12)
    })

    it("TC-P56-08: createScaledEnemyUnit sinh địch đúng cấu hình và chỉ số cấp độ", () => {
      const enemy33 = createScaledEnemyUnit("siege-walker", "colossus", 9, "legendary")
      assert.equal(enemy33.hp > 4000, true, "Boss Colossus cấp 9 Legendary phải có máu trâu > 4000")
      assert.equal(enemy33.defense > 50, true)
      assert.ok(enemy33.statusEffects.some((e) => e.type === "emergency-guard"), "Colossus phải có khiên bảo hộ khởi đầu")
    })
  })

  // 4. Reset Nhiệm vụ & Nhiệm vụ phụ tuyến
  describe("4. Reset Nhiệm Vụ & Hệ Thống Phụ Tuyến (Side Quests)", () => {
    it("TC-P56-09: resetCampaignMissionConfig chỉ cho phép reset ải đã hoàn thành và bảo toàn kho đồ", () => {
      const prog: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        completedMissions: ["m1-1", "m1-2"],
        credits: 1000,
        inventory: [{ ...INITIAL_STARFRONT_PROGRESSION.inventory[0] }],
      }

      // Reset ải chưa hoàn thành -> lỗi
      const errRes = resetCampaignMissionConfig(prog, "m3-3")
      assert.equal(errRes.success, false)

      // Reset ải đã hoàn thành -> thành công
      const okRes = resetCampaignMissionConfig(prog, "m1-2")
      assert.equal(okRes.success, true)
      assert.equal(okRes.updated.credits, 1000, "Credits không bị mất khi reset")
      assert.equal(okRes.updated.completedMissions.includes("m1-2"), true, "Ải vẫn giữ nguyên trạng thái hoàn thành")
      assert.ok(okRes.updated.missionOverrides?.["m1-2"], "Phải có missionOverrides mới")
    })

    it("TC-P56-10: generateSideQuests sinh đúng danh mục nhiệm vụ phụ với phần thưởng dự kiến", () => {
      const sideQuests = generateSideQuests(5, 3)
      assert.equal(sideQuests.length, 3, "Phải sinh đúng 3 nhiệm vụ phụ")

      for (const sq of sideQuests) {
        assert.ok(sq.id.startsWith("sq-"), "ID phải có tiền tố sq-")
        assert.ok(sq.previewReward.credits > 0, "Phải có tiền thưởng")
        assert.ok(sq.previewReward.alloy > 0, "Phải có hợp kim thưởng")
        assert.ok(sq.previewReward.item, "Phải có trang bị thưởng")
      }
    })

    it("TC-P56-11: resetSideQuests làm mới chuỗi nhiệm vụ phụ và lưu vào tiến trình", () => {
      const prog: StarfrontProgression = {
        ...INITIAL_STARFRONT_PROGRESSION,
        level: 4,
        sideQuests: generateSideQuests(1, 3),
      }

      const res = resetSideQuests(prog)
      assert.equal(res.success, true)
      assert.equal(res.updated.sideQuests?.length, 3)
      assert.equal(res.updated.sideQuests?.[0].level >= 3, true, "Nhiệm vụ phụ mới phải scale theo cấp độ hiện tại (4)")
    })

    it("TC-P56-12: migrateProgressionToV3 bảo toàn currentShopItems, sideQuests và missionOverrides", () => {
      const mockSaved = {
        version: 2,
        level: 5,
        credits: 8000,
        currentShopItems: [{ buyPrice: 500, item: { id: "test", name: "Test" } }],
        sideQuests: [{ id: "sq-1", title: "Test SQ" }],
        missionOverrides: { "m1-1": { quality: "heroic" } },
      }

      const migrated = migrateProgressionToV3(mockSaved)
      assert.equal(migrated.version, 3)
      assert.equal(migrated.level, 5)
      assert.equal(migrated.credits, 8000)
      assert.equal(migrated.currentShopItems?.length, 1)
      assert.equal(migrated.sideQuests?.length, 1)
      assert.equal(migrated.missionOverrides?.["m1-1"]?.quality, "heroic")
    })
  })
})
