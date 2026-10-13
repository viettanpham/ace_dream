/**
 * STARFRONT WORLD — Canonical HP-Based Threat Engine & Threat Configuration (Phase 6.33_FIX4)
 * 
 * Cung cấp:
 * 1. Chuẩn hóa Threat Max cho HQ (100,000,000) và Sector thường (1,000,000).
 * 2. Một công thức Threat duy nhất dựa trên HP (Canonical HP-Based Threat Formula):
 *    ThreatChange = floor(((WinnerCurrentHP + WinnerMaxHP) * WinnerRatio + LoserMaxHP) / HPPerThreatPoint)
 * 3. Kiểm tra vi phạm khi giảm Max Threat xuống dưới Current Threat (trigger Year-1 reset cảnh báo).
 * 4. Quản lý Threat Config cấu hình qua AdminCP.
 */

import type { WorldSector, WorldState, WorldThreatConfig } from "./types"

export const DEFAULT_THREAT_CONFIG: WorldThreatConfig = {
  maxThreatStandard: 1_000_000,
  maxThreatHQ: 100_000_000,
  hpPerThreatPoint: 100,
  winnerRatio: 2,
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
      hpPerThreatPoint: state.threatConfig.hpPerThreatPoint ?? DEFAULT_THREAT_CONFIG.hpPerThreatPoint,
      winnerRatio: state.threatConfig.winnerRatio ?? DEFAULT_THREAT_CONFIG.winnerRatio,
      threatFormulaMultiplier: state.threatConfig.threatFormulaMultiplier ?? DEFAULT_THREAT_CONFIG.threatFormulaMultiplier,
      lastModified: state.threatConfig.lastModified,
    }
  }
  return { ...DEFAULT_THREAT_CONFIG }
}

/**
 * Xác định một Sector có phải là Headquarters (HQ) / Thủ phủ / Origin căn cứ hay không.
 * Bảo đảm tính đối xứng (symmetric) giữa hai phe (VSS và Enemy/The Void).
 */
export function isHeadquartersSector(
  sector: WorldSector | { id: string; classification?: string; maxThreat?: number } | string
): boolean {
  if (typeof sector === "object") {
    if (sector.classification === "headquarters") return true
  }
  const sectorId = typeof sector === "string" ? sector : sector.id
  if (sectorId === "sol_command_hq" || sectorId.endsWith("_hq") || sectorId === "tartarus_breach") {
    return true
  }
  return false
}

/**
 * Xác định ngưỡng Threat tối đa (Max Threat) cho một Sector / HQ chuẩn hóa.
 * - HQ (Sol Command HQ, Tartarus Breach, hoặc sector kết thúc bằng '_hq'): Mặc định 100,000,000 (hoặc config.maxThreatHQ).
 * - Sector thường / Base phụ: Mặc định 1,000,000 (hoặc config.maxThreatStandard).
 * - Ưu tiên thuộc tính explicit sector.maxThreat nếu đã được thiết lập (loại trừ giá trị mẫu cũ 500/1000).
 */
export function getSectorMaxThreat(
  sector: WorldSector | { id: string; maxThreat?: number; classification?: string } | string,
  config?: WorldThreatConfig
): number {
  const cfg = config ?? DEFAULT_THREAT_CONFIG
  const explicitMax = typeof sector === "object" ? sector.maxThreat : undefined

  // Nếu có explicit maxThreat hợp lệ và khác các giá trị mẫu cũ (500 hoặc 1000)
  if (explicitMax !== undefined && explicitMax > 0 && explicitMax !== 500 && explicitMax !== 1000) {
    return explicitMax
  }

  if (isHeadquartersSector(sector)) {
    return cfg.maxThreatHQ ?? DEFAULT_THREAT_CONFIG.maxThreatHQ
  }

  return cfg.maxThreatStandard ?? DEFAULT_THREAT_CONFIG.maxThreatStandard
}

export interface CalculateThreatChangeParams {
  winnerCurrentHp: number
  winnerMaxHp: number
  loserMaxHp: number
  winnerRatio?: number // default 2
  hpPerThreatPoint?: number // default 100
}

/**
 * CÔNG THỨC THREAT DUY NHẤT CHÍNH THỨC DỰA TRÊN HP (CANONICAL HP-BASED THREAT FORMULA - Phase 6.33_FIX4)
 * 
 * ThreatChange =
 * floor(
 *     (
 *         (WinnerCurrentHP + WinnerMaxHP) * WinnerRatio
 *         + LoserMaxHP
 *     )
 *     / HPPerThreatPoint
 * )
 * 
 * Áp dụng chung cho: Solo, Party, Mission, Event, Base battle, Fleet battle, NPC combat, large-scale battle.
 * Kết quả dùng Math.floor. Không round, không ceil.
 */
export function calculateThreatChange(params: CalculateThreatChangeParams): number {
  const winnerRatio = params.winnerRatio ?? DEFAULT_THREAT_CONFIG.winnerRatio
  const hpPerThreatPoint = params.hpPerThreatPoint ?? DEFAULT_THREAT_CONFIG.hpPerThreatPoint
  if (hpPerThreatPoint <= 0) return 0

  const winnerCurrentHp = Math.max(0, Math.round(params.winnerCurrentHp))
  const winnerMaxHp = Math.max(0, Math.round(params.winnerMaxHp))
  const loserMaxHp = Math.max(0, Math.round(params.loserMaxHp))

  const numerator = (winnerCurrentHp + winnerMaxHp) * winnerRatio + loserMaxHp
  return Math.floor(numerator / hpPerThreatPoint)
}

export interface CanonicalThreatCalcParams {
  maxThreat?: number
  currentThreat?: number
  playerRemainingHpPercent?: number // [0..100]
  enemyRemainingHpPercent?: number  // [0..100]
  isVictory: boolean
  multiplier?: number
  winnerCurrentHp?: number
  winnerMaxHp?: number
  loserMaxHp?: number
  winnerRatio?: number
  hpPerThreatPoint?: number
  playerCurrentHp?: number
  playerMaxHp?: number
  enemyCurrentHp?: number
  enemyMaxHp?: number
}

/**
 * Wrapper tính toán delta Threat (âm nếu Victory, dương nếu Defeat)
 * Sử dụng Canonical Threat Formula làm authoritative core.
 */
export function calculateCanonicalHpThreatDelta(params: CanonicalThreatCalcParams): number {
  const winnerRatio = params.winnerRatio ?? DEFAULT_THREAT_CONFIG.winnerRatio
  const hpPerThreatPoint = params.hpPerThreatPoint ?? DEFAULT_THREAT_CONFIG.hpPerThreatPoint

  let winnerCurrentHp = params.winnerCurrentHp
  let winnerMaxHp = params.winnerMaxHp
  let loserMaxHp = params.loserMaxHp

  if (winnerCurrentHp === undefined || winnerMaxHp === undefined || loserMaxHp === undefined) {
    if (params.playerCurrentHp !== undefined && params.playerMaxHp !== undefined &&
        params.enemyCurrentHp !== undefined && params.enemyMaxHp !== undefined) {
      if (params.isVictory) {
        winnerCurrentHp = params.playerCurrentHp
        winnerMaxHp = params.playerMaxHp
        loserMaxHp = params.enemyMaxHp
      } else {
        winnerCurrentHp = params.enemyCurrentHp
        winnerMaxHp = params.enemyMaxHp
        loserMaxHp = params.playerMaxHp
      }
    } else {
      // Fallback nếu chỉ có tỷ lệ % (từ receipt mô phỏng giả lập)
      // Mặc định chuẩn 2500 vs 3000 HP nếu không có snapshot thực
      const simPlayerMax = 2500
      const simEnemyMax = 3000
      const pPct = params.playerRemainingHpPercent ?? (params.isVictory ? 80 : 0)
      const ePct = params.enemyRemainingHpPercent ?? (params.isVictory ? 0 : 70)
      const simPlayerCurrent = Math.round((pPct / 100) * simPlayerMax)
      const simEnemyCurrent = Math.round((ePct / 100) * simEnemyMax)

      if (params.isVictory) {
        winnerCurrentHp = simPlayerCurrent
        winnerMaxHp = simPlayerMax
        loserMaxHp = simEnemyMax
      } else {
        winnerCurrentHp = simEnemyCurrent
        winnerMaxHp = simEnemyMax
        loserMaxHp = simPlayerMax
      }
    }
  }

  const change = calculateThreatChange({
    winnerCurrentHp,
    winnerMaxHp,
    loserMaxHp,
    winnerRatio,
    hpPerThreatPoint,
  })

  // Phe ta thắng -> Sector Threat giảm điểm (-change)
  // Phe ta thua -> Sector Threat tăng điểm (+change)
  return params.isVictory ? -change : +change
}

/**
 * Áp dụng threat delta vào Sector theo đúng trần Max Threat chuẩn hóa.
 * - Phe ta thắng: NewThreat = max(0, CurrentThreat - ThreatChange)
 * - Phe ta thua: NewThreat = min(SectorMaxThreat, CurrentThreat + ThreatChange)
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
 * Nếu có: Cần cảnh báo và yêu cầu xác nhận để thực hiện Reset WORLD về Year 1.
 */
export function checkMaxThreatReduction(
  sectors: Record<string, WorldSector>,
  newConfig: WorldThreatConfig
): MaxThreatReductionCheckResult {
  const violatingSectors: MaxThreatReductionCheckResult["violatingSectors"] = []

  for (const sector of Object.values(sectors)) {
    const newMax = getSectorMaxThreat(sector, newConfig)
    if (newMax < sector.threatLevel) {
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
