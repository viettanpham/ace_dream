/**
 * STARFRONT WORLD — Offline Catch-up Engine & Time Travel Simulation (Phase 6.3)
 * Xử lý bắt kịp thời gian vắng mặt có trần an toàn (Bounded Batch Catch-up)
 * và công cụ kiểm thử thời gian (Time Travel Dev Controls) với tính năng xem trước (Forecast Preview).
 *
 * Tiêu chí thiết kế F.1 & F.2:
 * - Chu kỳ chuẩn: 1 Strategic Day = 300 giây thực (5 phút)
 * - Tối đa mỗi batch: MAX_TICKS_PER_BATCH = 50 ticks (ngăn chặn đơ trình duyệt)
 * - Trần bảo vệ tối đa: OFFLINE_CATCHUP_CAP = 360 ticks (~30 ngày thực tế)
 * - Chống gian lận đồng hồ (Clock Tampering): Nếu thời gian hệ thống bị lùi lại -> bỏ qua tick
 * - Time travel chỉ tác động World State, không can thiệp combat hay kích hoạt trận đấu
 */

import { executeWorldTick } from "./tick-engine"
import type { WorldResourceLedger, WorldState } from "./types"

/**
 * Cấu hình tham số thời gian theo WORLD_DESIGN.md F.1 & F.2
 */
export const TIME_CONFIG = {
  /** Thời gian thực của 1 ngày chiến lược (300 giây = 5 phút = 300,000 ms) */
  STRATEGIC_DAY_DURATION_MS: 300 * 1000,
  /** Trần bắt kịp tối đa khi ngoại tuyến (360 ngày chiến lược) */
  OFFLINE_CATCHUP_CAP_TICKS: 360,
  /** Kích thước mỗi đợt xử lý để yield luồng trình duyệt */
  MAX_TICKS_PER_BATCH: 50,
} as const

export interface CatchupProgressEvent {
  ticksProcessed: number
  totalTicksToProcess: number
  currentBatch: number
  totalBatches: number
  isComplete: boolean
}

export interface CatchupResult {
  /** Số tick thực tế đã mô phỏng */
  ticksApplied: number
  /** Số tick bị bỏ qua do vượt trần hoặc gian lận đồng hồ */
  ticksCapped: number
  /** Dấu hiệu phát hiện lùi giờ hệ thống */
  clockTamperedDetected: boolean
  /** Thời gian offline tính bằng mili-giây */
  offlineDurationMs: number
  /** Thời gian thực thi việc tính toán (ms) */
  executionTimeMs: number
  /** Trạng thái WorldState sau khi bắt kịp */
  state: WorldState
}

export interface CatchupOptions {
  /** Hàm callback nhận báo cáo tiến độ qua từng batch */
  onProgress?: (progress: CatchupProgressEvent) => void
  /** Có yield qua microtask / setTimeout giữa các batch hay không */
  yieldBetweenBatches?: boolean
  /** Dấu thời gian hiện tại tùy chỉnh (dùng trong kiểm thử / dev tools) */
  currentTimestamp?: number
}

/**
 * Tính số tick cần bắt kịp dựa trên khoảng thời gian chênh lệch
 */
export function calculatePendingTicks(
  lastTimestamp: number,
  currentTimestamp: number
): {
  elapsedMs: number
  rawTicks: number
  effectiveTicks: number
  isCapped: boolean
  isClockReversed: boolean
} {
  const elapsedMs = currentTimestamp - lastTimestamp

  // Phát hiện gian lận đồng hồ (thời gian bị lùi lại)
  if (elapsedMs < 0) {
    return {
      elapsedMs,
      rawTicks: 0,
      effectiveTicks: 0,
      isCapped: false,
      isClockReversed: true,
    }
  }

  const rawTicks = Math.floor(elapsedMs / TIME_CONFIG.STRATEGIC_DAY_DURATION_MS)
  const isCapped = rawTicks > TIME_CONFIG.OFFLINE_CATCHUP_CAP_TICKS
  const effectiveTicks = isCapped ? TIME_CONFIG.OFFLINE_CATCHUP_CAP_TICKS : rawTicks

  return {
    elapsedMs,
    rawTicks,
    effectiveTicks,
    isCapped,
    isClockReversed: false,
  }
}

/**
 * Xử lý bắt kịp thời gian ngoại tuyến theo từng đợt (Bounded Batch Catch-up)
 * Chống treo UI trình duyệt, an toàn và lũy tiến từng checkpoint
 */
export async function processOfflineCatchup(
  state: WorldState,
  options?: CatchupOptions
): Promise<CatchupResult> {
  const startTime = Date.now()
  const now = options?.currentTimestamp ?? Date.now()
  const lastAnchor = state.realTimeAnchor || state.lastTickTimestamp || now

  const calculation = calculatePendingTicks(lastAnchor, now)

  // Nếu đồng hồ bị lùi lại
  if (calculation.isClockReversed) {
    return {
      ticksApplied: 0,
      ticksCapped: 0,
      clockTamperedDetected: true,
      offlineDurationMs: calculation.elapsedMs,
      executionTimeMs: Date.now() - startTime,
      state,
    }
  }

  const totalTicks = calculation.effectiveTicks

  if (totalTicks <= 0) {
    // Chưa đủ 1 ngày chiến lược (dưới 300s)
    return {
      ticksApplied: 0,
      ticksCapped: 0,
      clockTamperedDetected: false,
      offlineDurationMs: calculation.elapsedMs,
      executionTimeMs: Date.now() - startTime,
      state,
    }
  }

  const batchSize = TIME_CONFIG.MAX_TICKS_PER_BATCH
  const totalBatches = Math.ceil(totalTicks / batchSize)
  let ticksProcessed = 0

  for (let batch = 1; batch <= totalBatches; batch++) {
    const ticksInThisBatch = Math.min(batchSize, totalTicks - ticksProcessed)

    for (let i = 0; i < ticksInThisBatch; i++) {
      executeWorldTick(state)
      ticksProcessed++
    }

    if (options?.onProgress) {
      options.onProgress({
        ticksProcessed,
        totalTicksToProcess: totalTicks,
        currentBatch: batch,
        totalBatches,
        isComplete: ticksProcessed >= totalTicks,
      })
    }

    // Yield control qua microtask hoặc setImmediate nếu được yêu cầu
    if (options?.yieldBetweenBatches && batch < totalBatches) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
  }

  // Cập nhật realTimeAnchor mới
  state.realTimeAnchor = now
  state.lastTickTimestamp = now

  const cappedCount = calculation.isCapped
    ? calculation.rawTicks - calculation.effectiveTicks
    : 0

  return {
    ticksApplied: ticksProcessed,
    ticksCapped: cappedCount,
    clockTamperedDetected: false,
    offlineDurationMs: calculation.elapsedMs,
    executionTimeMs: Date.now() - startTime,
    state,
  }
}

/**
 * Phiên bản đồng bộ hoàn toàn của catch-up (dùng trong test suite & headless execution)
 */
export function processOfflineCatchupSync(
  state: WorldState,
  options?: CatchupOptions
): CatchupResult {
  const startTime = Date.now()
  const now = options?.currentTimestamp ?? Date.now()
  const lastAnchor = state.realTimeAnchor || state.lastTickTimestamp || now

  const calculation = calculatePendingTicks(lastAnchor, now)

  if (calculation.isClockReversed) {
    return {
      ticksApplied: 0,
      ticksCapped: 0,
      clockTamperedDetected: true,
      offlineDurationMs: calculation.elapsedMs,
      executionTimeMs: Date.now() - startTime,
      state,
    }
  }

  const totalTicks = calculation.effectiveTicks

  if (totalTicks <= 0) {
    return {
      ticksApplied: 0,
      ticksCapped: 0,
      clockTamperedDetected: false,
      offlineDurationMs: calculation.elapsedMs,
      executionTimeMs: Date.now() - startTime,
      state,
    }
  }

  const batchSize = TIME_CONFIG.MAX_TICKS_PER_BATCH
  const totalBatches = Math.ceil(totalTicks / batchSize)
  let ticksProcessed = 0

  for (let batch = 1; batch <= totalBatches; batch++) {
    const ticksInThisBatch = Math.min(batchSize, totalTicks - ticksProcessed)

    for (let i = 0; i < ticksInThisBatch; i++) {
      executeWorldTick(state)
      ticksProcessed++
    }

    if (options?.onProgress) {
      options.onProgress({
        ticksProcessed,
        totalTicksToProcess: totalTicks,
        currentBatch: batch,
        totalBatches,
        isComplete: ticksProcessed >= totalTicks,
      })
    }
  }

  state.realTimeAnchor = now
  state.lastTickTimestamp = now

  const cappedCount = calculation.isCapped
    ? calculation.rawTicks - calculation.effectiveTicks
    : 0

  return {
    ticksApplied: ticksProcessed,
    ticksCapped: cappedCount,
    clockTamperedDetected: false,
    offlineDurationMs: calculation.elapsedMs,
    executionTimeMs: Date.now() - startTime,
    state,
  }
}

// -------------------------------------------------------------
// TIME TRAVEL DEV CONTROLS & FORECAST PREVIEW
// -------------------------------------------------------------

export interface TimeTravelForecast {
  requestedDays: number
  estimatedResourceDelta: WorldResourceLedger
  estimatedThreatDeltaAvg: number
  predictedSectorTransitions: Array<{
    sectorId: string
    sectorName: string
    fromStage: string
    toStage: string
  }>
}

/**
 * Bản sao sâu tối giản của WorldState để chạy dự báo không gây tác dụng phụ
 */
function cloneStateForPreview(state: WorldState): WorldState {
  return JSON.parse(JSON.stringify(state))
}

/**
 * Dự báo tác động trước khi tua thời gian (Impact Forecast Preview) theo thiết kế F.3
 * Chạy mô phỏng trên bản sao tạm và tính toán tổng delta tài nguyên & đe dọa.
 */
export function forecastTimeTravelImpact(
  state: WorldState,
  daysToAdvance: number
): TimeTravelForecast {
  if (daysToAdvance <= 0) {
    return {
      requestedDays: 0,
      estimatedResourceDelta: {
        industrialMaterials: 0,
        energy: 0,
        logisticsSupplies: 0,
        tacticalData: 0,
        food: 0,
      },
      estimatedThreatDeltaAvg: 0,
      predictedSectorTransitions: [],
    }
  }

  const previewState = cloneStateForPreview(state)
  const initialResources = { ...previewState.resources }
  const initialSectors = Object.values(previewState.sectors).map((s) => ({
    id: s.id,
    name: s.name,
    stage: s.stage,
    threat: s.threatLevel,
  }))

  const transitions: Array<{
    sectorId: string
    sectorName: string
    fromStage: string
    toStage: string
  }> = []

  for (let i = 0; i < daysToAdvance; i++) {
    const res = executeWorldTick(previewState)
    for (const chg of res.sectorStateChanges) {
      if (chg.previousStage !== chg.newStage) {
        const sector = previewState.sectors[chg.sectorId]
        transitions.push({
          sectorId: chg.sectorId,
          sectorName: sector ? sector.name : chg.sectorId,
          fromStage: chg.previousStage,
          toStage: chg.newStage,
        })
      }
    }
  }

  const finalResources = previewState.resources
  const estimatedResourceDelta: WorldResourceLedger = {
    industrialMaterials: finalResources.industrialMaterials - initialResources.industrialMaterials,
    energy: finalResources.energy - initialResources.energy,
    logisticsSupplies: finalResources.logisticsSupplies - initialResources.logisticsSupplies,
    tacticalData: finalResources.tacticalData - initialResources.tacticalData,
    food: finalResources.food - initialResources.food,
  }

  let totalThreatDelta = 0
  for (const initSec of initialSectors) {
    const finalSec = previewState.sectors[initSec.id]
    if (finalSec) {
      totalThreatDelta += finalSec.threatLevel - initSec.threat
    }
  }
  const estimatedThreatDeltaAvg =
    initialSectors.length > 0 ? Math.round(totalThreatDelta / initialSectors.length) : 0

  return {
    requestedDays: daysToAdvance,
    estimatedResourceDelta,
    estimatedThreatDeltaAvg,
    predictedSectorTransitions: transitions,
  }
}

/**
 * Thực thi tua thời gian an toàn cho nhà phát triển (Time Travel Execute)
 * Sử dụng đúng hàm executeWorldTick của hệ thống thật;
 * Ranh giới an toàn: Chỉ tác động lên World State, không can thiệp combat.
 */
export function executeTimeTravel(
  state: WorldState,
  daysToAdvance: number
): {
  daysAdvanced: number
  startingDay: number
  finalDay: number
  state: WorldState
} {
  const startingDay = state.currentDay
  const validDays = Math.max(0, Math.floor(daysToAdvance))

  for (let i = 0; i < validDays; i++) {
    executeWorldTick(state)
  }

  return {
    daysAdvanced: validDays,
    startingDay,
    finalDay: state.currentDay,
    state,
  }
}
