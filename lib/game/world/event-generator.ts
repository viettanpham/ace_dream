/**
 * STARFRONT WORLD — Event & Quest Generator by Game Day (Phase 6.13)
 * Điều phối sinh sự kiện tự động theo lịch ngày game và các quy tắc bảo vệ:
 *   - Phân loại 3 Tier: Small (Nhỏ), Medium (Trung bình), Large (Lớn).
 *   - Đơn vị chu kỳ sinh & lifetime tính bằng Ngày Game (Game Days), KHÔNG dùng giây thực.
 *   - Tôn trọng Concurrency Guard, điều kiện Sector/Threat, và trần số lượng maxActive.
 *   - Sử dụng Seeded PRNG tất định.
 */

import { WorldPRNG } from "./random"
import { EVENT_TEMPLATES, createEventFromTemplate } from "./event-templates"
import { canRegisterWorldEvent, registerWorldEvent, ensureWorldEventState } from "./event-engine"
import { DEFAULT_GENERATOR_CONFIG, type WorldGeneratorConfig } from "./simulator-config"
import type { WorldEvent, WorldState, EventStrategyPolicyConfig } from "./types"
import { evaluateAndApplyEventStrategyPolicy } from "./event-strategy-policy"

/**
 * Bảng phân loại 20 Templates sự kiện vào 3 Tiers chuẩn hóa
 */
export const EVENT_TEMPLATE_TIERS: Record<string, "small" | "medium" | "large"> = {
  // Small (8 templates - vi mô, cục bộ, thám sát)
  evt_void_skirmish_raid: "small",
  evt_contraband_smugglers: "small",
  evt_energy_grid_surge: "small",
  evt_automated_defense_glitch: "small",
  evt_deep_void_probe: "small",
  evt_quantum_beacon_calibration: "small",
  evt_void_vanguard_skirmish: "small",
  evt_orbital_sensor_anomaly: "small",

  // Medium (7 templates - quy mô sector, tác động tầm trung)
  evt_plasma_storm: "medium",
  evt_civil_unrest_strike: "medium",
  evt_urgent_supply_request: "medium",
  evt_derelict_warship_salvage: "medium",
  evt_refugee_fleet_arrival: "medium",
  evt_prototype_mecha_salvage: "medium",
  evt_industrial_sabotage: "medium",

  // Large (5 templates - diện rộng, khủng hoảng toàn thiên hà)
  evt_void_signal_decryption: "large",
  evt_food_supply_blight: "large",
  evt_diplomatic_free_colonies: "large",
  evt_pirate_hyperlane_blockade: "large",
  evt_space_pathogen_outbreak: "large",
}

export function getEventTier(templateId: string): "small" | "medium" | "large" {
  return EVENT_TEMPLATE_TIERS[templateId] || "medium"
}

/**
 * Đếm số lượng sự kiện đang hoạt động (INIT hoặc PROCESSING) theo từng Tier
 */
export function countActiveEventsByTier(state: WorldState): {
  small: number
  medium: number
  large: number
  total: number
} {
  ensureWorldEventState(state)
  const activeEvents = Object.values(state.events!).filter(
    (e) => e.status === "INIT" || e.status === "PROCESSING"
  )

  let small = 0
  let medium = 0
  let large = 0

  for (const e of activeEvents) {
    const tier = (e as any).tier || getEventTier(e.templateId)
    if (tier === "small") small++
    else if (tier === "large") large++
    else medium++
  }

  return {
    small,
    medium,
    large,
    total: activeEvents.length,
  }
}

/**
 * Lấy danh sách template candidate theo Tier
 */
export function getTemplatesByTier(tier: "small" | "medium" | "large"): string[] {
  return Object.keys(EVENT_TEMPLATE_TIERS).filter((id) => EVENT_TEMPLATE_TIERS[id] === tier)
}

/**
 * Đảm bảo state có cấu trúc nextEventSpawnDay
 */
export function ensureNextEventSpawnDay(state: WorldState, config = DEFAULT_GENERATOR_CONFIG): void {
  if (!state.nextEventSpawnDay) {
    state.nextEventSpawnDay = {
      small: state.currentDay + config.small.minIntervalDays,
      medium: state.currentDay + config.medium.minIntervalDays,
      large: state.currentDay + config.large.minIntervalDays,
    }
  }
}

/**
 * Thực thi kiểm tra và sinh Event/Quest theo ngày game
 */
export function checkAndSpawnWorldEvents(
  state: WorldState,
  config: WorldGeneratorConfig = DEFAULT_GENERATOR_CONFIG,
  customPrng?: WorldPRNG,
  policyConfig?: EventStrategyPolicyConfig
): {
  spawnedEvents: WorldEvent[]
  logs: string[]
} {
  ensureWorldEventState(state)
  ensureNextEventSpawnDay(state, config)

  const prng = customPrng || new WorldPRNG(state.worldSeed || 123456)
  const spawnedEvents: WorldEvent[] = []
  const logs: string[] = []

  const tiers: Array<"small" | "medium" | "large"> = ["small", "medium", "large"]
  const currentDay = state.currentDay

  for (const tier of tiers) {
    const tierConfig = config[tier]
    if (!tierConfig.enabled) continue

    // 1. Kiểm tra đã đến ngày sinh theo lịch hay chưa
    const nextSpawn = state.nextEventSpawnDay![tier]
    if (currentDay < nextSpawn) {
      continue
    }

    // 2. Kiểm tra giới hạn số lượng active
    const counts = countActiveEventsByTier(state)
    if (counts[tier] >= tierConfig.maxActive) {
      logs.push(`[GENERATOR] Tier ${tier.toUpperCase()} đã chạm trần (${counts[tier]}/${tierConfig.maxActive}). Tạm hoãn.`)
      continue
    }
    if (counts.total >= config.maxGlobalActive) {
      logs.push(`[GENERATOR] Tổng sự kiện đã đạt trần toàn cục (${counts.total}/${config.maxGlobalActive}). Tạm ngừng sinh.`)
      break
    }

    // 3. Chọn candidate template
    const candidateTemplates = getTemplatesByTier(tier)
    if (!candidateTemplates.length) continue

    // Xáo trộn ngẫu nhiên tất định để thử lần lượt các template
    const shuffledTemplates = [...candidateTemplates].sort(() => prng.nextFloat() - 0.5)
    const sectorIds = Object.keys(state.sectors)

    let createdEvent: WorldEvent | null = null

    for (const tplId of shuffledTemplates) {
      const tpl = EVENT_TEMPLATES[tplId]
      if (!tpl) continue

      // Xác định sector mục tiêu nếu sự kiện có phạm vi sector
      let targetSectorId: string | undefined = undefined
      if (tpl.scope === "sector") {
        // Ưu tiên chọn sector chưa có event cùng template này
        const availableSectors = sectorIds.filter((sId) => {
          return !Object.values(state.events!).some(
            (e) => (e.status === "INIT" || e.status === "PROCESSING") && e.sectorId === sId && e.templateId === tplId
          )
        })

        if (!availableSectors.length) {
          continue // Tất cả sector đều đã có template này, thử template khác
        }

        // Chọn sector ngẫu nhiên tất định
        const chosenSector = prng.choice(availableSectors)
        targetSectorId = chosenSector || sectorIds[0]
      }

      // 4. Tính toán thời gian tồn tại (Lifetime theo ngày game)
      const lifetimeDays = Math.max(
        1,
        Math.round(
          tierConfig.minLifetimeDays +
            prng.nextFloat() * (tierConfig.maxLifetimeDays - tierConfig.minLifetimeDays)
        )
      )

      // Tạo event
      const event = createEventFromTemplate(tplId, currentDay, {
        targetSectorId,
        deadlineTicks: lifetimeDays,
      })

      if (!event) continue

      // Gắn tier nhận diện
      ;(event as any).tier = tier

      // 5. Kiểm tra Concurrency Guard
      const checkResult = canRegisterWorldEvent(state, event, {
        maxActiveEvents: config.maxGlobalActive,
      })

      if (!checkResult.allowed) {
        continue // Thử candidate tiếp theo
      }

      // Đăng ký thành công
      const regRes = registerWorldEvent(state, event, {
        maxActiveEvents: config.maxGlobalActive,
      })

      if (regRes.success && regRes.event) {
        createdEvent = regRes.event

        // Phase 6.15: Đánh giá chính sách chiến lược nếu được cung cấp
        if (policyConfig) {
          const decision = evaluateAndApplyEventStrategyPolicy(state, regRes.event, policyConfig)
          if (decision.applied) {
            logs.push(`[POLICY] ${decision.reason}`)
          }
        }

        spawnedEvents.push(regRes.event)
        logs.push(
          `[GENERATOR] Đã kích hoạt sự kiện [${tier.toUpperCase()}] "${event.title}" tại ${targetSectorId || "Toàn Thiên Hà"} (Hạn chót: Ngày ${event.decisionDeadlineTick})`
        )
        break // Đã sinh thành công 1 event cho tier này trong chu kỳ hiện tại
      }
    }

    // 6. Lập lịch mốc sinh tiếp theo cho tier này
    const nextIntervalDays =
      tierConfig.minIntervalDays +
      prng.nextFloat() * (tierConfig.maxIntervalDays - tierConfig.minIntervalDays)
    state.nextEventSpawnDay![tier] = currentDay + Math.max(0.1, nextIntervalDays)
  }

  return {
    spawnedEvents,
    logs,
  }
}

/**
 * Kích hoạt sinh ngay lập tức một sự kiện thuộc Tier chỉ định (dùng trong ADMIN CP / kiểm thử)
 */
export function forceSpawnEventByTier(
  state: WorldState,
  tier: "small" | "medium" | "large",
  config: WorldGeneratorConfig = DEFAULT_GENERATOR_CONFIG,
  customPrng?: WorldPRNG,
  policyConfig?: EventStrategyPolicyConfig
): { success: boolean; event?: WorldEvent; message: string } {
  ensureWorldEventState(state)
  const prng = customPrng || new WorldPRNG(Date.now() + Math.floor(Math.random() * 10000))
  const candidateTemplates = getTemplatesByTier(tier)
  if (!candidateTemplates.length) {
    return { success: false, message: `Không tìm thấy template nào cho Tier ${tier}.` }
  }

  const counts = countActiveEventsByTier(state)
  if (counts[tier] >= config[tier].maxActive) {
    return {
      success: false,
      message: `Tier ${tier.toUpperCase()} đã chạm trần số lượng hoạt động (${counts[tier]}/${config[tier].maxActive}).`,
    }
  }
  if (counts.total >= config.maxGlobalActive) {
    return { success: false, message: `Đã đạt trần tối đa toàn thiên hà (${counts.total}/${config.maxGlobalActive}).` }
  }

  const shuffledTemplates = [...candidateTemplates].sort(() => prng.nextFloat() - 0.5)
  const sectorIds = Object.keys(state.sectors)

  for (const tplId of shuffledTemplates) {
    const tpl = EVENT_TEMPLATES[tplId]
    if (!tpl) continue

    let targetSectorId: string | undefined = undefined
    if (tpl.scope === "sector") {
      const availableSectors = sectorIds.filter((sId) => {
        return !Object.values(state.events!).some(
          (e) => (e.status === "INIT" || e.status === "PROCESSING") && e.sectorId === sId && e.templateId === tplId
        )
      })
      if (!availableSectors.length) continue
      targetSectorId = prng.choice(availableSectors) || sectorIds[0]
    }

    const tierConfig = config[tier]
    const lifetimeDays = Math.max(
      1,
      Math.round(
        tierConfig.minLifetimeDays +
          prng.nextFloat() * (tierConfig.maxLifetimeDays - tierConfig.minLifetimeDays)
      )
    )

    const event = createEventFromTemplate(tplId, state.currentDay, {
      targetSectorId,
      deadlineTicks: lifetimeDays,
    })

    if (!event) continue
    ;(event as any).tier = tier

    const checkResult = canRegisterWorldEvent(state, event, {
      maxActiveEvents: config.maxGlobalActive,
    })

    if (!checkResult.allowed) continue

    const regRes = registerWorldEvent(state, event, {
      maxActiveEvents: config.maxGlobalActive,
    })

    if (regRes.success && regRes.event) {
      if (policyConfig) {
        evaluateAndApplyEventStrategyPolicy(state, regRes.event, policyConfig)
      }
      return {
        success: true,
        event: regRes.event,
        message: `Đã kích hoạt sự kiện [${tier.toUpperCase()}] "${regRes.event.title}" tại ${targetSectorId || "Toàn Thiên Hà"}!`,
      }
    }
  }

  return { success: false, message: `Không thể sinh sự kiện cho Tier ${tier} do trùng lặp hoặc vi phạm điều kiện an toàn.` }
}

