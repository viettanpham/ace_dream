/**
 * STARFRONT WORLD — Phase 7.4 Fleet Entity, Treasury & Logistics Supply Test Suite
 *
 * Verifies:
 * 1. Fleet Entity State creation with Tri-party Sovereign ownership
 * 2. Ship addition to Fleet respecting Fleet Class capacity limits (MK I Squad max 4 ships)
 * 3. Flagship assignment and automatic reassignment on ship removal
 * 4. Independent Fleet Treasury deposits, withdrawals, and immutable audit journal
 * 5. Sovereign Supply Credits reserve fallback on critical expenditures
 * 6. Crew Payroll processing & deficit cycle tracking -> triggers Austere Mode on 3rd failure
 * 7. Fleet Cargo capacity calculation based on composite ship fleet
 * 8. Daily Food & Energy consumption calculation across operational states (DOCKED vs IN_TRANSIT)
 * 9. Daily Logistics Tick: Food depletion triggers Starvation state & morale penalty
 * 10. Daily Logistics Tick: Energy depletion in transit triggers Stranded in space state
 * 11. Two-way cargo transfer between Base inventory and Fleet cargo with capacity constraint
 * 12. Fleet Combat Readiness evaluation (hull integrity, crew efficiency, morale)
 * 13. Autonomous Fleet AI Decision: Tactical retreat when damage exceeds persona threshold
 * 14. Autonomous Fleet AI Decision: National Emergency Command response (Capital Under Siege)
 * 15. Hyperlane transit journey departure and advance to destination sector arrival
 * 16. Mutual Consent Fleet Merger: asset, credit, cargo transfer and service record unification
 */

import test from "node:test"
import assert from "node:assert"

import { bootstrapWorldCatalogs } from "../../lib/game/world/bootstrap"
import { createShipInstance } from "../../lib/game/world/ship/ship-entity"
import {
  createFleetEntity,
  addShipToFleet,
  removeShipFromFleet,
  setFleetFlagship,
  orderFleetTransit,
  advanceFleetTransit,
  dockFleetAtBase,
  undockFleetFromBase,
  mergeFleets,
  createFleetTreasury,
  depositFleetCredits,
  withdrawFleetCredits,
  processFleetPayroll,
  createFleetCargo,
  calculateFleetCargoCapacity,
  calculateFleetCargoCurrentWeight,
  calculateDailyFleetConsumption,
  processDailyFleetLogisticsTick,
  transferCargoBetweenBaseAndFleet,
  evaluateFleetReadiness,
  evaluateFleetAutonomousDecision,
} from "../../lib/game/world/fleet"
import type { WorldResourceLedger } from "../../lib/game/world/types"

// Ensure all catalogs are bootstrapped
bootstrapWorldCatalogs()

test("1. Fleet Entity State creation with Tri-Party Sovereign Ownership", () => {
  const fleet = createFleetEntity({
    fleetId: "fleet_vss_1st_expeditionary",
    name: "1st Sol Expeditionary Fleet",
    customCallsign: "Vanguard One",
    ownerRef: {
      ownerType: "NATION",
      ownerId: "nation_vss_alliance",
      nationId: "nation_vss_alliance",
    },
    registeredHomeBaseId: "base_sol_command_hq",
    initialSectorId: "SEC_SOL_CORE",
    initialBaseId: "base_sol_command_hq",
    fleetTypeId: "FLEET_TYPE_MILITARY_EXPEDITIONARY",
    fleetClassId: "FLEET_CLASS_MK1_SQUAD",
    currentGameDay: 42,
  })

  assert.strictEqual(fleet.fleetId, "fleet_vss_1st_expeditionary")
  assert.strictEqual(fleet.ownerRef.ownerType, "NATION")
  assert.strictEqual(fleet.registeredHomeBaseId, "base_sol_command_hq")
  assert.strictEqual(fleet.currentLocation.sectorId, "SEC_SOL_CORE")
  assert.strictEqual(fleet.currentLocation.baseId, "base_sol_command_hq")
  assert.strictEqual(fleet.operationalStatus, "DOCKED")
  assert.strictEqual(fleet.aiPersona, "AGGRESSIVE_VANGUARD")
  assert.strictEqual(fleet.isAustereMode, false)
  assert.strictEqual(fleet.createdAtGameDay, 42)
  assert.ok(fleet.treasury.credits > 0)
  assert.ok(fleet.cargo.food > 0)
})

test("2. Ship addition respecting Fleet Class capacity limits (MK I Squad max 4 ships)", () => {
  const fleet = createFleetEntity({
    fleetId: "fleet_test_squad",
    name: "Test Squad",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    fleetClassId: "FLEET_CLASS_MK1_SQUAD", // maxShipCount = 4
  })

  // Add 4 ships
  for (let i = 1; i <= 4; i++) {
    const ship = createShipInstance({ definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", instanceId: `ship_${i}` })
    const res = addShipToFleet(fleet, ship)
    assert.strictEqual(res.success, true)
    assert.strictEqual(ship.fleetId, fleet.fleetId)
  }

  assert.strictEqual(Object.keys(fleet.ships).length, 4)

  // 5th ship must be rejected
  const extraShip = createShipInstance({ definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", instanceId: "ship_5" })
  const rejectRes = addShipToFleet(fleet, extraShip)
  assert.strictEqual(rejectRes.success, false)
  assert.ok(rejectRes.error?.includes("giới hạn biên chế tối đa"))
})

test("3. Flagship assignment and automatic reassignment on ship removal", () => {
  const fleet = createFleetEntity({
    fleetId: "fleet_flagship_test",
    name: "Flagship Test Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })

  const ship1 = createShipInstance({ definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", instanceId: "ship_corvette_1" })
  const ship2 = createShipInstance({ definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER", instanceId: "ship_cruiser_2" })

  addShipToFleet(fleet, ship1)
  addShipToFleet(fleet, ship2)

  // Auto flagship should be ship1
  assert.strictEqual(fleet.flagshipInstanceId, "ship_corvette_1")

  // Explicitly promote ship2 to flagship
  const promoteRes = setFleetFlagship(fleet, "ship_cruiser_2")
  assert.strictEqual(promoteRes.success, true)
  assert.strictEqual(fleet.flagshipInstanceId, "ship_cruiser_2")

  // Remove cruiser, flagship should automatically fall back to remaining ship
  const removeRes = removeShipFromFleet(fleet, "ship_cruiser_2")
  assert.strictEqual(removeRes.success, true)
  assert.strictEqual(fleet.flagshipInstanceId, "ship_corvette_1")
})

test("4. Independent Fleet Treasury deposits, withdrawals, and immutable audit journal", () => {
  const treasury = createFleetTreasury(5000, 1000)
  assert.strictEqual(treasury.credits, 5000)
  assert.strictEqual(treasury.supplyCredits, 1000)

  // Deposit mission bounty
  depositFleetCredits(treasury, 2500, "MISSION_BOUNTY", "Destroyed Void pirate raiders", 10, "msn_bounty_01")
  assert.strictEqual(treasury.credits, 7500)
  assert.strictEqual(treasury.totalCreditsEarned, 7500)

  // Withdraw for maintenance dockage
  const withdrawOk = withdrawFleetCredits(treasury, 1500, "MAINTENANCE_DOCKAGE", "Docking bay overhaul", 11)
  assert.strictEqual(withdrawOk, true)
  assert.strictEqual(treasury.credits, 6000)
  assert.strictEqual(treasury.totalCreditsSpent, 1500)

  // Check audit trail
  assert.ok(treasury.ledgerHistory.length >= 3)
  const lastEntry = treasury.ledgerHistory[treasury.ledgerHistory.length - 1]
  assert.strictEqual(lastEntry.type, "MAINTENANCE_DOCKAGE")
  assert.strictEqual(lastEntry.amountCredits, -1500)
  assert.strictEqual(lastEntry.balanceAfterCredits, 6000)
})

test("5. Sovereign Supply Credits reserve fallback on critical expenditures", () => {
  const treasury = createFleetTreasury(200, 1000)

  // Try withdrawing 800 without fallback -> fails
  const failedWithdraw = withdrawFleetCredits(treasury, 800, "SUPPLY_PURCHASE", "Munitions restock", 15, undefined, false)
  assert.strictEqual(failedWithdraw, false)
  assert.strictEqual(treasury.credits, 200)

  // Try withdrawing 800 with supply credits fallback -> succeeds
  const okWithdraw = withdrawFleetCredits(treasury, 800, "SUPPLY_PURCHASE", "Emergency fuel purchase", 16, undefined, true)
  assert.strictEqual(okWithdraw, true)
  assert.strictEqual(treasury.credits, 0)
  assert.strictEqual(treasury.supplyCredits, 400) // 1000 - (800 - 200) = 400
})

test("6. Crew Payroll processing & consecutive deficit tracking -> Austere Mode on 3rd failure", () => {
  const treasury = createFleetTreasury(100, 0)
  // Payroll cost for 50 assigned crew + 10 idle crew = (50 * 2) + (10 * 1) = 110 credits

  // Cycle 1: Deficit
  const p1 = processFleetPayroll(treasury, 50, 10, 1)
  assert.strictEqual(p1.success, false)
  assert.strictEqual(p1.consecutiveDeficitCycles, 1)
  assert.strictEqual(p1.isAustereMode, false)

  // Cycle 2: Deficit
  const p2 = processFleetPayroll(treasury, 50, 10, 2)
  assert.strictEqual(p2.success, false)
  assert.strictEqual(p2.consecutiveDeficitCycles, 2)
  assert.strictEqual(p2.isAustereMode, false)

  // Cycle 3: Deficit -> Triggers Austere Mode
  const p3 = processFleetPayroll(treasury, 50, 10, 3)
  assert.strictEqual(p3.success, false)
  assert.strictEqual(p3.consecutiveDeficitCycles, 3)
  assert.strictEqual(p3.isAustereMode, true)
  assert.strictEqual(treasury.isAustereMode, true)

  // Supply fund relief of 1000 credits
  depositFleetCredits(treasury, 1000, "NATIONAL_SUBSIDY", "Government bailout", 4)
  const p4 = processFleetPayroll(treasury, 50, 10, 4)
  assert.strictEqual(p4.success, true)
  assert.strictEqual(p4.consecutiveDeficitCycles, 0)
  assert.strictEqual(p4.isAustereMode, false)
  assert.strictEqual(treasury.isAustereMode, false)
})

test("7. Fleet Cargo capacity calculation based on composite ship fleet", () => {
  const ships = {
    s1: createShipInstance({ definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", instanceId: "c1" }), // 120
    s2: createShipInstance({ definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER", instanceId: "cr1" }),  // 850
    s3: createShipInstance({ definitionId: "SHIP_DEF_HERMES_SUPPLY_TENDER", instanceId: "h1" }), // 6000
  }

  const totalCap = calculateFleetCargoCapacity(ships)
  assert.strictEqual(totalCap, 120 + 850 + 6000) // 6970
})

test("8. Daily Food & Energy consumption calculation across operational states", () => {
  const ships = {
    s1: createShipInstance({ definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", instanceId: "c1" }),
    s2: createShipInstance({ definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER", instanceId: "cr1" }),
  }
  const totalCrew = 100

  // DOCKED: food = 100 * 0.05 = 5, energy = 2 ships * 1 = 2
  const dockedUsage = calculateDailyFleetConsumption(ships, totalCrew, "DOCKED")
  assert.strictEqual(dockedUsage.foodRequired, 5)
  assert.strictEqual(dockedUsage.energyRequired, 2)

  // IN_TRANSIT: food = 5, energy = 2 ships * 7 = 14
  const transitUsage = calculateDailyFleetConsumption(ships, totalCrew, "IN_TRANSIT")
  assert.strictEqual(transitUsage.foodRequired, 5)
  assert.strictEqual(transitUsage.energyRequired, 14)
})

test("9. Daily Logistics Tick: Food depletion triggers Starvation state & morale penalty", () => {
  const cargo = createFleetCargo({ food: 2, energy: 100 })
  const ships = [createShipInstance({ definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", instanceId: "c1" })]
  const totalCrew = 100 // needs 5 food

  const tickResult = processDailyFleetLogisticsTick(cargo, ships, totalCrew, "PATROL", 10)
  assert.strictEqual(tickResult.isStarvation, true)
  assert.strictEqual(tickResult.moraleImpact, -15)
  assert.strictEqual(cargo.food, 0)
})

test("10. Daily Logistics Tick: Energy depletion in transit triggers Stranded in space state", () => {
  const cargo = createFleetCargo({ food: 100, energy: 3 })
  const ships = [createShipInstance({ definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", instanceId: "c1" })] // needs 7 energy in transit

  const tickResult = processDailyFleetLogisticsTick(cargo, ships, 20, "IN_TRANSIT", 12)
  assert.strictEqual(tickResult.isStranded, true)
  assert.strictEqual(cargo.energy, 0)
})

test("11. Two-way cargo transfer between Base inventory and Fleet cargo with capacity constraint", () => {
  const baseLedger: WorldResourceLedger = {
    food: 1000,
    energy: 2000,
    logisticsSupplies: 500,
    industrialMaterials: 400,
    tacticalData: 100,
  }
  const fleetCargo = createFleetCargo({ food: 100, energy: 200, logisticsSupplies: 50, industrialMaterials: 50, tacticalData: 10 })

  // Max fleet capacity: 1000
  const currentWeight = calculateFleetCargoCurrentWeight(fleetCargo) // 410

  // Transfer 200 food from Base to Fleet
  const transferRes = transferCargoBetweenBaseAndFleet(
    baseLedger,
    fleetCargo,
    { food: 200 },
    "BASE_TO_FLEET",
    1000
  )
  assert.strictEqual(transferRes.success, true)
  assert.strictEqual(baseLedger.food, 800)
  assert.strictEqual(fleetCargo.food, 300)

  // Over-capacity transfer attempt
  const overTransfer = transferCargoBetweenBaseAndFleet(
    baseLedger,
    fleetCargo,
    { energy: 1000 },
    "BASE_TO_FLEET",
    1000
  )
  assert.strictEqual(overTransfer.success, false)
  assert.ok(overTransfer.error?.includes("Fleet cargo capacity exceeded"))
})

test("12. Fleet Combat Readiness evaluation (hull integrity, crew efficiency, morale)", () => {
  const fleet = createFleetEntity({
    fleetId: "readiness_fleet",
    name: "Readiness Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })

  const ship = createShipInstance({ definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER", instanceId: "ship_r1" })
  ship.canOperate = true
  addShipToFleet(fleet, ship)

  const readiness = evaluateFleetReadiness(fleet.ships, fleet.personnel)
  assert.ok(readiness.overallReadinessPercent >= 60)
  assert.strictEqual(readiness.isCombatReady, true)
  assert.strictEqual(readiness.deficiencies.length, 0)
})

test("13. Autonomous Fleet AI Decision: Tactical retreat when damage exceeds persona threshold", () => {
  const fleet = createFleetEntity({
    fleetId: "retreat_fleet",
    name: "Retreat Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })
  fleet.aiPersona = "AGGRESSIVE_VANGUARD" // threshold 25%

  const damagedShip = createShipInstance({ definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER", instanceId: "damaged_ship" })
  damagedShip.hullHp = Math.round(damagedShip.maxHullHp * 0.15) // 15% hull remaining
  addShipToFleet(fleet, damagedShip)

  const decisionResult = evaluateFleetAutonomousDecision(
    fleet.aiPersona,
    fleet.ships,
    fleet.personnel,
    60,
    false
  )

  assert.strictEqual(decisionResult.decision, "RETREAT_TO_BASE")
  assert.ok(decisionResult.reason.includes("Tổn thất vượt ngưỡng an toàn"))
})

test("14. Autonomous Fleet AI Decision: National Emergency Command response (Capital Under Siege)", () => {
  const fleet = createFleetEntity({
    fleetId: "emergency_fleet",
    name: "Emergency Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
  })

  const ship = createShipInstance({ definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER", instanceId: "ready_ship" })
  ship.canOperate = true
  addShipToFleet(fleet, ship)

  const decisionResult = evaluateFleetAutonomousDecision(
    fleet.aiPersona,
    fleet.ships,
    fleet.personnel,
    20,
    true // Capital under siege!
  )

  assert.strictEqual(decisionResult.decision, "ANSWER_NATIONAL_EMERGENCY")
  assert.ok(decisionResult.reason.includes("Bảo vệ Thủ phủ Quốc gia"))
})

test("15. Hyperlane transit journey departure and advance to destination sector arrival", () => {
  const fleet = createFleetEntity({
    fleetId: "transit_fleet",
    name: "Transit Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    initialBaseId: "base_sol_hq",
  })

  // Depart for Sector Orion (2 hops)
  const orderRes = orderFleetTransit(fleet, "SEC_ORION_OUTPOST", 2, 100)
  assert.strictEqual(orderRes.success, true)
  assert.strictEqual(fleet.operationalStatus, "IN_TRANSIT")
  assert.strictEqual(fleet.currentLocation.isHyperlaneTransit, true)
  assert.strictEqual(fleet.currentLocation.baseId, undefined)
  assert.strictEqual(orderRes.travelDays, 2)

  // Day 1
  const adv1 = advanceFleetTransit(fleet, 101)
  assert.strictEqual(adv1.hasArrived, false)
  assert.strictEqual(fleet.currentLocation.transitRemainingDays, 1)

  // Day 2 (Arrival)
  const adv2 = advanceFleetTransit(fleet, 102)
  assert.strictEqual(adv2.hasArrived, true)
  assert.strictEqual(adv2.arrivedSectorId, "SEC_ORION_OUTPOST")
  assert.strictEqual(fleet.currentLocation.sectorId, "SEC_ORION_OUTPOST")
  assert.strictEqual(fleet.currentLocation.isHyperlaneTransit, false)
  assert.strictEqual(fleet.operationalStatus, "PATROL")
})

test("16. Mutual Consent Fleet Merger: asset, credit, cargo transfer and service record unification", () => {
  const recipientFleet = createFleetEntity({
    fleetId: "fleet_recipient",
    name: "Recipient Heavy Fleet",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    fleetClassId: "FLEET_CLASS_MK3_TASK_FORCE", // max 16 ships
    initialCredits: 10000,
  })

  const sourceFleet = createFleetEntity({
    fleetId: "fleet_source",
    name: "Source Auxiliary Squad",
    ownerRef: { ownerType: "NATION", ownerId: "vss", nationId: "vss" },
    registeredHomeBaseId: "base_sol_hq",
    initialSectorId: "SEC_SOL_CORE",
    fleetClassId: "FLEET_CLASS_MK1_SQUAD",
    initialCredits: 3500,
  })

  const ship = createShipInstance({ definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", instanceId: "source_ship_1" })
  addShipToFleet(sourceFleet, ship)

  sourceFleet.serviceRecord.totalBattlesEngaged = 5
  sourceFleet.serviceRecord.victoriesCount = 4
  sourceFleet.serviceRecord.enemiesDestroyed = 12

  const mergeRes = mergeFleets(recipientFleet, sourceFleet, 150)
  assert.strictEqual(mergeRes.success, true)
  assert.strictEqual(mergeRes.shipsTransferred, 1)
  assert.strictEqual(mergeRes.creditsTransferred, 3500)

  // Verify recipient absorbed everything
  assert.strictEqual(recipientFleet.treasury.credits, 13500)
  assert.ok(recipientFleet.ships["source_ship_1"] !== undefined)
  assert.strictEqual(recipientFleet.serviceRecord.totalBattlesEngaged, 5)
  assert.strictEqual(recipientFleet.serviceRecord.victoriesCount, 4)
  assert.strictEqual(recipientFleet.serviceRecord.enemiesDestroyed, 12)

  // Verify source fleet is disbanded
  assert.strictEqual(sourceFleet.lifecycleState, "DISBANDED")
  assert.strictEqual(sourceFleet.operationalStatus, "DISBANDED")
  assert.strictEqual(sourceFleet.treasury.credits, 0)
})
