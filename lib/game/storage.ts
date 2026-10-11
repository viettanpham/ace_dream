import { INITIAL_STARFRONT_PROGRESSION } from "./progression"
import {
  createInitialPilotSynergySkill,
  DEFAULT_GLOBAL_ADMIN_CONFIG,
  normalizePilotSynergySkill,
} from "./pilot-skill-engine"
import type {
  GlobalAdminConfig,
  PilotSynergySkillInstance,
} from "./pilot-skill-types"
import type {
  ActivePairingState,
  PilotProgressionData,
  StarfrontGearId,
  StarfrontItem,
  StarfrontProgression,
} from "./types"

export const STORAGE_KEY_V4 = "STARFRONT_SAVE_DATA_V4"
export const STORAGE_KEY_V3 = "STARFRONT_SAVE_DATA_V3"
export const STORAGE_KEY_V2 = "STARFRONT_SAVE_DATA_V2"
export const STORAGE_KEY_V1 = "STARFRONT_SAVE_DATA_V1"

const VALID_PILOT_IDS = ["marcus", "valentine", "alviss", "eric"]
const VALID_GEAR_IDS: StarfrontGearId[] = ["vanguard", "falcon", "aegis"]

/**
 * Di chuyển an toàn mọi định dạng dữ liệu (v1, v2 hoặc chưa chuẩn hóa) lên Schema v3
 */
export function migrateProgressionToV3(parsed: any): StarfrontProgression {
  if (!parsed || typeof parsed !== "object") {
    return { ...INITIAL_STARFRONT_PROGRESSION, version: 3 }
  }

  // Đảm bảo các trường chỉ số cơ bản luôn hợp lệ
  const level = Math.max(1, Number(parsed.level) || 1)
  const exp = Math.max(0, Number(parsed.exp) || 0)
  const credits = Math.max(0, Number(parsed.credits) || 0)
  const alloy = Math.max(0, Number(parsed.alloy !== undefined ? parsed.alloy : 25))
  const freeShopRefreshes = Math.max(
    0,
    Number(parsed.freeShopRefreshes !== undefined ? parsed.freeShopRefreshes : 1),
  )
  const battlesWon = Math.max(0, Number(parsed.battlesWon) || 0)
  const battlesLost = Math.max(0, Number(parsed.battlesLost) || 0)

  // Khôi phục kho đồ và trang bị hợp lệ, bảo đảm enhancementLevel luôn có mặt và nằm trong khoảng [0, 10]
  let inventory: StarfrontItem[] = Array.isArray(parsed.inventory) && parsed.inventory.length > 0
    ? parsed.inventory.map((it: any) => ({
        ...it,
        level: Math.max(1, Math.min(15, Number(it?.level) || 1)),
        enhancementLevel: Math.max(0, Math.min(10, Number(it?.enhancementLevel) || 0)),
        statsRandomized: Boolean(it?.statsRandomized),
      }))
    : [...INITIAL_STARFRONT_PROGRESSION.inventory]

  // Bổ sung các vật phẩm khởi đầu nếu chưa có trong kho
  for (const starter of INITIAL_STARFRONT_PROGRESSION.inventory) {
    if (!inventory.some((it) => it.id === starter.id)) {
      inventory.push({
        ...starter,
        level: starter.level || 1,
        enhancementLevel: starter.enhancementLevel || 0,
      })
    }
  }

  const equipped = {
    weapon: parsed.equipped?.weapon ?? "wpn_pulse_carbine",
    shield: parsed.equipped?.shield ?? "shd_composite_plate",
    engine: parsed.equipped?.engine ?? "eng_ion_booster",
  }

  // Active Gear, Unlocked Gears, Completed Missions
  const activeGearId: StarfrontGearId = VALID_GEAR_IDS.includes(parsed.activeGearId as StarfrontGearId)
    ? (parsed.activeGearId as StarfrontGearId)
    : "vanguard"

  const unlockedGears: StarfrontGearId[] = Array.isArray(parsed.unlockedGears) && parsed.unlockedGears.length > 0
    ? (parsed.unlockedGears.filter((g: any) => VALID_GEAR_IDS.includes(g as StarfrontGearId)) as StarfrontGearId[])
    : ["vanguard", "falcon", "aegis"]

  const completedMissions: string[] = Array.isArray(parsed.completedMissions)
    ? parsed.completedMissions.filter((m: any) => typeof m === "string")
    : []

  const activeQuest = parsed.activeQuest && typeof parsed.activeQuest === "object"
    ? parsed.activeQuest
    : null

  const completedQuestIds: string[] = Array.isArray(parsed.completedQuestIds)
    ? parsed.completedQuestIds.filter((q: any) => typeof q === "string")
    : []

  const currentShopItems = Array.isArray(parsed.currentShopItems)
    ? parsed.currentShopItems
    : undefined

  const sideQuests = Array.isArray(parsed.sideQuests)
    ? parsed.sideQuests
    : undefined

  const missionOverrides = parsed.missionOverrides && typeof parsed.missionOverrides === "object"
    ? parsed.missionOverrides
    : undefined

  return {
    version: 3,
    level,
    exp,
    credits,
    alloy,
    freeShopRefreshes,
    activeGearId,
    unlockedGears,
    inventory,
    equipped,
    completedMissions,
    battlesWon,
    battlesLost,
    activeQuest,
    completedQuestIds,
    currentShopItems,
    sideQuests,
    missionOverrides,
  }
}

/**
 * Di chuyển an toàn lên Schema v4 (Phase 5.8: Hệ Thống Nhân Vật & Cơ Giáp)
 * - Khởi tạo đầy đủ danh sách 4 phi công (Marcus, Valentine, Alviss, Eric)
 * - Khởi tạo cặp đôi activePairing mặc định (Marcus + activeGearId)
 * - Trạng thái khóa an toàn: isLocked = false cho người chơi mới hoặc vừa migrate để không bị kẹt
 * - Bảo toàn 100% tài nguyên, cấp độ, trang bị, nhiệm vụ từ v1, v2, v3
 */
export function migrateProgressionToV4(parsed: any): StarfrontProgression {
  const baseV3 = migrateProgressionToV3(parsed)

  // 1. Chuẩn hóa hồ sơ 4 phi công
  const pilots: Record<string, PilotProgressionData> = {}
  for (const pilotId of VALID_PILOT_IDS) {
    const existing = parsed?.pilots?.[pilotId]
    if (existing && typeof existing === "object") {
      const pLevel = Math.max(1, Number(existing.level) || 1)
      const pExp = Math.max(0, Number(existing.exp) || 0)
      const allocated = existing.allocatedStats || {}
      pilots[pilotId] = {
        id: pilotId,
        level: pLevel,
        exp: pExp,
        allocatedStats: {
          attack: Math.max(0, Number(allocated.attack) || 0),
          defense: Math.max(0, Number(allocated.defense) || 0),
          agility: Math.max(0, Number(allocated.agility) || 0),
          shield: Math.max(0, Number(allocated.shield) || 0),
          tactical: Math.max(0, Number(allocated.tactical) || 0),
        },
        availablePoints: Math.max(0, Number(existing.availablePoints) || 0),
      }
    } else {
      // Khởi tạo phi công mới ở Cấp 1, 0 EXP, 0 điểm cộng
      pilots[pilotId] = {
        id: pilotId,
        level: 1,
        exp: 0,
        allocatedStats: {
          attack: 0,
          defense: 0,
          agility: 0,
          shield: 0,
          tactical: 0,
        },
        availablePoints: 0,
      }
    }
  }

  // 2. Chuẩn hóa trạng thái cặp đôi activePairing
  const rawPairing = parsed?.activePairing
  const pilotId = rawPairing && VALID_PILOT_IDS.includes(rawPairing.pilotId)
    ? rawPairing.pilotId
    : "marcus"

  const gearId: StarfrontGearId = rawPairing && VALID_GEAR_IDS.includes(rawPairing.gearId)
    ? rawPairing.gearId
    : baseV3.activeGearId

  const isLocked = Boolean(rawPairing?.isLocked)
  const completedMissionsCount = Math.max(
    0,
    Number(rawPairing?.unlockProgress?.completedMissions) || 0,
  )
  const wonBattlesCount = Math.max(
    0,
    Number(rawPairing?.unlockProgress?.wonBattles) || 0,
  )

  const activePairing: ActivePairingState = {
    pilotId,
    gearId,
    isLocked,
    unlockProgress: {
      completedMissions: completedMissionsCount,
      wonBattles: wonBattlesCount,
      targetCount: 5,
    },
  }

  // 3. Khởi tạo & Chuẩn hóa Skill Liên Hoàn độc lập theo từng phi công (Phase 5.9)
  const globalAdminConfig: GlobalAdminConfig = parsed?.globalAdminConfig
    ? {
        globalMaxPilotLevel: Math.max(1, Number(parsed.globalAdminConfig.globalMaxPilotLevel) || 120),
        globalMaxSkillLevel: Math.max(1, Number(parsed.globalAdminConfig.globalMaxSkillLevel) || 30),
        priorityMode: parsed.globalAdminConfig.priorityMode === "GLOBAL_PRIORITY" ? "GLOBAL_PRIORITY" : "TEMPLATE_OVERRIDE",
        lastModified: Number(parsed.globalAdminConfig.lastModified) || Date.now(),
        templateOverrides: parsed.globalAdminConfig.templateOverrides || {},
      }
    : { ...DEFAULT_GLOBAL_ADMIN_CONFIG }

  const pilotSkills: Record<string, PilotSynergySkillInstance> = {}
  for (const pId of VALID_PILOT_IDS) {
    const existingSkill = parsed?.pilotSkills?.[pId]
    const pLvl = pilots[pId]?.level || 1
    if (existingSkill && typeof existingSkill === "object" && existingSkill.templateId) {
      pilotSkills[pId] = normalizePilotSynergySkill(existingSkill, globalAdminConfig)
    } else {
      pilotSkills[pId] = createInitialPilotSynergySkill(pId, pLvl, globalAdminConfig)
    }
  }

  const rerollTokens = Math.max(0, Number(parsed?.rerollTokens !== undefined ? parsed.rerollTokens : 5))

  return {
    ...baseV3,
    version: 4,
    activeGearId: gearId,
    activePairing,
    pilots,
    gearSlotLevels: parsed?.gearSlotLevels,
    pilotSkills,
    globalAdminConfig,
    rerollTokens,
  }
}

/** Tải dữ liệu tiến trình đã lưu từ localStorage (an toàn với SSR, chống crash và hỗ trợ migration v1..v3 -> v4) */
export function loadStarfrontProgression(): StarfrontProgression {
  if (typeof window === "undefined") {
    return { ...INITIAL_STARFRONT_PROGRESSION, version: 4 }
  }

  try {
    // 1. Thử đọc dữ liệu v4
    let raw = localStorage.getItem(STORAGE_KEY_V4)
    let needsMigration = false

    // 2. Nếu chưa có v4, kiểm tra xem có dữ liệu v3 không để di chuyển tự động
    if (!raw) {
      raw = localStorage.getItem(STORAGE_KEY_V3)
      if (raw) needsMigration = true
    }

    // 3. Nếu chưa có v3, kiểm tra v2
    if (!raw) {
      raw = localStorage.getItem(STORAGE_KEY_V2)
      if (raw) needsMigration = true
    }

    // 4. Nếu chưa có v2, kiểm tra v1
    if (!raw) {
      raw = localStorage.getItem(STORAGE_KEY_V1)
      if (raw) needsMigration = true
    }

    if (!raw) {
      return { ...INITIAL_STARFRONT_PROGRESSION, version: 4 }
    }

    const parsed = JSON.parse(raw)
    const migrated = migrateProgressionToV4(parsed)

    // Nếu vừa di chuyển từ phiên bản cũ hoặc parsed chưa phải v4, lưu ngay vào v4
    if (needsMigration || parsed?.version !== 4) {
      saveStarfrontProgression(migrated)
    }

    return migrated
  } catch (error) {
    console.error("[STARFRONT] Lỗi khi đọc dữ liệu lưu từ localStorage:", error)
    return { ...INITIAL_STARFRONT_PROGRESSION, version: 4 }
  }
}

/** Tự động lưu tiến trình game vào localStorage với Schema v4 */
export function saveStarfrontProgression(progression: StarfrontProgression): boolean {
  if (typeof window === "undefined") return false

  try {
    const payload = JSON.stringify({ ...progression, version: 4 })
    localStorage.setItem(STORAGE_KEY_V4, payload)
    return true
  } catch (error) {
    console.error("[STARFRONT] Lỗi khi lưu dữ liệu tiến trình vào localStorage:", error)
    return false
  }
}

/** Xóa bỏ tiến trình đã lưu trên toàn bộ các phiên bản và đưa về trạng thái khởi tạo v4 */
export function resetStarfrontProgression(): StarfrontProgression {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_V4)
      localStorage.removeItem(STORAGE_KEY_V3)
      localStorage.removeItem(STORAGE_KEY_V2)
      localStorage.removeItem(STORAGE_KEY_V1)
    } catch (e) {
      console.error("[STARFRONT] Lỗi khi xóa save:", e)
    }
  }
  return { ...INITIAL_STARFRONT_PROGRESSION, version: 4 }
}
