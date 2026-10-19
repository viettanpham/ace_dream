/**
 * STARFRONT WORLD — Independent Fleet Capacities Engine (Phase 6.34A-FND-6)
 *
 * Evaluates and strictly separates three distinct naval military capacities:
 * 1. Fleet Command Capacity: Number of fleets the base's command staff can orchestrate.
 * 2. Fleet Stationing Capacity: Long-term garrison and fleet holding capacity.
 * 3. Fleet Docking Capacity: Physical simultaneous docking, service, and maintenance ports.
 *
 * INVARIANT: Never double-count Sub-Base docking ports as Main Base physical ground ports.
 * Ports on orbital platforms remain physically separate and are categorized accordingly.
 */

import type { BuildingInstance } from "../building/types"
import type { FleetCapacities, HubSpecializationInstance, OrbitalSubBaseState } from "./types"
import { getDefaultDockingPortsForBase } from "./seed-data"
import type { BaseType } from "../population/types"

/**
 * Evaluates fleet capacities for a Main Base and its optional Orbital Sub-Bases
 */
export function evaluateFleetCapacities(
  baseId: string,
  baseType: BaseType,
  isCapital: boolean,
  tier: number,
  buildings: Record<string, BuildingInstance>,
  orbitalSubBases: OrbitalSubBaseState[] = [],
  hubSpecializations: HubSpecializationInstance[] = []
): FleetCapacities {
  // 1. Base Docking Ports (Physical docking ports in Core Facility Complex: 2..8)
  const baseDockingPorts = getDefaultDockingPortsForBase(baseType, isCapital)

  // 2. Expansion Docking Ports (From dedicated facilities built in expansion slots)
  let expansionDockingPorts = 0
  let expansionStationing = 0
  let expansionCommand = 0

  for (const b of Object.values(buildings)) {
    if (b.operationalState !== "ACTIVE" || b.operationalEfficiency <= 0) continue

    const eff = b.operationalEfficiency

    // Spaceport & Docking facilities
    if (b.definitionId === "bld_cargo_depot") {
      expansionDockingPorts += Math.round(1 * eff)
    } else if (b.definitionId === "bld_fortress_bastion") {
      expansionStationing += Math.round(4 * eff)
      expansionDockingPorts += Math.round(2 * eff)
    } else if (b.definitionId === "bld_garrison_barracks") {
      expansionStationing += Math.round(3 * eff)
    } else if (b.definitionId === "bld_command_center") {
      expansionCommand += Math.round(2 * eff * b.currentLevel)
    }
  }

  // 3. Command Capacity base calculation
  let commandCapacity = isCapital ? 6 : (baseType === "MILITARY" ? 4 : 2)
  commandCapacity += Math.floor((tier - 1) * 0.5)
  commandCapacity += expansionCommand

  // Hub Specialization: COMMAND_HUB adds +3 command capacity
  const commandHub = hubSpecializations.find(
    (h) => h.hubType === "COMMAND_HUB" && h.status === "ACTIVE"
  )
  if (commandHub) {
    commandCapacity += 3
  }

  // 4. Stationing Capacity base calculation
  let stationingCapacity = isCapital ? 8 : (baseType === "MILITARY" ? 6 : (baseType === "DEFENSE" ? 5 : 2))
  stationingCapacity += Math.floor((tier - 1) * 0.8)
  stationingCapacity += expansionStationing

  // 5. Sub-Base Docking Ports (Physically on orbital stations, evaluated strictly separately)
  let subBaseDockingPorts = 0
  for (const sub of orbitalSubBases) {
    if (sub.operationalState === "ACTIVE") {
      subBaseDockingPorts += sub.dockingCapacity
      // Also contributes to stationing in orbit
      stationingCapacity += Math.max(1, Math.floor(sub.dockingCapacity / 2))
    }
  }

  // Total Docking Capacity = Main Base physical ports + Orbital Sub-Base physical ports
  const fleetDockingCapacity = baseDockingPorts + expansionDockingPorts + subBaseDockingPorts

  return {
    fleetCommandCapacity: commandCapacity,
    fleetStationingCapacity: stationingCapacity,
    fleetDockingCapacity,
    baseDockingPorts,
    expansionDockingPorts,
    subBaseDockingPorts,
  }
}
