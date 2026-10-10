import {
  STARFRONT_GEAR_DEFS,
  STARFRONT_PILOT_MAP,
  STARFRONT_PILOTS,
  VANGUARD_INITIAL_UNIT,
  VANGUARD_SKILLS,
} from "./data"
import { buildQuestRewardPreview, findCampaignQuest } from "./scaling"
import type {
  ActivePairingState,
  ArmoryShopItem,
  BattleRewardResult,
  CampaignMission,
  CombatUnit,
  EnemyEncounterType,
  EnemyVariantId,
  PilotAttributeKey,
  PilotProgressionData,
  QuestQuality,
  QuestRewardPreview,
  SalvageEstimate,
  SalvageExecutionResult,
  StarfrontGearId,
  StarfrontItem,
  StarfrontItemRarity,
  StarfrontItemSlot,
  StarfrontProgression,
  StarfrontQuest,
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
  {
    id: "shd_stellar_bulwark",
    name: "Pháo Đài Bất Hoại Event Horizon",
    slot: "shield",
    rarity: "legendary",
    desc: "Khiên chắn trọng lực bẻ cong mọi loại đạn pháo và hồi phục cực hạn HP.",
    defenseBonus: 75,
    hpBonus: 950,
    spBonus: 35,
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
  {
    id: "eng_chronos_drive",
    name: "Động Cơ Dịch Chuyển Lượng Tử Chronos",
    slot: "engine",
    rarity: "legendary",
    desc: "Bẻ cong không-thời gian mang lại tốc độ tuyệt đỉnh và ưu thế ra đòn áp đảo.",
    speedBonus: 45,
    attackBonus: 20,
    spBonus: 40,
  },
]

/* ==========================================================================
   MILESTONE 5.1 — HỆ THỐNG CƯỜNG HÓA TRANG BỊ (+1 ĐẾN +10)
   ========================================================================== */

export type EnhancementLevelConfig = {
  level: number
  successRate: number // 1.0 (100%), 0.8 (80%), ...
  creditsCost: number
  alloyCost: number
  multiplier: number
}

/** Bảng quy chuẩn tỉ lệ thành công, chi phí và hệ số chỉ số theo cấp cường hóa */
export const ENHANCEMENT_TABLE: Record<number, EnhancementLevelConfig> = {
  1: { level: 1, successRate: 1.0, creditsCost: 150, alloyCost: 2, multiplier: 1.12 },
  2: { level: 2, successRate: 1.0, creditsCost: 250, alloyCost: 3, multiplier: 1.24 },
  3: { level: 3, successRate: 1.0, creditsCost: 400, alloyCost: 5, multiplier: 1.36 },
  4: { level: 4, successRate: 1.0, creditsCost: 600, alloyCost: 8, multiplier: 1.48 },
  5: { level: 5, successRate: 0.80, creditsCost: 900, alloyCost: 12, multiplier: 1.62 },
  6: { level: 6, successRate: 0.70, creditsCost: 1300, alloyCost: 16, multiplier: 1.76 },
  7: { level: 7, successRate: 0.60, creditsCost: 1800, alloyCost: 22, multiplier: 1.90 },
  8: { level: 8, successRate: 0.45, creditsCost: 2500, alloyCost: 30, multiplier: 2.10 },
  9: { level: 9, successRate: 0.35, creditsCost: 3500, alloyCost: 40, multiplier: 2.30 },
  10: { level: 10, successRate: 0.25, creditsCost: 5000, alloyCost: 55, multiplier: 2.55 },
}

/** Lấy tên hiển thị kèm nhãn cấp cường hóa (ví dụ: [+5] Pháo Cắt Plasma Cao Áp) */
export function getItemDisplayName(item: StarfrontItem): string {
  const level = Math.max(0, Math.min(10, item.enhancementLevel || 0))
  if (level > 0) {
    return `[+${level}] ${item.name}`
  }
  return item.name
}

/** Tính toán chỉ số cộng thêm sau khi cường hóa cấp +0 đến +10 */
export function getEnhancedItemStats(item: StarfrontItem): {
  attackBonus: number
  defenseBonus: number
  speedBonus: number
  hpBonus: number
  spBonus: number
} {
  const level = Math.max(0, Math.min(10, item.enhancementLevel || 0))
  if (level === 0) {
    return {
      attackBonus: item.attackBonus || 0,
      defenseBonus: item.defenseBonus || 0,
      speedBonus: item.speedBonus || 0,
      hpBonus: item.hpBonus || 0,
      spBonus: item.spBonus || 0,
    }
  }

  const config = ENHANCEMENT_TABLE[level]
  const mult = config ? config.multiplier : 1 + level * 0.12

  const scaleStat = (base?: number): number => {
    if (!base) return 0
    if (base > 0) {
      // Đảm bảo mỗi cấp tăng ít nhất +level đơn vị
      return Math.max(base + level, Math.round(base * mult))
    }
    // Không tăng nặng chỉ số âm (nếu có penalty)
    return base
  }

  return {
    attackBonus: scaleStat(item.attackBonus),
    defenseBonus: scaleStat(item.defenseBonus),
    speedBonus: scaleStat(item.speedBonus),
    hpBonus: scaleStat(item.hpBonus),
    spBonus: scaleStat(item.spBonus),
  }
}

export type EnhancementResult = {
  success: boolean
  item: StarfrontItem
  oldLevel: number
  newLevel: number
  successRate: number
  cost: { credits: number; alloy: number }
  message: string
}

/** Thực hiện cường hóa trang bị với cơ chế an toàn (Không bao giờ phá hủy trang bị) */
export function enhanceItem(
  current: StarfrontProgression,
  itemId: string,
  forceSuccess?: boolean,
): { updated: StarfrontProgression; result: EnhancementResult } {
  const itemIndex = current.inventory.findIndex((it) => it.id === itemId)
  if (itemIndex === -1) {
    throw new Error(`Không tìm thấy trang bị với id: ${itemId}`)
  }

  const item = current.inventory[itemIndex]
  const currentLevel = Math.max(0, Math.min(10, item.enhancementLevel || 0))

  if (currentLevel >= 10) {
    return {
      updated: current,
      result: {
        success: false,
        item,
        oldLevel: currentLevel,
        newLevel: currentLevel,
        successRate: 0,
        cost: { credits: 0, alloy: 0 },
        message: `Trang bị ${item.name} đã đạt cấp cường hóa tối thượng (+10)! Không thể nâng cấp thêm.`,
      },
    }
  }

  const targetLevel = currentLevel + 1
  const config = ENHANCEMENT_TABLE[targetLevel]
  const currentAlloy = current.alloy ?? 25

  if (current.credits < config.creditsCost) {
    return {
      updated: current,
      result: {
        success: false,
        item,
        oldLevel: currentLevel,
        newLevel: currentLevel,
        successRate: config.successRate,
        cost: { credits: config.creditsCost, alloy: config.alloyCost },
        message: `Không đủ Credits! Cần ${config.creditsCost.toLocaleString("vi-VN")} Credits (hiện có ${current.credits.toLocaleString("vi-VN")}).`,
      },
    }
  }

  if (currentAlloy < config.alloyCost) {
    return {
      updated: current,
      result: {
        success: false,
        item,
        oldLevel: currentLevel,
        newLevel: currentLevel,
        successRate: config.successRate,
        cost: { credits: config.creditsCost, alloy: config.alloyCost },
        message: `Không đủ Hợp Kim (Alloy)! Cần ${config.alloyCost} Hợp Kim (hiện có ${currentAlloy}). Hãy đánh chiến dịch để kiếm thêm!`,
      },
    }
  }

  // Khấu trừ tài nguyên
  const nextCredits = current.credits - config.creditsCost
  const nextAlloy = currentAlloy - config.alloyCost

  // Xác định thành công theo tỉ lệ
  const roll = Math.random()
  const isSuccess = forceSuccess !== undefined ? forceSuccess : roll < config.successRate

  const newLevel = isSuccess ? targetLevel : currentLevel
  const updatedItem: StarfrontItem = {
    ...item,
    enhancementLevel: newLevel,
  }

  const updatedInventory = [...current.inventory]
  updatedInventory[itemIndex] = updatedItem

  const updatedProgression: StarfrontProgression = {
    ...current,
    credits: nextCredits,
    alloy: nextAlloy,
    inventory: updatedInventory,
  }

  const message = isSuccess
    ? `🎉 CƯỜNG HÓA THÀNH CÔNG! ${item.name} đã thăng cấp lên [+${newLevel}]. Các chỉ số tăng vọt!`
    : `⚠️ CƯỜNG HÓA THẤT BẠI (Tỉ lệ ${Math.round(config.successRate * 100)}%)! Trang bị được bảo vệ an toàn nguyên vẹn ở cấp [+${currentLevel}].`

  return {
    updated: updatedProgression,
    result: {
      success: isSuccess,
      item: updatedItem,
      oldLevel: currentLevel,
      newLevel,
      successRate: config.successRate,
      cost: { credits: config.creditsCost, alloy: config.alloyCost },
      message,
    },
  }
}

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

/** Tính tổng chỉ số hoàn chỉnh bao gồm Gear đã chọn + Cấp độ + Tất cả trang bị đang lắp + Điểm thuộc tính Phi công */
export function calculateTotalGearStats(
  gearId: StarfrontGearId = "vanguard",
  level: number,
  inventory: StarfrontItem[],
  equipped: Record<StarfrontItemSlot, string | null>,
  pilotData?: PilotProgressionData,
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
        const enhanced = getEnhancedItemStats(item)
        bonuses.hp += enhanced.hpBonus
        bonuses.sp += enhanced.spBonus
        bonuses.attack += enhanced.attackBonus
        bonuses.defense += enhanced.defenseBonus
        bonuses.speed += enhanced.speedBonus
      }
    }
  }

  const equipmentBonuses = {
    hp: bonuses.hp,
    sp: bonuses.sp,
    attack: bonuses.attack,
    defense: bonuses.defense,
    speed: bonuses.speed,
  }

  const pilotBonuses = {
    attack: pilotData?.allocatedStats ? (pilotData.allocatedStats.attack || 0) * 2.0 : 0,
    defense: pilotData?.allocatedStats ? (pilotData.allocatedStats.defense || 0) * 1.5 : 0,
    speed: pilotData?.allocatedStats ? (pilotData.allocatedStats.agility || 0) * 1.0 : 0,
  }

  // Cộng điểm thuộc tính đã phân bổ của phi công (Phase 5.8: +2 ATK/pt, +1.5 DEF/pt, +1 SPD/pt)
  if (pilotData?.allocatedStats) {
    const allocated = pilotData.allocatedStats
    bonuses.attack += (allocated.attack || 0) * 2.0
    bonuses.defense += (allocated.defense || 0) * 1.5
    bonuses.speed += (allocated.agility || 0) * 1.0
  }

  return {
    base,
    bonuses,
    breakdown: {
      base,
      equipment: equipmentBonuses,
      pilot: pilotBonuses,
    },
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
  pilotData?: PilotProgressionData,
) {
  return calculateTotalGearStats("vanguard", level, inventory, equipped, pilotData)
}

/**
 * Tính toán Item Rating dựa trên bảng Power Token (PT) và cấp cường hóa (+0 đến +10)
 * Theo quy chuẩn docs/ITEM_BALANCE.md: Rating = Math.round(TotalActualPowerTokens / 1.5)
 */
export function calculateItemRating(item: StarfrontItem): number {
  const enhanced = getEnhancedItemStats(item)
  const pt =
    (enhanced.attackBonus || 0) * 1.0 +
    (enhanced.defenseBonus || 0) * 1.2 +
    (enhanced.speedBonus || 0) * 1.5 +
    (enhanced.hpBonus || 0) * 0.08 +
    (enhanced.spBonus || 0) * 1.2
  return Math.max(10, Math.round(pt / 1.5))
}

/**
 * Tính toán Lực Chiến Tổng Thể (Gear Combat Rating) cho Cơ Giáp
 */
export function calculateGearCombatRating(totalStats: {
  attack: number
  defense: number
  speed: number
  hp: number
  sp: number
}): number {
  const pt =
    totalStats.attack * 1.0 +
    totalStats.defense * 1.2 +
    totalStats.speed * 1.5 +
    totalStats.hp * 0.08 +
    totalStats.sp * 1.2
  return Math.round(pt * 1.25)
}

/**
 * Tính toán Điểm Kỹ Năng Phi Thuyền (Aircraft Skill Points) theo cấp độ
 * Quy tắc docs/SKILL_SYSTEM.md: +2 SP mỗi cấp phi thuyền
 */
export function getAircraftSkillPoints(level: number, allocated: number = 0): {
  total: number
  allocated: number
  available: number
} {
  const total = Math.max(0, (level - 1) * 2)
  const alloc = Math.min(total, Math.max(0, allocated))
  return {
    total,
    allocated: alloc,
    available: Math.max(0, total - alloc),
  }
}

/** Xây dựng CombatUnit sẵn sàng đưa vào đấu trường từ tiến trình hiện tại */
export function buildPlayerCombatUnit(progression: StarfrontProgression): CombatUnit {
  const activeGear = progression.activePairing?.isLocked
    ? progression.activePairing.gearId
    : (progression.activeGearId || progression.activePairing?.gearId || "vanguard")
  const activePilotId = progression.activePairing?.pilotId || "marcus"
  const gearDef = STARFRONT_GEAR_DEFS[activeGear] || STARFRONT_GEAR_DEFS.vanguard
  const pilotDef = STARFRONT_PILOT_MAP[activePilotId] || STARFRONT_PILOTS[0]
  const pilotData = progression.pilots?.[activePilotId]

  const { total } = calculateTotalGearStats(
    activeGear,
    progression.level,
    progression.inventory,
    progression.equipped,
    pilotData,
  )

  const allocated = pilotData?.allocatedStats || {
    attack: 0,
    defense: 0,
    agility: 0,
    shield: 0,
    tactical: 0,
  }

  // Shield: Cơ bản theo Gear + 30 Khiên mỗi điểm Shield của phi công
  const baseShield = activeGear === "aegis" ? 480 : activeGear === "vanguard" ? 300 : 180
  const pilotShieldBonus = (allocated.shield || 0) * 30
  const totalShield = baseShield + pilotShieldBonus

  // Evasion: Falcon (+15%) + Alviss nội tại (+8%) + 0.2% mỗi điểm Agility
  const baseEvasion = activeGear === "falcon" ? 15 : 0
  const alvissEvasion = activePilotId === "alviss" ? 8 : 0
  const pilotAgilityEvasion = Math.round((allocated.agility || 0) * 0.2)
  const totalEvasion = baseEvasion + alvissEvasion + pilotAgilityEvasion

  // Crit: Falcon (+25%) / Gear khác (+15%) + 0.4% mỗi điểm Tactical
  const baseCrit = activeGear === "falcon" ? 0.25 : 0.15
  const pilotTacticalCrit = (allocated.tactical || 0) * 0.004
  const totalCritRate = Math.min(0.75, baseCrit + pilotTacticalCrit)

  // Armor Penetration: Eric (+20% cố định)
  const armorPenetration = activePilotId === "eric" ? 0.20 : 0

  return {
    id: `player-${activeGear}`,
    name: `${gearDef.name} (Cấp ${progression.level})`,
    title: gearDef.role,
    gearType: activeGear,
    isPlayer: true,
    pilotId: activePilotId,
    pilotName: pilotDef.name,
    hp: total.hp,
    maxHp: total.maxHp,
    sp: total.sp,
    maxSp: total.maxSp,
    shield: totalShield,
    maxShield: totalShield,
    attack: Math.round(total.attack),
    defense: Math.round(total.defense),
    speed: Math.round(total.speed),
    evasion: totalEvasion,
    critRate: Number(totalCritRate.toFixed(3)),
    critDamage: activeGear === "falcon" ? 1.75 : 1.5,
    armorPenetration,
    skills: gearDef.skills,
    statusEffects: [],
    skillCooldowns: {},
    avatar: pilotDef.avatar || gearDef.avatar,
    pilotId: activePilotId,
    pilotName: pilotDef.name,
    pilotPassiveTriggered: false,
  }
}

/** Tương thích ngược: Xây dựng Vanguard CombatUnit */
export function buildVanguardCombatUnit(progression: StarfrontProgression): CombatUnit {
  return buildPlayerCombatUnit(progression)
}

/* ==========================================================================
   PHASE 5.8 — HỆ THỐNG TIẾN TRÌNH PHI CÔNG & GHÉP ĐÔI (PILOT PROGRESSION & PAIRING)
   ========================================================================== */

export const INITIAL_PILOT_PROGRESSION: Record<string, PilotProgressionData> = {
  marcus: {
    id: "marcus",
    level: 1,
    exp: 0,
    allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
    availablePoints: 0,
  },
  valentine: {
    id: "valentine",
    level: 1,
    exp: 0,
    allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
    availablePoints: 0,
  },
  alviss: {
    id: "alviss",
    level: 1,
    exp: 0,
    allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
    availablePoints: 0,
  },
  eric: {
    id: "eric",
    level: 1,
    exp: 0,
    allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
    availablePoints: 0,
  },
}

export const INITIAL_ACTIVE_PAIRING: ActivePairingState = {
  pilotId: "marcus",
  gearId: "vanguard",
  isLocked: false,
  unlockProgress: {
    completedMissions: 0,
    wonBattles: 0,
    targetCount: 5,
  },
}

/** Công thức EXP yêu cầu để tăng cấp phi công: Math.round(120 * Math.pow(level, 1.4)) */
export function getPilotExpRequiredForLevel(level: number): number {
  return Math.round(120 * Math.pow(Math.max(1, level), 1.4))
}

/**
 * Xử lý trao EXP cho phi công đang ghép đôi và cập nhật tiến độ mở khóa sau trận đánh / hoàn thành nhiệm vụ
 */
export function processPairingProgressionAfterActivity(
  progression: StarfrontProgression,
  type: "battle" | "mission",
  expGained: number,
): {
  activePairing: ActivePairingState
  pilots: Record<string, PilotProgressionData>
  pilotLeveledUp: boolean
  pilotNewLevel: number
  justUnlocked: boolean
} {
  const currentPairing: ActivePairingState = progression.activePairing || {
    pilotId: "marcus",
    gearId: progression.activeGearId || "vanguard",
    isLocked: false,
    unlockProgress: { completedMissions: 0, wonBattles: 0, targetCount: 5 },
  }

  // 1. Chỉ trao EXP cho phi công đang được ghép đôi
  const pilotId = currentPairing.pilotId || "marcus"
  const pilots: Record<string, PilotProgressionData> = {
    ...(progression.pilots || INITIAL_PILOT_PROGRESSION),
  }
  const currentPilot = pilots[pilotId] || {
    id: pilotId,
    level: 1,
    exp: 0,
    allocatedStats: { attack: 0, defense: 0, agility: 0, shield: 0, tactical: 0 },
    availablePoints: 0,
  }

  let pLevel = currentPilot.level
  let pExp = currentPilot.exp + expGained
  let pAvailable = currentPilot.availablePoints
  let pilotLeveledUp = false

  while (pLevel < 30) {
    const req = getPilotExpRequiredForLevel(pLevel)
    if (pExp >= req) {
      pExp -= req
      pLevel += 1
      pAvailable += 5
      pilotLeveledUp = true
    } else {
      break
    }
  }

  pilots[pilotId] = {
    ...currentPilot,
    level: pLevel,
    exp: pExp,
    availablePoints: pAvailable,
  }

  // 2. Cập nhật tiến độ mở khóa nếu đang bị khóa
  let isLocked = currentPairing.isLocked
  let completedMissions = currentPairing.unlockProgress?.completedMissions || 0
  let wonBattles = currentPairing.unlockProgress?.wonBattles || 0
  let justUnlocked = false

  if (isLocked) {
    if (type === "battle") {
      wonBattles += 1
    } else if (type === "mission") {
      completedMissions += 1
    }

    if (wonBattles >= 5 || completedMissions >= 5) {
      isLocked = false
      justUnlocked = true
    }
  }

  const updatedPairing: ActivePairingState = {
    ...currentPairing,
    isLocked,
    unlockProgress: {
      completedMissions,
      wonBattles,
      targetCount: 5,
    },
  }

  return {
    activePairing: updatedPairing,
    pilots,
    pilotLeveledUp,
    pilotNewLevel: pLevel,
    justUnlocked,
  }
}

/** Phân bổ 1 điểm thuộc tính cho phi công (+5 điểm nhận được mỗi khi lên cấp) */
export function allocatePilotPoint(
  current: StarfrontProgression,
  pilotId: string,
  statKey: PilotAttributeKey,
): { success: boolean; updated: StarfrontProgression; message: string } {
  const pilots = { ...(current.pilots || INITIAL_PILOT_PROGRESSION) }
  const pilot = pilots[pilotId]
  if (!pilot) {
    return { success: false, updated: current, message: "Không tìm thấy hồ sơ phi công!" }
  }
  if (pilot.availablePoints <= 0) {
    return { success: false, updated: current, message: "Không còn điểm thuộc tính để phân bổ!" }
  }

  const newAllocated = {
    ...pilot.allocatedStats,
    [statKey]: (pilot.allocatedStats[statKey] || 0) + 1,
  }

  pilots[pilotId] = {
    ...pilot,
    allocatedStats: newAllocated,
    availablePoints: pilot.availablePoints - 1,
  }

  const updated: StarfrontProgression = {
    ...current,
    pilots,
  }
  return { success: true, updated, message: `Đã phân bổ +1 điểm vào ${statKey.toUpperCase()} cho phi công!` }
}

/** Cài lại toàn bộ điểm thuộc tính của phi công (Hoàn trả 100% điểm với chi phí Credits) */
export function resetPilotPoints(
  current: StarfrontProgression,
  pilotId: string,
  creditCost: number = 200,
): { success: boolean; updated: StarfrontProgression; message: string } {
  const pilots = { ...(current.pilots || INITIAL_PILOT_PROGRESSION) }
  const pilot = pilots[pilotId]
  if (!pilot) {
    return { success: false, updated: current, message: "Không tìm thấy hồ sơ phi công!" }
  }
  if (current.credits < creditCost) {
    return {
      success: false,
      updated: current,
      message: `Không đủ Credits! Cần ${creditCost} Credits để tẩy điểm, bạn chỉ có ${current.credits}.`,
    }
  }

  const totalPoints = Math.max(0, (pilot.level - 1) * 5)
  pilots[pilotId] = {
    ...pilot,
    allocatedStats: {
      attack: 0,
      defense: 0,
      agility: 0,
      shield: 0,
      tactical: 0,
    },
    availablePoints: totalPoints,
  }

  const updated: StarfrontProgression = {
    ...current,
    credits: current.credits - creditCost,
    pilots,
  }
  return {
    success: true,
    updated,
    message: `Đã cài lại toàn bộ ${totalPoints} điểm thuộc tính cho phi công ${pilotId.toUpperCase()}!`,
  }
}

/** Xác nhận ghép đôi Phi Công & Cơ Giáp và khóa trong 5 nhiệm vụ hoặc 5 trận thắng */
export function confirmPairing(
  current: StarfrontProgression,
  pilotId: string,
  gearId: StarfrontGearId,
): { success: boolean; updated: StarfrontProgression; message: string } {
  // Nếu đang khóa và chưa đạt điều kiện mở khóa, ngăn chặn thay đổi
  if (current.activePairing?.isLocked) {
    const { completedMissions, wonBattles } = current.activePairing.unlockProgress
    if (completedMissions < 5 && wonBattles < 5) {
      return {
        success: false,
        updated: current,
        message: `Cặp đôi hiện tại đang bị khóa (${completedMissions}/5 Nhiệm Vụ hoặc ${wonBattles}/5 Trận Thắng)! Chưa thể đổi cặp đôi mới.`,
      }
    }
  }

  const newPairing: ActivePairingState = {
    pilotId,
    gearId,
    isLocked: true,
    unlockProgress: {
      completedMissions: 0,
      wonBattles: 0,
      targetCount: 5,
    },
  }

  const updated: StarfrontProgression = {
    ...current,
    activeGearId: gearId,
    activePairing: newPairing,
  }

  return {
    success: true,
    updated,
    message: `Đã xác nhận cặp đôi xuất kích thành công! Cặp đôi sẽ được khóa cố định trong 5 nhiệm vụ hoặc 5 trận thắng tiếp theo.`,
  }
}

/* ==========================================================================
   CẤU HÌNH PHẦN THƯỞNG CHIẾN THẮNG THEO MỤC TIÊU (REWARDS)
   ========================================================================== */

export const BATTLE_REWARDS: Record<
  EnemyEncounterType,
  { exp: number; credits: number; alloy: number; dropChance: number; dropPool: string[] }
> = {
  "scout-drone": {
    exp: 60,
    credits: 150,
    alloy: 3,
    dropChance: 0.25,
    dropPool: ["wpn_pulse_carbine", "eng_ion_booster"],
  },
  "raider-mech": {
    exp: 130,
    credits: 350,
    alloy: 6,
    dropChance: 0.4,
    dropPool: ["wpn_plasma_cutter", "shd_nano_barrier", "eng_warp_thruster"],
  },
  "siege-walker": {
    exp: 320,
    credits: 850,
    alloy: 15,
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
  const alloyGained = config.alloy

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

  // Cập nhật tiến độ Phi Công & Bộ đếm mở khóa cặp đôi
  const pairingRes = processPairingProgressionAfterActivity(current, "battle", expGained)

  const updated: StarfrontProgression = {
    ...current,
    level: newLevel,
    exp: newExp,
    credits: current.credits + creditsGained,
    alloy: (current.alloy ?? 25) + alloyGained,
    inventory: updatedInventory,
    battlesWon: current.battlesWon + 1,
    freeShopRefreshes: Math.min(5, (current.freeShopRefreshes ?? 0) + 1),
    activePairing: pairingRes.activePairing,
    pilots: pairingRes.pilots,
  }

  const reward: BattleRewardResult = {
    expGained,
    creditsGained,
    alloyGained,
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

/** Nhận thưởng hoàn thành Ải Chiến Dịch (Hỗ trợ Preview Thưởng & Đảm bảo đúng 1 Trang Bị Rơi) */
export function applyMissionClearReward(
  current: StarfrontProgression,
  mission: CampaignMission,
): { updated: StarfrontProgression; reward: BattleRewardResult; dropItem: StarfrontItem; isFirstClear: boolean } {
  const isFirstClear = !current.completedMissions.includes(mission.id)
  
  // Nếu có previewReward (Phase 5.5), lấy chính xác số liệu từ preview đã công bố
  let creditsGained = mission.previewReward?.credits ?? (isFirstClear ? mission.firstClearReward.credits : mission.repeatReward.credits)
  let alloyGained = mission.previewReward?.alloy ?? (
    isFirstClear
      ? (mission.firstClearReward.alloy ?? (mission.sectorId === "sector-1" ? 5 : mission.sectorId === "sector-2" ? 10 : 20))
      : (mission.repeatReward.alloy ?? (mission.sectorId === "sector-1" ? 2 : mission.sectorId === "sector-2" ? 4 : 8))
  )
  const expGained = isFirstClear ? mission.firstClearReward.exp : mission.repeatReward.exp

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

  // Trao ĐÚNG 1 trang bị rơi
  let dropItem: StarfrontItem
  if (mission.previewReward?.item) {
    const previewItem = mission.previewReward.item
    dropItem = current.inventory.some((i) => i.id === previewItem.id)
      ? { ...previewItem, id: `${previewItem.id}_${Date.now()}` }
      : { ...previewItem }
  } else if (isFirstClear && mission.firstClearReward.itemId) {
    const template = SAMPLE_STARFRONT_ITEMS.find((it) => it.id === mission.firstClearReward.itemId)
    dropItem = template || SAMPLE_STARFRONT_ITEMS[0]
  } else {
    // Fallback trang bị ngẫu nhiên
    const idx = (current.battlesWon + current.inventory.length) % SAMPLE_STARFRONT_ITEMS.length
    const fallbackTemplate = SAMPLE_STARFRONT_ITEMS[idx]
    dropItem = {
      ...fallbackTemplate,
      id: `${fallbackTemplate.id}_clear_${Date.now()}`,
    }
  }

  const updatedInventory = [...current.inventory, dropItem]
  const updatedCompletedMissions = isFirstClear
    ? [...current.completedMissions, mission.id]
    : [...current.completedMissions]

  // Cập nhật tiến độ Phi Công & Bộ đếm mở khóa cặp đôi (type: "mission")
  const pairingRes = processPairingProgressionAfterActivity(current, "mission", expGained)

  const updated: StarfrontProgression = {
    ...current,
    level: newLevel,
    exp: newExp,
    credits: current.credits + creditsGained,
    alloy: (current.alloy ?? 25) + alloyGained,
    inventory: updatedInventory,
    completedMissions: updatedCompletedMissions,
    battlesWon: current.battlesWon + 1,
    freeShopRefreshes: Math.min(5, (current.freeShopRefreshes ?? 0) + 1),
    activePairing: pairingRes.activePairing,
    pilots: pairingRes.pilots,
  }

  const reward: BattleRewardResult = {
    expGained,
    creditsGained,
    alloyGained,
    leveledUp,
    oldLevel: current.level,
    newLevel,
    newExp,
    expRequired: getExpRequiredForLevel(newLevel),
  }

  return { updated, reward, dropItem, isFirstClear }
}

/** Nhận thưởng hoàn thành Nhiệm Vụ Phân Tầng (Phase 5.5 StarfrontQuest) */
export function applyQuestCompletionReward(
  current: StarfrontProgression,
  quest: StarfrontQuest,
): { updated: StarfrontProgression; reward: BattleRewardResult; dropItem: StarfrontItem; isFirstClear: boolean } {
  const isFirstClear = !current.completedMissions.includes(quest.id)
  const expGained = quest.level * 80 + 50
  const creditsGained = quest.previewReward.credits
  const alloyGained = quest.previewReward.alloy

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

  // Trao ĐÚNG 1 trang bị rơi từ preview
  const previewItem = quest.previewReward.item
  const dropItem: StarfrontItem = current.inventory.some((i) => i.id === previewItem.id)
    ? { ...previewItem, id: `${previewItem.id}_${Date.now()}` }
    : { ...previewItem }

  const updatedInventory = [...current.inventory, dropItem]
  const updatedCompletedMissions = isFirstClear
    ? [...current.completedMissions, quest.id]
    : [...current.completedMissions]

  const updatedCompletedQuestIds = current.completedQuestIds
    ? (isFirstClear ? [...current.completedQuestIds, quest.id] : [...current.completedQuestIds])
    : (isFirstClear ? [quest.id] : [])

  // Cập nhật tiến độ Phi Công & Bộ đếm mở khóa cặp đôi (type: "mission")
  const pairingRes = processPairingProgressionAfterActivity(current, "mission", expGained)

  const updated: StarfrontProgression = {
    ...current,
    level: newLevel,
    exp: newExp,
    credits: current.credits + creditsGained,
    alloy: (current.alloy ?? 25) + alloyGained,
    inventory: updatedInventory,
    completedMissions: updatedCompletedMissions,
    completedQuestIds: updatedCompletedQuestIds,
    battlesWon: current.battlesWon + 1,
    freeShopRefreshes: Math.min(5, (current.freeShopRefreshes ?? 0) + 1),
    activeQuest: null,
    activePairing: pairingRes.activePairing,
    pilots: pairingRes.pilots,
  }

  const reward: BattleRewardResult = {
    expGained,
    creditsGained,
    alloyGained,
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
  // 1. Kiểm tra điều kiện mở khóa
  const unlockCheck = isShopItemUnlocked(shopItem, current)
  if (!unlockCheck.unlocked) {
    return {
      success: false,
      updated: current,
      message: `Vật phẩm chưa mở khóa! ${unlockCheck.reason}`,
    }
  }

  // 2. Kiểm tra số dư Credits
  if (current.credits < shopItem.buyPrice) {
    return {
      success: false,
      updated: current,
      message: `Không đủ Credits! Cần ${shopItem.buyPrice.toLocaleString("vi-VN")} Credits, bạn chỉ có ${current.credits.toLocaleString("vi-VN")}.`,
    }
  }

  // 3. Tạo ID duy nhất cho trang bị mới mua
  const boughtItem: StarfrontItem = {
    ...shopItem.item,
    id: `${shopItem.item.id}_${Date.now()}`,
    enhancementLevel: 0,
    statsRandomized: true,
  }

  // Cập nhật trạng thái đã mua trong currentShopItems nếu có
  const currentShopItems = current.currentShopItems
    ? current.currentShopItems.map((si) =>
        si.item.id === shopItem.item.id ? { ...si, isPurchased: true } : si,
      )
    : undefined

  const updated: StarfrontProgression = {
    ...current,
    credits: current.credits - shopItem.buyPrice,
    inventory: [...current.inventory, boughtItem],
    currentShopItems,
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
   MILESTONE 5.3 — ARMORY ECONOMY & RECYCLING (TÁI CHẾ / RÃ ĐỒ & CHỢ PHÂN TẦNG)
   ========================================================================== */

/**
 * Tính toán chính xác lượng Hợp Kim (Alloy) và Credits nhận lại khi Tái Chế / Rã Đồ
 * Quy tắc:
 * 1. Base Alloy theo Rarity: Common = 2, Rare = 5, Epic = 12, Legendary = 25
 * 2. Enhancement Refund: Hoàn trả 60% lượng Alloy đã đầu tư (tối thiểu +2 Alloy mỗi cấp)
 * 3. Base Credits: 35% giá trị vật phẩm
 * 4. Enhancement Credits Refund: 30% lượng Credits đã đầu tư qua cường hóa
 */
export function calculateSalvageEstimate(item: StarfrontItem): SalvageEstimate {
  const baseAlloyMap: Record<StarfrontItemRarity, number> = {
    common: 2,
    rare: 5,
    epic: 12,
    legendary: 25,
  }
  const baseAlloy = baseAlloyMap[item.rarity] || 2

  const enhanceLvl = Math.max(0, Math.min(10, item.enhancementLevel || 0))
  let totalInvestedAlloy = 0
  let totalInvestedCredits = 0

  for (let l = 1; l <= enhanceLvl; l++) {
    const cfg = ENHANCEMENT_TABLE[l]
    if (cfg) {
      totalInvestedAlloy += cfg.alloyCost
      totalInvestedCredits += cfg.creditsCost
    }
  }

  // Hoàn trả 60% Alloy đã đầu tư, tối thiểu enhanceLvl * 2
  const enhancementAlloyRefund =
    enhanceLvl > 0
      ? Math.max(enhanceLvl * 2, Math.round(totalInvestedAlloy * 0.6))
      : 0
  const alloyGained = baseAlloy + enhancementAlloyRefund

  const basePrice =
    item.price ||
    (item.rarity === "legendary"
      ? 2500
      : item.rarity === "epic"
        ? 1200
        : item.rarity === "rare"
          ? 500
          : 200)

  const baseCredits = Math.max(50, Math.round(basePrice * 0.35))
  const enhancementCreditsRefund =
    enhanceLvl > 0 ? Math.round(totalInvestedCredits * 0.3) : 0
  const creditsGained = baseCredits + enhancementCreditsRefund

  return {
    alloyGained,
    baseAlloy,
    enhancementAlloyRefund,
    creditsGained,
    baseCredits,
    enhancementCreditsRefund,
  }
}

/**
 * Thực hiện rã trang bị trong kho để thu hồi nguyên liệu an toàn
 * Bảo đảm:
 * - Không cho phép rã trang bị đang được lắp trên cơ giáp
 * - Không thể rã trùng lặp hoặc lặp lại
 * - Không để tài nguyên âm hay dữ liệu bị sai lệch
 */
export function salvageInventoryItem(
  current: StarfrontProgression,
  itemId: string,
): SalvageExecutionResult {
  // 1. Kiểm tra vật phẩm có đang được trang bị không
  const isEquipped = Object.values(current.equipped).includes(itemId)
  if (isEquipped) {
    return {
      success: false,
      updated: current,
      message: "Không thể tái chế trang bị đang lắp trên cơ giáp! Hãy tháo trang bị ra trước khi rã đồ.",
    }
  }

  // 2. Tìm vật phẩm trong kho
  const itemIndex = current.inventory.findIndex((it) => it.id === itemId)
  if (itemIndex === -1) {
    return {
      success: false,
      updated: current,
      message: "Không tìm thấy vật phẩm cần tái chế trong kho đồ.",
    }
  }

  const item = current.inventory[itemIndex]
  const estimate = calculateSalvageEstimate(item)

  // 3. Loại bỏ vật phẩm khỏi kho và cộng tài nguyên an toàn
  const newInventory = current.inventory.filter((_, idx) => idx !== itemIndex)
  const currentAlloy = current.alloy ?? 25

  const updated: StarfrontProgression = {
    ...current,
    alloy: currentAlloy + estimate.alloyGained,
    credits: current.credits + estimate.creditsGained,
    inventory: newInventory,
  }

  return {
    success: true,
    updated,
    salvagedItem: item,
    estimate,
    message: `Đã tái chế thành công ${item.name}! Nhận lại +${estimate.alloyGained} Hợp Kim (Alloy) và +${estimate.creditsGained.toLocaleString("vi-VN")} Credits.`,
  }
}

/** Kiểm tra vật phẩm trong Chợ Quân Sự đã được mở khóa theo tiến trình Sector chưa (Sửa triệt để lỗi 3-3) */
export function isShopItemUnlocked(
  shopItem: ArmoryShopItem,
  progression: StarfrontProgression,
): { unlocked: boolean; reason?: string } {
  // 1. Kiểm tra trực tiếp theo requiredMissionId nếu có
  if (shopItem.requiredMissionId) {
    const req = shopItem.requiredMissionId
    const hasCleared = progression.completedMissions.some(
      (m) =>
        m === req ||
        m === req.replace("m", "mis") ||
        m === req.replace("mis", "m") ||
        (req.includes("3-3") && (m.includes("3-3") || m === "m3-3" || m === "mis-3-3")),
    )
    if (!hasCleared) {
      return {
        unlocked: false,
        reason: `Yêu cầu hoàn thành nhiệm vụ ${req.toUpperCase()}`,
      }
    }
  }

  // 2. Không yêu cầu Sector nào
  if (!shopItem.requiredSectorId) {
    return { unlocked: true }
  }

  // 3. Yêu cầu Sector 1 (Ải 1-3)
  if (shopItem.requiredSectorId === "sector-1") {
    const hasCleared = progression.completedMissions.some(
      (m) => m === "m1-3" || m === "mis-1-3" || m.includes("1-3"),
    )
    return {
      unlocked: hasCleared,
      reason: hasCleared
        ? undefined
        : "Yêu cầu hoàn thành Sector 1: Vành Đai Asteroid (Ải 1-3)",
    }
  }

  // 4. Yêu cầu Sector 2 (Ải 2-3)
  if (shopItem.requiredSectorId === "sector-2") {
    const hasCleared = progression.completedMissions.some(
      (m) => m === "m2-3" || m === "mis-2-3" || m.includes("2-3"),
    )
    return {
      unlocked: hasCleared,
      reason: hasCleared
        ? undefined
        : "Yêu cầu hoàn thành Sector 2: Tinh Vân Plasma Tối (Ải 2-3)",
    }
  }

  // 5. Yêu cầu Sector 3 (Ải 3-3) - Sửa lỗi đồng bộ định danh m3-3 / mis-3-3
  if (shopItem.requiredSectorId === "sector-3") {
    const hasCleared = progression.completedMissions.some(
      (m) => m === "m3-3" || m === "mis-3-3" || m.includes("3-3"),
    )
    return {
      unlocked: hasCleared,
      reason: hasCleared
        ? undefined
        : "Yêu cầu hoàn thành Sector 3: Pháo Đài Bastion Core (Ải 3-3)",
    }
  }

  // 6. Yêu cầu Sector 4 (Ải 4-3)
  if (shopItem.requiredSectorId === "sector-4") {
    const hasCleared = progression.completedMissions.some(
      (m) => m === "m4-3" || m === "mis-4-3" || m.includes("4-3"),
    )
    return {
      unlocked: hasCleared,
      reason: hasCleared
        ? undefined
        : "Yêu cầu hoàn thành Sector 4: Hư Không Vô Tận (Ải 4-3)",
    }
  }

  return { unlocked: true }
}

/** Tạo danh mục hàng Chợ Quân Sự ngẫu nhiên theo pool trang bị hiện có */
export function generateShopCatalog(progression: StarfrontProgression): ArmoryShopItem[] {
  // Pool các vật phẩm vũ khí, khiên, động cơ
  const weaponPool: ArmoryShopItem[] = [
    {
      item: {
        id: "shop_wpn_plasma_cutter",
        name: "Pháo Cắt Plasma Cao Áp Mk.II",
        slot: "weapon",
        rarity: "rare",
        desc: "Chùm plasma siêu nhiệt nung chảy vỏ thép. Tăng mạnh sức tấn công và tốc độ ra đòn.",
        attackBonus: 36,
        speedBonus: 5,
        price: 850,
      },
      buyPrice: 850,
      tierName: "Cơ Bản (Mở ngay)",
      isPurchased: false,
    },
    {
      item: {
        id: "shop_wpn_hyper_railgun",
        name: "Đại Pháo Ray Điện Từ Hyper Prime",
        slot: "weapon",
        rarity: "epic",
        desc: "Gia tốc đạn hạt nhân mini công phá cực đại giáp trụ mục tiêu.",
        attackBonus: 65,
        speedBonus: 8,
        defenseBonus: -5,
        price: 2200,
      },
      buyPrice: 2200,
      requiredSectorId: "sector-1",
      tierName: "Mở Khóa: Sector 1",
      isPurchased: false,
    },
    {
      item: {
        id: "shop_wpn_singularity_lance",
        name: "Thương Năng Lượng Điểm Kỳ Dị Singularity",
        slot: "weapon",
        rarity: "epic",
        desc: "Phóng chùm photon nén cực độ tạo lỗ đen vi mô nghiền nát vỏ tàu địch.",
        attackBonus: 75,
        speedBonus: 10,
        hpBonus: 150,
        price: 3500,
      },
      buyPrice: 3500,
      requiredSectorId: "sector-2",
      tierName: "Mở Khóa: Sector 2",
      isPurchased: false,
    },
    {
      item: {
        id: "shop_wpn_stellar_annihilator",
        name: "Súng Hủy Diệt Tinh Vân Prime",
        slot: "weapon",
        rarity: "legendary",
        desc: "Vũ khí chế tác từ lõi sao băng. Sức mạnh hủy diệt nguyên tử vô tiền khoáng hậu.",
        attackBonus: 95,
        speedBonus: 12,
        spBonus: 25,
        price: 6500,
      },
      buyPrice: 6500,
      requiredSectorId: "sector-3",
      requiredMissionId: "m3-3",
      tierName: "Hàng Tối Thượng: Sector 3 (Legendary)",
      isPurchased: false,
    },
  ]

  const shieldPool: ArmoryShopItem[] = [
    {
      item: {
        id: "shop_shd_nano_barrier",
        name: "Khiên Nano Tự Phục Hồi V3",
        slot: "shield",
        rarity: "rare",
        desc: "Vi hạt nano tự liên kết hàn gắn các tổn thương trên vỏ bọc ngay lập tức.",
        defenseBonus: 30,
        hpBonus: 350,
        price: 900,
      },
      buyPrice: 900,
      tierName: "Cơ Bản (Mở ngay)",
      isPurchased: false,
    },
    {
      item: {
        id: "shop_shd_aegis_forcefield",
        name: "Trường Lực Ion Aegis Tối Thượng",
        slot: "shield",
        rarity: "epic",
        desc: "Lưới chắn ion hóa triệt tiêu động năng đạn pháo và hồi năng lượng lõi.",
        defenseBonus: 52,
        hpBonus: 600,
        spBonus: 20,
        price: 2500,
      },
      buyPrice: 2500,
      requiredSectorId: "sector-1",
      tierName: "Mở Khóa: Sector 1",
      isPurchased: false,
    },
    {
      item: {
        id: "shop_shd_stellar_bulwark",
        name: "Pháo Đài Bất Hoại Event Horizon",
        slot: "shield",
        rarity: "legendary",
        desc: "Khiên chắn trọng lực bẻ cong mọi loại đạn pháo và hồi phục cực hạn HP.",
        defenseBonus: 75,
        hpBonus: 950,
        spBonus: 35,
        price: 6000,
      },
      buyPrice: 6000,
      requiredSectorId: "sector-3",
      tierName: "Hàng Tối Thượng: Sector 3 (Legendary)",
      isPurchased: false,
    },
  ]

  const enginePool: ArmoryShopItem[] = [
    {
      item: {
        id: "shop_eng_warp_thruster",
        name: "Động Cơ Gia Tốc Warp Mk.II",
        slot: "engine",
        rarity: "rare",
        desc: "Bộ đẩy phản lực thế hệ mới giúp cơ giáp lướt gió không gian tốc độ cao.",
        speedBonus: 20,
        attackBonus: 10,
        price: 1000,
      },
      buyPrice: 1000,
      tierName: "Cơ Bản (Mở ngay)",
      isPurchased: false,
    },
    {
      item: {
        id: "shop_eng_antimatter_drive",
        name: "Động Cơ Phản Vật Chất Dark Nova",
        slot: "engine",
        rarity: "epic",
        desc: "Nạp năng lượng phản vật chất vô hạn, tăng vượt trội Tốc độ, SP và HP.",
        speedBonus: 32,
        spBonus: 30,
        hpBonus: 200,
        price: 3200,
      },
      buyPrice: 3200,
      requiredSectorId: "sector-2",
      tierName: "Mở Khóa: Sector 2",
      isPurchased: false,
    },
    {
      item: {
        id: "shop_eng_chronos_drive",
        name: "Động Cơ Dịch Chuyển Lượng Tử Chronos",
        slot: "engine",
        rarity: "legendary",
        desc: "Bẻ cong không-thời gian mang lại tốc độ tuyệt đỉnh và ưu thế ra đòn áp đảo.",
        speedBonus: 45,
        attackBonus: 20,
        spBonus: 40,
        price: 7000,
      },
      buyPrice: 7000,
      requiredSectorId: "sector-4",
      tierName: "Hàng Thần Thoại: Sector 4 (Legendary)",
      isPurchased: false,
    },
  ]

  // Trả về danh sách đầy đủ các vật phẩm được format chuẩn
  return [...weaponPool, ...shieldPool, ...enginePool]
}

/** Làm mới danh mục hàng Chợ Quân Sự (Shop Refresh - Random lại danh mục bán) */
export function refreshArmoryShop(
  current: StarfrontProgression,
): { success: boolean; updated: StarfrontProgression; message: string } {
  const freeRefreshes = current.freeShopRefreshes || 0
  const newCatalog = generateShopCatalog(current)

  if (freeRefreshes > 0) {
    const updated: StarfrontProgression = {
      ...current,
      freeShopRefreshes: freeRefreshes - 1,
      currentShopItems: newCatalog,
    }
    return {
      success: true,
      updated,
      message: `Đã làm mới danh mục hàng bằng lượt miễn phí! (Còn lại ${freeRefreshes - 1} lượt)`,
    }
  }

  const cost = 100
  if (current.credits < cost) {
    return {
      success: false,
      updated: current,
      message: `Không đủ Credits để làm mới gian hàng! Cần ${cost} Credits, bạn có ${current.credits.toLocaleString("vi-VN")}.`,
    }
  }

  const updated: StarfrontProgression = {
    ...current,
    credits: current.credits - cost,
    currentShopItems: newCatalog,
  }

  return {
    success: true,
    updated,
    message: `Đã làm mới danh mục Chợ Quân Sự! Đã trừ ${cost} Credits.`,
  }
}

/**
 * Reset / Reroll cấu hình thử thách và phần thưởng cho Ải chiến dịch đã hoàn thành
 * Bảo đảm: Không làm mất tiến trình đã hoàn thành, kho đồ hay cấp độ người chơi
 */
export function resetCampaignMissionConfig(
  current: StarfrontProgression,
  missionId: string,
): { success: boolean; updated: StarfrontProgression; message: string } {
  const isCompleted = current.completedMissions.some(
    (m) =>
      m === missionId ||
      m === missionId.replace("m", "mis") ||
      m === missionId.replace("mis", "m") ||
      (missionId.includes("-") && m.endsWith(missionId.split("-").slice(1).join("-"))),
  )

  if (!isCompleted) {
    return {
      success: false,
      updated: current,
      message: "Chỉ có thể reset cấu hình thử thách cho những Ải bạn đã hoàn thành!",
    }
  }

  const baseQuest = findCampaignQuest(missionId)
  const lvl = baseQuest?.level || 1

  const qualities: QuestQuality[] = ["standard", "veteran", "elite", "heroic"]
  if (lvl >= 7) qualities.push("legendary")
  const newQuality = qualities[Math.floor(Math.random() * qualities.length)]

  const variants: EnemyVariantId[] = ["recon", "interceptor", "jammer", "assault", "berserker", "heavy", "fortress"]
  if (newQuality === "legendary" || lvl >= 9) variants.push("colossus", "annihilator")
  const newVariant = variants[Math.floor(Math.random() * variants.length)]

  const newPreview = buildQuestRewardPreview(lvl, newQuality, undefined, Date.now() % 100000)

  const updatedOverrides = {
    ...(current.missionOverrides || {}),
    [missionId]: {
      quality: newQuality,
      variantId: newVariant,
      previewReward: newPreview,
    },
  }

  const updated: StarfrontProgression = {
    ...current,
    missionOverrides: updatedOverrides,
  }

  return {
    success: true,
    updated,
    message: `Đã reset thử thách Ải ${missionId.toUpperCase()}: Phẩm chất mới [${newQuality.toUpperCase()}] & Phần thưởng ngẫu nhiên mới!`,
  }
}

/** Sinh danh mục Nhiệm Vụ Phụ Tuyến (Side Quests / Tiền Thưởng Bounties) */
export function generateSideQuests(playerLevel: number, count: number = 3): StarfrontQuest[] {
  const templates = [
    {
      idPrefix: "sq-recon",
      title: "Tiền Thưởng: Tiêu Diệt Toán Trinh Sát Tinh Tặc",
      desc: "Trinh sát cơ của cướp biển vũ trụ đang lảng vảng do thám căn cứ. Tiêu diệt chúng để bảo toàn bí mật.",
      encounterType: "scout-drone" as const,
      variants: ["recon", "interceptor", "jammer"] as EnemyVariantId[],
      quality: "standard" as QuestQuality,
    },
    {
      idPrefix: "sq-convoy",
      title: "Hộ Tống: Đập Tan Cuộc Đột Kích Đội Tàu Vận Tải",
      desc: "Đoàn tàu tiếp tế hợp kim bị phục kích bởi cơ giáp đột kích. Can thiệp khẩn cấp giải cứu đội tàu.",
      encounterType: "raider-mech" as const,
      variants: ["assault", "berserker"] as EnemyVariantId[],
      quality: "veteran" as QuestQuality,
    },
    {
      idPrefix: "sq-fortress",
      title: "Truy Quét: Hủy Diệt Pháo Đài Vũ Trụ Lạc Lối",
      desc: "Một pháo đài tự hành cổ xưa đang xả đạn bừa bãi vào tuyến hàng hải. Phá hủy lõi pháo để lập lại trật tự.",
      encounterType: "siege-walker" as const,
      variants: ["heavy", "fortress"] as EnemyVariantId[],
      quality: "elite" as QuestQuality,
    },
  ]

  const quests: StarfrontQuest[] = templates.slice(0, count).map((tmpl, idx) => {
    const qLvl = Math.max(1, Math.min(15, playerLevel + (idx === 0 ? -1 : idx === 1 ? 0 : 1)))
    const variantId = tmpl.variants[Math.floor(Math.random() * tmpl.variants.length)]
    const preview = buildQuestRewardPreview(
      qLvl,
      tmpl.quality,
      undefined,
      (playerLevel * 37 + idx * 19 + Date.now()) % 100000,
    )
    // Phần thưởng thấp hơn nhiệm vụ chính tuyến (~25% ít hơn)
    preview.credits = Math.max(150, Math.round(preview.credits * 0.75))
    preview.alloy = Math.max(1, Math.round(preview.alloy * 0.75))

    return {
      id: `sq-${tmpl.encounterType}-${idx + 1}`,
      title: tmpl.title,
      desc: tmpl.desc,
      sectorId: "side-quests",
      sectorName: "Tiền Thưởng Phụ Tuyến",
      level: qLvl,
      quality: tmpl.quality,
      encounterType: tmpl.encounterType,
      variantId,
      difficultyRating: tmpl.quality === "elite" ? "Nguy Hiểm" : tmpl.quality === "veteran" ? "Khó" : "Dễ",
      previewReward: preview,
      order: idx + 1,
    }
  })

  return quests
}

/** Reset chuỗi nhiệm vụ phụ tuyến */
export function resetSideQuests(
  current: StarfrontProgression,
): { success: boolean; updated: StarfrontProgression; message: string } {
  const newSideQuests = generateSideQuests(current.level)
  const updated: StarfrontProgression = {
    ...current,
    sideQuests: newSideQuests,
    activeQuest: null,
  }
  return {
    success: true,
    updated,
    message: "Đã làm mới danh sách Nhiệm Vụ Phụ Tuyến thành công!",
  }
}

/* ==========================================================================
   TIẾN TRÌNH KHỞI TẠO MẶC ĐỊNH CHO NGƯỜI CHƠI MỚI (INITIAL PROGRESSION)
   ========================================================================== */

export const INITIAL_STARFRONT_PROGRESSION: StarfrontProgression = {
  version: 3,
  level: 1,
  exp: 0,
  credits: 500,
  alloy: 25,
  freeShopRefreshes: 1,
  activeGearId: "vanguard",
  unlockedGears: ["vanguard", "falcon", "aegis"],
  activePairing: INITIAL_ACTIVE_PAIRING,
  pilots: INITIAL_PILOT_PROGRESSION,
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
