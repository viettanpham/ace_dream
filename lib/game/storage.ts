import { INITIAL_STARFRONT_PROGRESSION, SAMPLE_STARFRONT_ITEMS } from "./progression"
import type { StarfrontItem, StarfrontProgression } from "./types"

const STORAGE_KEY = "STARFRONT_SAVE_DATA_V1"

/** Tải dữ liệu tiến trình đã lưu từ localStorage (an toàn với SSR và chống crash) */
export function loadStarfrontProgression(): StarfrontProgression {
  if (typeof window === "undefined") {
    return INITIAL_STARFRONT_PROGRESSION
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return INITIAL_STARFRONT_PROGRESSION
    }

    const parsed = JSON.parse(raw) as Partial<StarfrontProgression>

    // Xác thực cấu trúc schema cơ bản
    if (!parsed || typeof parsed !== "object" || parsed.version !== 1) {
      console.warn("[STARFRONT] Dữ liệu lưu cũ hoặc không tương thích, thiết lập lại mặc định.")
      return INITIAL_STARFRONT_PROGRESSION
    }

    // Đảm bảo các trường bắt buộc luôn hợp lệ
    const level = Math.max(1, Number(parsed.level) || 1)
    const exp = Math.max(0, Number(parsed.exp) || 0)
    const credits = Math.max(0, Number(parsed.credits) || 0)
    const battlesWon = Math.max(0, Number(parsed.battlesWon) || 0)
    const battlesLost = Math.max(0, Number(parsed.battlesLost) || 0)

    // Khôi phục kho đồ và trang bị hợp lệ
    let inventory: StarfrontItem[] = Array.isArray(parsed.inventory) && parsed.inventory.length > 0
      ? [...parsed.inventory]
      : [...INITIAL_STARFRONT_PROGRESSION.inventory]

    // Bổ sung các vật phẩm mẫu nếu chưa có trong kho đồ để kiểm thử
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

    return {
      version: 1,
      level,
      exp,
      credits,
      inventory,
      equipped,
      battlesWon,
      battlesLost,
    }
  } catch (error) {
    console.error("[STARFRONT] Lỗi khi đọc dữ liệu lưu từ localStorage:", error)
    return INITIAL_STARFRONT_PROGRESSION
  }
}

/** Tự động lưu tiến trình game vào localStorage */
export function saveStarfrontProgression(progression: StarfrontProgression): boolean {
  if (typeof window === "undefined") return false

  try {
    const payload = JSON.stringify(progression)
    localStorage.setItem(STORAGE_KEY, payload)
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
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error("[STARFRONT] Lỗi khi xóa save:", e)
    }
  }
  return { ...INITIAL_STARFRONT_PROGRESSION }
}
