/**
 * STARFRONT WORLD — Event Strategy Policy & System Auto Strategy Engine (Phase 6.15)
 * Điều phối cơ chế lựa chọn chiến lược 3 cấp độ ưu tiên:
 *   1. System Auto Strategy: Hệ thống tự đánh giá toàn diện và chọn chiến lược tối ưu nhất.
 *   2. Default Strategy Fallback: Phương án dự phòng khi System Auto không chọn được chiến lược hợp lệ.
 *   3. Player Choice Fallback: Chuyển giao về cho người chơi khi cả hai cấp trên đều không khả thi.
 *
 * Tính tất định & An toàn:
 *   - Kiểm tra xác thực (Validation) chi phí tài nguyên & quân sự trước khi thực thi.
 *   - Chấm điểm minh bạch, giải thích được lý do (Explainable Scoring).
 *   - Phá vỡ thế hòa ổn định (Stable Tie-Breaking).
 *   - Bảo toàn tính lũy đẳng, không đổi chiến lược của sự kiện đang PROCESSING hoặc RESULT.
 */

import type {
  WorldState,
  WorldEvent,
  EventStrategy,
  EventStrategyPolicyConfig,
  EventStrategySource,
} from "./types"
import { DEFAULT_EVENT_STRATEGY_POLICY } from "./simulator-config"
import { lockEncounterAndCreateSnapshot } from "./combat-adapter"
import { getEventTier } from "./event-generator"

/**
 * Kết quả phân tích và chấm điểm một chiến lược
 */
export interface StrategyScoreBreakdown {
  strategy: EventStrategy
  score: number
  reasons: string[]
}

/**
 * Kết quả thẩm định điều kiện thực thi của chiến lược
 */
export interface StrategyValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Kết quả quyết định áp dụng chính sách chiến lược
 */
export interface EventStrategyPolicyDecision {
  applied: boolean
  source: EventStrategySource
  strategyId?: string
  strategyName?: string
  reason: string
  score?: number
}

/**
 * 1. Thẩm định tính hợp lệ và khả năng chi trả của một chiến lược (Validation)
 * Không bao giờ cho phép thực thi nếu thiếu hụt tài nguyên hoặc quân sự.
 */
export function validateStrategyExecution(
  state: WorldState,
  event: WorldEvent,
  strategy: EventStrategy
): StrategyValidationResult {
  // 1.1 Kiểm tra chi phí tài nguyên (Resources)
  if (strategy.cost) {
    for (const [resKey, costVal] of Object.entries(strategy.cost)) {
      if (typeof costVal === "number" && costVal > 0) {
        const available = (state.resources as any)?.[resKey] ?? 0
        if (available < costVal) {
          const resNames: Record<string, string> = {
            industrialMaterials: "Vật liệu công nghiệp",
            energy: "Năng lượng",
            logisticsSupplies: "Vật tư hậu cần",
            tacticalData: "Dữ liệu chiến thuật",
            food: "Lương thực",
          }
          const name = resNames[resKey] || resKey
          return {
            valid: false,
            reason: `Thiếu ${name} (Cần: ${costVal}, Hiện có: ${available})`,
          }
        }
      }
    }
  }

  // 1.2 Kiểm tra chi phí quân sự (Military Reserves)
  if (strategy.militaryCost && strategy.militaryCost > 0) {
    const reserves = state.military?.reserves ?? 0
    if (reserves < strategy.militaryCost) {
      return {
        valid: false,
        reason: `Thiếu quân dự bị (Cần: ${strategy.militaryCost}, Dự bị: ${reserves})`,
      }
    }
  }

  // 1.3 Kiểm tra điều kiện chiến đấu nếu chiến lược yêu cầu combat
  if (strategy.requiresCombat) {
    if (!event.sectorId || !state.sectors?.[event.sectorId]) {
      return {
        valid: false,
        reason: "Chiến lược yêu cầu chiến đấu nhưng không xác định được sector mục tiêu.",
      }
    }
  }

  return { valid: true }
}

/**
 * 2. Đánh giá và chấm điểm một chiến lược theo quy tắc minh bạch, xác định (Scoring)
 */
export function scoreEventStrategy(
  state: WorldState,
  event: WorldEvent,
  strategy: EventStrategy
): StrategyScoreBreakdown {
  let score = 0
  const reasons: string[] = []

  // 2.1 Tỷ lệ thành công (Success Chance) — 0..100
  const chance = strategy.successChance ?? 100
  const chancePts = Math.round(chance * 0.5) // Tối đa 50đ
  score += chancePts
  reasons.push(`Tỷ lệ thành công ${chance}% (+${chancePts}đ)`)

  // 2.2 Tác động Độ Ổn Định (Stability Delta)
  const stab = strategy.consequences?.stabilityDelta ?? 0
  if (stab > 0) {
    const stabPts = stab * 3
    score += stabPts
    reasons.push(`Tăng ổn định +${stab} (+${stabPts}đ)`)
  } else if (stab < 0) {
    const stabPenalty = Math.abs(stab) * 2
    score -= stabPenalty
    reasons.push(`Giảm ổn định ${stab} (-${stabPenalty}đ)`)
  }

  // 2.3 Tác động Mức Đe Dọa (Threat Delta: giảm là có lợi, tăng là bất lợi)
  const threat = strategy.consequences?.threatDelta ?? 0
  if (threat < 0) {
    const threatPts = Math.abs(threat) * 2
    score += threatPts
    reasons.push(`Hạ đe dọa ${threat} (+${threatPts}đ)`)
  } else if (threat > 0) {
    const threatPenalty = threat * 2
    score -= threatPenalty
    reasons.push(`Tăng đe dọa +${threat} (-${threatPenalty}đ)`)
  }

  // 2.4 Bối cảnh Sector khẩn cấp (Sector Contextual Urgency)
  if (event.sectorId && state.sectors?.[event.sectorId]) {
    const sector = state.sectors[event.sectorId]
    if (sector.threatLevel >= 500 && threat < 0) {
      score += 25
      reasons.push(`Sector đe dọa cao (${sector.threatLevel}): ưu tiên dập tắt hiểm họa (+25đ)`)
    }
    if (sector.stability <= 50 && stab > 0) {
      score += 20
      reasons.push(`Sector bất ổn (${sector.stability}%): ưu tiên phục hồi trật tự (+20đ)`)
    }
  }

  // 2.5 Chi phí tiêu hao tài nguyên & quân sự
  let totalCost = 0
  if (strategy.cost) {
    for (const val of Object.values(strategy.cost)) {
      if (typeof val === "number") totalCost += val
    }
  }
  if (totalCost > 0) {
    const costPenalty = Math.min(30, Math.round(totalCost / 20))
    score -= costPenalty
    reasons.push(`Tiêu hao tài nguyên: ${totalCost} (-${costPenalty}đ)`)
  }

  if (strategy.militaryCost && strategy.militaryCost > 0) {
    const milPenalty = Math.min(25, Math.round(strategy.militaryCost / 10))
    score -= milPenalty
    reasons.push(`Huy động quân lực: ${strategy.militaryCost} (-${milPenalty}đ)`)
  }

  // 2.6 Thời gian thực thi (Processing Ticks): ngắn hơn được ưu tiên nhẹ
  const durationPenalty = Math.min(15, (strategy.processingTicks - 1) * 3)
  if (durationPenalty > 0) {
    score -= durationPenalty
    reasons.push(`Thời gian hoàn tất: ${strategy.processingTicks} ngày (-${durationPenalty}đ)`)
  }

  // 2.7 Thương vong dân sự & quân sự (nếu có trong hậu quả)
  if (strategy.consequences?.populationDelta?.civilianCasualties) {
    const civPenalty = Math.min(30, strategy.consequences.populationDelta.civilianCasualties * 2)
    score -= civPenalty
    reasons.push(`Thương vong dân sự: ${strategy.consequences.populationDelta.civilianCasualties} (-${civPenalty}đ)`)
  }
  if (strategy.consequences?.militaryDelta?.casualtiesDelta) {
    const milCasPenalty = Math.min(30, strategy.consequences.militaryDelta.casualtiesDelta * 2)
    score -= milCasPenalty
    reasons.push(`Tổn thất quân sự: ${strategy.consequences.militaryDelta.casualtiesDelta} (-${milCasPenalty}đ)`)
  }

  // 2.8 Phần thưởng tài nguyên thu về (nếu có trong hậu quả)
  if (strategy.consequences?.resourceDelta) {
    let rewardTotal = 0
    for (const val of Object.values(strategy.consequences.resourceDelta)) {
      if (typeof val === "number" && val > 0) rewardTotal += val
    }
    if (rewardTotal > 0) {
      const rewardPts = Math.min(25, Math.round(rewardTotal / 30))
      score += rewardPts
      reasons.push(`Thu hoạch tài nguyên: +${rewardTotal} (+${rewardPts}đ)`)
    }
  }

  return {
    strategy,
    score,
    reasons,
  }
}

/**
 * 3. Tìm chiến lược tối ưu nhất cho Event theo quy tắc System Auto
 * Phá vỡ thế hòa ổn định: (score DESC -> successChance DESC -> processingTicks ASC -> id ASC)
 */
export function selectBestStrategyForEvent(
  state: WorldState,
  event: WorldEvent
): { strategy: EventStrategy; score: number; reasons: string[] } | null {
  if (!event.availableStrategies || event.availableStrategies.length === 0) {
    return null
  }

  // 1. Chỉ chọn các chiến lược vượt qua thẩm định chi phí
  const validStrategies = event.availableStrategies.filter((strat) => {
    return validateStrategyExecution(state, event, strat).valid
  })

  if (validStrategies.length === 0) {
    return null
  }

  // 2. Chấm điểm từng chiến lược hợp lệ
  const scoredList: StrategyScoreBreakdown[] = validStrategies.map((strat) => {
    return scoreEventStrategy(state, event, strat)
  })

  // 3. Phá vỡ thế hòa ổn định (Stable Tie-Breaking)
  scoredList.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score

    const aChance = a.strategy.successChance ?? 100
    const bChance = b.strategy.successChance ?? 100
    if (bChance !== aChance) return bChance - aChance

    if (a.strategy.processingTicks !== b.strategy.processingTicks) {
      return a.strategy.processingTicks - b.strategy.processingTicks
    }

    return a.strategy.id.localeCompare(b.strategy.id)
  })

  const best = scoredList[0]
  return {
    strategy: best.strategy,
    score: best.score,
    reasons: best.reasons,
  }
}

/**
 * 4. Thực thi việc phê chuẩn chiến lược và chuyển đổi trạng thái sự kiện sang PROCESSING
 * Trừ chi phí tài nguyên và khóa trận đấu an toàn.
 */
export function applyStrategyToEvent(
  state: WorldState,
  event: WorldEvent,
  strategy: EventStrategy,
  source: EventStrategySource,
  reason: string
): boolean {
  // Bảo vệ vòng đời: Chỉ áp dụng cho sự kiện đang ở trạng thái INIT
  if (event.status !== "INIT") {
    return false
  }

  // Thẩm định chi phí lần cuối
  const validation = validateStrategyExecution(state, event, strategy)
  if (!validation.valid) {
    return false
  }

  // 1. Trừ chi phí tài nguyên
  if (strategy.cost) {
    for (const [resKey, costVal] of Object.entries(strategy.cost)) {
      if (typeof costVal === "number" && costVal > 0) {
        ;(state.resources as any)[resKey] = Math.max(
          0,
          ((state.resources as any)[resKey] ?? 0) - costVal
        )
      }
    }
  }

  // 2. Trừ quân lực dự bị và tăng quân số triển khai
  if (strategy.militaryCost && strategy.militaryCost > 0) {
    state.military.reserves = Math.max(0, state.military.reserves - strategy.militaryCost)
    state.military.deployed += strategy.militaryCost
  }

  // 3. Nếu chiến lược yêu cầu combat, khóa Encounter Snapshot
  if (strategy.requiresCombat && event.sectorId) {
    try {
      const snapshot = lockEncounterAndCreateSnapshot(state, {
        sectorId: event.sectorId,
        customEnemyName: strategy.encounterConfig?.name || "Void Incursion Fleet",
        customEnemyType: "void-vanguard",
      })
      if (snapshot) {
        event.encounterTransactionId = snapshot.transactionId
      }
    } catch (err) {
      console.warn("[EVENT STRATEGY] Không thể khóa encounter snapshot:", err)
    }
  }

  // 4. Cập nhật thực thể Event
  event.status = "PROCESSING"
  event.chosenStrategyId = strategy.id
  event.strategySource = source
  event.selectionReason = reason
  event.autoSelectionFailureReason = undefined
  event.processingStartedTick = state.currentDay
  event.processingCompletesTick = state.currentDay + Math.max(1, strategy.processingTicks)

  return true
}

/**
 * 5. Điều phối chính sách chiến lược 3 cấp độ (System Auto -> Default Fallback -> Player Choice)
 */
export function evaluateAndApplyEventStrategyPolicy(
  state: WorldState,
  event: WorldEvent,
  policyConfig: EventStrategyPolicyConfig = DEFAULT_EVENT_STRATEGY_POLICY
): EventStrategyPolicyDecision {
  // Bảo vệ tuyệt đối: Không thay đổi sự kiện đã PROCESSING hoặc RESULT
  if (event.status !== "INIT") {
    return {
      applied: false,
      source: event.strategySource || "player_choice",
      strategyId: event.chosenStrategyId,
      reason: `Sự kiện đang ở trạng thái ${event.status}, không thể thay đổi chiến lược.`,
    }
  }

  const tier = (event.tier || getEventTier(event.templateId)) as "small" | "medium" | "large"
  const tierPreference = policyConfig.tierPolicies?.[tier] || "system_auto"

  // Nếu cấu hình tier yêu cầu thẳng Player Choice hoặc tất cả tự động bị tắt
  if (
    tierPreference === "player_choice" ||
    (!policyConfig.systemAutoEnabled && !policyConfig.defaultFallbackEnabled)
  ) {
    event.strategySource = "player_choice"
    event.autoSelectionFailureReason = "Chính sách quy định yêu cầu người chơi trực tiếp phê chuẩn."
    return {
      applied: false,
      source: "player_choice",
      reason: event.autoSelectionFailureReason,
    }
  }

  let autoFailureReason: string | undefined

  // =========================================================================
  // CẤP 1: SYSTEM AUTO STRATEGY
  // =========================================================================
  if (policyConfig.systemAutoEnabled && tierPreference === "system_auto") {
    const bestCandidate = selectBestStrategyForEvent(state, event)

    if (bestCandidate) {
      const mainReason = bestCandidate.reasons[0] || "Đạt điểm đánh giá cao nhất"
      const applied = applyStrategyToEvent(
        state,
        event,
        bestCandidate.strategy,
        "system_auto",
        `System Auto tối ưu: ${bestCandidate.strategy.name} (${mainReason})`
      )

      if (applied) {
        return {
          applied: true,
          source: "system_auto",
          strategyId: bestCandidate.strategy.id,
          strategyName: bestCandidate.strategy.name,
          score: bestCandidate.score,
          reason: `System Auto đã phê chuẩn phương án tối ưu: "${bestCandidate.strategy.name}". ${mainReason}`,
        }
      }
    }

    autoFailureReason = "System Auto không tìm thấy phương án nào đủ tài nguyên hoặc đáp ứng điều kiện."
  } else {
    autoFailureReason = "Chế độ System Auto bị tắt bởi cấu hình chính sách."
  }

  // =========================================================================
  // CẤP 2: DEFAULT STRATEGY FALLBACK
  // =========================================================================
  let defaultFailureReason: string | undefined

  if (policyConfig.defaultFallbackEnabled) {
    let defaultStrategy = event.availableStrategies.find((s) => s.id === event.defaultStrategyId)
    if (!defaultStrategy && event.availableStrategies.length > 0) {
      defaultStrategy = event.availableStrategies[0]
    }

    if (defaultStrategy) {
      const validation = validateStrategyExecution(state, event, defaultStrategy)
      if (validation.valid) {
        const applied = applyStrategyToEvent(
          state,
          event,
          defaultStrategy,
          "default_fallback",
          `Dự phòng Default Strategy: Phương án mặc định an toàn "${defaultStrategy.name}".`
        )

        if (applied) {
          return {
            applied: true,
            source: "default_fallback",
            strategyId: defaultStrategy.id,
            strategyName: defaultStrategy.name,
            reason: `Kích hoạt phương án mặc định dự phòng: "${defaultStrategy.name}".`,
          }
        }
      } else {
        defaultFailureReason = `Phương án mặc định không đủ điều kiện: ${validation.reason}`
      }
    } else {
      defaultFailureReason = "Sự kiện không có phương án mặc định hợp lệ."
    }
  } else {
    defaultFailureReason = "Chế độ Default Strategy Fallback bị tắt bởi cấu hình."
  }

  // =========================================================================
  // CẤP 3: PLAYER CHOICE FALLBACK
  // =========================================================================
  event.strategySource = "player_choice"
  const failureCombined = [autoFailureReason, defaultFailureReason].filter(Boolean).join(" · ")
  event.autoSelectionFailureReason = failureCombined || "Chờ chỉ huy trực tiếp quyết định phương án."

  return {
    applied: false,
    source: "player_choice",
    reason: event.autoSelectionFailureReason,
  }
}

/**
 * 6. Quét và áp dụng chính sách chiến lược hàng loạt cho tất cả sự kiện INIT đang chờ
 */
export function batchApplyEventStrategyPolicy(
  state: WorldState,
  policyConfig: EventStrategyPolicyConfig = DEFAULT_EVENT_STRATEGY_POLICY
): {
  processedCount: number
  autoProcessedCount: number
  defaultFallbackCount: number
  playerChoiceCount: number
  logs: string[]
} {
  if (!state.events) {
    return {
      processedCount: 0,
      autoProcessedCount: 0,
      defaultFallbackCount: 0,
      playerChoiceCount: 0,
      logs: [],
    }
  }

  const initEvents = Object.values(state.events).filter((e) => e.status === "INIT")
  let autoProcessedCount = 0
  let defaultFallbackCount = 0
  let playerChoiceCount = 0
  const logs: string[] = []

  for (const event of initEvents) {
    const decision = evaluateAndApplyEventStrategyPolicy(state, event, policyConfig)
    if (decision.applied) {
      if (decision.source === "system_auto") {
        autoProcessedCount++
        logs.push(`[SYSTEM AUTO] Đã tự động phê chuẩn "${decision.strategyName}" cho "${event.title}"`)
      } else if (decision.source === "default_fallback") {
        defaultFallbackCount++
        logs.push(`[DEFAULT FALLBACK] Kích hoạt phương án mặc định cho "${event.title}"`)
      }
    } else {
      playerChoiceCount++
    }
  }

  return {
    processedCount: autoProcessedCount + defaultFallbackCount,
    autoProcessedCount,
    defaultFallbackCount,
    playerChoiceCount,
    logs,
  }
}
