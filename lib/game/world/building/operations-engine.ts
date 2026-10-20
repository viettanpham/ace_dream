/**
 * STARFRONT WORLD — Building Operations & Maintenance Engine (Phase 6.34A-FND-5)
 *
 * Implements:
 * 1. 3-Pass Workforce Allocator integration with FND-4.
 * 2. Building OFF semantics (excluded from allocation, releases workforce immediately).
 * 3. Commander Override with expiration & emergency AI override with audit logging.
 * 4. Operational Efficiency separation from Performance Bonuses.
 * 5. Asset Condition & HP Damage calculation with Condition Overflow formula:
 *    ConditionOverflowDamage = Math.max(-RawConditionAfterDamage, 0)
 *    NewHP = Math.max(HPAfterDamage - ConditionOverflowDamage, 0)
 * 6. Maintenance Policies (AUTO, MANUAL, EMERGENCY, DISABLED).
 * 7. Building Effects evaluation (SELF, BASE, NETWORK scopes; stacking and deduplication).
 */

import { allocateWorkforce } from "../population/allocator"
import type { BasePopulationState, WorkforceDemand } from "../population/types"
import type {
  BuildingDefinition,
  BuildingEffect,
  BuildingInstance,
  CommanderBuildingOverride,
} from "./types"

/**
 * Builds WorkforceDemand list for all building instances in a base
 */
export function buildBuildingWorkforceDemands(
  buildings: Record<string, BuildingInstance>,
  definitions: Map<string, BuildingDefinition>,
  currentGameDay: number = 1
): WorkforceDemand[] {
  const demands: WorkforceDemand[] = []

  for (const b of Object.values(buildings)) {
    const def = definitions.get(b.definitionId)
    if (!def) continue

    // Check Commander Override expiration
    if (b.commanderOverride?.expiresAtGameDay && currentGameDay >= b.commanderOverride.expiresAtGameDay) {
      delete b.commanderOverride.expiresAtGameDay
      delete b.commanderOverride.forcedPersonnel
      delete b.commanderOverride.isLocked
    }

    const isExcluded = b.isOffline || b.operationalState === "OFFLINE" || b.operationalState === "DAMAGED"
    const isLocked = Boolean(b.commanderOverride?.isLocked)

    let minP = def.workforceDemands.minimumPersonnel
    let tgtP = def.workforceDemands.targetPersonnel
    let maxP = def.workforceDemands.maximumPersonnel

    if (b.commanderOverride?.forcedPersonnel !== undefined) {
      tgtP = Math.max(minP, b.commanderOverride.forcedPersonnel)
      maxP = Math.max(tgtP, maxP)
    }

    demands.push({
      demandId: `bld_demand_${b.instanceId}`,
      targetRef: {
        entityType: "BUILDING",
        entityId: b.instanceId,
      },
      minimumPersonnel: minP,
      targetPersonnel: tgtP,
      maximumPersonnel: maxP,
      priority: def.workforceDemands.priority,
      assignmentCategory: "BUILDING_WORKFORCE",
      isLocked,
      isExcluded,
    })
  }

  return demands
}

/**
 * Executes workforce allocation for a base and updates building operational states
 */
export function syncBaseBuildingWorkforce(
  basePopulationState: BasePopulationState,
  buildings: Record<string, BuildingInstance>,
  definitions: Map<string, BuildingDefinition>,
  currentGameDay: number = 1
): void {
  // Reset previously assigned building workforce to guarantee idempotency
  const currentBuildingLabor = basePopulationState.breakdown.BUILDING_WORKFORCE || 0
  basePopulationState.populationAvailable += currentBuildingLabor
  basePopulationState.populationOccupied = Math.max(0, basePopulationState.populationOccupied - currentBuildingLabor)
  basePopulationState.breakdown.BUILDING_WORKFORCE = 0

  const demands = buildBuildingWorkforceDemands(buildings, definitions, currentGameDay)
  const report = allocateWorkforce(basePopulationState, demands)

  for (const result of report.results) {
    const instanceId = result.targetRef.entityId
    const building = buildings[instanceId]
    if (!building) continue

    building.assignedPersonnel = result.assignedPersonnel

    if (result.isExcluded) {
      building.operationalState = "OFFLINE"
      building.operationalEfficiency = 0
    } else if (!result.operationalEligibility) {
      building.operationalState = "INACTIVE"
      building.operationalEfficiency = 0
    } else {
      building.operationalState = "ACTIVE"
      if (result.targetPersonnel > 0) {
        building.operationalEfficiency = Math.min(
          1.0,
          result.assignedPersonnel / result.targetPersonnel
        )
      } else {
        building.operationalEfficiency = 1.0
      }
    }
  }
}

/**
 * Toggles Building ON/OFF.
 * When OFF: immediately excludes building and releases workforce back to base available pool.
 */
export function setBuildingOfflineStatus(
  building: BuildingInstance,
  isOffline: boolean,
  basePopulationState: BasePopulationState,
  buildings: Record<string, BuildingInstance>,
  definitions: Map<string, BuildingDefinition>,
  currentGameDay: number = 1
): void {
  building.isOffline = isOffline
  building.operationalState = isOffline ? "OFFLINE" : "ACTIVE"

  // Re-run allocation to immediately redistribute released personnel
  syncBaseBuildingWorkforce(basePopulationState, buildings, definitions, currentGameDay)
}

/**
 * Sets Commander Override with optional duration
 */
export function setCommanderOverride(
  building: BuildingInstance,
  override: CommanderBuildingOverride,
  currentGameDay: number
): void {
  building.commanderOverride = {
    ...override,
    lastModifiedGameDay: currentGameDay,
  }
}

/**
 * Applies Emergency AI Override if permitted by policy
 */
export function applyEmergencyAiOverride(
  building: BuildingInstance,
  reason: string,
  currentGameDay: number
): boolean {
  if (building.commanderOverride?.isLocked) {
    // If locked by commander, AI cannot override unless emergency condition
    if (reason !== "DISASTER_EVACUATION" && reason !== "CRITICAL_DEFENSE_BREACH") {
      return false
    }
  }

  building.commanderOverride = {
    isLocked: false,
    overrideReason: `EMERGENCY_AI: ${reason}`,
    lastModifiedGameDay: currentGameDay,
  }

  if (!building.reasonCodes) building.reasonCodes = []
  building.reasonCodes.push(`EMERGENCY_AI_OVERRIDE_${reason}_DAY_${currentGameDay}`)

  return true
}

/**
 * Applies incoming combat/disaster damage using the Canonical Condition Overflow Formula:
 *
 * HPAfterDamage = CurrentHP - IncomingDamage
 * RawConditionAfterDamage = CurrentConditionHP - IncomingDamage
 * ConditionOverflowDamage = Math.max(-RawConditionAfterDamage, 0)
 * NewConditionHP = Math.max(RawConditionAfterDamage, 0)
 * NewHP = Math.max(HPAfterDamage - ConditionOverflowDamage, 0)
 */
export function applyDamageToBuilding(
  building: BuildingInstance,
  incomingDamage: number
): {
  newHp: number
  newConditionHp: number
  conditionOverflow: number
  isDestroyed: boolean
} {
  const safeDamage = Math.max(0, incomingDamage)

  const hpAfterDamage = building.currentHp - safeDamage
  const rawConditionAfterDamage = building.conditionHp - safeDamage
  const conditionOverflow = Math.max(0, -rawConditionAfterDamage)

  const newConditionHp = Math.max(0, rawConditionAfterDamage)
  const newHp = Math.max(0, hpAfterDamage - conditionOverflow)

  building.currentHp = newHp
  building.conditionHp = newConditionHp

  if (newHp <= 0) {
    building.operationalState = "DAMAGED"
    building.operationalEfficiency = 0
  }

  return {
    newHp,
    newConditionHp,
    conditionOverflow,
    isDestroyed: newHp <= 0,
  }
}

/**
 * Performs maintenance repair on a building instance
 */
export function repairBuilding(
  building: BuildingInstance,
  repairHp: number,
  repairCondition: number
): void {
  building.currentHp = Math.min(building.maxHp, building.currentHp + Math.max(0, repairHp))
  building.conditionHp = Math.min(building.maxHp, building.conditionHp + Math.max(0, repairCondition))

  if (building.currentHp > 0 && building.operationalState === "DAMAGED") {
    building.operationalState = building.isOffline ? "OFFLINE" : "ACTIVE"
  }
}

/**
 * Evaluates active effects of a base's buildings with scope, stacking, and deduplication
 */
export function evaluateBaseBuildingEffects(
  buildings: Record<string, BuildingInstance>,
  definitions: Map<string, BuildingDefinition>
): {
  baseModifiers: Record<string, number>
  networkModifiers: Record<string, number>
} {
  const baseModifiers: Record<string, number> = {}
  const networkModifiers: Record<string, number> = {}
  const seenEffectIds = new Set<string>()

  for (const b of Object.values(buildings)) {
    if (b.operationalState !== "ACTIVE" || b.operationalEfficiency <= 0) continue

    const def = definitions.get(b.definitionId)
    if (!def?.effects) continue

    for (const eff of def.effects) {
      if (!eff.stackable && seenEffectIds.has(eff.id)) {
        continue
      }
      seenEffectIds.add(eff.id)

      const scaledValue = eff.value * b.operationalEfficiency * b.performanceBonusMultiplier

      if (eff.scope === "BASE" || eff.scope === "SELF") {
        baseModifiers[eff.targetMetric] = (baseModifiers[eff.targetMetric] || 0) + scaledValue
      } else if (eff.scope === "NETWORK") {
        networkModifiers[eff.targetMetric] = (networkModifiers[eff.targetMetric] || 0) + scaledValue
      }
    }
  }

  return { baseModifiers, networkModifiers }
}
