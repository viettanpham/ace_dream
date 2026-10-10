import { ENEMIES_DATA } from "./data"
import type {
  CombatSkill,
  CombatUnit,
  EnemyEncounterType,
  EnemyVariantId,
  QuestQuality,
  QuestRewardPreview,
  StarfrontItem,
  StarfrontItemRarity,
  StarfrontItemSlot,
  StarfrontQuest,
  StatusEffect,
} from "./types"

/* ==========================================================================
   MILESTONE 5.5 — BẢNG CÂN BẰNG TẬP TRUNG (CENTRALIZED BALANCE TABLES)
   ========================================================================== */

export const MIN_QUEST_LEVEL = 1
export const MAX_QUEST_LEVEL = 15

export type EnemyBaseStats = {
  hp: number
  sp: number
  attack: number
  defense: number
  speed: number
  evasion: number
  critRate?: number
  critDamage?: number
  armorPenetration?: number
}

/** 1. Chỉ số cơ bản của 3 nhóm kẻ địch chuẩn tại Level 1 */
export const ENEMY_BASE_STATS: Record<EnemyEncounterType, EnemyBaseStats> = {
  "scout-drone": {
    hp: 680,
    sp: 60,
    attack: 105,
    defense: 35,
    speed: 110,
    evasion: 15,
    critRate: 0.1,
  },
  "raider-mech": {
    hp: 1150,
    sp: 90,
    attack: 135,
    defense: 65,
    speed: 78,
    evasion: 5,
    critRate: 0.2,
    critDamage: 1.8,
  },
  "siege-walker": {
    hp: 2500,
    sp: 120,
    attack: 175,
    defense: 105,
    speed: 52,
    evasion: 2,
    critRate: 0.12,
    armorPenetration: 0.2,
  },
}

/** 2. Bảng Phẩm Chất Nhiệm Vụ (Quest Quality Configuration) */
export type QuestQualityConfig = {
  id: QuestQuality
  name: string
  nameEn: string
  badgeColor: string
  borderColor: string
  difficultyMultiplier: number
  creditsMultiplier: number
  alloyMultiplier: number
  rarityWeights: Record<StarfrontItemRarity, number>
  stars: number
}

export const QUEST_QUALITY_CONFIG: Record<QuestQuality, QuestQualityConfig> = {
  standard: {
    id: "standard",
    name: "Tiêu Chuẩn",
    nameEn: "Standard",
    badgeColor: "text-slate-300 bg-slate-900/60 border-slate-600/50",
    borderColor: "border-slate-500/40",
    difficultyMultiplier: 1.0,
    creditsMultiplier: 1.0,
    alloyMultiplier: 1.0,
    rarityWeights: { common: 75, rare: 25, epic: 0, legendary: 0 },
    stars: 1,
  },
  veteran: {
    id: "veteran",
    name: "Tinh Nhuệ",
    nameEn: "Veteran",
    badgeColor: "text-emerald-300 bg-emerald-950/60 border-emerald-500/50",
    borderColor: "border-emerald-500/40",
    difficultyMultiplier: 1.15,
    creditsMultiplier: 1.25,
    alloyMultiplier: 1.25,
    rarityWeights: { common: 45, rare: 45, epic: 10, legendary: 0 },
    stars: 2,
  },
  elite: {
    id: "elite",
    name: "Tinh Anh",
    nameEn: "Elite",
    badgeColor: "text-cyan-300 bg-cyan-950/60 border-cyan-400/50",
    borderColor: "border-cyan-400/50",
    difficultyMultiplier: 1.3,
    creditsMultiplier: 1.55,
    alloyMultiplier: 1.5,
    rarityWeights: { common: 20, rare: 55, epic: 22, legendary: 3 },
    stars: 3,
  },
  heroic: {
    id: "heroic",
    name: "Anh Hùng",
    nameEn: "Heroic",
    badgeColor: "text-purple-300 bg-purple-950/60 border-purple-400/50",
    borderColor: "border-purple-400/50",
    difficultyMultiplier: 1.5,
    creditsMultiplier: 1.9,
    alloyMultiplier: 1.8,
    rarityWeights: { common: 5, rare: 40, epic: 45, legendary: 10 },
    stars: 4,
  },
  legendary: {
    id: "legendary",
    name: "Truyền Thuyết",
    nameEn: "Legendary",
    badgeColor: "text-amber-300 bg-amber-950/60 border-amber-400/60",
    borderColor: "border-amber-400/70",
    difficultyMultiplier: 1.75,
    creditsMultiplier: 2.4,
    alloyMultiplier: 2.2,
    rarityWeights: { common: 0, rare: 15, epic: 55, legendary: 30 },
    stars: 5,
  },
}

/** 3. Bảng Cấu Hình Biến Thể Kẻ Địch (9 Enemy Variants) */
export type EnemyVariantConfig = {
  id: EnemyVariantId
  encounterType: EnemyEncounterType
  name: string
  title: string
  desc: string
  hpMultiplier: number
  atkMultiplier: number
  defMultiplier: number
  spdBonus: number
  evasionBonus: number
  critRateBonus?: number
  armorPenBonus?: number
  initialEffectType?: "ecm-jamming" | "emergency-guard"
}

export const ENEMY_VARIANTS_CONFIG: Record<EnemyVariantId, EnemyVariantConfig> = {
  // SCOUT DRONE
  recon: {
    id: "recon",
    encounterType: "scout-drone",
    name: "Drone Trinh Sát Do Thám",
    title: "Trinh Sát Cơ Động",
    desc: "Phiên bản tiêu chuẩn, trinh sát bãi đá thiên thạch.",
    hpMultiplier: 1.0,
    atkMultiplier: 1.0,
    defMultiplier: 1.0,
    spdBonus: 0,
    evasionBonus: 0,
  },
  interceptor: {
    id: "interceptor",
    encounterType: "scout-drone",
    name: "Drone Đánh Chặn Siêu Tốc",
    title: "Tiêm Kích Không Gian",
    desc: "Gia tốc cực đại, né tránh đòn đánh xuất sắc, hỏa lực sắc bén nhưng mỏng giáp.",
    hpMultiplier: 0.85,
    atkMultiplier: 1.15,
    defMultiplier: 0.85,
    spdBonus: 15,
    evasionBonus: 10,
  },
  jammer: {
    id: "jammer",
    encounterType: "scout-drone",
    name: "Drone Gây Nhiễu Radar ECM",
    title: "Chuyên Gia Phá Sóng",
    desc: "Khởi đầu trận đấu bằng màn nhiễu điện từ bảo vệ bản thân và đồng đội.",
    hpMultiplier: 1.1,
    atkMultiplier: 0.9,
    defMultiplier: 1.15,
    spdBonus: 0,
    evasionBonus: 5,
    initialEffectType: "ecm-jamming",
  },

  // RAIDER MECH
  assault: {
    id: "assault",
    encounterType: "raider-mech",
    name: "Cơ Giáp Đột Kích Tiền Tuyến",
    title: "Chiến Binh Tiền Tuyến",
    desc: "Cơ giáp cân bằng, vũ trang tên lửa định hướng chuẩn mực.",
    hpMultiplier: 1.0,
    atkMultiplier: 1.0,
    defMultiplier: 1.0,
    spdBonus: 0,
    evasionBonus: 0,
  },
  berserker: {
    id: "berserker",
    encounterType: "raider-mech",
    name: "Cơ Giáp Cuồng Nộ Hỏa Lực",
    title: "Sát Thủ Cận Chiến",
    desc: "Bỏ bớt vỏ bọc giáp để tối đa hóa hỏa lực và sát thương bạo kích.",
    hpMultiplier: 0.9,
    atkMultiplier: 1.25,
    defMultiplier: 0.8,
    spdBonus: 5,
    evasionBonus: 0,
    critRateBonus: 0.1,
  },
  heavy: {
    id: "heavy",
    encounterType: "raider-mech",
    name: "Cơ Giáp Thiết Giáp Tiên Phong",
    title: "Bức Tường Bọc Thép",
    desc: "Trang bị giáp composite siêu dày, máu trâu và phòng thủ vượt bậc.",
    hpMultiplier: 1.3,
    atkMultiplier: 0.95,
    defMultiplier: 1.3,
    spdBonus: -8,
    evasionBonus: -3,
    critRateBonus: -0.05,
  },

  // SIEGE WALKER
  fortress: {
    id: "fortress",
    encounterType: "siege-walker",
    name: "Pháo Đài Công Thành Hạng Nặng",
    title: "Trùm Công Thành",
    desc: "Cỗ máy chiến tranh hạt nhân nguyên bản với hỏa lực hủy diệt.",
    hpMultiplier: 1.0,
    atkMultiplier: 1.0,
    defMultiplier: 1.0,
    spdBonus: 0,
    evasionBonus: 0,
  },
  annihilator: {
    id: "annihilator",
    encounterType: "siege-walker",
    name: "Pháo Đài Hủy Diệt Hạt Nhân",
    title: "Kẻ Tận Diệt Ngôi Sao",
    desc: "Tăng cường năng lượng pháo hạt nhân, đạn bắn xuyên thủng giáp trụ tối đa.",
    hpMultiplier: 0.95,
    atkMultiplier: 1.3,
    defMultiplier: 0.9,
    spdBonus: 0,
    evasionBonus: 0,
    armorPenBonus: 0.15,
  },
  colossus: {
    id: "colossus",
    encounterType: "siege-walker",
    name: "Pháo Đài Khổng Lồ Bất Hoại",
    title: "Pháo Đài Titan",
    desc: "Vỏ bọc titan siêu dày, mở màn trận chiến với lá chắn từ trường kiên cố.",
    hpMultiplier: 1.35,
    atkMultiplier: 0.9,
    defMultiplier: 1.35,
    spdBonus: -4,
    evasionBonus: 0,
    initialEffectType: "emergency-guard",
  },
}

/* ==========================================================================
   CÔNG THỨC TOÁN HỌC & HỆ SỐ SCALING
   ========================================================================== */

/** Hệ số quy đổi chỉ số kẻ địch theo Cấp Độ (Quest Level) */
export function getEnemyStatScale(level: number) {
  const safeLvl = Math.max(MIN_QUEST_LEVEL, Math.min(MAX_QUEST_LEVEL, level))
  const delta = safeLvl - 1

  return {
    hpScale: 1 + delta * 0.18,
    atkScale: 1 + delta * 0.12,
    defScale: 1 + delta * 0.1,
    spdScale: 1 + delta * 0.02,
    spScale: 1 + delta * 0.05,
  }
}

/** Tính lượng Credits cơ sở của nhiệm vụ theo Level */
export function getBaseQuestCredits(level: number): number {
  const safeLvl = Math.max(MIN_QUEST_LEVEL, Math.min(MAX_QUEST_LEVEL, level))
  return Math.round(150 + safeLvl * 120)
}

/** Tính lượng Alloy cơ sở của nhiệm vụ theo Level */
export function getBaseQuestAlloy(level: number): number {
  const safeLvl = Math.max(MIN_QUEST_LEVEL, Math.min(MAX_QUEST_LEVEL, level))
  return Math.max(1, Math.round(1 + safeLvl * 0.8))
}

/** Tính toàn bộ phần thưởng Credits & Alloy theo Level và Quality */
export function calculateQuestCurrencyRewards(level: number, quality: QuestQuality) {
  const qCfg = QUEST_QUALITY_CONFIG[quality] || QUEST_QUALITY_CONFIG.standard
  const baseCr = getBaseQuestCredits(level)
  const baseAlloy = getBaseQuestAlloy(level)

  const credits = Math.round(baseCr * qCfg.creditsMultiplier)
  const alloy = Math.max(1, Math.round(baseAlloy * qCfg.alloyMultiplier))

  return { credits, alloy }
}

/**
 * Tạo một đơn vị Kẻ địch đã được điều chỉnh độ khó theo:
 * Base Stats -> Variant Modifier -> Level Scaling -> Quality Multiplier
 */
export function createScaledEnemyUnit(
  encounterId: EnemyEncounterType,
  variantId: EnemyVariantId = "recon",
  level: number = 1,
  quality: QuestQuality = "standard",
): CombatUnit {
  const baseStats = ENEMY_BASE_STATS[encounterId] || ENEMY_BASE_STATS["scout-drone"]
  const variant = ENEMY_VARIANTS_CONFIG[variantId] || ENEMY_VARIANTS_CONFIG.recon
  const qCfg = QUEST_QUALITY_CONFIG[quality] || QUEST_QUALITY_CONFIG.standard
  const lScale = getEnemyStatScale(level)

  // Thứ tự áp dụng: Base * Variant * LevelScale * Quality
  const rawHp = baseStats.hp * variant.hpMultiplier * lScale.hpScale * qCfg.difficultyMultiplier
  const rawSp = baseStats.sp * lScale.spScale
  const rawAtk = baseStats.attack * variant.atkMultiplier * lScale.atkScale * qCfg.difficultyMultiplier
  const rawDef = baseStats.defense * variant.defMultiplier * lScale.defScale * qCfg.difficultyMultiplier
  const rawSpd = (baseStats.speed + variant.spdBonus) * lScale.spdScale

  // Ràng buộc giới hạn an toàn (Clamping)
  const finalHp = Math.max(100, Math.round(rawHp))
  const finalSp = Math.max(20, Math.round(rawSp))
  const finalAtk = Math.max(10, Math.round(rawAtk))
  const finalDef = Math.max(0, Math.round(rawDef))
  // Tốc độ kẻ địch kẹp trong [20..160] để không phá vỡ vòng lặp lượt đi
  const finalSpd = Math.max(20, Math.min(160, Math.round(rawSpd)))
  const finalEvasion = Math.max(
    0,
    Math.min(85, Math.round(baseStats.evasion + variant.evasionBonus)),
  )
  const finalCritRate = Math.max(
    0.05,
    Math.min(0.7, (baseStats.critRate || 0.1) + (variant.critRateBonus || 0)),
  )
  const finalArmorPen = Math.max(
    0,
    Math.min(0.7, (baseStats.armorPenetration || 0) + (variant.armorPenBonus || 0)),
  )

  // Lấy mẫu kỹ năng gốc từ ENEMIES_DATA
  const basePrototype = ENEMIES_DATA[encounterId] || ENEMIES_DATA["scout-drone"]
  const clonedSkills: CombatSkill[] = basePrototype.skills.map((s) => ({
    ...s,
    statusToApply: s.statusToApply ? { ...s.statusToApply } : undefined,
  }))

  const initialStatusEffects: StatusEffect[] = []
  if (variant.initialEffectType === "ecm-jamming") {
    initialStatusEffects.push({
      id: `init-ecm-${Date.now()}`,
      type: "ecm-jamming",
      name: "Trường Nhiễu ECM Ban Đầu",
      desc: "Tăng 25% né tránh trong 2 lượt đầu",
      duration: 2,
      value: 25,
      stackType: "refresh",
    })
  } else if (variant.initialEffectType === "emergency-guard") {
    initialStatusEffects.push({
      id: `init-guard-${Date.now()}`,
      type: "emergency-guard",
      name: "Khiên Khởi Động Titan",
      desc: "Giảm 35% sát thương trong 2 lượt đầu",
      duration: 2,
      value: 0.35,
      stackType: "override",
    })
  }

  return {
    id: `enemy-${encounterId}-${variant.id}-lvl${level}`,
    name: `${variant.name} [Lv.${level}]`,
    title: `${variant.title} (${qCfg.name})`,
    gearType: encounterId,
    archetype: basePrototype.archetype || "aggressive",
    bossPhase: encounterId === "siege-walker" ? 1 : undefined,
    isPlayer: false,
    hp: finalHp,
    maxHp: finalHp,
    sp: finalSp,
    maxSp: finalSp,
    attack: finalAtk,
    defense: finalDef,
    speed: finalSpd,
    evasion: finalEvasion,
    critRate: finalCritRate,
    critDamage: baseStats.critDamage || 1.7,
    armorPenetration: finalArmorPen,
    statusEffects: initialStatusEffects,
    skills: clonedSkills,
    skillCooldowns: {},
    avatar: basePrototype.avatar,
  }
}

/* ==========================================================================
   HỆ THỐNG RƠI ĐỒ TRANG BỊ & THUỘC TÍNH NGẪU NHIÊN (EQUIPMENT LOOT)
   ========================================================================== */

/** Trọng số ngẫu nhiên chọn độ hiếm rơi đồ dựa trên Quality */
export function rollRarityForQuality(
  quality: QuestQuality,
  rngSeed?: number,
): StarfrontItemRarity {
  const cfg = QUEST_QUALITY_CONFIG[quality] || QUEST_QUALITY_CONFIG.standard
  const roll = rngSeed !== undefined ? (rngSeed % 100) : Math.random() * 100

  let cumulative = 0
  for (const rarity of ["legendary", "epic", "rare", "common"] as StarfrontItemRarity[]) {
    const weight = cfg.rarityWeights[rarity] || 0
    cumulative += weight
    if (roll < cumulative) {
      return rarity
    }
  }

  return "common"
}

export type StatAffixKey = "attackBonus" | "defenseBonus" | "speedBonus" | "hpBonus" | "spBonus"

export const AFFIX_POOLS_BY_SLOT: Record<StarfrontItemSlot, { primary: StatAffixKey; secondaries: StatAffixKey[] }> = {
  weapon: {
    primary: "attackBonus",
    secondaries: ["speedBonus", "spBonus", "hpBonus"],
  },
  shield: {
    primary: "defenseBonus",
    secondaries: ["hpBonus", "spBonus", "speedBonus"],
  },
  engine: {
    primary: "speedBonus",
    secondaries: ["attackBonus", "spBonus", "hpBonus"],
  },
}

/** Tên tiền tố / hậu tố cho trang bị chế tác ngẫu nhiên */
const SCI_FI_NAMES: Record<StarfrontItemSlot, { roots: string[]; suffixes: string[] }> = {
  weapon: {
    roots: ["Pháo Xung Điện", "Thương Plasma", "Pháo Ray Hyper", "Súng Hạt Nhân", "Đại Bác Lượng Tử"],
    suffixes: ["Prime", "Nova", "Vortex", "Cực Hạn", "Phản Vật Chất"],
  },
  shield: {
    roots: ["Giáp Hợp Kim", "Khiên Nano", "Trường Lực Ion", "Tường Titan", "Màng Hào Quang"],
    suffixes: ["Gia Cố", "Tự Hàn", "Bất Hoại", "Aegis Prime", "Event Horizon"],
  },
  engine: {
    roots: ["Động Cơ Ion", "Bộ Đẩy Warp", "Lõi Phản Lực", "Động Cơ Dark Nova", "Cánh Bẻ Không Gian"],
    suffixes: ["Mach-5", "Quang Tốc", "Gia Tốc Cao", "Chronos", "Vô Ảnh"],
  },
}

/** Sinh chỉ số trang bị ngẫu nhiên theo ô đồ, độ hiếm và cấp độ */
export function generateRandomEquipmentStats(
  slot: StarfrontItemSlot,
  rarity: StarfrontItemRarity,
  level: number,
  rngSeed: number = 0,
): {
  attackBonus?: number
  defenseBonus?: number
  speedBonus?: number
  hpBonus?: number
  spBonus?: number
  name: string
  desc: string
  price: number
} {
  const safeLvl = Math.max(MIN_QUEST_LEVEL, Math.min(MAX_QUEST_LEVEL, level))
  const basePower = 1 + (safeLvl - 1) * 0.15

  const rarityMultMap: Record<StarfrontItemRarity, number> = {
    common: 1.0,
    rare: 1.35,
    epic: 1.75,
    legendary: 2.25,
  }
  const rarityMult = rarityMultMap[rarity]

  // Số lượng thuộc tính (affix count): Common: 1 (chỉ primary), Rare: 2, Epic: 3, Legendary: 4
  const numAffixesMap: Record<StarfrontItemRarity, number> = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
  }
  const targetAffixes = numAffixesMap[rarity]

  const pool = AFFIX_POOLS_BY_SLOT[slot]
  const stats: Record<StatAffixKey, number> = {
    attackBonus: 0,
    defenseBonus: 0,
    speedBonus: 0,
    hpBonus: 0,
    spBonus: 0,
  }

  // 1. Chỉ số chính (Primary stat) luôn có
  if (slot === "weapon") {
    stats.attackBonus = Math.max(10, Math.round((14 + (rngSeed % 5)) * basePower * rarityMult))
  } else if (slot === "shield") {
    stats.defenseBonus = Math.max(8, Math.round((10 + (rngSeed % 4)) * basePower * rarityMult))
  } else if (slot === "engine") {
    stats.speedBonus = Math.max(6, Math.round((8 + (rngSeed % 4)) * basePower * rarityMult))
  }

  // 2. Chỉ số phụ (Secondary stats)
  const availableSecondaries = [...pool.secondaries]
  let added = 1

  while (added < targetAffixes && availableSecondaries.length > 0) {
    const nextKey = availableSecondaries.shift()!
    if (nextKey === "attackBonus") {
      stats.attackBonus = Math.max(5, Math.round((6 + (rngSeed % 4)) * basePower * rarityMult))
    } else if (nextKey === "defenseBonus") {
      stats.defenseBonus = Math.max(4, Math.round((5 + (rngSeed % 3)) * basePower * rarityMult))
    } else if (nextKey === "speedBonus") {
      stats.speedBonus = Math.max(3, Math.round((4 + (rngSeed % 3)) * basePower * rarityMult))
    } else if (nextKey === "hpBonus") {
      stats.hpBonus = Math.max(50, Math.round((60 + (rngSeed % 30)) * basePower * rarityMult))
    } else if (nextKey === "spBonus") {
      stats.spBonus = Math.max(8, Math.round((10 + (rngSeed % 6)) * basePower * rarityMult))
    }
    added++
  }

  // Tạo tên Sci-Fi
  const naming = SCI_FI_NAMES[slot]
  const rootName = naming.roots[(safeLvl + (rngSeed % naming.roots.length)) % naming.roots.length]
  const suffixName = naming.suffixes[(rngSeed + safeLvl) % naming.suffixes.length]

  const rarityNameMap: Record<StarfrontItemRarity, string> = {
    common: "Thường",
    rare: "Hiếm",
    epic: "Sử Thi",
    legendary: "Huyền Thoại",
  }

  const name = `[Cấp ${safeLvl}] ${rootName} ${suffixName}`
  const desc = `Trang bị ${naming.roots[0].toLowerCase()} cấp ${safeLvl} phẩm chất ${rarityNameMap[rarity]}. Thiết kế tối ưu hóa cho chiến tranh không gian.`

  const statSum =
    stats.attackBonus * 12 +
    stats.defenseBonus * 10 +
    stats.speedBonus * 14 +
    Math.round(stats.hpBonus * 0.8) +
    stats.spBonus * 8
  const price = Math.round(100 + safeLvl * 80 + statSum * rarityMult * 0.4)

  return {
    attackBonus: stats.attackBonus || undefined,
    defenseBonus: stats.defenseBonus || undefined,
    speedBonus: stats.speedBonus || undefined,
    hpBonus: stats.hpBonus || undefined,
    spBonus: stats.spBonus || undefined,
    name,
    desc,
    price,
  }
}

/** Sinh phần thưởng trang bị cố định cho một nhiệm vụ */
export function generateEquipmentReward(
  level: number,
  quality: QuestQuality,
  preferredSlot?: StarfrontItemSlot,
  seed: number = 42,
): StarfrontItem {
  const rarity = rollRarityForQuality(quality, seed)
  const slots: StarfrontItemSlot[] = ["weapon", "shield", "engine"]
  const slot = preferredSlot || slots[seed % slots.length]

  const generated = generateRandomEquipmentStats(slot, rarity, level, seed)

  return {
    id: `loot_${slot}_l${level}_${quality}_${seed}`,
    slot,
    rarity,
    level,
    name: generated.name,
    desc: generated.desc,
    price: generated.price,
    attackBonus: generated.attackBonus,
    defenseBonus: generated.defenseBonus,
    speedBonus: generated.speedBonus,
    hpBonus: generated.hpBonus,
    spBonus: generated.spBonus,
    enhancementLevel: 0,
    statsRandomized: true,
  }
}

/** Khởi tạo thông tin xem trước phần thưởng cho một quest */
export function buildQuestRewardPreview(
  level: number,
  quality: QuestQuality,
  preferredSlot?: StarfrontItemSlot,
  seed: number = 42,
): QuestRewardPreview {
  const { credits, alloy } = calculateQuestCurrencyRewards(level, quality)
  const item = generateEquipmentReward(level, quality, preferredSlot, seed)

  return {
    credits,
    alloy,
    item,
    guaranteedRarity: item.rarity,
  }
}

/* ==========================================================================
   DANH MỤC 9 TUYẾN ẢI CHIẾN DỊCH CHUẨN ĐƯỢC NÂNG CẤP SCALING (PHASE 5.5)
   ========================================================================== */

export const STANDARD_CAMPAIGN_QUESTS: StarfrontQuest[] = [
  // SECTOR 1: Vành Đai Asteroid (Cấp 1 - 3)
  {
    id: "m1-1",
    sectorId: "sector-1",
    sectorName: "Vành Đai Asteroid",
    order: 1,
    title: "Nhiệm Vụ 1-1: Tuần Tra Biên Giới",
    desc: "Thiết bị radar phát hiện Drone Trinh Sát đang do thám căn cứ. Đánh chặn để bảo vệ trạm không gian.",
    level: 1,
    quality: "standard",
    encounterType: "scout-drone",
    variantId: "recon",
    difficultyRating: "Dễ",
    previewReward: buildQuestRewardPreview(1, "standard", "weapon", 101),
  },
  {
    id: "m1-2",
    sectorId: "sector-1",
    sectorName: "Vành Đai Asteroid",
    order: 2,
    title: "Nhiệm Vụ 1-2: Tín Hiệu Cầu Cứu SOS",
    desc: "Tàu vận tải bị tấn công bởi phi đội Drone Đánh Chặn Siêu Tốc cơ động. Hãy can thiệp kịp thời.",
    level: 2,
    quality: "standard",
    encounterType: "scout-drone",
    variantId: "interceptor",
    difficultyRating: "Trung Bình",
    reqMissionId: "m1-1",
    previewReward: buildQuestRewardPreview(2, "standard", "shield", 102),
  },
  {
    id: "m1-3",
    sectorId: "sector-1",
    sectorName: "Vành Đai Asteroid",
    order: 3,
    title: "Nhiệm Vụ 1-3: Phá Vỡ Phong Tỏa Mỏ Quặng",
    desc: "Lực lượng Cơ Giáp Đột Kích đã đổ bộ thiết lập chốt chặn. Hạ gục chỉ huy đột kích để giải phóng tuyến mỏ.",
    level: 3,
    quality: "veteran",
    encounterType: "raider-mech",
    variantId: "assault",
    difficultyRating: "Thử Thách",
    reqMissionId: "m1-2",
    previewReward: buildQuestRewardPreview(3, "veteran", "engine", 103),
  },

  // SECTOR 2: Tinh Vân Plasma (Cấp 4 - 6)
  {
    id: "m2-1",
    sectorId: "sector-2",
    sectorName: "Tinh Vân Plasma",
    order: 1,
    title: "Nhiệm Vụ 2-1: Đột Kích Vùng Bão Ion",
    desc: "Xuyên qua màn bão từ, tiêu diệt cơ giáp cuồng nộ hỏa lực của quân địch trước khi chúng báo động toàn khu vực.",
    level: 4,
    quality: "veteran",
    encounterType: "raider-mech",
    variantId: "berserker",
    difficultyRating: "Khó",
    reqMissionId: "m1-3",
    previewReward: buildQuestRewardPreview(4, "veteran", "weapon", 201),
  },
  {
    id: "m2-2",
    sectorId: "sector-2",
    sectorName: "Tinh Vân Plasma",
    order: 2,
    title: "Nhiệm Vụ 2-2: Cắt Đứt Đường Dẫn Năng Lượng",
    desc: "Địch đang vận chuyển tinh thể năng lượng cao với đội hình Thiết Giáp Tiên Phong cực kỳ kiên cố.",
    level: 5,
    quality: "elite",
    encounterType: "raider-mech",
    variantId: "heavy",
    difficultyRating: "Khó (Tinh Anh)",
    reqMissionId: "m2-1",
    previewReward: buildQuestRewardPreview(5, "elite", "shield", 202),
  },
  {
    id: "m2-3",
    sectorId: "sector-2",
    sectorName: "Tinh Vân Plasma",
    order: 3,
    title: "Nhiệm Vụ 2-3: Quái Vật Thép Khởi Động",
    desc: "Một Pháo Đài Công Thành khổng lồ xuất hiện tại trung tâm tinh vân! Dùng hỏa lực tối đa đánh sập nó.",
    level: 6,
    quality: "elite",
    encounterType: "siege-walker",
    variantId: "fortress",
    difficultyRating: "Cực Hạn (Boss)",
    reqMissionId: "m2-2",
    previewReward: buildQuestRewardPreview(6, "elite", "weapon", 203),
  },

  // SECTOR 3: Pháo Đài Bastion Core (Cấp 7 - 10)
  {
    id: "m3-1",
    sectorId: "sector-3",
    sectorName: "Bastion Core",
    order: 1,
    title: "Nhiệm Vụ 3-1: Công Phá Cổng Ngoài",
    desc: "Đột kích qua lớp lưới gây nhiễu ECM dày đặc và tiêu diệt phi đội trinh sát bảo vệ cổng chính.",
    level: 7,
    quality: "heroic",
    encounterType: "scout-drone",
    variantId: "jammer",
    difficultyRating: "Anh Hùng",
    reqMissionId: "m2-3",
    previewReward: buildQuestRewardPreview(7, "heroic", "engine", 301),
  },
  {
    id: "m3-2",
    sectorId: "sector-3",
    sectorName: "Bastion Core",
    order: 2,
    title: "Nhiệm Vụ 3-2: Đại Pháo Trùng Điệp",
    desc: "Pháo đài hủy diệt hạt nhân xả mưa đạn pháo hạt nhân công phá cực lớn giáp trụ.",
    level: 8,
    quality: "heroic",
    encounterType: "siege-walker",
    variantId: "annihilator",
    difficultyRating: "Tử Thần",
    reqMissionId: "m3-1",
    previewReward: buildQuestRewardPreview(8, "heroic", "shield", 302),
  },
  {
    id: "m3-3",
    sectorId: "sector-3",
    sectorName: "Bastion Core",
    order: 3,
    title: "Nhiệm Vụ 3-3: Quyết Chiến Trùm Tối Thượng",
    desc: "Tổng tấn công đánh sập Pháo Đài Khổng Lồ Bất Hoại tại lõi Bastion! Chiến thắng mang lại trang bị tối cao!",
    level: 9,
    quality: "legendary",
    encounterType: "siege-walker",
    variantId: "colossus",
    difficultyRating: "Truyền Thuyết (Boss Tối Thượng)",
    reqMissionId: "m3-2",
    previewReward: buildQuestRewardPreview(9, "legendary", "weapon", 303),
  },
]
