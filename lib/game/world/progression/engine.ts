/**
 * STARFRONT WORLD — Shared Progression Engine (Phase 6.34A-FND-2)
 *
 * Implements domain-agnostic progression runtime:
 * - Level 0 (inactive/constructing) vs Level 1 (active operational)
 * - EXP accumulation, multiple level-ups, deterministic exponential/linear curve
 * - Hard Tier Boundary: AWAITING_UPGRADE, strict EXP hard cap, no hidden overflow
 * - Soft/Auto Tier Transition (needUpgrade = false, upgradeDurationGameDays = 0)
 * - External Upgrade Process (GAME_DAY based duration, state = UPGRADING)
 * - Non-retroactive Per-Tier Level Effect Multipliers (levels in Tier I keep Tier I rate)
 * - Triggered Level Effects (EXACT_LEVEL, INTERVAL: 5, 10, 15...)
 * - Tier Breakthrough Effects & Module/Capability/Attribute Unlocks
 * - Global Max-Level & Tier Truncation
 * - Auto, Recommend, Manual Upgrade Policies
 */

import type {
  AutoUpgradePolicy,
  LevelEffectDefinition,
  LevelEffectProfile,
  ProgressionEntity,
  ProgressionMilestone,
  ProgressionProfile,
  ResolvedEntityEffects,
  TierDefinition,
  TierEffectDefinition,
  UpgradeRequirementValidator,
} from "./types"

/**
 * Creates a new progression entity with default/initial state
 */
export function createProgressionEntity(params: {
  entityId: string
  profileId: string
  initialLevel?: number
  initialTierId?: string
  policy?: AutoUpgradePolicy
}): ProgressionEntity {
  const initialLevel = params.initialLevel ?? 0
  const initialTierId = params.initialTierId ?? "TIER_I"
  const policy = params.policy ?? "MANUAL"

  const levelHistory: Record<string, number> = {}
  if (initialLevel >= 1) {
    levelHistory[initialTierId] = initialLevel
  }

  return {
    entityId: params.entityId,
    profileId: params.profileId,
    currentLevel: initialLevel,
    currentExp: 0,
    currentTierId: initialTierId,
    state: initialLevel >= 1 ? "PROGRESSING" : "AWAITING_UPGRADE",
    upgradePolicy: policy,
    levelHistory,
    milestones: [],
  }
}

/**
 * Activates an entity from Level 0 (construction/installation) to Level 1 (operational).
 * Invariant: Level 1 is a real level and earns PerLevelEffect.
 */
export function activateEntity(
  entity: ProgressionEntity,
  gameDay: number
): { success: boolean; entity: ProgressionEntity } {
  if (entity.currentLevel > 0) {
    return { success: false, entity }
  }

  entity.currentLevel = 1
  entity.state = "PROGRESSING"
  entity.currentExp = 0
  entity.levelHistory[entity.currentTierId] = 1

  recordMilestone(entity, {
    type: "ACTIVATED",
    gameDay,
    level: 1,
    tierId: entity.currentTierId,
    details: { reason: "Entity commissioned and operational at Level 1" },
    timestamp: new Date().toISOString(),
  })

  return { success: true, entity }
}

/**
 * Calculates EXP required to advance from `currentLevel` to `currentLevel + 1`
 */
export function getExpRequiredForNextLevel(
  profile: ProgressionProfile,
  currentLevel: number
): number {
  if (currentLevel < 1) return profile.baseExpPerLevel
  if (currentLevel >= profile.globalMaxLevel) return 0

  const growth = Math.pow(profile.expGrowthFactor, Math.max(0, currentLevel - 1))
  return Math.max(1, Math.floor(profile.baseExpPerLevel * growth))
}

/**
 * Resolves the currently active tier object from profile
 */
export function getActiveTier(
  profile: ProgressionProfile,
  currentTierId: string
): TierDefinition | undefined {
  return profile.tiers.find((t) => t.tierId === currentTierId)
}

/**
 * Resolves the next reachable tier object in the profile
 */
export function getNextTier(
  profile: ProgressionProfile,
  currentTierId: string
): TierDefinition | undefined {
  const currentTier = getActiveTier(profile, currentTierId)
  if (!currentTier) return undefined

  if (currentTier.nextTierId) {
    const specified = profile.tiers.find((t) => t.tierId === currentTier.nextTierId)
    if (specified && specified.minLevel <= profile.globalMaxLevel) {
      return specified
    }
  }

  // Fallback to next tier by tierOrder
  const next = profile.tiers
    .filter((t) => t.tierOrder > currentTier.tierOrder && t.minLevel <= profile.globalMaxLevel)
    .sort((a, b) => a.tierOrder - b.tierOrder)[0]

  return next
}

/**
 * Result of gaining EXP
 */
export interface GainExpResult {
  levelsGained: number
  newLevel: number
  newExp: number
  state: ProgressionEntity["state"]
  reachedHardBoundary: boolean
  reachedMaxed: boolean
  autoTierTransitioned: boolean
  oldTierId?: string
  newTierId?: string
}

/**
 * Grants EXP to an entity and evaluates level-ups, tier transitions, and hard boundaries.
 * Enforces NO HIDDEN OVERFLOW when a hard tier boundary is met.
 */
export function gainExp(
  entity: ProgressionEntity,
  amount: number,
  profile: ProgressionProfile,
  gameDay: number
): GainExpResult {
  const result: GainExpResult = {
    levelsGained: 0,
    newLevel: entity.currentLevel,
    newExp: entity.currentExp,
    state: entity.state,
    reachedHardBoundary: false,
    reachedMaxed: false,
    autoTierTransitioned: false,
  }

  if (amount <= 0) return result
  if (entity.currentLevel === 0) return result // Must be activated first
  if (entity.state === "MAXED") return result
  if (entity.state === "AWAITING_UPGRADE") return result // Hard capped, no hidden overflow
  if (entity.state === "UPGRADING") return result

  let remainingExp = amount

  while (remainingExp > 0 && entity.state === "PROGRESSING") {
    // 1. Check Global Max Level
    if (entity.currentLevel >= profile.globalMaxLevel) {
      entity.state = "MAXED"
      entity.currentExp = 0
      result.reachedMaxed = true
      result.state = "MAXED"
      recordMilestone(entity, {
        type: "MAXED",
        gameDay,
        level: entity.currentLevel,
        tierId: entity.currentTierId,
        details: { globalMaxLevel: profile.globalMaxLevel },
        timestamp: new Date().toISOString(),
      })
      break
    }

    const currentTier = getActiveTier(profile, entity.currentTierId)
    if (!currentTier) break

    // 2. Check if current level is already at or above Tier Max Level
    if (entity.currentLevel >= currentTier.maxLevel) {
      if (currentTier.needUpgrade) {
        // Hard Tier Boundary!
        entity.state = "AWAITING_UPGRADE"
        entity.currentExp = getExpRequiredForNextLevel(profile, entity.currentLevel)
        result.reachedHardBoundary = true
        result.state = "AWAITING_UPGRADE"
        remainingExp = 0 // STRICT DISCIPLINE: No hidden overflow, no carry-over!
        recordMilestone(entity, {
          type: "AWAITING_UPGRADE",
          gameDay,
          level: entity.currentLevel,
          tierId: entity.currentTierId,
          details: { tierMaxLevel: currentTier.maxLevel },
          timestamp: new Date().toISOString(),
        })
        break
      } else {
        // Soft Auto Tier Transition
        const nextTier = getNextTier(profile, entity.currentTierId)
        if (nextTier) {
          const oldTierId = entity.currentTierId
          entity.currentTierId = nextTier.tierId
          result.autoTierTransitioned = true
          result.oldTierId = oldTierId
          result.newTierId = nextTier.tierId
          recordMilestone(entity, {
            type: "TIER_BREAKTHROUGH",
            gameDay,
            level: entity.currentLevel,
            tierId: nextTier.tierId,
            details: { mode: "AUTO_SOFT_TRANSITION", previousTier: oldTierId },
            timestamp: new Date().toISOString(),
          })
          // Continue loop into new tier
          continue
        } else {
          // No next tier available -> MAXED
          entity.state = "MAXED"
          entity.currentExp = 0
          result.reachedMaxed = true
          result.state = "MAXED"
          recordMilestone(entity, {
            type: "MAXED",
            gameDay,
            level: entity.currentLevel,
            tierId: entity.currentTierId,
            details: { reason: "Last reachable tier reached" },
            timestamp: new Date().toISOString(),
          })
          break
        }
      }
    }

    // 3. Normal level-up evaluation within tier
    const expNeeded = getExpRequiredForNextLevel(profile, entity.currentLevel) - entity.currentExp

    if (remainingExp >= expNeeded) {
      remainingExp -= expNeeded
      entity.currentExp = 0
      entity.currentLevel += 1
      result.levelsGained += 1

      // Record non-retroactive level history for current tier
      entity.levelHistory[entity.currentTierId] =
        (entity.levelHistory[entity.currentTierId] || 0) + 1

      recordMilestone(entity, {
        type: "LEVEL_UP",
        gameDay,
        level: entity.currentLevel,
        tierId: entity.currentTierId,
        details: { levelsGainedInTick: 1 },
        timestamp: new Date().toISOString(),
      })

      // Check if newly reached level hits global max
      if (entity.currentLevel >= profile.globalMaxLevel) {
        entity.state = "MAXED"
        remainingExp = 0
        result.reachedMaxed = true
        result.state = "MAXED"
        recordMilestone(entity, {
          type: "MAXED",
          gameDay,
          level: entity.currentLevel,
          tierId: entity.currentTierId,
          details: { globalMaxLevel: profile.globalMaxLevel },
          timestamp: new Date().toISOString(),
        })
        break
      }

      // Check if newly reached level hits Tier max level
      if (entity.currentLevel >= currentTier.maxLevel) {
        if (currentTier.needUpgrade) {
          entity.state = "AWAITING_UPGRADE"
          entity.currentExp = getExpRequiredForNextLevel(profile, entity.currentLevel)
          result.reachedHardBoundary = true
          result.state = "AWAITING_UPGRADE"
          remainingExp = 0 // STRICT DISCIPLINE: Discard excess EXP at hard boundary!
          recordMilestone(entity, {
            type: "AWAITING_UPGRADE",
            gameDay,
            level: entity.currentLevel,
            tierId: entity.currentTierId,
            details: { tierMaxLevel: currentTier.maxLevel },
            timestamp: new Date().toISOString(),
          })
          break
        } else {
          // Soft Auto Tier Transition
          const nextTier = getNextTier(profile, entity.currentTierId)
          if (nextTier) {
            const oldTierId = entity.currentTierId
            entity.currentTierId = nextTier.tierId
            result.autoTierTransitioned = true
            result.oldTierId = oldTierId
            result.newTierId = nextTier.tierId
            recordMilestone(entity, {
              type: "TIER_BREAKTHROUGH",
              gameDay,
              level: entity.currentLevel,
              tierId: nextTier.tierId,
              details: { mode: "AUTO_SOFT_TRANSITION", previousTier: oldTierId },
              timestamp: new Date().toISOString(),
            })
            // Continue loop with remainingExp
          } else {
            entity.state = "MAXED"
            entity.currentExp = 0
            result.reachedMaxed = true
            result.state = "MAXED"
            break
          }
        }
      }
    } else {
      entity.currentExp += remainingExp
      remainingExp = 0
      break
    }
  }

  result.newLevel = entity.currentLevel
  result.newExp = entity.currentExp
  result.state = entity.state
  return result
}

/**
 * Initiates an external Tier Upgrade process for an entity awaiting upgrade.
 * Validates requirements externally without consuming resources inside core.
 */
export function startTierUpgrade(params: {
  entity: ProgressionEntity
  profile: ProgressionProfile
  gameDay: number
  validator?: UpgradeRequirementValidator
  context?: any
}): { success: boolean; reason?: string; completeDay?: number } {
  const { entity, profile, gameDay, validator, context } = params

  if (entity.state !== "AWAITING_UPGRADE") {
    return {
      success: false,
      reason: `Entity is in state '${entity.state}', must be 'AWAITING_UPGRADE' to start tier upgrade.`,
    }
  }

  const currentTier = getActiveTier(profile, entity.currentTierId)
  if (!currentTier) {
    return { success: false, reason: `Current tier '${entity.currentTierId}' not found in profile.` }
  }

  const nextTier = getNextTier(profile, entity.currentTierId)
  if (!nextTier) {
    return { success: false, reason: "No next tier available (entity is already at highest tier)." }
  }

  // External Requirement Validation Hook
  if (validator) {
    const valResult = validator(entity, nextTier, context)
    if (!valResult.valid) {
      return {
        success: false,
        reason: valResult.reason || "Upgrade requirements not satisfied.",
      }
    }
  }

  // If upgrade duration is 0, complete immediately
  if (currentTier.upgradeDurationGameDays <= 0) {
    completeTierUpgrade(entity, profile, gameDay)
    return { success: true, completeDay: gameDay }
  }

  // Set UPGRADING state with GAME_DAY duration
  entity.state = "UPGRADING"
  entity.upgradeStartedDay = gameDay
  entity.upgradeCompleteDay = gameDay + currentTier.upgradeDurationGameDays

  recordMilestone(entity, {
    type: "TIER_UPGRADE_STARTED",
    gameDay,
    level: entity.currentLevel,
    tierId: entity.currentTierId,
    details: {
      nextTierId: nextTier.tierId,
      upgradeStartedDay: gameDay,
      upgradeCompleteDay: entity.upgradeCompleteDay,
      durationDays: currentTier.upgradeDurationGameDays,
    },
    timestamp: new Date().toISOString(),
  })

  return { success: true, completeDay: entity.upgradeCompleteDay }
}

/**
 * Completes a tier breakthrough, transitioning to nextTierId
 */
export function completeTierUpgrade(
  entity: ProgressionEntity,
  profile: ProgressionProfile,
  gameDay: number
): { success: boolean; oldTierId: string; newTierId: string } {
  const currentTier = getActiveTier(profile, entity.currentTierId)
  const nextTier = getNextTier(profile, entity.currentTierId)

  if (!nextTier) {
    entity.state = "MAXED"
    return {
      success: false,
      oldTierId: entity.currentTierId,
      newTierId: entity.currentTierId,
    }
  }

  const oldTierId = entity.currentTierId
  entity.currentTierId = nextTier.tierId
  entity.currentExp = 0
  entity.upgradeStartedDay = undefined
  entity.upgradeCompleteDay = undefined

  // Advance level if nextTier.minLevel is higher than current level
  if (entity.currentLevel < nextTier.minLevel) {
    const addedLevels = nextTier.minLevel - entity.currentLevel
    entity.currentLevel = nextTier.minLevel
    entity.levelHistory[nextTier.tierId] =
      (entity.levelHistory[nextTier.tierId] || 0) + addedLevels
  }

  // Check if new state is MAXED
  if (entity.currentLevel >= profile.globalMaxLevel) {
    entity.state = "MAXED"
    recordMilestone(entity, {
      type: "MAXED",
      gameDay,
      level: entity.currentLevel,
      tierId: entity.currentTierId,
      details: { globalMaxLevel: profile.globalMaxLevel },
      timestamp: new Date().toISOString(),
    })
  } else {
    entity.state = "PROGRESSING"
  }

  recordMilestone(entity, {
    type: "TIER_BREAKTHROUGH",
    gameDay,
    level: entity.currentLevel,
    tierId: nextTier.tierId,
    details: {
      oldTierId,
      newTierId: nextTier.tierId,
      newMinLevel: nextTier.minLevel,
    },
    timestamp: new Date().toISOString(),
  })

  return {
    success: true,
    oldTierId,
    newTierId: nextTier.tierId,
  }
}

/**
 * Progresses time simulation by `gameDay`. Completes active upgrades when duration expires.
 */
export function processDayTick(params: {
  entity: ProgressionEntity
  profile: ProgressionProfile
  currentDay: number
  validator?: UpgradeRequirementValidator
  context?: any
}): {
  upgraded: boolean
  oldTierId?: string
  newTierId?: string
  recommendationEmitted?: boolean
} {
  const { entity, profile, currentDay, validator, context } = params

  // 1. Check if an active upgrade is ready for completion
  if (entity.state === "UPGRADING") {
    if (entity.upgradeCompleteDay !== undefined && currentDay >= entity.upgradeCompleteDay) {
      const upgradeRes = completeTierUpgrade(entity, profile, currentDay)
      return {
        upgraded: true,
        oldTierId: upgradeRes.oldTierId,
        newTierId: upgradeRes.newTierId,
      }
    }
  }

  // 2. Check Auto Upgrade Policy
  if (entity.state === "AWAITING_UPGRADE") {
    if (entity.upgradePolicy === "AUTO") {
      const startRes = startTierUpgrade({
        entity,
        profile,
        gameDay: currentDay,
        validator,
        context,
      })
      if (startRes.success) {
        return { upgraded: false }
      }
    } else if (entity.upgradePolicy === "RECOMMEND") {
      return { upgraded: false, recommendationEmitted: true }
    }
  }

  return { upgraded: false }
}

/**
 * Deterministically resolves and calculates all active effects for an entity:
 * - Accumulated per-tier level contributions (non-retroactive)
 * - Triggered level effects (EXACT_LEVEL and INTERVAL)
 * - Accumulated tier breakthrough effects
 * - Attribute, capability, and module-slot unlocks
 */
export function calculateResolvedEffects(params: {
  entity: ProgressionEntity
  profile: ProgressionProfile
  levelEffectProfile?: LevelEffectProfile
  tierEffects?: TierEffectDefinition[]
}): ResolvedEntityEffects {
  const { entity, profile, levelEffectProfile, tierEffects = [] } = params

  const statModifiers: Record<string, number> = {}
  const capacityModifiers: Record<string, number> = {}
  const unlockedAttributesSet = new Set<string>()
  const unlockedCapabilitiesSet = new Set<string>()
  let unlockedModuleSlots = 0

  const perTierContributions: ResolvedEntityEffects["perTierLevelContributions"] = {}

  // 1. Non-retroactive Per-Tier Level Contributions
  // Each tier's earned levels use that tier's multiplier: Sum(levels_in_tier * tier_multiplier * basePerLevelBonus)
  if (levelEffectProfile && levelEffectProfile.basePerLevelBonus) {
    for (const tier of profile.tiers) {
      const levelsInTier = entity.levelHistory[tier.tierId] || 0
      if (levelsInTier <= 0) continue

      const multiplier = tier.levelEffectMultiplier || 1.0
      const tierStats: Record<string, number> = {}

      for (const [stat, baseBonus] of Object.entries(levelEffectProfile.basePerLevelBonus)) {
        const contribution = levelsInTier * multiplier * baseBonus
        tierStats[stat] = contribution
        statModifiers[stat] = (statModifiers[stat] || 0) + contribution
      }

      perTierContributions[tier.tierId] = {
        levels: levelsInTier,
        multiplier,
        stats: tierStats,
      }
    }
  }

  // 2. Triggered Level Effects (EXACT_LEVEL and INTERVAL)
  if (levelEffectProfile && Array.isArray(levelEffectProfile.effects)) {
    for (const eff of levelEffectProfile.effects) {
      if (eff.triggerType === "EXACT_LEVEL") {
        if (eff.level !== undefined && entity.currentLevel >= eff.level) {
          applyLevelEffectModifiers(eff, statModifiers, unlockedCapabilitiesSet, unlockedAttributesSet)
          if (eff.moduleSlotUnlocks) unlockedModuleSlots += eff.moduleSlotUnlocks
        }
      } else if (eff.triggerType === "INTERVAL") {
        const start = eff.startLevel ?? 1
        const interval = eff.intervalLevels ?? 1
        if (entity.currentLevel >= start && interval > 0) {
          const triggersCount = Math.floor((entity.currentLevel - start) / interval) + 1
          if (triggersCount > 0) {
            applyLevelEffectModifiers(
              eff,
              statModifiers,
              unlockedCapabilitiesSet,
              unlockedAttributesSet,
              triggersCount
            )
            if (eff.moduleSlotUnlocks) unlockedModuleSlots += eff.moduleSlotUnlocks * triggersCount
          }
        }
      }
    }
  }

  // 3. Accumulated Tier Breakthrough Effects
  const currentTier = getActiveTier(profile, entity.currentTierId)
  const currentOrder = currentTier ? currentTier.tierOrder : 1
  const breakthroughTiers: string[] = []

  const tierEffectMap = new Map<string, TierEffectDefinition>()
  for (const te of tierEffects) {
    tierEffectMap.set(te.tierId, te)
  }

  for (const tier of profile.tiers) {
    // Only apply breakthrough effects for tiers that the entity has reached/unlocked
    if (tier.tierOrder <= currentOrder) {
      breakthroughTiers.push(tier.tierId)
      const te = tierEffectMap.get(tier.tierId)
      if (te) {
        if (te.statModifiers) {
          for (const [k, v] of Object.entries(te.statModifiers)) {
            statModifiers[k] = (statModifiers[k] || 0) + v
          }
        }
        if (te.capacityModifiers) {
          for (const [k, v] of Object.entries(te.capacityModifiers)) {
            capacityModifiers[k] = (capacityModifiers[k] || 0) + v
          }
        }
        if (te.attributeUnlocks) {
          for (const attr of te.attributeUnlocks) unlockedAttributesSet.add(attr)
        }
        if (te.capabilityUnlocks) {
          for (const cap of te.capabilityUnlocks) unlockedCapabilitiesSet.add(cap)
        }
        if (te.moduleSlotUnlocks) {
          unlockedModuleSlots += te.moduleSlotUnlocks
        }
      }
    }
  }

  return {
    entityId: entity.entityId,
    currentLevel: entity.currentLevel,
    currentTierId: entity.currentTierId,
    state: entity.state,
    statModifiers,
    capacityModifiers,
    unlockedAttributes: Array.from(unlockedAttributesSet),
    unlockedCapabilities: Array.from(unlockedCapabilitiesSet),
    unlockedModuleSlots,
    perTierLevelContributions: perTierContributions,
    breakthroughTiers,
  }
}

function applyLevelEffectModifiers(
  eff: LevelEffectDefinition,
  statModifiers: Record<string, number>,
  capabilities: Set<string>,
  attributes: Set<string>,
  multiplier: number = 1
) {
  if (eff.statModifiers) {
    for (const [k, v] of Object.entries(eff.statModifiers)) {
      statModifiers[k] = (statModifiers[k] || 0) + v * multiplier
    }
  }
  if (eff.unlockedCapabilities) {
    for (const c of eff.unlockedCapabilities) capabilities.add(c)
  }
  if (eff.unlockedAttributes) {
    for (const a of eff.unlockedAttributes) attributes.add(a)
  }
}

function recordMilestone(entity: ProgressionEntity, milestone: ProgressionMilestone) {
  if (!entity.milestones) entity.milestones = []
  entity.milestones.push(milestone)
}
