/**
 * STARFRONT WORLD — Canonical SYSTEM Default Seed Data (Phase 6.34A-FND-2)
 *
 * Provides ready-to-use canonical master data files for:
 * 1. ProgressionProfile: system_progression_progression_profile_data.json
 * 2. TierProfile: system_progression_tier_profile_data.json
 * 3. LevelEffectProfile: system_progression_level_effect_profile_data.json
 * 4. TierEffectProfile: system_progression_tier_effect_profile_data.json
 */

import type { CatalogNodeFile } from "../catalog/types"
import type {
  LevelEffectProfile,
  ProgressionProfile,
  TierDefinition,
  TierEffectDefinition,
} from "./types"

/**
 * Standard 10-Tier definitions (TIER_I through TIER_X)
 */
export const SYSTEM_DEFAULT_TIERS: TierDefinition[] = [
  {
    tierId: "TIER_I",
    tierOrder: 1,
    minLevel: 1,
    maxLevel: 10,
    displayName: "Tier I",
    description: "Standard operational baseline tier.",
    needUpgrade: true,
    upgradeDurationGameDays: 1,
    levelEffectMultiplier: 1.0,
    nextTierId: "TIER_II",
  },
  {
    tierId: "TIER_II",
    tierOrder: 2,
    minLevel: 11,
    maxLevel: 20,
    displayName: "Tier II",
    description: "Refurbished military-grade tier with 2.0x level effectiveness.",
    needUpgrade: true,
    upgradeDurationGameDays: 2,
    levelEffectMultiplier: 2.0,
    nextTierId: "TIER_III",
  },
  {
    tierId: "TIER_III",
    tierOrder: 3,
    minLevel: 21,
    maxLevel: 30,
    displayName: "Tier III",
    description: "Advanced tactical tier with 3.0x level effectiveness.",
    needUpgrade: true,
    upgradeDurationGameDays: 3,
    levelEffectMultiplier: 3.0,
    nextTierId: "TIER_IV",
  },
  {
    tierId: "TIER_IV",
    tierOrder: 4,
    minLevel: 31,
    maxLevel: 40,
    displayName: "Tier IV",
    description: "Elite capital tier with 4.0x level effectiveness.",
    needUpgrade: true,
    upgradeDurationGameDays: 4,
    levelEffectMultiplier: 4.0,
    nextTierId: "TIER_V",
  },
  {
    tierId: "TIER_V",
    tierOrder: 5,
    minLevel: 41,
    maxLevel: 50,
    displayName: "Tier V",
    description: "Deep-space specialized tier (soft auto-transition to Tier VI when level reached).",
    needUpgrade: false, // Soft auto-transition demo
    upgradeDurationGameDays: 0,
    levelEffectMultiplier: 5.0,
    nextTierId: "TIER_VI",
  },
  {
    tierId: "TIER_VI",
    tierOrder: 6,
    minLevel: 51,
    maxLevel: 60,
    displayName: "Tier VI",
    description: "Masterwork strategic tier with 6.0x level effectiveness.",
    needUpgrade: true,
    upgradeDurationGameDays: 5,
    levelEffectMultiplier: 6.0,
    nextTierId: "TIER_VII",
  },
  {
    tierId: "TIER_VII",
    tierOrder: 7,
    minLevel: 61,
    maxLevel: 70,
    displayName: "Tier VII",
    description: "High command tier with 7.0x level effectiveness.",
    needUpgrade: true,
    upgradeDurationGameDays: 6,
    levelEffectMultiplier: 7.0,
    nextTierId: "TIER_VIII",
  },
  {
    tierId: "TIER_VIII",
    tierOrder: 8,
    minLevel: 71,
    maxLevel: 80,
    displayName: "Tier VIII",
    description: "Armada flagship tier with 8.0x level effectiveness.",
    needUpgrade: true,
    upgradeDurationGameDays: 7,
    levelEffectMultiplier: 8.0,
    nextTierId: "TIER_IX",
  },
  {
    tierId: "TIER_IX",
    tierOrder: 9,
    minLevel: 81,
    maxLevel: 90,
    displayName: "Tier IX",
    description: "Legendary dreadnought tier with 9.0x level effectiveness.",
    needUpgrade: true,
    upgradeDurationGameDays: 8,
    levelEffectMultiplier: 9.0,
    nextTierId: "TIER_X",
  },
  {
    tierId: "TIER_X",
    tierOrder: 10,
    minLevel: 91,
    maxLevel: 100,
    displayName: "Tier X",
    description: "Transcendent apex tier.",
    needUpgrade: false,
    upgradeDurationGameDays: 0,
    levelEffectMultiplier: 10.0,
  },
]

/**
 * Canonical System Progression Profiles
 */
export const SYSTEM_DEFAULT_PROGRESSION_PROFILES: ProgressionProfile[] = [
  {
    id: "profile_standard_100",
    name: "Standard 100-Level Progression",
    description: "Standard progression profile spanning TIER_I to TIER_X across 100 levels.",
    globalMaxLevel: 100,
    baseExpPerLevel: 100,
    expGrowthFactor: 1.15,
    tiers: SYSTEM_DEFAULT_TIERS,
    levelEffectProfileId: "level_effects_facility_generic",
    tierEffectProfileId: "tier_effects_generic",
    defaultPolicy: "MANUAL",
  },
  {
    id: "profile_compact_50",
    name: "Compact 50-Level Truncated Progression",
    description: "50-level profile illustrating max-level truncation where TIER_VI+ are unreachable.",
    globalMaxLevel: 50,
    baseExpPerLevel: 100,
    expGrowthFactor: 1.15,
    tiers: SYSTEM_DEFAULT_TIERS,
    levelEffectProfileId: "level_effects_combat_generic",
    tierEffectProfileId: "tier_effects_generic",
    defaultPolicy: "AUTO",
  },
  {
    id: "profile_auto_progression",
    name: "Autonomous Progression Profile",
    description: "Standard progression defaulting to AUTO upgrade policy for AI and autonomous installations.",
    globalMaxLevel: 100,
    baseExpPerLevel: 100,
    expGrowthFactor: 1.15,
    tiers: SYSTEM_DEFAULT_TIERS,
    levelEffectProfileId: "level_effects_facility_generic",
    tierEffectProfileId: "tier_effects_generic",
    defaultPolicy: "AUTO",
  },
]

/**
 * Canonical System Level Effect Profiles
 */
export const SYSTEM_DEFAULT_LEVEL_EFFECT_PROFILES: LevelEffectProfile[] = [
  {
    id: "level_effects_facility_generic",
    name: "Generic Facility Level Effects",
    description: "Increases base rescue and repair efficiency by 1% per level, with unlocks at intervals and exact milestones.",
    basePerLevelMultiplier: 1.0,
    basePerLevelBonus: {
      rescuePowerPct: 1,
      repairHpPct: 1,
    },
    effects: [
      {
        id: "eff_interval_capacity",
        triggerType: "INTERVAL",
        startLevel: 5,
        intervalLevels: 5,
        statModifiers: { operationalEfficiencyPct: 3 },
        moduleSlotUnlocks: 1,
        description: "Unlocks +3% operational efficiency and +1 module slot every 5 levels starting at level 5.",
      },
      {
        id: "eff_exact_10_trauma",
        triggerType: "EXACT_LEVEL",
        level: 10,
        unlockedCapabilities: ["TRAUMA_TREATMENT"],
        description: "Unlocks TRAUMA_TREATMENT at level 10.",
      },
      {
        id: "eff_exact_20_surgery",
        triggerType: "EXACT_LEVEL",
        level: 20,
        unlockedCapabilities: ["ADVANCED_SURGERY"],
        description: "Unlocks ADVANCED_SURGERY at level 20.",
      },
      {
        id: "eff_exact_30_icu",
        triggerType: "EXACT_LEVEL",
        level: 30,
        unlockedCapabilities: ["ICU_CAPACITY"],
        description: "Unlocks ICU_CAPACITY at level 30.",
      },
    ],
  },
  {
    id: "level_effects_combat_generic",
    name: "Generic Combat Unit Level Effects",
    description: "Increases attack and defense by 1% per level.",
    basePerLevelMultiplier: 1.0,
    basePerLevelBonus: {
      attackBonusPct: 1,
      defenseBonusPct: 1,
    },
    effects: [
      {
        id: "eff_combat_interval_speed",
        triggerType: "INTERVAL",
        startLevel: 5,
        intervalLevels: 5,
        statModifiers: { speedBonusPct: 2 },
        description: "Grants +2% speed every 5 levels.",
      },
      {
        id: "eff_combat_exact_10",
        triggerType: "EXACT_LEVEL",
        level: 10,
        unlockedCapabilities: ["RAPID_TARGETING"],
        description: "Unlocks RAPID_TARGETING at level 10.",
      },
    ],
  },
]

/**
 * Canonical System Tier Effect Definitions
 */
export const SYSTEM_DEFAULT_TIER_EFFECTS: TierEffectDefinition[] = [
  {
    id: "tier_effect_tier_ii",
    tierId: "TIER_II",
    statModifiers: { basePowerMultiplierPct: 15 },
    capacityModifiers: { hangarCapacity: 10, energyOutput: 100 },
    attributeUnlocks: ["ARMORED_HULL"],
    capabilityUnlocks: ["DEEP_SPACE_PATROL"],
    moduleSlotUnlocks: 1,
    description: "Tier II Breakthrough: +15% power, +10 hangar, Armored Hull, Deep Space Patrol.",
  },
  {
    id: "tier_effect_tier_iii",
    tierId: "TIER_III",
    statModifiers: { basePowerMultiplierPct: 30 },
    capacityModifiers: { hangarCapacity: 25, energyOutput: 250 },
    attributeUnlocks: ["SHIELD_REGENERATOR"],
    capabilityUnlocks: ["WARP_INTERCEPTION"],
    moduleSlotUnlocks: 2,
    description: "Tier III Breakthrough: +30% power, +25 hangar, Shield Regenerator, Warp Interception.",
  },
  {
    id: "tier_effect_tier_iv",
    tierId: "TIER_IV",
    statModifiers: { basePowerMultiplierPct: 50 },
    capacityModifiers: { hangarCapacity: 50, energyOutput: 500 },
    attributeUnlocks: ["PHASE_CLOAK"],
    capabilityUnlocks: ["HYPERLANE_SURGE"],
    moduleSlotUnlocks: 3,
    description: "Tier IV Breakthrough: +50% power, +50 hangar, Phase Cloak, Hyperlane Surge.",
  },
]

/**
 * Canonical System Catalog Files formatted for FND-1 CatalogLoader / Registry
 */
export const SYSTEM_PROGRESSION_CATALOG_FILES: Record<string, CatalogNodeFile> = {
  "system_progression_progression_profile_data.json": {
    configFileId: "system_progression_progression_profile",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_PROGRESSION_PROFILES,
    metadata: {
      domain: "progression",
      catalog: "progression_profile",
      description: "Canonical progression profile definitions.",
    },
  },
  "system_progression_tier_profile_data.json": {
    configFileId: "system_progression_tier_profile",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_TIERS.map((t) => ({ ...t, id: t.tierId })),
    metadata: {
      domain: "progression",
      catalog: "tier_profile",
      description: "Canonical tier definitions.",
    },
  },
  "system_progression_level_effect_profile_data.json": {
    configFileId: "system_progression_level_effect_profile",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_LEVEL_EFFECT_PROFILES,
    metadata: {
      domain: "progression",
      catalog: "level_effect_profile",
      description: "Canonical level effect profiles.",
    },
  },
  "system_progression_tier_effect_profile_data.json": {
    configFileId: "system_progression_tier_effect_profile",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_TIER_EFFECTS,
    metadata: {
      domain: "progression",
      catalog: "tier_effect_profile",
      description: "Canonical tier breakthrough effect definitions.",
    },
  },
}
