/**
 * STARFRONT WORLD — Orbital Sub-Base Engine (Phase 6.34A-FND-6)
 *
 * Implements:
 * 1. Capital Orbital Slots Table (MK I -> MK X: 2..12 slots with 1 MAX TIER BONUS).
 * 2. Non-Capital Base Orbital Slots limit (Max 3 slots).
 * 3. Sub-Base entity lifecycle, parent-child references & docking capacity.
 * 4. Idempotent slot calculation and zero double-counting.
 */

import type { BuildingInstance } from "../building/types"
import { createBuildingInstance } from "../building/construction-engine"
import { calculateSlots } from "../building/slot-engine"
import {
  SYSTEM_DEFAULT_BUILDING_DEFINITIONS,
  SYSTEM_DEFAULT_SLOT_PROFILES,
} from "../building/seed-data"
import {
  DEFAULT_WORLD_GENERATION_CONFIG,
  type OrbitalSubBaseState,
  type OrbitalSubBaseType,
  type WorldGenerationConfig,
} from "./types"
import { SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS } from "./seed-data"

/**
 * Calculates max allowed orbital sub-base slots for a base given its tier and capital status
 */
export function calculateMaxOrbitalSlots(
  tier: number,
  isCapital: boolean,
  config: WorldGenerationConfig = DEFAULT_WORLD_GENERATION_CONFIG
): number {
  const safeTier = Math.max(1, Math.min(10, tier))

  if (isCapital) {
    const tableSlot = config.capitalOrbitalSlotsTable[safeTier]
    if (tableSlot !== undefined) {
      return tableSlot
    }
    // Fallback formula: MK I = 2, MK X = 12
    return safeTier === 10 ? 12 : safeTier + 1
  }

  // Non-capital bases have a constrained orbital hosting capacity of max 3
  // MK I..III: 1, MK IV..VII: 2, MK VIII..X: 3
  if (safeTier <= 3) return 1
  if (safeTier <= 7) return 2
  return Math.min(config.maxNonCapitalOrbitalSlots, 3)
}

/**
 * Creates a new Orbital Sub-Base attached to a parent base
 * Uses Shared Base Framework: Core Facilities are real BuildingInstances from canonical definitions
 * and NEVER consume expansionBuildingIds / maxExpansionSlots.
 */
export function createOrbitalSubBase(
  parentBaseId: string,
  subBaseType: OrbitalSubBaseType,
  name: string,
  tier: number = 1,
  subBaseId?: string
): OrbitalSubBaseState {
  const def =
    SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS[subBaseType] ||
    SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS.ORBITAL_STATION
  const id = subBaseId || `osb_${parentBaseId}_${subBaseType.toLowerCase()}_t${tier}`

  const buildings: Record<string, BuildingInstance> = {}
  const coreBuildingIds: string[] = []
  const bldDefMap = new Map(SYSTEM_DEFAULT_BUILDING_DEFINITIONS.map((d) => [d.id, d]))

  // Create core facilities from canonical BuildingDefinition without consuming expansion slots
  for (const facilityId of def.coreFacilities) {
    const instId = `inst_${id}_${facilityId}`
    coreBuildingIds.push(instId)
    const canonicalDef = bldDefMap.get(facilityId)
    if (canonicalDef) {
      const inst = createBuildingInstance(id, canonicalDef, instId)
      inst.currentLevel = 1
      inst.currentTier = tier
      inst.assignedPersonnel = Math.max(20, canonicalDef.workforceDemands.minimumPersonnel)
      inst.operationalEfficiency = 1.0
      buildings[instId] = inst
    } else {
      buildings[instId] = {
        instanceId: instId,
        baseId: id,
        definitionId: facilityId,
        currentLevel: 1,
        currentTier: tier,
        currentHp: 2000,
        maxHp: 2000,
        conditionHp: 2000,
        operationalState: "ACTIVE",
        isOffline: false,
        assignedPersonnel: 30,
        operationalEfficiency: 1.0,
        performanceBonusMultiplier: 1.0,
        maintenancePolicy: "AUTO",
        equippedModules: [],
      }
    }
  }

  // Evaluate expansion slots from canonical slot_profile_orbital_subbase (MK I = 3 .. MK X = 8)
  const orbitalSlotProfile = SYSTEM_DEFAULT_SLOT_PROFILES.find(
    (p) => p.id === "slot_profile_orbital_subbase"
  )
  const evaluatedSlots = orbitalSlotProfile
    ? calculateSlots(orbitalSlotProfile, tier, tier === 10)
    : { totalSlots: 3 + Math.floor((tier - 1) * 0.5) + (tier === 10 ? 1 : 0) }

  return {
    subBaseId: id,
    parentBaseId,
    name,
    subBaseType,
    tier,
    operationalState: "ACTIVE",
    coreBuildingIds,
    expansionBuildingIds: [],
    maxExpansionSlots: evaluatedSlots.totalSlots,
    buildings,
    dockingCapacity: def.baseDockingCapacity + (tier - 1),
    storageCapacity: { ...def.defaultStorage },
    currentStorage: { ...def.defaultStorage },
    crewAssigned: def.baseCrewRequired,
    crewRequired: def.baseCrewRequired,
    defenseRating: def.baseDefenseRating + (tier - 1) * 50,
  }
}

/**
 * Checks if a parent base can host an additional orbital sub-base
 */
export function canHostOrbitalSubBase(
  currentSubBaseCount: number,
  tier: number,
  isCapital: boolean,
  config: WorldGenerationConfig = DEFAULT_WORLD_GENERATION_CONFIG
): { canHost: boolean; maxSlots: number; availableSlots: number; reason?: string } {
  const maxSlots = calculateMaxOrbitalSlots(tier, isCapital, config)
  const availableSlots = Math.max(0, maxSlots - currentSubBaseCount)

  if (availableSlots <= 0) {
    return {
      canHost: false,
      maxSlots,
      availableSlots: 0,
      reason: `ORBITAL_SLOTS_FULL: Base has reached max orbital capacity of ${maxSlots} slots.`,
    }
  }

  return {
    canHost: true,
    maxSlots,
    availableSlots,
  }
}

/**
  * Adds an expansion building to an Orbital Sub-Base using the Shared Base Framework.
  * Core Facilities NEVER consume expansion slots; only non-core expansion buildings
  * consume expansionBuildingIds up to maxExpansionSlots.
  */
export function addExpansionBuildingToOrbitalSubBase(
  subBase: OrbitalSubBaseState,
  buildingDefinitionId: string,
  instanceId?: string
): { success: boolean; building?: BuildingInstance; instanceId?: string; reason?: string } {
  const canonicalDef = SYSTEM_DEFAULT_BUILDING_DEFINITIONS.find(
    (d) => d.id === buildingDefinitionId
  )
  if (!canonicalDef) {
    return {
      success: false,
      reason: `BUILDING_DEFINITION_NOT_FOUND: '${buildingDefinitionId}' is not in canonical catalog.`,
    }
  }

  // Check expansion slot limit (Core facilities in coreBuildingIds do not count against maxExpansionSlots)
  if (!canonicalDef.isCoreFacility) {
    if (subBase.expansionBuildingIds.length >= subBase.maxExpansionSlots) {
      return {
        success: false,
        reason: `ORBITAL_EXPANSION_SLOTS_FULL: Sub-Base has reached ${subBase.expansionBuildingIds.length}/${subBase.maxExpansionSlots} expansion slots.`,
      }
    }
  }

  const instId =
    instanceId ||
    `inst_${subBase.subBaseId}_exp_${buildingDefinitionId}_${subBase.expansionBuildingIds.length + 1}`
  const inst = createBuildingInstance(subBase.subBaseId, canonicalDef, instId)
  inst.currentLevel = 1
  inst.currentTier = subBase.tier
  inst.assignedPersonnel = Math.max(15, canonicalDef.workforceDemands.minimumPersonnel)
  inst.operationalEfficiency = 1.0

  subBase.buildings[instId] = inst
  if (canonicalDef.isCoreFacility) {
    if (!subBase.coreBuildingIds.includes(instId)) {
      subBase.coreBuildingIds.push(instId)
    }
  } else {
    subBase.expansionBuildingIds.push(instId)
  }

  // Apply docking or defense bonuses from expansion building
  if (canonicalDef.type === "SPACEPORT") {
    subBase.dockingCapacity += 2
  } else if (canonicalDef.type === "DEFENSE" || canonicalDef.type === "ORBITAL_DEFENSE") {
    subBase.defenseRating += 150
  }

  return { success: true, building: inst, instanceId: instId }
}

/**
  * Upgrades an Orbital Sub-Base to a higher MK Tier (MK I .. MK X) and recalculates maxExpansionSlots
  * idempotently (including the 1-time MAX TIER BONUS at MK X).
  */
export function upgradeOrbitalSubBaseTier(
  subBase: OrbitalSubBaseState,
  targetTier: number
): OrbitalSubBaseState {
  const safeTier = Math.max(1, Math.min(10, targetTier))
  const def =
    SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS[subBase.subBaseType] ||
    SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS.ORBITAL_STATION
  subBase.tier = safeTier

  const orbitalSlotProfile = SYSTEM_DEFAULT_SLOT_PROFILES.find(
    (p) => p.id === "slot_profile_orbital_subbase"
  )
  const evaluatedSlots = orbitalSlotProfile
    ? calculateSlots(orbitalSlotProfile, safeTier, safeTier === 10)
    : { totalSlots: 3 + Math.floor((safeTier - 1) * 0.5) + (safeTier === 10 ? 1 : 0) }

  subBase.maxExpansionSlots = evaluatedSlots.totalSlots
  subBase.dockingCapacity = def.baseDockingCapacity + (safeTier - 1)
  subBase.defenseRating = def.baseDefenseRating + (safeTier - 1) * 50

  return subBase
}

