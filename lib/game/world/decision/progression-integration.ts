/**
 * STARFRONT WORLD — Progression & Decision Integration Hook (Phase 6.34A-FND-3)
 *
 * Connects FND-2 Shared Progression with FND-3 Shared Decision Engine:
 * When an entity reaches AWAITING_UPGRADE with policy = RECOMMEND, creates a
 * decision request for Commander/Authority approval.
 */

import { getNextTier, startTierUpgrade } from "../progression/engine"
import type {
  ProgressionEntity,
  ProgressionProfile,
  UpgradeRequirementValidator,
} from "../progression/types"
import { SharedDecisionEngine, defaultDecisionEngine } from "./engine"
import type { DecisionValidationResult, SharedDecision } from "./types"

/**
 * Creates a tier upgrade decision request for a progression entity awaiting upgrade
 */
export function createProgressionUpgradeDecision(params: {
  entity: ProgressionEntity
  profile: ProgressionProfile
  gameDay: number
  engine?: SharedDecisionEngine
  timeoutDays?: number
}): {
  success: boolean
  decision?: SharedDecision
  reason?: string
} {
  const { entity, profile, gameDay, engine = defaultDecisionEngine, timeoutDays = 3 } = params

  if (entity.state !== "AWAITING_UPGRADE") {
    return {
      success: false,
      reason: `Entity ${entity.entityId} is in state '${entity.state}', must be 'AWAITING_UPGRADE'.`,
    }
  }

  const nextTier = getNextTier(profile, entity.currentTierId)
  if (!nextTier) {
    return {
      success: false,
      reason: "No next tier available (entity is already at highest reachable tier).",
    }
  }

  const scopeKey = `PROGRESSION:${entity.entityId}:TIER_UPGRADE`

  return engine.createDecision({
    decisionType: "TIER_UPGRADE_RECOMMENDATION",
    title: `Upgrade Recommendation: ${nextTier.displayName}`,
    summary: `Entity ${entity.entityId} has reached Level ${entity.currentLevel} and requests breakthrough authorization to ${nextTier.displayName}.`,
    createdGameDay: gameDay,
    timeoutGameDays: timeoutDays,
    fallbackPolicy: "AI_REEVALUATE",
    contextRef: {
      entityType: "PROGRESSION_ENTITY",
      entityId: entity.entityId,
    },
    payloadRef: {
      payloadType: "TIER_UPGRADE",
      payloadId: nextTier.tierId,
      data: {
        targetTierId: nextTier.tierId,
        minLevel: nextTier.minLevel,
        durationDays: nextTier.upgradeDurationGameDays,
      },
    },
    decisionScopeKey: scopeKey,
    priority: "HIGH",
    tags: ["PROGRESSION", "UPGRADE", entity.currentTierId, nextTier.tierId],
    auditFlags: ["AUTO_RECOMMENDED"],
    reasonCodes: ["TIER_CAP_REACHED"],
  })
}

/**
 * Validates a progression upgrade decision against domain requirements
 */
export function validateProgressionDecision(
  decision: SharedDecision,
  entityResolver: (entityId: string) => ProgressionEntity | undefined,
  profileResolver: (profileId: string) => ProgressionProfile | undefined,
  requirementValidator?: UpgradeRequirementValidator,
  context?: any
): DecisionValidationResult {
  const entity = entityResolver(decision.contextRef.entityId)
  if (!entity) {
    return {
      status: "INVALID",
      reason: `Progression entity '${decision.contextRef.entityId}' no longer exists.`,
    }
  }

  if (entity.state !== "AWAITING_UPGRADE") {
    return {
      status: "INVALID",
      reason: `Entity state changed to '${entity.state}' (no longer AWAITING_UPGRADE).`,
    }
  }

  const profile = profileResolver(entity.profileId)
  if (!profile) {
    return {
      status: "INVALID",
      reason: `Progression profile '${entity.profileId}' not found.`,
    }
  }

  const nextTier = getNextTier(profile, entity.currentTierId)
  if (!nextTier || nextTier.tierId !== decision.payloadRef?.payloadId) {
    return {
      status: "INVALID",
      reason: "Target tier mismatch or next tier unreachable.",
    }
  }

  if (requirementValidator) {
    const val = requirementValidator(entity, nextTier, context)
    if (!val.valid) {
      return {
        status: "BLOCKED",
        reason: val.reason || "Requirements not satisfied.",
      }
    }
  }

  return { status: "VALID" }
}

/**
 * Resolves an approved progression decision by starting the tier upgrade process
 */
export function applyApprovedProgressionDecision(
  decision: SharedDecision,
  entity: ProgressionEntity,
  profile: ProgressionProfile,
  gameDay: number
): { success: boolean; completeDay?: number; reason?: string } {
  if (decision.status !== "APPROVED") {
    return {
      success: false,
      reason: `Decision status is '${decision.status}', must be 'APPROVED' to apply.`,
    }
  }

  return startTierUpgrade({
    entity,
    profile,
    gameDay,
  })
}
