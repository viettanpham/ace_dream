import { STARFRONT_GEAR_DEFS, CAMPAIGN_SECTORS, ARMORY_SHOP_ITEMS } from "./lib/game/data"
import {
  calculateTotalGearStats,
  applyMissionClearReward,
  applyVictoryReward,
  buyShopItem,
  sellInventoryItem,
  INITIAL_STARFRONT_PROGRESSION,
  buildPlayerCombatUnit,
  getExpRequiredForLevel,
} from "./lib/game/progression"
import { createInitialCombatState, executePlayerAction, executeEnemyAIAction } from "./lib/game/engine"
import { loadStarfrontProgression, saveStarfrontProgression } from "./lib/game/storage"
import type { StarfrontProgression, CampaignMission } from "./lib/game/types"

console.log("=== BẮT ĐẦU KIỂM THỬ TÍNH NĂNG STARFRONT PHASE 3 ===")

let passedTests = 0
let failedTests = 0

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`[PASS] ${desc}`)
    passedTests++
  } else {
    console.error(`[FAIL] ${desc}`)
    failedTests++
  }
}

// 1. Kiểm thử 3 Lớp Cơ Giáp (Gear Classes)
assert(Boolean(STARFRONT_GEAR_DEFS.vanguard), "Lớp Vanguard Gear tồn tại")
assert(Boolean(STARFRONT_GEAR_DEFS.falcon), "Lớp Falcon Gear (Tốc độ) tồn tại")
assert(Boolean(STARFRONT_GEAR_DEFS.aegis), "Lớp Aegis Gear (Pháo đài) tồn tại")

const vStats = calculateTotalGearStats("vanguard", 1, [], { weapon: null, shield: null, engine: null })
const fStats = calculateTotalGearStats("falcon", 1, [], { weapon: null, shield: null, engine: null })
const aStats = calculateTotalGearStats("aegis", 1, [], { weapon: null, shield: null, engine: null })

assert(vStats.total.hp === 1250 && vStats.total.speed === 85, "Chỉ số Vanguard cấp 1 chuẩn: HP 1250, SPD 85")
assert(fStats.total.speed === 125 && fStats.total.attack === 165, "Chỉ số Falcon cấp 1 chuẩn: SPD 125 (ra đòn trước), ATK 165")
assert(aStats.total.hp === 1800 && aStats.total.defense === 120, "Chỉ số Aegis cấp 1 chuẩn: HP 1800 (trâu bò), DEF 120")

// Kiểm tra kỹ năng đặc trưng từng lớp Gear (mỗi lớp có 4 kỹ năng: 1 đòn cơ bản + 3 chiêu thức)
assert(STARFRONT_GEAR_DEFS.falcon.skills.length === 4, "Falcon có 4 kỹ năng chiến đấu (1 cơ bản + 3 chiêu thức tốc độ)")
assert(STARFRONT_GEAR_DEFS.aegis.skills.length === 4, "Aegis có 4 kỹ năng chiến đấu (1 cơ bản + 3 chiêu thức pháo đài)")

// 2. Kiểm thử Tốc độ và quyền đi trước trong Đấu trường
const playerFalcon = buildPlayerCombatUnit({
  ...INITIAL_STARFRONT_PROGRESSION,
  activeGearId: "falcon",
})
const combatFalconVsDrone = createInitialCombatState("scout-drone", playerFalcon)
assert(combatFalconVsDrone.status === "player-turn", "Falcon (SPD 125) đi trước Scout Drone (SPD 110)")

const playerVanguard = buildPlayerCombatUnit({
  ...INITIAL_STARFRONT_PROGRESSION,
  activeGearId: "vanguard",
})
const combatVanguardVsDrone = createInitialCombatState("scout-drone", playerVanguard)
assert(combatVanguardVsDrone.status === "enemy-turn", "Vanguard (SPD 85) đi sau Scout Drone (SPD 110)")

// 3. Kiểm thử Chiến Dịch (Campaign Sectors & Missions)
assert(CAMPAIGN_SECTORS.length === 3, "Có đúng 3 Sector chiến dịch")
const allMissions = CAMPAIGN_SECTORS.flatMap((s) => s.missions)
assert(allMissions.length === 9, "Tổng cộng có 9 ải nhiệm vụ chiến dịch")

// Kiểm tra chuỗi mở khóa
const m1_1 = allMissions.find((m) => m.id === "m1-1")!
const m1_2 = allMissions.find((m) => m.id === "m1-2")!
const m1_3 = allMissions.find((m) => m.id === "m1-3")!
assert(!m1_1.reqMissionId, "Ải 1-1 mở sẵn từ đầu")
assert(m1_2.reqMissionId === "m1-1", "Ải 1-2 yêu cầu hoàn thành ải 1-1")
assert(m1_3.reqMissionId === "m1-2", "Ải 1-3 yêu cầu hoàn thành ải 1-2")

// 4. Kiểm thử Trao thưởng Nhiệm vụ Chiến dịch
let testProg: StarfrontProgression = {
  ...INITIAL_STARFRONT_PROGRESSION,
  credits: 500,
  exp: 0,
  level: 1,
  completedMissions: [],
}

// Lần đầu vượt ải 1-1
const clear1 = applyMissionClearReward(testProg, m1_1)
assert(clear1.isFirstClear === true, "Vượt ải lần đầu được đánh dấu isFirstClear = true")
assert(clear1.reward.creditsGained === 300, "Nhận 300 Credits từ ải 1-1")
assert(clear1.reward.expGained === 100, "Nhận 100 EXP từ ải 1-1")
assert(clear1.updated.completedMissions.includes("m1-1"), "completedMissions có ghi nhận m1-1")

// Lặp lại ải 1-1
const clear1Repeat = applyMissionClearReward(clear1.updated, m1_1)
assert(clear1Repeat.isFirstClear === false, "Vượt lại lần 2 isFirstClear = false")
assert(clear1Repeat.reward.creditsGained === 160, "Nhận thưởng lặp lại 160 Credits")
assert(clear1Repeat.reward.expGained === 60, "Nhận thưởng lặp lại 60 EXP")

// 5. Kiểm thử Chợ Quân Sự (Armory Shop)
assert(ARMORY_SHOP_ITEMS.length >= 6, "Chợ có ít nhất 6 mặt hàng đa dạng")
const shopItem = ARMORY_SHOP_ITEMS[0]

// Mua hàng khi đủ tiền
testProg.credits = 1000
const buyRes = buyShopItem(testProg, shopItem)
assert(buyRes.success === true, "Mua vật phẩm thành công khi đủ Credits")
assert(buyRes.updated.credits === 1000 - shopItem.buyPrice, "Credits bị trừ chính xác")
assert(
  buyRes.updated.inventory.some((it) => it.name === shopItem.item.name),
  "Vật phẩm mới đã xuất hiện trong kho đồ",
)

// Không đủ tiền mua
testProg.credits = 10
const failBuy = buyShopItem(testProg, shopItem)
assert(failBuy.success === false, "Không cho phép mua khi không đủ Credits")

// Bán vật phẩm trong kho
const itemToSell = buyRes.updated.inventory[buyRes.updated.inventory.length - 1]
const sellRes = sellInventoryItem(buyRes.updated, itemToSell.id)
assert(sellRes.success === true, "Bán vật phẩm thành công")
assert(sellRes.updated.credits > buyRes.updated.credits, "Credits được cộng thêm khi bán đồ")
assert(
  !sellRes.updated.inventory.some((it) => it.id === itemToSell.id),
  "Vật phẩm đã được xóa khỏi kho sau khi bán",
)

// Không thể bán vật phẩm đang trang bị
const equippedItemId = sellRes.updated.equipped.weapon!
const failSellEquipped = sellInventoryItem(sellRes.updated, equippedItemId)
assert(failSellEquipped.success === false, "Chặn bán trang bị đang lắp trên cơ giáp")

// 6. Kiểm thử Lưu & Migration Save Data (v1 -> v2)
const mockV1Save = {
  version: 1,
  level: 3,
  exp: 150,
  credits: 1250,
  inventory: [
    {
      id: "wpn_pulse_carbine",
      name: "Súng Trường Xung Điện",
      slot: "weapon",
      rarity: "common",
      desc: "Mô tả",
      attackBonus: 20,
    },
  ],
  equipped: {
    weapon: "wpn_pulse_carbine",
    shield: null,
    engine: null,
  },
  battlesWon: 5,
  battlesLost: 1,
}

// Giả lập localStorage trong Node
const mockStorage: Record<string, string> = {
  STARFRONT_SAVE_DATA_V1: JSON.stringify(mockV1Save),
}

global.localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => {
    mockStorage[k] = v
  },
  removeItem: (k: string) => {
    delete mockStorage[k]
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k]
  },
  length: 0,
  key: () => null,
} as unknown as Storage

global.window = {} as unknown as Window & typeof globalThis

const migrated = loadStarfrontProgression()
assert(migrated.version === 2, "Dữ liệu được nâng cấp thành phiên bản Schema v2")
assert(migrated.level === 3, "Giữ nguyên Cấp độ 3 từ v1")
assert(migrated.credits === 1250, "Giữ nguyên 1250 Credits từ v1")
assert(migrated.activeGearId === "vanguard", "Khởi tạo activeGearId = vanguard")
assert(Array.isArray(migrated.completedMissions), "Trường completedMissions được khởi tạo an toàn")
assert(Boolean(mockStorage["STARFRONT_SAVE_DATA_V2"]), "Dữ liệu v2 đã được tự động lưu vào storage")

console.log(`\n=== TỔNG KẾT KIỂM THỬ: ${passedTests} ĐẠT / ${failedTests} THẤT BẠI ===`)
if (failedTests > 0) {
  process.exit(1)
} else {
  console.log("TẤT CẢ CÁC BÀI KIỂM THỬ PHASE 3 ĐỀU THÀNH CÔNG VƯỢT MỨC!")
}
