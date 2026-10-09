import { INITIAL_STARFRONT_PROGRESSION } from "./progression"
import type { StarfrontGearId, StarfrontItem, StarfrontProgression } from "./types"

const STORAGE_KEY_V2 = "STARFRONT_SAVE_DATA_V2"
const STORAGE_KEY_V1 = "STARFRONT_SAVE_DATA_V1"

/** Tải dữ liệu tiến trình đã lưu từ localStorage (an toàn với SSR, chống crash và hỗ trợ migration v1 -> v2) */
export function loadStarfrontProgression(): StarfrontProgression {
  if (typeof window === "undefined") {
    return INITIAL_STARFRONT_PROGRESSION
  }

  try {
    // 1. Thử đọc dữ liệu v2
    let raw = localStorage.getItem(STORAGE_KEY_V2)
    let isMigrationFromV1 = false

    // 2. Nếu chưa có v2, kiểm tra xem có dữ liệu v1 cũ không để di chuyển an toàn
    if (!raw) {
      raw = localStorage.getItem(STORAGE_KEY_V1)
      if (raw) isMigrationFromV1 = true
    }

    if (!raw) {
      return INITIAL_STARFRONT_PROGRESSION
    }

    const parsed = JSON.parse(raw) as Partial<StarfrontProgression>

    // Xác thực cấu trúc đối tượng cơ bản
    if (!parsed || typeof parsed !== "object") {
      console.warn("[STARFRONT] Dữ liệu lưu không hợp lệ, khởi tạo lại mặc định.")
      return INITIAL_STARFRONT_PROGRESSION
    }

    // Đảm bảo các trường chỉ số cơ bản luôn hợp lệ
    const level = Math.max(1, Number(parsed.level) || 1)
    const exp = Math.max(0, Number(parsed.exp) || 0)
    const credits = Math.max(0, Number(parsed.credits) || 0)
    const battlesWon = Math.max(0, Number(parsed.battlesWon) || 0)
    const battlesLost = Math.max(0, Number(parsed.battlesLost) || 0)

    // Khôi phục kho đồ và trang bị hợp lệ
    let inventory: StarfrontItem[] = Array.isArray(parsed.inventory) && parsed.inventory.length > 0
      ? [...parsed.inventory]
      : [...INITIAL_STARFRONT_PROGRESSION.inventory]

    // Bổ sung các vật phẩm khởi đầu nếu chưa có trong kho
    for (const starter of INITIAL_STARFRONT_PROGRESSION.inventory) {
      if (!inventory.some((it) => it.id === starter.id)) {
        inventory.push(starter)
      }
    }

    const equipped = {
      weapon: parsed.equipped?.weapon ?? "wpn_pulse_carbine",
      shield: parsed.equipped?.shield ?? "shd_composite_plate",
      engine: parsed.equipped?.engine ?? "eng_ion_booster",
    }

    // Phase 3 trường dữ liệu mới: Active Gear, Unlocked Gears, Completed Missions
    const validGearIds: StarfrontGearId[] = ["vanguard", "falcon", "aegis"]
    const activeGearId: StarfrontGearId = validGearIds.includes(parsed.activeGearId as StarfrontGearId)
      ? (parsed.activeGearId as StarfrontGearId)
      : "vanguard"

    const unlockedGears: StarfrontGearId[] = Array.isArray(parsed.unlockedGears) && parsed.unlockedGears.length > 0
      ? (parsed.unlockedGears.filter((g) => validGearIds.includes(g as StarfrontGearId)) as StarfrontGearId[])
      : ["vanguard", "falcon", "aegis"]

    const completedMissions: string[] = Array.isArray(parsed.completedMissions)
      ? parsed.completedMissions
      : []

    const migrated: StarfrontProgression = {
      version: 2,
      level,
      exp,
      credits,
      activeGearId,
      unlockedGears,
      inventory,
      equipped,
      completedMissions,
      battlesWon,
      battlesLost,
    }

    // Nếu vừa di chuyển từ v1, lưu ngay vào v2 để nâng cấp bền vững
    if (isMigrationFromV1) {
      saveStarfrontProgression(migrated)
    }

    return migrated
  } catch (error) {
    console.error("[STARFRONT] Lỗi khi đọc dữ liệu lưu từ localStorage:", error)
    return INITIAL_STARFRONT_PROGRESSION
  }
}

/** Tự động lưu tiến trình game vào localStorage */
export function saveStarfrontProgression(progression: StarfrontProgression): boolean {
  if (typeof window === "undefined") return false

  try {
    const payload = JSON.stringify({ ...progression, version: 2 })
    localStorage.setItem(STORAGE_KEY_V2, payload)
    return true
  } catch (error) {
    console.error("[STARFRONT] Lỗi khi lưu dữ liệu tiến trình vào localStorage:", error)
    return false
  }
}

/** Xóa bỏ tiến trình đã lưu và đưa về trạng thái khởi tạo */
export function resetStarfrontProgression(): StarfrontProgression {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_V2)
      localStorage.removeItem(STORAGE_KEY_V1)
    } catch (e) {
      console.error("[STARFRONT] Lỗi khi xóa save:", e)
    }
  }
  return { ...INITIAL_STARFRONT_PROGRESSION }
}
