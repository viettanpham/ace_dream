/**
 * STARFRONT WORLD V2 — GEAR V2 P1 Default Weight Configuration
 * All masses and capacities are integer grams. All ratios are integer basis points (bps).
 */

import type {
  GearV2ClassId,
  GearV2EngineVariant,
  GearV2WeightConfig,
} from "./types"

export const GEAR_V2_CLASS_IDS: readonly GearV2ClassId[] = [
  "A-GEAR",
  "B-GEAR",
  "I-GEAR",
  "M-GEAR",
  "R-GEAR",
  "G-GEAR",
] as const

export const GEAR_V2_ENGINE_VARIANTS: readonly GearV2EngineVariant[] = [
  "SILENT",
  "BASE",
  "JET",
] as const

export const DEFAULT_GEAR_V2_WEIGHT_CONFIG: GearV2WeightConfig = {
  sharedBaseGrams: 3_000_000,
  classBonusGrams: {
    "A-GEAR": 1_600_000,
    "B-GEAR": 1_500_000,
    "I-GEAR": 900_000,
    "M-GEAR": 1_200_000,
    "R-GEAR": 1_000_000,
    "G-GEAR": 2_000_000,
  },
  engineVariantModifierGrams: {
    SILENT: 200_000,
    BASE: 0,
    JET: -200_000,
  },
  thresholdsBps: {
    heavyMinBps: 7_000,
    overloadedMinBps: 8_000,
    criticalMinBps: 9_000,
    maxAllowedBps: 10_000,
  },
}

const SHORT_CODE_TO_CLASS_ID: Readonly<Record<string, GearV2ClassId>> = {
  A: "A-GEAR",
  "A-GEAR": "A-GEAR",
  B: "B-GEAR",
  "B-GEAR": "B-GEAR",
  I: "I-GEAR",
  "I-GEAR": "I-GEAR",
  M: "M-GEAR",
  "M-GEAR": "M-GEAR",
  R: "R-GEAR",
  "R-GEAR": "R-GEAR",
  G: "G-GEAR",
  "G-GEAR": "G-GEAR",
}

export function normalizeGearV2ClassId(input: string): GearV2ClassId | null {
  if (typeof input !== "string") return null
  const key = input.trim().toUpperCase()
  return SHORT_CODE_TO_CLASS_ID[key] ?? null
}

export function normalizeGearV2EngineVariant(
  input: string
): GearV2EngineVariant | null {
  if (typeof input !== "string") return null
  const key = input.trim().toUpperCase()
  if (key === "SILENT" || key === "BASE" || key === "JET") {
    return key
  }
  return null
}
