import { VANGUARD_INITIAL_UNIT, VANGUARD_SKILLS } from "./data"
import type {
  BattleRewardResult,
  CombatUnit,
  EnemyEncounterType,
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

/** Chỉ số cơ bản của Vanguard theo cấp độ (Level growth) */
export function getBaseStatsForLevel(level: number) {
  const base = VANGUARD_INITIAL_UNIT
  const growthFactor = Math.max(0, level - 1)

  return {
    hp: base.hp + growthFactor * 80,
    sp: base.sp + growthFactor * 10,
    attack: base.attack + growthFactor * 12,
    defense: base.defense + growthFactor * 6,
    speed: base.speed + growthFactor * 2,
  }
}

/** Tính tổng chỉ số hoàn chỉnh bao gồm Cấp độ + Tất cả trang bị đang lắp */
export function calculateTotalVanguardStats(
  level: number,
  inventory: StarfrontItem[],
  equipped: Record<StarfrontItemSlot, string | null>,
) {
  const base = getBaseStatsForLevel(level)
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

/** Xây dựng CombatUnit sẵn sàng đưa vào đấu trường từ tiến trình hiện tại */
export function buildVanguardCombatUnit(progression: StarfrontProgression): CombatUnit {
  const { total } = calculateTotalVanguardStats(
    progression.level,
    progression.inventory,
    progression.equipped,
  )

  return {
    ...VANGUARD_INITIAL_UNIT,
    name: `Vanguard Gear (Cấp ${progression.level})`,
    hp: total.hp,
    maxHp: total.maxHp,
    sp: total.sp,
    maxSp: total.maxSp,
    attack: total.attack,
    defense: total.defense,
    speed: total.speed,
    skills: VANGUARD_SKILLS,
    statusEffects: [],
    skillCooldowns: {},
  }
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
   TIẾN TRÌNH KHỞI TẠO MẶC ĐỊNH CHO NGƯỜI CHƠI MỚI (INITIAL PROGRESSION)
   ========================================================================== */

export const INITIAL_STARFRONT_PROGRESSION: StarfrontProgression = {
  version: 1,
  level: 1,
  exp: 0,
  credits: 500,
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
