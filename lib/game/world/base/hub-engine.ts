/**
 * STARFRONT WORLD — Hub Specialization Engine (Phase 6.34A-FND-6)
 *
 * Implements:
 * 1. Hub Specialization Slot unlocking based on Base Tier (MK I -> MK X).
 * 2. 8 Approved Hub Types with defined operational requirements (Building types, Personnel).
 * 3. 4 Lifecycle States: LOCKED, AVAILABLE, ACTIVE, SUSPENDED.
 * 4. Automatic status evaluation & suspension handling with human-readable Vietnamese reasons.
 * 5. Hub Specialization bonuses application (Command, Logistics, Industry, Medical, etc.).
 */

import type { BuildingInstance } from "../building/types"
import type { BasePopulationState } from "../population/types"
import type {
  HubSpecializationInstance,
  HubSpecializationStatus,
  HubSpecializationType,
} from "./types"
import { SYSTEM_HUB_SPECIALIZATION_DEFINITIONS } from "./seed-data"

/**
 * Calculates max Hub Specialization slots unlocked by base tier
 * Non-capital: MK I..II: 1, MK III..IV: 2, MK V..VI: 3, MK VII..VIII: 4, MK IX..X: 5
 * Capital: MK I: 2, MK II: 3, MK III: 4, MK IV: 5, MK V: 6, MK VI: 7, MK VII: 8, MK VIII: 8, MK IX: 8, MK X: 8 (+ MAX TIER BONUS)
 */
export function calculateMaxHubSlots(tier: number, isCapital: boolean = false): number {
  const safeTier = Math.max(1, Math.min(10, tier))

  if (isCapital) {
    if (safeTier === 1) return 2
    if (safeTier === 2) return 3
    if (safeTier === 3) return 4
    if (safeTier === 4) return 5
    if (safeTier === 5) return 6
    if (safeTier === 6) return 7
    return 8
  }

  if (safeTier <= 2) return 1
  if (safeTier <= 4) return 2
  if (safeTier <= 6) return 3
  if (safeTier <= 8) return 4
  return 5
}

/**
 * Checks if a base fulfills the operational prerequisites for activating a Hub Specialization
 */
export function canActivateHubSpecialization(
  hubType: HubSpecializationType,
  tier: number,
  buildings: Record<string, BuildingInstance>,
  popState?: BasePopulationState,
  isCapital: boolean = false
): {
  canActivate: boolean
  operationalRequirementsMet: boolean
  missingRequirements: string[]
  reason?: string
} {
  const def = SYSTEM_HUB_SPECIALIZATION_DEFINITIONS[hubType]
  if (!def) {
    return {
      canActivate: false,
      operationalRequirementsMet: false,
      missingRequirements: [`Định nghĩa Hub "${hubType}" không tồn tại trong SYSTEM Catalog`],
      reason: `Định nghĩa Hub "${hubType}" không hợp lệ.`,
    }
  }

  const missingRequirements: string[] = []

  // 1. Tier unlock requirement
  if (!isCapital && tier < def.unlockedAtTier) {
    missingRequirements.push(
      `Căn cứ đạt Tier MK ${tier}, yêu cầu tối thiểu Tier MK ${def.unlockedAtTier}`
    )
  }

  // 2. Personnel requirement
  const availablePersonnel = popState?.workforceAssigned ?? popState?.populationOccupied ?? 0
  if (availablePersonnel < def.requiredPersonnel) {
    missingRequirements.push(
      `Thiếu nhân sự vận hành: cần ${def.requiredPersonnel} nhân lực, hiện có ${availablePersonnel}`
    )
  }

  // 3. Required building types operational check
  // Check active buildings matching required keywords
  const activeBuildings = Object.values(buildings).filter(
    (b) => b.operationalState === "ACTIVE" && !b.isOffline && b.operationalEfficiency > 0
  )

  for (const reqType of def.requiredBuildingTypes) {
    let found = false
    const matchLower = reqType.toLowerCase()

    for (const b of activeBuildings) {
      const defIdLower = b.definitionId.toLowerCase()
      if (
        defIdLower.includes(matchLower) ||
        (matchLower === "command" && defIdLower.includes("command_center")) ||
        (matchLower === "logistics" && (defIdLower.includes("cargo") || defIdLower.includes("depot"))) ||
        (matchLower === "storage" && defIdLower.includes("cargo")) ||
        (matchLower === "medical" && (defIdLower.includes("lab") || defIdLower.includes("hospital") || defIdLower.includes("habitat"))) ||
        (matchLower === "industry" && (defIdLower.includes("fabricator") || defIdLower.includes("foundry"))) ||
        (matchLower === "research" && (defIdLower.includes("tech") || defIdLower.includes("lab"))) ||
        (matchLower === "finance" && (defIdLower.includes("command") || defIdLower.includes("trade") || defIdLower.includes("exchange"))) ||
        (matchLower === "spaceport" && (defIdLower.includes("depot") || defIdLower.includes("bastion") || defIdLower.includes("dock"))) ||
        (matchLower === "support" && (defIdLower.includes("barracks") || defIdLower.includes("depot")))
      ) {
        found = true
        break
      }
    }

    if (!found) {
      missingRequirements.push(`Thiếu cơ sở hạ tầng chuyên trách loại [${reqType}] đang hoạt động`)
    }
  }

  const canActivate = missingRequirements.length === 0

  return {
    canActivate,
    operationalRequirementsMet: canActivate,
    missingRequirements,
    reason: canActivate
      ? undefined
      : `Không đủ điều kiện kích hoạt ${def.name}: ${missingRequirements.join("; ")}`,
  }
}

/**
 * Creates or updates a Hub Specialization instance on a base
 */
export function createHubSpecializationInstance(
  hubType: HubSpecializationType,
  tier: number,
  buildings: Record<string, BuildingInstance>,
  popState?: BasePopulationState,
  isCapital: boolean = false,
  currentGameDay: number = 1
): HubSpecializationInstance {
  const def = SYSTEM_HUB_SPECIALIZATION_DEFINITIONS[hubType]
  const check = canActivateHubSpecialization(hubType, tier, buildings, popState, isCapital)

  let status: HubSpecializationStatus = "AVAILABLE"
  let suspendedReason: string | undefined = undefined

  if (tier < def.unlockedAtTier && !isCapital) {
    status = "LOCKED"
    suspendedReason = `Chưa mở khóa: Yêu cầu căn cứ đạt Tier MK ${def.unlockedAtTier}`
  } else if (check.canActivate) {
    status = "ACTIVE"
  } else {
    status = "SUSPENDED"
    suspendedReason = check.reason
  }

  return {
    hubType,
    status,
    unlockedAtTier: def.unlockedAtTier,
    activatedGameDay: status === "ACTIVE" ? currentGameDay : undefined,
    activeBonusPercent: def.baseBonusPercent,
    operationalRequirementsMet: check.operationalRequirementsMet,
    suspendedReason,
    requiredBuildingTypes: def.requiredBuildingTypes,
    requiredPersonnel: def.requiredPersonnel,
  }
}

/**
 * Re-evaluates all existing Hub Specializations on a base.
 * If active hubs no longer meet prerequisites, transitions to SUSPENDED.
 * If suspended hubs regain prerequisites, transitions back to ACTIVE or AVAILABLE.
 */
export function reEvaluateHubSpecializations(
  hubInstances: HubSpecializationInstance[],
  tier: number,
  buildings: Record<string, BuildingInstance>,
  popState?: BasePopulationState,
  isCapital: boolean = false
): HubSpecializationInstance[] {
  return hubInstances.map((hub) => {
    const check = canActivateHubSpecialization(hub.hubType, tier, buildings, popState, isCapital)

    if (hub.status === "ACTIVE") {
      if (!check.operationalRequirementsMet) {
        // Suspend the active hub!
        return {
          ...hub,
          status: "SUSPENDED" as HubSpecializationStatus,
          operationalRequirementsMet: false,
          suspendedReason: `Đình chỉ hoạt động: ${check.missingRequirements.join("; ")}`,
        }
      }
      return {
        ...hub,
        operationalRequirementsMet: true,
        suspendedReason: undefined,
      }
    }

    if (hub.status === "SUSPENDED") {
      if (check.operationalRequirementsMet) {
        // Re-activate
        return {
          ...hub,
          status: "ACTIVE" as HubSpecializationStatus,
          operationalRequirementsMet: true,
          suspendedReason: undefined,
        }
      }
      return {
        ...hub,
        suspendedReason: check.reason,
      }
    }

    if (hub.status === "LOCKED") {
      if (tier >= hub.unlockedAtTier || isCapital) {
        return {
          ...hub,
          status: check.canActivate ? ("ACTIVE" as HubSpecializationStatus) : ("AVAILABLE" as HubSpecializationStatus),
          operationalRequirementsMet: check.canActivate,
          suspendedReason: check.canActivate ? undefined : check.reason,
        }
      }
    }

    return hub
  })
}
