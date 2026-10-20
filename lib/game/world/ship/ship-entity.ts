/**
 * STARFRONT WORLD — Ship Entity Core Engine (Phase 7.2)
 *
 * Implements:
 * 1. Type -> Class -> Definition -> Instance construction
 * 2. Independent Identity, Serial Number & Dynamic Fleet/Base Decoupling
 * 3. Slots & Modules initialization (Typed and generic slots)
 * 4. Crew requirement ratio evaluation & operational efficiency calculation
 */

import { getShipClass, getShipDefinition, SYSTEM_DEFAULT_SHIP_DEFINITIONS } from "../fleet/registry-integration"
import type { ShipDefinition } from "../fleet/catalog-types"
import { createProgressionEntity } from "../progression/engine"
import type {
  CreateShipParams,
  ShipCrewStatus,
  ShipInstalledModule,
  ShipInstance,
} from "./types"

/**
 * Generates a unique serial number for a ship
 */
function generateShipSerialNumber(faction: string, typeId: string): string {
  const prefix = faction.toUpperCase().slice(0, 3)
  const typePart = typeId.replace(/^SHIP_TYPE_/, "").slice(0, 3)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${typePart}-${randomSuffix}`
}

/**
 * Creates an authoritative, individually addressable ShipInstance
 */
export function createShipInstance(params: CreateShipParams): ShipInstance {
  const gameDay = params.gameDay ?? 1
  const definition = getShipDefinition(params.definitionId) ||
    SYSTEM_DEFAULT_SHIP_DEFINITIONS.find((d) => d.id === params.definitionId)

  if (!definition) {
    throw new Error(`ShipDefinition not found for id: ${params.definitionId}`)
  }

  const shipClass = getShipClass(definition.classId)
  const hullMultiplier = shipClass?.hullMultiplier ?? 1.0
  const shieldMultiplier = shipClass?.shieldMultiplier ?? 1.0
  const moduleSlotBonus = shipClass?.moduleSlotBonus ?? 0

  const maxHullHp = Math.round(definition.baseStats.maxHp * hullMultiplier)
  const maxShieldHp = Math.round(definition.baseStats.maxShield * shieldMultiplier)

  // Initialize Slots & Modules
  const installedModules: Record<string, ShipInstalledModule> = {}
  for (const slot of definition.slotsLayout) {
    installedModules[slot.slotId] = {
      slotId: slot.slotId,
      slotType: slot.slotType,
      size: slot.size,
      moduleId: `mod_stock_${slot.slotId}`,
      name: `Stock ${slot.slotType} System`,
      condition: 100.0,
      isOperational: true,
    }
  }

  const typedSlots: Record<string, number> = {}
  for (const slot of definition.slotsLayout) {
    typedSlots[slot.slotType] = (typedSlots[slot.slotType] || 0) + 1
  }
  const genericSlots = moduleSlotBonus
  const totalSlotsCount = definition.slotsLayout.length + genericSlots

  // Calculate default crew from definition or standard ratio
  const targetCrew = definition.crewRequirements?.targetCrew || 20
  const assignedCrewCount = params.assignedCrewCount ?? targetCrew

  // Initialize Progression MK I..X via FND-2 Shared Progression Engine
  const instanceId = params.instanceId || `ship_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const progressionProfileId = params.progressionProfileId || "profile_standard_100"

  const progression = createProgressionEntity({
    entityId: instanceId,
    profileId: progressionProfileId,
    initialLevel: 1,
    initialTierId: "TIER_I",
    policy: "MANUAL",
  })

  // Set Level 1 active state
  progression.state = "PROGRESSING"
  progression.levelHistory["TIER_I"] = 1

  return {
    instanceId,
    definitionId: definition.id,
    serialNumber: params.serialNumber || generateShipSerialNumber(definition.faction, definition.typeId),
    customName: params.customName || definition.name,
    ownerRef: { ...params.ownerRef },
    assignedFleetId: params.assignedFleetId,
    fleetId: params.assignedFleetId,
    currentBaseId: params.currentBaseId,
    dockedBaseId: params.currentBaseId,
    currentSectorId: params.currentSectorId || "sol_command_hq",
    currentDockId: params.currentDockId,
    status: "OPERATIONAL",
    hullHp: maxHullHp,
    maxHullHp,
    shieldHp: maxShieldHp,
    maxShieldHp,
    condition: 100.0,
    maintenancePolicy: params.maintenancePolicy || "AUTO",
    assignedCrewCount,
    assignedPilotId: params.assignedPilotId,
    installedModules,
    unlockedModuleSlotsCount: totalSlotsCount,
    unlockedGenericSlotsCount: genericSlots,
    unlockedTypedSlots: typedSlots,
    progression,
    mileageKm: 0,
    battlesCount: 0,
    killsCount: 0,
    commissionedGameDay: gameDay,
    lastMaintenanceGameDay: gameDay,
  }
}

/**
 * Detaches a ship from its assigned fleet (e.g. for docking, drydock refit, or base garrison)
 */
export function detachShipFromFleet(
  ship: ShipInstance,
  targetBaseId?: string,
  targetDockId?: string
): { success: boolean; previousFleetId?: string } {
  const previousFleetId = ship.assignedFleetId
  ship.assignedFleetId = undefined
  if (targetBaseId) ship.currentBaseId = targetBaseId
  if (targetDockId) ship.currentDockId = targetDockId
  return { success: true, previousFleetId }
}

/**
 * Assigns a ship to a fleet roster, releasing its current base docking port
 */
export function assignShipToFleet(
  ship: ShipInstance,
  fleetId: string
): { success: boolean; newFleetId: string } {
  ship.assignedFleetId = fleetId
  ship.currentDockId = undefined
  return { success: true, newFleetId: fleetId }
}

/**
 * Evaluates ship crew requirements and determines operational efficiency
 *
 * Rules:
 * - Minimum Crew = definition.minimumCrew (or 50% targetCrew)
 * - Target Crew = definition.targetCrew (100% standard baseline)
 * - Maximum Crew = definition.maximumCrew (or 150% targetCrew)
 *
 * Efficiency curve:
 * - Crew < Minimum: efficiency = 0.4, canOperate = false (cannot maneuver/jump, emergency station only)
 * - Minimum <= Crew < Target: efficiency = 0.60 .. 0.99 (pro-rated linear scale)
 * - Target <= Crew < Maximum: efficiency = 1.00 (optimal)
 * - Crew >= Maximum: efficiency = 1.25 (+25% turnaround & battle repair boost)
 */
export function evaluateShipCrewStatus(
  ship: ShipInstance,
  definition?: ShipDefinition
): ShipCrewStatus {
  const def = definition || getShipDefinition(ship.definitionId)
  const targetCrew = def?.crewRequirements?.targetCrew || 20
  const minRatio = (def?.crewRequirements as any)?.minimumCrewRatio ?? 0.5
  const maxRatio = (def?.crewRequirements as any)?.maximumCrewRatio ?? 1.5
  const minimumCrew = def?.crewRequirements?.minimumCrew || Math.max(1, Math.round(targetCrew * minRatio))
  const maximumCrew = def?.crewRequirements?.maximumCrew || Math.round(targetCrew * maxRatio)

  const currentCrew = Math.max(0, ship.assignedCrewCount)
  let efficiency = 1.0
  let canOperate = true
  let isUnderStaffed = false

  if (currentCrew < minimumCrew) {
    efficiency = 0.4
    canOperate = false
    isUnderStaffed = true
  } else if (currentCrew < targetCrew) {
    const ratio = (currentCrew - minimumCrew) / Math.max(1, targetCrew - minimumCrew)
    efficiency = Math.round((0.6 + ratio * 0.4) * 100) / 100
    canOperate = true
    isUnderStaffed = true
  } else if (currentCrew >= maximumCrew) {
    efficiency = 1.25
    canOperate = true
    isUnderStaffed = false
  } else {
    efficiency = 1.0
    canOperate = true
    isUnderStaffed = false
  }

  return {
    minimumCrew,
    targetCrew,
    maximumCrew,
    currentCrew,
    efficiency,
    isUnderStaffed,
    canOperate,
  }
}

/**
 * Installs a module into a designated ship slot
 */
export function installShipModule(
  ship: ShipInstance,
  slotId: string,
  module: ShipInstalledModule
): { success: boolean; message: string } {
  ship.installedModules[slotId] = { ...module }
  return { success: true, message: `Module ${module.name} installed into slot ${slotId}` }
}

/**
 * Uninstalls a module from a ship slot
 */
export function uninstallShipModule(
  ship: ShipInstance,
  slotId: string
): { success: boolean; removedModule?: ShipInstalledModule } {
  const removedModule = ship.installedModules[slotId]
  if (!removedModule) {
    return { success: false }
  }
  delete ship.installedModules[slotId]
  return { success: true, removedModule }
}

/**
 * Creates canonical starting ships for new world state
 */
export function createDefaultStartingShips(): Record<string, ShipInstance> {
  const ships: Record<string, ShipInstance> = {}

  const leadCorvette = createShipInstance({
    instanceId: "ship_vss_valiant_lead",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    customName: "VSS Valiant Alpha",
    serialNumber: "VSS-COR-0001",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentBaseId: "base_sol_command_hq",
    currentSectorId: "sol_command_hq",
    gameDay: 1,
  })

  const supplyTender = createShipInstance({
    instanceId: "ship_vss_hermes_01",
    definitionId: "SHIP_DEF_HERMES_SUPPLY_TENDER",
    customName: "VSS Hermes Resupply 01",
    serialNumber: "VSS-LOG-0002",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss_high_command",
      ownerName: "Liên minh VSS",
      factionId: "vss",
    },
    currentBaseId: "base_sol_command_hq",
    currentSectorId: "sol_command_hq",
    gameDay: 1,
  })

  ships[leadCorvette.instanceId] = leadCorvette
  ships[supplyTender.instanceId] = supplyTender

  return ships
}
