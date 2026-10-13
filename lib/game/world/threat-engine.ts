/**
 * STARFRONT WORLD — Canonical HP-Based Threat Engine & Threat Configuration (Phase 6.33_FIX4)
 * 
 * Cung cấp:
 * 1. Chuẩn hóa Threat Max cho HQ (Sol Command HQ: 500) và Sector thường (1000).
 * 2. Một công thức Threat duy nhất dựa trên tỷ lệ HP (Canonical HP-based Threat Formula).
 * 3. Kiểm tra vi phạm khi giảm Max Threat xuống dưới Current Threat (trigger Year-1 reset cảnh báo).
 * 4. Quản lý Threat Config cấu hình qua AdminCP.
 */

import type { WorldSector, WorldState, WorldThreatConfig } from "./types"

export const DEFAULT_THREAT_CONFIG: WorldThreatConfig = {
  maxThreatStandard: 1000,
  maxThreatHQ: 500,
  threatFormulaMultiplier: 1.0,
}

/**
 * Trả về cấu hình Threat hiện tại từ WorldState hoặc mặc định
 */
export function getWorldThreatConfig(state?: WorldState | null): WorldThreatConfig {
  if (state?.threatConfig) {
    return {
      maxThreatStandard: state.threatConfig.maxThreatStandard ?? DEFAULT_THREAT_CONFIG.maxThreatStandard,
      maxThreatHQ: state.threatConfig.maxThreatHQ ?? DEFAULT_THREAT_CONFIG.maxThreatHQ,
      threatFormulaMultiplier: state.threatConfig.threatFormulaMultiplier ?? DEFAULT_THREAT_CONFIG.threatFormulaMultiplier,
      lastModified: state.threatConfig.lastModified,
    }
  }
  return { ...DEFAULT_THREAT_CONFIG }
}

/**
 * Xác định ngưỡng Threat tối đa (Max Threat) cho một Sector / HQ chuẩn hóa.
 * - HQ (Sol Command HQ hoặc sector có id kết thúc bằng '_hq'): Mặc định 500 (hoặc config.maxThreatHQ).
 * - Sector thường: Mặc định 1000 (hoặc config.maxThreatStandard).
 * - Ưu tiên thuộc tính explicit sector.maxThreat nếu đã được thiết lập.
 */
export function getSectorMaxThreat(
  sector: WorldSector | { id: string; maxThreat?: number } | string,
  config?: WorldThreatConfig
): number {
  const cfg = config ?? DEFAULT_THREAT_CONFIG
  const sectorId = typeof sector === "string" ? sector : sector.id
  const explicitMax = typeof sector === "object" ? sector.maxThreat : undefined

  if (explicitMax !== undefined && explicitMax > 0) {
    return explicitMax
  }

  // Sol Command HQ hoặc Base tổng hành dinh
  if (sectorId === "sol_command_hq" || sectorId.endsWith("_hq")) {
    return cfg.maxThreatHQ ?? DEFAULT_THREAT_CONFIG.maxThreatHQ
  }

  return cfg.maxThreatStandard ?? DEFAULT_THREAT_CONFIG.maxThreatStandard
}

export interface CanonicalThreatCalcParams {
  maxThreat: number
  currentThreat: number
  playerRemainingHpPercent: number // [0..100]
  enemyRemainingHpPercent: number  // [0..100]
  isVictory: boolean
  multiplier?: number
}

/**
 * CÔNG THỨC THREAT DUY NHẤT DỰA TRÊN HP (Canonical HP-Based Threat Formula)
 * Thay thế hoàn toàn các hằng số fixed delta cũ (-140, +120).
 * 
 * Nguyên lý:
 * 1. Phe Đồng Minh Chiến Thắng (Victory):
 *    - Tỷ lệ HP địch bị tiêu diệt: enemyDmgRatio = (100 - enemyRemainingHpPercent) / 100 (từ 0.0 đến 1.0)
 *    - Tỷ lệ HP đồng minh bảo toàn: alliedSurvivingRatio = playerRemainingHpPercent / 100 (từ 0.0 đến 1.0)
 *    - Threat giảm tỉ lệ thuận với lượng máu địch bị tiêu diệt và lượng máu quân ta bảo toàn:
 *      rawDelta = maxThreat * (0.25 * enemyDmgRatio + 0.15 * alliedSurvivingRatio) * multiplier
 *    - Giảm tối thiểu: ít nhất 10% của maxThreat.
 *    - Delta trả về là số ÂM (giảm đe dọa).
 * 
 * 2. Phe Đồng Minh Thất Bại (Defeat):
 *    - Tỷ lệ HP đồng minh bị mất: alliedLostRatio = (100 - playerRemainingHpPercent) / 100
 *    - Tỷ lệ HP địch còn sót: enemySurvivingRatio = enemyRemainingHpPercent / 100
 *    - Threat tăng tỉ lệ thuận với lượng máu ta tổn thất và lượng máu địch áp đảo:
 *      rawDelta = maxThreat * (0.20 * alliedLostRatio + 0.15 * enemySurvivingRatio) * multiplier
 *    - Tăng tối thiểu: ít nhất 8% của maxThreat.
 *    - Delta trả về là số DƯƠNG (tăng đe dọa).
 */
export function calculateCanonicalHpThreatDelta(params: CanonicalThreatCalcParams): number {
  const mult = params.multiplier && params.multiplier > 0 ? params.multiplier : 1.0
  const maxT = Math.max(10, Math.round(params.maxThreat))
  const playerHp = Math.max(0, Math.min(100, params.playerRemainingHpPercent))
  const enemyHp = Math.max(0, Math.min(100, params.enemyRemainingHpPercent))

  if (params.isVictory) {
    const enemyDmgRatio = (100 - enemyHp) / 100
    const alliedSurvivingRatio = playerHp / 100
    const rawDelta = maxT * (0.25 * enemyDmgRatio + 0.15 * alliedSurvivingRatio) * mult
    const minReduction = Math.max(1, Math.round(maxT * 0.10))
    const finalReduction = Math.max(minReduction, Math.round(rawDelta))
    return -finalReduction
  } else {
    const alliedLostRatio = (100 - playerHp) / 100
    const enemySurvivingRatio = enemyHp / 100
    const rawDelta = maxT * (0.20 * alliedLostRatio + 0.15 * enemySurvivingRatio) * mult
    const minIncrease = Math.max(1, Math.round(maxT * 0.08))
    const finalIncrease = Math.max(minIncrease, Math.round(rawDelta))
    return +finalIncrease
  }
}

/**
 * Áp dụng threat delta vào Sector theo đúng trần Max Threat chuẩn hóa
 */
export function applyThreatDeltaToSector(
  sector: WorldSector,
  threatDelta: number,
  config?: WorldThreatConfig
): {
  previousThreat: number
  newThreat: number
  actualDelta: number
  maxThreat: number
} {
  const previousThreat = sector.threatLevel
  const maxT = getSectorMaxThreat(sector, config)
  const targetThreat = sector.threatLevel + threatDelta
  const clampedThreat = Math.max(0, Math.min(maxT, targetThreat))
  sector.threatLevel = clampedThreat

  return {
    previousThreat,
    newThreat: clampedThreat,
    actualDelta: clampedThreat - previousThreat,
    maxThreat: maxT,
  }
}

export interface MaxThreatReductionCheckResult {
  needsConfirmation: boolean
  violatingSectors: Array<{
    id: string
    name: string
    currentThreat: number
    newMaxThreat: number
  }>
}

/**
 * Kiểm tra xem cấu hình Max Threat mới có thấp hơn Current Threat của bất kỳ Sector nào hay không.
 * Nếu có: Cần cảnh báo và xác nhận để thực hiện Reset WORLD về Year 1.
 */
export function checkMaxThreatReduction(
  sectors: Record<string, WorldSector>,
  newConfig: WorldThreatConfig
): MaxThreatReductionCheckResult {
  const violatingSectors: MaxThreatReductionCheckResult["violatingSectors"] = []

  for (const sector of Object.values(sectors)) {
    const newMax = getSectorMaxThreat(sector, newConfig)
    if (sector.threatLevel > newMax) {
      violatingSectors.push({
        id: sector.id,
        name: sector.name,
        currentThreat: sector.threatLevel,
        newMaxThreat: newMax,
      })
    }
  }

  return {
    needsConfirmation: violatingSectors.length > 0,
    violatingSectors,
  }
}
