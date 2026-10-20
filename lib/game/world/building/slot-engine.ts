/**
 * STARFRONT WORLD — Shared Slot & Tier Growth Engine (Phase 6.34A-FND-5)
 *
 * Implements:
 * 1. Typed Slots & Flexible Generic Slots calculation for Base, Building, and Orbital Sub-Base.
 * 2. Slot Growth aligned with FND-2 Progression Tiers.
 * 3. MAX TIER BONUS: At MK X (Tier 10), applies standard MK X growth + 1-time step bonus.
 * 4. Idempotency guarantee: Reloading save never duplicates the MAX TIER BONUS.
 * 5. Orbital Sub-Base restriction (constrained child entity of parent base).
 */

import type {
  BaseEntityState,
  BuildingInstance,
  BuildingModuleDefinition,
  SlotProfile,
} from "./types"

export interface EvaluatedSlots {
  typedSlots: Record<string, number>
  genericSlots: number
  totalSlots: number
  maxTierBonusApplied: boolean
}

/**
 * Calculates available slots for a given SlotProfile and Tier (MK I to MK X)
 */
export function calculateSlots(
  profile: SlotProfile,
  tier: number,
  isMaxTierBonusAlreadyApplied: boolean = false
): EvaluatedSlots {
  const safeTier = Math.max(1, Math.min(10, tier))
  const typedSlots: Record<string, number> = {}

  let totalTyped = 0
  for (const [slotType, baseCount] of Object.entries(profile.baseTypedSlots)) {
    const growth = profile.growthPerTierTyped?.[slotType] || 0
    let count = baseCount + Math.floor(growth * (safeTier - 1))

    // Apply typed max tier bonus if Tier 10
    if (safeTier === 10 && profile.maxTierStepBonusTyped?.[slotType]) {
      count += profile.maxTierStepBonusTyped[slotType]
    }
    typedSlots[slotType] = count
    totalTyped += count
  }

  // Generic slots calculation
  const growthGeneric = profile.growthPerTierGeneric || 0
  let genericCount = profile.baseGenericSlots + Math.floor(growthGeneric * (safeTier - 1))

  let bonusApplied = isMaxTierBonusAlreadyApplied
  if (safeTier === 10) {
    const bonus = profile.maxTierStepBonusGeneric || 0
    // If not already applied or evaluating pure tier capacity, add the bonus
    genericCount += bonus
    bonusApplied = true
  }

  return {
    typedSlots,
    genericSlots: genericCount,
    totalSlots: totalTyped + genericCount,
    maxTierBonusApplied: bonusApplied,
  }
}

/**
 * Evaluates and updates expansion slots on a BaseEntityState based on Tier progression
 */
export function updateBaseSlotsOnTierProgression(
  base: BaseEntityState,
  profile: SlotProfile
): EvaluatedSlots {
  const evaluated = calculateSlots(profile, base.tier, base.maxTierBonusApplied)
  base.maxExpansionSlots = evaluated.totalSlots

  if (base.tier >= 10) {
    base.maxTierBonusApplied = true
  }

  return evaluated
}

/**
 * Checks if a base has available expansion capacity for a new building
 */
export function canAddExpansionBuilding(
  base: BaseEntityState,
  isCoreFacility: boolean = false
): { canAdd: boolean; reason?: string } {
  // Core facilities do NOT occupy expansion slots!
  if (isCoreFacility) {
    return { canAdd: true }
  }

  const currentExpansionCount = base.expansionBuildingIds.length
  if (currentExpansionCount >= base.maxExpansionSlots) {
    return {
      canAdd: false,
      reason: `EXPANSION_SLOTS_FULL: Base has reached capacity (${currentExpansionCount}/${base.maxExpansionSlots}).`,
    }
  }

  return { canAdd: true }
}

/**
 * Equips a module onto a building instance with slot capacity validation
 */
export function equipModule(
  building: BuildingInstance,
  moduleDef: BuildingModuleDefinition,
  slotProfile: SlotProfile
): { success: boolean; reason?: string } {
  const currentSlots = calculateSlots(slotProfile, building.currentTier, building.maxTierBonusApplied)
  const currentEquippedCount = building.equippedModules.length

  if (currentEquippedCount >= currentSlots.totalSlots) {
    return {
      success: false,
      reason: `SLOT_CAPACITY_EXCEEDED: Building has ${currentEquippedCount}/${currentSlots.totalSlots} slots used.`,
    }
  }

  // Check typed slot matching if module requires specific slot
  if (moduleDef.slotType !== "GENERIC") {
    const allowedTypedCount = currentSlots.typedSlots[moduleDef.slotType] || 0
    const currentTypedUsed = building.equippedModules.filter((m) => m === moduleDef.id).length
    // If specific typed slot is full, fallback to generic slots
    const availableGeneric = currentSlots.genericSlots - Math.max(0, currentEquippedCount - allowedTypedCount)
    if (allowedTypedCount === 0 && availableGeneric <= 0) {
      return {
        success: false,
        reason: `NO_COMPATIBLE_SLOT: Module requires '${moduleDef.slotType}' and no generic slots remaining.`,
      }
    }
  }

  building.equippedModules.push(moduleDef.id)

  // Apply stat modifiers if any
  if (moduleDef.statModifiers) {
    if (moduleDef.statModifiers.operationalEfficiencyPct) {
      building.performanceBonusMultiplier += moduleDef.statModifiers.operationalEfficiencyPct / 100
    }
  }

  return { success: true }
}

/**
 * Unequips a module from a building instance
 */
export function unequipModule(
  building: BuildingInstance,
  moduleId: string,
  moduleDef?: BuildingModuleDefinition
): { success: boolean; reason?: string } {
  const idx = building.equippedModules.indexOf(moduleId)
  if (idx === -1) {
    return { success: false, reason: "MODULE_NOT_EQUIPPED" }
  }

  if (moduleDef && !moduleDef.isDetachable) {
    return { success: false, reason: "SYSTEM_CAPABILITY_CANNOT_BE_DETACHED" }
  }

  building.equippedModules.splice(idx, 1)

  if (moduleDef?.statModifiers?.operationalEfficiencyPct) {
    building.performanceBonusMultiplier = Math.max(
      1.0,
      building.performanceBonusMultiplier - moduleDef.statModifiers.operationalEfficiencyPct / 100
    )
  }

  return { success: true }
}
