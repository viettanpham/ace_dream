/**
 * STARFRONT WORLD — Simulator & Generator Configuration (Phase 6.13)
 * Quản lý cấu hình tốc độ thế giới thời gian thực và các tham số sinh Event/Quest.
 *
 * Mặc định:
 * - 1 ngày game = 300 giây thực (5 phút).
 * - Các preset hỗ trợ: 15s (Test nhanh), 30s, 60s, 300s.
 * - 3 Tier Event: Small (Nhỏ), Medium (Trung bình), Large (Lớn).
 * - Max tổng event active: 100.
 */

import type { EventStrategyPolicyConfig, TierStrategyPreference } from "./types"

export type SimulationSpeedPreset = 15 | 30 | 60 | 300

export interface EventTierConfig {
  enabled: boolean
  minIntervalDays: number // Chu kỳ sinh min (ngày game)
  maxIntervalDays: number // Chu kỳ sinh max (ngày game)
  minLifetimeDays: number // Thời gian tồn tại min (ngày game)
  maxLifetimeDays: number // Thời gian tồn tại max (ngày game)
  maxActive: number       // Giới hạn số lượng active cùng lúc cho tier này
}

export interface WorldGeneratorConfig {
  small: EventTierConfig
  medium: EventTierConfig
  large: EventTierConfig
  maxGlobalActive: number // Giới hạn tổng số lượng event active toàn thiên hà (mặc định: 100)
}

export { type EventStrategyPolicyConfig, type TierStrategyPreference }

/**
 * Cấu hình mặc định cho chính sách lựa chọn chiến lược sự kiện (Phase 6.15)
 * Ưu tiên: 1. System Auto Strategy -> 2. Default Strategy Fallback -> 3. Player Choice
 */
export const DEFAULT_EVENT_STRATEGY_POLICY: EventStrategyPolicyConfig = {
  systemAutoEnabled: true,
  defaultFallbackEnabled: true,
  playerChoiceFallbackEnabled: true,
  tierPolicies: {
    small: "system_auto",
    medium: "system_auto",
    large: "system_auto",
  },
}

export interface WorldSimulatorConfig {
  speedSeconds: number   // 1 ngày game = X giây thực (Mặc định: 300)
  isPaused: boolean       // Trạng thái chạy / tạm dừng (Mặc định: false)
  generator: WorldGeneratorConfig
  pausedFraction?: number // Tỷ lệ hoàn thành trong ngày khi tạm dừng (0.0 .. 0.999)
  strategyPolicy: EventStrategyPolicyConfig // Chính sách lựa chọn chiến lược sự kiện (Phase 6.15)
}

/**
 * Cấu hình mặc định cho từng Tier theo bảng đặc tả Phase 6.13:
 * - Nhỏ: chu kỳ 0.1–3 ngày, tồn tại 0.5–15 ngày, max 30
 * - Trung bình: chu kỳ 1–10 ngày, tồn tại 5–45 ngày, max 20
 * - Lớn: chu kỳ 10–60 ngày, tồn tại 15–180 ngày, max 10
 */
export const DEFAULT_GENERATOR_CONFIG: WorldGeneratorConfig = {
  small: {
    enabled: true,
    minIntervalDays: 0.1,
    maxIntervalDays: 3,
    minLifetimeDays: 0.5,
    maxLifetimeDays: 15,
    maxActive: 30,
  },
  medium: {
    enabled: true,
    minIntervalDays: 1,
    maxIntervalDays: 10,
    minLifetimeDays: 5,
    maxLifetimeDays: 45,
    maxActive: 20,
  },
  large: {
    enabled: true,
    minIntervalDays: 10,
    maxIntervalDays: 60,
    minLifetimeDays: 15,
    maxLifetimeDays: 180,
    maxActive: 10,
  },
  maxGlobalActive: 100,
}

export const DEFAULT_SIMULATOR_CONFIG: WorldSimulatorConfig = {
  speedSeconds: 300,
  isPaused: false,
  generator: DEFAULT_GENERATOR_CONFIG,
  strategyPolicy: DEFAULT_EVENT_STRATEGY_POLICY,
}

export const WORLD_SIMULATOR_CONFIG_KEY = "STARFRONT_WORLD_SIMULATOR_CONFIG"

/**
 * Kiểm tra tính hợp lệ của cấu hình simulator
 * Không cho số âm, NaN hoặc min > max
 */
export function validateSimulatorConfig(config: WorldSimulatorConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (typeof config.speedSeconds !== "number" || isNaN(config.speedSeconds) || config.speedSeconds <= 0) {
    errors.push("Tốc độ ngày game phải là một số dương hợp lệ (> 0 giây).")
  }

  if (config.speedSeconds > 86400) {
    errors.push("Tốc độ ngày game không được vượt quá 86,400 giây (24 giờ).")
  }

  if (
    typeof config.generator?.maxGlobalActive !== "number" ||
    isNaN(config.generator?.maxGlobalActive) ||
    config.generator?.maxGlobalActive < 1
  ) {
    errors.push("Giới hạn tổng sự kiện hoạt động phải lớn hơn hoặc bằng 1.")
  }

  const tiers: Array<"small" | "medium" | "large"> = ["small", "medium", "large"]
  const tierNames = { small: "Nhỏ (Small)", medium: "Trung bình (Medium)", large: "Lớn (Large)" }

  for (const t of tiers) {
    const tier = config.generator?.[t]
    const name = tierNames[t]
    if (!tier) {
      errors.push(`${name}: Thiếu cấu hình tier.`)
      continue
    }

    if (typeof tier.minIntervalDays !== "number" || isNaN(tier.minIntervalDays) || tier.minIntervalDays <= 0) {
      errors.push(`${name}: Chu kỳ sinh tối thiểu phải là số dương (> 0).`)
    }
    if (typeof tier.maxIntervalDays !== "number" || isNaN(tier.maxIntervalDays) || tier.maxIntervalDays < tier.minIntervalDays) {
      errors.push(`${name}: Chu kỳ sinh tối đa phải lớn hơn hoặc bằng tối thiểu.`)
    }

    if (typeof tier.minLifetimeDays !== "number" || isNaN(tier.minLifetimeDays) || tier.minLifetimeDays <= 0) {
      errors.push(`${name}: Thời gian tồn tại tối thiểu phải là số dương (> 0).`)
    }
    if (typeof tier.maxLifetimeDays !== "number" || isNaN(tier.maxLifetimeDays) || tier.maxLifetimeDays < tier.minLifetimeDays) {
      errors.push(`${name}: Thời gian tồn tại tối đa phải lớn hơn hoặc bằng tối thiểu.`)
    }

    if (typeof tier.maxActive !== "number" || isNaN(tier.maxActive) || tier.maxActive < 1) {
      errors.push(`${name}: Giới hạn số lượng hoạt động tối đa phải lớn hơn hoặc bằng 1.`)
    }
  }

  // Validate strategyPolicy nếu có
  if (config.strategyPolicy) {
    const sp = config.strategyPolicy
    const validPrefs = ["system_auto", "default_fallback", "player_choice"]
    if (sp.tierPolicies) {
      for (const t of tiers) {
        if (!validPrefs.includes(sp.tierPolicies[t])) {
          errors.push(`Tier ${t}: Tùy chọn ưu tiên chiến lược không hợp lệ.`)
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Nạp cấu hình Simulator từ LocalStorage (Cách ly độc lập với World State để giữ cấu hình sau Reset)
 */
export function loadSimulatorConfig(): WorldSimulatorConfig {
  if (typeof window === "undefined" && typeof localStorage === "undefined") {
    return { ...DEFAULT_SIMULATOR_CONFIG }
  }

  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(WORLD_SIMULATOR_CONFIG_KEY) : null
    if (!raw) return { ...DEFAULT_SIMULATOR_CONFIG }

    const parsed = JSON.parse(raw)
    // Đảm bảo tương thích ngược nếu lưu trữ cũ chưa có strategyPolicy
    if (!parsed.strategyPolicy) {
      parsed.strategyPolicy = { ...DEFAULT_EVENT_STRATEGY_POLICY }
    }

    const validation = validateSimulatorConfig(parsed)
    if (!validation.valid) {
      console.warn("[WORLD SIMULATOR] Cấu hình lưu trữ không hợp lệ, dùng mặc định:", validation.errors)
      return { ...DEFAULT_SIMULATOR_CONFIG }
    }

    return parsed
  } catch (err) {
    console.error("[WORLD SIMULATOR] Lỗi khi nạp cấu hình:", err)
    return { ...DEFAULT_SIMULATOR_CONFIG }
  }
}

/**
 * Lưu cấu hình Simulator vào LocalStorage
 */
export function saveSimulatorConfig(config: WorldSimulatorConfig): {
  success: boolean
  errors?: string[]
} {
  const validation = validateSimulatorConfig(config)
  if (!validation.valid) {
    return { success: false, errors: validation.errors }
  }

  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(WORLD_SIMULATOR_CONFIG_KEY, JSON.stringify(config))
      return { success: true }
    } catch (err: any) {
      console.error("[WORLD SIMULATOR] Lỗi khi lưu cấu hình:", err)
      return { success: false, errors: [err?.message || "Lỗi lưu trữ Storage"] }
    }
  }

  return { success: true }
}
