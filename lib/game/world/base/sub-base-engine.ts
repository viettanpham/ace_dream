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
 */
export function createOrbitalSubBase(
  parentBaseId: string,
  subBaseType: OrbitalSubBaseType,
  name: string,
  tier: number = 1,
  subBaseId?: string
): OrbitalSubBaseState {
  const def = SYSTEM_ORBITAL_SUB_BASE_DEFINITIONS[subBaseType]
  const id = subBaseId || `osb_${parentBaseId}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`

  const buildings: Record<string, BuildingInstance> = {}
  const coreBuildingIds: string[] = []

  // Create core facilities from definition
  for (const facilityId of def.coreFacilities) {
    const instId = `inst_${id}_${facilityId}`
    coreBuildingIds.push(instId)
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

  return {
    subBaseId: id,
    parentBaseId,
    name,
    subBaseType,
    tier,
    operationalState: "ACTIVE",
    coreBuildingIds,
    expansionBuildingIds: [],
    maxExpansionSlots: 4,
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
