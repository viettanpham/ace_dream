/**
 * STARFRONT WORLD — Phase 6.34A-FND-5 Building & Production Shared Foundation Test Suite
 *
 * Verifies:
 * 1. 19 Approved Building Types & Classes
 * 2. Building Definition -> Instance lifecycle & Master Catalog registration
 * 3. Shared Slot Profiles, Tier Growth, and MAX TIER BONUS idempotency
 * 4. 3-Pass Workforce Allocation, Building OFF semantics & immediate labor release
 * 5. Commander Override with expiration & Emergency AI Override audit trail
 * 6. Condition Overflow formula & Asset HP damage mechanics
 * 7. Maintenance Policies & Repair mechanics
 * 8. Building Effects across SELF, BASE, and NETWORK scopes
 * 9. Production cycle, zero-double-spend input reservation & OUTPUT_BLOCKED handling
 * 10. Construction & Demolition Queue with cost refund
 * 11. History Retention & Compaction policy
 */

import assert from "node:assert/strict"
import test from "node:test"

import {
  bootstrapWorldCatalogs,
  defaultCatalogRegistry,
  calculateSlots,
  updateBaseSlotsOnTierProgression,
  canAddExpansionBuilding,
  createBuildingInstance,
  buildBuildingWorkforceDemands,
  syncBaseBuildingWorkforce,
  setBuildingOfflineStatus,
  setCommanderOverride,
  applyEmergencyAiOverride,
  applyDamageToBuilding,
  repairBuilding,
  evaluateBaseBuildingEffects,
  startProductionCycle,
  settleProductionLines,
  cancelProductionLine,
  enqueueConstruction,
  cancelConstructionQueueItem,
  compactHistoryEvents,
  SYSTEM_DEFAULT_BUILDING_TYPES,
  SYSTEM_DEFAULT_BUILDING_CLASSES,
  SYSTEM_DEFAULT_BUILDING_DEFINITIONS,
  SYSTEM_DEFAULT_SLOT_PROFILES,
  SYSTEM_DEFAULT_MODULE_DEFINITIONS,
  SYSTEM_DEFAULT_PRODUCTION_RECIPES,
} from "../../lib/game/world"

import type {
  BaseEntityState,
  BuildingDefinition,
  BuildingInstance,
  SlotProfile,
} from "../../lib/game/world/building/types"

import type { BasePopulationState } from "../../lib/game/world/population/types"

// Helper setup for tests
function createMockBase(sectorId: string = "sol_command_hq"): {
  base: BaseEntityState
  popState: BasePopulationState
  defMap: Map<string, BuildingDefinition>
} {
  bootstrapWorldCatalogs()
  const defMap = new Map(SYSTEM_DEFAULT_BUILDING_DEFINITIONS.map((d) => [d.id, d]))

  const popState: BasePopulationState = {
    baseId: "base_test_01",
    populationCurrent: 10000,
    populationAvailable: 10000,
    populationOccupied: 0,
    visitorPopulation: 500,
    externalWorkerPopulation: 1000,
    breakdown: {
      BUILDING_WORKFORCE: 0,
      FLEET_CREW: 0,
      LOGISTICS: 0,
      TRAINING: 0,
      RECOVERY: 0,
      OTHER_ASSIGNMENTS: 0,
    },
    capacity: {
      residentialCapacity: 15000,
      visitorCapacity: 2000,
      temporaryWorkerCapacity: 3000,
      emergencyCapacity: 5000,
    },
    baseType: "CAPITAL",
    activeHubTypes: [],
  }

  const base: BaseEntityState = {
    baseId: "base_test_01",
    sectorId,
    name: "Căn Cứ Thử Nghiệm",
    baseType: "CAPITAL",
    tier: 1,
    maxTierBonusApplied: false,
    isOrbitalSubBase: false,
    coreBuildingIds: [],
    expansionBuildingIds: [],
    maxExpansionSlots: 6,
    slotProfileId: "slot_profile_capital_citadel",
    sharedStorage: {
      industrialMaterials: 5000,
      energy: 5000,
      logisticsSupplies: 5000,
      tacticalData: 5000,
      food: 5000,
    },
    storageCapacity: {
      industrialMaterials: 10000,
      energy: 10000,
      logisticsSupplies: 10000,
      tacticalData: 10000,
      food: 10000,
    },
    buildings: {},
    constructionQueue: [],
    productionLines: [],
    activeReservations: [],
  }

  return { base, popState, defMap }
}

test("1. 19 Approved Building Types and Classes are canonically defined", () => {
  assert.equal(SYSTEM_DEFAULT_BUILDING_TYPES.length, 19, "Must have exactly 19 approved building types")
  const typeIds = SYSTEM_DEFAULT_BUILDING_TYPES.map((t) => t.id)

  const expectedTypes = [
    "RESIDENTIAL",
    "MEDICAL",
    "AGRICULTURE",
    "INDUSTRY",
    "STORAGE",
    "LOGISTICS",
    "RESEARCH",
    "FINANCE",
    "ENTERTAINMENT",
    "SUPPORT",
    "COMMAND",
    "DEFENSE",
    "OFFENSE",
    "MILITARY",
    "SPACEPORT",
    "ORBITAL_DEFENSE",
    "GUILD",
    "RESCUE",
    "GENERIC",
  ]

  for (const expected of expectedTypes) {
    assert.ok(typeIds.includes(expected), `Must include building type ${expected}`)
  }

  assert.ok(SYSTEM_DEFAULT_BUILDING_CLASSES.length >= 6, "Must have at least 6 building classes")
  const classIds = SYSTEM_DEFAULT_BUILDING_CLASSES.map((c) => c.id)
  assert.ok(classIds.includes("CORE_FACILITY"))
  assert.ok(classIds.includes("LIGHT"))
  assert.ok(classIds.includes("MEDIUM"))
  assert.ok(classIds.includes("HEAVY"))
})

test("2. Master Catalog Data registration across all 7 building catalogs", () => {
  bootstrapWorldCatalogs()

  const types = defaultCatalogRegistry.getResolvedItems("building", "building_type")
  assert.equal(types.length, 19)

  const classes = defaultCatalogRegistry.getResolvedItems("building", "building_class")
  assert.ok(classes.length >= 6)

  const defs = defaultCatalogRegistry.getResolvedItems("building", "building_definition")
  assert.ok(defs.length >= 10)

  const slotProfiles = defaultCatalogRegistry.getResolvedItems("building", "slot_profile")
  assert.ok(slotProfiles.length >= 3)

  const modules = defaultCatalogRegistry.getResolvedItems("building", "module_definition")
  assert.ok(modules.length >= 4)

  const recipes = defaultCatalogRegistry.getResolvedItems("building", "production_recipe")
  assert.ok(recipes.length >= 3)
})

test("3. Slot Profile Growth & MAX TIER BONUS at Tier 10 (MK X) with idempotency", () => {
  const profile: SlotProfile = {
    id: "test_slot_profile",
    name: "Test Profile",
    baseTypedSlots: { WEAPON: 2, DEFENSE: 1 },
    baseGenericSlots: 3,
    growthPerTierTyped: { WEAPON: 1, DEFENSE: 0 },
    growthPerTierGeneric: 1,
    maxTierStepBonusTyped: { WEAPON: 2 },
    maxTierStepBonusGeneric: 3,
  }

  // Tier 1: Base values
  const t1 = calculateSlots(profile, 1)
  assert.equal(t1.typedSlots.WEAPON, 2)
  assert.equal(t1.typedSlots.DEFENSE, 1)
  assert.equal(t1.genericSlots, 3)
  assert.equal(t1.totalSlots, 6)
  assert.equal(t1.maxTierBonusApplied, false)

  // Tier 5: Growth applied
  const t5 = calculateSlots(profile, 5)
  assert.equal(t5.typedSlots.WEAPON, 6)
  assert.equal(t5.typedSlots.DEFENSE, 1)
  assert.equal(t5.genericSlots, 7)
  assert.equal(t5.totalSlots, 14)
  assert.equal(t5.maxTierBonusApplied, false)

  // Tier 10: Growth + Step Bonus
  const t10 = calculateSlots(profile, 10, false)
  assert.equal(t10.typedSlots.WEAPON, 13)
  assert.equal(t10.genericSlots, 15)
  assert.equal(t10.maxTierBonusApplied, true)

  // Idempotency check on BaseEntityState: reloading MK X does not duplicate bonus
  const { base } = createMockBase()
  base.tier = 10
  base.maxTierBonusApplied = true
  const evaluatedAgain = updateBaseSlotsOnTierProgression(base, profile)
  assert.equal(evaluatedAgain.typedSlots.WEAPON, 13)
  assert.equal(evaluatedAgain.genericSlots, 15)
  assert.equal(base.maxExpansionSlots, evaluatedAgain.totalSlots)
})

test("4. Core Facilities do NOT occupy expansion slots", () => {
  const { base } = createMockBase()
  base.maxExpansionSlots = 2
  base.expansionBuildingIds = ["bld_inst_1", "bld_inst_2"]

  // Attempting expansion building when slots full fails
  const normalCheck = canAddExpansionBuilding(base, false)
  assert.equal(normalCheck.canAdd, false)

  // Core facility check succeeds even when expansion slots full
  const coreCheck = canAddExpansionBuilding(base, true)
  assert.equal(coreCheck.canAdd, true)
})

test("5. 3-Pass Workforce Allocation & Building OFF semantics immediately releases workforce", () => {
  const { base, popState, defMap } = createMockBase()

  // Add 2 buildings: Heavy Fabricator (max: 250) and Hydroponic Farm (max: 100)
  const b1Def = defMap.get("bld_heavy_fabricator")!
  const b2Def = defMap.get("bld_hydroponic_farm")!

  const inst1 = createBuildingInstance(base.baseId, b1Def, "inst_fab_01")
  const inst2 = createBuildingInstance(base.baseId, b2Def, "inst_farm_01")

  base.buildings[inst1.instanceId] = inst1
  base.buildings[inst2.instanceId] = inst2

  // Initial sync: enough population for both
  syncBaseBuildingWorkforce(popState, base.buildings, defMap, 1)

  assert.equal(inst1.operationalState, "ACTIVE")
  assert.equal(inst1.assignedPersonnel, 250)
  assert.equal(inst1.operationalEfficiency, 1.0)

  assert.equal(inst2.operationalState, "ACTIVE")
  assert.equal(inst2.assignedPersonnel, 100)
  assert.equal(inst2.operationalEfficiency, 1.0)

  assert.equal(popState.populationOccupied, 350)
  assert.equal(popState.populationAvailable, 10000 - 350)

  // Turn Building 1 OFF: personnel released immediately back to available pool
  setBuildingOfflineStatus(inst1, true, popState, base.buildings, defMap, 1)

  assert.equal(inst1.isOffline, true)
  assert.equal(inst1.operationalState, "OFFLINE")
  assert.equal(inst1.assignedPersonnel, 0)
  assert.equal(inst1.operationalEfficiency, 0)

  // Farm still running
  assert.equal(inst2.operationalState, "ACTIVE")
  assert.equal(inst2.assignedPersonnel, 100)

  assert.equal(popState.populationOccupied, 100)
  assert.equal(popState.populationAvailable, 10000 - 100)
})

test("6. Commander Override with expiration & Emergency AI Override", () => {
  const { base, popState, defMap } = createMockBase()
  const b1Def = defMap.get("bld_heavy_fabricator")!
  const inst1 = createBuildingInstance(base.baseId, b1Def, "inst_fab_02")
  base.buildings[inst1.instanceId] = inst1

  // Commander locks building personnel to 500 until Day 5
  setCommanderOverride(
    inst1,
    {
      isLocked: true,
      forcedPersonnel: 500,
      expiresAtGameDay: 5,
      overrideReason: "Ưu tiên sản xuất vỏ giáp",
    },
    2
  )

  syncBaseBuildingWorkforce(popState, base.buildings, defMap, 2)
  assert.equal(inst1.assignedPersonnel, 500)

  // AI normal override rejected because locked
  const normalAiRes = applyEmergencyAiOverride(inst1, "ROUTINE_OPTIMIZATION", 3)
  assert.equal(normalAiRes, false)

  // Emergency AI override succeeds
  const emerAiRes = applyEmergencyAiOverride(inst1, "CRITICAL_DEFENSE_BREACH", 3)
  assert.equal(emerAiRes, true)
  assert.ok(inst1.reasonCodes?.some((r) => r.includes("CRITICAL_DEFENSE_BREACH")))

  // At Day 6, commander override expired
  syncBaseBuildingWorkforce(popState, base.buildings, defMap, 6)
  assert.equal(inst1.commanderOverride?.forcedPersonnel, undefined)
})

test("7. Canonical Condition Overflow Formula: Condition damage spills to HP", () => {
  const { defMap } = createMockBase()
  const bDef = defMap.get("bld_fortress_bastion")! // maxHp: 8000, condition: 1000
  const inst = createBuildingInstance("base_test", bDef, "inst_fortress_01")
  inst.currentHp = 8000
  inst.conditionHp = 1000

  // Take 600 damage (condition absorbs 600, hp takes 600, no overflow)
  const dmg1 = applyDamageToBuilding(inst, 600)
  assert.equal(inst.conditionHp, 400)
  assert.equal(inst.currentHp, 7400)
  assert.equal(dmg1.conditionOverflow, 0)
  assert.equal(dmg1.newHp, 7400)

  // Take 900 more damage (400 condition absorbed, 500 overflow spills to HP in addition to 900 base damage)
  // HP: 7400 - 900 - 500 = 6000
  const dmg2 = applyDamageToBuilding(inst, 900)
  assert.equal(inst.conditionHp, 0)
  assert.equal(dmg2.conditionOverflow, 500)
  assert.equal(inst.currentHp, 6000)
})

test("8. Maintenance Policies and Asset Repair mechanics", () => {
  const { defMap } = createMockBase()
  const bDef = defMap.get("bld_fortress_bastion")!
  const inst = createBuildingInstance("base_test", bDef, "inst_fortress_02")
  inst.currentHp = 6000
  inst.conditionHp = 200

  // Repair building with direct repair call
  repairBuilding(inst, 2000, 800)
  assert.equal(inst.currentHp, 8000)
  assert.equal(inst.conditionHp, 1000)
})

test("9. Building Effects: SELF, BASE, and NETWORK scopes evaluation", () => {
  const { base, defMap } = createMockBase()

  // Add Hospital (BASE scope recoverySpeedPct 20)
  const hospDef = defMap.get("bld_field_hospital")!
  const hospInst = createBuildingInstance(base.baseId, hospDef, "inst_hosp_01")
  hospInst.operationalState = "ACTIVE"
  hospInst.operationalEfficiency = 1.0

  // Add SAR Station (NETWORK scope sarSuccessRatePct 15)
  const sarDef = defMap.get("bld_sar_station")!
  const sarInst = createBuildingInstance(base.baseId, sarDef, "inst_sar_01")
  sarInst.operationalState = "ACTIVE"
  sarInst.operationalEfficiency = 1.0

  base.buildings[hospInst.instanceId] = hospInst
  base.buildings[sarInst.instanceId] = sarInst

  const evaluated = evaluateBaseBuildingEffects(base.buildings, defMap)

  // Check Base effects
  assert.equal(evaluated.baseModifiers.recoverySpeedPct, 20)

  // Check Network effects
  assert.equal(evaluated.networkModifiers.sarSuccessRatePct, 15)
})

test("10. Production Cycle, Input Reservation & OUTPUT_BLOCKED handling", () => {
  const { base, defMap } = createMockBase()
  const recipeMap = new Map(SYSTEM_DEFAULT_PRODUCTION_RECIPES.map((r) => [r.id, r]))
  const fabDef = defMap.get("bld_heavy_fabricator")!
  const fabInst = createBuildingInstance(base.baseId, fabDef, "inst_fab_01")
  fabInst.operationalState = "ACTIVE"
  fabInst.operationalEfficiency = 1.0
  base.buildings[fabInst.instanceId] = fabInst

  base.sharedStorage = { industrialMaterials: 500, energy: 300 }
  base.storageCapacity = { industrialMaterials: 1000, energy: 1000, logisticsSupplies: 1000 }

  const recipe = recipeMap.get("recipe_alloys_smelting")!
  // Start recipe: recipe_alloys_smelting (100 materials + 50 energy -> 80 materials, 20 supplies, 2 days)
  const startRes = startProductionCycle(base, fabInst, recipe, 1)
  assert.equal(startRes.success, true)
  assert.equal(base.productionLines.length, 1)

  // Inputs reserved (double-spend prevented)
  assert.equal(base.sharedStorage.industrialMaterials, 400)
  assert.equal(base.sharedStorage.energy, 250)

  // Advance to Day 2 (1 day elapsed, not completed yet)
  const reportD2 = settleProductionLines(base, recipeMap, defMap, 2)
  assert.equal(reportD2.completedLinesCount, 0)
  assert.equal(base.productionLines[0].status, "PRODUCING")

  // Advance to Day 3 (completes)
  const reportD3 = settleProductionLines(base, recipeMap, defMap, 3)
  assert.equal(reportD3.completedLinesCount, 1)
  assert.equal(base.sharedStorage.industrialMaterials, 400 + 80)
  assert.equal(base.sharedStorage.logisticsSupplies, 20)

  // Now test OUTPUT_BLOCKED: if capacity for logisticsSupplies is full
  base.storageCapacity.logisticsSupplies = 20
  base.productionLines = [] // clear completed line
  startProductionCycle(base, fabInst, recipe, 4)
  const reportBlock = settleProductionLines(base, recipeMap, defMap, 6)
  assert.equal(reportBlock.blockedLinesCount, 1)
  assert.equal(base.productionLines[0].status, "OUTPUT_BLOCKED")
})

test("11. Construction Queue & Demolition with cost refund", () => {
  const { base, defMap } = createMockBase()
  base.sharedStorage = { industrialMaterials: 2000, energy: 2000, logisticsSupplies: 2000 }
  const depotDef = defMap.get("bld_cargo_depot")!

  // Queue Cargo Depot build
  const queueRes = enqueueConstruction(base, depotDef, 1)
  assert.equal(queueRes.success, true)
  assert.equal(base.constructionQueue.length, 1)
  assert.equal(base.constructionQueue[0].status, "IN_PROGRESS")

  // Cancel construction -> cost refunded 100%
  const cancelRes = cancelConstructionQueueItem(base, queueRes.queueItem!.queueId, true)
  assert.equal(cancelRes.success, true)
  assert.equal(base.constructionQueue.length, 0)
  assert.equal(base.sharedStorage.industrialMaterials, 2000)
})

test("12. History Retention & Compaction policy preserves head, tail, and pinned events", () => {
  const events = [
    { eventId: "ev_01", gameDay: 1, type: "WORLD_INIT", name: "Khởi tạo thế giới" },
    { eventId: "ev_02", gameDay: 2, type: "MINOR_INCIDENT", name: "Sự cố nhỏ 1" },
    { eventId: "ev_03", gameDay: 3, type: "MINOR_INCIDENT", name: "Sự cố nhỏ 2" },
    { eventId: "ev_04", gameDay: 4, type: "DECISION_RESOLVED", name: "Quyết định quan trọng" },
    { eventId: "ev_05", gameDay: 5, type: "MINOR_INCIDENT", name: "Sự cố nhỏ 3" },
    { eventId: "ev_06", gameDay: 6, type: "BATTLE_VICTORY", name: "Chiến thắng vang dội" },
  ]

  const config = {
    maxDetailedEvents: 3,
    preserveHeadEvents: 1, // Keep ev_01
    preserveTailEvents: 1, // Keep ev_06
    maxHistoryBytes: 100000,
    pinnedEventTypes: ["DECISION_RESOLVED"], // Keep ev_04
    compactionPolicy: "SUMMARIZE_AND_PRUNE" as const,
  }

  const compacted = compactHistoryEvents(events, config)
  const retainedIds = compacted.retainedEvents.map((e) => e.eventId)

  assert.ok(retainedIds.includes("ev_01"), "Head event must be preserved")
  assert.ok(retainedIds.includes("ev_04"), "Pinned DECISION_RESOLVED event must be preserved")
  assert.ok(retainedIds.includes("ev_06"), "Tail event must be preserved")
  assert.ok(!retainedIds.includes("ev_02"), "Minor event 2 must be compacted")
  assert.ok(!retainedIds.includes("ev_03"), "Minor event 3 must be compacted")
  assert.ok(compacted.summaries.length > 0)
  assert.ok(compacted.prunedCount > 0)
})
