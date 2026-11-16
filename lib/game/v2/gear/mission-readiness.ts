/**
 * STARFRONT WORLD V2 — GEAR V2 P1 OD-07 Mission-Readiness Policy & Validator
 *
 * Pure mission-readiness validation separated from pure weight calculation.
 * Mandatory equipment priority (diagnostic/requirement ordering ONLY; never enforces equip sequence):
 *   1. ARMOR (`armor`)
 *   2. ENGINE (`engine`)
 *   3. RADAR_SENSOR (`radar_sensor`)
 *   4. At least one of STANDARD_WEAPON (`standard_weapon`) / ADVANCED_WEAPON (`advanced_weapon`)
 *      for COMBAT or UNSAFE_ZONE.
 */

import { DEFAULT_GEAR_V2_WEIGHT_CONFIG } from "./weight-config"
import { GearV2WeightError, calculateLoadoutWeight } from "./weight-engine"
import type {
  GearV2CompatibilityStatus,
  GearV2MandatoryPriorityKey,
  GearV2MissionReadinessOptions,
  GearV2MissionReadinessPolicy,
  GearV2MissionReadinessResult,
  GearV2PhysicalSlotId,
  GearV2ValidationMode,
  GearV2WeightCalculationInput,
  GearV2WeightConfig,
  GearV2WeightIssue,
} from "./types"

export interface GearV2MandatoryPriorityRule {
  priority: 1 | 2 | 3 | 4
  key: GearV2MandatoryPriorityKey
  slotIds: readonly GearV2PhysicalSlotId[]
  requirementType: "REQUIRED_SINGLE" | "REQUIRED_AT_LEAST_ONE_FOR_COMBAT"
}

export const GEAR_V2_OD07_MANDATORY_PRIORITY: readonly GearV2MandatoryPriorityRule[] = [
  {
    priority: 1,
    key: "ARMOR",
    slotIds: ["armor"],
    requirementType: "REQUIRED_SINGLE",
  },
  {
    priority: 2,
    key: "ENGINE",
    slotIds: ["engine"],
    requirementType: "REQUIRED_SINGLE",
  },
  {
    priority: 3,
    key: "RADAR_SENSOR",
    slotIds: ["radar_sensor"],
    requirementType: "REQUIRED_SINGLE",
  },
  {
    priority: 4,
    key: "WEAPON",
    slotIds: ["standard_weapon", "advanced_weapon"],
    requirementType: "REQUIRED_AT_LEAST_ONE_FOR_COMBAT",
  },
] as const

export const GEAR_V2_CORE_MANDATORY_SLOT_IDS: readonly GearV2PhysicalSlotId[] = [
  "armor",
  "engine",
  "radar_sensor",
] as const

export const GEAR_V2_WEAPON_ALTERNATIVE_SLOT_IDS: readonly GearV2PhysicalSlotId[] = [
  "standard_weapon",
  "advanced_weapon",
] as const

export const GEAR_V2_VALIDATION_MODES: readonly GearV2ValidationMode[] = [
  "DRAFT",
  "CONFIRM",
  "SAVE",
  "SAFE_FLIGHT",
  "TRAINING",
  "TRANSPORT",
  "COMBAT",
  "UNSAFE_ZONE",
] as const

const POLICY_MAP: Readonly<Record<GearV2ValidationMode, GearV2MissionReadinessPolicy>> = {
  DRAFT: {
    mode: "DRAFT",
    allowMissingSlots: true,
    allowOverCapacity: true,
    requireCoreSlots: false,
    requireAtLeastOneWeapon: false,
    requiredCoreSlotIds: [],
    weaponAlternativeSlotIds: [],
    priorityOrder: [],
  },
  CONFIRM: {
    mode: "CONFIRM",
    allowMissingSlots: true,
    allowOverCapacity: false,
    requireCoreSlots: false,
    requireAtLeastOneWeapon: false,
    requiredCoreSlotIds: [],
    weaponAlternativeSlotIds: [],
    priorityOrder: [],
  },
  SAVE: {
    mode: "SAVE",
    allowMissingSlots: true,
    allowOverCapacity: false,
    requireCoreSlots: false,
    requireAtLeastOneWeapon: false,
    requiredCoreSlotIds: [],
    weaponAlternativeSlotIds: [],
    priorityOrder: [],
  },
  SAFE_FLIGHT: {
    mode: "SAFE_FLIGHT",
    allowMissingSlots: false,
    allowOverCapacity: false,
    requireCoreSlots: true,
    requireAtLeastOneWeapon: false,
    requiredCoreSlotIds: GEAR_V2_CORE_MANDATORY_SLOT_IDS,
    weaponAlternativeSlotIds: [],
    priorityOrder: ["ARMOR", "ENGINE", "RADAR_SENSOR"],
  },
  TRAINING: {
    mode: "TRAINING",
    allowMissingSlots: false,
    allowOverCapacity: false,
    requireCoreSlots: true,
    requireAtLeastOneWeapon: false,
    requiredCoreSlotIds: GEAR_V2_CORE_MANDATORY_SLOT_IDS,
    weaponAlternativeSlotIds: [],
    priorityOrder: ["ARMOR", "ENGINE", "RADAR_SENSOR"],
  },
  TRANSPORT: {
    mode: "TRANSPORT",
    allowMissingSlots: false,
    allowOverCapacity: false,
    requireCoreSlots: true,
    requireAtLeastOneWeapon: false,
    requiredCoreSlotIds: GEAR_V2_CORE_MANDATORY_SLOT_IDS,
    weaponAlternativeSlotIds: [],
    priorityOrder: ["ARMOR", "ENGINE", "RADAR_SENSOR"],
  },
  COMBAT: {
    mode: "COMBAT",
    allowMissingSlots: false,
    allowOverCapacity: false,
    requireCoreSlots: true,
    requireAtLeastOneWeapon: true,
    requiredCoreSlotIds: GEAR_V2_CORE_MANDATORY_SLOT_IDS,
    weaponAlternativeSlotIds: GEAR_V2_WEAPON_ALTERNATIVE_SLOT_IDS,
    priorityOrder: ["ARMOR", "ENGINE", "RADAR_SENSOR", "WEAPON"],
  },
  UNSAFE_ZONE: {
    mode: "UNSAFE_ZONE",
    allowMissingSlots: false,
    allowOverCapacity: false,
    requireCoreSlots: true,
    requireAtLeastOneWeapon: true,
    requiredCoreSlotIds: GEAR_V2_CORE_MANDATORY_SLOT_IDS,
    weaponAlternativeSlotIds: GEAR_V2_WEAPON_ALTERNATIVE_SLOT_IDS,
    priorityOrder: ["ARMOR", "ENGINE", "RADAR_SENSOR", "WEAPON"],
  },
}

export function normalizeGearV2ValidationMode(
  mode: string
): GearV2ValidationMode | null {
  if (typeof mode !== "string") return null
  const key = mode.trim().toUpperCase()
  if (key in POLICY_MAP) {
    return key as GearV2ValidationMode
  }
  return null
}

export function getMissionReadinessPolicy(mode: string): GearV2MissionReadinessPolicy {
  const normalized = normalizeGearV2ValidationMode(mode)
  if (!normalized) {
    throw new GearV2WeightError(
      "INVALID_VALIDATION_MODE",
      `Unknown validation mode '${String(mode)}'.`,
      {
        code: "INVALID_VALIDATION_MODE",
        message: `Unknown validation mode '${String(mode)}'.`,
        field: "mode",
      }
    )
  }
  return POLICY_MAP[normalized]
}

/**
 * Pure OD-07 mission-readiness validator.
 * - Keeps weight calculations pure and isolated via `calculateLoadoutWeight`.
 * - Never mutates loadout input (never auto-equips or auto-unequips).
 * - Never enforces equip-operation sequence; priority orders missing-slot diagnostics only.
 * - Never claims compatibility checking exists in P1 unless caller supplies it.
 */
export function validateLoadoutReadiness(
  input: GearV2WeightCalculationInput,
  mode: GearV2ValidationMode | string,
  config: GearV2WeightConfig = DEFAULT_GEAR_V2_WEIGHT_CONFIG,
  options?: GearV2MissionReadinessOptions
): GearV2MissionReadinessResult {
  const hasCompatibilityCheck = Boolean(options?.compatibility?.checked)
  const compatibilityStatus: GearV2CompatibilityStatus = hasCompatibilityCheck
    ? "CHECKED_FROM_CALLER"
    : "NOT_CHECKED_IN_P1"

  const normalizedMode = normalizeGearV2ValidationMode(mode)
  if (!normalizedMode) {
    return {
      mode: String(mode),
      valid: false,
      weightValid: false,
      mandatorySlotsSatisfied: false,
      compatibilityStatus,
      policy: null,
      missingMandatorySlots: [],
      missingPriorityOrder: [],
      calculation: null,
      errors: [
        {
          code: "INVALID_VALIDATION_MODE",
          message: `Unknown validation mode '${String(mode)}'.`,
          field: "mode",
        },
      ],
      warnings: [],
    }
  }

  const policy = POLICY_MAP[normalizedMode]

  try {
    const calculation = calculateLoadoutWeight(input, config)
    const errors: GearV2WeightIssue[] = []
    const warnings: string[] = []

    const weightValid = policy.allowOverCapacity || !calculation.isOverCapacity
    if (!weightValid) {
      errors.push({
        code: "EXCESS_LOAD_FORBIDDEN_ON_CONFIRM",
        message: `Loadout weight (${calculation.totalWeightGrams}g) exceeds capacity (${calculation.maxLoadGrams}g) by ${calculation.excessWeightGrams}g.`,
        field: "totalWeightGrams",
      })
    } else if (policy.allowOverCapacity && calculation.isOverCapacity) {
      warnings.push("OVER_CAPACITY_DRAFT_ALLOWED")
    }

    const invalidSlotSet = new Set<GearV2PhysicalSlotId>()
    if (hasCompatibilityCheck && options?.compatibility) {
      const compat = options.compatibility
      if (compat.invalidSlotIds) {
        for (const s of compat.invalidSlotIds) {
          invalidSlotSet.add(s)
        }
      }
      if (compat.issues) {
        for (const issue of compat.issues) {
          errors.push({
            code: "EXTERNAL_COMPATIBILITY_FAILED",
            message: issue.message,
            slotId: issue.slotId,
            equipmentId: issue.equipmentId,
          })
        }
      }
      for (const badSlot of invalidSlotSet) {
        if (calculation.perSlotWeightGrams[badSlot] !== undefined) {
          const alreadyReported = errors.some(
            (e) => e.code === "EXTERNAL_COMPATIBILITY_FAILED" && e.slotId === badSlot
          )
          if (!alreadyReported) {
            errors.push({
              code: "EXTERNAL_COMPATIBILITY_FAILED",
              message: `Equipped item in slot '${badSlot}' failed caller-supplied compatibility validation.`,
              slotId: badSlot,
            })
          }
        }
      }
      if (
        compat.valid === false &&
        !errors.some((e) => e.code === "EXTERNAL_COMPATIBILITY_FAILED")
      ) {
        errors.push({
          code: "EXTERNAL_COMPATIBILITY_FAILED",
          message: "Caller-supplied compatibility validation failed.",
        })
      }
    }

    const isSlotValidAndOccupied = (slotId: GearV2PhysicalSlotId): boolean =>
      calculation.perSlotWeightGrams[slotId] !== undefined &&
      !invalidSlotSet.has(slotId)

    const missingMandatorySlots: GearV2PhysicalSlotId[] = []
    const missingPriorityOrder: GearV2MandatoryPriorityKey[] = []

    if (policy.requireCoreSlots) {
      const coreRules: ReadonlyArray<{
        priority: 1 | 2 | 3
        key: "ARMOR" | "ENGINE" | "RADAR_SENSOR"
        slotId: GearV2PhysicalSlotId
      }> = [
        { priority: 1, key: "ARMOR", slotId: "armor" },
        { priority: 2, key: "ENGINE", slotId: "engine" },
        { priority: 3, key: "RADAR_SENSOR", slotId: "radar_sensor" },
      ]

      for (const rule of coreRules) {
        if (!isSlotValidAndOccupied(rule.slotId)) {
          missingMandatorySlots.push(rule.slotId)
          missingPriorityOrder.push(rule.key)
          errors.push({
            code: "MANDATORY_SLOT_UNFILLED",
            message: `Mandatory priority ${rule.priority} slot '${rule.slotId}' is required for ${policy.mode}.`,
            slotId: rule.slotId,
            priority: rule.priority,
          })
        }
      }
    }

    if (policy.requireAtLeastOneWeapon) {
      const hasValidWeapon =
        isSlotValidAndOccupied("standard_weapon") ||
        isSlotValidAndOccupied("advanced_weapon")

      if (!hasValidWeapon) {
        missingMandatorySlots.push("standard_weapon", "advanced_weapon")
        missingPriorityOrder.push("WEAPON")
        errors.push({
          code: "MANDATORY_WEAPON_UNFILLED",
          message: `Mandatory priority 4 requires at least one valid weapon ('standard_weapon' or 'advanced_weapon') for ${policy.mode}.`,
          slotId: "standard_weapon",
          priority: 4,
        })
      }
    }

    const mandatorySlotsSatisfied = missingPriorityOrder.length === 0
    const valid = errors.length === 0

    return {
      mode: policy.mode,
      valid,
      weightValid,
      mandatorySlotsSatisfied,
      compatibilityStatus,
      policy,
      missingMandatorySlots,
      missingPriorityOrder,
      calculation,
      errors,
      warnings,
    }
  } catch (err) {
    const issue: GearV2WeightIssue =
      err instanceof GearV2WeightError
        ? err.details ?? { code: err.code, message: err.message }
        : {
            code: "INVALID_WEIGHT_CONFIG",
            message:
              err instanceof Error ? err.message : "Unknown validation error.",
          }

    return {
      mode: policy.mode,
      valid: false,
      weightValid: false,
      mandatorySlotsSatisfied: false,
      compatibilityStatus,
      policy,
      missingMandatorySlots: [],
      missingPriorityOrder: [],
      calculation: null,
      errors: [issue],
      warnings: [],
    }
  }
}
