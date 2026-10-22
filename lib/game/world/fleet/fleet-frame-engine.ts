/**
 * STARFRONT WORLD — Fleet FRAME Accounting, Annual Decay & Subsidy Engine (Phase 7.5)
 *
 * Implements:
 * 1. Tri-Balance FRAME Accounting:
 *    - cycleFrame: Performance score within the active 360-day cycle.
 *    - availableFrame: Spendable merit currency at the National Technology & Gear Exchange.
 *    - totalFrame: Permanent lifetime military honor and prestige ranking score.
 * 2. Strict Mathematical Ledger & Non-Negative Floor:
 *    - Awards: Δcycle = +X, Δavailable = +X, Δtotal = +X
 *    - Store redemption: Δavailable = -Cost, Δcycle = 0, Δtotal = 0
 *    - Penalty Overflow Rule: If penalty P > availableFrame, available -> 0, remainder deducted from totalFrame (floor = 0).
 * 3. Annual FRAME Decay (360 GAME_DAYS):
 *    - BaseDecay = NationalAverageCycle / 2
 *    - ActualDecay = min(BaseDecay, TotalBeforeDecay * 50%)
 *    - Idempotent: Exactly 1 deduction per calendar year (360 days) per fleet.
 *    - NEW_GUILD_PROTECTION Exemption: 10 Game Years (3600 days) exemption.
 * 4. Degressive Fleet Maintenance Subsidies:
 *    - Max claims per cycle: multiplier * MK_Tier (default 10 * MK_Tier)
 *    - Uses 1-3: 100% full subsidy
 *    - Uses > 3: Degressive slope down to floor (30%)
 *    - Frontline War Exception: Fixed 100% subsidy in contested/border sectors with threat > 70%
 */

import type { FleetPolicyProfile, FrameAwardDefinition } from "./catalog-types"
import type { FleetEntityState } from "./fleet-entity"
import { getFleetClass, getFleetPolicyProfile } from "./registry-integration"

export interface FleetFrameLedgerEntry {
  id: string
  gameDay: number
  type: "AWARD" | "STORE_PURCHASE" | "DISCIPLINARY_PENALTY" | "ANNUAL_DECAY" | "CREDIT_CONVERSION"
  deltaCycle: number
  deltaAvailable: number
  deltaTotal: number
  balanceAfterCycle: number
  balanceAfterAvailable: number
  balanceAfterTotal: number
  description: string
  awardId?: string
  referenceId?: string
}

export interface FleetFrameState {
  cycleFrame: number
  availableFrame: number
  totalFrame: number
  lastDecayProcessedYear: number // Year index (e.g. 0, 1, 2...)
  subsidiesClaimedThisCycle: number
  auditLog: FleetFrameLedgerEntry[]
}

/**
 * Creates an initial FRAME accounting state for a fleet
 */
export function createFleetFrameState(initialPoints = 0): FleetFrameState {
  return {
    cycleFrame: initialPoints,
    availableFrame: initialPoints,
    totalFrame: initialPoints,
    lastDecayProcessedYear: 0,
    subsidiesClaimedThisCycle: 0,
    auditLog: initialPoints > 0
      ? [
          {
            id: `frame_init_${Date.now()}`,
            gameDay: 1,
            type: "AWARD",
            deltaCycle: initialPoints,
            deltaAvailable: initialPoints,
            deltaTotal: initialPoints,
            balanceAfterCycle: initialPoints,
            balanceAfterAvailable: initialPoints,
            balanceAfterTotal: initialPoints,
            description: "Initial Commissioning Honor Points",
          },
        ]
      : [],
  }
}

/**
 * Awards FRAME points to a fleet for combat, rescue, or patrol achievements
 * Δcycle = +X, Δavailable = +X, Δtotal = +X
 */
export function awardFleetFrame(
  frameState: FleetFrameState,
  award: FrameAwardDefinition,
  threatLevel: number,
  gameDay: number,
  specialMultiplier = 1.0 // [-10.0 .. +10.0]
): { pointsAwarded: number; newTotal: number } {
  const threatBonus = Math.max(1.0, 1.0 + (threatLevel * (award.bonusMultiplierPerThreatLevel - 1.0) / 100))
  const rawPoints = Math.round(award.basePoints * threatBonus * specialMultiplier)
  const points = Math.max(0, rawPoints)

  frameState.cycleFrame += points
  frameState.availableFrame += points
  frameState.totalFrame += points

  frameState.auditLog.push({
    id: `frame_award_${gameDay}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    gameDay,
    type: "AWARD",
    deltaCycle: points,
    deltaAvailable: points,
    deltaTotal: points,
    balanceAfterCycle: frameState.cycleFrame,
    balanceAfterAvailable: frameState.availableFrame,
    balanceAfterTotal: frameState.totalFrame,
    description: `Awarded: ${award.name} (${points} pts, Threat: ${threatLevel}%)`,
    awardId: award.id,
  })

  return { pointsAwarded: points, newTotal: frameState.totalFrame }
}

/**
 * Directly awards a specific number of FRAME points to a fleet
 */
export function awardFramePoints(
  frameState: FleetFrameState,
  points: number,
  description: string,
  gameDay: number
): { pointsAwarded: number; newTotal: number } {
  frameState.cycleFrame += points
  frameState.availableFrame += points
  frameState.totalFrame += points

  frameState.auditLog.push({
    id: `frame_direct_${gameDay}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    gameDay,
    type: "AWARD",
    deltaCycle: points,
    deltaAvailable: points,
    deltaTotal: points,
    balanceAfterCycle: frameState.cycleFrame,
    balanceAfterAvailable: frameState.availableFrame,
    balanceAfterTotal: frameState.totalFrame,
    description,
  })

  return { pointsAwarded: points, newTotal: frameState.totalFrame }
}

/**
 * Purchases blueprints, modules or licenses at the National FRAME Store
 * Δavailable = -Cost, Δcycle = 0, Δtotal = 0
 */
export function redeemFrameAtStore(
  frameState: FleetFrameState,
  cost: number,
  itemDescription: string,
  gameDay: number
): { success: boolean; remainingAvailable: number; error?: string } {
  if (cost <= 0) return { success: false, remainingAvailable: frameState.availableFrame, error: "Chi phí không hợp lệ" }

  if (frameState.availableFrame < cost) {
    return {
      success: false,
      remainingAvailable: frameState.availableFrame,
      error: `Không đủ điểm FRAME khả dụng (Cần: ${cost}, Hiện có: ${frameState.availableFrame})`,
    }
  }

  frameState.availableFrame -= cost

  frameState.auditLog.push({
    id: `frame_redeem_${gameDay}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    gameDay,
    type: "STORE_PURCHASE",
    deltaCycle: 0,
    deltaAvailable: -cost,
    deltaTotal: 0,
    balanceAfterCycle: frameState.cycleFrame,
    balanceAfterAvailable: frameState.availableFrame,
    balanceAfterTotal: frameState.totalFrame,
    description: `FRAME Store Purchase: ${itemDescription}`,
  })

  return { success: true, remainingAvailable: frameState.availableFrame }
}

/**
 * Applies a disciplinary penalty with the Penalty Overflow Rule
 * If penalty > availableFrame:
 * 1. availableFrame drops to 0 (floor = 0)
 * 2. remaining penalty deducted from totalFrame (floor = 0)
 * 3. cycleFrame reduced (can drop to 0, floor = 0)
 */
export function applyDisciplinaryFramePenalty(
  frameState: FleetFrameState,
  penaltyAmount: number,
  reason: string,
  gameDay: number
): { availableDeducted: number; totalDeducted: number; cycleDeducted: number } {
  if (penaltyAmount <= 0) return { availableDeducted: 0, totalDeducted: 0, cycleDeducted: 0 }

  const initialAvailable = frameState.availableFrame
  const initialTotal = frameState.totalFrame
  const initialCycle = frameState.cycleFrame

  let availableDeducted = 0
  let totalDeducted = 0

  if (initialAvailable >= penaltyAmount) {
    frameState.availableFrame -= penaltyAmount
    availableDeducted = penaltyAmount
  } else {
    // Penalty Overflow
    availableDeducted = initialAvailable
    frameState.availableFrame = 0

    const remainder = penaltyAmount - availableDeducted
    totalDeducted = Math.min(remainder, frameState.totalFrame)
    frameState.totalFrame = Math.max(0, frameState.totalFrame - totalDeducted)
  }

  const cycleDeducted = Math.min(penaltyAmount, frameState.cycleFrame)
  frameState.cycleFrame = Math.max(0, frameState.cycleFrame - cycleDeducted)

  frameState.auditLog.push({
    id: `frame_penalty_${gameDay}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    gameDay,
    type: "DISCIPLINARY_PENALTY",
    deltaCycle: -cycleDeducted,
    deltaAvailable: -availableDeducted,
    deltaTotal: -totalDeducted,
    balanceAfterCycle: frameState.cycleFrame,
    balanceAfterAvailable: frameState.availableFrame,
    balanceAfterTotal: frameState.totalFrame,
    description: `Kỷ luật quân vụ: ${reason} (Trừ Available: ${availableDeducted}, Trừ Total: ${totalDeducted})`,
  })

  return { availableDeducted, totalDeducted, cycleDeducted }
}

/**
 * Calculates national average cycleFrame across eligible fleets
 */
export function calculateNationalAverageCycleFrame(
  frameStates: (FleetFrameState | { frameState?: FleetFrameState })[]
): number {
  if (frameStates.length === 0) return 0

  let sum = 0
  let count = 0

  for (const item of frameStates) {
    const fs: FleetFrameState | undefined = (item as any).frameState || ((item as any).cycleFrame !== undefined ? item : undefined)
    if (fs) {
      sum += fs.cycleFrame
      count += 1
    }
  }

  return count > 0 ? Math.round(sum / count) : 0
}

/**
 * Executes the Annual FRAME Decay (360 GAME_DAYS)
 *
 * Formula:
 * - BaseDecay = NationalAverageCycle / 2
 * - ActualDecay = min(BaseDecay, TotalBeforeDecay * 50%)
 *
 * Exemption:
 * - New Guild Protection active (10 Game Years / 3600 days)
 * - Frontline war exception
 *
 * Idempotent:
 * - Only runs once per calendar year (gameDay / 360).
 */
export function processAnnualFrameDecay(
  fleet: FleetEntityState,
  frameState: FleetFrameState,
  nationalAverageCycle: number,
  currentGameDay: number,
  policyProfile?: FleetPolicyProfile
): { decayApplied: boolean; amount: number; reason: string } {
  const policy = policyProfile || getFleetPolicyProfile("POLICY_NATIONAL_STANDARD_2026")
  const cycleDays = policy?.annualDecayCycleDays || 360
  const divisor = policy?.annualDecayDivisor || 2
  const maxCapPercent = (policy?.annualDecayMaxCapPercent || 50) / 100

  const currentYear = Math.floor(currentGameDay / cycleDays)

  // 1. Idempotency Check: Already processed for this year?
  if (frameState.lastDecayProcessedYear >= currentYear) {
    return {
      decayApplied: false,
      amount: 0,
      reason: `Năm tài chính #${currentYear} đã được quyết toán suy giảm trước đó (Idempotent Guard)`,
    }
  }

  // 2. NEW_GUILD_PROTECTION Check
  if (fleet.newGuildProtectionExpiryDay && currentGameDay < fleet.newGuildProtectionExpiryDay) {
    frameState.lastDecayProcessedYear = currentYear
    frameState.cycleFrame = 0 // Reset cycle for new year
    frameState.subsidiesClaimedThisCycle = 0

    frameState.auditLog.push({
      id: `frame_decay_exempt_${currentGameDay}_${Date.now()}`,
      gameDay: currentGameDay,
      type: "ANNUAL_DECAY",
      deltaCycle: 0,
      deltaAvailable: 0,
      deltaTotal: 0,
      balanceAfterCycle: 0,
      balanceAfterAvailable: frameState.availableFrame,
      balanceAfterTotal: frameState.totalFrame,
      description: `Quyết toán Năm #${currentYear}: MIỄN TRỪ 100% nhờ Gói Bảo Hộ Tân Binh (NEW_GUILD_PROTECTION)`,
    })

    return {
      decayApplied: false,
      amount: 0,
      reason: "Hạm đội được miễn trừ hoàn toàn Decay nhờ Gói Bảo Hộ Tân Binh (NEW_GUILD_PROTECTION)",
    }
  }

  // 3. Compute Decay
  const baseDecay = Math.round(nationalAverageCycle / divisor)
  const maxCap = Math.round(frameState.totalFrame * maxCapPercent)
  const actualDecay = Math.min(baseDecay, maxCap)

  if (actualDecay > 0) {
    const totalDeducted = Math.min(actualDecay, frameState.totalFrame)
    frameState.totalFrame = Math.max(0, frameState.totalFrame - totalDeducted)

    // Deduct available up to actualDecay as well, with floor 0
    const availableDeducted = Math.min(actualDecay, frameState.availableFrame)
    frameState.availableFrame = Math.max(0, frameState.availableFrame - availableDeducted)

    frameState.auditLog.push({
      id: `frame_decay_${currentGameDay}_${Date.now()}`,
      gameDay: currentGameDay,
      type: "ANNUAL_DECAY",
      deltaCycle: -frameState.cycleFrame,
      deltaAvailable: -availableDeducted,
      deltaTotal: -totalDeducted,
      balanceAfterCycle: 0,
      balanceAfterAvailable: frameState.availableFrame,
      balanceAfterTotal: frameState.totalFrame,
      description: `Quyết toán Suy Giảm Thường Niên Năm #${currentYear}: -${actualDecay} pts (Avg: ${nationalAverageCycle}, Base: ${baseDecay})`,
    })
  }

  // Reset cycle metrics for new calendar year
  frameState.cycleFrame = 0
  frameState.subsidiesClaimedThisCycle = 0
  frameState.lastDecayProcessedYear = currentYear

  return {
    decayApplied: actualDecay > 0,
    amount: actualDecay,
    reason: `Khấu trừ suy giảm thường niên Năm #${currentYear}: ${actualDecay} pts`,
  }
}

/**
 * Alias helper for calculating and applying annual FRAME decay
 */
export function calculateAnnualFrameDecay(
  fleet: FleetEntityState,
  frameState: FleetFrameState,
  nationalAverageCycle: number,
  currentGameDayOrYear: number,
  policyProfile?: FleetPolicyProfile
): { decayApplied: boolean; amount: number; deductedFrame: number; decayedRate: number; reason: string } {
  const gameDay = currentGameDayOrYear < 100 ? currentGameDayOrYear * 360 : currentGameDayOrYear
  const res = processAnnualFrameDecay(fleet, frameState, nationalAverageCycle, gameDay, policyProfile)
  return {
    ...res,
    deductedFrame: res.amount,
    decayedRate: res.amount,
  }
}

/**
 * Calculates current subsidy rate for a fleet
 * MaxSubsidies = multiplier * MK_Tier
 * Uses 1-3: 100%
 * Uses > 3: Degressive down to floor 30%
 * Frontline War Exception: 100% if threat > 70% or border
 */
export function calculateFleetSubsidyRate(
  fleet: FleetEntityState,
  frameState: FleetFrameState,
  sectorThreatLevel: number,
  isBorderSector = false,
  policyProfile?: FleetPolicyProfile
): {
  eligible: boolean
  subsidyRatePercent: number
  maxSubsidies: number
  currentUsage: number
  isFrontlineException: boolean
  reason: string
} {
  const policy = policyProfile || getFleetPolicyProfile("POLICY_NATIONAL_STANDARD_2026")
  const fleetClass = getFleetClass(fleet.fleetClassId)
  const mkTier = fleetClass?.tierOrder || 1

  const multiplier = policy?.subsidyMultiplierPerTier || 10
  const maxSubsidies = multiplier * mkTier
  const currentUsage = frameState.subsidiesClaimedThisCycle
  const floorRate = policy?.subsidyFloorPercent || 30
  const fullRateLimit = policy?.subsidyFullRateLimit || 3

  if (currentUsage >= maxSubsidies) {
    return {
      eligible: false,
      subsidyRatePercent: 0,
      maxSubsidies,
      currentUsage,
      isFrontlineException: false,
      reason: `Đã sử dụng hết hạn mức trợ cấp của chu kỳ (${currentUsage}/${maxSubsidies} lượt)`,
    }
  }

  // Frontline War Exception Check
  const isFrontline = policy?.frontlineWarExceptionEnabled && (sectorThreatLevel >= 70 || isBorderSector)
  if (isFrontline) {
    return {
      eligible: true,
      subsidyRatePercent: 100,
      maxSubsidies,
      currentUsage,
      isFrontlineException: true,
      reason: `Chiến sự tiền tuyến (Threat: ${sectorThreatLevel}%): Hưởng trợ cấp đặc biệt 100% chi phí`,
    }
  }

  // Uses 1 to 3: 100%
  if (currentUsage < fullRateLimit) {
    return {
      eligible: true,
      subsidyRatePercent: 100,
      maxSubsidies,
      currentUsage,
      isFrontlineException: false,
      reason: `Lượt trợ cấp tiêu chuẩn #${currentUsage + 1} (Hỗ trợ 100%)`,
    }
  }

  // Degressive curve from 100% down to floorRate%
  const stepsRemaining = maxSubsidies - fullRateLimit
  const stepIndex = currentUsage - fullRateLimit + 1
  const slope = (100 - floorRate) / Math.max(1, stepsRemaining)
  const subsidyRate = Math.max(floorRate, Math.round(100 - (stepIndex * slope)))

  return {
    eligible: true,
    subsidyRatePercent: subsidyRate,
    maxSubsidies,
    currentUsage,
    isFrontlineException: false,
    reason: `Trợ cấp giảm dần đều #${currentUsage + 1}: ${subsidyRate}% (Sàn bảo trợ: ${floorRate}%)`,
  }
}

/**
 * Claims a fleet maintenance subsidy
 * Deducts subsidized portion from national/base support and only charges remainder to fleet treasury.
 */
export function claimFleetMaintenanceSubsidy(
  fleet: FleetEntityState,
  frameState: FleetFrameState,
  maintenanceCostCredits: number,
  sectorThreatLevel: number,
  isBorderSector = false,
  gameDay = 1,
  policyProfile?: FleetPolicyProfile
): {
  success: boolean
  subsidizedCredits: number
  fleetPaidCredits: number
  newClaimCount: number
  error?: string
} {
  const rateCalc = calculateFleetSubsidyRate(fleet, frameState, sectorThreatLevel, isBorderSector, policyProfile)
  if (!rateCalc.eligible) {
    return {
      success: false,
      subsidizedCredits: 0,
      fleetPaidCredits: maintenanceCostCredits,
      newClaimCount: frameState.subsidiesClaimedThisCycle,
      error: rateCalc.reason,
    }
  }

  const subsidizedCredits = Math.round((maintenanceCostCredits * rateCalc.subsidyRatePercent) / 100)
  const fleetPaidCredits = maintenanceCostCredits - subsidizedCredits

  // Increment usage count
  frameState.subsidiesClaimedThisCycle += 1
  fleet.subsidiesClaimedThisCycle = frameState.subsidiesClaimedThisCycle

  return {
    success: true,
    subsidizedCredits,
    fleetPaidCredits,
    newClaimCount: frameState.subsidiesClaimedThisCycle,
  }
}
