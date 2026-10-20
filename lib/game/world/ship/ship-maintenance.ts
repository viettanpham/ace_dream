/**
 * STARFRONT WORLD — Ship Maintenance, Wear & Repair Engine (Phase 7.2)
 *
 * Implements:
 * 1. Hull HP vs Asset Condition Separation (HP is instantaneous combat health; Condition is structural wear)
 * 2. Event-driven Wear: Mileage per navigation, combat rounds sustained, flat wear
 * 3. Base/Dockyard Maintenance & Refit Policy
 * 4. Condition Tiers: PRISTINE, SERVICEABLE, WORN, DEGRADED, CRITICAL
 */

import type { ShipInstance, ShipMaintenanceResult } from "./types"

export type ShipConditionRating =
  | "PRISTINE"    // 90.00% - 100.00%
  | "SERVICEABLE" // 75.00% - 89.99%
  | "WORN"        // 50.00% - 74.99%
  | "DEGRADED"    // 25.00% - 49.99%
  | "CRITICAL"    // 0.00% - 24.99%

/**
 * Returns descriptive condition category rating
 */
export function getShipConditionRating(condition: number): ShipConditionRating {
  if (condition >= 90.0) return "PRISTINE"
  if (condition >= 75.0) return "SERVICEABLE"
  if (condition >= 50.0) return "WORN"
  if (condition >= 25.0) return "DEGRADED"
  return "CRITICAL"
}

/**
 * Applies condition wear to a ship based on mileage, combat, or operational ticks
 *
 * Wear Formula:
 * - Mileage Wear: 0.05% per 1,000 km traveled
 * - Combat Wear: 1.5% per combat round engaged
 * - Flat Wear: optional arbitrary penalty
 */
export function applyShipConditionWear(
  ship: ShipInstance,
  params: {
    mileageKm?: number
    combatRounds?: number
    flatWear?: number
    gameDay: number
  }
): {
  oldCondition: number
  newCondition: number
  wearApplied: number
  rating: ShipConditionRating
} {
  const oldCondition = ship.condition
  const mileageKm = params.mileageKm || 0
  const combatRounds = params.combatRounds || 0
  const flatWear = params.flatWear || 0

  const mileageWear = (mileageKm / 1000) * 0.05
  const combatWear = combatRounds * 1.5
  const totalWear = Math.round((mileageWear + combatWear + flatWear) * 100) / 100

  if (totalWear <= 0) {
    return {
      oldCondition,
      newCondition: oldCondition,
      wearApplied: 0,
      rating: getShipConditionRating(oldCondition),
    }
  }

  const newCondition = Math.max(0, Math.min(100, Math.round((oldCondition - totalWear) * 100) / 100))
  ship.condition = newCondition

  if (mileageKm > 0) ship.mileageKm += mileageKm
  if (combatRounds > 0) ship.battlesCount += 1

  // Status transitions based on condition thresholds
  if (newCondition <= 0) {
    ship.status = "CRITICAL_OFFLINE"
  } else if (newCondition < 25.0 && ship.status === "OPERATIONAL") {
    ship.status = "DAMAGED"
  }

  return {
    oldCondition,
    newCondition,
    wearApplied: totalWear,
    rating: getShipConditionRating(newCondition),
  }
}

/**
 * Performs drydock maintenance and overhaul for a ship at a base
 *
 * Restores:
 * - Hull HP to maxHullHp
 * - Shield HP to maxShieldHp
 * - Condition to 100.00%
 * - Operational status to OPERATIONAL
 */
export function repairShipAtBase(
  ship: ShipInstance,
  gameDay: number,
  options?: {
    restoreHp?: boolean
    restoreCondition?: boolean
    fullOverhaul?: boolean
  }
): ShipMaintenanceResult {
  const restoreHp = options?.fullOverhaul || options?.restoreHp !== false
  const restoreCondition = options?.fullOverhaul || options?.restoreCondition !== false

  const initialHull = ship.hullHp
  const initialShield = ship.shieldHp
  const initialCondition = ship.condition

  let repairedHullHp = 0
  let repairedShieldHp = 0
  let repairedCondition = 0

  if (restoreHp) {
    repairedHullHp = Math.max(0, ship.maxHullHp - ship.hullHp)
    repairedShieldHp = Math.max(0, ship.maxShieldHp - ship.shieldHp)
    ship.hullHp = ship.maxHullHp
    ship.shieldHp = ship.maxShieldHp
  }

  if (restoreCondition) {
    repairedCondition = Math.max(0, Math.round((100.0 - ship.condition) * 100) / 100)
    ship.condition = 100.0
  }

  // Calculate consumed maintenance materials
  const industrialMaterials = Math.round(repairedHullHp * 0.08 + repairedCondition * 3)
  const logisticsSupplies = Math.round(repairedShieldHp * 0.05 + repairedCondition * 2)
  const credits = Math.round(repairedCondition * 10 + repairedHullHp * 0.1)

  ship.status = "OPERATIONAL"
  ship.lastMaintenanceGameDay = gameDay

  return {
    success: true,
    repairedCondition,
    repairedHullHp,
    repairedShieldHp,
    consumedMaterials: {
      industrialMaterials,
      logisticsSupplies,
      credits,
    },
    message: `Ship ${ship.customName || ship.serialNumber} overhaul complete. Condition: 100%, Hull HP: ${ship.hullHp}/${ship.maxHullHp}.`,
  }
}

/**
 * Calculates estimated materials and credit cost to repair a ship
 */
export function estimateShipRepairCost(ship: ShipInstance): {
  industrialMaterials: number
  logisticsSupplies: number
  credits: number
  neededHullHp: number
  neededShieldHp: number
  neededCondition: number
} {
  const neededHullHp = Math.max(0, ship.maxHullHp - ship.hullHp)
  const neededShieldHp = Math.max(0, ship.maxShieldHp - ship.shieldHp)
  const neededCondition = Math.max(0, Math.round((100.0 - ship.condition) * 100) / 100)

  const industrialMaterials = Math.round(neededHullHp * 0.08 + neededCondition * 3)
  const logisticsSupplies = Math.round(neededShieldHp * 0.05 + neededCondition * 2)
  const credits = Math.round(neededCondition * 10 + neededHullHp * 0.1)

  return {
    industrialMaterials,
    logisticsSupplies,
    credits,
    neededHullHp,
    neededShieldHp,
    neededCondition,
  }
}

/**
 * Settles maintenance policy for a ship at base during daily cycle / tick
 */
export function settleShipMaintenancePolicy(
  ship: ShipInstance,
  gameDay: number,
  baseResources?: {
    industrialMaterials?: number
    logisticsSupplies?: number
    credits?: number
  }
): {
  repaired: boolean
  result?: ShipMaintenanceResult
  reason?: string
} {
  // If not at a base, cannot repair
  if (!ship.currentBaseId && !ship.currentDockId) {
    return { repaired: false, reason: "Ship is not located at a base or dock." }
  }

  const policy = ship.maintenancePolicy || "AUTO"
  if (policy === "MANUAL") {
    return { repaired: false, reason: "Maintenance policy is MANUAL." }
  }

  const needsRepair = ship.condition < 75.0 || ship.hullHp < ship.maxHullHp
  const isEmergency = ship.condition < 25.0 || ship.status === "DAMAGED" || ship.status === "CRITICAL_OFFLINE"

  if (policy === "EMERGENCY_ONLY" && !isEmergency) {
    return { repaired: false, reason: "Ship condition above emergency threshold." }
  }

  if (!needsRepair) {
    return { repaired: false, reason: "Ship is already in prime operational condition." }
  }

  // Check resource availability if baseResources provided
  const cost = estimateShipRepairCost(ship)
  if (baseResources) {
    if ((baseResources.industrialMaterials ?? Infinity) < cost.industrialMaterials) {
      return { repaired: false, reason: "Insufficient industrialMaterials at base." }
    }
    if ((baseResources.logisticsSupplies ?? Infinity) < cost.logisticsSupplies) {
      return { repaired: false, reason: "Insufficient logisticsSupplies at base." }
    }
    if ((baseResources.credits ?? Infinity) < cost.credits) {
      return { repaired: false, reason: "Insufficient credits at base." }
    }
  }

  const result = repairShipAtBase(ship, gameDay, { fullOverhaul: true })
  return { repaired: true, result }
}
