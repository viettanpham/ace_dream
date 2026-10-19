/**
 * STARFRONT WORLD — Construction & Upgrade Engine (Phase 6.34A-FND-5)
 *
 * Implements:
 * 1. Core Facilities protection (never occupy expansion slots; immune to demolition).
 * 2. Expansion slot validation based on Base Tier & Slot Profile.
 * 3. Construction, upgrade, and demolition queue execution based on GAME_DAY.
 * 4. Preservation of equipped modules, workforce, storage, and reservations during upgrade.
 * 5. Safe AI demolition rules (only non-essential buildings when policy allows).
 */

import { canAddExpansionBuilding } from "./slot-engine"
import type {
  BaseEntityState,
  BuildingDefinition,
  BuildingInstance,
  ConstructionQueueItem,
  ResourceReservation,
} from "./types"

/**
 * Creates an initial runtime instance from a BuildingDefinition
 */
export function createBuildingInstance(
  baseId: string,
  definition: BuildingDefinition,
  instanceId?: string
): BuildingInstance {
  const id =
    instanceId ||
    `bld_${definition.id}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`

  return {
    instanceId: id,
    baseId,
    definitionId: definition.id,
    currentLevel: 1,
    currentTier: 1,
    currentHp: definition.maxHp,
    maxHp: definition.maxHp,
    conditionHp: definition.initialCondition,
    operationalState: "ACTIVE",
    isOffline: false,
    assignedPersonnel: 0,
    operationalEfficiency: 0,
    performanceBonusMultiplier: 1.0,
    maintenancePolicy: definition.defaultMaintenancePolicy,
    equippedModules: [],
    localStorage: {},
  }
}

/**
 * Enqueues a new building construction order
 */
export function enqueueConstruction(
  base: BaseEntityState,
  definition: BuildingDefinition,
  currentGameDay: number
): { success: boolean; queueItem?: ConstructionQueueItem; reason?: string } {
  // 1. Check expansion slots if not a core facility
  const slotCheck = canAddExpansionBuilding(base, definition.isCoreFacility)
  if (!slotCheck.canAdd) {
    return { success: false, reason: slotCheck.reason }
  }

  // 2. Verify and reserve construction costs from sharedStorage
  for (const [res, needed] of Object.entries(definition.baseCost)) {
    const available = base.sharedStorage[res] || 0
    if (available < needed) {
      return {
        success: false,
        reason: `INSUFFICIENT_CONSTRUCTION_RESOURCE: Requires ${needed} ${res}, only ${available} available.`,
      }
    }
  }

  // Deduct resources immediately (zero double-spend)
  const reservedCost: Record<string, number> = {}
  for (const [res, needed] of Object.entries(definition.baseCost)) {
    base.sharedStorage[res] -= needed
    reservedCost[res] = needed
  }

  const queueId = `cq_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  const completesAtGameDay = currentGameDay + Math.max(1, definition.buildDurationGameDays)

  const queueItem: ConstructionQueueItem = {
    queueId,
    baseId: base.baseId,
    action: "BUILD",
    buildingDefinitionId: definition.id,
    startedGameDay: currentGameDay,
    completesAtGameDay,
    reservedCost,
    status: "IN_PROGRESS",
  }

  base.constructionQueue.push(queueItem)

  const reservation: ResourceReservation = {
    reservationId: `res_${queueId}`,
    ownerRef: queueId,
    purpose: "CONSTRUCTION_COST",
    resources: { ...reservedCost },
    createdGameDay: currentGameDay,
  }
  base.activeReservations.push(reservation)

  return { success: true, queueItem }
}

/**
 * Enqueues an upgrade order for an existing building instance
 */
export function enqueueUpgrade(
  base: BaseEntityState,
  instanceId: string,
  definition: BuildingDefinition,
  currentGameDay: number
): { success: boolean; queueItem?: ConstructionQueueItem; reason?: string } {
  const building = base.buildings[instanceId]
  if (!building) {
    return { success: false, reason: "BUILDING_NOT_FOUND" }
  }

  // Cost scaled by level
  const upgradeCost: Record<string, number> = {}
  for (const [res, baseAmt] of Object.entries(definition.baseCost)) {
    upgradeCost[res] = Math.round(baseAmt * (1 + building.currentLevel * 0.2))
    const available = base.sharedStorage[res] || 0
    if (available < upgradeCost[res]) {
      return {
        success: false,
        reason: `INSUFFICIENT_UPGRADE_RESOURCE: Requires ${upgradeCost[res]} ${res}, only ${available} available.`,
      }
    }
  }

  // Deduct resources
  for (const [res, amt] of Object.entries(upgradeCost)) {
    base.sharedStorage[res] -= amt
  }

  building.operationalState = "UPGRADING"

  const queueId = `cq_upg_${instanceId}_${Date.now().toString(36)}`
  const queueItem: ConstructionQueueItem = {
    queueId,
    baseId: base.baseId,
    action: "UPGRADE",
    buildingDefinitionId: definition.id,
    targetInstanceId: instanceId,
    startedGameDay: currentGameDay,
    completesAtGameDay: currentGameDay + Math.max(1, definition.buildDurationGameDays),
    reservedCost: upgradeCost,
    status: "IN_PROGRESS",
  }

  base.constructionQueue.push(queueItem)
  return { success: true, queueItem }
}

/**
 * Enqueues demolition of a non-core building
 */
export function enqueueDemolition(
  base: BaseEntityState,
  instanceId: string,
  definition: BuildingDefinition,
  currentGameDay: number,
  allowAiPolicy: boolean = false
): { success: boolean; queueItem?: ConstructionQueueItem; reason?: string } {
  const building = base.buildings[instanceId]
  if (!building) {
    return { success: false, reason: "BUILDING_NOT_FOUND" }
  }

  // Core facilities can NEVER be demolished!
  if (definition.isCoreFacility || base.coreBuildingIds.includes(instanceId)) {
    return { success: false, reason: "CORE_FACILITY_CANNOT_BE_DEMOLISHED" }
  }

  // Strategic defense buildings protected unless explicitly forced
  if (definition.type === "DEFENSE" && !allowAiPolicy) {
    return { success: false, reason: "STRATEGIC_DEFENSE_BUILDING_PROTECTED" }
  }

  const queueId = `cq_dem_${instanceId}_${Date.now().toString(36)}`
  const queueItem: ConstructionQueueItem = {
    queueId,
    baseId: base.baseId,
    action: "DEMOLISH",
    buildingDefinitionId: definition.id,
    targetInstanceId: instanceId,
    startedGameDay: currentGameDay,
    completesAtGameDay: currentGameDay + 1,
    reservedCost: {},
    status: "IN_PROGRESS",
  }

  base.constructionQueue.push(queueItem)
  return { success: true, queueItem }
}

/**
 * Processes construction queue when GAME_DAY advances
 */
export function settleConstructionQueue(
  base: BaseEntityState,
  definitions: Map<string, BuildingDefinition>,
  currentGameDay: number
): {
  completedBuilds: string[]
  completedUpgrades: string[]
  completedDemolitions: string[]
} {
  const completedBuilds: string[] = []
  const completedUpgrades: string[] = []
  const completedDemolitions: string[] = []

  for (const item of base.constructionQueue) {
    if (item.status !== "IN_PROGRESS") continue
    if (currentGameDay < item.completesAtGameDay) continue

    const def = definitions.get(item.buildingDefinitionId)
    if (!def) continue

    if (item.action === "BUILD") {
      const newInst = createBuildingInstance(base.baseId, def)
      base.buildings[newInst.instanceId] = newInst
      if (def.isCoreFacility) {
        base.coreBuildingIds.push(newInst.instanceId)
      } else {
        base.expansionBuildingIds.push(newInst.instanceId)
      }
      completedBuilds.push(newInst.instanceId)
    } else if (item.action === "UPGRADE" && item.targetInstanceId) {
      const inst = base.buildings[item.targetInstanceId]
      if (inst) {
        inst.currentLevel += 1
        inst.maxHp = Math.round(inst.maxHp * 1.1)
        inst.currentHp = Math.min(inst.maxHp, inst.currentHp + Math.round(inst.maxHp * 0.1))
        inst.conditionHp = Math.min(inst.maxHp, inst.conditionHp + Math.round(inst.maxHp * 0.1))
        inst.operationalState = inst.isOffline ? "OFFLINE" : "ACTIVE"
        completedUpgrades.push(inst.instanceId)
      }
    } else if (item.action === "DEMOLISH" && item.targetInstanceId) {
      delete base.buildings[item.targetInstanceId]
      base.expansionBuildingIds = base.expansionBuildingIds.filter(
        (id) => id !== item.targetInstanceId
      )
      completedDemolitions.push(item.targetInstanceId)
    }

    // Clean up active reservation
    base.activeReservations = base.activeReservations.filter(
      (r) => r.ownerRef !== item.queueId
    )

    item.status = "COMPLETED"
  }

  // Remove completed items
  base.constructionQueue = base.constructionQueue.filter((i) => i.status !== "COMPLETED")

  return {
    completedBuilds,
    completedUpgrades,
    completedDemolitions,
  }
}

/**
 * Cancels a construction queue item, optionally refunding reserved resources
 */
export function cancelConstructionQueueItem(
  base: BaseEntityState,
  queueId: string,
  refundResources: boolean = true
): { success: boolean; refundedCost?: Record<string, number>; reason?: string } {
  const itemIndex = base.constructionQueue.findIndex((i) => i.queueId === queueId)
  if (itemIndex === -1) {
    return { success: false, reason: "QUEUE_ITEM_NOT_FOUND" }
  }

  const item = base.constructionQueue[itemIndex]
  const refundedCost: Record<string, number> = {}

  if (refundResources && item.reservedCost) {
    for (const [res, amt] of Object.entries(item.reservedCost)) {
      base.sharedStorage[res] = (base.sharedStorage[res] || 0) + amt
      refundedCost[res] = amt
    }
  }

  // Remove active reservation
  base.activeReservations = base.activeReservations.filter((r) => r.ownerRef !== item.queueId)

  // Remove from queue
  base.constructionQueue.splice(itemIndex, 1)

  return { success: true, refundedCost }
}

