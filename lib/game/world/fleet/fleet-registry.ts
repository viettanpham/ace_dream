/**
 * STARFRONT WORLD — National Fleet Registry Facade Engine (Phase 7.6)
 *
 * Implements:
 * 1. Unified National Fleet Registry Facade:
 *    - Centralized indexing layer for instantaneous O(1) query lookups.
 *    - Invariant: NEVER clones or duplicates raw fleet records. Operates as an authoritative reference facade.
 * 2. Instantaneous Lookups:
 *    - By Fleet ID
 *    - By Sector ID (stationed, patrol, docked)
 *    - By Base ID (docked)
 *    - By Sovereign Owner ID (Nation, Guild, NPC Pilot, Player)
 * 3. Soft Index Synchronization:
 *    - Dynamically rebuilds or updates index when fleets embark, arrive, or relocate.
 */

import type { FleetEntityState } from "./fleet-entity"

export class NationalFleetRegistry {
  private static instance: NationalFleetRegistry | null = null

  private fleetById: Map<string, FleetEntityState> = new Map()
  private fleetsBySector: Map<string, Set<string>> = new Map()
  private fleetsByBase: Map<string, Set<string>> = new Map()
  private fleetsByOwner: Map<string, Set<string>> = new Map()

  /**
   * Singleton access
   */
  public static getInstance(): NationalFleetRegistry {
    if (!NationalFleetRegistry.instance) {
      NationalFleetRegistry.instance = new NationalFleetRegistry()
    }
    return NationalFleetRegistry.instance
  }

  /**
   * Resets the singleton instance (useful for test isolation)
   */
  public static resetInstance(): void {
    if (NationalFleetRegistry.instance) {
      NationalFleetRegistry.instance.clear()
    }
    NationalFleetRegistry.instance = new NationalFleetRegistry()
  }

  /**
   * Clears all indexing structures
   */
  public clear(): void {
    this.fleetById.clear()
    this.fleetsBySector.clear()
    this.fleetsByBase.clear()
    this.fleetsByOwner.clear()
  }

  /**
   * Rebuilds the complete index from a dictionary of FleetEntityState (e.g. from WorldState.fleets)
   */
  public rebuildIndex(fleets: Record<string, FleetEntityState> | FleetEntityState[]): void {
    this.clear()
    const list = Array.isArray(fleets) ? fleets : Object.values(fleets)
    for (const fleet of list) {
      this.registerOrUpdateFleet(fleet)
    }
  }

  /**
   * Registers or updates index entries for a specific fleet
   */
  public registerOrUpdateFleet(fleet: FleetEntityState): void {
    // If existing, clear previous index mappings
    if (this.fleetById.has(fleet.fleetId)) {
      this.removeIndexReferences(fleet.fleetId)
    }

    this.fleetById.set(fleet.fleetId, fleet)

    // Index by Sector
    const sectorId = fleet.currentLocation.sectorId
    if (sectorId) {
      if (!this.fleetsBySector.has(sectorId)) {
        this.fleetsBySector.set(sectorId, new Set())
      }
      this.fleetsBySector.get(sectorId)!.add(fleet.fleetId)
    }

    // Index by Base (if docked)
    const baseId = fleet.currentLocation.baseId
    if (baseId) {
      if (!this.fleetsByBase.has(baseId)) {
        this.fleetsByBase.set(baseId, new Set())
      }
      this.fleetsByBase.get(baseId)!.add(fleet.fleetId)
    }

    // Index by Owner
    const ownerId = fleet.ownerRef.ownerId
    if (ownerId) {
      if (!this.fleetsByOwner.has(ownerId)) {
        this.fleetsByOwner.set(ownerId, new Set())
      }
      this.fleetsByOwner.get(ownerId)!.add(fleet.fleetId)
    }
  }

  /**
   * Removes a fleet from the registry and index mappings
   */
  public removeFleet(fleetId: string): void {
    this.removeIndexReferences(fleetId)
    this.fleetById.delete(fleetId)
  }

  private removeIndexReferences(fleetId: string): void {
    for (const set of this.fleetsBySector.values()) {
      set.delete(fleetId)
    }
    for (const set of this.fleetsByBase.values()) {
      set.delete(fleetId)
    }
    for (const set of this.fleetsByOwner.values()) {
      set.delete(fleetId)
    }
  }

  /**
   * O(1) Lookup: Get fleet by unique Fleet ID
   */
  public getFleetById(fleetId: string): FleetEntityState | undefined {
    return this.fleetById.get(fleetId)
  }

  /**
   * O(1) Lookup: Get all fleets present in a specific Sector
   */
  public getFleetsBySector(sectorId: string): FleetEntityState[] {
    const ids = this.fleetsBySector.get(sectorId)
    if (!ids || ids.size === 0) return []
    const results: FleetEntityState[] = []
    for (const id of ids) {
      const fleet = this.fleetById.get(id)
      if (fleet) results.push(fleet)
    }
    return results
  }

  public getFleetsInSector(sectorId: string): FleetEntityState[] {
    return this.getFleetsBySector(sectorId)
  }

  /**
   * O(1) Lookup: Get all fleets currently docked at a specific Base
   */
  public getFleetsByBase(baseId: string): FleetEntityState[] {
    const ids = this.fleetsByBase.get(baseId)
    if (!ids || ids.size === 0) return []
    const results: FleetEntityState[] = []
    for (const id of ids) {
      const fleet = this.fleetById.get(id)
      if (fleet) results.push(fleet)
    }
    return results
  }

  public getFleetsDockedAtBase(baseId: string): FleetEntityState[] {
    return this.getFleetsByBase(baseId)
  }

  /**
   * O(1) Lookup: Get all fleets owned by a specific sovereign entity
   */
  public getFleetsByOwner(ownerId: string): FleetEntityState[] {
    const ids = this.fleetsByOwner.get(ownerId)
    if (!ids || ids.size === 0) return []
    const results: FleetEntityState[] = []
    for (const id of ids) {
      const fleet = this.fleetById.get(id)
      if (fleet) results.push(fleet)
    }
    return results
  }

  /**
   * Get all active registered fleets
   */
  public getAllFleets(): FleetEntityState[] {
    return Array.from(this.fleetById.values())
  }

  /**
   * Total count of indexed fleets
   */
  public getCount(): number {
    return this.fleetById.size
  }
}

export const defaultNationalFleetRegistry = NationalFleetRegistry.getInstance()
