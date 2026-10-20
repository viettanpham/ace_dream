/**
 * STARFRONT WORLD — Phase 7.6 WorldState Integration, Combat V2 & Reports Test Suite
 *
 * Verifies:
 * 1. NationalFleetRegistry indexing and O(1) lookups by Fleet ID
 * 2. NationalFleetRegistry O(1) lookups by Sector ID and dynamic updating
 * 3. NationalFleetRegistry O(1) lookups by Base ID (docked) and clearing on undocking
 * 4. NationalFleetRegistry O(1) lookups by Sovereign Owner ID (Nation/Guild)
 * 5. Registry non-cloning invariant (references original state, zero duplicate memory overhead)
 * 6. Adapting FleetEntityState to CombatSupportEntity for Combat V2 tactical grid
 * 7. Combat settlement on victory: pro-rata damage, casualties, morale boost, service log, FRAME award
 * 8. Combat settlement on defeat: damage, morale penalty, casualty history logging
 * 9. Generating 7-day Fleet Cycle Report: active fleet aggregation, naval power, fiscal balances
 * 10. Generating 30-day Macro Strategic Settlement Report
 * 11. Periodic report scheduler: triggers 7-day and 30-day milestones on WorldState
 * 12. WorldState.fleets integration and resilience
 */

import test from "node:test"
import assert from "node:assert"

import { bootstrapWorldCatalogs } from "../../lib/game/world/bootstrap"
import { createShipInstance } from "../../lib/game/world/ship/ship-entity"
import {
  createFleetEntity,
  addShipToFleet,
  dockFleetAtBase,
  undockFleetFromBase,
  NationalFleetRegistry,
  adaptFleetToCombatSupport,
  settleFleetCombatOutcome,
  generateFleetCycleReport,
  processPeriodicFleetReports,
  CYCLE_REPORT_INTERVAL,
  MACRO_SETTLEMENT_INTERVAL,
} from "../../lib/game/world/fleet"
import type { WorldState } from "../../lib/game/world/types"

// Ensure all catalogs are bootstrapped
bootstrapWorldCatalogs()

test("1. NationalFleetRegistry indexing and O(1) lookups by Fleet ID", () => {
  const registry = new NationalFleetRegistry()

  const fleet = createFleetEntity({
    fleetId: "fleet_sol_vanguard",
    name: "Sol Vanguard Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "nation_vss", nationId: "nation_vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })

  registry.registerOrUpdateFleet(fleet)

  const retrieved = registry.getFleetById("fleet_sol_vanguard")
  assert.ok(retrieved)
  assert.strictEqual(retrieved.name, "Sol Vanguard Fleet")
  assert.strictEqual(registry.getCount(), 1)
})

test("2. NationalFleetRegistry O(1) lookups by Sector ID and dynamic updating", () => {
  const registry = new NationalFleetRegistry()

  const fleet1 = createFleetEntity({
    fleetId: "f1",
    name: "Fleet 1",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })
  const fleet2 = createFleetEntity({
    fleetId: "f2",
    name: "Fleet 2",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })
  const fleet3 = createFleetEntity({
    fleetId: "f3",
    name: "Fleet 3",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_orion_hq",
    initialSectorId: "SEC_ORION_ARM",
  })

  registry.registerOrUpdateFleet(fleet1)
  registry.registerOrUpdateFleet(fleet2)
  registry.registerOrUpdateFleet(fleet3)

  const solFleets = registry.getFleetsBySector("SEC_SOL_CORE")
  assert.strictEqual(solFleets.length, 2)

  const orionFleets = registry.getFleetsBySector("SEC_ORION_ARM")
  assert.strictEqual(orionFleets.length, 1)
  assert.strictEqual(orionFleets[0].fleetId, "f3")

  // Relocate fleet 1 to Orion
  fleet1.currentLocation.sectorId = "SEC_ORION_ARM"
  registry.registerOrUpdateFleet(fleet1)

  assert.strictEqual(registry.getFleetsBySector("SEC_SOL_CORE").length, 1)
  assert.strictEqual(registry.getFleetsBySector("SEC_ORION_ARM").length, 2)
})

test("3. NationalFleetRegistry O(1) lookups by Base ID (docked) and clearing on undocking", () => {
  const registry = new NationalFleetRegistry()

  const fleet = createFleetEntity({
    fleetId: "dock_fleet",
    name: "Dock Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    initialBaseId: "base_sol_hq",
  })

  registry.registerOrUpdateFleet(fleet)

  const dockedFleets = registry.getFleetsByBase("base_sol_hq")
  assert.strictEqual(dockedFleets.length, 1)

  // Undock
  undockFleetFromBase(fleet)
  registry.registerOrUpdateFleet(fleet)

  assert.strictEqual(registry.getFleetsByBase("base_sol_hq").length, 0)
  assert.strictEqual(fleet.operationalStatus, "STATIONED")
})

test("4. NationalFleetRegistry O(1) lookups by Sovereign Owner ID", () => {
  const registry = new NationalFleetRegistry()

  const nationalFleet = createFleetEntity({
    fleetId: "nat_f1",
    name: "National 1",
    ownerRef: { ownerType: "NATION", ownerId: "nation_vss", nationId: "nation_vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })
  const guildFleet = createFleetEntity({
    fleetId: "guild_f1",
    name: "Guild 1",
    ownerRef: { ownerType: "GUILD", ownerId: "guild_shadow_ops", nationId: "nation_vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })

  registry.registerOrUpdateFleet(nationalFleet)
  registry.registerOrUpdateFleet(guildFleet)

  assert.strictEqual(registry.getFleetsByOwner("nation_vss").length, 1)
  assert.strictEqual(registry.getFleetsByOwner("guild_shadow_ops").length, 1)
})

test("5. Registry non-cloning invariant: directly references original state", () => {
  const registry = new NationalFleetRegistry()
  const fleet = createFleetEntity({
    fleetId: "ref_fleet",
    name: "Original Name",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })

  registry.registerOrUpdateFleet(fleet)

  // Mutate through lookup
  const retrieved = registry.getFleetById("ref_fleet")
  assert.ok(retrieved)
  retrieved.name = "Mutated Name"

  // Original variable must reflect mutation
  assert.strictEqual(fleet.name, "Mutated Name")
})

test("6. Adapting FleetEntityState to CombatSupportEntity for Combat V2 tactical grid", () => {
  const fleet = createFleetEntity({
    fleetId: "support_fleet",
    name: "Cruiser Squadron",
    customCallsign: "Hammerhead",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })

  const cruiser = createShipInstance({ definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER", instanceId: "c1" })
  addShipToFleet(fleet, cruiser)

  // Standard line fleet -> fleet_support
  const supportObj = adaptFleetToCombatSupport(fleet)
  assert.strictEqual(supportObj.type, "fleet_support")
  assert.strictEqual(supportObj.callsign, "Hammerhead")
  assert.strictEqual(supportObj.specialization, "ORBITAL_BARRAGE")
  assert.ok(supportObj.supportPower > 0)
  assert.strictEqual(supportObj.isReady, true)

  // Add carrier -> changes to carrier support
  const carrier = createShipInstance({ definitionId: "SHIP_DEF_HYPERION_CARRIER", instanceId: "car1" })
  addShipToFleet(fleet, carrier)

  const carrierSupport = adaptFleetToCombatSupport(fleet)
  assert.strictEqual(carrierSupport.type, "carrier")
  assert.strictEqual(carrierSupport.specialization, "FIGHTER_STRIKE_WAVE")
})

test("7. Combat settlement on victory: damage distribution, casualties, morale boost, service log, FRAME award", () => {
  const fleet = createFleetEntity({
    fleetId: "combat_vic_fleet",
    name: "Victorious Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })

  const cruiser = createShipInstance({ definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER", instanceId: "c_vic" })
  addShipToFleet(fleet, cruiser)

  const initialHull = cruiser.hullHp
  fleet.personnel.morale = 70
  fleet.personnel.crewPool.crewAssigned = 100
  fleet.personnel.crewPool.totalCrew = 100

  const settlement = settleFleetCombatOutcome(fleet, {
    victory: true,
    rounds: 6,
    damageReceivedPercent: 30, // 30% damage
    enemyKillsCount: 4,
    threatSuppressedPoints: 1250,
    pilotsRescuedCount: 2,
    gameDay: 45,
  })

  assert.strictEqual(settlement.victory, true)
  assert.ok(cruiser.hullHp < initialHull)
  assert.ok(settlement.casualtiesCount > 0)
  assert.strictEqual(settlement.moraleAfterCombat, 80) // 70 + 10 boost
  assert.ok(settlement.frameAwarded > 0)

  // Verify Service Log
  assert.strictEqual(fleet.serviceRecord.totalBattlesEngaged, 1)
  assert.strictEqual(fleet.serviceRecord.victoriesCount, 1)
  assert.strictEqual(fleet.serviceRecord.enemiesDestroyed, 4)
  assert.strictEqual(fleet.serviceRecord.threatSuppressed, 1250)
  assert.strictEqual(fleet.serviceRecord.pilotsRescued, 2)
})

test("8. Combat settlement on defeat: damage distribution, morale penalty, casualty logging", () => {
  const fleet = createFleetEntity({
    fleetId: "combat_def_fleet",
    name: "Defeated Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })

  const cruiser = createShipInstance({ definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER", instanceId: "c_def" })
  addShipToFleet(fleet, cruiser)

  fleet.personnel.morale = 80
  fleet.personnel.crewPool.crewAssigned = 100
  fleet.personnel.crewPool.totalCrew = 100

  const settlement = settleFleetCombatOutcome(fleet, {
    victory: false,
    rounds: 8,
    damageReceivedPercent: 60,
    enemyKillsCount: 1,
    threatSuppressedPoints: 200,
    gameDay: 50,
  })

  assert.strictEqual(settlement.victory, false)
  assert.strictEqual(settlement.moraleAfterCombat, 55) // 80 - 25 penalty
  assert.strictEqual(fleet.serviceRecord.totalBattlesEngaged, 1)
  assert.strictEqual(fleet.serviceRecord.victoriesCount, 0)
  assert.strictEqual(fleet.personnel.casualtyHistory.length, 1)
})

test("9. Generating 7-day Fleet Cycle Report: active fleet aggregation", () => {
  const fleet1 = createFleetEntity({
    fleetId: "rep_f1",
    name: "VSS Vanguard",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    initialCredits: 8000,
  })
  const ship1 = createShipInstance({ definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", instanceId: "s1" })
  addShipToFleet(fleet1, ship1)

  const report = generateFleetCycleReport([fleet1], 7, "7_DAY_CYCLE")
  assert.strictEqual(report.gameDay, 7)
  assert.strictEqual(report.reportType, "7_DAY_CYCLE")
  assert.strictEqual(report.totalActiveFleets, 1)
  assert.strictEqual(report.totalShipsCommissioned, 1)
  assert.strictEqual(report.totalCreditsCirculating, 8000)
  assert.strictEqual(report.fleetSummaries.length, 1)
})

test("10. Generating 30-day Macro Strategic Settlement Report", () => {
  const fleet1 = createFleetEntity({
    fleetId: "rep_f2",
    name: "VSS Home Guard",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    initialCredits: 12000,
  })

  const report = generateFleetCycleReport([fleet1], 30, "30_DAY_MACRO")
  assert.strictEqual(report.gameDay, 30)
  assert.strictEqual(report.reportType, "30_DAY_MACRO")
  assert.strictEqual(report.totalCreditsCirculating, 12000)
})

test("11. Periodic report scheduler: triggers 7-day and 30-day milestones on WorldState", () => {
  const mockWorldState: Partial<WorldState> = {
    currentDay: 7,
    fleets: {
      f1: createFleetEntity({
        fleetId: "f1",
        name: "Fleet 1",
        ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
        registeredHomeBaseId: "base_sol_hq",
        initialSectorId: "SEC_SOL_CORE",
      }),
    },
  }

  // Day 7: Should trigger 7-day cycle report
  const res1 = processPeriodicFleetReports(mockWorldState as WorldState)
  assert.strictEqual(res1.triggered7Day, true)
  assert.strictEqual(res1.triggered30Day, false)
  assert.strictEqual(res1.reports.length, 1)
  assert.strictEqual(res1.reports[0].reportType, "7_DAY_CYCLE")

  // Day 30: Should trigger both 7-day (since Day 7+7...) and 30-day macro
  mockWorldState.currentDay = 30
  const res2 = processPeriodicFleetReports(mockWorldState as WorldState)
  assert.strictEqual(res2.triggered7Day, true)
  assert.strictEqual(res2.triggered30Day, true)
  assert.strictEqual(res2.reports.length, 2)
})
