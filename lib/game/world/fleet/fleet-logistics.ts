/**
 * STARFRONT WORLD — Fleet Logistics, Inventory & Supply Engine (Phase 7.4)
 *
 * Implements:
 * 1. Fleet Inventory / Cargo Hold with 5 strategic resources (WorldResourceLedger):
 *    - food: Vital sustenance for crew (NEVER grouped with munitions)
 *    - energy: Plasma fuel cells for hyperdrive cruising and shields
 *    - logisticsSupplies: Munitions, spare parts and field technical gear
 *    - industrialMaterials: Hull repair alloy plates
 *    - tacticalData: Stellar cartography and cryptographic keys
 * 2. Daily Consumption Tick:
 *    - Food consumed proportional to crew headcount
 *    - Energy consumed proportional to ship engines & operational status
 *    - Starvation penalty: If food = 0 -> starvation = true, morale collapse, severe penalty
 *    - Stranded penalty: If energy = 0 while IN_TRANSIT -> stranded = true, transit halted
 * 3. Two-way replenishment (Base Docking & Fleet-to-Fleet)
 */

import type { WorldResourceLedger } from "../types"
import type { ShipInstance } from "../ship/types"

export type FleetOperationalStatus =
  | "DOCKED"
  | "STATIONED"
  | "IN_TRANSIT"
  | "PATROL"
  | "ENGAGED"
  | "MAINTENANCE"
  | "REORGANIZING"
  | "DISBANDED"

export interface FleetLogisticsTickResult {
  gameDay: number
  foodConsumed: number
  energyConsumed: number
  isStarvation: boolean
  isStranded: boolean
  moraleImpact: number
  cargoRemaining: WorldResourceLedger
}

/**
 * Creates a standard initialized cargo ledger for a Fleet
 */
export function createFleetCargo(
  initial: Partial<WorldResourceLedger> = {}
): WorldResourceLedger {
  return {
    food: Math.max(0, initial.food ?? 600),
    energy: Math.max(0, initial.energy ?? 1200),
    logisticsSupplies: Math.max(0, initial.logisticsSupplies ?? 300),
    industrialMaterials: Math.max(0, initial.industrialMaterials ?? 250),
    tacticalData: Math.max(0, initial.tacticalData ?? 80),
  }
}

import { getShipDefinition } from "./registry-integration"

/**
 * Calculates total cargo capacity of a fleet by summing cargoCapacity of all ships
 */
export function calculateFleetCargoCapacity(ships: Record<string, ShipInstance> | ShipInstance[]): number {
  const shipList = Array.isArray(ships) ? ships : Object.values(ships)
  let totalCap = 0
  for (const ship of shipList) {
    const def = getShipDefinition(ship.definitionId)
    totalCap += def?.cargoCapacity || (ship as any).cargoCapacity || 100
  }
  return totalCap
}

/**
 * Calculates current total units of resources stored in cargo
 */
export function calculateFleetCargoCurrentWeight(cargo: WorldResourceLedger): number {
  return (
    cargo.food +
    cargo.energy +
    cargo.logisticsSupplies +
    cargo.industrialMaterials +
    cargo.tacticalData
  )
}

/**
 * Computes daily required food and energy consumption
 */
export function calculateDailyFleetConsumption(
  ships: Record<string, ShipInstance> | ShipInstance[],
  totalCrewCount: number,
  status: FleetOperationalStatus
): { foodRequired: number; energyRequired: number } {
  const shipList = Array.isArray(ships) ? ships : Object.values(ships)
  const shipCount = shipList.length

  // Food: 0.05 food per crew member per day (minimum 1 if crew > 0)
  const foodRequired = totalCrewCount > 0 ? Math.max(1, Math.ceil(totalCrewCount * 0.05)) : 0

  // Energy consumption based on operational status and ship count
  let energyPerShip = 1 // DOCKED default
  switch (status) {
    case "DOCKED":
    case "MAINTENANCE":
      energyPerShip = 1
      break
    case "STATIONED":
    case "REORGANIZING":
      energyPerShip = 2
      break
    case "PATROL":
      energyPerShip = 4
      break
    case "IN_TRANSIT":
      energyPerShip = 7
      break
    case "ENGAGED":
      energyPerShip = 10
      break
    default:
      energyPerShip = 1
  }

  const energyRequired = Math.max(1, shipCount * energyPerShip)
  return { foodRequired, energyRequired }
}

/**
 * Executes the daily logistics tick on a fleet's cargo
 */
export function processDailyFleetLogisticsTick(
  cargo: WorldResourceLedger,
  ships: Record<string, ShipInstance> | ShipInstance[],
  totalCrewCount: number,
  status: FleetOperationalStatus,
  gameDay: number
): FleetLogisticsTickResult {
  const { foodRequired, energyRequired } = calculateDailyFleetConsumption(ships, totalCrewCount, status)

  let isStarvation = false
  let isStranded = false
  let moraleImpact = 0

  // 1. Food Consumption
  if (cargo.food >= foodRequired) {
    cargo.food -= foodRequired
  } else {
    // Partial or zero food available -> Starvation
    const foodConsumed = cargo.food
    cargo.food = 0
    isStarvation = true
    moraleImpact -= 15 // Severe morale drop
  }

  // 2. Energy Consumption
  if (cargo.energy >= energyRequired) {
    cargo.energy -= energyRequired
  } else {
    // Energy depleted
    cargo.energy = 0
    if (status === "IN_TRANSIT") {
      isStranded = true // Hyperdrive shutdown between sectors
      moraleImpact -= 10
    }
  }

  return {
    gameDay,
    foodConsumed: foodRequired,
    energyConsumed: energyRequired,
    isStarvation,
    isStranded,
    moraleImpact,
    cargoRemaining: { ...cargo },
  }
}

/**
 * Transfers resources between Base inventory and Fleet cargo
 * Enforces capacity limits and non-negative balances.
 */
export function transferCargoBetweenBaseAndFleet(
  baseLedger: WorldResourceLedger,
  fleetCargo: WorldResourceLedger,
  transferAmounts: Partial<WorldResourceLedger>,
  direction: "BASE_TO_FLEET" | "FLEET_TO_BASE",
  maxFleetCapacity?: number
): { success: boolean; transferred: Partial<WorldResourceLedger>; error?: string } {
  const keys: (keyof WorldResourceLedger)[] = [
    "food",
    "energy",
    "logisticsSupplies",
    "industrialMaterials",
    "tacticalData",
  ]

  const actualTransfer: Partial<WorldResourceLedger> = {}

  if (direction === "BASE_TO_FLEET") {
    // Check fleet capacity constraint if provided
    if (maxFleetCapacity !== undefined) {
      let requestedTotal = 0
      for (const k of keys) {
        requestedTotal += Math.max(0, transferAmounts[k] || 0)
      }
      const currentWeight = calculateFleetCargoCurrentWeight(fleetCargo)
      if (currentWeight + requestedTotal > maxFleetCapacity) {
        return {
          success: false,
          transferred: {},
          error: `Fleet cargo capacity exceeded. Max: ${maxFleetCapacity}, Current: ${currentWeight}, Requested: ${requestedTotal}`,
        }
      }
    }

    for (const k of keys) {
      const amount = Math.max(0, transferAmounts[k] || 0)
      if (amount > 0) {
        const canTransfer = Math.min(amount, baseLedger[k])
        baseLedger[k] -= canTransfer
        fleetCargo[k] += canTransfer
        actualTransfer[k] = canTransfer
      }
    }
  } else {
    // FLEET_TO_BASE
    for (const k of keys) {
      const amount = Math.max(0, transferAmounts[k] || 0)
      if (amount > 0) {
        const canTransfer = Math.min(amount, fleetCargo[k])
        fleetCargo[k] -= canTransfer
        baseLedger[k] += canTransfer
        actualTransfer[k] = canTransfer
      }
    }
  }

  return { success: true, transferred: actualTransfer }
}
