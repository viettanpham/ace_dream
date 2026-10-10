import { INITIAL_STARFRONT_PROGRESSION } from "./progression"
import type { StarfrontGearId, StarfrontItem, StarfrontProgression } from "./types"

export const STORAGE_KEY_V3 = "STARFRONT_SAVE_DATA_V3"
export const STORAGE_KEY_V2 = "STARFRONT_SAVE_DATA_V2"
export const STORAGE_KEY_V1 = "STARFRONT_SAVE_DATA_V1"

/**
 * Di chuyển an toàn mọi định dạng dữ liệu (v1, v2 hoặc chưa chuẩn hóa) lên Schema v3:
 * - Bảo toàn 100% Cấp độ, EXP, Credits, Hợp Kim (Alloy), Số trận thắng/thua, Nhiệm vụ đã hoàn thành.
 * - Bảo toàn lựa chọn Gear (activeGearId: Vanguard, Falcon, Aegis) và danh sách Gear đã mở khóa.
 * - Chuẩn hóa toàn bộ trang bị trong kho đồ: Tự động gán enhancementLevel = 0 cho các món cũ nếu thiếu,
 *   bảo toàn enhancementLevel nếu đã có (+1 đến +10).
 * - Bổ sung starter items nếu kho đồ bị thiếu trang bị cơ bản.
 * - Gán schema version: 3.
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
  const validGearIds: StarfrontGearId[] = ["vanguard", "falcon", "aegis"]
  const activeGearId: StarfrontGearId = validGearIds.includes(parsed.activeGearId as StarfrontGearId)
    ? (parsed.activeGearId as StarfrontGearId)
    : "vanguard"

  const unlockedGears: StarfrontGearId[] = Array.isArray(parsed.unlockedGears) && parsed.unlockedGears.length > 0
    ? (parsed.unlockedGears.filter((g: any) => validGearIds.includes(g as StarfrontGearId)) as StarfrontGearId[])
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
  }
}

/** Tải dữ liệu tiến trình đã lưu từ localStorage (an toàn với SSR, chống crash và hỗ trợ migration v1/v2 -> v3) */
export function loadStarfrontProgression(): StarfrontProgression {
  if (typeof window === "undefined") {
    return { ...INITIAL_STARFRONT_PROGRESSION, version: 3 }
  }

  try {
    // 1. Thử đọc dữ liệu v3
    let raw = localStorage.getItem(STORAGE_KEY_V3)
    let needsMigration = false

    // 2. Nếu chưa có v3, kiểm tra xem có dữ liệu v2 không để di chuyển tự động
    if (!raw) {
      raw = localStorage.getItem(STORAGE_KEY_V2)
      if (raw) needsMigration = true
    }

    // 3. Nếu chưa có v2, kiểm tra xem có dữ liệu v1 cũ không
    if (!raw) {
      raw = localStorage.getItem(STORAGE_KEY_V1)
      if (raw) needsMigration = true
    }

    if (!raw) {
      return { ...INITIAL_STARFRONT_PROGRESSION, version: 3 }
    }

    const parsed = JSON.parse(raw)
    const migrated = migrateProgressionToV3(parsed)

    // Nếu vừa di chuyển từ phiên bản cũ (v1 hoặc v2) hoặc parsed chưa phải v3, lưu ngay vào v3
    if (needsMigration || parsed?.version !== 3) {
      saveStarfrontProgression(migrated)
    }

    return migrated
  } catch (error) {
    console.error("[STARFRONT] Lỗi khi đọc dữ liệu lưu từ localStorage:", error)
    return { ...INITIAL_STARFRONT_PROGRESSION, version: 3 }
  }
}

/** Tự động lưu tiến trình game vào localStorage với Schema v3 */
export function saveStarfrontProgression(progression: StarfrontProgression): boolean {
  if (typeof window === "undefined") return false

  try {
    const payload = JSON.stringify({ ...progression, version: 3 })
    localStorage.setItem(STORAGE_KEY_V3, payload)
    return true
  } catch (error) {
    console.error("[STARFRONT] Lỗi khi lưu dữ liệu tiến trình vào localStorage:", error)
    return false
  }
}

/** Xóa bỏ tiến trình đã lưu trên toàn bộ các phiên bản và đưa về trạng thái khởi tạo v3 */
export function resetStarfrontProgression(): StarfrontProgression {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_V3)
      localStorage.removeItem(STORAGE_KEY_V2)
      localStorage.removeItem(STORAGE_KEY_V1)
    } catch (e) {
      console.error("[STARFRONT] Lỗi khi xóa save:", e)
    }
  }
  return { ...INITIAL_STARFRONT_PROGRESSION, version: 3 }
}
