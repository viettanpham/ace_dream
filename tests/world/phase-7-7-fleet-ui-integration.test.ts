/**
 * STARFRONT WORLD — Phase 7.7 Integration & Verification Test Suite
 *
 * Verifies:
 * 1. ensureWorldFleetsInitialized: Canonical national fleets bootstrap
 * 2. Idempotency: Existing fleets are safely preserved without data loss
 * 3. Sector Intel Integration: Sector-based fleet retrieval and docking status
 * 4. Fleet Command Actions: Flagship designation, docking toggle, hyperlane transit orders
 * 5. 3-Pass Crew Allocation: Minimum -> Target -> Maximum buff allocation
 * 6. FRAME Store Redemption & Maintenance Subsidies
 * 7. Admin CP Ledger Integrity Audits ($totalFrame >= 0$, $availableFrame >= 0$)
 * 8. NationalFleetRegistry indexing synchronization
 */

import test from "node:test"
import assert from "node:assert"
import {
  createFleetEntity,
  ensureWorldFleetsInitialized,
  setFleetFlagship,
  dockFleetAtBase,
  undockFleetFromBase,
  orderFleetTransit,
} from "../../lib/game/world/fleet/fleet-entity"
import {
  allocateFleetCrewToShips,
} from "../../lib/game/world/fleet/fleet-personnel"
import {
  redeemFrameAtStore,
  claimFleetMaintenanceSubsidy,
  awardFramePoints,
  calculateAnnualFrameDecay,
} from "../../lib/game/world/fleet/fleet-frame-engine"
import { NationalFleetRegistry } from "../../lib/game/world/fleet/fleet-registry"
import type { WorldState } from "../../lib/game/world/types"

function createMockWorldState(): WorldState {
  return {
    version: 1,
    schemaVersion: 1,
    currentDay: 42,
    year: 1,
    dayOfYear: 42,
    lastTickTimestamp: Date.now(),
    resources: {
      industrialMaterials: 5000,
      energy: 8000,
      logisticsSupplies: 2500,
      tacticalData: 1200,
      food: 6000,
    },
    military: {
      standingArmy: 4500,
      reserves: 3000,
      mobilizationLevel: "normal",
    },
    sectors: {
      sol_command_hq: {
        id: "sol_command_hq",
        name: "Sol Command Headquarters",
        threatLevel: 25,
        stage: "normal",
        sovereignty: "player",
        garrison: 200,
        fortificationLevel: 3,
        economicTier: 3,
        assignedCommanderId: "cmd_01",
      } as any,
      alpha_centauri_outpost: {
        id: "alpha_centauri_outpost",
        name: "Alpha Centauri Outpost",
        threatLevel: 45,
        stage: "normal",
        sovereignty: "player",
        garrison: 100,
        fortificationLevel: 1,
        economicTier: 1,
      } as any,
      orion_belt_nexus: {
        id: "orion_belt_nexus",
        name: "Orion Belt Nexus",
        threatLevel: 60,
        stage: "normal",
        sovereignty: "neutral",
        garrison: 50,
        fortificationLevel: 0,
        economicTier: 2,
      } as any,
    },
    routes: {},
    events: {},
    eventHistory: [],
    inFlightTransactions: {},
    fleets: {},
  }
}

test("1. ensureWorldFleetsInitialized: Bootstraps 4 canonical national fleets", () => {
  const worldState = createMockWorldState()
  assert.strictEqual(Object.keys(worldState.fleets || {}).length, 0)

  const fleets = ensureWorldFleetsInitialized(worldState)
  assert.strictEqual(Object.keys(fleets).length, 4)

  assert.ok(fleets["FLEET_ALPHA_EXPEDITION"])
  assert.ok(fleets["FLEET_SOL_DEFENSE"])
  assert.ok(fleets["FLEET_PEGASUS_LOGISTICS"])
  assert.ok(fleets["FLEET_SHADOW_RECON"])

  // Check Fleet Alpha properties
  const alpha = fleets["FLEET_ALPHA_EXPEDITION"]
  assert.strictEqual(alpha.name, "Hạm Đội Viễn Chinh Alpha")
  assert.strictEqual(alpha.fleetTypeId, "FLEET_TYPE_MILITARY_EXPEDITIONARY")
  assert.strictEqual(Object.keys(alpha.ships).length, 3)
  assert.ok(alpha.flagshipInstanceId)
  assert.strictEqual(alpha.treasury.credits, 12500)
  assert.strictEqual(alpha.cargo.food, 2500)
  assert.strictEqual(alpha.frameState.totalFrame, 450)
})

test("2. ensureWorldFleetsInitialized: Idempotency preserves existing customized fleets", () => {
  const worldState = createMockWorldState()
  ensureWorldFleetsInitialized(worldState)

  // Modify a fleet
  const alpha = worldState.fleets!["FLEET_ALPHA_EXPEDITION"]
  alpha.treasury.credits = 99999
  alpha.name = "Customized Alpha Flagship Fleet"

  // Call again
  const secondCallFleets = ensureWorldFleetsInitialized(worldState)
  assert.strictEqual(secondCallFleets["FLEET_ALPHA_EXPEDITION"].treasury.credits, 99999)
  assert.strictEqual(secondCallFleets["FLEET_ALPHA_EXPEDITION"].name, "Customized Alpha Flagship Fleet")
})

test("3. Sector Intel Integration: Filters fleets accurately by sector", () => {
  const worldState = createMockWorldState()
  const fleets = ensureWorldFleetsInitialized(worldState)

  // Sol Command HQ has 3 fleets initially
  const solFleets = Object.values(fleets).filter((f) => f.currentLocation.sectorId === "sol_command_hq")
  assert.strictEqual(solFleets.length, 3)

  // Alpha Centauri has 1 recon fleet
  const alphaCentauriFleets = Object.values(fleets).filter((f) => f.currentLocation.sectorId === "alpha_centauri_outpost")
  assert.strictEqual(alphaCentauriFleets.length, 1)
  assert.strictEqual(alphaCentauriFleets[0].fleetId, "FLEET_SHADOW_RECON")

  // Orion Belt Nexus has 0 fleets
  const orionFleets = Object.values(fleets).filter((f) => f.currentLocation.sectorId === "orion_belt_nexus")
  assert.strictEqual(orionFleets.length, 0)
})

test("4. Fleet Command Actions: Flagship appointment and docking toggle", () => {
  const worldState = createMockWorldState()
  const fleets = ensureWorldFleetsInitialized(worldState)
  const alpha = fleets["FLEET_ALPHA_EXPEDITION"]

  const shipIds = Object.keys(alpha.ships)
  assert.ok(shipIds.length >= 2)

  // Set second ship as flagship
  const newFlagshipId = shipIds[1]
  const setFlagshipRes = setFleetFlagship(alpha, newFlagshipId)
  assert.strictEqual(setFlagshipRes.success, true)
  assert.strictEqual(alpha.flagshipInstanceId, newFlagshipId)

  // Toggle docking status
  assert.strictEqual(alpha.operationalStatus, "STATIONED")
  dockFleetAtBase(alpha, "sol_command_hq", "sol_command_hq")
  assert.strictEqual(alpha.operationalStatus, "DOCKED")
  assert.strictEqual(alpha.currentLocation.baseId, "sol_command_hq")

  undockFleetFromBase(alpha)
  assert.strictEqual(alpha.operationalStatus, "STATIONED")
  assert.strictEqual(alpha.currentLocation.baseId, undefined)
})

test("5. Fleet Command Actions: Hyperlane transit ordering", () => {
  const worldState = createMockWorldState()
  const fleets = ensureWorldFleetsInitialized(worldState)
  const recon = fleets["FLEET_SHADOW_RECON"]

  const transitRes = orderFleetTransit(recon, "orion_belt_nexus", 2, worldState.currentDay)
  assert.strictEqual(transitRes.success, true)
  assert.strictEqual(recon.operationalStatus, "IN_TRANSIT")
  assert.strictEqual(recon.currentLocation.isHyperlaneTransit, true)
  assert.strictEqual(recon.currentLocation.transitTargetSectorId, "orion_belt_nexus")
})

test("6. 3-Pass Ship Crew Allocator: Optimizes crew staffing across fleet ships", () => {
  const worldState = createMockWorldState()
  const fleets = ensureWorldFleetsInitialized(worldState)
  const alpha = fleets["FLEET_ALPHA_EXPEDITION"]

  const shipsList = Object.values(alpha.ships)
  const allocRes = allocateFleetCrewToShips(alpha.personnel.crewPool, shipsList)

  assert.ok(allocRes.shipsEvaluated > 0)
  assert.strictEqual(allocRes.understaffedShipsCount, 0) // Should have enough crew for minimum

  // Ships should have valid assignedCrewCount
  for (const ship of shipsList) {
    assert.ok(ship.assignedCrewCount > 0)
  }
})

test("7. FRAME Store Redemption: Deducts available FRAME while total FRAME remains immutable", () => {
  const worldState = createMockWorldState()
  const fleets = ensureWorldFleetsInitialized(worldState)
  const alpha = fleets["FLEET_ALPHA_EXPEDITION"]

  const initialTotal = alpha.frameState.totalFrame
  const initialAvailable = alpha.frameState.availableFrame

  assert.ok(initialAvailable >= 200)

  const redeemRes = redeemFrameAtStore(alpha.frameState, 200, "Quantum Shield Blueprint", worldState.currentDay)
  assert.strictEqual(redeemRes.success, true)
  assert.strictEqual(alpha.frameState.availableFrame, initialAvailable - 200)
  assert.strictEqual(alpha.frameState.totalFrame, initialTotal) // Invariant: totalFrame never drops from store purchase

  // Graceful rejection when insufficient
  const failRes = redeemFrameAtStore(alpha.frameState, 99999, "Overpriced Megaship", worldState.currentDay)
  assert.strictEqual(failRes.success, false)
})

test("8. Fleet Maintenance Subsidy Claim: Computes subsidy and reimburses fleet treasury", () => {
  const worldState = createMockWorldState()
  const fleets = ensureWorldFleetsInitialized(worldState)
  const defense = fleets["FLEET_SOL_DEFENSE"]

  const claimRes = claimFleetMaintenanceSubsidy(
    defense,
    defense.frameState,
    1000,
    30,
    false,
    worldState.currentDay
  )

  assert.strictEqual(claimRes.success, true)
  assert.ok(claimRes.subsidizedCredits > 0)
  assert.ok(claimRes.fleetPaidCredits < 1000)
  assert.strictEqual(claimRes.subsidizedCredits + claimRes.fleetPaidCredits, 1000)
})

test("9. Admin CP Ledger Integrity Audits: All invariants hold across fleets", () => {
  const worldState = createMockWorldState()
  const fleets = ensureWorldFleetsInitialized(worldState)
  const activeFleets = Object.values(fleets)

  // Invariant 1: totalFrame >= 0
  for (const f of activeFleets) {
    assert.ok(f.frameState.totalFrame >= 0, `Fleet ${f.fleetId} totalFrame cannot be negative`)
  }

  // Invariant 2: availableFrame >= 0
  for (const f of activeFleets) {
    assert.ok(f.frameState.availableFrame >= 0, `Fleet ${f.fleetId} availableFrame cannot be negative`)
  }

  // Invariant 3: ship fleetId consistency
  for (const f of activeFleets) {
    for (const ship of Object.values(f.ships)) {
      assert.strictEqual(ship.fleetId, f.fleetId, `Ship ${ship.instanceId} must belong to fleet ${f.fleetId}`)
    }
  }
})

test("10. Admin Fast Action: Mass FRAME awarding and Annual Decay calculation", () => {
  const worldState = createMockWorldState()
  const fleets = ensureWorldFleetsInitialized(worldState)
  const activeFleets = Object.values(fleets)

  const initialTotals = activeFleets.map((f) => f.frameState.totalFrame)

  // Mass award 500 FRAME
  for (const f of activeFleets) {
    awardFramePoints(f.frameState, 500, "Admin CP Mass Award", worldState.currentDay)
  }

  for (let i = 0; i < activeFleets.length; i++) {
    assert.strictEqual(activeFleets[i].frameState.totalFrame, initialTotals[i] + 500)
  }

  // Calculate annual decay for Year 1
  for (const f of activeFleets) {
    const decayRes = calculateAnnualFrameDecay(f, f.frameState, 600, 1)
    assert.ok(decayRes.decayedRate >= 0)
    assert.ok(f.frameState.totalFrame >= 0)
  }
})

test("11. NationalFleetRegistry: Facade rebuildIndex indexes all initialized fleets in O(1) maps", () => {
  const worldState = createMockWorldState()
  const fleets = ensureWorldFleetsInitialized(worldState)

  const registry = NationalFleetRegistry.getInstance()
  registry.rebuildIndex(fleets)

  // Query by ID
  const alpha = registry.getFleetById("FLEET_ALPHA_EXPEDITION")
  assert.ok(alpha)
  assert.strictEqual(alpha?.fleetId, "FLEET_ALPHA_EXPEDITION")

  // Query by Sector
  const solFleets = registry.getFleetsInSector("sol_command_hq")
  assert.strictEqual(solFleets.length, 3)

  // Query by Base (Docked)
  const dockedFleets = registry.getFleetsDockedAtBase("sol_command_hq")
  assert.strictEqual(dockedFleets.length, 1)
  assert.strictEqual(dockedFleets[0].fleetId, "FLEET_SOL_DEFENSE")

  // Query by Owner
  const nationalFleets = registry.getFleetsByOwner("NATION_VSS")
  assert.strictEqual(nationalFleets.length, 4)
})
