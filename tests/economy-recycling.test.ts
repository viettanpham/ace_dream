import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  calculateSalvageEstimate,
  salvageInventoryItem,
  isShopItemUnlocked,
  refreshArmoryShop,
  INITIAL_STARFRONT_PROGRESSION,
  applyVictoryReward,
  applyMissionClearReward,
} from "../lib/game/progression"
import { ARMORY_SHOP_ITEMS, CAMPAIGN_SECTORS } from "../lib/game/data"
import type { StarfrontItem, StarfrontProgression } from "../lib/game/types"

function getFreshProgression(): StarfrontProgression {
  return JSON.parse(JSON.stringify(INITIAL_STARFRONT_PROGRESSION))
}

describe("Milestone 5.3 — Armory Economy & Recycling", () => {
  describe("1. Công Thức Thu Hồi Tài Nguyên (calculateSalvageEstimate)", () => {
    it("Độ hiếm Rarity quyết định Base Alloy chính xác (Common: 2, Rare: 5, Epic: 12, Legendary: 25)", () => {
      const commonItem: StarfrontItem = {
        id: "test_c",
        name: "Súng Thường",
        slot: "weapon",
        rarity: "common",
        desc: "",
      }
      const rareItem: StarfrontItem = {
        id: "test_r",
        name: "Súng Hiếm",
        slot: "weapon",
        rarity: "rare",
        desc: "",
      }
      const epicItem: StarfrontItem = {
        id: "test_e",
        name: "Súng Sử Thi",
        slot: "weapon",
        rarity: "epic",
        desc: "",
      }
      const legendaryItem: StarfrontItem = {
        id: "test_l",
        name: "Súng Huyền Thoại",
        slot: "weapon",
        rarity: "legendary",
        desc: "",
      }

      assert.equal(calculateSalvageEstimate(commonItem).baseAlloy, 2)
      assert.equal(calculateSalvageEstimate(rareItem).baseAlloy, 5)
      assert.equal(calculateSalvageEstimate(epicItem).baseAlloy, 12)
      assert.equal(calculateSalvageEstimate(legendaryItem).baseAlloy, 25)

      // Cấp 0 hoàn trả 0 Alloy thưởng
      assert.equal(calculateSalvageEstimate(commonItem).enhancementAlloyRefund, 0)
      assert.equal(calculateSalvageEstimate(commonItem).alloyGained, 2)
    })

    it("Trang bị cường hóa (+1 đến +10) hoàn trả 60% Alloy đã đầu tư (tối thiểu +2 Alloy/cấp)", () => {
      // Cấp +3: Đã dùng Cấp 1 (2), Cấp 2 (3), Cấp 3 (5) = 10 Alloy
      // 60% * 10 = 6 Alloy hoàn trả
      const epicPlus3: StarfrontItem = {
        id: "test_e3",
        name: "Đại Pháo +3",
        slot: "weapon",
        rarity: "epic",
        desc: "",
        enhancementLevel: 3,
      }
      const est3 = calculateSalvageEstimate(epicPlus3)
      assert.equal(est3.baseAlloy, 12)
      assert.equal(est3.enhancementAlloyRefund, 6, "Cấp +3 phải hoàn trả 6 Alloy đã đầu tư")
      assert.equal(est3.alloyGained, 18, "Tổng Alloy thu hồi phải là 12 + 6 = 18")

      // Cấp +5: Đã dùng Cấp 1 (2) + Cấp 2 (3) + Cấp 3 (5) + Cấp 4 (8) + Cấp 5 (12) = 30 Alloy
      // 60% * 30 = 18 Alloy hoàn trả
      const epicPlus5: StarfrontItem = {
        id: "test_e5",
        name: "Đại Pháo +5",
        slot: "weapon",
        rarity: "epic",
        desc: "",
        enhancementLevel: 5,
      }
      const est5 = calculateSalvageEstimate(epicPlus5)
      assert.equal(est5.enhancementAlloyRefund, 18, "Cấp +5 phải hoàn trả 18 Alloy")
      assert.equal(est5.alloyGained, 30, "Tổng Alloy thu hồi phải là 12 + 18 = 30")
    })

    it("Hoàn trả Credits bao gồm 35% Base Credits và 30% Credits đã đầu tư qua cường hóa", () => {
      const rarePlus2: StarfrontItem = {
        id: "test_r2",
        name: "Giáp Nano +2",
        slot: "shield",
        rarity: "rare",
        price: 1000,
        desc: "",
        enhancementLevel: 2,
      }
      const est = calculateSalvageEstimate(rarePlus2)
      // Base Credits = 35% của 1000 = 350
      assert.equal(est.baseCredits, 350)
      // Đầu tư: Cấp 1 (150 Cr) + Cấp 2 (250 Cr) = 400 Cr. 30% * 400 = 120 Cr
      assert.equal(est.enhancementCreditsRefund, 120)
      assert.equal(est.creditsGained, 470)
    })
  })

  describe("2. Logic Tái Chế An Toàn (salvageInventoryItem)", () => {
    it("Từ chối rã trang bị đang được lắp trên cơ giáp (Equipped Protection)", () => {
      const prog = getFreshProgression()
      const equippedWeaponId = prog.equipped.weapon!
      assert.ok(equippedWeaponId, "Phải có vũ khí đang lắp")

      const res = salvageInventoryItem(prog, equippedWeaponId)
      assert.equal(res.success, false, "Không được phép rã đồ đang trang bị")
      assert.ok(res.message.includes("Không thể tái chế trang bị đang lắp"))
      assert.equal(prog.inventory.some((i) => i.id === equippedWeaponId), true, "Vật phẩm vẫn phải còn trong kho")
    })

    it("Rã thành công vật phẩm rảnh rỗi trong kho và cộng đúng tài nguyên", () => {
      const prog = getFreshProgression()
      const initialAlloy = prog.alloy ?? 25
      const initialCredits = prog.credits

      // Tìm một món không trang bị
      const unequippedItem = prog.inventory.find(
        (it) => !Object.values(prog.equipped).includes(it.id),
      )!
      assert.ok(unequippedItem, "Phải có ít nhất 1 món không trang bị")

      const est = calculateSalvageEstimate(unequippedItem)
      const res = salvageInventoryItem(prog, unequippedItem.id)

      assert.equal(res.success, true, "Phải rã thành công")
      assert.equal(res.updated.alloy, initialAlloy + est.alloyGained, "Alloy phải tăng đúng ước tính")
      assert.equal(res.updated.credits, initialCredits + est.creditsGained, "Credits phải tăng đúng ước tính")
      assert.equal(
        res.updated.inventory.some((i) => i.id === unequippedItem.id),
        false,
        "Vật phẩm đã rã phải biến mất khỏi kho đồ",
      )
    })

    it("Chống nhận tài nguyên lặp lại: Không thể rã cùng 1 món 2 lần (Double-click / Duplicate protection)", () => {
      const prog = getFreshProgression()
      const unequippedItem = prog.inventory.find(
        (it) => !Object.values(prog.equipped).includes(it.id),
      )!

      // Lần rã 1: thành công
      const res1 = salvageInventoryItem(prog, unequippedItem.id)
      assert.equal(res1.success, true)

      // Lần rã 2 (trên cùng trạng thái đã rã): thất bại, không cộng thêm tài nguyên
      const res2 = salvageInventoryItem(res1.updated, unequippedItem.id)
      assert.equal(res2.success, false, "Không được phép rã lần 2")
      assert.ok(res2.message.includes("Không tìm thấy vật phẩm"))
      assert.equal(res2.updated.alloy, res1.updated.alloy, "Alloy không được tăng thêm lần 2")
      assert.equal(res2.updated.credits, res1.updated.credits, "Credits không được tăng thêm lần 2")
    })

    it("Xử lý an toàn khi không tìm thấy ID vật phẩm", () => {
      const prog = getFreshProgression()
      const res = salvageInventoryItem(prog, "non_existent_item_id_999")
      assert.equal(res.success, false)
      assert.equal(res.updated.inventory.length, prog.inventory.length)
    })
  })

  describe("3. Phân Tầng Chợ Quân Sự Theo Sector (isShopItemUnlocked)", () => {
    it("Vật phẩm tầng Cơ Bản luôn được mở khóa ngay từ đầu", () => {
      const prog = getFreshProgression()
      const basicItem = ARMORY_SHOP_ITEMS.find((it) => !it.requiredSectorId)!
      assert.ok(basicItem, "Phải có vật phẩm cơ bản")

      const check = isShopItemUnlocked(basicItem, prog)
      assert.equal(check.unlocked, true)
    })

    it("Vật phẩm Sector 1 bị khóa khi chưa hoàn thành Ải 1-3, mở khóa khi hoàn thành Ải 1-3", () => {
      const prog = getFreshProgression()
      const sector1Item = ARMORY_SHOP_ITEMS.find((it) => it.requiredSectorId === "sector-1")!
      assert.ok(sector1Item, "Phải có vật phẩm Sector 1")

      // Trước khi hoàn thành
      const lockedCheck = isShopItemUnlocked(sector1Item, prog)
      assert.equal(lockedCheck.unlocked, false)
      assert.ok(lockedCheck.reason?.includes("Sector 1"))

      // Sau khi hoàn thành ải mis-1-3
      prog.completedMissions.push("mis-1-3")
      const unlockedCheck = isShopItemUnlocked(sector1Item, prog)
      assert.equal(unlockedCheck.unlocked, true)
    })

    it("Vật phẩm Sector 3 Legendary yêu cầu hoàn thành Ải 3-3", () => {
      const prog = getFreshProgression()
      const legendaryItem = ARMORY_SHOP_ITEMS.find((it) => it.requiredSectorId === "sector-3")!
      assert.ok(legendaryItem, "Phải có vật phẩm Legendary")

      assert.equal(isShopItemUnlocked(legendaryItem, prog).unlocked, false)

      prog.completedMissions.push("mis-3-3")
      assert.equal(isShopItemUnlocked(legendaryItem, prog).unlocked, true)
    })
  })

  describe("4. Cơ Chế Làm Mới Gian Hàng (refreshArmoryShop)", () => {
    it("Ưu tiên sử dụng lượt miễn phí tích lũy từ chiến thắng trước khi trừ Credits", () => {
      const prog = getFreshProgression()
      prog.freeShopRefreshes = 2
      const initialCredits = prog.credits

      const res = refreshArmoryShop(prog)
      assert.equal(res.success, true)
      assert.equal(res.updated.freeShopRefreshes, 1, "Phải trừ 1 lượt miễn phí")
      assert.equal(res.updated.credits, initialCredits, "Không được trừ Credits khi có lượt miễn phí")
      assert.ok(res.message.includes("miễn phí"))
    })

    it("Khi hết lượt miễn phí, khấu trừ đúng 100 Credits", () => {
      const prog = getFreshProgression()
      prog.freeShopRefreshes = 0
      prog.credits = 500

      const res = refreshArmoryShop(prog)
      assert.equal(res.success, true)
      assert.equal(res.updated.credits, 400, "Phải trừ đúng 100 Credits")
      assert.ok(res.message.includes("100 Credits"))
    })

    it("Từ chối làm mới nếu không có lượt miễn phí và không đủ 100 Credits", () => {
      const prog = getFreshProgression()
      prog.freeShopRefreshes = 0
      prog.credits = 50

      const res = refreshArmoryShop(prog)
      assert.equal(res.success, false)
      assert.ok(res.message.includes("Không đủ Credits"))
      assert.equal(res.updated.credits, 50, "Credits không được đổi")
    })

    it("Chiến thắng trong Arena hoặc Campaign tặng thêm +1 lượt làm mới miễn phí", () => {
      const prog = getFreshProgression()
      prog.freeShopRefreshes = 1

      const victoryRes = applyVictoryReward(prog, "scout-drone")
      assert.equal(victoryRes.updated.freeShopRefreshes, 2, "Chiến thắng Arena phải cộng +1 lượt refresh")

      const mission = CAMPAIGN_SECTORS[0].missions[0]
      const missionRes = applyMissionClearReward(prog, mission)
      assert.equal(missionRes.updated.freeShopRefreshes, 2, "Chiến thắng Campaign phải cộng +1 lượt refresh")
    })
  })
})
