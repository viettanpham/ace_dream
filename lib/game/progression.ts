import { STARFRONT_GEAR_DEFS, VANGUARD_INITIAL_UNIT, VANGUARD_SKILLS } from "./data"
import type {
  ArmoryShopItem,
  BattleRewardResult,
  CampaignMission,
  CombatUnit,
  EnemyEncounterType,
  StarfrontGearId,
  StarfrontItem,
  StarfrontItemSlot,
  StarfrontProgression,
} from "./types"

/* ==========================================================================
   VẬT PHẨM & TRANG BỊ MẪU CHO STARFRONT (EXPANDABLE CATALOG)
   ========================================================================== */

export const SAMPLE_STARFRONT_ITEMS: StarfrontItem[] = [
  // VŨ KHÍ (WEAPONS)
  {
    id: "wpn_pulse_carbine",
    name: "Súng Xung Điện Pulse Carbine",
    slot: "weapon",
    rarity: "common",
    desc: "Vũ khí tiêu chuẩn của Vanguard. Tăng nhẹ hỏa lực xung động.",
    attackBonus: 15,
  },
  {
    id: "wpn_plasma_cutter",
    name: "Pháo Cắt Plasma Cao Áp",
    slot: "weapon",
    rarity: "rare",
    desc: "Chùm plasma nhiệt độ cao nung chảy kim loại. Tăng mạnh sức tấn công và tốc độ ra đòn.",
    attackBonus: 32,
    speedBonus: 3,
  },
  {
    id: "wpn_hyper_railgun",
    name: "Đại Pháo Ray Điện Từ Hyper",
    slot: "weapon",
    rarity: "epic",
    desc: "Pháo điện từ gia tốc đạn hạt nhân mini. Công phá cực đại điểm yếu mục tiêu.",
    attackBonus: 58,
    defenseBonus: -5,
    speedBonus: 6,
  },
  {
    id: "wpn_stellar_annihilator",
    name: "Súng Hủy Diệt Tinh Vân Prime",
    slot: "weapon",
    rarity: "legendary",
    desc: "Vũ khí chế tác từ lõi sao băng. Sức mạnh hủy diệt không thể ngăn cản.",
    attackBonus: 90,
    speedBonus: 10,
    spBonus: 20,
  },

  // KHIÊN PHÒNG HỘ (SHIELDS)
  {
    id: "shd_composite_plate",
    name: "Giáp Hợp Kim Composite",
    slot: "shield",
    rarity: "common",
    desc: "Lớp vỏ hợp kim gia cố chịu lực va đập cơ bản.",
    defenseBonus: 12,
    hpBonus: 120,
  },
  {
    id: "shd_nano_barrier",
    name: "Khiên Nano Tự Phục Hồi",
    slot: "shield",
    rarity: "rare",
    desc: "Các hạt nano tự động hàn gắn vi vết nứt trên vỏ giáp khi bị bắn trúng.",
    defenseBonus: 25,
    hpBonus: 280,
  },
  {
    id: "shd_aegis_forcefield",
    name: "Trường Lực Phòng Hộ Aegis",
    slot: "shield",
    rarity: "epic",
    desc: "Lưới chắn từ trường ion hóa triệt tiêu phần lớn động năng đạn pháo.",
    defenseBonus: 45,
    hpBonus: 500,
    spBonus: 15,
  },

  // ĐỘNG CƠ TĂNG TỐC (ENGINES)
  {
    id: "eng_ion_booster",
    name: "Động Cơ Đẩy Ion Tiêu Chuẩn",
    slot: "engine",
    rarity: "common",
    desc: "Tăng khả năng cơ động và tốc độ lướt trong không gian.",
    speedBonus: 8,
  },
  {
    id: "eng_warp_thruster",
    name: "Động Cơ Gia Tốc Không-Thời Gian",
    slot: "engine",
    rarity: "rare",
    desc: "Tối ưu hóa phản lực giúp Vanguard luôn chiếm thế chủ động trong lượt đấu.",
    speedBonus: 16,
    attackBonus: 8,
  },
  {
    id: "eng_antimatter_drive",
    name: "Động Cơ Phản Vật Chất Dark Nova",
    slot: "engine",
    rarity: "epic",
    desc: "Cung cấp động năng dồi dào, nâng tầm tốc độ và lượng năng lượng dự trữ.",
    speedBonus: 26,
    spBonus: 25,
    hpBonus: 150,
  },
]

/* ==========================================================================
   CÔNG THỨC TIẾN TRÌNH & CẤP ĐỘ (EXP FORMULAS & STAT SCALING)
   ========================================================================== */

/** Lượng EXP cần thiết để thăng cấp từ level hiện tại lên level tiếp theo */
export function getExpRequiredForLevel(level: number): number {
  return level * 100
}

/** Chỉ số cơ bản của Gear theo cấp độ (Level growth) */
export function getBaseStatsForGearAndLevel(gearId: StarfrontGearId = "vanguard", level: number) {
  const gearDef = STARFRONT_GEAR_DEFS[gearId] || STARFRONT_GEAR_DEFS.vanguard
  const growthFactor = Math.max(0, level - 1)

  return {
    hp: gearDef.baseStats.hp + growthFactor * gearDef.growth.hp,
    sp: gearDef.baseStats.sp + growthFactor * gearDef.growth.sp,
    attack: gearDef.baseStats.attack + growthFactor * gearDef.growth.attack,
    defense: gearDef.baseStats.defense + growthFactor * gearDef.growth.defense,
    speed: gearDef.baseStats.speed + growthFactor * gearDef.growth.speed,
  }
}

/** Tương thích ngược: Chỉ số cơ bản của Vanguard theo cấp độ */
export function getBaseStatsForLevel(level: number) {
  return getBaseStatsForGearAndLevel("vanguard", level)
}

/** Tính tổng chỉ số hoàn chỉnh bao gồm Gear đã chọn + Cấp độ + Tất cả trang bị đang lắp */
export function calculateTotalGearStats(
  gearId: StarfrontGearId = "vanguard",
  level: number,
  inventory: StarfrontItem[],
  equipped: Record<StarfrontItemSlot, string | null>,
) {
  const base = getBaseStatsForGearAndLevel(gearId, level)
  const bonuses = {
    hp: 0,
    sp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
  }

  const equippedItems: StarfrontItem[] = []

  for (const slot of ["weapon", "shield", "engine"] as StarfrontItemSlot[]) {
    const itemId = equipped[slot]
    if (itemId) {
      const item = inventory.find((it) => it.id === itemId)
      if (item) {
        equippedItems.push(item)
        bonuses.hp += item.hpBonus || 0
        bonuses.sp += item.spBonus || 0
        bonuses.attack += item.attackBonus || 0
        bonuses.defense += item.defenseBonus || 0
        bonuses.speed += item.speedBonus || 0
      }
    }
  }

  return {
    base,
    bonuses,
    total: {
      hp: Math.max(100, base.hp + bonuses.hp),
      maxHp: Math.max(100, base.hp + bonuses.hp),
      sp: Math.max(20, base.sp + bonuses.sp),
      maxSp: Math.max(20, base.sp + bonuses.sp),
      attack: Math.max(10, base.attack + bonuses.attack),
      defense: Math.max(0, base.defense + bonuses.defense),
      speed: Math.max(10, base.speed + bonuses.speed),
    },
    equippedItems,
  }
}

/** Tương thích ngược */
export function calculateTotalVanguardStats(
  level: number,
  inventory: StarfrontItem[],
  equipped: Record<StarfrontItemSlot, string | null>,
) {
  return calculateTotalGearStats("vanguard", level, inventory, equipped)
}

/** Xây dựng CombatUnit sẵn sàng đưa vào đấu trường từ tiến trình hiện tại */
export function buildPlayerCombatUnit(progression: StarfrontProgression): CombatUnit {
  const activeGear = progression.activeGearId || "vanguard"
  const gearDef = STARFRONT_GEAR_DEFS[activeGear] || STARFRONT_GEAR_DEFS.vanguard

  const { total } = calculateTotalGearStats(
    activeGear,
    progression.level,
    progression.inventory,
    progression.equipped,
  )

  return {
    id: `player-${activeGear}`,
    name: `${gearDef.name} (Cấp ${progression.level})`,
    title: gearDef.role,
    gearType: activeGear,
    isPlayer: true,
    hp: total.hp,
    maxHp: total.maxHp,
    sp: total.sp,
    maxSp: total.maxSp,
    attack: total.attack,
    defense: total.defense,
    speed: total.speed,
    skills: gearDef.skills,
    statusEffects: [],
    skillCooldowns: {},
    avatar: gearDef.avatar,
  }
}

/** Tương thích ngược: Xây dựng Vanguard CombatUnit */
export function buildVanguardCombatUnit(progression: StarfrontProgression): CombatUnit {
  return buildPlayerCombatUnit(progression)
}

/* ==========================================================================
   CẤU HÌNH PHẦN THƯỞNG CHIẾN THẮNG THEO MỤC TIÊU (REWARDS)
   ========================================================================== */

export const BATTLE_REWARDS: Record<
  EnemyEncounterType,
  { exp: number; credits: number; dropChance: number; dropPool: string[] }
> = {
  "scout-drone": {
    exp: 60,
    credits: 150,
    dropChance: 0.25,
    dropPool: ["wpn_pulse_carbine", "eng_ion_booster"],
  },
  "raider-mech": {
    exp: 130,
    credits: 350,
    dropChance: 0.4,
    dropPool: ["wpn_plasma_cutter", "shd_nano_barrier", "eng_warp_thruster"],
  },
  "siege-walker": {
    exp: 320,
    credits: 850,
    dropChance: 0.7,
    dropPool: ["wpn_hyper_railgun", "shd_aegis_forcefield", "eng_antimatter_drive"],
  },
}

/** Nhận phần thưởng chiến thắng và xử lý thăng cấp (An toàn, chỉ chạy 1 lần) */
export function applyVictoryReward(
  current: StarfrontProgression,
  encounterId: EnemyEncounterType,
): { updated: StarfrontProgression; reward: BattleRewardResult; dropItem?: StarfrontItem } {
  const config = BATTLE_REWARDS[encounterId] || BATTLE_REWARDS["scout-drone"]
  const expGained = config.exp
  const creditsGained = config.credits

  let newLevel = current.level
  let newExp = current.exp + expGained
  let leveledUp = false

  // Kiểm tra chuỗi thăng cấp (có thể vượt qua nhiều cấp nếu EXP lớn)
  while (true) {
    const required = getExpRequiredForLevel(newLevel)
    if (newExp >= required) {
      newExp -= required
      newLevel += 1
      leveledUp = true
    } else {
      break
    }
  }

  // Tỷ lệ rơi vật phẩm (Drop)
  let dropItem: StarfrontItem | undefined
  const roll = Math.random()
  if (roll < config.dropChance && config.dropPool.length > 0) {
    const randomItemId = config.dropPool[Math.floor(Math.random() * config.dropPool.length)]
    const template = SAMPLE_STARFRONT_ITEMS.find((it) => it.id === randomItemId)
    if (template && !current.inventory.some((i) => i.id === template.id)) {
      dropItem = template
    }
  }

  const updatedInventory = dropItem ? [...current.inventory, dropItem] : [...current.inventory]

  const updated: StarfrontProgression = {
    ...current,
    level: newLevel,
    exp: newExp,
    credits: current.credits + creditsGained,
    inventory: updatedInventory,
    battlesWon: current.battlesWon + 1,
  }

  const reward: BattleRewardResult = {
    expGained,
    creditsGained,
    leveledUp,
    oldLevel: current.level,
    newLevel,
    newExp,
    expRequired: getExpRequiredForLevel(newLevel),
  }

  return { updated, reward, dropItem }
}

/** Ghi nhận thất bại (Không cộng EXP hay Credits) */
export function applyDefeatRecord(current: StarfrontProgression): StarfrontProgression {
  return {
    ...current,
    battlesLost: current.battlesLost + 1,
  }
}

/* ==========================================================================
   PHASE 3 — CAMPAIGN MISSION REWARDS & ARMORY SHOP BUY/SELL LOGIC
   ========================================================================== */

/** Nhận thưởng hoàn thành Ải Chiến Dịch */
export function applyMissionClearReward(
  current: StarfrontProgression,
  mission: CampaignMission,
): { updated: StarfrontProgression; reward: BattleRewardResult; dropItem?: StarfrontItem; isFirstClear: boolean } {
  const isFirstClear = !current.completedMissions.includes(mission.id)
  const expGained = isFirstClear ? mission.firstClearReward.exp : mission.repeatReward.exp
  const creditsGained = isFirstClear ? mission.firstClearReward.credits : mission.repeatReward.credits

  let newLevel = current.level
  let newExp = current.exp + expGained
  let leveledUp = false

  while (true) {
    const required = getExpRequiredForLevel(newLevel)
    if (newExp >= required) {
      newExp -= required
      newLevel += 1
      leveledUp = true
    } else {
      break
    }
  }

  let dropItem: StarfrontItem | undefined
  if (isFirstClear && mission.firstClearReward.itemId) {
    const template = SAMPLE_STARFRONT_ITEMS.find((it) => it.id === mission.firstClearReward.itemId)
    if (template && !current.inventory.some((i) => i.id === template.id)) {
      dropItem = template
    }
  }

  const updatedInventory = dropItem ? [...current.inventory, dropItem] : [...current.inventory]
  const updatedCompletedMissions = isFirstClear
    ? [...current.completedMissions, mission.id]
    : [...current.completedMissions]

  const updated: StarfrontProgression = {
    ...current,
    level: newLevel,
    exp: newExp,
    credits: current.credits + creditsGained,
    inventory: updatedInventory,
    completedMissions: updatedCompletedMissions,
    battlesWon: current.battlesWon + 1,
  }

  const reward: BattleRewardResult = {
    expGained,
    creditsGained,
    leveledUp,
    oldLevel: current.level,
    newLevel,
    newExp,
    expRequired: getExpRequiredForLevel(newLevel),
  }

  return { updated, reward, dropItem, isFirstClear }
}

/** Mua vật phẩm từ Chợ Quân Sự */
export function buyShopItem(
  current: StarfrontProgression,
  shopItem: ArmoryShopItem,
): { success: boolean; updated: StarfrontProgression; message: string } {
  if (current.credits < shopItem.buyPrice) {
    return {
      success: false,
      updated: current,
      message: `Không đủ Credits! Cần ${shopItem.buyPrice.toLocaleString("vi-VN")} Credits, bạn chỉ có ${current.credits.toLocaleString("vi-VN")}.`,
    }
  }

  // Tạo ID duy nhất cho trang bị mới mua
  const boughtItem: StarfrontItem = {
    ...shopItem.item,
    id: `${shopItem.item.id}_${Date.now()}`,
  }

  const updated: StarfrontProgression = {
    ...current,
    credits: current.credits - shopItem.buyPrice,
    inventory: [...current.inventory, boughtItem],
  }

  return {
    success: true,
    updated,
    message: `Đã mua thành công ${shopItem.item.name}! Đã trừ ${shopItem.buyPrice.toLocaleString("vi-VN")} Credits.`,
  }
}

/** Bán vật phẩm trong kho để thu hồi Credits */
export function sellInventoryItem(
  current: StarfrontProgression,
  itemId: string,
): { success: boolean; updated: StarfrontProgression; message: string } {
  // Kiểm tra vật phẩm có đang được trang bị không
  const isEquipped = Object.values(current.equipped).includes(itemId)
  if (isEquipped) {
    return {
      success: false,
      updated: current,
      message: "Không thể bán trang bị đang được lắp trên cơ giáp! Hãy tháo trang bị trước.",
    }
  }

  const itemIndex = current.inventory.findIndex((it) => it.id === itemId)
  if (itemIndex === -1) {
    return {
      success: false,
      updated: current,
      message: "Không tìm thấy vật phẩm cần bán trong kho đồ.",
    }
  }

  const item = current.inventory[itemIndex]
  // Định giá bán lại: nếu có price thì lấy 50% price, nếu không thì tính theo rarity
  const basePrice = item.price || (
    item.rarity === "legendary" ? 2500 :
    item.rarity === "epic" ? 1200 :
    item.rarity === "rare" ? 500 : 200
  )
  const sellValue = Math.max(50, Math.round(basePrice * 0.5))

  const newInventory = current.inventory.filter((_, idx) => idx !== itemIndex)
  const updated: StarfrontProgression = {
    ...current,
    credits: current.credits + sellValue,
    inventory: newInventory,
  }

  return {
    success: true,
    updated,
    message: `Đã bán ${item.name} và thu hồi +${sellValue.toLocaleString("vi-VN")} Credits!`,
  }
}

/* ==========================================================================
   TIẾN TRÌNH KHỞI TẠO MẶC ĐỊNH CHO NGƯỜI CHƠI MỚI (INITIAL PROGRESSION)
   ========================================================================== */

export const INITIAL_STARFRONT_PROGRESSION: StarfrontProgression = {
  version: 2,
  level: 1,
  exp: 0,
  credits: 500,
  activeGearId: "vanguard",
  unlockedGears: ["vanguard", "falcon", "aegis"],
  completedMissions: [],
  // Khởi đầu có sẵn các món đa dạng trong kho để kiểm thử trang bị ngay
  inventory: [
    SAMPLE_STARFRONT_ITEMS[0], // Súng Xung Điện Pulse Carbine (+15 ATK)
    SAMPLE_STARFRONT_ITEMS[1], // Pháo Cắt Plasma Cao Áp (+32 ATK, +3 SPD)
    SAMPLE_STARFRONT_ITEMS[2], // Đại Pháo Ray Điện Từ Hyper (+58 ATK, -5 DEF, +6 SPD)
    SAMPLE_STARFRONT_ITEMS[4], // Giáp Hợp Kim Composite (+12 DEF, +120 HP)
    SAMPLE_STARFRONT_ITEMS[5], // Khiên Nano Tự Phục Hồi (+25 DEF, +280 HP)
    SAMPLE_STARFRONT_ITEMS[7], // Động Cơ Đẩy Ion Tiêu Chuẩn (+8 SPD)
    SAMPLE_STARFRONT_ITEMS[8], // Động Cơ Gia Tốc Không-Thời Gian (+16 SPD, +8 ATK)
  ],
  equipped: {
    weapon: "wpn_pulse_carbine",
    shield: "shd_composite_plate",
    engine: "eng_ion_booster",
  },
  battlesWon: 0,
  battlesLost: 0,
}
