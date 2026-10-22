/**
 * STARFRONT WORLD — Phase 7.3 Hybrid Workforce, Academy & Crew Pool Test Suite
 *
 * Verifies:
 * 1. Hybrid Workforce Dual-Track Architecture: Named Pilots vs Fleet Crew Pool
 * 2. Fleet Leadership: Appoint & Relieve Captain and Executive Officer (XO)
 * 3. Ship Captain appointment & relief on individual vessels
 * 4. Temporary Detached Duty (Biệt phái tạm thời) & automatic return on expiration
 * 5. 3-Pass Workforce Allocator: Pass 1 Minimum Staffing (canOperate = true)
 * 6. 3-Pass Workforce Allocator: Pass 2 Target Staffing (100% operational efficiency)
 * 7. 3-Pass Workforce Allocator: Pass 3 Maximum Buff Staffing (125% efficiency boost for Flagship)
 * 8. Severe crew shortfall prioritization & understaffed flag (canOperate = false)
 * 9. Base Naval Academy (NAVAL_ACADEMY): Recruitment from Base population & headcount conservation
 * 10. Base Naval Academy: Graduation settlement across Game Days & integration into fleet idle pool
 * 11. No-Teleport Invariant: Hyperlane travel duration for in-transit personnel transfers
 * 12. In-Transit arrival settlement at destination fleet
 * 13. Fleet battle casualties deduction, pro-rata ship impact & morale reduction
 * 14. Formal discharge from Fleet crew pool back into Base available population
 * 15. Master Catalog resolution for Academy Training Profiles
 */

import test from "node:test"
import assert from "node:assert"

import { bootstrapWorldCatalogs } from "../../lib/game/world/bootstrap"
import { createShipInstance } from "../../lib/game/world/ship/ship-entity"
import {
  createFleetPersonnelState,
  appointFleetCaptain,
  relieveFleetCaptain,
  appointFleetExecutiveOfficer,
  relieveFleetExecutiveOfficer,
  appointShipCaptain,
  relieveShipCaptain,
  assignPilotDetachedDuty,
  processDetachedDutyReturns,
  allocateFleetCrewToShips,
  startNavalAcademyTraining,
  processNavalAcademyGraduation,
  dispatchPersonnelTransfer,
  processPersonnelArrival,
  applyFleetBattleCasualties,
  dischargeCrewToBase,
  type NamedPilotRef,
} from "../../lib/game/world/fleet/fleet-personnel"
import { getAcademyTrainingProfile } from "../../lib/game/world/fleet/registry-integration"
import type { BasePopulationState } from "../../lib/game/world/population/types"

// Ensure all catalogs are bootstrapped
bootstrapWorldCatalogs()

/**
 * Helper to build a standard BasePopulationState for tests
 */
function createMockBasePopulationState(baseId = "base_sol_command_hq"): BasePopulationState {
  return {
    baseId,
    populationCapacityTotal: 5000,
    populationCurrent: 3000,
    populationAvailable: 1500,
    populationOccupied: 1500,
    breakdown: {
      RESIDENT: 2500,
      EXTERNAL_WORKER: 300,
      VISITOR: 200,
      FLEET_CREW: 0,
      REFUGEE: 0,
    },
    workforceByCategory: {
      COMMAND: 100,
      RESEARCH: 200,
      EXTRACTION: 300,
      REFINING: 300,
      MANUFACTURING: 300,
      LOGISTICS: 200,
      DEFENSE: 100,
      MEDICAL: 50,
      AGRICULTURE: 100,
      FLEET_CREW: 0,
    },
  }
}

test("1. Hybrid Workforce Architecture: Named Pilots vs Fleet Crew Pool separation", () => {
  const personnelState = createFleetPersonnelState({
    fleetId: "fleet_vanguard_01",
    homeBaseId: "base_sol_command_hq",
  })

  // Crew Pool tracks bulk operational headcount
  assert.strictEqual(personnelState.crewPool.fleetId, "fleet_vanguard_01")
  assert.strictEqual(personnelState.crewPool.totalCrew, 0)
  assert.strictEqual(personnelState.crewPool.crewIdle, 0)
  assert.strictEqual(personnelState.crewPool.crewAssigned, 0)
  assert.strictEqual(personnelState.crewPool.crewReserve, 0)

  // Named Pilots map tracks individual leaders
  assert.deepStrictEqual(personnelState.assignedPilots, {})
  assert.strictEqual(personnelState.captain, undefined)
  assert.strictEqual(personnelState.executiveOfficer, undefined)
  assert.strictEqual(personnelState.morale, 85)
})

test("2. Fleet Leadership: Appoint & Relieve Captain and Executive Officer (XO)", () => {
  const personnelState = createFleetPersonnelState({
    fleetId: "fleet_vanguard_01",
    homeBaseId: "base_sol_command_hq",
  })

  const pilotAlviss: NamedPilotRef = {
    pilotId: "pilot_alviss_01",
    pilotName: "Alviss Vanguard",
    callsign: "Valkyrie-1",
    rank: "COMMODORE",
    status: "ACTIVE_DUTY",
  }

  const pilotElena: NamedPilotRef = {
    pilotId: "pilot_elena_02",
    pilotName: "Elena Rostova",
    callsign: "Aegis",
    rank: "COMMANDER",
    status: "ACTIVE_DUTY",
  }

  // Appoint Captain
  const resCap = appointFleetCaptain(personnelState, pilotAlviss)
  assert.strictEqual(resCap.success, true)
  assert.strictEqual(personnelState.captain?.pilotId, "pilot_alviss_01")
  assert.strictEqual(personnelState.captain?.currentRole, "CAPTAIN")
  assert.strictEqual(personnelState.captain?.assignedFleetId, "fleet_vanguard_01")
  assert.ok(personnelState.assignedPilots["pilot_alviss_01"])

  // Appoint Executive Officer
  const resXO = appointFleetExecutiveOfficer(personnelState, pilotElena)
  assert.strictEqual(resXO.success, true)
  assert.strictEqual(personnelState.executiveOfficer?.pilotId, "pilot_elena_02")
  assert.strictEqual(personnelState.executiveOfficer?.currentRole, "EXECUTIVE_OFFICER")

  // Relieve Captain
  const resRelieve = relieveFleetCaptain(personnelState)
  assert.strictEqual(resRelieve.success, true)
  assert.strictEqual(resRelieve.relievedCaptain?.pilotId, "pilot_alviss_01")
  assert.strictEqual(personnelState.captain, undefined)
  assert.strictEqual(pilotAlviss.status, "SHORE_LEAVE")
})

test("3. Ship Captain appointment & relief on individual vessels", () => {
  const personnelState = createFleetPersonnelState({
    fleetId: "fleet_vanguard_01",
    homeBaseId: "base_sol_command_hq",
  })

  const ship = createShipInstance({
    instanceId: "ship_lead_cruiser",
    definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER",
    ownerRef: {
      ownerType: "NATIONAL",
      ownerId: "vss",
      ownerName: "VSS",
      factionId: "vss",
    },
    currentSectorId: "sol_command_hq",
  })

  const pilotMarcus: NamedPilotRef = {
    pilotId: "pilot_marcus_03",
    pilotName: "Marcus Vance",
    rank: "CAPTAIN",
    status: "ACTIVE_DUTY",
  }

  // Appoint Ship Captain
  const resAppoint = appointShipCaptain(personnelState, ship, pilotMarcus)
  assert.strictEqual(resAppoint.success, true)
  assert.strictEqual(ship.assignedPilotId, "pilot_marcus_03")
  assert.strictEqual(pilotMarcus.assignedShipId, "ship_lead_cruiser")
  assert.strictEqual(pilotMarcus.currentRole, "SHIP_CAPTAIN")

  // Relieve Ship Captain
  const resRelieve = relieveShipCaptain(personnelState, ship)
  assert.strictEqual(resRelieve.success, true)
  assert.strictEqual(ship.assignedPilotId, undefined)
  assert.strictEqual(pilotMarcus.assignedShipId, undefined)
  assert.strictEqual(pilotMarcus.status, "SHORE_LEAVE")
})

test("4. Temporary Detached Duty (Biệt phái tạm thời) & automatic return on expiration", () => {
  const pilot: NamedPilotRef = {
    pilotId: "pilot_advisor_04",
    pilotName: "Dr. Aris Thorne",
    rank: "COMMANDER",
    status: "ACTIVE_DUTY",
    assignedFleetId: "fleet_home_01",
  }

  // Assign to Detached Duty for 10 Game Days (Day 5 -> Return on Day 15)
  const assignRes = assignPilotDetachedDuty(pilot, {
    targetFleetId: "fleet_expedition_02",
    durationDays: 10,
    gameDay: 5,
    reason: "Tactical Sensor Integration Advisor",
  })

  assert.strictEqual(assignRes.success, true)
  assert.strictEqual(assignRes.returnGameDay, 15)
  assert.strictEqual(pilot.status, "DETACHED_DUTY")
  assert.strictEqual(pilot.detachedDuty?.targetFleetId, "fleet_expedition_02")

  // Check on Game Day 10 (not yet expired)
  const checkEarly = processDetachedDutyReturns([pilot], 10)
  assert.strictEqual(checkEarly.returnedPilots.length, 0)
  assert.strictEqual(checkEarly.remainingDetached, 1)
  assert.strictEqual(pilot.status, "DETACHED_DUTY")

  // Check on Game Day 15 (expired -> automatically returns to active duty)
  const checkDue = processDetachedDutyReturns([pilot], 15)
  assert.strictEqual(checkDue.returnedPilots.length, 1)
  assert.strictEqual(checkDue.remainingDetached, 0)
  assert.strictEqual(pilot.status, "ACTIVE_DUTY")
  assert.strictEqual(pilot.detachedDuty, undefined)
})

test("5. 3-Pass Workforce Allocator: Pass 1 Minimum Staffing", () => {
  // Ship 1: Corvette (target 16, min 8, max 24)
  const corvette = createShipInstance({
    instanceId: "ship_corvette_1",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE",
    ownerRef: { ownerType: "NATIONAL", ownerId: "vss", ownerName: "VSS", factionId: "vss" },
    currentSectorId: "sol_command_hq",
  })

  // Ship 2: Cruiser (target 90, min 45, max 135)
  const cruiser = createShipInstance({
    instanceId: "ship_cruiser_1",
    definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER",
    ownerRef: { ownerType: "NATIONAL", ownerId: "vss", ownerName: "VSS", factionId: "vss" },
    currentSectorId: "sol_command_hq",
  })

  // Total minimum needed = 8 + 45 = 53
  // Provide exactly 53 idle crew: should fully satisfy Pass 1, 0 remaining for Pass 2
  const crewPool = {
    fleetId: "fleet_test_pass1",
    homeBaseId: "base_sol_command_hq",
    residentBaseId: "base_sol_command_hq",
    crewIdle: 53,
    crewAssigned: 0,
    crewReserve: 0,
    totalCrew: 53,
  }

  const report = allocateFleetCrewToShips(crewPool, [corvette, cruiser])

  assert.strictEqual(report.totalAssigned, 53)
  assert.strictEqual(report.pass1Total, 53)
  assert.strictEqual(report.pass2Total, 0)
  assert.strictEqual(report.pass3Total, 0)
  assert.strictEqual(report.idleCrewAfter, 0)
  assert.strictEqual(report.operationalShipsCount, 2)
  assert.strictEqual(report.understaffedShipsCount, 2) // Both are staffed at minimum (< target)

  // Both ships reached minimum -> canOperate = true
  assert.strictEqual(corvette.assignedCrewCount, 8)
  assert.strictEqual(cruiser.assignedCrewCount, 45)
})

test("6. 3-Pass Workforce Allocator: Pass 2 Target Staffing (100% operational efficiency)", () => {
  const corvette = createShipInstance({
    instanceId: "ship_corvette_2",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", // target 16, min 8, max 24
    ownerRef: { ownerType: "NATIONAL", ownerId: "vss", ownerName: "VSS", factionId: "vss" },
    currentSectorId: "sol_command_hq",
  })

  const cruiser = createShipInstance({
    instanceId: "ship_cruiser_2",
    definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER", // target 90, min 45, max 135
    ownerRef: { ownerType: "NATIONAL", ownerId: "vss", ownerName: "VSS", factionId: "vss" },
    currentSectorId: "sol_command_hq",
  })

  // Target needed = 16 + 90 = 106
  // Provide exactly 106 idle crew: Pass 1 consumes 53, Pass 2 consumes 53, Pass 3 consumes 0
  const crewPool = {
    fleetId: "fleet_test_pass2",
    homeBaseId: "base_sol_command_hq",
    residentBaseId: "base_sol_command_hq",
    crewIdle: 106,
    crewAssigned: 0,
    crewReserve: 0,
    totalCrew: 106,
  }

  const report = allocateFleetCrewToShips(crewPool, [corvette, cruiser])

  assert.strictEqual(report.totalAssigned, 106)
  assert.strictEqual(report.pass1Total, 53)
  assert.strictEqual(report.pass2Total, 53)
  assert.strictEqual(report.pass3Total, 0)
  assert.strictEqual(report.idleCrewAfter, 0)
  assert.strictEqual(report.understaffedShipsCount, 0) // Fully staffed to target!

  assert.strictEqual(corvette.assignedCrewCount, 16)
  assert.strictEqual(cruiser.assignedCrewCount, 90)

  // Both ships operate at optimal 1.0 efficiency
  assert.strictEqual(report.shipAllocations["ship_corvette_2"].efficiency, 1.0)
  assert.strictEqual(report.shipAllocations["ship_cruiser_2"].efficiency, 1.0)
})

test("7. 3-Pass Workforce Allocator: Pass 3 Maximum Buff Staffing (125% efficiency boost)", () => {
  const corvette = createShipInstance({
    instanceId: "ship_corvette_3",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", // target 16, min 8, max 24
    ownerRef: { ownerType: "NATIONAL", ownerId: "vss", ownerName: "VSS", factionId: "vss" },
    currentSectorId: "sol_command_hq",
  })

  // Provide surplus crew (50 idle crew for 1 corvette)
  // Max crew = 24. Surplus remaining in idle = 50 - 24 = 26
  const crewPool = {
    fleetId: "fleet_test_pass3",
    homeBaseId: "base_sol_command_hq",
    residentBaseId: "base_sol_command_hq",
    crewIdle: 50,
    crewAssigned: 0,
    crewReserve: 0,
    totalCrew: 50,
  }

  const report = allocateFleetCrewToShips(crewPool, [corvette])

  assert.strictEqual(report.totalAssigned, 24)
  assert.strictEqual(report.pass1Total, 8)
  assert.strictEqual(report.pass2Total, 8)
  assert.strictEqual(report.pass3Total, 8)
  assert.strictEqual(report.idleCrewAfter, 26) // Surplus kept in idle
  assert.strictEqual(report.buffedShipsCount, 1)

  assert.strictEqual(corvette.assignedCrewCount, 24)
  assert.strictEqual(report.shipAllocations["ship_corvette_3"].efficiency, 1.25)
  assert.strictEqual(report.shipAllocations["ship_corvette_3"].canOperate, true)
})

test("8. Severe crew shortfall prioritization & understaffed flag (canOperate = false)", () => {
  const flagship = createShipInstance({
    instanceId: "ship_flagship",
    definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER", // target 90, min 45, max 135
    ownerRef: { ownerType: "NATIONAL", ownerId: "vss", ownerName: "VSS", factionId: "vss" },
    currentSectorId: "sol_command_hq",
  })

  const escort = createShipInstance({
    instanceId: "ship_escort",
    definitionId: "SHIP_DEF_SOL_VALIANT_CORVETTE", // target 16, min 8, max 24
    ownerRef: { ownerType: "NATIONAL", ownerId: "vss", ownerName: "VSS", factionId: "vss" },
    currentSectorId: "sol_command_hq",
  })

  // Only 48 crew available: Flagship requires 45 min, leaves only 3 for Escort (< 8 min)
  const crewPool = {
    fleetId: "fleet_shortfall",
    homeBaseId: "base_sol_command_hq",
    residentBaseId: "base_sol_command_hq",
    crewIdle: 48,
    crewAssigned: 0,
    crewReserve: 0,
    totalCrew: 48,
  }

  const report = allocateFleetCrewToShips(crewPool, [flagship, escort], {
    prioritizeFlagshipId: "ship_flagship",
  })

  assert.strictEqual(report.totalAssigned, 48)
  assert.strictEqual(flagship.assignedCrewCount, 45)
  assert.strictEqual(escort.assignedCrewCount, 3)

  // Flagship reached minimum -> operational
  assert.strictEqual(report.shipAllocations["ship_flagship"].canOperate, true)

  // Escort got only 3 (< 8 min) -> cannot operate
  assert.strictEqual(report.shipAllocations["ship_escort"].canOperate, false)
  assert.strictEqual(report.shipAllocations["ship_escort"].efficiency, 0.4)
  assert.strictEqual(report.operationalShipsCount, 1)
})

test("9. Base Naval Academy (NAVAL_ACADEMY): Recruitment from Base population & headcount conservation", () => {
  const baseState = createMockBasePopulationState()
  const initialAvailable = baseState.populationAvailable
  const initialOccupied = baseState.populationOccupied
  const initialFleetCrewBreakdown = baseState.breakdown.FLEET_CREW || 0

  const baseResources = {
    credits: 5000,
    food: 1000,
    logisticsSupplies: 500,
  }

  // Start training cohort of 100 recruits (duration 14 days, from Day 10 -> Day 24)
  const res = startNavalAcademyTraining({
    baseState,
    baseResources,
    traineeCount: 100,
    gameDay: 10,
    targetFleetId: "fleet_vanguard_01",
  })

  assert.strictEqual(res.success, true)
  assert.ok(res.batch)
  assert.strictEqual(res.batch.traineeCount, 100)
  assert.strictEqual(res.batch.startedGameDay, 10)
  assert.strictEqual(res.batch.completionGameDay, 24)
  assert.strictEqual(res.batch.status, "TRAINING")

  // Verify Zero-Sum Population Conservation:
  // Base available decreases by exactly 100
  assert.strictEqual(baseState.populationAvailable, initialAvailable - 100)
  assert.strictEqual(baseState.populationOccupied, initialOccupied + 100)
  assert.strictEqual(baseState.breakdown.FLEET_CREW, initialFleetCrewBreakdown + 100)

  // Verify resource costs deducted: 100 * 10 credits = 1000, 100 * 2 food = 200, 100 * 1 supplies = 100
  assert.strictEqual(baseResources.credits, 4000)
  assert.strictEqual(baseResources.food, 800)
  assert.strictEqual(baseResources.logisticsSupplies, 400)
})

test("10. Base Naval Academy: Graduation settlement across Game Days & integration into fleet idle pool", () => {
  const baseState = createMockBasePopulationState()
  const trainRes = startNavalAcademyTraining({
    baseState,
    traineeCount: 80,
    gameDay: 1,
    durationDays: 14,
    targetFleetId: "fleet_alpha",
  })

  assert.ok(trainRes.batch)
  const batches = [trainRes.batch]

  const fleetPool = {
    fleetId: "fleet_alpha",
    homeBaseId: "base_sol_command_hq",
    residentBaseId: "base_sol_command_hq",
    crewIdle: 20,
    crewAssigned: 0,
    crewReserve: 0,
    totalCrew: 20,
  }

  // Check on Day 10 (still in training)
  const gradEarly = processNavalAcademyGraduation(batches, 10, fleetPool)
  assert.strictEqual(gradEarly.graduatedBatches.length, 0)
  assert.strictEqual(gradEarly.totalGraduatedCount, 0)
  assert.strictEqual(fleetPool.crewIdle, 20)

  // Check on Day 15 (completed! 1 + 14 = 15)
  const gradDone = processNavalAcademyGraduation(batches, 15, fleetPool)
  assert.strictEqual(gradDone.graduatedBatches.length, 1)
  assert.strictEqual(gradDone.totalGraduatedCount, 80)
  assert.strictEqual(batches[0].status, "COMPLETED")

  // Successfully integrated into fleet idle crew
  assert.strictEqual(fleetPool.crewIdle, 100) // 20 + 80
  assert.strictEqual(fleetPool.totalCrew, 100)
})

test("11. No-Teleport Invariant: Hyperlane travel duration for in-transit personnel transfers", () => {
  const sourcePool = {
    fleetId: "fleet_source",
    homeBaseId: "base_sol",
    residentBaseId: "base_sol",
    crewIdle: 150,
    crewAssigned: 0,
    crewReserve: 0,
    totalCrew: 150,
  }

  // Transfer 50 crew across 3 hyperlane hops on Day 10
  const transferRes = dispatchPersonnelTransfer({
    sourceBaseId: "base_sol",
    destinationFleetId: "fleet_destination",
    destinationBaseId: "base_frontier",
    headcount: 50,
    departureGameDay: 10,
    hyperlaneHops: 3,
    sourcePool,
    reason: "Reinforcement dispatch",
  })

  assert.strictEqual(transferRes.success, true)
  assert.ok(transferRes.transfer)
  assert.strictEqual(transferRes.transfer.status, "IN_TRANSIT")
  assert.strictEqual(transferRes.transfer.startedGameDay, 10)
  assert.strictEqual(transferRes.transfer.estimatedArrivalGameDay, 13) // 10 + 3 hops = Day 13

  // Source pool deducted immediately
  assert.strictEqual(sourcePool.crewIdle, 100)
  assert.strictEqual(sourcePool.totalCrew, 100)
})

test("12. In-Transit arrival settlement at destination fleet", () => {
  const targetPool = {
    fleetId: "fleet_destination",
    homeBaseId: "base_frontier",
    residentBaseId: "base_frontier",
    crewIdle: 10,
    crewAssigned: 0,
    crewReserve: 0,
    totalCrew: 10,
  }

  const transfer = {
    transferId: "trans_test_01",
    sourceBaseId: "base_sol",
    destinationBaseId: "base_frontier",
    headcount: 50,
    category: "RESIDENT" as const,
    startedGameDay: 10,
    estimatedArrivalGameDay: 13,
    status: "IN_TRANSIT" as const,
    reason: "Reinforcement",
    metadata: {
      destinationFleetId: "fleet_destination",
    },
  }

  // Check on Day 12 (en route)
  const arriveEarly = processPersonnelArrival([transfer], 12, targetPool)
  assert.strictEqual(arriveEarly.arrivedCount, 0)
  assert.strictEqual(targetPool.crewIdle, 10)

  // Check on Day 13 (arrived!)
  const arriveDone = processPersonnelArrival([transfer], 13, targetPool)
  assert.strictEqual(arriveDone.arrivedCount, 50)
  assert.strictEqual(transfer.status, "COMPLETED")
  assert.strictEqual(transfer.actualArrivalGameDay, 13)
  assert.strictEqual(targetPool.crewIdle, 60) // 10 + 50
  assert.strictEqual(targetPool.totalCrew, 60)
})

test("13. Fleet battle casualties deduction, pro-rata ship impact & morale reduction", () => {
  const personnelState = createFleetPersonnelState({
    fleetId: "fleet_combat_test",
    homeBaseId: "base_sol",
    initialMorale: 90,
  })

  personnelState.crewPool.crewAssigned = 100
  personnelState.crewPool.totalCrew = 100

  const damagedShip = createShipInstance({
    instanceId: "ship_damaged_cruiser",
    definitionId: "SHIP_DEF_AEGIS_LINE_CRUISER",
    ownerRef: { ownerType: "NATIONAL", ownerId: "vss", ownerName: "VSS", factionId: "vss" },
    currentSectorId: "sol_command_hq",
    assignedCrewCount: 90,
  })
  damagedShip.hullHp = 8000 // Sustained combat damage (< maxHullHp 14500)

  // Apply 30 casualties on Day 20
  const casRes = applyFleetBattleCasualties(personnelState, [damagedShip], 30, 20, "Pirate ambush")

  assert.strictEqual(casRes.actualCasualtiesApplied, 30)
  assert.strictEqual(personnelState.crewPool.crewAssigned, 70)
  assert.strictEqual(personnelState.crewPool.totalCrew, 70)

  // Damaged ship took casualty reduction
  assert.ok(damagedShip.assignedCrewCount < 90)

  // Morale penalized (-3% for 30 casualties: 90 -> 87)
  assert.strictEqual(personnelState.morale, 87)
  assert.strictEqual(personnelState.casualtyHistory.length, 1)
  assert.strictEqual(personnelState.casualtyHistory[0].count, 30)
})

test("14. Formal discharge from Fleet crew pool back into Base available population", () => {
  const baseState = createMockBasePopulationState()
  const initialBaseAvail = baseState.populationAvailable
  const initialBaseOccupied = baseState.populationOccupied

  const fleetPool = {
    fleetId: "fleet_decommission",
    homeBaseId: "base_sol_command_hq",
    residentBaseId: "base_sol_command_hq",
    crewIdle: 60,
    crewAssigned: 0,
    crewReserve: 0,
    totalCrew: 60,
  }

  // Formally discharge 40 idle crew back to base
  const dischRes = dischargeCrewToBase(fleetPool, baseState, 40)

  assert.strictEqual(dischRes.success, true)
  assert.strictEqual(dischRes.dischargedCount, 40)

  // Fleet pool decreased by 40
  assert.strictEqual(fleetPool.crewIdle, 20)
  assert.strictEqual(fleetPool.totalCrew, 20)

  // Base available increased by 40
  assert.strictEqual(baseState.populationAvailable, initialBaseAvail + 40)
  assert.strictEqual(baseState.populationOccupied, initialBaseOccupied - 40)
})

test("15. Master Catalog resolution for Academy Training Profiles", () => {
  const basicCourse = getAcademyTrainingProfile("ACADEMY_COURSE_BASIC_CREW")
  assert.ok(basicCourse)
  assert.strictEqual(basicCourse.durationDays, 14)
  assert.strictEqual(basicCourse.costPerTrainee.credits, 10)
  assert.strictEqual(basicCourse.graduatedQualityRating, 1.0)

  const combatCourse = getAcademyTrainingProfile("ACADEMY_COURSE_COMBAT_CREW")
  assert.ok(combatCourse)
  assert.strictEqual(combatCourse.durationDays, 21)
  assert.strictEqual(combatCourse.graduatedQualityRating, 1.2)

  const officerCourse = getAcademyTrainingProfile("ACADEMY_COURSE_OFFICER_CADET")
  assert.ok(officerCourse)
  assert.strictEqual(officerCourse.durationDays, 45)
  assert.strictEqual(officerCourse.costPerTrainee.credits, 80)
})
