/**
 * STARFRONT WORLD — Shared Progression & Tier Boundary Foundation (Phase 6.34A-FND-2)
 *
 * Domain-agnostic contracts for Levels, EXP, Tiers, Breakthroughs, and Effects.
 * Applicable to SHIP, BUILDING, BASE, FLEET, PILOT, and other progression entities.
 */

export type ProgressionState =
  | "PROGRESSING"         // Entity receives and accumulates EXP normally
  | "AWAITING_UPGRADE"    // Reached hard Tier boundary (needUpgrade = true); EXP capped, waiting for external upgrade
  | "UPGRADING"           // External upgrade process in progress (duration in GAME_DAY)
  | "MAXED"               // Reached global/entity max level or last reachable tier; no further progression

export type AutoUpgradePolicy =
  | "AUTO"                // System/AI can auto-start upgrade when requirements are met
  | "RECOMMEND"           // Generates recommendation for Commander/Authority decision
  | "MANUAL"              // Manual start only

export type LevelEffectTriggerType =
  | "EXACT_LEVEL"         // Triggers at specific level (e.g. level = 10)
  | "INTERVAL"            // Triggers repeatedly (e.g. startLevel = 5, intervalLevels = 5 -> 5, 10, 15, 20...)

/**
 * Definition of a specific level-triggered effect or unlock
 */
export interface LevelEffectDefinition {
  id: string
  triggerType: LevelEffectTriggerType
  level?: number            // Required for EXACT_LEVEL
  startLevel?: number       // Required for INTERVAL
  intervalLevels?: number   // Required for INTERVAL
  statModifiers?: Record<string, number>
  unlockedCapabilities?: string[]
  unlockedAttributes?: string[]
  moduleSlotUnlocks?: number
  description?: string
  metadata?: Record<string, any>
}

/**
 * Profile containing base per-level bonuses and special level-triggered effects
 */
export interface LevelEffectProfile {
  id: string
  name: string
  description?: string
  basePerLevelMultiplier?: number // Default base multiplier (usually 1.0)
  basePerLevelBonus?: Record<string, number> // Applied per level (e.g. { rescuePowerPct: 1, repairHpPct: 1 })
  effects: LevelEffectDefinition[]
}

/**
 * Definition of a single Tier
 */
export interface TierDefinition {
  tierId: string                     // e.g. "TIER_I", "TIER_II", "MK_I", "CLINIC"
  tierOrder: number                  // 1, 2, 3, ... (used for tierDistance calculation)
  minLevel: number                   // e.g. 1
  maxLevel: number                   // e.g. 10
  displayName: string                // e.g. "Tier I", "MK I", "Regional Base"
  description?: string
  needUpgrade: boolean               // true = hard tier boundary; false = auto soft transition
  upgradeDurationGameDays: number    // 0 for auto soft transition; >= 1 for hard upgrade
  levelEffectMultiplier: number      // Multiplier for levels earned in this tier (e.g. 1.0 for TIER_I, 2.0 for TIER_II; non-retroactive)
  upgradeRequirementProfileId?: string
  levelEffectProfileId?: string
  tierEffectProfileId?: string
  unlockEffectProfileId?: string
  nextTierId?: string
}

/**
 * Tier breakthrough effects applied upon advancing to this tier
 */
export interface TierEffectDefinition {
  id: string
  tierId: string
  statModifiers?: Record<string, number>
  capacityModifiers?: Record<string, number>
  attributeUnlocks?: string[]
  capabilityUnlocks?: string[]
  moduleSlotUnlocks?: number
  description?: string
  metadata?: Record<string, any>
}

/**
 * Catalog profile governing an entity's complete progression journey
 */
export interface ProgressionProfile {
  id: string
  name: string
  description?: string
  globalMaxLevel: number             // Hard ceiling across all tiers (e.g. 50 or 100)
  baseExpPerLevel: number            // Base EXP needed from level 1 -> 2
  expGrowthFactor: number            // Exponential/linear growth factor (e.g. 1.25)
  tiers: TierDefinition[]            // Ordered list of tiers
  levelEffectProfileId?: string      // Default level effect profile
  tierEffectProfileId?: string       // Default tier effect profile
  defaultPolicy?: AutoUpgradePolicy  // Default upgrade policy ("MANUAL" | "AUTO" | "RECOMMEND")
  metadata?: Record<string, any>
}

/**
 * Meaningful progression audit/milestone entry
 */
export interface ProgressionMilestone {
  type:
    | "ACTIVATED"
    | "LEVEL_UP"
    | "LEVEL_MILESTONE"
    | "AWAITING_UPGRADE"
    | "TIER_UPGRADE_STARTED"
    | "TIER_BREAKTHROUGH"
    | "CAPABILITY_UNLOCKED"
    | "MAXED"
  gameDay: number
  level: number
  tierId: string
  details?: Record<string, any>
  timestamp: string
}

/**
 * Domain-agnostic runtime progression state for an individual entity
 */
export interface ProgressionEntity {
  entityId: string
  profileId: string
  currentLevel: number               // 0 = under construction / inactive; >= 1 = active operational
  currentExp: number                 // Current EXP towards next level (capped at tier/max boundary)
  currentTierId: string              // Active tier ID
  state: ProgressionState
  upgradePolicy: AutoUpgradePolicy
  upgradeStartedDay?: number
  upgradeCompleteDay?: number
  // Non-retroactive accounting: tracks exact number of levels earned under each tierId
  // e.g. { "TIER_I": 10, "TIER_II": 4 }
  levelHistory: Record<string, number>
  milestones?: ProgressionMilestone[]
}

/**
 * Output of deterministic runtime effect resolution
 */
export interface ResolvedEntityEffects {
  entityId: string
  currentLevel: number
  currentTierId: string
  state: ProgressionState
  statModifiers: Record<string, number>
  capacityModifiers: Record<string, number>
  unlockedAttributes: string[]
  unlockedCapabilities: string[]
  unlockedModuleSlots: number
  perTierLevelContributions: Record<string, { levels: number; multiplier: number; stats: Record<string, number> }>
  breakthroughTiers: string[]
}

/**
 * External requirement validation result
 */
export interface UpgradeRequirementValidationResult {
  valid: boolean
  reason?: string
  details?: Record<string, any>
}

/**
 * Type for external requirement validator function
 */
export type UpgradeRequirementValidator = (
  entity: ProgressionEntity,
  targetTier: TierDefinition,
  context?: any
) => UpgradeRequirementValidationResult
