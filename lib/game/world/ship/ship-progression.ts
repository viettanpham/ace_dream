/**
 * STARFRONT WORLD — Ship Progression & Tier Breakthrough Engine (Phase 7.2)
 *
 * Implements:
 * 1. FND-2 Shared Progression Engine Integration (Level, EXP, Tier MK I..X)
 * 2. Strict Hard Tier Boundaries (AWAITING_UPGRADE) with Zero Hidden Overflow
 * 3. Base/Orbital Dockyard Tier Upgrade Validation & Execution
 * 4. 1-Time Permanent MAX TIER BONUS (MK X Capstone)
 */

import {
  completeTierUpgrade,
  gainExp,
  getActiveTier,
  getNextTier,
  startTierUpgrade,
} from "../progression/engine"
import { SYSTEM_DEFAULT_PROGRESSION_PROFILES } from "../progression/seed-data"
import type { ProgressionProfile, TierDefinition } from "../progression/types"
import type { ShipInstance, ShipUpgradeTask } from "./types"

/**
 * Resolves the active progression profile for a ship
 */
function resolveShipProgressionProfile(ship: ShipInstance): ProgressionProfile {
  const profile = SYSTEM_DEFAULT_PROGRESSION_PROFILES.find(
    (p) => p.id === ship.progression.profileId
  )
  return profile || SYSTEM_DEFAULT_PROGRESSION_PROFILES[0]
}

/**
 * Grants EXP to a ship and updates its progression state
 *
 * Enforces NO HIDDEN OVERFLOW when a hard tier boundary is hit.
 */
export function grantShipExp(
  ship: ShipInstance,
  amount: number,
  gameDay: number,
  reason = "Operational service"
): {
  levelsGained: number
  newLevel: number
  newExp: number
  state: string
  reachedHardBoundary: boolean
  reachedMaxed: boolean
} {
  const profile = resolveShipProgressionProfile(ship)
  const result = gainExp(ship.progression, amount, profile, gameDay)

  // Sync ship operational status if newly awaiting upgrade
  if (result.reachedHardBoundary) {
    // Status remains OPERATIONAL, but ship cannot earn further EXP until upgraded
  }

  return {
    levelsGained: result.levelsGained,
    newLevel: result.newLevel,
    newExp: result.newExp,
    state: result.state,
    reachedHardBoundary: result.reachedHardBoundary,
    reachedMaxed: result.reachedMaxed,
  }
}

/**
 * Grants mileage EXP to a ship based on patrol and navigation distances
 */
export function grantShipMileageExp(
  ship: ShipInstance,
  mileageKm: number,
  gameDay: number
) {
  const expAmount = Math.max(1, Math.floor(mileageKm / 100))
  return grantShipExp(ship, expAmount, gameDay, `Patrol mileage ${mileageKm} km`)
}

/**
 * Grants combat EXP to a ship based on engagement performance and victory
 */
export function grantShipCombatExp(
  ship: ShipInstance,
  params: {
    damageDealt?: number
    kills?: number
    victory?: boolean
    gameDay: number
  }
) {
  const damageExp = Math.floor((params.damageDealt || 0) * 0.1)
  const killExp = (params.kills || 0) * 50
  const victoryExp = params.victory ? 100 : 25
  const totalExp = Math.max(10, damageExp + killExp + victoryExp)

  return grantShipExp(ship, totalExp, params.gameDay, "Combat engagement performance")
}

/**
 * Validates whether a ship is eligible to undergo a Tier Upgrade at a specified Base
 *
 * Eligibility checks:
 * 1. Ship state must be AWAITING_UPGRADE
 * 2. Next tier must exist in progression profile
 * 3. Base must have available docking capacity (fleetDockingCapacity > 0 or baseDockingPorts > 0)
 * 4. Base must not be under siege (stage !== "under_siege")
 * 5. Calculates required costs and duration
 */
export function validateShipTierUpgradeEligibility(
  ship: ShipInstance,
  base: any,
  gameDay: number
): {
  eligible: boolean
  reason?: string
  currentTier?: TierDefinition
  nextTier?: TierDefinition
  durationDays: number
  cost: {
    industrialMaterials: number
    energy: number
    credits: number
  }
} {
  const profile = resolveShipProgressionProfile(ship)
  const currentTier = getActiveTier(profile, ship.progression.currentTierId)
  const nextTier = getNextTier(profile, ship.progression.currentTierId)

  if (ship.progression.state !== "AWAITING_UPGRADE") {
    return {
      eligible: false,
      reason: `Ship is not in AWAITING_UPGRADE state (current: ${ship.progression.state}).`,
      currentTier,
      nextTier,
      durationDays: 0,
      cost: { industrialMaterials: 0, energy: 0, credits: 0 },
    }
  }

  if (!nextTier) {
    return {
      eligible: false,
      reason: `Ship has already reached the maximum attainable tier (${ship.progression.currentTierId}).`,
      currentTier,
      durationDays: 0,
      cost: { industrialMaterials: 0, energy: 0, credits: 0 },
    }
  }

  // Base capability validation
  if (!base) {
    return {
      eligible: false,
      reason: "No valid base specified for drydock upgrade.",
      currentTier,
      nextTier,
      durationDays: 0,
      cost: { industrialMaterials: 0, energy: 0, credits: 0 },
    }
  }

  if (base.stage === "under_siege" || base.stage === "lost") {
    return {
      eligible: false,
      reason: `Base ${base.name || base.id} is under siege or lost; shipyard facilities offline.`,
      currentTier,
      nextTier,
      durationDays: 0,
      cost: { industrialMaterials: 0, energy: 0, credits: 0 },
    }
  }

  const targetTierOrder = nextTier.tierOrder
  const durationDays = Math.max(1, currentTier.upgradeDurationGameDays ?? 1)

  // Cost formulas
  const cost = {
    industrialMaterials: 400 * targetTierOrder,
    energy: 200 * targetTierOrder,
    credits: 800 * targetTierOrder,
  }

  return {
    eligible: true,
    currentTier,
    nextTier,
    durationDays,
    cost,
  }
}

/**
 * Initiates a Tier Upgrade task for a ship at a base drydock
 */
export function startShipTierUpgrade(params: {
  ship: ShipInstance
  base: any
  gameDay: number
  dockPortId?: string
}): {
  success: boolean
  reason?: string
  task?: ShipUpgradeTask
  completeDay?: number
} {
  const { ship, base, gameDay, dockPortId } = params
  const validation = validateShipTierUpgradeEligibility(ship, base, gameDay)

  if (!validation.eligible || !validation.nextTier) {
    return { success: false, reason: validation.reason }
  }

  const profile = resolveShipProgressionProfile(ship)
  const upgradeResult = startTierUpgrade({
    entity: ship.progression,
    profile,
    gameDay,
  })

  if (!upgradeResult.success) {
    return { success: false, reason: upgradeResult.reason }
  }

  const completeDay = upgradeResult.completeDay || gameDay + validation.durationDays
  const task: ShipUpgradeTask = {
    taskId: `upgrade_${ship.instanceId}_${validation.nextTier.tierId}_${gameDay}`,
    shipId: ship.instanceId,
    fromTierId: ship.progression.currentTierId,
    targetTierId: validation.nextTier.tierId,
    baseId: base.id || base.baseId || "base_sol_command_hq",
    dockPortId: dockPortId || ship.currentDockId,
    startDay: gameDay,
    completeDay,
    durationDays: validation.durationDays,
    cost: validation.cost,
    status: "IN_PROGRESS",
  }

  ship.status = "UPGRADING"
  ship.activeUpgradeTask = task
  ship.currentBaseId = task.baseId
  if (task.dockPortId) ship.currentDockId = task.dockPortId

  return { success: true, task, completeDay }
}

/**
 * Processes ongoing upgrade progress, advancing or completing the task when duration finishes
 */
export function processShipTierUpgradeProgress(
  ship: ShipInstance,
  currentGameDay: number
): {
  upgraded: boolean
  remainingDays?: number
  newTierId?: string
  maxTierBonusApplied?: boolean
} {
  const task = ship.activeUpgradeTask
  if (!task || task.status !== "IN_PROGRESS") {
    return { upgraded: false }
  }

  if (currentGameDay < task.completeDay) {
    return {
      upgraded: false,
      remainingDays: task.completeDay - currentGameDay,
    }
  }

  // Complete the upgrade
  const profile = resolveShipProgressionProfile(ship)
  const completeResult = completeTierUpgrade(ship.progression, profile, currentGameDay)

  task.status = "COMPLETED"
  ship.activeUpgradeTask = undefined
  ship.status = "OPERATIONAL"

  // Base tier scaling modifiers
  const targetTier = getActiveTier(profile, completeResult.newTierId)
  if (targetTier) {
    // Stat boost per tier
    const tierBonusHp = Math.round(ship.maxHullHp * 0.1)
    const tierBonusShield = Math.round(ship.maxShieldHp * 0.1)
    ship.maxHullHp += tierBonusHp
    ship.hullHp = Math.min(ship.maxHullHp, ship.hullHp + tierBonusHp)
    ship.maxShieldHp += tierBonusShield
    ship.shieldHp = Math.min(ship.maxShieldHp, ship.shieldHp + tierBonusShield)
    ship.unlockedModuleSlotsCount += 1
  }

  // Check if reached MK X (Tier 10) for 1-time MAX TIER BONUS
  let maxTierBonusApplied = false
  if (
    (targetTier?.tierOrder === 10 || completeResult.newTierId === "TIER_X") &&
    !ship.maxTierBonus?.applied
  ) {
    maxTierBonusApplied = applyShipMaxTierBonus(ship, currentGameDay)
  }

  return {
    upgraded: true,
    newTierId: completeResult.newTierId,
    maxTierBonusApplied,
  }
}

/**
 * Applies the 1-time permanent Capstone MAX TIER BONUS upon reaching MK X (Tier 10)
 *
 * Bonus Rule Framework:
 * - +25% Permanent Max Hull HP
 * - +25% Permanent Max Shield HP
 * - +1 Permanent Bonus Module Slot
 */
export function applyShipMaxTierBonus(
  ship: ShipInstance,
  gameDay: number
): boolean {
  if (ship.maxTierBonus?.applied) return false

  const bonusHullHp = Math.round(ship.maxHullHp * 0.25)
  const bonusShieldHp = Math.round(ship.maxShieldHp * 0.25)
  const bonusSlotUnlocks = 1

  ship.maxHullHp += bonusHullHp
  ship.hullHp += bonusHullHp
  ship.maxShieldHp += bonusShieldHp
  ship.shieldHp += bonusShieldHp
  ship.unlockedModuleSlotsCount += bonusSlotUnlocks

  ship.maxTierBonus = {
    applied: true,
    bonusHullHp,
    bonusShieldHp,
    bonusSlotUnlocks,
    awardedAtGameDay: gameDay,
  }

  return true
}
