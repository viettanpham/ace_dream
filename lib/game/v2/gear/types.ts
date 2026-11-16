/**
 * STARFRONT WORLD V2 — GEAR V2 P1 Weight Engine Types
 * Pure TypeScript domain contracts (isolated from GEAR V1 and FND8.6).
 */

export type GearV2ClassCode = "A" | "B" | "I" | "M" | "R" | "G"

export type GearV2ClassId =
  | "A-GEAR"
  | "B-GEAR"
  | "I-GEAR"
  | "M-GEAR"
  | "R-GEAR"
  | "G-GEAR"

export type GearV2ClassInput = GearV2ClassId | GearV2ClassCode

export type GearV2EngineVariant = "SILENT" | "BASE" | "JET"

export type GearV2SlotGroupId =
  | "ARMOR"
  | "ENGINE"
  | "CPU"
  | "RADAR_SENSOR"
  | "STANDARD_WEAPON"
  | "ADVANCED_WEAPON"
  | "AUXILIARY"

export type GearV2PhysicalSlotId =
  | "armor"
  | "engine"
  | "cpu"
  | "radar_sensor"
  | "standard_weapon"
  | "advanced_weapon"
  | "auxiliary_1"
  | "auxiliary_2"
  | "auxiliary_3"
  | "auxiliary_4"

export interface GearV2SlotDefinition {
  slotId: GearV2PhysicalSlotId
  groupId: GearV2SlotGroupId
  displayName: string
  positionIndex: number
  groupMaxCount: number
}

export interface GearV2SlotGroupDefinition {
  groupId: GearV2SlotGroupId
  displayName: string
  maxSlots: number
  slotIds: readonly GearV2PhysicalSlotId[]
}

export type GearV2LoadStatus =
  | "NORMAL"
  | "HEAVY"
  | "OVERLOADED"
  | "CRITICAL"
  | "EXCESS_LOAD"

export interface GearV2WeightConfig {
  sharedBaseGrams: number
  classBonusGrams: Record<GearV2ClassId, number>
  engineVariantModifierGrams: Record<GearV2EngineVariant, number>
  thresholdsBps: {
    heavyMinBps: number
    overloadedMinBps: number
    criticalMinBps: number
    maxAllowedBps: number
  }
}

export interface GearV2EquippedItem {
  equipmentId: string
  instanceId?: string
  weightGrams: number
  /** Optional explicit P2/P3-consumable item cap; validated if present */
  maxPerLoadout?: number | null
  /** Optional explicit P2/P3-consumable uniqueness group; validated if present */
  uniquenessGroupId?: string | null
  /** Optional read-only diagnostic projection; never added to total mass */
  derivedEngineWeightGrams?: number
}

export type GearV2LoadoutSlotsMap = Partial<
  Record<GearV2PhysicalSlotId, GearV2EquippedItem | null | undefined>
>

export interface GearV2LoadoutSlotEntry {
  slotId: string
  item: GearV2EquippedItem
}

export interface GearV2WeightCalculationInput {
  gearClass: string
  engineVariant: string
  /** If provided, replaces sharedBase + classBonus + engineModifier completely */
  engineCapacityOverrideGrams?: number | null
  /** Canonical 10-slot map */
  slots?: GearV2LoadoutSlotsMap
  /** Alternative list form (validated for duplicate slots & aux max 4) */
  entries?: readonly GearV2LoadoutSlotEntry[]
}

export interface GearV2LoadoutWeightResult {
  gearClass: GearV2ClassId
  engineVariant: GearV2EngineVariant
  sharedBaseGrams: number
  classBonusGrams: number
  engineBonusGrams: number
  usedCapacityOverride: boolean
  maxLoadGrams: number
  totalWeightGrams: number
  remainingCapacityGrams: number
  excessWeightGrams: number
  loadRatioBps: number
  loadStatus: GearV2LoadStatus
  isOverCapacity: boolean
  occupiedSlotCount: number
  auxiliarySlotCount: number
  perSlotWeightGrams: Partial<Record<GearV2PhysicalSlotId, number>>
}

export type GearV2WeightErrorCode =
  | "INVALID_GEAR_CLASS"
  | "INVALID_ENGINE_VARIANT"
  | "INVALID_WEIGHT_CONFIG"
  | "INVALID_INTEGER"
  | "NEGATIVE_MASS"
  | "INVALID_CAPACITY"
  | "UNSAFE_INTEGER_OVERFLOW"
  | "UNKNOWN_SLOT_ID"
  | "DUPLICATE_SLOT_ASSIGNMENT"
  | "DUPLICATE_INSTANCE_ID"
  | "DUPLICATE_OR_OVER_LIMIT"
  | "AUXILIARY_LIMIT_EXCEEDED"
  | "EXCESS_LOAD_FORBIDDEN_ON_CONFIRM"
  | "MANDATORY_SLOT_UNFILLED"
  | "MANDATORY_WEAPON_UNFILLED"
  | "INVALID_VALIDATION_MODE"
  | "EXTERNAL_COMPATIBILITY_FAILED"
  | "CONFLICTING_LOADOUT_INPUT"

export interface GearV2WeightIssue {
  code: GearV2WeightErrorCode
  message: string
  field?: string
  slotId?: string
  equipmentId?: string
  priority?: number
}

export type GearV2Od07MandatorySlotStatus = "RESOLVED" | "CHECKED_FROM_INJECTED_POLICY"

export type GearV2ValidationMode =
  | "DRAFT"
  | "CONFIRM"
  | "SAVE"
  | "SAFE_FLIGHT"
  | "TRAINING"
  | "TRANSPORT"
  | "COMBAT"
  | "UNSAFE_ZONE"

export type GearV2MandatoryPriorityKey =
  | "ARMOR"
  | "ENGINE"
  | "RADAR_SENSOR"
  | "WEAPON"

export interface GearV2ExternalCompatibilityIssue {
  code: string
  message: string
  slotId?: GearV2PhysicalSlotId | string
  equipmentId?: string
}

export interface GearV2ExternalCompatibilityInput {
  checked: boolean
  valid?: boolean
  invalidSlotIds?: readonly GearV2PhysicalSlotId[]
  issues?: readonly GearV2ExternalCompatibilityIssue[]
}

export type GearV2CompatibilityStatus =
  | "NOT_CHECKED_IN_P1"
  | "CHECKED_FROM_CALLER"

export interface GearV2WeightValidationOptions {
  /**
   * Optional injected mandatory slot list.
   * When omitted on CONFIRM/SAVE, OD-07 permits missing slots and validates weight/structure.
   */
  mandatorySlotIds?: readonly GearV2PhysicalSlotId[]
  /**
   * Optional compatibility result supplied by P2/P3 caller.
   * P1 never pretends compatibility checking exists if omitted.
   */
  compatibility?: GearV2ExternalCompatibilityInput
}

export interface GearV2WeightValidationResult {
  mode: "DRAFT" | "CONFIRM"
  valid: boolean
  confirmReadyWithMandatorySlots: boolean
  od07MandatorySlotStatus: GearV2Od07MandatorySlotStatus
  compatibilityStatus: GearV2CompatibilityStatus
  calculation: GearV2LoadoutWeightResult | null
  errors: GearV2WeightIssue[]
  warnings: string[]
}

export interface GearV2MissionReadinessPolicy {
  mode: GearV2ValidationMode
  allowMissingSlots: boolean
  allowOverCapacity: boolean
  requireCoreSlots: boolean
  requireAtLeastOneWeapon: boolean
  requiredCoreSlotIds: readonly GearV2PhysicalSlotId[]
  weaponAlternativeSlotIds: readonly GearV2PhysicalSlotId[]
  priorityOrder: readonly GearV2MandatoryPriorityKey[]
}

export interface GearV2MissionReadinessOptions {
  compatibility?: GearV2ExternalCompatibilityInput
}

export interface GearV2MissionReadinessResult {
  mode: GearV2ValidationMode | string
  valid: boolean
  weightValid: boolean
  mandatorySlotsSatisfied: boolean
  compatibilityStatus: GearV2CompatibilityStatus
  policy: GearV2MissionReadinessPolicy | null
  missingMandatorySlots: GearV2PhysicalSlotId[]
  missingPriorityOrder: GearV2MandatoryPriorityKey[]
  calculation: GearV2LoadoutWeightResult | null
  errors: GearV2WeightIssue[]
  warnings: string[]
}
