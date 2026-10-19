/**
 * STARFRONT WORLD — Fleet/Guild Crew Pool & Ownership Boundary (Phase 6.34A-FND-4)
 *
 * Implements:
 * 1. Fleet/Guild owns and manages its transferred crew pool (idle, assigned, reserve).
 * 2. Invariant: Base AI CANNOT unilaterally reclaim Fleet/Guild crew.
 * 3. Base recruitment transfers personnel from Base available into Fleet crew pool.
 * 4. Zero-sum conservation: Fleet Crew total = crewIdle + crewAssigned + crewReserve.
 * 5. Return to Base available workforce only occurs via explicit Fleet/Guild authorization.
 */

import type { BasePopulationState, FleetCrewPool } from "./types"

/**
 * Creates an empty crew pool for a Fleet or Guild
 */
export function createFleetCrewPool(
  fleetId: string,
  homeBaseId: string,
  residentBaseId?: string
): FleetCrewPool {
  return {
    fleetId,
    homeBaseId,
    residentBaseId: residentBaseId || homeBaseId,
    crewIdle: 0,
    crewAssigned: 0,
    crewReserve: 0,
    totalCrew: 0,
  }
}

/**
 * Recruits personnel from Base Available pool and hands over ownership to the Fleet Crew Pool.
 * Once recruited, the Base AI cannot unilaterally reclaim these workers.
 */
export function recruitFleetCrew(
  baseState: BasePopulationState,
  fleetPool: FleetCrewPool,
  count: number
): { success: boolean; recruitedCount: number; reason?: string } {
  if (count <= 0) {
    return { success: true, recruitedCount: 0 }
  }

  if (baseState.populationAvailable < count) {
    return {
      success: false,
      recruitedCount: 0,
      reason: `INSUFFICIENT_AVAILABLE_POPULATION: Base has ${baseState.populationAvailable}, requested ${count}.`,
    }
  }

  // Deduct from Base Available and record in Base Occupied (category: FLEET_CREW)
  baseState.populationAvailable -= count
  baseState.populationOccupied += count
  baseState.breakdown.FLEET_CREW = (baseState.breakdown.FLEET_CREW || 0) + count

  // Handover into Fleet Idle Pool
  fleetPool.crewIdle += count
  fleetPool.totalCrew = fleetPool.crewIdle + fleetPool.crewAssigned + fleetPool.crewReserve

  return { success: true, recruitedCount: count }
}

/**
 * Assigns idle crew to active ship/flight duty inside Fleet
 */
export function assignCrewToDuty(
  fleetPool: FleetCrewPool,
  count: number
): { success: boolean; assignedCount: number; reason?: string } {
  const toAssign = Math.min(count, fleetPool.crewIdle)
  if (toAssign <= 0) {
    return { success: false, assignedCount: 0, reason: "NO_IDLE_CREW_AVAILABLE" }
  }

  fleetPool.crewIdle -= toAssign
  fleetPool.crewAssigned += toAssign
  fleetPool.totalCrew = fleetPool.crewIdle + fleetPool.crewAssigned + fleetPool.crewReserve

  return { success: true, assignedCount: toAssign }
}

/**
 * Releases active crew to fleet reserve
 */
export function moveCrewToReserve(
  fleetPool: FleetCrewPool,
  count: number
): { success: boolean; reservedCount: number; reason?: string } {
  const toReserve = Math.min(count, fleetPool.crewAssigned)
  if (toReserve <= 0) {
    return { success: false, reservedCount: 0, reason: "NO_ASSIGNED_CREW_TO_RESERVE" }
  }

  fleetPool.crewAssigned -= toReserve
  fleetPool.crewReserve += toReserve
  fleetPool.totalCrew = fleetPool.crewIdle + fleetPool.crewAssigned + fleetPool.crewReserve

  return { success: true, reservedCount: toReserve }
}

/**
 * Moves reserve crew back to idle status
 */
export function restoreReserveCrewToIdle(
  fleetPool: FleetCrewPool,
  count: number
): { success: boolean; idledCount: number; reason?: string } {
  const toIdle = Math.min(count, fleetPool.crewReserve)
  if (toIdle <= 0) {
    return { success: false, idledCount: 0, reason: "NO_RESERVE_CREW_TO_RESTORE" }
  }

  fleetPool.crewReserve -= toIdle
  fleetPool.crewIdle += toIdle
  fleetPool.totalCrew = fleetPool.crewIdle + fleetPool.crewAssigned + fleetPool.crewReserve

  return { success: true, idledCount: toIdle }
}

/**
 * Authorized Fleet/Guild action: returns idle crew back to Base Available Workforce
 */
export function returnFleetCrewToBase(
  fleetPool: FleetCrewPool,
  baseState: BasePopulationState,
  count: number
): { success: boolean; returnedCount: number; reason?: string } {
  const toReturn = Math.min(count, fleetPool.crewIdle)
  if (toReturn <= 0) {
    return { success: false, returnedCount: 0, reason: "NO_IDLE_CREW_TO_RETURN" }
  }

  fleetPool.crewIdle -= toReturn
  fleetPool.totalCrew = fleetPool.crewIdle + fleetPool.crewAssigned + fleetPool.crewReserve

  // Return to Base available
  baseState.populationAvailable += toReturn
  baseState.populationOccupied -= toReturn
  baseState.breakdown.FLEET_CREW = Math.max(0, (baseState.breakdown.FLEET_CREW || 0) - toReturn)

  return { success: true, returnedCount: toReturn }
}
