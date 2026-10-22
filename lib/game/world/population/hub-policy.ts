/**
 * STARFRONT WORLD — Base Multi-Hub Slot Policy & Integration (Phase 6.34A-FND-4)
 *
 * Implements:
 * 1. Multi-Hub slot unlocking tied to FND-2 Progression Tiers.
 * 2. Standard Base policy:
 *    - hubUnlockEveryTiers = 2
 *    - maxHubTypes = 3
 * 3. CAPITAL (origin faction capital) policy:
 *    - hubUnlockEveryTiers = 1
 *    - maxHubTypes = unlimited
 * 4. Invariant: Tier unlock grants the RIGHT to open a slot; it does not automatically
 *    construct the Hub type without domain validation.
 */

import type { BaseHubStatus, BasePopulationState, BaseType, HubSlotPolicy } from "./types"

export const STANDARD_BASE_HUB_POLICY: HubSlotPolicy = {
  hubUnlockEveryTiers: 2,
  maxHubTypes: 3,
}

export const CAPITAL_BASE_HUB_POLICY: HubSlotPolicy = {
  hubUnlockEveryTiers: 1,
  maxHubTypes: "unlimited",
}

/**
 * Returns slot policy for a specific base type
 */
export function getBaseHubPolicy(baseType: BaseType): HubSlotPolicy {
  if (baseType === "CAPITAL") {
    return CAPITAL_BASE_HUB_POLICY
  }
  return STANDARD_BASE_HUB_POLICY
}

/**
 * Evaluates current hub slot status based on base type and progression tier
 */
export function evaluateBaseHubStatus(
  baseId: string,
  baseType: BaseType,
  currentTier: number,
  activeHubs: string[] = []
): BaseHubStatus {
  const policy = getBaseHubPolicy(baseType)
  const safeTier = Math.max(1, currentTier)

  let unlockedSlots = 0

  if (policy.maxHubTypes === "unlimited") {
    // Capital unlocks 1 slot per tier (Tier 1 = 1, Tier 2 = 2, ...)
    unlockedSlots = Math.floor(safeTier / policy.hubUnlockEveryTiers)
  } else {
    // Normal base unlocks 1 slot every 2 tiers (Tier 2 = 1, Tier 4 = 2, Tier 6 = 3)
    const rawUnlocked = Math.floor(safeTier / policy.hubUnlockEveryTiers)
    unlockedSlots = Math.min(policy.maxHubTypes, rawUnlocked)
  }

  const maxSlots = policy.maxHubTypes
  const activeCount = activeHubs.length
  const canAddHub = activeCount < unlockedSlots

  let nextUnlockTier: number | undefined
  if (policy.maxHubTypes === "unlimited" || unlockedSlots < policy.maxHubTypes) {
    nextUnlockTier = (unlockedSlots + 1) * policy.hubUnlockEveryTiers
  }

  return {
    baseId,
    baseType,
    currentTier: safeTier,
    unlockedSlots,
    maxSlots,
    activeHubs: [...activeHubs],
    canAddHub,
    nextUnlockTier,
  }
}

/**
 * Validates if a new Hub Type can be added to the Base
 */
export function canAddHubType(
  hubStatus: BaseHubStatus,
  newHubType: string
): { canAdd: boolean; reason?: string } {
  if (hubStatus.activeHubs.includes(newHubType)) {
    return { canAdd: false, reason: `HUB_ALREADY_ACTIVE: '${newHubType}' is already operational.` }
  }

  if (!hubStatus.canAddHub) {
    if (hubStatus.maxSlots !== "unlimited" && hubStatus.unlockedSlots >= hubStatus.maxSlots) {
      return { canAdd: false, reason: `MAX_HUB_LIMIT_REACHED: Base has reached maximum capacity (${hubStatus.maxSlots}).` }
    }
    return {
      canAdd: false,
      reason: `NO_AVAILABLE_HUB_SLOTS: Requires Tier ${hubStatus.nextUnlockTier} to unlock next slot.`,
    }
  }

  return { canAdd: true }
}

/**
 * Adds an active Hub Type to Base state if allowed
 */
export function addHubTypeToBase(
  baseState: BasePopulationState,
  newHubType: string,
  currentTier: number
): { success: boolean; reason?: string } {
  const status = evaluateBaseHubStatus(
    baseState.baseId,
    baseState.baseType,
    currentTier,
    baseState.activeHubTypes
  )

  const check = canAddHubType(status, newHubType)
  if (!check.canAdd) {
    return { success: false, reason: check.reason }
  }

  baseState.activeHubTypes.push(newHubType)
  return { success: true }
}
