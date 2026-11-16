/**
 * STARFRONT WORLD V2 — GEAR V2 P1 Pure Weight Engine
 *
 * Deterministic integer-gram weight calculations, integer basis-point (bps)
 * load ratio classification, and Draft/Confirm weight validation.
 */

import {
  GEAR_V2_MAX_AUXILIARY_SLOTS,
  isGearV2AuxiliarySlotId,
  isGearV2PhysicalSlotId,
} from "./slots"
import {
  DEFAULT_GEAR_V2_WEIGHT_CONFIG,
  GEAR_V2_CLASS_IDS,
  GEAR_V2_ENGINE_VARIANTS,
  normalizeGearV2ClassId,
  normalizeGearV2EngineVariant,
} from "./weight-config"
import type {
  GearV2ClassId,
  GearV2EngineVariant,
  GearV2EquippedItem,
  GearV2LoadStatus,
  GearV2LoadoutWeightResult,
  GearV2PhysicalSlotId,
  GearV2WeightCalculationInput,
  GearV2WeightConfig,
  GearV2WeightErrorCode,
  GearV2WeightIssue,
  GearV2WeightValidationOptions,
  GearV2WeightValidationResult,
} from "./types"

export class GearV2WeightError extends Error {
  public readonly code: GearV2WeightErrorCode
  public readonly details?: GearV2WeightIssue

  constructor(code: GearV2WeightErrorCode, message: string, details?: GearV2WeightIssue) {
    super(message)
    this.name = "GearV2WeightError"
    this.code = code
    this.details = details
  }
}

function assertSafeInteger(
  value: unknown,
  field: string,
  allowNegative = false
): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new GearV2WeightError(
      "INVALID_INTEGER",
      `Field '${field}' must be a safe integer (received: ${String(value)}).`,
      { code: "INVALID_INTEGER", message: `Invalid safe integer for '${field}'.`, field }
    )
  }
  if (!allowNegative && value < 0) {
    throw new GearV2WeightError(
      "NEGATIVE_MASS",
      `Field '${field}' must not be negative (received: ${value}).`,
      { code: "NEGATIVE_MASS", message: `Negative value for '${field}'.`, field }
    )
  }
  return value
}

function safeAddBigIntChecked(values: readonly bigint[], field: string): number {
  let sum = BigInt(0)
  for (const v of values) {
    sum += v
  }
  if (sum > BigInt(Number.MAX_SAFE_INTEGER) || sum < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new GearV2WeightError(
      "UNSAFE_INTEGER_OVERFLOW",
      `Arithmetic overflow in '${field}': ${sum.toString()} exceeds safe integer bounds.`,
      {
        code: "UNSAFE_INTEGER_OVERFLOW",
        message: `Unsafe integer overflow in '${field}'.`,
        field,
      }
    )
  }
  return Number(sum)
}

function validateWeightConfig(config: GearV2WeightConfig): void {
  if (!config || typeof config !== "object") {
    throw new GearV2WeightError(
      "INVALID_WEIGHT_CONFIG",
      "Weight config must be an object."
    )
  }

  assertSafeInteger(config.sharedBaseGrams, "config.sharedBaseGrams", false)

  for (const classId of GEAR_V2_CLASS_IDS) {
    const val = config.classBonusGrams?.[classId]
    assertSafeInteger(val, `config.classBonusGrams.${classId}`, false)
  }

  for (const variant of GEAR_V2_ENGINE_VARIANTS) {
    const val = config.engineVariantModifierGrams?.[variant]
    assertSafeInteger(val, `config.engineVariantModifierGrams.${variant}`, true)
  }

  const t = config.thresholdsBps
  if (!t || typeof t !== "object") {
    throw new GearV2WeightError(
      "INVALID_WEIGHT_CONFIG",
      "Weight config must provide thresholdsBps."
    )
  }
  const h = assertSafeInteger(t.heavyMinBps, "config.thresholdsBps.heavyMinBps", false)
  const o = assertSafeInteger(t.overloadedMinBps, "config.thresholdsBps.overloadedMinBps", false)
  const c = assertSafeInteger(t.criticalMinBps, "config.thresholdsBps.criticalMinBps", false)
  const m = assertSafeInteger(t.maxAllowedBps, "config.thresholdsBps.maxAllowedBps", false)
  if (!(h < o && o < c && c <= m)) {
    throw new GearV2WeightError(
      "INVALID_WEIGHT_CONFIG",
      "Invalid threshold ordering in config.thresholdsBps."
    )
  }
}

export function calculateEngineBonusGrams(
  engineVariant: string,
  config: GearV2WeightConfig = DEFAULT_GEAR_V2_WEIGHT_CONFIG
): number {
  validateWeightConfig(config)
  const normalized = normalizeGearV2EngineVariant(engineVariant)
  if (!normalized) {
    throw new GearV2WeightError(
      "INVALID_ENGINE_VARIANT",
      `Unknown engine variant '${String(engineVariant)}'.`,
      {
        code: "INVALID_ENGINE_VARIANT",
        message: `Unknown engine variant '${String(engineVariant)}'.`,
        field: "engineVariant",
      }
    )
  }
  return config.engineVariantModifierGrams[normalized]
}

export interface MaxLoadCapacityInput {
  gearClass: string
  engineVariant: string
  engineCapacityOverrideGrams?: number | null
}

export interface MaxLoadCapacityResult {
  gearClass: GearV2ClassId
  engineVariant: GearV2EngineVariant
  sharedBaseGrams: number
  classBonusGrams: number
  engineBonusGrams: number
  usedCapacityOverride: boolean
  maxLoadGrams: number
}

export function calculateMaxLoadCapacityDetails(
  input: MaxLoadCapacityInput,
  config: GearV2WeightConfig = DEFAULT_GEAR_V2_WEIGHT_CONFIG
): MaxLoadCapacityResult {
  validateWeightConfig(config)

  const gearClass = normalizeGearV2ClassId(input.gearClass)
  if (!gearClass) {
    throw new GearV2WeightError(
      "INVALID_GEAR_CLASS",
      `Unknown GEAR class '${String(input.gearClass)}'.`,
      {
        code: "INVALID_GEAR_CLASS",
        message: `Unknown GEAR class '${String(input.gearClass)}'.`,
        field: "gearClass",
      }
    )
  }

  const engineVariant = normalizeGearV2EngineVariant(input.engineVariant)
  if (!engineVariant) {
    throw new GearV2WeightError(
      "INVALID_ENGINE_VARIANT",
      `Unknown engine variant '${String(input.engineVariant)}'.`,
      {
        code: "INVALID_ENGINE_VARIANT",
        message: `Unknown engine variant '${String(input.engineVariant)}'.`,
        field: "engineVariant",
      }
    )
  }

  const sharedBaseGrams = config.sharedBaseGrams
  const classBonusGrams = config.classBonusGrams[gearClass]
  const engineBonusGrams = config.engineVariantModifierGrams[engineVariant]

  if (
    input.engineCapacityOverrideGrams !== undefined &&
    input.engineCapacityOverrideGrams !== null
  ) {
    const override = assertSafeInteger(
      input.engineCapacityOverrideGrams,
      "engineCapacityOverrideGrams",
      false
    )
    if (override <= 0) {
      throw new GearV2WeightError(
        "INVALID_CAPACITY",
        `engineCapacityOverrideGrams must be a positive safe integer (received: ${override}).`,
        {
          code: "INVALID_CAPACITY",
          message: "Capacity override must be > 0 grams.",
          field: "engineCapacityOverrideGrams",
        }
      )
    }

    return {
      gearClass,
      engineVariant,
      sharedBaseGrams,
      classBonusGrams,
      engineBonusGrams,
      usedCapacityOverride: true,
      maxLoadGrams: override,
    }
  }

  const maxLoadGrams = safeAddBigIntChecked(
    [BigInt(sharedBaseGrams), BigInt(classBonusGrams), BigInt(engineBonusGrams)],
    "maxLoadGrams"
  )

  if (maxLoadGrams <= 0) {
    throw new GearV2WeightError(
      "INVALID_CAPACITY",
      `Calculated maxLoadGrams must be positive (received: ${maxLoadGrams}).`,
      {
        code: "INVALID_CAPACITY",
        message: "Calculated capacity must be > 0 grams.",
        field: "maxLoadGrams",
      }
    )
  }

  return {
    gearClass,
    engineVariant,
    sharedBaseGrams,
    classBonusGrams,
    engineBonusGrams,
    usedCapacityOverride: false,
    maxLoadGrams,
  }
}

export function calculateMaxLoadCapacityGrams(
  input: MaxLoadCapacityInput,
  config: GearV2WeightConfig = DEFAULT_GEAR_V2_WEIGHT_CONFIG
): number {
  return calculateMaxLoadCapacityDetails(input, config).maxLoadGrams
}

/**
 * Classifies integer basis points (bps) into GearV2LoadStatus.
 * Thresholds:
 * - < 7000 bps: NORMAL
 * - 7000..7999 bps: HEAVY
 * - 8000..8999 bps: OVERLOADED
 * - 9000..10000 bps: CRITICAL
 * - > 10000 bps: EXCESS_LOAD
 */
export function classifyLoadStatus(
  loadRatioBps: number,
  config: GearV2WeightConfig = DEFAULT_GEAR_V2_WEIGHT_CONFIG
): GearV2LoadStatus {
  validateWeightConfig(config)
  const bps = assertSafeInteger(loadRatioBps, "loadRatioBps", false)
  const { heavyMinBps, overloadedMinBps, criticalMinBps, maxAllowedBps } =
    config.thresholdsBps

  if (bps < heavyMinBps) return "NORMAL"
  if (bps < overloadedMinBps) return "HEAVY"
  if (bps < criticalMinBps) return "OVERLOADED"
  if (bps <= maxAllowedBps) return "CRITICAL"
  return "EXCESS_LOAD"
}

/**
 * Exact BigInt ratio calculation in integer basis points without IEEE-754 float drift.
 * When loadGrams > maxLoadGrams and floor(load*10000/cap) == 10000, rounds up to 10001
 * so that 1 gram over 100% is strictly > 10000 bps and maps to EXCESS_LOAD.
 */
export function calculateExactLoadRatioBps(
  loadGrams: number,
  maxLoadGrams: number
): number {
  const load = BigInt(assertSafeInteger(loadGrams, "loadGrams", false))
  const cap = assertSafeInteger(maxLoadGrams, "maxLoadGrams", false)
  if (cap <= 0) {
    throw new GearV2WeightError(
      "INVALID_CAPACITY",
      `maxLoadGrams must be positive (received: ${cap}).`,
      {
        code: "INVALID_CAPACITY",
        message: "maxLoadGrams must be > 0.",
        field: "maxLoadGrams",
      }
    )
  }
  const capBig = BigInt(cap)
  const scaled = load * BigInt(10_000)
  let bps = scaled / capBig

  if (load > capBig && bps <= BigInt(10_000)) {
    bps = BigInt(10_001)
  }

  if (bps > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new GearV2WeightError(
      "UNSAFE_INTEGER_OVERFLOW",
      "loadRatioBps exceeds Number.MAX_SAFE_INTEGER.",
      {
        code: "UNSAFE_INTEGER_OVERFLOW",
        message: "loadRatioBps overflow.",
        field: "loadRatioBps",
      }
    )
  }

  return Number(bps)
}

function collectNormalizedSlotEntries(
  input: GearV2WeightCalculationInput
): Array<{ slotId: GearV2PhysicalSlotId; item: GearV2EquippedItem }> {
  if (input.slots && input.entries) {
    throw new GearV2WeightError(
      "CONFLICTING_LOADOUT_INPUT",
      "Provide either 'slots' or 'entries', not both.",
      {
        code: "CONFLICTING_LOADOUT_INPUT",
        message: "Conflicting loadout input: both slots and entries provided.",
      }
    )
  }

  const collected: Array<{ slotId: GearV2PhysicalSlotId; item: GearV2EquippedItem }> = []
  const seenSlots = new Set<string>()
  let auxCount = 0

  if (input.entries) {
    for (let i = 0; i < input.entries.length; i++) {
      const entry = input.entries[i]
      if (!entry || typeof entry !== "object") {
        throw new GearV2WeightError(
          "UNKNOWN_SLOT_ID",
          `Invalid entry at index ${i}.`
        )
      }
      const rawSlotId = entry.slotId
      const isAuxGeneric = rawSlotId === "auxiliary"
      if (isAuxGeneric) {
        auxCount++
        if (auxCount > GEAR_V2_MAX_AUXILIARY_SLOTS) {
          throw new GearV2WeightError(
            "AUXILIARY_LIMIT_EXCEEDED",
            `Auxiliary slot count (${auxCount}) exceeds maximum of ${GEAR_V2_MAX_AUXILIARY_SLOTS}.`,
            {
              code: "AUXILIARY_LIMIT_EXCEEDED",
              message: "Auxiliary slots cannot exceed 4.",
              slotId: rawSlotId,
            }
          )
        }
        const mappedSlotId = `auxiliary_${auxCount}` as GearV2PhysicalSlotId
        if (seenSlots.has(mappedSlotId)) {
          throw new GearV2WeightError(
            "DUPLICATE_SLOT_ASSIGNMENT",
            `Duplicate auxiliary slot assignment at '${mappedSlotId}'.`,
            {
              code: "DUPLICATE_SLOT_ASSIGNMENT",
              message: `Duplicate slot '${mappedSlotId}'.`,
              slotId: mappedSlotId,
            }
          )
        }
        seenSlots.add(mappedSlotId)
        collected.push({ slotId: mappedSlotId, item: entry.item })
        continue
      }

      if (!isGearV2PhysicalSlotId(rawSlotId)) {
        throw new GearV2WeightError(
          "UNKNOWN_SLOT_ID",
          `Unknown physical slot ID '${String(rawSlotId)}'.`,
          {
            code: "UNKNOWN_SLOT_ID",
            message: `Unknown physical slot ID '${String(rawSlotId)}'.`,
            slotId: String(rawSlotId),
          }
        )
      }

      if (seenSlots.has(rawSlotId)) {
        throw new GearV2WeightError(
          "DUPLICATE_SLOT_ASSIGNMENT",
          `Duplicate assignment for slot '${rawSlotId}'.`,
          {
            code: "DUPLICATE_SLOT_ASSIGNMENT",
            message: `Duplicate slot '${rawSlotId}'.`,
            slotId: rawSlotId,
          }
        )
      }

      if (isGearV2AuxiliarySlotId(rawSlotId)) {
        auxCount++
        if (auxCount > GEAR_V2_MAX_AUXILIARY_SLOTS) {
          throw new GearV2WeightError(
            "AUXILIARY_LIMIT_EXCEEDED",
            `Auxiliary slot count (${auxCount}) exceeds maximum of ${GEAR_V2_MAX_AUXILIARY_SLOTS}.`,
            {
              code: "AUXILIARY_LIMIT_EXCEEDED",
              message: "Auxiliary slots cannot exceed 4.",
              slotId: rawSlotId,
            }
          )
        }
      }

      seenSlots.add(rawSlotId)
      collected.push({ slotId: rawSlotId, item: entry.item })
    }
    return collected
  }

  if (input.slots) {
    for (const [rawSlotId, rawItem] of Object.entries(input.slots)) {
      if (!isGearV2PhysicalSlotId(rawSlotId)) {
        throw new GearV2WeightError(
          "UNKNOWN_SLOT_ID",
          `Unknown physical slot ID '${rawSlotId}'.`,
          {
            code: "UNKNOWN_SLOT_ID",
            message: `Unknown physical slot ID '${rawSlotId}'.`,
            slotId: rawSlotId,
          }
        )
      }
      if (rawItem === null || rawItem === undefined) {
        continue
      }
      if (isGearV2AuxiliarySlotId(rawSlotId)) {
        auxCount++
      }
      collected.push({ slotId: rawSlotId, item: rawItem })
    }
  }

  return collected
}

function validateAndSumEquippedItems(
  entries: ReadonlyArray<{ slotId: GearV2PhysicalSlotId; item: GearV2EquippedItem }>
): {
  totalWeightGrams: number
  auxiliarySlotCount: number
  perSlotWeightGrams: Partial<Record<GearV2PhysicalSlotId, number>>
} {
  const seenInstanceIds = new Set<string>()
  const equipmentCounts = new Map<string, number>()
  const seenUniquenessGroups = new Set<string>()
  const perSlotWeightGrams: Partial<Record<GearV2PhysicalSlotId, number>> = {}
  const weightTerms: bigint[] = []
  let auxiliarySlotCount = 0

  for (const { slotId, item } of entries) {
    if (!item || typeof item !== "object") {
      throw new GearV2WeightError(
        "INVALID_INTEGER",
        `Equipped item in slot '${slotId}' must be an object.`,
        { code: "INVALID_INTEGER", message: "Invalid item object.", slotId }
      )
    }

    if (typeof item.equipmentId !== "string" || item.equipmentId.trim() === "") {
      throw new GearV2WeightError(
        "INVALID_WEIGHT_CONFIG",
        `Equipped item in slot '${slotId}' must have a non-empty equipmentId.`,
        { code: "INVALID_WEIGHT_CONFIG", message: "Missing equipmentId.", slotId }
      )
    }

    const eqId = item.equipmentId.trim()
    const weightGrams = assertSafeInteger(
      item.weightGrams,
      `slots.${slotId}.weightGrams`,
      false
    )

    if (item.instanceId !== undefined && item.instanceId !== null) {
      const inst = String(item.instanceId).trim()
      if (!inst) {
        throw new GearV2WeightError(
          "DUPLICATE_INSTANCE_ID",
          `Empty instanceId in slot '${slotId}'.`,
          { code: "DUPLICATE_INSTANCE_ID", message: "Invalid instanceId.", slotId, equipmentId: eqId }
        )
      }
      if (seenInstanceIds.has(inst)) {
        throw new GearV2WeightError(
          "DUPLICATE_INSTANCE_ID",
          `Item instance '${inst}' cannot be equipped in multiple slots simultaneously.`,
          {
            code: "DUPLICATE_INSTANCE_ID",
            message: `Duplicate instanceId '${inst}'.`,
            slotId,
            equipmentId: eqId,
          }
        )
      }
      seenInstanceIds.add(inst)
    }

    const nextCount = (equipmentCounts.get(eqId) ?? 0) + 1
    equipmentCounts.set(eqId, nextCount)

    if (item.maxPerLoadout !== undefined && item.maxPerLoadout !== null) {
      const cap = assertSafeInteger(
        item.maxPerLoadout,
        `slots.${slotId}.maxPerLoadout`,
        false
      )
      if (cap <= 0) {
        throw new GearV2WeightError(
          "DUPLICATE_OR_OVER_LIMIT",
          `maxPerLoadout for '${eqId}' must be a positive integer.`,
          {
            code: "DUPLICATE_OR_OVER_LIMIT",
            message: "Invalid maxPerLoadout.",
            slotId,
            equipmentId: eqId,
          }
        )
      }
      if (nextCount > cap) {
        throw new GearV2WeightError(
          "DUPLICATE_OR_OVER_LIMIT",
          `Equipment '${eqId}' exceeds maxPerLoadout (${nextCount} > ${cap}).`,
          {
            code: "DUPLICATE_OR_OVER_LIMIT",
            message: `Equipment '${eqId}' exceeds maxPerLoadout (${cap}).`,
            slotId,
            equipmentId: eqId,
          }
        )
      }
    }

    if (item.uniquenessGroupId !== undefined && item.uniquenessGroupId !== null) {
      const grp = item.uniquenessGroupId.trim()
      if (grp) {
        if (seenUniquenessGroups.has(grp)) {
          throw new GearV2WeightError(
            "DUPLICATE_OR_OVER_LIMIT",
            `Uniqueness group '${grp}' allows only 1 item per loadout (conflict at '${slotId}').`,
            {
              code: "DUPLICATE_OR_OVER_LIMIT",
              message: `Duplicate uniqueness group '${grp}'.`,
              slotId,
              equipmentId: eqId,
            }
          )
        }
        seenUniquenessGroups.add(grp)
      }
    }

    if (isGearV2AuxiliarySlotId(slotId)) {
      auxiliarySlotCount++
    }

    perSlotWeightGrams[slotId] = weightGrams
    weightTerms.push(BigInt(weightGrams))
  }

  const totalWeightGrams = safeAddBigIntChecked(weightTerms, "totalWeightGrams")

  return {
    totalWeightGrams,
    auxiliarySlotCount,
    perSlotWeightGrams,
  }
}

export function calculateLoadoutWeight(
  input: GearV2WeightCalculationInput,
  config: GearV2WeightConfig = DEFAULT_GEAR_V2_WEIGHT_CONFIG
): GearV2LoadoutWeightResult {
  const capacity = calculateMaxLoadCapacityDetails(
    {
      gearClass: input.gearClass,
      engineVariant: input.engineVariant,
      engineCapacityOverrideGrams: input.engineCapacityOverrideGrams,
    },
    config
  )

  const entries = collectNormalizedSlotEntries(input)
  const { totalWeightGrams, auxiliarySlotCount, perSlotWeightGrams } =
    validateAndSumEquippedItems(entries)

  const loadRatioBps = calculateExactLoadRatioBps(
    totalWeightGrams,
    capacity.maxLoadGrams
  )
  const loadStatus = classifyLoadStatus(loadRatioBps, config)
  const isOverCapacity = totalWeightGrams > capacity.maxLoadGrams

  const remainingCapacityGrams =
    totalWeightGrams <= capacity.maxLoadGrams
      ? capacity.maxLoadGrams - totalWeightGrams
      : 0
  const excessWeightGrams =
    totalWeightGrams > capacity.maxLoadGrams
      ? totalWeightGrams - capacity.maxLoadGrams
      : 0

  return {
    gearClass: capacity.gearClass,
    engineVariant: capacity.engineVariant,
    sharedBaseGrams: capacity.sharedBaseGrams,
    classBonusGrams: capacity.classBonusGrams,
    engineBonusGrams: capacity.engineBonusGrams,
    usedCapacityOverride: capacity.usedCapacityOverride,
    maxLoadGrams: capacity.maxLoadGrams,
    totalWeightGrams,
    remainingCapacityGrams,
    excessWeightGrams,
    loadRatioBps,
    loadStatus,
    isOverCapacity,
    occupiedSlotCount: entries.length,
    auxiliarySlotCount,
    perSlotWeightGrams,
  }
}

function toIssue(err: unknown): GearV2WeightIssue {
  if (err instanceof GearV2WeightError) {
    return (
      err.details ?? {
        code: err.code,
        message: err.message,
      }
    )
  }
  return {
    code: "INVALID_WEIGHT_CONFIG",
    message: err instanceof Error ? err.message : "Unknown weight validation error.",
  }
}

/**
 * Draft Loadout weight validator:
 * - Validates structural & numeric invariants
 * - Permits overcapacity (> 100% / EXCESS_LOAD) without auto-unequipping
 */
export function validateDraftLoadoutWeight(
  input: GearV2WeightCalculationInput,
  config: GearV2WeightConfig = DEFAULT_GEAR_V2_WEIGHT_CONFIG
): GearV2WeightValidationResult {
  try {
    const calculation = calculateLoadoutWeight(input, config)
    const warnings: string[] = []
    if (calculation.isOverCapacity) {
      warnings.push("OVER_CAPACITY_DRAFT_ALLOWED")
    }
    return {
      mode: "DRAFT",
      valid: true,
      confirmReadyWithMandatorySlots: false,
      od07MandatorySlotStatus: "UNRESOLVED",
      calculation,
      errors: [],
      warnings,
    }
  } catch (err) {
    return {
      mode: "DRAFT",
      valid: false,
      confirmReadyWithMandatorySlots: false,
      od07MandatorySlotStatus: "UNRESOLVED",
      calculation: null,
      errors: [toIssue(err)],
      warnings: [],
    }
  }
}

/**
 * Confirm Loadout weight validator:
 * - Rejects totalWeightGrams > maxLoadGrams (EXCESS_LOAD); never auto-unequips
 * - Keeps OD-07 mandatory-slot rule explicitly UNRESOLVED unless injected by caller
 */
export function validateConfirmLoadoutWeight(
  input: GearV2WeightCalculationInput,
  config: GearV2WeightConfig = DEFAULT_GEAR_V2_WEIGHT_CONFIG,
  options?: GearV2WeightValidationOptions
): GearV2WeightValidationResult {
  const hasInjectedMandatoryPolicy =
    options !== undefined && Array.isArray(options.mandatorySlotIds)
  const od07Status = hasInjectedMandatoryPolicy
    ? "CHECKED_FROM_INJECTED_POLICY"
    : "UNRESOLVED"

  try {
    const calculation = calculateLoadoutWeight(input, config)
    const errors: GearV2WeightIssue[] = []
    const warnings: string[] = []

    if (calculation.isOverCapacity) {
      errors.push({
        code: "EXCESS_LOAD_FORBIDDEN_ON_CONFIRM",
        message: `Loadout weight (${calculation.totalWeightGrams}g) exceeds capacity (${calculation.maxLoadGrams}g) by ${calculation.excessWeightGrams}g.`,
        field: "totalWeightGrams",
      })
    }

    if (hasInjectedMandatoryPolicy) {
      for (const reqSlot of options!.mandatorySlotIds!) {
        if (!isGearV2PhysicalSlotId(reqSlot)) {
          errors.push({
            code: "UNKNOWN_SLOT_ID",
            message: `Unknown mandatory slot ID '${String(reqSlot)}'.`,
            slotId: String(reqSlot),
          })
          continue
        }
        if (calculation.perSlotWeightGrams[reqSlot] === undefined) {
          errors.push({
            code: "MANDATORY_SLOT_UNFILLED",
            message: `Mandatory slot '${reqSlot}' must be equipped before Confirm.`,
            slotId: reqSlot,
          })
        }
      }
    } else {
      warnings.push("OD07_MANDATORY_SLOT_RULE_UNRESOLVED")
    }

    const valid = errors.length === 0
    return {
      mode: "CONFIRM",
      valid,
      confirmReadyWithMandatorySlots: valid && hasInjectedMandatoryPolicy,
      od07MandatorySlotStatus: od07Status,
      calculation,
      errors,
      warnings,
    }
  } catch (err) {
    return {
      mode: "CONFIRM",
      valid: false,
      confirmReadyWithMandatorySlots: false,
      od07MandatorySlotStatus: od07Status,
      calculation: null,
      errors: [toIssue(err)],
      warnings: hasInjectedMandatoryPolicy
        ? []
        : ["OD07_MANDATORY_SLOT_RULE_UNRESOLVED"],
    }
  }
}
