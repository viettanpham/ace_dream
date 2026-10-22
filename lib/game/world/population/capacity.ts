/**
 * STARFRONT WORLD — Base Population Capacity Engine (Phase 6.34A-FND-4)
 *
 * Evaluates the 4 independent capacities:
 * 1. Residential: permanent resident population
 * 2. Visitor: temporary visitors and tourists
 * 3. Temporary Worker: external short-term workforce
 * 4. Emergency: intake for disaster/evacuee refugees
 *
 * Invariant: Building/Module capacity NEVER automatically spawns population.
 */

import type {
  BaseCapacityProfile,
  BaseCapacityStatus,
  BasePopulationState,
  CapacityMetric,
  CapacityType,
} from "./types"

/**
 * Calculates metrics for an individual capacity bucket
 */
export function calculateCapacityMetric(
  currentCount: number,
  maxCapacity: number
): CapacityMetric {
  const safeCount = Math.max(0, currentCount)
  const safeCap = Math.max(0, maxCapacity)
  const utilizationRate = safeCap > 0 ? safeCount / safeCap : safeCount > 0 ? 1 : 0
  const isOverCapacity = safeCap > 0 ? safeCount > safeCap : safeCount > 0
  const overflowCount = Math.max(0, safeCount - safeCap)
  const overflowRatio = safeCap > 0 ? overflowCount / safeCap : 0

  return {
    currentCount: safeCount,
    maxCapacity: safeCap,
    utilizationRate,
    isOverCapacity,
    overflowCount,
    overflowRatio,
  }
}

/**
 * Evaluates complete capacity status for a Base
 */
export function evaluateBaseCapacity(
  state: BasePopulationState,
  emergencyIntakeCount: number = 0
): BaseCapacityStatus {
  const residential = calculateCapacityMetric(
    state.populationCurrent,
    state.capacity.residentialCapacity
  )

  const visitor = calculateCapacityMetric(
    state.visitorPopulation,
    state.capacity.visitorCapacity
  )

  const temporaryWorker = calculateCapacityMetric(
    state.externalWorkerPopulation,
    state.capacity.temporaryWorkerCapacity
  )

  const emergency = calculateCapacityMetric(
    emergencyIntakeCount,
    state.capacity.emergencyCapacity
  )

  const warnings: string[] = []

  if (residential.isOverCapacity) {
    warnings.push(
      `CẢNH BÁO QUÁ TẢI NHÀ Ở: Vượt ${residential.overflowCount.toLocaleString()} cư dân (${(residential.overflowRatio * 100).toFixed(1)}%).`
    )
  }

  if (visitor.isOverCapacity) {
    warnings.push(
      `CẢNH BÁO QUÁ TẢI KHÁCH DU LỊCH: Vượt ${visitor.overflowCount.toLocaleString()} khách.`
    )
  }

  if (temporaryWorker.isOverCapacity) {
    warnings.push(
      `CẢNH BÁO QUÁ TẢI LAO ĐỘNG NGOẠI TỈNH: Vượt ${temporaryWorker.overflowCount.toLocaleString()} lao động.`
    )
  }

  if (emergency.isOverCapacity) {
    const limitRatio = state.capacity.emergencyOverflowLimitRatio ?? 1.25
    const isAboveHardLimit = emergency.utilizationRate > limitRatio
    warnings.push(
      `CẢNH BÁO TIẾP NHẬN KHẨN CẤP: Vượt ${emergency.overflowCount.toLocaleString()} người tị nạn${
        isAboveHardLimit ? " [VƯỢT NGƯỠNG AN TOÀN TUYỆT ĐỐI]" : ""
      }.`
    )
  }

  const hasAnyOverflow =
    residential.isOverCapacity ||
    visitor.isOverCapacity ||
    temporaryWorker.isOverCapacity ||
    emergency.isOverCapacity

  return {
    residential,
    visitor,
    temporaryWorker,
    emergency,
    hasAnyOverflow,
    warnings,
  }
}
