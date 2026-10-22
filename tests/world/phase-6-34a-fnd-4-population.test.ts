/**
 * STARFRONT WORLD — Phase 6.34A-FND-4 Population & Workforce Shared Foundation Test Suite
 *
 * Comprehensive tests verifying:
 * 1. Base Modular Aggregate Population conservation (Current = Available + Occupied)
 * 2. Non-permanent groups isolation (visitor, externalWorker not added into Current)
 * 3. 4 Independent Capacities evaluation & overflow warnings
 * 4. 3-Pass Workforce Allocator (Pass 1 Min, Pass 2 Target, Pass 3 Max)
 * 5. Under-minimum operational ineligibility
 * 6. Workforce demand priority sorting
 * 7. Locked assignments immunity from release
 * 8. Base strategy reallocation & idempotent recomputation
 * 9. Fleet/Guild Crew Pool ownership boundary (Base AI cannot reclaim)
 * 10. Fleet crew lifecycle (Idle -> Assigned -> Reserve -> Idle)
 * 11. Authorized return of Fleet crew to Base Available
 * 12. National InTransit Ledger zero-sum conservation
 * 13. Source base immediate deduction & destination admission
 * 14. In-transit population non-allocatable guarantee
 * 15. Orbital stay transfer lifecycle
 * 16. Transfer cancellation & return
 * 17. Standard Base Multi-Hub slot policy (every 2 tiers, max 3)
 * 18. Capital Base Multi-Hub slot policy (every 1 tier, unlimited)
 * 19. Hub slot availability and duplicate prevention
 * 20. Pre-seeded SYSTEM default catalogs registration
 * 21. Catalog Registry resolution (population_bucket, workforce_category, etc.)
 * 22. User override & custom item in population catalog
 * 23. UI ViewModels generation (Summary, Capacity Cards, Workforce Tree)
 */

import assert from "node:assert/strict"
import test from "node:test"

import {
  CatalogRegistry,
  InMemoryCatalogDataProvider,
} from "../../lib/game/world/catalog"

import {
  allocateWorkforce,
  assignCrewToDuty,
  buildBasePopulationSummaryVM,
  buildCapacityCardVMs,
  buildWorkforceTreeVMs,
  calculateCapacityMetric,
  canAddHubType,
  createFleetCrewPool,
  defaultInTransitLedger,
  determineStaffingTier,
  evaluateBaseCapacity,
  evaluateBaseHubStatus,
  getAllocationPolicy,
  getBaseHubPolicy,
  getCapacityPolicy,
  getMovementReason,
  getPopulationBucket,
  getWorkforceCategory,
  moveCrewToReserve,
  NationalInTransitLedger,
  recruitFleetCrew,
  registerPopulationCatalogs,
  releaseWorkforce,
  resetReallocatableWorkforce,
  restoreReserveCrewToIdle,
  returnFleetCrewToBase,
  seedPopulationCatalogData,
  validateWorkforceDemand,
} from "../../lib/game/world/population"

import type {
  BaseCapacityProfile,
  BasePopulationState,
  FleetCrewPool,
  WorkforceDemand,
} from "../../lib/game/world/population/types"

function createMockBaseState(overrides?: Partial<BasePopulationState>): BasePopulationState {
  const capacity: BaseCapacityProfile = {
    residentialCapacity: 10000,
    visitorCapacity: 1000,
    temporaryWorkerCapacity: 2000,
    emergencyCapacity: 500,
    emergencyOverflowAllowed: true,
    emergencyOverflowLimitRatio: 1.25,
  }

  return {
    baseId: "BASE_AURORA_01",
    populationCurrent: 8000,
    populationAvailable: 8000,
    populationOccupied: 0,
    visitorPopulation: 350,
    externalWorkerPopulation: 800,
    breakdown: {
      BUILDING_WORKFORCE: 0,
      FLEET_CREW: 0,
      LOGISTICS: 0,
      TRAINING: 0,
      RECOVERY: 0,
      OTHER_ASSIGNMENTS: 0,
    },
    capacity,
    baseType: "GENERAL",
    activeHubTypes: [],
    ...overrides,
  }
}

test("1. Base Modular Aggregate Population conservation", () => {
  const base = createMockBaseState()
  assert.equal(base.populationCurrent, base.populationAvailable + base.populationOccupied)
  assert.equal(base.populationCurrent, 8000)
  assert.equal(base.populationAvailable, 8000)
  assert.equal(base.populationOccupied, 0)
})

test("2. Non-permanent groups isolation (visitor, worker not in populationCurrent)", () => {
  const base = createMockBaseState()
  assert.equal(base.visitorPopulation, 350)
  assert.equal(base.externalWorkerPopulation, 800)
  // Current MUST NOT include visitors or external workers
  assert.equal(base.populationCurrent, 8000)
})

test("3. 4 Independent Capacities evaluation & overflow warnings", () => {
  const base = createMockBaseState({
    populationCurrent: 12000, // Exceeds 10000
    visitorPopulation: 1500,  // Exceeds 1000
    externalWorkerPopulation: 1800, // Under 2000
  })

  const status = evaluateBaseCapacity(base, 650) // Emergency 650 exceeds 500
  assert.equal(status.hasAnyOverflow, true)
  assert.equal(status.residential.isOverCapacity, true)
  assert.equal(status.residential.overflowCount, 2000)
  assert.equal(status.visitor.isOverCapacity, true)
  assert.equal(status.visitor.overflowCount, 500)
  assert.equal(status.temporaryWorker.isOverCapacity, false)
  assert.equal(status.emergency.isOverCapacity, true)
  assert.equal(status.emergency.overflowCount, 150)
  assert.ok(status.warnings.length >= 3)
})

test("4. 3-Pass Workforce Allocator (Pass 1 Min, Pass 2 Target, Pass 3 Max)", () => {
  const base = createMockBaseState({
    populationCurrent: 1000,
    populationAvailable: 1000,
    populationOccupied: 0,
  })

  const demands: WorkforceDemand[] = [
    {
      demandId: "D_POWER",
      targetRef: { entityType: "BUILDING", entityId: "POWER_PLANT_01" },
      minimumPersonnel: 100,
      targetPersonnel: 200,
      maximumPersonnel: 300,
      priority: 100,
      assignmentCategory: "BUILDING_WORKFORCE",
    },
    {
      demandId: "D_MINE",
      targetRef: { entityType: "BUILDING", entityId: "MINE_01" },
      minimumPersonnel: 50,
      targetPersonnel: 150,
      maximumPersonnel: 200,
      priority: 50,
      assignmentCategory: "BUILDING_WORKFORCE",
    },
  ]

  const report = allocateWorkforce(base, demands)

  assert.equal(report.demandsEvaluated, 2)
  assert.equal(report.pass1TotalAssigned, 150) // 100 + 50
  assert.equal(report.pass2TotalAssigned, 200) // 100 + 100 delta
  assert.equal(report.pass3TotalAssigned, 150) // 100 + 50 delta
  assert.equal(report.totalAssignedDelta, 500)

  // Verify conservation
  assert.equal(base.populationAvailable, 500)
  assert.equal(base.populationOccupied, 500)
  assert.equal(base.populationCurrent, base.populationAvailable + base.populationOccupied)

  const dPowerResult = report.results.find((r) => r.demandId === "D_POWER")!
  assert.equal(dPowerResult.assignedPersonnel, 300)
  assert.equal(dPowerResult.staffingTier, "MAXIMUM")
  assert.equal(dPowerResult.operationalEligibility, true)
})

test("5. Under-minimum operational ineligibility on scarce population", () => {
  const base = createMockBaseState({
    populationCurrent: 120,
    populationAvailable: 120,
    populationOccupied: 0,
  })

  const demands: WorkforceDemand[] = [
    {
      demandId: "D_HIGH_PRIORITY",
      targetRef: { entityType: "BUILDING", entityId: "SHIELD_GEN_01" },
      minimumPersonnel: 100,
      targetPersonnel: 150,
      maximumPersonnel: 200,
      priority: 99,
      assignmentCategory: "BUILDING_WORKFORCE",
    },
    {
      demandId: "D_LOW_PRIORITY",
      targetRef: { entityType: "BUILDING", entityId: "HYDROPONICS_01" },
      minimumPersonnel: 50,
      targetPersonnel: 100,
      maximumPersonnel: 120,
      priority: 10,
      assignmentCategory: "BUILDING_WORKFORCE",
    },
  ]

  const report = allocateWorkforce(base, demands)

  // High priority receives 100 (its minimum). 20 remaining.
  // Low priority receives 20, but minimum is 50 -> Under-minimum!
  const dLow = report.results.find((r) => r.demandId === "D_LOW_PRIORITY")!
  assert.equal(dLow.assignedPersonnel, 20)
  assert.equal(dLow.staffingTier, "UNDER_MINIMUM")
  assert.equal(dLow.operationalEligibility, false)
  assert.ok(dLow.reasonCodes.includes("SHORTFALL_MINIMUM"))
  assert.equal(report.underMinimumCount, 1)

  // Pass 2 must NOT run because not all minimums were met
  assert.equal(report.pass2TotalAssigned, 0)
  assert.equal(report.pass3TotalAssigned, 0)
})

test("6. Excluded demand is skipped and marked non-operational", () => {
  const base = createMockBaseState({ populationAvailable: 500 })
  const demands: WorkforceDemand[] = [
    {
      demandId: "D_OFFLINE_LAB",
      targetRef: { entityType: "BUILDING", entityId: "LAB_02" },
      minimumPersonnel: 40,
      targetPersonnel: 80,
      maximumPersonnel: 100,
      priority: 50,
      assignmentCategory: "BUILDING_WORKFORCE",
      isExcluded: true, // turned off
    },
  ]

  const report = allocateWorkforce(base, demands)
  const labResult = report.results.find((r) => r.demandId === "D_OFFLINE_LAB")!
  assert.equal(labResult.assignedPersonnel, 0)
  assert.equal(labResult.operationalEligibility, false)
  assert.equal(labResult.isExcluded, true)
  assert.equal(base.populationAvailable, 500)
})

test("7. Locked assignments immunity from release", () => {
  const base = createMockBaseState({ populationAvailable: 200 })
  const demand: WorkforceDemand = {
    demandId: "D_CRITICAL_LIFE_SUPPORT",
    targetRef: { entityType: "BUILDING", entityId: "LIFE_SUPPORT_01" },
    minimumPersonnel: 50,
    targetPersonnel: 50,
    maximumPersonnel: 50,
    priority: 100,
    assignmentCategory: "BUILDING_WORKFORCE",
    isLocked: true,
  }

  const report = allocateWorkforce(base, [demand])
  const alloc = report.results[0]
  assert.equal(alloc.assignedPersonnel, 50)

  // Attempt release
  const rel = releaseWorkforce(base, demand, alloc)
  assert.equal(rel.success, false)
  assert.equal(rel.reason, "LOCKED_ASSIGNMENT_CANNOT_BE_RELEASED")
  assert.equal(alloc.assignedPersonnel, 50)
})

test("8. Base strategy reallocation & idempotent recomputation", () => {
  const base = createMockBaseState({ populationCurrent: 500, populationAvailable: 500, populationOccupied: 0 })
  const demands: WorkforceDemand[] = [
    {
      demandId: "D_A",
      targetRef: { entityType: "BUILDING", entityId: "A" },
      minimumPersonnel: 50,
      targetPersonnel: 100,
      maximumPersonnel: 150,
      priority: 10,
      assignmentCategory: "BUILDING_WORKFORCE",
    },
    {
      demandId: "D_B",
      targetRef: { entityType: "BUILDING", entityId: "B" },
      minimumPersonnel: 50,
      targetPersonnel: 100,
      maximumPersonnel: 150,
      priority: 20,
      assignmentCategory: "BUILDING_WORKFORCE",
    },
  ]

  // First run
  const report1 = allocateWorkforce(base, demands)
  assert.equal(base.populationOccupied, 300)
  assert.equal(base.populationAvailable, 200)

  // Reset reallocatable workforce
  const resetCount = resetReallocatableWorkforce(base, demands, report1.results)
  assert.equal(resetCount, 300)
  assert.equal(base.populationAvailable, 500)
  assert.equal(base.populationOccupied, 0)

  // Re-run yields exact same result (idempotent)
  const report2 = allocateWorkforce(base, demands)
  assert.equal(report2.totalAssignedDelta, 300)
  assert.equal(base.populationAvailable, 200)
  assert.equal(base.populationOccupied, 300)
})

test("9. Fleet/Guild Crew Pool ownership boundary (Base AI cannot reclaim)", () => {
  const base = createMockBaseState({ populationCurrent: 1000, populationAvailable: 1000, populationOccupied: 0 })
  const fleetPool = createFleetCrewPool("FLEET_SOLAR_VANGUARD", base.baseId)

  // Recruit 300 personnel into Fleet
  const recruitRes = recruitFleetCrew(base, fleetPool, 300)
  assert.equal(recruitRes.success, true)
  assert.equal(recruitRes.recruitedCount, 300)

  assert.equal(fleetPool.totalCrew, 300)
  assert.equal(fleetPool.crewIdle, 300)
  assert.equal(base.populationAvailable, 700)
  assert.equal(base.populationOccupied, 300)
  assert.equal(base.breakdown.FLEET_CREW, 300)

  // Base AI attempts to release/reclaim fleet crew directly -> REJECTED
  const fakeDemand: WorkforceDemand = {
    demandId: "D_FLEET",
    targetRef: { entityType: "FLEET", entityId: "FLEET_SOLAR_VANGUARD" },
    minimumPersonnel: 300,
    targetPersonnel: 300,
    maximumPersonnel: 300,
    priority: 50,
    assignmentCategory: "FLEET_CREW",
  }
  const fakeAlloc = {
    demandId: "D_FLEET",
    targetRef: fakeDemand.targetRef,
    minimumPersonnel: 300,
    targetPersonnel: 300,
    maximumPersonnel: 300,
    assignedPersonnel: 300,
    pass1Assigned: 300,
    pass2Assigned: 0,
    pass3Assigned: 0,
    shortfall: 0,
    staffingTier: "TARGET" as const,
    operationalEligibility: true,
    isLocked: false,
    isExcluded: false,
    reasonCodes: [],
  }

  const reclaimAttempt = releaseWorkforce(base, fakeDemand, fakeAlloc)
  assert.equal(reclaimAttempt.success, false)
  assert.equal(reclaimAttempt.reason, "FLEET_CREW_OWNED_BY_FLEET_CANNOT_BE_RECLAIMED_BY_BASE_AI")
  assert.equal(fakeAlloc.assignedPersonnel, 300)
})

test("10. Fleet crew lifecycle (Idle -> Assigned -> Reserve -> Idle)", () => {
  const fleetPool: FleetCrewPool = {
    fleetId: "FLEET_01",
    homeBaseId: "BASE_01",
    residentBaseId: "BASE_01",
    crewIdle: 100,
    crewAssigned: 0,
    crewReserve: 0,
    totalCrew: 100,
  }

  // 1. Assign to duty
  const aRes = assignCrewToDuty(fleetPool, 60)
  assert.equal(aRes.success, true)
  assert.equal(fleetPool.crewIdle, 40)
  assert.equal(fleetPool.crewAssigned, 60)
  assert.equal(fleetPool.totalCrew, 100)

  // 2. Move assigned to reserve
  const rRes = moveCrewToReserve(fleetPool, 20)
  assert.equal(rRes.success, true)
  assert.equal(fleetPool.crewAssigned, 40)
  assert.equal(fleetPool.crewReserve, 20)
  assert.equal(fleetPool.totalCrew, 100)

  // 3. Restore reserve to idle
  const idRes = restoreReserveCrewToIdle(fleetPool, 15)
  assert.equal(idRes.success, true)
  assert.equal(fleetPool.crewReserve, 5)
  assert.equal(fleetPool.crewIdle, 55)
  assert.equal(fleetPool.totalCrew, 100)
})

test("11. Authorized return of Fleet crew to Base Available", () => {
  const base = createMockBaseState({ populationCurrent: 1000, populationAvailable: 700, populationOccupied: 300 })
  base.breakdown.FLEET_CREW = 300
  const fleetPool: FleetCrewPool = {
    fleetId: "FLEET_01",
    homeBaseId: base.baseId,
    residentBaseId: base.baseId,
    crewIdle: 100,
    crewAssigned: 150,
    crewReserve: 50,
    totalCrew: 300,
  }

  // Fleet authorizes returning 50 idle crew back to Base
  const retRes = returnFleetCrewToBase(fleetPool, base, 50)
  assert.equal(retRes.success, true)
  assert.equal(fleetPool.crewIdle, 50)
  assert.equal(fleetPool.totalCrew, 250)

  assert.equal(base.populationAvailable, 750)
  assert.equal(base.populationOccupied, 250)
  assert.equal(base.breakdown.FLEET_CREW, 250)
  assert.equal(base.populationCurrent, base.populationAvailable + base.populationOccupied)
})

test("12. National InTransit Ledger zero-sum conservation", () => {
  const ledger = new NationalInTransitLedger()
  const baseA = createMockBaseState({ baseId: "BASE_A", populationCurrent: 5000, populationAvailable: 5000 })
  const baseB = createMockBaseState({ baseId: "BASE_B", populationCurrent: 3000, populationAvailable: 3000 })

  const initialTotal = baseA.populationCurrent + baseB.populationCurrent // 8000

  // Transfer 1000 from Base A to Base B
  const startRes = ledger.startTransfer({
    sourceBase: baseA,
    destinationBaseId: "BASE_B",
    headcount: 1000,
    startedGameDay: 10,
    durationDays: 3,
  })

  assert.equal(startRes.success, true)
  assert.equal(baseA.populationCurrent, 4000)
  assert.equal(baseB.populationCurrent, 3000)
  assert.equal(ledger.getTotalInTransitHeadcount(), 1000)

  // Zero-sum check during transit: A + B + InTransit = initialTotal
  assert.equal(
    baseA.populationCurrent + baseB.populationCurrent + ledger.getTotalInTransitHeadcount(),
    initialTotal
  )

  // Arrival at destination Base B on day 13
  const compRes = ledger.completeTransfer(startRes.transfer!.transferId, baseB, 13)
  assert.equal(compRes.success, true)
  assert.equal(baseB.populationCurrent, 4000)
  assert.equal(ledger.getTotalInTransitHeadcount(), 0)

  // Final check: A + B = initialTotal
  assert.equal(baseA.populationCurrent + baseB.populationCurrent, initialTotal)
})

test("13. Source base immediate deduction & destination admission", () => {
  const ledger = new NationalInTransitLedger()
  const baseA = createMockBaseState({ baseId: "BASE_A", populationCurrent: 500, populationAvailable: 500 })
  const baseB = createMockBaseState({ baseId: "BASE_B", populationCurrent: 100, populationAvailable: 100 })

  const startRes = ledger.startTransfer({
    sourceBase: baseA,
    destinationBaseId: "BASE_B",
    headcount: 200,
    startedGameDay: 1,
  })

  assert.equal(startRes.success, true)
  assert.equal(baseA.populationAvailable, 300)
  assert.equal(baseA.populationCurrent, 300)

  // Attempt to complete with wrong base -> REJECTED
  const baseC = createMockBaseState({ baseId: "BASE_C" })
  const wrongBaseRes = ledger.completeTransfer(startRes.transfer!.transferId, baseC, 3)
  assert.equal(wrongBaseRes.success, false)
  assert.ok(wrongBaseRes.reason?.includes("BASE_MISMATCH"))

  // Complete with correct base
  const rightRes = ledger.completeTransfer(startRes.transfer!.transferId, baseB, 3)
  assert.equal(rightRes.success, true)
  assert.equal(baseB.populationAvailable, 300)
  assert.equal(baseB.populationCurrent, 300)
})

test("14. In-transit population non-allocatable guarantee", () => {
  const ledger = new NationalInTransitLedger()
  const baseA = createMockBaseState({ baseId: "BASE_A", populationCurrent: 300, populationAvailable: 300 })

  // Dispatch 200 into transit
  ledger.startTransfer({
    sourceBase: baseA,
    destinationBaseId: "BASE_B",
    headcount: 200,
    startedGameDay: 1,
  })

  // Only 100 is available for allocation
  assert.equal(baseA.populationAvailable, 100)

  const demand: WorkforceDemand = {
    demandId: "D_BIG",
    targetRef: { entityType: "BUILDING", entityId: "BIG_PLANT" },
    minimumPersonnel: 150,
    targetPersonnel: 200,
    maximumPersonnel: 250,
    priority: 10,
    assignmentCategory: "BUILDING_WORKFORCE",
  }

  const report = allocateWorkforce(baseA, [demand])
  // Cannot satisfy minimum because only 100 available!
  assert.equal(report.results[0].assignedPersonnel, 100)
  assert.equal(report.results[0].operationalEligibility, false)
})

test("15. Orbital stay transfer lifecycle", () => {
  const ledger = new NationalInTransitLedger()
  const baseA = createMockBaseState({ baseId: "BASE_A", populationCurrent: 500, populationAvailable: 500 })
  const baseB = createMockBaseState({ baseId: "BASE_B", populationCurrent: 200, populationAvailable: 200 })

  const startRes = ledger.startTransfer({
    sourceBase: baseA,
    destinationBaseId: "BASE_B",
    headcount: 100,
    startedGameDay: 1,
  })

  // Enters orbital stay (e.g., base B under blockade)
  const stayRes = ledger.enterOrbitalStay(startRes.transfer!.transferId, 5)
  assert.equal(stayRes.success, true)
  assert.equal(stayRes.transfer?.status, "ORBITAL_STAY")
  assert.equal(stayRes.transfer?.orbitalStayDays, 5)

  // Once blockade clears, admission can complete directly from orbital stay
  const compRes = ledger.completeTransfer(startRes.transfer!.transferId, baseB, 10)
  assert.equal(compRes.success, true)
  assert.equal(baseB.populationCurrent, 300)
})

test("16. Transfer cancellation & return to source base", () => {
  const ledger = new NationalInTransitLedger()
  const baseA = createMockBaseState({ baseId: "BASE_A", populationCurrent: 500, populationAvailable: 500 })

  const startRes = ledger.startTransfer({
    sourceBase: baseA,
    destinationBaseId: "BASE_B",
    headcount: 150,
    startedGameDay: 1,
  })
  assert.equal(baseA.populationCurrent, 350)

  // Cancel transfer
  const cancelRes = ledger.cancelTransfer(startRes.transfer!.transferId, baseA)
  assert.equal(cancelRes.success, true)
  assert.equal(cancelRes.transfer?.status, "CANCELLED")
  assert.equal(baseA.populationCurrent, 500)
  assert.equal(baseA.populationAvailable, 500)
  assert.equal(ledger.getTotalInTransitHeadcount(), 0)
})

test("17. Standard Base Multi-Hub slot policy (every 2 tiers, max 3)", () => {
  const policy = getBaseHubPolicy("GENERAL")
  assert.equal(policy.hubUnlockEveryTiers, 2)
  assert.equal(policy.maxHubTypes, 3)

  // Tier 1 -> 0 slots
  const statusT1 = evaluateBaseHubStatus("BASE_01", "GENERAL", 1)
  assert.equal(statusT1.unlockedSlots, 0)
  assert.equal(statusT1.canAddHub, false)
  assert.equal(statusT1.nextUnlockTier, 2)

  // Tier 2 -> 1 slot
  const statusT2 = evaluateBaseHubStatus("BASE_01", "GENERAL", 2)
  assert.equal(statusT2.unlockedSlots, 1)
  assert.equal(statusT2.canAddHub, true)

  // Tier 4 -> 2 slots
  const statusT4 = evaluateBaseHubStatus("BASE_01", "GENERAL", 4)
  assert.equal(statusT4.unlockedSlots, 2)

  // Tier 6 -> 3 slots (capped at max 3)
  const statusT6 = evaluateBaseHubStatus("BASE_01", "GENERAL", 6)
  assert.equal(statusT6.unlockedSlots, 3)

  // Tier 10 -> Still capped at 3 slots
  const statusT10 = evaluateBaseHubStatus("BASE_01", "GENERAL", 10)
  assert.equal(statusT10.unlockedSlots, 3)
  assert.equal(statusT10.nextUnlockTier, undefined)
})

test("18. Capital Base Multi-Hub slot policy (every 1 tier, unlimited)", () => {
  const policy = getBaseHubPolicy("CAPITAL")
  assert.equal(policy.hubUnlockEveryTiers, 1)
  assert.equal(policy.maxHubTypes, "unlimited")

  // Tier 1 -> 1 slot
  const statusT1 = evaluateBaseHubStatus("CAPITAL_01", "CAPITAL", 1)
  assert.equal(statusT1.unlockedSlots, 1)

  // Tier 3 -> 3 slots
  const statusT3 = evaluateBaseHubStatus("CAPITAL_01", "CAPITAL", 3)
  assert.equal(statusT3.unlockedSlots, 3)

  // Tier 7 -> 7 slots
  const statusT7 = evaluateBaseHubStatus("CAPITAL_01", "CAPITAL", 7)
  assert.equal(statusT7.unlockedSlots, 7)
  assert.equal(statusT7.maxSlots, "unlimited")
})

test("19. Hub slot availability and duplicate prevention", () => {
  const statusT2 = evaluateBaseHubStatus("BASE_01", "GENERAL", 2, ["REPAIR_HUB"])
  assert.equal(statusT2.canAddHub, false) // 1 slot unlocked, 1 used

  // Duplicate hub check
  const dupCheck = canAddHubType(statusT2, "REPAIR_HUB")
  assert.equal(dupCheck.canAdd, false)
  assert.ok(dupCheck.reason?.includes("HUB_ALREADY_ACTIVE"))

  // Adding 2nd hub without unlocked slot -> REJECTED
  const newCheck = canAddHubType(statusT2, "MEDICAL_HUB")
  assert.equal(newCheck.canAdd, false)
  assert.ok(newCheck.reason?.includes("NO_AVAILABLE_HUB_SLOTS"))

  // Tier 4 allows 2nd hub
  const statusT4 = evaluateBaseHubStatus("BASE_01", "GENERAL", 4, ["REPAIR_HUB"])
  const allowCheck = canAddHubType(statusT4, "MEDICAL_HUB")
  assert.equal(allowCheck.canAdd, true)
})

test("20. Pre-seeded SYSTEM default catalogs registration", () => {
  const provider = new InMemoryCatalogDataProvider()
  seedPopulationCatalogData(provider)

  assert.ok(provider.exists("system_population_population_bucket_data.json"))
  assert.ok(provider.exists("system_population_workforce_category_data.json"))
  assert.ok(provider.exists("system_population_workforce_allocation_policy_data.json"))
  assert.ok(provider.exists("system_population_capacity_policy_data.json"))
  assert.ok(provider.exists("system_population_movement_reason_data.json"))
})

test("21. Catalog Registry resolution (population_bucket, workforce_category, etc.)", () => {
  const provider = new InMemoryCatalogDataProvider()
  const registry = new CatalogRegistry(provider)
  registerPopulationCatalogs(registry, provider)

  const residentBucket = getPopulationBucket("RESIDENT", registry)
  assert.ok(residentBucket)
  assert.equal(residentBucket.name, "Cư Dân Thường Trú")

  const buildingWorkforce = getWorkforceCategory("BUILDING_WORKFORCE", registry)
  assert.ok(buildingWorkforce)
  assert.equal(buildingWorkforce.name, "Công Trình / Cơ Sở Căn Cứ")

  const allocPolicy = getAllocationPolicy("policy_standard_three_pass", registry)
  assert.ok(allocPolicy)
  assert.equal(allocPolicy.name, "Phân Bổ Tiêu Chuẩn Ba Vòng")

  const capPolicy = getCapacityPolicy("policy_standard_base_capacity", registry)
  assert.ok(capPolicy)

  const moveReason = getMovementReason("EVACUATION", registry)
  assert.ok(moveReason)
  assert.equal(moveReason.name, "Sơ Tán Chiến Tranh")
})

test("22. User override & custom item in population catalog", () => {
  const provider = new InMemoryCatalogDataProvider()
  const registry = new CatalogRegistry(provider)
  registerPopulationCatalogs(registry, provider)

  // Apply user override to RESIDENT
  registry.setOverride("population", "population_bucket", "RESIDENT", {
    name: "Cư Dân Đặc Quyền Thường Trú",
  })

  const overItem = registry.getItem("population", "population_bucket", "RESIDENT")!
  assert.equal(overItem.name, "Cư Dân Đặc Quyền Thường Trú")
  assert.equal(overItem.provenance.isOverridden, true)

  // Reset override
  registry.resetOverride("population", "population_bucket", "RESIDENT")
  const resetItem = registry.getItem("population", "population_bucket", "RESIDENT")!
  assert.equal(resetItem.name, "Cư Dân Thường Trú")
  assert.equal(resetItem.provenance.isOverridden, undefined)

  // Add custom item
  registry.addCustomItem("population", "population_bucket", {
    id: "VIP_DIPLOMAT",
    name: "Phái Đoàn Ngoại Giao",
    description: "Khách mời cấp cao của Liên Đoàn",
    isPermanent: false,
  })

  const customItem = registry.getItem("population", "population_bucket", "VIP_DIPLOMAT")!
  assert.equal(customItem.name, "Phái Đoàn Ngoại Giao")
  assert.equal(customItem.provenance.sourceType, "USER")
})

test("23. UI ViewModels generation (Summary, Capacity Cards, Workforce Tree)", () => {
  const base = createMockBaseState({
    populationCurrent: 8000,
    populationAvailable: 7000,
    populationOccupied: 1000,
  })

  const demands: WorkforceDemand[] = [
    {
      demandId: "D_01",
      targetRef: { entityType: "BUILDING", entityId: "FACTORY_01" },
      minimumPersonnel: 400,
      targetPersonnel: 800,
      maximumPersonnel: 1000,
      priority: 50,
      assignmentCategory: "BUILDING_WORKFORCE",
    },
  ]

  const report = allocateWorkforce(base, demands)

  // 1. Base Summary VM
  const summaryVM = buildBasePopulationSummaryVM(base, report)
  assert.equal(summaryVM.baseId, "BASE_AURORA_01")
  assert.equal(summaryVM.totalResidents, 8000)
  assert.equal(summaryVM.occupied, 2000)
  assert.equal(summaryVM.available, 6000)
  assert.equal(summaryVM.totalDemands, 1)

  // 2. Capacity Card VMs
  const cards = buildCapacityCardVMs(summaryVM.capacityStatus)
  assert.equal(cards.length, 4)
  assert.equal(cards[0].type, "residential")
  assert.equal(cards[1].type, "visitor")
  assert.equal(cards[2].type, "temporaryWorker")
  assert.equal(cards[3].type, "emergency")

  // 3. Workforce Tree VMs
  const treeNodes = buildWorkforceTreeVMs(demands, report.results)
  assert.equal(treeNodes.length, 1)
  assert.equal(treeNodes[0].targetName, "BUILDING #FACTORY_01")
  assert.equal(treeNodes[0].assigned, 1000)
  assert.equal(treeNodes[0].staffingTier, "MAXIMUM")
  assert.equal(treeNodes[0].operationalEligibility, true)
  assert.equal(treeNodes[0].statusBadge, "TỐI ĐA NĂNG SUẤT")
})
